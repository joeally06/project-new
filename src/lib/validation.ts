import { supabase } from './supabase';

export interface ValidationError {
  field: string;
  message: string;
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  // Allows formats: (123) 456-7890, 123-456-7890, 1234567890
  const phoneRegex = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phone;
};

export interface MembershipFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  organization: string;
  position: string;
  membership_type: string;
  is_new_member: string;
  hear_about_us: string | null;
  interests: string[];
  agree_to_terms: boolean;
}

export const validateMembershipForm = (data: MembershipFormData): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.first_name.trim()) {
    errors.push({ field: 'first_name', message: 'First name is required' });
  }

  if (!data.last_name.trim()) {
    errors.push({ field: 'last_name', message: 'Last name is required' });
  }

  if (!data.email.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  if (!data.phone) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  } else if (!isValidPhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Please enter a valid phone number' });
  }

  if (!data.organization.trim()) {
    errors.push({ field: 'organization', message: 'Organization is required' });
  }

  if (!data.position.trim()) {
    errors.push({ field: 'position', message: 'Position is required' });
  }

  if (!data.membership_type) {
    errors.push({ field: 'membership_type', message: 'Please select a membership type' });
  }

  if (!data.is_new_member) {
    errors.push({ field: 'is_new_member', message: 'Please indicate if you are a new member' });
  }

  if (!data.agree_to_terms) {
    errors.push({ field: 'agree_to_terms', message: 'You must agree to the terms and conditions' });
  }

  if (data.interests.length === 0) {
    errors.push({ field: 'interests', message: 'Please select at least one area of interest' });
  }

  return errors;
};