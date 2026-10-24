/**
 * @file GelirGiderKartiSeciciModal.tsx
 * @description BasePopup / BaseSeciciModal altyapısını kullanarak gelir ve gider kartları listesinden seçim yapılmasını sağlayan modal bileşeni.
 */

import React, { useCallback } from 'react';
import { CreditCard } from 'lucide-react';
import { BaseSeciciModal } from '@akalin/ui';
import axios from 'axios';

export interface GelirGiderKartiSeciciModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: any) => void;
    initialSearchText?: string;
    initialSearchTerm?: string;
}

const GelirGiderKartiSeciciModal: React.FC<GelirGiderKartiSeciciModalProps> = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    initialSearchText = '', 
    initialSearchTerm = '' 
}) => {
    const searchText = initialSearchText || initialSearchTerm;

    const handleFetchData = useCallback(async ({ page, pageSize, aramaMetni }: any) => {
        const params = new URLSearchParams();
        if (aramaMetni) {
            params.append('aramaKelimesi', aramaMetni);
        }
        params.append('aktifMi', 'true');
        
        try {
            const res = await axios.get(`/api/GelirGiderKartlari?${params.toString()}`);
            
            let finalData = [];
            if (Array.isArray(res.data)) {
                finalData = res.data;
            } else if (res.data?.veriler && Array.isArray(res.data.veriler)) {
                finalData = res.data.veriler;
            } else if (res.data?.data && Array.isArray(res.data.data)) {
                finalData = res.data.data;
            } else if (res.data?.items && Array.isArray(res.data.items)) {
                finalData = res.data.items;
            }
            
            return { data: finalData };
        } catch (error) {
            console.error("Gelir/Gider Kartı listesi alınamadı", error);
            return { data: [] };
        }
    }, []);

    const columns = [
        {
            accessor: 'ad',
            header: 'Adı',
            sortable: true,
            render: (item: any) => (
                <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>
                        {item.ad}
                    </div>
                </div>
            )
        },
        {
            accessor: 'kod',
            header: 'Kodu',
            sortable: false,
            render: (item: any) => (
                <span style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace', border: '1px solid var(--glass-border)' }}>
                    {item.kod}
                </span>
            )
        },
        {
            accessor: 'tur',
            header: 'Tür',
            sortable: false,
            render: (item: any) => {
                const isGelir = item.tur === 1;
                return (
                    <span style={{ 
                        fontSize: '11px', 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        background: isGelir ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: isGelir ? 'var(--success)' : 'var(--danger)',
                        fontWeight: '500'
                    }}>
                        {item.turAdi || (isGelir ? 'Gelir' : 'Gider')}
                    </span>
                );
            }
        },
        {
            accessor: 'kdvOrani',
            header: 'KDV Oranı',
            sortable: false,
            align: 'right',
            render: (item: any) => (
                <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    %{item.kdvOrani ?? 0}
                </div>
            )
        }
    ];

    const mobileCardRender = (item: any) => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px' }}>
            <div style={{ 
                width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                background: item.tur === 1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: item.tur === 1 ? 'var(--success)' : 'var(--danger)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--glass-border)'
            }}>
                <CreditCard size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>
                    {item.ad}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', padding: '1px 5px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}>
                        {item.kod}
                    </span>
                    <span style={{ fontSize: '11px', color: item.tur === 1 ? 'var(--success)' : 'var(--danger)' }}>
                        {item.turAdi || (item.tur === 1 ? 'Gelir' : 'Gider')}
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <BaseSeciciModal
            isOpen={isOpen}
            onClose={onClose}
            onSelect={onSelect}
            initialSearchText={searchText}
            title="Gelir / Gider Kartı Seçimi"
            searchPlaceholder="Kart Adı veya Kodu Ara..."
            emptyMessage="Arama kriterlerine uygun gelir/gider kartı bulunamadı."
            customFetchData={handleFetchData}
            columns={columns}
            mobileCardRender={mobileCardRender}
        />
    );
};

export default GelirGiderKartiSeciciModal;
