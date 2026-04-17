const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SkillSwap API',
      version: '1.0.0',
      description: `
## Plateforme d'échange de compétences entre étudiants

SkillSwap met en relation des étudiants qui souhaitent échanger leurs compétences.
Tu maîtrises Excel, tu cherches quelqu'un pour t'aider en anglais — on te met en relation. Pas d'argent, juste du troc de savoir.

### Authentification
La plupart des routes nécessitent un token JWT.
Après connexion, ajoute le header : \`Authorization: Bearer <token>\`

### Pagination
Les routes de liste acceptent les paramètres \`?page=1&limit=20\` (max 50 par page).

### Versioning
Toutes les routes sont préfixées par \`/api/v1/\`.
Les appels vers \`/api/*\` reçoivent une réponse 301 avec la nouvelle URL.
      `,
      contact: {
        name: 'Équipe SkillSwap — EFREI B2',
      },
    },
    servers: [
      { url: 'http://localhost:3000/api/v1', description: 'Développement local (v1)' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6618a3f2b1c2d3e4f5a6b7c8' },
            nom: { type: 'string', example: 'Alice Martin' },
            email: { type: 'string', example: 'alice@efrei.net' },
            bio: { type: 'string', example: 'Passionnée de dev web' },
            competences_offertes: { type: 'string', example: 'React, Node.js' },
            competences_recherchees: { type: 'string', example: 'Python, Data Science' },
            avatar: { type: 'string', nullable: true, example: 'http://localhost:3000/uploads/avatars/abc.jpg' },
            email_verified: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Skill: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6618a3f2b1c2d3e4f5a6b7c9' },
            user_id: { $ref: '#/components/schemas/User' },
            titre: { type: 'string', example: 'J\'apprends React, tu m\'apprends Python' },
            description: { type: 'string', example: 'Échange de 2h/semaine en visio' },
            competence_offerte: { type: 'string', example: 'React, Node.js' },
            competence_recherchee: { type: 'string', example: 'Python, Data Science' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        SkillRequest: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            sender_id: { $ref: '#/components/schemas/User' },
            receiver_id: { $ref: '#/components/schemas/User' },
            skill_id: { $ref: '#/components/schemas/Skill' },
            message: { type: 'string', nullable: true },
            statut: { type: 'string', enum: ['pending', 'accepted', 'refused', 'archived'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Rating: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            reviewer_id: { $ref: '#/components/schemas/User' },
            reviewed_id: { $ref: '#/components/schemas/User' },
            note: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
            commentaire: { type: 'string', example: 'Super échange, très pédagogue !' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            request_id: { type: 'string' },
            sender_id: { $ref: '#/components/schemas/User' },
            contenu: { type: 'string', example: 'Bonjour, je suis disponible ce weekend !' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 42 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            totalPages: { type: 'integer', example: 3 },
            data: { type: 'array', items: {} },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Message d\'erreur' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/routes/v1/*.js'],
};

module.exports = swaggerJsdoc(options);
