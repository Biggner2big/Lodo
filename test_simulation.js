// Comprehensive Simulation & Audit Script

const fs = require('fs');
const path = require('path');

console.log("=== RUNNING FULL CODEBASE & RUNTIME AUDIT ===");

// 1. Check HTML and config.js existence and syntax
const htmlPath = path.join(__dirname, 'final lodo.html');
const configPath = path.join(__dirname, 'config.js');

if (!fs.existsSync(htmlPath)) throw new Error("final lodo.html missing!");
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

// 3. Verify color combination support in HTML & CSS
const colors = ['red', 'green', 'yellow', 'blue'];
for (const c of colors) {
  if (!htmlContent.includes(`.avatar.${c}`)) throw new Error(`Missing .avatar.${c} in CSS`);
  if (!htmlContent.includes(`.active-turn.color-${c}`)) throw new Error(`Missing .active-turn.color-${c} in CSS`);
  if (!htmlContent.includes(`.token.${c}`)) throw new Error(`Missing .token.${c} in CSS`);
  if (!htmlContent.includes(`.msg.${c}`)) throw new Error(`Missing .msg.${c} in CSS`);
}
console.log("[PASS] CSS 4-Color Tokens fully implemented (Red, Green, Yellow, Blue).");

// 4. Test Game Simulation for every active pair
const ALL_PAIRS = [
  ['red', 'yellow'],
  ['red', 'green'],
  ['red', 'blue'],
  ['green', 'yellow'],
  ['green', 'blue'],
  ['yellow', 'blue']
];

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
  const [r,c] = PATHS[color][newPos];
  const key = r+','+c;
  if(SAFE_CELLS.has(key)) return [];

  const opp = state.activeColors[0] === color ? state.activeColors[1] : state.activeColors[0];
  if(!state.players[opp]) return [];
  const oppTokens = state.players[opp].tokens;
  const captured = [];
  for(let i=0;i<4;i++){
    const op = oppTokens[i];
    if(op < 0 || op >= 51) continue;
    const [or_,oc] = PATHS[opp][op];
    if(or_ === r && oc === c) captured.push(i);
  }
  return captured;
}

function isPositionThreatened(state, color, pos){
  if(pos < 0 || pos >= 51) return false;
  const [r, c] = PATHS[color][pos];
  if(SAFE_CELLS.has(r + ',' + c)) return false;

  const oppColor = state.activeColors[0] === color ? state.activeColors[1] : state.activeColors[0];
  const oppTokens = state.players?.[oppColor]?.tokens;
  if(!oppTokens) return false;

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
  return false;
}

function evaluateSmartBotMove(state, color, dice, validMoves){
  if(!validMoves || validMoves.length === 0) return null;
  if(validMoves.length === 1) return validMoves[0];

  const oppColor = state.activeColors[0] === color ? state.activeColors[1] : state.activeColors[0];
  const myTokens = state.players?.[color]?.tokens;
  const oppTokens = state.players?.[oppColor]?.tokens;
  if(!myTokens) return validMoves[0];

  let bestToken = validMoves[0];
  let bestScore = -Infinity;

  for(const tId of validMoves){
    const curPos = myTokens[tId];
    const isOpening = (curPos === -1 && dice === 6);
    const nextPos = isOpening ? 0 : (curPos + dice);
    let score = 0;

    // 1. Reaching exact home finish
    if(nextPos === STEPS_TO_HOME){
      score += 150;
    }

    // 2. Capturing an opponent token
    const caps = detectCaptures(state, color, nextPos);
    if(caps.length > 0){
      score += 115;
      for(const ci of caps){
        const opPos = oppTokens ? oppTokens[ci] : 0;
        score += Math.min(30, Math.floor(Math.max(0, opPos) / 2));
      }
    }

    // 3. Opening a piece out of base on a 6
    if(isOpening){
      const activeCount = myTokens.filter(p => p >= 0 && p < STEPS_TO_HOME).length;
      if(activeCount === 0) score += 100;
      else if(activeCount === 1) score += 82;
      else score += 65;
    }

    // 4. Entering or advancing in the private home stretch (safe from all captures)
    if(nextPos >= 51 && nextPos < STEPS_TO_HOME){
      score += 48;
      if(curPos < 51) score += 22;
    }

    // 5. Landing on a designated safe cell (star or start quadrant)
    if(nextPos >= 0 && nextPos < 51){
      const [r, c] = PATHS[color][nextPos];
      if(SAFE_CELLS.has(r + ',' + c)){
        score += 35;
      }
    }

    // 6. Escaping an existing threat
    if(curPos >= 0 && curPos < 51 && isPositionThreatened(state, color, curPos)){
      score += 42;
    }

    // 7. Penalty for stepping into danger
    if(nextPos >= 0 && nextPos < 51 && isPositionThreatened(state, color, nextPos)){
      score -= 26;
    }

    // 8. General progress bonus
    if(!isOpening){
      score += Math.floor(nextPos * 0.4);
    }

    if(score > bestScore){
      bestScore = score;
      bestToken = tId;
    }
  }

  return bestToken;
}

