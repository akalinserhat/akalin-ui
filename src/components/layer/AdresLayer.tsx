/**
 * Webakus UI Core - Merkezi Adres Katmanı (AdresLayer)
 * 
 * Proje genelinde adres girişi gerektiren tüm form ve kartlarda kullanılmak üzere
 * tasarlanmış üst düzey katman bileşenidir.
 * 
 * Başlıca Özellikleri:
 * - Üst satırda 2 sütunlu grid yapısında dinamik İl ve İlçe dropdown seçicileri
 * - Alt satırda tam genişlikte Açık Adres textarea alanı
 * - Sağ üstte 7 seviyeli resmi hiyerarşik seçimi açan "Adres Belirle" (AdresSeciciForm) modal entegrasyonu
 * - İl ve İlçe verileri için in-memory önbellekleme (network cache) ile yüksek performans
 * - Hem tekil value objesi hem de ayrık prop'lar (ilId, ilceId, adres) ile çift yönlü esnek kullanım
 * - Material Design 3 tasarım token'ları ve sıfır inline stil mimarisi
 * - Dışarıdan "Adres Belirle" fonksiyonunu çağırma desteği (ref / actionRef ve openAdresBelirle metodu)
 * 
 * ============================================================================
 * DIŞARIDAN "ADRES BELİRLE" FONKSİYONUNU ÇAĞIRMA (KULLANIM KILAVUZU)
 * ============================================================================
 * 
 * 1. STANDART REACT REF İLE KULLANIM (ÖNERİLEN):
 * ----------------------------------------------------------------------------
 * import React, { useRef } from 'react';
 * import { AdresLayer, AdresLayerRef } from '@webakus/ui';
 * 
 * export const OrnekForm = () => {
 *   // 1. AdresLayer referansını tanımlayın:
 *   const adresLayerRef = useRef<AdresLayerRef>(null);
 *   const [formData, setFormData] = useState({});
 * 
 *   // 2. Kendi harici butonunuzun tıklama olayında çağırın:
 *   const handleAdresSecClick = () => {
 *     adresLayerRef.current?.openAdresBelirle(); // veya: openAdresSecici()
 *   };
 * 
 *   return (
 *     <div>
 *       {/* Harici / Üst araç çubuğundaki özel buton *\/}
 *       <button type="button" onClick={handleAdresSecClick}>
 *         Adres Belirle (Harici Buton)
 *       </button>
 * 
 *       {/* AdresLayer: Dahili butonu gizlemek için hideAdresSeciciButton={true} verebilirsiniz *\/}
 *       <AdresLayer
 *         ref={adresLayerRef}
 *         hideAdresSeciciButton={true}
 *         value={formData}
 *         onChange={(newVal) => setFormData(newVal)}
 *       />
 *     </div>
 *   );
 * };
 * 
 * 2. ACTIONREF PROP'U İLE KULLANIM:
 * ----------------------------------------------------------------------------
 * const adresActionRef = useRef<AdresLayerRef>(null);
 * 
 * <AdresLayer
 *   actionRef={adresActionRef}
 *   hideAdresSeciciButton={true}
 *   value={formData}
 *   onChange={setFormData}
 * />
 * 
 * // İstenilen yerde çağırma:
 * adresActionRef.current?.openAdresBelirle();
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useImperativeHandle } from 'react';
import axios from 'axios';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FieldError } from '@akalin/ui';
import AdresSeciciForm, { AdresSeciciFormResult } from '../../pages/pageForSelect/AdresSeciciForm';
import ModulTanitimModal from '../modal/ModulTanitimModal';
import useModulGate from '../../hooks/UI/useModulGate';

export interface AdresItemOption {
  id: number;
  ad: string;
  [key: string]: any;
}

export interface AdresLayerValue {
  adres?: string;
  acikAdres?: string;
  adresIlId?: number | string | null;
  ilId?: number | string | null;
  adresIlceId?: number | string | null;
  ilceId?: number | string | null;
  adresBucakId?: number | string | null;
  adresKoyId?: number | string | null;
  adresMahalleId?: number | string | null;
  adresCaddeSokakId?: number | string | null;
  adresDisKapiId?: number | string | null;
  adresIcKapiId?: number | string | null;
  ilAdi?: string | null;
  ilceAdi?: string | null;
  [key: string]: any;
}

export interface AdresLayerErrors {
  il?: string;
  ilce?: string;
  adres?: string;
  [key: string]: string | undefined;
}

/**
 * AdresLayer bileşeni dışından kontrol ve fonksiyon çağırma arayüzü (AdresLayerRef)
 * 
 * Bu referans üzerinden "Adres Belirle" (7 seviyeli resmi adres hiyerarşi seçicisi)
 * modal penceresi veya üst sayfanın özel onAdresSeciciClick rotası dışarıdan tetiklenebilir.
 */
