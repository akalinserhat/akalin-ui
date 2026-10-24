import { useState, useEffect, useRef, useCallback } from 'react';

export interface TableNavigationProps<T> {
  data: T[];
  onEdit?: (item: T, e?: any) => void;
  onDelete?: (item: T) => void;
  onAddNew?: (e?: any) => void;
  onAddChild?: (item: T, e?: any) => void;
  onArrowRight?: (item: T) => void;
  onArrowLeft?: (item: T) => void;
  isActive?: boolean;
  highlightedId?: string | number | null;
  storageKey?: string;
  initialSelectedId?: string | number | null;
}

export const useTableNavigation = <T extends any>({
  data,
  onEdit,
  onDelete,
  onAddNew,
  onAddChild,
  onArrowRight,
  onArrowLeft,
  isActive = true,
  highlightedId = null,
  storageKey,
  initialSelectedId = null
}: TableNavigationProps<T>) => {
  const [selectedIndex, setSelectedIndexState] = useState(0);
  const initialTargetIdRef = useRef<string | number | null>(null);
  const hasInitializedTargetRef = useRef(false);
  const hasRestoredRef = useRef(false);

  const setSelectedIndex = useCallback((valOrUpdater: number | ((prev: number) => number)) => {
    hasRestoredRef.current = true;
    setSelectedIndexState(valOrUpdater);
  }, []);
  
  // Ref'ler ile en güncel değerleri tutalım ki event listener sürekli kopup bağlanmasın
  const stateRef = useRef({ data, selectedIndex, onEdit, onDelete, onAddNew, onAddChild, onArrowRight, onArrowLeft });
  
  useEffect(() => {
    stateRef.current = { data, selectedIndex, onEdit, onDelete, onAddNew, onAddChild, onArrowRight, onArrowLeft };
  });

  const lastHighlightedId = useRef<string | number | null>(null);

  // Vurgulanan (yeni eklenen/güncellenen) kaydı otomatik olarak seçili hale getir (Sadece 1 kez)
  useEffect(() => {
    if (highlightedId && highlightedId !== lastHighlightedId.current && data && data.length > 0) {
      const index = data.findIndex((item: any) => String(item?.id ?? item?.Id ?? item?.kod) === String(highlightedId));
      if (index !== -1) {
        setSelectedIndex(index);
        lastHighlightedId.current = highlightedId; // Bu id için işlemi tamamladık
      }
    }
    if (!highlightedId) {
      lastHighlightedId.current = null;
    }
  }, [highlightedId, data]);

  if (!hasInitializedTargetRef.current) {
    initialTargetIdRef.current = initialSelectedId ?? (storageKey ? (() => {
      try {
        return sessionStorage.getItem(storageKey);
      } catch (e) {
        return null;
      }
    })() : null);
    hasInitializedTargetRef.current = true;
  }

  // Formdan dönüldüğünde veya sayfa açıldığında hedeflenen kaydı otomatik seçili hale getir
  useEffect(() => {
    const targetId = initialSelectedId || initialTargetIdRef.current;

    if (targetId && data && data.length > 0) {
      const index = data.findIndex((item: any) => 
        String(item?.id ?? item?.Id ?? item?.kod) === String(targetId)
      );
      if (index !== -1) {
        setSelectedIndex(index);
        hasRestoredRef.current = true;
      }
    }
  }, [initialSelectedId, data]);

  // Seçili satır değiştikçe storage'a kaydet (Listeden form açılıp geri dönüldüğünde hatırlanması için)
  useEffect(() => {
    // Başlangıçta hedeflenen bir kayıt varsa ve henüz veri içinde restore edilmediyse,
    // varsayılan indeks 0'ın o hedefi ezmesine izin verme!
    if (initialTargetIdRef.current && !hasRestoredRef.current) {
      return;
    }

    if (storageKey && data && data[selectedIndex]) {
      const item = data[selectedIndex];
      const itemId = (item as any)?.id ?? (item as any)?.Id ?? (item as any)?.kod;
      if (itemId) {
        try {
          sessionStorage.setItem(storageKey, String(itemId));
        } catch (e) {}
      }
    }
  }, [selectedIndex, data, storageKey]);

  useEffect(() => {
    // Veri değiştiğinde veya silindiğinde indeksin sınırları aşmamasını sağla
    if (data && data.length > 0) {
      if (selectedIndex >= data.length) {
        setSelectedIndex(Math.max(0, data.length - 1));
      }
    } else {
      setSelectedIndex(0);
    }
  }, [data, selectedIndex]);

  // Seçili satırı ekranda (scroll içinde) görünür tut (Auto-Scroll)
  useEffect(() => {
    // DOM'un render edilmesi için kısa bir gecikme
    const timer = setTimeout(() => {
      const selectedEl = document.querySelector('.row-selected');
      if (selectedEl) {
        // block: 'nearest' -> Eleman görünmüyorsa en yakın kenara hizalayacak kadar kaydırır
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }
    }, 40);
    return () => clearTimeout(timer);
  }, [selectedIndex, data]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const { data, selectedIndex, onEdit, onDelete, onAddNew, onAddChild, onArrowRight, onArrowLeft } = stateRef.current;
      if (!data || data.length === 0) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault(); // Sayfanın scroll olmasını engelle
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'ArrowDown':
          e.preventDefault(); // Sayfanın scroll olmasını engelle
          setSelectedIndex((prev) => (prev < data.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowRight':
          if (onArrowRight && data[selectedIndex]) {
            e.preventDefault();
            onArrowRight(data[selectedIndex]);
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft && data[selectedIndex]) {
            e.preventDefault();
            onArrowLeft(data[selectedIndex]);
          }
          break;
        case 'Enter':
          // Ctrl + Enter (veya Mac için Cmd + Enter): Yeni Kayıt / Alt Grup Ekle
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (onAddChild && data[selectedIndex]) {
              onAddChild(data[selectedIndex], e);
            } else if (onAddNew) {
              onAddNew(e);
            }
            break;
          }
          
          // Sadece Enter veya Shift + Enter: Düzenle (Popup veya Modal)
          if (onEdit && data[selectedIndex]) {
            e.preventDefault();
            onEdit(data[selectedIndex], e);
          }
          break;
        case 'F2':
          if (onEdit && data[selectedIndex]) {
            e.preventDefault();
            onEdit(data[selectedIndex], e);
          }
          break;
        case 'Insert':
          e.preventDefault();
          if (onAddChild && data[selectedIndex]) {
            onAddChild(data[selectedIndex], e);
          } else if (onAddNew) {
            onAddNew(e);
          }
          break;
        case 'Delete':
        case 'Del':
          if (onDelete && data[selectedIndex]) {
            e.preventDefault();
            onDelete(data[selectedIndex]);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return { selectedIndex, setSelectedIndex };
};
