// ================================================================
// GAME_DATA — Archivo maestro de datos del juego
// ================================================================
// Edita SOLO este archivo para modificar cualquier valor del juego.
// Los archivos data/*.js son puentes que leen desde aquí.
// ================================================================

// ---------------------------------------------------------------
// Skills de enemigos (definidas primero para evitar referencias
// circulares, ya que los personajes las referencian)
// ---------------------------------------------------------------
const _ENEMY_SKILLS = [
  {
    id: 'enemy_attack',
    name: 'Golpe',
    description: 'Ataque básico cuerpo a cuerpo',
    type: 'attack',
    power: 6,
    hits: 1,
    targetType: 'single_character',
  },
  {
    id: 'enemy_heavy',
    name: 'Golpe Fuerte',
    description: 'Golpe cargado que causa más daño',
    type: 'attack',
    power: 10,
    hits: 1,
    targetType: 'single_character',
    cooldown: 2,
  },
  {
    id: 'enemy_aoe',
    name: 'Barrido',
    description: 'Ataque que golpea a todo el equipo',
    type: 'attack',
    power: 5,
    hits: 1,
    targetType: 'all_characters',
    cooldown: 3,
  },
  {
    id: 'enemy_buff',
    name: 'Refuerzo',
    description: 'Se fortalece a sí mismo',
    type: 'buff',
    effects: [{ type: 'atk_up', value: 1.3, turns: 2 }],
    cooldown: 3,
    targetType: 'self',
  },
  {
    id: 'enemy_bleed',
    name: 'Corte Profundo',
    description: 'Causa sangrado en el objetivo',
    type: 'attack',
    power: 7,
    hits: 1,
    targetType: 'single_character',
    effects: [{ type: 'bleed', value: 3, turns: 3 }],
    cooldown: 2,
  },
];

// ---------------------------------------------------------------
// Skills de Don Quixote
// ---------------------------------------------------------------
const _DON_SKILLS = [
  {
    id: 'don_attack',
    name: 'Estocada',
    description: 'Ataque básico con la lanza',
    type: 'attack',
    sin: 'WRATH',
    cost: 0,
    cooldown: 0,
    power: 10,
    spCost: 0,
    hits: 1,
    targetType: 'single_enemy',
    effects: [],
    levelReq: 1,
  },
  {
    id: 'don_shield',
    name: 'Protección',
    description: 'Se protege con su escudo',
    type: 'buff',
    sin: 'GLUTTONY',
    cost: 0,
    cooldown: 0,
    power: 0,
    spCost: 6,
    targetType: 'self',
    effects: [
      { type: 'shield', value: 12, turns: 2 },
    ],
    levelReq: 1,
  },
  {
    id: 'don_charge',
    name: 'Carga de Rocinante',
    description: 'Embestida que golpea a todos los enemigos',
    type: 'attack',
    sin: 'PRIDE',
    cost: 1,
    cooldown: 2,
    power: 7,
    spCost: 10,
    hits: 1,
    targetType: 'all_enemies',
    effects: [],
    levelReq: 1,
  },
  {
    id: 'don_ego',
    name: 'E.G.O: La Sangre de Sancho',
    description: 'Estocada devastadora que perfora al enemigo',
    type: 'ego',
    sin: 'WRATH',
    cost: 3,
    cooldown: 5,
    power: 32,
    spCost: 30,
    hits: 3,
    targetType: 'single_enemy',
    effects: [
      { type: 'bleed', value: 5, turns: 3 },
    ],
    levelReq: 2,
    isEgo: true,
  },
  {
    id: 'don_thrust',
    name: 'Perforación',
    description: 'Estocada perforante que causa sangrado',
    type: 'attack',
    sin: 'WRATH',
    cost: 1,
    cooldown: 2,
    power: 14,
    spCost: 14,
    hits: 1,
    targetType: 'single_enemy',
    effects: [
      { type: 'bleed', value: 3, turns: 2 },
    ],
    levelReq: 3,
  },
  {
    id: 'don_buff',
    name: 'Grito de Batalla',
    description: 'Aumenta su propio ataque',
    type: 'buff',
    sin: 'PRIDE',
    cost: 2,
    cooldown: 3,
    power: 0,
    spCost: 16,
    targetType: 'self',
    effects: [
      { type: 'atk_up', value: 1.3, turns: 3 },
    ],
    levelReq: 5,
  },
  {
    id: 'don_final',
    name: 'Lanza Final',
    description: 'Poderoso ataque perforante con sangrado',
    type: 'attack',
    sin: 'WRATH',
    cost: 2,
    cooldown: 3,
    power: 22,
    spCost: 20,
    hits: 1,
    targetType: 'single_enemy',
    effects: [
      { type: 'bleed', value: 4, turns: 3 },
    ],
    levelReq: 7,
  },
];

