DOCKER_NAME="madbook"
DOCKER_IMAGE="calom1992/madbook_img:latest"


existed=$(docker inspect --format '{{.State.Running}}' ${DOCKER_NAME} 2> /dev/null)
if [ "${existed}" == "true" ]
then
  docker stop ${DOCKER_NAME}
  docker rm ${DOCKER_NAME} > /dev/null 2>&1
fi


docker run -itd \
	--name ${DOCKER_NAME} \
	--net host \
	--restart=always \
	-e MAD_BOOK_MONGODB_URL=mongodb://mongo:mongopassword@127.0.0.1/admin \
  -e PASSWORD_ENCRYPT_SALT=EwBYiqsizdkmmK7BCnUlkqHD2cxXjd78 \
  -e TOKEN_ENCRYPT_SALT=EwBYiqsizdkmmK7BCnUlkqHD2cxXjd78 \
	${DOCKER_IMAGE}
