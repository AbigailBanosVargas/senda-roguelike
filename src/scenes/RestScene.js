class RestScene {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.onComplete = null;
    this.characters = null;
  }

  start(characters, zoneId) {
    this.characters = characters;
    this._createBackground(zoneId);
    this._createUI();
    audio.playMusicFile('menu');
  }

  _createBackground(zoneId) {
    const bg = new PIXI.Graphics();
    bg.beginFill(0x0a0a14);
    bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    bg.endFill();

    const fireY = CONFIG.HEIGHT - 180;
    const fireX = CONFIG.WIDTH / 2;

    for (let i = 0; i < 5; i++) {
      const flame = new PIXI.Graphics();
      const r = 20 + Math.random() * 30;
      const color = HELPERS.pick([0xff6633, 0xffaa33, 0xff4400, 0xffcc44, 0x882200]);
      flame.beginFill(color, 0.4 + Math.random() * 0.3);
      flame.drawCircle(fireX + (Math.random() - 0.5) * 40, fireY - 20 + (Math.random() - 0.5) * 20, r);
      flame.endFill();
      this.container.addChild(flame);
    }

    const glow = new PIXI.Graphics();
    glow.beginFill(0xff6600, 0.05);
    glow.drawCircle(fireX, fireY - 20, 200);
    glow.endFill();
    this.container.addChild(glow);

    const ground = new PIXI.Graphics();
    ground.beginFill(0x1a1a2e);
    ground.drawRect(0, fireY + 20, CONFIG.WIDTH, 40);
    ground.endFill();
    this.container.addChild(ground);

    const campfire = new PIXI.Text('\u{1F525}', { fontSize: 48 });
    campfire.anchor = new PIXI.Point(0.5, 0.5);
    campfire.x = fireX;
    campfire.y = fireY;
    this.container.addChild(campfire);

    const title = new PIXI.Text('DESCANSO', {
      fontFamily: 'monospace', fontSize: 28, fill: 0xcc8844,
      stroke: 0x000000, strokeThickness: 4,
      letterSpacing: 6,
    });
    title.anchor = new PIXI.Point(0.5, 0);
    title.x = CONFIG.WIDTH / 2;
    title.y = 30;
    this.container.addChild(title);
  }

  _createUI() {
    const restOpts = GAME_DATA.rest_options;
    const level = this.characters[0]?.level || 1;
    const healAmt = restOpts.heal.base + level * restOpts.heal.perLevel;
    const spAmt = restOpts.meditate.base + level * restOpts.meditate.perLevel;

    const options = [
      {
        text: `${restOpts.heal.label} (Cura +${healAmt} HP todos)`,
        action: () => {
          let totalHeal = 0;
          for (const c of this.characters) {
            if (c.alive) totalHeal += c.heal(healAmt);
          }
          audio.sfxHeal();
          this._showResult(`Todos recuperaron ${totalHeal} HP.`);
        },
      },
      {
        text: `${restOpts.meditate.label} (Recupera +${spAmt} SP todos)`,
        action: () => {
          let totalSp = 0;
          for (const c of this.characters) {
            if (c.alive) totalSp += c.restoreSp(spAmt);
          }
          audio.sfxHeal();
          this._showResult(`Todos recuperaron ${totalSp} SP.`);
        },
      },
      {
        text: `${restOpts.train.label} (+1 stat para un aliado)`,
        action: () => {
          this._showCharacterSelect(`¿Quién entrena?`, (char) => {
            this._showStatSelect(char, restOpts.train.options);
          });
        },
      },
    ];

    options.forEach((opt, i) => {
      const btn = this._createButton(opt.text, CONFIG.WIDTH / 2, 150 + i * 55);
      btn.on('pointerdown', () => {
        audio.sfxClick();
        this._disableAllButtons();
        opt.action();
      });
      this.container.addChild(btn);
    });
  }

  _createButton(text, x, y) {
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;

    const bg = new PIXI.Graphics();
    bg.beginFill(0x1a1a2e);
    bg.lineStyle(1, 0x3a3a6e);
    bg.drawRoundedRect(-200, -18, 400, 36, 5);
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

    container._bg = bg;
    return container;
  }

  _disableAllButtons() {
    this.container.children.forEach(c => {
      if (c.eventMode === 'static') c.eventMode = 'none';
    });
  }

  _enableButtons() {
    this.container.children.forEach(c => {
      if (c._bg) c.eventMode = 'static';
    });
  }

  _showResult(message) {
    const overlay = new PIXI.Container();
    overlay.eventMode = 'static';

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.7);
    bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    bg.endFill();
    overlay.addChild(bg);

    const text = new PIXI.Text(message, {
      fontFamily: 'monospace', fontSize: 16, fill: 0x44cc88,
      stroke: 0x000000, strokeThickness: 3,
    });
    text.anchor = new PIXI.Point(0.5, 0.5);
    text.x = CONFIG.WIDTH / 2;
    text.y = CONFIG.HEIGHT / 2 - 30;
    overlay.addChild(text);

    const contBtn = this._createButton('CONTINUAR', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 40);
    contBtn.on('pointerdown', () => {
      audio.sfxClick();
      this.container.removeChild(overlay);
      if (this.onComplete) this.onComplete();
    });
    overlay.addChild(contBtn);

    this.container.addChild(overlay);
  }

  _showCharacterSelect(prompt, callback) {
    const overlay = new PIXI.Container();
    overlay.eventMode = 'static';

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.85);
    bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    bg.endFill();
    overlay.addChild(bg);

    const title = new PIXI.Text(prompt, {
      fontFamily: 'monospace', fontSize: 20, fill: 0xcccccc,
      stroke: 0x000000, strokeThickness: 3,
    });
    title.anchor.set(0.5, 0);
    title.x = CONFIG.WIDTH / 2;
    title.y = 80;
    overlay.addChild(title);

    const alive = this.characters.filter(c => c.alive);
    const cardW = 200;
    const cardH = 140;
    const gap = 220;
    const totalW = alive.length * gap;
    const startX = (CONFIG.WIDTH - totalW) / 2;

    alive.forEach((char, i) => {
      const cx = startX + i * gap;
      const cy = CONFIG.HEIGHT / 2 - 70;

      const cardBg = new PIXI.Graphics();
      cardBg.beginFill(0x12122a, 0.9);
      cardBg.lineStyle(2, 0x3a3a6e);
      cardBg.drawRoundedRect(0, 0, cardW, cardH, 8);
      cardBg.endFill();
      cardBg.x = cx;
      cardBg.y = cy;
      overlay.addChild(cardBg);

      const texKey = char.spriteName ? char.spriteName.replace('.png', '') : null;
      const tex = texKey && window.gameSprites ? window.gameSprites[texKey] : null;
      if (tex) {
        const s = new PIXI.Sprite(tex);
        const maxH = 60;
        const scale = maxH / s.height;
        s.scale.set(scale);
        s.anchor.set(0.5, 0.5);
        s.x = cx + cardW / 2;
        s.y = cy + 38;
        if (char.id === 'jia_huan') s.scale.x *= -1;
        overlay.addChild(s);
      }

      const nameText = new PIXI.Text(char.name, {
        fontFamily: 'monospace', fontSize: 13, fill: 0xcccccc,
        fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2,
      });
      nameText.anchor.set(0.5, 0);
      nameText.x = cx + cardW / 2;
      nameText.y = cy + 80;
      overlay.addChild(nameText);

      const barX = cx + 14;
      const barY = cy + 100;
      const barW = cardW - 28;
      const hpRatio = char.stats.hp / char.baseStats.maxHp;

      const barBg = new PIXI.Graphics();
      barBg.beginFill(0x221111);
      barBg.drawRoundedRect(0, 0, barW, 8, 3);
      barBg.endFill();
      barBg.x = barX;
      barBg.y = barY;
      overlay.addChild(barBg);

      const barFg = new PIXI.Graphics();
      barFg.beginFill(0xcc4444);
      barFg.drawRoundedRect(0, 0, Math.max(3, barW * hpRatio), 8, 3);
      barFg.endFill();
      barFg.x = barX;
      barFg.y = barY;
      overlay.addChild(barFg);

      const hpText = new PIXI.Text(`${char.stats.hp}/${char.baseStats.maxHp}`, {
        fontFamily: 'monospace', fontSize: 9, fill: 0xcc6666,
      });
      hpText.anchor.set(0.5, 0);
      hpText.x = cx + cardW / 2;
      hpText.y = barY + 10;
      overlay.addChild(hpText);

      const hitZone = new PIXI.Graphics();
      hitZone.beginFill(0xffffff, 0.001);
      hitZone.drawRect(0, 0, cardW, cardH);
      hitZone.endFill();
      hitZone.x = cx;
      hitZone.y = cy;
      hitZone.eventMode = 'static';
      hitZone.cursor = 'pointer';

      hitZone.on('pointerover', () => {
        cardBg.tint = 0xcccccc;
        cardBg.lineStyle(2, 0x8888cc);
      });
      hitZone.on('pointerout', () => {
        cardBg.tint = 0xffffff;
        cardBg.lineStyle(2, 0x3a3a6e);
      });
      hitZone.on('pointerdown', () => {
        audio.sfxClick();
        this.container.removeChild(overlay);
        callback(char);
      });

      overlay.addChild(hitZone);
    });

    this.container.addChild(overlay);
  }

  _showStatSelect(char, options) {
    const overlay = new PIXI.Container();
    overlay.eventMode = 'static';

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.8);
    bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    bg.endFill();
    overlay.addChild(bg);

    const title = new PIXI.Text(`¿Qué stat entrenar para ${char.name}?`, {
      fontFamily: 'monospace', fontSize: 18, fill: 0xcccccc,
      stroke: 0x000000, strokeThickness: 3,
    });
    title.anchor = new PIXI.Point(0.5, 0);
    title.x = CONFIG.WIDTH / 2;
    title.y = CONFIG.HEIGHT / 2 - 80;
    overlay.addChild(title);

    let y = CONFIG.HEIGHT / 2 - 30;
    for (const opt of options) {
      const btn = this._createButton(
        `${opt.label} +${opt.value}`,
        CONFIG.WIDTH / 2,
        y
      );
      btn.on('pointerdown', () => {
        audio.sfxClick();
        this.container.removeChild(overlay);
        char.addBonusStat(opt.stat, opt.value);
        this._showResult(`${char.name} aumentó su ${opt.stat} a ${char.stats[opt.stat]}.`);
      });
      overlay.addChild(btn);
      y += 55;
    }

    const cancelBtn = this._createButton('CANCELAR', CONFIG.WIDTH / 2, y + 20);
    cancelBtn.on('pointerdown', () => {
      audio.sfxClick();
      this.container.removeChild(overlay);
      this._enableButtons();
    });
    overlay.addChild(cancelBtn);

    this.container.addChild(overlay);
  }
}