export interface AdresLayerRef {
  /**
   * "Adres Belirle" düğmesinin çalıştırdığı fonksiyonu programatik olarak tetikler.
   * MOD_ADRES modül kontrolünü yapar; modül aktifse AdresSeciciForm modalını,
   * pasifse tanıtım penceresini açar.
   */
  openAdresBelirle: () => void;

  /**
   * openAdresBelirle fonksiyonunun alternatif / alias metod adı.
   */
  openAdresSecici: () => void;
}

export interface AdresLayerProps {
  /**
   * İsteğe bağlı üst başlık metni
   */
  title?: string;

  /**
   * Adres verisini barındıran nesne
   */
  value?: AdresLayerValue;

  /**
   * Seçili İl ID'si (ayrık kullanım için)
   */
  ilId?: number | string | null;

  /**
   * Seçili İlçe ID'si (ayrık kullanım için)
   */
  ilceId?: number | string | null;

  /**
   * Açık adres metni (ayrık kullanım için)
   */
  adres?: string;

  /**
   * Değer değiştiğinde tetiklenen callback
   */
  onChange?: (value: AdresLayerValue) => void;

  /**
   * Yalnızca İl değiştiğinde tetiklenen callback
   */
  onIlChange?: (ilId: number | null, ilItem?: AdresItemOption | null) => void;

  /**
   * Yalnızca İlçe değiştiğinde tetiklenen callback
   */
  onIlceChange?: (ilceId: number | null, ilceItem?: AdresItemOption | null) => void;

  /**
   * Yalnızca Adres metni değiştiğinde tetiklenen callback
   */
  onAdresChange?: (adres: string) => void;

  /**
   * İl alanı etiketi (varsayılan: "İl")
   */
  ilLabel?: string;

  /**
   * İlçe alanı etiketi (varsayılan: "İlçe")
   */
  ilceLabel?: string;

  /**
   * Açık adres alanı etiketi (varsayılan: "Açık Adres")
   */
  adresLabel?: string;

  /**
   * Açık adres yer tutucu metni
   */
  placeholder?: string;

  /**
   * Hata nesnesi
   */
  errors?: AdresLayerErrors;

  /**
   * Genel veya adres alanına ait hata metni
   */
  error?: string;

  /**
   * İl alanına özel hata metni
   */
  ilError?: string;

  /**
   * İlçe alanına özel hata metni
   */
  ilceError?: string;

  /**
   * Açık adres alanına özel hata metni
   */
  adresError?: string;

  /**
   * Zorunlu alan işareti (*) gösterilip gösterilmeyeceği
   */
  required?: boolean;

  /**
   * Bileşenin devre dışı olup olmadığı
   */
  disabled?: boolean;

  /**
   * Salt okunur olup olmadığı
   */
  readOnly?: boolean;

  /**
   * "Adres Belirle" (AdresSeciciForm) butonunun gösterilip gösterilmeyeceği (varsayılan: true)
   */
  showAdresSeciciButton?: boolean;

  /**
   * "Adres Belirle" butonunun gizlenip gizlenmeyeceği (varsayılan: false)
   */
  hideAdresSeciciButton?: boolean;

  /**
   * "Adres Belirle" butonunun gizlenip gizlenmeyeceği (alternatif prop adı, varsayılan: false)
   */
  hideAdresBelirleButton?: boolean;

