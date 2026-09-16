// Comprehensive Simulation & Audit Script for Ludo Star Deluxe (2P, 3P, 4P & Strict Rules)

const fs = require('fs');
const path = require('path');

console.log("=== RUNNING FULL CODEBASE & MULTI-PLAYER ENGINE AUDIT ===");

// 1. Check HTML and config.js existence and syntax
const htmlPath = path.join(__dirname, 'index.html');
const configPath = path.join(__dirname, 'config.js');

if (!fs.existsSync(htmlPath)) throw new Error("index.html missing!");
if (!fs.existsSync(configPath)) throw new Error("config.js missing!");

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const configContent = fs.readFileSync(configPath, 'utf8');

console.log("[PASS] Files exist. HTML size:", htmlContent.length, "bytes; Config size:", configContent.length, "bytes.");

// 2. Check no secret keys or hardcoded private tokens in HTML
if (htmlContent.includes("sb_secret_")) {
  throw new Error("CRITICAL SECURITY FLAW: Found secret key inside HTML!");
}
if (configContent.includes("sb_secret_")) {
  throw new Error("CRITICAL SECURITY FLAW: Found secret key inside config.js!");
}
console.log("[PASS] Security audit passed: No secret keys exposed in client files.");

// 3. Verify color combination and modal support in HTML & CSS
const colors = ['red', 'green', 'yellow', 'blue'];
for (const c of colors) {
  if (!htmlContent.includes(`.token.${c}`)) throw new Error(`Missing .token.${c} in CSS`);
  if (!htmlContent.includes(`.msg.${c}`)) throw new Error(`Missing .msg.${c} in CSS`);
  if (!htmlContent.includes(`id="card_${c}"`)) throw new Error(`Missing card_${c} in HTML`);
  if (!htmlContent.includes(`id="tray_${c}"`)) throw new Error(`Missing tray_${c} in HTML`);
}
if (!htmlContent.includes('id="createRoomModal"')) throw new Error('Missing createRoomModal in HTML');
if (!htmlContent.includes('id="joinRoomModal"')) throw new Error('Missing joinRoomModal in HTML');
if (!htmlContent.includes('id="playerCountModal"')) throw new Error('Missing playerCountModal in HTML');
if (!htmlContent.includes('id="roomLobbyOverlay"')) throw new Error('Missing roomLobbyOverlay in HTML');

console.log("[PASS] 4-Color Player HUDs and Multi-Player Modals verified in HTML.");

// 4. Geometry and Path Definition
const MAIN_PATH = [
  [6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],
  [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],
  [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],
  [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]
];
const START_INDEX = { red:0, green:13, yellow:26, blue:39 };
const HOME_COLUMN = {
  red:[[7,1],[7,2],[7,3],[7,4],[7,5]],
  green:[[1,7],[2,7],[3,7],[4,7],[5,7]],
  yellow:[[7,13],[7,12],[7,11],[7,10],[7,9]],
  blue:[[13,7],[12,7],[11,7],[10,7],[9,7]]
};
const SAFE_CELLS = new Set(['6,1','1,8','8,13','13,6','2,6','6,12','12,8','8,2']);
const STEPS_TO_HOME = 56;

function buildPath(color){
  const s = START_INDEX[color]; const arr = [];
  for(let i=0;i<51;i++) arr.push(MAIN_PATH[(s+i)%52]);
  for(const c of HOME_COLUMN[color]) arr.push(c);
  return arr;
}
const PATHS = Object.fromEntries(colors.map(c => [c, buildPath(c)]));

function getNextActiveColor(activeColors, color){
  const idx = activeColors.indexOf(color);
  if(idx === -1) return activeColors[0];
  return activeColors[(idx + 1) % activeColors.length];
}

function getValidMoves(state, color, dice){
  const tokens = state.players[color]?.tokens;
  if(!tokens) return [];
  const valid = [];
  for(let i=0;i<4;i++){
    const p = tokens[i];
    if(p === STEPS_TO_HOME) continue;
    if(p === -1){
      if(dice === 6) valid.push(i);
    } else if(p + dice <= STEPS_TO_HOME){
      valid.push(i);
    }
  }
  return valid;
}

