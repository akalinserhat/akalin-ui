/**
 * Webakus UI Core - Adres Kartı Bileşeni (AdresCard)
 * 
 * Başlıca Görevleri:
 * - BaseCard (Material Design 3) altyapısı üzerine kurulu standart adres kartı görünümü sunmak
 * - Fatura, Sevk/Nakliye ve Genel adres verilerini (başlık, kişi/firma, formatlı açık adres, telefon vb.) listelemek
 * - Adres koordinatları veya metin bilgisi üzerinden Google Maps'te adresi göstermek/açmak
 * - Varsayılan adres rozeti, Düzenle, Sil (AlertDialog onaylı) ve Varsayılan Yap etkileşimlerini standartlaştırmak
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, CheckCircle2, Pencil, Trash2, User, Phone, CreditCard, Package, Building } from 'lucide-react';
import { BaseCard, CardVariant } from '@akalin/ui';
import { AlertDialog } from '@akalin/ui';
import { formatAdres } from '../../utils/adresFormatter';

export interface AdresItem {
  id?: number | string;
  adresId?: number | string;
  baslik?: string;
  tipi?: number; // 1: Fatura, 2: Nakliye / Sevk, 3: Genel
  tipiAdi?: string;
  varsayilanMi?: boolean;
  acikAdres?: string;
  formattedAdres?: string;
  ilAdi?: string;
  adresIl?: string;
  ilceAdi?: string;
  adresIlce?: string;
  mahalleAdi?: string;
  postaKodu?: string;
  enlem?: number | string;
  boylam?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  isimSoyisim?: string;
  telefon?: string;
  vergiDairesi?: string;
  vergiNo?: string;
  firmaAdi?: string;
  unvan?: string;
  [key: string]: any;
}

export interface AdresCardProps {
  /**
   * Gösterilecek adres verisi
   */
  adres: AdresItem;

  /**
   * Varsayılan adres olup olmadığı (Belirtilmezse adres.varsayilanMi okunur)
   */
  isDefault?: boolean;

  /**
   * Kart görsel varyantı (BaseCard standartı)
   */
  variant?: CardVariant;

  /**
   * Düzenleme butonuna tıklandığında tetiklenecek fonksiyon
   */
  onEdit?: (adres: AdresItem, e: React.MouseEvent) => void;

  /**
   * Silme butonuna tıklandığında tetiklenecek fonksiyon
   */
  onDelete?: (adres: AdresItem, e?: React.MouseEvent) => void;

  /**
   * Silme öncesinde onay sorulup sorulmayacağı
   * @default true
   */
  requireDeleteConfirm?: boolean;

  /**
   * Silme onay penceresi başlığı
   */
  deleteConfirmTitle?: string;

  /**
   * Silme onay mesajı
   */
  deleteConfirmMessage?: React.ReactNode;

  /**
   * Silme onay butonu metni
   */
  deleteConfirmText?: string;

  /**
   * Silme iptal butonu metni
   */
  deleteCancelText?: string;

  /**
   * Varsayılan yap seçeneği seçildiğinde tetiklenecek fonksiyon
   */
  onSetDefault?: (adres: AdresItem, e: React.ChangeEvent<HTMLInputElement>) => void;

  /**
   * Google Maps açma butonunu gösterme durumu
   * @default true
   */
  showMapButton?: boolean;

  /**
   * Haritada göster butonuna tıklandığında özel bir fonksiyon çalıştırmak istenirse
   */
  onOpenMap?: (adres: AdresItem, mapUrl: string) => void;

  /**
   * Vurgu rengi
   */
  accentColor?: string;

  /**
   * Varsayılan kart arka plan rengi
   */
  activeBackground?: string;

  /**
   * Karta tıklandığında tetiklenecek fonksiyon
   */
  onClick?: (adres: AdresItem, e: React.MouseEvent) => void;

  /**
   * Ek CSS sınıfları
   */
  className?: string;

  /**
   * Inline stiller
   */
  style?: React.CSSProperties;

  /**
   * Kartın alt kısmına eklenecek ek eylemler/içerikler
   */
  extraFooter?: React.ReactNode;
}

