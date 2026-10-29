#!/bin/bash

# sample command 
# 
# sh deploy_from_local_pc.sh ~/.ssh/tr-ai.sys4tr.com_ras projects@tr-ai.sys4tr.com tr-ai production "nginx workspace php-fpm mariadb" DBuser DBpw
#

###---------------------------------------###
### settings
###---------------------------------------###
LARADOCK_DIR=laradock/
LARAVEL_DIR=laravel/
MAINTENANCE_DIR=maintenance/
ABSPATH=$(cd $(dirname $0); pwd)
TAR_FILE=deploy.tar.gz
TMP_DIR=tmp_deploy
DATETIME=`date +%Y-%m-%d_%H.%M.%S`

###---------------------------------------###
### args
###---------------------------------------###

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

# env 
if [ -z "$4" ]; then
  echo "Required ENV 4th arg ...)"
  exit;
else
  ENV=$4
fi

# docker params
if [ -z "$5" ]; then
  echo "Required DOCKER_PARAMS 5th arg ...)"
  exit;
else
  DOCKER_PARAMS=$5
fi

# db user 
if [ -z "$6" ]; then
  echo "Required DB_USERNAME 6th arg ...)"
  exit;
else
  DB_USERNAME=$6
fi

# db pw 
if [ -z "$7" ]; then
  echo "Required DB_PASSWORD 7th arg ...)"
  exit;
else
  DB_PASSWORD=$7
fi

###---------------------------------------###
### remote server lock system
###---------------------------------------###
LOCKFILE="${DEPLOY_DIR}lockfile"
if [ -e ${LOCKFILE} ]; then
    echo "Lockfile ${LOCKFILE} exists. Exiting..."
    exit 1
fi
touch ${LOCKFILE}
trap "rm -f ${LOCKFILE}" EXIT

###---------------------------------------###
### functions
###---------------------------------------###

##
#  replaceEnv
#
replaceEnv () {
  set -x
  local dir=$1
  local env=$2
  cd "${ABSPATH}/${dir}" || { echo "Directory not found: ${ABSPATH}/${dir}"; return 1; }
  if [ -f .env ]; then
    cp .env .env.tmp
    if [ -f ".env.${env}" ]; then
      cp ".env.${env}" .env
    else
      echo "File not found: .env.${env}"
      return 1
    fi
  else
    echo "File not found: .env"
    return 1
  fi
  set +x
}

##
#  rollBackSettings
#
rollBackSettings () {
  set -x
  local dir=$1
  cd "${ABSPATH}/${dir}" || { echo "Directory not found: ${ABSPATH}/${dir}"; return 1; }
  if [ -f .env.tmp ]; then
    mv -f .env.tmp .env
  else
    echo "File not found: .env.tmp"
    return 1
  fi
  set +x
}

###---------------------------------------###
### Start local PC actions
###---------------------------------------###
echo "■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■"
echo "■■■■■■■■■■ Start local PC actions ■■■■■■■■■■"
echo "■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■"

