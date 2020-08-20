const pathFn = require('path');
const fs = require('fs-extra');
const { whiteBright, green, yellow } = require('chalk');
const { log } = console;

const generateSettings = ({ name }) => {
  const json = {
    name,
    repos: [],
    server: {}
  };

  return JSON.stringify(json, null, 2);
}

// TODO force recreate settings.json and remove `cache` `data` dir
async function init(args) {
  const pkgPath = pathFn.resolve(__dirname, '../package.json');
  const pkg = fs.readJSONSync(pkgPath);
  log(`${whiteBright('my-manga init')} ${yellow(`v${pkg.version}`)}`);

  // name
  const name = args;
  const appDir = pathFn.join(process.cwd(), name);
  fs.ensureDirSync(appDir);

  const settingsJSON = generateSettings({ name });
  fs.writeFileSync(pathFn.join(appDir, 'settings.json'), settingsJSON);

  log(`${green('success')} Saved settings.json`)
}

module.exports = init;