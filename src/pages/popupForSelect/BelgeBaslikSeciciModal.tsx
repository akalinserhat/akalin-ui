/**
 * @file BelgeBaslikSeciciModal.tsx
 * @description BasePopup / BaseSeciciModal altyapısını kullanarak genel belge başlıkları listesinden tekli veya çoklu seçim yapılmasını sağlayan modal bileşeni.
 */

import React, { useCallback } from 'react';
import { BaseSeciciModal } from '@akalin/ui';
import { FileText } from 'lucide-react';

export interface BelgeBaslik {
    id: number | string;
    belgeNo: string;
    tarih: string;
    cariAdi?: string;
    tutar?: number;
    [key: string]: any;
}

export interface BelgeBaslikSeciciModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (seciliBelgeler: BelgeBaslik[]) => void;
    isMultiSelect?: boolean;
    title?: string;
    items?: BelgeBaslik[];
    fetchData?: (aramaMetni: string) => Promise<BelgeBaslik[]>;
    hideFinanceInfo?: boolean;
}

const DEFAULT_ITEMS: BelgeBaslik[] = [];

const BelgeBaslikSeciciModal: React.FC<BelgeBaslikSeciciModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    isMultiSelect = true,
    title = "Belge Seçimi",
    items = DEFAULT_ITEMS,
    fetchData,
    hideFinanceInfo = false
}) => {
    
    const handleFetchData = useCallback(async ({ page, pageSize, aramaMetni }: any) => {
        if (fetchData) {
            try {
                const data = await fetchData(aramaMetni);
                return { data: data || [] };
            } catch (error) {
                console.error("Belgeler alınamadı", error);
                return { data: [] };
            }
        } else {
            let data = items || [];
            if (aramaMetni) {
                const lowerSearch = aramaMetni.toLocaleLowerCase('tr-TR');
                data = data.filter((k: any) => 
                    (k.belgeNo && k.belgeNo.toLocaleLowerCase('tr-TR').includes(lowerSearch)) ||
                    (k.cariAdi && k.cariAdi.toLocaleLowerCase('tr-TR').includes(lowerSearch))
                );
            }
            return { data };
        }
    }, [fetchData, items]);

    const columns = [
        {
            accessor: 'tarih',
            header: 'Tarih',
            width: '110px',
            sortable: true,
            render: (item: BelgeBaslik) => (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {item.tarih ? new Date(item.tarih).toLocaleDateString('tr-TR') : '-'}
                </div>
            )
        },
        {
            accessor: 'belgeNo',
            header: 'Belge No',
            width: '130px',
            sortable: true,
            render: (item: BelgeBaslik) => (
                <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} className="text-secondary" />
                    <span>{item.belgeNo}</span>
                </div>
            )
        },
        {
            accessor: 'cariAdi',
            header: 'Cari',
            sortable: true,
            render: (item: BelgeBaslik) => (
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    {item.cariAdi || '-'}
                </div>
            )
        },
        ...(!hideFinanceInfo ? [{
            accessor: 'tutar',
            header: 'Tutar',
            width: '130px',
            align: 'right',
            render: (item: BelgeBaslik) => (
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>
                    ₺{(item.tutar || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            )
        }] : [])
    ];

    const mobileCardRender = (item: BelgeBaslik) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} className="text-accent" />
                    {item.belgeNo}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {item.tarih ? new Date(item.tarih).toLocaleDateString('tr-TR') : '-'}
                </span>
            </div>
            {item.cariAdi && (
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {item.cariAdi}
                </div>
            )}
            {!hideFinanceInfo && item.tutar !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--accent-primary)', fontSize: '13px' }}>
                        ₺{item.tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            )}
        </div>
    );

    const handleSelect = (selectedResult: any) => {
        if (isMultiSelect) {
            onSelect(selectedResult as BelgeBaslik[]);
        } else {
            onSelect([selectedResult as BelgeBaslik]);
        }
    };

    return (
        <BaseSeciciModal
            isOpen={isOpen}
            onClose={onClose}
            onSelect={handleSelect}
            title={title}
            searchPlaceholder="Belge No veya Cari Ara..."
            emptyMessage="Arama kriterlerine uygun belge bulunamadı."
            customFetchData={handleFetchData}
            columns={columns}
            mobileCardRender={mobileCardRender}
            isMultiSelect={isMultiSelect}
            confirmButtonText="Seç"
        />
    );
};

export default BelgeBaslikSeciciModal;
