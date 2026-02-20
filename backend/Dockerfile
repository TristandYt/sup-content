FROM node:18-alpine

WORKDIR /app

# On copie uniquement les fichiers de dépendances du dossier backend
COPY package*.json ./

# Installation propre (sans les packages inutiles de la racine)
RUN npm install

# Copie du reste du code source
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]