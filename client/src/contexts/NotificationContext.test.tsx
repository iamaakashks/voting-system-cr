import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationProvider, useNotification } from './NotificationContext';

// A simple test component to consume the context
const TestConsumer: React.FC = () => {
  const { notification, showNotification, hideNotification } = useNotification();

  return (
    <div>
      <h1>Notification Test</h1>
      {notification && (
        <div data-testid="notification">
          <p>{notification.message}</p>
          <p>{notification.type}</p>
        </div>
      )}
      <button onClick={() => showNotification('Success!', 'success')}>
        Show Success
      </button>
      <button onClick={() => hideNotification()}>
        Hide
      </button>
    </div>
  );
};

describe('NotificationContext', () => {
  beforeEach(() => {
    // Use fake timers to control setTimeout
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers after each test
    vi.useRealTimers();
  });

  it('should have no notification initially', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    );
    expect(screen.queryByTestId('notification')).not.toBeInTheDocument();
  });

  it('should show a notification when showNotification is called', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    const notification = screen.getByTestId('notification');
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveTextContent('Success!');
    expect(notification).toHaveTextContent('success');
  });

  it('should hide the notification when hideNotification is called', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    );

    // Show the notification first
    act(() => {
      screen.getByText('Show Success').click();
    });
    expect(screen.getByTestId('notification')).toBeInTheDocument();

    // Then hide it
    act(() => {
      screen.getByText('Hide').click();
    });
    expect(screen.queryByTestId('notification')).not.toBeInTheDocument();
  });

  it('should automatically hide the notification after 8 seconds', () => {
    render(
      <NotificationProvider>
        <TestConsumer />
      </NotificationProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    // Notification should be visible immediately
    expect(screen.getByTestId('notification')).toBeInTheDocument();

    // Fast-forward time by 8 seconds
    act(() => {
      vi.advanceTimersByTime(8000);
    });

    // Notification should now be gone
    expect(screen.queryByTestId('notification')).not.toBeInTheDocument();
  });
});
