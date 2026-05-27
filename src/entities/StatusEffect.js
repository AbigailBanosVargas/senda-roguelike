class StatusEffect {
  constructor(type, value, turns, source) {
    this.id = HELPERS.generateId();
    this.type = type;
    this.value = value;
    this.remainingTurns = turns;
    this.maxTurns = turns;
    this.source = source;
    this.justApplied = true;
  }

  static DURATIONS = {
    bleed: 3,
    shield: 2,
    weakness: 2,
    atk_up: 2,
    def_up: 2,
    haste: 2,
    regen: 3,
    taunt: 2,
  };

  static EFFECTS = {
    bleed: { name: 'Sangrado', color: 0xcc2222, icon: '\u{1FA78}', stackable: true },
    shield: { name: 'Escudo', color: 0x4488cc, icon: '\u{1F6E1}\uFE0F', stackable: true },
    weakness: { name: 'Debilidad', color: 0x886644, icon: '\u{1F4A2}', stackable: false },
    atk_up: { name: 'Ataque +', color: 0xcc4444, icon: '\u{1F4AA}', stackable: false },
    def_up: { name: 'Defensa +', color: 0x4488cc, icon: '\u{1F6E1}\uFE0F', stackable: false },
    haste: { name: 'Velocidad +', color: 0x44cc88, icon: '\u{26A1}', stackable: false },
    regen: { name: 'Regeneración', color: 0x44cc44, icon: '\u{1F49A}', stackable: false },
    heal: { name: 'Curación', color: 0x44cc44, icon: '\u{2764}\uFE0F', stackable: false },
    heal_ally: { name: 'Cura Aliado', color: 0x44cc44, icon: '\u{2764}\uFE0F', stackable: false },
    heal_all: { name: 'Cura Total', color: 0x44cc44, icon: '\u{2764}\uFE0F', stackable: false },
    taunt: { name: 'Provocación', color: 0xcc4444, icon: '\u{1F5E1}\uFE0F', stackable: false },
    cleanse: { name: 'Purificación', color: 0x44cc44, icon: '\u{2728}', stackable: false },
    shield_all: { name: 'Escudo Total', color: 0x4488cc, icon: '\u{1F6E1}\uFE0F', stackable: false },
    atk_up_all: { name: 'Ataque Total +', color: 0xcc4444, icon: '\u{1F4AA}', stackable: false },
  };

  tick() {
    if (this.justApplied) {
      this.justApplied = false;
      return;
    }
    this.remainingTurns--;
  }

  isExpired() {
    return this.remainingTurns <= 0;
  }

  getInfo() {
    const def = StatusEffect.EFFECTS[this.type] || { name: this.type, color: 0xffffff, icon: '?' };
    return {
      ...def,
      value: this.type === 'shield' ? this.value : this.value,
      turns: this.remainingTurns,
    };
  }
}
