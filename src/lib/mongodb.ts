/**
 * Refactored MongoDB utility for frontend to call backend API endpoints.
 * Removed connectToDatabase export to avoid import errors.
 */

export async function getUserProfile(email: string) {
  const response = await fetch('http://localhost:4000/api/profile/' + encodeURIComponent(email));
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  return await response.json();
}

export async function saveUserProfile(profile: any) {
  const response = await fetch('http://localhost:4000/api/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profile)
  });
  if (!response.ok) {
    throw new Error('Failed to save user profile');
  }
  return await response.json();
}
