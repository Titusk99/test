jest.mock('../../../src/models/User', () => ({
  findById: jest.fn(),
}));
jest.mock('../../../src/models/Skill', () => ({
  find: jest.fn(),
}));
jest.mock('../../../src/models/SkillRequest', () => ({
  find: jest.fn(),
}));
jest.mock('../../../src/models/Message', () => ({
  find: jest.fn(),
}));
jest.mock('../../../src/models/Rating', () => ({
  find: jest.fn(),
}));
jest.mock('../../../src/models/Favorite', () => ({
  find: jest.fn(),
}));
jest.mock('../../../src/models/Notification', () => ({
  find: jest.fn(),
}));
jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
}));

const User = require('../../../src/models/User');
const Skill = require('../../../src/models/Skill');
const SkillRequest = require('../../../src/models/SkillRequest');
const Message = require('../../../src/models/Message');
const Rating = require('../../../src/models/Rating');
const Favorite = require('../../../src/models/Favorite');
const Notification = require('../../../src/models/Notification');
const logger = require('../../../src/config/logger');

const { exportData } = require('../../../src/controllers/rgpdController');

const createRes = () => {
  const res = {};
  res.setHeader = jest.fn();
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('rgpdController unit tests', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportData', () => {
    it('gathers all user data and returns it as a JSON payload', async () => {
      // Mock db returns
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ nom: 'Alice', email: 'alice@example.com' })
      });
      Skill.find.mockResolvedValue([{ titre: 'React' }]);
      
      const mockRequestQuery = { populate: jest.fn().mockResolvedValue([{ _id: 'req1' }]) };
      SkillRequest.find.mockReturnValue(mockRequestQuery);
      
      Message.find.mockResolvedValue([{ contenu: 'Hello' }]);
      
      const mockRatingQuery = { populate: jest.fn().mockResolvedValue([{ note: 5 }]) };
      // Rating.find is called twice (given, received)
      Rating.find.mockReturnValueOnce([{ note: 4 }]).mockReturnValueOnce(mockRatingQuery);
      
      const mockFavoriteQuery = { populate: jest.fn().mockResolvedValue([{ _id: 'fav1' }]) };
      Favorite.find.mockReturnValue(mockFavoriteQuery);
      
      Notification.find.mockResolvedValue([{ message: 'Notif' }]);

      const req = { userId: 'user1' };
      const res = createRes();

      await exportData(req, res, next);

      expect(User.findById).toHaveBeenCalledWith('user1');
      expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/export rgpd effectué/i));
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('attachment'));
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          profil: expect.objectContaining({ nom: 'Alice' }),
          annonces: [{ titre: 'React' }],
          demandes: {
            envoyees: [{ _id: 'req1' }],
            recues: [{ _id: 'req1' }]
          },
          messages: [{ contenu: 'Hello' }],
          notes: {
            donnees: [{ note: 4 }],
            recues: [{ note: 5 }]
          },
          favoris: [{ _id: 'fav1' }],
          notifications: [{ message: 'Notif' }]
        })
      );
    });

    it('calls next if an error occurs', async () => {
      User.findById.mockImplementation(() => { throw new Error('DB Error'); });

      const req = { userId: 'user1' };
      const res = createRes();

      await exportData(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
