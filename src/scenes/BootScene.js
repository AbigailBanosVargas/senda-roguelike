class BootScene {
  constructor(app) {
    this.app = app;
    this.container = new PIXI.Container();
    this.loaded = false;
    this.progress = 0;
    this.sprites = {};
  }

  async start() {
    this._createUI();
    await this._loadAssets();
    this.loaded = true;
    return this.sprites;
  }

  _createUI() {
    const bg = new PIXI.Graphics();
    bg.beginFill(CONFIG.BG_COLOR);
    bg.drawRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    bg.endFill();
    this.container.addChild(bg);

    const title = new PIXI.Text('SENDAS DEL DESTINO', {
      fontFamily: 'monospace',
      fontSize: 32,
      fill: 0xcc4444,
      stroke: 0x000000,
      strokeThickness: 4,
      letterSpacing: 8,
    });
    title.anchor = new PIXI.Point(0.5, 0.5);
    title.x = CONFIG.WIDTH / 2;
    title.y = CONFIG.HEIGHT / 2 - 60;
    this.container.addChild(title);

    const subtitle = new PIXI.Text('Un Roguelike por Turnos', {
      fontFamily: 'monospace',
      fontSize: 20,
      fill: 0x888888,
      stroke: 0x000000,
      strokeThickness: 2,
    });
    subtitle.anchor = new PIXI.Point(0.5, 0.5);
    subtitle.x = CONFIG.WIDTH / 2;
    subtitle.y = CONFIG.HEIGHT / 2 - 20;
    this.container.addChild(subtitle);

    const barBg = new PIXI.Graphics();
    barBg.beginFill(0x222244);
    barBg.drawRoundedRect(0, 0, 400, 20, 5);
    barBg.endFill();
    barBg.x = CONFIG.WIDTH / 2 - 200;
    barBg.y = CONFIG.HEIGHT / 2 + 30;
    this.container.addChild(barBg);

    this.barFg = new PIXI.Graphics();
    this.barFg.x = CONFIG.WIDTH / 2 - 200;
    this.barFg.y = CONFIG.HEIGHT / 2 + 30;
    this.container.addChild(this.barFg);

    this.loadingText = new PIXI.Text('Cargando...', {
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0x666688,
    });
    this.loadingText.anchor = new PIXI.Point(0.5, 0);
    this.loadingText.x = CONFIG.WIDTH / 2;
    this.loadingText.y = CONFIG.HEIGHT / 2 + 60;
    this.container.addChild(this.loadingText);

    const version = new PIXI.Text('v1.0 - Un juego fan usando assets de Project Moon', {
      fontFamily: 'monospace',
      fontSize: 9,
      fill: 0x444444,
    });
    version.anchor = new PIXI.Point(0.5, 0);
    version.x = CONFIG.WIDTH / 2;
    version.y = CONFIG.HEIGHT - 30;
    this.container.addChild(version);
  }

  async _loadAssets() {
    const filesToLoad = [
      'don_quixote.png',
      'jia_huan.png',
      'queen_of_hatred.png',
      'enemies/hooligan1.png',
      'enemies/hooligan2.png',
      'enemies/hooligan3.png',
      'enemies/bloodbag.png',
      'enemies/fanghunt.png',
      'enemies/kcorp_class3.png',
      'enemies/kcorp_employee.png',
      'enemies/failure.png',
      'enemies/ghost_bloodfiend.png',
      'enemies/kromer.png',
      'enemies/dongbaek.png',
      'enemies/ahab.png',
    ];

    const bgFiles = [
      '4th_Match_Flame_1_BG.png',
      'Alleyway_Watchdog_BG.png',
      'Brazen_Bull_BG.png',
      'Doomsday_Calendar_BG.png',
      'Dreaming_Electric_Sheep_BG.png',
      'Fairy_Festival_BG.png',
      'My_Form_Empties_BG.png',
      'Sign_of_Roses_BG.png',
      'The_Queen_of_Hatred_BG.png',
      'Wellcheers_BG.png',
    ];

    const allFiles = [...filesToLoad, ...bgFiles.map(f => `bg/${f}`)];
    const total = allFiles.length;
    window.battleBgTextures = [];

    for (let i = 0; i < total; i++) {
      const f = allFiles[i];
      const isBg = f.startsWith('bg/');
      const url = isBg ? `assets/${f}` : `assets/sprites/${f}`;
      try {
        let texture;
        if (typeof PIXI.Assets !== 'undefined' && PIXI.Assets.load) {
          texture = await PIXI.Assets.load(url);
        } else {
          texture = PIXI.Texture.from(url);
          await new Promise((resolve, reject) => {
            if (texture.baseTexture.valid) return resolve();
            texture.baseTexture.once('loaded', resolve);
            texture.baseTexture.once('error', reject);
            setTimeout(reject, 5000);
          });
        }
        if (isBg) {
          window.battleBgTextures.push(texture);
        } else {
          const key = f.replace('enemies/', '').replace('.png', '');
          this.sprites[key] = texture;
        }
      } catch (e) {
        console.warn(`Failed to load ${f}:`, e.message);
      }
      this.progress = (i + 1) / total;
      this._updateBar();
      await HELPERS.sleep(30);
    }

    // Cargar fondo del menú principal
    try {
      const menuBgUrl = 'assets/bg/PromoPV.jpg';
      let texture;
      if (typeof PIXI.Assets !== 'undefined' && PIXI.Assets.load) {
        texture = await PIXI.Assets.load(menuBgUrl);
      } else {
        texture = PIXI.Texture.from(menuBgUrl);
        await new Promise((resolve, reject) => {
          if (texture.baseTexture.valid) return resolve();
          texture.baseTexture.once('loaded', resolve);
          texture.baseTexture.once('error', reject);
          setTimeout(reject, 5000);
        });
      }
      window.menuBgTexture = texture;
    } catch (e) {
      console.warn('Failed to load menu background:', e.message);
      window.menuBgTexture = null;
    }

    // Cargar archivos de audio MP3
    const audioFiles = [
      { key: 'exploration', url: 'assets/audio/exploration.mp3' },
      { key: 'combat',      url: 'assets/audio/combat.mp3' },
      { key: 'boss',        url: 'assets/audio/boss.mp3' },
      { key: 'menu',        url: 'assets/audio/menu.mp3' },
    ];
    this.loadingText.text = 'Cargando audio...';
    for (const f of audioFiles) {
      await audio.loadMusic(f.key, f.url);
      this.loadingText.text = `Cargando audio: ${f.key}...`;
      await HELPERS.sleep(30);
    }

    this.loadingText.text = '¡Listo!';
    this._updateBar(1);
    await HELPERS.sleep(500);
  }

  _updateBar() {
    this.barFg.clear();
    this.barFg.beginFill(0xcc4444);
    this.barFg.drawRoundedRect(0, 0, 400 * this.progress, 20, 5);
    this.barFg.endFill();
  }
}
