import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Award, MapPin, Globe, Mail, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';

interface HallOfFameMember {
  id: string;
  name: string;
  title: string;
  role: string | null;
  organization: string | null;
  location: string | null;
  contact_info: {
    email?: string;
    phone?: string;
  } | null;
  image_url: string | null;
  website: string | null;
  notes: string | null;
  term: string | null;
  induction_year: number;
  achievements: string[];
  bio: string;
}

export const AdminHallOfFameMembers: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<HallOfFameMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<HallOfFameMember>>({
    name: '',
    title: '',
    role: '',
    organization: '',
    location: '',
    contact_info: {
      email: '',
      phone: ''
    },
    image_url: '',
    website: '',
    notes: '',
    term: '',
    induction_year: new Date().getFullYear(),
    achievements: [],
    bio: ''
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session) {
        navigate('/admin/login');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userError) throw userError;

      if (!userData || userData.role !== 'admin') {
        await supabase.auth.signOut();
        navigate('/admin/login');
        return;
      }

      fetchMembers();
    } catch (error) {
      console.error('Session check error:', error);
      navigate('/admin/login');
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hall_of_fame_members')
        .select('*')
        .order('induction_year', { ascending: false });

      if (error) throw error;

      setMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching members:', error);
      setError('Failed to load Hall of Fame members');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('hall_of_fame_members')
        .insert([formData]);

      if (error) throw error;

      setSuccess('Member added successfully!');
      setShowForm(false);
      setFormData({
        name: '',
        title: '',
        role: '',
        organization: '',
        location: '',
        contact_info: {
          email: '',
          phone: ''
        },
        image_url: '',
        website: '',
        notes: '',
        term: '',
        induction_year: new Date().getFullYear(),
        achievements: [],
        bio: ''
      });
      fetchMembers();
    } catch (error: any) {
      console.error('Error adding member:', error);
      setError('Failed to add member');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      const { error } = await supabase
        .from('hall_of_fame_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Member deleted successfully!');
      fetchMembers();
    } catch (error: any) {
      console.error('Error deleting member:', error);
      setError('Failed to delete member');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/admin')}
              className="inline-flex items-center text-white hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="h-6 w-6 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold">Manage Hall of Fame Members</h1>
          </div>
          <p className="mt-2">Add, edit, or remove Hall of Fame members</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Add Member Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Member
          </button>
        </div>

        {/* Add Member Form */}
        {showForm && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-secondary mb-6">Add New Member</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Organization</label>
                  <input
                    type="text"
                    value={formData.organization || ''}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.contact_info?.email || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      contact_info: { ...formData.contact_info, email: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  <input
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Image URL</label>
                  <input
                    type="url"
                    value={formData.image_url || ''}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Induction Year</label>
                  <input
                    type="number"
                    value={formData.induction_year}
                    onChange={(e) => setFormData({ ...formData, induction_year: parseInt(e.target.value) })}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>

              {/* Achievements */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Achievements</label>
                <textarea
                  value={formData.achievements?.join('\n')}
                  onChange={(e) => setFormData({ ...formData, achievements: e.target.value.split('\n').filter(Boolean) })}
                  required
                  rows={4}
                  placeholder="Enter each achievement on a new line"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Biography</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  required
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Members List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {members.map((member) => (
            <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {member.image_url ? (
                <img 
                  src={member.image_url} 
                  alt={member.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <Award className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-secondary">{member.name}</h3>
                    <p className="text-primary font-medium">{member.title}</p>
                    {member.organization && (
                      <p className="text-gray-600">{member.organization}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {member.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{member.location}</span>
                    </div>
                  )}
                  {member.contact_info?.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      <a href={`mailto:${member.contact_info.email}`} className="hover:text-primary">
                        {member.contact_info.email}
                      </a>
                    </div>
                  )}
                  {member.website && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      <a href={member.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Inducted: {member.induction_year}
                    {member.term && ` • ${member.term}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminHallOfFameMembers;