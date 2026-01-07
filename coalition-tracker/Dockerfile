FROM docker.io/oven/bun:1.1-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# Copy source
COPY . .

# Create data directory
RUN mkdir -p /data

# Expose API port
EXPOSE 3000

CMD ["bun", "run", "start"]
