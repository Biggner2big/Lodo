import {
  ALL_COLORS,
  MAIN_PATH,
  START_INDEX,
  HOME_COLUMN,
  SAFE_CELLS,
  STEPS_TO_HOME,
  COLOR_HEX
} from './constants.js';

function buildPath(color) {
  const s = START_INDEX[color];
  const arr = [];
  for (let i = 0; i < 51; i++) arr.push(MAIN_PATH[(s + i) % 52]);
  for (const c of HOME_COLUMN[color]) arr.push(c);
  return arr;
}

const PATHS = Object.fromEntries(ALL_COLORS.map(c => [c, buildPath(c)]));

function getColorsForCount(count) {
  if (count === 2) return ['red', 'yellow'];
  if (count === 3) return ['red', 'green', 'yellow'];
  return ['red', 'green', 'yellow', 'blue'];
}

function getNextActiveColor(activeColors, color) {
  if (!activeColors || activeColors.length === 0) return color;
  const idx = activeColors.indexOf(color);
  if (idx === -1) return activeColors[0];
  return activeColors[(idx + 1) % activeColors.length];
}

function createInitialState(configs, activeColors) {
  const players = {};
  for (const c of activeColors) {
    const cfg = (configs && configs[c]) ? configs[c] : {};
    players[c] = {
      id: cfg.id || ('bot_' + c),
      name: cfg.name || ('Player ' + c.toUpperCase()),
      avatar: cfg.avatar || '😎',
      isBot: !!cfg.isBot,
      tokens: [-1, -1, -1, -1]
    };
  }
  return {
    activeColors: [...activeColors],
    players,
    currentTurn: activeColors[0],
    dice: null,
    consecutiveSixes: 0,
    mustMove: false,
    winner: null,
    seq: 1,
    lastActionId: null,
    ts: Date.now()
  };
}

function getValidMoves(state, color, dice) {
  if (!state || dice === null || dice === undefined) return [];
  const tokens = state.players[color]?.tokens;
  if (!tokens) return [];
  const valid = [];
  for (let i = 0; i < 4; i++) {
    const p = tokens[i];
    if (p === STEPS_TO_HOME) continue;
    if (p === -1) {
      if (dice === 6) valid.push(i);
    } else if (p + dice <= STEPS_TO_HOME) {
      valid.push(i);
    }
  }
  return valid;
}

function detectCaptures(state, color, newPos) {
  if (!state || newPos < 0 || newPos >= 51) return [];
  const [r, c] = PATHS[color][newPos];
  const key = r + ',' + c;
  if (SAFE_CELLS.has(key)) return [];

  const captures = [];
  const activeColors = state.activeColors || Object.keys(state.players || {});
  for (const oppColor of activeColors) {
    if (oppColor === color || !state.players || !state.players[oppColor]) continue;
    const oppTokens = state.players[oppColor].tokens;
    for (let i = 0; i < 4; i++) {
      const op = oppTokens[i];
      if (op < 0 || op >= 51) continue;
      const [or_, oc] = PATHS[oppColor][op];
      if (or_ === r && oc === c) {
        captures.push({ color: oppColor, idx: i });
      }
    }
  }
  return captures;
}

function isPositionThreatened(state, color, pos) {
  if (pos < 0 || pos >= 51) return false;
  const [r, c] = PATHS[color][pos];
  if (SAFE_CELLS.has(r + ',' + c)) return false;

  const activeColors = state.activeColors || Object.keys(state.players || {});
  for (const oppColor of activeColors) {
    if (oppColor === color || !state.players || !state.players[oppColor]) continue;
    const oppTokens = state.players[oppColor].tokens;
    for (let i = 0; i < 4; i++) {
      const op = oppTokens[i];
      if (op < 0 || op >= 51) continue;
      for (let d = 1; d <= 6; d++) {
        if (op + d < 51) {
          const [or, oc] = PATHS[oppColor][op + d];
          if (or === r && oc === c) return true;
        }
      }
    }
  }
  return false;
}

