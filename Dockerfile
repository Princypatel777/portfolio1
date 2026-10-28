# ==============================================================================
# Practical 11: Task Management Frontend - React/Vite Dockerfile
# Node 22 LTS satisfies Vite 8 + Rolldown engine requirements (styleText in node:util)
# ==============================================================================
FROM node:22 AS build

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
