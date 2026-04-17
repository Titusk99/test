jest.mock('../../../src/models/Message', () => ({
  create: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../../../src/models/SkillRequest', () => ({
  findById: jest.fn(),
}));

jest.mock('../../../src/models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../../../src/controllers/notificationController', () => ({
  createNotification: jest.fn(),
}));

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

const { validationResult } = require('express-validator');
const Message = require('../../../src/models/Message');
const SkillRequest = require('../../../src/models/SkillRequest');
const User = require('../../../src/models/User');
const { createNotification } = require('../../../src/controllers/notificationController');
const { sendMessage, getConversation } = require('../../../src/controllers/messageController');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('messageController unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('returns 400 if validation fails', async () => {
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Erreur' }] });
      const req = { body: {} };
      const res = createRes();

      await sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Erreur' }] });
    });

    it('returns 404 if request not found', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      SkillRequest.findById.mockResolvedValue(null);

      const req = { userId: 'user1', body: { request_id: 'req1', contenu: 'Hello' } };
      const res = createRes();

      await sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 if request is refused', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      SkillRequest.findById.mockResolvedValue({ statut: 'refused' });

      const req = { userId: 'user1', body: { request_id: 'req1', contenu: 'Hello' } };
      const res = createRes();

      await sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('creates message for pending request and returns 201', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      SkillRequest.findById.mockResolvedValue({
        statut: 'pending',
        sender_id: { toString: () => 'user1' },
        receiver_id: 'user2'
      });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ nom: 'Alice' })
      });
      const mockMessage = { _id: 'msg1', populate: jest.fn().mockResolvedValue({}) };
      Message.create.mockResolvedValue(mockMessage);

      const req = { userId: 'user1', body: { request_id: 'req1', contenu: 'Hello' } };
      const res = createRes();

      await sendMessage(req, res);

      expect(Message.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('returns 403 if user is not participant', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      SkillRequest.findById.mockResolvedValue({
        statut: 'accepted',
        sender_id: { toString: () => 'user2' },
        receiver_id: { toString: () => 'user3' }
      });

      const req = { userId: 'user1', body: { request_id: 'req1', contenu: 'Hello' } };
      const res = createRes();

      await sendMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('creates message, notification and returns 201', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      SkillRequest.findById.mockResolvedValue({
        statut: 'accepted',
        sender_id: { toString: () => 'user1' },
        receiver_id: 'user2'
      });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ nom: 'Alice' })
      });
      const mockMessage = { _id: 'msg1', populate: jest.fn().mockResolvedValue({}) };
      Message.create.mockResolvedValue(mockMessage);

      const req = { userId: 'user1', body: { request_id: 'req1', contenu: 'Hello' } };
      const res = createRes();

      await sendMessage(req, res);

      expect(Message.create).toHaveBeenCalled();
      expect(createNotification).toHaveBeenCalledWith('user2', 'new_message', expect.any(String), 'req1');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockMessage);
    });
  });

  describe('getConversation', () => {
    it('returns 404 if request not found', async () => {
      SkillRequest.findById.mockResolvedValue(null);
      const req = { params: { request_id: 'req1' } };
      const res = createRes();

      await getConversation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 if user is not participant', async () => {
      SkillRequest.findById.mockResolvedValue({
        sender_id: { toString: () => 'user2' },
        receiver_id: { toString: () => 'user3' }
      });
      const req = { userId: 'user1', params: { request_id: 'req1' } };
      const res = createRes();

      await getConversation(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns messages if user is participant', async () => {
      SkillRequest.findById.mockResolvedValue({
        sender_id: { toString: () => 'user1' },
        receiver_id: { toString: () => 'user2' }
      });
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ contenu: 'Hello' }])
      };
      Message.find.mockReturnValue(mockQuery);

      const req = { userId: 'user1', params: { request_id: 'req1' } };
      const res = createRes();

      await getConversation(req, res);

      expect(Message.find).toHaveBeenCalledWith({ request_id: 'req1' });
      expect(res.json).toHaveBeenCalledWith([{ contenu: 'Hello' }]);
    });
  });
});
