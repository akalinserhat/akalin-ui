/**
 * @file CariAdresSecici.tsx
 * @description 
 * Webakus UI Core - Cari Adres Seçici Sayfası / Modalı (CariAdresSecici)
 * 
 * Başlıca Görevleri:
 * - BaseCardPage mimarisi üzerine kurulu olarak seçilen cariye ait kayıtlı teslimat, fatura ve genel adresleri listeler.
 * - DataTable ve useTableNavigation entegrasyonu ile klavye ve fare destekli hızlı arama ve seçim imkanı sunar.
 * - inModal desteği ile hem bağımsız tam sayfa rota hem de sayfa içi (.content-area) overlay olarak çalışabilir.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { MapPin, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseCardPage } from '@akalin/ui';
import { DataTable } from '@akalin/ui';
import { CancelButton } from '@akalin/ui';
import { useTableNavigation } from '../../hooks/useTableNavigation';

export interface CariAdresItem {
    id?: number | string;
    adresid?: number | string;
    baslik?: string;
    tipi?: number; // 1: Fatura, 2: Nakliye / Sevk, 3: Genel
    tipiAdi?: string;
    varsayilanMi?: boolean;
    acikAdres?: string;
    formattedAdres?: string;
    ilAdi?: string;
    ilceAdi?: string;
    firmaAdi?: string;
    isimSoyisim?: string;
    telefon?: string;
    unvan?: string;
    vergiDairesi?: string;
    vergiNo?: string;
    [key: string]: any;
}

export interface CariAdresSeciciProps {
    isOpen?: boolean;
    onClose: () => void;
    onSelect: (adres: CariAdresItem) => void;
    cariId?: number | string | null;
    adresTipi?: number; // 1: Fatura, 2: Nakliye / Sevk
    title?: string;
    subtitle?: React.ReactNode;
    inModal?: boolean;
    extraHeaderAction?: React.ReactNode;
    renderAddButton?: (props: { cariId?: number | string | null; activeAdresTipi?: number | null; onAdresEklendi: () => void }) => React.ReactNode;
}

export type CariAdresSeciciModalProps = CariAdresSeciciProps;

export const CariAdresSecici: React.FC<CariAdresSeciciProps> = ({
    isOpen = true,
    onClose,
    onSelect,
    cariId,
    adresTipi,
    title,
    subtitle,
    inModal = true,
    extraHeaderAction,
    renderAddButton
}) => {
    const { t } = useTranslation();
    const [adresler, setAdresler] = useState<CariAdresItem[]>([]);
    const [refreshKey, setRefreshKey] = useState<number>(0);
    const [filterTipi, setFilterTipi] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && cariId) {
            setFilterTipi(adresTipi || null);
            setRefreshKey(prev => prev + 1);
        }
    }, [isOpen, cariId, adresTipi]);

    // inModal durumunda content-area overflow yönetimi
    useEffect(() => {
        if (isOpen && inModal) {
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
    }, [isOpen, inModal]);

    const handleFetchData = useCallback(async () => {
        if (!cariId) return { data: [] };
        try {
            const res = await axios.get(`/api/Cari/${cariId}`);
            let allAdresler: CariAdresItem[] = res.data?.adresler || [];
            
            if (filterTipi) {
                allAdresler = allAdresler.filter(a => a.tipi === filterTipi || a.tipi === 3);
            } else if (adresTipi) {
                allAdresler.sort((a, b) => {
                    const aMatches = a.tipi === adresTipi || a.tipi === 3;
                    const bMatches = b.tipi === adresTipi || b.tipi === 3;
                    if (aMatches && !bMatches) return -1;
                    if (!aMatches && bMatches) return 1;
                    return 0;
                });
            }

            return { data: allAdresler };
        } catch (error) {
            console.error("Cari adresleri alınamadı", error);
            toast.error(t('CariAdresSeciciModal_hata', 'Cari adresleri yüklenemedi.'));
            return { data: [] };
        }
    }, [cariId, adresTipi, filterTipi, t]);

    const { selectedIndex, setSelectedIndex } = useTableNavigation({
        data: adresler,
        isActive: isOpen,
        onEdit: (item: CariAdresItem) => {
            onSelect(item);
            onClose();
        }
    });

    const columns = [
        {
            accessor: 'baslik',
            header: t('CariAdresSeciciModal_adresBasligi', 'Adres Başlığı'),
            sortable: false,
            render: (item: CariAdresItem) => (
                <div className="flex-col gap-4">
                    <div className="cari-adres-item-title">
                        {item.baslik || t('CariAdresSeciciModal_isimsizAdres', 'İsimsiz Adres')}
                    </div>
                    <div className="flex-row items-center gap-8">
                        <span className={`cari-adres-type-badge ${item.tipi === 1 ? 'type-fatura' : item.tipi === 2 ? 'type-nakliye' : 'type-genel'}`}>
                            <MapPin size={12}/> {item.tipiAdi || (item.tipi === 1 ? t('Fatura', 'Fatura') : item.tipi === 2 ? t('Nakliye / Sevk', 'Nakliye / Sevk') : t('Genel', 'Genel'))}
                        </span>
                        {item.varsayilanMi && (
                            <span className="cari-adres-default-badge">
                                {t('Varsayılan', 'Varsayılan')}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            accessor: 'acikAdres',
            header: t('CariAdresSeciciModal_acikAdres', 'Açık Adres'),
            sortable: false,
            render: (item: CariAdresItem) => (
                <div className="cari-adres-text-desc">
                    {item.acikAdres || (item.ilAdi && `${item.ilAdi} / ${item.ilceAdi}`) || '-'}
                </div>
            )
        },
        {
            accessor: 'iletisim',
            header: t('CariAdresSeciciModal_iletisimFirma', 'İletişim / Firma'),
            sortable: false,
            render: (item: CariAdresItem) => (
                <div className="flex-col gap-2">
                    {item.firmaAdi && <div className="cari-adres-contact-item">{item.firmaAdi}</div>}
                    {item.isimSoyisim && <div className="cari-adres-contact-item">{item.isimSoyisim}</div>}
                    {item.telefon && <div className="cari-adres-contact-sub">{item.telefon}</div>}
                </div>
            )
        }
    ];

    const selectedAdres = adresler && adresler.length > 0 && selectedIndex >= 0 && selectedIndex < adresler.length
        ? adresler[selectedIndex]
        : null;

    const handleSelectConfirm = () => {
        if (selectedAdres) {
            onSelect(selectedAdres);
            onClose();
        }
    };

    const modalTitle = title || (adresTipi === 1 
        ? t('CariAdresSeciciModal_faturaTitle', 'Fatura Adresi Seçimi') 
        : adresTipi === 2 
            ? t('CariAdresSeciciModal_nakliyeTitle', 'Nakliye Adresi Seçimi') 
            : t('CariAdresSeciciModal_cariTitle', 'Cari Adres Seçimi'));

    if (!isOpen) return null;

    const baseCardPageElement = (
        <BaseCardPage
            inModal={inModal}
            overlayClassName="adres-secici-overlay"
            id="cariAdresSeciciCardPage"
            title={modalTitle}
            icon={<MapPin size={20} />}
            subtitleLeft={adresler.length > 0 ? t('auto_toplam_kayit_gosterildi', { count: adresler.length, defaultValue: `Toplam ${adresler.length} kayıt listelendi.` }) : undefined}
            subtitle={subtitle}
            onClose={onClose}
            showBackButton={true}
            hideBreadcrumb={true}
            asForm={false}
            headerExtra={
                <div className="flex-row items-center gap-8">
                    {extraHeaderAction}
                    {renderAddButton && renderAddButton({
                        cariId,
                        activeAdresTipi: filterTipi || adresTipi || 2,
                        onAdresEklendi: () => setRefreshKey(prev => prev + 1)
                    })}
                </div>
            }
        >
            <div className="cari-adres-secici-layout">
                {/* Toolbar: Filter Buttons */}
                <div className="cari-adres-secici-toolbar">
                    <div className="flex-row gap-8 flex-wrap items-center">
                        <button 
                            type="button" 
                            className={`cari-adres-filter-chip ${filterTipi === null ? 'active' : ''}`}
                            onClick={() => { setFilterTipi(null); setRefreshKey(prev => prev + 1); }}
                        >
                            {t('Tümü', 'Tümü')}
                        </button>
                        <button 
                            type="button" 
                            className={`cari-adres-filter-chip ${filterTipi === 2 ? 'active' : ''}`}
                            onClick={() => { setFilterTipi(2); setRefreshKey(prev => prev + 1); }}
                        >
                            {t('Nakliye / Sevk', 'Nakliye / Sevk')}
                        </button>
                        <button 
                            type="button" 
                            className={`cari-adres-filter-chip ${filterTipi === 1 ? 'active' : ''}`}
                            onClick={() => { setFilterTipi(1); setRefreshKey(prev => prev + 1); }}
                        >
                            {t('Fatura', 'Fatura')}
                        </button>
                    </div>
                </div>

                {/* Table Area */}
                <div className="cari-adres-table-container">
                    <DataTable
                        columns={columns}
                        fetchData={handleFetchData}
                        pageSize={100}
                        onDataChange={setAdresler}
                        refreshKey={refreshKey}
                        onRowClick={(item: CariAdresItem) => setSelectedIndex(adresler.findIndex(i => (i.adresid || i.id) === (item.adresid || item.id)))}
                        onRowDoubleClick={(item: CariAdresItem) => {
                            onSelect(item);
                            onClose();
                        }}
                        rowClassName={(_item: CariAdresItem, index: number) => {
                            const isSelected = index === selectedIndex;
                            return isSelected ? 'row-selected' : '';
                        }}
                        emptyMessage={t('CariAdresSeciciModal_empty', 'Cari karta ait adres bulunamadı.')}
                        mobileCardRender={(item: CariAdresItem) => (
                            <div className="cari-adres-mobile-card">
                                <div className={`cari-adres-mobile-icon ${item.tipi === 1 ? 'type-fatura' : item.tipi === 2 ? 'type-nakliye' : 'type-genel'}`}>
                                    <MapPin size={20} />
                                </div>
                                <div className="flex-col flex-1 gap-6 min-w-0">
                                    <div className="cari-adres-item-title">
                                        {item.baslik || t('CariAdresSeciciModal_isimsizAdres', 'İsimsiz Adres')}
                                    </div>
                                    <div className="flex-row flex-wrap gap-6 items-center">
                                        <span className={`cari-adres-type-badge ${item.tipi === 1 ? 'type-fatura' : item.tipi === 2 ? 'type-nakliye' : 'type-genel'}`}>
                                            {item.tipiAdi || (item.tipi === 1 ? t('Fatura', 'Fatura') : item.tipi === 2 ? t('Nakliye / Sevk', 'Nakliye / Sevk') : t('Genel', 'Genel'))}
                                        </span>
                                        {item.varsayilanMi && (
                                            <span className="cari-adres-default-badge">
                                                {t('Varsayılan', 'Varsayılan')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="cari-adres-text-desc">
                                        {item.acikAdres || (item.ilAdi && `${item.ilAdi} / ${item.ilceAdi}`) || '-'}
                                    </div>
                                    {(item.firmaAdi || item.isimSoyisim || item.telefon) && (
                                        <div className="flex-col gap-2 pt-8 mt-4 border-t border-glass">
                                            {item.firmaAdi && <div className="cari-adres-contact-item">{item.firmaAdi}</div>}
                                            {item.isimSoyisim && <div className="cari-adres-contact-item">{item.isimSoyisim}</div>}
                                            {item.telefon && <div className="cari-adres-contact-sub">{item.telefon}</div>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    />
                </div>

                {/* Footer Action Bar */}
                <div className="adres-secici-footer">
                    <div className="text-13 text-secondary flex-row items-center gap-6">
                        <MapPin size={15} color={selectedAdres ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                        <span>
                            {selectedAdres
                                ? `${selectedAdres.baslik || t('CariAdresSeciciModal_isimsizAdres', 'İsimsiz Adres')} (${selectedAdres.tipiAdi || (selectedAdres.tipi === 1 ? t('Fatura', 'Fatura') : selectedAdres.tipi === 2 ? t('Nakliye / Sevk', 'Nakliye / Sevk') : t('Genel', 'Genel'))})`
                                : t('auto_henuz_secim_yapilmad_671b', 'Henüz seçim yapılmadı.')}
                        </span>
                    </div>
                    <div className="flex-row items-center gap-12">
                        <CancelButton onClick={onClose} />
                        <button 
                            type="button" 
                            onClick={handleSelectConfirm}
                            className="btn btn-primary flex-row items-center gap-8"
                            disabled={!selectedAdres}
                        >
                            <span>{t('auto_secimi_tamamla_5044', 'Seçimi Tamamla')}</span>
                            <ArrowRight size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>
        </BaseCardPage>
    );

    return baseCardPageElement;
};

export const CariAdresSeciciModal = CariAdresSecici;
export default CariAdresSecici;
