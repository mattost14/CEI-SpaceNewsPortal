import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type for the articles table
export type Article = {
  id: string;
  title: string;
  article_text: string;
  article_date: string;
  source_url: string | null;
  main_image_url: string | null;
  tags: string[] | null;
  created_at: string;
  sentiment: string | null;
};

export interface ArticleSearchParams {
  limit?: number;
  offset?: number;
  searchTerm?: string;
  sentiment?: string | null;
  startDate?: string;
  endDate?: string;
}

export async function fetchArticles({
  limit = 5,
  offset = 0,
  searchTerm = '',
  sentiment = null,
  startDate = '',
  endDate = ''
}: ArticleSearchParams = {}) {
  let query = supabase
    .from('articles')
    .select('*')
    .order('article_date', { ascending: false })
    .order('created_at', { ascending: false });
  
  // Apply search term filter if provided
  if (searchTerm && searchTerm.trim() !== '') {
    query = query.or(`title.ilike.%${searchTerm}%,article_text.ilike.%${searchTerm}%`);
  }
  
  // Apply sentiment filter if provided
  if (sentiment) {
    if (sentiment === 'neutral') {
      // For neutral sentiment, include both 'neutral' and null values
      query = query.or('sentiment.is.null,sentiment.eq.neutral');
    } else if (sentiment !== 'all') {
      query = query.eq('sentiment', sentiment);
    }
  }
  
  // Apply date range filters if provided
  if (startDate) {
    console.log('Filtering by start date:', startDate);
    query = query.gte('article_date', startDate);
  }
  
  if (endDate) {
    console.log('Filtering by end date:', endDate);
    query = query.lte('article_date', endDate);
  }
  
  // Debug log for the final query
  console.log('Final query params:', { searchTerm, sentiment, startDate, endDate, offset, limit });
  
  // Apply pagination
  const { data, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }

  return data as Article[];
}
