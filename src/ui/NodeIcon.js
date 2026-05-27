const PIXEL_MAPS = {
  REST: [
    [0,0,0,1,0,0,0],
    [0,0,1,1,1,0,0],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0],
    [0,1,1,0,1,1,0],
    [0,0,1,1,1,0,0],
    [0,0,0,0,0,0,0],
  ],
  TREASURE: [
    [0,1,1,1,1,1,0],
    [0,1,0,0,0,1,0],
    [1,1,1,1,1,1,1],
    [1,0,0,1,0,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0],
  ],
  EVENT: [
    [0,0,0,1,0,0,0],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,0,1,1,1,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,1,0,0,0],
  ],
  COMBAT: [
    [1,0,0,0,0,0,1],
    [0,1,0,0,0,1,0],
    [0,0,1,0,1,0,0],
    [1,1,1,1,1,1,1],
    [0,0,1,0,1,0,0],
    [0,0,1,0,1,0,0],
    [0,1,0,0,0,1,0],
  ],
  ELITE: [
    [0,1,1,0,1,1,0],
    [0,0,1,0,1,0,0],
    [0,1,1,0,1,1,0],
    [0,0,1,0,1,0,0],
    [0,0,1,0,1,0,0],
    [0,0,1,0,1,0,0],
    [0,0,0,0,0,0,0],
  ],
  BOSS: [
    [0,0,1,1,1,0,0],
    [0,1,0,0,0,1,0],
    [1,0,1,0,1,0,1],
    [1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1],
    [0,0,0,1,0,0,0],
    [0,1,0,0,0,1,0],
  ],
};

class NodeIcon {
  constructor(x, y, nodeData) {
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;
    this.nodeData = nodeData;
    this.selected = false;
    this.hovered = false;

    const config = CONFIG.NODE_TYPES[nodeData.type] || CONFIG.NODE_TYPES.COMBAT;
    this.color = config.color;

    this.bg = new PIXI.Graphics();
    this._drawNode(false, false);
    this.container.addChild(this.bg);

    const isBoss = nodeData.type === 'BOSS';

    this.label = new PIXI.Text(config.label, {
      fontFamily: 'monospace',
      fontSize: isBoss ? 11 : 9,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 2,
      align: 'center',
    });
    this.label.anchor = new PIXI.Point(0.5, 0);
    this.label.x = 0;
    this.label.y = 30;
    this.container.addChild(this.label);

    if (nodeData.available && !nodeData.cleared) {
      this.container.eventMode = 'static';
      this.container.cursor = 'pointer';

      this.container.on('pointerdown', () => {
        if (nodeData.available && !nodeData.cleared) {
          audio.sfxClick();
          this._onClick();
        }
      });
      this.container.on('pointerover', () => {
        this.hovered = true;
        this._drawNode(this.hovered, this.selected);
      });
      this.container.on('pointerout', () => {
        this.hovered = false;
        this._drawNode(this.hovered, this.selected);
      });
    }

    this.onClick = null;
  }

  _onClick() {
    if (this.onClick) this.onClick(this.nodeData);
  }

  _getRadius() {
    switch (this.nodeData.type) {
      case 'BOSS':   return 16;
      case 'ELITE':  return 13;
      default:       return 11;
    }
  }

  _drawNode(hovered, selected) {
    const config = CONFIG.NODE_TYPES[this.nodeData.type] || CONFIG.NODE_TYPES.COMBAT;
    const color = config.color;
    const pattern = PIXEL_MAPS[this.nodeData.type] || PIXEL_MAPS.COMBAT;

    const gridH = pattern.length;
    const gridW = pattern[0].length;
    const r = this._getRadius();

    const pixelSize = Math.max(1, Math.floor((r * 2) / (Math.max(gridW, gridH) + 1)));
    const totalW = gridW * pixelSize;
    const totalH = gridH * pixelSize;
    const offsetX = -Math.floor(totalW / 2);
    const offsetY = -Math.floor(totalH / 2);

    const fillAlpha = this.nodeData.cleared
      ? 0.3
      : (this.nodeData.available ? (hovered ? 0.9 : 0.7) : 0.15);
    const lineAlpha = this.nodeData.available ? 1 : 0.3;
    const lineWidth = selected ? 3 : (hovered ? 2 : 1);

    this.bg.clear();

    this.bg.lineStyle(lineWidth, color, lineAlpha);
    this.bg.drawRect(offsetX - 1, offsetY - 1, totalW + 2, totalH + 2);

    for (let row = 0; row < gridH; row++) {
      for (let col = 0; col < gridW; col++) {
        if (pattern[row][col]) {
          const x = offsetX + col * pixelSize;
          const y = offsetY + row * pixelSize;
          this.bg.beginFill(color, fillAlpha);
          this.bg.drawRect(x, y, pixelSize, pixelSize);
          this.bg.endFill();
        }
      }
    }
  }

  setCleared() {
    this.nodeData.cleared = true;
    this._drawNode(false, false);
    this.container.eventMode = 'none';
    this.container.cursor = 'default';
  }

  setAvailable(available) {
    this.nodeData.available = available;
    this._drawNode(this.hovered, this.selected);
    if (available && !this.nodeData.cleared) {
      this.container.eventMode = 'static';
      this.container.cursor = 'pointer';
    }
  }

  setSelected(selected) {
    this.selected = selected;
    this._drawNode(this.hovered, selected);
  }
}
