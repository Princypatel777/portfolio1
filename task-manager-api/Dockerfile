# ==============================================================================
# Practical 11: Task Management API - Node.js Backend Dockerfile
# ==============================================================================
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package descriptors first to leverage Docker layer caching
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Define container runtime command
CMD ["node", "server.js"]

