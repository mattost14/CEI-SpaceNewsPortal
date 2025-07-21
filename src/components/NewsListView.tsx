import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from './SpaceNewsCarousel';
import { ExternalLink, Loader2 } from 'lucide-react';

interface NewsItem {
  id: string;
  date: string;
  title: string;
  text: string;
  source: string | null;
  main_image: string | null;
}

interface NewsListViewProps {
  news: NewsItem[];
  onViewArticle: (id: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isFetchingMore: boolean;
  className?: string;
}

const NewsListView: React.FC<NewsListViewProps> = ({ news, onViewArticle, onLoadMore, hasMore, isFetchingMore, className = '' }) => {

  return (
    <div className={`bg-card/10 backdrop-blur-md border border-border/20 rounded-lg p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent ${className}`}>
      <div className="space-y-4">
        {news.map((item) => (
          <Card 
            key={item.id} 
            className="p-4 hover:bg-accent/50 transition-colors cursor-pointer bg-background/50"
            onClick={() => onViewArticle(item.id)}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {item.main_image && (
                <div className="w-full sm:w-32 h-32 flex-shrink-0 overflow-hidden rounded-md">
                  <img src={item.main_image} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">
                  {formatDate(item.date)}
                </div>
                <h3 className="text-lg font-medium mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {item.text}
                </p>
                {item.source && (
                  <div className="flex items-center text-sm text-primary cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(item.source || '', '_blank'); }}>
                    <ExternalLink className="h-3 w-3 mr-1" />
                    <span>Ver fonte original</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button onClick={onLoadMore} disabled={isFetchingMore}>
            {isFetchingMore ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...</>
            ) : (
              'Carregar mais notícias'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default NewsListView;
