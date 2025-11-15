import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { User } from '../../types';

interface ProtectedRouteProps {
  user: User | null;
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, redirectPath = '/' }) => {
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
