const User = require('../../../src/models/User');
const Skill = require('../../../src/models/Skill');
const SkillRequest = require('../../../src/models/SkillRequest');
const Message = require('../../../src/models/Message');
const Rating = require('../../../src/models/Rating');
const Favorite = require('../../../src/models/Favorite');
const Notification = require('../../../src/models/Notification');
const TokenBlacklist = require('../../../src/models/TokenBlacklist');
const { validationResult } = require('express-validator');
const { getUser, updateUser, deleteUser } = require('../../../src/controllers/userController');

jest.mock('../../../src/models/User');
jest.mock('../../../src/models/Skill');
jest.mock('../../../src/models/SkillRequest');
jest.mock('../../../src/models/Message');
jest.mock('../../../src/models/Rating');
jest.mock('../../../src/models/Favorite');
jest.mock('../../../src/models/Notification');
jest.mock('../../../src/models/TokenBlacklist');
jest.mock('../../../src/config/logger', () => ({ info: jest.fn() }));
jest.mock('express-validator', () => ({ validationResult: jest.fn() }));
jest.mock('fs', () => ({ existsSync: jest.fn(), unlinkSync: jest.fn() }));

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('userController unit tests', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    it('returns user data if found', async () => {
      const mockUser = { _id: 'user-1', nom: 'Alice' };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const req = { params: { id: 'user-1' } };
      const res = createRes();

      await getUser(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('returns 404 if user not found', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const req = { params: { id: 'missing' } };
      const res = createRes();

      await getUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateUser', () => {
    it('returns 200 on successful update', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      const updatedUser = { _id: 'user-1', nom: 'Alice Updated' };
      User.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedUser),
      });

      const req = {
        params: { id: 'user-1' },
        userId: 'user-1',
        body: { nom: 'Alice Updated' },
      };
      const res = createRes();

      await updateUser(req, res, next);

      expect(res.json).toHaveBeenCalledWith(updatedUser);
    });

    it('returns 403 if trying to update other user', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      const req = { params: { id: 'other-id' }, userId: 'my-id' };
      const res = createRes();

      await updateUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteUser', () => {
    it('cleans up all user data on success', async () => {
      const mockUser = { _id: 'user-1', deleteOne: jest.fn().mockResolvedValue(true) };
      User.findById.mockResolvedValue(mockUser);
      Skill.find.mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: 'skill-1' }]) });
      SkillRequest.find.mockReturnValue({ select: jest.fn().mockResolvedValue([{ _id: 'req-1' }]) });

      const req = { params: { id: 'user-1' }, userId: 'user-1', token: 'token' };
      const res = createRes();

      await deleteUser(req, res, next);

      expect(Skill.deleteMany).toHaveBeenCalled();
      expect(SkillRequest.deleteMany).toHaveBeenCalled();
      expect(mockUser.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/supprimés/i) }));
    });
  });
});
