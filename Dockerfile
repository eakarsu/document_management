FROM node:24.4.1-alpine3.22 AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/
COPY frontend/package.json ./frontend/
COPY database/package.json ./database/
RUN npm ci --ignore-scripts
COPY backend ./backend
COPY frontend ./frontend
RUN node backend/node_modules/prisma/build/index.js generate --schema backend/prisma/schema.prisma
RUN npm run build --workspace backend
RUN npm run build --workspace frontend
RUN npm prune --omit=dev

FROM node:24.4.1-alpine3.22 AS runtime
RUN apk add --no-cache bash postgresql-client tini
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/frontend/.next ./frontend/.next
COPY --from=build /app/frontend/public ./frontend/public
COPY --from=build /app/frontend/package.json ./frontend/package.json
COPY start.sh ./start.sh
RUN chmod 0555 ./start.sh && chown -R node:node /app
USER node
EXPOSE 3000 4000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["./start.sh", "production"]
