import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, List, LayoutGrid, Loader2, Play, Baseline } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import NewsListView from './NewsListView';
import NewsSearchFilter from './NewsSearchFilter';
import { supabase, fetchArticles, Article, ArticleSearchParams } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

interface NewsItem {
  id: string;
  date: string;
  title: string;
  text: string;
  source: string | null;
  main_image: string | null;
  sentiment: string | null;
}

const getDomainFromUrl = (url: string | null): string => {
  if (!url) return '';
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '');
  } catch (e) {
    console.error("Invalid URL for domain extraction:", url, e);
    return '';
  }
};

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
      const articles = await fetchArticles(params);
      const newsItems = articles.map(mapArticleToNewsItem);
      setNews(newsItems); 
      setCarouselNews(newsItems.slice(0, 5)); 
      setError(null);
      
      // Update hasMore based on whether we got a full page of results
      setHasMore(articles.length >= 5);
    } catch (err) {
      console.error('Error loading articles:', err);
      setError('Failed to load articles. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Initial load of articles
  useEffect(() => {
    loadArticles();
  }, [loadArticles]);
  
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
}, []);

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
        limit: 5
      };
      
      console.log('Initial loading news with params:', params);
      const articles = await fetchArticles(params);
      
      if (articles.length === 0 || articles.length < 5) {
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
  }, [searchParams, fetchArticles, mapArticleToNewsItem]);
  
  // Load more function - appends to the existing news array
  const loadMoreNews = useCallback(async () => {
    // Don't proceed if we're already fetching more or there are no more items
    if (isFetchingMore || !hasMore) return;
    
    setIsFetchingMore(true);
    
    try {
      const params = {
        ...searchParams,
        offset: news.length,
        limit: 5
      };
      
      console.log('Loading more news with params:', params);
      const articles = await fetchArticles(params);
      
      // Update hasMore based on results
      setHasMore(articles.length === 5);
      
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
    const recentNews = news.slice(0, 5);
    setCarouselNews(recentNews);

    if (currentIndex >= recentNews.length && recentNews.length > 0) {
      setCurrentIndex(0);
    }
  }, [news, currentIndex]);

  useEffect(() => {
    if (!isAutoPlay || carouselNews.length === 0 || isListView) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselNews.length);
    }, 20000);
    return () => clearInterval(interval);
    }, [isAutoPlay, carouselNews.length, isListView]);

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

  const currentNews = carouselNews[currentIndex];

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
                      limit: 5
                    };
                    
                    console.log('Loading news with filter params:', fetchParams);
                    const articles = await fetchArticles(fetchParams);
                    
                    if (articles.length === 0 || articles.length < 5) {
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
              className="w-full" 
            />
          </div>
        ) : carouselNews.length > 0 && currentNews ? (
          <Card className="w-full max-w-[95vw] 2xl:max-w-[90vw] max-h-[90vh] bg-card/10 backdrop-blur-md border-border/20 overflow-hidden animate-slide-in flex flex-col relative">
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-full">
              {currentNews.main_image && (
                <div className="w-full lg:w-5/12 xl:w-4/12 h-[40vh] lg:h-auto overflow-hidden">
                  <img src={currentNews.main_image} alt={currentNews.title} className="w-full h-full object-contain" loading="lazy" />
                </div>
              )}
              <div className={`${currentNews.main_image ? 'w-full lg:w-7/12 xl:w-8/12' : 'w-full'} p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col overflow-hidden`}>
                <div className="overflow-y-auto h-full pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-primary/80 font-medium">{formatDate(currentNews.date)}</div>
                    {currentNews.sentiment && currentNews.sentiment !== 'neutral' && (
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        currentNews.sentiment === 'positive' ? 'bg-green-500/80 text-white' : 
                        currentNews.sentiment === 'negative' ? 'bg-red-500/80 text-white' : ''
                      }`}>
                        {currentNews.sentiment === 'positive' ? 'Boa notícia' : 
                         currentNews.sentiment === 'negative' ? 'Má notícia' : ''}
                      </div>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold leading-tight text-foreground mb-4">{currentNews.title}</h1>
                  <div className="pr-1 sm:pr-2 lg:pr-4">
                    <p className={`${fontSizes[fontSizeIndex]} text-muted-foreground leading-relaxed transition-all duration-300`}>{currentNews.text}</p>
                  </div>
                </div>
                <div className="mt-auto pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {currentNews.source && (
                    <Button variant="outline" size="sm" className="w-full sm:w-auto bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary" onClick={() => window.open(currentNews.source || '', '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Fonte: {getDomainFromUrl(currentNews.source)}
                    </Button>
                  )}
                  <div className="flex justify-center sm:justify-end items-center space-x-2">
                    {carouselNews.map((_, index) => (
                      <button key={index} onClick={() => goToSlide(index)} className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentIndex ? 'bg-primary w-8' : 'bg-primary/30 hover:bg-primary/50'}`} aria-label={`Ir para o slide ${index + 1}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <div className="p-4 text-center text-white">Nenhuma notícia encontrada.</div>
        )}
      </div>

      {!isListView && carouselNews.length > 1 && (
        <>
          <button onClick={goToPrevious} className="fixed left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 rounded-full p-2 text-foreground/80 hover:text-foreground transition-all z-20 shadow-lg hover:shadow-xl hover:scale-110" aria-label="Slide anterior">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={goToNext} className="fixed right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 rounded-full p-2 text-foreground/80 hover:text-foreground transition-all z-20 shadow-lg hover:shadow-xl hover:scale-110" aria-label="Próximo slide">
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
      {/* Font size and Auto play controls */}
      {!isListView && carouselNews.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
          <Button 
            variant="outline"
            size="icon"
            onClick={toggleFontSize}
            className="bg-background/50 hover:bg-background/80 rounded-full text-foreground/80 hover:text-foreground transition-all shadow-lg hover:shadow-xl hover:scale-110"
            aria-label="Mudar tamanho do texto"
          >
            <Baseline className="w-5 h-5" />
          </Button>
          <Button 
            variant="outline"
            size="icon"
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className="bg-background/50 hover:bg-background/80 rounded-full text-foreground/80 hover:text-foreground transition-all shadow-lg hover:shadow-xl hover:scale-110"
            aria-label={isAutoPlay ? "Pausar autoplay" : "Iniciar autoplay"}
          >
                                                                        {isAutoPlay ? <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse-glow" /> : <Play className="w-5 h-5" />}
          </Button>
        </div>
      )}
      {/* Time Progress bar */}
      {!isListView && isAutoPlay && (
        <div className="fixed bottom-[37px] left-0 right-0 h-1 z-20 bg-primary/20 overflow-hidden">
          <div 
            className="h-full bg-primary"
            style={{ 
              width: `${progress}%`,
              transition: 'none' 
            }}
          />
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-t border-border/50 py-2">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          Resumo de Notícias pela IA do CEI
        </div>
      </footer>
    </div>
  );
};

export default SpaceNewsCarousel;