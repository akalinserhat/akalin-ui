/**
 * @file stokUtils.tsx
 * @description Ürün ve hizmetler için stok durumu rozeti (pill) ve durum gösterimi yardımcıları.
 */

import React from 'react';
import { Package, Truck } from 'lucide-react';

export interface RenderStokDurumuOptions {
    onClick?: (e: React.MouseEvent) => void;
    isClickable?: boolean;
}

// Akıllı rakam kısaltma (1.5M, 150K vb.)
export const formatCompactNumber = (value: number): string => {
    if (value >= 1_000_000) {
        return (value / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + 'M';
    }
    if (value >= 100_000) {
        return (value / 1_000).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + 'K';
    }
    return value.toLocaleString('tr-TR');
};

export const renderStokDurumu = (item: any, options?: RenderStokDurumuOptions) => {
    if (item.urunVeHizmetTuru === 'Hizmet') {
        return <span style={{ color: 'var(--text-muted)' }}>-</span>;
    }

    const kesinSatilabilir = item.kesinSatilabilirStokMiktari || 0;
    const mevcutDepo = item.toplamDepoMiktari || 0;
    const genelSatilabilir = item.satilabilirStokMiktari || 0;

    // Duruma göre semantik tema seçimi
    let state: 'success' | 'warning' | 'danger' = 'danger';
    if (kesinSatilabilir > 0) state = 'success';
    else if (mevcutDepo > 0) state = 'warning';

    // Renk paleti
    const colorVars = {
        success: { text: 'var(--success)', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' },
        warning: { text: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' },
        danger: { text: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)' },
    };

    const theme = colorVars[state];

    return (
        <div 
            onClick={options?.onClick}
            style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-end', 
                gap: '5px',
                cursor: options?.isClickable ? 'pointer' : 'default',
            }}
            title={options?.isClickable ? "Detaylı stok analizi için tıklayın" : "Stok Durumu Özeti"}
        >
            {/* 1. SEVİYE BİLGİ: "Pill" (Rozet) Tasarımı */}
            <div 
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 8px',
                    borderRadius: '20px',
                    backgroundColor: theme.bg,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    fontSize: '12px',
                    fontWeight: '600',
                    lineHeight: '1.2'
                }}
            >
                {/* Durum İkonu */}
                <span 
                    style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: theme.text,
                        display: 'inline-block'
                    }} 
                />
                
                {/* Ana Sayı + Birim */}
                <span>
                    {formatCompactNumber(kesinSatilabilir)}
                    <span style={{ fontSize: '10px', marginLeft: '3px', opacity: 0.85, fontWeight: 'normal' }}>
                        {item.birimAdi || 'Adet'}
                    </span>
                </span>
            </div>

            {/* 2. SEVİYE BİLGİ: Depo ve Gelecek Sipariş Detayı (Daha küçük, hafif şeffaf) */}
            <div 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    fontSize: '11px', 
                    color: 'var(--text-secondary)' 
                }}
            >
                {/* Depo Miktarı */}
                <span 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    title={`Mevcut Depo Stoğu: ${mevcutDepo.toLocaleString('tr-TR')}`}
                >
                    <Package size={11} style={{ opacity: 0.7 }} />
                    {formatCompactNumber(mevcutDepo)}
                </span>

                {/* Eğer bekleyen sipariş/satılabilir farkı varsa göster */}
                {genelSatilabilir !== kesinSatilabilir && (
                    <>
                        <span style={{ opacity: 0.4 }}>•</span>
                        <span 
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            title={`Satılabilir Stok (Bekleyen siparişler dahil): ${genelSatilabilir.toLocaleString('tr-TR')}`}
                        >
                            <Truck size={11} style={{ opacity: 0.7 }} />
                            {formatCompactNumber(genelSatilabilir)}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};
