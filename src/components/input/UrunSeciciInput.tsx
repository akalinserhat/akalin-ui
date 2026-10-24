/**
 * Webakus UI Core - Ürün ve Hizmet Seçici Giriş Alanı (UrunSeciciInput.tsx)
 * 
 * Başlıca Görevleri:
 * - BaseSeciciInput bileşenini sarmalayarak Ürün ve Hizmet kartlarının seçimi, temizlenmesi ve gösterimini sağlamak
 * - Ürün seçim modalını tetiklemek, kart detay bağlantısı (detailsUrl) sunmak ve klavye kısayollarını yönetmek
 */

import React from 'react';
import { BaseSeciciInput } from '@akalin/ui';
import { MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface UrunSeciciInputProps {
    id?: string;
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    error?: string | boolean;
    disabled?: boolean;
    onClick?: () => void;
    onClear?: () => void;
    onMenuClick?: () => void;
    onKeyDown?: (e: any) => void;
    hasSelection?: boolean;
    readOnly?: boolean;
    autoFocus?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
    detailsUrl?: string;
    detailsUrlTitle?: string;
    inputClassName?: string;
    inputStyle?: React.CSSProperties;
    [key: string]: any;
}

const UrunSeciciInput: React.FC<UrunSeciciInputProps> = ({ 
    id = 'urunId',
    value, 
    onChange, 
    onKeyDown, 
    onMenuClick, 
    error, 
    placeholder, 
    autoFocus, 
    hasSelection = false, 
    onClear, 
    detailsUrl, 
    detailsUrlTitle,
    disabled = false, 
    inputClassName = "form-input", 
    inputStyle = {},
    onClick,
    onFocus,
    onBlur
}) => {
    const { t } = useTranslation();

    return (
        <BaseSeciciInput
            id={id}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onMenuClick={onMenuClick}
            onClick={onClick}
            onFocus={onFocus}
            onBlur={onBlur}
            error={!!error}
            disabled={disabled}
            placeholder={placeholder || t('Ürün Ara...')}
            autoFocus={autoFocus}
            hasSelection={hasSelection}
            onClear={onClear}
            detailsUrl={detailsUrl}
            detailsUrlTitle={detailsUrlTitle || t('Ürün Kartını Yeni Sekmede Aç')}
            alertMessage={t('Seçili ürün/hizmet kaydı temizlenecektir.')}
            menuIcon={<MoreVertical size={16} />}
            inputClassName={inputClassName}
            inputStyle={inputStyle}
        />
    );
};

export default UrunSeciciInput;
