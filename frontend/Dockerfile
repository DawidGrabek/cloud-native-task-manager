# Etap 1: Build aplikacji
FROM node:18-alpine AS production

WORKDIR /app

# Instalujemy zależności
COPY package*.json ./
RUN npm ci --silent

# Kopiujemy resztę plików i budujemy frontend
COPY . .
RUN npm run build

# Etap 2: Serwowanie przez nginx (super szybki, typowy do produkcji)
FROM nginx:alpine 

# Skopiuj wyprodukowane pliki do katalogu serwowanego przez nginx
COPY --from=production /app/dist /usr/share/nginx/html

# (Opcjonalnie) Kopiuj własną konfigurację nginx, jeśli potrzebujesz np. "single page app fallback"
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
