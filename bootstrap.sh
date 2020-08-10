NAME=$1
PORT=$2
APP_DATA=$3

## start server
pm2 delete -s my-manga-${NAME} || :
pm2 start ./bin/cli.js --name my-manga-${NAME} -- start --app-data ${APP_DATA} --port ${PORT}