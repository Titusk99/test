const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const v1Router = require('./routes/v1');

const sanitizeMiddleware = require('./middlewares/sanitize');
const { globalLimiter } = require('./middlewares/rateLimiter');
const paginate = require('./middlewares/paginate');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./config/logger');

const app = express();

// Sécurité : headers HTTP (CSP assouplie sur /api/docs pour Swagger UI)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/docs')) {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'https:', 'data:'],
        },
      },
    })(req, res, next);
  }
  return helmet()(req, res, next);
});

// Sécurité : CORS
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Performance : compression gzip
app.use(compression());

// Logs HTTP (Morgan → Winston)
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// Parsing JSON
app.use(express.json({ limit: '10kb' }));

// Sécurité : NoSQL injection (sanitise body et params uniquement — req.query est en lecture seule sur Express 5)
app.use((req, res, next) => {
  if (req.body)   req.body   = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  next();
});

// Sécurité : HTTP Parameter Pollution
app.use(hpp());

// Fichiers statiques (avatars)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Sécurité : rate limiting global
app.use(globalLimiter);

// Sécurité : sanitisation XSS
app.use(sanitizeMiddleware);

// Pagination sur toutes les routes
app.use(paginate);

// Racine
app.get('/', (req, res) => {
  res.json({
    message: 'SkillSwap API is running',
    version: 'v1',
    docs: '/api/docs',
  });
});

// Documentation interactive Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'SkillSwap API Docs',
  customCss: '.swagger-ui .topbar { background-color: #1a1a2e; }',
}));

// Routes versionnées
app.use('/api/v1', v1Router);

// Rétrocompatibilité — redirige /api/* vers /api/v1/*
app.use('/api/{*path}', (req, res) => {
  const subpath = req.params.path || '';
  res.status(301).json({
    message: `Cette route a été déplacée vers /api/v1/${subpath}`,
    new_url: `/api/v1/${subpath}`,
  });
});

// Route introuvable
app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable' });
});

// Gestion centralisée des erreurs (doit être en dernier)
app.use(errorHandler);

module.exports = app;
