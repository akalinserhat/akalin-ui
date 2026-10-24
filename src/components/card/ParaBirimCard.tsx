import React from 'react';
import { Edit2, Star, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseSystemCard, CurrencyIcon } from '@akalin/ui';

export interface ParaBirimCardProps {
  paraBirimi: any;
  onEdit: (pb: any) => void;
  onDelete: (pb: any) => void;
  onSetDefault?: (pb: any) => void;
  className?: string;
}

const ParaBirimCard: React.FC<ParaBirimCardProps> = ({ 
  paraBirimi, 
  onEdit, 
  onDelete, 
  onSetDefault,
  className = '' 
}) => {
  const { t } = useTranslation();
  const pb = paraBirimi;
  const isDefault = Boolean(pb.varsayilanMi);
  const isAktif = pb.aktifMi !== false;

  return (
    <BaseSystemCard
      icon={<CurrencyIcon code={pb.kod} symbol={pb.sembol} size={24} />}
      iconBoxVariant={isDefault ? 'primary' : 'secondary'}
      title={pb.kod}
      subtitle={pb.ad}
      isDefault={isDefault}
      actions={[
        {
          label: t('auto_duzenle', 'Düzenle'),
          icon: <Edit2 size={15} />,
          onClick: () => onEdit(pb)
        },
        ...(!isDefault && onSetDefault ? [
          {
            label: t('varsayilan_yap', 'Varsayılan Yap'),
            icon: <Star size={15} />,
            onClick: () => onSetDefault(pb)
          }
        ] : []),
        ...(!isDefault ? [
          {
            label: t('auto_sil', 'Sil'),
            icon: <Trash2 size={15} />,
            danger: true,
            onClick: () => onDelete(pb)
          }
        ] : [])
      ]}
      details={[
        {
          label: t('auto_sembol', 'Sembol'),
          value: <span className="font-mono">{pb.sembol || '-'}</span>
        }
      ]}
      status={{
        active: isAktif
      }}
      onClick={() => onEdit(pb)}
      className={className}
    />
  );
};

export default ParaBirimCard;
