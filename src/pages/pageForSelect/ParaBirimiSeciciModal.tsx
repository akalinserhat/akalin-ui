/**
 * @file ParaBirimiSeciciModal.tsx
 * @description 
 * Webakus UI Core - Merkezi Para Birimi Seçim Modalı / Sayfası (ParaBirimiSeciciModal)
 * 
 * Başlıca Görevleri:
 * - BaseCardPage altyapısını kullanarak aktif para birimlerini listeler ve arama/seçim yapılmasını sağlar.
 * - DataTable ve useTableNavigation entegrasyonu ile klavye ve fare destekli hızlı seçim sunar.
 */

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, Coins } from 'lucide-react';
import { BaseCardPage, DataTable, CurrencyIcon } from '@akalin/ui';
import { useTableNavigation } from '../../hooks/useTableNavigation';
import { useTranslation } from 'react-i18next';

export interface ParaBirimiSeciciModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: any) => void;
    initialSearchText?: string;
}

export const ParaBirimiSeciciModal: React.FC<ParaBirimiSeciciModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    initialSearchText = ''
}) => {
    const { t } = useTranslation();
    const [paraBirimleri, setParaBirimleri] = useState<any[]>([]);
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [aramaMetni, setAramaMetni] = useState<string>(initialSearchText);
    const [isFocused, setIsFocused] = useState<boolean>(false);

    useEffect(() => {
        if (isOpen) {
            setAramaMetni(initialSearchText);
            setRefreshKey(prev => prev + 1);
        }
    }, [isOpen, initialSearchText]);

    const handleFetchData = useCallback(async () => {
        try {
            const res = await axios.get('/api/ParaBirimleri');
            let data = res.data || [];
            
            // Sadece aktif para birimlerini göster
            data = data.filter((p: any) => p.aktifMi);

            // Arama filtresi
            if (aramaMetni) {
                const lowerArama = aramaMetni.toLocaleLowerCase('tr-TR');
                data = data.filter((p: any) => 
                    (p.kod && p.kod.toLocaleLowerCase('tr-TR').includes(lowerArama)) ||
                    (p.ad && p.ad.toLocaleLowerCase('tr-TR').includes(lowerArama))
                );
            }
            
            return { data };
        } catch (error) {
            console.error("Para birimleri alınamadı", error);
            return { data: [] };
        }
    }, [aramaMetni]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setRefreshKey(prev => prev + 1);
        }, 300);
        return () => clearTimeout(handler);
    }, [aramaMetni]);

    useEffect(() => {
        if (isOpen) {
            const contentArea = document.querySelector('.content-area') as HTMLElement;
            if (contentArea) {
                const prevOverflow = contentArea.style.overflow;
                const prevScrollTop = contentArea.scrollTop;
                contentArea.style.overflow = 'hidden';
                contentArea.scrollTop = 0;
                return () => {
                    contentArea.style.overflow = prevOverflow;
                    contentArea.scrollTop = prevScrollTop;
                };
            }
        }
    }, [isOpen]);

    const { selectedIndex, setSelectedIndex } = useTableNavigation({
        data: paraBirimleri,
        isActive: isOpen && !isFocused,
        onEdit: (item: any) => {
            onSelect(item);
        }
    });

    const columns = [
        {
            accessor: 'kod',
            header: t('ParaBirimi_baslik', { defaultValue: 'Para Birimi' }),
            sortable: true,
            render: (item: any) => (
                <div className="flex-row items-center gap-12">
                    <div className="w-8 h-8 rounded-lg bg-secondary border border-glass flex items-center justify-center text-sm font-bold text-accent">
                        <CurrencyIcon code={item.kod} symbol={item.sembol} size={18} />
                    </div>
                    <div>
                        <div className="font-semibold text-primary text-sm">
                            {item.kod}
                        </div>
                        <div className="text-xs text-secondary">
                            {item.ad}
                        </div>
                    </div>
                    {item.varsayilanMi && (
                        <span className="badge-primary text-xs px-2 py-0.5 rounded-full ml-auto">
                            {t('Varsayilan', { defaultValue: 'Varsayılan' })}
                        </span>
                    )}
                </div>
            )
        }
    ];

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
            setIsFocused(false);
            setSelectedIndex(0);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            if (paraBirimleri.length > 0) {
                onSelect(paraBirimleri[0]);
            }
        }
    };

    const handleSelectConfirm = () => {
        if (paraBirimleri && paraBirimleri.length > 0 && selectedIndex >= 0 && selectedIndex < paraBirimleri.length) {
            onSelect(paraBirimleri[selectedIndex]);
        }
    };

    if (!isOpen) return null;

    return (
        <BaseCardPage
            inModal={true}
            overlayClassName="adres-secici-overlay"
            title={t('ParaBirimi_secimi', { defaultValue: 'Para Birimi Seçimi' })}
            icon={<Coins size={20} />}
                subtitleLeft={paraBirimleri.length > 0 ? `${paraBirimleri.length} ${t('kayit_listelendi', { defaultValue: 'kayıt listelendi' })}` : undefined}
                onClose={onClose}
                onSave={paraBirimleri.length > 0 && selectedIndex >= 0 ? handleSelectConfirm : undefined}
                asForm={false}
            >
                <div className="flex-col flex-1 gap-16 min-h-[350px]">
                    <div className="relative flex items-center">
                        <Search size={18} className="absolute left-3 text-secondary pointer-events-none" />
                        <input
                            type="text"
                            className="form-input pl-10 w-full"
                            placeholder={t('ParaBirimi_ara_placeholder', { defaultValue: 'Para birimi ara (Örn: TRY, USD)...' })}
                            value={aramaMetni}
                            onChange={(e) => setAramaMetni(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <DataTable
                            columns={columns}
                            fetchData={handleFetchData}
                            pageSize={50}
                            onDataChange={setParaBirimleri}
                            refreshKey={refreshKey}
                            onRowClick={(item: any) => setSelectedIndex(paraBirimleri.findIndex((i: any) => i.id === item.id))}
                            onRowDoubleClick={(item: any) => onSelect(item)}
                            rowClassName={(_item: any, index: number) => {
                                const isSelected = index === selectedIndex && !isFocused;
                                return isSelected ? 'row-selected' : '';
                            }}
                            emptyMessage={t('ParaBirimi_bulunamadi', { defaultValue: 'Para birimi bulunamadı.' })}
                            mobileCardRender={(item: any) => (
                                <div className="flex-row gap-12 items-center p-3">
                                    <div className="w-10 h-10 rounded-lg bg-secondary border border-glass flex items-center justify-center text-base font-bold text-accent shrink-0">
                                        <CurrencyIcon code={item.kod} symbol={item.sembol} size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0 flex-col gap-1">
                                        <div className="font-semibold text-primary text-sm">
                                            {item.kod}
                                        </div>
                                        <div className="text-xs text-secondary">
                                            {item.ad}
                                        </div>
                                    </div>
                                    {item.varsayilanMi && (
                                        <div className="shrink-0">
                                            <span className="badge-primary text-xs px-2 py-0.5 rounded-full">
                                                {t('Varsayilan', { defaultValue: 'Varsayılan' })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        />
                    </div>
                </div>
            </BaseCardPage>
    );
};

export default ParaBirimiSeciciModal;
