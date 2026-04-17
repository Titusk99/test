const request = require('supertest');
const app = require('../../src/app');

// Mock nodemailer pour ne pas envoyer de vrais emails
jest.mock('../../src/config/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test' }),
}));

describe('Auth — intégration', () => {
  const validUser = {
    nom: 'Alice Test',
    email: 'alice@efrei.net',
    password: 'Password1!',
  };

  // ─── REGISTER ────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/register', () => {
    it('crée un compte et retourne un token + refresh_token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refresh_token');
      expect(res.body.user.email).toBe(validUser.email);
    });

    it('refuse un email déjà utilisé (409)', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
      const res = await request(app).post('/api/v1/auth/register').send(validUser);

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/déjà utilisé/i);
    });

    it('refuse un mot de passe sans majuscule (400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, password: 'password1!' });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toMatch(/majuscule/i);
    });

    it('refuse un mot de passe sans chiffre (400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, password: 'Password!' });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toMatch(/chiffre/i);
    });

    it('refuse un email invalide (400)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...validUser, email: 'pasunemail' });

      expect(res.status).toBe(400);
    });
  });

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
    });

    it('connecte avec les bons identifiants et retourne token + refresh_token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refresh_token');
    });

    it('refuse un mauvais mot de passe (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: 'Mauvais1!' });

      expect(res.status).toBe(401);
    });

    // Ce test nécessite la PR #30 (feature/account-lockout) mergée dans Dev
    it.skip('bloque le compte après 5 tentatives échouées (423)', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({ email: validUser.email, password: 'Mauvais1!' });
      }

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      expect(res.status).toBe(423);
      expect(res.body.message).toMatch(/bloqu/i);
    });
  });

  // ─── REFRESH ─────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password });
      refreshToken = loginRes.body.refresh_token;
    });

    it('retourne un nouveau token et un nouveau refresh_token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refresh_token');
      expect(res.body.refresh_token).not.toBe(refreshToken); // rotation
    });

    it('refuse la réutilisation du même refresh_token (401)', async () => {
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: refreshToken });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: refreshToken });

      expect(res.status).toBe(401);
    });

    it('refuse un refresh_token invalide (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: 'token_bidon' });

      expect(res.status).toBe(401);
    });
  });

  // ─── LOGOUT ──────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/logout', () => {
    it('déconnecte et blacklist le JWT', async () => {
      await request(app).post('/api/v1/auth/register').send(validUser);
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password });

      const token = loginRes.body.token;

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(logoutRes.status).toBe(200);

      // Le même token doit maintenant être refusé
      const protectedRes = await request(app)
        .get('/api/v1/skills/me')
        .set('Authorization', `Bearer ${token}`);

      expect(protectedRes.status).toBe(401);
    });
  });
});
