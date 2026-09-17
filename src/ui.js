import { ALL_COLORS, COLOR_HEX, AVATARS, MAIN_PATH, START_INDEX, HOME_COLUMN, BASE_CELLS, HOME_CELLS, SAFE_CELLS, STEPS_TO_HOME, DICE_ROTATIONS, CHAT_REACTIONS, MAX_CHAT_DOM } from './constants.js';

const $ = id => document.getElementById(id);

const PATHS = Object.fromEntries(ALL_COLORS.map(c => {
  const s = START_INDEX[c];
  const arr = [];
  for (let i = 0; i < 51; i++) arr.push(MAIN_PATH[(s + i) % 52]);
  for (const cell of HOME_COLUMN[c]) arr.push(cell);
  return [c, arr];
}));

function pctForCell(r, c) { return { left: ((c + 0.5) / 15 * 100) + '%', top: ((r + 0.5) / 15 * 100) + '%' }; }
function pctForPoint(r, c) { return { left: (c / 15 * 100) + '%', top: (r / 15 * 100) + '%' }; }

const COORD_CACHE = {};
for (const color of ALL_COLORS) {
  for (let idx = 0; idx < 4; idx++) {
    const [r, c] = BASE_CELLS[color][idx];
    COORD_CACHE[color + '_' + idx + '_base'] = pctForPoint(r, c);
    const [rh, ch] = HOME_CELLS[color][idx];
    COORD_CACHE[color + '_' + idx + '_home'] = pctForPoint(rh, ch);
    for (let p = 0; p < STEPS_TO_HOME; p++) {
      const [r2, c2] = PATHS[color][p];
      COORD_CACHE[color + '_' + idx + '_' + p] = pctForCell(r2, c2);
    }
  }
}

function coordForPosition(color, tokenId, pos) {
  if (pos === -1) return COORD_CACHE[color + '_' + tokenId + '_base'];
  if (pos === STEPS_TO_HOME) return COORD_CACHE[color + '_' + tokenId + '_home'];
  return COORD_CACHE[color + '_' + tokenId + '_' + pos];
}

let animQueue = Promise.resolve();
let pendingAnimCount = 0;
let isAnimating = false;
let animatingTokenKey = null;
let renderScheduled = false;

function enqueueAnimation(fn) {
  pendingAnimCount++;
  isAnimating = true;
  animQueue = animQueue.then(() => fn()).catch(e => console.warn('anim', e)).finally(() => {
    pendingAnimCount--;
    if (pendingAnimCount <= 0) {
      pendingAnimCount = 0;
      isAnimating = false;
      scheduleRender();
    }
  });
}

function scheduleRender() {
  if (renderScheduled) return;
  renderScheduled = true;
  requestAnimationFrame(() => { renderScheduled = false; renderTokens(); });
}

function set3DDiceFace(cubeEl, val) {
  if (!cubeEl) return;
  const rot = DICE_ROTATIONS[val] || { x: 0, y: 0 };
  cubeEl.style.transform = 'rotateX(' + rot.x + 'deg) rotateY(' + rot.y + 'deg)';
}

function showDiceReading(color, val) {
  const badge = $(`badge_${color}`);
  const valEl = $(`val_${color}`);
  if (!badge || !valEl) return;
  valEl.textContent = String(val);
  badge.classList.remove('hidden');
  badge.classList.remove('pop');
  void badge.offsetWidth;
  badge.classList.add('pop');
}

function hideDiceReading(color) {
  const badge = $(`badge_${color}`);
  if (badge) badge.classList.add('hidden');
}

function getCard(c) { return $(`card_${c}`); }
function getTimer(c) { return $(`timer_${c}`); }
function getEmote(c) { return $(`emote_${c}`); }
function getAvatar(c) { return $(`avatar_${c}`); }
function getName(c) { return $(`name_${c}`); }
function getMeter(c) { return $(`meter_${c}`); }
function getTray(c) { return $(`tray_${c}`); }
function getCube(c) { return $(`cube_${c}`); }
function getPrompt(c) { return $(`prompt_${c}`); }

