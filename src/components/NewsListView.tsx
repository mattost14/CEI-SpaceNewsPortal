import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { ExternalLink, Loader2 } from 'lucide-react';

interface NewsItem {
  id: string;
  date: string;
  title: string;
  text: string;
  source: string | null;
  main_image: string | null;
  sentiment: string | null;
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
  const [expandedArticles, setExpandedArticles] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedArticles(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className={` ${className}`}>
      <div className="space-y-4">
        {news.length === 0 ? (
          <Card className="p-8 text-center bg-background/50">
            <h3 className="text-lg font-medium mb-2">Nenhuma notícia encontrada</h3>
            <p className="text-muted-foreground">Tente ajustar seus filtros de busca para encontrar mais resultados.</p>
          </Card>
        ) : (
          news.map((item) => (
            <Card 
              key={item.id} 
              className="p-4 hover:bg-accent/50 transition-colors cursor-pointer bg-background/50 relative"
              onClick={() => onViewArticle(item.id)}
            >
            {item.sentiment && item.sentiment !== 'neutral' && (
              <div className={`absolute top-2 right-2 z-10 px-3 py-1 rounded-full text-xs font-medium ${
                item.sentiment === 'positive' ? 'bg-green-500/80 text-white' : 
                item.sentiment === 'negative' ? 'bg-red-500/80 text-white' : ''
              }`}>
                {item.sentiment === 'positive' ? 'Boa notícia' : 
                 item.sentiment === 'negative' ? 'Má notícia' : ''}
              </div>
            )}
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
                <div className="mb-2">
                  <p className={`text-sm text-muted-foreground ${!expandedArticles[item.id] ? 'line-clamp-2' : ''}`}>
                    {item.text}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <button 
                    onClick={(e) => toggleExpand(item.id, e)}
                    className="text-sm text-primary hover:underline focus:outline-none"
                  >
                    {expandedArticles[item.id] ? 'Ler menos' : 'Ler mais'}
                  </button>
                  {item.source && (
                    <div className="flex items-center text-sm text-primary cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(item.source || '', '_blank'); }}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      <span>Ver fonte original</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )))
        }
      </div>
      {news.length > 0 && hasMore && (
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
