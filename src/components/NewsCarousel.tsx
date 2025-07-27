import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
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
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      setProgress(0);
    };
  }, [isAutoPlay, currentIndex, news.length]);

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
    <div className="relative w-full h-full min-h-screen flex flex-col items-center justify-center bg-gradient-nebula overflow-hidden">
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
      
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-16">
        <div className="mb-2 text-white text-xs">
          {formatDate(currentNews.date)}
        </div>
        
        {currentNews.sentiment && currentNews.sentiment !== 'neutral' && (
          <div className={`px-3 py-1 rounded-full text-xs font-medium inline-block mb-4 ${
            currentNews.sentiment === 'positive'
              ? 'bg-green-500/80 text-white'
              : currentNews.sentiment === 'negative'
              ? 'bg-red-500/80 text-white'
              : ''
          }`}>
            {currentNews.sentiment === 'positive'
              ? 'Boa notícia'
              : currentNews.sentiment === 'negative'
              ? 'Má notícia'
              : ''}
          </div>
        )}
        
        <h2 className="text-4xl font-bold text-white mb-6">{currentNews.title}</h2>
        
        {currentNews.main_image && (
          <div className="relative w-full aspect-video mb-6 overflow-hidden rounded-lg">
            <img
              src={currentNews.main_image}
              alt={currentNews.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="text-white text-lg mb-8">
          <p>{currentNews.text}</p>
        </div>

        {currentNews.source && (
          <div className="flex">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(currentNews.source || '', '_blank')}
              className="flex items-center gap-1 bg-transparent text-white border-white hover:bg-white/10"
            >
              <ExternalLink className="h-3 w-3" />
              <span>Fonte: {getDomainFromUrl(currentNews.source)}</span>
            </Button>
          </div>
        )}
      </div>
      
      <footer className="fixed bottom-0 left-0 right-0 z-10 py-2">
        <div className="container mx-auto px-4 text-center text-xs text-white/70">
          Resumo de notícias gerado pela IA do CEI
        </div>
      </footer>

      {/* Navigation buttons */}
      <button onClick={goToPrevious} className="fixed left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 rounded-full p-2 text-white hover:text-white transition-all z-20 shadow-lg hover:shadow-xl hover:scale-110" aria-label="Slide anterior">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button onClick={goToNext} className="fixed right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 rounded-full p-2 text-white hover:text-white transition-all z-20 shadow-lg hover:shadow-xl hover:scale-110" aria-label="Próximo slide">
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Font size and Auto play controls */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
        <Button 
          variant="outline"
          size="icon"
          onClick={toggleFontSize}
          className="bg-background/50 hover:bg-background/80 rounded-full text-white hover:text-white transition-all shadow-lg hover:shadow-xl hover:scale-110"
          aria-label="Mudar tamanho do texto"
        >
          <span className="text-lg font-bold">A</span>
        </Button>
        <Button 
          variant="outline"
          size="icon"
          onClick={() => setIsAutoPlay(!isAutoPlay)}
          className="bg-background/50 hover:bg-background/80 rounded-full text-white hover:text-white transition-all shadow-lg hover:shadow-xl hover:scale-110"
          aria-label={isAutoPlay ? "Pausar autoplay" : "Iniciar autoplay"}
        >
          {isAutoPlay ? <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse-glow" /> : <Play className="w-5 h-5" />}
        </Button>
      </div>

      {/* Time Progress bar */}
      <div className="fixed bottom-0 left-0 right-0 h-1 z-20 bg-blue-600/20 overflow-hidden">
        {isAutoPlay && (
          <div 
            className="h-full bg-blue-600"
            style={{ 
              width: `${progress}%`,
              transition: 'none' 
            }}
          />
        )}
      </div>

      {/* Dots navigation */}
      <div className="fixed bottom-8 inset-x-0 flex justify-center space-x-2 z-20">
        {news.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white w-4'
                : 'bg-white/50 hover:bg-white/80'
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default NewsCarousel;
