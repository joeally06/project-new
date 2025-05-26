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
    
    // For simple search, use ILIKE for both title and description
    let query = supabase
      .from('content')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    
    // Apply filters
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
  } catch (error) {
    console.error('Error searching content:', error);
    throw error;
  }
}

/**
 * Search resources using the database's full-text search capabilities
 * @param searchTerm The text to search for
 * @param category Optional category filter
 * @param options Optional pagination
 * @returns Search results
 */
export async function searchResources(searchTerm: string, category?: string, options: { limit?: number; offset?: number } = {}) {
  try {
    // If search term is empty, use regular select with filters
    if (!searchTerm.trim()) {
      let query = supabase.from('resources').select('*');
      
      if (category && category !== 'all') {
        query = query.eq('category', category);
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
    
    // For simple search, use ILIKE for both title and description
    let query = supabase
      .from('resources')
      .select('*')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    
    // Apply category filter
    if (category && category !== 'all') {
      query = query.eq('category', category);
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
  } catch (error) {
    console.error('Error searching resources:', error);
    throw error;
  }
}