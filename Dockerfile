FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape finale : ne sert rien, copie /dist dans le volume monté sur /out puis s'arrête.
FROM alpine:3.20
COPY --from=build /app/dist /dist
COPY publish.sh /usr/local/bin/publish.sh
RUN chmod +x /usr/local/bin/publish.sh
CMD ["/usr/local/bin/publish.sh"]
