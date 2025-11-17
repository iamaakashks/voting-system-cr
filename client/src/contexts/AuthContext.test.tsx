import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import * as api from '../services/api';
import { User } from '../types';

// Mock the api service
vi.mock('../services/api', () => ({
  getMe: vi.fn(),
  login: vi.fn(),
  setAuthToken: vi.fn(),
}));

// Mock react-router-dom
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

// A simple test component to consume the context
const TestConsumer: React.FC = () => {
  const { currentUser, isLoading, login, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Auth Test</h1>
      {currentUser ? (
        <div>
          <p data-testid="user-id">{currentUser.id}</p>
          <p data-testid="user-role">{currentUser.role}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <p>No user</p>
      )}
      <button onClick={() => login({ email: 'test@test.com', password: 'password' })}>
        Login
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  const mockUser: User = { id: '1', name: 'Test User', email: 'test@test.com', role: 'student' };

  beforeEach(() => {
    // Reset mocks and localStorage before each test
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('should be unauthenticated initially if no token is present', async () => {
    // Mock getMe to resolve, simulating the check finishing
    (api.getMe as vi.Mock).mockResolvedValue(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Wait for loading to finish
    await screen.findByText('No user');
    expect(screen.getByText('No user')).toBeInTheDocument();
    expect(api.setAuthToken).not.toHaveBeenCalled();
  });

  it('should fetch user if token is present', async () => {
    localStorage.setItem('token', 'fake-token');
    (api.getMe as vi.Mock).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Wait for user to be loaded
    await screen.findByTestId('user-id');
    expect(screen.getByTestId('user-id')).toHaveTextContent(mockUser.id);
    expect(api.setAuthToken).toHaveBeenCalledWith('fake-token');
    expect(api.getMe).toHaveBeenCalledTimes(1);
  });

  it('should handle login and update the user', async () => {
    (api.login as vi.Mock).mockResolvedValue({ token: 'new-token', user: mockUser });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Wait for initial load to finish
    await screen.findByText('Login');
    
    act(() => {
      screen.getByText('Login').click();
    });

    await screen.findByTestId('user-id');
    expect(screen.getByTestId('user-id')).toHaveTextContent(mockUser.id);
    expect(localStorage.getItem('token')).toBe('new-token');
    expect(api.setAuthToken).toHaveBeenCalledWith('new-token');
  });

  it('should handle logout and clear the user', async () => {
    localStorage.setItem('token', 'fake-token');
    (api.getMe as vi.Mock).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await screen.findByText('Logout');
    
    act(() => {
      screen.getByText('Logout').click();
    });

    await screen.findByText('No user');
    expect(screen.getByText('No user')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(mockedNavigate).toHaveBeenCalledWith('/');
  });
});
