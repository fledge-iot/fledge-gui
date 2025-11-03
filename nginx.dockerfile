FROM nginx:alpine

LABEL author="Mohd. Shariq"

COPY ./dist/browser/ /usr/share/nginx/html/
COPY ./docker/nginx-docker.conf /etc/nginx/nginx.conf

EXPOSE 8080

ENTRYPOINT ["nginx", "-g", "daemon off;"]
