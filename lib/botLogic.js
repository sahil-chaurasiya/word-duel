const { getRandomWord, getWordsByLength } = require('./gameData');

const BOT_NAMES = [
  'LexBot', 'WordWraith', 'GlyphGhost', 'VoxVictor', 'SpellStrike',
  'PhonixBot', 'GrammarGrim', 'LinguaBot', 'SyntaxSlayer', 'VerbViper'
];

function getBotName() {
  return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
}

function getBotMove(category, difficulty, usedWords, roundDuration) {
  let word = null;
  let minDelay, maxDelay;
  let mistakeChance = 0;

  switch (difficulty) {
    case 'easy':
      minDelay = 3000;
      maxDelay = Math.min(roundDuration * 1000 - 1000, 8000);
      mistakeChance = 0.25;
      word = getRandomWord(category, usedWords);
      break;
    case 'medium':
      minDelay = 2000;
      maxDelay = 6000;
      mistakeChance = 0.10;
      word = Math.random() > 0.4
        ? getWordsByLength(category, 5, usedWords)
        : getRandomWord(category, usedWords);
      break;
    case 'hard':
      minDelay = 800;
      maxDelay = 3500;
      mistakeChance = 0.03;
      word = getWordsByLength(category, 7, usedWords);
      break;
    default:
      minDelay = 2000;
      maxDelay = 6000;
      mistakeChance = 0.10;
      word = getRandomWord(category, usedWords);
  }

  if (Math.random() < mistakeChance) {
    word = null;
  }

  const delay = minDelay + Math.random() * (maxDelay - minDelay);
  return { word: word || null, delay: Math.floor(delay) };
}

module.exports = { getBotName, getBotMove };
