# Dockerfile for VAPR Deno server
FROM denoland/deno:alpine-1.43.6

# The port the app runs on
EXPOSE 8080

# Create app directory
WORKDIR /app

# Copy project files
COPY . .

# Cache the Deno dependencies
RUN deno cache server.js

# Run the server
CMD ["run", "--allow-net", "--allow-read", "--allow-env", "--allow-write", "server.js"]
