# Use Node.js LTS version as base image
FROM node:20-alpine

# Add libc6-compat for Alpine compatibility with some npm packages
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy all application files
COPY . .

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the port your app runs on
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "server.js"]