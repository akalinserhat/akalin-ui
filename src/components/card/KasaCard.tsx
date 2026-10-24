import React from 'react';
import { Edit2, List, Trash2, Wallet, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseSystemCard } from '@akalin/ui';

export interface KasaCardProps {
  kasa: {
    id: string | number;
    ad: string;
    kod: string;
    aktifMi: boolean;
    subeAd?: string;
    paraBirimiKod: string;
    aciklama?: string;
  };
  onEdit: (kasa: any, e: React.MouseEvent) => void;
  onDelete: (kasa: any) => void;
  onViewTransactions: (kasa: any) => void;
  className?: string;
}

const KasaCard: React.FC<KasaCardProps> = ({ 
  kasa, 
  onEdit, 
  onDelete, 
  onViewTransactions,
  className = ''
}) => {
  const { t } = useTranslation();
  const isAktif = kasa.aktifMi !== false;

  return (
    <BaseSystemCard
      icon={<Wallet size={24} />}
      iconBoxVariant="secondary"
      title={kasa.ad}
      subtitle={kasa.kod}
      badge={kasa.subeAd ? (
        <span className="badge badge-secondary flex items-center gap-4 text-11">
          <Store size={12} />
          <span>{kasa.subeAd}</span>
        </span>
      ) : undefined}
      actions={[
        {
          label: t('auto_duzenle', 'Düzenle'),
          icon: <Edit2 size={15} />,
          onClick: (e) => onEdit(kasa, e)
        },
        {
          label: t('hareketler', 'Hareketler'),
          icon: <List size={15} />,
          onClick: () => onViewTransactions(kasa)
        },
        {
          label: t('auto_sil', 'Sil'),
          icon: <Trash2 size={15} />,
          danger: true,
          onClick: () => onDelete(kasa)
        }
      ]}
      details={[
        {
          label: t('para_birimi', 'Para Birimi'),
          value: kasa.paraBirimiKod || 'TRY'
        },
        ...(kasa.aciklama ? [
          {
            label: t('aciklama', 'Açıklama'),
            value: kasa.aciklama
          }
        ] : [])
      ]}
      status={{
        active: isAktif
      }}
      onClick={(e) => onEdit(kasa, e)}
      className={className}
    />
  );
};

export default KasaCard;
