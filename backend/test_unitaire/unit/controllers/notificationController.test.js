jest.mock('../../../src/models/Notification', () => ({
  create: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  updateMany: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));

const Notification = require('../../../src/models/Notification');
const { createNotification, getMyNotifications, markAllAsRead, markOneAsRead } = require('../../../src/controllers/notificationController');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('notificationController unit tests', () => {
  const next = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('createNotification', () => {
    it('creates a notification successfully', async () => {
      Notification.create.mockResolvedValue({});
      
      await createNotification('user1', 'test_type', 'test message', 'ref1');
      
      expect(Notification.create).toHaveBeenCalledWith({
        user_id: 'user1',
        type: 'test_type',
        message: 'test message',
        ref_id: 'ref1',
      });
    });

    it('catches and logs errors without throwing', async () => {
      const error = new Error('Database down');
      Notification.create.mockRejectedValue(error);
      
      await createNotification('user1', 'test_type', 'test message', 'ref1');
      
      expect(console.error).toHaveBeenCalledWith('Erreur création notification :', 'Database down');
    });
  });

  describe('getMyNotifications', () => {
    it('returns paginated notifications and unread count', async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([{ _id: 'notif1', message: 'Hello' }]),
      };
      Notification.find.mockReturnValue(mockQuery);
      
      Notification.countDocuments
        .mockResolvedValueOnce(5) // total notifications
        .mockResolvedValueOnce(2); // unread notifications

      const req = {
        userId: 'user1',
        pagination: { skip: 0, limit: 10 },
        paginate: jest.fn((total, data) => ({ total, data })),
      };
      const res = createRes();

      await getMyNotifications(req, res, next);

      expect(Notification.find).toHaveBeenCalledWith({ user_id: 'user1' });
      expect(Notification.countDocuments).toHaveBeenCalledWith({ user_id: 'user1' });
      expect(Notification.countDocuments).toHaveBeenCalledWith({ user_id: 'user1', lu: false });
      
      expect(res.json).toHaveBeenCalledWith({
        unread: 2,
        total: 5,
        data: [{ _id: 'notif1', message: 'Hello' }],
      });
    });

    it('calls next with error if query fails', async () => {
      Notification.find.mockImplementation(() => { throw new Error('DB Error'); });
      
      const req = {
        userId: 'user1',
        pagination: { skip: 0, limit: 10 },
      };
      const res = createRes();

      await getMyNotifications(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('markAllAsRead', () => {
    it('updates all unread notifications to read and returns 200', async () => {
      Notification.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const req = { userId: 'user1' };
      const res = createRes();

      await markAllAsRead(req, res, next);

      expect(Notification.updateMany).toHaveBeenCalledWith({ user_id: 'user1', lu: false }, { lu: true });
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/marquées comme lues/i) });
    });

    it('calls next with error if query fails', async () => {
      Notification.updateMany.mockRejectedValue(new Error('DB Error'));

      const req = { userId: 'user1' };
      const res = createRes();

      await markAllAsRead(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('markOneAsRead', () => {
    it('returns 404 if notification not found', async () => {
      Notification.findOneAndUpdate.mockResolvedValue(null);

      const req = { userId: 'user1', params: { id: 'notif1' } };
      const res = createRes();

      await markOneAsRead(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: expect.stringMatching(/introuvable/i) });
    });

    it('marks one notification as read and returns it', async () => {
      const mockNotif = { _id: 'notif1', lu: true };
      Notification.findOneAndUpdate.mockResolvedValue(mockNotif);

      const req = { userId: 'user1', params: { id: 'notif1' } };
      const res = createRes();

      await markOneAsRead(req, res, next);

      expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'notif1', user_id: 'user1' },
        { lu: true },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(mockNotif);
    });

    it('calls next with error if query fails', async () => {
      Notification.findOneAndUpdate.mockRejectedValue(new Error('DB Error'));

      const req = { userId: 'user1', params: { id: 'notif1' } };
      const res = createRes();

      await markOneAsRead(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
