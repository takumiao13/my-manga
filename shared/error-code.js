const AUTH_ERROR = 'AUTH ERROR';
const REPO_ERROR = 'REPO ERROR';
const MANGA_ERROR = 'MANGA ERROR';
const USER_ERROR = 'USER ERROR';

// icons
const AUTH_ICON_NAME = 'user';
const REPO_ICON_NAME = 'warehouse';
const MANGA_ICON_NAME = 'folder-items';

// app error
const REPO_UNACCESSED = 10100;
const INVALD_USER = 10200;

// api error
const MANGA_NO_DIR = 20100;
const USER_NOT_FOUND = 30100;

const ERR_CODE = {
  REPO_UNACCESSED,
  MANGA_NO_DIR,
  USER_NOT_FOUND,
  INVALD_USER
};

const errorCodeMap = {
  [REPO_UNACCESSED]: {
    icon: REPO_ICON_NAME,
    name: REPO_ERROR,
    message: 'Repo is not accessed, please check the path of repo and try it again.'
  },

  [INVALD_USER]: {
    icon: AUTH_ICON_NAME,
    name: AUTH_ERROR,
    message: 'Invalid user, please contact your mangaer.'
  },

  [MANGA_NO_DIR]: {
    icon: MANGA_ICON_NAME,
    name: MANGA_ERROR,
    message: 'No such manga directory.'
  },

  [USER_NOT_FOUND]: {
    name: USER_ERROR,
    message: 'Incorrect username or password.'
  },
}

module.exports = {
  ERR_CODE,
  errorCodeMap
}