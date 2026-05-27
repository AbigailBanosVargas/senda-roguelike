class BattleCharacter {
  constructor(data, level) {
    this.id = data.id;
    this.name = data.name;
    this.title = data.title || '';
    this.className = data.className || '';
    this.spriteName = data.sprite;
    this.color = data.color || 0xffffff;
    this.sinAffinity = data.sinAffinity || 'NEUTRAL';

    this._rawStats = { ...data.baseStats };
    this._bonusStats = { maxHp: 0, maxSp: 0, atk: 0, def: 0, spd: 0 };
    this.level = level || 1;
    this.xp = 0;
    this._recalcStats();

    this.skills = data.skills.map(s => new Skill(s));
    this.effects = [];
    this.egoCharge = 0;
    this.alive = true;
    this.downed = false;

    this.displayObject = null;
    this.healthBar = null;
    this.animating = false;
    this.shakeAmount = 0;
  }

  get isPlayer() { return true; }

  _recalcStats() {
    const oldMaxHp = this.baseStats ? this.baseStats.maxHp : 0;
    const oldMaxSp = this.baseStats ? this.baseStats.maxSp : 0;
    const levelMult = 1 + (this.level - 1) * 0.15;

    this.baseStats = {
      maxHp: Math.floor(this._rawStats.maxHp * levelMult) + (this._bonusStats.maxHp || 0),
      maxSp: Math.floor(this._rawStats.maxSp * levelMult) + (this._bonusStats.maxSp || 0),
      atk: Math.floor(this._rawStats.atk * levelMult) + (this._bonusStats.atk || 0),
      def: Math.floor(this._rawStats.def * levelMult) + (this._bonusStats.def || 0),
      spd: Math.floor(this._rawStats.spd * levelMult) + (this._bonusStats.spd || 0),
    };

    this.spRegen = Math.max(2, Math.floor(this.baseStats.maxSp * 0.05));

    if (!this.stats) {
      this.stats = { ...this.baseStats };
      this.stats.hp = this.baseStats.maxHp;
      this.stats.sp = this.baseStats.maxSp;
    } else if (oldMaxHp > 0) {
      const hpRatio = this.stats.hp / oldMaxHp;
      const spRatio = this.stats.sp / oldMaxSp;
      this.stats.hp = Math.max(1, Math.floor(this.baseStats.maxHp * Math.min(1, hpRatio)));
      this.stats.sp = Math.max(0, Math.floor(this.baseStats.maxSp * Math.min(1, spRatio)));
    }
  }

  gainXp(amount) {
    this.xp += amount;
    const xpTable = GAME_DATA.xp_config.xp_per_level;
    const maxLevel = GAME_DATA.xp_config.max_level;
    while (this.level < maxLevel && this.xp >= (xpTable[this.level - 1] || Infinity)) {
      this.xp -= xpTable[this.level - 1];
      this.level++;
      this._recalcStats();
    }
    if (this.level >= maxLevel) this.xp = 0;
  }

  addBonusStat(stat, value) {
    this._bonusStats[stat] = (this._bonusStats[stat] || 0) + value;
    this._recalcStats();
  }

  getXpToNextLevel() {
    if (this.level >= GAME_DATA.xp_config.max_level) return 0;
    return GAME_DATA.xp_config.xp_per_level[this.level - 1] - this.xp;
  }

  _getRelicTotal(effectType) {
    const relics = window.gameState ? window.gameState.relics || [] : [];
    return relics
      .filter(r => r.effect && r.effect.type === effectType)
      .reduce((sum, r) => sum + (r.effect.value || 0), 0);
  }

  takeDamage(rawDamage, ignoreDef = false) {
    if (this.downed) return { damage: 0, absorbed: 0, shieldUsed: false };

    const dodgeChance = this._getRelicTotal('dodge_chance');
    if (dodgeChance > 0 && Math.random() < dodgeChance / 100) {
      return { damage: 0, absorbed: 0, shieldUsed: false, dodged: true };
    }

    const shieldEffect = this.effects.find(e => e.type === 'shield');
    let absorbed = 0;

    if (shieldEffect) {
      absorbed = Math.min(rawDamage, shieldEffect.value);
      shieldEffect.value -= absorbed;
      if (shieldEffect.value <= 0) {
        this.effects = this.effects.filter(e => e !== shieldEffect);
      }
    }

    const remaining = rawDamage - absorbed;
    const defMult = ignoreDef ? 1 : Math.max(0.5, 1 - this.stats.def * 0.02);
    const finalDamage = Math.max(1, Math.floor(remaining * defMult));

    this.stats.hp = Math.max(0, this.stats.hp - finalDamage);
    if (this.stats.hp <= 0) {
      this.stats.hp = 0;
      this.downed = true;
    }

    return { damage: finalDamage, absorbed, shieldUsed: absorbed > 0 };
  }

  heal(amount) {
    const healAmp = this._getRelicTotal('heal_amp');
    if (healAmp > 0) amount = Math.max(1, Math.floor(amount * (1 + healAmp / 100)));

    if (this.downed) {
      this.downed = false;
      this.stats.hp = Math.min(this.baseStats.maxHp, Math.max(1, amount));
      return this.stats.hp;
    }

    const before = this.stats.hp;
    this.stats.hp = Math.min(this.baseStats.maxHp, this.stats.hp + amount);
    return this.stats.hp - before;
  }

  restoreSp(amount) {
    const before = this.stats.sp;
    this.stats.sp = Math.min(this.baseStats.maxSp, this.stats.sp + amount);
    return this.stats.sp - before;
  }

  addEffect(type, value, turns) {
    const def = StatusEffect.EFFECTS[type];
    if (!def) return;

    if (!def.stackable) {
      const existing = this.effects.find(e => e.type === type);
      if (existing) {
        existing.value = Math.max(existing.value, value);
        existing.remainingTurns = Math.max(existing.remainingTurns, turns);
        return;
      }
    }

    this.effects.push(new StatusEffect(type, value, turns, this.id));
  }

  applyEffectTick(effect) {
    switch (effect.type) {
      case 'bleed':
        return this.takeDamage(effect.value, true);
      case 'regen':
        return { damage: -this.heal(effect.value), absorbed: 0, shieldUsed: false };
      default:
        return { damage: 0, absorbed: 0, shieldUsed: false };
    }
  }

  tickEffects() {
    const results = [];
    this.effects = this.effects.filter(e => {
      const result = this.applyEffectTick(e);
      if (result.damage > 0 || result.damage < 0) results.push({ type: e.type, value: result.damage });
      e.tick();
      return !e.isExpired();
    });
    return results;
  }

  getEffectiveStat(stat) {
    let value = this.stats[stat] || this.baseStats[stat] || 0;
    for (const effect of this.effects) {
      if (effect.type === 'atk_up' && stat === 'atk') value = Math.floor(value * effect.value);
      if (effect.type === 'def_up' && stat === 'def') value = Math.floor(value * effect.value);
      if (effect.type === 'weakness' && (stat === 'def')) value = Math.floor(value * effect.value);
      if (effect.type === 'haste' && stat === 'spd') value = Math.floor(value * effect.value);
    }
    return value;
  }

  addEgoCharge(amount) {
    if (this.downed) return;
    this.egoCharge = Math.min(100, this.egoCharge + amount);
  }

  resetTurn() {
    if (this.downed) return;
    this.skills.forEach(s => s.reduceCooldown());
    this.addEgoCharge(10);
    const bonusRegen = this._getRelicTotal('sp_regen_bonus');
    this.restoreSp(this.spRegen + bonusRegen);
  }

  getSkills() {
    return this.skills;
  }

  getActiveEffects() {
    return this.effects.map(e => e.getInfo());
  }
}