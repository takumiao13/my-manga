#!/usr/bin/env node
'use strict';

const program = require('commander');

program
  .version(require('../package').version)
  .usage('<command> [options]');

program
  .command('init')
  .description('create my manga app')
  .action(cmd => require('../lib/init')(cmd));

program
  .command('start')
  .description('start my manga app')
  .option('-o, --open', 'open browser after starting the server')
  .option('-p, --port <port>', 'port to use (default: 3000)')
  .option('-d, --dir <dir>', 'specify dir')
  .option('--app-data <appData>', 'specify data dir')
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