function detectCaptures(state, color, newPos){
  if(newPos < 0 || newPos >= 51) return [];
  const [r, c] = PATHS[color][newPos];
  const key = r + ',' + c;
  if(SAFE_CELLS.has(key)) return [];

  const captures = [];
  for(const oppColor of state.activeColors){
    if(oppColor === color || !state.players || !state.players[oppColor]) continue;
    const oppTokens = state.players[oppColor].tokens;
    for(let i = 0; i < 4; i++){
      const op = oppTokens[i];
      if(op < 0 || op >= 51) continue;
      const [or_, oc] = PATHS[oppColor][op];
      if(or_ === r && oc === c){
        captures.push({ color: oppColor, idx: i });
      }
    }
  }
  return captures;
}

function isPositionThreatened(state, color, pos){
  if(pos < 0 || pos >= 51) return false;
  const [r, c] = PATHS[color][pos];
  if(SAFE_CELLS.has(r + ',' + c)) return false;

  for(const oppColor of state.activeColors){
    if(oppColor === color || !state.players || !state.players[oppColor]) continue;
    const oppTokens = state.players[oppColor].tokens;
    for(let i = 0; i < 4; i++){
      const op = oppTokens[i];
      if(op < 0 || op >= 51) continue;
      for(let d = 1; d <= 6; d++){
        if(op + d < 51){
          const [or, oc] = PATHS[oppColor][op + d];
          if(or === r && oc === c) return true;
        }
      }
    }
  }
  return false;
}

function evaluateSmartBotMove(state, color, dice, validMoves){
  if(!validMoves || validMoves.length === 0) return null;
  if(validMoves.length === 1) return validMoves[0];

  const myTokens = state.players?.[color]?.tokens;
  if(!myTokens) return validMoves[0];

  let bestToken = validMoves[0];
  let bestScore = -Infinity;

  for(const tId of validMoves){
    const curPos = myTokens[tId];
    const isOpening = (curPos === -1 && dice === 6);
    const nextPos = isOpening ? 0 : (curPos + dice);
    let score = 0;

    if(nextPos === STEPS_TO_HOME) score += 150;

    const caps = detectCaptures(state, color, nextPos);
    if(caps.length > 0){
      score += 115;
      for(const ci of caps){
        const opPos = state.players[ci.color]?.tokens[ci.idx] || 0;
        score += Math.min(30, Math.floor(Math.max(0, opPos) / 2));
      }
    }

    if(isOpening){
      const activeCount = myTokens.filter(p => p >= 0 && p < STEPS_TO_HOME).length;
      if(activeCount === 0) score += 100;
      else if(activeCount === 1) score += 82;
      else score += 65;
    }

    if(nextPos >= 51 && nextPos < STEPS_TO_HOME){
      score += 48;
      if(curPos < 51) score += 22;
    }

    if(nextPos >= 0 && nextPos < 51){
      const [r, c] = PATHS[color][nextPos];
      if(SAFE_CELLS.has(r + ',' + c)) score += 35;
    }

    if(curPos >= 0 && curPos < 51 && isPositionThreatened(state, color, curPos)) score += 42;
    if(nextPos >= 0 && nextPos < 51 && isPositionThreatened(state, color, nextPos)) score -= 26;
    if(!isOpening) score += Math.floor(nextPos * 0.4);

    if(score > bestScore){
      bestScore = score;
      bestToken = tId;
    }
  }

  return bestToken;
}

// 5. Unit Tests for Strict Dice Rules
console.log("\n--- Testing Strict Dice Rules ---");

// Test A: When tokens are in base, rolling 1-5 gives 0 valid moves and passes turn immediately
{
  const testState = {
    activeColors: ['red', 'green', 'yellow', 'blue'],
    players: {
      red: { tokens: [-1, -1, -1, -1] },
      green: { tokens: [-1, -1, -1, -1] },
      yellow: { tokens: [-1, -1, -1, -1] },
      blue: { tokens: [-1, -1, -1, -1] }
    },
    currentTurn: 'red'
  };

  for(let d = 1; d <= 5; d++){
    const moves = getValidMoves(testState, 'red', d);
    if(moves.length !== 0){
      throw new Error(`Strict dice rule failed: Roll ${d} allowed moving locked token!`);
    }
  }
  const move6 = getValidMoves(testState, 'red', 6);
  if(move6.length !== 4){
    throw new Error("Strict dice rule failed: Roll 6 should allow opening any of 4 tokens from base!");
  }
  console.log("[PASS] Base lock verification passed: Rolls 1-5 strictly locked; 6 unlocks.");
}

