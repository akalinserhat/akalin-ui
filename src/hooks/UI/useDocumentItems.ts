/**
 * @file useDocumentItems.ts
 * @description 
 * Belge ve form ekranlarında (İrsaliye, Fatura, Sipariş, Çek/Senet Bordrosu vb.) 
 * grid/tablo satır (kalem) ekleme ve silme mantığını merkezi olarak yöneten kanca (hook).
 * 
 * Başlıca Görevleri:
 * - Yeni satır ekleme (`addRow`): Mevcut son satır boş ise mükerrer boş satır eklenmesini engeller.
 * - Satır silme (`removeRow`): Satır silindiğinde formun değişiklik durumunu (`onDirtyChange`) günceller.
 */

import React, { useCallback } from 'react';

export interface UseDocumentItemsOptions<T> {
    items: T[];
    setItems: React.Dispatch<React.SetStateAction<T[]>>;
    onDirtyChange?: (isDirty: boolean) => void;
    isEmptyRow?: (row: T) => boolean;
    createEmptyRow: () => T;
    idKey?: keyof T;
}

export const useDocumentItems = <T extends Record<string, any>>({
    items,
    setItems,
    onDirtyChange,
    isEmptyRow = (row: any) => !row.urunId && !row.urunVeHizmetKartiId && !row.cekSenetKartId,
    createEmptyRow,
    idKey = 'id' as keyof T
}: UseDocumentItemsOptions<T>) => {

    const addRow = useCallback(() => {
        setItems(prev => {
            const hasEmptyRow = prev.some(r => isEmptyRow(r));
            if (hasEmptyRow) return prev;
            return [...prev, createEmptyRow()];
        });
    }, [setItems, isEmptyRow, createEmptyRow]);

    const removeRow = useCallback((id: any) => {
        if (items.length <= 1) return;
        const targetItem = items.find(k => k[idKey] === id);
        const isTargetEmpty = targetItem ? isEmptyRow(targetItem) : true;

        setItems(prev => prev.filter(k => k[idKey] !== id));

        // Sadece dolu (gerçek veri barındıran) bir satır silindiğinde onDirtyChange(true) çağrılır
        if (!isTargetEmpty && onDirtyChange) {
            onDirtyChange(true);
        }
    }, [items, idKey, isEmptyRow, setItems, onDirtyChange]);

    return {
        addRow,
        removeRow
    };
};
