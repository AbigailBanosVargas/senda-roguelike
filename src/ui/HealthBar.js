class HealthBar {
  constructor(width, height, fgColor, bgColor, label) {
    this.container = new PIXI.Container();

    this.bg = new PIXI.Graphics();
    this.bg.beginFill(bgColor || CONFIG.COLORS.HP_BG);
    this.bg.drawRoundedRect(0, 0, width, height, 3);
    this.bg.endFill();
    this.container.addChild(this.bg);

    this.fg = new PIXI.Graphics();
    this.container.addChild(this.fg);

    this.fgColor = fgColor || CONFIG.COLORS.HP;
    this.bgColor = bgColor || CONFIG.COLORS.HP_BG;
    this.width = width;
    this.height = height;
    this.currentRatio = 1;
    this.targetRatio = 1;

    if (label) {
      this.label = new PIXI.Text(label, {
        fontFamily: 'monospace',
        fontSize: Math.max(10, height * 0.55),
        fill: 0xffffff,
        stroke: 0x000000,
        strokeThickness: 2,
      });
      this.label.x = 4;
      this.label.y = Math.floor((height - this.label.height) / 2);
      this.container.addChild(this.label);
    }

    this.valueText = new PIXI.Text('', {
      fontFamily: 'monospace',
      fontSize: Math.max(9, height * 0.45),
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 1,
      align: 'right',
    });
    this.valueText.x = width - 4;
    this.valueText.y = Math.floor((height - this.valueText.height) / 2);
    this.valueText.anchor = new PIXI.Point(1, 0);
    this.container.addChild(this.valueText);

    this.draw(1);
  }

  setRatio(ratio) {
    this.targetRatio = Math.max(0, Math.min(1, ratio));
  }

  setValue(current, max) {
    this.setRatio(max > 0 ? current / max : 0);
    this.valueText.text = `${Math.floor(current)}/${Math.floor(max)}`;
  }

  draw(ratio) {
    this.fg.clear();
    const w = Math.max(0, this.width * ratio);
    if (w > 0) {
      const color = ratio < 0.25 ? CONFIG.COLORS.HP : (ratio < 0.5 ? 0xccaa44 : this.fgColor);
      this.fg.beginFill(color);
      this.fg.drawRoundedRect(0, 0, w, this.height, 3);
      this.fg.endFill();
    }
  }

  update(dt) {
    if (Math.abs(this.currentRatio - this.targetRatio) > 0.001) {
      this.currentRatio = HELPERS.lerp(this.currentRatio, this.targetRatio, dt * 5);
      const displayRatio = this.targetRatio > this.currentRatio ? this.currentRatio : this.targetRatio;
      this.draw(displayRatio);
    } else if (this.currentRatio !== this.targetRatio) {
      this.currentRatio = this.targetRatio;
      this.draw(this.currentRatio);
    }
  }

  get containerObject() { return this.container; }
}