// ---------------------------------------------------------------
// Skills de Jia Huan
// ---------------------------------------------------------------
const _JIA_SKILLS = [
  {
    id: 'jia_attack',
    name: 'Golpe',
    description: 'Ataque básico con su bastón',
    type: 'attack',
    sin: 'GLOOM',
    cost: 0,
    cooldown: 0,
    power: 7,
    spCost: 0,
    hits: 1,
    targetType: 'single_enemy',
    effects: [],
    levelReq: 1,
  },
  {
    id: 'jia_taunt',
    name: 'Provocación',
    description: 'Atrae la atención enemiga y se protege',
    type: 'buff',
    sin: 'LUST',
    cost: 0,
    cooldown: 0,
    power: 0,
    spCost: 6,
    targetType: 'self',
    effects: [
      { type: 'taunt', value: 0, turns: 2 },
      { type: 'shield', value: 10, turns: 2 },
    ],
    levelReq: 1,
  },
  {
    id: 'jia_aoe',
    name: 'Onda Expansiva',
    description: 'Daña a todos los enemigos y los debilita',
    type: 'attack',
    sin: 'ENVY',
    cost: 1,
    cooldown: 2,
    power: 5,
    spCost: 10,
    hits: 1,
    targetType: 'all_enemies',
    effects: [
      { type: 'weakness', value: 0.8, turns: 2 },
    ],
    levelReq: 1,
  },
  {
    id: 'jia_ego',
    name: 'E.G.O: Abrazo de las Sombras',
    description: 'Daña a todos y protege al equipo',
    type: 'ego',
    sin: 'GLOOM',
    cost: 3,
    cooldown: 5,
    power: 16,
    spCost: 30,
    hits: 2,
    targetType: 'all_enemies',
    effects: [
      { type: 'shield_all', value: 15, turns: 2 },
    ],
    levelReq: 2,
    isEgo: true,
  },
  {
    id: 'jia_shield',
    name: 'Fortaleza',
    description: 'Refuerza su defensa con un escudo',
    type: 'buff',
    sin: 'GLUTTONY',
    cost: 1,
    cooldown: 2,
    power: 0,
    spCost: 10,
    targetType: 'self',
    effects: [
      { type: 'shield', value: 20, turns: 2 },
    ],
    levelReq: 3,
  },
  {
    id: 'jia_def_up',
    name: 'Postura Defensiva',
    description: 'Aumenta su defensa considerablemente',
    type: 'buff',
    sin: 'GLUTTONY',
    cost: 1,
    cooldown: 3,
    power: 0,
    spCost: 14,
    targetType: 'self',
    effects: [
      { type: 'def_up', value: 1.5, turns: 3 },
    ],
    levelReq: 5,
  },
  {
    id: 'jia_heavy',
    name: 'Terremoto',
    description: 'Golpe masivo que daña y debilita a todos',
    type: 'attack',
    sin: 'ENVY',
    cost: 2,
    cooldown: 3,
    power: 10,
    spCost: 20,
    hits: 1,
    targetType: 'all_enemies',
    effects: [
      { type: 'weakness', value: 0.7, turns: 2 },
    ],
    levelReq: 7,
  },
];

// ---------------------------------------------------------------
// Skills de Queen of Hatred
// ---------------------------------------------------------------
const _QUEEN_SKILLS = [
  {
    id: 'queen_heal',
    name: 'Cura',
    description: 'Cura al aliado más herido',
    type: 'buff',
    sin: 'SLOTH',
    cost: 0,
    cooldown: 0,
    power: 0,
    spCost: 6,
    targetType: 'self',
    effects: [
      { type: 'heal_ally', value: 25 },
    ],
    levelReq: 1,
  },
  {
    id: 'queen_attack',
    name: 'Bala Mágica',
    description: 'Dispara un proyectil mágico',
    type: 'attack',
    sin: 'LUST',
    cost: 0,
    cooldown: 0,
    power: 9,
    spCost: 0,
    hits: 1,
    targetType: 'single_enemy',
    effects: [],
    levelReq: 1,
  },
  {
    id: 'queen_aoe',
    name: 'Explosión Emocional',
    description: 'Libera su ira en una explosión',
    type: 'attack',
    sin: 'WRATH',
    cost: 1,
    cooldown: 2,
    power: 7,
    spCost: 12,
    hits: 1,
    targetType: 'all_enemies',
    effects: [],
    levelReq: 1,
  },
  {
    id: 'queen_ego',
    name: 'E.G.O: Bendición de la Reina',
    description: 'Cura y protege al equipo mientras daña',
    type: 'ego',
    sin: 'PRIDE',
    cost: 3,
    cooldown: 5,
    power: 14,
    spCost: 30,
    hits: 2,
    targetType: 'all_enemies',
    effects: [
      { type: 'heal_all', value: 20 },
      { type: 'shield_all', value: 10, turns: 2 },
    ],
    levelReq: 2,
    isEgo: true,
  },
  {
    id: 'queen_cleanse',
    name: 'Purificación',
    description: 'Elimina debuffs de todos los aliados',
    type: 'buff',
    sin: 'SLOTH',
    cost: 1,
    cooldown: 3,
    power: 0,
    spCost: 14,
    targetType: 'self',
    effects: [
      { type: 'cleanse', value: 0 },
    ],
    levelReq: 3,
  },
  {
    id: 'queen_buff',
    name: 'Bendición del Amor',
    description: 'Cura a todos y aumenta su ataque',
    type: 'buff',
    sin: 'PRIDE',
    cost: 2,
    cooldown: 4,
    power: 0,
    spCost: 18,
    targetType: 'self',
    effects: [
      { type: 'heal_all', value: 15 },
      { type: 'atk_up_all', value: 1.2, turns: 2 },
    ],
    levelReq: 5,
  },
  {
    id: 'queen_ultimate',
    name: 'Juicio Final',
    description: 'Poderoso ataque que cura masivamente al equipo',
    type: 'ego',
    sin: 'PRIDE',
    cost: 3,
    cooldown: 5,
    power: 18,
    spCost: 30,
    hits: 2,
    targetType: 'all_enemies',
    effects: [
      { type: 'heal_all', value: 30 },
    ],
    levelReq: 7,
    isEgo: true,
  },
];

