import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Archive, Search, Download, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ArchiveItem {
  id: string;
  archive_id: string;
  archived_at: string;
  [key: string]: any;
}

export const AdminArchives: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiveType, setArchiveType] = useState<'conference' | 'tech-conference' | 'hall-of-fame'>('conference');
  const [archives, setArchives] = useState<Record<string, ArchiveItem[]>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/admin/login');
        return;
      }
      if (user.role !== 'admin') {
        navigate('/');
        return;
      }
      fetchArchives();
    }
    // eslint-disable-next-line
  }, [authLoading, user]);

  const fetchArchives = async () => {
    try {
      setLoading(true);
      setError(null);

      const tables = {
        conference: 'conference_registrations_archive',
        'tech-conference': 'tech_conference_registrations_archive',
        'hall-of-fame': 'hall_of_fame_nominations_archive'
      };

      const archiveData: Record<string, ArchiveItem[]> = {};

      for (const [key, table] of Object.entries(tables)) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('archived_at', { ascending: false });

        if (error) throw error;

        // Group by archive_id
        const grouped = (data || []).reduce((acc: Record<string, ArchiveItem[]>, item) => {
          const archiveId = item.archive_id;
          if (!acc[archiveId]) {
            acc[archiveId] = [];
          }
          acc[archiveId].push(item);
          return acc;
        }, {});

        archiveData[key] = Object.values(grouped).flat();
      }

      setArchives(archiveData);
    } catch (error: any) {
      console.error('Error fetching archives:', error);
      setError('Failed to load archives');
    } finally {
      setLoading(false);
    }
  };

  const exportArchive = (archiveId: string) => {
    const archiveItems = archives[archiveType].filter(item => item.archive_id === archiveId);
    const csvContent = convertToCSV(archiveItems);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${archiveType}-archive-${archiveId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const convertToCSV = (items: ArchiveItem[]) => {
    if (items.length === 0) return '';
    
    const headers = Object.keys(items[0])
      .filter(key => !['id', 'archive_id'].includes(key))
      .join(',');
      
    const rows = items.map(item => 
      Object.entries(item)
        .filter(([key]) => !['id', 'archive_id'].includes(key))
        .map(([_, value]) => `"${value}"`)
        .join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const getArchiveTitle = (type: string) => {
    switch (type) {
      case 'conference':
        return 'Conference Registrations';
      case 'tech-conference':
        return 'Tech Conference Registrations';
      case 'hall-of-fame':
        return 'Hall of Fame Nominations';
      default:
        return '';
    }
  };

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
            <h1 className="text-3xl font-bold">Archives</h1>
          </div>
          <p className="mt-2">View and manage archived data</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Archive Type Selector */}
        <div className="mb-6">
          <div className="flex space-x-4">
            {[
              { id: 'conference', label: 'Conference' },
              { id: 'tech-conference', label: 'Tech Conference' },
              { id: 'hall-of-fame', label: 'Hall of Fame' }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setArchiveType(type.id as typeof archiveType)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  archiveType === type.id
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search archives..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
          </div>
        </div>

        {/* Archives List */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Loading archives...</p>
            </div>
          ) : archives[archiveType]?.length === 0 ? (
            <div className="p-8 text-center">
              <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Archives Found</h3>
              <p className="mt-1 text-gray-500">There are no archived {getArchiveTitle(archiveType).toLowerCase()} yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Archive Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(
                    archives[archiveType].reduce((acc: Record<string, ArchiveItem[]>, item) => {
                      if (!acc[item.archive_id]) {
                        acc[item.archive_id] = [];
                      }
                      acc[item.archive_id].push(item);
                      return acc;
                    }, {})
                  ).map(([archiveId, items]) => (
                    <tr key={archiveId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(items[0].archived_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {items.length} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => exportArchive(archiveId)}
                          className="text-primary hover:text-primary/80"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminArchives;