jest.mock('../../../src/models/User', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));
jest.mock('../../../src/models/TokenBlacklist', () => ({
  create: jest.fn(),
}));
jest.mock('../../../src/models/RefreshToken', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  deleteMany: jest.fn(),
}));
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));
jest.mock('../../../src/config/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
}));
jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

const User = require('../../../src/models/User');
const TokenBlacklist = require('../../../src/models/TokenBlacklist');
const RefreshToken = require('../../../src/models/RefreshToken');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { register, login, logout, verifyEmail } = require('../../../src/controllers/authController');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Crée un faux user avec save() simulé et champs lockout
const makeMockUser = (overrides = {}) => ({
  _id: 'user-id-1',
  nom: 'Alice',
  email: 'alice@example.com',
  password_hash: 'hashed-password',
  email_verified: true,
  login_attempts: 0,
  lockout_until: null,
  save: jest.fn().mockResolvedValue({}),
  ...overrides,
});

describe('authController unit tests', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'unit-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.CLIENT_URL = 'http://localhost:5173';
    process.env.MAIL_USER = 'test@skillswap.local';
    // RefreshToken.create retourne un objet avec token par défaut
    RefreshToken.create.mockResolvedValue({ token: 'refresh-token' });
  });

  describe('register', () => {
    it('returns 201 with token when data is valid', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed-password');
      User.create.mockResolvedValue({
        _id: 'user-id-1',
        nom: 'Alice',
        email: 'alice@example.com',
      });
      jwt.sign.mockReturnValue('jwt-token');

      const req = {
        body: {
          nom: 'Alice',
          email: 'alice@example.com',
          password: 'Password123',
        },
      };
      const res = createRes();

      await register(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'alice@example.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 12);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'jwt-token',
          user: expect.objectContaining({ email: 'alice@example.com' }),
        })
      );
    });

    it('returns 409 when email already exists', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockResolvedValue({ _id: 'existing-id' });

      const req = { body: { email: 'alice@example.com', nom: 'Alice', password: 'Password123' } };
      const res = createRes();

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/utilisé/i) }));
    });
  });

  describe('login', () => {
    it('returns 200 and token on successful login', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockResolvedValue(makeMockUser());
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('jwt-token');

      const req = { body: { email: 'alice@example.com', password: 'Password123' } };
      const res = createRes();

      await login(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'jwt-token',
          user: expect.objectContaining({ email: 'alice@example.com' }),
        })
      );
    });

    it('returns 401 when password comparison fails', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockResolvedValue(makeMockUser({ login_attempts: 0 }));
      bcrypt.compare.mockResolvedValue(false);

      const req = { body: { email: 'alice@example.com', password: 'WrongPassword' } };
      const res = createRes();

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/incorrect/i),
        })
      );
    });
  });

  describe('verifyEmail', () => {
    it('returns 200 when token is valid', async () => {
      const mockUser = { save: jest.fn().mockResolvedValue({}) };
      User.findOne.mockResolvedValue(mockUser);

      const req = { query: { token: 'valid-token' } };
      const res = createRes();

      await verifyEmail(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email_verify_token: 'valid-token' });
      expect(mockUser.email_verified).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/succès/i) }));
    });

    it('returns 400 when token is missing', async () => {
      const req = { query: {} };
      const res = createRes();

      await verifyEmail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/manquant/i) }));
    });
  });

  describe('logout', () => {
    it('returns 200 after blacklisting token', async () => {
      const req = { token: 'jwt-to-blacklist', tokenExp: Math.floor(Date.now() / 1000) + 3600, userId: 'user-id' };
      const res = createRes();

      RefreshToken.deleteMany.mockResolvedValue({});
      await logout(req, res, next);

      expect(TokenBlacklist.create).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/réussie/i) }));
    });
  });
});
