import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionProvider, useTransactions } from './TransactionContext';
import { AuthContext, AuthProvider, useAuth } from './AuthContext'; // We need the real provider to change auth state
import * as api from '../services/api';
import { Transaction, User } from '../types';

// Mock the api service
vi.mock('../services/api', () => ({
  getRecentTransactions: vi.fn(),
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

const mockTransactions: Transaction[] = [
  { id: '1', txHash: '0x123', election: 'e1', student: 's1', candidateId: 'c1', timestamp: new Date() },
  { id: '2', txHash: '0x456', election: 'e2', student: 's2', candidateId: 'c2', timestamp: new Date() },
];

const mockUser: User = { id: '1', name: 'Test User', email: 'test@test.com', role: 'student' };

// A simple test component to consume the context
const TestConsumer: React.FC = () => {
  const { transactions } = useTransactions();

  return (
    <div>
      <h1>Transaction Test</h1>
      <div data-testid="tx-count">{transactions.length}</div>
      <ul>
        {transactions.map(tx => (
          <li key={tx.id}>{tx.txHash}</li>
        ))}
      </ul>
    </div>
  );
};

// We need a wrapper that includes all necessary providers
const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <TransactionProvider>
      {children}
    </TransactionProvider>
  </AuthProvider>
);


describe('TransactionContext', () => {

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    // Mock the API to return no user and no transactions by default
    (api.getMe as vi.Mock).mockResolvedValue(null);
    (api.getRecentTransactions as vi.Mock).mockResolvedValue([]);
  });

  it('should not fetch transactions when no user is logged in', async () => {
    render(<TestConsumer />, { wrapper: AllProviders });

    // Wait for initial auth check to finish
    await waitFor(() => {
      expect(screen.getByTestId('tx-count')).toHaveTextContent('0');
    });

    expect(api.getRecentTransactions).not.toHaveBeenCalled();
  });

  it('should fetch transactions when a user is logged in', async () => {
    // Setup mocks for a logged-in user
    localStorage.setItem('token', 'fake-token');
    (api.getMe as vi.Mock).mockResolvedValue(mockUser);
    (api.getRecentTransactions as vi.Mock).mockResolvedValue(mockTransactions);

    render(<TestConsumer />, { wrapper: AllProviders });

    // Wait for the transactions to be loaded
    await waitFor(() => {
      expect(api.getRecentTransactions).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId('tx-count')).toHaveTextContent('2');
    expect(screen.getByText('0x123')).toBeInTheDocument();
  });

  it('should clear transactions when the user logs out', async () => {
    // 1. Start with a logged-in user who has transactions
    localStorage.setItem('token', 'fake-token');
    (api.getMe as vi.Mock).mockResolvedValue(mockUser);
    (api.getRecentTransactions as vi.Mock).mockResolvedValue(mockTransactions);

    // We need a component that can trigger logout
    const LogoutComponent = () => {
        const { logout } = useAuth();
        const { transactions } = useTransactions();
        return (
            <div>
                <div data-testid="tx-count">{transactions.length}</div>
                <button onClick={logout}>Logout</button>
            </div>
        )
    }

    render(<LogoutComponent />, { wrapper: AllProviders });

    // Wait for transactions to be loaded initially
    await waitFor(() => {
      expect(screen.getByTestId('tx-count')).toHaveTextContent('2');
    });

    // 2. Trigger logout
    (api.getMe as vi.Mock).mockResolvedValue(null); // Future getMe calls will return null
    act(() => {
        screen.getByText('Logout').click();
    });

    // 3. Assert that transactions are cleared
    await waitFor(() => {
      expect(screen.getByTestId('tx-count')).toHaveTextContent('0');
    });
  });
});
