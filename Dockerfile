# =========================================================
# NeuroMetric Platform Dockerfile
# Multi-stage optimized production build
# =========================================================

# ---------------------------------------------------------
# STAGE 1 — Build Go Binary
# ---------------------------------------------------------
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    gcc \
    musl-dev \
    sqlite-dev

# Create app directory
WORKDIR /app

# Copy dependency files first (better Docker caching)
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy full project
COPY . .

# Build optimized binary
RUN CGO_ENABLED=1 GOOS=linux go build \
    -ldflags="-w -s" \
    -o server main.go

# ---------------------------------------------------------
# STAGE 2 — Production Runtime
# ---------------------------------------------------------
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache \
    sqlite-libs \
    ca-certificates

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy server binary
COPY --from=builder /app/server .

# Copy public frontend assets
COPY --from=builder /app/public ./public

# Create persistent database folder
RUN mkdir -p /app/data

# Set ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose backend port
EXPOSE 8080

# Environment variables
ENV PORT=8080
ENV DB_PATH=/app/data/neurometric.db

# Start application
CMD ["./server"]