# replaceDBaccess
echo " "
echo "■■■ replaceDBaccess"
sleep 5
cd ${ABSPATH}
cp "./${LARADOCK_DIR}.env.${ENV}" "./${LARADOCK_DIR}.env.${ENV}.backup"
cp "./${LARAVEL_DIR}.env.${ENV}" "./${LARAVEL_DIR}.env.${ENV}.backup"
while IFS= read -r line
do
  line=${line//___DB_USERNAME___/$DB_USERNAME}
  line=${line//___DB_PASSWORD___/$DB_PASSWORD}
  echo "$line"
done < "./${LARADOCK_DIR}.env.${ENV}" > temp && mv temp "./${LARADOCK_DIR}.env.${ENV}"
while IFS= read -r line
do
  line=${line//___DB_USERNAME___/$DB_USERNAME}
  line=${line//___DB_PASSWORD___/$DB_PASSWORD}
  echo "$line"
done < "./${LARAVEL_DIR}.env.${ENV}" > temp && mv temp "./${LARAVEL_DIR}.env.${ENV}"

# replaceEnv
echo "■■■ replaceEnv"
sleep 5
replaceEnv "${LARADOCK_DIR}" "${ENV}"
replaceEnv "${LARAVEL_DIR}" "${ENV}"
replaceEnv "${MAINTENANCE_DIR}" "${ENV}"

# Up docker
echo "■■■ upDocker"
sleep 5
set -x
cd ${ABSPATH}
cd ${LARADOCK_DIR}
docker network create shared
docker-compose up -d ${DOCKER_PARAMS}
set +x

# Install composer
echo "■■■ installComposer"
sleep 5
set -x
set -e  # If a command fails, stop the script
cd ${ABSPATH}
cd ${LARADOCK_DIR}
docker-compose exec -T workspace composer self-update
if [ ${ENV} !== "production" ]; then
  docker-compose exec -T workspace composer install -q
else
  docker-compose exec -T workspace composer install --no-dev --optimize-autoloader -q
fi
set +x
set +e  # Turn off the "stop on error" option

# Install npm
echo "■■■ installNpm"
sleep 5
set -x
set -e  # If a command fails, stop the script
cd ${ABSPATH}
cd ${LARADOCK_DIR}
docker-compose exec -T workspace php artisan cache:clear
docker-compose exec -T workspace php artisan config:clear
docker-compose exec -T workspace php artisan config:cache
docker-compose exec -T workspace npm install --silent
docker-compose exec -T workspace npm run build
set +x
set +e  # Turn off the "stop on error" option

## compress files
echo "■■■ compressDeployFiles"
sleep 5
set -x
cd ${ABSPATH}
tar --no-xattrs -zcf "${TAR_FILE}" "${LARADOCK_DIR}" "${LARAVEL_DIR}" "${MAINTENANCE_DIR}"
set +x

## rollBackSettings
echo "■■■ rollBackSettings"
sleep 5
rollBackSettings "${LARADOCK_DIR}"
rollBackSettings "${LARAVEL_DIR}"
rollBackSettings "${MAINTENANCE_DIR}"

## rollBack local site
echo "■■■ rollBackVite"
sleep 5
set -x
set -e  # If a command fails, stop the script
cd ${ABSPATH}
cd ${LARADOCK_DIR}
docker-compose exec -T workspace php artisan cache:clear
docker-compose exec -T workspace php artisan config:clear
docker-compose exec -T workspace php artisan config:cache
docker-compose down
docker-compose up -d ${DOCKER_PARAMS}
set +x
set +e  # Turn off the "stop on error" option

###---------------------------------------###
### Start remote actions
###---------------------------------------###
echo "■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■"
echo "■■■■■■■■■■ Start remote actions ■■■■■■■■■■"
echo "■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■"

## backup
echo "■■■ Backup Remote"
sleep 5
cmds=()
cmds+=("cd ${DEPLOY_DIR};")
cmds+=("mkdir backup_${DATETIME};")
cmds+=("cp -rp ${LARAVEL_DIR}/ backup_${DATETIME};")
cmds+=("cp -rp ${LARADOCK_DIR}/ backup_${DATETIME};")
ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}

# upload
echo "■■■ Upload"
sleep 5
set -x
cd ${ABSPATH}
/usr/bin/scp ${SSH_KEY} ${TAR_FILE} ${SSH_USER}:${DEPLOY_DIR}
set +x

# unzip
echo "■■■ Unzip"
sleep 5
cmds=()
cmds+=("cd ${DEPLOY_DIR};")
cmds+=("sudo rm -rf ${TMP_DIR}/;")
cmds+=("mkdir ${TMP_DIR}/;")
cmds+=("tar -zxf ${TAR_FILE} -C ${TMP_DIR}/;")
ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}

# maintenance mode on
echo "■■■ Laravel Maintenance mode on"
sleep 5
cmds=()
cmds+=("cd ${DEPLOY_DIR};")
cmds+=("cd ${LARADOCK_DIR}/;")
cmds+=("sudo docker-compose exec -T workspace php artisan down;")
ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}

# maintenance docker up
echo "■■■ Maintenance docker up"
sleep 5
cmds=()
cmds+=("cd ${DEPLOY_DIR};")
cmds+=("cd ${TMP_DIR}/${MAINTENANCE_DIR};")
cmds+=("sudo docker-compose up -d;")
ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}

