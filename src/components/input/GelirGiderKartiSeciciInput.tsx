/**
 * Webakus UI Core - Gelir / Gider Kartı Seçici Giriş Alanı (GelirGiderKartiSeciciInput)
 * 
 * Başlıca Görevleri:
 * - BaseSeciciInput bileşenini sarmalayarak Gelir / Gider kartlarının seçimi, temizlenmesi ve gösterimini sağlamak
 * - Modal tetikleme, klavye olayları ve seçim temizleme işlemlerini standart bir arayüzle sunmak
 */

import React from 'react';
import { BaseSeciciInput } from '@akalin/ui';
import { CreditCard, MoreVertical } from 'lucide-react';

export interface GelirGiderKartiSeciciInputProps {
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
}

const GelirGiderKartiSeciciInput: React.FC<GelirGiderKartiSeciciInputProps> = ({ 
    id = 'gelirGiderKartiId', 
    value, 
    onChange, 
    onKeyDown, 
    onMenuClick, 
    error, 
    placeholder, 
    autoFocus, 
    hasSelection, 
    onClear, 
    readOnly, 
    onClick, 
    disabled,
    onFocus = () => {},
    onBlur = () => {}
}) => {
    return (
        <BaseSeciciInput
            id={id}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onMenuClick={onMenuClick}
            onClick={onClick}
            readOnly={readOnly}
            error={!!error}
            placeholder={placeholder || 'Gelir/Gider Kartı Seçiniz...'}
            autoFocus={autoFocus}
            hasSelection={hasSelection}
            onClear={onClear}
            alertMessage="Seçili kart temizlenecektir."
            icon={<CreditCard size={16} />}
            menuIcon={<MoreVertical size={16} />}
            clearable={true}
            onFocus={onFocus}
            onBlur={onBlur}
            disabled={disabled}
        />
    );
};

export default GelirGiderKartiSeciciInput;
