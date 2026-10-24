/**
 * @file IrsaliyeSeciciModal.tsx
 * @description BasePopup / BaseSeciciModal altyapısını kullanarak irsaliye belgelerini listeleyen ve faturalaştırma için seçim yapılmasını sağlayan modal bileşeni.
 */

import React, { useCallback } from 'react';
import axios from 'axios';
import { BaseSeciciModal } from '@akalin/ui';

export interface IrsaliyeSeciciModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (irsaliye: any, kalemler: any[]) => void;
    initialSearchText?: string;
    irsaliyeTuru?: number; // 1: Giriş İrsaliyesi, 2: Çıkış İrsaliyesi
    cariId?: number;
    excludedIds?: number[];
}

const IrsaliyeSeciciModal: React.FC<IrsaliyeSeciciModalProps> = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    initialSearchText = '', 
    irsaliyeTuru, 
    cariId, 
    excludedIds = [] 
}) => {
    
    const handleFetchData = useCallback(async ({ page, pageSize, aramaMetni }: any) => {
        try {
            const res = await axios.get(`/api/Irsaliyeler`);
            let data = res.data || [];
            
            // Filtrelemeler
            if (cariId) {
                data = data.filter((i: any) => i.cariId == cariId);
            }
            if (irsaliyeTuru) {
                data = data.filter((i: any) => i.irsaliyeTuru == irsaliyeTuru);
            }
            
            if (aramaMetni) {
                const lowerSearch = aramaMetni.toLocaleLowerCase('tr-TR');
                data = data.filter((i: any) => 
                    (i.irsaliyeNo && i.irsaliyeNo.toLocaleLowerCase('tr-TR').includes(lowerSearch)) ||
                    (i.cariUnvan && i.cariUnvan.toLocaleLowerCase('tr-TR').includes(lowerSearch)) ||
                    (i.siparisNo && i.siparisNo.toLocaleLowerCase('tr-TR').includes(lowerSearch))
                );
            }
            
            if (excludedIds && excludedIds.length > 0) {
                data = data.filter((i: any) => !excludedIds.includes(i.id));
            }
            
            return { data };
        } catch (error) {
            console.error("İrsaliye belgeleri alınamadı", error);
            return { data: [] };
        }
    }, [irsaliyeTuru, cariId, excludedIds]);

    const columns = [
        {
            accessor: 'tarih',
            header: 'Tarih',
            width: '100px',
            sortable: true,
            render: (item: any) => (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {item.tarih ? new Date(item.tarih).toLocaleDateString('tr-TR') : '-'}
                </div>
            )
        },
        {
            accessor: 'irsaliyeNo',
            header: 'İrsaliye No',
            width: '120px',
            sortable: true,
            render: (item: any) => (
                <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '13px' }}>
                    {item.irsaliyeNo || item.belgeNo}
                </div>
            )
        },
        {
            accessor: 'irsaliyeTuruAdi',
            header: 'Tür',
            width: '110px',
            sortable: true,
            render: (item: any) => {
                const isGiris = item.irsaliyeTuru === 1;
                return (
                    <div style={{ 
                        fontSize: '11px', 
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isGiris ? 'rgba(234, 179, 8, 0.1)' : 'rgba(14, 165, 233, 0.1)',
                        color: isGiris ? 'var(--warning)' : 'var(--info)',
                        display: 'inline-block',
                        fontWeight: '500'
                    }}>
                        {item.irsaliyeTuruAdi || (isGiris ? 'Giriş İrsaliyesi' : 'Çıkış İrsaliyesi')}
                    </div>
                );
            }
        },
        {
            accessor: 'cariUnvan',
            header: 'Cari Ünvan',
            sortable: true,
            render: (item: any) => (
                <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '13px' }}>
                    {item.cariUnvan || '-'}
                </div>
            )
        },
        {
            accessor: 'kalemSayisi',
            header: 'Kalem Sayısı',
            width: '100px',
            align: 'right',
            render: (item: any) => (
                <div style={{ fontSize: '13px' }}>
                    {item.kalemler?.length || item.kalemSayisi || 0} Kalem
                </div>
            )
        },
        {
            accessor: 'genelToplam',
            header: 'Toplam Tutar',
            width: '130px',
            align: 'right',
            render: (item: any) => (
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>
                    ₺{(item.genelToplam || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            )
        }
    ];

    const mobileCardRender = (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>
                    {item.irsaliyeNo || item.belgeNo}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {item.tarih ? new Date(item.tarih).toLocaleDateString('tr-TR') : '-'}
                </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {item.cariUnvan || '-'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                    {item.kalemler?.length || item.kalemSayisi || 0} Kalem
                </span>
                <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>
                    ₺{(item.genelToplam || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
        </div>
    );

    const handleSelect = (irsaliye: any) => {
        const kalemler = (irsaliye.kalemler || []).map((k: any) => ({
            ...k,
            irsaliyeId: irsaliye.id,
            irsaliyeNo: irsaliye.irsaliyeNo || irsaliye.belgeNo,
            miktar: k.miktar || 1,
            birimFiyat: k.birimFiyat || 0,
            kdvOrani: k.kdvOrani || 0,
            tutar: k.tutar || (k.miktar * k.birimFiyat)
        }));
        onSelect(irsaliye, kalemler);
    };

    return (
        <BaseSeciciModal
            isOpen={isOpen}
            onClose={onClose}
            onSelect={handleSelect}
            initialSearchText={initialSearchText}
            title="İrsaliye Seçimi"
            searchPlaceholder="İrsaliye No, Cari Ünvan veya Sipariş No Ara..."
            emptyMessage="Arama kriterlerine uygun irsaliye belgesi bulunamadı."
            customFetchData={handleFetchData}
            columns={columns}
            mobileCardRender={mobileCardRender}
            isMultiSelect={false}
            confirmButtonText="Aktar"
        />
    );
};

export default IrsaliyeSeciciModal;
