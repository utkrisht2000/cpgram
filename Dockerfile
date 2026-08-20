# Multi-stage build for production-grade full-stack SuGam deployment
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/
COPY frontend/package.json frontend/package-lock.json ./frontend/

RUN npm install
RUN cd backend && npm install
RUN cd frontend && npm install

# Copy source files
COPY . .

# Build frontend & backend
RUN npm --prefix frontend run build
RUN npm --prefix backend run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder /app/package.json ./
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/scripts ./scripts

EXPOSE 4000

# Run migrations, seed demonstration data, and launch Express server
CMD ["node", "backend/dist/server.js"]
