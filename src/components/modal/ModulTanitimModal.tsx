/**
 * Webakus UI Core - Modül Eksiklik Arabirimi Modalı (ModulTanitimModal.tsx)
 * 
 * Kullanıcının lisansında veya yetkilerinde bulunmayan ya da pasif durumdaki bir modülün
 * özelliğine tıklandığında devreye giren; Admin panelinden tanımlanan serbest HTML eksiklik
 * arabirimini veya tanıtım içeriğini temiz bir başlık ve sağ üstteki 'X' kapatma butonu ile sunan modal.
 */

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { 
    Sparkles, 
    CheckCircle2, 
    MapPin, 
    Cloud, 
    Truck, 
    QrCode, 
    Barcode, 
    Package, 
    Zap
} from 'lucide-react';
import { Modal } from '@akalin/ui';

export interface ModulTanitimModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Modül Kodu (Örn: 'MOD_ADRES', 'MOD_BULUT_DEPOLAMA') */
    modulKodu?: string;
    /** Tanıtım / Modal Başlığı */
    title?: string;
    /** Alt Başlık / Kısa Slogan */
    subtitle?: string;
    /** Detaylı Reklam / Kampanya Açıklaması */
    description?: string;
    /** Kampanya Rozeti (Örn: '%30 İndirim Fırsatı') */
    badge?: string;
    /** Satın Alma Buton Metni (Opsiyonel) */
    buttonText?: string;
    /** Satın Alma / Kampanya Sayfası Yönlendirme URL'si */
    purchaseUrl?: string;
    /** Özel İkon Adı veya ReactNode */
    icon?: React.ReactNode | string;
    /** Tanıtım Görseli URL'si */
    imageUrl?: string;
    /** Modülün Kazandırdığı Avantajlar Listesi */
    benefits?: string[];
    /** HTML Editör ile oluşturulmuş serbest HTML içerik */
    htmlContent?: string;
    /** Özel Eylem Fonksiyonu */
    onPurchaseClick?: (purchaseUrl?: string) => void;
}

const getLucideIcon = (iconName?: string | React.ReactNode, size: number = 28) => {
    if (!iconName) return <Sparkles size={size} className="text-accent" />;
    if (React.isValidElement(iconName)) return iconName;
    if (typeof iconName !== 'string') return <Sparkles size={size} className="text-accent" />;

    switch (iconName.toLowerCase()) {
        case 'mappin':
        case 'map-pin':
        case 'adres':
            return <MapPin size={size} color="var(--accent-primary, #6366f1)" />;
        case 'cloud':
        case 'bulut':
            return <Cloud size={size} color="var(--accent-primary, #6366f1)" />;
        case 'truck':
        case 'kargo':
            return <Truck size={size} color="var(--accent-primary, #6366f1)" />;
        case 'qrcode':
        case 'qr-code':
            return <QrCode size={size} color="var(--accent-primary, #6366f1)" />;
        case 'barcode':
        case 'barkod':
            return <Barcode size={size} color="var(--accent-primary, #6366f1)" />;
        case 'zap':
            return <Zap size={size} color="var(--warning, #f59e0b)" />;
        case 'package':
            return <Package size={size} color="var(--accent-primary, #6366f1)" />;
        default:
            return <Sparkles size={size} color="var(--accent-primary, #6366f1)" />;
    }
};

