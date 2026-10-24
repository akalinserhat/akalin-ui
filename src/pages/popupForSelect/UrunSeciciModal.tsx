/**
 * @file UrunSeciciModal.tsx
 * @description 
 * Geriye dönük uyumluluk (backward compatibility) katmanı.
 * Ürün ve hizmet seçici bileşeni BaseSelectionList mimarisiyle
 * `Webakus.UI/src/modules/UrunYonetimi/components/UrunSeciciList.tsx` içerisine taşınmış ve geliştirilmiştir.
 */

// @ts-nocheck
import UrunSeciciList, { type UrunSeciciListProps } from '@modules/UrunYonetimi/components/UrunSeciciList';

export type UrunSeciciModalProps = UrunSeciciListProps;
export type { UrunSeciciListProps };
export { 
    UrunSeciciList, 
    UrunSeciciList as UrunSeciciModal, 
    UrunSeciciList as default 
};
