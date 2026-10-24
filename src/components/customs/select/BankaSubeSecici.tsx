/**
 * @file BankaSubeSecici.tsx
 * @description 
 * Webakus UI Core - Merkezi Banka Şube Seçici Bileşeni (BankaSubeSecici)
 * 
 * Başlıca Görevleri:
 * - Seçilen bankaya ait şube listesini API (/api/Bankalar/{bankaId}/subeler?aktifSadece=true) üzerinden dinamik çeker.
 * - `bankaId` parametresi değiştiğinde şube listesini otomatik yeniler ve banka seçilmemişse bileşeni devre dışı bırakır.
 * - Arama, filtreleme ve klavye navigasyonunu BaseDropdownSecici ile sağlar.
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { GitBranch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseDropdownSecici } from '@akalin/ui';

export interface BankaSubeSeciciProps {
    id?: string;
    bankaId?: number | string | null;
    value?: number | string | null;
    onChange?: (id: any, rawValue: any) => void;
    disabled?: boolean;
    clearable?: boolean;
    style?: React.CSSProperties;
    className?: string;
    placeholder?: string;
    error?: string;
}

export const BankaSubeSecici: React.FC<BankaSubeSeciciProps> = ({
    id = 'banka-sube-secici',
    bankaId,
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
    const defaultPlaceholder = placeholder || t('BankaSubeSecici_subeSeciniz', { defaultValue: 'Şube Seçiniz...' });
    const noBankPlaceholder = t('BankaSubeSecici_onceBankaSeciniz', { defaultValue: 'Önce Banka Seçiniz' });
    const [options, setOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;
        if (!bankaId) {
            setOptions([]);
            return;
        }

        const fetchOptions = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/Bankalar/${bankaId}/subeler?aktifSadece=true`);
                if (isMounted) {
                    setOptions(res.data || []);
                }
            } catch (err) {
                console.error("Şube listesi yüklenirken hata oluştu:", err);
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
    }, [bankaId]);

    const dropdownOptions = useMemo(() => {
        return options.map(o => ({
            id: o.id?.toString() ?? '',
            label: (
                <div className="flex-row items-center gap-8 w-full">
                    <GitBranch size={16} className="text-secondary" />
                    <span>{o.subeKodu ? `${o.subeKodu} - ${o.subeAdi}` : o.subeAdi}</span>
                </div>
            ),
            searchText: o.subeKodu ? `${o.subeKodu} - ${o.subeAdi}` : o.subeAdi,
            rawValue: o
        }));
    }, [options]);

    const selectedText = useMemo(() => {
        if (!value) return undefined;
        const selected = options.find(o => o.id === value || o.id?.toString() === value?.toString());
        return selected ? (selected.subeKodu ? `${selected.subeKodu} - ${selected.subeAdi}` : selected.subeAdi) : undefined;
    }, [value, options]);

    return (
        <BaseDropdownSecici
            id={id}
            value={value?.toString()}
            onChange={onChange}
            options={dropdownOptions}
            disabled={disabled || !bankaId || loading}
            placeholder={!bankaId ? noBankPlaceholder : (loading ? t('BankaSubeSecici_yukleniyor', { defaultValue: 'Şubeler yükleniyor...' }) : defaultPlaceholder)}
            clearable={clearable}
            style={style}
            className={className}
            displayText={selectedText}
            error={error}
        />
    );
};

export default BankaSubeSecici;
