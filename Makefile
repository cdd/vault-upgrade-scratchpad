# When starting from scratch: `make -j 3 setup`
# Once that's done, some interesting tasks are `make -j 3 server`, `make -j 3 guard`, `make shell`

RUBY_BUILD=--build-arg RUBY_VERSION=$(shell cat .ruby-version)

PACKAGE_NAME=vault
NETWORK_NAME=cdd-vault
NETWORK=--network $(NETWORK_NAME)

# If you want to activate the new logging framework set that to true
ifneq ($(wildcard .new_logging),)
	NEW_LOGGING?=$(shell cat .new_logging)
endif
NEW_LOGGING?=false

ifneq ($(wildcard .mysql_host),)
	MYSQL_HOST?=$(shell cat .mysql_host)
endif
MYSQL_HOST?=percona

# If you want to activate the faster way to handle node_modules
ifneq ($(wildcard .internal_node_modules),)
	INTERNAL_NODE_MODULES?=$(shell cat .internal_node_modules)
endif

INTERNAL_NODE_MODULES?=false


ENVS=-e MYSQL_HOST=$(MYSQL_HOST) \
	-e MYSQL_PRODUCTION_PASSWORD=password \
	-e ELASTICSEARCH_URL=http://elasticsearch:9200 \
	-e CHEMAXON_HOST_AND_PORT=chemaxon:8100 \
	-e CHEMAXON_BASE=http://chemaxon:8100/cdd \
	-e SLATE_URL=http://slate:5000 \
	-e WEBPACKER_DEV_SERVER_HOST=$(JS_PACKAGE_NAME) \
	-e WEBPACKER_DEV_SERVER_PORT=3036 \
	-e NEW_LOGGING=$(NEW_LOGGING) \
	-e SAML_ISSUER=http://localhost:3000/ \
	-e SAML_ASSERTION_CONSUMER_SERVICE_URL=http://localhost:3000/user/saml_authentication \

# ARM support: https://github.com/seleniarm/docker-selenium/issues/2
SELENIUM_VERSION=4.1.2-20220131
SELENIUM_STANDALONE=selenium/standalone-chrome:$(SELENIUM_VERSION)
ARCH:=$(shell eval /usr/bin/arch)
# If on linux Arm
ifeq ($(ARCH),aarch64)
	ARCH=arm64
endif
ifeq ($(ARCH),arm64)
	SELENIUM_STANDALONE= -e SE_OPTS="--session-timeout 600" seleniarm/standalone-chromium
endif

SELENIUM_WIDTH ?= 1360
SELENIUM_HEIGHT ?= 1020

SELENIUM_OPTIONS=-e SCREEN_WIDTH=$(SELENIUM_WIDTH) -e SCREEN_HEIGHT=$(SELENIUM_HEIGHT) -e TZ="US/Pacific"

SAML_ENVS=-e FULLY_QUALIFIED_DOMAIN_NAME=cdd.127.0.0.1.nip.io \
	-e ASSET_HOST=https://cdd.127.0.0.1.nip.io:3443/ \
	-e SAML_ISSUER=https://cdd.127.0.0.1.nip.io:3443/ \
	-e SAML_ASSERTION_CONSUMER_SERVICE_URL=https://cdd.127.0.0.1.nip.io:3443/user/saml_authentication \
	-e SSL_REQUIRED=true

ELASTICSEARCH_IMAGE=collaborativedrug/elasticsearch:7.16.2

# can be overridden like `make server PORT=3001`
PORT=127.0.0.1:3000
PORTS=-p $(PORT):3000

VOLUMES=--volume $(PWD):/tmp/src:delegated
ifeq ($(INTERNAL_NODE_MODULES),true)
  LOCAL_NODE_VOLUME=-v node_modules:/tmp/src/node_modules:z
else
  LOCAL_NODE_VOLUME=
endif


# We set the workdir so that things behave the same for CI build images
WORKDIR=--workdir /tmp/src

JS_PACKAGE_NAME=scratch-node
# scratch-node.test is the name of the server expected by config/karma.config.js
JS_TESTING_NAME=scratch-node.test

yarn_run = docker run --rm $(1)\
	$(VOLUMES) $(LOCAL_NODE_VOLUME) $(WORKDIR) \
	$(NETWORK) \
	-e NODE_ENV=development \
	-e WEBPACKER_DEV_SERVER_HOST=0.0.0.0 \
	$(JS_PACKAGE_NAME)
