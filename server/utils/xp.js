function calculateLevel(xp) {
    // Простая формула: 100 XP за первый уровень, +50 за каждый следующий
    let level = 1, need = 100;
    while (xp >= need) {
      xp -= need;
      level++;
      need += 50;
    }
    return level;
  }
  module.exports = { calculateLevel };