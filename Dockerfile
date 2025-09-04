# Multi-stage Docker build for Investment App
# Stage 1: Build the React Native web app
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY public/ ./public/

# Build the app
RUN npm run build

# Stage 2: Build the backend
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/src/ ./src/
COPY backend/routes/ ./routes/
COPY backend/middleware/ ./middleware/
COPY backend/models/ ./models/
COPY backend/config/ ./config/
COPY backend/utils/ ./utils/
COPY backend/schemas/ ./schemas/

# Stage 3: Production runtime
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy built frontend
COPY --from=frontend-builder /app/build ./public

# Copy built backend
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/src ./src
COPY --from=backend-builder /app/routes ./routes
COPY --from=backend-builder /app/middleware ./middleware
COPY --from=backend-builder /app/models ./models
COPY --from=backend-builder /app/config ./config
COPY --from=backend-builder /app/utils ./utils
COPY --from=backend-builder /app/schemas ./schemas

# Copy package files
COPY backend/package*.json ./

# Create necessary directories
RUN mkdir -p logs backups scripts

# Copy backup scripts
COPY backend/scripts/ ./scripts/

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
