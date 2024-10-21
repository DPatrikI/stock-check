FROM node:lts AS builder

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

COPY apps/server/package.json apps/server/tsconfig.json ./apps/server/

RUN npm install -g pnpm

RUN pnpm install --frozen-lockfile --filter server...

COPY . .

RUN pnpm --filter server exec prisma generate

RUN pnpm --filter server build

FROM node:lts

WORKDIR /app/apps/server

RUN npm install -g pnpm

COPY pnpm-workspace.yaml /app/
COPY pnpm-lock.yaml /app/

COPY apps/server/package.json ./

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/apps/server/dist ./dist

COPY --from=builder /app/apps/server/node_modules ./node_modules

COPY --from=builder /app/apps/server/prisma ./prisma

EXPOSE 3000

RUN pnpm prisma generate

CMD ["sh", "-c", "pnpm prisma:migrate && node dist/main"]