FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000

# Default schema directory
RUN mkdir -p /schemas
VOLUME /schemas

ENTRYPOINT ["node", "dist/cli/index.js"]
CMD ["start", "/schemas/schema.json"]
