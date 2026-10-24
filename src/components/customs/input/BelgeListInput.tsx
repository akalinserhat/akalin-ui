/**
 * @file BelgeListInput.tsx
 * @description BaseListInput temel bileşenini sarmalayarak seçilen belge (sipariş, irsaliye vb.) listesini yöneten, satır silme ve ekleme aksiyonu sunan liste bileşeni.
 */

import React from 'react';
import { BaseListInput, type BaseListInputColumn as Column } from '@akalin/ui';

export interface BelgeItem {
    id?: string | number;
    tarih: string;
    belgeNo: string;
}

export interface BelgeListInputProps {
    value: BelgeItem[];
    onChange: (items: BelgeItem[]) => void;
    listTitle?: string;
    showAddButton?: boolean;
    onAddClick?: () => void;
}

export const BelgeListInput: React.FC<BelgeListInputProps> = ({ 
    value, 
    onChange, 
    listTitle, 
    showAddButton, 
    onAddClick 
}) => {
    const handleRemove = (index: number) => {
        const newItems = [...value];
        newItems.splice(index, 1);
        onChange(newItems);
    };

    const columns: Column<BelgeItem>[] = [
        {
            header: 'Tarih',
            accessor: 'tarih',
            width: '40%',
            render: (item: BelgeItem) => {
                const datePart = item.tarih.includes('T') ? item.tarih.split('T')[0] : item.tarih;
                const displayTarih = datePart.split('-').reverse().join('.');
                return displayTarih;
            }
        },
        {
            header: 'Belge No',
            accessor: 'belgeNo',
        }
    ];

    return (
        <BaseListInput<BelgeItem>
            items={value}
            onRemove={handleRemove}
            columns={columns}
            emptyMessage="Kayıt bulunmuyor."
            listTitle={listTitle || "Eklenen Belgeler"}
            showAddButton={showAddButton}
            onAddClick={onAddClick}
        />
    );
};

export default BelgeListInput;
