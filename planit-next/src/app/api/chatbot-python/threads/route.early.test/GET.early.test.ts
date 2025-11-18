
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import { NextResponse } from 'next/server';
import { GET } from '../route';


// route.GET.spec.ts


// route.GET.spec.ts
// Mock for getAuthenticatedUserId
jest.mock("@/lib/auth-utils", () => {
  const actual = jest.requireActual("@/lib/auth-utils");
  return {
    ...actual,
    getAuthenticatedUserId: jest.fn(),
  };
});

// Mock for NextResponse
jest.mock("next/server", () => {
  const actual = jest.requireActual("next/server");
  return {
    ...actual,
    NextResponse: {
      json: jest.fn(),
    },
  };
});

// MockRequest interface to simulate the Request object
interface MockRequest {
  method: string;
  url: string;
  headers: {
    get: jest.Mock<any, any>;
    has: jest.Mock<any, any>;
  };
  bodyUsed: boolean;
  clone: jest.Mock<any, any>;
  // Add more properties as needed for your tests
}

// Helper to create a default MockRequest
function createMockRequest(): MockRequest {
  return {
    method: 'GET',
    url: 'http://localhost/api/chatbot-python/threads',
    headers: {
      get: jest.fn(),
      has: jest.fn(),
    },
    bodyUsed: false,
    clone: jest.fn(),
  };
}

