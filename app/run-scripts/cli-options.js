const CLI_OPTIONS_MAP = {
  '--mode': 'mode',
  '--platform': 'platform'
};

const CLI_OPTION_KEYS = Object.keys(CLI_OPTIONS_MAP);

module.exports = function cliOptions(argv = process.argv) {
  const options = {
    mode: 'dev',
    platform: 'web'
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg in CLI_OPTIONS_MAP) {
      options[ CLI_OPTIONS_MAP[arg] ] = argv[++i];
      continue;
    }

    for (let j = 0; j < CLI_OPTION_KEYS.length; j++) {
      const flag = CLI_OPTION_KEYS[j];

      if (arg.startsWith(flag + '=')) {
        options[ CLI_OPTIONS_MAP[flag] ] = arg.slice(flag.length + 1);
        break;
      }
    }
  }

  return options;
};