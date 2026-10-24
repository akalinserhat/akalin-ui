/**
 * Webakus UI Core - Rol Seçim Kartı (RolCard / RolSecimKarti)
 * 
 * BaseCard sınıfından türeyen; kullanıcı davet ve yetkilendirme ekranlarında
 * sistem rollerini Material Design 3 tasarım standartlarında sunan kart bileşenidir.
 * 
 * Başlıca Özellikleri:
 * - BaseCard mimarisi üzerine inşa edilmiştir.
 * - Sol tarafında: Rol ikonu (varsayılan: Shield) kutusu.
 * - Orta kesimde: Rol adı ve açıklaması.
 * - Sağ tarafında: BaseSwitch geçiş anahtarı.
 * - Tıklanabilir (interactive) yapı: Kartın geneline veya switch'e tıklandığında seçim durumu değişir.
 * - Sıfır inline CSS & tam responsive Material Design 3 (MD3) uyumu.
 */

import React from 'react';
import { Shield } from 'lucide-react';
import { BaseCard, BaseCardProps, CardVariant } from '@akalin/ui';
import { BaseSwitch } from '@akalin/ui';

export interface RolCardItem {
  id: number | string;
  ad: string;
  aciklama?: string;
  [key: string]: any;
}

export interface RolCardProps extends Omit<BaseCardProps, 'onChange'> {
  /**
   * Görüntülenecek rol bilgisi nesnesi
   */
  rol: RolCardItem;

  /**
   * Sağ taraftaki BaseSwitch ve kart aktiflik durumu (checked)
   */
  checked: boolean;

  /**
   * BaseSwitch değeri veya kart seçimi değiştiğinde tetiklenecek fonksiyon
   */
  onChange?: (checked: boolean, rol?: RolCardItem) => void;

  /**
   * Sol tarafta gösterilecek özel ikon (Varsayılan: Shield)
   */
  icon?: React.ReactNode;

  /**
   * Kart ve anahtarın devre dışı olma durumu
   * @default false
   */
  disabled?: boolean;

  /**
   * BaseCard varyantı ('outlined' | 'elevated' | 'filled')
   * @default 'outlined'
   */
  variant?: CardVariant;

  /**
   * Ekstra CSS sınıfları
   */
  className?: string;
}

const RolCard = React.forwardRef<HTMLElement, RolCardProps>(
  (
    {
      rol,
      checked,
      onChange,
      icon,
      disabled = false,
      variant = 'outlined',
      className = '',
      ...rest
    },
    ref
  ) => {
    const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return;
      // Eğer tıklanan element doğrudan input checkbox ise switch kendi event'ini tetikler
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (onChange) {
        onChange(!checked, rol);
      }
    };

    const cardClasses = [
      'rol-card',
      checked ? 'is-active' : '',
      disabled ? 'is-disabled' : '',
      className
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <BaseCard
        ref={ref}
        variant={variant}
        interactive={!disabled}
        onClick={handleCardClick}
        className={cardClasses}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onChange?.(!checked, rol);
          }
        }}
        {...rest}
      >
        {/* 1. Sol: Rol İkon Kutusu */}
        <div className="rol-card-icon-box" aria-hidden="true">
          {icon || <Shield size={18} />}
        </div>

        {/* 2. Orta: Rol Adı ve Açıklaması */}
        <div className="rol-card-center flex-col flex-1 gap-2">
          <span className={`rol-card-title ${checked ? 'text-accent font-600' : 'text-primary font-500'}`}>
            {rol.ad}
          </span>
          {rol.aciklama && (
            <span className="rol-card-desc text-12 text-secondary">
              {rol.aciklama}
            </span>
          )}
        </div>

        {/* 3. Sağ: BaseSwitch Anahtarı */}
        <div
          className="rol-card-right"
          onClick={(e) => e.stopPropagation()}
        >
          <BaseSwitch
            checked={checked}
            disabled={disabled}
            onChange={(e) => {
              if (onChange) {
                onChange(e.target.checked, rol);
              }
            }}
          />
        </div>
      </BaseCard>
    );
  }
);

RolCard.displayName = 'RolCard';

export default RolCard;
