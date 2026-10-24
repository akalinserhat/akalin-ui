import React from 'react';
import { Building2, Store, Truck, Cloud, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseSystemCard } from '@akalin/ui';

export interface DepoVeSubeItem {
  id: string | number;
  kod?: string;
  kodu?: string;
  ad: string;
  tur: number;
  telefon?: string;
  adres?: string;
  aktifMi?: boolean;
  seriTakibiYapilirMi?: boolean;
  sorumluPersonelIds?: (string | number)[];
  sorumluPersonelAdSoyad?: string;
}

export interface DepoVeSubeCardProps {
  loc: DepoVeSubeItem;
  onClick?: (loc: DepoVeSubeItem, e?: React.MouseEvent) => void;
  onEdit?: (loc: DepoVeSubeItem, e?: React.MouseEvent) => void;
  onDelete?: (loc: DepoVeSubeItem, e?: React.MouseEvent) => void;
  inMemoryMode?: boolean;
  kullanicilar?: { id: number; adSoyad: string; telefon?: string }[];
  style?: React.CSSProperties;
  className?: string;
}

const DepoVeSubeCard: React.FC<DepoVeSubeCardProps> = ({
  loc,
  onClick,
  onEdit,
  onDelete,
  inMemoryMode = false,
  kullanicilar = [],
  className = ''
}) => {
  const { t } = useTranslation();

  const getTurName = (tur: number) => {
    switch (tur) {
      case 1: return t('depo_turu_merkez', 'Merkez Depo');
      case 2: return t('depo_turu_magaza', 'Mağaza');
      case 3: return t('sube_unvani', 'Şube');
      case 4: return t('depo_turu_iade', 'İade Deposu');
      case 5: return t('depo_turu_sanal', 'Sanal Depo');
      case 6: return t('depo_turu_lojistik', 'Lojistik Depo');
      default: return t('depo_unvani', 'Depo');
    }
  };

  const getTypeIcon = (tur: number) => {
    if (tur === 5) return <Cloud size={24} />;
    switch (tur) {
      case 1:
      case 4: return <Building2 size={24} />;
      case 6: return <Truck size={24} />;
      case 3: return <Building2 size={24} />;
      case 2: return <Store size={24} />;
      default: return <Building2 size={24} />;
    }
  };

  const turAdi = getTurName(loc.tur);
  const isAktif = loc.aktifMi !== undefined ? loc.aktifMi : true;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(loc, e);
    } else if (onEdit) {
      onEdit(loc, e);
    }
  };

  const sorumluAd = loc.sorumluPersonelAdSoyad || 
    (loc.sorumluPersonelIds && loc.sorumluPersonelIds.length > 0 && kullanicilar.find(k => k.id === loc.sorumluPersonelIds![0])?.adSoyad);

  const actions = [
    ...(onEdit || onClick ? [{
      label: t('auto_duzenle', 'Düzenle'),
      icon: <Edit2 size={15} />,
      onClick: (e: React.MouseEvent) => {
        if (onEdit) onEdit(loc, e);
        else if (onClick) onClick(loc, e);
      }
    }] : []),
    ...(onDelete ? [{
      label: t('auto_sil', 'Sil'),
      icon: <Trash2 size={15} />,
      danger: true,
      onClick: (e: React.MouseEvent) => onDelete(loc, e)
    }] : [])
  ];

  return (
    <BaseSystemCard
      icon={getTypeIcon(loc.tur)}
      iconBoxVariant="secondary"
      title={loc.ad}
      subtitle={loc.kod || loc.kodu}
      badge={
        <span className="badge badge-secondary text-11">
          {turAdi}
        </span>
      }
      actions={actions.length > 0 ? actions : undefined}
      details={[
        ...(loc.telefon ? [{
          label: t('telefon', 'Telefon'),
          value: loc.telefon
        }] : []),
        ...(sorumluAd ? [{
          label: t('sorumlu_personel', 'Sorumlu Personel'),
          value: sorumluAd
        }] : []),
        ...(loc.adres ? [{
          label: t('adres', 'Adres'),
          value: loc.adres
        }] : [])
      ]}
      status={{
        active: isAktif
      }}
      onClick={handleClick}
      className={className}
    />
  );
};

export default DepoVeSubeCard;
