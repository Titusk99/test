jest.mock('../../../src/models/SkillRequest', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
}));

jest.mock('../../../src/models/Message', () => ({
  create: jest.fn().mockResolvedValue({ _id: 'msg1' }),
}));

jest.mock('../../../src/models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../../../src/models/Skill', () => ({
  findById: jest.fn(),
}));

jest.mock('../../../src/controllers/notificationController', () => ({
  createNotification: jest.fn(),
}));

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

const { validationResult } = require('express-validator');
const SkillRequest = require('../../../src/models/SkillRequest');
const User = require('../../../src/models/User');
const Skill = require('../../../src/models/Skill');
const { createNotification } = require('../../../src/controllers/notificationController');
const { sendRequest, getMyRequests, updateRequest } = require('../../../src/controllers/requestController');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('requestController unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendRequest', () => {
    it('returns 400 if validation fails', async () => {
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Erreur' }] });
      const req = { body: {} };
      const res = createRes();

      await sendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Erreur' }] });
    });

    it('returns 400 if user sends request to themselves', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      const req = { userId: 'user1', body: { receiver_id: 'user1', skill_id: 'skill1' } };
      const res = createRes();

      await sendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/à vous-même/i) });
    });

    it('returns 404 if receiver or skill not found', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findById.mockResolvedValue(null);
      Skill.findById.mockResolvedValue(null);

      const req = { userId: 'user1', body: { receiver_id: 'user2', skill_id: 'skill1' } };
      const res = createRes();

      await sendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 409 if a pending request already exists', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findById.mockResolvedValue({ _id: 'user2', nom: 'Bob' });
      Skill.findById.mockResolvedValue({ _id: 'skill1', titre: 'React' });
      SkillRequest.findOne.mockResolvedValue({ _id: 'req1' });

      const req = { userId: 'user1', body: { receiver_id: 'user2', skill_id: 'skill1' } };
      const res = createRes();

      await sendRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('creates request and returns 201 on success', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      User.findById.mockImplementation((id) => {
        if (id === 'user2') return { _id: 'user2', nom: 'Bob' };
        if (id === 'user1') return { _id: 'user1', nom: 'Alice', select: jest.fn().mockResolvedValue({ nom: 'Alice' }) };
        return null;
      });
      Skill.findById.mockResolvedValue({ _id: 'skill1', titre: 'React' });
      SkillRequest.findOne.mockResolvedValue(null);
      SkillRequest.create.mockResolvedValue({ _id: 'req_new' });

      const req = { userId: 'user1', body: { receiver_id: 'user2', skill_id: 'skill1', message: 'Hello' } };
      const res = createRes();

      await sendRequest(req, res);

      expect(SkillRequest.create).toHaveBeenCalled();
      expect(createNotification).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ _id: 'req_new' });
    });
  });

  describe('getMyRequests', () => {
    it('returns sent and received requests', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ _id: 'req1' }])
      };
      SkillRequest.find.mockReturnValue(mockQuery);

      const req = { userId: 'user1' };
      const res = createRes();

      await getMyRequests(req, res);

      expect(SkillRequest.find).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith({
        sent: [{ _id: 'req1' }],
        received: [{ _id: 'req1' }],
      });
    });
  });

  describe('updateRequest', () => {
    it('returns 404 if request not found', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      SkillRequest.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      const req = { params: { id: 'req1' }, body: { statut: 'accepted' } };
      const res = createRes();

      await updateRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 if user is not receiver', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      SkillRequest.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ receiver_id: { toString: () => 'user2' } })
      });

      const req = { userId: 'user1', params: { id: 'req1' }, body: { statut: 'accepted' } };
      const res = createRes();

      await updateRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 400 if request is already processed', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      SkillRequest.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          receiver_id: { toString: () => 'user1' },
          statut: 'accepted'
        })
      });

      const req = { userId: 'user1', params: { id: 'req1' }, body: { statut: 'accepted' } };
      const res = createRes();

      await updateRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('updates request, creates notification and returns 200', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      const mockRequest = {
        _id: 'req1',
        receiver_id: { toString: () => 'user1' },
        sender_id: 'user2',
        statut: 'pending',
        skill_id: { titre: 'React' },
        save: jest.fn().mockResolvedValue(true)
      };
      SkillRequest.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockRequest)
      });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ nom: 'Bob' })
      });

      const req = { userId: 'user1', params: { id: 'req1' }, body: { statut: 'accepted' } };
      const res = createRes();

      await updateRequest(req, res);

      expect(mockRequest.statut).toBe('accepted');
      expect(mockRequest.save).toHaveBeenCalled();
      expect(createNotification).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ statut: 'accepted' }));
    });
  });
});
