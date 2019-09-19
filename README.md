My Manga
========

view your local comics

## Install

```bash
npm install my-manga -g
```

## Usage

```bash
cd your/manga/dir
my-manga start

# or

my-manga start --dir your/manga/dir

# or

my-manga start --settings settings.json
```

### options

```bash
Usage: start [options]

start my manga server

Options:
  -o, --open                 open browser
  -p, --port <port>          port used for server (default: 3033)  
  -d, --dir <dir>            specify dir as manga repo
  -s, --settings <settings>  settings file
  -h, --help                 output usage information
```

### settings

**settings.json**
```json
{
  // multiple repos support
  "repos": [
    "C:\\repo-a",
    "D:\\repo-b"
    "E:\\repo-c"
  ]
}
```

## Browsers support

Modern browsers.

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>IE / Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Safari |
| --------- | --------- | --------- | --------- |
|IE11, Edge| last 2 versions| last 2 versions| last 2 versions


## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, takumiao13