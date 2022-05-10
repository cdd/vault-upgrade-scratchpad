FROM public.ecr.aws/docker/library/ruby:2.7.6 as development
# FROM public.ecr.aws/docker/library/ruby:${RUBY_VERSION} as development
ENV TZ=UTC

RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -

RUN apt-get update -qq && apt-get install -y build-essential libpq-dev \
  libmagic-dev default-jdk unzip direnv

# So we know we're in a container - useful for testing (selenium remote, etc)
ENV DOCKER_CONTAINER=true

ENV JAVA_HOME=/usr/lib/jvm/default-java
# HACK https://github.com/arton/rjb/issues/70
RUN mkdir -p /usr/lib/jvm/default-java/jre/lib/amd64 /usr/lib/jvm/default-java/jre/lib/aarch64 && \
  ln -s /usr/lib/jvm/default-java/lib/server /usr/lib/jvm/default-java/jre/lib/amd64/server && \
  ln -s /usr/lib/jvm/default-java/lib/server /usr/lib/jvm/default-java/jre/lib/aarch64/server

RUN groupadd -r -g 1000 cdd && useradd -u 1000 -r -g  cdd cdd

RUN mkdir -p /home/cdd /cdd && chown cdd.cdd /home/cdd /cdd

# END ROOT TASKS

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
RUN mkdir -p /vendor/cache
COPY --chown=cdd:cdd Gemfile* ./
RUN bundle config --global jobs 6 && bundle config set cache_all true && bundle cache

WORKDIR /tmp/src

##################################################################################################################################
FROM development as ci
USER root
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt install -y nodejs python2 && npm install -g yarn

CMD bash -c "foreman start -f Procfile.dev"
