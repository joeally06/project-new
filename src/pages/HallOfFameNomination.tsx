import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Phone, Building, Clock, Award, AlertCircle, X } from 'lucide-react';

interface HallOfFameSettings {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  description: string;
  nomination_instructions: string;
  eligibility_criteria: string;
  is_active: boolean;
}

export const HallOfFameNomination: React.FC = () => {
  const [formData, setFormData] = useState({
    nomineeFirstName: '',
    nomineeLastName: '',
    district: '',
    yearsOfService: '',
    isTaptMember: false,
    nominationReason: '',
    supervisorFirstName: '',
    supervisorLastName: '',
    supervisorEmail: '',
    supervisorPhone: '',
    nomineeCity: '',
    region: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  const [settings, setSettings] = useState<HallOfFameSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNominationPeriodOpen, setIsNominationPeriodOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('hall_of_fame_settings')
        .select('*')
        .eq('is_active', true)
        .maybeSingle(); // Use maybeSingle instead of single

      if (error) {
        console.error('Error fetching hall of fame settings:', error);
        setError('Failed to load settings. Please try again later.');
        return;
      }

      if (!data) {
        setError('No active nomination period is available at this time.');
        return;
      }

      setSettings(data);

      // Check if we're within the nomination period
      const now = new Date();
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      
      if (now < startDate) {
        setIsNominationPeriodOpen(false);
        setError(`Nominations open on ${startDate.toLocaleDateString()}`);
      } else if (now > endDate) {
        setIsNominationPeriodOpen(false);
        setError(`Nominations closed on ${endDate.toLocaleDateString()}`);
      } else {
        setIsNominationPeriodOpen(true);
        setError(null);
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
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'supervisorPhone') {
      // Only allow numbers and limit to 10 digits
      const numbersOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: numbersOnly
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!settings?.is_active) {
      setFormStatus({
        success: false,
        message: 'Nominations are currently closed.'
      });
      return;
    }

    if (!isNominationPeriodOpen) {
      setFormStatus({
        success: false,
        message: 'The nomination period is not currently open.'
      });
      return;
    }

    setIsSubmitting(true);
    setFormStatus({});

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL is not defined');
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/submit-hof-nomination`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            nominee_first_name: formData.nomineeFirstName,
            nominee_last_name: formData.nomineeLastName,
            district: formData.district,
            years_of_service: parseInt(formData.yearsOfService),
            is_tapt_member: formData.isTaptMember,
            nomination_reason: formData.nominationReason,
            supervisor_first_name: formData.supervisorFirstName,
            supervisor_last_name: formData.supervisorLastName,
            supervisor_email: formData.supervisorEmail,
            nominee_city: formData.nomineeCity,
            region: formData.region
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit nomination');
      }

      setFormStatus({
        success: true,
        message: 'Nomination submitted successfully!'
      });

      // Reset form
      setFormData({
        nomineeFirstName: '',
        nomineeLastName: '',
        district: '',
        yearsOfService: '',
        isTaptMember: false,
        nominationReason: '',
        supervisorFirstName: '',
        supervisorLastName: '',
        supervisorEmail: '',
        supervisorPhone: '',
        nomineeCity: '',
        region: ''
      });
    } catch (error: any) {
      console.error('Error submitting nomination:', error);
      setFormStatus({
        success: false,
        message: error.message || 'Failed to submit nomination. Please try again.'
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

  if (!settings?.is_active || !isNominationPeriodOpen) {
    return (
      <div className="pt-16">
        <section className="bg-secondary text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 fade-in">Hall of Fame Nomination</h1>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <Award className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-secondary mb-4">The Nomination Process is Closed</h2>
              <p className="text-gray-600">
                {error || 'Thank you for your interest in the TAPT Hall of Fame. The nomination period has ended. Please check back later for the next nomination period.'}
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-16">
      <section className="bg-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 fade-in">{settings.name}</h1>
            <p className="text-xl text-gray-200 mb-8 fade-in">{settings.description}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {settings.nomination_instructions && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Nomination Instructions</h3>
              <p className="text-blue-700">{settings.nomination_instructions}</p>
            </div>
          )}

          {settings.eligibility_criteria && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Eligibility Criteria</h3>
              <p className="text-gray-700">{settings.eligibility_criteria}</p>
            </div>
          )}

          {formStatus.message && (
            <div className={`mb-8 p-4 rounded-md ${formStatus.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {formStatus.success ? (
                    <svg className="h-5 w-5 text-green-400\" viewBox="0 0 20 20\" fill="currentColor">
                      <path fillRule="evenodd\" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z\" clipRule="evenodd" />
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
            {/* Nominee Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-secondary mb-6">Nominee Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label htmlFor="nomineeFirstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="nomineeFirstName"
                      name="nomineeFirstName"
                      value={formData.nomineeFirstName}
                      onChange={handleChange}
                      required
                      className="pl-10 block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="nomineeLastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="nomineeLastName"
                      name="nomineeLastName"
                      value={formData.nomineeLastName}
                      onChange={handleChange}
                      required
                      className="pl-10 block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                    />
                  </div>
                </div>

                {/* District */}
                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                    School District/Organization <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      required
                      className="pl-10 block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                    />
                  </div>
                </div>

                {/* Years of Service */}
                <div>
                  <label htmlFor="yearsOfService" className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Service <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="yearsOfService"
                      name="yearsOfService"
                      value={formData.yearsOfService}
                      onChange={handleChange}
                      required
                      min="0"
                      className="pl-10 block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label htmlFor="nomineeCity" className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nomineeCity"
                    name="nomineeCity"
                    value={formData.nomineeCity}
                    onChange={handleChange}
                    required
                    className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                  />
                </div>

                {/* Region */}
                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                    Region <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="region"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    required
                    className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                  >
                    <option value="">Select Region</option>
                    <option value="East">East Tennessee</option>
                    <option value="Middle">Middle Tennessee</option>
                    <option value="West">West Tennessee</option>
                  </select>
                </div>
              </div>

              {/* TAPT Member */}
              <div className="mt-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isTaptMember"
                    name="isTaptMember"
                    checked={formData.isTaptMember}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="isTaptMember" className="ml-2 block text-sm text-gray-700">
                    TAPT Member
                  </label>
                </div>
              </div>

              {/* Nomination Reason */}
              <div className="mt-6">
                <label htmlFor="nominationReason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Nomination (max 500 characters) <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="nominationReason"
                  name="nominationReason"
                  value={formData.nominationReason}
                  onChange={handleChange}
                  required
                  maxLength={500}
                  rows={4}
                  className="block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                  placeholder="Please provide a brief description of why this person deserves to be nominated (max 500 characters)..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.nominationReason.length}/500 characters
                </p>
              </div>
            </div>

            {/* Nominator Information */}
            <div>
              <h2 className="text-2xl font-bold text-secondary mb-6">Nominator Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label htmlFor="supervisorFirstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="supervisorFirstName"
                      name="supervisorFirstName"
                      value={formData.supervisorFirstName}
                      onChange={handleChange}
                      required
                      className="pl-10 block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="supervisorLastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="supervisorLastName"
                      name="supervisorLastName"
                      value={formData.supervisorLastName}
                      onChange={handleChange}
                      required
                      className="pl-10 block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="supervisorEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="supervisorEmail"
                      name="supervisorEmail"
                      value={formData.supervisorEmail}
                      onChange={handleChange}
                      required
                      className="pl-10 block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="supervisorPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      id="supervisorPhone"
                      name="supervisorPhone"
                      value={formData.supervisorPhone}
                      onChange={handleChange}
                      required
                      pattern="[0-9]{10}"
                      maxLength={10}
                      placeholder="1234567890"
                      title="Please enter a valid 10-digit phone number"
                      className="pl-10 block w-full shadow-sm focus:ring-primary focus:border-primary rounded-md border-gray-300"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Enter 10 digits without spaces or special characters</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                      <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <Award className="mr-2 h-5 w-5" />
                    Submit Nomination
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default HallOfFameNomination;