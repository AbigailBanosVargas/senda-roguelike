const HELPERS = {
  lerp(a, b, t) { return a + (b - a) * t; },
  clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },
  rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  pickN(arr, n) {
    const copy = [...arr];
    const result = [];
    for (let i = 0; i < n && copy.length > 0; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  },
  weightedPick(items, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  },
  formatNumber(n) { return Math.floor(n).toString(); },
  hexToRgb(hex) { return { r: (hex >> 16) & 0xff, g: (hex >> 8) & 0xff, b: hex & 0xff }; },
  rgbToHex(r, g, b) { return (r << 16) | (g << 8) | b; },
  lerpColor(c1, c2, t) {
    const a = this.hexToRgb(c1), b = this.hexToRgb(c2);
    return this.rgbToHex(
      Math.round(this.lerp(a.r, b.r, t)),
      Math.round(this.lerp(a.g, b.g, t)),
      Math.round(this.lerp(a.b, b.b, t))
    );
  },
  sleep(ms) { return new Promise(r => setTimeout(r, ms)); },
  generateId() { return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; },
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); },
  easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
};
