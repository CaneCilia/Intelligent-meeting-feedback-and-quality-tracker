import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import { UserIcon, EnvelopeIcon, BuildingOfficeIcon, CalendarIcon } from '@heroicons/react/24/outline';

export default function Profile() {

  const { user, updateUserProfile, fetchUserProfile, profileComplete } = useAuth();
  const navigate = useNavigate();
  // Only show prompt if profile is incomplete
  const [showCompletePrompt, setShowCompletePrompt] = useState(!profileComplete);
  // Only start in editing mode if profile is incomplete
  const [isEditing, setIsEditing] = useState(!profileComplete);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: '',
    position: '',
    department: '',
    joinDate: '',
    meetingsHosted: 0,
    meetingsAttended: 0,
    avgRating: 0
  });

  // Fetch profile data from DB on mount and after update
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.email) {
        const profile = await fetchUserProfile(user.email);
        if (profile) {
          setFormData({
            name: profile.name || '',
            email: profile.email || '',
            company: profile.company || '',
            position: profile.position || '',
            department: profile.department || '',
            joinDate: profile.joinDate || '',
            meetingsHosted: profile.meetingsHosted || 0,
            meetingsAttended: profile.meetingsAttended || 0,
            avgRating: profile.avgRating || 0
          });
        }
        // Update prompt and editing mode based on profileComplete
        setShowCompletePrompt(!profileComplete);
        setIsEditing(!profileComplete);
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // If joinDate is empty, set it to current date
      const updatedFormData = { ...formData };
      if (!updatedFormData.joinDate) {
        updatedFormData.joinDate = new Date().toISOString();
      }
      await updateUserProfile(updatedFormData);
      // Refetch profile from DB to update form fields
      if (user?.email) {
        const profile = await fetchUserProfile(user.email);
        if (profile) {
          setFormData({
            name: profile.name || '',
            email: profile.email || '',
            company: profile.company || '',
            position: profile.position || '',
            department: profile.department || '',
            joinDate: profile.joinDate || '',
            meetingsHosted: profile.meetingsHosted || 0,
            meetingsAttended: profile.meetingsAttended || 0,
            avgRating: profile.avgRating || 0
          });
        }
      }
      setIsEditing(false); // Exit edit mode after successful update
      setShowCompletePrompt(false); // Hide the prompt after successful update
      alert('Profile updated successfully!');
      navigate('/');
    } catch (error) {
      alert('Failed to update profile.');
    }
  };

  const stats = [
    { name: 'Meetings Hosted', value: formData.meetingsHosted, icon: CalendarIcon },
    { name: 'Average Rating', value: `${formData.avgRating}/5`, icon: CalendarIcon },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isEditing ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>
      {showCompletePrompt && (
        <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded">
          Please complete your profile details to continue.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card p-6 text-center">
            <div className="relative inline-block mb-4">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
                alt="Profile"
                className="w-24 h-24 rounded-full mx-auto"
              />
              {isEditing && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{formData.name}</h2>
            <p className="text-gray-600 mb-2">{formData.position}</p>
            <p className="text-sm text-gray-500">{formData.department}</p>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">Member since</p>
              <p className="font-medium">
                {formData.joinDate && !isNaN(new Date(formData.joinDate).getTime())
                  ? new Date(formData.joinDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            {stats.map((stat) => (
              <div key={stat.name} className="card p-4 text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <stat.icon className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-600">{stat.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <UserIcon className="w-4 h-4 inline mr-1" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BuildingOfficeIcon className="w-4 h-4 inline mr-1" />
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                </div>
              </div>

              {isEditing ? (
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
