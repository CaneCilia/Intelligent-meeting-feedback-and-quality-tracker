import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Feedback {
  _id?: string;
  meetingId?: string;
  userId?: string;
  responses: {
    meetingObjectiveClarity?: number;
    contentRelevance?: number;
    overallEngagement?: number;
    timeUtilization?: number;
    focusTopicManagement?: number;
    decisionQuality?: number;
    overallSatisfaction?: number;
    facilitatorEffectiveness?: number;
    technicalSetup?: number;
    agendaSharedInAdvance?: boolean;
    unnecessaryAttendees?: boolean;
    actionItemsAssigned?: boolean;
    meetingRecorded?: boolean;
    preparedBeforeMeeting?: boolean;
    improvementAreas?: string;
    futureSuggestions?: string;
    valuableAspect?: string;
    leastValuableAspect?: string;
  };
  createdAt?: string;
}
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title);

export default function Analytics() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('last-30-days');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper: get period start date
  function getPeriodStart(period: string) {
    const end = new Date(selectedDate);
    switch (period) {
      case 'last-7-days':
        return new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6);
      case 'last-30-days':
        return new Date(end.getFullYear(), end.getMonth(), end.getDate() - 29);
      case 'last-90-days':
        return new Date(end.getFullYear(), end.getMonth(), end.getDate() - 89);
      case 'last-year':
        return new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());
      default:
        return end;
    }
  }

  // Fetch feedback from backend
  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:4000/api/feedback')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        console.log('Fetched feedback:', data);
        setFeedback(Array.isArray(data) ? data : []);
      })
      .catch(() => setFeedback([]))
      .finally(() => setLoading(false));
  }, [selectedDate, selectedPeriod]);

  // Filter feedback by user and selected date/period
  const periodStart = getPeriodStart(selectedPeriod);
  const periodEnd = new Date(selectedDate);
  periodEnd.setHours(23,59,59,999);
  const filteredFeedback = feedback.filter(fb => {
    if (!user || !fb.userId || fb.userId !== user.id) return false;
    const dateStr = fb.createdAt || '';
    if (!dateStr) return false;
    // If the period is a single day (start==end), match by date string (YYYY-MM-DD)
    if (
      periodStart.getFullYear() === periodEnd.getFullYear() &&
      periodStart.getMonth() === periodEnd.getMonth() &&
      periodStart.getDate() === periodEnd.getDate()
    ) {
      // Compare only the date part (ignore time and timezone)
      const feedbackDate = new Date(dateStr);
      const feedbackDay = feedbackDate.toISOString().slice(0, 10);
      const selectedDay = periodStart.toISOString().slice(0, 10);
      return feedbackDay === selectedDay;
    }
    // Otherwise, use UTC range comparison
    const date = new Date(dateStr);
    const dateUTC = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const startUTC = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth(), periodStart.getUTCDate()));
    const endUTC = new Date(Date.UTC(periodEnd.getUTCFullYear(), periodEnd.getUTCMonth(), periodEnd.getUTCDate()));
    return dateUTC >= startUTC && dateUTC <= endUTC;
  });

  // Compute stats and chart data from filteredFeedback
  // Example assumes feedback responses: { satisfaction, ratings: { ... }, ... }
  const totalFeedback = filteredFeedback.length;
  const satisfactionCounts = [0, 0, 0, 0, 0]; // Very Satisfied, Satisfied, Neutral, Dissatisfied, Very Dissatisfied
  const ratingsSums = [0,0,0,0,0,0,0,0];
  const ratingsCounts = [0,0,0,0,0,0,0,0];
  type RatingLabel =
    | 'meetingObjectiveClarity'
    | 'contentRelevance'
    | 'overallEngagement'
    | 'timeUtilization'
    | 'focusTopicManagement'
    | 'decisionQuality'
    | 'facilitatorEffectiveness'
    | 'technicalSetup';

  const ratingLabels: RatingLabel[] = [
    'meetingObjectiveClarity',
    'contentRelevance',
    'overallEngagement',
    'timeUtilization',
    'focusTopicManagement',
    'decisionQuality',
    'facilitatorEffectiveness',
    'technicalSetup',
  ];
  const ratingDisplayLabels = [
    'Objective Clarity',
    'Content Relevance',
    'Engagement',
    'Time Utilization',
    'Focus Management',
    'Decision Quality',
    'Facilitator Effectiveness',
    'Technical Setup',
  ];
  const trends: { week: string; avg: number }[] = [];
  let sumSatisfaction = 0;

  filteredFeedback.forEach((fb: Feedback) => {
    // Overall Satisfaction: 1-5 (5=Very Satisfied)
    const s = fb.responses?.overallSatisfaction;
    if (typeof s === 'number' && s > 0) {
      const idx = s >= 1 && s <= 5 ? 5-s : 2; // fallback to 'Neutral' if out of range
      satisfactionCounts[idx] += 1;
      sumSatisfaction += s;
    }
    // Ratings: use each field in responses
    ratingLabels.forEach((label, i) => {
      const val = fb.responses?.[label];
      if (typeof val === 'number' && val > 0) {
        ratingsSums[i] += val;
        ratingsCounts[i] += 1;
      }
    });
  });

  // Debug: log computed chart data
  console.log('Filtered feedback:', filteredFeedback);
  console.log('Satisfaction counts:', satisfactionCounts);
  console.log('Ratings sums:', ratingsSums, 'counts:', ratingsCounts);

  const avgSatisfaction = totalFeedback ? (sumSatisfaction / totalFeedback).toFixed(2) : null;
  const avgRatings = ratingsSums.map((sum, i) => ratingsCounts[i] ? (sum / ratingsCounts[i]).toFixed(2) : null);

  const satisfactionData = {
    labels: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
    datasets: [{
      data: satisfactionCounts,
      backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
      borderWidth: 0,
    }]
  };

  const ratingsData = {
    labels: ratingDisplayLabels,
    datasets: [{
      label: 'Average Rating',
      data: avgRatings,
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
    }]
  };

  // Trends: group by week (for simplicity, just show average satisfaction per week)
  if (filteredFeedback.length) {
    const weekMap: Record<string, number[]> = {};
    filteredFeedback.forEach((fb: Feedback) => {
      const dateStr = fb.createdAt || '';
      if (!dateStr) return;
      const date = new Date(dateStr);
      const week = `${date.getFullYear()}-W${Math.ceil((date.getDate() + 1) / 7)}`;
      if (!weekMap[week]) weekMap[week] = [];
      const s = fb.responses?.overallSatisfaction;
      weekMap[week].push(typeof s === 'number' ? s : 0);
    });
    Object.entries(weekMap).forEach(([week, vals]) => {
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      trends.push({ week, avg });
    });
  }

  const trendsData = {
    labels: trends.map(t => t.week),
    datasets: [{
      label: 'Overall Satisfaction',
      data: trends.map(t => t.avg),
      borderColor: 'rgba(59, 130, 246, 1)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const stats = [
    // Removed totalMeetings and avgRatingAll usage as per request
    { name: 'Total Feedback', value: totalFeedback, color: 'text-blue-600' },
    { name: 'Avg. Satisfaction', value: avgSatisfaction ? `${avgSatisfaction}/5` : 'N/A', color: 'text-green-600' },
    // Add more stats as needed, e.g. response rate, meetings count, etc.
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="last-7-days">Last 7 days</option>
              <option value="last-30-days">Last 30 days</option>
              <option value="last-90-days">Last 90 days</option>
              <option value="last-year">Last year</option>
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-600">Loading analytics...</span>
        </div>
      ) : totalFeedback === 0 ? (
        <div className="card p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No data available</h3>
          <p className="text-gray-600">No feedback found for the selected date or period.</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.name} className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Satisfaction Distribution */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Satisfaction Distribution</h3>
              <div className="h-64">
                <Doughnut data={satisfactionData} options={doughnutOptions} />
              </div>
            </div>

            {/* Average Ratings */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Ratings by Category</h3>
              <div className="h-64">
                <Bar data={ratingsData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Trends Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Satisfaction Trends Over Time</h3>
            <div className="h-80">
              <Line data={trendsData} options={chartOptions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}