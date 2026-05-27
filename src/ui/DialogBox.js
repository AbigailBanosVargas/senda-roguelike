class DialogBox {
  constructor(x, y, width, height) {
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;
    this.width = width;
    this.height = height;
    this.visible = false;
    this.onComplete = null;
    this.onChoice = null;

    this.bg = new PIXI.Graphics();
    this.bg.beginFill(0x0a0a1a, 0.95);
    this.bg.lineStyle(2, 0x2a2a5e);
    this.bg.drawRoundedRect(0, 0, width, height, 8);
    this.bg.endFill();
    this.container.addChild(this.bg);

    this.text = new PIXI.Text('', {
      fontFamily: 'monospace',
      fontSize: 14,
      fill: 0xcccccc,
      wordWrap: true,
      wordWrapWidth: width - 30,
      lineHeight: 20,
    });
    this.text.x = 15;
    this.text.y = 15;
    this.container.addChild(this.text);

    this.choicesContainer = new PIXI.Container();
    this.choicesContainer.y = height - 60;
    this.container.addChild(this.choicesContainer);

    this.container.visible = false;
  }

  showMessage(message, callback) {
    this.text.text = message;
    this.choicesContainer.removeChildren();
    this.container.visible = true;
    this.visible = true;
    this.onComplete = callback || null;

    const continueBtn = this._createChoice('Continuar', () => {
      this.hide();
      if (this.onComplete) this.onComplete();
    });
    this.choicesContainer.addChild(continueBtn);
  }

  showChoice(title, options, callback) {
    this.text.text = title;
    this.choicesContainer.removeChildren();
    this.container.visible = true;
    this.visible = true;

    const btnW = Math.min(200, (this.width - 30) / options.length - 5);

    options.forEach((opt, i) => {
      const btn = this._createChoice(opt.text, () => {
        audio.sfxClick();
        this.hide();
        if (callback) callback(opt, i);
      });
      btn.x = 15 + i * (btnW + 10);
      this.choicesContainer.addChild(btn);
    });
  }

  _createChoice(text, onClick) {
    const container = new PIXI.Container();
    container.eventMode = 'static';
    container.cursor = 'pointer';

    const bg = new PIXI.Graphics();
    bg.beginFill(0x1a1a3e);
    bg.lineStyle(1, 0x3a3a6e);
    bg.drawRoundedRect(0, 0, 180, 36, 5);
    bg.endFill();
    container.addChild(bg);

    const label = new PIXI.Text(text, {
      fontFamily: 'monospace',
      fontSize: 11,
      fill: 0xcccccc,
      wordWrap: true,
      wordWrapWidth: 170,
    });
    label.x = 10;
    label.y = 8;
    container.addChild(label);

    container.on('pointerdown', onClick);
    container.on('pointerover', () => bg.tint = 0xcccccc);
    container.on('pointerout', () => bg.tint = 0xffffff);

    return container;
  }

  hide() {
    this.container.visible = false;
    this.visible = false;
  }
}
