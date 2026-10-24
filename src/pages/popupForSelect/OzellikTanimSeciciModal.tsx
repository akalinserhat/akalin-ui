/**
 * @file OzellikTanimSeciciModal.tsx
 * @description BasePopup / BaseSeciciModal altyapısını kullanarak ürün dinamik özellik tanımları listesinden seçim yapılmasını sağlayan modal bileşeni.
 */

import React from 'react';
import { Settings } from 'lucide-react';
import { BaseSeciciModal } from '@akalin/ui';
import axios from 'axios';

export interface OzellikTanimSeciciModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (selectedId: any, selectedItem: any) => void;
    isMultiSelect?: boolean;
}

const OzellikTanimSeciciModal: React.FC<OzellikTanimSeciciModalProps> = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    isMultiSelect = false 
}) => {
    const columns = [
        {
            accessor: 'adi',
            header: 'Özellik Adı',
            sortable: true,
            render: (item: any) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                        width: '32px', height: '32px', 
                        background: 'var(--bg-secondary)', 
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-secondary)'
                    }}>
                        <Settings size={16} />
                    </div>
                    <div>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                            {item.adi || item.Adi || item.ad}
                        </div>
                    </div>
                </div>
            )
        }
    ];

    const customFetchData = async ({ page, pageSize, aramaMetni }: any) => {
        const res = await axios.get('/api/OzellikTanimlari');
        let data = res.data || [];
        
        // Arama metni varsa filtrele
        if (aramaMetni) {
            const lowerSearch = aramaMetni.toLowerCase();
            data = data.filter((g: any) => (g.adi || g.Adi || g.ad)?.toLowerCase().includes(lowerSearch));
        }
        
        // Client-side pagination
        const startIndex = (page - 1) * pageSize;
        const pagedData = data.slice(startIndex, startIndex + pageSize);
        
        return {
            data: pagedData.map((item: any) => ({ ...item, id: item.id || item.Id })),
            totalCount: data.length
        };
    };

    const mobileCardRender = (item: any) => (
        <div style={{ padding: '12px' }}>
            <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                {item.adi || item.Adi || item.ad}
            </div>
        </div>
    );

    return (
        <BaseSeciciModal
            isOpen={isOpen}
            onClose={onClose}
            onSelect={(selected) => onSelect(selected?.id, selected)}
            title="Ürün Özelliği Seç"
            columns={columns}
            customFetchData={customFetchData}
            isMultiSelect={isMultiSelect}
            searchPlaceholder="Özellik adı ile ara..."
            emptyMessage="Aradığınız özellik bulunamadı."
            mobileCardRender={mobileCardRender}
        />
    );
};

export default OzellikTanimSeciciModal;
