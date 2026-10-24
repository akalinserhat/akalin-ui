/**
 * @component FiyatTanimSecici
 * @description
 * Tanımlı fiyat listeleri arasından seçim yapmayı sağlayan açılır menü (dropdown) bileşeni.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BaseDropdownSecici, DropdownOption } from '@akalin/ui';

export interface FiyatTanimSeciciProps {
    value?: number | null;
    onChange?: (val: number | null | undefined, tanim?: any) => void;
    error?: boolean | string;
    disabled?: boolean;
    placeholder?: string;
    inputClassName?: string;
    style?: React.CSSProperties;
    className?: string;
}

export const FiyatTanimSecici: React.FC<FiyatTanimSeciciProps> = ({
    value,
    onChange,
    error,
    disabled,
    placeholder = "Fiyat Tanımı Seçiniz...",
    inputClassName,
    style,
    className
}) => {
    const [options, setOptions] = useState<DropdownOption[]>([]);
    const [tanimlar, setTanimlar] = useState<any[]>([]);

    useEffect(() => {
        const fetchTanimlar = async () => {
            try {
                const response = await axios.get('/api/FiyatListesiTanimlari');
                const data = response.data || [];
                setTanimlar(data);
                
                const selectOptions = data.map((item: any) => ({
                    id: item.id,
                    label: `${item.kod} - ${item.ad} (${item.dovizCinsi})`
                }));
                
                setOptions(selectOptions);
            } catch (err) {
                console.error("Fiyat tanımları yüklenirken hata oluştu:", err);
            }
        };

        fetchTanimlar();
    }, []);

    const selectedText = options.find(o => o.id === value)?.label || '';

    return (
        <BaseDropdownSecici
            value={value != null ? value.toString() : undefined}
            onChange={(id) => {
                if (id === null || id === undefined || id === '') {
                    onChange?.(null, null);
                    return;
                }
                const numericId = Number(id);
                const tanim = tanimlar.find(t => t.id === numericId);
                onChange?.(numericId, tanim);
            }}
            options={options}
            clearable={true}
            displayText={selectedText as string}
            error={typeof error === 'boolean' ? (error ? 'Geçersiz' : undefined) : error}
            disabled={disabled}
            placeholder={placeholder}
            className={inputClassName || className}
            style={style}
        />
    );
};

export default FiyatTanimSecici;
