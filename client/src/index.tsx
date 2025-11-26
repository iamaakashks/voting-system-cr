
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './components/App';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SocketProvider } from './contexts/SocketContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <SocketProvider>
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              <TransactionProvider>
                <App />
              </TransactionProvider>
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </SocketProvider>
    </BrowserRouter>
  </React.StrictMode>
);
