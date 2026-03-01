FROM node:24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY api/prisma ./api/prisma
RUN npm ci

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN npm --prefix frontend ci

COPY . .

RUN npm run build:frontend
RUN npm run build:server

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY api/prisma ./api/prisma
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/server-dist ./server-dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node -e "const http=require('node:http');const req=http.get('http://127.0.0.1:3000/api/health',(res)=>process.exit(res.statusCode===200?0:1));req.on('error',()=>process.exit(1));"

CMD ["npm", "run", "start:container"]
