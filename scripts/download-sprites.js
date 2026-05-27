const https = require('https');
const fs = require('fs');
const path = require('path');

const API = 'https://projectmoon.miraheze.org/w/api.php';

const SPRITES = {
  'sinners': {
    'don_quixote.png': 'File:LCB_DonQuixote_Sprite.webp',
    'jia_huan.png': 'File:JiaHuan-Battle-ContemptAwe.webp',
    'queen_of_hatred.png': 'File:QueenOfHatred-LCB-Battle.webp',
    'don_quixote_old.png': 'File:LCB_DonQuixote_Sprite_Old.webp',
  },
  'enemies': {
    'kcorp_class3.png': 'File:Limbus-KCorp-Class3-Battle.webp',
    'kcorp_employee.png': 'File:Limbus-KCorpEmployee-Battle.webp',
    'hooligan1.png': 'File:Hooligan1Limbus-Sprite.webp',
    'hooligan2.png': 'File:Hooligan2Limbus-Sprite.webp',
    'hooligan3.png': 'File:Hooligan3Limbus-Sprite.webp',
    'bloodbag.png': 'File:Limbus-Bloodbag-Battle.webp',
    'bloodfiend.png': 'File:Limbus-ParadeBloodfiend-Battle.webp',
    'ghost_bloodfiend.png': 'File:Limbus-GhostBloodfiend-Battle.webp',
    'fanghunt.png': 'File:Limbus-FanghuntBloodbag-Battle.webp',
    'failure.png': 'File:Failure-Battle.webp',
    'kromer.png': 'File:Limbus-Kromer-Battle.webp',
    'dongbaek.png': 'File:Limbus-Dongbaek-Spicebush-Battle.webp',
    'ahab.png': 'File:Limbus-Aida-Battle.webp',
  }
};

function apiQuery(params) {
  return new Promise((resolve, reject) => {
    const url = `${API}?${new URLSearchParams(params)}`;
    https.get(url, { headers: { 'User-Agent': 'LimbusRoguelike/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`API parse error: ${data.slice(0,200)}`)); }
      });
    }).on('error', reject);
  });
}

async function getImageUrl(filename) {
  const data = await apiQuery({
    action: 'query',
    titles: filename,
    prop: 'imageinfo',
    iiprop: 'url',
    format: 'json',
  });
  const pages = data.query.pages;
  const pageId = Object.keys(pages)[0];
  if (pageId === '-1' || !pages[pageId].imageinfo) {
    throw new Error(`File not found: ${filename}`);
  }
  return pages[pageId].imageinfo[0].url;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = https.get(url, { headers: { 'User-Agent': 'LimbusRoguelike/1.0' } }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${response.statusCode} for ${url}`));
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    request.on('error', (err) => { file.close(); fs.unlinkSync(dest); reject(err); });
  });
}

async function downloadAll() {
  const baseDir = path.join(__dirname, '..', 'assets', 'sprites');
  const failed = [];

  for (const [category, files] of Object.entries(SPRITES)) {
    const dir = category === 'sinners' ? baseDir : path.join(baseDir, category);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    for (const [localName, wikiFile] of Object.entries(files)) {
      const dest = path.join(dir, localName);
      if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
        console.log(`[SKIP] ${localName} already exists`);
        continue;
      }
      try {
        console.log(`[FETCH] ${wikiFile}...`);
        const url = await getImageUrl(wikiFile);
        console.log(`[DL] ${url}`);
        await downloadFile(url, dest);
        const size = fs.statSync(dest).size;
        console.log(`[OK] ${localName} (${(size/1024).toFixed(1)} KB)`);
      } catch (e) {
        failed.push(`${wikiFile} -> ${localName}: ${e.message}`);
        console.error(`[FAIL] ${localName}: ${e.message}`);
      }
    }
  }

  if (failed.length > 0) {
    console.log('\n=== FAILED DOWNLOADS ===');
    failed.forEach(f => console.log(f));
  } else {
    console.log('\n=== ALL SPRITES DOWNLOADED SUCCESSFULLY ===');
  }
}

downloadAll();
