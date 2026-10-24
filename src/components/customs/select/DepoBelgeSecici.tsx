/**
 * @file DepoBelgeSecici.tsx
 * @description BaseSeciciInput üzerine kurulu, depo fişi / hareket belgelerinin seçimi ve temizlenmesini sağlayan arama giriş bileşeni.
 */

import React from 'react';
import { BaseSeciciInput, type BaseSeciciInputProps } from '@akalin/ui';
import { MoreVertical, Layers } from 'lucide-react';

export interface DepoBelgeSeciciProps extends BaseSeciciInputProps {
    [key: string]: any;
}

const DepoBelgeSecici: React.FC<DepoBelgeSeciciProps> = ({ 
    value, 
    onChange, 
    onKeyDown, 
    onMenuClick, 
    error, 
    placeholder = 'Depo Fişi...', 
    autoFocus, 
    hasSelection, 
    onClear, 
    detailsUrl, 
    disabled, 
    inputClassName = "form-input", 
    inputStyle = {},
    ...props 
}) => {
    return (
        <BaseSeciciInput
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onMenuClick={onMenuClick}
            error={error}
            disabled={disabled}
            placeholder={placeholder}
            autoFocus={autoFocus}
            hasSelection={hasSelection}
            onClear={onClear}
            detailsUrl={detailsUrl}
            detailsUrlTitle="Depo Fişini Yeni Sekmede Aç"
            alertMessage="Seçili depo fişi temizlenecektir."
            icon={<Layers size={16} />}
            menuIcon={<MoreVertical size={16} />}
            inputClassName={inputClassName}
            inputStyle={inputStyle}
            {...props}
        />
    );
};

export default DepoBelgeSecici;