yarn_dev = $(call yarn_run, $(1) -e VIRTUAL_HOST=scratch-node.127.0.0.1.nip.io -p 127.0.0.1:3036:3036 --name $(JS_PACKAGE_NAME))
yarn_test = $(call yarn_run, $(1) --name $(JS_TESTING_NAME))

-include $(dir $(lastword $(MAKEFILE_LIST)))/Makefile.common

yarndev_image:
	mkdir -p node_modules
	docker build -t $(JS_PACKAGE_NAME) --target development -f Dockerfile.node .

$(JS_PACKAGE_NAME): network yarndev

stop_scratch-node:
	docker stop $(JS_PACKAGE_NAME) || true

shaka_image: network
	docker build -t shaka -f Dockerfile .

shaka: shaka_image
	docker run --rm -it --name shaka -v $(PWD):/tmp/src -p 127.0.0.1:3000:3000 shaka

stop_cdd:
	docker stop cdd || true

kill_scratch-node: stop_scratch-node
kill_cdd: stop_cdd

yarndev: yarndev_image stop_scratch-node network
	$(call yarn_dev, -it) yarn install
	$(MAKE) sync_node_modules
	$(call yarn_dev, -p 127.0.0.1:9002:9002 -d) yarn jstart-with-storybook

node_shell: cdd_node_interactive

cdd_node_interactive: yarndev_image stop_scratch-node
	$(call yarn_dev, -p 127.0.0.1:9002:9002 -it) bash

yarndev_running:
	(docker ps -f name=$(JS_PACKAGE_NAME) | grep $(JS_PACKAGE_NAME)) || $(MAKE) yarndev

.PHONY: force_sync_node_modules
force_sync_node_modules: yarndev_image
	$(call yarn_run, -i --name yarn_sync) yarn install
	$(call yarn_run, -d --name yarn_sync) bash -c "sleep infinity"
	docker cp yarn_sync:/tmp/src/node_modules .
	docker stop yarn_sync
	cat package.json yarn.lock | md5sum > node_modules/.processed_package.json.md5
	@echo "Updated node_modules locally"

.PHONY: sync_node_modules
sync_node_modules:
ifeq ($(INTERNAL_NODE_MODULES),true)
  ifneq ($(shell cat node_modules/.processed_package.json.md5 2>/dev/null), $(shell cat package.json yarn.lock | md5sum))
	$(MAKE) force_sync_node_modules
  endif
endif

.PHONY: watch_node_modules
watch_node_modules:
ifeq ($(INTERNAL_NODE_MODULES),true)
	bash -c "while true ; do clear; echo Waiting on some changes in package.json or yarn.lock ; make sync_node_modules; sleep 10; done"
else
	echo "This will not work if you don't activate INTERNAL_NODE_MODULES"
endif

# If this directory doesn't exist it means we have not checked out the submodules
public/marvin/.git:
	git submodule init
	git submodule update -f --init --recursive

submodules: public/marvin/.git
	git submodule update

# We stop at the development target because we don't really want to run yarn - we run the server instead
image: submodules
	docker build $(RUBY_BUILD) --target development -t $(PACKAGE_NAME) .

# For when we want to do ci things like mess with the performance db image
ci_image: submodules
	docker build $(RUBY_BUILD) --target ci -t $(PACKAGE_NAME) .
	docker build $(RUBY_BUILD) --target ci -t $(JS_PACKAGE_NAME) .

chemaxon_image:
	docker build -t chemaxon -f ../java.Dockerfile ..

ci_images: image chemaxon_image yarndev_image

image_exists:
	docker images $(PACKAGE_NAME) | grep $(PACKAGE_NAME) || docker build $(RUBY_BUILD) -t $(PACKAGE_NAME) .

chemaxon: submodules
	(docker ps -f name=chemaxon | grep chemaxon) || \
	(docker build -t chemaxon -f ../java.Dockerfile .. && \
	docker run --rm -d $(NETWORK) -p 127.0.0.1:8100:8100 --name=chemaxon chemaxon)

recalculator: image_exists network ## Runs the background recalculator
	docker run --rm -it $(NETWORK) $(VOLUMES) $(WORKDIR) $(ENVS) $(PACKAGE_NAME) bash -c './script/recalculator'

