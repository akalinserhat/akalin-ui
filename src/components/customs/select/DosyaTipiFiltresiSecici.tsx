/**
 * @file DosyaTipiFiltresiSecici.tsx
 * @description
 * Webakus UI Core - Gruplanmış Dosya Tipi Filtresi Seçici Bileşeni (DosyaTipiFiltresiSecici)
 *
 * Başlıca Sorumlulukları:
 * - Dosya içe aktarma, yükleme ve harici düğüm ayar ekranlarında ("Text Dokümanlar", "Resimler",
 *   "Tablo & Veri Dokümanları", "Arşiv Dosyaları") gruplanmış dosya türlerini tekli veya çoklu seçtirmek.
 * - Seçilen filtre anahtarlarından izin verilen uzantıları (`allowedExtensions`) ve HTML input `accept`
 *   değerini otomatik çözümleyerek üst bileşene iletmek.
 * - BaseDropdownSecici altyapısını kullanarak %100 i18n, arama, klavye navigasyonu ve grup başlığı desteği sunmak.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter } from 'lucide-react';
import BaseDropdownSecici, { type DropdownOption } from '../../base/list/BaseDropdownSecici';

export type FileFilterCategory =
  | 'all'
  | 'excel'
  | 'pdf'
  | 'image'
  | 'png'
  | 'jpg'
  | 'webp_svg'
  | 'word'
  | 'txt'
  | 'csv'
  | 'json'
  | 'xml'
  | 'archive';

export interface FileFilterPresetItem {
  extensions: string[];
  accept: string;
  labelKey: string;
  defaultLabel: string;
  groupKey?: string;
  defaultGroupLabel?: string;
  isAllOption?: boolean;
}

export const FILE_FILTER_PRESETS: Record<FileFilterCategory, FileFilterPresetItem> = {
  all: {
    extensions: [],
    accept: '*/*',
    labelKey: 'FileImport_filterAll',
    defaultLabel: 'Tüm Dosyalar',
    isAllOption: true,
  },
  pdf: {
    extensions: ['pdf'],
    accept: '.pdf',
    labelKey: 'FileImport_filterPdf',
    defaultLabel: 'PDF Belgeleri (.pdf)',
    groupKey: 'FileImport_groupTextDocs',
    defaultGroupLabel: 'Text Dokümanlar',
  },
  word: {
    extensions: ['doc', 'docx', 'rtf', 'odt'],
    accept: '.doc,.docx,.rtf,.odt',
    labelKey: 'FileImport_filterWord',
    defaultLabel: 'Word Dokümanları (.docx, .doc, .rtf, .odt)',
    groupKey: 'FileImport_groupTextDocs',
    defaultGroupLabel: 'Text Dokümanlar',
  },
  txt: {
    extensions: ['txt', 'md'],
    accept: '.txt,.md',
    labelKey: 'FileImport_filterTxt',
    defaultLabel: 'Metin Dokümanları (.txt, .md)',
    groupKey: 'FileImport_groupTextDocs',
    defaultGroupLabel: 'Text Dokümanlar',
  },
  png: {
    extensions: ['png'],
    accept: '.png',
    labelKey: 'FileImport_filterPng',
    defaultLabel: 'PNG Görselleri (.png)',
    groupKey: 'FileImport_groupImages',
    defaultGroupLabel: 'Resimler',
  },
  jpg: {
    extensions: ['jpg', 'jpeg'],
    accept: '.jpg,.jpeg',
    labelKey: 'FileImport_filterJpg',
    defaultLabel: 'JPEG / JPG Görselleri (.jpg, .jpeg)',
    groupKey: 'FileImport_groupImages',
    defaultGroupLabel: 'Resimler',
  },
  webp_svg: {
    extensions: ['webp', 'svg', 'gif', 'bmp'],
    accept: '.webp,.svg,.gif,.bmp',
    labelKey: 'FileImport_filterWebpSvg',
    defaultLabel: 'WebP, SVG & GIF Görselleri (.webp, .svg, .gif, .bmp)',
    groupKey: 'FileImport_groupImages',
    defaultGroupLabel: 'Resimler',
  },
  image: {
    extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'],
    accept: '.png,.jpg,.jpeg,.webp,.gif,.svg,.bmp',
    labelKey: 'FileImport_filterImage',
    defaultLabel: 'Tüm Resimler (.png, .jpg, .webp, .svg, .gif)',
    groupKey: 'FileImport_groupImages',
    defaultGroupLabel: 'Resimler',
  },
  excel: {
    extensions: ['xlsx', 'xls', 'ods'],
    accept: '.xlsx,.xls,.ods',
    labelKey: 'FileImport_filterExcel',
    defaultLabel: 'Excel & Tablo (.xlsx, .xls, .ods)',
    groupKey: 'FileImport_groupSpreadsheets',
    defaultGroupLabel: 'Tablo & Veri Dokümanları',
  },
  csv: {
    extensions: ['csv'],
    accept: '.csv',
    labelKey: 'FileImport_filterCsv',
    defaultLabel: 'CSV (.csv)',
    groupKey: 'FileImport_groupSpreadsheets',
    defaultGroupLabel: 'Tablo & Veri Dokümanları',
  },
  json: {
    extensions: ['json'],
    accept: '.json',
    labelKey: 'FileImport_filterJson',
    defaultLabel: 'JSON (.json)',
    groupKey: 'FileImport_groupSpreadsheets',
    defaultGroupLabel: 'Tablo & Veri Dokümanları',
  },
  xml: {
    extensions: ['xml'],
    accept: '.xml',
    labelKey: 'FileImport_filterXml',
    defaultLabel: 'XML (.xml)',
    groupKey: 'FileImport_groupSpreadsheets',
    defaultGroupLabel: 'Tablo & Veri Dokümanları',
  },
  archive: {
    extensions: ['zip', 'rar', '7z', 'tar', 'gz'],
    accept: '.zip,.rar,.7z,.tar,.gz',
    labelKey: 'FileImport_filterArchive',
    defaultLabel: 'Arşiv (.zip, .rar, .7z)',
    groupKey: 'FileImport_groupArchives',
    defaultGroupLabel: 'Arşiv Dosyaları',
  },
};

