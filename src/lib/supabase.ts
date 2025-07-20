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
};

export async function fetchArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('article_date', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }

  return data as Article[];
}
