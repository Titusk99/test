jest.mock('../../../src/models/Rating', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../../../src/models/SkillRequest', () => ({
  findById: jest.fn(),
}));

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

const { validationResult } = require('express-validator');
const Rating = require('../../../src/models/Rating');
const SkillRequest = require('../../../src/models/SkillRequest');
const { createRating, getUserRatings } = require('../../../src/controllers/ratingController');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('ratingController unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('createRating', () => {
    it('returns 400 if validation fails', async () => {
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => [{ msg: 'Erreur' }] });
      const req = { body: {} };
      const res = createRes();

      await createRating(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Erreur' }] });
    });

    it('returns 404 if request not found', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      SkillRequest.findById.mockResolvedValue(null);

      const req = { userId: 'user1', body: { request_id: 'req1', note: 5 } };
      const res = createRes();

      await createRating(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/introuvable/i) });
    });

    it('returns 400 if request is not accepted', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      SkillRequest.findById.mockResolvedValue({ statut: 'pending' });

      const req = { userId: 'user1', body: { request_id: 'req1', note: 5 } };
      const res = createRes();

      await createRating(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/acceptés/i) });
    });

    it('returns 403 if user is not participant', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      SkillRequest.findById.mockResolvedValue({
        statut: 'accepted',
        sender_id: { toString: () => 'user2' },
        receiver_id: { toString: () => 'user3' }
      });

      const req = { userId: 'user1', body: { request_id: 'req1', note: 5 } };
      const res = createRes();

      await createRating(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 409 if already rated', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      SkillRequest.findById.mockResolvedValue({
        statut: 'accepted',
        sender_id: { toString: () => 'user1' },
        receiver_id: { toString: () => 'user2' }
      });
      Rating.findOne.mockResolvedValue({ _id: 'rating1' });

      const req = { userId: 'user1', body: { request_id: 'req1', note: 5 } };
      const res = createRes();

      await createRating(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/déjà noté/i) });
    });

    it('creates rating and returns 201', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      SkillRequest.findById.mockResolvedValue({
        statut: 'accepted',
        sender_id: 'user2',
        receiver_id: 'user1'
      });
      Rating.findOne.mockResolvedValue(null);
      Rating.create.mockResolvedValue({ _id: 'rating2', note: 4 });

      const req = { userId: 'user1', body: { request_id: 'req1', note: 4, commentaire: 'Super' } };
      const res = createRes();

      await createRating(req, res);

      expect(Rating.create).toHaveBeenCalledWith({
        request_id: 'req1',
        reviewer_id: 'user1',
        reviewed_id: 'user2',
        note: 4,
        commentaire: 'Super',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ _id: 'rating2', note: 4 });
    });
  });

  describe('getUserRatings', () => {
    it('returns average and total ratings', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ note: 4 }, { note: 5 }]),
      };
      Rating.find.mockReturnValue(mockQuery);

      const req = { params: { id: 'user2' } };
      const res = createRes();

      await getUserRatings(req, res);

      expect(Rating.find).toHaveBeenCalledWith({ reviewed_id: 'user2' });
      expect(res.json).toHaveBeenCalledWith({
        average: 4.5,
        total: 2,
        ratings: [{ note: 4 }, { note: 5 }],
      });
    });

    it('returns null average if no ratings', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]),
      };
      Rating.find.mockReturnValue(mockQuery);

      const req = { params: { id: 'user2' } };
      const res = createRes();

      await getUserRatings(req, res);

      expect(res.json).toHaveBeenCalledWith({
        average: null,
        total: 0,
        ratings: [],
      });
    });

    it('returns 500 on db error', async () => {
      Rating.find.mockImplementation(() => { throw new Error('DB Error'); });

      const req = { params: { id: 'user2' } };
      const res = createRes();

      await getUserRatings(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/erreur/i) });
    });
  });
});
