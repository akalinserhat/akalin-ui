import { useState, useEffect } from 'react';

export const useTableAction = (onRefresh?: () => void) => {
  const [highlightedId, setHighlightedId] = useState<string | number | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Güvenlik kontrolü yapılabilir (event.origin vs)
      if (event.data && event.data.type === 'RECORD_ADDED') {
        const newId = event.data.id;
        
        if (newId) {
          setHighlightedId(newId);
          // Tabloyu yenile
          if (typeof onRefresh === 'function') {
            onRefresh();
          }

          // 5 saniye sonra vurguyu kaldır
          setTimeout(() => {
            setHighlightedId(null);
          }, 5000);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onRefresh]);

  return {
    highlightedId,
    setHighlightedId,
    triggerAction: setHighlightedId
  };
};
