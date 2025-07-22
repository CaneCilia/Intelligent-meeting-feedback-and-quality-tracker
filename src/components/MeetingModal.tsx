import React, { useState } from 'react';
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface MeetingModalProps {
  selectedDate: Date | null;
  onClose: () => void;
}

export default function MeetingModal({
  selectedDate,
  onClose,
}: MeetingModalProps) {
  const defaultQuestions = [
    { id: 'meetingObjectiveClarity', type: 'rating', text: 'Meeting Objective Clarity' },
    { id: 'contentRelevance', type: 'rating', text: 'Content Relevance' },
    { id: 'overallEngagement', type: 'rating', text: 'Overall Engagement' },
    { id: 'timeUtilization', type: 'rating', text: 'Time Utilization' },
    { id: 'focusTopicManagement', type: 'rating', text: 'Focus & Topic Management' },
    { id: 'decisionQuality', type: 'rating', text: 'Decision Quality' },
    { id: 'overallSatisfaction', type: 'rating', text: 'Overall Satisfaction' },
    { id: 'facilitatorEffectiveness', type: 'rating', text: 'Facilitator Effectiveness' },
    { id: 'technicalSetup', type: 'rating', text: 'Technical Setup' },
    { id: 'agendaSharedInAdvance', type: 'boolean', text: 'Was the meeting agenda shared in advance?' },
    { id: 'unnecessaryAttendees', type: 'boolean', text: 'Were there unnecessary attendees?' },
    { id: 'actionItemsAssigned', type: 'boolean', text: 'Were action items clearly assigned?' },
    { id: 'meetingRecorded', type: 'boolean', text: 'Was the meeting recorded?' },
    { id: 'preparedBeforeMeeting', type: 'boolean', text: 'Did you prepare before the meeting?' },
    { id: 'improvementAreas', type: 'text', text: 'What could have been improved?' },
    { id: 'futureSuggestions', type: 'text', text: 'Any suggestions for future meetings?' },
    { id: 'valuableAspect', type: 'text', text: 'What was the most valuable aspect?' },
    { id: 'leastValuableAspect', type: 'text', text: 'What was the least valuable aspect?' },
  ];

  const [questions, setQuestions] = useState(defaultQuestions);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionEditText, setQuestionEditText] = useState('');
  const [step, setStep] = useState<'details' | 'customize' | 'link'>('details');
  const [loading, setLoading] = useState(false);
  const [feedbackUrl, setFeedbackUrl] = useState('');

  const initialFormState = {
    title: '',
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    time: '',
    endTime: '',
    description: '',
    meetingType: 'general',
  };
  const [formData, setFormData] = useState(initialFormState);

  const handleClose = () => {
    setFormData(initialFormState);
    setFeedbackUrl('');
    setStep('details');
    onClose();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('customize');
  };

  const handleCreateForm = async () => {
    setLoading(true);
    try {
      const meetingId = `meeting_${Date.now()}`;
      const userId = 'current-user-id';
      const meetingData = {
        id: meetingId,
        title: formData.title,
        date: formData.date,
        startTime: formData.time,
        endTime: formData.endTime,
        attendees: [],
        description: formData.description,
        meetingType: formData.meetingType,
        createdAt: new Date().toISOString(),
        createdBy: userId,
        userId,
        status: 'scheduled',
        meetingId,
        feedbackQuestions: questions.map((q) => q.text),
      };

      const response = await fetch('http://localhost:4000/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) throw new Error('Failed to create meeting');

      const generatedFeedbackUrl = `${window.location.origin}/feedback/${meetingId}`;
      setFeedbackUrl(generatedFeedbackUrl);
      setStep('link');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('meetingCreated', {
            detail: { meeting: { ...meetingData, id: meetingId } },
          })
        );
      }

      setFormData(initialFormState);
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Error creating meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestion = (id: string, text: string) => {
    setEditingQuestionId(id);
    setQuestionEditText(text);
  };

  const handleSaveQuestion = (id: string) => {
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, text: questionEditText } : q))
    );
    setEditingQuestionId(null);
    setQuestionEditText('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(feedbackUrl);
    alert('Feedback URL copied to clipboard!');
  };

  let modalContent: JSX.Element | null = null;

  if (step === 'link') {
    modalContent = (
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Meeting & Form Created!</h2>
          <p className="text-gray-600 mb-6">Your meeting and feedback form have been created.</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Feedback Form URL:</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={feedbackUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <LinkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  } else if (step === 'details') {
    modalContent = (
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Schedule Meeting</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter meeting title"
            />
          </div>
          <div>
            <label htmlFor="meetingType" className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Type
            </label>
            <select
              id="meetingType"
              name="meetingType"
              value={formData.meetingType}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="general">General Meeting</option>
              <option value="standup">Daily Standup</option>
              <option value="retrospective">Retrospective</option>
              <option value="planning">Planning Session</option>
              <option value="review">Review Meeting</option>
              <option value="training">Training Session</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="w-4 h-4 inline mr-1" />
                Start Time *
              </label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
              <ClockIcon className="w-4 h-4 inline mr-1" />
              End Time *
            </label>
            <input
              type="time"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Meeting description and agenda (optional)"
            />
          </div>
          <div className="flex space-x-4 pt-4">
            <button type="button" onClick={handleClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              Next: Customize Form
            </button>
          </div>
        </form>
      </div>
    );
  } else if (step === 'customize') {
    modalContent = (
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Customize Feedback Form</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="flex flex-wrap items-center gap-2">
              {editingQuestionId === q.id ? (
                <>
                  <input
                    type="text"
                    value={questionEditText}
                    onChange={(e) => setQuestionEditText(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveQuestion(q.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-gray-800">{q.text}</span>
                  <button
                    type="button"
                    onClick={() => handleEditQuestion(q.id, q.text)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestions(questions.filter((qq) => qq.id !== q.id))}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Remove
                  </button>
                </>
              )}
              <span className="ml-2 text-xs">
                {q.type === 'rating' && <span className="text-yellow-600">[Rating 1-5]</span>}
                {q.type === 'boolean' && <span className="text-blue-600">[Yes/No]</span>}
                {q.type === 'text' && <span className="text-gray-600">[Text]</span>}
              </span>
            </div>
          ))}
        </div>
        <div className="flex space-x-4 pt-6">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateForm}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Generate Form Link'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {modalContent}
    </div>
  );
}
