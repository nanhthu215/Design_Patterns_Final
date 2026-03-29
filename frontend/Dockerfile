# --- build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- run stage ---
FROM nginx:1.27-alpine

# copy build ra nginx
COPY --from=build /app/build /usr/share/nginx/html

# dùng config SPA của mình
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
