import { MAX_PROCESSED_ACTIONS } from './constants.js';

const processedActions = new Set();

export function markProcessed(id) {
  if (!id) return false;
  if (processedActions.has(id)) return true;
  processedActions.add(id);
  if (processedActions.size > MAX_PROCESSED_ACTIONS) {
    const arr = Array.from(processedActions);
    for (let i = 0; i < Math.floor(arr.length / 2); i++) processedActions.delete(arr[i]);
  }
  return false;
}

export function genActionId(prefix, playerId) {
  return prefix + '-' + playerId.slice(-6) + '-' + Date.now().toString(36) + '-' +
    Math.random().toString(36).slice(2, 6);
}

export function isValidActionId(value) {
  return typeof value === 'string' && value.length >= 1 && value.length <= 140;
}

export function isValidPlayerId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value);
}

export function safeDisplayName(value, fallback = 'Player') {
  if (typeof value !== 'string') return fallback;
  const name = value.trim().slice(0, 20);
  return name || fallback;
}

export function safeAvatar(value, avatars) {
  return typeof value === 'string' && avatars.includes(value) ? value : '😎';
}

export function safeChatText(value) {
  return typeof value === 'string' ? value.trim().slice(0, 200) : '';
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export class NetworkManager {
  constructor(supa, playerId) {
    this.supa = supa;
    this.playerId = playerId;
    this.lobbyChannel = null;
    this.roomChannel = null;
    this.chatChannel = null;
    this.gameChannel = null;
    this.lobbySubscribed = false;
    this.roomPresenceMembers = [];
    this.ROOM_ID = null;
    this.CURRENT_ROOM_CODE = null;
  }

  bootLobbyChannel(onPresenceSync, onChallenge) {
    if (this.lobbyChannel || !this.supa) return;
    this.lobbyChannel = this.supa.channel('ludo-lobby-v3', {
      config: { presence: { key: this.playerId }, broadcast: { self: false } }
    });
    this.lobbyChannel.on('presence', { event: 'sync' }, onPresenceSync);
    this.lobbyChannel.on('presence', { event: 'join' }, onPresenceSync);
    this.lobbyChannel.on('presence', { event: 'leave' }, onPresenceSync);
    this.lobbyChannel.on('broadcast', { event: 'challenge' }, ({ payload }) => {
      if (!payload || payload.to !== this.playerId) return;
      onChallenge(payload);
    });
    this.lobbyChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.lobbySubscribed = true;
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        this.lobbySubscribed = false;
        setTimeout(() => {
          if (!this.lobbySubscribed && this.supa) {
            try { this.lobbyChannel.unsubscribe(); } catch (e) { }
            this.lobbyChannel = null;
            this.bootLobbyChannel(onPresenceSync, onChallenge);
          }
        }, 4000);
      }
    });
  }

  trackPresence(data) {
    if (!this.lobbyChannel) return;
    try {
      this.lobbyChannel.track({ id: this.playerId, ...data, ts: Date.now() });
    } catch (e) { console.warn('PRESENCE track error', e); }
  }

  createRoomChannel(roomCode, isHost, desiredCount, onPresenceSync, onInit, onState, onIntentRoll, onIntentMove, onLeave) {
    if (this.roomChannel) {
      try { this.roomChannel.unsubscribe(); } catch (e) { }
      this.roomChannel = null;
    }
    this.ROOM_ID = 'ludo-room-' + roomCode;
    this.CURRENT_ROOM_CODE = roomCode;
    if (!this.supa) return;

    this.roomChannel = this.supa.channel(this.ROOM_ID, {
      config: { presence: { key: this.playerId }, broadcast: { self: false } }
    });

    this.roomChannel.on('presence', { event: 'sync' }, onPresenceSync);
    this.roomChannel.on('presence', { event: 'join' }, onPresenceSync);
    this.roomChannel.on('presence', { event: 'leave' }, ({ key }) => {
      onPresenceSync();
      if (onLeave) onLeave(key);
    });

    this.roomChannel.on('broadcast', { event: 'init' }, ({ payload }) => {
      if (isHost || !payload || !payload.state) return;
      onInit(payload);
    });

    this.roomChannel.on('broadcast', { event: 'state' }, ({ payload }) => {
      if (isHost || !payload) return;
      onState(payload);
    });

    this.roomChannel.on('broadcast', { event: 'intent-roll' }, ({ payload }) => {
      if (!isHost || !payload || !isValidActionId(payload.actionId)) return;
      if (markProcessed(payload.actionId)) return;
      onIntentRoll(payload);
    });

    this.roomChannel.on('broadcast', { event: 'intent-move' }, ({ payload }) => {
      if (!isHost || !payload || !isValidActionId(payload.actionId) || !Number.isInteger(payload.tokenId)) return;
      if (markProcessed(payload.actionId)) return;
      onIntentMove(payload);
    });

    this.roomChannel.on('broadcast', { event: 'leave' }, ({ payload }) => {
      if (!payload) return;
      if (payload.from === 'host' && !isHost) onLeave(payload);
    });

    this.roomChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        try {
          this.roomChannel.track({
            id: this.playerId,
            isHost,
            desiredCount,
            joinedAt: Date.now()
          });
        } catch (e) { }
      }
    });

    this.gameChannel = this.roomChannel;
  }

  bootChatChannel(roomId, onChat) {
    if (!roomId || !this.supa) return;
    this.chatChannel = this.supa.channel('ludo-chat-' + roomId, {
      config: { broadcast: { self: false } }
    });
    this.chatChannel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      if (!payload || typeof payload !== 'object' || typeof payload.name !== 'string') return;
      const text = safeChatText(payload.text);
      if (!text || !['red', 'green', 'yellow', 'blue'].includes(payload.color)) return;
      const name = safeDisplayName(payload.name, 'Player');
      onChat({ name, text, color: payload.color, avatar: payload.avatar, ts: payload.ts });
    });
    this.chatChannel.subscribe();
  }

  sendIntentRoll(actionId) {
    if (!this.roomChannel) return;
    this.roomChannel.send({ type: 'broadcast', event: 'intent-roll', payload: { playerId: this.playerId, actionId } });
  }

  sendIntentMove(tokenId, actionId) {
    if (!this.roomChannel) return;
    this.roomChannel.send({ type: 'broadcast', event: 'intent-move', payload: { playerId: this.playerId, tokenId, actionId } });
  }

  sendState(state) {
    if (!this.roomChannel) return;
    this.roomChannel.send({ type: 'broadcast', event: 'state', payload: state });
  }

  sendInit(state, activeColors, roomCode) {
    if (!this.roomChannel) return;
    this.roomChannel.send({ type: 'broadcast', event: 'init', payload: { state, activeColors, roomCode } });
  }

  sendChat(message) {
    if (!this.chatChannel) return;
    this.chatChannel.send({ type: 'broadcast', event: 'chat', payload: message });
  }

  sendLeave(payload) {
    if (!this.roomChannel) return;
    this.roomChannel.send({ type: 'broadcast', event: 'leave', payload });
  }

  sendChallenge(targetId, roomCode, fromName, fromAvatar) {
    if (!this.lobbyChannel) return;
    this.lobbyChannel.send({
      type: 'broadcast', event: 'challenge',
      payload: { from: this.playerId, fromName, fromAvatar, to: targetId, roomCode, ts: Date.now() }
    });
  }

  teardown() {
    try { if (this.roomChannel) { this.roomChannel.unsubscribe(); this.roomChannel = null; } } catch (e) { }
    try { if (this.chatChannel) { this.chatChannel.unsubscribe(); this.chatChannel = null; } } catch (e) { }
    try { if (this.lobbyChannel) { this.lobbyChannel.unsubscribe(); this.lobbyChannel = null; } } catch (e) { }
  }
}