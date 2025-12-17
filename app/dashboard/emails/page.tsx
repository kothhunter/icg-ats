'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Applicant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  assigned_slot: string | null;
  status: string;
}

interface TimeSlot {
  id: string;
  display_label: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

interface InterviewGroup {
  slotId: string;
  displayLabel: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  applicants: Applicant[];
  count: number;
}

type SelectedGroup =
  | { type: 'interview'; slotId: string }
  | { type: 'rejected' }
  | { type: 'rejected_after_interview' }
  | { type: 'accepted' }
  | null;

interface Config {
  interview: string;
  rejected: string;
  rejected_after_interview: string;
  accepted: string;
}

export default function EmailsPage() {
  const [interviewGroups, setInterviewGroups] = useState<InterviewGroup[]>([]);
  const [rejectedApplicants, setRejectedApplicants] = useState<Applicant[]>([]);
  const [rejectedAfterInterviewApplicants, setRejectedAfterInterviewApplicants] = useState<Applicant[]>([]);
  const [acceptedApplicants, setAcceptedApplicants] = useState<Applicant[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<SelectedGroup>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Config | null>(null);
  const [location, setLocation] = useState('');
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

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

      // Fetch config for email templates
      const { data: configData, error: configError } = await supabase
        .from('config')
        .select('email_templates')
        .single();

      if (configError) {
        console.error('Error fetching config:', configError);
      } else if (configData?.email_templates) {
        setConfig(configData.email_templates);
      }

      // Fetch all applicants
      const { data: applicantsData, error: applicantsError } = await supabase
        .from('applicants')
        .select('id, first_name, last_name, email, assigned_slot, status');

      if (applicantsError) {
        console.error('Error fetching applicants:', applicantsError);
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

      // Create a map of slot IDs to slot details
      const slotMap = new Map<string, TimeSlot>();
      (slotsData || []).forEach(slot => {
        slotMap.set(slot.id, slot);
      });

      // Group applicants by assigned_slot (scheduled)
      const slotGroups = new Map<string, Applicant[]>();
      const rejected: Applicant[] = [];
      const rejectedAfterInterview: Applicant[] = [];
      const accepted: Applicant[] = [];

      (applicantsData || []).forEach(applicant => {
        // Interview groups (scheduled with assigned slot)
        if (applicant.assigned_slot && applicant.status === 'scheduled') {
          if (!slotGroups.has(applicant.assigned_slot)) {
            slotGroups.set(applicant.assigned_slot, []);
          }
          slotGroups.get(applicant.assigned_slot)?.push(applicant);
        }

        // Rejected applicants (before interview)
        if (applicant.status === 'rejected') {
          rejected.push(applicant);
        }

        // Rejected after interview
        if (applicant.status === 'rejected_after_interview') {
          rejectedAfterInterview.push(applicant);
        }

        // Accepted applicants
        if (applicant.status === 'accepted') {
          accepted.push(applicant);
        }
      });

      // Convert slot groups to array with slot details
      const groups: InterviewGroup[] = [];
      slotGroups.forEach((applicants, slotId) => {
        const slot = slotMap.get(slotId);
        if (slot) {
          groups.push({
            slotId,
            displayLabel: slot.display_label,
            dayOfWeek: slot.day_of_week,
            startTime: slot.start_time,
            endTime: slot.end_time,
            applicants,
            count: applicants.length,
          });
        }
      });

      // Sort groups by day and time
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      groups.sort((a, b) => {
        const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
      });

      setInterviewGroups(groups);
      setRejectedApplicants(rejected);
      setRejectedAfterInterviewApplicants(rejectedAfterInterview);
      setAcceptedApplicants(accepted);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setLoading(false);
    }
  };

  const handleSelectGroup = (group: SelectedGroup) => {
    setSelectedGroup(group);
  };

  const isGroupSelected = (group: SelectedGroup): boolean => {
    if (!selectedGroup || !group) return false;

    if (group.type === 'interview' && selectedGroup.type === 'interview') {
      return group.slotId === selectedGroup.slotId;
    }

    return group.type === selectedGroup.type;
  };

  const getCurrentRecipients = (): Applicant[] => {
    if (!selectedGroup) return [];

    if (selectedGroup.type === 'interview') {
      const group = interviewGroups.find(g => g.slotId === selectedGroup.slotId);
      return group?.applicants || [];
    } else if (selectedGroup.type === 'rejected') {
      return rejectedApplicants;
    } else if (selectedGroup.type === 'rejected_after_interview') {
      return rejectedAfterInterviewApplicants;
    } else if (selectedGroup.type === 'accepted') {
      return acceptedApplicants;
    }

    return [];
  };

  const getEmailTemplate = (): string => {
    if (!selectedGroup || !config) return '';

    if (selectedGroup.type === 'interview') {
      return config.interview || '';
    } else if (selectedGroup.type === 'rejected') {
      return config.rejected || '';
    } else if (selectedGroup.type === 'rejected_after_interview') {
      return config.rejected_after_interview || '';
    } else if (selectedGroup.type === 'accepted') {
      return config.accepted || '';
    }

    return '';
  };

  const getProcessedEmailBody = (): string => {
    let template = getEmailTemplate();

    if (selectedGroup?.type === 'interview') {
      const group = interviewGroups.find(g => g.slotId === selectedGroup.slotId);
      if (group) {
        // Replace {{slot}} with the time slot info
        const slotInfo = `${group.displayLabel} (${group.dayOfWeek}, ${group.startTime}-${group.endTime})`;
        template = template.replace(/\{\{slot\}\}/g, slotInfo);
      }

      // Replace {{location}} with the location input
      template = template.replace(/\{\{location\}\}/g, location || '[Location not set]');
    }

    return template;
  };

  const copyEmailsToClipboard = async () => {
    const recipients = getCurrentRecipients();
    const emails = recipients.map(r => r.email).join(', ');

    try {
      await navigator.clipboard.writeText(emails);
      setCopiedEmails(true);
      setTimeout(() => setCopiedEmails(false), 2000);
    } catch (error) {
      console.error('Failed to copy emails:', error);
      alert('Failed to copy emails to clipboard');
    }
  };

  const copyEmailBodyToClipboard = async () => {
    const body = getProcessedEmailBody();

    try {
      await navigator.clipboard.writeText(body);
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    } catch (error) {
      console.error('Failed to copy email body:', error);
      alert('Failed to copy email body to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-icg-navy"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-240px)]">
      {/* Left Sidebar - Email Groups */}
      <div className="w-1/4 flex flex-col">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-icg-navy">Email Groups</h2>
        </div>

        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-white">
          <div className="divide-y divide-gray-200">
            {/* Interview Confirmations Section */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Interview Confirmations
              </h3>
              {interviewGroups.length === 0 ? (
                <p className="text-sm text-gray-500">No scheduled interviews</p>
              ) : (
                <div className="space-y-2">
                  {interviewGroups.map((group) => (
                    <button
                      key={group.slotId}
                      onClick={() => handleSelectGroup({ type: 'interview', slotId: group.slotId })}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isGroupSelected({ type: 'interview', slotId: group.slotId })
                          ? 'bg-icg-light border-2 border-icg-navy'
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium text-gray-900 text-sm">
                        {group.displayLabel}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {group.dayOfWeek} • {group.startTime}-{group.endTime}
                      </div>
                      <div className="text-xs text-icg-blue font-medium mt-1">
                        {group.count} {group.count === 1 ? 'person' : 'people'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Rejections (No Interview) Section */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Rejections (No Interview)
              </h3>
              <button
                onClick={() => handleSelectGroup({ type: 'rejected' })}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  isGroupSelected({ type: 'rejected' })
                    ? 'bg-icg-light border-2 border-icg-navy'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="font-medium text-gray-900 text-sm">
                  Rejected Before Interview
                </div>
                <div className="text-xs text-red-600 font-medium mt-1">
                  {rejectedApplicants.length} {rejectedApplicants.length === 1 ? 'person' : 'people'}
                </div>
              </button>
            </div>

            {/* Rejections (After Interview) Section */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Rejections (After Interview)
              </h3>
              <button
                onClick={() => handleSelectGroup({ type: 'rejected_after_interview' })}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  isGroupSelected({ type: 'rejected_after_interview' })
                    ? 'bg-icg-light border-2 border-icg-navy'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="font-medium text-gray-900 text-sm">
                  Rejected After Interview
                </div>
                <div className="text-xs text-red-600 font-medium mt-1">
                  {rejectedAfterInterviewApplicants.length} {rejectedAfterInterviewApplicants.length === 1 ? 'person' : 'people'}
                </div>
              </button>
            </div>

            {/* Acceptances Section */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Acceptances
              </h3>
              <button
                onClick={() => handleSelectGroup({ type: 'accepted' })}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  isGroupSelected({ type: 'accepted' })
                    ? 'bg-icg-light border-2 border-icg-navy'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="font-medium text-gray-900 text-sm">
                  Accepted Applicants
                </div>
                <div className="text-xs text-green-600 font-medium mt-1">
                  {acceptedApplicants.length} {acceptedApplicants.length === 1 ? 'person' : 'people'}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Area - Email Content */}
      <div className="w-3/4 flex flex-col">
        <h2 className="text-2xl font-bold text-icg-navy mb-4">Email Content</h2>

        {!selectedGroup ? (
          <div className="flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No group selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a group from the left to view email details
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-white">
            <div className="p-6 space-y-6">
              {/* Recipients Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recipients ({getCurrentRecipients().length})
                  </h3>
                  <button
                    onClick={copyEmailsToClipboard}
                    className="px-4 py-2 text-sm font-medium text-icg-navy hover:text-white hover:bg-icg-navy border border-icg-navy rounded-lg transition-colors"
                  >
                    {copiedEmails ? 'Copied!' : 'Copy All Emails'}
                  </button>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {getCurrentRecipients().map((applicant, index) => (
                    <div key={applicant.id} className="text-sm text-gray-700">
                      {applicant.email}
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Input (only for interview groups) */}
              {selectedGroup.type === 'interview' && (
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Zoom link or physical address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-icg-navy focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This will replace {'{location}'} in the email template
                  </p>
                </div>
              )}

              {/* Email Body Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Email Body</h3>
                  <button
                    onClick={copyEmailBodyToClipboard}
                    className="px-4 py-2 text-sm font-medium text-icg-navy hover:text-white hover:bg-icg-navy border border-icg-navy rounded-lg transition-colors"
                  >
                    {copiedBody ? 'Copied!' : 'Copy Email Body'}
                  </button>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {getProcessedEmailBody() || 'No email template configured for this group.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
