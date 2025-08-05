// Content access tracking utility
export const trackContentAccess = async (studentId: string, contentId: string) => {
  try {
    const response = await fetch('/api/content-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_id: studentId,
        content_id: contentId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to track content access');
    }

    const result = await response.json();
    console.log('Content access tracked:', result);
    return result;
  } catch (error) {
    console.error('Error tracking content access:', error);
    // Don't throw - this is tracking, not critical functionality
  }
};

// Get current user ID from localStorage
export const getCurrentUserId = (): string | null => {
  try {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id || null;
    }
  } catch (error) {
    console.error('Error getting current user:', error);
  }
  return null;
};