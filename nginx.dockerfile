FROM --platform=$BUILDPLATFORM node:22-bookworm-slim@sha256:5ec23b7c622b00547753bc6ffd78085dd868a68aeb41c8e0a1418f033e13d96d AS builder

WORKDIR /src
COPY . .
RUN bash ./build

FROM nginxinc/nginx-unprivileged:alpine@sha256:b5047b9b76845eac124358373c6852377c52e4b05834a47647e955dd91cb8f1e

LABEL org.opencontainers.image.title="fledge-gui" \
      org.opencontainers.image.source="https://github.com/HelinData/fledge-gui" \
      org.opencontainers.image.licenses="Apache-2.0"

COPY --chown=101:0 nginx/fledge-gui.conf /etc/nginx/snippets/fledge-gui.conf
COPY --chown=101:0 nginx/container.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=101:0 /src/dist/ /usr/share/nginx/html/

USER 101
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/fledge.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
