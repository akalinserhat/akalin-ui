/**
 * Webakus ERP - Yapay Zeka Eylem ve ERP Kartı (AiActionCard) Bileşeni.
 * AI tarafından üretilen taslak belgeleri (Fiyat Listesi, Sipariş, Fatura vb.) ve ERP sorgu sonuçlarını
 * zengin interaktif kartlar halinde görüntüler. Kullanıcının tek tıklamayla sol taraftaki Webakus
 * formuna veya ilgili belge sayfasına aktarım yapmasını sağlar.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, CheckCircle2, ShoppingCart, Tag, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

export interface AiActionCardProps {
    rawJson: string;
    onApply?: (data: any) => void;
}

const getDefaultRoute = (type?: string): string => {
    if (!type) return '/';
    const t = type.toLowerCase();
    if (t.includes('kampanya')) return '/kampanyalar/yeni';
    if (t.includes('fiyat')) return '/fiyat-listeleri/yeni';
    if (t.includes('siparis') && (t.includes('verilen') || t.includes('alis'))) return '/siparisler/verilen/yeni';
    if (t.includes('siparis')) return '/siparisler/alinan/yeni';
    if (t.includes('fatura') && (t.includes('alis') || t.includes('gelen'))) return '/faturalar/alis/yeni';
    if (t.includes('fatura')) return '/faturalar/satis/yeni';
    if (t.includes('irsaliye')) return '/irsaliyeler/yeni';
    if (t.includes('cari')) return '/cariler/yeni';
    if (t.includes('urun') || t.includes('hizmet')) return '/urun-ve-hizmetler/yeni';
    return '/';
};

const AiActionCard: React.FC<AiActionCardProps> = ({ rawJson, onApply }) => {
    const navigate = useNavigate();

    let data: any = null;
    try {
        data = JSON.parse(rawJson);
    } catch {
        return null;
    }

    if (!data || typeof data !== 'object') return null;

    const eylemTipi = data.eylemTipi || data.actionType || 'BELGE_DOLDUR';
    const belgeTuru = data.belgeTuru || data.documentType || 'Belge';
    const targetUrl = data.yonlendirmeUrl || data.targetUrl || getDefaultRoute(belgeTuru);
    const kalemSayisi = data.kalemler?.length || data.items?.length || 0;
    const kampanyaSayisi = data.kampanyalar?.length || data.content?.details?.length || 0;
    const isNavigation = eylemTipi === 'SAYFAYA_GIT' || eylemTipi === 'NAVIGASYON';

    const handleApply = () => {
        if (isNavigation && targetUrl) {
            navigate(targetUrl);
            toast.success(`${belgeTuru || 'İlgili'} sayfasına geçiş yapıldı.`);
        } else if (onApply) {
            onApply(data);
        } else if (targetUrl) {
            navigate(targetUrl, { state: { initialAiData: data } });
            toast.success(`${belgeTuru} verileri ilgili forma aktarıldı.`);
        } else {
            toast.success('Eylem uygulandı.');
        }
    };

    const cardTitle = (typeof data.header?.aciklama === 'string' ? data.header.aciklama : null) || 
                      (typeof data.header?.adi === 'string' ? data.header.adi : null) || 
                      (typeof data.adi === 'string' ? data.adi : null) || 
                      (typeof data.content?.summary === 'string' ? data.content.summary.substring(0, 50) : null) || 
                      (isNavigation ? `${belgeTuru} Sayfası` : `${belgeTuru} Taslağı`);

    return (
        <div className="ai-action-card">
            <div className="ai-action-card-header">
                <div className="ai-action-card-icon-box">
                    {isNavigation ? (
                        <ExternalLink size={18} />
                    ) : belgeTuru === 'Siparis' ? (
                        <ShoppingCart size={18} />
                    ) : belgeTuru === 'FiyatListesi' ? (
                        <Tag size={18} />
                    ) : (
                        <FileText size={18} />
                    )}
                </div>
                <div className="ai-action-card-title-group">
                    <span className="ai-action-card-badge">{isNavigation ? 'NAVİGASYON' : eylemTipi}</span>
                    <h4 className="ai-action-card-title">
                        {cardTitle}
                    </h4>
                </div>
            </div>

            <div className="ai-action-card-body">
                {isNavigation && targetUrl && (
                    <div className="ai-action-card-meta">
                        <span className="ai-action-card-meta-label">Hedef Sayfa:</span>
                        <span className="ai-action-card-meta-value">{targetUrl}</span>
                    </div>
                )}

                {kalemSayisi > 0 && (
                    <div className="ai-action-card-meta">
                        <span className="ai-action-card-meta-label">Kalem Sayısı:</span>
                        <span className="ai-action-card-meta-value">{kalemSayisi} Satır</span>
                    </div>
                )}

                {kampanyaSayisi > 0 && (
                    <div className="ai-action-card-meta">
                        <span className="ai-action-card-meta-label">Kampanya Kalemi:</span>
                        <span className="ai-action-card-meta-value">{kampanyaSayisi} Adet</span>
                    </div>
                )}

                {typeof data.header?.cariUnvan === 'string' && (
                    <div className="ai-action-card-meta">
                        <span className="ai-action-card-meta-label">Cari:</span>
                        <span className="ai-action-card-meta-value">{data.header.cariUnvan}</span>
                    </div>
                )}

                {typeof data.content?.summary === 'string' && (
                    <p className="text-12 opacity-80 m-0 mb-8 line-clamp-3">
                        {data.content.summary}
                    </p>
                )}

                {Array.isArray(data.kalemler) && data.kalemler.length > 0 && (
                    <div className="ai-action-card-preview-list">
                        {data.kalemler.slice(0, 3).map((k: any, i: number) => (
                            <div key={i} className="ai-action-card-preview-item">
                                <span className="ai-action-card-item-name">
                                    {typeof k.urunVeHizmetAdi === 'string' ? k.urunVeHizmetAdi : (typeof k.ad === 'string' ? k.ad : `Kalem ${i + 1}`)}
                                </span>
                                <span className="ai-action-card-item-price">
                                    {typeof k.fiyat === 'number' ? `${k.fiyat.toLocaleString('tr-TR')} ₺` : (k.miktar ? `${k.miktar} Adet` : '')}
                                </span>
                            </div>
                        ))}
                        {data.kalemler.length > 3 && (
                            <div className="ai-action-card-preview-more">
                                +{data.kalemler.length - 3} kalem daha...
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="ai-action-card-footer">
                <button
                    type="button"
                    className="ai-action-card-btn"
                    onClick={handleApply}
                >
                    {isNavigation ? <ExternalLink size={16} /> : <CheckCircle2 size={16} />}
                    <span>{isNavigation ? `${belgeTuru || 'Sayfaya'} Git` : 'Forma Aktar ve Görüntüle'}</span>
                    <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default AiActionCard;
