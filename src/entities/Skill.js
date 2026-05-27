class Skill {
  constructor(data) {
    this.id = data.id || HELPERS.generateId();
    this.name = data.name || 'Skill';
    this.description = data.description || '';
    this.type = data.type || 'attack';
    this.sin = data.sin || 'NEUTRAL';
    this.cost = data.cost || 0;
    this.cooldown = data.cooldown || 0;
    this.power = data.power || 0;
    this.spCost = data.spCost || 0;
    this.hits = data.hits || 1;
    this.targetType = data.targetType || 'single_enemy';
    this.effects = data.effects || [];
    this.isEgo = data.isEgo || false;
    this.levelReq = data.levelReq || 1;
    this.currentCooldown = 0;
    this.owned = false;
  }

  _getRelicTotal(effectType) {
    const relics = window.gameState ? window.gameState.relics || [] : [];
    return relics
      .filter(r => r.effect && r.effect.type === effectType)
      .reduce((sum, r) => sum + (r.effect.value || 0), 0);
  }

  _getEffectiveSpCost() {
    const reduction = this._getRelicTotal('sp_cost_reduce');
    if (reduction <= 0) return this.spCost;
    return Math.max(0, Math.floor(this.spCost * (1 - reduction / 100)));
  }

  canUse(entity) {
    if (this.currentCooldown > 0) return false;
    if (this._getEffectiveSpCost() > entity.stats.sp) return false;
    if (this.isEgo && entity.egoCharge < 100) return false;
    if (entity.level < this.levelReq) return false;
    return true;
  }

  use(entity) {
    if (!this.canUse(entity)) return false;
    const cost = this._getEffectiveSpCost();
    if (cost > 0) {
      entity.stats.sp -= cost;
    }
    if (this.cooldown > 0) {
      this.currentCooldown = this.cooldown;
    }
    if (this.isEgo) {
      entity.egoCharge = 0;
    }
    return true;
  }

  reduceCooldown() {
    if (this.currentCooldown > 0) this.currentCooldown--;
  }

  resetCooldown() {
    this.currentCooldown = 0;
  }

  getDisplayData() {
    return {
      name: this.name,
      description: this.description,
      power: this.power,
      spCost: this.spCost,
      cooldown: this.currentCooldown,
      maxCooldown: this.cooldown,
      isEgo: this.isEgo,
      sin: this.sin,
      type: this.type,
      canUse: this.currentCooldown === 0,
    };
  }
}
