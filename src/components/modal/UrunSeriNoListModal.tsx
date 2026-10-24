/**
 * Webakus UI Core - Ürün Seri No Listesi Görüntüleme Modalı (UrunSeriNoListModal)
 * 
 * Başlıca Görevleri:
 * - Bir ürüne ait önceden girilmiş/tanımlanmış seri numaralarını liste halinde görüntülemek
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BasePopup } from '@akalin/ui';
import { CancelButton } from '@akalin/ui';

export interface UrunSeriNoListModalProps {
    isOpen: boolean;
    onClose: () => void;
    urun: any;
    mevcutSeriNolar?: string[];
}

const UrunSeriNoListModal: React.FC<UrunSeriNoListModalProps> = ({
    isOpen,
    onClose,
    urun,
    mevcutSeriNolar = [],
}) => {
    const { t } = useTranslation();
    if (!isOpen || !urun) return null;

    return (
        <BasePopup
            isOpen={isOpen}
            onClose={onClose}
            title={t('Ürün Seri No Listesi')}
            size="md"
            customFooter={
                <div className="flex-row justify-end w-full">
                    <CancelButton onClick={onClose} text={t('Kapat')} />
                </div>
            }
        >
            <div className="flex-col gap-16 p-8">
                <div>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('auto_urun_ismi_e3fd') || t('Ürün İsmi')}</span>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{urun.ad}</div>
                </div>

                <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                    {mevcutSeriNolar.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <AlertCircle size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                            <div>{t('auto_bu_urune_ait_seri_nu_48fd') || t('Bu ürüne ait seri numarası bulunamadı.')}</div>
                        </div>
                    ) : (
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {mevcutSeriNolar.map((sn, index) => (
                                <li 
                                    key={index} 
                                    style={{ 
                                        padding: '12px 16px', 
                                        borderBottom: index < mevcutSeriNolar.length - 1 ? '1px solid var(--glass-border)' : 'none', 
                                        display: 'flex', 
                                        alignItems: 'center' 
                                    }}
                                >
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '24px' }}>{index + 1}.</span>
                                    <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>{sn}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </BasePopup>
    );
};

export default UrunSeriNoListModal;
