import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Play, Baseline } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface NewsCarouselProps {
  news: NewsItem[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  isAutoPlay: boolean;
  setIsAutoPlay: (isAutoPlay: boolean) => void;
  fontSizeClass: string;
  toggleFontSize: () => void;
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

const NewsCarousel: React.FC<NewsCarouselProps> = ({
  news,
  currentIndex,
  setCurrentIndex,
  isAutoPlay,
  setIsAutoPlay,
  fontSizeClass,
  toggleFontSize
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isAutoPlay || news.length === 0) {
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
      } else {
        // Auto advance to next slide when progress reaches 100%
        setCurrentIndex((currentIndex + 1) % news.length);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      setProgress(0);
    };
  }, [isAutoPlay, currentIndex, news.length, setCurrentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((currentIndex - 1 + news.length) % news.length);
    setIsAutoPlay(false);
  };

  const goToNext = () => {
    setCurrentIndex((currentIndex + 1) % news.length);
    setIsAutoPlay(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlay(false);
  };

  if (news.length === 0) {
    return null;
  }

  const currentNews = news[currentIndex];

  return (
    <div className="relative w-full h-full">
      {/* Card with main content */}
      <Card className="w-full h-full bg-card/10 backdrop-blur-md border-border/20 overflow-hidden animate-slide-in flex flex-col relative">
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
                <p className={`${fontSizeClass} text-muted-foreground leading-relaxed transition-all duration-300`}>{currentNews.text}</p>
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
                {news.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === currentIndex ? 'bg-primary w-8' : 'bg-primary/30 hover:bg-primary/50'
                    }`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Ir para o slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Navigation buttons */}
      <button 
        onClick={goToPrevious} 
        className="fixed left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 rounded-full p-2 text-foreground/80 hover:text-foreground transition-all z-20 shadow-lg hover:shadow-xl hover:scale-110" 
        aria-label="Slide anterior"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button 
        onClick={goToNext} 
        className="fixed right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 rounded-full p-2 text-foreground/80 hover:text-foreground transition-all z-20 shadow-lg hover:shadow-xl hover:scale-110" 
        aria-label="Próximo slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Font size and Auto play controls */}
      <div className="fixed bottom-10 right-4 z-50 flex items-center gap-2">
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

      {/* Time Progress bar */}
      {isAutoPlay && (
        <div className="fixed bottom-[33px] left-0 right-0 h-1 z-20 bg-primary/20 overflow-hidden">
          <div 
            className="h-full bg-primary"
            style={{ 
              width: `${progress}%`,
              transition: 'none' 
            }}
          />
        </div>
      )}
    </div>
  );
};

export default NewsCarousel;