  /**
   * "Adres Belirle" butonuna tıklandığında modalı kendi yönetmek isteyen üst sayfalar için callback
   */
  onAdresSeciciClick?: () => void;

  /**
   * Dışarıdan "Adres Belirle" fonksiyonunu çağırmak için alternatif ref prop'u
   * (Standart `ref={...}` kullanımı ile aynı işlevi görür)
   */
  actionRef?: React.RefObject<AdresLayerRef> | React.MutableRefObject<AdresLayerRef | null>;

  /**
   * Adres Seçici modalı açıldığında gösterilecek ekmek kırıntısı (Breadcrumb)
   */
  breadcrumb?: React.ReactNode;

  /**
   * Textarea satır sayısı (varsayılan: 3)
   */
  adresRows?: number;

  /**
   * Ek CSS sınıfı
   */
  className?: string;
}

// ─── In-Memory Önbellek (Aynı oturumdaki çoklu istekleri önler) ───
let globalIllerCache: AdresItemOption[] | null = null;
let globalIllerPromise: Promise<AdresItemOption[]> | null = null;
const globalIlcelerCache = new Map<number, AdresItemOption[]>();

const fetchIllerCached = async (): Promise<AdresItemOption[]> => {
  if (globalIllerCache) return globalIllerCache;
  if (!globalIllerPromise) {
    globalIllerPromise = axios.get('/api/AdresYonetimi/Iller')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        // İsme göre alfabetik sırala (Türkçe duyarlı)
        data.sort((a: any, b: any) => (a.ad || '').localeCompare(b.ad || '', 'tr'));
        globalIllerCache = data;
        return data;
      })
      .catch(err => {
        globalIllerPromise = null;
        console.error('İller listesi yüklenemedi:', err);
        return [];
      });
  }
  return globalIllerPromise;
};

const fetchIlcelerCached = async (ilId: number): Promise<AdresItemOption[]> => {
  if (globalIlcelerCache.has(ilId)) {
    return globalIlcelerCache.get(ilId)!;
  }
  try {
    const res = await axios.get(`/api/AdresYonetimi/Ilceler/${ilId}`);
    const data = Array.isArray(res.data) ? res.data : [];
    data.sort((a: any, b: any) => (a.ad || '').localeCompare(b.ad || '', 'tr'));
    globalIlcelerCache.set(ilId, data);
    return data;
  } catch (err) {
    console.error(`İlçeler (${ilId}) yüklenemedi:`, err);
    return [];
  }
};

