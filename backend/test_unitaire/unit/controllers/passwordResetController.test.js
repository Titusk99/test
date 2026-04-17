jest.mock('../../../src/models/User', () => ({
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('../../../src/models/PasswordReset', () => ({
  deleteMany: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock('../../../src/config/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue({}),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mocked-token'),
  }),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

const { validationResult } = require('express-validator');
const User = require('../../../src/models/User');
const PasswordReset = require('../../../src/models/PasswordReset');
const bcrypt = require('bcrypt');
const mailer = require('../../../src/config/mailer');
const { forgotPassword, resetPassword } = require('../../../src/controllers/passwordResetController');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('passwordResetController unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('forgotPassword', () => {
    it('returns 400 if validation fails', async () => {
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Erreur' }] });
      const req = { body: {} };
      const res = createRes();

      await forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Erreur' }] });
    });

    it('returns standard message if user does not exist (anti-enumeration)', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockResolvedValue(null);

      const req = { body: { email: 'unknown@example.com' } };
      const res = createRes();

      await forgotPassword(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/un lien de réinitialisation/i) });
      expect(PasswordReset.create).not.toHaveBeenCalled();
      expect(mailer.sendMail).not.toHaveBeenCalled();
    });

    it('deletes old tokens, creates new token, sends email and returns message', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findOne.mockResolvedValue({ _id: 'user1', email: 'alice@example.com', nom: 'Alice' });

      const req = { body: { email: 'alice@example.com' } };
      const res = createRes();

      await forgotPassword(req, res);

      expect(PasswordReset.deleteMany).toHaveBeenCalledWith({ user_id: 'user1' });
      expect(PasswordReset.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user1', token: 'mocked-token' })
      );
      expect(mailer.sendMail).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/un lien de réinitialisation/i) });
    });
  });

  describe('resetPassword', () => {
    it('returns 400 if validation fails', async () => {
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Erreur' }] });
      const req = { body: {} };
      const res = createRes();

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 if token is invalid or already used', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      PasswordReset.findOne.mockResolvedValue(null);

      const req = { body: { token: 'invalid-token', password: 'newPassword123' } };
      const res = createRes();

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/invalide ou déjà utilisé/i) });
    });

    it('returns 400 if token is expired', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      PasswordReset.findOne.mockResolvedValue({
        expires_at: new Date(Date.now() - 10000), // Expired
        used: false,
      });

      const req = { body: { token: 'expired-token', password: 'newPassword123' } };
      const res = createRes();

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/expiré/i) });
    });

    it('resets password, marks token as used, and returns 200', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      const mockResetEntry = {
        user_id: 'user1',
        expires_at: new Date(Date.now() + 10000), // Valid
        used: false,
        save: jest.fn().mockResolvedValue(true),
      };
      PasswordReset.findOne.mockResolvedValue(mockResetEntry);
      bcrypt.hash.mockResolvedValue('new-hashed-password');

      const req = { body: { token: 'valid-token', password: 'newPassword123' } };
      const res = createRes();

      await resetPassword(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 12);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('user1', { password_hash: 'new-hashed-password' });
      expect(mockResetEntry.used).toBe(true);
      expect(mockResetEntry.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/avec succès/i) });
    });
  });
});
