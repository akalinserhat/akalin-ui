import { useEffect } from 'react';

/**
 * ReactNode veya herhangi bir değerden metin çıkarır.
 */
export const extractTextFromNode = (node: any): string => {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string') {
    return node;
  }
  if (typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromNode).filter(Boolean).join(' ');
  }
  if (typeof node === 'object' && node.props && node.props.children) {
    return extractTextFromNode(node.props.children);
  }
  return '';
};

/**
 * Sayfa başlığını tarayıcı tab'ında "[Sayfa Başlığı] | Akalin UI" formatında ayarlar.
 * Boş veya tanımsız ise varsayılan "Akalin UI" olarak belirler.
 */
export const formatBrowserTabTitle = (rawTitle?: any, brandSuffix = 'Akalin UI'): string => {
  const cleanTitle = extractTextFromNode(rawTitle).trim();
  return cleanTitle ? `${cleanTitle} | ${brandSuffix}` : brandSuffix;
};

/**
 * Bileşen mount olduğunda veya başlık değiştiğinde tarayıcı sekme başlığını (document.title)
 * "[Sayfa Başlığı] | Akalin UI" formatında güncelleyen hook.
 */
export const usePageTitle = (title?: any, brandSuffix = 'Akalin UI') => {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const cleanTitle = extractTextFromNode(title).trim();
    if (cleanTitle) {
      document.title = `${cleanTitle} | ${brandSuffix}`;
    }
  }, [title, brandSuffix]);
};

export default usePageTitle;
