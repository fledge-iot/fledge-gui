FROM node:22-bookworm-slim@sha256:5ec23b7c622b00547753bc6ffd78085dd868a68aeb41c8e0a1418f033e13d96d AS builder

WORKDIR /src
COPY . .
RUN bash ./build

FROM debian:bookworm-slim@sha256:734a72b3d6142a71993b4bc580ca01d8ca687f77a2c422d96a961d3376b179bc AS packager

RUN apt-get update \
    && apt-get install -y --no-install-recommends dpkg-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /pkg
COPY packages/Debian packages/Debian
COPY nginx nginx
COPY package.json package.json
COPY .ci/deb/package_deb.sh .ci/deb/package_deb.sh
COPY --from=builder /src/dist /dist

RUN bash .ci/deb/package_deb.sh /dist /artifacts

FROM scratch AS artifact
COPY --from=packager /artifacts/ /
