FROM node:20-alpine
# Prisma's query/schema engine needs OpenSSL present - Alpine's base image
# doesn't always guarantee this, so install it explicitly rather than
# relying on whatever happens to already be there.
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
