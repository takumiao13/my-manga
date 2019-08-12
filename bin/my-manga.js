#!/usr/bin/env node
'use strict';

const program = require('commander');

program
  .version(require('../package').version)
  .usage('<command> [options]');

program
  .command('serve')
  .description('start server for development')
  .option('-d, --dir <dir>', 'specify dir')
  .option('-s, --settings <settings>', 'settings file')
  .action((cmd) => require('../lib/serve')(cmd));

program
  .command('start')
  .description('start my manga server')
  .option('-o, --open', 'open browser')
  .option('-p, --port <port>', 'port used for server (default: 8000)')
  .option('-d, --dir <dir>', 'specify dir')
  .option('-s, --settings <settings>', 'settings file')
  .action((cmd) => require('../lib/start')(cmd));

program.parse(process.argv);