FROM ruby:2.7.5 as development
ENV TZ=UTC

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -

RUN apt-get update -qq && apt-get install -y build-essential libpq-dev \
  libmagic-dev default-jdk wget unzip direnv

RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt install -y nodejs python2
RUN npm install -g yarn

WORKDIR /tmp
# headers to pretend we're a browser, if this breaks again, just add the zip to our repo
# RUN curl -O https://www.inchi-trust.org/download/105/INCHI-1-SRC.zip
# RUN unzip INCHI-1-SRC.zip
# WORKDIR /tmp/INCHI-1-SRC/INCHI_EXE/inchi-1/gcc
# RUN make -j 4
# RUN mv ../../bin/Linux/inchi-1 /usr/local/bin/inchi

# So we know we're in a container - useful for testing (selenium remote, etc)
ENV DOCKER_CONTAINER=true

ENV JAVA_HOME=/usr/lib/jvm/default-java
# HACK https://github.com/arton/rjb/issues/70
RUN mkdir -p /usr/lib/jvm/default-java/jre/lib/amd64 /usr/lib/jvm/default-java/jre/lib/aarch64
RUN ln -s /usr/lib/jvm/default-java/lib/server /usr/lib/jvm/default-java/jre/lib/amd64/server
RUN ln -s /usr/lib/jvm/default-java/lib/server /usr/lib/jvm/default-java/jre/lib/aarch64/server

RUN groupadd -r -g 1000 cdd && useradd -u 1000 -r -g  cdd cdd
# User home
RUN mkdir /home/cdd
RUN chown cdd.cdd /home/cdd
# App home
RUN mkdir /cdd
RUN chown cdd.cdd /cdd

# END ROOT TASKS

USER cdd

# Don't try to install gems in the system
ENV GEM_HOME=/home/cdd/.ruby/
ENV PATH=/usr/local/bundle/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/home/cdd/.ruby/bin/
RUN mkdir -p /home/cdd/.ruby/gems

RUN gem install bundler -V -v '2.2.7'

# RUN mkdir -p /home/cdd/.chemaxon
# COPY config/licenses/ChemAxon_server_license.cxl /home/cdd/.chemaxon/license.cxl

ENV RUBY_GC_MALLOC_LIMIT=1000000000
ENV RUBY_GC_HEAP_FREE_SLOTS=500000
ENV RUBY_GC_HEAP_INIT_SLOTS=40000

ENV PARALLEL_TEST_FIRST_IS_1=true
ENV CATALINA_OPTS='-Djava.awt.headless=true -Xms512m -XX:MaxPermSize=256m -XX:+UseConcMarkSweepGC -XX:+CMSClassUnloadingEnabled'
ENV NODE_ENV=development

# Don't rspec retry by default
ENV RSPEC_RETRY_RETRY_COUNT=0

# For selenium
ENV HEADLESS=true

RUN mkdir -p /cdd/ruby
WORKDIR /cdd/ruby
RUN mkdir -p tmp/pids
RUN bundle config JOBS 6
COPY --chown=cdd:cdd Gemfile* ./
RUN bundle pack --all

COPY --chown=cdd:cdd package.json yarn.lock ./

COPY --chown=cdd:cdd . .

RUN rm -rf tmp/pids/*

CMD rails s -b 0.0.0.0

FROM development as ci

RUN yarn && yarn build
USER root
RUN apt-get update && apt-get install -y default-mysql-client
# default-mysql-client added so we can load the performance data
USER cdd
