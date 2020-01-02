const spawn = require('cross-spawn');
const cliOptions = require('./cli-options');

const args = cliOptions(process.argv);
process.env.APP_MODE = args.mode;
process.env.APP_PLATFORM = args.platform;

spawn('vue-cli-service', [ `inspect > vue-config/vue.output.${args.mode}.js` ], { stdio: 'inherit', shell: true });