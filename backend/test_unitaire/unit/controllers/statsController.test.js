jest.mock('../../../src/models/User', () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
}));

jest.mock('../../../src/models/Skill', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));

jest.mock('../../../src/models/SkillRequest', () => ({
  countDocuments: jest.fn(),
}));

jest.mock('../../../src/models/Rating', () => ({
  aggregate: jest.fn(),
}));

jest.mock('../../../src/models/Message', () => ({
  countDocuments: jest.fn(),
}));

jest.mock('../../../src/models/Favorite', () => ({
  countDocuments: jest.fn(),
}));

const User = require('../../../src/models/User');
const Skill = require('../../../src/models/Skill');
const SkillRequest = require('../../../src/models/SkillRequest');
const Rating = require('../../../src/models/Rating');
const Message = require('../../../src/models/Message');
const Favorite = require('../../../src/models/Favorite');

const { getGlobalStats, getMyStats } = require('../../../src/controllers/statsController');

const createRes = () => {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('statsController unit tests', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGlobalStats', () => {
    it('returns global platform statistics', async () => {
      User.countDocuments.mockResolvedValueOnce(100).mockResolvedValueOnce(80); // total, verified
      Skill.countDocuments.mockResolvedValue(50);
      SkillRequest.countDocuments.mockResolvedValueOnce(200).mockResolvedValueOnce(100); // total, accepted
      Message.countDocuments.mockResolvedValue(500);

      Rating.aggregate.mockResolvedValue([{ moyenne: 4.56, total: 120 }]);
      Skill.aggregate
        .mockResolvedValueOnce([{ _id: 'React', count: 10 }]) // offered
        .mockResolvedValueOnce([{ _id: 'Node', count: 15 }]); // wanted

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ nom: 'Alice' }]),
      };
      User.find.mockReturnValue(mockUserQuery);

      const req = {};
      const res = createRes();

      await getGlobalStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        plateforme: {
          utilisateurs: { total: 100, verifies: 80 },
          annonces: 50,
          echanges: { total: 200, acceptes: 100, taux_acceptation: '50%' },
          messages: 500,
          notes: { moyenne: 4.6, total: 120 },
        },
        tendances: {
          competences_les_plus_offertes: [{ competence: 'React', annonces: 10 }],
          competences_les_plus_recherchees: [{ competence: 'Node', annonces: 15 }],
        },
        derniers_inscrits: [{ nom: 'Alice' }],
      });
    });

    it('handles empty data gracefully (0 requests, no ratings)', async () => {
      User.countDocuments.mockResolvedValue(0);
      Skill.countDocuments.mockResolvedValue(0);
      SkillRequest.countDocuments.mockResolvedValue(0);
      Message.countDocuments.mockResolvedValue(0);

      Rating.aggregate.mockResolvedValue([]);
      Skill.aggregate.mockResolvedValue([]);

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      User.find.mockReturnValue(mockUserQuery);

      const req = {};
      const res = createRes();

      await getGlobalStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        plateforme: expect.objectContaining({
          echanges: { total: 0, acceptes: 0, taux_acceptation: '0%' },
          notes: { moyenne: null, total: 0 },
        })
      }));
    });

    it('calls next on db error', async () => {
      User.countDocuments.mockImplementation(() => { throw new Error('DB Error'); });

      const req = {};
      const res = createRes();

      await getGlobalStats(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getMyStats', () => {
    it('returns personal statistics', async () => {
      Skill.countDocuments.mockResolvedValue(5);
      SkillRequest.countDocuments
        .mockResolvedValueOnce(10) // sent
        .mockResolvedValueOnce(5)  // received
        .mockResolvedValueOnce(7); // accepted
      
      Rating.aggregate.mockResolvedValue([{ moyenne: 4.88, total: 15 }]);
      Message.countDocuments.mockResolvedValue(50);
      Favorite.countDocuments.mockResolvedValue(3);

      const req = { userId: 'user1' };
      const res = createRes();

      await getMyStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        annonces: 5,
        demandes: {
          envoyees: 10,
          recues: 5,
          echanges_acceptes: 7,
        },
        reputation: {
          note_moyenne: 4.9,
          nombre_notes: 15,
        },
        messages_envoyes: 50,
        favoris: 3,
      });
    });

    it('handles empty personal ratings gracefully', async () => {
      Skill.countDocuments.mockResolvedValue(0);
      SkillRequest.countDocuments.mockResolvedValue(0);
      Rating.aggregate.mockResolvedValue([]);
      Message.countDocuments.mockResolvedValue(0);
      Favorite.countDocuments.mockResolvedValue(0);

      const req = { userId: 'user1' };
      const res = createRes();

      await getMyStats(req, res, next);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        reputation: {
          note_moyenne: null,
          nombre_notes: 0,
        }
      }));
    });

    it('calls next on db error', async () => {
      Skill.countDocuments.mockImplementation(() => { throw new Error('DB Error'); });

      const req = { userId: 'user1' };
      const res = createRes();

      await getMyStats(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
