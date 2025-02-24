FROM node:22-alpine AS builder

WORKDIR /app

COPY ./backend .

RUN npm install

RUN npm run build

RUN ls -ail

FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env.docker ./.env
COPY --from=builder /app/prisma ./prisma

ENTRYPOINT [ "sh", "-c", "sleep 30 && npx prisma migrate deploy && npm run start" ]