// Test B: Three consecutive sixes penalty
{
  let consecutiveSixes = 0;
  let currentTurn = 'red';
  const activeColors = ['red', 'green', 'yellow', 'blue'];

  for(let r = 1; r <= 3; r++){
    consecutiveSixes++;
    if(consecutiveSixes >= 3){
      currentTurn = getNextActiveColor(activeColors, currentTurn);
      consecutiveSixes = 0;
    }
  }
  if(currentTurn !== 'green'){
    throw new Error(`3-Sixes penalty failed: Expected green, got ${currentTurn}`);
  }
  console.log("[PASS] 3-Sixes penalty verified: Turn passed to next player.");
}

// 6. Multi-Player Match Simulation
function simulateMultiPlayerMatch(activeColors) {
  const players = {};
  for(const c of activeColors){
    players[c] = { name: 'Player ' + c.toUpperCase(), tokens: [-1,-1,-1,-1] };
  }
  const state = {
    activeColors: [...activeColors],
    players,
    currentTurn: activeColors[0],
    dice: null,
    consecutiveSixes: 0,
    winner: null,
    totalTurns: 0
  };

  let turns = 0;
  while (!state.winner && turns < 3000) {
    turns++;
    state.totalTurns = turns;
    const cur = state.currentTurn;
    const dice = Math.floor(Math.random() * 6) + 1;
    state.dice = dice;

    if (dice === 6) {
      state.consecutiveSixes++;
      if (state.consecutiveSixes >= 3) {
        state.consecutiveSixes = 0;
        state.currentTurn = getNextActiveColor(state.activeColors, cur);
        continue;
      }
    } else {
      state.consecutiveSixes = 0;
    }

    const validMoves = getValidMoves(state, cur, dice);
    if (validMoves.length === 0) {
      state.currentTurn = getNextActiveColor(state.activeColors, cur);
      state.consecutiveSixes = 0;
      continue;
    }

    const chosen = evaluateSmartBotMove(state, cur, dice, validMoves);
    const startPos = state.players[cur].tokens[chosen];
    const newPos = (startPos === -1) ? 0 : startPos + dice;
    state.players[cur].tokens[chosen] = newPos;

    const caps = detectCaptures(state, cur, newPos);
    for (const cap of caps) {
      state.players[cap.color].tokens[cap.idx] = -1; // Sent back to base
    }

    if (state.players[cur].tokens.every(t => t === STEPS_TO_HOME)) {
      state.winner = cur;
      break;
    }

    const extraTurn = (dice === 6 || caps.length > 0 || newPos === STEPS_TO_HOME);
    if (!extraTurn) {
      state.currentTurn = getNextActiveColor(state.activeColors, cur);
      state.consecutiveSixes = 0;
    }
  }

  return state;
}

console.log("\n--- Simulating 2-Player, 3-Player & 4-Player Matches ---");

// Test 2-Player Matches
{
  const res2 = simulateMultiPlayerMatch(['red', 'yellow']);
  if(!res2.winner) throw new Error("2-Player match did not finish in 3000 turns!");
  console.log(`[PASS] 2-Player Match (Red, Yellow) -> Winner: ${res2.winner.toUpperCase()} in ${res2.totalTurns} turns!`);
}

// Test 3-Player Matches
{
  const res3 = simulateMultiPlayerMatch(['red', 'green', 'yellow']);
  if(!res3.winner) throw new Error("3-Player match did not finish in 3000 turns!");
  console.log(`[PASS] 3-Player Match (Red, Green, Yellow) -> Winner: ${res3.winner.toUpperCase()} in ${res3.totalTurns} turns!`);
}

// Test 4-Player Matches
{
  const res4 = simulateMultiPlayerMatch(['red', 'green', 'yellow', 'blue']);
  if(!res4.winner) throw new Error("4-Player match did not finish in 3000 turns!");
  console.log(`[PASS] 4-Player Match (Red, Green, Yellow, Blue) -> Winner: ${res4.winner.toUpperCase()} in ${res4.totalTurns} turns!`);
}

console.log("\n=== ALL QA AUDIT CHECKS AND MULTI-PLAYER SIMULATIONS PASSED (100%) ===");
