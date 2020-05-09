NAME=$1
PORT=$2
SETTINGS=$3

## start server
pm2 delete -s my-manga-${NAME} || :
pm2 start ./bin/my-manga.js --name my-manga-${NAME} -- start --settings ${SETTINGS} --port ${PORT}