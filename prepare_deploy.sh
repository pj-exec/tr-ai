
#!/bin/bash
#
# Prepare to deploy files by zip
# Run on docker workspace
#

###---------------------------------------###
### settings
###---------------------------------------###

LARADOCK_DIR=laradock/
LARAVEL_DIR=laravel/
DOCKER_PARAMS="--build nginx workspace php-fpm mariadb"

###---------------------------------------###
### functions
###---------------------------------------###

##
# Check require params
#
checkRequireParams () {
  if [ -z $1 ]; then
    echo "Required ENV(production or development ...)"
    exit;
  else
    ENV=$1
  fi
}

##
# Up docker
#
upDocker () {
  cd ${abspath}
  cd ${LARADOCK_DIR}
  docker network create shared
  docker-compose up -d ${DOCKER_PARAMS}

  echo "---DOCKER_PARAMS---"
  echo $DOCKER_PARAMS
  echo "-------------------"

}

##
# composer install
#
installComposer () {
  cd ${abspath}
  cd ${LARADOCK_DIR}
  
  echo "---start composer install---"
  echo $LARADOCK_DIR
  echo "-------------------"
  
  docker-compose exec -T workspace composer self-update
  
  if [ ${ENV} == "development" ]; then
    docker-compose exec -T workspace composer install
  else
    docker-compose exec -T workspace composer install --no-dev --optimize-autoloader
  fi
  echo "---end composer install---"
  
  docker-compose exec -T workspace php artisan storage:link
  docker-compose exec -T workspace php artisan cache:clear
  docker-compose exec -T workspace php artisan config:clear
  docker-compose exec -T workspace php artisan config:cache
}

##
# npm install
#
installNpm () {
  cd ${abspath}
  cd ${LARAVEL_DIR}
  npm install
  npm run build
}


##
# replace docker env
#
replaceDockerEnv () {
  cd ${abspath}
  cd ${LARADOCK_DIR}
  cp .env .env.tmp
  cp .env.${ENV} .env
}

##
# replace laravel env
#
replaceLaravelEnv () {
  cd ${abspath}
  cd ${LARAVEL_DIR}
  cp .env .env.tmp
  cp .env.${ENV} .env
}

##
# replace maintenace env
#
replaceMaintenanceEnv () {
  cd ${abspath}
  cd maintenance/
  cp .env .env.tmp
  cp .env.${ENV} .env
}


##
# compress
#
compressDeployFiles() {
  cd ${abspath}
  echo "commpress"
  tar -zcf deploy.tar.gz * .[^.]*
}

##
# roll back docker settings
#
rollBackDockerSettings() {
  cd ${abspath}
  cd ${LARADOCK_DIR}
  mv -f .env.tmp .env
}

##
# roll back laravel settings
#
rollBackLaravelSettings() {
  cd ${abspath}
  cd ${LARAVEL_DIR}
  mv -f .env.tmp .env
}

##
# roll back maintenace settings
#
rollBackMaintenanceSettings() {
  cd ${abspath}
  cd maintenance/
  mv -f .env.tmp .env
}


###---------------------------------------###
### exec
###---------------------------------------###

abspath=$(cd $(dirname $0); pwd)

# Param $1 from console
checkRequireParams $1


##########################
# Replace env
##########################
replaceDockerEnv
replaceLaravelEnv
replaceMaintenanceEnv


# Up docker
upDocker

# Install composer
installComposer

# Install npm
installNpm

# Build Storybook
# if "${IS_STORYBOOK_BUILD}"; then
# installStoryBook
# fi

## compress files
compressDeployFiles



##########################
# Roll back env
##########################
rollBackDockerSettings
rollBackLaravelSettings
rollBackMaintenanceSettings

exit;


