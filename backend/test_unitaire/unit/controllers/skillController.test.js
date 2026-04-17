jest.mock('../../../src/models/Skill', () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
}));
jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
}));
jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

const Skill = require('../../../src/models/Skill');
const { validationResult } = require('express-validator');
const { getAllSkills, createSkill, getSkill, updateSkill, deleteSkill } = require('../../../src/controllers/skillController');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('skillController unit tests', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllSkills', () => {
    it('returns paginated skills for generic competence search', async () => {
      const mockedSkills = [{ titre: 'React for Python' }];
      const chain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockedSkills),
      };
      Skill.find.mockReturnValue(chain);
      Skill.countDocuments.mockResolvedValue(1);

      const req = {
        query: { competence: 'React' },
        pagination: { page: 1, limit: 20, skip: 0 },
        paginate: jest.fn().mockImplementation((total, data) => ({
          total,
          page: 1,
          limit: 20,
          totalPages: 1,
          data,
        })),
      };
      const res = createRes();

      await getAllSkills(req, res, next);

      expect(Skill.find).toHaveBeenCalledWith({
        $or: [
          { competence_offerte: { $regex: 'React', $options: 'i' } },
          { competence_recherchee: { $regex: 'React', $options: 'i' } },
        ],
      });
      expect(req.paginate).toHaveBeenCalledWith(1, mockedSkills);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ total: 1, data: mockedSkills })
      );
    });

    it('calls next when model throws', async () => {
      const expectedError = new Error('DB down');
      Skill.find.mockImplementation(() => {
        throw expectedError;
      });

      const req = {
        query: {},
        pagination: { limit: 20, skip: 0 },
        paginate: jest.fn(),
      };
      const res = createRes();

      await getAllSkills(req, res, next);

      expect(next).toHaveBeenCalledWith(expectedError);
    });
  });

  describe('createSkill', () => {
    it('returns 201 when creation succeeds', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      const skillData = { titre: 'New Skill', description: 'Desc' };
      Skill.create.mockResolvedValue({ ...skillData, _id: 'skill-id' });

      const req = { body: skillData, userId: 'user-1' };
      const res = createRes();

      await createSkill(req, res, next);

      expect(Skill.create).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'user-1', titre: 'New Skill' }));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ titre: 'New Skill' }));
    });
  });

  describe('getSkill', () => {
    it('returns 200 and skill object if found', async () => {
      const mockSkill = { _id: 'skill-1', titre: 'Found IT' };
      Skill.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSkill),
      });

      const req = { params: { id: 'skill-1' } };
      const res = createRes();

      await getSkill(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockSkill);
    });

    it('returns 404 if skill not found', async () => {
      Skill.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const req = { params: { id: 'missing' } };
      const res = createRes();

      await getSkill(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateSkill', () => {
    it('returns 200 when update succeeds', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      const mockSkill = {
        _id: 'skill-1',
        user_id: 'user-1',
        titre: 'Old',
        save: jest.fn().mockResolvedValue(true),
      };
      Skill.findById.mockResolvedValue(mockSkill);

      const req = {
        params: { id: 'skill-1' },
        userId: 'user-1',
        body: { titre: 'New Title' },
      };
      const res = createRes();

      await updateSkill(req, res, next);

      expect(mockSkill.titre).toBe('New Title');
      expect(mockSkill.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('returns 403 when user is not the owner', async () => {
      validationResult.mockReturnValue({ isEmpty: () => true });
      const mockSkill = { _id: 'skill-1', user_id: 'owner-id' };
      Skill.findById.mockResolvedValue(mockSkill);

      const req = { params: { id: 'skill-1' }, userId: 'stranger-id', body: {} };
      const res = createRes();

      await updateSkill(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteSkill', () => {
    it('returns 200 when delete succeeds', async () => {
      const mockSkill = {
        _id: 'skill-1',
        user_id: 'user-1',
        deleteOne: jest.fn().mockResolvedValue(true),
      };
      Skill.findById.mockResolvedValue(mockSkill);

      const req = { params: { id: 'skill-1' }, userId: 'user-1' };
      const res = createRes();

      await deleteSkill(req, res, next);

      expect(mockSkill.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/succès/i) }));
    });
  });
});
