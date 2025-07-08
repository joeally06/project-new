import React, { useState, useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { supabase } from '../lib/supabase';
import { Mail, Phone, MapPin, User, Calendar, GraduationCap, School, FileText, AlertCircle } from 'lucide-react';

interface ScholarshipSettings {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  application_deadline: string;
  description: string;
  eligibility_criteria: string;
  instructions: string;
  is_active: boolean;
}

const StudentScholarshipApplication: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: {
      first: '',
      last: ''
    },
    birthdate: '',
    gender: '',
    isUsCitizen: false,
    isFirstGen: false,
    applicationStatus: 'pending',
    majorArea: '',
    careerObjective: '',
    highSchool: '',
    schoolDistrict: '',
    graduationYear: '',
    gpa: '',
    activities: '',
    actYear: '',
    actScore: '',
    essay: '',
    homeAddress: {
      addr_line1: '',
      addr_line2: '',
      city: '',
      state: '',
      postal: ''
    },
    mobilePhone: '',
    email: '',
    signature: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  const [scholarshipSettings, setScholarshipSettings] = useState<ScholarshipSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplicationClosed, setIsApplicationClosed] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchScholarshipSettings();
  }, []);

  const fetchScholarshipSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_scholarship_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching scholarship settings:', error);
        setError('Failed to load scholarship settings. Please try again later.');
        return;
      }

      if (!data) {
        setError('No active scholarship application is available at this time.');
        setIsApplicationClosed(true);
        return;
      }

      setScholarshipSettings(data);

      // Check if application deadline has passed
      if (data.application_deadline) {
        const deadlineDate = new Date(data.application_deadline);
        const now = new Date();
        
        if (now > deadlineDate) {
          setIsApplicationClosed(true);
          setError(`Application deadline was ${deadlineDate.toLocaleDateString()}`);
        } else {
          setIsApplicationClosed(false);
          setError(null);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleTurnstileSuccess = (token: string) => {
    setTurnstileToken(token);
    setTurnstileError(false);
  };

  const handleTurnstileError = () => {
    setTurnstileToken(null);
    setTurnstileError(true);
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scholarshipSettings?.is_active) {
      setFormStatus({
        success: false,
        message: 'Scholarship application is not currently available.'
      });
      return;
    }

    if (isApplicationClosed) {
      setFormStatus({
        success: false,
        message: 'Application deadline has passed.'
      });
      return;
    }

    if (!turnstileToken) {
      setFormStatus({
        success: false,
        message: 'Please complete the security verification.'
      });
      return;
    }

    setIsSubmitting(true);
    setFormStatus({});

    try {
      // Get the Supabase URL from environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('SUPABASE_URL environment variable is not defined');
      }

      // Make the request to the Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/submit-student-scholarship-application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          ...formData,
          captchaToken: turnstileToken
        })
      });

      // Check if the request was successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit application');
      }

      setFormStatus({
        success: true,
        message: 'Application submitted successfully! We will review your application and contact you soon.'
      });
      
      // Reset form
      setFormData({
        fullName: {
          first: '',
          last: ''
        },
        birthdate: '',
        gender: '',
        isUsCitizen: false,
        isFirstGen: false,
        applicationStatus: 'pending',
        majorArea: '',
        careerObjective: '',
        highSchool: '',
        schoolDistrict: '',
        graduationYear: '',
        gpa: '',
        activities: '',
        actYear: '',
        actScore: '',
        essay: '',
        homeAddress: {
          addr_line1: '',
          addr_line2: '',
          city: '',
          state: '',
          postal: ''
        },
        mobilePhone: '',
        email: '',
        signature: ''
      });
    } catch (error: any) {
      console.error('Error submitting application:', error);
      setFormStatus({
        success: false,
        message: `Error submitting application: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="bg-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 fade-in">Student Scholarship Application</h1>
            <p className="text-xl text-gray-200 mb-8 fade-in">Apply for the {scholarshipSettings?.name || 'TAPT Student Scholarship'} to support your education in transportation-related fields.</p>
          </div>
        </div>
      </section>

      {/* Scholarship Info */}
      {!isApplicationClosed && scholarshipSettings?.is_active && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-8 md:p-10">
                <h2 className="text-3xl font-bold text-secondary mb-6">{scholarshipSettings?.name || 'TAPT Student Scholarship'}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-xl font-semibold text-primary mb-4">Scholarship Details</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <span className="flex-shrink-0 h-6 w-6 text-primary mr-2">
                          <Calendar className="h-6 w-6" />
                        </span>
                        <div>
                          <span className="font-medium">Application Period:</span>
                          <p>{new Date(scholarshipSettings?.start_date || '').toLocaleDateString()} - {new Date(scholarshipSettings?.end_date || '').toLocaleDateString()}</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="flex-shrink-0 h-6 w-6 text-primary mr-2">
                          <AlertCircle className="h-6 w-6" />
                        </span>
                        <div>
                          <span className="font-medium">Application Deadline:</span>
                          <p className="text-red-600 font-medium">{new Date(scholarshipSettings?.application_deadline || '').toLocaleDateString()}</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-primary mb-4">Eligibility</h3>
                    <div className="prose prose-sm">
                      <p>{scholarshipSettings?.eligibility_criteria}</p>
                    </div>
                  </div>
                </div>

                {scholarshipSettings?.description && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-700">{scholarshipSettings.description}</p>
                  </div>
                )}

                {scholarshipSettings?.instructions && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-md">
                    <h4 className="font-medium text-blue-800 mb-2">Application Instructions</h4>
                    <p className="text-blue-700">{scholarshipSettings.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Application Form */}
      {isApplicationClosed || !scholarshipSettings?.is_active ? (
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <GraduationCap className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-secondary mb-4">Scholarship Application is Closed</h2>
              <p className="text-gray-600">
                Thank you for your interest in the TAPT Scholarship. The application period has ended. 
                Please check back later for future scholarship opportunities.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {formStatus.message && (
              <div className={`mb-8 p-4 rounded-md ${formStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {formStatus.success ? (
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm ${formStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                      {formStatus.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-8">
              {/* Personal Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-secondary mb-6">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fullName.first" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="fullName.first"
                        name="fullName.first"
                        value={formData.fullName.first}
                        onChange={handleChange}
                        required
                        className="pl-10 block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="fullName.last" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="fullName.last"
                        name="fullName.last"
                        value={formData.fullName.last}
                        onChange={handleChange}
                        required
                        className="pl-10 block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        id="birthdate"
                        name="birthdate"
                        value={formData.birthdate}
                        onChange={handleChange}
                        required
                        className="pl-10 block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isUsCitizen"
                      name="isUsCitizen"
                      checked={formData.isUsCitizen}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="isUsCitizen" className="ml-2 block text-sm text-gray-700">
                      U.S. Citizen
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isFirstGen"
                      name="isFirstGen"
                      checked={formData.isFirstGen}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="isFirstGen" className="ml-2 block text-sm text-gray-700">
                      First Generation College Student
                    </label>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-secondary mb-6">Academic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="highSchool" className="block text-sm font-medium text-gray-700 mb-1">
                      High School <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <School className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="highSchool"
                        name="highSchool"
                        value={formData.highSchool}
                        onChange={handleChange}
                        required
                        className="pl-10 block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="schoolDistrict" className="block text-sm font-medium text-gray-700 mb-1">
                      School District <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="schoolDistrict"
                      name="schoolDistrict"
                      value={formData.schoolDistrict}
                      onChange={handleChange}
                      required
                      className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                    />
                  </div>

                  <div>
                    <label htmlFor="graduationYear" className="block text-sm font-medium text-gray-700 mb-1">
                      Graduation Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="graduationYear"
                      name="graduationYear"
                      value={formData.graduationYear}
                      onChange={handleChange}
                      required
                      className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                      placeholder="YYYY"
                    />
                  </div>

                  <div>
                    <label htmlFor="gpa" className="block text-sm font-medium text-gray-700 mb-1">
                      GPA
                    </label>
                    <input
                      type="text"
                      id="gpa"
                      name="gpa"
                      value={formData.gpa}
                      onChange={handleChange}
                      className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                      placeholder="e.g., 3.8"
                    />
                  </div>

                  <div>
                    <label htmlFor="majorArea" className="block text-sm font-medium text-gray-700 mb-1">
                      Intended Major/Area of Study
                    </label>
                    <input
                      type="text"
                      id="majorArea"
                      name="majorArea"
                      value={formData.majorArea}
                      onChange={handleChange}
                      className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                    />
                  </div>

                  <div>
                    <label htmlFor="careerObjective" className="block text-sm font-medium text-gray-700 mb-1">
                      Career Objective
                    </label>
                    <input
                      type="text"
                      id="careerObjective"
                      name="careerObjective"
                      value={formData.careerObjective}
                      onChange={handleChange}
                      className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="activities" className="block text-sm font-medium text-gray-700 mb-1">
                    Extracurricular Activities & Achievements
                  </label>
                  <textarea
                    id="activities"
                    name="activities"
                    value={formData.activities}
                    onChange={handleChange}
                    rows={3}
                    className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                    placeholder="List your activities, honors, awards, and leadership positions..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label htmlFor="actYear" className="block text-sm font-medium text-gray-700 mb-1">
                      ACT/SAT Test Year
                    </label>
                    <input
                      type="text"
                      id="actYear"
                      name="actYear"
                      value={formData.actYear}
                      onChange={handleChange}
                      className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                      placeholder="YYYY"
                    />
                  </div>

                  <div>
                    <label htmlFor="actScore" className="block text-sm font-medium text-gray-700 mb-1">
                      ACT/SAT Score
                    </label>
                    <input
                      type="text"
                      id="actScore"
                      name="actScore"
                      value={formData.actScore}
                      onChange={handleChange}
                      className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Essay */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-secondary mb-6">Essay</h2>
                <div>
                  <label htmlFor="essay" className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Statement <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    In 300-500 words, please describe your educational and career goals, why you are interested in transportation, and how this scholarship will help you achieve your goals.
                  </p>
                  <textarea
                    id="essay"
                    name="essay"
                    value={formData.essay}
                    onChange={handleChange}
                    required
                    rows={8}
                    className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Word count: {formData.essay.trim().split(/\s+/).filter(Boolean).length}/500
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-secondary mb-6">Contact Information</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="homeAddress.addr_line1" className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="homeAddress.addr_line1"
                        name="homeAddress.addr_line1"
                        value={formData.homeAddress.addr_line1}
                        onChange={handleChange}
                        required
                        className="pl-10 block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="homeAddress.addr_line2" className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address Line 2
                    </label>
                    <input
                      type="text"
                      id="homeAddress.addr_line2"
                      name="homeAddress.addr_line2"
                      value={formData.homeAddress.addr_line2}
                      onChange={handleChange}
                      className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="homeAddress.city" className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="homeAddress.city"
                        name="homeAddress.city"
                        value={formData.homeAddress.city}
                        onChange={handleChange}
                        required
                        className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                      />
                    </div>

                    <div>
                      <label htmlFor="homeAddress.state" className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="homeAddress.state"
                        name="homeAddress.state"
                        value={formData.homeAddress.state}
                        onChange={handleChange}
                        required
                        className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                      >
                        <option value="">Select State</option>
                        <option value="TN">Tennessee</option>
                        <option value="AL">Alabama</option>
                        <option value="GA">Georgia</option>
                        <option value="KY">Kentucky</option>
                        <option value="MS">Mississippi</option>
                        <option value="NC">North Carolina</option>
                        <option value="VA">Virginia</option>
                        {/* Add other states as needed */}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="homeAddress.postal" className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="homeAddress.postal"
                        name="homeAddress.postal"
                        value={formData.homeAddress.postal}
                        onChange={handleChange}
                        required
                        className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="mobilePhone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          id="mobilePhone"
                          name="mobilePhone"
                          value={formData.mobilePhone}
                          onChange={handleChange}
                          required
                          className="pl-10 block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="pl-10 block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certification */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-secondary mb-6">Certification</h2>
                <div>
                  <label htmlFor="signature" className="block text-sm font-medium text-gray-700 mb-1">
                    Electronic Signature <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    By typing your full name below, you certify that all information provided in this application is true and accurate to the best of your knowledge.
                  </p>
                  <input
                    type="text"
                    id="signature"
                    name="signature"
                    value={formData.signature}
                    onChange={handleChange}
                    required
                    className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                    placeholder="Type your full name"
                  />
                </div>
              </div>

              {/* Turnstile CAPTCHA */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-secondary mb-6">Security Verification</h2>
                <div className="flex flex-col items-center">
                  <Turnstile
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                    onSuccess={handleTurnstileSuccess}
                    onError={handleTurnstileError}
                    onExpire={handleTurnstileExpire}
                    options={{
                      theme: 'light',
                      size: 'normal',
                      refreshExpired: 'auto'
                    }}
                  />
                  {turnstileError && (
                    <p className="mt-2 text-sm text-center text-red-600">Security verification failed. Please try again.</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500 text-center">Please complete the security verification above before submitting.</p>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !turnstileToken}
                  className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-5 w-5" />
                      Submit Application
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
    </div>
  );
};

export default StudentScholarshipApplication;