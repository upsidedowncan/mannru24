# Install the application dependencies in a full UBI Node 22 docker image
FROM registry.access.redhat.com/ubi8/nodejs-22:latest AS base
USER root
COPY package*.json ./
RUN npm ci

# Copy the dependencies into a minimal Node.js 22 image
FROM registry.access.redhat.com/ubi8/nodejs-22-minimal:latest AS final
COPY --from=base /opt/app-root/src/node_modules /opt/app-root/src/node_modules
COPY . /opt/app-root/src

# Build the packages in minimal image
RUN npm run build

USER root
RUN chown -R 1001:0 /opt/app-root/src
USER 1001

ENV NODE_ENV development
ENV PORT 3000
EXPOSE 3000
CMD ["npm", "start"]
