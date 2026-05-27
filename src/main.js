const gameState = {
  characters: null,
  currentZone: 0,
  currentFloor: 0,
  relics: [],
  runActive: false,
  enemiesDefeated: 0,
  currentMap: null,
  currentMapZone: 0,
  clearedNodeIds: [],
};

window.gameState = gameState;

const app = new PIXI.Application({
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  backgroundColor: CONFIG.BG_COLOR,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

document.getElementById('game-container').appendChild(app.view);

let currentScene = null;
let currentSceneName = '';
let sceneContainer = new PIXI.Container();
app.stage.addChild(sceneContainer);

function resizeGame() {
  const windowW = window.innerWidth;
  const windowH = window.innerHeight;

  app.renderer.resize(windowW, windowH);

  const scale = Math.min(windowW / CONFIG.WIDTH, windowH / CONFIG.HEIGHT);
  sceneContainer.scale.set(scale);
  sceneContainer.x = (windowW - CONFIG.WIDTH * scale) / 2;
  sceneContainer.y = (windowH - CONFIG.HEIGHT * scale) / 2;
}

window.addEventListener('resize', resizeGame);
resizeGame();

async function switchScene(name) {
  if (currentScene && currentScene.destroy) {
    currentScene.destroy();
  }
  sceneContainer.removeChildren();

  currentSceneName = name;
  audio.ensureResumed();

  switch (name) {
    case 'boot':
      currentScene = new BootScene(app);
      sceneContainer.addChild(currentScene.container);
      const sprites = await currentScene.start();
      window.gameSprites = sprites;
      switchScene('menu');
      break;

    case 'menu':
      currentScene = new MenuScene(app);
      sceneContainer.addChild(currentScene.container);
      currentScene.onStartGame = () => {
        _initNewRun();
        switchScene('map');
      };
      currentScene.start();
      break;

    case 'map': {
      currentScene = new MapScene(app);
      sceneContainer.addChild(currentScene.container);
      if (!gameState.currentMap || gameState.currentMapZone !== gameState.currentZone) {
        gameState.currentMap = generateMap(gameState.currentZone);
        gameState.currentMapZone = gameState.currentZone;
        gameState.clearedNodeIds = [];
      }
      currentScene.start(gameState.characters, gameState.currentZone, gameState.currentMap, gameState.clearedNodeIds);
      currentScene.onNodeSelected = (nodeData) => _handleNode(nodeData);
      break;
    }

    case 'battle': {
      currentScene = new BattleScene(app);
      sceneContainer.addChild(currentScene.container);
      const enemies = _generateEnemies();
      currentScene.start(gameState.characters, enemies);
      currentScene.onVictory = (enemiesDefeated) => {
        gameState.enemiesDefeated += enemiesDefeated.length;
        _handleBattleResult(true, enemiesDefeated);
      };
      currentScene.onDefeat = () => {
        _handleBattleResult(false);
      };
      break;
    }

    case 'rest': {
      currentScene = new RestScene(app);
      sceneContainer.addChild(currentScene.container);
      currentScene.start(gameState.characters, gameState.currentZone);
      currentScene.onComplete = () => switchScene('map');
      break;
    }

    case 'reward': {
      currentScene = new RewardScene(app);
      sceneContainer.addChild(currentScene.container);
      const rewardMode = gameState.currentNodeType === 'TREASURE' ? 'treasure' : 'reward';
      currentScene.start(gameState.characters, gameState.currentZone, gameState.relics, rewardMode);
      currentScene.onComplete = () => switchScene('map');
      break;
    }

    case 'gameover': {
      _showGameOver();
      break;
    }

    case 'victory': {
      _showVictory();
      break;
    }
  }
}

function _initNewRun() {
  const partyCfg = GAME_DATA.party_config;
  const charData = partyCfg.initial_characters.map(id => GAME_DATA.characters[id]);
  gameState.characters = charData.map(d => new BattleCharacter(d, partyCfg.initial_level));
  gameState.currentZone = 1;
  gameState.currentFloor = 0;
  gameState.relics = [];
  gameState.runActive = true;
  gameState.enemiesDefeated = 0;
  gameState.currentMap = null;
  gameState.currentMapZone = 0;
  gameState.clearedNodeIds = [];
}

function _generateEnemies() {
  const zone = ZONES_DATA.find(z => z.id === gameState.currentZone);
  if (!zone) return [];

  const difficultyMult = zone.difficultyMult || 1.0;
  const isBossNode = gameState.currentNodeType === 'BOSS';
  const isEliteNode = gameState.currentNodeType === 'ELITE';

  if (isBossNode) {
    const bossData = ENEMIES_DATA[zone.boss];
    if (bossData) {
      return [new BattleEnemy(bossData, difficultyMult * 1.2)];
    }
  }

  const enemyPool = isEliteNode ? zone.elites : zone.enemies;
  const count = isEliteNode ? 1 : HELPERS.rand(1, 2 + Math.floor(gameState.currentZone / 2));

  return Array.from({ length: count }, () => {
    const id = HELPERS.pick(enemyPool);
    const data = ENEMIES_DATA[id];
    return data ? new BattleEnemy(data, difficultyMult) : null;
  }).filter(Boolean);
}

function _handleNode(nodeData) {
  gameState.currentNodeType = nodeData.type;
  gameState.currentFloor = nodeData.floor;

  switch (nodeData.type) {
    case 'COMBAT':
    case 'ELITE':
    case 'BOSS':
      switchScene('battle');
      break;
    case 'REST':
      switchScene('rest');
      break;
    case 'TREASURE':
      switchScene('reward');
      break;
    case 'EVENT':
      _handleEvent();
      break;
  }
}

function _handleEvent() {
  const zone = ZONES_DATA.find(z => z.id === gameState.currentZone);
  const availableEvents = EVENTS_DATA.filter(e => e.minZone <= gameState.currentZone);
  const evt = HELPERS.pick(availableEvents);

  const eventScene = new PIXI.Container();
  sceneContainer.addChild(eventScene);

  const bg = new PIXI.Graphics();
  bg.beginFill(0x000000, 0.85);
  bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
  bg.endFill();
  eventScene.addChild(bg);

  const title = new PIXI.Text(evt.name, {
    fontFamily: 'monospace', fontSize: 22, fill: 0x44cc88,
    stroke: 0x000000, strokeThickness: 3,
  });
  title.anchor = new PIXI.Point(0.5, 0);
  title.x = CONFIG.WIDTH / 2;
  title.y = 60;
  eventScene.addChild(title);

  const desc = new PIXI.Text(evt.description, {
    fontFamily: 'monospace', fontSize: 14, fill: 0xcccccc,
    wordWrap: true, wordWrapWidth: 600, align: 'center',
  });
  desc.anchor = new PIXI.Point(0.5, 0);
  desc.x = CONFIG.WIDTH / 2;
  desc.y = 110;
  eventScene.addChild(desc);

  const btnStartY = 200;
  evt.options.forEach((opt, i) => {
    const btn = new PIXI.Container();
    btn.x = CONFIG.WIDTH / 2;
    btn.y = btnStartY + i * 50;

    const btnBg = new PIXI.Graphics();
    btnBg.beginFill(0x1a1a2e);
    btnBg.lineStyle(1, 0x3a3a6e);
    btnBg.drawRoundedRect(-220, -18, 440, 36, 5);
    btnBg.endFill();
    btn.addChild(btnBg);

    const label = new PIXI.Text(opt.text, {
      fontFamily: 'monospace', fontSize: 12, fill: 0xcccccc,
    });
    label.anchor = new PIXI.Point(0.5, 0.5);
    btn.addChild(label);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => {
      audio.sfxClick();
      const result = _applyEventEffect(opt.effect);

      const resultText = new PIXI.Text(result, {
        fontFamily: 'monospace', fontSize: 16, fill: 0x44cc88,
        stroke: 0x000000, strokeThickness: 3,
      });
      resultText.anchor = new PIXI.Point(0.5, 0.5);
      resultText.x = CONFIG.WIDTH / 2;
      resultText.y = CONFIG.HEIGHT / 2 - 40;
      bg.addChild(resultText);

      const contBtn = new PIXI.Container();
      contBtn.x = CONFIG.WIDTH / 2;
      contBtn.y = CONFIG.HEIGHT / 2 + 20;

      const cBg = new PIXI.Graphics();
      cBg.beginFill(0x2a1a3e);
      cBg.lineStyle(1, 0x5a3a7e);
      cBg.drawRoundedRect(-80, -15, 160, 30, 5);
      cBg.endFill();
      contBtn.addChild(cBg);

      const cLbl = new PIXI.Text('CONTINUAR', {
        fontFamily: 'monospace', fontSize: 12, fill: 0xcccccc,
      });
      cLbl.anchor = new PIXI.Point(0.5, 0.5);
      contBtn.addChild(cLbl);

      contBtn.eventMode = 'static';
      contBtn.cursor = 'pointer';
      contBtn.on('pointerdown', () => {
        audio.sfxClick();
        setTimeout(() => {
          sceneContainer.removeChild(eventScene);
          switchScene('map');
        }, 0);
      });
      bg.addChild(contBtn);
    });
    eventScene.addChild(btn);
  });
}

function _applyEventEffect(effect) {
  switch (effect.type) {
    case 'heal_all': {
      let total = 0;
      for (const c of gameState.characters) {
        if (c.alive) total += c.heal(effect.value);
      }
      audio.sfxHeal();
      return `Todos recuperaron ${total} HP.`;
    }
    case 'sp_heal_all': {
      let total = 0;
      for (const c of gameState.characters) {
        if (c.alive) total += c.restoreSp(effect.value);
      }
      return `Todos recuperaron ${total} SP.`;
    }
    case 'stat_up_all': {
      for (const c of gameState.characters) {
        if (c.alive) c.addBonusStat(effect.stat, effect.value);
      }
      return `Todos aumentaron ${effect.stat} +${effect.value}.`;
    }
    case 'trade_hp_for_stat': {
      let totalDmg = 0;
      for (const c of gameState.characters) {
        if (c.alive) {
          const dmg = c.takeDamage(effect.hpCost, true);
          totalDmg += dmg.damage;
          c.addBonusStat(effect.stat, effect.value);
        }
      }
      return `El grupo perdió ${totalDmg} HP pero ganó +${effect.value} ${effect.stat}.`;
    }
    case 'relic': {
      const relic = { name: effect.relic || 'Reliquia', stat: effect.stat || 'atk', value: effect.value || 1 };
      gameState.relics.push(relic);
      for (const c of gameState.characters) {
        if (c.alive) c.addBonusStat(relic.stat, relic.value);
      }
      return `Obtuviste: ${relic.name} (+${relic.value} ${relic.stat}).`;
    }
    case 'random_reward': {
      const entry = HELPERS.pick(GAME_DATA.random_rewards.big);
      const value = HELPERS.rand(entry.min || 0, entry.max || 0);
      switch (entry.type) {
        case 'heal_all':
          for (const c of gameState.characters) if (c.alive) c.heal(value);
          audio.sfxHeal();
          return entry.msg.replace('{value}', value);
        case 'stat_up_all':
          for (const c of gameState.characters) if (c.alive) c.addBonusStat(entry.stat, value);
          return entry.msg.replace('{value}', value);
        case 'sp_heal_all':
          for (const c of gameState.characters) if (c.alive) c.restoreSp(value);
          return entry.msg.replace('{value}', value);
      }
      return 'Nada sucedió.';
    }
    case 'random_reward_small': {
      const entry = HELPERS.pick(GAME_DATA.random_rewards.small);
      if (entry.type === 'nothing') return entry.msg;
      const value = HELPERS.rand(entry.min || 0, entry.max || 0);
      if (entry.type === 'heal_all') {
        for (const c of gameState.characters) if (c.alive) c.heal(value);
        return entry.msg.replace('{value}', value);
      }
      if (entry.type === 'sp_heal_all') {
        for (const c of gameState.characters) if (c.alive) c.restoreSp(value);
        return entry.msg.replace('{value}', value);
      }
      return 'Nada sucedió.';
    }
    default:
      return 'No pasó nada.';
  }
}

function _handleBattleResult(victory, enemies) {
  if (!victory) {
    switchScene('gameover');
    return;
  }

  gameState.characters.forEach(c => c.skills.forEach(s => s.resetCooldown()));
  const levelUps = _awardCombatXp(enemies || []);
  const isBoss = gameState.currentNodeType === 'BOSS';

  const onContinue = () => {
    if (isBoss) {
      if (gameState.currentZone < 3) {
        gameState.currentZone++;
        switchScene('reward');
      } else {
        switchScene('victory');
      }
    } else {
      _showPostBattleScreen();
    }
  };

  if (levelUps.length > 0) {
    _showLevelUpOverlay(levelUps, onContinue);
  } else {
    onContinue();
  }
}

function _awardCombatXp(enemies) {
  const xpCfg = GAME_DATA.xp_config;
  let totalXp = 0;
  for (const e of enemies) {
    const baseXp = xpCfg.xp_per_kill[e.tier] || xpCfg.xp_per_kill.normal;
    totalXp += e.isBoss ? Math.floor(baseXp * xpCfg.boss_mult) : baseXp;
  }

  const levelUps = [];
  for (const c of gameState.characters) {
    if (!c.alive) continue;
    const oldLevel = c.level;
    const oldStats = c.baseStats ? { ...c.baseStats } : null;
    c.gainXp(totalXp);
    if (c.level > oldLevel) {
      levelUps.push({
        name: c.name,
        spriteName: c.spriteName,
        oldLevel,
        newLevel: c.level,
        oldStats,
        newStats: { ...c.baseStats },
      });
    }
  }

  gameState.lastXpGained = totalXp;
  return levelUps;
}

function _showLevelUpOverlay(levelUps, onContinue) {
  const overlay = new PIXI.Container();
  overlay.eventMode = 'static';

  const bg = new PIXI.Graphics();
  bg.beginFill(0x000000, 0.85);
  bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
  bg.endFill();
  overlay.addChild(bg);

  const title = new PIXI.Text('\u2B06 \u00a1SUBISTE DE NIVEL! \u2B06', {
    fontFamily: 'monospace', fontSize: 28, fill: 0xffd700,
    stroke: 0x000000, strokeThickness: 5,
    letterSpacing: 4,
  });
  title.anchor = new PIXI.Point(0.5, 0);
  title.x = CONFIG.WIDTH / 2;
  title.y = 30;

  const xpText = new PIXI.Text(`XP ganado: ${gameState.lastXpGained || 0}`, {
    fontFamily: 'monospace', fontSize: 14, fill: 0x88cc88,
    stroke: 0x000000, strokeThickness: 2,
  });
  xpText.anchor = new PIXI.Point(0.5, 0);
  xpText.x = CONFIG.WIDTH / 2;
  xpText.y = 70;
  overlay.addChild(title);
  overlay.addChild(xpText);

  const cardWidth = Math.min(340, Math.floor((CONFIG.WIDTH - 60) / levelUps.length) - 10);
  const cardHeight = 360;
  const totalWidth = levelUps.length * cardWidth + (levelUps.length - 1) * 15;
  const startX = (CONFIG.WIDTH - totalWidth) / 2;
  const startY = 110;

  const statLabels = [
    { key: 'maxHp', label: 'HP' },
    { key: 'maxSp', label: 'SP' },
    { key: 'atk', label: 'ATK' },
    { key: 'def', label: 'DEF' },
    { key: 'spd', label: 'SPD' },
  ];

  levelUps.forEach((lu, i) => {
    const cx = startX + i * (cardWidth + 15);
    const card = new PIXI.Graphics();
    card.beginFill(0x1a1a2e);
    card.lineStyle(2, 0xffd700);
    card.drawRoundedRect(cx, startY, cardWidth, cardHeight, 8);
    card.endFill();
    overlay.addChild(card);

    const nameText = new PIXI.Text(lu.name, {
      fontFamily: 'monospace', fontSize: 18, fill: 0xffffff,
      fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2,
    });
    nameText.anchor = new PIXI.Point(0.5, 0);
    nameText.x = cx + cardWidth / 2;
    nameText.y = startY + 15;
    overlay.addChild(nameText);

    const lvText = new PIXI.Text(`Nv.${lu.oldLevel} \u2192 Nv.${lu.newLevel}`, {
      fontFamily: 'monospace', fontSize: 14, fill: 0x44cc88,
      stroke: 0x000000, strokeThickness: 2,
    });
    lvText.anchor = new PIXI.Point(0.5, 0);
    lvText.x = cx + cardWidth / 2;
    lvText.y = startY + 42;
    overlay.addChild(lvText);

    statLabels.forEach((sl, si) => {
      const oldVal = lu.oldStats ? lu.oldStats[sl.key] : 0;
      const newVal = lu.newStats ? lu.newStats[sl.key] : 0;
      const diff = newVal - oldVal;
      const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
      const color = diff > 0 ? 0x88cc88 : 0xcccccc;

      const st = new PIXI.Text(`${sl.label}: ${oldVal} \u2192 ${newVal} (${diffStr})`, {
        fontFamily: 'monospace', fontSize: 11, fill: color,
        stroke: 0x000000, strokeThickness: 1,
      });
      st.x = cx + 15;
      st.y = startY + 75 + si * 26;
      overlay.addChild(st);
    });

    const texKey = lu.spriteName ? lu.spriteName.replace('.png', '') : null;
    const spriteTex = texKey ? window.gameSprites[texKey] : null;
    if (spriteTex) {
      const charSprite = new PIXI.Sprite(spriteTex);
      const maxH = 110;
      const scale = maxH / charSprite.height;
      charSprite.scale.set(scale);
      charSprite.anchor.set(0.5, 0);
      charSprite.x = cx + cardWidth / 2;
      charSprite.y = startY + 200;
      overlay.addChild(charSprite);
    }
  });

  audio.sfxLevelUp();

  const contBtn = new PIXI.Container();
  contBtn.x = CONFIG.WIDTH / 2;
  contBtn.y = CONFIG.HEIGHT - 60;

  const cBg = new PIXI.Graphics();
  cBg.beginFill(0x2a1a3e);
  cBg.lineStyle(1, 0x5a3a7e);
  cBg.drawRoundedRect(-100, -15, 200, 30, 5);
  cBg.endFill();
  contBtn.addChild(cBg);

  const cLbl = new PIXI.Text('CONTINUAR', {
    fontFamily: 'monospace', fontSize: 14, fill: 0xcccccc,
  });
  cLbl.anchor = new PIXI.Point(0.5, 0.5);
  contBtn.addChild(cLbl);

  contBtn.eventMode = 'static';
  contBtn.cursor = 'pointer';
  contBtn.on('pointerdown', () => {
    audio.sfxClick();
    setTimeout(() => {
      sceneContainer.removeChild(overlay);
      if (onContinue) onContinue();
    }, 0);
  });
  overlay.addChild(contBtn);

  sceneContainer.addChild(overlay);
}

function _showPostBattleScreen() {
  const overlay = new PIXI.Container();
  overlay.eventMode = 'static';

  const bg = new PIXI.Graphics();
  bg.beginFill(0x000000, 0.7);
  bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
  bg.endFill();
  overlay.addChild(bg);

  const title = new PIXI.Text('\u2714\uFE0F COMBATE VICTORIOSO', {
    fontFamily: 'monospace', fontSize: 22, fill: 0x44cc88,
    stroke: 0x000000, strokeThickness: 4,
  });
  title.anchor = new PIXI.Point(0.5, 0);
  title.x = CONFIG.WIDTH / 2;
  title.y = CONFIG.HEIGHT / 2 - 80;
  overlay.addChild(title);

  const contBtn = new PIXI.Container();
  contBtn.x = CONFIG.WIDTH / 2;
  contBtn.y = CONFIG.HEIGHT / 2 + 20;

  const cBg = new PIXI.Graphics();
  cBg.beginFill(0x2a1a3e);
  cBg.lineStyle(1, 0x5a3a7e);
  cBg.drawRoundedRect(-100, -15, 200, 30, 5);
  cBg.endFill();
  contBtn.addChild(cBg);

  const cLbl = new PIXI.Text('CONTINUAR', {
    fontFamily: 'monospace', fontSize: 14, fill: 0xcccccc,
  });
  cLbl.anchor = new PIXI.Point(0.5, 0.5);
  contBtn.addChild(cLbl);

  contBtn.eventMode = 'static';
  contBtn.cursor = 'pointer';
    contBtn.on('pointerdown', () => {
      audio.sfxClick();
      setTimeout(() => {
        sceneContainer.removeChild(overlay);
        switchScene('map');
      }, 0);
    });
  overlay.addChild(contBtn);

  sceneContainer.addChild(overlay);
}

function _showGameOver() {
  const overlay = new PIXI.Container();
  overlay.eventMode = 'static';

  const bg = new PIXI.Graphics();
  bg.beginFill(0x000000, 0.85);
  bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
  bg.endFill();
  overlay.addChild(bg);

  const title = new PIXI.Text('GAME OVER', {
    fontFamily: 'monospace', fontSize: 48, fill: 0xcc2222,
    stroke: 0x000000, strokeThickness: 6,
    letterSpacing: 8,
  });
  title.anchor = new PIXI.Point(0.5, 0.5);
  title.x = CONFIG.WIDTH / 2;
  title.y = CONFIG.HEIGHT / 2 - 60;
  overlay.addChild(title);

  const stats = new PIXI.Text(
    `Zona: ${gameState.currentZone} | Enemigos: ${gameState.enemiesDefeated}`,
    {
      fontFamily: 'monospace', fontSize: 14, fill: 0x888888,
    }
  );
  stats.anchor = new PIXI.Point(0.5, 0);
  stats.x = CONFIG.WIDTH / 2;
  stats.y = CONFIG.HEIGHT / 2 + 10;
  overlay.addChild(stats);

  const retryBtn = new PIXI.Container();
  retryBtn.x = CONFIG.WIDTH / 2;
  retryBtn.y = CONFIG.HEIGHT / 2 + 60;

  const rBg = new PIXI.Graphics();
  rBg.beginFill(0x2a1a3e);
  rBg.lineStyle(1, 0x5a3a7e);
  rBg.drawRoundedRect(-100, -15, 200, 30, 5);
  rBg.endFill();
  retryBtn.addChild(rBg);

  const rLbl = new PIXI.Text('VOLVER AL MENÚ', {
    fontFamily: 'monospace', fontSize: 12, fill: 0xcccccc,
  });
  rLbl.anchor = new PIXI.Point(0.5, 0.5);
  retryBtn.addChild(rLbl);

  retryBtn.eventMode = 'static';
  retryBtn.cursor = 'pointer';
    retryBtn.on('pointerdown', () => {
      audio.sfxClick();
      setTimeout(() => {
        sceneContainer.removeChild(overlay);
        switchScene('menu');
      }, 0);
    });
  overlay.addChild(retryBtn);

  sceneContainer.addChild(overlay);
}

function _showVictory() {
  const overlay = new PIXI.Container();
  overlay.eventMode = 'static';

  const bg = new PIXI.Graphics();
  bg.beginFill(0x000000, 0.85);
  bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
  bg.endFill();
  overlay.addChild(bg);

  const title = new PIXI.Text('\u{1F3C6} VICTORIA TOTAL', {
    fontFamily: 'monospace', fontSize: 40, fill: 0xffd700,
    stroke: 0x000000, strokeThickness: 6,
    letterSpacing: 6,
  });
  title.anchor = new PIXI.Point(0.5, 0.5);
  title.x = CONFIG.WIDTH / 2;
  title.y = CONFIG.HEIGHT / 2 - 60;
  overlay.addChild(title);

  const msg = new PIXI.Text(
    '¡Has conquistado todas las zonas de La Ciudad!\n\n' +
    `Enemigos derrotados: ${gameState.enemiesDefeated}\n` +
    'Gracias por jugar "The City\'s Echo"',
    {
      fontFamily: 'monospace', fontSize: 14, fill: 0xcccccc,
      align: 'center', lineHeight: 22,
    }
  );
  msg.anchor = new PIXI.Point(0.5, 0);
  msg.x = CONFIG.WIDTH / 2;
  msg.y = CONFIG.HEIGHT / 2 + 10;
  overlay.addChild(msg);

  const menuBtn = new PIXI.Container();
  menuBtn.x = CONFIG.WIDTH / 2;
  menuBtn.y = CONFIG.HEIGHT / 2 + 130;

  const mBg = new PIXI.Graphics();
  mBg.beginFill(0x2a1a3e);
  mBg.lineStyle(1, 0x5a3a7e);
  mBg.drawRoundedRect(-100, -15, 200, 30, 5);
  mBg.endFill();
  menuBtn.addChild(mBg);

  const mLbl = new PIXI.Text('MENÚ PRINCIPAL', {
    fontFamily: 'monospace', fontSize: 12, fill: 0xcccccc,
  });
  mLbl.anchor = new PIXI.Point(0.5, 0.5);
  menuBtn.addChild(mLbl);

  menuBtn.eventMode = 'static';
  menuBtn.cursor = 'pointer';
    menuBtn.on('pointerdown', () => {
      audio.sfxClick();
      setTimeout(() => {
        sceneContainer.removeChild(overlay);
        switchScene('menu');
      }, 0);
    });
  overlay.addChild(menuBtn);

  sceneContainer.addChild(overlay);
  audio.sfxVictory();
}

app.ticker.add((delta) => {
  const dt = delta.deltaTime / 60;
  if (currentScene && currentScene.update) {
    currentScene.update(dt);
  }
});

audio.init();
switchScene('boot');
