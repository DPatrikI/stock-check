FROM node:lts AS builder

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

COPY apps/client/package.json apps/client/tsconfig.json ./apps/client/

RUN npm install -g pnpm

RUN pnpm install --frozen-lockfile --filter client...

COPY . .

RUN pnpm --filter client build

FROM node:lts

WORKDIR /app/apps/client

RUN npm install -g pnpm

COPY pnpm-workspace.yaml /app/
COPY pnpm-lock.yaml /app/

COPY apps/client/package.json ./

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/apps/client/.next ./.next
COPY --from=builder /app/apps/client/next.config.mjs ./
COPY --from=builder /app/apps/client/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

CMD ["pnpm", "start"]