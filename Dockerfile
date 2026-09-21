FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Étape finale : ne sert rien, copie /dist dans le volume monté sur /out puis s'arrête.
FROM alpine:3.22
COPY --from=build /app/dist /dist
COPY --chmod=755 publish.sh /usr/local/bin/publish.sh
CMD ["/usr/local/bin/publish.sh"]
