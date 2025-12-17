'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth';

interface FRQResponse {
  question_id: string;
  question_text: string;
  answer: string;
}

interface Note {
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface Applicant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  major: string;
  graduation_year: number;
  resume_url: string | null;
  frq_responses: FRQResponse[];
  available_slots: string[];
  status: 'applied' | 'rejected' | 'interviewing' | 'scheduled' | 'rejected_after_interview' | 'accepted';
  assigned_slot: string | null;
  notes: Note[];
  applied_date: string;
  last_updated: string;
}

type StatusFilter = 'all' | 'applied' | 'interviewing' | 'scheduled' | 'accepted' | 'rejected' | 'rejected_after_interview';

const statusLabels: Record<StatusFilter, string> = {
  all: 'All',
  applied: 'Applied',
  interviewing: 'Interviewing',
  scheduled: 'Scheduled',
  accepted: 'Accepted',
  rejected: 'Rejected',
  rejected_after_interview: 'Rejected After Interview',
};

const statusColors: Record<string, string> = {
  applied: 'bg-gray-100 text-gray-800 border-gray-300',
  interviewing: 'bg-blue-100 text-blue-800 border-blue-300',
  scheduled: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  accepted: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
  rejected_after_interview: 'bg-red-200 text-red-900 border-red-400',
};

interface TimeSlot {
  id: string;
  display_label: string;
}

