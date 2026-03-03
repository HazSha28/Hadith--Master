import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/services/adminService';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!currentUser) {
        return;
      }

      try {
        const adminStatus = await isAdmin(currentUser.uid, currentUser.email);
        setIsAdminUser(adminStatus);
        setIsAdminChecked(true);
      } catch (error) {
        console.error('Error checking admin access:', error);
        setIsAdminChecked(true);
      }
    };

    checkAdminAccess();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAdminUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
