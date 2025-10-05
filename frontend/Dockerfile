FROM node:20-alpine

WORKDIR /app
COPY . .

RUN npm install && npm run build

EXPOSE 8080
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8080"]