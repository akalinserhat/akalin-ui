/**
 * @file DocumentResultPanel.tsx
 * @description Belge footer'larında kullanılan dikey-öncelikli akıllı sonuç paneli (ara toplam, iskonto, KDV, dip toplam özeti).
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Pencil, Plus, Trash2, Calculator, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DocumentResultPanelEditDialog from './DocumentResultPanelEditDialog';
import { TutarView } from '@akalin/ui';

export interface ResultItem {
    id: string;
    label: string | React.ReactNode;
    value: string | React.ReactNode;
    isPrimary?: boolean;
    isAccent?: boolean;
    isEditable?: boolean;
    inputType?: 'text' | 'number' | 'currency';
    paraBirimi?: any; // ParaBirimi objesi veya sembolü
    editLabelNode?: React.ReactNode;
    editValueNode?: React.ReactNode;
    visibilityRule?: 'p1' | 'p2' | 'p3' | 'p4' | 'p3-fallback-p1';
    numericValue?: number;
    hideWhenZero?: boolean;
}

export interface DocumentResultPanelProps {
    title: string;
    items: ResultItem[];
    onSave?: (title: string, items: ResultItem[]) => void;
    onCancel?: () => void;
    onEditStart?: () => void;
    readOnly?: boolean;
    hideAddButton?: boolean;
    variant?: 'primary' | 'secondary' | 'neutral' | 'subtle';
    icon?: React.ReactNode;
    minWidth?: number | string;
    maxWidth?: number | string;
    className?: string;
}

// ============================================================
// AKILLI LAYOUT MOTORU: Yükseklik tahmin sabitleri
// ============================================================
// Her "stage" (aşama), bir görsel sıkıştırma seviyesini temsil eder.
// Motor sırasıyla her aşamayı dener, ilk sığan aşamayı uygular.

interface LayoutStage {
    gap: number;            // item'lar arası boşluk (px)
    itemFont: number;       // normal item font boyutu (px)
    p4Font: number;         // p4 (Genel Toplam) değer font boyutu (px)
    p4LabelFont: number;    // p4 label font boyutu (px)
    showSeparator: boolean; // p4 üstünde çizgi + boşluk göster
    separatorH: number;     // separator için ekstra yükseklik (px)
    showLegend: boolean;    // başlık (fieldset legend) göster
    legendH: number;        // legend yüksekliği (px)
    padV: number;           // toplam dikey padding (px)
    hideP1: boolean;        // p1 satırları gizle
    showFallback: boolean;  // p3-fallback-p1 göster
    hideP2: boolean;        // p2 satırları gizle
    hideP3: boolean;        // p3 satırları gizle
}

// Aşamalar: en az sıkıştırmadan en çoğuna doğru sıralı
const LAYOUT_STAGES: LayoutStage[] = [
    // Aşama 0: Normal – tam görünüm
    { gap: 6, itemFont: 13, p4Font: 18, p4LabelFont: 14, showSeparator: true,  separatorH: 16, showLegend: true,  legendH: 30, padV: 20, hideP1: false, showFallback: false, hideP2: false, hideP3: false },
    // Aşama 1: Gap küçüt
    { gap: 3, itemFont: 13, p4Font: 18, p4LabelFont: 14, showSeparator: true,  separatorH: 16, showLegend: true,  legendH: 30, padV: 20, hideP1: false, showFallback: false, hideP2: false, hideP3: false },
    // Aşama 2: İtem fontunu küçüt
    { gap: 3, itemFont: 12, p4Font: 16, p4LabelFont: 13, showSeparator: true,  separatorH: 14, showLegend: true,  legendH: 28, padV: 16, hideP1: false, showFallback: false, hideP2: false, hideP3: false },
    // Aşama 3: Separator kaldır, p4 fontunu normalleştir
    { gap: 3, itemFont: 12, p4Font: 14, p4LabelFont: 13, showSeparator: false, separatorH: 0,  showLegend: true,  legendH: 28, padV: 14, hideP1: false, showFallback: false, hideP2: false, hideP3: false },
    // Aşama 4: Legend gizle
    { gap: 3, itemFont: 12, p4Font: 14, p4LabelFont: 13, showSeparator: false, separatorH: 0,  showLegend: false, legendH: 0,  padV: 10, hideP1: false, showFallback: false, hideP2: false, hideP3: false },
    // Aşama 5: p1 gizle, fallback göster
    { gap: 2, itemFont: 12, p4Font: 14, p4LabelFont: 13, showSeparator: false, separatorH: 0,  showLegend: false, legendH: 0,  padV: 10, hideP1: true,  showFallback: true,  hideP2: false, hideP3: false },
    // Aşama 6: p2 gizle
    { gap: 2, itemFont: 12, p4Font: 14, p4LabelFont: 13, showSeparator: false, separatorH: 0,  showLegend: false, legendH: 0,  padV: 10, hideP1: true,  showFallback: true,  hideP2: true,  hideP3: false },
    // Aşama 7: p3 gizle → yalnızca p4 kalır
    { gap: 0, itemFont: 12, p4Font: 13, p4LabelFont: 12, showSeparator: false, separatorH: 0,  showLegend: false, legendH: 0,  padV: 8,  hideP1: true,  showFallback: false, hideP2: true,  hideP3: true  },
];

function getIsVisible(item: ResultItem, stage: LayoutStage, maxPriorityLevel: number): boolean {
    const r = item.visibilityRule;
    let priority = 0;
    if (r === 'p4') priority = 4;
    else if (r === 'p3') priority = 3;
    else if (r === 'p2') priority = 2;
    else if (r === 'p1' || r === 'p3-fallback-p1') priority = 1;

    const isMax = (priority === maxPriorityLevel);

    if (r === 'p1') {
        if (stage.showFallback) return false;
        if (stage.hideP1 && !isMax) return false;
        return true;
    }
    if (r === 'p3-fallback-p1') {
        if (stage.showFallback) return true;
        return false;
    }
    if (r === 'p2') {
        if (stage.hideP2 && !isMax) return false;
        return true;
    }
    if (r === 'p3') {
        if (stage.hideP3 && !isMax) return false;
        return true;
    }
    if (r === 'p4') {
        return true;
    }
    return true;
}

/** Verilen aşama + item listesine göre gereken toplam yüksekliği hesaplar */
function calcNeededHeight(stage: LayoutStage, filteredItems: ResultItem[], maxPriorityLevel: number): number {
    const shown = filteredItems.filter(item => getIsVisible(item, stage, maxPriorityLevel));

    const count = shown.length;
    if (count === 0) return stage.padV + stage.legendH;

    const hasP4 = shown.some(i => i.visibilityRule === 'p4');
    const hasScrollable = shown.some(i => i.visibilityRule !== 'p4');
    const sepExtra = (hasP4 && hasScrollable && stage.showSeparator) ? stage.separatorH : 0;

    return (
        stage.legendH +
        stage.padV +
        count * (stage.itemFont + 4) + // font + satır içi dikey boşluk
        Math.max(0, count - 1) * stage.gap +
        sepExtra
    );
}

