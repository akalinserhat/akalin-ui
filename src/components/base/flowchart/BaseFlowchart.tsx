/**
 * @akalin/ui - Temel Görsel Akış Diyagramı Tuvali (BaseFlowchart.tsx)
 *
 * Başlıca Sorumlulukları:
 * - Noktalı (blueprint dot-grid) interaktif akış diyagramı tuvalini sunmak
 * - Temel Flowchart bileşenlerini (BaseFlowchartNode, BaseFlowchartConnector) veya serbest düğüm içeriklerini (children) görselleştirmek
 * - Çift yönlü scroll ve yüksek performanslı rAF throttled yakınlaştırma/uzaklaştırma (Zoom) sağlamak
 * - Sıfır inline CSS ve %100 i18n uyumlu çalışmak
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GitBranch,
  Play,
  Monitor,
  Cpu,
  Database,
  Code2,
  Layers,
  Wrench,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import {
  BaseFlowchartNode,
  BaseFlowchartConnector,
  FlowchartNodeToolDock,
  FlowchartNodeShape,
  FlowchartAttachedToolItem
} from './BaseFlowchartNode';
import './BaseFlowchart.css';

export interface FlowchartStepItem {
  id: string;
  type?: string;
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
  supportsTools?: boolean;
  attachedTools?: FlowchartAttachedToolItem[];
}

export interface FlowchartPaletteItem {
  id: string;
  type: string;
  title: string;
  subTitle?: string;
  shape?: FlowchartNodeShape;
  category?: 'step' | 'tool';
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface BaseFlowchartProps {
  title?: React.ReactNode;
  showHeader?: boolean;
  fit?: boolean;
  startTitle?: React.ReactNode;
  startSubtitle?: React.ReactNode;
  startNodeId?: string;
  endTitle?: React.ReactNode;
  showStartNode?: boolean;
  showEndNode?: boolean;
  showSidebar?: boolean;
  sidebar?: React.ReactNode;
  paletteItems?: FlowchartPaletteItem[];
  steps?: FlowchartStepItem[];
  selectedStepId?: string | null;
  selectedToolId?: string | null;
  onSelectStep?: (stepId: string) => void;
  onDoubleClickStep?: (stepId: string) => void;
  onAddStep?: (stepType: string, insertAtIndex?: number) => void;
  onMoveStep?: (index: number, direction: 'up' | 'down', e?: React.MouseEvent) => void;
  onDeleteStep?: (stepId: string, e?: React.MouseEvent) => void;
  onAddToolToStep?: (parentStepId: string, toolType?: string) => void;
  onSelectTool?: (parentStepId: string, toolId: string) => void;
  onDoubleClickTool?: (parentStepId: string, toolId: string) => void;
  onDeleteTool?: (parentStepId: string, toolId: string, e?: React.MouseEvent) => void;
  emptyMessage?: string;
  className?: string;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  showZoomControls?: boolean;
  children?: React.ReactNode;
}

export const BaseFlowchart: React.FC<BaseFlowchartProps> = ({
  title,
  showHeader = false,
  fit = false,
  startTitle,
  startSubtitle,
  startNodeId = '__START__',
  endTitle,
  showStartNode = false,
  showEndNode = false,
  showSidebar = true,
  sidebar,
  paletteItems,
  steps = [],
  selectedStepId,
  selectedToolId,
  onSelectStep,
  onDoubleClickStep,
  onAddStep,
  onMoveStep,
  onDeleteStep,
  onAddToolToStep,
  onSelectTool,
  onDoubleClickTool,
  onDeleteTool,
  emptyMessage,
  className = '',
  initialZoom = 1,
  minZoom = 0.4,
  maxZoom = 2,
  showZoomControls = true,
  children
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
        e.preventDefault();

        setIsWheelZooming(true);
        if (wheelTimeoutRef.current) {
          clearTimeout(wheelTimeoutRef.current);
        }
        wheelTimeoutRef.current = setTimeout(() => {
          setIsWheelZooming(false);
        }, 160);

        const damping = 0.0015;
        const factor = Math.exp(-e.deltaY * damping);
        const nextZoom = Math.min(maxZoom, Math.max(minZoom, zoomRef.current * factor));

        zoomRef.current = nextZoom;

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

      {/* Ana Gövde Alanı (Sol: Dikey Diagram Paleti, Sağ: Çizim Sahnesi / Stage) */}
      <div className="base-flowchart-main-body">
        {showSidebar && (sidebar || (paletteItems && paletteItems.length > 0) || onAddStep) && (
          <aside className="base-flowchart-sidebar-palette" aria-label={t('diyagram_ogeleri', 'Diyagram Öğeleri')}>
            <div className="base-flowchart-sidebar-header">
              <Layers size={13} />
              <span>{t('diyagram_ogeleri', 'Diyagram Öğeleri')}</span>
            </div>

            <div className="base-flowchart-sidebar-items">
              {sidebar ? (
                sidebar
              ) : paletteItems && paletteItems.length > 0 ? (
                <>
                  {paletteItems
                    .filter(item => item.category !== 'tool')
                    .map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (item.onClick) item.onClick();
                          else if (onAddStep) onAddStep(item.type);
                        }}
                        className={`base-flowchart-sidebar-item palette-shape-${item.shape || 'process'}`}
                        title={item.title}
                      >
                        <div className="base-flowchart-sidebar-item-icon">
                          {item.icon}
                        </div>
                        <div className="base-flowchart-sidebar-item-text">
                          <span className="base-flowchart-sidebar-item-title">{item.title}</span>
                          {item.subTitle && (
                            <span className="base-flowchart-sidebar-item-sub">{item.subTitle}</span>
                          )}
                        </div>
                        <Plus size={13} className="base-flowchart-sidebar-item-add" />
                      </button>
                    ))}

                  {paletteItems.some(item => item.category === 'tool') && (
                    <>
                      <div className="base-flowchart-sidebar-section-divider">
                        <Wrench size={12} />
                        <span>{t('ai_islemi_araclari', 'AI İşlemi Araçları')}</span>
                      </div>
                      {paletteItems
                        .filter(item => item.category === 'tool')
                        .map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (item.onClick) item.onClick();
                              else if (onAddStep) onAddStep(item.type);
                            }}
                            className={`base-flowchart-sidebar-item palette-shape-${item.shape || 'tool'}`}
                            title={item.title}
                          >
                            <div className="base-flowchart-sidebar-item-icon">
                              {item.icon}
                            </div>
                            <div className="base-flowchart-sidebar-item-text">
                              <span className="base-flowchart-sidebar-item-title">{item.title}</span>
                              {item.subTitle && (
                                <span className="base-flowchart-sidebar-item-sub">{item.subTitle}</span>
                              )}
                            </div>
                            <Plus size={13} className="base-flowchart-sidebar-item-add" />
                          </button>
                        ))}
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Geleneksel Standart Flowchart Öğesi 1: Başla (Terminator / Oval Kapsül) */}
                  <button
                    type="button"
                    onClick={() => onAddStep && onAddStep('BASLA')}
                    className="base-flowchart-sidebar-item palette-shape-terminal"
                    title={t('basla_adimi_ekle', 'Başla Düğümü Ekle')}
                  >
                    <div className="base-flowchart-sidebar-item-icon">
                      <Play size={13} />
                    </div>
                    <div className="base-flowchart-sidebar-item-text">
                      <span className="base-flowchart-sidebar-item-title">{t('basla', 'Başla')}</span>
                      <span className="base-flowchart-sidebar-item-sub">{t('akisi_baslat', 'Akışı Başlat')}</span>
                    </div>
                    <Plus size={13} className="base-flowchart-sidebar-item-add" />
                  </button>

                  {/* Geleneksel Standart Flowchart Öğesi 2: Form Aç (Input-Output / Paralelkenar) */}
                  <button
                    type="button"
                    onClick={() => onAddStep && onAddStep('FORM_AC')}
                    className="base-flowchart-sidebar-item palette-shape-input"
                    title={t('form_ac_adimi_ekle', 'Form Aç Düğümü Ekle')}
                  >
                    <div className="base-flowchart-sidebar-item-icon">
                      <Monitor size={13} />
                    </div>
                    <div className="base-flowchart-sidebar-item-text">
                      <span className="base-flowchart-sidebar-item-title">{t('form_ac', 'Form Aç')}</span>
                      <span className="base-flowchart-sidebar-item-sub">{t('belge_kart_liste_ac', 'Belge, Kart veya Liste Aç')}</span>
                    </div>
                    <Plus size={13} className="base-flowchart-sidebar-item-add" />
                  </button>

                  {/* Geleneksel Standart Flowchart Öğesi 3: AI İşlemi (Process / Dikdörtgen) */}
                  <button
                    type="button"
                    onClick={() => onAddStep && onAddStep('AI_ISLEM')}
                    className="base-flowchart-sidebar-item palette-shape-process"
                    title={t('ai_islem_adimi_ekle', 'AI İşlemi Düğümü Ekle')}
                  >
                    <div className="base-flowchart-sidebar-item-icon">
                      <Cpu size={13} />
                    </div>
                    <div className="base-flowchart-sidebar-item-text">
                      <span className="base-flowchart-sidebar-item-title">{t('ai_islem', 'AI İşlemi')}</span>
                      <span className="base-flowchart-sidebar-item-sub">{t('ai_analiz_sorgu_belge_islem', 'AI Analiz, Sorgu veya Belge İşlemi')}</span>
                    </div>
                    <Plus size={13} className="base-flowchart-sidebar-item-add" />
                  </button>

                  {/* Geleneksel Standart Flowchart Öğesi 4: Hafıza (Storage / Veri Depolama) */}
                  <button
                    type="button"
                    onClick={() => onAddStep && onAddStep('HAFIZA')}
                    className="base-flowchart-sidebar-item palette-shape-storage"
                    title={t('hafiza_adimi_ekle', 'Hafıza Düğümü Ekle')}
                  >
                    <div className="base-flowchart-sidebar-item-icon">
                      <Database size={13} />
                    </div>
                    <div className="base-flowchart-sidebar-item-text">
                      <span className="base-flowchart-sidebar-item-title">{t('hafiza', 'Hafıza')}</span>
                      <span className="base-flowchart-sidebar-item-sub">{t('llm_verisini_dosya_olarak_depola', 'LLM Verisini Dosya Olarak Depola')}</span>
                    </div>
                    <Plus size={13} className="base-flowchart-sidebar-item-add" />
                  </button>

                  {/* Geleneksel Standart Flowchart Öğesi 5: Script İşlemi (JavaScript / MCP Dönüştürücü) */}
                  <button
                    type="button"
                    onClick={() => onAddStep && onAddStep('SCRIPT_ISLEM')}
                    className="base-flowchart-sidebar-item palette-shape-script"
                    title={t('script_islem_adimi_ekle', 'Script İşlemi Düğümü Ekle')}
                  >
                    <div className="base-flowchart-sidebar-item-icon">
                      <Code2 size={13} />
                    </div>
                    <div className="base-flowchart-sidebar-item-text">
                      <span className="base-flowchart-sidebar-item-title">{t('script_islem', 'Script İşlemi')}</span>
                      <span className="base-flowchart-sidebar-item-sub">{t('javascript_ile_mcp_json_uret', 'JavaScript Kodu Çalıştır & MCP Besle')}</span>
                    </div>
                    <Plus size={13} className="base-flowchart-sidebar-item-add" />
                  </button>
                </>
              )}
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
              {children ? (
                children
              ) : steps && steps.length > 0 ? (
                <>
                  {showStartNode && startTitle && (
                    <>
                      <BaseFlowchartNode
                        id={startNodeId}
                        shape="terminal"
                        variant="start"
                        title={startTitle}
                        subtitle={startSubtitle}
                        selected={selectedStepId === startNodeId}
                        onSelect={onSelectStep}
                        onDoubleClick={onDoubleClickStep ? () => onDoubleClickStep(startNodeId) : undefined}
                        showTopPort={false}
                      />
                      <BaseFlowchartConnector
                        active={selectedStepId === startNodeId || selectedStepId === steps[0]?.id}
                      />
                    </>
                  )}

                  {steps.map((step, index) => {
                    const isSelected = selectedStepId === step.id;
                    const isBasla = step.type === 'BASLA' || step.type === 'START';
                    const isFormAc = step.type === 'FORM_AC' || step.type === 'EKRAN_AC';
                    const isHafiza = step.type === 'HAFIZA';
                    const isScriptIslem = step.type === 'SCRIPT_ISLEM';

                    const resolvedShape: FlowchartNodeShape = isBasla
                      ? 'terminal'
                      : isFormAc
                        ? 'input'
                        : isHafiza
                          ? 'storage'
                          : isScriptIslem
                            ? 'script'
                            : 'process';

                    const resolvedVariant = isBasla
                      ? 'start'
                      : isFormAc
                        ? 'input'
                        : isHafiza
                          ? 'storage'
                          : isScriptIslem
                            ? 'script'
                            : 'process';

                    const resolvedIcon = isBasla ? (
                      <Play size={13} />
                    ) : isFormAc ? (
                      <Monitor size={13} />
                    ) : isHafiza ? (
                      <Database size={13} />
                    ) : isScriptIslem ? (
                      <Code2 size={13} />
                    ) : (
                      <Cpu size={13} />
                    );

                    const defaultTypeTitle = isBasla
                      ? t('basla', 'Başla')
                      : isFormAc
                        ? t('form_ac', 'Form Aç')
                        : isHafiza
                          ? t('hafiza', 'Hafıza')
                          : isScriptIslem
                            ? t('script_islem', 'Script İşlemi')
                            : t('ai_islem', 'AI İşlemi');

                    const canAttachTools = Boolean(
                      step.supportsTools ||
                      step.type === 'AI_ISLEM' ||
                      (step.attachedTools && step.attachedTools.length > 0)
                    );

                    const mainStepNode = (
                      <BaseFlowchartNode
                        id={step.id}
                        stepNumber={isBasla ? undefined : index + 1}
                        shape={resolvedShape}
                        variant={resolvedVariant}
                        icon={resolvedIcon}
                        showTopPort={!isBasla}
                        shapeBadgeText={step.shapeBadgeText || defaultTypeTitle}
                        title={step.title || defaultTypeTitle}
                        promptPreview={step.prompt}
                        toolCode={step.toolCode}
                        uiActionLabel={step.uiActionLabel}
                        routePath={step.routePath}
                        selected={isSelected}
                        isFirst={index === 0}
                        isLast={index === steps.length - 1}
                        onSelect={onSelectStep}
                        onDoubleClick={onDoubleClickStep ? () => onDoubleClickStep(step.id) : undefined}
                        onMoveUp={onMoveStep ? (e) => onMoveStep(index, 'up', e) : undefined}
                        onMoveDown={onMoveStep ? (e) => onMoveStep(index, 'down', e) : undefined}
                        onDelete={onDeleteStep ? (e) => onDeleteStep(step.id, e) : undefined}
                      />
                    );

                    return (
                      <React.Fragment key={step.id || index}>
                        {canAttachTools && (onAddToolToStep || (step.attachedTools && step.attachedTools.length > 0)) ? (
                          <div className="base-flowchart-step-with-tools">
                            <div className="base-flowchart-step-main-col">
                              {mainStepNode}
                            </div>
                            <FlowchartNodeToolDock
                              parentStepId={step.id}
                              tools={step.attachedTools}
                              selectedToolId={selectedToolId}
                              onAddTool={onAddToolToStep}
                              onSelectTool={onSelectTool}
                              onDoubleClickTool={onDoubleClickTool}
                              onDeleteTool={onDeleteTool}
                            />
                          </div>
                        ) : (
                          mainStepNode
                        )}
                        {index < steps.length - 1 && (
                          <BaseFlowchartConnector active={isSelected} />
                        )}
                      </React.Fragment>
                    );
                  })}

                  {showEndNode && endTitle && (
                    <>
                      <BaseFlowchartConnector active={selectedStepId === steps[steps.length - 1]?.id} />
                      <BaseFlowchartNode
                        id="__END__"
                        shape="terminal"
                        variant="end"
                        title={endTitle}
                        selected={false}
                        showBottomPort={false}
                      />
                    </>
                  )}
                </>
              ) : null}
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
