FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Copy .env.example to .env if .env does not exist
ENTRYPOINT ["/bin/sh", "-c", "[ -f .env ] || cp .env.example .env; npm run build; exec npm run dev -- --host 0.0.0.0"]

EXPOSE 5173 