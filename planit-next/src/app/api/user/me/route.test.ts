import { GET } from './route';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import { User } from '@/models';
import dbConnect from '@/lib/db';

// Mock dependencies
jest.mock('@/lib/auth-utils');
jest.mock('@/models');
jest.mock('@/lib/db');

describe('User Me API Route', () => {
  const mockGetAuthenticatedUserId = getAuthenticatedUserId as jest.MockedFunction<typeof getAuthenticatedUserId>;
  const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
  });

  describe('GET /api/user/me', () => {
    it('should return user information', async () => {
      const mockUserId = 'user123';
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockUser = {
        _id: mockUserId,
        username: 'testuser',
        email: 'test@example.com',
        profession: 'Developer',
      };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const response = await GET();
      const data = await response.json();

      expect(mockGetAuthenticatedUserId).toHaveBeenCalled();
      expect(mockDbConnect).toHaveBeenCalled();
      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(response.status).toBe(200);
      expect(data).toEqual({
        id: mockUserId,
        username: 'testuser',
        email: 'test@example.com',
        profession: 'Developer',
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      mockGetAuthenticatedUserId.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('Unauthorized');
    });

    it('should return 404 when user not found', async () => {
      const mockUserId = 'user123';
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('User not found');
    });

    it('should handle database connection errors', async () => {
      const mockUserId = 'user123';
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);
      mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Error fetching user info');
    });

    it('should handle database query errors', async () => {
      const mockUserId = 'user123';
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Query error')),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toBe('Error fetching user info');
    });

    it('should only select specific fields', async () => {
      const mockUserId = 'user123';
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockSelect = jest.fn().mockResolvedValue({
        _id: mockUserId,
        username: 'testuser',
        email: 'test@example.com',
        profession: 'Developer',
      });

      (User.findById as jest.Mock).mockReturnValue({ select: mockSelect });

      await GET();

      expect(mockSelect).toHaveBeenCalledWith('username email profession');
    });

    it('should handle user without profession', async () => {
      const mockUserId = 'user123';
      mockGetAuthenticatedUserId.mockResolvedValue(mockUserId);

      const mockUser = {
        _id: mockUserId,
        username: 'testuser',
        email: 'test@example.com',
        profession: undefined,
      };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profession).toBeUndefined();
    });
  });
});
