FROM node:18-alpine

WORKDIR /app

# On installe les dépendances du front
COPY package*.json ./
RUN npm install

# On copie le code du front
COPY . .

EXPOSE 3000
# Commande classique pour React/Vite/Next
CMD ["npm", "start"]