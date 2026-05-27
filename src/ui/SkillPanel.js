class SkillPanel {
  constructor(x, y, width, height) {
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;
    this.width = width;
    this.height = height;
    this.buttons = [];
    this.onSkillSelected = null;
    this.selectedCharacter = null;
    this.visible = true;
    this.scrollOffset = 0;
    this.btnWidth = 290;
    this.gap = 10;
    this.scrollContainer = null;
    this.arrowLeft = null;
    this.arrowRight = null;
    this.maskGraphics = null;

    this.container.eventMode = 'static';
    this.container.on('wheel', (e) => {
      const direction = e.deltaY > 0 ? 1 : -1;
      this._scroll(direction);
    });
  }

  build(character) {
    this.clear();
    this.selectedCharacter = character;
    if (!character) return;

    const skills = character.getSkills();
    this.btnWidth = Math.max(220, Math.min(300, Math.floor((this.width - 80) / 4) - 10));
    const btnHeight = this.height - 20;

    this.scrollContainer = new PIXI.Container();
    this.container.addChild(this.scrollContainer);

    const unlocked = skills.filter(s => character.level >= s.levelReq);
    unlocked.forEach((skill, i) => {
      const btn = this._createSkillButton(skill, 0, 10, this.btnWidth, btnHeight);
      this.buttons.push(btn);
      this.scrollContainer.addChild(btn.container);
    });

    this.maskGraphics = new PIXI.Graphics();
    this.maskGraphics.beginFill(0xffffff);
    this.maskGraphics.drawRect(0, 0, this.width, this.height);
    this.maskGraphics.endFill();
    this.container.addChild(this.maskGraphics);
    this.scrollContainer.mask = this.maskGraphics;

    this._createArrows();

    this.scrollOffset = 0;
    this._updatePositions();
    this._updateArrows();
    this.visible = true;
  }

  _createArrows() {
    this.arrowLeft = this._makeArrow('\u25C0', 4, this.height / 2);
    this.arrowLeft.on('pointerdown', () => {
      audio.sfxClick();
      this._scroll(-1);
    });
    this.container.addChild(this.arrowLeft);

    this.arrowRight = this._makeArrow('\u25B6', this.width - 40, this.height / 2);
    this.arrowRight.on('pointerdown', () => {
      audio.sfxClick();
      this._scroll(1);
    });
    this.container.addChild(this.arrowRight);
  }

  _makeArrow(char, x, cy) {
    const c = new PIXI.Container();
    c.x = x;
    c.y = cy;

    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.65);
    bg.drawCircle(18, 0, 18);
    bg.endFill();

    const border = new PIXI.Graphics();
    border.lineStyle(1, 0x666688, 0.5);
    border.drawCircle(18, 0, 18);
    c.addChild(border);
    c.addChild(bg);

    const label = new PIXI.Text(char, {
      fontFamily: 'monospace', fontSize: 16, fill: 0xffffff,
    });
    label.anchor = new PIXI.Point(0.5, 0.5);
    c.addChild(label);

    c.eventMode = 'static';
    c.cursor = 'pointer';
    c._bg = bg;
    c.on('pointerover', () => { bg.tint = 0xcccccc; });
    c.on('pointerout', () => { bg.tint = 0xffffff; });

    return c;
  }

  _scroll(direction) {
    const step = this.btnWidth + this.gap;
    const totalWidth = this.buttons.length * (this.btnWidth + this.gap) + 10;
    const maxScroll = Math.max(0, totalWidth - this.width);
    this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset + direction * step));
    this._updatePositions();
    this._updateArrows();
  }

  _updatePositions() {
    this.buttons.forEach((btn, i) => {
      btn.container.x = 10 + i * (this.btnWidth + this.gap) - this.scrollOffset;
    });
  }

  _updateArrows() {
    const totalWidth = this.buttons.length * (this.btnWidth + this.gap) + 10;
    const maxScroll = Math.max(0, totalWidth - this.width);

    if (totalWidth <= this.width) {
      if (this.arrowLeft) this.arrowLeft.visible = false;
      if (this.arrowRight) this.arrowRight.visible = false;
      return;
    }

    if (this.arrowLeft) this.arrowLeft.visible = this.scrollOffset > 0;
    if (this.arrowRight) this.arrowRight.visible = this.scrollOffset < maxScroll;
  }

  _createSkillButton(skill, x, y, w, h) {
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;

    const canUse = skill.canUse(this.selectedCharacter);
    const isLocked = this.selectedCharacter.level < skill.levelReq;
    const isEgo = skill.isEgo;

    const sinColor = CONFIG.COLORS[`SIN_${skill.sin}`] || 0x666688;
    const borderColor = isLocked ? 0x444444 : (canUse ? sinColor : 0x444444);

    let baseColor;
    if (isLocked) baseColor = 0x0d0d1a;
    else if (isEgo) baseColor = 0x442266;
    else baseColor = 0x1a1a2e;

    const bg = new PIXI.Graphics();
    bg.lineStyle(2, borderColor);
    bg.beginFill(baseColor);
    bg.drawRoundedRect(0, 0, w, h, 6);
    bg.endFill();

    if (!canUse && !isLocked) {
      bg.beginFill(0x000000, 0.35);
      bg.drawRoundedRect(0, 0, w, h, 6);
      bg.endFill();
    }
    if (isLocked) {
      bg.beginFill(0x000000, 0.5);
      bg.drawRoundedRect(0, 0, w, h, 6);
      bg.endFill();
    }

    container.addChild(bg);

    const textColor = isLocked ? 0x555555 : (canUse ? 0xffffff : 0x666666);
    const textStyle = {
      fontFamily: 'monospace',
      fill: textColor,
      stroke: 0x000000,
      strokeThickness: 1,
      wordWrap: true,
      wordWrapWidth: w - 10,
    };

    const nameText = new PIXI.Text(skill.name, { ...textStyle, fontSize: 12, fontWeight: 'bold' });
    nameText.x = 6;
    nameText.y = 6;
    container.addChild(nameText);

    let spText = null;
    if (skill.spCost > 0) {
      spText = new PIXI.Text(`SP: ${skill.spCost}`, { ...textStyle, fontSize: 9 });
      spText.x = 6;
      spText.y = nameText.y + nameText.height + 2;
      container.addChild(spText);
    }

    let powText = null;
    if (skill.power > 0) {
      powText = new PIXI.Text(`P: ${skill.power}`, { ...textStyle, fontSize: 9 });
      powText.x = 6;
      powText.y = (spText ? spText.y : nameText.y + nameText.height + 2) + 12;
      container.addChild(powText);
    }

    const lastStatY = powText
      ? powText.y + powText.height
      : (spText ? spText.y + spText.height : nameText.y + nameText.height);

    if (skill.description) {
      const descText = new PIXI.Text(skill.description, {
        fontFamily: 'monospace',
        fontSize: 16,
        fill: isLocked ? 0x444444 : (canUse ? 0xaaaaaa : 0x555555),
        stroke: 0x000000,
        strokeThickness: 1,
        wordWrap: true,
        wordWrapWidth: w - 12,
      });
      descText.x = 6;
      descText.y = lastStatY + 2;
      container.addChild(descText);
    }

    if (skill.currentCooldown > 0) {
      const cdText = new PIXI.Text(`CD: ${skill.currentCooldown}`, { ...textStyle, fontSize: 10, fill: 0xff6644 });
      cdText.x = w - 6;
      cdText.y = h - 16;
      cdText.anchor = new PIXI.Point(1, 0);
      container.addChild(cdText);
    }

    if (isLocked) {
      const lockText = new PIXI.Text(`\u{1F512}`, {
        fontFamily: 'monospace', fontSize: 18, fill: 0x666666,
      });
      lockText.anchor = new PIXI.Point(0.5, 0);
      lockText.x = w / 2;
      lockText.y = h - 40;
      container.addChild(lockText);

      const reqText = new PIXI.Text(`Nv. ${skill.levelReq}`, {
        fontFamily: 'monospace', fontSize: 10, fill: 0x666666,
        stroke: 0x000000, strokeThickness: 1,
      });
      reqText.anchor = new PIXI.Point(0.5, 0);
      reqText.x = w / 2;
      reqText.y = h - 20;
      container.addChild(reqText);
    }

    if (isEgo && !isLocked) {
      const egoLabel = new PIXI.Text('E.G.O', {
        fontFamily: 'monospace', fontSize: 10,
        fill: canUse ? 0xff88ff : 0x884488,
        stroke: 0x000000, strokeThickness: 2,
      });
      egoLabel.x = w - 6;
      egoLabel.y = 6;
      egoLabel.anchor = new PIXI.Point(1, 0);
      container.addChild(egoLabel);
    }

    if (!isLocked) {
      const sinLabel = new PIXI.Text(skill.sin, {
        fontFamily: 'monospace', fontSize: 8,
        fill: sinColor,
      });
      sinLabel.x = w - 6;
      sinLabel.y = (isEgo ? 20 : nameText.y + nameText.height + 2);
      sinLabel.anchor = new PIXI.Point(1, 0);
      container.addChild(sinLabel);
    }

    if (canUse) {
      container.eventMode = 'static';
      container.cursor = 'pointer';
      container.on('pointerdown', () => {
        audio.sfxClick();
        if (this.onSkillSelected) this.onSkillSelected(skill);
      });
      container.on('pointerover', () => { bg.tint = 0xcccccc; });
      container.on('pointerout', () => { bg.tint = 0xffffff; });
    }

    return { container, bg, skill };
  }

  clear() {
    this.container.removeChildren();
    this.buttons = [];
    this.scrollContainer = null;
    this.arrowLeft = null;
    this.arrowRight = null;
    this.maskGraphics = null;
    this.selectedCharacter = null;
    this.scrollOffset = 0;
  }

  highlightSelected(skill) {
    this.buttons.forEach(btn => {
      if (btn.skill === skill) {
        btn.bg.tint = 0x888888;
      }
    });
  }

  clearHighlight() {
    this.buttons.forEach(btn => {
      btn.bg.tint = 0xffffff;
    });
  }

  show() { this.container.visible = true; this.visible = true; }
  hide() { this.container.visible = false; this.visible = false; }
}