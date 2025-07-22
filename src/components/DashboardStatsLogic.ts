import { useEffect, useState } from 'react';

export function useDashboardStats(user: any) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      console.warn('useDashboardStats: user is not defined');
      setMeetings([]);
      setFeedback([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch('http://localhost:4000/api/meetings').then(r => r.ok ? r.json() : []),
      fetch('http://localhost:4000/api/feedback').then(r => r.ok ? r.json() : [])
    ]).then(([meetingsData, feedbackData]) => {
      if (!Array.isArray(meetingsData)) {
        console.warn('useDashboardStats: meetingsData is not an array');
        setMeetings([]);
      } else {
        setMeetings(meetingsData.filter((m: any) => m.userId === user.id));
      }
      if (!Array.isArray(feedbackData)) {
        console.warn('useDashboardStats: feedbackData is not an array');
        setFeedback([]);
      } else {
        setFeedback(feedbackData);
      }
      setLoading(false);
    }).catch((err) => {
      console.error('useDashboardStats: error fetching data', err);
      setMeetings([]);
      setFeedback([]);
      setLoading(false);
    });
  }, [user]);

  // Removed totalMeetings and avgRatingAll from return
  return {
    loading,
    meetings,
    feedback
  };
}
