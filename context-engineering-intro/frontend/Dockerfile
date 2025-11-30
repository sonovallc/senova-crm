# Frontend Dockerfile for Next.js
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port 3004
EXPOSE 3004

# Start the development server
CMD ["npm", "run", "dev"]
