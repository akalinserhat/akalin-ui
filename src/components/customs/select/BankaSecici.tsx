/**
 * @file BankaSecici.tsx
 * @description 
 * Webakus UI Core - Merkezi Banka Seçici Bileşeni (BankaSecici)
 * 
 * Başlıca Görevleri:
 * - Banka listesini API (/api/Bankalar) üzerinden çekerek arama ve seçim imkanı sunar.
 * - `sadeceHesapliBankalar` parametresi aktif edildiğinde sadece firmanın hesabı olan bankaları listeler.
 * - İki adımlı banka/hesap seçim kuralının ilk adımı olarak görev yapar.
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseDropdownSecici } from '@akalin/ui';

export interface BankaSeciciProps {
    id?: string;
    value?: number | string | null;
    onChange?: (id: any, rawValue: any) => void;
    disabled?: boolean;
    clearable?: boolean;
    style?: React.CSSProperties;
    className?: string;
    placeholder?: string;
    sadeceHesapliBankalar?: boolean;
    error?: string;
}

export const BankaSecici: React.FC<BankaSeciciProps> = ({
    id = 'banka-secici',
    value,
    onChange,
    disabled = false,
    clearable = true,
    style,
    className,
    placeholder,
    sadeceHesapliBankalar = false,
    error
}) => {
    const { t } = useTranslation();
    const defaultPlaceholder = placeholder || t('BankaSecici_bankaSeciniz', { defaultValue: 'Banka Seçiniz...' });
    const [options, setOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        const fetchOptions = async () => {
            try {
                const res = await axios.get('/api/Bankalar');
                let bankalar = res.data || [];

                if (sadeceHesapliBankalar) {
                    const hesaplarRes = await axios.get('/api/BankaHesaplari');
                    const hesaplar = hesaplarRes.data || [];
                    const bankaIds = new Set(hesaplar.map((h: any) => h.bankaId));
                    bankalar = bankalar.filter((b: any) => bankaIds.has(b.id));
                }

                if (isMounted) {
                    setOptions(bankalar);
                }
            } catch (err) {
                console.error("Banka listesi yüklenirken hata oluştu:", err);
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
    }, [sadeceHesapliBankalar]);

    const dropdownOptions = useMemo(() => {
        return options.map(o => ({
            id: o.id?.toString() ?? '',
            label: (
                <div className="flex-row items-center gap-8 w-full">
                    <Landmark size={16} className="text-secondary" />
                    <span>{o.kod ? `${o.kod} - ${o.ad}` : o.ad}</span>
                </div>
            ),
            searchText: o.kod ? `${o.kod} - ${o.ad}` : o.ad,
            rawValue: o
        }));
    }, [options]);

    const selectedText = useMemo(() => {
        if (!value) return undefined;
        const selected = options.find(o => o.id === value || o.id?.toString() === value?.toString());
        return selected ? (selected.kod ? `${selected.kod} - ${selected.ad}` : selected.ad) : undefined;
    }, [value, options]);

    return (
        <BaseDropdownSecici
            id={id}
            value={value?.toString()}
            onChange={onChange}
            options={dropdownOptions}
            disabled={disabled || loading}
            placeholder={loading ? t('BankaSecici_yukleniyor', { defaultValue: 'Bankalar yükleniyor...' }) : defaultPlaceholder}
            clearable={clearable}
            style={style}
            className={className}
            displayText={selectedText}
            error={error}
        />
    );
};

export default BankaSecici;
