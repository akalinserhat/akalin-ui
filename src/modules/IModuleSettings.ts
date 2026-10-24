import React from 'react';

/**
 * Modül Ayar Bileşenlerinin Uygulayacağı Ortak Prop Sözleşmesi
 */
export interface IModuleSettingsProps<T = any> {
  /** Modüle ait mevcut ayar nesnesi */
  value: T;
  /** Ayarlar güncellendiğinde çağrılacak fonksiyon */
  onChange: (newValue: T) => void;
  /** Salt-okunur mod mu? */
  readOnly?: boolean;
  /** Ait olduğu faaliyet alanı ID'si (varsa) */
  faaliyetAlaniId?: number | null;
  /** Ait olduğu firma ID'si (varsa) */
  firmaId?: number | null;
  /** Kaydetme eylemi (BaseCardPage entegrasyonu için) */
  onSave?: (e?: any) => Promise<void> | void;
  /** Kapatma veya geri dönme eylemi (BaseCardPage entegrasyonu için) */
  onClose?: () => void;
  /** Kaydetme işlemi sürüyor mu? */
  isSaving?: boolean;
}

/**
 * Modül Ayar Sayfası ve Tanım Sözleşmesi
 */
export interface IModuleSettingsDefinition {
  /** Benzersiz Modül Kodu (örn: 'MOD_CARI', 'MOD_FATURA', 'MOD_STOK') */
  moduleId: string;
  /** Alternatif veya eşleşen kodlar (örn: ['MOD_CARI_YONETIMI', 'cari-yonetimi']) */
  aliases?: string[];
  /** Ayar Sayfası Başlığı */
  title: string;
  /** Ayar Sayfası Açıklaması */
  description?: string;
  /** Ayar Sayfası İkonu (React bileşeni) */
  icon?: any;
  /** Modülün işlevine en uygun standart Lucide ikon adı */
  iconName?: string;
  /** Render edilecek ayar bileşeni */
  component: React.ComponentType<any> | any;
  /** Varsayılan ayar değerleri */
  defaultValues?: any;
}
