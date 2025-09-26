import { useState, useEffect } from 'react';
import { UserRole } from '../../types/review';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole>('Reviewer');

  useEffect(() => {
    // Check localStorage for user information
    const username = localStorage.getItem('username');
    const userEmail = localStorage.getItem('userEmail');

    // Set role based on login
    if (username === 'coordinator1' || userEmail === 'coordinator1@airforce.mil' ||
        (username && username.toLowerCase().includes('coordinator')) ||
        (userEmail && userEmail.toLowerCase().includes('coordinator'))) {
      setUserRole('Coordinator');
    } else if (username === 'reviewer1' || username === 'reviewer2' ||
               userEmail === 'reviewer1@airforce.mil' || userEmail === 'reviewer2@airforce.mil' ||
               (username && username.toLowerCase().includes('reviewer')) ||
               (userEmail && userEmail.toLowerCase().includes('reviewer'))) {
      setUserRole('Reviewer');
    } else if (username === 'ao1' || userEmail === 'ao1@airforce.mil' ||
               (username && username.toLowerCase().includes('action'))) {
      setUserRole('ACTION_OFFICER');
    } else {
      // Default to reviewer for other users
      setUserRole('Reviewer');
    }
  }, []);

  return userRole;
};