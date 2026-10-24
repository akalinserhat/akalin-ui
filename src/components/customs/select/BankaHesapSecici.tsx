/**
 * @file BankaHesapSecici.tsx
 * @description 
 * Webakus UI Core - Merkezi Banka Hesabı Seçici Bileşeni (BankaHesapSecici)
 * 
 * Başlıca Görevleri:
 * - Şirket bünyesindeki banka hesaplarını API (/api/BankaHesaplari) üzerinden listeleyip arama ve seçim imkanı sunar.
 * - `bankaId`, `paraBirimiId` ve `haricBankaHesapId` filtreleme parametrelerini destekler.
 * - IBAN, hesap adı ve bakiye bilgilerini zengin görsel arayüz ile (BaseDropdownSecici kullanarak) gösterir.
 * - İki adımlı banka/hesap seçim mimarisine tam uyumludur.
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Building } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseDropdownSecici } from '@akalin/ui';

export interface BankaHesapSeciciProps {
    id?: string;
    value?: number | string | null;
    onChange?: (id: any, rawValue: any) => void;
    disabled?: boolean;
    clearable?: boolean;
    style?: React.CSSProperties;
    className?: string;
    placeholder?: string;
    paraBirimiId?: number | string | null;
    bankaId?: number | string | null;
    haricBankaHesapId?: number | string | null;
    error?: string;
    hideBalance?: boolean;
}

export const BankaHesapSecici: React.FC<BankaHesapSeciciProps> = ({
    id = 'banka-hesap-secici',
    value,
    onChange,
    disabled = false,
    clearable = true,
    style,
    className,
    placeholder,
    paraBirimiId,
    bankaId,
    haricBankaHesapId,
    error,
    hideBalance = false
}) => {
    const { t } = useTranslation();
    const defaultPlaceholder = placeholder || t('BankaHesapSecici_hesapSeciniz', { defaultValue: 'Banka hesabı seçiniz...' });
    const [hesaplar, setHesaplar] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        const fetchHesaplar = async () => {
            try {
                const res = await axios.get('/api/BankaHesaplari');
                if (isMounted) {
                    setHesaplar(res.data || []);
                }
            } catch (err) {
                console.error("Banka hesapları yüklenirken hata oluştu:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchHesaplar();

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredHesaplar = useMemo(() => {
        let result = hesaplar;
        if (paraBirimiId) {
            result = result.filter(h => h.paraBirimiId === paraBirimiId || h.paraBirimiId === Number(paraBirimiId));
        }
        if (bankaId) {
            result = result.filter(h => h.bankaId === bankaId || h.bankaId === Number(bankaId));
        }
        if (haricBankaHesapId) {
            result = result.filter(h => h.id !== haricBankaHesapId && h.id !== Number(haricBankaHesapId));
        }
        return result;
    }, [hesaplar, paraBirimiId, bankaId, haricBankaHesapId]);

    const options = useMemo(() => {
        return filteredHesaplar.map(h => ({
            id: h.id?.toString() ?? '',
            label: (
                <div className="flex-row items-center justify-between gap-8 w-full">
                    <div className="flex-row items-center gap-8">
                        <Building size={16} className="text-secondary" />
                        <span>{h.hesapAdi}</span>
                        {h.iban && (
                            <span className="badge-secondary text-xs px-2 py-0.5 rounded">
                                {h.iban}
                            </span>
                        )}
                    </div>
                    {h.bakiye !== undefined && !hideBalance && (
                        <div className={`text-sm font-medium ${h.bakiye < 0 ? 'text-danger' : 'text-primary'}`}>
                            {Number(h.bakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {h.paraBirimiSembol || ''}
                        </div>
                    )}
                </div>
            ),
            rawValue: h
        }));
    }, [filteredHesaplar, hideBalance]);

    const selectedText = useMemo(() => {
        if (!value) return undefined;
        const selected = hesaplar.find(h => h.id === value || h.id?.toString() === value?.toString());
        return selected?.hesapAdi;
    }, [value, hesaplar]);

    return (
        <BaseDropdownSecici
            id={id}
            value={value?.toString()}
            onChange={onChange}
            options={options}
            disabled={disabled || loading}
            clearable={clearable}
            placeholder={loading ? (t('BankaHesapSecici_hesaplarYukleniyor', { defaultValue: 'Hesaplar yükleniyor...' })) : defaultPlaceholder}
            style={style}
            className={className}
            displayText={selectedText}
            error={error}
        />
    );
};

export default BankaHesapSecici;
