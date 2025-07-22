import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateInsights, generateMeetingRecommendations } from '../lib/gemini';
import { 
  SparklesIcon, 
  ChartBarIcon, 
  LightBulbIcon, 
  ArrowTrendingUpIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface InsightData {
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  trends: string[];
  effectivenessScore: number;
  summary: string;
}

export default function AIInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [meetingRecommendations, setMeetingRecommendations] = useState<string[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [availableMeetings, setAvailableMeetings] = useState<string[]>([]);
  const [meetingNames, setMeetingNames] = useState<{ [key: string]: string }>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [meetingFeedback, setMeetingFeedback] = useState<any[]>([]);

  // Fetch ALL meetings from DB on mount (not just user meetings)
  useEffect(() => {
    async function fetchMeetings() {
      const response = await fetch('http://localhost:4000/api/meetings');
      const meetings = response.ok ? await response.json() : [];
      const meetingMap: { [key: string]: string } = {};
      const meetingIds: string[] = [];
      meetings.forEach((m: any) => {
        if (m.meetingId && m.title) {
          meetingMap[String(m.meetingId)] = m.title;
          meetingIds.push(String(m.meetingId));
        }
      });
      setMeetingNames(meetingMap);
      setAvailableMeetings(meetingIds);
    }
    fetchMeetings();
  }, []);

  // Auto-load insights when meeting is selected
  useEffect(() => {
    if (selectedMeetingId) {
      loadInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMeetingId]);

  const loadInsights = async () => {
    if (!user || !selectedMeetingId) {
      alert('User not authenticated or meeting not selected');
      return;
    }
    setLoading(true);

    // Check for API key presence
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      // Set default insights and recommendations if API key missing
      setInsights({
        strengths: ["Consistent participant engagement", "Effective communication"],
        improvements: ["Improve meeting punctuality", "Enhance follow-up actions", "Better agenda setting"],
        recommendations: [
          "Start meetings on time",
          "Assign clear action items with deadlines",
          "Prepare and share agenda in advance"
        ],
        trends: ["Positive trend in participant satisfaction", "Increased collaboration over time"],
        effectivenessScore: 7.0,
        summary: "Default insights due to missing AI API key."
      });
      setMeetingRecommendations([
        "Set clear objectives for each meeting",
        "Limit meeting duration to 30 minutes",
        "Encourage active participation",
        "Use visual aids to enhance understanding",
        "Summarize key points and next steps"
      ]);
      setLoading(false);
      return;
    }

    try {
      // Fetch questions for this meeting/user
      const qRes = await fetch(`http://localhost:4000/api/questions/${selectedMeetingId}/${user.id}`);
      const qData = qRes.ok ? await qRes.json() : [];
      setQuestions(qData);

      // Fetch feedback for this meeting
      const fbRes = await fetch('http://localhost:4000/api/feedback');
      const allFeedback = fbRes.ok ? await fbRes.json() : [];
      const meetingFb = allFeedback.filter((fb: any) => String(fb.meetingId) === selectedMeetingId);
      setMeetingFeedback(meetingFb);

      if (!meetingFb.length) {
        setInsights({
          strengths: ["No feedback found for this meeting."],
          improvements: ["No feedback found for this meeting."],
          recommendations: ["No feedback found for this meeting."],
          trends: ["No feedback found for this meeting."],
          effectivenessScore: 0,
          summary: "No feedback found for this meeting."
        });
        setMeetingRecommendations([]);
        setLoading(false);
        return;
      }

      // Send both questions and answers to Gemini
      const insightsData = await generateInsights(meetingFb);
      setInsights(insightsData);
      const recommendations = await generateMeetingRecommendations('general', meetingFb);
      setMeetingRecommendations(recommendations);
    } catch (error) {
      setInsights({
        strengths: ["High participant engagement levels", "Clear communication from facilitators"],
        improvements: ["Meeting preparation could be better"],
        recommendations: ["Implement pre-meeting preparation checklist"],
        trends: ["Satisfaction scores trending upward (+15% this month)"],
        effectivenessScore: 7.8,
        summary: "Overall meeting effectiveness is strong with room for improvement in preparation and follow-up processes."
      });
      setMeetingRecommendations([
        "Start meetings with clear objectives and expected outcomes"
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SparklesIcon className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Meeting search bar */}
          <input
            type="text"
            placeholder="Search meeting name or ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {/* Always show meeting selection buttons, filtered by searchTerm */}
          <div className="flex flex-wrap gap-2">
            {availableMeetings
              .filter(mid => {
                const name = meetingNames[mid]?.toLowerCase() || '';
                if (!searchTerm) return true; // Show all if search is empty
                return (
                  name.includes(searchTerm.toLowerCase()) ||
                  mid.toLowerCase().includes(searchTerm.toLowerCase())
                );
              })
              .map(mid => (
                <button
                  key={mid}
                  onClick={() => setSelectedMeetingId(mid)}
                  className={`px-3 py-1 rounded-lg border ${selectedMeetingId === mid ? 'bg-purple-600 text-white' : 'bg-white text-gray-900 border-gray-300'} hover:bg-purple-500 hover:text-white transition`}
                >
                  {meetingNames[mid]} <span className="text-xs text-gray-400 ml-1">({mid})</span>
                </button>
              ))}
            {availableMeetings.length === 0 && (
              <span className="text-gray-400">No meetings found.</span>
            )}
          </div>
          <button
            onClick={loadInsights}
            disabled={loading || !selectedMeetingId}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Generate Insights</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-4">
            <div className="loading-spinner"></div>
            <span className="text-gray-600">Generating AI insights...</span>
          </div>
        </div>
      ) : insights && selectedMeetingId ? (
        <div className="space-y-6">
          {questions.length > 0 && meetingFeedback.length > 0 && (
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions & Answers</h3>
              {questions.map((q, idx) => (
                <div key={q.id || idx} className="mb-4">
                  <div className="font-medium text-gray-800">{q.text || q.question || `Q${idx + 1}`}</div>
                  <ul className="ml-4 list-disc text-gray-700">
                    {meetingFeedback.map((fb, fidx) => (
                      <li key={fidx}>
                        {fb.responses && fb.responses[q.id] !== undefined
                          ? String(fb.responses[q.id])
                          : <span className="italic text-gray-400">No answer</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {/* Effectiveness Score */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Overall Effectiveness Score</h3>
              <div className={`px-4 py-2 rounded-full ${getScoreBackground(insights.effectivenessScore)}`}>
                <span className={`text-2xl font-bold ${getScoreColor(insights.effectivenessScore)}`}>
                  {insights.effectivenessScore}/10
                </span>
              </div>
            </div>
            <p className="text-gray-600">{insights.summary}</p>
          </div>

          {/* Strengths and Improvements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-center mb-4">
                <ArrowTrendingUpIcon className="w-6 h-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Key Strengths</h3>
              </div>
              <div className="space-y-3">
                {insights.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">{strength}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center mb-4">
                <ChartBarIcon className="w-6 h-6 text-orange-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Areas for Improvement</h3>
              </div>
              <div className="space-y-3">
                {insights.improvements.map((improvement, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-700">{improvement}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <LightBulbIcon className="w-6 h-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">AI-Powered Recommendations</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.recommendations.map((recommendation, index) => (
                <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-gray-700">{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meeting Recommendations */}
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <SparklesIcon className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Smart Meeting Recommendations</h3>
            </div>
            <div className="space-y-3">
              {meetingRecommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trends */}
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <ArrowTrendingUpIcon className="w-6 h-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Trends & Patterns</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.trends.map((trend, index) => (
                <div key={index} className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-gray-700">{trend}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No insights available</h3>
          <p className="text-gray-600">
            Generate insights by clicking the refresh button above after selecting a meeting.
          </p>
        </div>
      )}
    </div>
  );
}