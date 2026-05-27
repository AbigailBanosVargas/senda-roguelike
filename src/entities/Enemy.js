class BattleEnemy {
  constructor(data, difficultyMult = 1.0) {
    this.id = data.id;
    this.name = data.name;
    this.spriteName = data.sprite;
    this.color = data.color || 0xcc4444;
    this.tier = data.tier || 'normal';
    this.isBoss = data.isBoss || false;
    this.zone = data.zone || 1;

    const stats = { ...data.baseStats };
    const mult = difficultyMult * (this.isBoss ? 1.2 : 1.0);
    this.baseStats = {
      maxHp: Math.floor(stats.maxHp * mult),
      maxSp: Math.floor(stats.maxSp * mult),
      atk: Math.floor(stats.atk * mult),
      def: Math.floor(stats.def * mult),
      spd: Math.floor(stats.spd * mult),
    };

    this.stats = { ...this.baseStats };
    this.stats.hp = this.baseStats.maxHp;
    this.stats.sp = this.baseStats.maxSp;

    const skillData = data.skills || ['enemy_attack'];
    this.skills = skillData.map(id => {
      const sd = SKILLS_DATA.enemy.find(s => s.id === id);
      return sd ? new Skill({ ...sd, power: Math.floor((sd.power || 6) * mult) }) : null;
    }).filter(Boolean);

    this.effects = [];
    this.alive = true;
    this.intent = null;

    this.displayObject = null;
    this.healthBar = null;
    this.shakeAmount = 0;
  }

  get isPlayer() { return false; }

  takeDamage(rawDamage, ignoreDef = false) {
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
      this.alive = false;
    }

    return { damage: finalDamage, absorbed, shieldUsed: absorbed > 0 };
  }

  heal(amount) {
    const before = this.stats.hp;
    this.stats.hp = Math.min(this.baseStats.maxHp, this.stats.hp + amount);
    return this.stats.hp - before;
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
      default:
        return { damage: 0, absorbed: 0, shieldUsed: false };
    }
  }

  tickEffects() {
    const results = [];
    this.effects = this.effects.filter(e => {
      const result = this.applyEffectTick(e);
      if (result.damage > 0) results.push({ type: e.type, value: result.damage });
      e.tick();
      return !e.isExpired();
    });
    return results;
  }

  getEffectiveStat(stat) {
    let value = this.stats[stat] || this.baseStats[stat] || 0;
    for (const effect of this.effects) {
      if (effect.type === 'atk_up' && stat === 'atk') value = Math.floor(value * effect.value);
      if (effect.type === 'weakness' && (stat === 'atk')) value = Math.floor(value * effect.value);
      if (effect.type === 'def_up' && stat === 'def') value = Math.floor(value * effect.value);
    }
    return value;
  }

  chooseAction(playerCharacters) {
    const aliveSkills = this.skills.filter(s => s.canUse(this));
    if (aliveSkills.length === 0) {
      return { skill: this.skills[0], target: null };
    }

    const weights = [5, 4, 3, 2, 1];
    const skill = HELPERS.weightedPick(aliveSkills, weights.slice(0, aliveSkills.length));

    let target = null;
    switch (skill.targetType) {
      case 'single_character': {
        const valid = playerCharacters.filter(c => c.alive && !c.downed);
        if (valid.length > 0) {
          const taunted = valid.filter(c => c.effects.some(e => e.type === 'taunt'));
          target = taunted.length > 0 ? HELPERS.pick(taunted) : HELPERS.pick(valid);
        }
        break;
      }
      case 'all_characters':
        break;
      case 'self':
        target = this;
        break;
    }
    return { skill, target };
  }

  resetTurn() {
    this.skills.forEach(s => s.reduceCooldown());
  }

  getActiveEffects() {
    return this.effects.map(e => e.getInfo());
  }
}
