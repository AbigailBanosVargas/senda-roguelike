const fs = require('fs');
const path = require('path');

const BG_DIR = path.join(__dirname, '..', 'assets', 'bg');

const FILES = [
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

const AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const HEADERS = { 'User-Agent': AGENT, 'Accept': '*/*', 'Accept-Language': 'en-US,en;q=0.9' };

async function apiGet(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`API HTTP ${res.status}`);
  return res.json();
}

async function download(url, dest) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
}

(async () => {
  if (!fs.existsSync(BG_DIR)) fs.mkdirSync(BG_DIR, { recursive: true });

  const titles = FILES.map(f => `File:${f}`).join('|');
  const apiUrl = `https://limbuscompany.wiki.gg/api.php?action=query&format=json&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url`;
  const json = await apiGet(apiUrl);
  const pages = json.query.pages;

  for (const [id, info] of Object.entries(pages)) {
    if (id === '-1') continue;
    const fileName = info.title.replace('File:', '');
    const dest = path.join(BG_DIR, fileName);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`\u2713 ${fileName} ya existe`);
      continue;
    }
    const imageUrl = info.imageinfo?.[0]?.url;
    if (!imageUrl) { console.error(`  \u2717 ${fileName}: sin URL`); continue; }
    console.log(`Descargando ${fileName}...`);
    try {
      await download(imageUrl, dest);
      const size = fs.statSync(dest).size;
      console.log(`  \u2713 ${(size / 1024 / 1024).toFixed(1)} MB`);
    } catch (e) {
      console.error(`  \u2717 Error: ${e.message}`);
    }
  }

  console.log('Listo!');
})();
