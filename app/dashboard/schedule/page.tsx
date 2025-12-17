'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { autoAssignInterviews, type AutoAssignResult } from '@/lib/autoAssign';
import type { Applicant, TimeSlot } from '@/types';

interface SlotWithAssignments extends TimeSlot {
  assignedApplicants: Applicant[];
}

export default function SchedulePage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [allApplicants, setAllApplicants] = useState<Applicant[]>([]);
  const [timeSlots, setTimeSlots] = useState<SlotWithAssignments[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotWithAssignments | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigningSlot, setAssigningSlot] = useState<string | null>(null);
  const [processingApplicant, setProcessingApplicant] = useState<string | null>(null);

  // Auto-assign states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [autoAssignResult, setAutoAssignResult] = useState<AutoAssignResult | null>(null);
  const [savingAssignments, setSavingAssignments] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase configuration is missing');
        setLoading(false);
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Fetch applicants needing interviews (status = 'interviewing')
      const { data: applicantsData, error: applicantsError } = await supabase
        .from('applicants')
        .select('id, first_name, last_name, email, phone, major, graduation_year, resume_url, frq_responses, available_slots, assigned_slot, status, notes, applied_date, last_updated')
        .eq('status', 'interviewing');

      if (applicantsError) {
        console.error('Error fetching applicants:', applicantsError);
      }

      // Fetch all applicants for slot assignments (including scheduled)
      const { data: allApplicantsData, error: allApplicantsError } = await supabase
        .from('applicants')
        .select('id, first_name, last_name, email, phone, major, graduation_year, resume_url, frq_responses, available_slots, assigned_slot, status, notes, applied_date, last_updated')
        .in('status', ['scheduled', 'interviewing']);

      if (allApplicantsError) {
        console.error('Error fetching all applicants:', allApplicantsError);
      }

      // Fetch time slots
      const { data: slotsData, error: slotsError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');

      if (slotsError) {
        console.error('Error fetching time slots:', slotsError);
      }

      // Combine slots with their assigned applicants
      const slotsWithAssignments: SlotWithAssignments[] = (slotsData || []).map((slot) => {
        const assignedApplicants = (allApplicantsData || []).filter(
          (app) => app.assigned_slot === slot.id
        );

        return {
          ...slot,
          assignedApplicants,
        };
      });

      setApplicants(applicantsData || []);
      setAllApplicants(allApplicantsData || []);
      setTimeSlots(slotsWithAssignments);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoading(false);
    }
  };

  const assignApplicant = async (slotId: string) => {
    if (!selectedApplicant) return;

    setAssigningSlot(slotId);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { error } = await supabase
        .from('applicants')
        .update({
          assigned_slot: slotId,
          status: 'scheduled',
        })
        .eq('id', selectedApplicant.id);

      if (error) {
        console.error('Error assigning applicant:', error);
        alert('Failed to assign applicant. Please try again.');
        return;
      }

      // Clear selection and refresh data
      setSelectedApplicant(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to assign applicant:', error);
      alert('Failed to assign applicant. Please try again.');
    } finally {
      setAssigningSlot(null);
    }
  };

  const removeApplicant = async (applicantId: string) => {
    if (!confirm('Are you sure you want to remove this applicant from their assigned slot?')) {
      return;
    }

    setProcessingApplicant(applicantId);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { error } = await supabase
        .from('applicants')
        .update({
          assigned_slot: null,
          status: 'interviewing',
        })
        .eq('id', applicantId);

      if (error) {
        console.error('Error removing applicant:', error);
        alert('Failed to remove applicant. Please try again.');
        return;
      }

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Failed to remove applicant:', error);
      alert('Failed to remove applicant. Please try again.');
    } finally {
      setProcessingApplicant(null);
    }
  };


  const handleFillSlots = () => {
    // Check if there are eligible applicants
    const eligibleCount = allApplicants.filter(
      (app) =>
        app.status === 'interviewing' &&
        app.assigned_slot === null &&
        app.available_slots && app.available_slots.length > 0
    ).length;

    if (eligibleCount === 0) {
      alert('No eligible applicants found for auto-assignment. Applicants must have status "interviewing", no assigned slot, and at least one available time slot.');
      return;
    }

    if (timeSlots.length === 0) {
      alert('No time slots configured. Please add time slots before using auto-assign.');
      return;
    }

    setShowConfirmModal(true);
  };

  const runAutoAssign = () => {
    setShowConfirmModal(false);

    // Run the auto-assign algorithm
    const result = autoAssignInterviews(allApplicants, timeSlots);

    setAutoAssignResult(result);
    setShowResultsModal(true);
  };

  const saveAutoAssignments = async () => {
    if (!autoAssignResult || autoAssignResult.placed.length === 0) {
      return;
    }

    setSavingAssignments(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Update each applicant with their assigned slot
      const updates = autoAssignResult.placed.map((placement) => ({
        id: placement.applicant.id,
        assigned_slot: placement.applicant.assigned_slot,
        status: 'scheduled',
      }));

      // Batch update all applicants
      const updatePromises = updates.map((update) =>
        supabase
          .from('applicants')
          .update({
            assigned_slot: update.assigned_slot,
            status: update.status,
          })
          .eq('id', update.id)
      );

      const results = await Promise.all(updatePromises);

      // Check for errors
      const errors = results.filter((result) => result.error);
      if (errors.length > 0) {
        console.error('Errors during batch update:', errors);
        alert(`Failed to save ${errors.length} assignment(s). Please try again.`);
        return;
      }

      // Success - close modal and refresh data
      setShowResultsModal(false);
      setAutoAssignResult(null);
      await fetchData();

      alert(`Successfully assigned ${autoAssignResult.placed.length} applicant(s) to interview slots!`);
    } catch (error) {
      console.error('Failed to save auto-assignments:', error);
      alert('Failed to save assignments. Please try again.');
    } finally {
      setSavingAssignments(false);
    }
  };

  const groupSlotsByDay = () => {
    const grouped: Record<string, SlotWithAssignments[]> = {};
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    timeSlots.forEach((slot) => {
      if (!grouped[slot.day_of_week]) {
        grouped[slot.day_of_week] = [];
      }
      grouped[slot.day_of_week].push(slot);
    });

    // Return sorted by day order
    return dayOrder.reduce((acc, day) => {
      if (grouped[day]) {
        acc[day] = grouped[day];
      }
      return acc;
    }, {} as Record<string, SlotWithAssignments[]>);
  };

  const isSlotAvailable = (slotId: string): boolean => {
    if (!selectedApplicant) return false;
    return selectedApplicant.available_slots?.includes(slotId) || false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-icg-navy"></div>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDay();

  return (
    <div className="flex gap-6 h-[calc(100vh-240px)]">
      {/* Left Sidebar - Applicants Needing Interviews */}
      <div className="w-1/4 flex flex-col">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-icg-navy">Needs Scheduling</h2>
          <p className="text-sm text-gray-600 mt-1">
            {applicants.length} applicant{applicants.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
          {applicants.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 p-4">
              <p className="text-sm text-center">
                No applicants need interview scheduling
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {applicants.map((applicant) => (
                <div
                  key={applicant.id}
                  onClick={() => setSelectedApplicant(applicant)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedApplicant?.id === applicant.id
                      ? 'bg-icg-light border-l-4 border-icg-navy'
                      : ''
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {applicant.first_name} {applicant.last_name}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {applicant.available_slots?.length || 0} slot
                    {applicant.available_slots?.length !== 1 ? 's' : ''} available
                  </p>
                  {applicant.assigned_slot && (
                    <p className="text-xs text-green-600 mt-1">✓ Already assigned</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Area - Time Slot Grid */}
      <div className="w-3/4 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-icg-navy">Interview Slots</h2>
            <button
              onClick={handleFillSlots}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
            >
              ✨ Fill Slots
            </button>
          </div>
          {selectedApplicant && (
            <div className="text-sm text-gray-600">
              Showing availability for{' '}
              <span className="font-semibold text-icg-navy">
                {selectedApplicant.first_name} {selectedApplicant.last_name}
              </span>
            </div>
          )}
        </div>

        {selectedApplicant && selectedApplicant.available_slots?.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Notice:</strong> This applicant has no available time slots selected.
            </p>
          </div>
        )}

        {selectedApplicant &&
         selectedApplicant.available_slots?.length > 0 &&
         !timeSlots.some(slot => isSlotAvailable(slot.id) && slot.assignedApplicants.length < slot.max_capacity) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Notice:</strong> All available slots for this applicant are full.
            </p>
          </div>
        )}

        {Object.keys(groupedSlots).length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No time slots configured</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSlots).map(([day, slots]) => (
              <div key={day} className="border border-gray-200 rounded-lg p-4 bg-white">
                <h3 className="text-lg font-bold text-icg-navy mb-4">{day}</h3>

                <div className="space-y-3">
                  {slots.map((slot) => {
                    const assignedCount = slot.assignedApplicants.length;
                    const isFull = assignedCount >= slot.max_capacity;
                    const capacityPercentage = (assignedCount / slot.max_capacity) * 100;
                    const isAvailable = isSlotAvailable(slot.id);
                    const showAssignButton = selectedApplicant && isAvailable && !isFull;
                    const isUnavailable = selectedApplicant && !isAvailable;

                    return (
                      <div
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedSlot?.id === slot.id
                            ? 'border-icg-navy bg-icg-light'
                            : isAvailable && selectedApplicant
                            ? 'border-green-400 bg-green-50 hover:border-green-500'
                            : isUnavailable
                            ? 'border-gray-300 bg-gray-100 opacity-50'
                            : 'border-gray-200 hover:border-icg-blue bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {slot.display_label}
                              {isAvailable && selectedApplicant && (
                                <span className="ml-2 text-xs font-medium text-green-600">
                                  ✓ Available
                                </span>
                              )}
                              {isUnavailable && (
                                <span className="ml-2 text-xs font-medium text-gray-500">
                                  ✗ Unavailable
                                </span>
                              )}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {slot.start_time} - {slot.end_time}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div
                                className={`text-lg font-bold ${
                                  isFull
                                    ? 'text-red-600'
                                    : assignedCount > 0
                                    ? 'text-blue-600'
                                    : 'text-gray-600'
                                }`}
                              >
                                {assignedCount} / {slot.max_capacity}
                              </div>
                              <p className="text-xs text-gray-500">
                                {isFull ? 'Full' : `${slot.max_capacity - assignedCount} spots left`}
                              </p>
                            </div>

                            {showAssignButton && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  assignApplicant(slot.id);
                                }}
                                disabled={assigningSlot === slot.id}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                              >
                                {assigningSlot === slot.id ? 'Assigning...' : 'Assign'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Capacity Bar */}
                        <div className="mb-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                isFull
                                  ? 'bg-red-500'
                                  : capacityPercentage > 50
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Assigned Applicants */}
                        {slot.assignedApplicants.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-2">
                              Assigned:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {slot.assignedApplicants.map((app) => (
                                <div
                                  key={app.id}
                                  className="flex items-center gap-2 px-2 py-1 text-xs rounded border bg-blue-100 text-blue-800 border-blue-200"
                                >
                                  <span>
                                    {app.first_name} {app.last_name}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeApplicant(app.id);
                                    }}
                                    disabled={processingApplicant === app.id}
                                    className="text-red-600 hover:text-red-800 font-bold disabled:text-gray-400 disabled:cursor-not-allowed"
                                    title="Remove from slot"
                                  >
                                    {processingApplicant === app.id ? '⋯' : '×'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Slot Details Panel (when slot selected) */}
        {selectedSlot && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-xl font-bold text-icg-navy mb-4">Slot Details</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-semibold text-gray-900">{selectedSlot.display_label}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Capacity</p>
                  <p className="font-semibold text-gray-900">
                    {selectedSlot.assignedApplicants.length} / {selectedSlot.max_capacity}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Day</p>
                  <p className="font-semibold text-gray-900">{selectedSlot.day_of_week}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Slot ID</p>
                  <p className="font-mono text-xs text-gray-900">{selectedSlot.id}</p>
                </div>
              </div>

              {selectedSlot.assignedApplicants.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Assigned Applicants:
                  </p>
                  <div className="space-y-2">
                    {selectedSlot.assignedApplicants.map((app) => (
                      <div
                        key={app.id}
                        className="rounded p-3 flex items-center justify-between border bg-white border-gray-200"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {app.first_name} {app.last_name}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Status: {app.status}</p>
                        </div>
                        <button
                          onClick={() => removeApplicant(app.id)}
                          disabled={processingApplicant === app.id}
                          className="px-3 py-1 text-xs font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded disabled:bg-gray-400 disabled:text-white disabled:border-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {processingApplicant === app.id ? 'Processing...' : 'Remove'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-icg-navy mb-4">Auto-Assign Interviews</h3>
            <p className="text-gray-700 mb-6">
              This will automatically assign eligible applicants to available interview slots based on:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Applicant availability and flexibility</li>
              <li>Current slot capacity</li>
              <li>Application submission date</li>
            </ul>
            <p className="text-sm text-gray-600 mb-6">
              You will be able to review the assignments before saving them to the database.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={runAutoAssign}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                Run Auto-Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && autoAssignResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-icg-navy">Auto-Assign Results</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Successfully Placed */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-green-700 mb-3">
                  ✓ Successfully Assigned ({autoAssignResult.placed.length})
                </h4>
                {autoAssignResult.placed.length === 0 ? (
                  <p className="text-sm text-gray-600">No applicants were assigned.</p>
                ) : (
                  <div className="space-y-2">
                    {autoAssignResult.placed.map((placement, index) => (
                      <div
                        key={index}
                        className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {placement.applicant.first_name} {placement.applicant.last_name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {placement.applicant.email || 'No email'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-700">
                            {placement.assignedSlot.display_label}
                          </p>
                          <p className="text-xs text-gray-600">
                            {placement.assignedSlot.day_of_week}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Unplaceable Applicants */}
              {autoAssignResult.unplaceable.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-orange-700 mb-3">
                    ⚠ Could Not Assign ({autoAssignResult.unplaceable.length})
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    These applicants could not be assigned because all their available slots are full:
                  </p>
                  <div className="space-y-2">
                    {autoAssignResult.unplaceable.map((applicant, index) => (
                      <div
                        key={index}
                        className="bg-orange-50 border border-orange-200 rounded-lg p-3"
                      >
                        <p className="font-medium text-gray-900">
                          {applicant.first_name} {applicant.last_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          Available slots: {applicant.available_slots?.length || 0}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowResultsModal(false);
                    setAutoAssignResult(null);
                  }}
                  disabled={savingAssignments}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium disabled:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAutoAssignments}
                  disabled={savingAssignments || autoAssignResult.placed.length === 0}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {savingAssignments ? 'Saving...' : `Save ${autoAssignResult.placed.length} Assignment(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
