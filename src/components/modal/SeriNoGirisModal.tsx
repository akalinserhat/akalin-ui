/**
 * Webakus UI Core - Seri Numarası Giriş ve Üretim Modalı (SeriNoGirisModal)
 * 
 * Başlıca Görevleri:
 * - Belge satırındaki veya formdaki bir ürün için beklenen adet kadar seri numarası okutulmasını sağlamak
 * - Kamera/Barkod okuyucu veya elle girişi desteklemek
 * - Seri numarası uzunluk, ön ek ve belge genelinde mükerrerlik kontrollerini gerçekleştirmek
 * - Giriş işlemlerinde sistemden otomatik seri no üretme (/api/UrunVeHizmetSeriNolari/toplu-uret) imkanı sunmak
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { BasePopup } from '@akalin/ui';
import { BarcodeScannerInput, SaveButton, CancelButton } from '@akalin/ui';

export interface SeriNoGirisModalProps {
    isOpen: boolean;
    onClose: () => void;
    urun: any;
    beklenenAdet: number;
    mevcutSeriNolar?: string[];
    tumSeriNolar?: string[];
    onSave: (seriNolar: string[]) => void;
    isGiris?: boolean; // true ise sistemden yeni üretebilir, false ise sadece okutabilir (çıkış)
}

const SeriNoGirisModal: React.FC<SeriNoGirisModalProps> = ({
    isOpen,
    onClose,
    urun,
    beklenenAdet,
    mevcutSeriNolar = [],
    tumSeriNolar = [],
    onSave,
    isGiris = false
}) => {
    const { t } = useTranslation();
    const [seriNolar, setSeriNolar] = useState<string[]>([]);
    const [manuelSeriNo, setManuelSeriNo] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSeriNolar(mevcutSeriNolar || []);
            setManuelSeriNo('');
        }
    }, [isOpen, mevcutSeriNolar]);

    if (!isOpen || !urun) return null;

    const eksikAdet = beklenenAdet - seriNolar.length;

    const handleAdd = (sn: string) => {
        const cleaned = sn.trim().toUpperCase();
        if (!cleaned) return;

        if (seriNolar.includes(cleaned)) {
            toast.error(t('Bu seri numarası listeye zaten eklenmiş.'));
            return;
        }

        // Başka bir satırda okutulmuş mu kontrol et (mevcutSeriNolar hariç diğer satırlardakiler)
        const digerSatirlardakiSeriler = tumSeriNolar.filter(s => !mevcutSeriNolar.includes(s));
        if (digerSatirlardakiSeriler.includes(cleaned)) {
            toast.error(`${t('Bu seri numarası belgedeki başka bir üründe okutulmuş')}: ${cleaned}`);
            return;
        }

        // Seri No Uzunluk Doğrulaması
        if (urun.seriNoUzunlugu && cleaned.length !== urun.seriNoUzunlugu) {
            toast.error(`${urun.ad} ${t('için seri numarası')} ${urun.seriNoUzunlugu} ${t('karakter uzunluğunda olmalıdır.')}`);
            return;
        }

        // Seri No Ön Ek Doğrulaması
        if (urun.seriNoOneki) {
            const onek = urun.seriNoOneki.trim().toUpperCase();
            if (!cleaned.startsWith(onek)) {
                toast.error(`${urun.ad} ${t('için seri numarası')} "${urun.seriNoOneki}" ${t('ön eki ile başlamalıdır.')}`);
                return;
            }
        }

        if (seriNolar.length >= beklenenAdet) {
            toast.error(`${t('En fazla')} ${beklenenAdet} ${t('adet seri numarası ekleyebilirsiniz.')}`);
            return;
        }

        setSeriNolar([...seriNolar, cleaned]);
        setManuelSeriNo('');
    };

    const handleRemove = (index: number) => {
        const newSeriNolar = [...seriNolar];
        newSeriNolar.splice(index, 1);
        setSeriNolar(newSeriNolar);
    };

    const handleSistemdenUret = async () => {
        if (eksikAdet <= 0) {
            toast.error(t('Gereken tüm seri numaraları girilmiş.'));
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post('/api/UrunVeHizmetSeriNolari/toplu-uret', {
                urunVeHizmetKartiId: urun.id,
                adet: eksikAdet
            });

            const uretilenler = res.data.map((d: any) => d.seriNo);
            setSeriNolar([...seriNolar, ...uretilenler]);
            toast.success(`${uretilenler.length} ${t('adet seri numarası sistem tarafından üretildi.')}`);
        } catch (err: any) {
            toast.error(err.response?.data?.mesaj || t('Seri numaraları üretilemedi.'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        if (seriNolar.length !== beklenenAdet) {
            toast.error(`${t('Lütfen eksik')} ${eksikAdet} ${t('adet seri numarasını girin veya fazla olanları silin.')}`);
            return;
        }
        onSave(seriNolar);
        onClose();
    };

    return (
        <BasePopup
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('Seri Numaraları')}: ${urun.ad || ''}`}
            size="md"
            customFooter={
                <div className="flex-row justify-end gap-12 w-full">
                    <CancelButton onClick={onClose} />
                    <SaveButton
                        onClick={handleSave}
                        disabled={seriNolar.length !== beklenenAdet}
                    />
                </div>
            }
        >
            <div className="flex-col gap-16 p-8">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '8px' }}>
                    <div>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('Miktar')}</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{beklenenAdet}</div>
                    </div>
                    <div>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('Girilen')}</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: seriNolar.length === beklenenAdet ? 'var(--success)' : 'var(--warning)' }}>
                            {seriNolar.length}
                        </div>
                    </div>
                    <div>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('Kalan')}</span>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: eksikAdet === 0 ? 'var(--success)' : 'var(--danger)' }}>
                            {eksikAdet}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <BarcodeScannerInput
                        value={manuelSeriNo}
                        onChange={(e: any) => setManuelSeriNo(e.target.value)}
                        onScan={handleAdd}
                        placeholder={t('Barkod okutun veya elle girin...')}
                        inputClassName="form-input"
                        onKeyDown={(e: any) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAdd(manuelSeriNo);
                            }
                        }}
                    />
                    <button 
                        type="button"
                        className="btn btn-primary" 
                        onClick={() => handleAdd(manuelSeriNo)} 
                        disabled={!manuelSeriNo.trim() || seriNolar.length >= beklenenAdet}
                    >
                        <Plus size={16} /> {t('Ekle')}
                    </button>
                </div>

                {isGiris && (
                    <div style={{ padding: '12px', border: '1px dashed var(--glass-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="flex-row items-center gap-8">
                            <Settings size={18} color="var(--accent-primary)" />
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {t('auto_urunun_uzerinde_seri_b958') || 'Ürünün üzerinde seri numarası yok mu?'}
                            </span>
                        </div>
                        <button 
                            type="button"
                            className="btn btn-outline" 
                            onClick={handleSistemdenUret} 
                            disabled={eksikAdet <= 0 || loading} 
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                        >
                            {loading ? <RefreshCw size={16} className="spin" /> : <Settings size={16} />} 
                            {t('Sistemden Üret')}
                        </button>
                    </div>
                )}

                <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                    {seriNolar.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <AlertCircle size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                            <div>{t('auto_henuz_seri_numarasi__ac45') || 'Henüz seri numarası eklenmemiş.'}</div>
                        </div>
                    ) : (
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {seriNolar.map((sn, index) => (
                                <li 
                                    key={index} 
                                    style={{ 
                                        padding: '12px 16px', 
                                        borderBottom: index < seriNolar.length - 1 ? '1px solid var(--glass-border)' : 'none', 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center' 
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '20px' }}>{index + 1}.</span>
                                        <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>{sn}</span>
                                    </div>
                                    <button 
                                        type="button"
                                        className="btn-icon" 
                                        style={{ color: 'var(--danger)' }} 
                                        onClick={() => handleRemove(index)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </BasePopup>
    );
};

export default SeriNoGirisModal;
