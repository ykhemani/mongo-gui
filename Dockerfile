# Definindo a imagem base
FROM node:20.11.0

COPY . /app

WORKDIR /app

RUN npm install

# HEALTHCHECK --interval=10s CMD curl --fail http://localhost:3001 || exit 1

ENTRYPOINT ["bash","/app/entrypoint.sh"]