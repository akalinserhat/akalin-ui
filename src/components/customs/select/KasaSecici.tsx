/**
 * @file KasaSecici.tsx
 * @description 
 * Webakus UI Core - Merkezi Kasa Seçici Bileşeni (KasaSecici)
 * 
 * Başlıca Görevleri:
 * - Şirket kasalarını API (/api/Kasalar) üzerinden listeler, arama ve filtreleme sağlar.
 * - `paraBirimiId` ve `haricKasaId` parametrelerine göre kasaları filtreler.
 * - Kasa adı, kodu ve güncel bakiye bilgisini zengin görsel arayüzle sunar.
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseDropdownSecici } from '@akalin/ui';

export interface KasaSeciciProps {
    id?: string;
    value?: number | string | null;
    onChange?: (id: any, rawValue?: any) => void;
    disabled?: boolean;
    clearable?: boolean;
    style?: React.CSSProperties;
    className?: string;
    placeholder?: string;
    paraBirimiId?: number | string | null;
    haricKasaId?: number | string | null;
    error?: string;
}

export const KasaSecici: React.FC<KasaSeciciProps> = ({
    id = 'kasa-secici',
    value,
    onChange,
    disabled = false,
    clearable = true,
    style,
    className,
    placeholder,
    paraBirimiId,
    haricKasaId,
    error
}) => {
    const { t } = useTranslation();
    const defaultPlaceholder = placeholder || t('KasaSecici_kasaSeciniz', { defaultValue: 'Kasa seçiniz...' });
    const [kasalar, setKasalar] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let isMounted = true;
        const fetchKasalar = async () => {
            try {
                const res = await axios.get('/api/Kasalar');
                if (isMounted) {
                    setKasalar(res.data || []);
                }
            } catch (err) {
                console.error("Kasalar yüklenirken hata oluştu:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchKasalar();

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredKasalar = useMemo(() => {
        let result = kasalar;
        if (paraBirimiId) {
            result = result.filter(k => k.paraBirimiId === paraBirimiId || k.paraBirimiId === Number(paraBirimiId));
        }
        if (haricKasaId) {
            result = result.filter(k => k.id !== haricKasaId && k.id !== Number(haricKasaId));
        }
        return result;
    }, [kasalar, paraBirimiId, haricKasaId]);

    const options = useMemo(() => {
        return filteredKasalar.map(k => ({
            id: k.id?.toString() ?? '',
            label: (
                <div className="flex-row items-center justify-between gap-8 w-full">
                    <div className="flex-row items-center gap-8">
                        <Wallet size={16} className="text-secondary" />
                        <span>{k.ad}</span>
                        {k.kod && (
                            <span className="badge-secondary text-xs px-2 py-0.5 rounded">
                                {k.kod}
                            </span>
                        )}
                    </div>
                    {k.bakiye !== undefined && (
                        <div className={`text-sm font-medium ${k.bakiye < 0 ? 'text-danger' : 'text-primary'}`}>
                            {Number(k.bakiye).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {k.paraBirimiSembol || ''}
                        </div>
                    )}
                </div>
            ),
            rawValue: k
        }));
    }, [filteredKasalar]);

    const selectedText = useMemo(() => {
        if (!value) return undefined;
        const selected = kasalar.find(k => k.id === value || k.id?.toString() === value?.toString());
        return selected?.ad;
    }, [value, kasalar]);

    return (
        <BaseDropdownSecici
            id={id}
            value={value?.toString()}
            onChange={onChange}
            options={options}
            disabled={disabled || loading}
            clearable={clearable}
            placeholder={loading ? (t('KasaSecici_kasalarYukleniyor', { defaultValue: 'Kasalar yükleniyor...' })) : defaultPlaceholder}
            style={style}
            className={className}
            displayText={selectedText}
            error={error}
        />
    );
};

export default KasaSecici;