clear:
	rm -f tmp/pids/*

dstats: ## A little like top for docker
	docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.PIDs}}"

console: image_exists percona ## Interactive rails console
	docker run --rm -it $(NETWORK) $(VOLUMES) $(WORKDIR) $(ENVS) $(PACKAGE_NAME) rails c

shell: image_exists network ## Interactive shell
	docker run --rm -it -e HEADLESS=false $(NETWORK) $(VOLUMES) $(WORKDIR) $(ENVS) $(PACKAGE_NAME) bash

processor: image_exists network ## Interactive shell
	docker run --rm -it -e HEADLESS=false $(NETWORK) $(VOLUMES) $(WORKDIR) $(ENVS) $(PACKAGE_NAME) script/processor

# rdebug-ide --host 0.0.0.0 bin/rspec some_file.rb
ide: image_exists network
	docker run --rm -it --name ide -p 127.0.0.1:1234:1234 -p 127.0.0.1:26162:26162 -e HEADLESS=false -e IDE_PROCESS_DISPATCHER=0.0.0.0:1234 $(PORTS) $(NETWORK) $(VOLUMES) $(WORKDIR) $(ENVS) $(PACKAGE_NAME) bash

debug: image_exists network
	docker run --cap-add=SYS_PTRACE --security-opt seccomp=unconfined --rm -it -e HEADLESS=false $(NETWORK) $(VOLUMES) $(WORKDIR) $(ENVS) $(PACKAGE_NAME) bash

# This is the *development* environment, but pointing at the *test* database
test_shell: image_exists network
	docker run -e DATABASE_URL=mysql2://percona/cdd_test --cap-add=SYS_PTRACE --rm -it $(NETWORK) $(VOLUMES) $(WORKDIR) $(ENVS) $(PACKAGE_NAME) bash

server: yarndev_running image clear percona elasticsearch network ## Runs the rails server
ifeq ($(NEW_LOGGING), true)
	$(MAKE) logging
endif
	docker run --rm -it --name cdd $(NETWORK) $(VOLUMES) $(WORKDIR) $(PORTS) $(ENVS) -e I18N_DEBUG=true -e WEBPACKER_DEV_SERVER_HOST=$(JS_PACKAGE_NAME) -e WEB_BINDING=0.0.0.0 $(PACKAGE_NAME)

safe_server: stop_cdd stop_scratch-node server ## Stops cdd_node and cdd, then run server, forcing everything to be up to date.

# This is the *development* environment, but pointing at the *test* database
test_server: yarndev_running image clear percona elasticsearch network
	docker run -e DATABASE_URL=mysql2://percona/cdd_test --rm -it --name cdd $(NETWORK) $(VOLUMES) $(WORKDIR) $(ENVS) $(PORTS) -e WEBPACKER_DEV_SERVER_HOST=$(JS_PACKAGE_NAME) -e WEB_BINDING=0.0.0.0 $(PACKAGE_NAME)

# This is the development environment pointing at the test db and running behind nginx.
# It is useful for testing the SSO machinery locally
selenium_server: stop_scratch-node nginx_proxy clear percona elasticsearch network saml-idp-server
	docker stop cdd || true
	docker run -e DATABASE_URL=mysql2://percona/cdd_test --rm -d --name cdd $(NETWORK) $(VOLUMES) $(WORKDIR) $(ENVS) $(SAML_ENVS) $(PORTS) -e VIRTUAL_HOST=cdd.127.0.0.1.nip.io -e RAILS_ENV=selenium $(PACKAGE_NAME) bash -c '(rm -rf ./public/packs/*; rails webpacker:compile &); rails s -b 0.0.0.0'
	@echo
	@echo I am about to open the url https://cdd.127.0.0.1.nip.io:3443/.
	@echo It will be broken because yarn is still building -
	@echo but it will work when yarn is done.
	@echo
	sleep 45
	open 'https://cdd.127.0.0.1.nip.io:3443/'

stop_selenium:
	# sleep because it sometimes takes a second to bring it down
	docker stop selenium_node_1 selenium_node_2 selenium_node_3 selenium_node_4 selenium_node_5 selenium_node_6 || true
	docker stop selenium || true

selenium: stop_selenium
	# We need to mount volumes for file upload.  This way the path to the file is the same in the selenium container as it is in the rails container
	# Getting rid of volumes causes spec/selenium/integration/slurper/edit_mapping_spec.rb  to fail (as it cannot find the file to upload)
	docker run --rm -d $(NETWORK) $(VOLUMES) -v /dev/shm:/dev/shm -p 127.0.0.1:25900:5900 \
	  $(SELENIUM_OPTIONS) \
		--name selenium $(SELENIUM_STANDALONE)

selenium_headless: stop_selenium
	docker run --rm -d $(NETWORK) $(VOLUMES) $(SELENIUM_OPTIONS) --name selenium selenium/standalone-chrome:$(SELENIUM_VERSION)

selenium_running: network
	(docker ps -f name=selenium | grep selenium) || \
	bash -c "$(MAKE) -C $(PWD) selenium"

selenium_hub: stop_selenium
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
	docker run --rm -it --name guard $(NETWORK) $(VOLUMES) $(WORKDIR) $(ENVS) -e RAILS_ENV=test -e HEADLESS=false $(PACKAGE_NAME) bin/guard -w spec app test lib db

/tmp/saml-idp-server/Gemfile:
	git clone git@github.com:cdd/saml-idp-server.git /tmp/saml-idp-server

# This is our little test Identity Provider.  Any username/password passes.  https not required.
saml-idp-server: /tmp/saml-idp-server/Gemfile
	docker stop saml-idp-server || true
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

slate: yarndev_image network ## Runs the slate server
	(docker ps -f name=slate | grep slate) || \
	docker run --rm --init -d \
		--name slate \
		$(VOLUMES) $(WORKDIR) $(LOCAL_NODE_VOLUME) \
		$(NETWORK) \
		$(ENVS) \
		-p 127.0.0.1:5000:5000 \
		$(JS_PACKAGE_NAME) \
		yarn slate-server

web2pdf: network ## Run the web2pdf server (needed for exporting ELN to PDF)
	(docker ps -f name=web2pdf | grep web2pdf) || \
	bash -c "cd ../services/aws/web2pdf && $(MAKE) server"

thumbnailer: network ## Run the thumbnailer server (needed for thumbnail generation)
	(docker ps -f name=thumbnailer | grep thumbnailer) || \
	bash -c "cd ../services/aws/thumbnailer && $(MAKE) server"

thumbnailer_stop: ## Stop the thumbnailer server
	bash -c "cd ../services/aws/thumbnailer && $(MAKE) server_stop"

.PHONY: marvinjs
marvinjs: ## Run the marvinjs webservices server
	(docker ps -f name=marvinjs | grep marvinjs) || \
	bash -c "cd ../services/aws/marvinjs && $(MAKE) download && $(MAKE) server"

.PHONY: marvinjs_stop
marvinjs_stop: ## Stop the marvinjs webservices server
	bash -c "cd ../services/aws/marvinjs && $(MAKE) server_stop"

.PHONY: snapgene
snapgene: ## Run the snapgene webservices server
	(docker ps -f name=snapgene | grep snapgene) || \
	bash -c "cd ../services/aws/snapgene && $(MAKE) download && $(MAKE) server"

.PHONY: snapgene_stop
snapgene_stop: ## Stop the snapgene webservices server
	bash -c "cd ../services/aws/snapgene && $(MAKE) server_stop"

microservices: chemaxon slate web2pdf thumbnailer marvinjs snapgene ## Runs services needed by parts of Vault

js_testing: yarndev_image selenium_running ## Runs js browser tests
	$(call yarn_test, -it -p 127.0.0.1:9877:9877 -e HEADLESS=true -e NODE_ENV=test) yarn watch:test:browser

js_testing_node: yarndev_image ## Runs js node tests
	$(call yarn_test, -it -p 127.0.0.1:9229:9229 -e NODE_ENV=test) yarn watch:test:node

external-resources-image:
	docker build $(RUBY_BUILD) --target external-resources-testing -t external-resources-testing .

external-resources-testing: external-resources-image ## Runs the external resources specs
	docker run --rm external-resources-testing

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
	docker build $(RUBY_BUILD) -t capistrano -f Dockerfile.cap .
	@docker run --rm -it --name capistrano -v $(PWD)/..:/cdd:delegated -v ~/.ssh:/root/.ssh -v ~/.fwknoprc:/root/.fwknoprc capistrano ./cap_shell_setup.sh

PERCONA_IMAGE=percona:8
MYSQL_OPTIONS=$(NETWORK) --name percona -p 127.0.0.1:3306:3306 -e MYSQL_ROOT_HOST=% -e MYSQL_ROOT_PASSWORD=password -v $(PWD)/tmp/percona_data:/var/lib/mysql:delegated -v "$(PWD)/config/percona/conf.d:/etc/my.cnf.d:ro" -v "$(PWD)/config/percona/conf.d:/etc/mysql/mysql.conf.d:ro"
# percona does not yet support m1.  But mysql seems to work fine.
# About 10% faster and 1/10 the CPU burn
ifeq ($(ARCH),arm64)
	MYSQL_OPTIONS=$(NETWORK) --name percona -p 127.0.0.1:3306:3306 -e MYSQL_ROOT_HOST=% -e MYSQL_ROOT_PASSWORD=password -v $(PWD)/tmp/percona_data:/var/lib/mysql:delegated -v "$(PWD)/config/percona/conf.d:/etc/mysql/conf.d/:ro"
	PERCONA_IMAGE=mysql:8.0.28-oracle
endif

percona: network
ifeq ($(MYSQL_HOST),percona)
	(docker ps -f name=^percona | grep percona) || \
	docker run -d --rm $(MYSQL_OPTIONS) $(PERCONA_IMAGE)
endif

elasticsearch: network
	(docker ps -f name=^elasticsearch | grep elasticsearch) || \
	docker run -m 4g -d --rm $(NETWORK) --name elasticsearch -p 127.0.0.1:9200:9200 -e discovery.type=single-node -v elasticsearch_data:/usr/share/elasticsearch/data $(ELASTICSEARCH_IMAGE)

build_kibana:
	(docker image ls | grep kibana) || \
	docker build -t kibana -f docker_scripts/kibana.dockerfile docker_scripts

kibana: build_kibana elasticsearch
	(docker ps -f name=^kibana | grep kibana) || \
	docker run -d --rm $(NETWORK) --name kibana -p 127.0.0.1:8091:80 kibana
	@echo "You probably want to set the Index pattern to molecule*."
	@echo "You probably want to ignore the time thing."
	sleep 2
	open http://localhost:8091/

# We create the log files so they don't have the pound line at the beginning
logging: ## Start the logging system
	touch log/rails_development.log log/rails_production.log
	docker compose -f elk/docker-compose-logging.yml up -d
	@echo
	@echo "Adding the index pattern for filebeat automatically"
	@curl -s -o /dev/null -XPOST http://localhost:5602/api/index_patterns/index_pattern -H "Content-Type: application/json" \
	  -H "kbn-xsrf: true" -d '{"index_pattern": {"id": "filebeat", "title": "filebeat-*"}, "override": "true"}'
	@sleep 1
	@echo "Making it the default"
	@curl -s -o /dev/null -XPOST http://localhost:5602/api/index_patterns/default -H "Content-Type: application/json" \
	  -H "kbn-xsrf: true" -d '{"index_pattern_id": "filebeat", "force": true}'
	@echo
	@echo "APM is also enabled so you can check performance metrics there"
	@echo "You can stop the logging with make stop_logging"
	@echo
	@echo "Kibana for logs is accesible at : http://localhost:5602/"

stop_logging: ## Stop the logging system
	docker-compose -f elk/docker-compose-logging.yml down

network: volumes
	(docker network ls | grep $(NETWORK_NAME)) || \
	docker network create $(NETWORK_NAME)

volumes:
	mkdir -p  tmp/percona_data
	docker volume create elasticsearch_data || true

check_rubocop:
	docker run --rm $(NETWORK) $(VOLUMES) $(WORKDIR) $(ENVS) $(PACKAGE_NAME) rubocop `git diff --cached --name-only --relative --diff-filter=AM '*.rb'` app/models/user_context.rb
	# app/models/user_context.rb so there is always at least one file - so it does not check them *all*

check_es_lint:
	$(call yarn_run) yarn eslint `git diff --cached --name-only --relative --diff-filter=AM '*.js' '*.jsx'` spec/frontend/Eln/Entry/support/appHelper.jsx
	# spec/frontend/Eln/Entry/support/appHelper.jsx so it always has at least one file - otherwise it complains

check_sass_lint:
	$(call yarn_run) yarn lint:sass
	docker run --rm $(NETWORK) $(VOLUMES) $(WORKDIR) $(ENVS) $(PACKAGE_NAME) script/check_for_material_class_names

check_bundle:
	docker run --rm $(NETWORK) $(VOLUMES) $(WORKDIR) $(ENVS) $(PACKAGE_NAME) bundle check

check_migrations:
	docker run --rm $(NETWORK) $(VOLUMES) $(WORKDIR) $(ENVS) $(PACKAGE_NAME) rake db:up_to_date

check_all: check_rubocop check_es_lint check_sass_lint check_bundle check_migrations

remove_elasticsearch_volume:
	docker stop elasticsearch || true
	docker volume rm -f elasticsearch_data || true

remove_percona_volume:
	docker stop percona || true
	rm -rf tmp/percona_data

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
	docker volume rm -f elasticsearch_data
	docker system prune -a -f
	@echo 'Done.'
	@echo 'You should now do `make setup`, then proceed with the usual tasks.'
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
ifeq ($(MYSQL_HOST),percona)
	until docker exec -it percona mysql --user="root" --password="password" --execute="UPDATE mysql.user SET plugin = 'mysql_native_password' WHERE user = 'root';" ; do \
		printf "I'm going to sleep for awhile to give percona time to restart...\n" ; \
		sleep 5 ; \
	done
endif


db_setup: image percona set_percona_user_plugin
	docker run --rm -it $(NETWORK) $(VOLUMES) $(WORKDIR) $(ENVS) $(PACKAGE_NAME) bash -c 'rake db:reset'

node_setup: yarndev_image
	docker run --rm -it $(NETWORK) $(VOLUMES) $(WORKDIR) $(ENVS) $(JS_PACKAGE_NAME) bash -c 'yarn --force'

stop: stop_selenium stop_logging marvinjs_stop ## Stop the background processes we tend to start
	docker stop cdd scratch-node chemaxon elasticsearch guard ide percona slate web2pdf thumbnailer || true

setup: save_settings image network percona elasticsearch db_setup node_setup ## Run this before any Vault related tasks
	@echo 'Now you can:'
	@echo 'make slate'
	@echo 'make chemaxon'
	@echo 'make server'
	@echo 'make guard'

update_vision update_visualization: ## Update the vision/visualization code - assumes vision is checked out and up to date in directory parallel to vault
	$(MAKE) -C ../../vision tar_export
	rm -rf public/vision/
	tar -C public -x -v -f vision.tar
	rm vision.tar

.PHONY: save_settings
save_settings:  ## Save settings for experimental features
	@echo $(MYSQL_HOST) > .mysql_host
	@echo $(NEW_LOGGING) > .new_logging
	@echo $(INTERNAL_NODE_MODULES) > .internal_node_modules
	@echo "    Settings are now set in files, you can run 'make clear_settings' to go back to defaults"
	@echo "    MYSQL_HOST: .mysql_host contains: \"$(MYSQL_HOST)\""
	@echo "    NEW_LOGGING: .new_logging contains: \"$(NEW_LOGGING)\""
	@echo "    INTERNAL_NODE_MODULES: .internal_node_modules: \"$(INTERNAL_NODE_MODULES)\""

.PHONY: clear_settings
clear_settings: ## Clear settings for ports and container prefix
	@rm .mysql_host .new_logging .internal_node_modules

.PHONY: set_password_db_m1
set_password_db_m1:
	until echo "use mysql; alter user 'root'@'localhost' IDENTIFIED BY 'password';flush privileges;" | mysql -u root ; do \
		printf "I'm going to sleep for awhile to give mysql time to restart...\n" ; \
		sleep 5 ; \
	done

.PHONY: setup_db_m1
setup_db_m1:
	brew install mysql
	cp config/percona/m1.cnf /opt/homebrew/etc/my.cnf
	brew services restart mysql
	brew services enable mysql
	$(MAKE) set_password_db_m1
	$(MAKE) save_settings MYSQL_HOST=host.docker.internal

.PHONY: clean_db_m1
clean_db_m1:
	@echo "This is going to wipe your full local Mysql database. This will not only remove CDD but anything else you may"
	@echo "have had in there."
	@echo "This is your last chance"
	@read cont
	brew services stop mysql
	rm -rf /opt/homebrew/var/mysql
	brew postinstall mysql
	brew services start mysql
	$(MAKE) set_password_db_m1
	@echo "Now, you probably want to run: make db_setup"
