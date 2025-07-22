import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { getMeetingData, saveFeedback } from '../lib/api';
// Helper to generate a unique submitter ID
function generateSubmitterId() {
  return 'submitter_' + Math.random().toString(36).substr(2, 9) + Date.now();
}
import { useAuth } from '../contexts/AuthContext';

interface FeedbackData {
  meetingObjectiveClarity: number;
  contentRelevance: number;
  overallEngagement: number;
  timeUtilization: number;
  focusTopicManagement: number;
  decisionQuality: number;
  overallSatisfaction: number;
  facilitatorEffectiveness: number;
  technicalSetup: number;
  agendaSharedInAdvance: boolean;
  unnecessaryAttendees: boolean;
  actionItemsAssigned: boolean;
  meetingRecorded: boolean;
  preparedBeforeMeeting: boolean;
  improvementAreas: string;
  futureSuggestions: string;
  valuableAspect: string;
  leastValuableAspect: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  meetingType: string;
}

export default function FeedbackForm() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const { user } = useAuth();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData>({
    meetingObjectiveClarity: 0,
    contentRelevance: 0,
    overallEngagement: 0,
    timeUtilization: 0,
    focusTopicManagement: 0,
    decisionQuality: 0,
    overallSatisfaction: 0,
    facilitatorEffectiveness: 0,
    technicalSetup: 0,
    agendaSharedInAdvance: false,
    unnecessaryAttendees: false,
    actionItemsAssigned: false,
    meetingRecorded: false,
    preparedBeforeMeeting: false,
    improvementAreas: '',
    futureSuggestions: '',
    valuableAspect: '',
    leastValuableAspect: '',
  });

  // New state to track edit mode per question
  const [editMode, setEditMode] = React.useState<{ [key: string]: boolean }>({});
  // New state to track edit mode for question text per question
  const [editQuestionMode, setEditQuestionMode] = React.useState<{ [key: string]: boolean }>({});
  
  // Toggle edit mode for answer input
  const toggleEditMode = (field: keyof FeedbackData) => {
    setEditMode(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  // Toggle edit mode for question text
  const toggleEditQuestionMode = (field: keyof FeedbackData) => {
    setEditQuestionMode(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  // Helper component to render pencil icon
  const PencilIcon = ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick} className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5h2M12 7v10m-7 4h14a2 2 0 002-2v-7a2 2 0 00-2-2h-3l-4-4-4 4H5a2 2 0 00-2 2v7a2 2 0 002 2z" />
      </svg>
    </button>
  );

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (meetingId && meetingId !== 'unknown') {
      loadMeetingData();
    } else {
      // If meetingId is missing or unknown, clear meeting data
      setMeeting(null);
    }
  }, [meetingId]);

  const loadMeetingData = async () => {
    try {
      const meetingData = await getMeetingData(meetingId);
      
      if (meetingData) {
        setMeeting(meetingData);
      }
    } catch (error) {
      console.error('Error loading meeting data:', error);
    }
  };

  const handleRatingChange = (field: keyof FeedbackData, rating: number) => {
    setFeedback(prev => ({
      ...prev,
      [field]: rating
    }));
  };

  const handleBooleanChange = (field: keyof FeedbackData, value: boolean) => {
    setFeedback(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTextChange = (field: keyof FeedbackData, value: string) => {
    setFeedback(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await saveFeedback({
        meetingId,
        userId: user?.id,
        submittedAt: new Date().toISOString(),
        submitterId: generateSubmitterId(),
        responses: feedback,
      });
      console.log('Feedback submitted:', feedback);

      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      alert(`Error submitting feedback: ${error?.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const RatingStars = ({ field, rating, onChange, label }: { field: keyof FeedbackData, rating: number; onChange: (rating: number) => void; label: string }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 flex items-center">
        {editQuestionMode[field] ? (
          <input
            type="text"
            value={label}
            onChange={(e) => {
              const newLabel = e.target.value;
              // Update label text in some state if needed, or just allow editing visually
              // For now, just allow editing visually without saving
            }}
            onBlur={() => toggleEditQuestionMode(field)}
            className="border-b border-gray-400 focus:outline-none focus:ring-0"
            autoFocus
          />
        ) : (
          <span>{label}</span>
        )}
        <PencilIcon onClick={() => toggleEditQuestionMode(field)} />
      </label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-colors"
          >
            {star <= rating ? (
              <StarIcon className="w-8 h-8 text-yellow-400 hover:text-yellow-500" />
            ) : (
              <StarOutlineIcon className="w-8 h-8 text-gray-300 hover:text-yellow-400" />
            )}
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    </div>
  );

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-4">Your feedback has been submitted successfully.</p>
          <p className="text-sm text-gray-500">Your insights help us improve future meetings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Meeting Feedback Form</h1>
            <p className="text-blue-100 mb-4">Help us improve future meetings by providing detailed feedback</p>
            {meeting && (
              <div className="bg-white/20 rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-lg">{meeting.title}</h3>
                <p className="text-blue-100">{meeting.date} at {meeting.time}</p>
                {meeting.description && (
                  <p className="text-blue-100 text-sm mt-2">{meeting.description}</p>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Meeting Quality Assessment */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Meeting Quality Assessment</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RatingStars
                  field="meetingObjectiveClarity"
                  rating={feedback.meetingObjectiveClarity}
                  onChange={(rating) => handleRatingChange('meetingObjectiveClarity', rating)}
                  label="Meeting Objective Clarity"
                />
                
                <RatingStars
                  field="contentRelevance"
                  rating={feedback.contentRelevance}
                  onChange={(rating) => handleRatingChange('contentRelevance', rating)}
                  label="Content Relevance"
                />
                
                <RatingStars
                  field="overallEngagement"
                  rating={feedback.overallEngagement}
                  onChange={(rating) => handleRatingChange('overallEngagement', rating)}
                  label="Overall Engagement"
                />
                
                <RatingStars
                  field="timeUtilization"
                  rating={feedback.timeUtilization}
                  onChange={(rating) => handleRatingChange('timeUtilization', rating)}
                  label="Time Utilization"
                />
                
                <RatingStars
                  field="focusTopicManagement"
                  rating={feedback.focusTopicManagement}
                  onChange={(rating) => handleRatingChange('focusTopicManagement', rating)}
                  label="Focus & Topic Management"
                />
                
                <RatingStars
                  field="decisionQuality"
                  rating={feedback.decisionQuality}
                  onChange={(rating) => handleRatingChange('decisionQuality', rating)}
                  label="Decision Quality"
                />
                
                <RatingStars
                  field="overallSatisfaction"
                  rating={feedback.overallSatisfaction}
                  onChange={(rating) => handleRatingChange('overallSatisfaction', rating)}
                  label="Overall Satisfaction"
                />
                
                <RatingStars
                  field="facilitatorEffectiveness"
                  rating={feedback.facilitatorEffectiveness}
                  onChange={(rating) => handleRatingChange('facilitatorEffectiveness', rating)}
                  label="Facilitator Effectiveness"
                />
                
                <RatingStars
                  field="technicalSetup"
                  rating={feedback.technicalSetup}
                  onChange={(rating) => handleRatingChange('technicalSetup', rating)}
                  label="Technical Setup"
                />
              </div>
            </div>

            {/* Meeting Structure & Preparation */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Meeting Structure & Preparation</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Was the meeting agenda shared in advance?
                    <PencilIcon onClick={() => toggleEditMode('agendaSharedInAdvance')} />
                  </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => handleBooleanChange('agendaSharedInAdvance', true)}
                        disabled={!editMode['agendaSharedInAdvance']}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          feedback.agendaSharedInAdvance
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBooleanChange('agendaSharedInAdvance', false)}
                        disabled={!editMode['agendaSharedInAdvance']}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          !feedback.agendaSharedInAdvance
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Were there unnecessary attendees?
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => handleBooleanChange('unnecessaryAttendees', true)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          feedback.unnecessaryAttendees
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBooleanChange('unnecessaryAttendees', false)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          !feedback.unnecessaryAttendees
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Were action items clearly assigned?
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => handleBooleanChange('actionItemsAssigned', true)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          feedback.actionItemsAssigned
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBooleanChange('actionItemsAssigned', false)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          !feedback.actionItemsAssigned
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Was the meeting recorded?
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => handleBooleanChange('meetingRecorded', true)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          feedback.meetingRecorded
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBooleanChange('meetingRecorded', false)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          !feedback.meetingRecorded
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Did you prepare before the meeting?
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => handleBooleanChange('preparedBeforeMeeting', true)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          feedback.preparedBeforeMeeting
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBooleanChange('preparedBeforeMeeting', false)}
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          !feedback.preparedBeforeMeeting
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Feedback */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Additional Feedback</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="improvementAreas" className="block text-sm font-medium text-gray-700 mb-2">
                    What could have been improved?
                  </label>
                  <textarea
                    id="improvementAreas"
                    rows={4}
                    value={feedback.improvementAreas}
                    onChange={(e) => handleTextChange('improvementAreas', e.target.value)}
                    disabled={!editMode['improvementAreas']}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Share specific areas for improvement..."
                  />
                </div>

                <div>
                  <label htmlFor="futureSuggestions" className="block text-sm font-medium text-gray-700 mb-2">
                    Any suggestions for future meetings?
                  </label>
                  <textarea
                    id="futureSuggestions"
                    rows={4}
                    value={feedback.futureSuggestions}
                    onChange={(e) => handleTextChange('futureSuggestions', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Share your ideas for better meetings..."
                  />
                </div>

                <div>
                  <label htmlFor="valuableAspect" className="block text-sm font-medium text-gray-700 mb-2">
                    What was the most valuable aspect?
                  </label>
                  <textarea
                    id="valuableAspect"
                    rows={4}
                    value={feedback.valuableAspect}
                    onChange={(e) => handleTextChange('valuableAspect', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What worked well in this meeting?"
                  />
                </div>

                <div>
                  <label htmlFor="leastValuableAspect" className="block text-sm font-medium text-gray-700 mb-2">
                    What was the least valuable aspect?
                  </label>
                  <textarea
                    id="leastValuableAspect"
                    rows={4}
                    value={feedback.leastValuableAspect}
                    onChange={(e) => handleTextChange('leastValuableAspect', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What could be eliminated or reduced?"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary text-lg px-8 py-3 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}