'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Config } from '@/types';

interface FormData {
  // Step 1: Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  major: string;
  graduationYear: string;

  // Step 2: FRQ + Resume
  frqResponses: Record<string, string>;
  resumeFile: File | null;

  // Step 3: Availability
  availableSlots: string[];
}

export default function ApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applicationsOpen, setApplicationsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    major: '',
    graduationYear: '',
    frqResponses: {},
    resumeFile: null,
    availableSlots: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [frqQuestions, setFrqQuestions] = useState<Array<{ id: string; question: string; max_chars: number }>>([]);
  const [fileError, setFileError] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<Array<{
    id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    display_label: string;
    max_capacity: number;
    is_active: boolean;
  }>>([]);

  useEffect(() => {
    checkApplicationStatus();
    fetchTimeSlots();
  }, []);

  const checkApplicationStatus = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase credentials not configured');
        setLoading(false);
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase
        .from('config')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching config:', error);
        setLoading(false);
        return;
      }

      const config = data as Config;
      setApplicationsOpen(config.applications_open);

      // Set FRQ questions from config
      if (config.frq_questions && Array.isArray(config.frq_questions)) {
        setFrqQuestions(config.frq_questions);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to check application status:', error);
      setLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');

      if (error) {
        console.error('Error fetching time slots:', error);
        return;
      }

      if (data) {
        setTimeSlots(data);
      }
    } catch (error) {
      console.error('Failed to fetch time slots:', error);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.major.trim()) {
      newErrors.major = 'Major is required';
    }

    if (!formData.graduationYear) {
      newErrors.graduationYear = 'Graduation year is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSlotToggle = (slotId: string) => {
    setFormData((prev) => {
      const currentSlots = prev.availableSlots;
      const isSelected = currentSlots.includes(slotId);

      return {
        ...prev,
        availableSlots: isSelected
          ? currentSlots.filter((id) => id !== slotId)
          : [...currentSlots, slotId],
      };
    });
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.availableSlots.length < 3) {
      newErrors.availability = 'Please select at least 3 available time slots';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStep3Valid = (): boolean => {
    return formData.availableSlots.length >= 3;
  };

  const groupSlotsByDay = () => {
    const grouped: Record<string, typeof timeSlots> = {};
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
    }, {} as Record<string, typeof timeSlots>);
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      // Mark all fields as touched to show errors
      setTouched({
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        major: true,
        graduationYear: true,
      });
      return;
    }

    if (currentStep === 2 && !validateStep2()) {
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) {
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration is missing');
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Step 1: Upload resume to Supabase Storage
      let resumeUrl = '';
      if (formData.resumeFile) {
        const timestamp = Date.now();
        const fileExtension = formData.resumeFile.name.split('.').pop();
        const fileName = `${timestamp}-${formData.firstName}-${formData.lastName}.${fileExtension}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, formData.resumeFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Resume upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName);

        resumeUrl = urlData.publicUrl;
      }

      // Step 2: Format FRQ responses with question text
      const frqResponsesArray = frqQuestions.map((question) => ({
        question_id: question.id,
        question_text: question.question,
        answer: formData.frqResponses[question.id] || '',
      }));

      // Step 3: Check if applicant exists
      const { data: existingApplicant, error: checkError } = await supabase
        .from('applicants')
        .select('id')
        .eq('email', formData.email.trim().toLowerCase())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found", which is fine - any other error is a problem
        throw new Error(`Error checking existing application: ${checkError.message}`);
      }

      // Step 4: Prepare applicant data
      const applicantData = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        major: formData.major.trim(),
        graduation_year: parseInt(formData.graduationYear),
        resume_url: resumeUrl,
        frq_responses: frqResponsesArray,
        available_slots: formData.availableSlots,
        status: 'applied',
        applied_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        notes: [],
        assigned_slot: null,
      };

      // Step 5: Upsert applicant data
      if (existingApplicant) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('applicants')
          .update(applicantData)
          .eq('id', existingApplicant.id);

        if (updateError) {
          throw new Error(`Failed to update application: ${updateError.message}`);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('applicants')
          .insert([applicantData]);

        if (insertError) {
          throw new Error(`Failed to submit application: ${insertError.message}`);
        }
      }

      // Success!
      setSubmitted(true);
      setSubmitting(false);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred. Please try again.'
      );
      setSubmitting(false);
    }
  };

  const isStep1Valid = (): boolean => {
    return (
      formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.email.trim() !== '' &&
      validateEmail(formData.email) &&
      formData.phone.trim() !== '' &&
      formData.major.trim() !== '' &&
      formData.graduationYear !== ''
    );
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate all FRQ questions are answered
    frqQuestions.forEach((question) => {
      const answer = formData.frqResponses[question.id]?.trim() || '';
      if (!answer) {
        newErrors[`frq_${question.id}`] = 'This question is required';
      }
    });

    // Validate resume is uploaded
    if (!formData.resumeFile) {
      newErrors.resume = 'Resume is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStep2Valid = (): boolean => {
    // Check all FRQ questions have answers
    const allQuestionsAnswered = frqQuestions.every((question) => {
      const answer = formData.frqResponses[question.id]?.trim() || '';
      return answer.length > 0;
    });

    // Check resume is uploaded
    return allQuestionsAnswered && formData.resumeFile !== null;
  };

  const handleFRQChange = (questionId: string, value: string, maxChars: number) => {
    // Prevent typing beyond max characters
    if (value.length > maxChars) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      frqResponses: {
        ...prev.frqResponses,
        [questionId]: value,
      },
    }));

    // Clear error for this question
    const errorKey = `frq_${questionId}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');

    if (!file) {
      return;
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Only PDF and DOCX files are allowed');
      e.target.value = '';
      return;
    }

    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError('File size must be less than 5MB');
      e.target.value = '';
      return;
    }

    setFormData((prev) => ({ ...prev, resumeFile: file }));

    // Clear resume error
    if (errors.resume) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.resume;
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-icg-light via-white to-icg-lighter flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-icg-navy mx-auto mb-4"></div>
          <p className="text-icg-navy">Loading...</p>
        </div>
      </div>
    );
  }

  if (!applicationsOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-icg-light via-white to-icg-lighter">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-icg-navy mb-4">
              Applications Are Currently Closed
            </h1>
            <p className="text-gray-600 mb-8">
              We're not accepting applications at this time. Please check back later or contact us for more information.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-icg-navy hover:bg-icg-blue text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-icg-light via-white to-icg-lighter">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-20 w-20 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-icg-navy mb-4">
              Application Submitted Successfully!
            </h1>
            <p className="text-lg text-gray-700 mb-2">
              Thank you for applying to Irvine Consulting Group!
            </p>
            <p className="text-gray-600 mb-8">
              We've received your application at <span className="font-semibold text-icg-navy">{formData.email}</span>
              <br />
              We'll review your application and be in touch soon regarding next steps.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-icg-navy hover:bg-icg-blue text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-icg-light via-white to-icg-lighter relative">
      {/* Loading Overlay */}
      {submitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-icg-navy mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Submitting Application...
            </h3>
            <p className="text-sm text-gray-600">
              Please wait while we process your application
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-icg-navy mb-2">
              ICG Application
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Complete all steps to submit your application
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold transition-colors ${
                      currentStep === step
                        ? 'bg-icg-navy text-white'
                        : currentStep > step
                        ? 'bg-icg-blue text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 transition-colors ${
                        currentStep > step ? 'bg-icg-blue' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-xs sm:text-sm font-medium text-icg-navy">
              Step {currentStep} of 3
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-icg-navy mb-4 sm:mb-6">
                  Basic Information
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Please provide your personal information.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      onBlur={() => handleBlur('firstName')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-icg-navy focus:border-transparent transition-colors text-black bg-white ${
                        errors.firstName && touched.firstName
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="John"
                    />
                    {errors.firstName && touched.firstName && (
                      <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      onBlur={() => handleBlur('lastName')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-icg-navy focus:border-transparent transition-colors text-black bg-white ${
                        errors.lastName && touched.lastName
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="Doe"
                    />
                    {errors.lastName && touched.lastName && (
                      <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-icg-navy focus:border-transparent transition-colors text-black bg-white ${
                        errors.email && touched.email
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="john.doe@uci.edu"
                    />
                    {errors.email && touched.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      onBlur={() => handleBlur('phone')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-icg-navy focus:border-transparent transition-colors text-black bg-white ${
                        errors.phone && touched.phone
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="(123) 456-7890"
                    />
                    {errors.phone && touched.phone && (
                      <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  {/* Major */}
                  <div>
                    <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-2">
                      Major <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="major"
                      value={formData.major}
                      onChange={(e) => handleInputChange('major', e.target.value)}
                      onBlur={() => handleBlur('major')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-icg-navy focus:border-transparent transition-colors text-black bg-white ${
                        errors.major && touched.major
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="Computer Science"
                    />
                    {errors.major && touched.major && (
                      <p className="mt-1 text-sm text-red-500">{errors.major}</p>
                    )}
                  </div>

                  {/* Graduation Year */}
                  <div>
                    <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-2">
                      Graduation Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="graduationYear"
                      value={formData.graduationYear}
                      onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                      onBlur={() => handleBlur('graduationYear')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-icg-navy focus:border-transparent transition-colors text-black bg-white ${
                        errors.graduationYear && touched.graduationYear
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select a year</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                      <option value="2029">2029</option>
                    </select>
                    {errors.graduationYear && touched.graduationYear && (
                      <p className="mt-1 text-sm text-red-500">{errors.graduationYear}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Free Response Questions + Resume Upload */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-icg-navy mb-4 sm:mb-6">
                  Free Response Questions & Resume
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Please answer the following questions and upload your resume.
                </p>

                <div className="space-y-6 sm:space-y-8">
                  {/* Free Response Questions */}
                  {frqQuestions.length > 0 ? (
                    frqQuestions.map((question, index) => {
                      const answer = formData.frqResponses[question.id] || '';
                      const errorKey = `frq_${question.id}`;

                      return (
                        <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question {index + 1} <span className="text-red-500">*</span>
                          </label>
                          <p className="text-gray-800 mb-3">{question.question}</p>

                          <textarea
                            value={answer}
                            onChange={(e) => handleFRQChange(question.id, e.target.value, question.max_chars)}
                            rows={6}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-icg-navy focus:border-transparent transition-colors resize-none text-black bg-white ${
                              errors[errorKey] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Type your answer here..."
                          />

                          <div className="flex justify-between items-center mt-2">
                            <div>
                              {errors[errorKey] && (
                                <p className="text-sm text-red-500">{errors[errorKey]}</p>
                              )}
                            </div>
                            <p
                              className={`text-sm ${
                                answer.length >= question.max_chars
                                  ? 'text-red-500 font-semibold'
                                  : 'text-gray-500'
                              }`}
                            >
                              {answer.length} / {question.max_chars}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">
                        No questions configured. Please contact an administrator.
                      </p>
                    </div>
                  )}

                  {/* Resume Upload */}
                  <div className="border-t border-gray-200 pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resume Upload <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                      Upload your resume in PDF or DOCX format (Max size: 5MB)
                    </p>

                    <div className="space-y-3">
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-icg-navy file:text-white
                          hover:file:bg-icg-blue
                          file:cursor-pointer cursor-pointer
                          transition-colors"
                      />

                      {formData.resumeFile && (
                        <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg p-3">
                          <svg
                            className="h-5 w-5 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-sm text-green-800 font-medium">
                            {formData.resumeFile.name}
                          </span>
                          <span className="text-xs text-green-600">
                            ({(formData.resumeFile.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                      )}

                      {fileError && (
                        <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-lg p-3">
                          <svg
                            className="h-5 w-5 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-sm text-red-800">{fileError}</span>
                        </div>
                      )}

                      {errors.resume && (
                        <p className="text-sm text-red-500">{errors.resume}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Availability Selection */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-icg-navy mb-4 sm:mb-6">
                  Interview Availability
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  Please select at least 3 time slots when you would be available for an interview.
                </p>

                {/* Selected Count */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-icg-light rounded-lg border border-icg-blue">
                  <p className="text-xs sm:text-sm font-semibold text-icg-navy">
                    {formData.availableSlots.length} slot{formData.availableSlots.length !== 1 ? 's' : ''} selected
                    {formData.availableSlots.length < 3 && (
                      <span className="text-red-500 ml-2">
                        (Select at least {3 - formData.availableSlots.length} more)
                      </span>
                    )}
                  </p>
                </div>

                {/* Time Slots by Day */}
                <div className="space-y-4 sm:space-y-6">
                  {Object.keys(groupSlotsByDay()).length > 0 ? (
                    Object.entries(groupSlotsByDay()).map(([day, slots]) => (
                      <div key={day} className="border-b border-gray-200 pb-4 sm:pb-6 last:border-b-0">
                        <h3 className="text-base sm:text-lg font-semibold text-icg-navy mb-3 sm:mb-4">
                          {day}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                          {slots.map((slot) => {
                            const isSelected = formData.availableSlots.includes(slot.id);

                            return (
                              <label
                                key={slot.id}
                                className={`flex items-center p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-icg-navy bg-icg-light'
                                    : 'border-gray-300 hover:border-icg-blue bg-white'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleSlotToggle(slot.id)}
                                  className="w-4 h-4 flex-shrink-0 text-icg-navy border-gray-300 rounded focus:ring-icg-navy focus:ring-2"
                                />
                                <span
                                  className={`ml-2 sm:ml-3 text-xs sm:text-sm font-medium ${
                                    isSelected ? 'text-icg-navy' : 'text-gray-700'
                                  }`}
                                >
                                  {slot.display_label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">
                        No interview time slots available. Please contact an administrator.
                      </p>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {errors.availability && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{errors.availability}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 gap-3">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg font-semibold transition-colors ${
                  currentStep === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Back
              </button>

              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !isStep1Valid()) ||
                    (currentStep === 2 && !isStep2Valid())
                  }
                  className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg font-semibold transition-colors ${
                    (currentStep === 1 && !isStep1Valid()) ||
                    (currentStep === 2 && !isStep2Valid())
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-icg-navy hover:bg-icg-blue text-white'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!isStep3Valid() || submitting}
                  className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg font-semibold transition-colors flex items-center ${
                    !isStep3Valid() || submitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-icg-navy hover:bg-icg-blue text-white'
                  }`}
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              )}
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <svg
                  className="h-6 w-6 text-red-500 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-red-800 mb-1">
                    Submission Failed
                  </h3>
                  <p className="text-sm text-red-700">{submitError}</p>
                  <p className="text-sm text-red-600 mt-2">
                    Your form data has been preserved. Please try again.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
