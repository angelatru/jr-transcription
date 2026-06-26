FROM node:20-slim

# Build tools needed to compile better-sqlite3 native addon
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    && ln -sf /usr/bin/python3 /usr/bin/python \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp standalone binary (no Python runtime needed)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux \
    -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

WORKDIR /app

# Install dependencies with scripts enabled so:
# - better-sqlite3 compiles its native addon
# - ffmpeg-static downloads its binary
COPY package*.json ./
RUN npm ci

# Copy source and build Next.js
COPY . .
RUN npm run build

# Data directory — mount a Northflank volume here to persist SQLite
RUN mkdir -p /app/data

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]
