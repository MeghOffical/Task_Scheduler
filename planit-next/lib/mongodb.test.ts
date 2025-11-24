import mongoose from 'mongoose';
import { connectToDatabase } from './mongodb';

jest.mock('mongoose', () => ({
  connection: {
    readyState: 0,
  },
  connect: jest.fn(),
}));

describe('mongodb connection utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('connectToDatabase', () => {
    it('should connect to MongoDB when not already connected', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      (mongoose.connection.readyState as any) = 0;
      (mongoose.connect as jest.Mock).mockResolvedValue(undefined);

      await connectToDatabase();

      expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test');
    });

    it('should not reconnect if already connected', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      (mongoose.connection.readyState as any) = 1;

      await connectToDatabase();

      expect(mongoose.connect).not.toHaveBeenCalled();
    });

    it('should not reconnect if connecting', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      (mongoose.connection.readyState as any) = 2;

      await connectToDatabase();

      expect(mongoose.connect).not.toHaveBeenCalled();
    });

    it('should throw error when connection fails', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      (mongoose.connection.readyState as any) = 0;
      const mockError = new Error('Connection failed');
      (mongoose.connect as jest.Mock).mockRejectedValue(mockError);

      await expect(connectToDatabase()).rejects.toThrow('Connection failed');
    });

    it('should handle disconnected state', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      (mongoose.connection.readyState as any) = 0;
      (mongoose.connect as jest.Mock).mockResolvedValue(undefined);

      await connectToDatabase();

      expect(mongoose.connect).toHaveBeenCalledTimes(1);
    });
  });
});
