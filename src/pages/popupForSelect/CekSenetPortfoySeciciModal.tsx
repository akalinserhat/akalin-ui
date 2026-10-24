/**
 * @file CekSenetPortfoySeciciModal.tsx
 * @description BasePopup / BaseSeciciModal altyapısını kullanarak portföydeki çek ve senetleri listeleyen ve bordroya eklenmesini sağlayan modal bileşeni.
 */

import React from 'react';
import { BaseSeciciModal } from '@akalin/ui';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@akalin/ui';
import axios from 'axios';

export interface CekSenetPortfoySeciciModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (selected: any[]) => void;
    tur?: 1 | 2; // 1: Cek, 2: Senet
}

const CekSenetPortfoySeciciModal: React.FC<CekSenetPortfoySeciciModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    tur
}) => {
    const { t } = useTranslation();

    const columns = [
        {
            accessor: 'portfoyNo',
            header: t('CekSenetBordroForm_portfoyNo') || 'Portföy No',
            sortable: true
        },
        {
            accessor: 'belgeNo',
            header: t('CekSenetBordroForm_belgeNo') || 'Evrak No',
            sortable: true
        },
        {
            accessor: 'tur',
            header: t('CekSenetBordroForm_tur') || 'Tür',
            render: (row: any) => row.tur === 1 ? t('CekSenetBordroForm_durum_9') || 'Çek' : t('CekSenetBordroForm_durum_10') || 'Senet'
        },
        {
            accessor: 'vadeTarihi',
            header: t('CekSenetBordroForm_vade') || 'Vade Tarihi',
            sortable: true,
            render: (row: any) => row.vadeTarihi ? row.vadeTarihi.split('T')[0] : '-'
        },
        {
            accessor: 'kesideciBorclu',
            header: t('CekSenetBordroForm_kesideci') || 'Keşideci / Borçlu',
            render: (row: any) => row.tur === 1 ? row.kesideci : row.borclu
        },
        {
            accessor: 'bankaSube',
            header: t('CekSenetBordroForm_banka') || 'Banka / Şube',
            render: (row: any) => row.tur === 1 && row.bankaAdi ? `${row.bankaAdi} / ${row.bankaSube || ''}` : '-'
        },
        {
            accessor: 'tutar',
            header: t('CekSenetBordroForm_tutar') || 'Tutar',
            align: 'right',
            render: (row: any) => formatCurrency(row.tutar, row.dovizCinsi)
        },
        {
            accessor: 'cariAdi',
            header: t('CekSenetBordroForm_cari') || 'Cari',
            render: (row: any) => row.cariAdi || '-'
        }
    ];

    const mobileCardRender = (row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {row.belgeNo || row.portfoyNo}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {row.tur === 1 ? 'Çek' : 'Senet'}
                </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{row.kesideci || row.borclu || '-'}</span>
                <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>
                    {formatCurrency(row.tutar, row.dovizCinsi)}
                </span>
            </div>
            {row.vadeTarihi && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Vade: {row.vadeTarihi.split('T')[0]}
                </div>
            )}
        </div>
    );

    const customFetchData = async ({ page, pageSize, aramaMetni }: any) => {
        try {
            const params = new URLSearchParams();
            if (tur) params.append('tur', tur.toString());
            if (aramaMetni) params.append('arama', aramaMetni);
            params.append('durum', '1'); // 1: Portfoyde
            params.append('sayfa', page.toString());
            params.append('sayfaBoyutu', pageSize.toString());

            const res = await axios.get(`/api/CekSenet?${params.toString()}`);
            const data = res.data?.veriler || res.data?.data || (Array.isArray(res.data) ? res.data : []);
            const total = res.data?.toplamKayit || data.length;

            return {
                data: data,
                totalCount: total
            };
        } catch (error) {
            console.error('Portföydeki evraklar yüklenirken hata:', error);
            return { data: [], totalCount: 0 };
        }
    };

    return (
        <BaseSeciciModal
            isOpen={isOpen}
            onClose={onClose}
            onSelect={onSelect}
            title={tur === 1 ? t('CekSenetBordroForm_cekSec') || 'Portföyden Çek Seç' : (tur === 2 ? t('CekSenetBordroForm_senetSec') || 'Portföyden Senet Seç' : t('CekSenetBordroForm_evrakSec') || 'Portföyden Evrak Seç')}
            columns={columns}
            customFetchData={customFetchData}
            isMultiSelect={true}
            confirmButtonText={t('CekSenetBordroForm_secilenleriAktar') || 'Seçilenleri Aktar'}
            searchPlaceholder={t('CekSenetPortfoySeciciModal_searchPlaceholder') || 'Evrak No, Keşideci veya Borçlu Ara...'}
            mobileCardRender={mobileCardRender}
        />
    );
};

export default CekSenetPortfoySeciciModal;
