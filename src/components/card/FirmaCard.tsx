/**
 * Webakus UI Core - Firma Kartı Bileşeni (FirmaCard)
 * BaseCard altyapısı üzerine inşa edilmiş, kullanıcı veya sistem genelinde
 * bağlı firma bilgilerini (firma adı, rolü, firma kodu vb.) Material Design 3
 * tasarım ilkelerine uygun olarak sunan kart bileşeni.
 */

import React from 'react';
import { Building, ShieldCheck, Hash, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseCard, BaseCardProps, CardVariant } from '@akalin/ui';

export interface FirmaCardItem {
  id?: string | number;
  firmaId?: string | number;
  firmaAdi?: string;
  ad?: string;
  unvan?: string;
  firmaKodu?: string;
  kod?: string;
  rol?: string;
  rolAd?: string;
  vergiNo?: string;
  vergiDairesi?: string;
  telefon?: string;
  email?: string;
  aktifMi?: boolean;
  [key: string]: any;
}

export interface FirmaCardProps extends Omit<BaseCardProps, 'onClick'> {
  /** Görüntülenecek firma veya kullanıcı yetki nesnesi */
  firma: FirmaCardItem;
  /** Düzenleme butonuna tıklandığında çalışır */
  onEdit?: (firma: FirmaCardItem, e?: React.MouseEvent) => void;
  /** Silme butonuna tıklandığında çalışır */
  onDelete?: (firma: FirmaCardItem, e?: React.MouseEvent) => void;
  /** Karta tıklandığında çalışır */
  onClick?: (firma: FirmaCardItem, e?: React.MouseEvent) => void;
  /** Kartın sağ üst veya aksiyon alanına özel bileşenler ekler */
  actions?: React.ReactNode;
  /** İlave durum veya yetki rozeti */
  extraBadge?: React.ReactNode;
  /** Kartın MD3 görsel varyantı ('elevated' | 'filled' | 'outlined') */
  variant?: CardVariant;
  /** Kart tıklanabilir / etkileşimli mi? */
  interactive?: boolean;
  /** Ekstra CSS sınıfları */
  className?: string;
}

const FirmaCard = React.forwardRef<HTMLElement, FirmaCardProps>(
  (
    {
      firma,
      onEdit,
      onDelete,
      onClick,
      actions,
      extraBadge,
      variant = 'elevated',
      interactive = false,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    const { t } = useTranslation();

    const isInteractive = interactive || Boolean(onClick);

    const displayName = firma.firmaAdi || firma.ad || firma.unvan || t('isimsiz_firma', 'İsimsiz Firma');
    const displayCode = firma.firmaKodu || firma.kod;
    const displayRole = firma.rol || firma.rolAd;

    const handleClick = (e: React.MouseEvent) => {
      if (onClick) {
        onClick(firma, e);
      }
    };

    return (
      <BaseCard
        ref={ref}
        variant={variant}
        interactive={isInteractive}
        onClick={handleClick}
        className={`firma-card ${className}`.trim()}
        {...rest}
      >
        <div className="firma-card-content">
          <div className="firma-card-header">
            <div className="firma-card-icon">
              <Building size={20} />
            </div>

            <div className="firma-card-info">
              <h4 className="firma-card-name" title={displayName}>
                {displayName}
              </h4>
              {displayCode && (
                <span className="firma-card-code">
                  <Hash size={11} />
                  <span>{displayCode}</span>
                </span>
              )}
            </div>

            {(actions || onEdit || onDelete) && (
              <div className="firma-card-actions" onClick={(e) => e.stopPropagation()}>
                {actions}
                {onEdit && (
                  <button
                    type="button"
                    className="firma-card-action-btn"
                    onClick={(e) => onEdit(firma, e)}
                    title={t('duzenle', 'Düzenle')}
                  >
                    <Edit2 size={14} />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className="firma-card-action-btn delete"
                    onClick={(e) => onDelete(firma, e)}
                    title={t('sil', 'Sil')}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {(displayRole || extraBadge) && (
            <div className="firma-card-footer">
              {displayRole && (
                <span className="firma-card-role-badge">
                  <ShieldCheck size={12} />
                  <span>{displayRole}</span>
                </span>
              )}
              {extraBadge}
            </div>
          )}

          {children}
        </div>
      </BaseCard>
    );
  }
);

FirmaCard.displayName = 'FirmaCard';

export default FirmaCard;
