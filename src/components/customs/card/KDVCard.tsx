import React from 'react';
import { Edit2, Trash2, Percent } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseSystemCard } from '@akalin/ui';

export interface KDVCardProps {
  grup: any;
  onEdit: (grup: any) => void;
  onDelete: (grup: any) => void;
  className?: string;
}

const KDVCard: React.FC<KDVCardProps> = ({ grup, onEdit, onDelete, className = '' }) => {
  const { t } = useTranslation();
  const aktifOranObj = grup.oranlar?.find((o: any) => new Date(o.baslangicTarihi) <= new Date());
  const aktifOran = aktifOranObj?.oran ?? grup.oran ?? 0;
  const gorunenTarih = aktifOranObj ? new Date(aktifOranObj.baslangicTarihi).toLocaleDateString('tr-TR') : '-';
  const isDefault = Boolean(grup.varsayilanMi);
  const isAktif = grup.aktifMi !== false;

  return (
    <BaseSystemCard
      icon={<Percent size={24} />}
      iconBoxVariant={isDefault ? 'primary' : 'secondary'}
      title={grup.ad}
      subtitle={`${t('kod', 'Kod')}: ${grup.kod}`}
      isDefault={isDefault}
      actions={[
        {
          label: t('auto_duzenle', 'Düzenle'),
          icon: <Edit2 size={15} />,
          onClick: () => onEdit(grup)
        },
        ...(!isDefault ? [{
          label: t('auto_sil', 'Sil'),
          icon: <Trash2 size={15} />,
          danger: true,
          onClick: () => onDelete(grup)
        }] : [])
      ]}
      details={[
        {
          label: t('aktif_oran', 'Aktif Oran'),
          value: <span className="font-bold text-15">%{aktifOran} <span className="text-12 font-normal text-secondary">({gorunenTarih})</span></span>
        }
      ]}
      status={{
        active: isAktif
      }}
      onClick={() => onEdit(grup)}
      className={className}
    />
  );
};

export default KDVCard;
