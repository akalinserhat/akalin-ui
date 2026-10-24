/**
 * @component ParaBirimiSecici
 * @description
 * Tanımlı para birimlerini (TRY, USD, EUR vb.) listeleyen ve seçim yaptıran açılır menü bileşeni.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Coins } from 'lucide-react';
import { BaseDropdownSecici } from '@akalin/ui';

export interface ParaBirimiSeciciProps {
    id?: string;
    value?: number | string | null;
    onChange?: (id: any, rawValue: any) => void;
    disabled?: boolean;
    clearable?: boolean;
    style?: React.CSSProperties;
    className?: string;
    placeholder?: string;
    selectDefault?: boolean;
}

export const ParaBirimiSecici: React.FC<ParaBirimiSeciciProps> = ({
    id = 'para-birimi-secici',
    value,
    onChange,
    disabled = false,
    clearable = true,
    style,
    className,
    placeholder = "Para birimi seçiniz...",
    selectDefault = false
}) => {
    const [paraBirimleri, setParaBirimleri] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchParaBirimleri = async () => {
            try {
                const res = await axios.get('/api/ParaBirimleri');
                const data = Array.isArray(res.data) ? res.data : [];
                const active = data.filter((p: any) => p.aktifMi !== false);
                if (isMounted) {
                    setParaBirimleri(active);
                    // Eğer selectDefault aktifse ve henüz bir değer seçilmemişse varsayılan para birimini otomatik seç
                    if (selectDefault && (value === undefined || value === null || value === '') && onChange) {
                        const defaultCurrency = active.find((p: any) => p.varsayilanMi) || active[0];
                        if (defaultCurrency) {
                            onChange(defaultCurrency.id, defaultCurrency);
                        }
                    }
                }
            } catch (error) {
                console.error("Para birimleri yüklenirken hata oluştu:", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchParaBirimleri();
        return () => { isMounted = false; };
    }, [selectDefault, value, onChange]);

    const options = paraBirimleri.map(p => ({
        id: p.id,
        label: (
            <div className="flex-row items-center gap-8">
                <Coins size={16} style={{ color: 'var(--text-secondary)' }} />
                <span>{p.ad}</span>
                {p.kod && (
                    <span style={{ 
                        fontSize: '11px', 
                        color: 'var(--text-tertiary)',
                        background: 'var(--bg-secondary)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: '600'
                    }}>
                        {p.kod}
                    </span>
                )}
                {p.sembol && (
                    <span style={{
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        fontWeight: '700'
                    }}>
                        {p.sembol}
                    </span>
                )}
            </div>
        ),
        rawValue: p
    }));

    const selectedText = React.useMemo(() => {
        if (value === undefined || value === null || value === '') return undefined;
        const selected = paraBirimleri.find(p => 
            p.kod === value || 
            p.id === value || 
            (p.id !== undefined && p.id !== null && value !== undefined && value !== null && p.id.toString() === value.toString())
        );
        if (selected) {
            return selected.ad;
        }
        // Eğer yükleme devam ediyorsa ham ID'yi gösterme, placeholder görünsün
        if (loading) return undefined;
        return typeof value === 'object' ? undefined : String(value);
    }, [value, paraBirimleri, loading]);

    return (
        <BaseDropdownSecici
            id={id}
            value={value}
            onChange={onChange}
            options={options}
            disabled={disabled || loading}
            clearable={clearable}
            placeholder={loading ? "Para birimleri yükleniyor..." : placeholder}
            style={style}
            className={className}
            displayText={selectedText}
        />
    );
};

export default ParaBirimiSecici;
