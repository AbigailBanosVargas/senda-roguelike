class MenuScene {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.onStartGame = null;
  }

  start() {
    this._createBackground();
    this._createTitle();
    this._createMenu();
    this._createDisclaimer();
  }

  _createBackground() {
    if (window.menuBgTexture) {
      const bg = new PIXI.Sprite(window.menuBgTexture);
      bg.width = CONFIG.WIDTH;
      bg.height = CONFIG.HEIGHT;
      this.container.addChild(bg);
    } else {
      const bg = new PIXI.Graphics();
      bg.beginFill(CONFIG.BG_COLOR);
      bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
      bg.endFill();
      this.container.addChild(bg);
    }

    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.55);
    overlay.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    overlay.endFill();
    this.container.addChild(overlay);
  }

  _createTitle() {
    const titleContainer = new PIXI.Container();
    titleContainer.x = CONFIG.WIDTH / 2;
    titleContainer.y = CONFIG.HEIGHT / 2 - 120;

    const title = new PIXI.Text('SENDAS DEL DESTINO', {
      fontFamily: 'monospace',
      fontSize: 48,
      fill: 0xcc4444,
      stroke: 0x000000,
      strokeThickness: 6,
      letterSpacing: 10,
      fontWeight: 'bold',
    });
    title.anchor = new PIXI.Point(0.5, 0.5);
    titleContainer.addChild(title);

    const subtitle = new PIXI.Text('Un Roguelike por Turnos', {
      fontFamily: 'monospace',
      fontSize: 20,
      fill: 0xaaaaaa,
      stroke: 0x000000,
      strokeThickness: 3,
      letterSpacing: 4,
    });
    subtitle.anchor = new PIXI.Point(0.5, 0);
    subtitle.y = 42;
    titleContainer.addChild(subtitle);

    this.container.addChild(titleContainer);

    this._animateTitle(title, subtitle);
  }

  _animateTitle(title, subtitle) {
    let elapsed = 0;
    const anim = (dt) => {
      elapsed += dt / 60;
      const pulse = 1 + Math.sin(elapsed * 2) * 0.02;
      title.scale.set(pulse);
      subtitle.alpha = 0.7 + Math.sin(elapsed * 1.5) * 0.3;
    };
    this.app.ticker.add(anim);
    this.animCleanup = () => this.app.ticker.remove(anim);
  }

  _createMenu() {
    const btnData = [
      { text: 'NUEVA PARTIDA', callback: () => this._onNewGame() },
      { text: 'CÓMO JUGAR', callback: () => this._showInstructions() },
    ];

    btnData.forEach((btn, i) => {
      const btnContainer = new PIXI.Container();
      btnContainer.x = CONFIG.WIDTH / 2;
      btnContainer.y = CONFIG.HEIGHT / 2 + 20 + i * 60;

      const bg = new PIXI.Graphics();
      bg.beginFill(0x1a1a2e);
      bg.lineStyle(2, 0x3a2a5e);
      bg.drawRoundedRect(-120, -20, 240, 40, 6);
      bg.endFill();
      btnContainer.addChild(bg);

      const label = new PIXI.Text(btn.text, {
        fontFamily: 'monospace',
        fontSize: 14,
        fill: 0xcccccc,
        stroke: 0x000000,
        strokeThickness: 2,
        letterSpacing: 3,
      });
      label.anchor = new PIXI.Point(0.5, 0.5);
      btnContainer.addChild(label);

      btnContainer.eventMode = 'static';
      btnContainer.cursor = 'pointer';

      btnContainer.on('pointerover', () => {
        bg.tint = 0xcccccc;
        label.style.fill = 0xffffff;
        label.scale.set(1.05);
      });
      btnContainer.on('pointerout', () => {
        bg.tint = 0xffffff;
        label.style.fill = 0xcccccc;
        label.scale.set(1);
      });
      btnContainer.on('pointerdown', () => {
        audio.sfxClick();
        btn.callback();
      });

      this.container.addChild(btnContainer);
    });
  }

  _createDisclaimer() {
    const disclaimer = new PIXI.Text(
      'Proyecto estudiantil sin fines de lucro. Todos los assets pertenecen a Project Moon.',
      {
        fontFamily: 'monospace',
        fontSize: 12,
        fill: 0x555555,
        stroke: 0x000000,
        strokeThickness: 1,
      }
    );
    disclaimer.anchor.set(0.5, 0);
    disclaimer.x = CONFIG.WIDTH / 2;
    disclaimer.y = CONFIG.HEIGHT - 25;
    this.container.addChild(disclaimer);
  }

  _onNewGame() {
    const dialog = new PIXI.Text('PREPARANDO VIAJE...', {
      fontFamily: 'monospace', fontSize: 16, fill: 0xcc4444,
      stroke: 0x000000, strokeThickness: 3,
    });
    dialog.anchor = new PIXI.Point(0.5, 0.5);
    dialog.x = CONFIG.WIDTH / 2;
    dialog.y = CONFIG.HEIGHT / 2 + 140;
    dialog.alpha = 0;

    this.container.addChild(dialog);

    let alpha = 0;
    const fadeIn = () => {
      alpha += 0.02;
      dialog.alpha = alpha;
      if (alpha < 1) requestAnimationFrame(fadeIn);
      else {
        audio.playMusicFile('menu');
        if (this.onStartGame) this.onStartGame();
      }
    };
    fadeIn();
  }

  _showInstructions() {
    const msg = [
      '--- CÓMO JUGAR ---',
      '',
      'Combate por turnos estilo RPG.',
      'Elige habilidades para derrotar enemigos.',
      '',
      'Recorre el mapa y elige tu camino:',
      '  Rojo = Combate',
      '  Púrpura = Élite',
      '  Azul = Descanso',
      '  Amarillo = Tesoro',
      '  Verde = Evento',
      '',
      '¡Llega al jefe de cada zona!',
      'Si todos tus personajes caen,',
      'el viaje termina.',
    ].join('\n');

    const overlay = new PIXI.Container();
    overlay.eventMode = 'static';

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.85);
    bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    bg.endFill();
    overlay.addChild(bg);

    const text = new PIXI.Text(msg, {
      fontFamily: 'monospace',
      fontSize: 14,
      fill: 0xcccccc,
      lineHeight: 22,
      align: 'center',
    });
    text.anchor = new PIXI.Point(0.5, 0.5);
    text.x = CONFIG.WIDTH / 2;
    text.y = CONFIG.HEIGHT / 2 - 20;
    overlay.addChild(text);

    const closeBtn = new PIXI.Container();
    closeBtn.x = CONFIG.WIDTH / 2;
    closeBtn.y = CONFIG.HEIGHT - 60;

    const btnBg = new PIXI.Graphics();
    btnBg.beginFill(0x2a1a3e);
    btnBg.lineStyle(1, 0x5a3a7e);
    btnBg.drawRoundedRect(-80, -15, 160, 30, 5);
    btnBg.endFill();
    closeBtn.addChild(btnBg);

    const btnLabel = new PIXI.Text('VOLVER', {
      fontFamily: 'monospace', fontSize: 12, fill: 0xcccccc,
    });
    btnLabel.anchor = new PIXI.Point(0.5, 0.5);
    closeBtn.addChild(btnLabel);

    closeBtn.eventMode = 'static';
    closeBtn.cursor = 'pointer';
    closeBtn.on('pointerdown', () => {
      audio.sfxClick();
      this.container.removeChild(overlay);
    });
    overlay.addChild(closeBtn);

    this.container.addChild(overlay);
  }

  destroy() {
    if (this.animCleanup) this.animCleanup();
  }
}