export class UIManager {
  constructor(gameEngine, sound, vibrate, getState, getMyColor, getMode, getIsHost) {
    this.engine = gameEngine;
    this.sound = sound;
    this.vibrate = vibrate;
    this.getState = getState;
    this.getMyColor = getMyColor;
    this.getMode = getMode;
    this.getIsHost = getIsHost;
    this.turnTimerInterval = null;
    this.turnSecondsLeft = 15;
    this.emoteTimers = {};
    this.chatPopupTimer = null;
    this.unreadCount = 0;
    this.chatOpen = false;
    this.disconnectTimers = {};
  }

  renderBoard() {
    const svg = $('boardSvg'); const S = 40; let s = '';
    s += `<defs>
    <filter id="cellShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-opacity="0.25"/></filter>
    <radialGradient id="centerGrad" cx="50%" cy="50%">
      <stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#F5E8C8"/></radialGradient>
    ${ALL_COLORS.map(c => `
      <linearGradient id="homeGrad_${c}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${COLOR_HEX[c].light}"/>
        <stop offset="55%" stop-color="${COLOR_HEX[c].main}"/>
        <stop offset="100%" stop-color="${COLOR_HEX[c].dark}"/></linearGradient>
      <linearGradient id="homeColGrad_${c}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${COLOR_HEX[c].light}"/>
        <stop offset="100%" stop-color="${COLOR_HEX[c].main}"/></linearGradient>`).join('')}
  </defs>`;
    s += `<rect width="600" height="600" fill="#FCFAF5"/>`;
    const bases = {
      red: { x: 0, y: 0, w: 240, h: 240 }, green: { x: 360, y: 0, w: 240, h: 240 },
      yellow: { x: 360, y: 360, w: 240, h: 240 }, blue: { x: 0, y: 360, w: 240, h: 240 }
    };
    for (const c of ALL_COLORS) {
      const b = bases[c];
      s += `<rect x="${b.x + 6}" y="${b.y + 6}" width="${b.w - 12}" height="${b.h - 12}" rx="24"
      fill="url(#homeGrad_${c})" filter="url(#cellShadow)"/>`;
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      s += `<circle cx="${cx}" cy="${cy}" r="86" fill="rgba(255,255,255,0.94)"/>`;
      s += `<circle cx="${cx}" cy="${cy}" r="86" fill="none" stroke="${COLOR_HEX[c].dark}" stroke-opacity="0.35" stroke-width="2.5"/>`;
      for (const [r, col] of BASE_CELLS[c]) {
        s += `<circle cx="${col * S}" cy="${r * S}" r="17" fill="${COLOR_HEX[c].main}" opacity="0.25"/>`;
        s += `<circle cx="${col * S}" cy="${r * S}" r="17" fill="none" stroke="${COLOR_HEX[c].dark}" stroke-opacity="0.5" stroke-width="2" stroke-dasharray="3 3"/>`;
      }
    }
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (r < 6 && c < 6) continue; if (r < 6 && c > 8) continue;
        if (r > 8 && c < 6) continue; if (r > 8 && c > 8) continue;
        if (r >= 6 && r <= 8 && c >= 6 && c <= 8) continue;
        let fill = '#FFFFFF', isHomeCol = false;
        if (r === 7 && c >= 1 && c <= 5) { fill = 'url(#homeColGrad_red)'; isHomeCol = true; }
        else if (r === 7 && c >= 9 && c <= 13) { fill = 'url(#homeColGrad_yellow)'; isHomeCol = true; }
        else if (c === 7 && r >= 1 && r <= 5) { fill = 'url(#homeColGrad_green)'; isHomeCol = true; }
        else if (c === 7 && r >= 9 && r <= 13) { fill = 'url(#homeColGrad_blue)'; isHomeCol = true; }
        s += `<rect x="${c * S}" y="${r * S}" width="${S}" height="${S}" fill="${fill}"
        stroke="${isHomeCol ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.12)'}" stroke-width="0.8"/>`;
      }
    }
    for (const key of SAFE_CELLS) {
      const [r, c] = key.split(',').map(Number);
      const cx = c * S + S / 2, cy = r * S + S / 2;
      s += `<circle cx="${cx}" cy="${cy}" r="${S * 0.38}" fill="rgba(244,196,48,0.25)"/>`;
      s += `<path d="M ${cx} ${cy - 9} L ${cx + 6.5} ${cy - 2.5} L ${cx + 3.5} ${cy + 8} L ${cx} ${cy + 4.5} L ${cx - 3.5} ${cy + 8} L ${cx - 6.5} ${cy - 2.5} Z"
      fill="rgba(153,115,0,0.9)"/>`;
    }
    const startDots = { '6,1': 'red', '1,8': 'green', '8,13': 'yellow', '13,6': 'blue' };
    for (const [key, col] of Object.entries(startDots)) {
      const [r, c] = key.split(',').map(Number);
      s += `<circle cx="${c * S + S / 2}" cy="${r * S + S / 2}" r="${S * 0.22}" fill="${COLOR_HEX[col].main}" opacity="0.65"/>`;
    }
    const cx = 300, cy = 300, half = 60;
    s += `<polygon points="${cx - half},${cy - half} ${cx + half},${cy - half} ${cx},${cy}" fill="url(#homeGrad_green)"/>`;
    s += `<polygon points="${cx + half},${cy - half} ${cx + half},${cy + half} ${cx},${cy}" fill="url(#homeGrad_yellow)"/>`;
    s += `<polygon points="${cx + half},${cy + half} ${cx - half},${cy + half} ${cx},${cy}" fill="url(#homeGrad_blue)"/>`;
    s += `<polygon points="${cx - half},${cy - half} ${cx - half},${cy + half} ${cx},${cy}" fill="url(#homeGrad_red)"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="26" fill="url(#centerGrad)" stroke="${COLOR_HEX.yellow.dark}" stroke-width="2.5"/>`;
    s += `<text x="${cx}" y="${cy + 7}" text-anchor="middle" font-size="20" font-weight="900" fill="#8B6914" font-family="'Outfit',sans-serif">👑</text>`;
    s += `<rect x="0.5" y="0.5" width="599" height="599" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1.5" rx="8"/>`;
    svg.innerHTML = s;
  }

  renderTokens() {
    const G = this.getState();
    const layer = $('tokensLayer');
    if (!G) { layer.innerHTML = ''; return; }

    const activeColors = G.activeColors || ALL_COLORS;
    const occ = {};

    for (const c of activeColors) {
      const pl = G.players[c]; if (!pl) continue;
      pl.tokens.forEach((p, i) => {
        if (p < 0 || p >= STEPS_TO_HOME) return;
        const key = PATHS[c][p][0] + ',' + PATHS[c][p][1];
        (occ[key] = occ[key] || []).push({ c, i });
      });
    }

    for (const c of ALL_COLORS) {
      const isActive = activeColors.includes(c);
      const tokens = isActive ? G.players[c].tokens : [-1, -1, -1, -1];

      tokens.forEach((pos, idx) => {
        const key = c + '_' + idx;
        if (animatingTokenKey === key) return;

        let el = layer.querySelector('.token[data-color="' + c + '"][data-idx="' + idx + '"]');
        if (!el) {
          el = document.createElement('div');
          el.className = 'token ' + c;
          el.setAttribute('data-color', c);
          el.setAttribute('data-idx', idx);
          layer.appendChild(el);
        }

        if (!isActive) {
          el.classList.add('inactive');
          const coord = coordForPosition(c, idx, -1);
          el.style.left = coord.left;
          el.style.top = coord.top;
          el.onclick = null;
          return;
        }

        el.classList.remove('inactive');
        let coord;
        if (pos === -1 || pos === STEPS_TO_HOME) {
          coord = coordForPosition(c, idx, pos);
        } else {
          const [r, c2] = PATHS[c][pos];
          const stackKey = r + ',' + c2;
          const stack = occ[stackKey] || [];
          let dR = 0, dC = 0;
          if (stack.length > 1) {
            const i = stack.findIndex(t => t.c === c && t.i === idx);
            const off = (i - (stack.length - 1) / 2) * 0.18;
            dR = off; dC = off;
          }
          coord = pctForCell(r + dR, c2 + dC);
        }
        el.style.left = coord.left;
        el.style.top = coord.top;

        el.classList.remove('movable', 'dim');
        const halo = el.querySelector('.halo');
        if (halo) halo.remove();

        const activeTurnColor = G.currentTurn;
        const isHumanTurn = (this.getMode() === 'local') ? true :
          (this.getMode() === 'bot') ? (activeTurnColor === this.getMyColor()) :
            (activeTurnColor === this.getMyColor() && !G.players[activeTurnColor]?.isBot);

        const validMoves = (isHumanTurn && G.mustMove && !G.winner) ? this.engine.getValidMoves(G, activeTurnColor, G.dice) : [];
        const locked = false;

        const isCurrentColor = (c === activeTurnColor);
        const isMovable = isCurrentColor && isHumanTurn && G.mustMove &&
          validMoves.includes(idx) && !locked;

        if (isMovable) {
          el.classList.add('movable');
          const h = document.createElement('div'); h.className = 'halo';
          el.appendChild(h);
          el.onclick = (e) => { e.stopPropagation(); this.onTokenClick(c, idx); };
        } else {
          el.onclick = null;
          if (isCurrentColor && isHumanTurn && G.mustMove) el.classList.add('dim');
        }
      });
    }
  }

  onTokenClick(color, tokenId) {}

  updateTurnUI() {
    const G = this.getState();
    if (!G) return;
    const t = G.currentTurn;
    const pl = G.players[t];
    const name = pl?.name || t;

    let labelText = '';
    if (this.getMode() === 'local') {
      labelText = `● ${name.toUpperCase()}'S TURN (${t.toUpperCase()})`;
    } else if (this.getMode() === 'bot') {
      labelText = (t === this.getMyColor()) ? '● YOUR TURN' : `● ${name.toUpperCase()} THINKING…`;
    } else {
      labelText = (t === this.getMyColor()) ? '● YOUR TURN' : `● ${name.toUpperCase()}'S TURN`;
    }

    $('turnLabel').textContent = labelText;
    $('turnLabel').style.color = COLOR_HEX[t]?.main || 'var(--text-dim)';

    const activeColors = G.activeColors || ALL_COLORS;
    activeColors.forEach(c => {
      const card = getCard(c);
      if (!card) return;
      const isThisTurn = (c === t);
      card.classList.toggle('active-turn', isThisTurn);

      const finCount = G.players[c]?.tokens.filter(p => p === STEPS_TO_HOME).length || 0;
      const meter = getMeter(c);
      if (meter) {
        const crowns = meter.querySelectorAll('.home-crown');
        crowns.forEach((cr, i) => {
          const filled = i < finCount;
          cr.classList.toggle('filled', filled);
          cr.setAttribute('aria-label', filled ? 'Token home' : 'Token not home');
        });
      }
    });

    this.startTurnTimer();
  }

  startTurnTimer() {
    clearInterval(this.turnTimerInterval);
    this.turnSecondsLeft = 15;
    this.updateTimerVisual(1);

    this.turnTimerInterval = setInterval(() => {
      this.turnSecondsLeft -= 0.2;
      const progress = Math.max(0, this.turnSecondsLeft / 15);
      this.updateTimerVisual(progress);

      if (this.turnSecondsLeft <= 0) {
        clearInterval(this.turnTimerInterval);
        this.onTurnTimerExpired();
      }
    }, 200);
  }

  updateTimerVisual(progress) {
    const G = this.getState();
    if (!G) return;
    const maxDash = 144;
    const offset = maxDash * (1 - progress);
    const activeColor = G.currentTurn;

    ALL_COLORS.forEach(c => {
      const timer = getTimer(c);
      if (!timer) return;
      if (c === activeColor) {
        timer.style.strokeDashoffset = offset;
        timer.classList.toggle('warning', progress < 0.25);
      } else {
        timer.style.strokeDashoffset = maxDash;
        timer.classList.remove('warning');
      }
    });
  }

  onTurnTimerExpired() {}

  updateControls() {
    const G = this.getState();
    if (!G) return;
    const activeTurn = G.currentTurn;
    const activeColors = G.activeColors || ALL_COLORS;

    activeColors.forEach(c => {
      const tray = getTray(c);
      const prompt = getPrompt(c);
      if (!tray) return;

      const isThisTurn = (c === activeTurn);
      const isHumanTurn = (this.getMode() === 'local') ? true :
        (this.getMode() === 'bot') ? (c === this.getMyColor()) :
          (c === this.getMyColor() && !G.players[c]?.isBot);

      const canRoll = isThisTurn && isHumanTurn && !G.mustMove && G.dice === null &&
        !false && !isAnimating && !false && !G.winner;

      tray.classList.toggle('disabled', !canRoll);
      tray.classList.toggle('pulse', canRoll);

      if (prompt) {
        if (G.winner) {
          prompt.textContent = 'FINISHED';
          prompt.classList.remove('active');
        } else if (canRoll) {
          prompt.textContent = 'TAP TO ROLL';
          prompt.classList.add('active');
        } else if (isThisTurn && G.mustMove) {
          prompt.textContent = isHumanTurn ? 'MOVE TOKEN' : 'MOVING';
          prompt.classList.remove('active');
        } else if (isThisTurn && (false || G.dice !== null)) {
          prompt.textContent = isHumanTurn ? 'ROLLING' : 'THINKING';
          prompt.classList.remove('active');
        } else {
          prompt.textContent = 'WAITING';
          prompt.classList.remove('active');
        }
      }
    });
  }

  renderPlayerHUD() {
    const G = this.getState();
    if (!G) return;
    const activeColors = G.activeColors || ALL_COLORS;

    const topRow = $('topPlayersRow');
    const bottomRow = $('bottomPlayersRow');

    if (topRow) topRow.className = 'player-hud-row top';
    if (bottomRow) bottomRow.className = 'player-hud-row bottom';

    const map = (this.getMode() === 'local') ?
      { topLeft: 'red', topRight: 'green', bottomLeft: 'blue', bottomRight: 'yellow' } :
      this.getCornerColorMap(this.getMyColor());

    const cardTL = getCard(map.topLeft);
    const cardTR = getCard(map.topRight);
    const cardBL = getCard(map.bottomLeft);
    const cardBR = getCard(map.bottomRight);

    if (topRow) {
      if (cardTL) topRow.appendChild(cardTL);
      if (cardTR) topRow.appendChild(cardTR);
    }
    if (bottomRow) {
      if (cardBL) bottomRow.appendChild(cardBL);
      if (cardBR) bottomRow.appendChild(cardBR);
    }

    ALL_COLORS.forEach(c => {
      const card = getCard(c);
      if (!card) return;
      const isActive = activeColors.includes(c);
      card.className = `player-card color-${c}` + (isActive ? '' : ' hidden');

      if (isActive && G.players[c]) {
        const pl = G.players[c];
        const nameEl = getName(c);
        const avEl = getAvatar(c);
        if (nameEl) nameEl.textContent = (c === this.getMyColor() && this.getMode() !== 'local') ? (this.getMyName() || 'You') : pl.name;
        if (avEl) {
          avEl.textContent = (c === this.getMyColor() && this.getMode() !== 'local') ? (this.getMyAvatar() || '😎') : pl.avatar;
        }
        card.style.setProperty('--player-accent', COLOR_HEX[c]?.main || '#F4C430');
      }
    });

    this.updateTurnUI();
  }

  getCornerColorMap(myColor) {
    if (myColor === 'red') {
      return { topLeft: 'green', topRight: 'yellow', bottomLeft: 'red', bottomRight: 'blue' };
    } else if (myColor === 'green') {
      return { topLeft: 'yellow', topRight: 'blue', bottomLeft: 'green', bottomRight: 'red' };
    } else if (myColor === 'yellow') {
      return { topLeft: 'blue', topRight: 'red', bottomLeft: 'yellow', bottomRight: 'green' };
    } else {
      return { topLeft: 'red', topRight: 'green', bottomLeft: 'blue', bottomRight: 'yellow' };
    }
  }

  updateBoardOrientation() {
    const wrap = $('boardWrap');
    if (!wrap) return;
    wrap.classList.remove('flip-180', 'flip-90', 'flip-270');
    if (this.getMode() === 'local') return;
    const myColor = this.getMyColor();
    if (myColor === 'red') wrap.classList.add('flip-270');
    else if (myColor === 'green') wrap.classList.add('flip-180');
    else if (myColor === 'yellow') wrap.classList.add('flip-90');
  }

  async animate3DDiceRoll(color, targetValue) {
    const cube = getCube(color);
    hideDiceReading(color);
    if (!cube) return;
    cube.classList.add('rolling');
    await new Promise(r => setTimeout(r, 340));
    cube.classList.remove('rolling');
    if (targetValue !== undefined && targetValue !== null) {
      set3DDiceFace(cube, targetValue);
      showDiceReading(color, targetValue);
    }
  }

  async animateMoveLocally(color, tokenId, fromPos, toPos) {
    const key = color + '_' + tokenId;
    animatingTokenKey = key;
    let el = document.querySelector('.token[data-color="' + color + '"][data-idx="' + tokenId + '"]');
    if (!el) { animatingTokenKey = null; return; }

    el.classList.add('lifted', 'moving');
    await new Promise(r => setTimeout(r, 80));

    if (fromPos === -1) {
      const coord = coordForPosition(color, tokenId, 0);
      el.style.left = coord.left; el.style.top = coord.top;
      el.classList.add('hopping');
      this.sound.step(); this.vibrate(8);
      await new Promise(r => setTimeout(r, 140));
      el.classList.remove('hopping');
    } else if (toPos > fromPos) {
      for (let p = fromPos + 1; p <= toPos; p++) {
        const coord = coordForPosition(color, tokenId, p);
        el.style.left = coord.left; el.style.top = coord.top;
        el.classList.remove('hopping'); void el.offsetWidth; el.classList.add('hopping');
        if (p === STEPS_TO_HOME) this.sound.home(); else this.sound.step();
        this.vibrate(6);
        await new Promise(r => setTimeout(r, 130));
      }
      el.classList.remove('hopping');
    }
    this.sound.land();
    el.classList.remove('lifted', 'moving');
    await new Promise(r => setTimeout(r, 40));
  }

  async animateCapture(color, tokenId) {
    const el = document.querySelector('.token[data-color="' + color + '"][data-idx="' + tokenId + '"]');
    if (!el) return;
    el.classList.add('captured');
    this.sound.capture();
    await new Promise(r => setTimeout(r, 260));
    const coord = coordForPosition(color, tokenId, -1);
    el.style.left = coord.left; el.style.top = coord.top;
    await new Promise(r => setTimeout(r, 260));
    el.classList.remove('captured');
  }

  showEventToast(icon, text, sub = '', dur = 1400) {
    const el = $('eventToast');
    $('etIcon').textContent = icon;
    $('etText').textContent = text;
    $('etSub').textContent = sub;
    el.classList.remove('show'); void el.offsetWidth;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), dur);
  }

  toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2000);
  }

  getChatSignal(text) {
    const clean = safeChatText(text);
    return CHAT_REACTIONS[clean] || { icon: '💬', label: clean, className: 'reaction-message' };
  }

  triggerAvatarEmote(color, emote) {
    const el = getEmote(color);
    if (!el) return;
    el.textContent = emote;
    el.classList.remove('show'); void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(this.emoteTimers[color]);
    this.emoteTimers[color] = setTimeout(() => el.classList.remove('show'), 2500);
  }

  addChatMessage(name, text, color, isMine, ts) {
    const box = $('chatMessages');
    const div = document.createElement('div');
    div.className = 'msg ' + color + (isMine ? ' mine' : '');
    const nameEl = document.createElement('span');
    nameEl.className = 'name';
    nameEl.textContent = name + ':';
    div.appendChild(nameEl);
    div.appendChild(document.createTextNode(text));
    const t = document.createElement('span');
    t.className = 'time';
    t.textContent = new Date(ts || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.appendChild(t);
    box.appendChild(div);
    while (box.children.length > MAX_CHAT_DOM) box.removeChild(box.firstChild);
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 100;
    if (nearBottom) box.scrollTop = box.scrollHeight;
  }

  incrementUnread() {
    this.unreadCount++;
    const b = $('chatBadge');
    b.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
    b.classList.remove('hidden');
  }

  clearUnread() { this.unreadCount = 0; $('chatBadge').classList.add('hidden'); }

  showChatPopup(name, avatar, text) {
    const el = $('chatPopup');
    const signal = this.getChatSignal(text);
    const icon = $('cpIcon');
    $('cpAvatar').textContent = avatar;
    $('cpName').textContent = name;
    $('cpText').textContent = signal.label;
    icon.textContent = signal.icon;
    icon.classList.remove('reaction-pop');
    void icon.offsetWidth;
    icon.classList.add('reaction-pop');
    el.classList.remove('reaction-heart', 'reaction-laugh', 'reaction-message');
    el.classList.add(signal.className);
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(this.chatPopupTimer);
    this.chatPopupTimer = setTimeout(() => el.classList.remove('show'), 3500);
  }

  openChat() { this.chatOpen = true; $('chatPanel').classList.add('open'); this.clearUnread(); }
  closeChat() { this.chatOpen = false; $('chatPanel').classList.remove('open'); }

  showWinScreen() {
    const G = this.getState();
    if (!G || !G.winner) return;
    clearInterval(this.turnTimerInterval);
    if (!$('winOverlay').classList.contains('hidden')) return;
    const w = G.winner; const name = G.players[w]?.name || w;
    const isMeWinner = (this.getMode() === 'local') ? true : (w === this.getMyColor());
    $('winBadge').textContent = isMeWinner ? '🏆' : '★';
    $('winTitle').textContent = isMeWinner ? `${name} Wins!` : `${name} Won!`;
    $('winSub').textContent = name + ' brought all 4 tokens home!';
    const card = $('winCard');
    for (let i = 0; i < 28; i++) {
      const c = document.createElement('div'); c.className = 'confetti';
      c.style.left = Math.random() * 100 + '%';
      c.style.background = ['#F4C430', '#E24B4B', '#2ECC71', '#3B82F6', '#FFF', '#FF7676'][Math.floor(Math.random() * 6)];
      c.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
      c.style.animationDelay = (Math.random() * 0.6) + 's';
      card.appendChild(c); setTimeout(() => c.remove(), 4000);
    }
    $('winOverlay').classList.remove('hidden');
    if (isMeWinner) this.showEventToast('👑', 'VICTORY!', '', 1800);
    else { this.showEventToast('😢', 'GAME OVER', '', 1800); this.sound.lose(); }
  }

  getMyName() { return ''; }
  getMyAvatar() { return ''; }
}