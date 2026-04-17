jest.mock('../../../src/models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../../../src/models/Skill', () => ({
  find: jest.fn(),
  findById: jest.fn(),
}));

const User = require('../../../src/models/User');
const Skill = require('../../../src/models/Skill');
const { getMyMatches, searchSkills, getMatchesForSkill } = require('../../../src/controllers/matchController');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('matchController unit tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyMatches', () => {
    it('returns 404 if user not found', async () => {
      User.findById.mockResolvedValue(null);
      const req = { userId: 'user1' };
      const res = createRes();

      await getMyMatches(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 400 if user profile is incomplete', async () => {
      User.findById.mockResolvedValue({ _id: 'user1' }); // missing competences
      const req = { userId: 'user1' };
      const res = createRes();

      await getMyMatches(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Complète ton profil/i) }));
    });

    it('returns matches sorted by score', async () => {
      User.findById.mockResolvedValue({
        _id: 'user1',
        competences_offertes: 'React',
        competences_recherchees: 'Python',
      });

      const mockSkill = {
        _id: 'skill1',
        competence_offerte: 'Python',
        competence_recherchee: 'React',
        toObject: jest.fn().mockReturnValue({ _id: 'skill1' }),
      };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue([mockSkill]),
      };
      Skill.find.mockReturnValue(mockQuery);

      const req = { userId: 'user1' };
      const res = createRes();

      await getMyMatches(req, res);

      expect(Skill.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        total: 1,
        matches: expect.arrayContaining([
          expect.objectContaining({ _id: 'skill1', compatibility_score: 100 }),
        ]),
      }));
    });
  });

  describe('searchSkills', () => {
    it('returns 400 if query is too short', async () => {
      const req = { query: { q: 'a' } };
      const res = createRes();

      await searchSkills(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns text search results', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ _id: 'skill1', titre: 'React' }]),
      };
      Skill.find.mockReturnValue(mockQuery);

      const req = { query: { q: 'react' } };
      const res = createRes();

      await searchSkills(req, res);

      expect(Skill.find).toHaveBeenCalledWith(
        { $text: { $search: 'react' } },
        { score: { $meta: 'textScore' } }
      );
      expect(res.json).toHaveBeenCalledWith({
        total: 1,
        results: [{ _id: 'skill1', titre: 'React' }],
      });
    });

    it('uses regex fallback if text search returns empty', async () => {
      const emptyQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]), // regex fallback will be triggered
      };
      
      const fallbackQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ _id: 'skill2', titre: 'Vue' }]),
      };

      Skill.find
        .mockReturnValueOnce(emptyQuery) // $text search empty
        .mockReturnValueOnce(fallbackQuery); // regex fallback

      const req = { query: { q: 'vuejs' } };
      const res = createRes();

      await searchSkills(req, res);

      expect(Skill.find).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith({
        total: 1,
        results: [{ _id: 'skill2', titre: 'Vue' }],
      });
    });
  });

  describe('getMatchesForSkill', () => {
    it('returns 404 if skill not found', async () => {
      Skill.findById.mockResolvedValue(null);
      const req = { params: { id: 'skill1' } };
      const res = createRes();

      await getMatchesForSkill(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns matches for skill', async () => {
      const dbSkill = {
        _id: 'skill1',
        competence_offerte: 'Node',
        competence_recherchee: 'Vue',
      };
      Skill.findById.mockResolvedValue(dbSkill);

      const matchedSkill = {
        _id: 'skill2',
        competence_offerte: 'Vue',
        competence_recherchee: 'Node',
        toObject: jest.fn().mockReturnValue({ _id: 'skill2' }),
      };

      const mockQuery = {
        populate: jest.fn().mockResolvedValue([matchedSkill]),
      };
      Skill.find.mockReturnValue(mockQuery);

      const req = { params: { id: 'skill1' } };
      const res = createRes();

      await getMatchesForSkill(req, res);

      expect(Skill.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        total: 1,
        matches: expect.arrayContaining([
          expect.objectContaining({ _id: 'skill2', compatibility_score: 100 }),
        ]),
      }));
    });
  });
});
