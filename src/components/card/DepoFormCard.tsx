/**
 * Webakus UI Core - Depo ve Şube Form Kartı (DepoFormCard)
 * 
 * BaseCard bileşeninden türeyen, firma ve şube/depo yönetiminde lokasyon
 * adreslerinin tanımlanması ve yönetimi için kullanılan standart form kartı bileşenidir.
 * 
 * Başlıca Özellikleri:
 * - BaseCard mimarisi üzerine kurulu MD3 uyumlu görsel kart
 * - Lokasyon türüne (Şube / Depo) göre dinamik ikon ve etiketleme
 * - Header sağ bölümünde konumlandırılmış "Adres Belirle" (AdresSeciciButton) eylemi
 * - "Merkez Şube Adresi ile Aynı Yap" hızlı kopyalama eylemi
 * - Dahili butonu gizlenmiş (hideAdresSeciciButton={true}), 2 sütunlu tam grid AdresLayer entegrasyonu
 * - Sıfır inline CSS & tam i18n çoklu dil uyumu
 */

import React from 'react';
import { BaseCard } from '@akalin/ui';
import { Building2, Warehouse, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdresLayer, { AdresLayerRef } from '../layer/AdresLayer';
import AdresSeciciButton from '../button/AdresSeciciButton';
import { AdresSeciciFormResult } from '../../pages/pageForSelect/AdresSeciciForm';

export interface DepoFormCardItem {
  id?: string | number | null;
  kod?: string;
  kodu?: string;
  ad?: string;
  unvan?: string;
  tur?: number;
  adres?: string;
  acikAdres?: string;
  adresIlId?: number | string | null;
  adresIlceId?: number | string | null;
  adresBucakId?: number | string | null;
  adresKoyId?: number | string | null;
  adresMahalleId?: number | string | null;
  adresCaddeSokakId?: number | string | null;
  adresDisKapiId?: number | string | null;
  adresIcKapiId?: number | string | null;
  [key: string]: any;
}

export interface DepoFormCardProps {
  /**
   * Depo veya şube lokasyon nesnesi
   */
  item: DepoFormCardItem;

  /**
   * Merkez şube adresi ile aynı yapabilmek için referans şube nesnesi (varsa kopyalama butonu açılır)
   */
  branchItem?: DepoFormCardItem | null;

  /**
   * Şube adresini kopyalama butonuna tıklandığında tetiklenir
   */
  onCopyBranchAddress?: (item: DepoFormCardItem, branchItem: DepoFormCardItem) => void;

  /**
   * Adres alanları değiştiğinde tetiklenir
   */
  onAddressChange?: (updatedAddress: any) => void;

  /**
   * "Adres Belirle" butonuna tıklandığında (alt sayfa veya modal için) callback
   */
  onAdresSeciciClick?: (item: DepoFormCardItem) => void;

  /**
   * Kart için hata mesajı
   */
  error?: string;

  /**
   * Zorunlu alan kontrolü (varsayılan: true)
   */
  required?: boolean;

  /**
   * Devre dışı mı
   */
  disabled?: boolean;

  /**
   * Salt okunur mu
   */
  readOnly?: boolean;

  /**
   * Header bölümündeki "Adres Belirle" butonunu gizleme seçeneği (varsayılan: false)
   */
  hideHeaderAdresSeciciButton?: boolean;

  /**
   * AdresLayer içindeki "Adres Belirle" butonunu gizleme seçeneği (varsayılan: true)
   */
  hideAdresSeciciButton?: boolean;

  /**
   * Adres Seçici modalı için Breadcrumb
   */
  breadcrumb?: React.ReactNode;

  /**
   * AdresLayer ref bağlantısı
   */
  adresLayerRef?: React.Ref<AdresLayerRef>;

  /**
   * AdresLayer actionRef bağlantısı
   */
  adresActionRef?: React.RefObject<AdresLayerRef> | React.MutableRefObject<AdresLayerRef | null>;

  /**
   * Ekstra CSS sınıfları
   */
  className?: string;

  /**
   * BaseCard için varyant ('outlined' | 'elevated' | 'filled')
   */
  variant?: 'outlined' | 'elevated' | 'filled';
}

const DepoFormCard = React.forwardRef<HTMLElement, DepoFormCardProps>(({
  item,
  branchItem,
  onCopyBranchAddress,
  onAddressChange,
  onAdresSeciciClick,
  error,
  required = true,
  disabled = false,
  readOnly = false,
  hideHeaderAdresSeciciButton = false,
  hideAdresSeciciButton = true,
  breadcrumb,
  adresLayerRef,
  adresActionRef,
  className = '',
  variant = 'outlined'
}, ref) => {
  const { t } = useTranslation();

  const isBranch = item.tur === 3;
  const isWarehouse = !isBranch;
  const canCopyFromBranch = isWarehouse && branchItem && branchItem.adres && branchItem.adres.trim() !== '' && Boolean(onCopyBranchAddress);

  const title = item.ad || item.unvan || item.kod || (isBranch ? t('merkez_sube_bolumu', 'Merkez Şube') : t('merkez_depo_bolumu', 'Merkez Depo'));
  const tagCode = item.kod || item.kodu || '';
  const typeLabel = isBranch ? t('sube', 'Şube') : t('depo', 'Depo');
  const adresLabel = isBranch ? t('sube_adresi', 'Merkez Şube Açık Adresi') : t('depo_adresi', 'Merkez Depo Açık Adresi');

  const handleAdresSeciciSave = (result: AdresSeciciFormResult) => {
    const newIlId = result.ids.adresIlId ? Number(result.ids.adresIlId) : null;
    const newIlceId = result.ids.adresIlceId ? Number(result.ids.adresIlceId) : null;

    if (onAddressChange) {
      onAddressChange({
        ...(item || {}),
        adres: result.formattedAdres || item?.adres || '',
        acikAdres: result.formattedAdres || item?.adres || '',
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
      });
    }
  };

  return (
    <BaseCard
      ref={ref}
      variant={variant}
      className={`depo-form-card ${error ? 'has-error' : ''} ${className}`}
    >
      <div className="depo-form-card-header">
        <div className="depo-form-card-header-left">
          <div className={`depo-form-icon-box ${isBranch ? 'sube' : 'depo'}`}>
            {isBranch ? <Building2 size={20} /> : <Warehouse size={20} />}
          </div>
          <div>
            <h4 className="depo-form-title">{title}</h4>
            <div className="depo-form-subtitle">
              {tagCode && <span className="depo-form-tag">{tagCode}</span>}
              {tagCode && <span>•</span>}
              <span>{typeLabel}</span>
            </div>
          </div>
        </div>

        <div className="depo-form-card-header-right flex items-center gap-8">
          {canCopyFromBranch && (
            <button
              type="button"
              className="depo-copy-btn"
              onClick={() => onCopyBranchAddress && onCopyBranchAddress(item, branchItem!)}
              title={t('sube_adresini_kopyala', 'Merkez Şube Adresini Kopyala')}
            >
              <Copy size={14} />
              <span>{t('sube_adresi_ile_ayni', 'Merkez Şube Adresi ile Aynı Yap')}</span>
            </button>
          )}

          {!hideHeaderAdresSeciciButton && !readOnly && (
            <AdresSeciciButton
              disabled={disabled}
              className="depo-header-adres-btn"
              text={t('adres_belirle', 'Adres Belirle')}
              breadcrumb={breadcrumb}
              onClick={onAdresSeciciClick ? () => onAdresSeciciClick(item) : undefined}
              initialData={{
                adres: item.adres || item.acikAdres || '',
                adresIlId: item.adresIlId ?? item.ilId,
                adresIlceId: item.adresIlceId ?? item.ilceId,
                adresBucakId: item.adresBucakId,
                adresKoyId: item.adresKoyId,
                adresMahalleId: item.adresMahalleId,
                adresCaddeSokakId: item.adresCaddeSokakId,
                adresDisKapiId: item.adresDisKapiId,
                adresIcKapiId: item.adresIcKapiId
              }}
              onSave={handleAdresSeciciSave}
            />
          )}
        </div>
      </div>

      <AdresLayer
        ref={adresLayerRef}
        actionRef={adresActionRef}
        hideAdresSeciciButton={hideAdresSeciciButton}
        value={item}
        onAdresSeciciClick={onAdresSeciciClick ? () => onAdresSeciciClick(item) : undefined}
        onChange={onAddressChange}
        adresLabel={adresLabel}
        error={error}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
      />
    </BaseCard>
  );
});

DepoFormCard.displayName = 'DepoFormCard';

export default DepoFormCard;

