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
  -o, --open .................. open browser after starting the server
  -p, --port <port> ........... port to use (default: 3033)  
  -d, --dir <dir> ............. specify dir as manga repo
  -s, --settings <settings> ... settings file
  -h, --help .................. output usage information
```

### settings

**settings.json**
```json
{
  "repos": [ // multiple repos support
    "C:\\repo-a",
    "D:/repo-b"
    "E:\\repo-c"
  ]
}
```

## Browsers support

- IE11, Edge
- Firefox (last 2 versions)
- Chrome (last 2 versions)


## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, takumiao13