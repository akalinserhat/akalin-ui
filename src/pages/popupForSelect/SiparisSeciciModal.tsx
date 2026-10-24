// @ts-nocheck
/**
 * @file SiparisSeciciModal.tsx
 * @description Geriye Dönük Uyumluluk Sarmalayıcısı (Backward-Compatibility Re-Export)
 *
 * Somut sipariş satırı seçim listesi (SiparisSeciciList) modüler mimari standartları gereği
 * SiparisYonetimi modülüne (`@modules/SiparisYonetimi/components/SiparisSeciciList`) taşınmıştır.
 * Mevcut importların (`import { SiparisSeciciModal } from '@webakus/ui'`) kırılmaması için
 * buradan yeniden dışa aktarılmaktadır.
 */

import SiparisSeciciList, { type SiparisSeciciListProps } from '@modules/SiparisYonetimi/components/SiparisSeciciList';

export type SiparisSeciciModalProps = SiparisSeciciListProps;
export type { SiparisSeciciListProps };
export { SiparisSeciciList, SiparisSeciciList as SiparisSeciciModal, SiparisSeciciList as default };
