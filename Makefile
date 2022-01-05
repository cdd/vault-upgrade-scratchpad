# When starting from scratch: `make -j 3 setup`
# Once that's done, some interesting tasks are `make -j 3 server`, `make -j 3 guard`, `make shell`

PACKAGE_NAME=vault
NETWORK_NAME=cdd-vault
NETWORK=--network $(NETWORK_NAME)
ENVS=-e MYSQL_HOST=percona \
	-e MYSQL_PRODUCTION_PASSWORD=password \
	-e SLATE_URL=http://slate:5000 \
	-e WEBPACKER_DEV_SERVER_HOST=$(JS_PACKAGE_NAME) \
	-e WEBPACKER_DEV_SERVER_PORT=3035 \

# ARM support: https://github.com/seleniarm/docker-selenium/issues/2
SELENIUM_VERSION=3.141.59-20200730
SELENIUM_STANDALONE=selenium/standalone-chrome-debug:$(SELENIUM_VERSION)
ARCH:=$(shell eval /usr/bin/arch)
ifeq ($(ARCH),arm64)
	SELENIUM_STANDALONE=seleniarm/standalone-chromium
endif

SELENIUM_WIDTH ?= 1360
SELENIUM_HEIGHT ?= 1020

SELENIUM_OPTIONS=-e SCREEN_WIDTH=$(SELENIUM_WIDTH) -e SCREEN_HEIGHT=$(SELENIUM_HEIGHT) -e TZ="US/Pacific"

# can be overridden like `make server PORT=3001`
PORT=127.0.0.1:3000
PORTS=-p $(PORT):3000
VOLUMES=--volume $(PWD):/tmp/src:delegated --workdir /tmp/src

JS_PACKAGE_NAME=cdd_node
JS_TESTING_NAME=cdd_node_testing

yarn_run = docker run --rm $(1)\
	$(VOLUMES) --volume /tmp/src/node_modules \
	$(NETWORK) \
	-e NODE_ENV=development \
	-e WEBPACKER_DEV_SERVER_HOST=0.0.0.0 \
	$(JS_PACKAGE_NAME)
yarn_dev = $(call yarn_run, $(1) -e VIRTUAL_HOST=cdd_node.127.0.0.1.nip.io -p 127.0.0.1:3035:3035 --name $(JS_PACKAGE_NAME))
yarn_test = $(call yarn_run, $(1) --name $(JS_TESTING_NAME))

-include $(dir $(lastword $(MAKEFILE_LIST)))/Makefile.common

yarndev_image:
	mkdir -p node_modules
	docker build -t $(JS_PACKAGE_NAME) -f Dockerfile.node .

$(JS_PACKAGE_NAME): network yarndev

kill_cdd_node:
	docker kill $(JS_PACKAGE_NAME) || true

yarndev: yarndev_image kill_cdd_node network
	$(call yarn_dev, -d) yarn jstart

cdd_node_interactive: yarndev_image kill_cdd_node
	$(call yarn_dev, -it) bash

yarndev_running: yarndev_image network
	(docker ps -f name=$(JS_PACKAGE_NAME) | grep $(JS_PACKAGE_NAME)) || $(call yarn_dev, -d) yarn jstart

# If this directory doesn't exist it means we have not checked out the submodules
public/marvin/.git:
	git submodule init
	git submodule update -f --init --recursive

submodules: public/marvin/.git
	git submodule update

# We stop at the development target because we don't really want to run yarn - we run the server instead
image: submodules
	docker build --target development -t $(PACKAGE_NAME) .

# For when we want to do ci things like mess with the performance db image
ci_image: submodules
	docker build --target ci -t $(PACKAGE_NAME) .

# chemaxon_image:
# 	docker build -t chemaxon -f ../java.Dockerfile ..

ci_images: image chemaxon_image yarndev_image

image_exists:
	docker images $(PACKAGE_NAME) | grep $(PACKAGE_NAME) || docker build -t $(PACKAGE_NAME) .

