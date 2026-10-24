/**
 * Webakus UI Core - İrsaliye Seçici Giriş Alanı (IrsaliyeSeciciInput)
 * 
 * Başlıca Görevleri:
 * - BaseSeciciInput bileşenini sarmalayarak İrsaliye belgelerinin seçimi, temizlenmesi ve gösterimini sağlamak
 * - İrsaliye seçim modalını tetiklemek, detay bağlantısı (detailsUrl) sunmak ve klavye kısayollarını yönetmek
 */

import React from 'react';
import { BaseSeciciInput, BaseSeciciInputProps } from '@akalin/ui';
import { MoreVertical } from 'lucide-react';

export interface IrsaliyeSeciciInputProps {
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

const IrsaliyeSeciciInput: React.FC<IrsaliyeSeciciInputProps> = ({ 
    id = 'irsaliyeId',
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
    detailsUrlTitle = "İrsaliye Fişini Yeni Sekmede Aç",
    disabled, 
    inputClassName = "form-input", 
    inputStyle = {},
    onClick,
    onFocus,
    onBlur
}) => {
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
            placeholder={placeholder || 'İrsaliye Fişi...'}
            autoFocus={autoFocus}
            hasSelection={hasSelection}
            onClear={onClear}
            detailsUrl={detailsUrl}
            detailsUrlTitle={detailsUrlTitle}
            alertMessage="Seçili irsaliye fişi temizlenecektir."
            menuIcon={<MoreVertical size={16} />}
            inputClassName={inputClassName}
            inputStyle={inputStyle}
        />
    );
};

export default IrsaliyeSeciciInput;
