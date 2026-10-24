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
    value?: number | string | null;
    onChange?: (id: any, rawValue: any) => void;
    disabled?: boolean;
    clearable?: boolean;
    style?: React.CSSProperties;
    className?: string;
    placeholder?: string;
}

export const ParaBirimiSecici: React.FC<ParaBirimiSeciciProps> = ({
    value,
    onChange,
    disabled = false,
    clearable = true,
    style,
    className,
    placeholder = "Para birimi seçiniz..."
}) => {
    const [paraBirimleri, setParaBirimleri] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchParaBirimleri = async () => {
            try {
                const res = await axios.get('/api/ParaBirimleri');
                const data = res.data || [];
                setParaBirimleri(data.filter((p: any) => p.aktifMi !== false));
            } catch (error) {
                console.error("Para birimleri yüklenirken hata oluştu:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchParaBirimleri();
    }, []);

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

    const selectedText = value ? (paraBirimleri.find(p => p.kod === value || p.id === value)?.ad || value) : undefined;

    return (
        <BaseDropdownSecici
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
