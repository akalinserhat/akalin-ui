/**
 * Webakus UI Core - Sipariş Seçici Giriş Alanı (SiparisSeciciInput)
 * 
 * Başlıca Görevleri:
 * - BaseSeciciInput bileşenini sarmalayarak Sipariş fişlerinin seçimi, temizlenmesi ve gösterimini sağlamak
 * - Sipariş seçim modalını tetiklemek, detay bağlantısı (detailsUrl) sunmak ve klavye kısayollarını yönetmek
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { BaseSeciciInput } from '@akalin/ui';
import { MoreVertical } from 'lucide-react';

export interface SiparisSeciciInputProps {
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

const SiparisSeciciInput: React.FC<SiparisSeciciInputProps> = ({ 
    id = 'siparisId',
    value, 
    onChange, 
    onKeyDown, 
    onMenuClick, 
    error, 
    placeholder, 
    autoFocus, 
    hasSelection, 
    onClear, 
    detailsUrl, 
    detailsUrlTitle,
    disabled, 
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
            placeholder={placeholder || t('orders.order_slip_placeholder', 'Sipariş Fişi...')}
            autoFocus={autoFocus}
            hasSelection={hasSelection}
            onClear={onClear}
            detailsUrl={detailsUrl}
            detailsUrlTitle={detailsUrlTitle || t('orders.open_order_slip_in_new_tab', 'Sipariş Fişini Yeni Sekmede Aç')}
            alertMessage={t('orders.clear_selected_order_slip_confirm', 'Seçili sipariş fişi temizlenecektir.')}
            menuIcon={<MoreVertical size={16} />}
            inputClassName={inputClassName}
            inputStyle={inputStyle}
        />
    );
};

export default SiparisSeciciInput;
