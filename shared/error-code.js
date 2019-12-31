const REPO_ERROR = 'REPO ERROR';
const MANGA_ERROR = 'MANGA ERROR';

const REPO_ICON_NAME = 'warehouse';
const MANGA_ICON_NAME = 'folder-items';

const REPO_UNACCESSED = 10100;
const MANGA_NO_DIR = 20100;

const ERR_CODE = {
  REPO_UNACCESSED,
  MANGA_NO_DIR
};

const errorCodeMap = {
  [REPO_UNACCESSED]: {
    icon: REPO_ICON_NAME,
    name: REPO_ERROR,
    message: 'Repo is not accessed, please check the path of repo and try it again.'
  },

  [MANGA_NO_DIR]: {
    icon: MANGA_ICON_NAME,
    name: MANGA_ERROR,
    message: 'No such manga directory'
  }
}

module.exports = {
  ERR_CODE,
  errorCodeMap
}