export const AdresCard: React.FC<AdresCardProps> = ({
  adres,
  isDefault: propIsDefault,
  variant,
  onEdit,
  onDelete,
  requireDeleteConfirm = true,
  deleteConfirmTitle,
  deleteConfirmMessage,
  deleteConfirmText,
  deleteCancelText,
  onSetDefault,
  showMapButton = true,
  onOpenMap,
  accentColor,
  activeBackground,
  onClick,
  className = '',
  style,
  extraFooter
}) => {
  const { t } = useTranslation();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);

  const isDefault = propIsDefault !== undefined ? propIsDefault : !!adres.varsayilanMi;
  const defaultVariant: CardVariant = variant || (isDefault ? 'elevated' : 'outlined');

  const isFatura = adres.tipi === 1;
  const isSevk = adres.tipi === 2;

  const typeClass = isFatura ? 'type-fatura' : isSevk ? 'type-sevk' : 'type-genel';
  const avatarClass = `address-type-avatar ${isFatura ? 'fatura' : isSevk ? 'sevk' : ''}`;
  const chipClass = `address-chip-default ${isFatura ? 'fatura' : isSevk ? 'sevk' : ''}`;

  // Formatlanmış Adres Metni
  const displayAddress = adres.formattedAdres || formatAdres({
    ilAdi: adres.ilAdi || adres.adresIl,
    ilceAdi: adres.ilceAdi || adres.adresIlce,
    acikAdres: adres.acikAdres
  }) || adres.ad || t('auto_adres_belirtilmemis_38ef', 'Adres belirtilmemiş');

  // Google Maps URL Üretimi
  const getGoogleMapsUrl = (): string => {
    const lat = adres.enlem ?? adres.latitude;
    const lng = adres.boylam ?? adres.longitude;

    if (lat && lng) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }

    const queryParts = [
      adres.acikAdres,
      adres.mahalleAdi,
      adres.ilceAdi || adres.adresIlce,
      adres.ilAdi || adres.adresIl,
      adres.postaKodu,
      'Türkiye'
    ].filter(Boolean);

    const query = queryParts.join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const handleOpenMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getGoogleMapsUrl();
    if (onOpenMap) {
      onOpenMap(adres, url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (requireDeleteConfirm) {
      setIsDeleteAlertOpen(true);
    } else if (onDelete) {
      onDelete(adres, e);
    }
  };

  const handleConfirmDelete = () => {
    setIsDeleteAlertOpen(false);
    if (onDelete) {
      onDelete(adres);
    }
  };

  const renderTypeIcon = () => {
    if (isFatura) return <CreditCard size={18} strokeWidth={2.2} />;
    if (isSevk) return <Package size={18} strokeWidth={2.2} />;
    return <MapPin size={18} strokeWidth={2.2} />;
  };

  return (
    <>
      <BaseCard
        variant={defaultVariant}
        interactive={!!onClick}
        className={`address-card ${typeClass} ${isDefault ? 'default' : ''} ${className}`}
        style={style}
        onClick={onClick ? (e) => onClick(adres, e) : undefined}
      >
        {/* Header: Avatar, Başlık, Varsayılan Rozeti ve Aksiyon Butonları */}
        <div className="address-card-header">
          <div className="address-card-header-left">
            <div className={avatarClass}>
              {renderTypeIcon()}
            </div>
            <div className="address-card-title-group">
              <div className="address-card-title" title={adres.baslik || t('auto_adres_785d', 'Adres')}>
                {adres.baslik || t('auto_adres_785d', 'Adres')}
              </div>
              <div className="address-card-badges">
                {isDefault && (
                  <span className={chipClass}>
                    <CheckCircle2 size={11} strokeWidth={2.5} />
                    {t('auto_varsayilan_24ff', 'Varsayılan')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="address-card-actions">
            {showMapButton && (
              <button
                type="button"
                onClick={handleOpenMap}
                className="address-action-btn"
                title={t('auto_google_maps_te_goster_89fa', "Google Maps'te Göster")}
                aria-label={t('auto_google_maps_te_goster_89fa', "Google Maps'te Göster")}
              >
                <MapPin size={14} />
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(adres, e);
                }}
                className="address-action-btn"
                title={t('auto_duzenle_58ef', 'Düzenle')}
                aria-label={t('auto_duzenle_58ef', 'Düzenle')}
              >
                <Pencil size={14} />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="address-action-btn danger"
                title={t('auto_sil_d6ef', 'Sil')}
                aria-label={t('auto_sil_d6ef', 'Sil')}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Body: Kişi / Firma, Telefon ve Açık Adres Metni */}
        <div className="address-card-body">
          {(adres.isimSoyisim || adres.unvan || adres.firmaAdi) && (
            <div className="address-card-recipient">
              {adres.firmaAdi || adres.unvan ? (
                <Building size={14} className="text-secondary opacity-70 shrink-0" />
              ) : (
                <User size={14} className="text-secondary opacity-70 shrink-0" />
              )}
              <span className="truncate">{adres.isimSoyisim || adres.unvan || adres.firmaAdi}</span>
            </div>
          )}

          {adres.telefon && (
            <div className="address-card-phone">
              <Phone size={13} className="opacity-70 shrink-0" />
              <span>{adres.telefon}</span>
            </div>
          )}

          <div className="address-card-text">
            {displayAddress}
          </div>
        </div>

        {/* Footer: Varsayılan Yap / Durum ve Özel Ekstra Alanlar */}
        {(!isDefault && onSetDefault) && (
          <div className="address-card-footer">
            <label className="address-default-radio-label">
              <input
                type="radio"
                name={`varsayilanAdres_${adres.tipi || 'all'}`}
                checked={false}
                onChange={(e) => onSetDefault(adres, e)}
                className="cursor-pointer"
              />
              <span>{t('auto_varsayilan_yap_921e', 'Varsayılan Yap')}</span>
            </label>
          </div>
        )}

        {extraFooter && (
          <div className="address-card-footer">
            {extraFooter}
          </div>
        )}
      </BaseCard>

      {onDelete && (
        <AlertDialog
          isOpen={isDeleteAlertOpen}
          onClose={() => setIsDeleteAlertOpen(false)}
          type="confirm"
          title={deleteConfirmTitle || t('auto_adresi_sil_01fa', 'Adresi Sil')}
          message={
            deleteConfirmMessage || (
              adres.baslik
                ? t('auto_adresi_silmek_istediginize_emin_misiniz_baslikli', "'{{baslik}}' başlıklı adresi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.", { baslik: adres.baslik })
                : t('auto_adresi_silmek_istediginize_emin_misiniz', 'Bu adresi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')
            )
          }
          confirmText={deleteConfirmText || t('auto_evet_sil_73fe', 'Evet, Sil')}
          cancelText={deleteCancelText || t('auto_iptal_2517', 'İptal')}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
};

export default AdresCard;
