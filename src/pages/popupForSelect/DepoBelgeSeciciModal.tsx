/**
 * @file DepoBelgeSeciciModal.tsx
 * @description BaseSeciciModal altyapısını kullanarak sistemdeki depoları ve depo fiş/hareket belgelerini listeleyen ve seçim yaptıran popup modalı.
 */

import React, { useCallback } from 'react';
import axios from 'axios';
import { BaseSeciciModal } from '@akalin/ui';
import { Layers, Warehouse } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface DepoBelgeItem {
    id: number | string;
    depoKodu?: string;
    depoAdi?: string;
    belgeNo?: string;
    aciklama?: string;
    subeAdi?: string;
    [key: string]: any;
}

export interface DepoBelgeSeciciModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (belge: DepoBelgeItem) => void;
    initialSearchText?: string;
    excludedIds?: (number | string)[];
    title?: string;
    fetchData?: (aramaMetni: string) => Promise<DepoBelgeItem[]>;
}

const DepoBelgeSeciciModal: React.FC<DepoBelgeSeciciModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    initialSearchText = '',
    excludedIds = [],
    title,
    fetchData
}) => {
    const { t } = useTranslation();

    const handleFetchData = useCallback(async ({ page, pageSize, aramaMetni }: any) => {
        if (fetchData) {
            try {
                const data = await fetchData(aramaMetni);
                let filtered = data || [];
                if (excludedIds && excludedIds.length > 0) {
                    const exSet = new Set(excludedIds.map(id => String(id)));
                    filtered = filtered.filter(item => !exSet.has(String(item.id)));
                }
                return { data: filtered };
            } catch (error) {
                console.error("Depo belgeleri alınamadı", error);
                return { data: [] };
            }
        }

        try {
            const res = await axios.get('/api/Depolar');
            let items: DepoBelgeItem[] = res.data?.veriler || res.data || [];

            if (excludedIds && excludedIds.length > 0) {
                const exSet = new Set(excludedIds.map(id => String(id)));
                items = items.filter(item => !exSet.has(String(item.id)));
            }

            if (aramaMetni) {
                const lowerSearch = aramaMetni.toLocaleLowerCase('tr-TR');
                items = items.filter((i: DepoBelgeItem) => 
                    (i.depoKodu && i.depoKodu.toLocaleLowerCase('tr-TR').includes(lowerSearch)) ||
                    (i.depoAdi && i.depoAdi.toLocaleLowerCase('tr-TR').includes(lowerSearch)) ||
                    (i.belgeNo && i.belgeNo.toLocaleLowerCase('tr-TR').includes(lowerSearch)) ||
                    (i.aciklama && i.aciklama.toLocaleLowerCase('tr-TR').includes(lowerSearch))
                );
            }

            return { data: items };
        } catch (error) {
            console.error("Depo verileri alınamadı", error);
            return { data: [] };
        }
    }, [fetchData, excludedIds]);

    const columns = [
        {
            accessor: 'depoKodu',
            header: t('Belge / Depo Kodu') || 'Belge / Depo Kodu',
            width: '160px',
            sortable: true,
            render: (item: DepoBelgeItem) => (
                <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Warehouse size={15} color="var(--accent-primary)" />
                    <span>{item.depoKodu || item.belgeNo || '-'}</span>
                </div>
            )
        },
        {
            accessor: 'depoAdi',
            header: t('Açıklama / Depo Adı') || 'Açıklama / Depo Adı',
            sortable: true,
            render: (item: DepoBelgeItem) => (
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    {item.depoAdi || item.aciklama || '-'}
                </div>
            )
        },
        {
            accessor: 'subeAdi',
            header: t('Şube') || 'Şube',
            width: '140px',
            sortable: true,
            render: (item: DepoBelgeItem) => (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {item.subeAdi || '-'}
                </div>
            )
        }
    ];

    const mobileCardRender = (item: DepoBelgeItem) => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px' }}>
            <div style={{ 
                width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Warehouse size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>
                    {item.depoKodu || item.belgeNo || '-'}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.depoAdi || item.aciklama || '-'}
                </span>
                {item.subeAdi && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.subeAdi}
                    </span>
                )}
            </div>
        </div>
    );

    const handleSelect = (selectedItem: any) => {
        if (!selectedItem) return;
        const normalizedItem: DepoBelgeItem = {
            ...selectedItem,
            belgeNo: selectedItem.depoKodu || selectedItem.belgeNo
        };
        onSelect(normalizedItem);
        onClose();
    };

    return (
        <BaseSeciciModal
            isOpen={isOpen}
            onClose={onClose}
            onSelect={handleSelect}
            title={title || t('Depo / Belge Seçimi') || 'Depo / Belge Seçimi'}
            searchPlaceholder={t('DepoSeciciModal_searchPlaceholder') || 'Belge No veya Depo Ara...'}
            emptyMessage={t('DepoSeciciModal_empty') || 'Kriterlere uygun depo veya belge bulunamadı.'}
            customFetchData={handleFetchData}
            columns={columns}
            mobileCardRender={mobileCardRender}
            isMultiSelect={false}
            initialSearchText={initialSearchText}
        />
    );
};

export default DepoBelgeSeciciModal;
