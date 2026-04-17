const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/config/socket');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);
initSocket(httpServer);

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
  });
});