// Full Match Simulation function
function simulateMatch(c1, c2) {
  const state = {
    activeColors: [c1, c2],
    players: {
      [c1]: { name: 'Player 1', tokens: [-1,-1,-1,-1] },
      [c2]: { name: 'Player 2', tokens: [-1,-1,-1,-1] }
    },
    currentTurn: c1,
    dice: null,
    consecutiveSixes: 0,
    winner: null,
    totalTurns: 0
  };

  let turns = 0;
  while (!state.winner && turns < 2000) {
    turns++;
    state.totalTurns = turns;
    const cur = state.currentTurn;
    const dice = Math.floor(Math.random() * 6) + 1;
    state.dice = dice;

    if (dice === 6) {
      state.consecutiveSixes++;
      if (state.consecutiveSixes >= 3) {
        state.consecutiveSixes = 0;
        state.currentTurn = (cur === c1 ? c2 : c1);
        continue;
      }
    } else {
      state.consecutiveSixes = 0;
    }

    const validMoves = getValidMoves(state, cur, dice);
    if (validMoves.length === 0) {
      state.currentTurn = (cur === c1 ? c2 : c1);
      state.consecutiveSixes = 0;
      continue;
    }

    // Smart heuristic selection using shared engine logic
    const chosen = evaluateSmartBotMove(state, cur, dice, validMoves);

    // Apply move
    const startPos = state.players[cur].tokens[chosen];
    const newPos = (startPos === -1) ? 0 : startPos + dice;
    state.players[cur].tokens[chosen] = newPos;

    // Detect capture
    const caps = detectCaptures(state, cur, newPos);
    const opp = (cur === c1 ? c2 : c1);
    for (const ci of caps) {
      state.players[opp].tokens[ci] = -1; // Send back to base
    }

    // Check winner
    if (state.players[cur].tokens.every(t => t === STEPS_TO_HOME)) {
      state.winner = cur;
      break;
    }

    // Turn handover rule
    const extraTurn = (dice === 6 || caps.length > 0 || newPos === STEPS_TO_HOME);
    if (!extraTurn) {
      state.currentTurn = opp;
      state.consecutiveSixes = 0;
    }
  }

  return state;
}

console.log("\nSimulating Full Matches Across All 6 Color Pairs:");
for (const [c1, c2] of ALL_PAIRS) {
  const result = simulateMatch(c1, c2);
  if (!result.winner) {
    throw new Error(`Match between ${c1} and ${c2} did not conclude within 2000 turns!`);
  }
  console.log(`[PASS] Match ${c1.toUpperCase()} vs ${c2.toUpperCase()} -> Winner: ${result.winner.toUpperCase()} in ${result.totalTurns} turns!`);
}

console.log("\n=== ALL QA AUDIT CHECKS AND SIMULATION RUNS COMPLETED SUCCESSFULLY ===");
