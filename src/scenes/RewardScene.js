class RewardScene {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.onComplete = null;
    this.characters = null;
    this.zoneId = null;
    this.rewards = null;
    this.currentRelics = [];
    this.cardContainers = [];
    this.skipButton = null;
    this.mode = 'reward';
  }

  start(characters, zoneId, currentRelics, mode) {
    this.characters = characters;
    this.zoneId = zoneId;
    this.currentRelics = currentRelics || [];
    this.cardContainers = [];
    this.skipButton = null;
    this.mode = mode || 'reward';
    this._createBackground();
    if (this.mode === 'treasure') {
      this._generateTreasureOptions();
    } else {
      this._generateRewards();
    }
    audio.playMusicFile('menu');
  }

  _createBackground() {
    const bg = new PIXI.Graphics();
    bg.beginFill(0x0a0a14);
    bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    bg.endFill();
    this.container.addChild(bg);

    const title = new PIXI.Text(this.mode === 'treasure' ? 'TESORO' : 'RECOMPENSA', {
      fontFamily: 'monospace', fontSize: 28, fill: 0xffd700,
      stroke: 0x000000, strokeThickness: 4,
      letterSpacing: 6,
    });
    title.anchor = new PIXI.Point(0.5, 0);
    title.x = CONFIG.WIDTH / 2;
    title.y = 30;
    this.container.addChild(title);

    const subtitle = new PIXI.Text('Elige una mejora:', {
      fontFamily: 'monospace', fontSize: 14, fill: 0x888888,
    });
    subtitle.anchor = new PIXI.Point(0.5, 0);
    subtitle.x = CONFIG.WIDTH / 2;
    subtitle.y = 70;
    this.container.addChild(subtitle);
  }

  // ── MODO RECOMPENSA (jefe de zona) ──

  _generateRewards() {
    const zone = ZONES_DATA.find(z => z.id === this.zoneId);
    const pool = zone ? zone.rewards : ZONES_DATA[0].rewards;
    const options = HELPERS.pickN(pool, Math.min(3, pool.length));

    const cardWidth = 280;
    const cardHeight = 240;
    const totalWidth = options.length * cardWidth + (options.length - 1) * 20;
    const startX = (CONFIG.WIDTH - totalWidth) / 2;

    options.forEach((reward, i) => {
      const card = this._createRewardCard(
        reward,
        startX + i * (cardWidth + 20),
        CONFIG.HEIGHT / 2 - cardHeight / 2 + 20,
        cardWidth,
        cardHeight
      );
      this.container.addChild(card);
      this.cardContainers.push(card);
    });

    this.skipButton = this._createButton('SALTAR', CONFIG.WIDTH / 2, CONFIG.HEIGHT - 60);
    this.skipButton.on('pointerdown', () => {
      audio.sfxClick();
      setTimeout(() => {
        if (this.onComplete) this.onComplete();
      }, 0);
    });
    this.container.addChild(this.skipButton);
  }

  _createRewardCard(reward, x, y, w, h) {
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;
    container.eventMode = 'static';
    container.cursor = 'pointer';

    let icon, title, detail, badgeText, badgeColor, borderColor, fillColor, hoverColor;
    const isPermanent = reward.type === 'stat_up';

    switch (reward.type) {
      case 'heal':
        icon = '\u2764\uFE0F';
        title = 'CURACIÓN';
        detail = `+${reward.value} HP a todos`;
        badgeText = 'INSTANTÁNEO';
        badgeColor = 0x44cc88;
        borderColor = 0x44cc88;
        fillColor = 0x0a1a14;
        hoverColor = 0x1a2a24;
        break;
      case 'sp_heal':
        icon = '\u2728';
        title = 'ENERGÍA';
        detail = `+${reward.value} SP a todos`;
        badgeText = 'INSTANTÁNEO';
        badgeColor = 0x4488ff;
        borderColor = 0x4488ff;
        fillColor = 0x0a0a1a;
        hoverColor = 0x1a1a2e;
        break;
      case 'stat_up': {
        const iconMap = { atk: '\u{1F4AA}', def: '\u{1F6E1}\uFE0F', spd: '\u{1F45F}', maxHp: '\u2764\uFE0F' };
        icon = iconMap[reward.stat] || '\u{1F4AA}';
        const statNames = { atk: 'ATAQUE', def: 'DEFENSA', spd: 'VELOCIDAD', maxHp: 'VITALIDAD' };
        title = `${statNames[reward.stat] || reward.stat.toUpperCase()} +${reward.value}`;
        detail = `+${reward.value} ${reward.stat} a todos`;
        badgeText = 'PERMANENTE';
        badgeColor = 0xffd700;
        borderColor = 0xffd700;
        fillColor = 0x14140a;
        hoverColor = 0x24241a;
        break;
      }
      default:
        icon = '\u2753';
        title = 'RECOMPENSA';
        detail = '';
        badgeText = '';
        badgeColor = 0x888888;
        borderColor = 0x888888;
        fillColor = 0x0a0a14;
        hoverColor = 0x1a1a24;
    }

    const bg = new PIXI.Graphics();
    bg.beginFill(fillColor);
    bg.lineStyle(2, borderColor);
    bg.drawRoundedRect(0, 0, w, h, 8);
    bg.endFill();
    container.addChild(bg);

    const aura = new PIXI.Graphics();
    aura.beginFill(borderColor, 0.08);
    aura.drawRoundedRect(2, 2, w - 4, h - 4, 6);
    aura.endFill();
    container.addChild(aura);

    const badgeBg = new PIXI.Graphics();
    badgeBg.beginFill(badgeColor, 0.2);
    badgeBg.lineStyle(1, badgeColor, 0.6);
    badgeBg.drawRoundedRect(w / 2 - 50, 10, 100, 20, 4);
    badgeBg.endFill();
    container.addChild(badgeBg);

    const badgeTextEl = new PIXI.Text(badgeText, {
      fontFamily: 'monospace', fontSize: 9, fill: badgeColor,
      stroke: 0x000000, strokeThickness: 1,
      letterSpacing: 2,
    });
    badgeTextEl.anchor.set(0.5, 0.5);
    badgeTextEl.x = w / 2;
    badgeTextEl.y = 20;
    container.addChild(badgeTextEl);

    const iconEl = new PIXI.Text(icon, {
      fontSize: 44,
      fill: 0xffffff,
      stroke: 0x000000, strokeThickness: 3,
    });
    iconEl.anchor.set(0.5, 0);
    iconEl.x = w / 2;
    iconEl.y = 45;
    container.addChild(iconEl);

    const titleEl = new PIXI.Text(title, {
      fontFamily: 'monospace', fontSize: 16, fill: 0xffffff,
      fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2,
    });
    titleEl.anchor.set(0.5, 0);
    titleEl.x = w / 2;
    titleEl.y = 100;
    container.addChild(titleEl);

    const detailEl = new PIXI.Text(detail, {
      fontFamily: 'monospace', fontSize: 11, fill: isPermanent ? 0xffd700 : 0xaaaaaa,
      stroke: 0x000000, strokeThickness: 1,
      wordWrap: true, wordWrapWidth: w - 30, align: 'center',
    });
    detailEl.anchor.set(0.5, 0);
    detailEl.x = w / 2;
    detailEl.y = 126;
    container.addChild(detailEl);

    const permLabel = new PIXI.Text(isPermanent ? '\u2726 PERMANENTE' : '\u25E6 INSTANTÁNEO', {
      fontFamily: 'monospace', fontSize: 10, fill: badgeColor,
      stroke: 0x000000, strokeThickness: 1,
      letterSpacing: 1,
    });
    permLabel.anchor.set(0.5, 0);
    permLabel.x = w / 2;
    permLabel.y = 152;
    container.addChild(permLabel);

    const btn = new PIXI.Container();
    btn.x = w / 2;
    btn.y = 188;
    const btnBg = new PIXI.Graphics();
    btnBg.beginFill(borderColor, 0.15);
    btnBg.lineStyle(1, borderColor, 0.7);
    btnBg.drawRoundedRect(-70, -14, 140, 28, 5);
    btnBg.endFill();
    btn.addChild(btnBg);
    const btnLbl = new PIXI.Text('ELEGIR', {
      fontFamily: 'monospace', fontSize: 11, fill: borderColor,
      letterSpacing: 2,
    });
    btnLbl.anchor.set(0.5, 0.5);
    btn.addChild(btnLbl);
    container.addChild(btn);

    container.on('pointerover', () => {
      bg.tint = 0xcccccc;
      bg.clear();
      bg.beginFill(hoverColor);
      bg.lineStyle(2, borderColor);
      bg.drawRoundedRect(0, 0, w, h, 8);
      bg.endFill();
    });
    container.on('pointerout', () => {
      bg.tint = 0xffffff;
      bg.clear();
      bg.beginFill(fillColor);
      bg.lineStyle(2, borderColor);
      bg.drawRoundedRect(0, 0, w, h, 8);
      bg.endFill();
    });
    container.on('pointerdown', () => {
      audio.sfxClick();
      this._applyReward(reward);
      this._showApplied(reward);
      this.container.eventMode = 'passive';
      for (const c of this.cardContainers) {
        c.eventMode = 'none';
        c.cursor = 'default';
      }
      if (this.skipButton) {
        this.skipButton.eventMode = 'none';
        this.skipButton.cursor = 'default';
      }
    });

    return container;
  }

  _applyReward(reward) {
    switch (reward.type) {
      case 'heal': {
        for (const c of this.characters) {
          if (c.alive) c.heal(reward.value);
        }
        break;
      }
      case 'sp_heal': {
        for (const c of this.characters) {
          if (c.alive) c.restoreSp(reward.value);
        }
        break;
      }
      case 'stat_up': {
        for (const c of this.characters) {
          if (c.alive) c.addBonusStat(reward.stat, reward.value);
        }
        break;
      }
    }
  }

  // ── MODO TESORO (3 objetos, elegir 1) ──

  _generateTreasureOptions() {
    const all = GAME_DATA.treasures;
    const pool = [];
    for (const t of all) {
      const weight = t.rarity === 'com\u00fan' ? 5 : (t.rarity === 'raro' ? 3 : 1);
      for (let i = 0; i < weight; i++) pool.push(t);
    }
    const options = HELPERS.pickN(pool, 3);

    const cardWidth = 280;
    const cardHeight = 340;
    const totalWidth = options.length * cardWidth + (options.length - 1) * 20;
    const startX = (CONFIG.WIDTH - totalWidth) / 2;

    options.forEach((treasure, i) => {
      const card = this._createTreasureCard(
        treasure,
        startX + i * (cardWidth + 20),
        CONFIG.HEIGHT / 2 - cardHeight / 2 + 10,
        cardWidth,
        cardHeight
      );
      this.container.addChild(card);
      this.cardContainers.push(card);
    });

    this.skipButton = this._createButton('SALTAR', CONFIG.WIDTH / 2, CONFIG.HEIGHT - 50);
    this.skipButton.on('pointerdown', () => {
      audio.sfxClick();
      setTimeout(() => {
        if (this.onComplete) this.onComplete();
      }, 0);
    });
    this.container.addChild(this.skipButton);
  }

  _createTreasureCard(treasure, x, y, w, h) {
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;
    container.eventMode = 'static';
    container.cursor = 'pointer';

    const isCommon = treasure.rarity === 'com\u00fan';
    const isRare = treasure.rarity === 'raro';
    const borderColor = isCommon ? 0x888888 : (isRare ? 0x4488ff : 0xffd700);
    const fillColor = isCommon ? 0x1a1a22 : (isRare ? 0x1a1a2e : 0x1a1a14);
    const rarityLabel = isCommon ? 'COM\u00daN' : (isRare ? 'RARO' : 'LEGENDARIO');
    const rarityColor = isCommon ? 0x888888 : (isRare ? 0x4488ff : 0xffd700);

    const bg = new PIXI.Graphics();
    bg.beginFill(0x0d0d1a);
    bg.lineStyle(2, borderColor);
    bg.drawRoundedRect(0, 0, w, h, 8);
    bg.endFill();
    // Aura sutil (tinte del color del borde)
    const aura = new PIXI.Graphics();
    aura.beginFill(borderColor, 0.08);
    aura.drawRoundedRect(2, 2, w - 4, h - 4, 6);
    aura.endFill();
    container.addChild(aura);
    container.addChild(bg);

    // Icono grande
    const iconText = new PIXI.Text(treasure.icon || '\u2753', {
      fontSize: 42,
      fill: 0xffffff,
      stroke: 0x000000, strokeThickness: 3,
    });
    iconText.anchor = new PIXI.Point(0.5, 0);
    iconText.x = w / 2;
    iconText.y = 20;
    container.addChild(iconText);

    // Nombre
    const nameText = new PIXI.Text(treasure.name, {
      fontFamily: 'monospace', fontSize: 15, fill: 0xffffff,
      fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2,
    });
    nameText.anchor = new PIXI.Point(0.5, 0);
    nameText.x = w / 2;
    nameText.y = 80;
    container.addChild(nameText);

    // Descripción
    const descText = new PIXI.Text(treasure.description || '', {
      fontFamily: 'monospace', fontSize: 11, fill: 0xaaaaaa,
      stroke: 0x000000, strokeThickness: 1,
      wordWrap: true, wordWrapWidth: w - 30, align: 'center',
    });
    descText.anchor = new PIXI.Point(0.5, 0);
    descText.x = w / 2;
    descText.y = 115;
    container.addChild(descText);

    // Rareza
    const rarityTxt = new PIXI.Text(rarityLabel, {
      fontFamily: 'monospace', fontSize: 10, fill: rarityColor,
      stroke: 0x000000, strokeThickness: 1,
      letterSpacing: 3,
    });
    rarityTxt.anchor = new PIXI.Point(0.5, 0);
    rarityTxt.x = w / 2;
    rarityTxt.y = 195;
    container.addChild(rarityTxt);

    // Botón seleccionar
    const btn = new PIXI.Container();
    btn.x = w / 2;
    btn.y = 230;
    const btnBg = new PIXI.Graphics();
    btnBg.beginFill(0x2a1a3e);
    btnBg.lineStyle(1, borderColor);
    btnBg.drawRoundedRect(-80, -14, 160, 28, 5);
    btnBg.endFill();
    btn.addChild(btnBg);
    const btnLbl = new PIXI.Text('SELECCIONAR', {
      fontFamily: 'monospace', fontSize: 11, fill: rarityColor,
    });
    btnLbl.anchor = new PIXI.Point(0.5, 0.5);
    btn.addChild(btnLbl);
    container.addChild(btn);

    container.on('pointerover', () => {
      bg.tint = 0xcccccc;
      bg.clear();
      bg.beginFill(fillColor);
      bg.lineStyle(2, borderColor);
      bg.drawRoundedRect(0, 0, w, h, 8);
      bg.endFill();
    });
    container.on('pointerout', () => {
      bg.tint = 0xffffff;
      bg.clear();
      bg.beginFill(0x0d0d1a);
      bg.lineStyle(2, borderColor);
      bg.drawRoundedRect(0, 0, w, h, 8);
      bg.endFill();
    });
    container.on('pointerdown', () => {
      audio.sfxClick();
      this._applyTreasure(treasure);
      this._showAppliedTreasure(treasure);
      this.container.eventMode = 'passive';
      for (const c of this.cardContainers) {
        c.eventMode = 'none';
        c.cursor = 'default';
      }
      if (this.skipButton) {
        this.skipButton.eventMode = 'none';
        this.skipButton.cursor = 'default';
      }
    });

    return container;
  }

  _applyTreasure(treasure) {
    window.gameState.relics.push(treasure);
    if (treasure.effect && treasure.effect.type === 'stat_up') {
      for (const c of this.characters) {
        if (c.alive) c.addBonusStat(treasure.effect.stat, treasure.effect.value);
      }
      if (treasure.effect.secondary) {
        for (const c of this.characters) {
          if (c.alive) c.addBonusStat(treasure.effect.secondary.stat, treasure.effect.secondary.value);
        }
      }
    }
  }

  _showAppliedTreasure(treasure) {
    const overlay = new PIXI.Container();
    overlay.eventMode = 'static';

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.7);
    bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    bg.endFill();
    overlay.addChild(bg);

    const isRare = treasure.rarity === 'raro';
    const rarityColor = treasure.rarity === 'com\u00fan' ? 0x888888 : (isRare ? 0x4488ff : 0xffd700);

    const msg = new PIXI.Text(`\u2714\uFE0F ${treasure.name}`, {
      fontFamily: 'monospace', fontSize: 22, fill: rarityColor,
      stroke: 0x000000, strokeThickness: 3,
    });
    msg.anchor = new PIXI.Point(0.5, 0.5);
    msg.x = CONFIG.WIDTH / 2;
    msg.y = CONFIG.HEIGHT / 2 - 40;
    overlay.addChild(msg);

    const desc = new PIXI.Text(treasure.description || '', {
      fontFamily: 'monospace', fontSize: 12, fill: 0xcccccc,
      stroke: 0x000000, strokeThickness: 1,
    });
    desc.anchor = new PIXI.Point(0.5, 0);
    desc.x = CONFIG.WIDTH / 2;
    desc.y = CONFIG.HEIGHT / 2;
    overlay.addChild(desc);

    const contBtn = this._createButton('CONTINUAR', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 50);
    contBtn.on('pointerdown', () => {
      audio.sfxClick();
      setTimeout(() => {
        if (this.onComplete) this.onComplete();
      }, 0);
    });
    overlay.addChild(contBtn);

    this.container.addChild(overlay);
    audio.sfxHeal();
  }

  _showApplied(reward) {
    const overlay = new PIXI.Container();
    overlay.eventMode = 'static';

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.7);
    bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    bg.endFill();
    overlay.addChild(bg);

    let msgText = '';
    switch (reward.type) {
      case 'heal':
        msgText = `\u2714\uFE0F +${reward.value} HP para todos`;
        break;
      case 'sp_heal':
        msgText = `\u2714\uFE0F +${reward.value} SP para todos`;
        break;
      case 'stat_up':
        msgText = `\u2714\uFE0F +${reward.value} ${reward.stat} permanente para todos`;
        break;
      default:
        msgText = '\u2714\uFE0F Recompensa aplicada';
    }

    const msg = new PIXI.Text(msgText, {
      fontFamily: 'monospace', fontSize: 20, fill: 0x44cc88,
      stroke: 0x000000, strokeThickness: 3,
    });
    msg.anchor = new PIXI.Point(0.5, 0.5);
    msg.x = CONFIG.WIDTH / 2;
    msg.y = CONFIG.HEIGHT / 2 - 30;
    overlay.addChild(msg);

    const contBtn = this._createButton('CONTINUAR', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 30);
    contBtn.on('pointerdown', () => {
      audio.sfxClick();
      setTimeout(() => {
        if (this.onComplete) this.onComplete();
      }, 0);
    });
    overlay.addChild(contBtn);

    this.container.addChild(overlay);
  }

  _createButton(text, x, y) {
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;

    const bg = new PIXI.Graphics();
    bg.beginFill(0x2a1a3e);
    bg.lineStyle(1, 0x5a3a7e);
    bg.drawRoundedRect(-100, -15, 200, 30, 5);
    bg.endFill();
    container.addChild(bg);

    const label = new PIXI.Text(text, {
      fontFamily: 'monospace', fontSize: 12, fill: 0xcccccc,
    });
    label.anchor = new PIXI.Point(0.5, 0.5);
    container.addChild(label);

    container.eventMode = 'static';
    container.cursor = 'pointer';
    container.on('pointerover', () => bg.tint = 0xcccccc);
    container.on('pointerout', () => bg.tint = 0xffffff);

    return container;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
