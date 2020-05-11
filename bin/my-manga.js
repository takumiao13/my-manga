#!/usr/bin/env node
'use strict';

const program = require('commander');

program
  .version(require('../package').version)
  .usage('<command> [options]');

program
  .command('start')
  .description('start my manga server')
  .option('-o, --open', 'open browser after starting the server')
  .option('-p, --port <port>', 'port to use (default: 3000)')
  .option('-d, --dir <dir>', 'specify dir')
  .option('-s, --settings <settings>', 'settings file')
  .option('--datadir', '<datadir>', 'specify data dir')
  .option('--cachedir', '<cachedir>', 'specify cache dir')
  .option('--index', 'rebuild index')
  .action(cmd => require('../lib/start')(cmd));

program
  .command('index')
  .option('-d, --dir <dir>', 'specify dir')
  .option('--create', 'create index')
  .option('--drop', 'drop index')
  .option('--rebuild', 'rebuild index')
  .action(cmd => require('../lib/indexing')(cmd))

program.parse(process.argv);