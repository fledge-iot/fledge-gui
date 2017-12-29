FROM nginx:alpine

LABEL author="Mohd. Shariq"

# Copy custom nginx config
COPY ./docker/nginx-docker.conf /etc/nginx/nginx.conf

EXPOSE 8080

ENTRYPOINT ["nginx", "-g", "daemon off;"]
