interface AuthResponse {
  token?: string;
  message: string;
  error?: string;
  id?: string;
  username?: string;
}

interface UserData {
  id?: string;
  username: string;
  email: string;
  password?: string;
  profession?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  dueDate: string | null;
  createdAt: string;
  userId: string;
}

export type { AuthResponse, UserData, Task };