const LATEST_PATH = '@latest';

const MANGA_GRID_SIZE = { 
  sm: 3,
  md: 4,
  lg: 6 
};

const KEY_CODE = {
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40,
  A: 65,
  D: 68,
  W: 87,
  S: 83,
  F1: 112,
  F11: 122
};

const KEYBOARD_ACTION = {
  left: {
    prev: KEY_CODE.A,
    next: KEY_CODE.D,
    up: KEY_CODE.W,
    down: KEY_CODE.S,
    help: KEY_CODE.F1
  },

  right: {
    prev: KEY_CODE.LEFT,
    next: KEY_CODE.RIGHT,
    up: KEY_CODE.UP,
    down: KEY_CODE.DOWN,
    help: KEY_CODE.F1
  }
}

const consts = {
  LATEST_PATH,
  MANGA_GRID_SIZE,
  KEY_CODE,
  KEYBOARD_ACTION
}

export default consts;