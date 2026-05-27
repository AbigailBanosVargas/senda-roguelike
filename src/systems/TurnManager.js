class TurnManager {
  constructor() {
    this.queue = [];
    this.currentIndex = 0;
    this.turnCount = 0;
    this.isProcessing = false;
    this.roundChanged = false;
  }

  init(characters, enemies) {
    this.queue = [];
    this.turnCount = 0;
    this.isProcessing = false;

    characters.forEach(c => {
      if (c.alive) this.queue.push({ entity: c, type: 'character' });
    });
    enemies.forEach(e => {
      if (e.alive) this.queue.push({ entity: e, type: 'enemy' });
    });

    this.queue.sort((a, b) => b.entity.getEffectiveStat('spd') - a.entity.getEffectiveStat('spd'));
    this.currentIndex = 0;
  }

  getCurrentTurn() {
    if (this.queue.length === 0) return null;
    return this.queue[this.currentIndex];
  }

  advance() {
    const current = this.getCurrentTurn();
    if (current) {
      current.entity.resetTurn();
    }

    this.roundChanged = false;
    this.currentIndex++;
    if (this.currentIndex >= this.queue.length) {
      this.currentIndex = 0;
      this.turnCount++;
      this.roundChanged = true;
      this.queue.sort((a, b) => b.entity.getEffectiveStat('spd') - a.entity.getEffectiveStat('spd'));
    }

    return this.getCurrentTurn();
  }

  removeDead() {
    this.queue = this.queue.filter(t => t.entity.alive);
    if (this.currentIndex >= this.queue.length) {
      this.currentIndex = 0;
    }
  }

  getTurnOrder() {
    return this.queue.map(t => ({
      name: t.entity.name,
      type: t.type,
      spd: t.entity.getEffectiveStat('spd'),
      isCurrent: t === this.queue[this.currentIndex],
    }));
  }

  isPlayerTurn() {
    const current = this.getCurrentTurn();
    return current && current.type === 'character';
  }

  isEnemyTurn() {
    const current = this.getCurrentTurn();
    return current && current.type === 'enemy';
  }
}
