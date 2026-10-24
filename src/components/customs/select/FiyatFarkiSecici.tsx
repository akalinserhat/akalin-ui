/**
 * @file FiyatFarkiSecici.tsx
 * @description 
 * Webakus UI Core - Merkezi Fiyat Farkı Belgesi Seçici Bileşeni (FiyatFarkiSecici)
 * 
 * Başlıca Görevleri:
 * - Fiyat farkı belgelerini API (/api/BshFiyatFarki) üzerinden listeler.
 * - Sadece aktif geçerlilik tarih aralığında olan belgeleri filtreleyerek arama ve seçim imkanı sunar.
 * - BaseDropdownSecici altyapısıyla çalışır.
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FileSpreadsheet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseDropdownSecici } from '@akalin/ui';

export interface FiyatFarkiSeciciProps {
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

export const FiyatFarkiSecici: React.FC<FiyatFarkiSeciciProps> = ({
    id = 'fiyat-farki-secici',
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
    const defaultPlaceholder = placeholder || t('FiyatFarkiSecici_seciniz', { defaultValue: 'Fiyat Farkı Belgesi Seçiniz...' });
    const [options, setOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        const fetchOptions = async () => {
            try {
                const res = await axios.get('/api/BshFiyatFarki');
                const data = res.data?.items || res.data || [];
                
                // Sadece aktif dönemde olan (Bugünün tarihi başlangıç ve bitiş tarihleri arasında olan) belgeleri filtrele
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                
                const activeData = data.filter((item: any) => {
                    if (!item.baslangicTarihi || !item.bitisTarihi) return true;
                    
                    const start = new Date(item.baslangicTarihi);
                    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
                    
                    const end = new Date(item.bitisTarihi);
                    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                    
                    return startDate <= today && endDate >= today;
                });
                
                if (isMounted) {
                    setOptions(activeData);
                }
            } catch (err) {
                console.error("Fiyat farkı listesi yüklenirken hata oluştu:", err);
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
                    <FileSpreadsheet size={16} className="text-secondary" />
                    <span>{o.belgeNo || '-'}</span>
                    {o.aciklama && (
                        <span className="badge-secondary text-xs px-2 py-0.5 rounded">
                            {o.aciklama}
                        </span>
                    )}
                </div>
            ),
            rawValue: o
        }));
    }, [options]);

    const selectedText = useMemo(() => {
        if (!value) return undefined;
        const selected = options.find(o => o.id === value || o.id?.toString() === value?.toString());
        return selected?.belgeNo || selected?.aciklama;
    }, [value, options]);

    return (
        <BaseDropdownSecici
            id={id}
            value={value?.toString()}
            onChange={onChange}
            options={dropdownOptions}
            disabled={disabled || loading}
            placeholder={loading ? (t('FiyatFarkiSecici_yukleniyor', { defaultValue: 'Yükleniyor...' })) : defaultPlaceholder}
            clearable={clearable}
            style={style}
            className={className}
            displayText={selectedText}
            error={error}
        />
    );
};

export default FiyatFarkiSecici;
