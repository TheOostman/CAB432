# Dockerfile
FROM node:20-alpine

# Create non-root user (safer than root)
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

# Copy package manifests first and install deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy everything else
COPY . .

# App runs on PORT (default 3000)
ENV PORT=3000
EXPOSE 3000

# Ensure output folder exists + set ownership
RUN mkdir -p /app/output && chown -R app:app /app
USER app

CMD ["node", "src/server.js"]
