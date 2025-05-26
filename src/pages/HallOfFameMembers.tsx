import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Award, MapPin, Globe, Mail } from 'lucide-react';

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

export const HallOfFameMembers: React.FC = () => {
  const [members, setMembers] = useState<HallOfFameMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

  useEffect(() => {
    fetchMembers();
  }, []);

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

  const inductionYears = [...new Set(members.map(member => member.induction_year))].sort((a, b) => b - a);
  
  const filteredMembers = selectedYear === 'all' 
    ? members 
    : members.filter(member => member.induction_year === selectedYear);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="bg-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Hall of Fame</h1>
            <p className="text-xl text-gray-200">
              Honoring excellence in pupil transportation across Tennessee.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">Filter by Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            >
              <option value="all">All Years</option>
              {inductionYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Members Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Members Found</h3>
              <p className="mt-1 text-gray-500">There are no Hall of Fame members for the selected criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMembers.map((member) => (
                <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all">
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
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-secondary">{member.name}</h3>
                      <p className="text-primary font-medium">{member.title}</p>
                      {member.organization && (
                        <p className="text-gray-600">{member.organization}</p>
                      )}
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

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Achievements</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        {member.achievements.map((achievement, index) => (
                          <li key={index}>{achievement}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-gray-600">{member.bio}</p>
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
          )}
        </div>
      </section>
    </div>
  );
};

export default HallOfFameMembers;