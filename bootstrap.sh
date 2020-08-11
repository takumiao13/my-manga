NAME=$1
PORT=$2
APP_DATA=$3
APP_MODE=$4

export APP_MODE=$APP_MODE
## start server
pm2 delete -s ${NAME} || :
pm2 start ./bin/cli.js --name ${NAME} -- start --app-data ${APP_DATA} --port ${PORT}