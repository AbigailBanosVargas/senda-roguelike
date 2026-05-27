const ZONES_DATA = GAME_DATA.zones;

function generateMap(zoneId) {
  const zone = ZONES_DATA.find(z => z.id === zoneId);
  if (!zone) return null;

  const map = { nodes: [], connections: [] };
  const floors = zone.floors + 1;
  const nodeIdMap = {};

  for (let f = 0; f < floors; f++) {
    const isLast = f === floors - 1;
    const count = isLast ? 1 : (f === 0 ? 1 : (f < 3 ? 2 : 3));
    const nodesOnFloor = [];

    for (let i = 0; i < count; i++) {
      const id = `node_${f}_${i}`;
      let type;
      let tier = 'normal';

      if (isLast) {
        type = 'BOSS';
      } else if (f === 0) {
        type = 'REST';
      } else {
        const roll = Math.random();
        if (roll < 0.45) { type = 'COMBAT'; }
        else if (roll < 0.65) { type = 'COMBAT'; tier = Math.random() < 0.3 ? 'elite' : 'normal'; type = tier === 'elite' ? 'ELITE' : 'COMBAT'; }
        else if (roll < 0.78) { type = 'REST'; }
        else if (roll < 0.90) { type = 'TREASURE'; }
        else { type = 'EVENT'; }
      }

      const node = { id, floor: f, position: i, type, tier, connections: [], cleared: false, available: f === 0 };
      nodesOnFloor.push(node);
      nodeIdMap[id] = node;
    }

    map.nodes[f] = nodesOnFloor;
  }

  // Garantizar 2 nodos TREASURE por zona
  let treasureCount = 0;
  for (let f = 1; f < floors - 1; f++) {
    const floorNodes = map.nodes[f];
    for (const node of floorNodes) {
      if (treasureCount < 2 && node.type !== 'BOSS' && node.type !== 'REST') {
        node.type = 'TREASURE';
        node.tier = 'normal';
        treasureCount++;
      }
    }
  }

  for (let f = 0; f < floors - 1; f++) {
    const cur = map.nodes[f];
    const next = map.nodes[f + 1];

    for (const node of cur) node.connections = [];

    if (next.length === 1) {
      for (const parent of cur) parent.connections.push(next[0].id);
    } else {
      for (let ci = 0; ci < next.length; ci++) {
        const pi = Math.round((ci / (next.length - 1)) * (cur.length - 1));
        cur[pi].connections.push(next[ci].id);
      }
    }

    for (const parent of cur) {
      if (parent.connections.length >= 2) continue;
      const candidates = next.filter(c => !parent.connections.includes(c.id));
      if (candidates.length === 0) continue;
      const shuffled = HELPERS.shuffle(candidates);
      parent.connections.push(shuffled[0].id);
    }
  }

  return map;
}