export default function DashboardPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchApplicants();
    fetchTimeSlots();
  }, []);

  useEffect(() => {
    filterApplicants();
  }, [applicants, searchQuery, statusFilter]);

  const fetchApplicants = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase configuration is missing');
        setLoading(false);
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data, error } = await supabase
        .from('applicants')
        .select('*')
        .order('applied_date', { ascending: false });

      if (error) {
        console.error('Error fetching applicants:', error);
        setLoading(false);
        return;
      }

      setApplicants(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch applicants:', error);
      setLoading(false);
    }
  };

  const filterApplicants = () => {
    let filtered = [...applicants];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Apply search filter (name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.first_name.toLowerCase().includes(query) ||
          app.last_name.toLowerCase().includes(query) ||
          `${app.first_name} ${app.last_name}`.toLowerCase().includes(query)
      );
    }

    setFilteredApplicants(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const fetchTimeSlots = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) return;

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data } = await supabase
        .from('time_slots')
        .select('id, display_label')
        .eq('is_active', true);

      if (data) {
        setTimeSlots(data);
      }
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'applied':
        return 'Applied';
      case 'interviewing':
        return 'Interviewing';
      case 'scheduled':
        return 'Scheduled';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'rejected_after_interview':
        return 'Rejected After Interview';
      default:
        return status;
    }
  };

  const updateApplicantStatus = async (newStatus: string) => {
    if (!selectedApplicant) return;

    // Confirmation for rejecting applicants
    if (newStatus === 'rejected') {
      const confirmMessage = `Are you sure you want to deny ${selectedApplicant.first_name} ${selectedApplicant.last_name}?\n\nThis action will move them to the "Denied" status.`;
      if (!confirm(confirmMessage)) {
        return;
      }
    }

    setUpdatingStatus(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { error } = await supabase
        .from('applicants')
        .update({
          status: newStatus,
          last_updated: new Date().toISOString(),
        })
        .eq('id', selectedApplicant.id);

      if (error) throw error;

      // Refresh applicants and update selected
      await fetchApplicants();
      const updated = applicants.find(a => a.id === selectedApplicant.id);
      if (updated) {
        setSelectedApplicant({ ...updated, status: newStatus as any });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const addNote = async () => {
    if (!selectedApplicant || !newNote.trim()) return;

    setSavingNote(true);

    try {
      const session = getSession();
      if (!session) {
        alert('You must be logged in to add notes');
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const newNoteObj = {
        author_id: session.id,
        author_name: session.display_name,
        content: newNote.trim(),
        created_at: new Date().toISOString(),
      };

      const updatedNotes = [...(selectedApplicant.notes || []), newNoteObj];

      const { error } = await supabase
        .from('applicants')
        .update({
          notes: updatedNotes,
          last_updated: new Date().toISOString(),
        })
        .eq('id', selectedApplicant.id);

      if (error) throw error;

      // Update local state
      setSelectedApplicant({
        ...selectedApplicant,
        notes: updatedNotes,
      });

      setNewNote('');

      // Refresh applicants list
      await fetchApplicants();
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setSavingNote(false);
    }
  };

  const getSlotLabel = (slotId: string): string => {
    const slot = timeSlots.find(s => s.id === slotId);
    return slot ? slot.display_label : slotId;
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-240px)]">
      {/* Left Panel - Applicant List */}
      <div className="w-1/3 flex flex-col">
        <h2 className="text-2xl font-bold text-icg-navy mb-4">Applicants</h2>

        {/* Search Box */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-icg-navy focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-icg-navy focus:border-transparent"
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Applicants Count */}
        <div className="mb-3">
          <p className="text-sm text-gray-600">
            {filteredApplicants.length} applicant{filteredApplicants.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Applicant List */}
        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-icg-navy"></div>
            </div>
          ) : filteredApplicants.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No applicants found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredApplicants.map((applicant) => (
                <div
                  key={applicant.id}
                  onClick={() => setSelectedApplicant(applicant)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedApplicant?.id === applicant.id
                      ? 'bg-icg-light border-l-4 border-icg-navy'
                      : ''
                  }`}
                >
                  {/* Name */}
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {applicant.first_name} {applicant.last_name}
                  </h3>

                  {/* Major and Year */}
                  <p className="text-sm text-gray-600 mb-2">
                    {applicant.major} &bull; {applicant.graduation_year}
                  </p>

                  {/* Status Badge */}
                  <div className="mb-2">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded border ${
                        statusColors[applicant.status] || 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}
                    >
                      {getStatusLabel(applicant.status)}
                    </span>
                  </div>

                  {/* Applied Date */}
                  <p className="text-xs text-gray-500">
                    Applied: {formatDate(applicant.applied_date)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Applicant Details */}
      <div className="w-2/3 flex flex-col overflow-y-auto">
        {selectedApplicant ? (
          <div className="space-y-6">
            {/* 1. Header Section */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-3xl font-bold text-icg-navy mb-3">
                {selectedApplicant.first_name} {selectedApplicant.last_name}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <span>{selectedApplicant.email}</span>
                <span>•</span>
                <span>{selectedApplicant.phone}</span>
                <span>•</span>
                <span>{selectedApplicant.major}</span>
                <span>•</span>
                <span>Class of {selectedApplicant.graduation_year}</span>
              </div>
              <div>
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded border ${
                    statusColors[selectedApplicant.status] || 'bg-gray-100 text-gray-800 border-gray-300'
                  }`}
                >
                  {getStatusLabel(selectedApplicant.status)}
                </span>
              </div>
            </div>

            {/* 2. Free Response Answers */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-bold text-icg-navy mb-4">Free Response Answers</h3>
              {selectedApplicant.frq_responses && Array.isArray(selectedApplicant.frq_responses) ? (
                <div className="space-y-4">
                  {selectedApplicant.frq_responses.map((frq: FRQResponse, index: number) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-semibold text-gray-800 mb-2">{frq.question_text}</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{frq.answer}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No responses available</p>
              )}
            </div>

            {/* 3. Resume */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-bold text-icg-navy mb-4">Resume</h3>
              {selectedApplicant.resume_url ? (
                <a
                  href={selectedApplicant.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-icg-navy text-white rounded-lg hover:bg-icg-blue transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  View Resume
                </a>
              ) : (
                <p className="text-gray-500 text-sm">No resume uploaded</p>
              )}
            </div>

            {/* 4. Available Time Slots */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-bold text-icg-navy mb-4">Available Time Slots</h3>
              {selectedApplicant.available_slots && selectedApplicant.available_slots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedApplicant.available_slots.map((slotId) => (
                    <span
                      key={slotId}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-200"
                    >
                      {getSlotLabel(slotId)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No time slots selected</p>
              )}
            </div>

            {/* 5. Action Buttons */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-xl font-bold text-icg-navy mb-4">Actions</h3>

              {/* Applied status */}
              {selectedApplicant.status === 'applied' && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => updateApplicantStatus('interviewing')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {updatingStatus ? 'Updating...' : 'Move to Interview'}
                  </button>
                  <button
                    onClick={() => updateApplicantStatus('rejected')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                  >
                    {updatingStatus ? 'Updating...' : 'Reject'}
                  </button>
                </div>
              )}

              {/* Interviewing status */}
              {selectedApplicant.status === 'interviewing' && (
                <div>
                  <p className="text-gray-700 mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    ⏳ Awaiting interview scheduling
                  </p>
                  <button
                    onClick={() => updateApplicantStatus('rejected')}
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                  >
                    {updatingStatus ? 'Updating...' : 'Reject'}
                  </button>
                </div>
              )}

              {/* Scheduled status */}
              {selectedApplicant.status === 'scheduled' && (
                <div>
                  {selectedApplicant.assigned_slot && (
                    <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm font-medium text-gray-700 mb-1">Interview Scheduled:</p>
                      <p className="text-lg font-bold text-icg-navy">{getSlotLabel(selectedApplicant.assigned_slot)}</p>
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => updateApplicantStatus('accepted')}
                      disabled={updatingStatus}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                      {updatingStatus ? 'Updating...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => updateApplicantStatus('rejected_after_interview')}
                      disabled={updatingStatus}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                    >
                      {updatingStatus ? 'Updating...' : 'Reject'}
                    </button>
                  </div>
                </div>
              )}

              {/* Final statuses */}
              {(selectedApplicant.status === 'accepted' ||
                selectedApplicant.status === 'rejected' ||
                selectedApplicant.status === 'rejected_after_interview') && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <span
                      className={`inline-block px-3 py-1 text-sm font-medium rounded border ${
                        statusColors[selectedApplicant.status] || 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}
                    >
                      {getStatusLabel(selectedApplicant.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">This decision is final. No further actions available.</p>
                </div>
              )}
            </div>

            {/* 6. Notes Section */}
            <div>
              <h3 className="text-xl font-bold text-icg-navy mb-4">Notes</h3>

              {/* Existing Notes */}
              <div className="space-y-3 mb-4">
                {selectedApplicant.notes && selectedApplicant.notes.length > 0 ? (
                  selectedApplicant.notes.map((note: Note, index: number) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-800">{note.author_name}</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(note.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No notes yet</p>
                )}
              </div>

              {/* Add Note */}
              <div className="bg-white border border-gray-300 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Note
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-icg-navy focus:border-transparent resize-none"
                  placeholder="Type your note here..."
                  disabled={savingNote}
                />
                <button
                  onClick={addNote}
                  disabled={savingNote || !newNote.trim()}
                  className="mt-2 px-4 py-2 bg-icg-navy text-white rounded-lg hover:bg-icg-blue disabled:bg-gray-400 transition-colors"
                >
                  {savingNote ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <p className="text-lg font-medium text-gray-700">No applicant selected</p>
              <p className="text-sm text-gray-500 mt-1">
                Select an applicant from the list to view details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
