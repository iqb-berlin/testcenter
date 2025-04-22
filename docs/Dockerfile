FROM ruby:3.4-slim AS jekyll

RUN --mount=type=cache,sharing=locked,target=/var/cache/apt \
    apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git

# throw errors if Gemfile has been modified since Gemfile.lock
RUN bundle config --global frozen 1

# Update gems and install jekyll
RUN gem update --system && gem install jekyll && gem cleanup

WORKDIR /usr/src/testcenter/docs
RUN mkdir ../public

COPY docs/Gemfile* ./
RUN bundle install

COPY docs/ ./

CMD [ "bundle", "exec", "jekyll", "build", "-d", "../public" ]