// ================================================================
// OBJETO GAME_DATA — Fuente única de verdad para todo el juego
// ================================================================
const GAME_DATA = {

  // ==============================================================
  // 1. CONFIGURACIÓN GENERAL
  // ==============================================================
  // Resolución, colores, tipos de nodo, dificultad.
  config: {
    // --- Resolución de pantalla ---
    WIDTH: 1280,
    HEIGHT: 720,
    BG_COLOR: 0x0a0a0f,

    // --- Colores del juego ---
    COLORS: {
      HP: 0xe04040,
      HP_BG: 0x331111,
      SP: 0x4080e0,
      SP_BG: 0x112233,
      GOLD: 0xffd700,
      WHITE: 0xffffff,
      BLACK: 0x000000,
      TEXT: 0xcccccc,
      TEXT_DIM: 0x666666,
      TEXT_BRIGHT: 0xffffff,
      PANEL: 0x1a1a2e,
      PANEL_BORDER: 0x2a2a4e,
      BUTTON: 0x2a1a3e,
      BUTTON_HOVER: 0x3a2a5e,
      ENEMY: 0xcc3333,
      PARTY: 0x33cc66,
      NEUTRAL: 0x888888,
      RARE: 0x4488ff,
      SIN_WRATH: 0xcc3333,
      SIN_LUST: 0xcc66cc,
      SIN_SLOTH: 0x88aa44,
      SIN_GLOOM: 0x4444aa,
      SIN_GLUTTONY: 0x88cc44,
      SIN_PRIDE: 0xdddd44,
      SIN_ENVY: 0x44aaaa,
    },

    // --- Tipos de nodo del mapa ---
    NODE_TYPES: {
      COMBAT:   { label: 'Combate',  color: 0xcc4444, icon: '\u{1F525}' },
      ELITE:    { label: '\u00c9lite', color: 0xcc44cc, icon: '\u26A0\uFE0F' },
      REST:     { label: 'Descanso', color: 0x4488cc, icon: '\u{1F6CC}' },
      TREASURE: { label: 'Tesoro',   color: 0xccaa44, icon: '\u{1F4E6}' },
      EVENT:    { label: 'Evento',   color: 0x44cc88, icon: '\u{1F3AD}' },
      BOSS:     { label: 'Jefe',     color: 0xcc2222, icon: '\u{1F451}' },
    },

    // --- Multiplicadores de dificultad ---
    // Afectan HP, daño y recompensas por zona y tipo de enemigo.
    DIFFICULTY: {
      ZONE1: { hpMult: 0.8, dmgMult: 0.7, rewardMult: 1.0 },
      ZONE2: { hpMult: 1.0, dmgMult: 1.0, rewardMult: 1.3 },
      BOSS:  { hpMult: 1.5, dmgMult: 1.3, rewardMult: 2.0 },
    },
  },

  // ==============================================================
  // 2. MOVIMIENTOS / SKILLS
  // ==============================================================
  //
  // TIPOS DE SKILL (skill.type):
  //   attack   → Daño a uno o más enemigos. Usa power + ATK del usuario.
  //   buff     → Mejora stats del usuario o aliados (escudo, atk_up, etc.).
  //   debuff   → Aplica efectos negativos al enemigo (bleed, weakness, sp_drain).
  //   heal     → Cura HP al usuario o aliado.
  //   hybrid   → Combina daño a un enemigo + cura/efecto a un aliado.
  //   ego      → Habilidad definitiva. Multiplica power, tiene animación E.G.O.
  //
  // TIPOS DE OBJETIVO (skill.targetType):
  //   self             → Se aplica al usuario (efectos en skill.effects).
  //   single_enemy     → Un enemigo. Recibe daño + efectos ofensivos.
  //   all_enemies      → Todos los enemigos. Reciben daño + efectos ofensivos.
  //   single_character → Un aliado. Recibe cura/efecto (no daño).
  //   all_characters   → Todos los aliados. Reciben cura/efecto (no daño).
  //
  // ESTRUCTURA DE UN SKILL:
  //   id:         string único
  //   name:       nombre visible
  //   description:texto de ayuda que se muestra en el panel
  //   type:       attack|buff|debuff|heal|hybrid|ego
  //   sin:        WRATH|LUST|SLOTH|GLOOM|GLUTTONY|PRIDE|ENVY
  //   cost:       usos por combate (se consume al usar)
  //   cooldown:   turnos antes de poder reusarse
  //   power:      daño base (antes de stats y multiplicadores)
  //   spCost:     SP requerido para usar
  //   hits:       número de golpes por uso
  //   targetType: self|single_enemy|all_enemies|single_character|all_characters
  //   effects[]:  efectos adicionales (ver abajo)
  //   levelReq:   nivel mínimo del personaje para desbloquear
  //   isEgo:      true si es habilidad E.G.O. (opcional)
  //
  // EFECTOS (skill.effects[].type):
  //   heal       → Cura HP al objetivo del skill (target recibe cura).
  //   heal_ally  → Cura al aliado vivo con menos HP (usado en hybrid/attack).
  //   heal_all   → Cura a todos los aliados vivos (usado en E.G.O).
  //   shield     → Otorga escudo que absorbe daño por N turnos.
  //               └─ value: cantidad, turns: duración.
  //   bleed      → Daño por turno al objetivo.
  //               └─ value: daño por tick, turns: duración.
  //   weakness   → Reduce el ataque del objetivo.
  //               └─ value: reducción, turns: duración.
  //   atk_up     → Aumenta el ataque del aliado.
  //               └─ value: bonus, turns: duración.
  //   sp_drain   → Drena SP del objetivo (reduce su SP).
  //               └─ value: cantidad a drenar.
  //   stat_up    → Aumenta permanentemente una stat (eventos/tesoros).
  //               └─ stat: maxHp|maxSp|atk|def|spd, value: cantidad.
  //   nothing    → Sin efecto (usado en opciones de evento).
  //   random_reward → Otorga recompensa aleatoria (eventos).
  //   sp_heal_all  → Recupera SP a todos los aliados (eventos).
  //
  // Cada personaje y enemigo usa skills definidas aquí.
  // Los personajes referencian su array de skills directamente.
  skills: {
    don_quixote: _DON_SKILLS,
    jia_huan: _JIA_SKILLS,
    queen_of_hatred: _QUEEN_SKILLS,
    enemy: _ENEMY_SKILLS,
  },

  // ==============================================================
  // 3. PERSONAJES DEL GRUPO
  // ==============================================================
  // skills: array inline que referencia las skills definidas arriba.
  characters: {
    don_quixote: {
      id: 'don_quixote',
      name: 'Don Quixote',
      title: 'La Caballera Andante',
      className: 'DPS',
      description: 'Una caballera idealista que lucha con pasión. Sus estocadas perforan al enemigo.',
      sprite: 'don_quixote.png',
      portrait: 'don_quixote.png',
      baseStats: { maxHp: 70, maxSp: 40, atk: 12, def: 6, spd: 7 },
      skills: _DON_SKILLS,
      sinAffinity: 'WRATH',
      color: 0xcc3333,
    },
    jia_huan: {
      id: 'jia_huan',
      name: 'Jia Huan',
      title: 'El Elegante del Pabellón',
      className: 'Tanque',
      description: 'Un erudito que atrae la atención enemiga y protege al equipo con su resistencia.',
      sprite: 'jia_huan.png',
      portrait: 'jia_huan.png',
      baseStats: { maxHp: 85, maxSp: 40, atk: 7, def: 9, spd: 5 },
      skills: _JIA_SKILLS,
      sinAffinity: 'GLOOM',
      color: 0x4444aa,
    },
    queen_of_hatred: {
      id: 'queen_of_hatred',
      name: 'Queen of Hatred',
      title: 'La Reina del Odio',
      className: 'Support',
      description: 'Una Abnormality que alterna entre amor y odio. Cura, protege y elimina debuffs.',
      sprite: 'queen_of_hatred.png',
      portrait: 'queen_of_hatred.png',
      baseStats: { maxHp: 55, maxSp: 70, atk: 9, def: 4, spd: 4 },
      skills: _QUEEN_SKILLS,
      sinAffinity: 'LUST',
      color: 0xcc66cc,
    },
  },

  // ==============================================================
  // 4. ENEMIGOS
  // ==============================================================
  // skills: array de IDs que existen en GAME_DATA.skills.enemy.
  // zone:   número de zona donde aparecen.
  // tier:   'normal', 'elite' o 'boss'.
  enemies: {
    // --- Zona 1: Backstreets ---
    hooligan1: {
      id: 'hooligan1',
      name: 'Pandillero',
      sprite: 'hooligan1.png',
      baseStats: { maxHp: 30, maxSp: 20, atk: 6, def: 2, spd: 5 },
      skills: ['enemy_attack'],
      zone: 1,
      tier: 'normal',
      color: 0xcc6644,
    },
    hooligan2: {
      id: 'hooligan2',
      name: 'Matón',
      sprite: 'hooligan2.png',
      baseStats: { maxHp: 35, maxSp: 20, atk: 7, def: 3, spd: 4 },
      skills: ['enemy_attack', 'enemy_heavy'],
      zone: 1,
      tier: 'normal',
      color: 0xcc4444,
    },
    hooligan3: {
      id: 'hooligan3',
      name: 'Cabecilla',
      sprite: 'hooligan3.png',
      baseStats: { maxHp: 40, maxSp: 25, atk: 8, def: 4, spd: 6 },
      skills: ['enemy_attack', 'enemy_heavy', 'enemy_buff'],
      zone: 1,
      tier: 'elite',
      color: 0xcc2222,
    },
    bloodbag: {
      id: 'bloodbag',
      name: 'Bolsa de Sangre',
      sprite: 'bloodbag.png',
      baseStats: { maxHp: 25, maxSp: 15, atk: 5, def: 1, spd: 3 },
      skills: ['enemy_attack'],
      zone: 1,
      tier: 'normal',
      color: 0xaa3333,
    },
    fanghunt: {
      id: 'fanghunt',
      name: 'Cazador Colmillo',
      sprite: 'fanghunt.png',
      baseStats: { maxHp: 45, maxSp: 25, atk: 9, def: 3, spd: 7 },
      skills: ['enemy_attack', 'enemy_bleed', 'enemy_aoe'],
      zone: 1,
      tier: 'elite',
      color: 0x884422,
    },

    // --- Zona 2: The Nest ---
    kcorp_class3: {
      id: 'kcorp_class3',
      name: 'Clase 3 K Corp.',
      sprite: 'kcorp_class3.png',
      baseStats: { maxHp: 50, maxSp: 30, atk: 10, def: 5, spd: 6 },
      skills: ['enemy_attack', 'enemy_heavy', 'enemy_buff'],
      zone: 2,
      tier: 'normal',
      color: 0x4488cc,
    },
    kcorp_employee: {
      id: 'kcorp_employee',
      name: 'Empleado K Corp.',
      sprite: 'kcorp_employee.png',
      baseStats: { maxHp: 55, maxSp: 30, atk: 11, def: 6, spd: 5 },
      skills: ['enemy_attack', 'enemy_aoe'],
      zone: 2,
      tier: 'normal',
      color: 0x4488aa,
    },
    failure: {
      id: 'failure',
      name: 'Fracaso',
      sprite: 'failure.png',
      baseStats: { maxHp: 60, maxSp: 20, atk: 12, def: 3, spd: 3 },
      skills: ['enemy_attack', 'enemy_heavy', 'enemy_aoe'],
      zone: 2,
      tier: 'elite',
      color: 0x886644,
    },
    ghost_bloodfiend: {
      id: 'ghost_bloodfiend',
      name: 'Espectro Vampírico',
      sprite: 'ghost_bloodfiend.png',
      baseStats: { maxHp: 40, maxSp: 40, atk: 13, def: 2, spd: 9 },
      skills: ['enemy_attack', 'enemy_bleed'],
      zone: 2,
      tier: 'normal',
      color: 0x664488,
    },

    // --- Jefes ---
    kromer: {
      id: 'kromer',
      name: 'Kromer',
      sprite: 'kromer.png',
      baseStats: { maxHp: 120, maxSp: 60, atk: 15, def: 7, spd: 8 },
      skills: ['enemy_attack', 'enemy_heavy', 'enemy_aoe', 'enemy_buff'],
      zone: 1,
      tier: 'boss',
      color: 0xcc2266,
      isBoss: true,
    },
    dongbaek: {
      id: 'dongbaek',
      name: 'Dongbaek',
      sprite: 'dongbaek.png',
      baseStats: { maxHp: 150, maxSp: 80, atk: 18, def: 8, spd: 10 },
      skills: ['enemy_attack', 'enemy_heavy', 'enemy_aoe', 'enemy_buff', 'enemy_bleed'],
      zone: 2,
      tier: 'boss',
      color: 0xcc8844,
      isBoss: true,
    },
    ahab: {
      id: 'ahab',
      name: 'Ahab',
      sprite: 'ahab.png',
      baseStats: { maxHp: 200, maxSp: 100, atk: 22, def: 10, spd: 12 },
      skills: ['enemy_attack', 'enemy_heavy', 'enemy_aoe', 'enemy_buff', 'enemy_bleed'],
      zone: 3,
      tier: 'boss',
      color: 0x224466,
      isBoss: true,
    },
  },

  // ==============================================================
  // 5. ZONAS
  // ==============================================================
  // Cada zona tiene un multiplicador de dificultad, lista de
  // enemigos y jefe, y un pool de recompensas posibles.
  zones: [
    {
      id: 1,
      name: 'Los Backstreets',
      description: 'Los callejones oscuros donde los débiles son presa de los fuertes.',
      bgColor: 0x0a0a14,
      groundColor: 0x1a1a2e,
      difficulty: 'Casual',
      difficultyMult: 0.8,
      floors: 5,
      enemies: ['hooligan1', 'hooligan2', 'bloodbag'],
      elites: ['hooligan3', 'fanghunt'],
      boss: 'kromer',
      rewards: [
        { type: 'heal', value: 20 },
        { type: 'sp_heal', value: 15 },
        { type: 'stat_up', stat: 'maxHp', value: 8 },
        { type: 'stat_up', stat: 'atk', value: 1 },
        { type: 'stat_up', stat: 'def', value: 1 },
      ],
    },
    {
      id: 2,
      name: 'El Nest',
      description: 'La brillante fachada corporativa esconde experimentos inhumanos.',
      bgColor: 0x0a0a1e,
      groundColor: 0x1a1a3e,
      difficulty: 'Normal',
      difficultyMult: 1.0,
      floors: 6,
      enemies: ['kcorp_class3', 'kcorp_employee', 'ghost_bloodfiend'],
      elites: ['failure', 'fanghunt'],
      boss: 'dongbaek',
      rewards: [
        { type: 'heal', value: 25 },
        { type: 'sp_heal', value: 20 },
        { type: 'stat_up', stat: 'maxHp', value: 10 },
        { type: 'stat_up', stat: 'atk', value: 2 },
        { type: 'stat_up', stat: 'def', value: 2 },
        { type: 'stat_up', stat: 'spd', value: 1 },
      ],
    },
    {
      id: 3,
      name: 'El Gran Lago',
      description: 'Aguas traicioneras habitadas por piratas y criaturas del abismo.',
      bgColor: 0x040414,
      groundColor: 0x0a0a2e,
      difficulty: 'Desafiante',
      difficultyMult: 1.3,
      floors: 7,
      enemies: ['kcorp_employee', 'ghost_bloodfiend', 'failure'],
      elites: ['failure', 'hooligan3'],
      boss: 'ahab',
      rewards: [
        { type: 'heal', value: 30 },
        { type: 'sp_heal', value: 25 },
        { type: 'stat_up', stat: 'maxHp', value: 12 },
        { type: 'stat_up', stat: 'atk', value: 3 },
        { type: 'stat_up', stat: 'def', value: 3 },
        { type: 'stat_up', stat: 'spd', value: 2 },
      ],
    },
  ],

  // ==============================================================
  // 6. EVENTOS
  // ==============================================================
  // Aparecen en nodos EVENT del mapa.
  // options: lista de opciones que el jugador puede elegir.
  // minZone: zona mínima en la que puede aparecer.
  events: [
    {
      id: 'merchant',
      name: 'Mercader Misterioso',
      description: 'Un mercader encapuchado te ofrece un trato...',
      options: [
        { text: 'Comprar reliquia (10 HP)', effect: { type: 'relic', relic: 'Daga Afilada', stat: 'atk', value: 2, cost: 'hp', costValue: 10 } },
        { text: 'Rechazar y seguir', effect: { type: 'nothing' } },
      ],
      minZone: 1,
    },
    {
      id: 'fountain',
      name: 'Fuente de Luz Pálida',
      description: 'Una fuente extraña brilla en la oscuridad. El agua parece curativa.',
      options: [
        { text: 'Beber el agua', effect: { type: 'heal_all', value: 25 } },
        { text: 'Ignorarla', effect: { type: 'nothing' } },
      ],
      minZone: 1,
    },
    {
      id: 'shrine',
      name: 'Santuario de los Pecados',
      description: 'Un altar con símbolos de pecados. Ofrecer tu vitalidad te dará poder.',
      options: [
        { text: 'Ofrecer 20 HP por ataque +3', effect: { type: 'trade_hp_for_stat', hpCost: 20, stat: 'atk', value: 3 } },
        { text: 'Ofrecer 15 HP por velocidad +2', effect: { type: 'trade_hp_for_stat', hpCost: 15, stat: 'spd', value: 2 } },
        { text: 'Alejarse', effect: { type: 'nothing' } },
      ],
      minZone: 1,
    },
    {
      id: 'training',
      name: 'Fantasma del Pasado',
      description: 'Un espectro con tu forma te desafía a un duelo de entrenamiento.',
      options: [
        { text: 'Aceptar el duelo (sin riesgo)', effect: { type: 'stat_up_all', stat: 'atk', value: 1 } },
        { text: 'Rechazar', effect: { type: 'nothing' } },
      ],
      minZone: 1,
    },
    {
      id: 'abnormality',
      name: 'Abnormality Atrapada',
      description: 'Una Abnormality está atrapada en una cápsula. Podrías liberarla... o no.',
      options: [
        { text: 'Liberarla (podría ayudar...)', effect: { type: 'random_reward' } },
        { text: 'Ignorarla', effect: { type: 'nothing' } },
      ],
      minZone: 2,
    },
    {
      id: 'elder',
      name: 'Sabio del Callejón',
      description: 'Un anciano te ofrece sabiduría a cambio de escuchar su historia.',
      options: [
        { text: 'Escuchar (recuperas SP)', effect: { type: 'sp_heal_all', value: 15 } },
        { text: 'No tienes tiempo', effect: { type: 'nothing' } },
      ],
      minZone: 1,
    },
    {
      id: 'chest',
      name: 'Cofre Olvidado',
      description: 'Un cofre polvoriento reposa en la esquina. Podría tener algo útil.',
      options: [
        { text: 'Abrirlo', effect: { type: 'random_reward_small' } },
        { text: 'Parece una trampa, seguir', effect: { type: 'nothing' } },
      ],
      minZone: 1,
    },
  ],

  // ==============================================================
  // 7. OPCIONES DE DESCANSO (RestScene)
  // ==============================================================
  // Valores usados en la escena de descanso (hoguera).
  // base:     valor base de curación/SP.
  // perLevel: valor adicional por nivel del personaje.
  rest_options: {
    heal:     { base: 20, perLevel: 5,  label: 'DESCANSAR' },
    meditate: { base: 15, perLevel: 3,  label: 'MEDITAR' },
    train:    {
      label: 'ENTRENAR',
      options: [
        { stat: 'atk', value: 1, label: 'Ataque' },
        { stat: 'def', value: 1, label: 'Defensa' },
        { stat: 'spd', value: 1, label: 'Velocidad' },
      ],
    },
  },

  // ==============================================================
  // 8. TESOROS / RELIQUIAS
  // ==============================================================
  // Objetos pasivos que se obtienen en las salas de tesoro.
  // Al seleccionar uno, se aplica su efecto a todo el grupo.
  //
  // Tipos de efecto (effect.type):
  //   stat_up            → bonus permanente a una stat (atk|def|spd|maxHp|maxSp)
  //   sp_regen_bonus     → SP regenerado por turno adicional
  //   crit_chance        → +X% probabilidad de crítico
  //   heal_on_kill       → cura X HP al matar un enemigo
  //   sp_on_kill         → restaura X SP al matar un enemigo
  //   sp_cost_reduce     → reduce el coste de SP de todas las habilidades X%
  //   sin_damage         → +X% daño con un pecado específico (sin: WRATH|GLOOM|etc.)
  //   battle_start_shield → otorga escudo al iniciar combate
  //   lifesteal          → cura X% del daño infligido
  //   heal_amp           → +X% curación recibida
  //   dodge_chance       → X% probabilidad de esquivar daño
  //   low_hp_damage      → +X% daño si el enemigo tiene < 50% HP
  //   sin_chain_damage   → +X% daño por cada resonancia en cadena
  //   battle_start_ego   → carga EGO adicional al iniciar combate
  //   battle_start_spd   → SPD adicional al iniciar combate
  //
  // Rarezas: común (gris), raro (azul), legendario (dorado)
  treasures: [
    // ── COMUNES (12) ──
    {
      id: 'dagger',
      name: 'Daga Afilada',
      description: 'Una daga con filo sobrenatural. ATK +3 para todo el grupo.',
      effect: { type: 'stat_up', stat: 'atk', value: 3 },
      rarity: 'común',
      icon: '\u{1F5E1}\uFE0F',
    },
    {
      id: 'amulet',
      name: 'Amuleto de Protección',
      description: 'Un amuleto que fortalece las defensas. DEF +2.',
      effect: { type: 'stat_up', stat: 'def', value: 2 },
      rarity: 'común',
      icon: '\u{1F4FF}',
    },
    {
      id: 'speed_boots',
      name: 'Botas Veloces',
      description: 'Botas ligeras que aumentan la velocidad. SPD +1.',
      effect: { type: 'stat_up', stat: 'spd', value: 1 },
      rarity: 'común',
      icon: '\u{1F45F}',
    },
    {
      id: 'vital_core',
      name: 'Núcleo Vital',
      description: 'Un corazón de cristal rojo latiente. MAX HP +15.',
      effect: { type: 'stat_up', stat: 'maxHp', value: 15 },
      rarity: 'común',
      icon: '\u{2764}\uFE0F\u200D\u{1F525}',
    },
    {
      id: 'iron_badge',
      name: 'Voluntad de Hierro',
      description: 'Insignia de un Fixer veterano. ATK +1 y DEF +1.',
      effect: { type: 'stat_up', stat: 'atk', value: 1, secondary: { stat: 'def', value: 1 } },
      rarity: 'común',
      icon: '\u{1F3F7}\uFE0F',
    },
    {
      id: 'focus_ring',
      name: 'Anillo de Enfoque',
      description: 'Un anillo con un sello de la N Corp. SP +2 por turno.',
      effect: { type: 'sp_regen_bonus', value: 3 },
      rarity: 'común',
      icon: '\u{1F48D}',
    },
    {
      id: 'boxing_tape',
      name: 'Cinta de Boxeo',
      description: 'Guantes de boxeo de los Hooligan. +6% prob. de crítico.',
      effect: { type: 'crit_chance', value: 6 },
      rarity: 'común',
      icon: '\u{1F94A}',
    },
    {
      id: 'battle_bandages',
      name: 'Vendas de Combate',
      description: 'Vendas empapadas de sangre. +8 HP al matar un enemigo.',
      effect: { type: 'heal_on_kill', value: 8 },
      rarity: 'común',
      icon: '\u{1FA79}',
    },
    {
      id: 'soul_pendant',
      name: 'Colgante de Almas',
      description: 'Almas atrapadas en un colgante. +8 SP al matar un enemigo.',
      effect: { type: 'sp_on_kill', value: 8 },
      rarity: 'común',
      icon: '\u{1F52E}',
    },
    {
      id: 'light_feather',
      name: 'Pluma de Luz',
      description: 'Pluma del Ángel de la Música. -15% coste de SP.',
      effect: { type: 'sp_cost_reduce', value: 15 },
      rarity: 'común',
      icon: '\u{1FAB6}',
    },
    {
      id: 'wrath_stone',
      name: 'Piedra de Ira',
      description: 'Runa de ira incandescente. +15% daño WRATH.',
      effect: { type: 'sin_damage', sin: 'WRATH', value: 15 },
      rarity: 'común',
      icon: '\u{1F30B}',
    },
    {
      id: 'gloom_tear',
      name: 'Lágrima de Melancolía',
      description: 'Lágrima congelada de una Abnormality. +15% daño GLOOM.',
      effect: { type: 'sin_damage', sin: 'GLOOM', value: 15 },
      rarity: 'común',
      icon: '\u{1F4A7}',
    },

    // ── RAROS (6) ──
    {
      id: 'crystal_shield',
      name: 'Escudo de Cristal',
      description: 'Un escudo facetado de la K Corp. +18 escudo al iniciar combate.',
      effect: { type: 'battle_start_shield', value: 18 },
      rarity: 'raro',
      icon: '\u{1F4A0}',
    },
    {
      id: 'blood_lance',
      name: 'Lanza de Sangre',
      description: 'Tridente de los Bloodfiend. Cura 12% del daño infligido.',
      effect: { type: 'lifesteal', value: 12 },
      rarity: 'raro',
      icon: '\u{1F531}',
    },
    {
      id: 'love_chalice',
      name: 'Cáliz de Amor',
      description: 'Rosa negra en un cáliz de plata. +25% curación recibida.',
      effect: { type: 'heal_amp', value: 25 },
      rarity: 'raro',
      icon: '\u{1F940}',
    },
    {
      id: 'mist_cloak',
      name: 'Capa de Niebla',
      description: 'Capa de las Brumas del Gran Lago. 10% de esquivar daño.',
      effect: { type: 'dodge_chance', value: 10 },
      rarity: 'raro',
      icon: '\u{1F32B}\uFE0F',
    },
    {
      id: 'lion_heart',
      name: 'Corazón de León',
      description: 'Medallón del León del Sur. +22% daño si enemigo < 50% HP.',
      effect: { type: 'low_hp_damage', value: 22 },
      rarity: 'raro',
      icon: '\u{1F981}',
    },
    {
      id: 'sin_star',
      name: 'Estrella de Pecado',
      description: 'Estrella de 7 puntas. +8% daño por cada resonancia en cadena.',
      effect: { type: 'sin_chain_damage', value: 8 },
      rarity: 'raro',
      icon: '\u{2B50}',
    },

    // ── LEGENDARIOS (2) ──
    {
      id: 'fragmented_ego',
      name: 'E.G.O Fragmentado',
      description: 'Espiral de E.G.O distorsionada. +30 carga E.G.O al iniciar combate.',
      effect: { type: 'battle_start_ego', value: 30 },
      rarity: 'legendario',
      icon: '\u{1F300}',
    },
    {
      id: 'hourglass',
      name: 'Reloj de Arena',
      description: 'Reloj del Tiempo del Desierto. SPD +3 permanente.',
      effect: { type: 'stat_up', stat: 'spd', value: 3 },
      rarity: 'legendario',
      icon: '\u{231B}',
    },
  ],

  // ==============================================================
  // 9. BENDICIONES (para futuro sistema)
  // ==============================================================
  // Las bendiciones son mejoras permanentes que el jugador puede
  // acumular entre partidas (meta-progresión).
  // Por ahora es un placeholder listo para expandir.
  blessings: [
    // Ejemplo de estructura:
    // {
    //   id: 'blessing_wrath',
    //   name: 'Bendición de la Ira',
    //   description: 'Los ataques WRATH hacen +20% de daño.',
    //   effect: { type: 'sin_bonus', sin: 'WRATH', value: 1.2 },
    //   cost: 100,  // monedas de bendición
    //   maxLevel: 3,
    // },
  ],

  // ==============================================================
  // 10. RECOMPENSAS ALEATORIAS
  // ==============================================================
  // Tablas de recompensa para eventos tipo "random_reward".
  // big:   usado por eventos de abnormality.
  // small: usado por cofres.
  random_rewards: {
    big: [
      { type: 'heal_all',   min: 5,  max: 15, msg: '\u00a1Todos curaron {value} HP!' },
      { type: 'stat_up_all', stat: 'atk', min: 1, max: 3, msg: '\u00a1Ataque +{value} para todos!' },
      { type: 'sp_heal_all', min: 10, max: 25, msg: '\u00a1Todos recuperaron {value} SP!' },
    ],
    small: [
      { type: 'heal_all',   min: 5,  max: 10, msg: 'Conten\u00eda pociones: +{value} HP.' },
      { type: 'sp_heal_all', min: 5,  max: 15, msg: 'Conten\u00eda estuches: +{value} SP.' },
      { type: 'nothing', msg: 'Estaba vac\u00edo. Suerte para la pr\u00f3xima.' },
    ],
  },

  // ==============================================================
  // 11. CONFIGURACIÓN DE PARTIDA
  // ==============================================================
  // Determina con qué personajes y nivel empieza el jugador.
  party_config: {
    initial_characters: ['don_quixote', 'jia_huan', 'queen_of_hatred'],
    initial_level: 1,
  },

  // ==============================================================
  // 12. SISTEMA DE NIVELES Y XP
  // ==============================================================
  // Controla la progresión de los personajes.
  // xp_per_level:   XP necesario para alcanzar cada nivel (índice 0 = nivel 1->2).
  // xp_per_kill:    XP base otorgado por cada enemigo según su rareza.
  // boss_mult:      Multiplicador de XP para jefes de zona.
  xp_config: {
    max_level: 10,
    xp_per_level: [30, 50, 70, 100, 130, 160, 200, 250, 300],
    xp_per_kill: { normal: 20, elite: 40, boss: 80 },
    boss_mult: 1.5,
  },

};

// ================================================================
// Exportación global
// ================================================================
window.GAME_DATA = GAME_DATA;
