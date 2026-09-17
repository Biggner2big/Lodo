export const ALL_COLORS = ['red', 'green', 'yellow', 'blue'];

export const COLOR_HEX = {
  red: { main: '#E24B4B', dark: '#8B0000', light: '#FFA1A1' },
  green: { main: '#2ECC71', dark: '#145A32', light: '#7FE08A' },
  yellow: { main: '#F4C430', dark: '#8B6914', light: '#FFF3B3' },
  blue: { main: '#3B82F6', dark: '#1E3A8A', light: '#7AB4FF' }
};

export const AVATARS = ['😎', '🦁', '🐯', '🐺', '🦊', '🐼', '🐨', '🐸', '🦄', '🐲', '👑', '🎯', '⚡', '🔥', '🌟', '💎', '🚀', '🎮'];

export const MAIN_PATH = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0]
];

export const START_INDEX = { red: 0, green: 13, yellow: 26, blue: 39 };

export const HOME_COLUMN = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]]
};

export const BASE_CELLS = {
  red: [[2.25, 2.25], [2.25, 3.75], [3.75, 2.25], [3.75, 3.75]],
  green: [[2.25, 11.25], [2.25, 12.75], [3.75, 11.25], [3.75, 12.75]],
  yellow: [[11.25, 11.25], [11.25, 12.75], [12.75, 11.25], [12.75, 12.75]],
  blue: [[11.25, 2.25], [11.25, 3.75], [12.75, 2.25], [12.75, 3.75]]
};

export const HOME_CELLS = {
  red: [[7.35, 6.35], [7.65, 6.35], [7.35, 6.65], [7.65, 6.65]],
  green: [[6.35, 7.35], [6.35, 7.65], [6.65, 7.35], [6.65, 7.65]],
  yellow: [[7.35, 8.35], [7.65, 8.35], [7.35, 8.65], [7.65, 8.65]],
  blue: [[8.35, 7.35], [8.35, 7.65], [8.65, 7.35], [8.65, 7.65]]
};

export const SAFE_CELLS = new Set(['6,1', '1,8', '8,13', '13,6', '2,6', '6,12', '12,8', '8,2']);

export const STEPS_TO_HOME = 56;

export const TURN_TIMEOUT_SEC = 15;

export const DICE_ROTATIONS = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 }
};

export const CHAT_REACTIONS = Object.freeze({
  '❤️': { icon: '❤️', label: 'Sent a heart', className: 'reaction-heart' },
  '❤': { icon: '❤️', label: 'Sent a heart', className: 'reaction-heart' },
  '😂': { icon: '😂', label: 'Laughing', className: 'reaction-laugh' },
  '🤣': { icon: '🤣', label: 'Laughing', className: 'reaction-laugh' }
});

export const MAX_CHAT_DOM = 50;
export const MAX_PROCESSED_ACTIONS = 200;