/**
 * @file CariAdresSeciciButton.tsx
 * @description Seçilen cariye ait kayıtlı teslimat ve fatura adreslerini seçmek için CariAdresSeciciModal açan standart buton bileşeni.
 */

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CariAdresSecici, { type CariAdresItem } from '../../pages/pageForSelect/CariAdresSecici';

export interface CariAdresSeciciButtonProps {
    cariId?: number | string | null;
    adresTipi?: number; // 1: Fatura, 2: Nakliye / Sevk
    onSelect: (adres: CariAdresItem) => void;
    className?: string;
    style?: React.CSSProperties;
    text?: string;
    disabled?: boolean;
    renderAddButton?: (props: { cariId?: number | string | null; activeAdresTipi?: number | null; onAdresEklendi: () => void }) => React.ReactNode;
}

const CariAdresSeciciButton: React.FC<CariAdresSeciciButtonProps> = ({
    cariId,
    adresTipi,
    onSelect,
    className = '',
    style,
    text,
    disabled = false,
    renderAddButton
}) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleClick = () => {
        if (disabled) return;
        if (!cariId) {
            toast.error(t('CariAdresSecici_cariSeciniz') || "Lütfen önce bir cari seçiniz.", { icon: '⚠️' });
            return;
        }
        setIsModalOpen(true);
    };

    return (
        <>
            <button 
                type="button"
                onClick={handleClick}
                disabled={disabled}
                className={`btn btn-sm btn-outline-secondary flex items-center gap-6 ${className}`}
                style={style}
            >
                <MapPin size={14} /> 
                <span>{text || t('Cari Adres Seçici') || 'Cari Adres Seçici'}</span>
            </button>

            <CariAdresSecici
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                cariId={cariId}
                adresTipi={adresTipi}
                onSelect={onSelect}
                renderAddButton={renderAddButton}
            />
        </>
    );
};

export default CariAdresSeciciButton;