# chemaxon: submodules
# 	(docker ps -f name=chemaxon | grep chemaxon) || \
# 	(docker build -t chemaxon -f ../java.Dockerfile .. && \
# 	docker run --rm -d --net cdd-vault -p 127.0.0.1:8100:8100 --name=chemaxon chemaxon)

processor: image_exists network ## Runs the background processor
	docker run --rm -it $(NETWORK) $(VOLUMES) $(ENVS) $(PACKAGE_NAME) bash -c './script/processor'

recalculator: image_exists network ## Runs the background recalculator
	docker run --rm -it $(NETWORK) $(VOLUMES) $(ENVS) $(PACKAGE_NAME) bash -c './script/recalculator'

clear:
	rm -f tmp/pids/*

dstats: ## A little like top for docker
	docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.PIDs}}"

console: image_exists percona ## Interactive rails console
	docker run --rm -it $(NETWORK) $(VOLUMES) $(ENVS) $(PACKAGE_NAME) rails c

shell: image_exists network ## Interactive shell
	docker run --rm -it -e HEADLESS=false $(NETWORK) $(VOLUMES) $(ENVS) $(PACKAGE_NAME) bash

# rdebug-ide --host 0.0.0.0 bin/rspec some_file.rb
ide: image_exists network
	docker run --rm -it --name ide -p 127.0.0.1:1234:1234 -p 127.0.0.1:26162:26162 -e HEADLESS=false -e IDE_PROCESS_DISPATCHER=0.0.0.0:1234 $(PORTS) $(NETWORK) $(VOLUMES) $(ENVS) $(PACKAGE_NAME) bash

debug: image_exists network
	docker run --cap-add=SYS_PTRACE --security-opt seccomp=unconfined --rm -it -e HEADLESS=false $(NETWORK) $(VOLUMES) $(ENVS) $(PACKAGE_NAME) bash

# This is the *development* environment, but pointing at the *test* database
test_shell: image_exists network
	docker run -e DATABASE_URL=mysql2://percona/cdd_test --cap-add=SYS_PTRACE --rm -it $(NETWORK) $(VOLUMES) $(ENVS) $(PACKAGE_NAME) bash

server: yarndev_running image clear network ## Runs the rails server
	docker run --rm -it --name cdd $(NETWORK) $(VOLUMES) $(PORTS) $(ENVS) -e I18N_DEBUG=true -e WEBPACKER_DEV_SERVER_HOST=$(JS_PACKAGE_NAME) -e WEB_BINDING=0.0.0.0 $(PACKAGE_NAME) rails s -b 0.0.0.0

# This is the *development* environment, but pointing at the *test* database
test_server: yarndev_running image clear network
	docker run -e DATABASE_URL=mysql2://percona/cdd_test --rm -it --name cdd $(NETWORK) $(VOLUMES) $(ENVS) $(PORTS) -e WEBPACKER_DEV_SERVER_HOST=$(JS_PACKAGE_NAME) -e WEB_BINDING=0.0.0.0 $(PACKAGE_NAME) rails s -b 0.0.0.0

# This is the development environment pointing at the test db and running behind nginx.
# It is useful for testing the SSO machinery locally
selenium_server: kill_cdd_node nginx_proxy clear network saml-idp-server
	(docker kill cdd && sleep 1) || true
	docker run -e DATABASE_URL=mysql2://percona/cdd_test --rm -d --name cdd $(NETWORK) $(VOLUMES) $(ENVS) $(SAML_ENVS) $(PORTS) -e VIRTUAL_HOST=cdd.127.0.0.1.nip.io -e RAILS_ENV=selenium $(PACKAGE_NAME) bash -c '(rm -rf ./public/packs/*; rails webpacker:compile &); rails s -b 0.0.0.0'
	@echo
	@echo I am about to open the url https://cdd.127.0.0.1.nip.io:3443/.
	@echo It will be broken because yarn is still building -
	@echo but it will work when yarn is done.
	@echo
	sleep 45
	open 'https://cdd.127.0.0.1.nip.io:3443/'

kill_selenium:
	# sleep because it sometimes takes a second to bring it down
	docker kill selenium_node_1 selenium_node_2 selenium_node_3 selenium_node_4 selenium_node_5 selenium_node_6 || true
	docker kill selenium && sleep 1 || true

selenium_debug: kill_selenium
	# We need to mount volumes for file upload.  This way the path to the file is the same in the selenium container as it is in the rails container
	# Got rid of volumes.  Pretty sure we don't need it, and it sets the pwd - which is bad.
	docker run --rm -d $(NETWORK) -v /dev/shm:/dev/shm -p 127.0.0.1:25900:5900 \
	  $(SELENIUM_OPTIONS) \
		--name selenium $(SELENIUM_STANDALONE)

selenium_headless: kill_selenium
	docker run --rm -d $(NETWORK) $(VOLUMES) $(SELENIUM_OPTIONS) --name selenium selenium/standalone-chrome:$(SELENIUM_VERSION)

selenium_running: network
	(docker ps -f name=selenium | grep selenium) || \
	bash -c "$(MAKE) -C $(PWD) selenium_debug"

selenium_hub: kill_selenium
	docker run --rm -d $(NETWORK) --name selenium selenium/hub

selenium_nodes: selenium_hub
	docker run --rm -d $(NETWORK) $(VOLUMES) $(SELENIUM_OPTIONS) -v /dev/shm:/dev/shm -e HUB_HOST=selenium --name selenium_node_1 selenium/node-chrome:$(SELENIUM_VERSION)
	docker run --rm -d $(NETWORK) $(VOLUMES) $(SELENIUM_OPTIONS) -v /dev/shm:/dev/shm -e HUB_HOST=selenium --name selenium_node_2 selenium/node-chrome:$(SELENIUM_VERSION)
	docker run --rm -d $(NETWORK) $(VOLUMES) $(SELENIUM_OPTIONS) -v /dev/shm:/dev/shm -e HUB_HOST=selenium --name selenium_node_3 selenium/node-chrome:$(SELENIUM_VERSION)
	docker run --rm -d $(NETWORK) $(VOLUMES) $(SELENIUM_OPTIONS) -v /dev/shm:/dev/shm -e HUB_HOST=selenium --name selenium_node_4 selenium/node-chrome:$(SELENIUM_VERSION)
	docker run --rm -d $(NETWORK) $(VOLUMES) $(SELENIUM_OPTIONS) -v /dev/shm:/dev/shm -e HUB_HOST=selenium --name selenium_node_5 selenium/node-chrome:$(SELENIUM_VERSION)
	docker run --rm -d $(NETWORK) $(VOLUMES) $(SELENIUM_OPTIONS) -v /dev/shm:/dev/shm -e HUB_HOST=selenium --name selenium_node_6 selenium/node-chrome:$(SELENIUM_VERSION)

selenium_nodes_debug: selenium_hub
	docker run --rm -d $(NETWORK) $(VOLUMES) -p 127.0.0.1:25901:5900 -v /dev/shm:/dev/shm -e HUB_HOST=selenium --name selenium_node_1 selenium/node-chrome-debug:$(SELENIUM_VERSION)
	docker run --rm -d $(NETWORK) $(VOLUMES) -p 127.0.0.1:25902:5900 -v /dev/shm:/dev/shm -e HUB_HOST=selenium --name selenium_node_2 selenium/node-chrome-debug:$(SELENIUM_VERSION)
	docker run --rm -d $(NETWORK) $(VOLUMES) -p 127.0.0.1:25903:5900 -v /dev/shm:/dev/shm -e HUB_HOST=selenium --name selenium_node_3 selenium/node-chrome-debug:$(SELENIUM_VERSION)
	docker run --rm -d $(NETWORK) $(VOLUMES) -p 127.0.0.1:25904:5900 -v /dev/shm:/dev/shm -e HUB_HOST=selenium --name selenium_node_4 selenium/node-chrome-debug:$(SELENIUM_VERSION)
	docker run --rm -d $(NETWORK) $(VOLUMES) -p 127.0.0.1:25905:5900 -v /dev/shm:/dev/shm -e HUB_HOST=selenium --name selenium_node_5 selenium/node-chrome-debug:$(SELENIUM_VERSION)
	docker run --rm -d $(NETWORK) $(VOLUMES) -p 127.0.0.1:25906:5900 -v /dev/shm:/dev/shm -e HUB_HOST=selenium --name selenium_node_6 selenium/node-chrome-debug:$(SELENIUM_VERSION)

selenium_service: selenium_nodes

selenium_service_debug: selenium_nodes_debug

guard: image selenium_running yarndev_running percona elasticsearch network ## Specs runner
	docker run --rm -it --name guard $(NETWORK) $(VOLUMES) $(ENVS) -e RAILS_ENV=test -e HEADLESS=false $(PACKAGE_NAME) bin/guard

/tmp/saml-idp-server/Gemfile:
	git clone git@github.com:cdd/saml-idp-server.git /tmp/saml-idp-server

# This is our little test Identity Provider.  Any username/password passes.  https not required.
saml-idp-server: /tmp/saml-idp-server/Gemfile
	docker kill saml-idp-server || true
	docker build -t saml-idp-server /tmp/saml-idp-server
	docker run -d --rm $(NETWORK) -p 127.0.0.1:4000:3000 --name saml-idp-server saml-idp-server

docker_scripts/ssl/cdd.127.0.0.1.nip.io.key:
	mkdir -p docker_scripts/ssl
	docker run -v $(PWD)/docker_scripts/ssl:/root/.local/share/mkcert -w /root/.local/share/mkcert brunopadz/mkcert-docker:latest /bin/sh -c "mkcert -install && mkcert cdd.127.0.0.1.nip.io"
	ln -f -s cdd.127.0.0.1.nip.io-key.pem docker_scripts/ssl/cdd.127.0.0.1.nip.io.key
	ln -f -s cdd.127.0.0.1.nip.io.pem docker_scripts/ssl/cdd.127.0.0.1.nip.io.crt

nginx_proxy: docker_scripts/ssl/cdd.127.0.0.1.nip.io.key
	(docker ps -f name=nginx-proxy | grep nginx-proxy) || \
	docker run -d --rm --name nginx-proxy $(NETWORK) -p 127.0.0.1:3080:80 -p 127.0.0.1:3443:443 -v $(PWD)/docker_scripts/ssl:/etc/nginx/certs -v /var/run/docker.sock:/tmp/docker.sock:ro jwilder/nginx-proxy

slate: yarndev_image network
	(docker ps -f name=slate | grep slate) || \
	docker run --rm --init -d \
		--name slate \
		$(VOLUMES) --volume /tmp/src/node_modules \
		$(NETWORK) \
		$(ENVS) \
		-p 127.0.0.1:5000:5000 \
		$(JS_PACKAGE_NAME) \
		yarn slate-server

svg2pdf: ## Run the svg2pdf server (needed for exporting to PDF)
	(docker ps -f name=svg2pdf | grep svg2pdf) || \
	bash -c "cd ../services/aws/svg2pdf && $(MAKE) server"

web2pdf: network ## Run the web2pdf server (needed for exporting ELN to PDF)
	(docker ps -f name=web2pdf | grep web2pdf) || \
	bash -c "cd ../services/aws/web2pdf && $(MAKE) server"

thumbnailer: network ## Run the thumbnailer server (needed for thumbnail generation)
	(docker ps -f name=thumbnailer | grep thumbnailer) || \
	bash -c "cd ../services/aws/thumbnailer && $(MAKE) server"

thumbnailer_stop:
	bash -c "cd ../services/aws/thumbnailer && $(MAKE) server_stop"

microservices: slate ## Runs services needed by parts of Vault

js_testing: yarndev_image ## Runs js browser tests
	$(call yarn_test, -it -p 127.0.0.1:9876:9876 -e HEADLESS=true -e NODE_ENV=test) yarn watch:test:browser

js_testing_node: yarndev_image ## Runs js node tests
	$(call yarn_test, -it -p 127.0.0.1:9229:9229 -e NODE_ENV=test) yarn watch:test:node

ifndef $(WOPI_SRC)
	WOPI_SRC=http://cdd:3000/wopi/files/$(WOPI_FILE_ASSOCIATION_ID)
endif

ifndef $(WOPI_TTL)
	WOPI_TTL=0
endif

wopi_validator: ## https://wopi.readthedocs.io/en/latest/build_test_ship/validator.html (you may need to comment out proof key validation)\nUSAGE: make wopi_validator WOPI_FILE_ASSOCIATION_ID='$(WOPI_FILE_ASSOCIATION_ID)' WOPI_TOKEN='$(WOPI_TOKEN)' WOPI_EXTRAS='$(WOPI_EXTRAS)'
	docker run --rm -it $(NETWORK) tylerbutler/wopi-validator -- -w $(WOPI_SRC) -t $(WOPI_TOKEN) -l $(WOPI_TTL) $(WOPI_EXTRAS)

# Use like `make cap_shell`
# then `cap pentest/qa/production deploy`
#
# If you get the following error:
#    "net-ssh requires the following gems for ed25519 support"
# You may need to `ssh-add ~/.ssh/your_key`  https://github.com/net-ssh/net-ssh/issues/478
#
# You may need to ssh to the host IMMEDIATELY before deploying if you use docker to fwknock
cap_shell: ## Deploy the app from here. Macs may need IgnoreUnknown UseKeychain. ControlPath must not be in .ssh
	docker build -t capistrano -f Dockerfile.cap .
	@docker run --rm -it --name capistrano -v $(PWD)/..:/cdd:delegated -v ~/.ssh:/root/.ssh -v ~/.fwknoprc:/root/.fwknoprc capistrano ./cap_shell_setup.sh
#
# percona: network
# 	(docker ps -f name=percona | grep percona) || \
# 	docker run -d --rm --network cdd-vault --name percona -p 127.0.0.1:3306:3306 -e MYSQL_ROOT_PASSWORD=password -v percona_data:/var/lib/mysql -v "$(PWD)/config/percona/conf.d:/etc/my.cnf.d" --platform linux/amd64 percona:8
#
# elasticsearch: network
# 	(docker ps -f name=elasticsearch | grep elasticsearch) || \
# 	docker run -m 4g -d --rm $(NETWORK) --name elasticsearch -p 127.0.0.1:9200:9200 -e discovery.type=single-node -v elasticsearch_data:/usr/share/elasticsearch/data $(ELASTICSEARCH_IMAGE)

# build_kibana:
# 	(docker image ls | grep kibana) || \
# 	docker build -t kibana -f docker_scripts/kibana.dockerfile docker_scripts
#
# kibana: build_kibana elasticsearch
# 	(docker ps -f name=kibana | grep kibana) || \
# 	docker run -d --rm $(NETWORK) --name kibana -p 127.0.0.1:8091:80 kibana
# 	@echo "You probably want to set the Index pattern to molecule*."
# 	@echo "You probably want to ignore the time thing."
# 	sleep 2
# 	open http://localhost:8091/

network: volumes
	(docker network ls | grep $(NETWORK_NAME)) || \
	docker network create $(NETWORK_NAME)

volumes:
# 	docker volume create percona_data       || true
# 	docker volume create elasticsearch_data || true

check_rubocop:
	docker run --rm $(NETWORK) $(VOLUMES) $(ENVS) $(PACKAGE_NAME) rubocop `git diff --cached --name-only --relative --diff-filter=AM '*.rb'` app/models/user_context.rb
	# app/models/user_context.rb so there is always at least one file - so it does not check them *all*

check_es_lint:
	$(call yarn_run) yarn eslint `git diff --cached --name-only --relative --diff-filter=AM '*.js' '*.jsx'` spec/frontend/Eln/Entry/support/appHelper.jsx
	# spec/frontend/Eln/Entry/support/appHelper.jsx so it always has at least one file - otherwise it complains

check_sass_lint:
	$(call yarn_run) yarn lint:sass
	docker run --rm $(NETWORK) $(VOLUMES) $(ENVS) $(PACKAGE_NAME) script/check_for_material_class_names

check_bundle:
	docker run --rm $(NETWORK) $(VOLUMES) $(ENVS) $(PACKAGE_NAME) bundle check

check_migrations:
	docker run --rm $(NETWORK) $(VOLUMES) $(ENVS) $(PACKAGE_NAME) rake db:up_to_date

check_all: check_rubocop check_es_lint check_sass_lint check_bundle check_migrations

remove_elasticsearch_volume:
	docker kill elasticsearch || true
	docker volume rm -f elasticsearch_data || true

remove_percona_volume:
	docker kill percona || true
	docker volume rm -f percona_data || true

remove_volumes: remove_elasticsearch_volume remove_percona_volume

clean: remove_volumes ## Cleans docker
	docker system prune -f --filter "until=168h"

blink = "\033[5m$(1)\033[0m"

clean_all_docker: ## Cleans everything in Docker
	@echo 'This will KILL ALL DOCKER CONTAINERS.  ALL OF THEM.'
	@echo "This will NUKE your database and ES docker volumes."
	@echo $(call blink,"Press enter to continue with the destruction.")
	@read cont
	docker ps -q | xargs docker kill || true
	docker volume rm -f percona_data
	docker volume rm -f elasticsearch_data
	docker system prune -a -f
	@echo 'Done.'
	@echo "You should now do `make setup`, then proceed with the usual tasks."
	@read cont

clean_all_git: ## Cleans everything in Git
	@git status -s
	@echo 'This will reset your git repo - LOSING ALL UNCOMMITTED CHANGES.'
	@echo $(call blink,"Press enter to continue with the destruction.")
	@read cont
	rm -rf vendor/*
	rm -rf public/*
	rm -rf node_modules/*
	git reset --hard
	@echo 'Done.'

clean_git_branches: ## Cleans old branches in Git
	@echo 'This will remove all old (no longer on github.com) branches in your local git'
	@echo $(call blink,"Press enter to continue with the destruction.")
	@read cont
	git branch -lvv | cut -c3- | awk '/: gone]/ {print $$1}' | xargs git branch -D
	@echo 'Done.'

distclean: stop ## Cleans everything
	@git status -s
	@echo 'This will reset your git repo - LOSING ALL UNCOMMITTED CHANGES.'
	@echo 'This will KILL ALL DOCKER CONTAINERS.  ALL OF THEM.'
	@echo "This will NUKE your database and ES docker volumes."
	@echo $(call blink,"Press enter to continue with the destruction.")
	@read cont
	docker volume rm -f percona_data
	docker volume rm -f elasticsearch_data
	docker system prune -a -f
	rm -rf vendor/*
	rm -rf public/*
	rm -rf node_modules/*
	git reset --hard
	@echo 'Done.'
	@echo 'You should now do `make setup`, then proceed with the usual tasks.'
	@read cont

upgrade_percona: remove_percona_volume db_setup

set_percona_user_plugin:
	@echo "I'm going to sleep for awhile to give percona time to restart..."
	sleep 15
	docker exec -it percona mysql --user="root" --password="password" --execute="UPDATE mysql.user SET plugin = 'mysql_native_password' WHERE user = 'root';"

db_setup: image percona set_percona_user_plugin
	docker run --rm -it $(NETWORK) $(VOLUMES) $(ENVS) $(PACKAGE_NAME) bash -c 'rake db:reset'

node_setup: image percona
	docker run --rm -it $(NETWORK) $(VOLUMES) $(ENVS) $(PACKAGE_NAME) bash -c 'yarn --force'

stop: kill_selenium ## kill the background processes we tend to start
	docker kill cdd cdd_node guard ide slate || true

resubmit: ## resubmit the current branch for building with no changes
	git commit --no-verify -m '' --allow-empty --allow-empty-message && git push origin || echo FAILED

setup: image network db_setup node_setup ## Run this before any Vault related tasks
	@echo 'Now you can:'
	@echo 'make slate'
	@echo 'make server'
	@echo 'make guard'

update_vision: ## Update the vision code - assumes vision is checked out and up to date in directory parallel to vault
	$(MAKE) -C ../../vision tar_export
	rm -rf public/vision/
	tar -C public -x -v -f vision.tar
	rm vision.tar
