import { useState, useEffect } from 'react';
import { testSupabaseConnection, supabase } from '../lib/supabase';

const SupabaseConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
    error?: any;
  }>({
    tested: false
  });

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Starting connection test...');
        const result = await testSupabaseConnection();
        
        if (result.success) {
          setConnectionStatus({
            tested: true,
            success: true,
            message: 'Successfully connected to database'
          });
        } else {
          console.error('Connection test failed:', result.error);
          setConnectionStatus({
            tested: true,
            success: false,
            message: 'Unable to connect to the database. Please try again later.',
            error: {
              networkBlocked: result.error?.message?.includes('Failed to fetch') || 
                            result.error?.message?.includes('Network request failed')
            }
          });
        }
      } catch (error) {
        console.error('Error in test component:', error);
        setConnectionStatus({
          tested: true,
          success: false,
          message: 'An unexpected error occurred. Please try again later.',
          error: { networkBlocked: false }
        });
      }
    };

    testConnection();
  }, []);

  return (
    <div className="fixed bottom-16 right-4 p-6 max-w-md bg-white rounded-lg shadow-md z-50">
      <h2 className="text-2xl font-bold text-secondary mb-4">Connection Status</h2>
      {!connectionStatus.tested ? (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-t-4 border-primary rounded-full animate-spin"></div>
          <span className="ml-2">Testing connection...</span>
        </div>
      ) : connectionStatus.success ? (
        <div className="bg-green-100 border-l-4 border-green-500 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm leading-5 font-medium text-green-800">
                {connectionStatus.message}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-100 border-l-4 border-red-500 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm leading-5 font-medium text-red-800">
                {connectionStatus.message}
              </p>
              {connectionStatus.error?.networkBlocked && (
                <div className="mt-2 text-sm bg-red-50 p-3 rounded">
                  <p className="font-semibold">Connection Issue Detected</p>
                  <p>We're having trouble connecting to our services. This might be due to:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Network connectivity issues</li>
                    <li>Firewall or security settings</li>
                    <li>Temporary service disruption</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Configuration Status</h3>
        <div className="bg-gray-100 p-3 rounded">
          <p className="mb-1"><strong>Database URL:</strong> {import.meta.env.VITE_SUPABASE_URL ? '✓ Configured' : '✗ Missing'}</p>
          <p><strong>API Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Configured' : '✗ Missing'}</p>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionTest;