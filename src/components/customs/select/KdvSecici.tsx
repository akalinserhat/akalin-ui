/**
 * @file KdvSecici.tsx
 * @description 
 * Webakus UI Core - Merkezi KDV Seçici Bileşeni (KdvSecici)
 * 
 * Başlıca Görevleri:
 * - KDV oran gruplarını arama ve seçim imkanı ile listeler.
 * - `kdvGruplari` listesi prop olarak geçilmediğinde API (/api/Kdv) üzerinden otomatik yükler.
 * - Aktif KDV oranlarını tarihsel veya dinamik oran kurallarına göre çözümler.
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Percent } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseDropdownSecici } from '@akalin/ui';

export interface KdvSeciciProps {
    id?: string;
    value?: number | string | null;
    onChange?: (id: any, rawValue?: any) => void;
    disabled?: boolean;
    clearable?: boolean;
    style?: React.CSSProperties;
    className?: string;
    placeholder?: string;
    kdvGruplari?: any[];
    error?: string;
}

export const KdvSecici: React.FC<KdvSeciciProps> = ({
    id = 'kdv-secici',
    value,
    onChange,
    disabled = false,
    clearable = true,
    style,
    className,
    placeholder,
    kdvGruplari,
    error
}) => {
    const { t } = useTranslation();
    const defaultPlaceholder = placeholder || t('KdvSecici_kdvSeciniz', { defaultValue: 'KDV Grubu Seçiniz...' });
    const [fetchedList, setFetchedList] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        let isMounted = true;
        if (!kdvGruplari) {
            setLoading(true);
            axios.get('/api/KdvGruplari')
                .then(res => {
                    if (isMounted) {
                        setFetchedList(res.data || []);
                    }
                })
                .catch(err => {
                    console.error("KDV listesi yüklenirken hata oluştu:", err);
                })
                .finally(() => {
                    if (isMounted) {
                        setLoading(false);
                    }
                });
        }
        return () => {
            isMounted = false;
        };
    }, [kdvGruplari]);

    const activeList = kdvGruplari || fetchedList;

    const getOran = (kdv: any) => {
        if (!kdv) return 0;
        if (kdv.oranlar && Array.isArray(kdv.oranlar) && kdv.oranlar.length > 0) {
            const sorted = [...kdv.oranlar].sort((a: any, b: any) => new Date(b.baslangicTarihi).getTime() - new Date(a.baslangicTarihi).getTime());
            return sorted[0].oran;
        }
        return kdv.aktifOran ?? kdv.oran ?? kdv.kdvOrani ?? kdv.deger ?? 0;
    };

    const options = useMemo(() => {
        return activeList.map(kdv => {
            const kdvId = kdv.id !== undefined ? kdv.id : kdv.Id;
            const oran = getOran(kdv);
            return {
                id: kdvId?.toString() ?? '',
                label: (
                    <div className="flex-row items-center gap-8 w-full">
                        <Percent size={14} className="text-secondary" />
                        <span>{kdv.ad}</span>
                        <span className="badge-secondary text-xs px-2 py-0.5 rounded">
                            %{oran}
                        </span>
                    </div>
                ),
                rawValue: kdv
            };
        });
    }, [activeList]);

    const selectedText = useMemo(() => {
        if (!value) return undefined;
        const currentKdv = activeList.find((k: any) => {
            const kId = k.id !== undefined ? k.id : k.Id;
            return kId === value || kId?.toString() === value?.toString();
        });
        return currentKdv ? `${currentKdv.ad} (%${getOran(currentKdv)})` : undefined;
    }, [value, activeList]);

    return (
        <BaseDropdownSecici
            id={id}
            value={value?.toString()}
            onChange={onChange}
            options={options}
            disabled={disabled || loading}
            placeholder={loading ? (t('KdvSecici_yukleniyor', { defaultValue: 'KDV listesi yükleniyor...' })) : defaultPlaceholder}
            clearable={clearable}
            style={style}
            className={className}
            displayText={selectedText}
            error={error}
        />
    );
};

export default KdvSecici;
