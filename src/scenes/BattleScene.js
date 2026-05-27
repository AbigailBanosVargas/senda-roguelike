class BattleScene {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.onVictory = null;
    this.onDefeat = null;

    this.characters = [];
    this.enemies = [];
    this.turnManager = new TurnManager();
    this.combatManager = new CombatManager();

    this.characterSprites = [];
    this.enemySprites = [];
    this.healthBars = [];
    this.spBars = [];
    this.egoBars = [];
    this.enemyHealthBars = [];

    this.skillPanel = null;
    this.turnText = null;
    this.logText = [];
    this.logContainer = null;

    this.turnOrderContainer = null;
    this.turnOrderSlots = [];

    this.state = 'init';
    this.selectedSkill = null;
    this.animating = false;
  }

  start(characters, enemies) {
    this.characters = characters;
    this.enemies = enemies;
    this.animating = false;
    this.state = 'init';
    this.selectedSkill = null;

    this._createBackground();
    this._createBattlefield();
    this._createUI();
    this.combatManager.applyStartRelics(this.characters);
    this._setupTurnOrder();

    audio.playMusicFile(enemies.some(e => e.isBoss) ? 'boss' : 'combat');
  }

  _createBackground() {
    const bgs = window.battleBgTextures || [];
    if (bgs.length > 0) {
      const tex = HELPERS.pick(bgs);
      const bg = new PIXI.Sprite(tex);
      const scale = Math.max(CONFIG.WIDTH / tex.width, CONFIG.HEIGHT / tex.height);
      bg.scale.set(scale);
      bg.x = (CONFIG.WIDTH - tex.width * scale) / 2;
      bg.y = (CONFIG.HEIGHT - tex.height * scale) / 2;
      this.container.addChild(bg);
    } else {
      const bg = new PIXI.Graphics();
      bg.beginFill(0x0a0a14);
      const gradSteps = 20;
      for (let i = 0; i < gradSteps; i++) {
        const t = i / gradSteps;
        const r = Math.floor(HELPERS.lerp(10, 20, t));
        const g = Math.floor(HELPERS.lerp(10, 15, t));
        const b = Math.floor(HELPERS.lerp(20, 40, t));
        const color = (r << 16) | (g << 8) | b;
        bg.beginFill(color);
        bg.drawRect(0, (CONFIG.HEIGHT / gradSteps) * i, CONFIG.WIDTH, CONFIG.HEIGHT / gradSteps + 1);
        bg.endFill();
      }
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * CONFIG.WIDTH;
        const y = Math.random() * CONFIG.HEIGHT * 0.8;
        bg.beginFill(0xffffff, Math.random() * 0.03 + 0.01);
        bg.drawCircle(x, y, Math.random() * 2 + 0.5);
        bg.endFill();
      }
      this.container.addChild(bg);
    }

    const ground = new PIXI.Graphics();
    ground.beginFill(0x0a0a0a, 0.6);
    ground.drawRect(0, CONFIG.HEIGHT - 60, CONFIG.WIDTH, 60);
    ground.endFill();
    this.container.addChild(ground);

    const sep = new PIXI.Graphics();
    sep.lineStyle(1, 0x2a2a5e, 0.2);
    sep.moveTo(CONFIG.WIDTH / 2, 0);
    sep.lineTo(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 60);
    this.container.addChild(sep);
  }

  _createBattlefield() {
    const sprites = window.gameSprites || {};

    this._createPartySprites(sprites);
    this._createEnemySprites(sprites);
  }

  _createPartySprites(sprites) {
    const count = this.characters.filter(c => c.alive).length;
    if (count === 0) return;
    const startX = 200;
    const marginTop = 50;
    const spriteEstimate = 180;
    const safeHeight = (CONFIG.HEIGHT - 160) - marginTop;
    const spacingY = Math.min(150, (safeHeight - spriteEstimate) / Math.max(1, count - 1));
    const startY = marginTop + spriteEstimate;

    this.characters.forEach((char, i) => {
      if (!char.alive) return;
      const x = char.id === 'jia_huan' ? startX + Math.floor(CONFIG.WIDTH / 8) : startX;
      const y = startY + i * spacingY;
      const uiX = char.id === 'jia_huan' ? 78 : 35;

      const container = new PIXI.Container();
      container.x = x;
      container.y = y;

      const tex = sprites[char.spriteName.replace('.png', '')];
      if (tex) {
        const sprite = new PIXI.Sprite(tex);
        const baseScale = Math.min(120 / sprite.width, 150 / sprite.height);
        sprite.scale.set(baseScale * 1.5);
        if (char.id === 'jia_huan') sprite.scale.x *= -1;
        sprite.anchor.set(0.5, 1);
        sprite.y = 0;
        container.addChild(sprite);
        char._spriteObj = sprite;
      } else {
        const placeholder = new PIXI.Graphics();
        placeholder.beginFill(char.color, 0.3);
        placeholder.lineStyle(2, char.color);
        placeholder.drawRoundedRect(-30, -80, 60, 80, 5);
        placeholder.endFill();

        const nameInit = new PIXI.Text(char.name[0], {
          fontFamily: 'monospace', fontSize: 24, fill: 0xffffff,
        });
        nameInit.anchor = new PIXI.Point(0.5, 0.5);
        nameInit.y = -40;
        placeholder.addChild(nameInit);
        container.addChild(placeholder);
        char._spriteObj = placeholder;
      }

      const nameText = new PIXI.Text(char.name, {
        fontFamily: 'monospace', fontSize: 14, fill: 0xcccccc,
        stroke: 0x000000, strokeThickness: 2,
      });
      nameText.anchor = new PIXI.Point(0, 0.5);
      nameText.x = uiX;
      nameText.y = -100;
      container.addChild(nameText);
      char._nameText = nameText;
      const iconsContainer = new PIXI.Container();
      iconsContainer.y = -100;
      container.addChild(iconsContainer);
      char.effectsIconContainer = iconsContainer;

      const hpBarContainer = new PIXI.Container();
      hpBarContainer.x = uiX;
      hpBarContainer.y = -86;
      const hpBar = new HealthBar(125, 13, CONFIG.COLORS.HP, CONFIG.COLORS.HP_BG);
      hpBar.setValue(char.stats.hp, char.baseStats.maxHp);
      hpBarContainer.addChild(hpBar.containerObject);
      container.addChild(hpBarContainer);
      this.healthBars.push(hpBar);

      const spBar = new HealthBar(125, 8, CONFIG.COLORS.SP, CONFIG.COLORS.SP_BG);
      spBar.setValue(char.stats.sp, char.baseStats.maxSp);
      spBar.containerObject.x = uiX;
      spBar.containerObject.y = -70;
      container.addChild(spBar.containerObject);
      this.spBars.push(spBar);

      const egoBar = new HealthBar(125, 6, 0xaa44dd, 0x221133);
      egoBar.setValue(char.egoCharge, 100);
      egoBar.containerObject.x = uiX;
      egoBar.containerObject.y = -60;
      container.addChild(egoBar.containerObject);
      this.egoBars.push(egoBar);

      const hpNum = new PIXI.Text(`${char.stats.hp}/${char.baseStats.maxHp}`, {
        fontFamily: 'monospace', fontSize: 10, fill: 0xffffff,
      });
      hpNum.x = uiX + 130;
      hpNum.y = -86;
      container.addChild(hpNum);

      this.characterSprites.push(container);
      this.container.addChild(container);

      char.displayObject = container;
      char.healthBar = hpBar;
    });
  }

  _createEnemySprites(sprites) {
    const count = this.enemies.filter(e => e.alive).length;
    if (count === 0) return;
    const startX = CONFIG.WIDTH - 300;
    const marginTop = 50;
    const spriteEstimate = 150;
    const safeHeight = (CONFIG.HEIGHT - 160) - marginTop;
    const spacingY = Math.min(150, (safeHeight - spriteEstimate) / Math.max(1, count - 1));
    const startY = marginTop + spriteEstimate;

    this.enemies.forEach((enemy, i) => {
      if (!enemy.alive) return;
      const x = startX;
      const y = enemy.isBoss && count <= 1
        ? Math.floor(marginTop + safeHeight * 0.55)
        : startY + i * spacingY;

      const container = new PIXI.Container();
      container.x = x;
      container.y = y;

      const tex = sprites[enemy.spriteName.replace('.png', '')];
      if (tex) {
        const sprite = new PIXI.Sprite(tex);
        const maxH = count > 2 ? 100 : 130;
        const baseScale = Math.min(100 / sprite.width, maxH / sprite.height);
        sprite.scale.set(baseScale * 1.5);
        if (enemy.id.startsWith('hooligan')) sprite.scale.x *= -1;
        sprite.anchor.set(0.5, 1);
        sprite.y = 0;
        container.addChild(sprite);
        enemy._spriteObj = sprite;
      } else {
        const placeholder = new PIXI.Graphics();
        placeholder.beginFill(enemy.color, 0.3);
        placeholder.lineStyle(2, enemy.color);
        placeholder.drawRoundedRect(-35, -70, 70, 70, 5);
        placeholder.endFill();

        const nameInit = new PIXI.Text(enemy.name[0], {
          fontFamily: 'monospace', fontSize: 28, fill: 0xffffff,
        });
        nameInit.anchor = new PIXI.Point(0.5, 0.5);
        nameInit.y = -35;
        placeholder.addChild(nameInit);
        container.addChild(placeholder);
        enemy._spriteObj = placeholder;
      }

      const nameText = new PIXI.Text(
        enemy.isBoss ? `\u{1F451} ${enemy.name}` : enemy.name,
        {
          fontFamily: 'monospace', fontSize: enemy.isBoss ? 13 : 11,
          fill: enemy.isBoss ? 0xffd700 : 0xcccccc,
          stroke: 0x000000, strokeThickness: 2,
        }
      );
      nameText.anchor = new PIXI.Point(0.5, 0.5);
      nameText.x = 0;
      nameText.y = -100;
      container.addChild(nameText);
      enemy._nameText = nameText;
      const iconsContainer = new PIXI.Container();
      iconsContainer.y = -100;
      container.addChild(iconsContainer);
      enemy.effectsIconContainer = iconsContainer;

      const turnArrow = new PIXI.Text('\u25BC', {
        fontFamily: 'monospace', fontSize: 24, fill: 0xffdd44,
        stroke: 0x000000, strokeThickness: 4,
      });
      turnArrow.anchor.set(0.5, 1);
      turnArrow.x = 0;
      turnArrow.y = -105;
      turnArrow.visible = false;
      container.addChild(turnArrow);
      enemy._turnArrow = turnArrow;

      const hpBarContainer = new PIXI.Container();
      hpBarContainer.x = -50;
      hpBarContainer.y = -88;
      const hpBar = new HealthBar(100, 8, CONFIG.COLORS.ENEMY, 0x331111);
      hpBar.setValue(enemy.stats.hp, enemy.baseStats.maxHp);
      hpBarContainer.addChild(hpBar.containerObject);
      container.addChild(hpBarContainer);
      this.enemyHealthBars.push(hpBar);

      this.enemySprites.push(container);
      this.container.addChild(container);

      enemy.displayObject = container;
      enemy.healthBar = hpBar;
    });
  }

  _createUI() {
    const uiContainer = new PIXI.Container();

    const bottomPanel = new PIXI.Graphics();
    bottomPanel.beginFill(0x0a0a1a, 0.95);
    bottomPanel.lineStyle(1, 0x2a2a4e);
    bottomPanel.drawRect(0, CONFIG.HEIGHT - 160, CONFIG.WIDTH, 160);
    bottomPanel.endFill();
    uiContainer.addChild(bottomPanel);

    this.turnText = new PIXI.Text('', {
      fontFamily: 'monospace', fontSize: 14, fill: 0xffffff,
      stroke: 0x000000, strokeThickness: 3,
    });
    this.turnText.x = 15;
    this.turnText.y = CONFIG.HEIGHT - 150;
    uiContainer.addChild(this.turnText);

    this.sinText = new PIXI.Text('', {
      fontFamily: 'monospace', fontSize: 10, fill: 0x888888,
    });
    this.sinText.x = 15;
    this.sinText.y = CONFIG.HEIGHT - 130;
    uiContainer.addChild(this.sinText);

    this.skillPanel = new SkillPanel(0, CONFIG.HEIGHT - 120, CONFIG.WIDTH, 110);
    this.skillPanel.onSkillSelected = (skill) => this._onSkillSelected(skill);
    uiContainer.addChild(this.skillPanel.container);

    this.logContainer = new PIXI.Container();
    this.logContainer.x = CONFIG.WIDTH / 2;
    this.logContainer.y = 10;
    uiContainer.addChild(this.logContainer);

    this._createTurnOrderDisplay(uiContainer);
    this._createHelpButton(uiContainer);

    this.container.addChild(uiContainer);

    this._createHelpOverlay();

    this.logEntries = [];
    this.logTexts = [];
    for (let i = 0; i < 8; i++) {
      const c = new PIXI.Container();
      c.y = i * 28;
      this.logContainer.addChild(c);
      this.logTexts.push(c);
    }
  }

  _createTurnOrderDisplay(uiContainer) {
    const slotSize = 70;
    const gap = 6;
    const totalW = slotSize * 5 + gap * 4;
    const padding = 9;
    const panelX = CONFIG.WIDTH - totalW - padding * 2 - 10;
    const panelY = CONFIG.HEIGHT - 205;

    this.turnOrderContainer = new PIXI.Container();
    this.turnOrderContainer.x = panelX;
    this.turnOrderContainer.y = panelY;

    const bg = new PIXI.Graphics();
    bg.beginFill(0x0a0a2a, 0.85);
    bg.lineStyle(1, 0x3a3a6e);
    bg.drawRoundedRect(0, 0, totalW + padding * 2, slotSize + padding + 16, 6);
    bg.endFill();
    this.turnOrderContainer.addChild(bg);

    const label = new PIXI.Text('TURNOS', {
      fontFamily: 'monospace', fontSize: 13, fill: 0x666688,
    });
    label.x = padding;
    label.y = 4;
    this.turnOrderContainer.addChild(label);

    this.turnArrow = new PIXI.Text('\u25BC', {
      fontFamily: 'monospace', fontSize: 20, fill: 0xffdd44,
      stroke: 0x000000, strokeThickness: 3,
    });
    this.turnArrow.anchor.set(0.5, 0);
    this.turnArrow.y = -14;
    this.turnArrow.visible = false;
    this.turnOrderContainer.addChild(this.turnArrow);

    this.turnOrderSlots = [];
    for (let i = 0; i < 5; i++) {
      const slot = new PIXI.Container();
      slot.x = padding + i * (slotSize + gap);
      slot.y = 22;
      this.turnOrderContainer.addChild(slot);
      this.turnOrderSlots.push(slot);
    }

    uiContainer.addChild(this.turnOrderContainer);
  }

  _createHelpButton(uiContainer) {
    const bg = new PIXI.Graphics();
    bg.beginFill(0x1a1a2e, 0.9);
    bg.lineStyle(2, 0x4488cc);
    bg.drawCircle(CONFIG.WIDTH - 35, 24, 16);
    bg.endFill();
    uiContainer.addChild(bg);

    const btn = new PIXI.Text('?', {
      fontFamily: 'monospace',
      fontSize: 24,
      fill: 0x4488cc,
      fontWeight: 'bold',
    });
    btn.anchor.set(0.5);
    btn.x = CONFIG.WIDTH - 35;
    btn.y = 24;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => this._toggleHelp());
    uiContainer.addChild(btn);
  }

  _createHelpOverlay() {
    this.helpOverlay = new PIXI.Container();
    this.helpOverlay.visible = false;
    this.helpOverlay.eventMode = 'static';

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.88);
    bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    bg.endFill();
    this.helpOverlay.addChild(bg);

    const overlayContent = new PIXI.Container();
    overlayContent.x = CONFIG.WIDTH / 2;
    overlayContent.y = 35;

    const title = new PIXI.Text('AYUDA \u2014 SISTEMA DE PECADOS', {
      fontFamily: 'monospace',
      fontSize: 24,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    title.anchor.set(0.5, 0);
    overlayContent.addChild(title);

    const sinDefs = [
      { sin: 'WRATH',    color: CONFIG.COLORS.SIN_WRATH,    desc: 'Ataques directos y agresivos de alto impacto' },
      { sin: 'PRIDE',    color: CONFIG.COLORS.SIN_PRIDE,    desc: 'Ataques de precisi\u00f3n y vers\u00e1tiles' },
      { sin: 'GLOOM',    color: CONFIG.COLORS.SIN_GLOOM,    desc: 'Ataques ps\u00edquicos y debilitantes' },
      { sin: 'LUST',     color: CONFIG.COLORS.SIN_LUST,     desc: 'Ataques pasionales y repetitivos' },
      { sin: 'SLOTH',    color: CONFIG.COLORS.SIN_SLOTH,    desc: 'Habilidades defensivas y de apoyo' },
      { sin: 'GLUTTONY', color: CONFIG.COLORS.SIN_GLUTTONY, desc: 'Absorci\u00f3n y recuperaci\u00f3n' },
      { sin: 'ENVY',     color: CONFIG.COLORS.SIN_ENVY,     desc: 'Ataques de eco y resonancia' },
    ];

    const sectionStyle = {
      fontFamily: 'monospace',
      fontSize: 14,
      fill: 0xaaaacc,
      fontWeight: 'bold',
    };

    const bodyStyle = {
      fontFamily: 'monospace',
      fontSize: 13,
      fill: 0xcccccc,
    };

    const subStyle = {
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0x888888,
    };

    const sinHeader = new PIXI.Text('TIPOS DE PECADO', sectionStyle);
    sinHeader.anchor.set(0.5, 0);
    sinHeader.y = 45;
    overlayContent.addChild(sinHeader);

    for (let i = 0; i < sinDefs.length; i++) {
      const d = sinDefs[i];
      const y = 80 + i * 28;

      const colorBox = new PIXI.Graphics();
      colorBox.beginFill(d.color);
      colorBox.drawRect(-185, y + 1, 10, 10);
      colorBox.endFill();
      overlayContent.addChild(colorBox);

      const nameText = new PIXI.Text(d.sin, {
        fontFamily: 'monospace',
        fontSize: 13,
        fill: d.color,
        fontWeight: 'bold',
      });
      nameText.anchor.set(0, 0);
      nameText.x = -170;
      nameText.y = y;
      overlayContent.addChild(nameText);

      const descText = new PIXI.Text(d.desc, bodyStyle);
      descText.anchor.set(0, 0);
      descText.x = -50;
      descText.y = y;
      overlayContent.addChild(descText);
    }

    const sinergyHeader = new PIXI.Text('SINERGIA DE PECADOS', sectionStyle);
    sinergyHeader.anchor.set(0.5, 0);
    sinergyHeader.y = 286;
    overlayContent.addChild(sinergyHeader);

    const sinergyLines = [
      'Usar habilidades del MISMO tipo de pecado de forma consecutiva',
      'construye una cadena (sinergia) que potencia el da\u00f1o:',
      '',
      '\u2022 2+ ataques del mismo pecado seguidos  \u2192  +20% da\u00f1o (x1.2)',
      '\u2022 La cadena se reinicia al usar un pecado diferente',
      '\u2022 El bonus activo se muestra como "Sinergia: N" en pantalla',
    ];

    for (let i = 0; i < sinergyLines.length; i++) {
      const t = new PIXI.Text(sinergyLines[i], i >= 3 ? bodyStyle : subStyle);
      t.anchor.set(0.5, 0);
      t.y = 316 + i * 22;
      overlayContent.addChild(t);
    }

    const skillHeader = new PIXI.Text('TIPOS DE HABILIDAD', sectionStyle);
    skillHeader.anchor.set(0.5, 0);
    skillHeader.y = 460;
    overlayContent.addChild(skillHeader);

    const skillTypes = [
      { name: 'ATAQUE',  desc: 'Inflige da\u00f1o directo al enemigo' },
      { name: 'BUFF',    desc: 'Mejora al personaje o al equipo (escudos, aumentos de estad\u00edsticas)' },
      { name: 'E.G.O.',  desc: 'Poderosa habilidad definitiva \u00fanica de cada personaje. Consume EGO' },
    ];

    for (let i = 0; i < skillTypes.length; i++) {
      const st = skillTypes[i];
      const y = 492 + i * 24;

      const nameText = new PIXI.Text(st.name, {
        fontFamily: 'monospace',
        fontSize: 13,
        fill: 0xffdd77,
        fontWeight: 'bold',
      });
      nameText.anchor.set(0, 0);
      nameText.x = -190;
      nameText.y = y;
      overlayContent.addChild(nameText);

      const descText = new PIXI.Text(st.desc, bodyStyle);
      descText.anchor.set(0, 0);
      descText.x = -60;
      descText.y = y;
      overlayContent.addChild(descText);
    }

    const closeBtn = new PIXI.Text('[ CERRAR ]', {
      fontFamily: 'monospace',
      fontSize: 18,
      fill: 0x4488cc,
      fontWeight: 'bold',
    });
    closeBtn.anchor.set(0.5, 0);
    closeBtn.y = 580;
    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.on('pointerdown', () => this._toggleHelp());
    overlayContent.addChild(closeBtn);

    this.helpOverlay.addChild(overlayContent);
    this.container.addChild(this.helpOverlay);
  }

  _toggleHelp() {
    this.helpOverlay.visible = !this.helpOverlay.visible;
  }

  _updateTurnOrderDisplay() {
    if (!this.turnOrderContainer) return;
    const queue = this.turnManager.queue;
    if (queue.length === 0) return;
    const currentIdx = this.turnManager.currentIndex;
    const slotSize = 70;
    const gap = 6;
    const padding = 9;
    let firstFound = false;

    for (let i = 0; i < 5; i++) {
      const slot = this.turnOrderSlots[i];
      slot.removeChildren();

      const qIdx = (currentIdx + i) % queue.length;
      const entry = queue[qIdx];
      const entity = entry.entity;

      const color = entry.type === 'character' ? (entity.color || 0x4488cc) : 0xcc4444;
      const bg = new PIXI.Graphics();
      bg.beginFill(color, 0.5);
      bg.lineStyle(1, color, 0.9);
      bg.drawRoundedRect(0, 0, slotSize, slotSize, 4);
      bg.endFill();
      slot.addChild(bg);

      const texKey = entity.spriteName ? entity.spriteName.replace('.png', '') : null;
      const tex = texKey ? window.gameSprites[texKey] : null;
      if (tex) {
        const headH = Math.floor(tex.height * 0.50);
        const headTex = new PIXI.Texture(tex.baseTexture, new PIXI.Rectangle(0, 0, tex.width, headH));
        const s = new PIXI.Sprite(headTex);
        const scale = Math.min(58 / s.width, 58 / s.height);
        s.scale.set(scale);
        s.anchor.set(0.5, 0.5);
        s.x = slotSize / 2;
        s.y = slotSize / 2;
        slot.addChild(s);
      } else {
        const t = new PIXI.Text(entity.name ? entity.name[0] : '?', {
          fontFamily: 'monospace', fontSize: 32, fill: 0xffffff,
          stroke: 0x000000, strokeThickness: 4,
        });
        t.anchor.set(0.5, 0.5);
        t.x = slotSize / 2;
        t.y = slotSize / 2;
        slot.addChild(t);
      }

      if (i === 0) {
        this.turnArrow.x = padding + slotSize / 2;
        this.turnArrow.visible = true;
        firstFound = true;
      }
    }

    if (!firstFound) this.turnArrow.visible = false;
  }

  _setupTurnOrder() {
    this.turnManager.init(this.characters, this.enemies);
    this.state = 'turn_start';
    this._startTurn();
  }

  _startTurn() {
    this.turnManager.removeDead();
    if (this._checkBattleEnd()) return;

    const firstTurn = this.turnManager.turnCount === 0;

    if (firstTurn || this.turnManager.roundChanged) {
      const activeChars = this.characters.filter(c => c.alive);
      const activeEnemies = this.enemies.filter(e => e.alive);

      const effects = this.combatManager.tickEffects(activeChars, activeEnemies);
      for (const eff of effects) {
        const effColor = StatusEffect.EFFECTS[eff.type]?.color || 0xcccccc;
        const effName = StatusEffect.EFFECTS[eff.type]?.name || eff.type;
        this._addLog([
          { text: eff.entity.name, color: eff.entity.color || 0xcccccc },
          { text: ': ', color: 0xcccccc },
          { text: effName, color: effColor },
          { text: ` ${eff.value > 0 ? '-' : '+'}${Math.abs(eff.value)}`, color: 0xcccccc },
        ]);
        this._showDamageNumber(eff.entity.displayObject, eff.value > 0 ? `-${eff.value}` : `+${Math.abs(eff.value)}`);
      }

      this.turnManager.removeDead();
      if (this._checkBattleEnd()) return;

      this._updateHpBars();
    }

    this._updateTurnOrderDisplay();

    const currentTurn = this.turnManager.getCurrentTurn();
    if (!currentTurn) return;

    if (currentTurn.type === 'character') {
      this._startPlayerTurn(currentTurn.entity);
    } else {
      this._startEnemyTurn(currentTurn.entity);
    }
  }

  _startPlayerTurn(character) {
    if (character.downed) {
      this._addLog([
        { text: character.name, color: character.color },
        { text: ' está derribado...', color: 0xcc4444 },
      ]);
      this.turnText.text = `${character.name} - DERRIBADO`;
      this.turnText.style.fill = 0xcc4444;
      this.skillPanel.clear();
      this._highlightCharacter(character, false);
      setTimeout(() => {
        this.turnManager.advance();
        this._startTurn();
      }, 500);
      return;
    }

    this.state = 'player_select';
    this.selectedSkill = null;

    this.turnText.text = `Turno de: ${character.name}`;
    this.turnText.style.fill = character.color;

    if (character.egoCharge >= 100) {
      this._addLog([
        { text: '\u26A1 ', color: 0xffdd44 },
        { text: `${character.name}: E.G.O. listo!`, color: character.color },
      ]);
    }

    this.skillPanel.build(character);

    this._highlightCharacter(character, true);
  }

  _startEnemyTurn(enemy) {
    this.state = 'enemy_acting';
    this.turnText.text = `Turno de: ${enemy.name}`;
    this.turnText.style.fill = 0xcc4444;

    this.skillPanel.clear();

    this._highlightEnemy(enemy, true);

    setTimeout(() => {
      if (!enemy.alive) { this.turnManager.advance(); this._startTurn(); return; }
      const action = enemy.chooseAction(this.characters);
      if (action.skill) {
        const sinColor = CONFIG.COLORS[`SIN_${action.skill.sin}`] || 0xcc4444;
        this._addLog([
          { text: enemy.name, color: enemy.color || 0xcc4444 },
          { text: ' usa ', color: 0xcccccc },
          { text: action.skill.name, color: sinColor },
        ]);
        const targets = action.skill.targetType === 'all_characters' ? this.characters : [action.target];
        const results = this.combatManager.executeSkill(enemy, action.skill, action.target, this.characters);

        this._animateAction(enemy, action.target, action.skill, results, () => {
          this._highlightEnemy(enemy, false);
          this._updateHpBars();

          if (this._checkBattleEnd()) return;

          setTimeout(() => {
            this.turnManager.advance();
            this._startTurn();
          }, 300);
        });
      } else {
        this._highlightEnemy(enemy, false);
        this.turnManager.advance();
        this._startTurn();
      }
    }, 500);
  }

  _onSkillSelected(skill) {
    if (this.state !== 'player_select' && this.state !== 'player_targeting') return;
    const current = this.turnManager.getCurrentTurn();
    if (!current || !current.entity.alive) return;

    const character = current.entity;

    if (!skill.canUse(character)) {
      this._addLog('No puedes usar esa habilidad ahora');
      return;
    }

    if (this.state === 'player_targeting') {
      this._cancelTargetSelection();
    }

    this.state = 'player_targeting';
    this.selectedSkill = skill;
    this.skillPanel.highlightSelected(skill);

    const aliveEnemies = this.enemies.filter(e => e.alive);

    switch (skill.targetType) {
      case 'single_enemy':
        this._showTargetSelection(aliveEnemies, (target) => {
          this._executePlayerAction(character, skill, target);
        });
        break;
      case 'all_enemies':
        this._executePlayerAction(character, skill, null);
        break;
      case 'self':
        this._executePlayerAction(character, skill, character);
        break;
      default:
        this._executePlayerAction(character, skill, aliveEnemies[0] || null);
        break;
    }
  }

  _cancelTargetSelection() {
    this.skillPanel.clearHighlight();
    const targets = this.enemies.filter(e => e.alive);
    targets.forEach(t => {
      if (t.displayObject) {
        t.displayObject.eventMode = 'none';
        t.displayObject.cursor = 'default';
        t.displayObject.off('pointerover');
        t.displayObject.off('pointerout');
        t.displayObject.off('pointerdown');
        if (t._spriteObj) {
          t._spriteObj.alpha = 1;
          t._spriteObj.tint = 0xffffff;
        }
      }
    });
  }

  _showTargetSelection(targets, callback) {
    targets.forEach(e => {
      if (e.displayObject) {
        e.displayObject.eventMode = 'static';
        e.displayObject.cursor = 'pointer';
        if (e._spriteObj) {
          e._spriteObj.alpha = 1;
          e._spriteObj.tint = 0xffffff;
        }

        e.displayObject.on('pointerover', () => {
          if (e._spriteObj) e._spriteObj.tint = 0xff4444;
        });
        e.displayObject.on('pointerout', () => {
          if (e._spriteObj) e._spriteObj.tint = 0xffffff;
        });

        e.displayObject.once('pointerdown', () => {
          audio.sfxClick();
          targets.forEach(t => {
            if (t.displayObject) {
              t.displayObject.eventMode = 'none';
              t.displayObject.cursor = 'default';
              t.displayObject.off('pointerover');
              t.displayObject.off('pointerout');
              if (t._spriteObj) {
                t._spriteObj.alpha = 1;
                t._spriteObj.tint = 0xffffff;
              }
            }
          });
          callback(e);
        });
      }
    });
  }

  _executePlayerAction(character, skill, target) {
    this.state = 'player_acting';
    this.skillPanel.clear();
    this._highlightCharacter(character, false);

    const sinColor = CONFIG.COLORS[`SIN_${skill.sin}`] || 0xffffff;
    const logSegments = [
      { text: character.name, color: character.color },
      { text: ' usa ', color: 0xcccccc },
      { text: skill.name, color: sinColor },
    ];
    if (skill.isEgo) logSegments.push({ text: ' [E.G.O]', color: 0xffdd44 });
    this._addLog(logSegments);

    const targetList = skill.targetType === 'all_enemies' ? this.enemies : (target ? [target] : []);
    const allTargets = skill.targetType === 'all_enemies' ? this.enemies : this.characters;

    const results = this.combatManager.executeSkill(
      character, skill,
      targetList[0] || null,
      allTargets
    );

    for (const effect of skill.effects) {
      if (effect._applied) continue;
      if (effect.type === 'heal_all') {
        const healed = this.combatManager.healAll(this.characters, effect.value);
        if (healed > 0) this._addLog(`Todos recuperaron ${healed} HP`);
      }
      if (effect.type === 'heal_ally') {
        const lowest = this.characters.filter(c => c.alive).sort((a, b) => a.stats.hp / a.baseStats.maxHp - b.stats.hp / b.baseStats.maxHp)[0];
        if (lowest) {
          const h = lowest.heal(effect.value);
          this._addLog([
            { text: lowest.name, color: lowest.color || 0xcccccc },
            { text: ` recuperó ${h} HP`, color: 0x44cc44 },
          ]);
          this._showDamageNumber(lowest.displayObject, `+${h}`, 0x44cc44);
        }
      }
      if (effect.type === 'shield' && skill.targetType === 'all_enemies') {
        for (const c of this.characters) {
          if (c.alive) c.addEffect('shield', effect.value, effect.turns || 2);
        }
        this._addLog(`Escudo +${effect.value} para todos`);
      }
      if (effect.type === 'shield_all') {
        for (const c of this.characters) {
          if (c.alive) c.addEffect('shield', effect.value, effect.turns || 2);
        }
        this._addLog(`Escudo +${effect.value} para todos`);
      }
      if (effect.type === 'cleanse') {
        const debuffTypes = ['bleed', 'weakness'];
        let removed = 0;
        for (const c of this.characters) {
          if (!c.alive) continue;
          const before = c.effects.length;
          c.effects = c.effects.filter(e => !debuffTypes.includes(e.type));
          removed += before - c.effects.length;
        }
        if (removed > 0) this._addLog(`Debuffs eliminados de los aliados`);
      }
      if (effect.type === 'atk_up_all') {
        for (const c of this.characters) {
          if (c.alive) c.addEffect('atk_up', effect.value, effect.turns || 2);
        }
        this._addLog(`Ataque +${Math.round((effect.value - 1) * 100)}% para todos`);
      }
    }

    this._animateAction(character, target, skill, results, () => {
      this._updateHpBars();

      for (const result of results) {
        if (result.damage > 0) {
          this._showDamageNumber(result.target?.displayObject, `-${result.damage}${result.critical ? ' CRIT' : ''}`, result.critical ? 0xffdd44 : 0xffffff);
        }
        for (const eff of result.effects) {
          this._showDamageNumber(result.target?.displayObject, eff.type, 0x44aaff);
        }
      }

      character.addEgoCharge(10);
      if (this._checkBattleEnd()) return;

      this.turnManager.advance();
      setTimeout(() => this._startTurn(), 400);
    });
  }

  _animateAction(user, target, skill, results, callback) {
    this.animating = true;

    if (user._spriteObj) {
      const origX = user._spriteObj.x;
      const origY = user._spriteObj.y;
      user._spriteObj.x -= 20;

      const bounce = () => {
        if (user._spriteObj) {
          user._spriteObj.x = HELPERS.lerp(user._spriteObj.x, origX, 0.2);
          if (Math.abs(user._spriteObj.x - origX) > 1) {
            requestAnimationFrame(bounce);
          } else {
            user._spriteObj.x = origX;
          }
        }
      };
      bounce();
    }

    if (skill.isEgo) {
      this._flashScreen(0x8844ff, 0.3);
    }

    if (target && target._spriteObj) {
      user._shakeTarget = target;
      this._shakeCount = 0;
      const shake = () => {
        if (!target._spriteObj || !target.alive) { this._shakeCount = 10; return; }
        const intensity = 5 - this._shakeCount;
        target.displayObject.x += (Math.random() - 0.5) * intensity;
        target.displayObject.y += (Math.random() - 0.5) * intensity;
        this._shakeCount++;
        if (this._shakeCount < 8) {
          setTimeout(shake, 30);
        } else {
          target.displayObject.x = target._origX || target.displayObject.x;
          target.displayObject.y = target._origY || target.displayObject.y;
        }
      };
      target._origX = target.displayObject.x;
      target._origY = target.displayObject.y;
      shake();

      if (target._spriteObj) {
        target._spriteObj.tint = 0xffffff;
        setTimeout(() => { if (target._spriteObj) target._spriteObj.tint = 0xffffff; }, 100);
      }
    }

    audio.sfxHit();

    if (skill.effects.some(e => e.type === 'heal' || e.type === 'heal_all' || e.type === 'heal_ally')) {
      audio.sfxHeal();
    }

    setTimeout(() => {
      this.animating = false;
      if (callback) callback();
    }, 400);
  }

  _flashScreen(color, duration) {
    const flash = new PIXI.Graphics();
    flash.beginFill(color, 0.3);
    flash.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    flash.endFill();
    this.container.addChild(flash);

    let alpha = 0.3;
    const fade = () => {
      alpha -= 0.02;
      flash.alpha = alpha;
      if (alpha > 0) requestAnimationFrame(fade);
      else this.container.removeChild(flash);
    };
    setTimeout(fade, duration * 1000);
  }

  _showDamageNumber(displayObj, text, color = 0xffffff) {
    if (!displayObj) return;

    const overlay = new PIXI.Text(text, {
      fontFamily: 'monospace', fontSize: text.includes('CRIT') ? 18 : 14,
      fill: color, stroke: 0x000000, strokeThickness: 3,
      fontWeight: text.includes('CRIT') ? 'bold' : 'normal',
    });
    overlay.anchor = new PIXI.Point(0.5, 0.5);
    overlay.x = displayObj.x + (Math.random() - 0.5) * 40;
    overlay.y = displayObj.y - 30;
    this.container.addChild(overlay);

    let vy = -2;
    let alpha = 1;
    const float = () => {
      overlay.y += vy;
      vy -= 0.05;
      alpha -= 0.015;
      overlay.alpha = alpha;
      if (alpha > 0) requestAnimationFrame(float);
      else this.container.removeChild(overlay);
    };
    float();
  }

  _highlightCharacter(character, on) {
    this.characters.forEach(c => {
      if (c.displayObject) {
        if (c.downed) {
          c.displayObject.alpha = 0.4;
        } else {
          c.displayObject.alpha = (on && c === character) ? 1 : (c.alive ? 0.6 : 0.2);
        }
      }
    });
  }

  _highlightEnemy(enemy, on) {
    this.enemies.forEach(e => {
      if (e._turnArrow) {
        e._turnArrow.visible = (on && e === enemy);
      }
    });
  }

  _updateHpBars() {
    this.characters.forEach((c) => {
      if (c.healthBar) {
        c.healthBar.setValue(c.stats.hp, c.baseStats.maxHp);
      }
      if (c._spriteObj) {
        if (c.downed) {
          c._spriteObj.tint = 0x555555;
          c._spriteObj.alpha = 0.5;
        } else {
          c._spriteObj.tint = 0xffffff;
          c._spriteObj.alpha = 1;
        }
      }
    });
    this.spBars.forEach((hb, i) => {
      const c = this.characters[i];
      if (c && hb) hb.setValue(c.stats.sp, c.baseStats.maxSp);
    });
    this.enemies.forEach((e) => {
      if (e.healthBar) {
        e.healthBar.setValue(e.stats.hp, e.baseStats.maxHp);
      }
      if (e.displayObject) {
        e.displayObject.visible = e.alive;
      }
    });
    this.egoBars.forEach((eb, i) => {
      const c = this.characters[i];
      if (c && eb) eb.setValue(c.egoCharge, 100);
    });
    this._refreshEffectIcons();
  }

  _refreshEffectIcons() {
    const refresh = (entity) => {
      const container = entity.effectsIconContainer;
      if (!container) return;
      container.removeChildren();
      const nameText = entity._nameText;
      if (!nameText) return;
      const effects = entity.getActiveEffects();
      if (effects.length === 0) return;
      const startX = nameText.anchor.x === 0.5
        ? nameText.x + nameText.width / 2 + 4
        : nameText.x + nameText.width + 4;
      let x = startX;
      for (const eff of effects) {
        if (eff.icon === '?' && eff.turns <= 0) continue;
        const icon = new PIXI.Text(eff.icon, {
          fontFamily: 'monospace', fontSize: 12, fill: eff.color || 0xffffff,
          stroke: 0x000000, strokeThickness: 2,
        });
        icon.anchor.set(0, 0.5);
        icon.x = x;
        icon.y = 0;
        container.addChild(icon);
        if (eff.turns > 0) {
          const turnText = new PIXI.Text(String(eff.turns), {
            fontFamily: 'monospace', fontSize: 8, fill: 0xffffff,
            stroke: 0x000000, strokeThickness: 2,
          });
          turnText.anchor.set(1, 0);
          turnText.x = icon.x + icon.width;
          turnText.y = icon.y - icon.height / 2;
          container.addChild(turnText);
        }
        x += icon.width + 2;
      }
    };
    this.characters.forEach(refresh);
    this.enemies.forEach(refresh);
  }

  _addLog(segments) {
    if (typeof segments === 'string') {
      segments = [{ text: segments, color: 0xcccccc }];
    }
    this.logEntries.push(segments);
    if (this.logEntries.length > 8) this.logEntries.shift();
    for (let i = 0; i < this.logTexts.length; i++) {
      const container = this.logTexts[i];
      container.removeChildren();
      const entry = this.logEntries[i];
      if (!entry) continue;
      let x = 0;
      for (const seg of entry) {
        const t = new PIXI.Text(seg.text, {
          fontFamily: 'monospace', fontSize: 20,
          fill: seg.color || 0xcccccc,
          stroke: 0x000000, strokeThickness: 3,
        });
        t.anchor.set(0, 0);
        t.x = x;
        container.addChild(t);
        x += t.width;
      }
      for (const child of container.children) {
        child.x -= x / 2;
      }
    }
  }

  _applyKillRelics() {
    const relics = window.gameState.relics || [];
    const killed = this.enemies.filter(e => !e.alive);
    if (killed.length === 0) return;
    for (const relic of relics) {
      if (!relic.effect) continue;
      if (relic.effect.type === 'heal_on_kill') {
        const amt = relic.effect.value * killed.length;
        if (amt > 0) {
          for (const c of this.characters) {
            if (c.alive) c.heal(amt);
          }
          this._addLog(`Vendas curativas: +${amt} HP`);
        }
      }
      if (relic.effect.type === 'sp_on_kill') {
        const amt = relic.effect.value * killed.length;
        if (amt > 0) {
          for (const c of this.characters) {
            if (c.alive) c.restoreSp(amt);
          }
          this._addLog(`Colgante de almas: +${amt} SP`);
        }
      }
    }
    this._updateHpBars();
  }

  _checkBattleEnd() {
    if (this.state === 'victory' || this.state === 'defeat') return false;
    if (this.combatManager.checkVictory(this.enemies)) {
      this._applyKillRelics();
      this.state = 'victory';
      this.turnText.text = '\u{1F3C6} \u00a1VICTORIA!';
      this.turnText.style.fill = 0xffd700;
      this.skillPanel.clear();
      audio.sfxVictory();
      audio.playMusicFile('menu');

      setTimeout(() => {
        if (this.onVictory) this.onVictory(this.enemies);
      }, 1200);
      return true;
    }

    if (this.combatManager.checkDefeat(this.characters)) {
      this.state = 'defeat';
      this.turnText.text = '\u{2620} DERROTA';
      this.turnText.style.fill = 0xcc2222;
      this.skillPanel.clear();
      audio.sfxDeath();
      audio.playMusicFile('menu');

      setTimeout(() => {
        if (this.onDefeat) this.onDefeat(this.enemies);
      }, 1500);
      return true;
    }

    return false;
  }

  update(dt) {
    this.healthBars.forEach(hb => hb.update(dt));
    this.spBars.forEach(hb => hb.update(dt));
    this.enemyHealthBars.forEach(hb => hb.update(dt));
    this.egoBars.forEach(eb => eb.update(dt));

    this.sinText.text = '';
    const sinInfo = this.combatManager.getSinChainInfo();
    if (sinInfo) {
      this.sinText.text = `\u{1F300} Sinergia: ${sinInfo.count} golpes (${Math.round((sinInfo.bonus - 1) * 100)}% bonus)`;
      this.sinText.style.fill = 0xffaa44;
    }
  }

  destroy() {
    this.characterSprites.forEach(s => s.destroy({ children: true }));
    this.enemySprites.forEach(s => s.destroy({ children: true }));
  }
}
