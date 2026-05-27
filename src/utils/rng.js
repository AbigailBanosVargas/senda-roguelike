class RNG {
  constructor(seed) {
    this.seed = seed || Date.now();
    this.state = this.seed;
  }
  next() {
    this.state = (this.state * 1664525 + 1013904223) & 0xffffffff;
    return (this.state >>> 0) / 0xffffffff;
  }
  range(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick(arr) {
    return arr[this.range(0, arr.length - 1)];
  }
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.range(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  chance(probability) {
    return this.next() < probability;
  }
}