describe('GET() GET method', () => {
  let originalFetch: typeof global.fetch;
  let mockRequest: MockRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    originalFetch = global.fetch;
    mockRequest = createMockRequest();
    process.env.PYTHON_CHATBOT_URL = 'http://python-api:8000';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.PYTHON_CHATBOT_URL;
  });

  // ========== HAPPY PATHS ==========

  it('should return threads in expected format when authenticated and Python API returns threads', async () => {
    // This test ensures that the GET function returns the correct thread format when everything works as expected.

    // Arrange
    (getAuthenticatedUserId as jest.MockedFunction<typeof getAuthenticatedUserId>).mockResolvedValue('user-123' as any);

    const mockThreads = ['thread-1', 'thread-2'];
    const mockFetchResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue({ threads: mockThreads }),
    };
    global.fetch = jest.fn().mockResolvedValue(mockFetchResponse as any as never);

    const mockJson = jest.fn();
    (NextResponse.json as jest.MockedFunction<typeof NextResponse.json>).mockImplementation(mockJson);

    // Act
    await GET(mockRequest as any);

    // Assert
    expect(getAuthenticatedUserId).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      'http://python-api:8000/api/chatbot/threads',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    expect(mockFetchResponse.json).toHaveBeenCalled();

    // The threads should be mapped to the expected format
    const calledWith = mockJson.mock.calls[0][0];
    expect(Array.isArray(calledWith)).toBe(true);
    expect(calledWith.length).toBe(2);
    expect(calledWith[0]).toMatchObject({
      threadId: 'thread-1',
      title: 'Chat Thread',
      messageCount: 0,
    });
    expect(typeof calledWith[0].createdAt).toBe('string');
    expect(typeof calledWith[0].updatedAt).toBe('string');
    expect(mockJson).toHaveBeenCalledWith(calledWith);
  });

  it('should use default PYTHON_API_URL if env variable is not set', async () => {
    // This test ensures that the default URL is used if the environment variable is missing.

    // Arrange
    delete process.env.PYTHON_CHATBOT_URL;
    (getAuthenticatedUserId as jest.MockedFunction<typeof getAuthenticatedUserId>).mockResolvedValue('user-456' as any);

    const mockThreads = ['thread-abc'];
    const mockFetchResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue({ threads: mockThreads }),
    };
    global.fetch = jest.fn().mockResolvedValue(mockFetchResponse as any as never);

    const mockJson = jest.fn();
    (NextResponse.json as jest.MockedFunction<typeof NextResponse.json>).mockImplementation(mockJson);

    // Act
    await GET(mockRequest as any);

    // Assert
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/chatbot/threads',
      expect.any(Object)
    );
    expect(mockJson).toHaveBeenCalled();
  });

  it('should return an empty array if Python API returns no threads', async () => {
    // This test ensures that an empty array is returned if the Python API returns no threads.

    // Arrange
    (getAuthenticatedUserId as jest.MockedFunction<typeof getAuthenticatedUserId>).mockResolvedValue('user-789' as any);

    const mockFetchResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue({ threads: [] }),
    };
    global.fetch = jest.fn().mockResolvedValue(mockFetchResponse as any as never);

    const mockJson = jest.fn();
    (NextResponse.json as jest.MockedFunction<typeof NextResponse.json>).mockImplementation(mockJson);

    // Act
    await GET(mockRequest as any);

    // Assert
    expect(mockJson).toHaveBeenCalledWith([]);
  });

  // ========== EDGE CASES ==========

  it('should return 401 Unauthorized if user is not authenticated', async () => {
    // This test ensures that a 401 response is returned if the user is not authenticated.

    // Arrange
    (getAuthenticatedUserId as jest.MockedFunction<typeof getAuthenticatedUserId>).mockResolvedValue(null as any);

    const mockJson = jest.fn();
    (NextResponse.json as jest.MockedFunction<typeof NextResponse.json>).mockImplementation(mockJson);

    // Act
    await GET(mockRequest as any);

    // Assert
    expect(mockJson).toHaveBeenCalledWith(
      { message: 'Unauthorized' },
      { status: 401 }
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should return 500 if fetch to Python API fails (network error)', async () => {
    // This test ensures that a 500 response is returned if the fetch call throws an error.

    // Arrange
    (getAuthenticatedUserId as jest.MockedFunction<typeof getAuthenticatedUserId>).mockResolvedValue('user-err' as any);

    global.fetch = jest.fn().mockRejectedValue(new Error('Network error') as never);

    const mockJson = jest.fn();
    (NextResponse.json as jest.MockedFunction<typeof NextResponse.json>).mockImplementation(mockJson);

    // Act
    await GET(mockRequest as any);

    // Assert
    expect(mockJson).toHaveBeenCalledWith(
      { message: 'Error fetching threads' },
      { status: 500 }
    );
  });

  it('should return 500 if Python API responds with non-ok status', async () => {
    // This test ensures that a 500 response is returned if the Python API responds with an error status.

    // Arrange
    (getAuthenticatedUserId as jest.MockedFunction<typeof getAuthenticatedUserId>).mockResolvedValue('user-err2' as any);

    const mockFetchResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: jest.fn(),
    };
    global.fetch = jest.fn().mockResolvedValue(mockFetchResponse as any as never);

    const mockJson = jest.fn();
    (NextResponse.json as jest.MockedFunction<typeof NextResponse.json>).mockImplementation(mockJson);

    // Act
    await GET(mockRequest as any);

    // Assert
    expect(mockJson).toHaveBeenCalledWith(
      { message: 'Error fetching threads' },
      { status: 500 }
    );
  });

  it('should handle Python API returning threads as undefined', async () => {
    // This test ensures that if the Python API returns an object without a threads property, the function returns an empty array.

    // Arrange
    (getAuthenticatedUserId as jest.MockedFunction<typeof getAuthenticatedUserId>).mockResolvedValue('user-undef' as any);

    const mockFetchResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockResolvedValue({}),
    };
    global.fetch = jest.fn().mockResolvedValue(mockFetchResponse as any as never);

    const mockJson = jest.fn();
    (NextResponse.json as jest.MockedFunction<typeof NextResponse.json>).mockImplementation(mockJson);

    // Act
    await GET(mockRequest as any);

    // Assert
    expect(mockJson).toHaveBeenCalledWith([]);
  });

  it('should return 500 if response.json() throws an error', async () => {
    // This test ensures that a 500 response is returned if response.json() throws.

    // Arrange
    (getAuthenticatedUserId as jest.MockedFunction<typeof getAuthenticatedUserId>).mockResolvedValue('user-err3' as any);

    const mockFetchResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: jest.fn().mockRejectedValue(new Error('JSON parse error') as never),
    };
    global.fetch = jest.fn().mockResolvedValue(mockFetchResponse as any as never);

    const mockJson = jest.fn();
    (NextResponse.json as jest.MockedFunction<typeof NextResponse.json>).mockImplementation(mockJson);

    // Act
    await GET(mockRequest as any);

    // Assert
    expect(mockJson).toHaveBeenCalledWith(
      { message: 'Error fetching threads' },
      { status: 500 }
    );
  });
});