/**
 * Webakus UI Core - Adres Seçici Buton Bileşeni (AdresSeciciButton)
 * Merkezi Adres Yönetimi modülü (MOD_ADRES) aktifliğini denetleyerek AdresSeciciForm popup'ını
 * tetikleyen; modül eksik veya pasif olduğunda ise ModulTanitimModal aracılığıyla kampanya ve
 * satın alma yönlendirmesi sunan standart buton bileşeni.
 */
import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdresSeciciForm, { AdresSeciciFormResult } from '../../pages/pageForSelect/AdresSeciciForm';
import ModulTanitimModal from '../modal/ModulTanitimModal';
import useModulGate from '../../hooks/UI/useModulGate';

export interface AdresSeciciButtonProps {
    onSave?: (data: AdresSeciciFormResult) => void;
    onClick?: () => void;
    initialData?: any;
    breadcrumb?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    text?: string;
    disabled?: boolean;
}

const AdresSeciciButton: React.FC<AdresSeciciButtonProps> = ({
    onSave,
    onClick,
    initialData,
    breadcrumb,
    className = '',
    style,
    text,
    disabled = false
}) => {
    const { t } = useTranslation();
    const [isAdresSeciciOpen, setIsAdresSeciciOpen] = useState(false);
    const { requireModule, isModalOpen: isPromoOpen, closeModal: closePromo } = useModulGate('MOD_ADRES');

    const handleClick = () => {
        if (disabled) return;
        if (onClick) {
            onClick();
            return;
        }
        requireModule(() => {
            setIsAdresSeciciOpen(true);
        });
    };

    return (
        <>
            <button 
                type="button" 
                onClick={handleClick}
                disabled={disabled}
                className={`btn btn-outline-secondary adres-secici-btn flex items-center gap-6 ${className}`}
                style={style}
                title={text || t('adres_belirle', 'Adres Belirle')}
            >
                <MapPin size={15} className="shrink-0" /> 
                <span className="adres-secici-text">{text || t('adres_belirle', 'Adres Belirle')}</span>
            </button>

            {/* Modül Aktif İse Açılan Adres Seçim Formu */}
            {isAdresSeciciOpen && (
                <AdresSeciciForm
                    isOpen={isAdresSeciciOpen}
                    onClose={() => setIsAdresSeciciOpen(false)}
                    initialData={initialData || {}}
                    onSave={onSave}
                />
            )}

            {/* Modül Eksik İse Açılan Tanıtım, Kampanya ve Satın Alma Reklam Penceresi */}
            <ModulTanitimModal
                isOpen={isPromoOpen}
                onClose={closePromo}
                modulKodu="MOD_ADRES"
                icon="MapPin"
            />
        </>
    );
};

export default AdresSeciciButton;

