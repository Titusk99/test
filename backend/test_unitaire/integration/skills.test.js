const request = require('supertest');
const app = require('../../src/app');

jest.mock('../../src/config/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test' }),
}));

describe('Skills — intégration', () => {
  let token;

  const user = { nom: 'Bob', email: 'bob@efrei.net', password: 'Password1!' };
  const skillPayload = {
    titre: 'J\'apprends React, tu m\'apprends Python',
    description: 'Échange 2h/semaine en visio',
    competence_offerte: 'React',
    competence_recherchee: 'Python',
  };

  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send(user);
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password });
    token = res.body.token;
  });

  // ─── CREATE ──────────────────────────────────────────────────────────────
  describe('POST /api/v1/skills', () => {
    it('crée une annonce (201)', async () => {
      const res = await request(app)
        .post('/api/v1/skills')
        .set('Authorization', `Bearer ${token}`)
        .send(skillPayload);

      expect(res.status).toBe(201);
      expect(res.body.titre).toBe(skillPayload.titre);
      expect(res.body).toHaveProperty('_id');
    });

    it('refuse sans token (401)', async () => {
      const res = await request(app).post('/api/v1/skills').send(skillPayload);
      expect(res.status).toBe(401);
    });

    it('refuse si champ manquant (400)', async () => {
      const res = await request(app)
        .post('/api/v1/skills')
        .set('Authorization', `Bearer ${token}`)
        .send({ titre: 'Incomplet' });

      expect(res.status).toBe(400);
    });
  });

  // ─── READ ─────────────────────────────────────────────────────────────────
  describe('GET /api/v1/skills', () => {
    it('retourne la liste paginée (200)', async () => {
      await request(app)
        .post('/api/v1/skills')
        .set('Authorization', `Bearer ${token}`)
        .send(skillPayload);

      const res = await request(app).get('/api/v1/skills');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('retourne mes annonces (GET /me)', async () => {
      await request(app)
        .post('/api/v1/skills')
        .set('Authorization', `Bearer ${token}`)
        .send(skillPayload);

      const res = await request(app)
        .get('/api/v1/skills/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body) ? res.body.length : res.body.data?.length).toBe(1);
    });
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  describe('PUT /api/v1/skills/:id', () => {
    it('met à jour son annonce (200)', async () => {
      const create = await request(app)
        .post('/api/v1/skills')
        .set('Authorization', `Bearer ${token}`)
        .send(skillPayload);

      const id = create.body._id;
      const res = await request(app)
        .put(`/api/v1/skills/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ...skillPayload, titre: 'Titre modifié' });

      expect(res.status).toBe(200);
      expect(res.body.titre).toBe('Titre modifié');
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────
  describe('DELETE /api/v1/skills/:id', () => {
    it('supprime son annonce (200)', async () => {
      const create = await request(app)
        .post('/api/v1/skills')
        .set('Authorization', `Bearer ${token}`)
        .send(skillPayload);

      const id = create.body._id;
      const res = await request(app)
        .delete(`/api/v1/skills/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const check = await request(app).get(`/api/v1/skills/${id}`);
      expect(check.status).toBe(404);
    });
  });
});
