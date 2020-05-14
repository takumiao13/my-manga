My Manga
========

A Free Comics Management.

## Install

```bash
npm install my-manga -g --production
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

### Options

```bash
Usage: start [options]

start my manga server

Options:
  -o, --open .................. open browser after starting the server
  -p, --port .................. port to use (default: 3033)  
  -d, --dir ................... specify dir as manga repo
  -s, --settings .............. settings file
  --datadir ................... specify data dir
  --cachedir .................. specify cache dir
  -h, --help .................. output usage information
```

### Settings

```js
{
  "repos": [ // multiple repos support
    "C:\\repo-a",
    "D:/repo-b"
    "/volume1/repo-c"
  ],
  "server": {
    "port": 3033, // Server port
    "ssl": true, // Enable https
    "cert": "cert.pem", // Path to ssl cert file
    "key": "key.pem", // Path to ssl key file
  },
  "cachedir": "/usr/mymanga/cache",
  "datadir": "/usr/mymanga/config"
}
```

## Comic Naming

### Chapters

Chapters of a comic can be stored together and presented as a single title. Place each comic chapter in the same folder and give each chapter a name with the folder name as a prefix as seen below.

```
/Comics
  /Zoo
    /Zoo - Chapter-1
    /Zoo - Chapter-2
    /Zoo - Chapter-3
    /Zoo - Chapter-4
    /Zoo - Chapter-5
    /Zoo - Chapter-6
```

To distinguish between chapters, each filename needs to have a space, hyphen, space.


### Version

Version of a comic can be placed between brackets added to the end of filenames.

```
/Comics
  /Foo [DL版]
  /Bar [English]
  /Baz [中国翻译]
```

### Multi-version

You can also store multiple versions of a comic in a single folder as versions. 
Versions should be placed between brackets with the same result as seen below.

```
/Comics
  /Zoo
    /Zoo [720]
    /Zoo [Digital]
    /Zoo [Full Color]
    /Zoo [PDF].pdf
    /Zoo [Motion].mp4
```

## Browsers support
- Chrome (last 2 versions)


## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, takumiao13