# wait for update proxy
echo "■■■ Wait for update proxy (sleep 30sec)"
sleep 30

# stop laravel main docker
echo "■■■ Stop laravel main docker"
cmds=()
cmds+=("cd ${DEPLOY_DIR};")
cmds+=("cd ${LARADOCK_DIR}/;")
cmds+=("sudo docker-compose down;")
ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}

# deploy
echo "■■■ deploy"
sleep 5
cmds=()
cmds+=("cd ${DEPLOY_DIR};")
cmds+=("sudo rm -rf ${LARAVEL_DIR};")
cmds+=("sudo rm -rf ${LARADOCK_DIR};")
cmds+=("sudo rm -rf ${MAINTENANCE_DIR};")
cmds+=("cp -rp ${TMP_DIR}/${LARAVEL_DIR}/ ${LARAVEL_DIR}/;")
cmds+=("cp -rp ${TMP_DIR}/${LARADOCK_DIR}/ ${LARADOCK_DIR}/;")
cmds+=("cp -rp ${TMP_DIR}/${MAINTENANCE_DIR}/ ${MAINTENANCE_DIR}/;")
ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}

# Laravel dcoker up
echo "■■■ Laravel dcoker up"
sleep 5
cmds=()
cmds+=("cd ${DEPLOY_DIR};")
cmds+=("cd ${LARADOCK_DIR}/;")
cmds+=("sudo docker-compose up -d ${DOCKER_PARAMS};")
cmds+=("sudo docker-compose exec -T workspace php artisan down;")
cmds+=("sudo docker-compose exec -T workspace php artisan migrate --force;")
cmds+=("sudo docker-compose exec -T workspace chown -R laradock:laradock storage/;")
cmds+=("sudo docker-compose exec -T workspace chmod -R 775 storage/;")
cmds+=("sudo docker-compose exec -T workspace php artisan storage:link;")
cmds+=("sudo docker-compose exec -T workspace php artisan cache:clear;")
cmds+=("sudo docker-compose exec -T workspace php artisan config:clear;")
cmds+=("sudo docker-compose exec -T workspace php artisan config:cache;")
cmds+=("sudo docker-compose exec -T workspace npm install --silent;")
cmds+=("sudo docker-compose exec -T workspace npm run build;")
cmds+=("sudo docker-compose exec -T workspace php artisan up;")
ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}

# Maintenance docker down
echo "■■■ Maintenance docker down"
sleep 5
cmds=()
cmds+=("cd ${DEPLOY_DIR};")
cmds+=("cd ${TMP_DIR}/${MAINTENANCE_DIR};")
cmds+=("sudo docker-compose down;")
ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}

# Backup Download
echo "■■■ Backup Download"
sleep 5
# tar
cmds=()
cmds+=("cd ${DEPLOY_DIR};")
cmds+=("tar --no-xattrs -zcf backup_${DATETIME}.tar.gz  backup_${DATETIME};")
ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}
# download
cd ${ABSPATH}
/usr/bin/scp ${SSH_KEY} "${SSH_USER}:${DEPLOY_DIR}backup_${DATETIME}.tar.gz" "backup_${DATETIME}"

# Remove no need files in remote
echo "■■■ Remove no need files in remote"
sleep 5
cmds=()
cmds+=("cd ${DEPLOY_DIR};")
cmds+=("sudo rm -rf ${TMP_DIR};")
cmds+=("rm ${TAR_FILE};")
cmds+=("rm -rf backup_${DATETIME};")
ssh ${SSH_KEY} ${SSH_USER} -o "StrictHostKeyChecking no" ${cmds[*]}

# Remove no need files in local
echo "■■■ Remove no need files in local"
sleep 5
cd ${ABSPATH}
rm ${TAR_FILE}

# Rollback DB access info
echo " "
echo "■■■ Rollback DB access info"
sleep 5
cd ${ABSPATH}
mv "./${LARADOCK_DIR}.env.${ENV}.backup" "./${LARADOCK_DIR}.env.${ENV}"
mv "./${LARAVEL_DIR}.env.${ENV}.backup" "./${LARAVEL_DIR}.env.${ENV}"

exit;










