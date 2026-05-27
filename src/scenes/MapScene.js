class MapScene {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.onNodeSelected = null;
    this.onComplete = null;
    this.characters = null;
    this.currentZone = null;
    this.mapData = null;
    this.nodeIcons = [];
    this.connections = [];
    this.currentFloor = 0;
    this.mapWidth = Math.floor(CONFIG.WIDTH * 2 / 3);
    this._panelElements = [];
  }

  start(characters, zoneId, mapData, clearedNodeIds) {
    this.characters = characters;
    this.currentZone = zoneId;
    this.currentFloor = 0;
    this._panelElements = [];

    const zone = ZONES_DATA.find(z => z.id === zoneId);
    this.mapData = mapData || generateMap(zoneId);

    if (clearedNodeIds) {
      for (const nodeId of clearedNodeIds) {
        const node = this._findNodeById(nodeId);
        if (node) {
          node.cleared = true;
          node.available = false;
        }
      }
      this._updateAvailableNodes();
    }

    this._createBackground(zone);
    this._createTitle(zone);
    this._drawConnections();
    this._drawNodes();
    this._drawCurrentPositionIndicator();
    this._createGuideArrow();
    this._createRightPanel();
    audio.playMusicFile('exploration');
  }

  _updateAvailableNodes() {
    let lastClearedNode = null;
    for (const n of this.mapData.nodes.flat()) {
      if (n.cleared && (!lastClearedNode || n.floor > lastClearedNode.floor)) {
        lastClearedNode = n;
      }
    }

    if (lastClearedNode) {
      for (const connId of lastClearedNode.connections) {
        const next = this._findNodeById(connId);
        if (next && !next.cleared) next.available = true;
      }
    } else {
      const firstFloor = this.mapData.nodes[0] || [];
      for (const n of firstFloor) {
        if (!n.cleared) n.available = true;
      }
    }
  }

  _createBackground(zone) {
    const bg = new PIXI.Graphics();
    bg.beginFill(zone.bgColor || 0x0a0a14);
    bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    bg.endFill();

    for (let i = 0; i < 25; i++) {
      const x = Math.random() * this.mapWidth;
      const y = Math.random() * CONFIG.HEIGHT;
      bg.beginFill(0xffffff, Math.random() * 0.05 + 0.02);
      bg.drawCircle(x, y, Math.random() * 3 + 1);
      bg.endFill();
    }

    this.container.addChild(bg);
  }

  _createTitle(zone) {
    const header = new PIXI.Graphics();
    header.beginFill(0x0a0a14, 0.85);
    header.drawRect(0, 0, this.mapWidth, 50);
    header.endFill();
    this.container.addChild(header);

    const text = new PIXI.Text(`ZONA ${zone.id}: ${zone.name}`, {
      fontFamily: 'monospace', fontSize: 22, fill: 0xcc4444,
      stroke: 0x000000, strokeThickness: 3, letterSpacing: 4,
    });
    text.x = 20;
    text.y = 10;
    this.container.addChild(text);

    const diffText = new PIXI.Text(`Dificultad: ${zone.difficulty}`, {
      fontFamily: 'monospace', fontSize: 11, fill: 0x888888,
    });
    diffText.x = this.mapWidth - 170;
    diffText.y = 15;
    this.container.addChild(diffText);
  }

  _drawConnections() {
    const floors = this.mapData.nodes;
    for (let f = 0; f < floors.length; f++) {
      const nodesOnFloor = floors[f];
      for (const node of nodesOnFloor) {
        for (const connId of node.connections) {
          const target = this._findNodeById(connId);
          if (!target) continue;

          const fromPos = this._getNodePos(node);
          const toPos = this._getNodePos(target);

          const isPathForward = node.cleared && target.available && !target.cleared;
          const line = new PIXI.Graphics();
          line.lineStyle(
            isPathForward ? 2 : 1,
            isPathForward ? 0x44cc44 : 0x2a2a5e,
            isPathForward ? 0.9 : 0.4
          );
          line.moveTo(fromPos.x, fromPos.y + 20);
          line.lineTo(toPos.x, toPos.y - 20);
          this.container.addChild(line);
          this.connections.push(line);
        }
      }
    }
  }

  _drawNodes() {
    const floors = this.mapData.nodes;
    for (let f = 0; f < floors.length; f++) {
      const nodesOnFloor = floors[f];
      for (const node of nodesOnFloor) {
        const pos = this._getNodePos(node);
        const icon = new NodeIcon(pos.x, pos.y, node);
        icon.onClick = (nodeData) => this._onNodeClick(nodeData);
        this.container.addChild(icon.container);
        this.nodeIcons.push(icon);
      }
    }
  }

  _getNodePos(node) {
    const floors = this.mapData.nodes;
    const totalFloors = floors.length;
    const nodesOnFloor = floors[node.floor];
    const spacingY = (CONFIG.HEIGHT - 100) / Math.max(1, totalFloors - 1);
    const spacingX = (this.mapWidth - 80) / Math.max(1, nodesOnFloor.length - 1);

    return {
      x: nodesOnFloor.length > 1 ? 40 + node.position * spacingX : this.mapWidth / 2,
      y: 80 + node.floor * spacingY,
    };
  }

  _drawCurrentPositionIndicator() {
    let lastCleared = null;
    let lastFloor = -1;
    for (const floor of this.mapData.nodes) {
      for (const node of floor) {
        if (node.cleared && node.floor > lastFloor) {
          lastCleared = node;
          lastFloor = node.floor;
        }
      }
    }
    if (!lastCleared) return;

    const pos = this._getNodePos(lastCleared);
    const nodeR = lastCleared.type === 'BOSS' ? 16 : (lastCleared.type === 'ELITE' ? 13 : 11);
    const indicator = new PIXI.Graphics();
    indicator.lineStyle(2, 0xcc2222, 0.9);
    indicator.drawCircle(pos.x, pos.y + 1, nodeR + 4);
    indicator.endFill();
    this.container.addChild(indicator);
    this._currentPositionIndicator = indicator;
  }

  _createGuideArrow() {
    const hasCleared = this.mapData.nodes.some(f => f.some(n => n.cleared));
    if (hasCleared) return;

    const firstNode = this.mapData.nodes[0]?.[0];
    if (!firstNode || !firstNode.available) return;

    const pos = this._getNodePos(firstNode);

    this.guideArrow = new PIXI.Container();
    this.guideArrow.x = pos.x;
    this.guideArrow.y = pos.y - 45;
    this.guideArrow.rotation = Math.PI;

    const g = new PIXI.Graphics();
    g.beginFill(0xffdd44, 0.9);
    g.moveTo(0, -12);
    g.lineTo(-10, 6);
    g.lineTo(10, 6);
    g.closePath();
    g.endFill();

    g.lineStyle(2, 0xffdd44, 0.7);
    g.moveTo(0, 6);
    g.lineTo(0, 16);

    this.guideArrow.addChild(g);

    let elapsed = 0;
    const baseY = pos.y - 45;
    const anim = (dt) => {
      elapsed += dt / 60;
      this.guideArrow.y = baseY + Math.sin(elapsed * 3) * 5;
      this.guideArrow.alpha = 0.6 + Math.sin(elapsed * 2.5) * 0.3;
    };
    this.app.ticker.add(anim);
    this._guideArrowCleanup = () => this.app.ticker.remove(anim);

    this.container.addChild(this.guideArrow);
  }

  _createRightPanel() {
    const panelX = this.mapWidth;
    const panelW = CONFIG.WIDTH - this.mapWidth;

    const panelBg = new PIXI.Graphics();
    panelBg.beginFill(0x0a0a18, 0.95);
    panelBg.lineStyle(1, 0x2a2a4e);
    panelBg.drawRect(panelX, 0, panelW, CONFIG.HEIGHT);
    panelBg.endFill();
    this.container.addChild(panelBg);
    this._panelElements.push(panelBg);

    const sep = new PIXI.Graphics();
    sep.lineStyle(1, 0x3a3a6e, 0.6);
    sep.moveTo(panelX, 50);
    sep.lineTo(panelX, CONFIG.HEIGHT);
    this.container.addChild(sep);
    this._panelElements.push(sep);

    this._drawPartySection(panelX, panelW);
    this._drawRelicsSection(panelX, panelW);
  }

  _drawPartySection(panelX, panelW) {
    const x = panelX + 10;
    const w = panelW - 20;
    let y = 55;

    const title = new PIXI.Text('EQUIPO', {
      fontFamily: 'monospace', fontSize: 14, fill: 0xffd700,
      stroke: 0x000000, strokeThickness: 2, letterSpacing: 4,
    });
    title.x = panelX + (panelW - title.width) / 2;
    title.y = y;
    this.container.addChild(title);
    this._panelElements.push(title);
    y += 28;

    this.characters.forEach(char => {
      if (!char.alive && !char.downed) return;
      const cardH = this._drawPartyCard(char, x, y, w);
      y += cardH + 6;
    });

    this._partySectionEndY = y;
  }

  _drawPartyCard(char, x, y, w) {
    const isDowned = char.downed;
    const cardH = 88;
    const cardBg = new PIXI.Graphics();
    cardBg.beginFill(isDowned ? 0x0a0a14 : 0x12122a, 0.8);
    cardBg.lineStyle(1, isDowned ? 0x333344 : 0x3a3a6e);
    cardBg.drawRoundedRect(0, 0, w, cardH, 5);
    cardBg.endFill();
    cardBg.x = x;
    cardBg.y = y;
    this.container.addChild(cardBg);
    this._panelElements.push(cardBg);

    const spriteX = x + 30;
    const spriteCenterY = y + 48;
    const texKey = char.spriteName ? char.spriteName.replace('.png', '') : null;
    const tex = texKey && window.gameSprites ? window.gameSprites[texKey] : null;
    if (tex) {
      const s = new PIXI.Sprite(tex);
      const maxH = 48;
      const scale = maxH / s.height;
      s.scale.set(scale);
      s.anchor.set(0.5, 0.5);
      s.x = spriteX;
      s.y = spriteCenterY;
      if (char.id === 'jia_huan') s.scale.x *= -1;
      if (isDowned) s.tint = 0x555555;
      this.container.addChild(s);
      this._panelElements.push(s);
    }

    const hasSprite = !!tex;
    const barX = x + (hasSprite ? 56 : 8);
    const barW = w - (hasSprite ? 64 : 16);

    const nameColor = isDowned ? 0x666666 : 0xcccccc;
    const namePrefix = isDowned ? '\u2716 ' : '';
    const nameText = new PIXI.Text(`${namePrefix}${char.name}`, {
      fontFamily: 'monospace', fontSize: 12, fill: nameColor,
      fontWeight: 'bold', stroke: 0x000000, strokeThickness: 2,
    });
    nameText.x = barX;
    nameText.y = y + 4;
    this.container.addChild(nameText);
    this._panelElements.push(nameText);

    const levelText = new PIXI.Text(`Nv.${char.level}`, {
      fontFamily: 'monospace', fontSize: 10, fill: 0x888888,
    });
    levelText.x = x + w - 45;
    levelText.y = y + 5;
    this.container.addChild(levelText);
    this._panelElements.push(levelText);

    let barY = y + 24;

    this._drawSimpleBar(barX, barY, barW, 8, char.stats.hp, char.baseStats.maxHp, CONFIG.COLORS.HP, CONFIG.COLORS.HP_BG);
    const hpNum = new PIXI.Text(`${char.stats.hp}/${char.baseStats.maxHp}`, {
      fontFamily: 'monospace', fontSize: 9, fill: isDowned ? 0x664444 : 0xcc6666,
    });
    hpNum.x = barX + 4;
    hpNum.y = barY + 10;
    this.container.addChild(hpNum);
    this._panelElements.push(hpNum);
    barY += 24;

    this._drawSimpleBar(barX, barY, barW, 6, char.stats.sp, char.baseStats.maxSp, CONFIG.COLORS.SP, CONFIG.COLORS.SP_BG);
    const spNum = new PIXI.Text(`SP ${char.stats.sp}/${char.baseStats.maxSp}`, {
      fontFamily: 'monospace', fontSize: 9, fill: 0x6688cc,
    });
    spNum.x = barX + 4;
    spNum.y = barY + 8;
    this.container.addChild(spNum);
    this._panelElements.push(spNum);
    barY += 20;

    this._drawSimpleBar(barX, barY, barW, 5, char.egoCharge, 100, 0xaa44dd, 0x221133);
    const egoNum = new PIXI.Text(`EGO ${char.egoCharge}/100`, {
      fontFamily: 'monospace', fontSize: 9, fill: 0xaa66dd,
    });
    egoNum.x = barX + 4;
    egoNum.y = barY + 7;
    this.container.addChild(egoNum);
    this._panelElements.push(egoNum);

    return cardH;
  }

  _drawSimpleBar(x, y, w, h, value, max, fgColor, bgColor) {
    const bg = new PIXI.Graphics();
    bg.beginFill(bgColor);
    bg.drawRoundedRect(0, 0, w, h, 2);
    bg.endFill();
    bg.x = x;
    bg.y = y;
    this.container.addChild(bg);
    this._panelElements.push(bg);

    if (max > 0) {
      const ratio = Math.min(1, value / max);
      if (ratio > 0) {
        const fg = new PIXI.Graphics();
        fg.beginFill(fgColor);
        fg.drawRoundedRect(0, 0, Math.max(3, w * ratio), h, 2);
        fg.endFill();
        fg.x = x;
        fg.y = y;
        this.container.addChild(fg);
        this._panelElements.push(fg);
      }
    }
  }

  _drawRelicsSection(panelX, panelW) {
    const relics = window.gameState.relics || [];
    const w = panelW - 20;
    let y = (this._partySectionEndY || 350) + 10;

    const title = new PIXI.Text('RELIQUIAS', {
      fontFamily: 'monospace', fontSize: 12, fill: 0x8888ff,
      stroke: 0x000000, strokeThickness: 2, letterSpacing: 3,
    });
    title.x = panelX + (panelW - title.width) / 2;
    title.y = y;
    this.container.addChild(title);
    this._panelElements.push(title);
    y += 24;

    if (relics.length === 0) {
      const empty = new PIXI.Text('(ninguna)', {
        fontFamily: 'monospace', fontSize: 10, fill: 0x555555,
      });
      empty.x = panelX + 16;
      empty.y = y;
      this.container.addChild(empty);
      this._panelElements.push(empty);
      return;
    }

    const cardW = 90;
    const cardH = 52;
    const gapX = 6;
    const gapY = 6;
    const cols = 4;
    const totalRowW = cols * cardW + (cols - 1) * gapX;
    const gridStartX = panelX + (panelW - totalRowW) / 2;
    const startX = Math.floor(gridStartX);
    const maxRows = Math.floor((CONFIG.HEIGHT - y - 10) / (cardH + gapY));
    const visible = relics.slice(0, maxRows * cols);

    visible.forEach((relic, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cardW + gapX);
      const cy = y + row * (cardH + gapY);

      const isCommon = relic.rarity === 'com\u00fan';
      const isRare = relic.rarity === 'raro';
      const borderColor = isCommon ? 0x444466 : (isRare ? 0x4488ff : 0xffd700);

      const cardBg = new PIXI.Graphics();
      cardBg.beginFill(0x12122a, 0.85);
      cardBg.lineStyle(1, borderColor, 0.6);
      cardBg.drawRoundedRect(0, 0, cardW, cardH, 4);
      cardBg.endFill();
      cardBg.x = cx;
      cardBg.y = cy;
      this.container.addChild(cardBg);
      this._panelElements.push(cardBg);

      const iconText = new PIXI.Text(relic.icon || '\u2753', {
        fontSize: 24,
        fill: 0xffffff,
        stroke: 0x000000, strokeThickness: 2,
      });
      iconText.anchor.set(0.5, 0);
      iconText.x = cx + cardW / 2;
      iconText.y = cy + 6;
      this.container.addChild(iconText);
      this._panelElements.push(iconText);

      const nameStr = relic.name.length > 8 ? relic.name.slice(0, 7) + '\u2026' : relic.name;
      const nameText = new PIXI.Text(nameStr, {
        fontFamily: 'monospace', fontSize: 9, fill: 0xaaaaaa,
        stroke: 0x000000, strokeThickness: 1,
        align: 'center',
      });
      nameText.anchor.set(0.5, 0);
      nameText.x = cx + cardW / 2;
      nameText.y = cy + 36;
      this.container.addChild(nameText);
      this._panelElements.push(nameText);
    });
  }

  _findNodeById(id) {
    for (const floor of this.mapData.nodes) {
      const found = floor.find(n => n.id === id);
      if (found) return found;
    }
    return null;
  }

  _onNodeClick(nodeData) {
    if (nodeData.cleared || !nodeData.available) return;

    if (this.guideArrow) {
      if (this._guideArrowCleanup) this._guideArrowCleanup();
      this.container.removeChild(this.guideArrow);
      this.guideArrow = null;
      this._guideArrowCleanup = null;
    }

    nodeData.cleared = true;
    if (window.gameState) {
      window.gameState.clearedNodeIds.push(nodeData.id);
    }

    const icon = this.nodeIcons.find(i => i.nodeData.id === nodeData.id);
    if (icon) icon.setCleared();

    this.currentFloor = nodeData.floor;

    for (const otherIcon of this.nodeIcons) {
      if (otherIcon.nodeData.id === nodeData.id) continue;
      if (otherIcon.nodeData.floor <= nodeData.floor) {
        otherIcon.nodeData.available = false;
        otherIcon.setAvailable(false);
      }
    }

    for (const connId of nodeData.connections) {
      const nextNode = this._findNodeById(connId);
      if (nextNode) {
        nextNode.available = true;
        const nextIcon = this.nodeIcons.find(i => i.nodeData.id === connId);
        if (nextIcon) nextIcon.setAvailable(true);
      }
    }

    if (this.onNodeSelected) {
      this.onNodeSelected(nodeData);
    }
  }

  destroy() {
    if (this._guideArrowCleanup) this._guideArrowCleanup();
    this.nodeIcons.forEach(i => i.container.destroy({ children: true }));
    this.connections.forEach(c => c.destroy());
    if (this._currentPositionIndicator) this._currentPositionIndicator.destroy();
    this._panelElements.forEach(el => {
      if (el && el.destroy) el.destroy();
    });
    this._panelElements = [];
  }
}
