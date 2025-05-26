import { supabase } from './supabase';

export interface SearchOptions {
  type?: string;
  status?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

/**
 * Search content using the database's full-text search capabilities
 * @param searchTerm The text to search for
 * @param options Optional filters and pagination
 * @returns Search results
 */
export async function searchContent(searchTerm: string, options: SearchOptions = {}) {
  try {
    // If search term is empty, use regular select with filters
    if (!searchTerm.trim()) {
      let query = supabase.from('content').select('*');
      
      if (options.type) {
        query = query.eq('type', options.type);
      }
      
      if (options.status) {
        query = query.eq('status', options.status);
      }
      
      if (options.category) {
        query = query.eq('category', options.category);
      }
      
      // Add pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      // Order by created_at
      query = query.order('created_at', { ascending: false });
      
      return await query;
    }
    
    // Use the RPC function for full-text search
    if (options.type || options.status || options.category) {
      return await supabase.rpc('search_content_filtered', {
        search_term: searchTerm,
        content_type: options.type || null,
        content_status: options.status || null,
        content_category: options.category || null
      });
    } else {
      return await supabase.rpc('search_content', {
        search_term: searchTerm
      });
    }
  } catch (error) {
    console.error('Error searching content:', error);
    throw error;
  }
}