/**
 * Seçilen dosya tipi filtresi anahtarlarından izin verilen uzantı listesini (noktasız, küçük harf) üretir.
 * 'all' seçiliyse veya seçim boşsa tüm formatlara izin verildiğini belirtmek üzere [] döner.
 */
export function resolveFileFilterExtensions(
  selection: FileFilterCategory | string | string[] | null | undefined
): string[] {
  if (!selection) return [];
  const rawArray = Array.isArray(selection) ? selection : [selection];
  if (rawArray.length === 0 || rawArray.includes('all')) return [];

  const extSet = new Set<string>();
  rawArray.forEach((item) => {
    const key = String(item || '').trim().toLowerCase();
    if (!key || key === 'all') return;
    const preset = (FILE_FILTER_PRESETS as Record<string, FileFilterPresetItem>)[key];
    if (preset && preset.extensions.length > 0) {
      preset.extensions.forEach((ext) => extSet.add(ext.replace(/^\./, '').toLowerCase()));
    } else {
      extSet.add(key.replace(/^\./, '').toLowerCase());
    }
  });

  return Array.from(extSet);
}

/**
 * Seçilen dosya tipi filtresi anahtarlarından HTML <input type="file" accept="..." /> değerini üretir.
 */
export function resolveFileFilterAccept(
  selection: FileFilterCategory | string | string[] | null | undefined
): string {
  const exts = resolveFileFilterExtensions(selection);
  if (exts.length === 0) return '*/*';
  return exts.map((ext) => `.${ext}`).join(',');
}

/**
 * Gruplanmış dosya tipi seçeneklerini BaseDropdownSecici formatında oluşturur.
 */
export function buildGroupedFileFilterOptions(
  t: (key: string, fallback?: any) => string
): DropdownOption[] {
  const orderedKeys: FileFilterCategory[] = [
    'all',
    'pdf',
    'word',
    'txt',
    'png',
    'jpg',
    'webp_svg',
    'excel',
    'csv',
    'json',
    'xml',
    'archive',
  ];

  return orderedKeys.map((catKey) => {
    const preset = FILE_FILTER_PRESETS[catKey];
    const labelText = t(preset.labelKey, preset.defaultLabel);
    const groupText =
      preset.groupKey && preset.defaultGroupLabel
        ? t(preset.groupKey, preset.defaultGroupLabel)
        : undefined;

    return {
      id: catKey,
      value: catKey,
      label: labelText,
      group: groupText,
      isAllOption: Boolean(preset.isAllOption),
      searchText: `${groupText ? `${groupText} ` : ''}${labelText} ${preset.extensions.join(' ')}`,
    };
  });
}

export interface DosyaTipiFiltresiChangePayload {
  /** Seçili filtre anahtarları dizisi (örn: ['pdf', 'word'] veya ['all']) */
  selectedFilters: string[];
  /** Tekil seçim varsa tekil anahtar, çoklu seçim varsa dizi (geriye dönük uyumluluk için) */
  primaryFilter: FileFilterCategory | string[];
  /** Çözümlenen izinli dosya uzantıları (örn: ['pdf', 'doc', 'docx', 'rtf', 'odt']) */
  allowedExtensions: string[];
  /** HTML input accept değeri (örn: '.pdf,.doc,.docx,.rtf,.odt' veya '*\/*') */
  accept: string;
}

