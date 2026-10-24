/**
 * @component BirimSecici
 * @description
 * Birim seçmek için kullanılan pulldown (açılır menü) seçici bileşendir.
 * Birimler "tipAdi" başlıklarıyla gruplanarak hiyerarşik olarak gösterilir
 * (örn. Adet → Adet, Düzine; Ağırlık → Kg, Gram vb.).
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BaseTreeDropdownSecici, TreeDropdownNode } from '@akalin/ui';

export interface BirimSeciciProps {
    id?: string;
    value?: any;
    onChange?: (selectedId: any, rawValue?: any) => void;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    birimTipiId?: number | null;
    matchByName?: boolean;
    variant?: 'default' | 'grid';
    className?: string;
    style?: React.CSSProperties;
}

export const BirimSecici: React.FC<BirimSeciciProps> = ({
    value,
    onChange,
    disabled = false,
    required = false,
    placeholder = "Birim Seçiniz...",
    birimTipiId = null,
    matchByName = false,
    variant = 'default'
}) => {
    const [birimler, setBirimler] = useState<any[]>([]);

    useEffect(() => {
        const fetchBirimler = async () => {
            try {
                const res = await axios.get('/api/Birimler');
                const list = Array.isArray(res.data) ? res.data : (res.data?.veriler || []);
                let aktif = list.filter((b: any) => b.durum !== false && b.durum !== 0);
                if (birimTipiId !== null && birimTipiId !== undefined) {
                    aktif = aktif.filter((b: any) => b.tip === birimTipiId);
                }
                setBirimler(aktif);
            } catch (err) {
                console.error("BirimSecici: Birim listesi alınamadı", err);
            }
        };
        fetchBirimler();
    }, [birimTipiId]);

    const treeData = useMemo(() => {
        const map: Record<string, any[]> = {};
        birimler.forEach(b => {
            const tip = b.tipAdi || 'Diğer';
            if (!map[tip]) map[tip] = [];
            map[tip].push(b);
        });

        const nodes: TreeDropdownNode[] = [];
        Object.entries(map).forEach(([tipAdi, uyeler]) => {
            nodes.push({
                id: `group-${tipAdi}`,
                label: tipAdi,
                searchableText: tipAdi,
                isGroup: true,
                suffix: `(${uyeler.length})`,
                children: uyeler.map(b => ({
                    id: b.id,
                    label: b.ad,
                    searchableText: b.ad,
                    suffix: b.carpan && b.carpan !== 1 ? `×${b.carpan}` : undefined,
                    rawValue: b
                }))
            });
        });
        return nodes;
    }, [birimler]);

    const mappedValue = matchByName && value ? birimler.find(b => b.ad === value)?.id : value;

    return (
        <BaseTreeDropdownSecici
            value={mappedValue}
            onChange={(selectedId, rawValue) => {
                if (onChange) onChange(selectedId, rawValue);
            }}
            treeData={treeData}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            usePortal={true}
            inputClassName={variant === 'grid' ? '' : 'form-input'}
            inputStyle={variant === 'grid' ? {
                border: 'none',
                background: 'transparent',
                paddingLeft: '12px',
                paddingRight: '28px',
                borderRadius: '0',
                fontSize: '13px',
                height: '100%',
                boxSizing: 'border-box',
                outline: 'none',
                boxShadow: 'none'
            } : {}}
        />
    );
};

export default BirimSecici;
