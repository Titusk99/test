jest.mock('../../../src/models/Favorite', () => ({
  create: jest.fn(),
  findOneAndDelete: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../../../src/models/Skill', () => ({
  findById: jest.fn(),
}));

const Favorite = require('../../../src/models/Favorite');
const Skill = require('../../../src/models/Skill');
const { addFavorite, removeFavorite, getMyFavorites } = require('../../../src/controllers/favoriteController');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('favoriteController unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('addFavorite', () => {
    it('returns 400 if skill_id is missing', async () => {
      const req = { body: {} };
      const res = createRes();

      await addFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/requis/i) });
    });

    it('returns 404 if skill not found', async () => {
      Skill.findById.mockResolvedValue(null);

      const req = { body: { skill_id: 'skill1' } };
      const res = createRes();

      await addFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/introuvable/i) });
    });

    it('returns 400 if user favors their own skill', async () => {
      Skill.findById.mockResolvedValue({ user_id: { toString: () => 'user1' } });

      const req = { userId: 'user1', body: { skill_id: 'skill1' } };
      const res = createRes();

      await addFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/propre annonce/i) });
    });

    it('returns 409 if favorite already exists (duplicate key)', async () => {
      Skill.findById.mockResolvedValue({ user_id: { toString: () => 'user2' } });
      const duplicateError = new Error('Duplicate');
      duplicateError.code = 11000;
      Favorite.create.mockRejectedValue(duplicateError);

      const req = { userId: 'user1', body: { skill_id: 'skill1' } };
      const res = createRes();

      await addFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/déjà dans vos favoris/i) });
    });

    it('creates favorite and returns 201', async () => {
      Skill.findById.mockResolvedValue({ user_id: { toString: () => 'user2' } });
      Favorite.create.mockResolvedValue({ _id: 'fav1' });

      const req = { userId: 'user1', body: { skill_id: 'skill1' } };
      const res = createRes();

      await addFavorite(req, res);

      expect(Favorite.create).toHaveBeenCalledWith({ user_id: 'user1', skill_id: 'skill1' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ favorite: { _id: 'fav1' } }));
    });
  });

  describe('removeFavorite', () => {
    it('returns 404 if favorite not found', async () => {
      Favorite.findOneAndDelete.mockResolvedValue(null);

      const req = { userId: 'user1', params: { skill_id: 'skill1' } };
      const res = createRes();

      await removeFavorite(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/introuvable/i) });
    });

    it('removes favorite and returns message', async () => {
      Favorite.findOneAndDelete.mockResolvedValue({ _id: 'fav1' });

      const req = { userId: 'user1', params: { skill_id: 'skill1' } };
      const res = createRes();

      await removeFavorite(req, res);

      expect(Favorite.findOneAndDelete).toHaveBeenCalledWith({ user_id: 'user1', skill_id: 'skill1' });
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/retiré/i) });
    });
  });

  describe('getMyFavorites', () => {
    it('returns populated favorites', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ _id: 'fav1' }]),
      };
      Favorite.find.mockReturnValue(mockQuery);

      const req = { userId: 'user1' };
      const res = createRes();

      await getMyFavorites(req, res);

      expect(Favorite.find).toHaveBeenCalledWith({ user_id: 'user1' });
      expect(res.json).toHaveBeenCalledWith([{ _id: 'fav1' }]);
    });

    it('returns 500 on db error', async () => {
      Favorite.find.mockImplementation(() => { throw new Error('DB Error'); });

      const req = { userId: 'user1' };
      const res = createRes();

      await getMyFavorites(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/erreur serveur/i) });
    });
  });
});
