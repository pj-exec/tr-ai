#!/bin/bash

#
#  !!!!! need run in your local. not workspace on docker
#

####################################
# args
####################################

# ssh key
if [ -z "$1" ]; then
  echo "Required SSH_KEY 1st arg ...)"
  exit;
else
  SSH_KEY="-i $1"
fi

# ssh user
if [ -z "$2" ]; then
  echo "Required SSH_USER 2nd arg ...)"
  exit;
else
  SSH_USER=$2
fi

# project name
if [ -z "$3" ]; then
  echo "Required DEPLOY_DIR 3rd arg ...)"
  exit;
else
  DEPLOY_DIR="/home/projects/$3/"
fi

# docker params
if [ -z "$4" ]; then
  echo "Required DOCKER_PARAMS 4th arg ...)"
  exit;
else
  DOCKER_PARAMS=$4
fi


####################################
# depends params
####################################

# laradock dir
LARADOCK_DIR=laradock

# root dir
ROOT_DIR=laravel

####################################
# fixed params
####################################

TAR_FILE=deploy.tar.gz
TMP_DIR=tmp_deploy
DATETIME=`date +%Y-%m-%d_%H.%M.%S`


####################################
# backup
####################################
cmds=()
cmds+=("cd ${DEPLOY_DIR};")


## backup
cmds+=("echo remove old backups...;")
cmds+=("bash ./delete_backup.sh;")

cmds+=("echo backup...;")
cmds+=("mkdir backup_${DATETIME};")
cmds+=("cp -rp ${ROOT_DIR}/ backup_${DATETIME};")
cmds+=("cp -rp ${LARADOCK_DIR}/ backup_${DATETIME};")

## exec
ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}


####################################
# upload
####################################

# upload
/usr/bin/scp ${SSH_KEY} ${TAR_FILE} ${SSH_USER}:${DEPLOY_DIR}


####################################
# up zip
####################################

cmds=()
cmds+=("cd ${DEPLOY_DIR};")

# unzip
cmds+=("echo unzip...;")
cmds+=("sudo rm -rf ${TMP_DIR}/;")
cmds+=("mkdir ${TMP_DIR}/;")
cmds+=("tar -zxf ${TAR_FILE} -C ${TMP_DIR}/;")

ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}


####################################
# laravel maintenance mode down
####################################
cmds=()
cmds+=("cd ${DEPLOY_DIR};")

cmds+=("echo laravel maintenance mode on ...;")
cmds+=("cd ${LARADOCK_DIR}/;")
cmds+=("sudo docker-compose exec -T workspace php artisan down;")

ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}


####################################
# maintenance docker up
####################################

cmds=()
cmds+=("cd ${DEPLOY_DIR};")

## up
cmds+=("echo maintenance docker restart...;")
cmds+=("cd ${TMP_DIR}/maintenance/;")
cmds+=("sudo docker-compose up -d;")

ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}


####################################
# wait for update proxy
####################################

sleep 1m

####################################
# stop main docker
####################################

cmds=()
cmds+=("cd ${DEPLOY_DIR};")

cmds+=("echo docker down...;")
cmds+=("cd ${LARADOCK_DIR}/;")
cmds+=("sudo docker-compose down;")

ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}


####################################
# deploy
####################################

cmds=()
cmds+=("cd ${DEPLOY_DIR};")

## deploy
cmds+=("echo deploy...;")
cmds+=("sudo rm -rf ${ROOT_DIR}/;")
cmds+=("sudo rm -rf ${LARADOCK_DIR}/;")
cmds+=("cp -rp ${TMP_DIR}/${ROOT_DIR}/ ${ROOT_DIR}/;")
cmds+=("cp -rp ${TMP_DIR}/${LARADOCK_DIR}/ ${LARADOCK_DIR}/;")
cmds+=("cp -p ${TMP_DIR}/delete_backup.sh ./delete_backup.sh;")

ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}


####################################
# docker start
####################################
cmds=()
cmds+=("cd ${DEPLOY_DIR};")

cmds+=("echo docker restart...;")
cmds+=("cd ${LARADOCK_DIR}/;")
cmds+=("sudo docker-compose up -d ${DOCKER_PARAMS};")
cmds+=("sudo docker-compose exec -T workspace php artisan down;")
cmds+=("sudo docker-compose exec -T workspace php artisan migrate --force;")

ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}


####################################
# strage copy from old to new
####################################
cmds=()
cmds+=("cd ${DEPLOY_DIR};")

cmds+=("cp -rp backup_${DATETIME}/laravel/storage laravel/;")

ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}


####################################
# permissions
####################################
cmds=()
cmds+=("cd ${DEPLOY_DIR};")

cmds+=("sudo docker-compose exec -T workspace chown -R laradock:laradock storage/;")
cmds+=("sudo docker-compose exec -T workspace chmod -R 775 storage/;")

ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}


####################################
# cach clear
####################################

cmds=()
cmds+=("cd ${DEPLOY_DIR};")

cmds+=("echo cach clear...;")
cmds+=("cd ${LARADOCK_DIR}/;")
cmds+=("sudo docker-compose exec -T workspace php artisan storage:link;")
cmds+=("sudo docker-compose exec -T workspace php artisan cache:clear;")
cmds+=("sudo docker-compose exec -T workspace php artisan config:clear;")
cmds+=("sudo docker-compose exec -T workspace php artisan config:cache;")

ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}

####################################
# wait for update proxy
####################################

sleep 1m


####################################
# maintenance down
####################################

cmds=()
cmds+=("cd ${DEPLOY_DIR};")

## up
cmds+=("echo maintenance docker restart...;")
cmds+=("cd ${TMP_DIR}/maintenance/;")
cmds+=("sudo docker-compose down;")

ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}

####################################
# laravel maintenance mode up
####################################
cmds=()
cmds+=("cd ${DEPLOY_DIR};")

cmds+=("echo laravel maintenance mode off ...;")
cmds+=("cd ${LARADOCK_DIR}/;")
cmds+=("sudo docker-compose exec -T workspace php artisan up;")

ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}


####################################
# remove no needs
####################################

cmds=()
cmds+=("cd ${DEPLOY_DIR};")

## remove no need files
cmds+=("echo remove deploy files...;")
cmds+=("rm ${TAR_FILE};")
cmds+=("sudo rm -rf ${TMP_DIR}/;")
ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}
