# ==============================================================================
# Practical 11: Task Management Frontend - React/Vite Dockerfile
# Multi-stage build for building and serving the production bundle
# ==============================================================================
FROM node:18 AS build

# Set working directory inside container
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy application source files
COPY . .

# Build production bundle using Vite
RUN npm run build

# Expose Vite preview port
EXPOSE 5173

# Serve built production assets via Vite preview with host binding
CMD ["npm", "run", "preview", "--", "--host"]
