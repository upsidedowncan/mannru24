# Use the official Red Hat Node 22 base image
FROM registry.access.redhat.com/ubi8/nodejs-22:latest
USER root
WORKDIR /opt/app-root/src

# Install Bun globally using the pre-installed and configured npm
RUN npm install -g bun

# Copy package configuration files
COPY package*.json bun.lockb* ./

# Now standard 'bun' commands are globally available in the system PATH
RUN bun install

# Copy the rest of the Bank Mannru project files
COPY . .

# Run the hyper-fast Turbopack production build
RUN bunx --turbo next build

# Fix folder permissions for OpenShift's secure non-root user
RUN chown -R 1001:0 /opt/app-root/src

ENV NODE_ENV production
ENV PORT 80
EXPOSE 80

# Start the application using Bun
CMD ["bun", "run", "start"]
