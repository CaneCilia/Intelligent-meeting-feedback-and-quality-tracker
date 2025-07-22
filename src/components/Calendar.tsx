import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import MeetingModal from './MeetingModal';

interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  feedbackUrl?: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  React.useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/meetings');
        const allMeetings = await res.json();
        setMeetings(allMeetings);
      } catch (e) {
        setMeetings([]);
      }
    };
    fetchMeetings();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  // Pad start of calendar so first day aligns with correct weekday
  const startDayOfWeek = monthStart.getDay(); // 0=Sun, 1=Mon, ...
  const paddedDays = [
    ...Array(startDayOfWeek).fill(null),
    ...days
  ];

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(meeting => isSameDay(new Date(meeting.date), date));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowMeetingModal(true);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meeting Calendar</h1>
        <button
          onClick={() => setShowMeetingModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Schedule Meeting</span>
        </button>
      </div>

      {/* Calendar */}
      <div className="card p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {paddedDays.map((day, idx) => {
            if (!day) {
              return <div key={`pad-${idx}`} />;
            }
            const dayMeetings = getMeetingsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const isPast = day < new Date(new Date().setHours(0,0,0,0));
            return (
              <div
                key={day.toISOString()}
                {...(!isPast && isCurrentMonth ? { onClick: () => handleDateClick(day) } : {})}
                className={`
                  min-h-[100px] p-2 border border-gray-200
                  ${!isPast && isCurrentMonth ? 'cursor-pointer hover:bg-gray-50 transition-colors' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}
                  ${isTodayDate ? 'bg-blue-50 border-blue-200' : ''}
                `}
                title={isPast ? 'Cannot schedule meeting on past date' : ''}
              >
                <div className={`text-sm font-medium mb-1 ${isTodayDate ? 'text-blue-600' : ''}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayMeetings.slice(0, 2).map(meeting => (
                    <div
                      key={meeting.id}
                      className={`text-xs px-2 py-1 rounded text-center ${getStatusColor(meeting.status)}`}
                      title={`${meeting.title} (${meeting.startTime || ''}${meeting.endTime ? ' - ' + meeting.endTime : ''}) [${meeting.status}]`}
                    >
                      {meeting.title}
                      {meeting.startTime && (
                        <span className="ml-1 text-gray-500">({meeting.startTime}{meeting.endTime ? ` - ${meeting.endTime}` : ''})</span>
                      )}
                      <span className={`ml-1 ${meeting.status === 'completed' ? 'text-green-600' : meeting.status === 'cancelled' ? 'text-red-600' : 'text-blue-600'}`}>[{meeting.status}]</span>
                    </div>
                  ))}
                  {dayMeetings.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayMeetings.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Meetings List */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Meetings</h2>
        <div className="space-y-4">
          {(() => {
            const now = new Date();
            const upcomingMeetings = meetings.filter(m => {
              if (m.status !== 'scheduled') return false;
              let endDateTime;
              if (m.endTime) {
                endDateTime = new Date(`${m.date}T${m.endTime}`);
              } else if (m.startTime) {
                const start = new Date(`${m.date}T${m.startTime}`);
                endDateTime = new Date(start.getTime() + 60 * 60 * 1000);
              } else {
                endDateTime = new Date(m.date);
              }
              return endDateTime > now;
            });
            if (upcomingMeetings.length === 0) {
              return <div className="text-gray-500">No upcoming meetings scheduled.</div>;
            }
            return upcomingMeetings.map(meeting => (
              <div
                key={meeting.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => setSelectedMeeting(meeting)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">
                      {format(new Date(meeting.date), 'd')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                    <p className="text-sm text-gray-600">
                      {format(new Date(meeting.date), 'MMM dd, yyyy')} at {meeting.startTime}
                      {meeting.endTime ? ` - ${meeting.endTime}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {meeting.attendees.length} attendees
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(meeting.status)}`}>
                    {meeting.status}
                  </span>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Meeting Details Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-lg">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setSelectedMeeting(null)}
            >
              <span className="text-2xl">&times;</span>
            </button>
            <h2 className="text-2xl font-bold mb-2">{selectedMeeting.title}</h2>
            <p className="text-gray-700 mb-2">{selectedMeeting.description}</p>
            <p className="text-gray-600 mb-1">
              <span className="font-medium">Date:</span> {format(new Date(selectedMeeting.date), 'MMM dd, yyyy')}
            </p>
            <p className="text-gray-600 mb-1">
              <span className="font-medium">Time:</span> {selectedMeeting.startTime}{selectedMeeting.endTime ? ` - ${selectedMeeting.endTime}` : ''}
            </p>
            {selectedMeeting.id && (
              <div className="mt-4 flex flex-col items-start gap-2">
                <span className="text-sm text-gray-700 font-medium">Feedback Form Link:</span>
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={`${window.location.origin}/feedback/${selectedMeeting.id}`}
                    readOnly
                    className="w-full px-2 py-1 border rounded bg-gray-100 text-gray-800 text-sm"
                    style={{ minWidth: '0' }}
                  />
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/feedback/${selectedMeeting.id}`);
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Meeting Modal */}
      {showMeetingModal && (
        <MeetingModal
          selectedDate={selectedDate}
          onClose={() => {
            setShowMeetingModal(false);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
}