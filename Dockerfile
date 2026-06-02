FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN rm -rf backend
RUN npm run build

FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npx tsc

FROM node:20-alpine
WORKDIR /app
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/
COPY --from=backend-build /app/backend/prisma ./backend/prisma
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node dist/server.js"]
