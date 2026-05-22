# Use the official Red Hat Node 22 base image
FROM registry.access.redhat.com/ubi8/nodejs-22:latest
USER root
WORKDIR /opt/app-root/src

# Install Bun directly into the root directory environment
RUN curl -fsSL https://bun.sh/install | bash

# Copy package configuration files
COPY package*.json bun.lockb* ./

# Call Bun using its absolute installation path to install dependencies
RUN /root/.bun/bin/bun install

# Copy the rest of the Bank Mannru project files
COPY . .

# Run the hyper-fast Turbopack production build using the absolute path
RUN /root/.bun/bin/bunx --turbo next build

# Fix folder permissions for OpenShift's secure non-root user
RUN chown -R 1001:0 /opt/app-root/src
USER 1001

ENV NODE_ENV production
ENV PORT 3000
EXPOSE 3000

# Start the application using the absolute path to Bun
CMD ["/root/.bun/bin/bun", "run", "start"]