export const ModulTanitimModal: React.FC<ModulTanitimModalProps> = ({
    isOpen,
    onClose,
    modulKodu,
    title: initialTitle,
    subtitle: initialSubtitle,
    description: initialDescription,
    badge: initialBadge,
    icon: initialIcon,
    imageUrl: initialImageUrl,
    benefits: initialBenefits,
    htmlContent
}) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [apiData, setApiData] = useState<any>(null);

    useEffect(() => {
        if (isOpen && modulKodu) {
            setLoading(true);
            axios.get(`/api/moduller/tanitim/${modulKodu}`)
                .then((res) => {
                    if (res.data) {
                        setApiData(res.data);
                    }
                })
                .catch(() => {
                    // Sessizce geç; fallback prop verileri kullanılacak
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [isOpen, modulKodu]);

    if (!isOpen) return null;

    const title = initialTitle || apiData?.baslik || t('Eksiklik Arabirimi');
    const subtitle = initialSubtitle || apiData?.ozet || t('İşletmenizin verimliliğini artıracak yeni nesil özellikler.');
    const description = initialDescription || apiData?.detayliAciklama || t('Bu modül lisans paketinizde aktif değildir.');
    const badge = initialBadge || apiData?.rozet;
    const icon = initialIcon || apiData?.ikon || 'Sparkles';
    const imageUrl = initialImageUrl || apiData?.gorselUrl;
    const benefits: string[] = initialBenefits || apiData?.avantajlar || [
        t('Zaman tasarrufu ve hatasız kurumsal veri akışı'),
        t('Sistemdeki tüm modüllerle tam ve anlık entegrasyon'),
        t('Öncelikli teknik destek ve otomatik güncelleme garantisi')
    ];

    const customHtml = htmlContent || apiData?.tanitimHtml;

    const sanitizedHtml = useMemo(() => {
        if (!customHtml) return '';
        return customHtml
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
            .replace(/javascript:[^"']*/gi, '');
    }, [customHtml]);

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={title}
            size="md"
            hideMaximize
        >
            <div className="flex-col overflow-hidden">
                {sanitizedHtml ? (
                    <div className="p-20 overflow-y-auto max-h-600">
                        <div 
                            className="modul-tanitim-custom-html"
                            onClick={(e) => {
                                const target = (e.target as HTMLElement).closest('[data-action="close"], [data-dismiss="modal"], a[href="#close"], .btn-modal-close, .btn-kapat');
                                if (target) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onClose();
                                }
                            }}
                            dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
                        />
                    </div>
                ) : (
                    <>
                        {/* ─── Gradient Hero Banner ─────────────────────────────── */}
                        <div className="p-24 bg-gradient-hero flex-col gap-12 border-b-glass relative">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-12">
                                    <div className="w-48 h-48 rounded-16 bg-card-glow flex items-center justify-center shadow-md">
                                        {getLucideIcon(icon, 26)}
                                    </div>
                                    <div className="flex-col">
                                        {badge && (
                                            <div className="inline-flex items-center gap-6 px-10 py-3 rounded-full bg-accent-soft text-accent text-11 font-bold tracking-wide mb-4">
                                                <Sparkles size={12} />
                                                <span>{badge}</span>
                                            </div>
                                        )}
                                        <h3 className="m-0 text-18 font-bold text-primary">{title}</h3>
                                    </div>
                                </div>
                            </div>

                            {subtitle && (
                                <p className="m-0 text-13 font-semibold text-secondary leading-normal">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {/* ─── Ana Gövde / Avantajlar ─────────────────────────────── */}
                        <div className="p-24 flex-col gap-20 overflow-y-auto max-h-450">
                            {imageUrl && (
                                <div className="w-full h-160 rounded-12 overflow-hidden border-glass mb-8">
                                    <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="text-14 text-secondary leading-relaxed bg-secondary p-16 rounded-12 border-glass">
                                {description}
                            </div>

                            {benefits && benefits.length > 0 && (
                                <div className="flex-col gap-10">
                                    <h4 className="m-0 text-13 font-bold text-primary uppercase tracking-wider flex items-center gap-6">
                                        <Zap size={14} className="text-accent" />
                                        {t('Modülün Sunduğu Avantajlar')}
                                    </h4>
                                    <div className="flex-col gap-8">
                                        {benefits.map((benefit, idx) => (
                                            <div key={idx} className="flex items-start gap-10 p-8 rounded-8 bg-card-subtle">
                                                <CheckCircle2 size={16} className="text-success mt-2 flex-shrink-0" />
                                                <span className="text-13 text-primary font-medium">{benefit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default ModulTanitimModal;