export interface DosyaTipiFiltresiSeciciProps {
  id?: string;
  /** Seçili dosya tipi filtresi anahtarları (tekil string veya string[] dizisi) */
  value?: FileFilterCategory | string | string[] | null;
  /** Değişiklik geri çağrısı */
  onChange?: (selectedFilters: string[], payload: DosyaTipiFiltresiChangePayload) => void;
  /** Çoklu seçim aktif mi? (Varsayılan: true) */
  multiple?: boolean;
  /** Temizlenebilir mi? (Varsayılan: true) */
  clearable?: boolean;
  /** Pasif mi? */
  disabled?: boolean;
  /** Özel placeholder metni */
  placeholder?: string;
  /** Alan etiketi (verilirse üstte form-field-label olarak render edilir) */
  label?: React.ReactNode;
  /** Etiket solunda Filter ikonu gösterilsin mi? (Varsayılan: true) */
  showLabelIcon?: boolean;
  /** Alt kısımda "İzin verilen formatlar: .pdf, .docx..." bilgi satırı gösterilsin mi? (Varsayılan: false) */
  showAllowedExtensionsHint?: boolean;
  /** Özel seçenek listesi (verilmezse standart gruplanmış dosya tipi seçenekleri kullanılır) */
  options?: DropdownOption[];
  /** Doğrulama hata mesajı */
  error?: string;
  /** Ek CSS sınıfı */
  className?: string;
}

export type DosyaTuruSeciciProps = DosyaTipiFiltresiSeciciProps;
export type DosyaTipiSeciciProps = DosyaTipiFiltresiSeciciProps;

export const DosyaTipiFiltresiSecici: React.FC<DosyaTipiFiltresiSeciciProps> = ({
  id = 'dosyaTipiFiltresiSecici',
  value,
  onChange,
  multiple = true,
  clearable = true,
  disabled = false,
  placeholder,
  label,
  showLabelIcon = true,
  showAllowedExtensionsHint = false,
  options,
  error,
  className = '',
}) => {
  const { t } = useTranslation();

  const resolvedOptions = useMemo<DropdownOption[]>(
    () => options || buildGroupedFileFilterOptions(t),
    [options, t]
  );

  const selectedFilterValues = useMemo<string[]>(() => {
    if (Array.isArray(value) && value.length > 0) {
      return value.map(String);
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      return [value.trim()];
    }
    return ['all'];
  }, [value]);

  const resolvedExtensionsPreview = useMemo<string>(() => {
    const exts = resolveFileFilterExtensions(selectedFilterValues);
    if (exts.length === 0) {
      return t('FileImport_allFormatsAllowed', 'Tüm dosya formatları');
    }
    return exts.map((ext) => `.${ext}`).join(', ');
  }, [selectedFilterValues, t]);

  const handleDropdownChange = (val: any) => {
    const nextFilters =
      Array.isArray(val) && val.length > 0
        ? val.map(String)
        : typeof val === 'string' && val.trim().length > 0
          ? [val.trim()]
          : ['all'];

    const nextExtensions = resolveFileFilterExtensions(nextFilters);
    const nextAccept = resolveFileFilterAccept(nextFilters);
    const primaryFilter: FileFilterCategory | string[] =
      nextFilters.length === 1 ? (nextFilters[0] as FileFilterCategory) : nextFilters;

    if (onChange) {
      onChange(nextFilters, {
        selectedFilters: nextFilters,
        primaryFilter,
        allowedExtensions: nextExtensions,
        accept: nextAccept,
      });
    }
  };

  return (
    <div className={`w-full flex flex-col gap-6 ${className}`.trim()}>
      {label !== undefined && label !== null && label !== '' && (
        <label
          htmlFor={id}
          className="form-field-label flex items-center gap-6 font-semibold text-13 text-primary"
        >
          {showLabelIcon && <Filter size={14} />}
          <span>{label}</span>
        </label>
      )}

      <BaseDropdownSecici
        id={id}
        options={resolvedOptions}
        multiple={multiple}
        clearable={clearable}
        disabled={disabled}
        value={multiple ? selectedFilterValues : selectedFilterValues[0] || 'all'}
        placeholder={placeholder || t('FileImport_selectFileTypesPlaceholder', 'Dosya türlerini seçin...')}
        error={error}
        onChange={handleDropdownChange}
      />

      {showAllowedExtensionsHint && (
        <span className="text-11 text-secondary">
          {t('FileImport_allowedFormatsLabel', 'İzin verilen formatlar')}:{' '}
          <strong className="text-primary">{resolvedExtensionsPreview}</strong>
        </span>
      )}
    </div>
  );
};

export const DosyaTuruSecici = DosyaTipiFiltresiSecici;
export const DosyaTipiSecici = DosyaTipiFiltresiSecici;
export default DosyaTipiFiltresiSecici;
