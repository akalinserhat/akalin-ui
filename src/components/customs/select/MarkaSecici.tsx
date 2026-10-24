/**
 * @file MarkaSecici.tsx
 * @description 
 * Webakus UI Core - Merkezi Marka Seçici Bileşeni (MarkaSecici)
 * 
 * Başlıca Görevleri:
 * - Ürün markalarını API (/api/Markalar) üzerinden listeler, filtreler ve seçtirir.
 * - BaseDropdownSecici altyapısıyla çalışır.
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseDropdownSecici } from '@akalin/ui';

export interface MarkaSeciciProps {
    id?: string;
    value?: number | string | null;
    onChange?: (id: any, rawValue?: any) => void;
    disabled?: boolean;
    clearable?: boolean;
    style?: React.CSSProperties;
    className?: string;
    placeholder?: string;
    error?: string;
}

export const MarkaSecici: React.FC<MarkaSeciciProps> = ({
    id = 'marka-secici',
    value,
    onChange,
    disabled = false,
    clearable = true,
    style,
    className,
    placeholder,
    error
}) => {
    const { t } = useTranslation();
    const defaultPlaceholder = placeholder || t('MarkaSecici_markaSeciniz', { defaultValue: 'Marka Seçiniz...' });
    const [options, setOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        const fetchOptions = async () => {
            try {
                const res = await axios.get('/api/Markalar');
                if (isMounted) {
                    setOptions(res.data || []);
                }
            } catch (err) {
                console.error("Markalar yüklenirken hata oluştu:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchOptions();

        return () => {
            isMounted = false;
        };
    }, []);

    const dropdownOptions = useMemo(() => {
        return options.map(o => ({
            id: o.id?.toString() ?? '',
            label: (
                <div className="flex-row items-center gap-8 w-full">
                    <Tag size={14} className="text-secondary" />
                    <span>{o.ad}</span>
                </div>
            ),
            rawValue: o
        }));
    }, [options]);

    const selectedText = useMemo(() => {
        if (!value) return undefined;
        const selected = options.find(o => o.id === value || o.id?.toString() === value?.toString());
        return selected?.ad;
    }, [value, options]);

    return (
        <BaseDropdownSecici
            id={id}
            value={value?.toString()}
            onChange={onChange}
            options={dropdownOptions}
            disabled={disabled || loading}
            placeholder={loading ? (t('MarkaSecici_yukleniyor', { defaultValue: 'Markalar yükleniyor...' })) : defaultPlaceholder}
            clearable={clearable}
            style={style}
            className={className}
            displayText={selectedText}
            error={error}
        />
    );
};

export default MarkaSecici;