const DocumentResultPanel: React.FC<DocumentResultPanelProps> = ({
    title,
    items,
    onSave,
    onCancel,
    onEditStart,
    readOnly = false,
    hideAddButton = false,
    variant = 'primary',
    icon,
    minWidth,
    maxWidth,
    className = ''
}) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);

    // Gerçek container yüksekliği – ResizeObserver ile ölçülür
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState(300);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            setContainerHeight(entry.contentRect.height);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Düzenleme handler'ları
    const handleEditClick = () => { setIsEditing(true); if (onEditStart) onEditStart(); };
    const handleCancel = () => { setIsEditing(false); if (onCancel) onCancel(); };
    const handleSave = (updatedTitle: string, updatedItems: ResultItem[]) => {
        if (onSave) onSave(updatedTitle, updatedItems);
        setIsEditing(false);
    };

    // ============================================================
    // 1. ADIM: hideWhenZero filtresi (JS tarafında, kesin)
    // ============================================================
    const filteredItems = useMemo(() =>
        items.filter(item => !(item.hideWhenZero && item.numericValue === 0)),
        [items]
    );

    // ============================================================
    // 2. ADIM: En yüksek öncelik seviyesini bul (Hiçbir zaman tümüyle gizlenmemesi için)
    // ============================================================
    const maxPriorityLevel = useMemo(() => {
        let max = 0;
        for (const i of filteredItems) {
            if (i.visibilityRule === 'p4') max = Math.max(max, 4);
            else if (i.visibilityRule === 'p3') max = Math.max(max, 3);
            else if (i.visibilityRule === 'p2') max = Math.max(max, 2);
            else if (i.visibilityRule === 'p1' || i.visibilityRule === 'p3-fallback-p1') max = Math.max(max, 1);
        }
        return max;
    }, [filteredItems]);

    // ============================================================
    // 3. ADIM: Akıllı layout hesabı
    //    Hangi aşama mevcut yüksekliğe sığıyor? İlkini seç.
    // ============================================================
    const activeStage = useMemo(() => {
        for (const stage of LAYOUT_STAGES) {
            const needed = calcNeededHeight(stage, filteredItems, maxPriorityLevel);
            if (needed <= containerHeight) return stage;
        }
        return LAYOUT_STAGES[LAYOUT_STAGES.length - 1]; // en sıkıştırılmış aşama
    }, [containerHeight, filteredItems, maxPriorityLevel]);

    // ============================================================
    // 4. ADIM: Aktif aşamaya göre görünür item'ları belirle
    // ============================================================
    const displayedItems = useMemo(() => 
        filteredItems.filter(item => getIsVisible(item, activeStage, maxPriorityLevel)),
    [filteredItems, activeStage, maxPriorityLevel]);

    const p4Items = displayedItems.filter(i => i.visibilityRule === 'p4');
    const scrollableItems = displayedItems.filter(i => i.visibilityRule !== 'p4');
    const hasBothSections = p4Items.length > 0 && scrollableItems.length > 0;

    // ============================================================
    // 5. ADIM: Font Ölçekleme
    // ============================================================
    const computedSizes = useMemo(() => {
        const needed = calcNeededHeight(activeStage, displayedItems, maxPriorityLevel);
        const slack = Math.max(0, containerHeight - needed);
        const count = displayedItems.length;

        // Yeterli slack yoksa ya da item yoksa baseline değerleri döndür
        if (slack < 4 || count === 0) {
            return {
                itemFont: activeStage.itemFont,
                p4Font: activeStage.p4Font,
                p4LabelFont: activeStage.p4LabelFont,
            };
        }

        const onlyP4 = scrollableItems.length === 0 && p4Items.length > 0;

        if (onlyP4) {
            const maxIncrease = slack * 0.3 / count;
            const p4Increase = Math.min(maxIncrease, 8);
            return {
                itemFont: activeStage.itemFont,
                p4Font: Math.round(activeStage.p4Font + p4Increase),
                p4LabelFont: Math.round(activeStage.p4LabelFont + p4Increase * 0.4),
            };
        } else {
            const slackPerItem = slack / count;
            const itemIncrease = Math.min(slackPerItem * 0.2, 2);
            const p4Increase = Math.min(slackPerItem * 0.4, 6);
            return {
                itemFont: Math.round(activeStage.itemFont + itemIncrease),
                p4Font: Math.round(activeStage.p4Font + p4Increase),
                p4LabelFont: Math.round(activeStage.p4LabelFont + p4Increase * 0.4),
            };
        }
    }, [containerHeight, activeStage, displayedItems, p4Items, scrollableItems]);

    // ============================================================
    // Render helper
    // ============================================================
    const renderItem = (item: ResultItem) => {
        const isPrimary = !!item.isPrimary;
        const isP4 = isPrimary && item.visibilityRule === 'p4';

        if (isP4) {
            return (
                <div
                    key={item.id}
                    className="document-result-panel-hero"
                    style={{
                        padding: `${Math.max(4, Math.min(8, Math.round(activeStage.padV / 4)))}px 10px`,
                        marginTop: (hasBothSections && activeStage.showSeparator) ? '4px' : '0',
                    }}
                >
                    <span 
                        className="document-result-panel-hero-label"
                        style={{ fontSize: `${computedSizes.p4LabelFont}px` }}
                    >
                        {isEditing && item.isEditable ? item.editLabelNode : item.label}
                    </span>
                    <span 
                        className="document-result-panel-hero-value"
                        style={{ fontSize: `${computedSizes.p4Font}px` }}
                    >
                        {isEditing && item.isEditable 
                            ? item.editValueNode 
                            : (item.inputType === 'currency' && item.numericValue !== undefined
                                ? <TutarView value={item.numericValue} paraBirimi={item.paraBirimi} />
                                : item.value
                            )
                        }
                    </span>
                </div>
            );
        }

        return (
            <div
                key={item.id}
                className={`document-result-panel-item ${item.isAccent ? 'is-accent' : ''}`}
            >
                <span 
                    className="document-result-panel-item-label"
                    style={{ fontSize: `${computedSizes.itemFont}px` }}
                >
                    {isEditing && item.isEditable ? item.editLabelNode : item.label}
                </span>
                <span 
                    className="document-result-panel-item-value"
                    style={{ fontSize: `${computedSizes.itemFont}px` }}
                >
                    {isEditing && item.isEditable 
                        ? item.editValueNode 
                        : (item.inputType === 'currency' && item.numericValue !== undefined
                            ? <TutarView value={item.numericValue} paraBirimi={item.paraBirimi} />
                            : item.value
                        )
                    }
                </span>
            </div>
        );
    };

    return (
        <div
            ref={containerRef}
            className={`document-result-panel-wrapper ${className}`.trim()}
            style={{
                ...(minWidth !== undefined ? { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth } : {}),
                ...(maxWidth !== undefined ? { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth } : {})
            }}
        >
            <div 
                className={`document-result-panel variant-${variant} ${!readOnly ? 'is-editable' : ''} ${isHovered ? 'is-hovered' : ''}`}
                onClick={!readOnly ? handleEditClick : undefined}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    padding: `${Math.max(6, Math.round(activeStage.padV / 2))}px 16px`,
                }}
            >
                {/* Başlık (Legend) – yeterli alan olduğunda gösterilir */}
                {activeStage.showLegend && (
                    <div 
                        className="document-result-panel-header"
                        style={{ height: `${activeStage.legendH}px` }}
                    >
                        <div className="document-result-panel-title-group">
                            <div className="document-result-panel-icon">
                                {icon ? icon : (variant === 'secondary' ? <Package size={13} strokeWidth={2.3} /> : <Calculator size={13} strokeWidth={2.3} />)}
                            </div>
                            <span className="document-result-panel-title">
                                {title || t('auto_sonuclar', 'Sonuçlar')}
                            </span>
                        </div>
                        {!readOnly && (
                            <button
                                type="button"
                                className="document-result-panel-edit-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick();
                                }}
                                title={t('auto_duzenle', 'Düzenle')}
                            >
                                <Pencil size={11} strokeWidth={2.2} />
                                <span className="edit-btn-text">{t('auto_duzenle', 'Düzenle')}</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Kaydırılabilir satırlar (p1, p2, p3, p3-fallback-p1) */}
                {scrollableItems.length > 0 && (
                    <div 
                        className="document-result-panel-items"
                        style={{ gap: `${activeStage.gap}px` }}
                    >
                        {scrollableItems.map(renderItem)}
                    </div>
                )}

                {/* Sabit alt kısım: p4 (Genel Toplam) her zaman burada */}
                {p4Items.length > 0 && (
                    <div 
                        className="document-result-panel-hero-container"
                        style={{ gap: `${activeStage.gap}px` }}
                    >
                        {p4Items.map(renderItem)}
                    </div>
                )}

                {displayedItems.length === 0 && (
                    <div className="document-result-panel-empty">
                        {t('auto_sonuc_bilgisi_yok', 'Sonuç bilgisi bulunmuyor.')}
                    </div>
                )}
            </div>

            {/* Düzenleme Modalı */}
            <DocumentResultPanelEditDialog
                isOpen={isEditing}
                onClose={handleCancel}
                title={title}
                items={items}
                onSave={handleSave}
                hideAddButton={hideAddButton}
            />
        </div>
    );
};

export default DocumentResultPanel;
