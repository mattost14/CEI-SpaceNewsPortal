import React, { useState, useEffect, useCallback } from 'react';
import { List, LayoutGrid, Loader2 } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import NewsListView from './NewsListView';
import NewsSearchFilter from './NewsSearchFilter';
import NewsCarousel from './NewsCarousel';
import { supabase, fetchArticles, Article, ArticleSearchParams } from '@/lib/supabase';

// Constants
const CAROUSEL_NEWS_COUNT: number = 10;

interface NewsItem {
  id: string;
  date: string;
  title: string;
  text: string;
  source: string | null;
  main_image: string | null;
  sentiment: string | null;
}

const mapArticleToNewsItem = (article: Article): NewsItem => ({
  id: article.id,
  date: article.article_date,
  title: article.title,
  text: article.article_text,
  source: article.source_url,
  main_image: article.main_image_url,
  sentiment: article.sentiment
});

const SpaceNewsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isListView, setIsListView] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [carouselNews, setCarouselNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<ArticleSearchParams>({});
  
  // Function to load articles
  const loadArticles = useCallback(async (params: ArticleSearchParams = {}) => {
    try {
      console.log('Loading articles with params:', params);
      setIsLoading(true);
      const articles = await fetchArticles({...params, limit: CAROUSEL_NEWS_COUNT});
      const newsItems = articles.map(mapArticleToNewsItem);
      setNews(newsItems); 
      setCarouselNews(newsItems.slice(0, CAROUSEL_NEWS_COUNT)); 
      setError(null);
      
      // Update hasMore based on whether we got a full page of results
      setHasMore(articles.length >= 5);
    } catch (err) {
      console.error('Error loading articles:', err);
      setError('Failed to load articles. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);  // No dependencies needed as we're using external functions
  
  // Initial load of articles
  useEffect(() => {
    loadArticles();
  }, [loadArticles]);  // Include loadArticles as dependency since it's stable with empty deps array
  
  // Set up real-time subscription
useEffect(() => {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return;
  }

  let retryCount = 0;
  const maxRetries = 5;
  let retryTimeout: NodeJS.Timeout;
  let subscription: ReturnType<typeof supabase.channel> | null = null;

  const setupSubscription = async () => {
    console.log('Setting up Supabase real-time subscription for articles update...');
    
    try {
      // Clean up any existing subscription
      if (subscription) {
        supabase.removeChannel(subscription);
      }

      subscription = supabase
        .channel('articles-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'articles',
          },
          (payload) => {
            console.log('Change detected in articles table:', payload.eventType);
            loadArticles();
          }
        )
        .on('broadcast', { event: 'heartbeat' }, () => {
          console.log('Heartbeat received');
        })
        .subscribe((status, err) => {
          console.log('Subscription status:', status);
          
          if (status === 'CHANNEL_ERROR') {
            // Attempt to reconnect with exponential backoff
            if (retryCount < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30s delay
              console.log(`Reconnecting in ${delay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
              retryTimeout = setTimeout(() => {
                retryCount++;
                setupSubscription();
              }, delay);
            } else {
              console.error('Max reconnection attempts reached. Please refresh the page.');
            }
          } else if (status === 'SUBSCRIBED') {
            // Reset retry count on successful connection
            retryCount = 0;
          }
        });

    } catch (error) {
      console.error('Error setting up subscription:', error);
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        console.log(`Retrying subscription in ${delay}ms...`);
        retryTimeout = setTimeout(() => {
          retryCount++;
          setupSubscription();
        }, delay);
      }
    }
  };

  // Initial setup
  setupSubscription();

  // Cleanup function
  return () => {
    console.log('Cleaning up Supabase subscription');
    if (subscription) {
      supabase.removeChannel(subscription);
    }
    if (retryTimeout) {
      clearTimeout(retryTimeout);
    }
  };
}, [loadArticles]);  // Add loadArticles as dependency

  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [fontSizeIndex, setFontSizeIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const fontSizes = [
    'text-sm lg:text-base xl:text-lg 2xl:text-xl',
    'text-base lg:text-lg xl:text-xl 2xl:text-2xl',
    'text-lg lg:text-xl xl:text-2xl 2xl:text-3xl',
    'text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl',
  ];

  const toggleFontSize = () => {
    setFontSizeIndex((prevIndex) => (prevIndex + 1) % fontSizes.length);
  };

  // Initial load function
  const loadNews = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const params = {
        ...searchParams,
        offset: 0,
        limit: CAROUSEL_NEWS_COUNT
      };
      
      console.log('Initial loading news with params:', params);
      const articles = await fetchArticles(params);
      
      if (articles.length === 0 || articles.length < CAROUSEL_NEWS_COUNT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      const newsItems = articles.map(mapArticleToNewsItem);
      setNews(newsItems); // Replace the entire array
    } catch (err) {
      setError('Falha ao carregar notícias.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);  // Removed unnecessary dependencies
  
  // Load more function - appends to the existing news array
  const loadMoreNews = useCallback(async () => {
    // Don't proceed if we're already fetching more or there are no more items
    if (isFetchingMore || !hasMore) return;
    
    setIsFetchingMore(true);
    
    try {
      const params = {
        ...searchParams,
        offset: news.length,
        limit: CAROUSEL_NEWS_COUNT
      };
      
      console.log('Loading more news with params:', params);
      const articles = await fetchArticles(params);
      
      // Update hasMore based on results
      setHasMore(articles.length === CAROUSEL_NEWS_COUNT);
      
      const newsItems = articles.map(mapArticleToNewsItem);
      setNews(prevNews => [...prevNews, ...newsItems]); // Append to existing array
    } catch (err) {
      setError('Falha ao carregar mais notícias.');
      console.error(err);
    } finally {
      setIsFetchingMore(false);
    }
  }, [hasMore, isFetchingMore, news.length, searchParams]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  useEffect(() => {
    const recentNews = news.slice(0, CAROUSEL_NEWS_COUNT);
    setCarouselNews(recentNews);

    if (currentIndex >= recentNews.length && recentNews.length > 0) {
      setCurrentIndex(0);
    }
  }, [news, currentIndex]);

  useEffect(() => {
    if (!isAutoPlay || carouselNews.length === 0 || isListView) return;
    const interval = setInterval(() => {
      setCurrentIndex((currentIndex + 1) % carouselNews.length);
    }, 20000);
    return () => clearInterval(interval);
  }, [isAutoPlay, carouselNews.length, isListView, currentIndex]);

  useEffect(() => {
    if (!isAutoPlay || carouselNews.length === 0 || isListView) {
      setProgress(0);
      return;
    }

    let animationFrameId: number;
    const startTime = Date.now();
    const duration = 20000; // 20 seconds

    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      const currentProgress = Math.min((elapsedTime / duration) * 100, 100);
      setProgress(currentProgress);

      if (elapsedTime < duration) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      setProgress(0);
    };
  }, [isAutoPlay, currentIndex, carouselNews.length, isListView]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselNews.length) % carouselNews.length);
    setIsAutoPlay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselNews.length);
    setIsAutoPlay(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlay(false);
  };

  const handleViewArticle = useCallback((id: string) => {
    const index = carouselNews.findIndex(item => item.id === id);
    if (index !== -1) {
      setCurrentIndex(index);
      setIsListView(false);
    } else {
      const allNewsIndex = news.findIndex(item => item.id === id);
      if (allNewsIndex !== -1) {
        setIsListView(true);
      }
    }
  }, [news, carouselNews]);

  if (isLoading && news.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-nebula text-white">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        Carregando notícias...
      </div>
    );
  }

  if (error) {
    return <div className="fixed inset-0 flex items-center justify-center bg-gradient-nebula text-red-500">{error}</div>;
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-nebula">
      <div className="fixed inset-0 bg-gradient-star animate-pulse-glow" />
      
      {/* Logo CEI e título no canto superior esquerdo */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
        <img 
          src="/cei_logo.png" 
          alt="CEI - Centro Espacial ITA" 
          className="h-10 w-auto object-contain drop-shadow-md"
        />
        <span className="text-xl font-bold text-white drop-shadow-md">
          Space News
        </span>
      </div>

      <div className="fixed top-4 right-4 z-50">
        <div className="flex items-center backdrop-blur-sm rounded-full p-1 shadow-lg">
          <Toggle pressed={!isListView} onPressedChange={() => setIsListView(false)} className="rounded-full p-2 data-[state=on]:bg-primary/10 data-[state=on]:text-primary hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Visualização em carrossel">
            <LayoutGrid className="h-5 w-5" />
          </Toggle>
          <Toggle pressed={isListView} onPressedChange={() => setIsListView(true)} className="rounded-full p-2 data-[state=on]:bg-primary/10 data-[state=on]:text-primary hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Visualização em lista">
            <List className="h-5 w-5" />
          </Toggle>
        </div>
      </div>

      <div className={`relative z-10 min-h-screen w-full ${isListView ? 'pt-24 pb-12' : 'flex items-center justify-center p-2 sm:p-4 lg:p-6 xl:p-8 2xl:p-12'}`}>
        {isListView ? (
          <div className="w-full max-w-5xl mx-auto px-4">
            <NewsSearchFilter 
              onSearch={(params) => {
                // Reset news state when filters are cleared or changed
                setNews([]);
                setHasMore(true);
                setSearchParams(params);
                
                // Use the new params directly instead of relying on the updated state
                const loadWithParams = async () => {
                  setIsLoading(true);
                  try {
                    const fetchParams = {
                      ...params,
                      offset: 0,
                      limit: CAROUSEL_NEWS_COUNT
                    };
                    
                    console.log('Loading news with filter params:', fetchParams);
                    const articles = await fetchArticles(fetchParams);
                    
                    if (articles.length === 0 || articles.length < CAROUSEL_NEWS_COUNT) {
                      setHasMore(false);
                    } else {
                      setHasMore(true);
                    }
                    
                    const newsItems = articles.map(mapArticleToNewsItem);
                    setNews(newsItems);
                  } catch (error) {
                    console.error('Error loading news:', error);
                    setError('Failed to load news');
                  } finally {
                    setIsLoading(false);
                  }
                };
                
                loadWithParams();
              }}
              isLoading={isLoading}
              currentFilters={searchParams}
            />
            <NewsListView 
              news={news}
              onViewArticle={handleViewArticle}
              onLoadMore={loadMoreNews}
              hasMore={hasMore}
              isFetchingMore={isFetchingMore}
            />
          </div>
        ) : (
          <>
            {carouselNews.length > 0 && (
              <NewsCarousel 
                news={carouselNews}
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
                isAutoPlay={isAutoPlay}
                setIsAutoPlay={setIsAutoPlay}
                fontSizeClass={fontSizes[fontSizeIndex]}
                toggleFontSize={toggleFontSize}
              />
            )}
          </>
        )}
      </div>

      {/* Navigation controls and progress bar are now handled by the NewsCarousel component */}

      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-t border-border/50 py-2">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          Resumo de notícias gerado pela IA do CEI
        </div>
      </footer>
    </div>
  );
};

export default SpaceNewsCarousel;