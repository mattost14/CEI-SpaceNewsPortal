import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchArticles, type Article } from '@/lib/supabase';

interface NewsItem {
  id: string;
  date: string;
  title: string;
  text: string;
  source: string | null;
  main_image: string | null;
}

// Function to format date to DD/MMMM/YYYY format in Portuguese
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    timeZone: 'UTC'
  };
  return date.toLocaleDateString('pt-BR', options);
};

// Convert Supabase Article to NewsItem
const mapArticleToNewsItem = (article: Article): NewsItem => ({
  id: article.id,
  date: formatDate(article.article_date),
  title: article.title,
  text: article.article_text,
  source: article.source_url,
  main_image: article.main_image_url
});

const SpaceNewsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch articles from Supabase
  useEffect(() => {
    const loadArticles = async () => {
      try {
        const articles = await fetchArticles();
        const newsItems = articles.map(mapArticleToNewsItem);
        setNews(newsItems);
      } catch (err) {
        console.error('Failed to load articles:', err);
        setError('Falha ao carregar as notícias. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    loadArticles();
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlay || news.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 20000);

    return () => clearInterval(interval);
  }, [isAutoPlay, news.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % news.length);
    setIsAutoPlay(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + news.length) % news.length);
    setIsAutoPlay(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlay(false);
  };

  if (isLoading) {
    return <div className="p-4 text-center">Carregando notícias...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (news.length === 0) {
    return <div className="p-4 text-center">Nenhuma notícia encontrada.</div>;
  }

  const currentNews = news[currentIndex];
  const contentClass = currentNews.main_image 
    ? 'w-full lg:w-1/2 xl:w-[55%] 2xl:w-[55%]' 
    : 'w-full';

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-nebula">
      {/* Background stars animation */}
      <div className="fixed inset-0 bg-gradient-star animate-pulse-glow" />
      
      {/* Main content */}
      <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-2 sm:p-4 lg:p-6 xl:p-8 2xl:p-12">
        <Card className="w-full max-w-[95vw] 2xl:max-w-[90vw] max-h-[90vh] bg-card/10 backdrop-blur-md border-border/20 overflow-hidden animate-slide-in flex flex-col">
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Image section */}
            {currentNews.main_image && (
              <div className="w-full lg:w-1/2 xl:w-[45%] 2xl:w-[45%] h-[40vh] lg:h-auto overflow-hidden">
                <img
                  src={currentNews.main_image}
                  alt={currentNews.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            
            {/* Content section */}
            <div className={`${contentClass} p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 2xl:p-16 flex flex-col overflow-hidden`}>
              <div className="overflow-y-auto h-full pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                {/* Date */}
                <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl text-primary/80 font-medium mb-2 sm:mb-3 md:mb-4 lg:mb-6 2xl:mb-8">
                  {currentNews.date}
                </div>
                
                {/* Title */}
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-5xl font-bold leading-tight text-foreground mb-3 sm:mb-4 md:mb-6 lg:mb-8 2xl:mb-10">
                  {currentNews.title}
                </h1>
                
                {/* Text content */}
                <div className="pr-1 sm:pr-2 lg:pr-4">
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl 2xl:text-2xl text-muted-foreground leading-relaxed">
                    {currentNews.text}
                  </p>
                </div>
              </div>
              
              {/* Source link and navigation dots container */}
              <div className="mt-4 sm:mt-6 md:mt-8 lg:mt-10 xl:mt-12 2xl:mt-16 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {currentNews.source && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto self-start bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl py-1.5 sm:py-2 md:py-2.5 lg:py-3 px-3 sm:px-4 md:px-5 lg:px-6"
                    onClick={() => window.open(currentNews.source || '', '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 mr-1 sm:mr-2 md:mr-3" />
                    Ver fonte original
                  </Button>
                )}
                
                {/* Navigation dots */}
                <div className="flex justify-center sm:justify-end space-x-2 md:space-x-3 lg:space-x-4">
                  {news.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 rounded-full transition-all ${
                        index === currentIndex ? 'bg-primary w-8 sm:w-10 md:w-12 lg:w-14 xl:w-16 2xl:w-20' : 'bg-primary/30 hover:bg-primary/50'
                      }`}
                      aria-label={`Ir para o slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-1 sm:left-2 md:left-4 lg:left-6 xl:left-8 2xl:left-12 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 rounded-full p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 2xl:p-6 text-foreground/80 hover:text-foreground transition-all z-20 shadow-lg hover:shadow-xl hover:scale-110"
        aria-label="Slide anterior"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 2xl:w-10 2xl:h-10" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-1 sm:right-2 md:right-4 lg:right-6 xl:right-8 2xl:right-12 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 rounded-full p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-5 2xl:p-6 text-foreground/80 hover:text-foreground transition-all z-20 shadow-lg hover:shadow-xl hover:scale-110"
        aria-label="Próximo slide"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 2xl:w-10 2xl:h-10" />
      </button>

      {/* Auto-play indicator */}
      {isAutoPlay && (
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
          <div className="bg-black/20 backdrop-blur-sm rounded-full p-2 sm:p-3">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-pulse-glow" />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-t border-border/50 py-2">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          Resumo de Notícias pela IA do CEI
        </div>
      </footer>
    </div>
  );
};

export default SpaceNewsCarousel;