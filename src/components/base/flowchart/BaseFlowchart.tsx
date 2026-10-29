/**
 * @akalin/ui - Temel Görsel Akış Diyagramı Tuvali (BaseFlowchart.tsx)
 *
 * Başlıca Sorumlulukları:
 * - Noktalı (blueprint dot-grid) interaktif akış diyagramı tuvalini ve üst bileşen paletini sunmak
 * - Başlangıç (FlowchartStartNode), süreç adımları (FlowchartInputNode, FlowchartProcessNode,
 *   FlowchartDecisionNode, FlowchartDocumentNode) ve Bitiş (FlowchartEndNode) düğümlerini gerçek
 *   SVG akış oklarıyla (BaseFlowchartConnector) birbirine bağlayarak görselleştirmek
 * - Herhangi bir flowchart bileşenine tıklandığında seçili adımı sağ panel (Inspector) ile senkronize etmek
 * - Sıfır inline CSS ve %100 i18n uyumlu çalışmak
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GitBranch,
  Plus,
  Cpu,
  Monitor,
  FileText,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers
} from 'lucide-react';
import {
  FlowchartStartNode,
  FlowchartInputNode,
  FlowchartProcessNode,
  FlowchartDecisionNode,
  FlowchartDocumentNode,
  FlowchartEndNode,
  BaseFlowchartConnector
} from './BaseFlowchartNode';
import './BaseFlowchart.css';

export interface FlowchartStepItem {
  id: string;
  type: string;
  title: string;
  shapeBadgeText?: string;
  prompt?: string;
  toolCode?: string;
  uiAction?: string;
  uiActionLabel?: string;
  routePath?: string;
  nextStepId?: string;
  yesStepId?: string;
  noStepId?: string;
}

export interface BaseFlowchartProps {
  title?: React.ReactNode;
  showHeader?: boolean;
  fit?: boolean;
  startTitle?: React.ReactNode;
  startSubtitle?: React.ReactNode;
  startNodeId?: string;
  endTitle?: React.ReactNode;
  steps: FlowchartStepItem[];
  selectedStepId?: string | null;
  onSelectStep: (stepId: string) => void;
  onAddStep?: (stepType: string, insertAtIndex?: number) => void;
  onMoveStep?: (index: number, direction: 'up' | 'down', e?: React.MouseEvent) => void;
  onDeleteStep?: (stepId: string, e?: React.MouseEvent) => void;
  emptyMessage?: string;
  className?: string;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  showZoomControls?: boolean;
}

export const BaseFlowchart: React.FC<BaseFlowchartProps> = ({
  title,
  showHeader = false,
  fit = false,
  startTitle,
  startSubtitle,
  startNodeId = '__START__',
  endTitle,
  steps,
  selectedStepId,
  onSelectStep,
  onAddStep,
  onMoveStep,
  onDeleteStep,
  emptyMessage,
  className = '',
  initialZoom = 1,
  minZoom = 0.4,
  maxZoom = 2,
  showZoomControls = true
}) => {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [isWheelZooming, setIsWheelZooming] = useState<boolean>(false);
  const zoomRef = useRef<number>(zoom);
  const stageRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // zoom state değişiminde ref senkronizasyonu
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Buton ile Zoom: +%10
  const handleZoomIn = useCallback(() => {
    setIsWheelZooming(false);
    setZoom(prev => Math.min(maxZoom, Math.round((prev + 0.1) * 10) / 10));
  }, [maxZoom]);

  // Buton ile Zoom: -%10
  const handleZoomOut = useCallback(() => {
    setIsWheelZooming(false);
    setZoom(prev => Math.max(minZoom, Math.round((prev - 0.1) * 10) / 10));
  }, [minZoom]);

  // Buton ile Zoom: %100 Varsayılana Sıfırla
  const handleZoomReset = useCallback(() => {
    setIsWheelZooming(false);
    setZoom(1);
  }, []);

  // Yüksek Performanslı, Doğal Sönümlemeli (Damping) ve rAF Throttled Wheel Zoom
  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return;

    const onWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // Tarayıcının varsayılan sayfa büyütmesini engelle
        e.preventDefault();

        // Aktif wheel sırasında CSS transition'ı kapat (sıfır gecikme)
        setIsWheelZooming(true);
        if (wheelTimeoutRef.current) {
          clearTimeout(wheelTimeoutRef.current);
        }
        wheelTimeoutRef.current = setTimeout(() => {
          setIsWheelZooming(false);
        }, 160);

        // Trackpad (küçük deltaY) ve Mouse Wheel (büyük deltaY) için optimize edilmiş sönümleme katsayısı
        // 0.0015 katsayısı ile ani sıçramalar engellenir ve son derece akıcı, kontrollü bir zoom hissi sağlanır
        const damping = 0.0015;
        const factor = Math.exp(-e.deltaY * damping);
        const nextZoom = Math.min(maxZoom, Math.max(minZoom, zoomRef.current * factor));

        zoomRef.current = nextZoom;

        // requestAnimationFrame ile ekran yenileme hızında (60/120 FPS) tek re-render
        if (!rafIdRef.current) {
          rafIdRef.current = requestAnimationFrame(() => {
            setZoom(Math.round(zoomRef.current * 100) / 100);
            rafIdRef.current = null;
          });
        }
      }
    };

    stageEl.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      stageEl.removeEventListener('wheel', onWheelNative);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
    };
  }, [minZoom, maxZoom]);

  const resolveStepById = (id?: string) => {
    if (!id) return undefined;
    return steps.find(s => s.id === id);
  };

  return (
    <div className={`base-flowchart-container ${fit ? 'base-flowchart--fit' : ''} ${className}`}>
      {/* Üst Araç Çubuğu (Varsayılan olarak kapalıdır, showHeader=true ile etkinleştirilebilir) */}
      {showHeader && (
        <div className="base-flowchart-toolbar">
          <div className="base-flowchart-toolbar-title">
            <GitBranch size={16} />
            <span>{title || t('gorev_akis_diyagrami', 'Görev Akış Diyagramı (Flowchart)')}</span>
            <span className="base-flowchart-count-pill">{steps.length}</span>
          </div>
        </div>
      )}

      {/* Ana Gövde Alanı (Sol: Dikey Diagram Öğeleri Paleti, Sağ: Çizim Sahnesi / Stage) */}
      <div className="base-flowchart-main-body">
        {onAddStep && (
          <aside className="base-flowchart-sidebar-palette" aria-label={t('diyagram_ogeleri', 'Diyagram Öğeleri')}>
            <div className="base-flowchart-sidebar-header">
              <Layers size={13} />
              <span>{t('diyagram_ogeleri', 'Diyagram Öğeleri')}</span>
            </div>

            <div className="base-flowchart-sidebar-items">
              <button
                type="button"
                onClick={() => onAddStep('MCP_SORGULA')}
                className="base-flowchart-sidebar-item palette-process"
                title={t('mcp_islem_adimi_ekle', 'MCP Veri Sorgulama / İşlem Düğümü Ekle')}
              >
                <div className="base-flowchart-sidebar-item-icon">
                  <Cpu size={14} />
                </div>
                <div className="base-flowchart-sidebar-item-text">
                  <span className="base-flowchart-sidebar-item-title">{t('islem_dugumu', 'İşlem')}</span>
                  <span className="base-flowchart-sidebar-item-sub">{t('islem_dugumu_sub', 'MCP / Veri Sorgu')}</span>
                </div>
                <Plus size={13} className="base-flowchart-sidebar-item-add" />
              </button>

              <button
                type="button"
                onClick={() => onAddStep('KARAR_ONAY')}
                className="base-flowchart-sidebar-item palette-decision"
                title={t('karar_onay_adimi_ekle', 'Evet / Hayır Dallanmalı Karar Düğümü Ekle')}
              >
                <div className="base-flowchart-sidebar-item-icon">
                  <GitBranch size={14} />
                </div>
                <div className="base-flowchart-sidebar-item-text">
                  <span className="base-flowchart-sidebar-item-title">{t('karar_dugumu', 'Karar (E/H)')}</span>
                  <span className="base-flowchart-sidebar-item-sub">{t('karar_dugumu_sub', 'Kullanıcı Onayı')}</span>
                </div>
                <Plus size={13} className="base-flowchart-sidebar-item-add" />
              </button>

              <button
                type="button"
                onClick={() => onAddStep('EKRAN_AC')}
                className="base-flowchart-sidebar-item palette-input"
                title={t('girdi_ekran_adimi_ekle', 'Girdi / ERP Ekran Açma Düğümü Ekle')}
              >
                <div className="base-flowchart-sidebar-item-icon">
                  <Monitor size={14} />
                </div>
                <div className="base-flowchart-sidebar-item-text">
                  <span className="base-flowchart-sidebar-item-title">{t('ekran_girdi_dugumu', 'Ekran / Girdi')}</span>
                  <span className="base-flowchart-sidebar-item-sub">{t('ekran_girdi_dugumu_sub', 'Form & Navigasyon')}</span>
                </div>
                <Plus size={13} className="base-flowchart-sidebar-item-add" />
              </button>

              <button
                type="button"
                onClick={() => onAddStep('BELGE_OLUSTUR')}
                className="base-flowchart-sidebar-item palette-document"
                title={t('belge_taslak_adimi_ekle', 'Belge / Taslak Oluşturma Düğümü Ekle')}
              >
                <div className="base-flowchart-sidebar-item-icon">
                  <FileText size={14} />
                </div>
                <div className="base-flowchart-sidebar-item-text">
                  <span className="base-flowchart-sidebar-item-title">{t('belge_dugumu', 'Belge')}</span>
                  <span className="base-flowchart-sidebar-item-sub">{t('belge_dugumu_sub', 'ERP Belge Taslağı')}</span>
                </div>
                <Plus size={13} className="base-flowchart-sidebar-item-add" />
              </button>
            </div>
          </aside>
        )}

        {/* Noktalı Görsel Flowchart Sahnesi (Yatay & Dikey Kaydırılabilir ve Zoomlanabilir) */}
        <div
          ref={stageRef}
          className="base-flowchart-stage"
        >
          <div
            className={`base-flowchart-canvas-transform ${isWheelZooming ? 'is-wheel-zooming' : ''}`}
            style={{
              zoom: zoom
            }}
          >
            <div className="base-flowchart-spine">
              {/* 1. BAŞLANGIÇ / TETİKLEYİCİ KAPSÜL DÜĞÜMÜ */}
              <FlowchartStartNode
                id={startNodeId}
                title={startTitle || t('gorev_tetikleyici', 'Görev Başlangıcı & Tetikleyici')}
                subtitle={startSubtitle}
                selected={selectedStepId === startNodeId}
                onSelect={onSelectStep}
              />

              <BaseFlowchartConnector
                active={selectedStepId === startNodeId || (steps.length > 0 && selectedStepId === steps[0]?.id)}
                onInsertStep={onAddStep ? () => onAddStep('MCP_SORGULA', 0) : undefined}
              />

              {/* 2. AKIŞ ADIMI DÜĞÜMLERİ (Türetilmiş Flowchart Bileşenleri) */}
              {steps.length === 0 ? (
                <div className="ai-flowchart-empty-state">
                  <GitBranch size={28} />
                  <span>{emptyMessage || t('henuz_adim_eklenmemis', 'Henüz akış adımı eklenmemiş.')}</span>
                </div>
              ) : (
                steps.map((step, index) => {
                  const isSelected = selectedStepId === step.id;
                  const isFirst = index === 0;
                  const isLast = index === steps.length - 1;
                  const normalizedType = (step.type || 'MCP_SORGULA').toUpperCase();

                  const commonProps = {
                    id: step.id,
                    stepNumber: index + 1,
                    shapeBadgeText: step.shapeBadgeText,
                    title: step.title || `${index + 1}. ${t('islem_adimi', 'İşlem Adımı')}`,
                    promptPreview: step.prompt,
                    toolCode: step.toolCode,
                    uiActionLabel: step.uiActionLabel,
                    routePath: step.routePath,
                    selected: isSelected,
                    isFirst,
                    isLast,
                    onSelect: onSelectStep,
                    onMoveUp: onMoveStep ? (e: React.MouseEvent) => onMoveStep(index, 'up', e) : undefined,
                    onMoveDown: onMoveStep ? (e: React.MouseEvent) => onMoveStep(index, 'down', e) : undefined,
                    onDelete: onDeleteStep ? (e: React.MouseEvent) => onDeleteStep(step.id, e) : undefined
                  };

                  let renderedNode: React.ReactNode;

                  if (normalizedType === 'KARAR_ONAY') {
                    const yesStep = resolveStepById(step.yesStepId);
                    const noStep = resolveStepById(step.noStepId);
                    renderedNode = (
                      <FlowchartDecisionNode
                        {...commonProps}
                        yesTargetId={step.yesStepId}
                        yesTargetTitle={yesStep ? `${yesStep.id}: ${yesStep.title}` : undefined}
                        noTargetId={step.noStepId}
                        noTargetTitle={noStep ? `${noStep.id}: ${noStep.title}` : undefined}
                        noFallbackRoute={step.routePath}
                        onSelectBranchTarget={onSelectStep}
                      />
                    );
                  } else if (normalizedType === 'BASLANGIC_GIRDI' || normalizedType === 'EKRAN_AC') {
                    renderedNode = <FlowchartInputNode {...commonProps} />;
                  } else if (normalizedType === 'BELGE_OLUSTUR') {
                    renderedNode = <FlowchartDocumentNode {...commonProps} />;
                  } else if (normalizedType === 'SONUC') {
                    renderedNode = (
                      <FlowchartProcessNode
                        {...commonProps}
                        icon={<CheckCircle2 size={11} />}
                      />
                    );
                  } else {
                    renderedNode = <FlowchartProcessNode {...commonProps} />;
                  }

                  return (
                    <React.Fragment key={step.id || index}>
                      {renderedNode}
                      <BaseFlowchartConnector
                        active={isSelected}
                        onInsertStep={onAddStep ? () => onAddStep('MCP_SORGULA', index + 1) : undefined}
                      />
                    </React.Fragment>
                  );
                })
              )}

              {/* 3. BİTİŞ / TAMAMLAMA KAPSÜL DÜĞÜMÜ */}
              <FlowchartEndNode
                id="__END__"
                title={endTitle || t('gorev_tamamlandi_sonuc', 'Görev Tamamlandı & Yanıt Özeti')}
                selected={false}
                onSelect={() => {
                  if (steps.length > 0) {
                    onSelectStep(steps[steps.length - 1].id);
                  } else {
                    onSelectStep(startNodeId);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Sağ Alt Köşe: Dikey Floating Zoom Kontrolleri */}
        {showZoomControls && (
          <div className="base-flowchart-floating-zoom" aria-label={t('yakinlastirma_kontrolleri', 'Yakınlaştırma Kontrolleri')}>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= maxZoom}
              className="base-flowchart-zoom-btn"
              title={t('yakinlastir', 'Yakınlaştır (Ctrl/Cmd + Tekerlek)')}
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              className="base-flowchart-zoom-btn base-flowchart-zoom-level"
              title={t('varsayilan_yakinlik', 'Varsayılan Boyut (%100)')}
            >
              <span>{Math.round(zoom * 100)}%</span>
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= minZoom}
              className="base-flowchart-zoom-btn"
              title={t('uzaklastir', 'Uzaklaştır (Ctrl/Cmd + Tekerlek)')}
            >
              <ZoomOut size={14} />
            </button>
            <div className="base-flowchart-zoom-divider" />
            <button
              type="button"
              onClick={handleZoomReset}
              className="base-flowchart-zoom-btn base-flowchart-zoom-reset"
              title={t('sigdir_ve_sifirla', 'Boyutu Sıfırla (%100)')}
            >
              <RotateCcw size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseFlowchart;
