# Use a clean, modern base image
FROM registry.access.redhat.com/ubi8/nodejs-22:latest
USER root
WORKDIR /opt/app-root/src

# Install Bun directly into the container environment
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Copy package configuration and lockfiles
COPY package*.json bun.lockb* ./

# Use Bun to clean install all dependencies instantly
RUN bun install --frozen-lockfile

# Copy the rest of the Bank Mannru project files
COPY . .

# Run the hyper-fast Turbopack production build
RUN bunx --turbo next build

# Fix permissions for OpenShift's secure non-root user
RUN chown -R 1001:0 /opt/app-root/src
USER 1001

ENV NODE_ENV production
ENV PORT 3000
EXPOSE 3000

# Boot the production app using the lightweight Bun runtime
CMD ["bun", "run", "start"]
