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

# Copy dependency files first
COPY go.mod go.sum ./

# Download Go dependencies
RUN go mod download

# Copy full project
COPY . .

# Build optimized binary
RUN CGO_ENABLED=1 GOOS=linux go build \
    -ldflags="-w -s" \
    -o neurometric-platform main.go

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

# Create working directory
WORKDIR /app

# Copy server binary
COPY --from=builder /app/neurometric-platform .

# Copy frontend/public assets
COPY --from=builder /app/public ./public

# Create persistent database folder
RUN mkdir -p /app/data

# Set permissions
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Environment Variables
ENV PORT=8080
ENV DB_PATH=/app/data/neurometric.db

# Expose backend port
EXPOSE 8080

# Start application
CMD ["./neurometric-platform"]
