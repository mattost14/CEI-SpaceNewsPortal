import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NewsItem {
  título: string;
  texto: string;
  fonte: string;
  main_image?: string;
}

// Mock data baseado no exemplo fornecido
const mockNews: NewsItem[] = [
  {
    título: "Blue Origin levará gêmeos marcianos da NASA em voo ousado rumo ao espaço profundo",
    texto: "A missão ESCAPADE da NASA, composta por duas sondas gêmeas destinadas a estudar a magnetosfera de Marte, finalmente ganhou nova data de lançamento: 15 de agosto. Elas serão levadas ao espaço a bordo do segundo voo do enorme foguete New Glenn da Blue Origin, marcando sua primeira missão interplanetária. Após atrasos e a retirada da missão do voo inaugural, os artefatos construídos pela Rocket Lab seguirão rumo ao planeta vermelho ao lado de uma carga experimental da Viasat.",
    fonte: "https://www.space.com/space-exploration/launches-spacecraft/twin-nasa-mars-probes-will-fly-on-2nd-ever-launch-of-blue-origins-huge-new-glenn-rocket",
    main_image: "https://cdn.mos.cms.futurecdn.net/9rVW6GG939KMQhjcC6F2sE.jpg"
  },
  {
    título: "NASA descobre água líquida em lua de Saturno",
    texto: "Cientistas da NASA confirmaram a presença de oceanos subterrâneos em Enceladus, uma das luas de Saturno. A descoberta foi feita através de análises de dados da sonda Cassini, que detectou gêiseres de vapor d'água emergindo da superfície gelada. Esta descoberta revoluciona nossa compreensão sobre a possibilidade de vida no sistema solar exterior.",
    fonte: "https://www.nasa.gov/saturn-moon-discovery",
    main_image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1920&h=1080&fit=crop"
  },
  {
    título: "SpaceX planeja primeira missão tripulada para Marte em 2026",
    texto: "A SpaceX anunciou oficialmente seus planos para enviar a primeira tripulação humana para Marte em 2026, utilizando a nave Starship. A missão durará aproximadamente 26 meses e levará quatro astronautos para estabelecer uma base permanente no planeta vermelho. Esta será a primeira vez que humanos pisarão em solo marciano.",
    fonte: "https://www.spacex.com/mars-mission-2026",
    main_image: "https://images.unsplash.com/photo-1517022812141-23620dba5c23?w=1920&h=1080&fit=crop"
  }
];

export default function SpaceNewsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlay) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mockNews.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [isAutoPlay, mockNews.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % mockNews.length);
    setIsAutoPlay(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + mockNews.length) % mockNews.length);
    setIsAutoPlay(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlay(false);
  };

  const currentNews = mockNews[currentIndex];

  return (
    <div className="relative h-screen overflow-hidden bg-gradient-nebula">
      {/* Background stars animation */}
      <div className="absolute inset-0 bg-gradient-star animate-pulse-glow" />
      
      {/* Main content */}
      <div className="relative z-10 h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-6xl h-[90vh] bg-card/10 backdrop-blur-md border-border/20 overflow-hidden animate-slide-in">
          <div className="h-full flex flex-col md:flex-row">
            
            {/* Image section */}
            {currentNews.main_image && (
              <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden">
                <img
                  src={currentNews.main_image}
                  alt={currentNews.título}
                  className="w-full h-full object-cover transition-transform duration-cosmic hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background/20 to-transparent" />
              </div>
            )}
            
            {/* Content section */}
            <div className={`${currentNews.main_image ? 'w-full md:w-1/2' : 'w-full'} h-1/2 md:h-full p-8 md:p-12 flex flex-col justify-center space-y-6`}>
              
              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-foreground animate-float">
                {currentNews.título}
              </h1>
              
              {/* Text content */}
              <div className="flex-1 overflow-auto">
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  {currentNews.texto}
                </p>
              </div>
              
              {/* Source link */}
              <Button
                variant="outline"
                className="self-start bg-primary/10 border-primary/30 hover:bg-primary/20 text-primary"
                onClick={() => window.open(currentNews.fonte, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver fonte original
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation controls */}
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-20">
        <Button
          variant="ghost"
          size="lg"
          onClick={goToPrevious}
          className="bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white border-white/20"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      </div>

      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20">
        <Button
          variant="ghost"
          size="lg"
          onClick={goToNext}
          className="bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white border-white/20"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex space-x-3">
          {mockNews.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-primary scale-125'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Auto-play indicator */}
      {isAutoPlay && (
        <div className="absolute top-8 right-8 z-20">
          <div className="bg-black/20 backdrop-blur-sm rounded-full p-3">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse-glow" />
          </div>
        </div>
      )}
    </div>
  );
}