function evaluateSmartBotMove(state, color, dice, validMoves) {
  if (!validMoves || validMoves.length === 0) return null;
  if (validMoves.length === 1) return validMoves[0];

  const myTokens = state.players?.[color]?.tokens;
  if (!myTokens) return validMoves[0];

  let bestToken = validMoves[0];
  let bestScore = -Infinity;

  for (const tId of validMoves) {
    const curPos = myTokens[tId];
    const isOpening = (curPos === -1 && dice === 6);
    const nextPos = isOpening ? 0 : (curPos + dice);
    let score = 0;

    if (nextPos === STEPS_TO_HOME) score += 150;

    const caps = detectCaptures(state, color, nextPos);
    if (caps.length > 0) {
      score += 115;
      for (const ci of caps) {
        const opPos = state.players[ci.color]?.tokens[ci.idx] || 0;
        score += Math.min(30, Math.floor(Math.max(0, opPos) / 2));
      }
    }

    if (isOpening) {
      const activeCount = myTokens.filter(p => p >= 0 && p < STEPS_TO_HOME).length;
      if (activeCount === 0) score += 100;
      else if (activeCount === 1) score += 82;
      else score += 65;
    }

    if (nextPos >= 51 && nextPos < STEPS_TO_HOME) {
      score += 48;
      if (curPos < 51) score += 22;
    }

    if (nextPos >= 0 && nextPos < 51) {
      const [r, c] = PATHS[color][nextPos];
      if (SAFE_CELLS.has(r + ',' + c)) score += 35;
    }

    if (curPos >= 0 && curPos < 51 && isPositionThreatened(state, color, curPos)) score += 42;
    if (nextPos >= 0 && nextPos < 51 && isPositionThreatened(state, color, nextPos)) score -= 26;
    if (!isOpening) score += Math.floor(nextPos * 0.4);

    if (score > bestScore) {
      bestScore = score;
      bestToken = tId;
    }
  }

  return bestToken;
}

function applyRoll(state, color, value, actionId) {
  state.lastActionId = actionId || null;
  state.dice = value;

  if (value === 6) {
    state.consecutiveSixes++;
    if (state.consecutiveSixes >= 3) {
      state.consecutiveSixes = 0;
      state.dice = null;
      state.mustMove = false;
      return { type: 'three_sixes', nextTurn: getNextActiveColor(state.activeColors, color) };
    }
  } else {
    state.consecutiveSixes = 0;
  }

  const valid = getValidMoves(state, color, value);

  if (valid.length === 0) {
    state.mustMove = false;
    return {
      type: 'no_moves',
      nextTurn: getNextActiveColor(state.activeColors, color),
      resetConsecutiveSixes: true
    };
  }

  state.mustMove = true;
  return { type: 'must_move', validMoves: valid };
}

function applyMove(state, color, tokenId, dice, actionId) {
  // Validate tokenId is in the legal set before mutating state
  if (!Number.isInteger(tokenId) || tokenId < 0 || tokenId > 3) return { type: 'invalid' };
  const validMoves = getValidMoves(state, color, dice);
  if (!validMoves.includes(tokenId)) return { type: 'invalid' };

  const tokens = state.players[color].tokens;
  const startPos = tokens[tokenId];
  const newPos = (startPos === -1) ? 0 : startPos + dice;
  if (newPos > STEPS_TO_HOME) return { type: 'invalid' };

  tokens[tokenId] = newPos;

  const captured = detectCaptures(state, color, newPos);
  const capturedInfo = [];
  for (const cap of captured) {
    capturedInfo.push({ color: cap.color, idx: cap.idx });
    state.players[cap.color].tokens[cap.idx] = -1;
  }

  const allHome = tokens.every(t => t === STEPS_TO_HOME);
  if (allHome) state.winner = color;

  const gotCut = capturedInfo.length > 0;
  const reachedHome = newPos === STEPS_TO_HOME;
  const extraTurn = (dice === 6 || gotCut || reachedHome);

  if (!state.winner && !extraTurn) {
    state.currentTurn = getNextActiveColor(state.activeColors, color);
    state.consecutiveSixes = 0;
  }
  state.dice = null;
  state.mustMove = false;
  state.lastActionId = actionId || null;

  return {
    type: 'move_complete',
    tokenId,
    startPos,
    newPos,
    captured: capturedInfo,
    winner: state.winner,
    extraTurn,
    reachedHome,
    gotCut,
    nextTurn: extraTurn ? null : state.currentTurn
  };
}

function getStateHash(state) {
  const str = JSON.stringify({
    activeColors: state.activeColors,
    players: Object.fromEntries(
      Object.entries(state.players).map(([c, p]) => [c, { tokens: p.tokens, isBot: p.isBot }])
    ),
    currentTurn: state.currentTurn,
    dice: state.dice,
    consecutiveSixes: state.consecutiveSixes,
    mustMove: state.mustMove,
    winner: state.winner
  });
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

export const GameEngine = {
  PATHS,
  STEPS_TO_HOME,
  SAFE_CELLS,
  ALL_COLORS,
  COLOR_HEX,
  getColorsForCount,
  getNextActiveColor,
  createInitialState,
  getValidMoves,
  detectCaptures,
  isPositionThreatened,
  evaluateSmartBotMove,
  applyRoll,
  applyMove,
  getStateHash
};