const AdresLayer = React.forwardRef<AdresLayerRef, AdresLayerProps>(({
  title,
  value,
  ilId: propIlId,
  ilceId: propIlceId,
  adres: propAdres,
  breadcrumb,
  onChange,
  onIlChange,
  onIlceChange,
  onAdresChange,
  ilLabel,
  ilceLabel,
  adresLabel,
  placeholder,
  errors,
  error,
  ilError: propIlError,
  ilceError: propIlceError,
  adresError: propAdresError,
  required = false,
  disabled = false,
  readOnly = false,
  showAdresSeciciButton = true,
  hideAdresSeciciButton = false,
  hideAdresBelirleButton = false,
  onAdresSeciciClick,
  actionRef,
  adresRows = 3,
  className = ''
}, ref) => {
  const { t } = useTranslation();

  // Etkin Değerler (value nesnesi veya ayrık prop'lar)
  const rawIlId = value?.adresIlId ?? value?.ilId ?? propIlId;
  const currentIlId = rawIlId !== undefined && rawIlId !== null && rawIlId !== '' ? Number(rawIlId) : null;

  const rawIlceId = value?.adresIlceId ?? value?.ilceId ?? propIlceId;
  const currentIlceId = rawIlceId !== undefined && rawIlceId !== null && rawIlceId !== '' ? Number(rawIlceId) : null;

  const currentAdres = value?.adres ?? value?.acikAdres ?? propAdres ?? '';

  // "Adres Belirle" Butonu Görünürlük Durumu
  const isAdresSeciciHidden = hideAdresSeciciButton || hideAdresBelirleButton || !showAdresSeciciButton;
  const shouldShowAdresSecici = !isAdresSeciciHidden && !readOnly;

  // State
  const [iller, setIller] = useState<AdresItemOption[]>(() => globalIllerCache || []);
  const [ilceler, setIlceler] = useState<AdresItemOption[]>(() => {
    if (currentIlId && globalIlcelerCache.has(currentIlId)) {
      return globalIlcelerCache.get(currentIlId)!;
    }
    return [];
  });
  const [loadingIller, setLoadingIller] = useState(false);
  const [loadingIlceler, setLoadingIlceler] = useState(false);

  // ─── Modül Denetimi ve Modal Yönetimi ───
  const [isAdresSeciciOpen, setIsAdresSeciciOpen] = useState(false);
  const { requireModule, isModalOpen: isPromoOpen, closeModal: closePromo } = useModulGate('MOD_ADRES');

  // İller Listesini Yükle
  useEffect(() => {
    let isMounted = true;
    if (!globalIllerCache) {
      setLoadingIller(true);
      fetchIllerCached().then(data => {
        if (isMounted) {
          setIller(data);
          setLoadingIller(false);
        }
      });
    } else {
      setIller(globalIllerCache);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // İl Seçimi Değiştiğinde İlçeleri Yükle
  useEffect(() => {
    let isMounted = true;
    if (currentIlId) {
      if (globalIlcelerCache.has(currentIlId)) {
        setIlceler(globalIlcelerCache.get(currentIlId)!);
      } else {
        setLoadingIlceler(true);
        fetchIlcelerCached(currentIlId).then(data => {
          if (isMounted) {
            setIlceler(data);
            setLoadingIlceler(false);
          }
        });
      }
    } else {
      setIlceler([]);
    }
    return () => {
      isMounted = false;
    };
  }, [currentIlId]);

  // Hata Çözümleme
  const resolvedIlError = propIlError || errors?.il || errors?.adresIlId;
  const resolvedIlceError = propIlceError || errors?.ilce || errors?.adresIlceId;
  const resolvedAdresError = propAdresError || errors?.adres || error;

  // Etiketler
  const resolvedIlLabel = ilLabel || t('il', 'İl');
  const resolvedIlceLabel = ilceLabel || t('ilce', 'İlçe');
  const resolvedAdresLabel = adresLabel || t('acik_adres', 'Açık Adres');
  const resolvedPlaceholder = placeholder || t('adres_detay_placeholder', 'Cadde, sokak, mahalle, bina ve kapı no...');

  // ─── Değişim İşleyicileri ───
  const handleIlSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rawVal = e.target.value;
    const selectedId = rawVal ? Number(rawVal) : null;
    const selectedIl = selectedId ? iller.find(i => i.id === selectedId) || null : null;

    if (onIlChange) {
      onIlChange(selectedId, selectedIl);
    }

    if (onChange) {
      const nextValue: AdresLayerValue = {
        ...(value || {}),
        adresIlId: selectedId,
        ilId: selectedId,
        adresIlceId: null,
        ilceId: null,
        ilAdi: selectedIl?.ad || null,
        ilceAdi: null,
        // İl değiştiğinde alt detay ID'lerini sıfırla
        adresBucakId: null,
        adresKoyId: null,
        adresMahalleId: null,
        adresCaddeSokakId: null,
        adresDisKapiId: null,
        adresIcKapiId: null
      };
      onChange(nextValue);
    }
  };

  const handleIlceSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rawVal = e.target.value;
    const selectedId = rawVal ? Number(rawVal) : null;
    const selectedIlce = selectedId ? ilceler.find(i => i.id === selectedId) || null : null;

    if (onIlceChange) {
      onIlceChange(selectedId, selectedIlce);
    }

    if (onChange) {
      const nextValue: AdresLayerValue = {
        ...(value || {}),
        adresIlId: currentIlId,
        ilId: currentIlId,
        adresIlceId: selectedId,
        ilceId: selectedId,
        ilceAdi: selectedIlce?.ad || null,
        // İlçe değiştiğinde alt mahalle/sokak ID'lerini sıfırla
        adresBucakId: null,
        adresKoyId: null,
        adresMahalleId: null,
        adresCaddeSokakId: null,
        adresDisKapiId: null,
        adresIcKapiId: null
      };
      onChange(nextValue);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;

    if (onAdresChange) {
      onAdresChange(text);
    }

    if (onChange) {
      onChange({
        ...(value || {}),
        adres: text,
        acikAdres: text
      });
    }
  };

  const handleAdresSeciciSave = (result: AdresSeciciFormResult) => {
    const newIlId = result.ids.adresIlId ? Number(result.ids.adresIlId) : null;
    const newIlceId = result.ids.adresIlceId ? Number(result.ids.adresIlceId) : null;

    // İlçeler listesini hazırla
    if (newIlId) {
      fetchIlcelerCached(newIlId).then(data => {
        setIlceler(data);
      });
    }

    if (onChange) {
      const nextValue: AdresLayerValue = {
        ...(value || {}),
        adres: result.formattedAdres || value?.adres || '',
        acikAdres: result.formattedAdres || value?.adres || '',
        adresIlId: newIlId,
        ilId: newIlId,
        adresIlceId: newIlceId,
        ilceId: newIlceId,
        adresBucakId: result.ids.adresBucakId ?? null,
        adresKoyId: result.ids.adresKoyId ?? null,
        adresMahalleId: result.ids.adresMahalleId ?? null,
        adresCaddeSokakId: result.ids.adresCaddeSokakId ?? null,
        adresDisKapiId: result.ids.adresDisKapiId ?? null,
        adresIcKapiId: result.ids.adresIcKapiId ?? null,
        ilAdi: result.parts?.il || null,
        ilceAdi: result.parts?.ilce || null
      };
      onChange(nextValue);
    }

    if (onIlChange && newIlId) {
      const matchingIl = iller.find(i => i.id === newIlId) || null;
      onIlChange(newIlId, matchingIl);
    }

    if (onIlceChange) {
      onIlceChange(newIlceId, null);
    }

    if (onAdresChange) {
      onAdresChange(result.formattedAdres || '');
    }
  };

  /**
   * "Adres Belirle" düğmesinin çalıştırdığı ana fonksiyon.
   * MOD_ADRES yetkisini kontrol eder. Yetki varsa AdresSeciciForm'u açar
   * veya onAdresSeciciClick callback'ini tetikler. Yetki yoksa tanıtım modalını açar.
   */
  const handleTriggerAdresBelirle = useCallback(() => {
    if (disabled || readOnly) return;
    if (onAdresSeciciClick) {
      onAdresSeciciClick();
      return;
    }
    requireModule(() => {
      setIsAdresSeciciOpen(true);
    });
  }, [disabled, readOnly, requireModule, onAdresSeciciClick]);

  // Dışarıya ref üzerinden açık metotları bağla
  useImperativeHandle(ref, () => ({
    openAdresBelirle: handleTriggerAdresBelirle,
    openAdresSecici: handleTriggerAdresBelirle
  }), [handleTriggerAdresBelirle]);

  // actionRef prop'u da verilmişse onu da bağla
  useEffect(() => {
    if (actionRef) {
      (actionRef as React.MutableRefObject<AdresLayerRef | null>).current = {
        openAdresBelirle: handleTriggerAdresBelirle,
        openAdresSecici: handleTriggerAdresBelirle
      };
    }
  }, [actionRef, handleTriggerAdresBelirle]);

  return (
    <div className={`adres-layer ${className}`}>
      {/* İsteğe Bağlı Üst Başlık (Yalnızca title prop'u verildiğinde görünür) */}
      {title && <h4 className="adres-layer-title">{title}</h4>}

      {/* İL, İLÇE VE ADRES BELİRLE (3 Sütunlu Kompakt Grid - Sıfır Dikey Boşluk) */}
      <div className={`adres-layer-grid ${shouldShowAdresSecici ? 'has-action' : ''}`}>
        {/* Adres Belirle Butonu (Sol başta / Mobilde en üstte) */}
        {shouldShowAdresSecici && (
          <div className="adres-layer-field adres-layer-action-field">
            <label className="form-label adres-layer-action-label" aria-hidden="true">&nbsp;</label>
            <button
              type="button"
              disabled={disabled}
              className="btn btn-outline-secondary adres-secici-btn adres-layer-action-btn flex items-center gap-6"
              onClick={handleTriggerAdresBelirle}
              title={t('adres_belirle', 'Adres Belirle')}
            >
              <MapPin size={15} className="shrink-0" />
              <span className="adres-secici-text">{t('adres_belirle', 'Adres Belirle')}</span>
            </button>
          </div>
        )}

        {/* İl Seçici */}
        <div className="adres-layer-field">
          <label className="form-label">
            {resolvedIlLabel} {required && <span className="required-mark">*</span>}
          </label>
          <select
            className={`form-input adres-layer-select ${resolvedIlError ? 'is-invalid' : ''}`}
            value={currentIlId ?? ''}
            onChange={handleIlSelectChange}
            disabled={disabled || readOnly || loadingIller}
          >
            <option value="">
              {loadingIller ? t('ilceler_yukleniyor', 'İlçeler Yükleniyor...') : t('il_seciniz', 'İl Seçiniz')}
            </option>
            {iller.map(il => (
              <option key={il.id} value={il.id}>
                {il.ad}
              </option>
            ))}
          </select>
          <FieldError error={resolvedIlError} />
        </div>

        {/* İlçe Seçici */}
        <div className="adres-layer-field">
          <label className="form-label">
            {resolvedIlceLabel} {required && <span className="required-mark">*</span>}
          </label>
          <select
            className={`form-input adres-layer-select ${resolvedIlceError ? 'is-invalid' : ''}`}
            value={currentIlceId ?? ''}
            onChange={handleIlceSelectChange}
            disabled={disabled || readOnly || !currentIlId || loadingIlceler}
          >
            <option value="">
              {!currentIlId 
                ? t('once_il_seciniz', 'Önce İl Seçiniz') 
                : loadingIlceler 
                  ? t('ilceler_yukleniyor', 'İlçeler Yükleniyor...') 
                  : t('ilce_seciniz', 'İlçe Seçiniz')}
            </option>
            {ilceler.map(ilce => (
              <option key={ilce.id} value={ilce.id}>
                {ilce.ad}
              </option>
            ))}
          </select>
          <FieldError error={resolvedIlceError} />
        </div>
      </div>

      {/* ALT SATIR: Açık Adres */}
      <div className="adres-layer-field full-width">
        <label className="form-label">
          {resolvedAdresLabel} {required && <span className="required-mark">*</span>}
        </label>
        <textarea
          className={`form-input ${resolvedAdresError ? 'is-invalid' : ''}`}
          rows={adresRows}
          value={currentAdres}
          onChange={handleTextareaChange}
          placeholder={resolvedPlaceholder}
          disabled={disabled}
          readOnly={readOnly}
        />
        <FieldError error={resolvedAdresError} />
      </div>

      {/* Modül Aktif İse Açılan Adres Seçim Formu (Dahili buton gizli olsa dahi dışarıdan ref ile tetiklendiğinde açılır) */}
      {isAdresSeciciOpen && (
        <AdresSeciciForm
          isOpen={isAdresSeciciOpen}
          onClose={() => setIsAdresSeciciOpen(false)}
          initialData={{
            adres: currentAdres,
            adresIlId: currentIlId,
            adresIlceId: currentIlceId,
            adresBucakId: value?.adresBucakId,
            adresKoyId: value?.adresKoyId,
            adresMahalleId: value?.adresMahalleId,
            adresCaddeSokakId: value?.adresCaddeSokakId,
            adresDisKapiId: value?.adresDisKapiId,
            adresIcKapiId: value?.adresIcKapiId
          }}
          onSave={handleAdresSeciciSave}
        />
      )}

      {/* Modül Eksik İse Açılan Tanıtım, Kampanya ve Satın Alma Reklam Penceresi */}
      <ModulTanitimModal
        isOpen={isPromoOpen}
        onClose={closePromo}
        modulKodu="MOD_ADRES"
        icon="MapPin"
      />
    </div>
  );
});

AdresLayer.displayName = 'AdresLayer';

export default AdresLayer;

