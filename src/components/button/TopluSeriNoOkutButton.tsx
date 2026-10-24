/**
 * Webakus UI Core - Toplu Seri Numarası Okutma Butonu (TopluSeriNoOkutButton.tsx)
 * 
 * Başlıca Görevleri:
 * - Depo hareketleri ve sayım formlarında toplu seri numarası okuma/giriş modalını tetiklemek
 * - Barkod/Seri no ikonlu ve standart stilli bir aksiyon butonu sunmak
 */

import React from 'react';
import { BaseButton } from '@akalin/ui';
import { Barcode } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface TopluSeriNoOkutButtonProps {
    id?: string;
    onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
    text?: string;
    icon?: React.ReactNode;
    className?: string;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning' | 'info' | 'ghost' | 'glass';
    style?: React.CSSProperties;
}

const TopluSeriNoOkutButton: React.FC<TopluSeriNoOkutButtonProps> = ({ 
    id = 'topluSeriNoOkutBtn',
    onClick, 
    text,
    icon = <Barcode size={18} strokeWidth={2.5} />,
    className = '',
    disabled = false,
    variant = 'outline',
    style
}) => {
    const { t } = useTranslation();

    return (
        <BaseButton
            id={id}
            type="button"
            variant={variant}
            onClick={onClick}
            text={text || t('Toplu Seri No Okut')}
            icon={icon}
            className={className}
            disabled={disabled}
            style={style}
        />
    );
};

export default TopluSeriNoOkutButton;
