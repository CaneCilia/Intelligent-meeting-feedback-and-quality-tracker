import React, { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CalendarIcon, ChartBarIcon, SparklesIcon, UserGroupIcon, ArrowTrendingUpIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useDashboardStats } from './DashboardStatsLogic';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use live dashboard stats
  const statsData = useDashboardStats(user);

  // Compute totalMeetings and avgRatingAll locally
  const totalMeetings = statsData.meetings.length;
  const meetingIds = statsData.meetings.map(m => String(m.meetingId));
  const userFeedback = statsData.feedback.filter(fb => meetingIds.includes(String(fb.meetingId)));
  const avgRating = (feedbacks: any[]) => {
    const ratings = feedbacks
      .map(fb => fb.responses?.overallSatisfaction)
      .filter((v: any) => typeof v === 'number');
    if (!ratings.length) return '-';
    return (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(2);
  };
  const avgRatingAll = avgRating(userFeedback);

  // Fetch finished meetings for the logged-in user
  const [finishedMeetings, setFinishedMeetings] = useState<any[]>([]);

  useEffect(() => {
    const fetchMeetings = async () => {
      if (!user) {
        console.log('Dashboard: user is undefined');
        return;
      }
      console.log('Dashboard: fetching meetings for user', user.id);
      try {
        const res = await fetch('http://localhost:4000/api/meetings');
        const allMeetings = await res.json();
        console.log('Dashboard: total meetings fetched', allMeetings.length);
        const now = new Date();
        // Meeting is finished if end time is in the past, or status is 'completed'
        const userMeetings = allMeetings.filter((m: any) => {
          if (m.userId !== user.id) return false;
          // Parse end time if available, else fallback to date/time
          let endDateTime;
          if (m.endTime) {
            endDateTime = new Date(`${m.date}T${m.endTime}`);
          } else if (m.time) {
            // Assume 1 hour duration if no endTime
            const start = new Date(`${m.date}T${m.time}`);
            endDateTime = new Date(start.getTime() + 60 * 60 * 1000);
          } else {
            endDateTime = new Date(m.date);
          }
          return m.status === 'completed' || endDateTime < now;
        });
        console.log('Dashboard: finished meetings count', userMeetings.length);
        setFinishedMeetings(userMeetings);
      } catch (e) {
        console.error('Dashboard: error fetching meetings', e);
        setFinishedMeetings([]);
      }
    };
    fetchMeetings();
  }, [user]);

  const stats: any[] = [
    // Removed Finished Meetings stat widget as per user request
  ];

  const quickActions = [
    {
      name: 'Schedule Meeting',
      description: 'Create a new meeting and generate feedback form',
      icon: CalendarIcon,
      color: 'bg-blue-500',
      onClick: () => navigate('/calendar'),
    },
    {
      name: 'View Analytics',
      description: 'Deep dive into meeting performance data',
      icon: ChartBarIcon,
      color: 'bg-green-500',
      onClick: () => navigate('/analytics'),
    },
    {
      name: 'AI Insights',
      description: 'Get AI-powered recommendations',
      icon: SparklesIcon,
      color: 'bg-purple-500',
      onClick: () => navigate('/ai-insights'),
    },
  ];

  // Mini calendar grid for finished meetings
  const [calendarDate, setCalendarDate] = useState(new Date());
  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const getMeetingsForDate = (date: Date) => finishedMeetings.filter(m => isSameDay(new Date(m.date), date));

  return (
    <>
      <div className="space-y-8 fade-in">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-blue-100 text-lg">
            Here's what's happening with your meetings today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.name} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm font-medium text-green-600">{stat.change}</span>
                <span className="text-sm text-gray-500 ml-2">from last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <div
              key={action.name}
              onClick={action.onClick}
              className="card p-6 cursor-pointer group hover:shadow-lg transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{action.name}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Finished Meetings List */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Finished Meetings</h2>
          </div>
          <div className="space-y-4">
            {finishedMeetings.length === 0 && (
              <div className="text-gray-500">No finished meetings found.</div>
            )}
            {finishedMeetings.map((meeting) => (
              <div
                key={meeting.meetingId || meeting.id}
                onClick={() => navigate('/analytics')}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                title="View analytics for this meeting"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                    <p className="text-sm text-gray-600">
                      {meeting.date}
                      {meeting.time ? ` • ${meeting.time}` : ''}
                      {meeting.endTime ? ` - ${meeting.endTime}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Finished at: {meeting.endTime ? `${meeting.date} ${meeting.endTime}` : meeting.date}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  {meeting.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
