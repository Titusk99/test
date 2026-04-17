jest.mock('../../../src/models/SkillRequest', () => ({
  findById: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
}));

const SkillRequest = require('../../../src/models/SkillRequest');
const logger = require('../../../src/config/logger');
const { archiveRequest, getArchivedRequests, deleteArchivedRequest } = require('../../../src/controllers/archiveController');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('archiveController unit tests', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('archiveRequest', () => {
    it('returns 404 if request not found', async () => {
      SkillRequest.findById.mockResolvedValue(null);
      const req = { params: { request_id: 'req1' } };
      const res = createRes();

      await archiveRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/introuvable/i) });
    });

    it('returns 403 if user is not participant', async () => {
      SkillRequest.findById.mockResolvedValue({
        sender_id: 'user2',
        receiver_id: 'user3'
      });
      const req = { userId: 'user1', params: { request_id: 'req1' } };
      const res = createRes();

      await archiveRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 400 if request is not accepted or refused', async () => {
      SkillRequest.findById.mockResolvedValue({
        sender_id: 'user1',
        receiver_id: 'user2',
        statut: 'pending'
      });
      const req = { userId: 'user1', params: { request_id: 'req1' } };
      const res = createRes();

      await archiveRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/terminés/i) });
    });

    it('archives request, calls logger, and returns success message', async () => {
      const mockRequest = {
        _id: 'req1',
        sender_id: 'user1',
        receiver_id: 'user2',
        statut: 'accepted',
        save: jest.fn().mockResolvedValue(true)
      };
      SkillRequest.findById.mockResolvedValue(mockRequest);

      const req = { userId: 'user1', params: { request_id: 'req1' } };
      const res = createRes();

      await archiveRequest(req, res, next);

      expect(mockRequest.statut).toBe('archived');
      expect(mockRequest.archived_by).toBe('user1');
      expect(mockRequest.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/archivé/i));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/succès/i) }));
    });

    it('calls next on db error', async () => {
      SkillRequest.findById.mockImplementation(() => { throw new Error('DB Error'); });
      const req = { params: { request_id: 'req1' } };
      const res = createRes();

      await archiveRequest(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getArchivedRequests', () => {
    it('returns paginated archived requests', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ _id: 'req1', statut: 'archived' }])
      };
      SkillRequest.find.mockReturnValue(mockQuery);
      SkillRequest.countDocuments.mockResolvedValue(1);

      const req = {
        userId: 'user1',
        pagination: { skip: 0, limit: 10 },
        paginate: jest.fn((total, data) => ({ total, data }))
      };
      const res = createRes();

      await getArchivedRequests(req, res, next);

      expect(SkillRequest.find).toHaveBeenCalled();
      expect(SkillRequest.countDocuments).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        total: 1,
        data: [{ _id: 'req1', statut: 'archived' }]
      });
    });

    it('calls next on db error', async () => {
      SkillRequest.find.mockImplementation(() => { throw new Error('DB Error'); });
      const req = { userId: 'user1', pagination: { skip: 0, limit: 10 } };
      const res = createRes();

      await getArchivedRequests(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deleteArchivedRequest', () => {
    it('returns 404 if request not found', async () => {
      SkillRequest.findById.mockResolvedValue(null);
      const req = { params: { request_id: 'req1' } };
      const res = createRes();

      await deleteArchivedRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 if user is not participant', async () => {
      SkillRequest.findById.mockResolvedValue({
        sender_id: 'user2',
        receiver_id: 'user3'
      });
      const req = { userId: 'user1', params: { request_id: 'req1' } };
      const res = createRes();

      await deleteArchivedRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 400 if request is not archived', async () => {
      SkillRequest.findById.mockResolvedValue({
        sender_id: 'user1',
        receiver_id: 'user2',
        statut: 'accepted'
      });
      const req = { userId: 'user1', params: { request_id: 'req1' } };
      const res = createRes();

      await deleteArchivedRequest(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/archivés peuvent être supprimés/i) });
    });

    it('deletes archived request permanently', async () => {
      const mockRequest = {
        _id: 'req1',
        sender_id: 'user1',
        receiver_id: 'user2',
        statut: 'archived',
        deleteOne: jest.fn().mockResolvedValue(true)
      };
      SkillRequest.findById.mockResolvedValue(mockRequest);

      const req = { userId: 'user1', params: { request_id: 'req1' } };
      const res = createRes();

      await deleteArchivedRequest(req, res, next);

      expect(mockRequest.deleteOne).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/supprimé définitivement/i));
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/supprimé/i) });
    });

    it('calls next on db error', async () => {
      SkillRequest.findById.mockImplementation(() => { throw new Error('DB Error'); });
      const req = { params: { request_id: 'req1' } };
      const res = createRes();

      await deleteArchivedRequest(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
