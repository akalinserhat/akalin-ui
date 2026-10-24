/**
 * @component SubeSecici
 * @description
 * Şirkete ait şubelerin listesini getiren ve seçim yaptıran açılır menü bileşeni.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Store } from 'lucide-react';
import { BaseDropdownSecici } from '@akalin/ui';

export interface SubeSeciciProps {
    value?: number | string | null;
    onChange?: (id: any, rawValue: any) => void;
    disabled?: boolean;
    clearable?: boolean;
    style?: React.CSSProperties;
    className?: string;
    placeholder?: string;
}

export const SubeSecici: React.FC<SubeSeciciProps> = ({
    value,
    onChange,
    disabled = false,
    clearable = true,
    style,
    className,
    placeholder = "Şube seçiniz..."
}) => {
    const [subeler, setSubeler] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubeler = async () => {
            try {
                const res = await axios.get('/api/Subeler');
                setSubeler(res.data || []);
            } catch (error) {
                console.error("Şubeler yüklenirken hata oluştu:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSubeler();
    }, []);

    const options = subeler.map(s => ({
        id: s.id,
        label: (
            <div className="flex-row items-center gap-8">
                <Store size={16} style={{ color: 'var(--text-secondary)' }} />
                <span>{s.ad}</span>
                {s.kodu && (
                    <span style={{ 
                        fontSize: '11px', 
                        color: 'var(--text-tertiary)',
                        background: 'var(--bg-secondary)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                    }}>
                        {s.kodu}
                    </span>
                )}
            </div>
        ),
        rawValue: s
    }));

    const selectedText = value ? subeler.find(s => s.id === value)?.ad : undefined;

    return (
        <BaseDropdownSecici
            value={value}
            onChange={onChange}
            options={options}
            disabled={disabled || loading}
            clearable={clearable}
            placeholder={loading ? "Şubeler yükleniyor..." : placeholder}
            style={style}
            className={className}
            displayText={selectedText}
        />
    );
};

export default SubeSecici;
