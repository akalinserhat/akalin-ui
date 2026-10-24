/**
 * @file ParaBirimiSelector.tsx
 * @description 
 * Webakus UI Core - Merkezi Para Birimi Seçici Bileşeni (ParaBirimiSelector)
 * 
 * Başlıca Görevleri:
 * - Aktif para birimlerini API (/api/ParaBirimleri) üzerinden listeler.
 * - BaseDropdownSecici altyapısı ve Material Design 3 (MD3) tasarım standartlarına uygun arayüz sunar.
 * - Standart form inputu veya belge başlıkları için kompakt hap (icon pill) modunu destekler.
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseDropdownSecici, DropdownOption } from '@akalin/ui';

export interface ParaBirimiSelectorProps {
    id?: string;
    value?: string | number | null;
    onChange?: (val: any, rawValue?: any) => void;
    disabled?: boolean;
    clearable?: boolean;
    style?: React.CSSProperties;
    className?: string;
    placeholder?: string;
    variant?: 'default' | 'icon' | 'grid';
    error?: string;
}

export const ParaBirimiSelector: React.FC<ParaBirimiSelectorProps> = ({
    id = 'para-birimi-selector',
    value,
    onChange,
    disabled = false,
    clearable = false,
    style,
    className,
    placeholder,
    variant = 'default',
    error
}) => {
    const { t } = useTranslation();
    const defaultPlaceholder = placeholder || t('ParaBirimiSecici_seciniz', { defaultValue: 'Para Birimi Seçiniz...' });
    const [paraBirimleri, setParaBirimleri] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        const fetchParaBirimleri = async () => {
            try {
                const res = await axios.get('/api/ParaBirimleri');
                const data = res.data || [];
                const activeData = data.filter((p: any) => p.aktifMi !== false);
                if (isMounted) {
                    setParaBirimleri(activeData);
                }
            } catch (err) {
                console.error("Para birimleri yüklenirken hata oluştu:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchParaBirimleri();

        return () => {
            isMounted = false;
        };
    }, []);

    const options: DropdownOption[] = useMemo(() => {
        return paraBirimleri.map((p) => ({
            id: p.kod || p.id?.toString() || '',
            label: (
                <div className="flex-row items-center justify-between gap-8 w-full py-1">
                    <div className="flex-row items-center gap-8">
                        <span className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-xs font-bold text-accent shrink-0">
                            {p.sembol || p.kod?.[0]}
                        </span>
                        <span className="font-semibold text-primary">{p.kod}</span>
                        <span className="text-xs text-secondary">{p.ad}</span>
                    </div>
                    {p.varsayilanMi && (
                        <span className="badge-primary text-[10px] px-2 py-0.5 rounded-full">
                            {t('Varsayilan', { defaultValue: 'Varsayılan' })}
                        </span>
                    )}
                </div>
            ),
            rawValue: p
        }));
    }, [paraBirimleri, t]);

    const selectedOption = useMemo(() => {
        if (!value) return undefined;
        return paraBirimleri.find(
            (p) => (p.kod && p.kod === value) || p.id === value || p.id?.toString() === value?.toString()
        );
    }, [value, paraBirimleri]);

    const selectedText = useMemo(() => {
        if (selectedOption) {
            return selectedOption.kod || selectedOption.ad;
        }
        return typeof value === 'string' ? value : undefined;
    }, [selectedOption, value]);

    const isIconVariant = variant === 'icon';

    return (
        <div
            style={style}
            className={`relative ${isIconVariant ? 'inline-block min-w-[90px]' : 'w-full'} ${className || ''}`}
        >
            <BaseDropdownSecici
                id={id}
                value={typeof value === 'string' ? value : value?.toString()}
                onChange={(selectedId, rawValue) => {
                    if (onChange) {
                        // Seçilen kod değerini (örn: 'TRY') ve ham nesneyi döndürür
                        onChange(rawValue?.kod || selectedId, rawValue);
                    }
                }}
                options={options}
                disabled={disabled || loading}
                placeholder={loading ? (t('Yukleniyor', { defaultValue: 'Yükleniyor...' })) : defaultPlaceholder}
                clearable={clearable}
                displayText={selectedText}
                error={error}
                className={isIconVariant ? 'para-birimi-pill-dropdown' : undefined}
            />
        </div>
    );
};

export default ParaBirimiSelector;
