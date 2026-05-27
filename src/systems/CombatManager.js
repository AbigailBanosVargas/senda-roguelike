class CombatManager {
  constructor() {
    this.results = [];
    this.sinChain = [];
    this.sinChainCount = 0;
  }

  executeSkill(user, skill, target, allTargets) {
    const results = [];
    if (!skill.use(user)) return results;

    audio.sfxSkill();
    if (skill.isEgo) audio.sfxEgo();

    const power = skill.power + user.getEffectiveStat('atk');
    const def = target ? target.getEffectiveStat('def') : 0;

    const sinColor = CONFIG.COLORS[`SIN_${skill.sin}`] || 0xffffff;

    switch (skill.targetType) {
      case 'self': {
        const result = { skill, user, type: 'self', effects: [] };
        for (const effect of skill.effects) {
          this._applyEffect(user, user, effect, result);
        }
        results.push(result);
        break;
      }
      case 'single_enemy': {
        const result = this._attackTarget(user, target, skill, power, def);
        results.push(result);
        break;
      }
      case 'all_enemies': {
        const targets = allTargets.filter(e => e.alive);
        for (const t of targets) {
          const result = this._attackTarget(user, t, skill, power, def);
          results.push(result);
        }
        break;
      }
      case 'single_character': {
        const result = this._attackTarget(user, target, skill, power, def);
        results.push(result);
        break;
      }
      case 'all_characters': {
        const targets = allTargets.filter(c => c.alive && !c.downed);
        for (const t of targets) {
          const result = this._attackTarget(user, t, skill, power, def);
          results.push(result);
        }
        break;
      }
      default: {
        if (target) {
          const result = this._attackTarget(user, target, skill, power, def);
          results.push(result);
        }
        break;
      }
    }

    this._updateSinChain(skill.sin);

    this.results.push(...results);
    return results;
  }

  _getRelicTotal(effectType) {
    return (window.gameState.relics || [])
      .filter(r => r.effect && r.effect.type === effectType)
      .reduce((sum, r) => sum + (r.effect.value || 0), 0);
  }

  _getSinDamageBonus(sin) {
    return (window.gameState.relics || [])
      .filter(r => r.effect && r.effect.type === 'sin_damage' && r.effect.sin === sin)
      .reduce((sum, r) => sum + (r.effect.value || 0), 0);
  }

  _attackTarget(user, target, skill, power, def) {
    const result = { skill, user, target, type: 'attack', damage: 0, absorbed: 0, shieldUsed: false, effects: [], critical: false };

    const critBonus = this._getRelicTotal('crit_chance');
    const lowHpDmg = (target.stats.hp / target.baseStats.maxHp < 0.5)
      ? this._getRelicTotal('low_hp_damage') : 0;
    const sinChainDmg = this._getRelicTotal('sin_chain_damage');
    const sinDmgBonus = this._getSinDamageBonus(skill.sin);
    const lifestealPct = this._getRelicTotal('lifesteal');

    for (let h = 0; h < skill.hits; h++) {
      const variance = 0.85 + Math.random() * 0.3;
      const isCrit = Math.random() < 0.1 + (skill.isEgo ? 0.15 : 0) + (critBonus / 100);
      const critMult = isCrit ? 1.5 : 1.0;
      const sinBonus = this.sinChainCount >= 2 ? 1.2 : 1.0;
      const relicSinBonus = 1 + (sinDmgBonus / 100);
      const relicLowHpBonus = 1 + (lowHpDmg / 100);
      const relicChainBonus = 1 + (sinChainDmg * Math.max(0, this.sinChainCount) / 100);

      const rawDamage = Math.floor(power * variance * critMult * sinBonus * relicSinBonus * relicLowHpBonus * relicChainBonus);
      const dmgResult = target.takeDamage(rawDamage);

      if (lifestealPct > 0 && dmgResult.damage > 0 && user.heal) {
        const healAmt = Math.max(1, Math.floor(dmgResult.damage * lifestealPct / 100));
        user.heal(healAmt);
        result.effects.push({ type: 'lifesteal', value: healAmt });
      }

      result.damage += dmgResult.damage;
      result.absorbed += dmgResult.absorbed;
      result.shieldUsed = result.shieldUsed || dmgResult.shieldUsed;
      if (isCrit) result.critical = true;
    }

    for (const effect of skill.effects) {
      this._applyEffect(user, target, effect, result);
    }

    return result;
  }

  applyStartRelics(characters) {
    const shieldAmt = this._getRelicTotal('battle_start_shield');
    if (shieldAmt > 0) {
      for (const c of characters) {
        if (c.alive) c.addEffect('shield', shieldAmt, 99);
      }
    }
    const egoAmt = this._getRelicTotal('battle_start_ego');
    if (egoAmt > 0) {
      for (const c of characters) {
        if (c.alive) c.addEgoCharge(egoAmt);
      }
    }
  }

  _applyEffect(user, target, effect, result) {
    switch (effect.type) {
      case 'heal':
        if (target.heal) {
          const amt = target.heal(effect.value);
          result.effects.push({ type: 'heal', value: amt });
          audio.sfxHeal();
        }
        break;
      case 'shield':
        if (target.addEffect) {
          target.addEffect('shield', effect.value, effect.turns || 2);
          result.effects.push({ type: 'shield', value: effect.value, turns: effect.turns || 2 });
        }
        break;
      case 'bleed':
        if (target.addEffect) {
          target.addEffect('bleed', effect.value, effect.turns || 3);
          result.effects.push({ type: 'bleed', value: effect.value, turns: effect.turns || 3 });
        }
        break;
      case 'weakness':
        if (target.addEffect) {
          target.addEffect('weakness', effect.value, effect.turns || 2);
          result.effects.push({ type: 'weakness', value: effect.value, turns: effect.turns || 2 });
        }
        break;
      case 'atk_up':
        if (target.addEffect) {
          target.addEffect('atk_up', effect.value, effect.turns || 2);
          result.effects.push({ type: 'atk_up', value: effect.value, turns: effect.turns || 2 });
        }
        break;
      case 'sp_drain':
        if (target.stats) {
          const drained = Math.min(effect.value, target.stats.sp);
          target.stats.sp = Math.max(0, target.stats.sp - drained);
          result.effects.push({ type: 'sp_drain', value: drained });
        }
        break;
      case 'def_up':
        if (target.addEffect) {
          target.addEffect('def_up', effect.value, effect.turns || 2);
          result.effects.push({ type: 'def_up', value: effect.value, turns: effect.turns || 2 });
        }
        break;
      case 'taunt':
        if (target.addEffect) {
          target.addEffect('taunt', effect.value, effect.turns || 2);
          result.effects.push({ type: 'taunt', value: effect.value, turns: effect.turns || 2 });
        }
        break;
    }
  }

  _updateSinChain(sin) {
    if (this.sinChain.length > 0 && this.sinChain[this.sinChain.length - 1] === sin) {
      this.sinChainCount++;
    } else {
      this.sinChain = [sin];
      this.sinChainCount = 0;
    }
    this.sinChain.push(sin);
  }

  getSinChainInfo() {
    if (this.sinChainCount < 2) return null;
    return { count: this.sinChainCount, bonus: 1.2 };
  }

  healAll(characters, amount) {
    let total = 0;
    for (const c of characters) {
      if (c.alive) total += c.heal(amount);
    }
    return total;
  }

  restoreSpAll(characters, amount) {
    let total = 0;
    for (const c of characters) {
      if (c.alive) total += c.restoreSp(amount);
    }
    return total;
  }

  tickEffects(characters, enemies) {
    const results = [];
    for (const c of characters) {
      if (c.alive) results.push(...c.tickEffects().map(r => ({ entity: c, ...r })));
    }
    for (const e of enemies) {
      if (e.alive) results.push(...e.tickEffects().map(r => ({ entity: e, ...r })));
    }
    return results;
  }

  checkVictory(enemies) {
    return enemies.every(e => !e.alive);
  }

  checkDefeat(characters) {
    return characters.every(c => !c.alive || c.downed);
  }
}
