/**
 * @akalin/ui - Temel Flowchart Düğüm Sınıfı ve Türetilmiş Flowchart Bileşenleri (BaseFlowchartNode.tsx)
 *
 * Başlıca Sorumlulukları:
 * - n8n tarzı Sol Giriş -> Sağ Çıkış + Alt Tool Portu mimarisine sahip standart düğüm kartlarını sunmak
 * - Geleneksel ANSI/ISO 5807 geometrilerini (Terminal Kapsül, Paralelkenar Girdi, Süreç Kutusu, Baklava Karar, Dalgalı Belge, Depolama, Script ve Alt Araç) korumak
 * - Sabit düğüm başlığı, tek satırlık yapılandırma özeti, durum göstergesi ve seçili düğüm hızlı aksiyonlarını standartlaştırmak
 * - Sıfır statik inline CSS ve %100 i18n uyumlu çalışmak
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Play,
  CheckCircle2,
  GitBranch,
  Cpu,
  Monitor,
  FileText,
  Plus,
  Trash2,
  Sparkles,
  CornerDownRight,
  Sliders,
  Database,
  Code2,
  Wrench,
  Search,
  AlertTriangle,
  Globe,
  Repeat,
  Zap,
  Clock,
  Layers,
  RotateCcw
} from 'lucide-react';
import './BaseFlowchart.css';

export type FlowchartNodeShape =
  | 'terminal'
  | 'process'
  | 'input'
  | 'decision'
  | 'document'
  | 'storage'
  | 'script'
  | 'page'
  | 'loop'
  | 'custom'
  | 'tool';

export type FlowchartNodeVariant =
  | 'start'
  | 'process'
  | 'input'
  | 'decision'
  | 'document'
  | 'end'
  | 'storage'
  | 'script'
  | 'page'
  | 'loop'
  | 'tool';

export type FlowchartConnectionBranch = 'next' | 'yes' | 'no' | 'loop' | 'done' | 'loop_back';

export interface FlowchartPoint {
  x: number;
  y: number;
}

export interface FlowchartLoopMeta {
  isAsync?: boolean;
  modeLabel?: string;
  sourceLabel?: string;
  variableName?: string;
  maxIterations?: number;
  concurrency?: number;
  mergeLabel?: string;
  loopBodyTitle?: string;
  doneTargetTitle?: string;
}

export interface FlowchartAttachedToolItem {
  id: string;
  type: string;
  title: string;
  badgeText?: string;
  summary?: string;
  toolCode?: string;
  icon?: React.ReactNode;
  active?: boolean;
  position?: FlowchartPoint;
}

export interface BaseFlowchartNodeProps {
  id: string;
  shape?: FlowchartNodeShape;
  variant?: FlowchartNodeVariant;
  stepNumber?: number | string;
  shapeBadgeText?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  summaryText?: string;
  promptPreview?: string;
  toolCode?: string;
  uiActionLabel?: string;
  routePath?: string;
  warningText?: string;
  inactive?: boolean;
  icon?: React.ReactNode;
  selected?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  isConnectTarget?: boolean;
  showLeftPort?: boolean;
  showRightPort?: boolean;
  showBottomToolPort?: boolean;
  hasAttachedTools?: boolean;
  /** Geriye dönük uyumluluk için korunur */
  showTopPort?: boolean;
  /** Geriye dönük uyumluluk için korunur */
  showBottomPort?: boolean;
  onSelect?: (id: string) => void;
  onDoubleClick?: (id: string, e: React.MouseEvent) => void;
  onMoveUp?: (e: React.MouseEvent) => void;
  onMoveDown?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onStartConnection?: (
    sourceId: string,
    branch: FlowchartConnectionBranch,
    e: React.PointerEvent<HTMLButtonElement>
  ) => void;
  onAddTool?: (parentStepId: string) => void;
  /** Düğüm kartının sağ üst başlığında ayar/silme aksiyonlarının yanında gösterilecek özel eylemler (örn. ActionMenu) */
  headerActions?: React.ReactNode;
  /** Özel görsel içerik gövdesi (örneğin sayfa küçük önizleme görseli) */
  renderBody?: () => React.ReactNode;
  /** Özelleştirilmiş gövdelerde varsayılan "Yapılandırmak için çift tıklayın" özet kutusunu gizler */
  hideSummary?: boolean;
  /** Döngü (Loop) düğümünde döngü içi bağlı düğümün başlığı */
  loopTargetTitle?: string;
  /** n8n tarzı Döngü (Loop Over Items) yapılandırma ve çıkış özet bilgileri */
  loopMeta?: FlowchartLoopMeta;
  /** Bu düğüm bir Döngü (Loop) düğümünün iterasyon gövdesi içinde mi yer alıyor? */
  inLoopBody?: boolean;
  /** Döngü düğümüne geri dönüş (loop-back) bağlantısı mevcut mu? */
  hasLoopBackConnection?: boolean;
  /** Sol giriş portu ipucu metni */
  leftPortTitle?: string;
  /** Sağ çıkış portu ipucu metni */
  rightPortTitle?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Temel Flowchart Düğüm Bileşeni (n8n Sol Giriş -> Sağ Çıkış + Alt Tool Port Standardı)
 */
export const BaseFlowchartNode: React.FC<BaseFlowchartNodeProps> = ({
  id,
  shape = 'process',
  variant = 'process',
  stepNumber,
  shapeBadgeText,
  title,
  subtitle,
  summaryText,
  promptPreview,
  toolCode,
  uiActionLabel,
  routePath,
  warningText,
  inactive = false,
  icon,
  selected = false,
  isConnectTarget = false,
  showLeftPort,
  showRightPort,
  showBottomToolPort = false,
  hasAttachedTools = false,
  onSelect,
  onDoubleClick,
  onDelete,
  onStartConnection,
  onAddTool,
  headerActions,
  renderBody,
  hideSummary = false,
  loopTargetTitle,
  loopMeta,
  inLoopBody = false,
  hasLoopBackConnection = false,
  leftPortTitle,
  rightPortTitle,
  children,
  className = ''
}) => {
  const { t } = useTranslation();
  const lastClickTimeRef = React.useRef<number>(0);

  const isStartTerminal = shape === 'terminal' && variant === 'start';
  const isEndTerminal = shape === 'terminal' && variant === 'end';
  const isDecision = shape === 'decision';
  const isLoop = shape === 'loop' || variant === 'loop';

  const effectiveLeftPort =
    showLeftPort !== undefined ? showLeftPort : !isStartTerminal;
  const effectiveRightPort =
    showRightPort !== undefined ? showRightPort : !isEndTerminal;

  const resolvedSummary =
    summaryText ||
    (uiActionLabel && uiActionLabel !== 'YOK' ? uiActionLabel : '') ||
    promptPreview ||
    routePath ||
    '';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastClickTimeRef.current < 340) {
      lastClickTimeRef.current = 0;
      if (onDoubleClick) {
        onDoubleClick(id, e);
      }
      return;
    }
    lastClickTimeRef.current = now;
    if (onSelect) {
      onSelect(id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    lastClickTimeRef.current = 0;
    if (onDoubleClick) {
      onDoubleClick(id, e);
    }
  };

  if (shape === 'terminal') {
    return (
      <div
        className={`base-flowchart-node-wrapper is-horizontal ${isConnectTarget ? 'is-connect-target' : ''}`}
        onDoubleClick={handleDoubleClick}
      >
        {effectiveLeftPort && (
          <div
            className="base-flowchart-handle handle-left handle-end"
            data-node-input-id={id}
            data-port-role="input"
            title={t('flowchart_giris_portu', 'Giriş Bağlantı Noktası')}
          />
        )}

        <div
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          className={`base-flowchart-node base-flowchart-node--terminal variant-${variant} ${selected ? 'is-selected' : ''} ${inactive ? 'is-inactive' : ''} ${className}`}
          title={t('cift_tikla_duzenle', 'Düzenlemek için çift tıklayın')}
        >
          <div className="base-flowchart-terminal-left">
            <div className="base-flowchart-terminal-icon">
              {icon || (variant === 'start' ? <Play size={14} /> : <CheckCircle2 size={14} />)}
            </div>
            <div className="base-flowchart-terminal-texts">
              <span className="base-flowchart-terminal-label">
                {shapeBadgeText ||
                  (variant === 'start'
                    ? t('flowchart_baslangic', 'BAŞLANGIÇ / TETİKLEYİCİ')
                    : t('flowchart_bitis', 'AKIŞ SONU'))}
              </span>
              <span className="base-flowchart-terminal-title">{title}</span>
              {(subtitle || resolvedSummary) && (
                <span className="base-flowchart-node-summary-line">
                  {subtitle || resolvedSummary}
                </span>
              )}
            </div>
          </div>

          <div
            className="base-flowchart-terminal-right"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {onDoubleClick && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDoubleClick(id, e);
                }}
                className="base-flowchart-node-settings-btn"
                title={t('dugum_ayarlari', 'Düğüm Ayarları')}
              >
                <Sliders size={13} />
              </button>
            )}
          </div>
        </div>

        {effectiveRightPort && (
          <button
            type="button"
            data-port-branch="next"
            className="base-flowchart-handle handle-right handle-start-out"
            title={t('baglanti_cekmek_icin_surukle', 'Bağlantı kurmak için sürükleyin')}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (onStartConnection) onStartConnection(id, 'next', e);
            }}
          />
        )}
      </div>
    );
  }

  const resolvedLoopBodyTarget = loopMeta?.loopBodyTitle || loopTargetTitle;

  return (
    <div
      className={`base-flowchart-node-wrapper is-horizontal ${isConnectTarget ? 'is-connect-target' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      {/* SOL GİRİŞ PORTU */}
      {effectiveLeftPort && (
        <div
          className={`base-flowchart-handle handle-left ${isDecision ? 'handle-decision' : ''} ${isLoop ? 'handle-loop-in' : ''}`}
          data-node-input-id={id}
          data-port-role="input"
          title={
            leftPortTitle ||
            (isLoop
              ? t('loop_giris_portu', 'Döngü Veri Girişi (Liste / Döküman)')
              : t('flowchart_giris_portu', 'Giriş Bağlantı Noktası'))
          }
        />
      )}

      {/* KARAR DÜĞÜMÜ ÜST BAKLAVA ROZETİ */}
      {isDecision && (
        <div
          className="base-flowchart-diamond-crest"
          title={t('karar_onay_noktasi', 'Karar / Onay Noktası (Evet / Hayır)')}
        >
          <span className="base-flowchart-diamond-crest-icon">
            {icon || <GitBranch size={14} />}
          </span>
        </div>
      )}

      {/* DÖNGÜ (LOOP) DÜĞÜMÜ ÜST n8n İTERASYON ROZETİ */}
      {isLoop && (
        <div
          className="base-flowchart-loop-crest"
          title={t(
            'dongu_iterasyon_noktasi',
            'Döngü (Loop Over Items) — Öğeleri tek tek işler, tamamlanınca devam eder'
          )}
        >
          <span className="base-flowchart-loop-crest-icon">
            {icon || <Repeat size={15} />}
          </span>
        </div>
      )}

      {/* ANA DÜĞÜM KARTI */}
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={`base-flowchart-node base-flowchart-node--${shape} variant-${variant} ${selected ? 'is-selected' : ''} ${inactive ? 'is-inactive' : ''} ${warningText ? 'has-warning' : ''} ${inLoopBody && !isLoop ? 'is-in-loop-body' : ''} ${className}`}
        title={t('cift_tikla_duzenle', 'Düzenlemek için çift tıklayın')}
      >
        {shape === 'page' && renderBody ? (
          <div className="base-flowchart-page-sheet-root">{renderBody()}</div>
        ) : (
          <>
            <div className="base-flowchart-node-header">
              <div className="base-flowchart-node-header-left">
                {stepNumber !== undefined && (
                  <span className="base-flowchart-step-badge">#{stepNumber}</span>
                )}
                {shapeBadgeText && (
                  <span className="base-flowchart-shape-badge">
                    {icon}
                    <span>{shapeBadgeText}</span>
                  </span>
                )}
                {inLoopBody && !isLoop && (
                  <span
                    className="base-flowchart-loop-member-pill"
                    title={t(
                      'dongu_ici_adim_ipucu',
                      'Bu düğüm Döngü (Loop) içerisinde her öğe için tekrar çalıştırılır'
                    )}
                  >
                    <Repeat size={10} />
                    <span>{t('dongu_ici_kisa_etiket', 'Döngü İçi')}</span>
                  </span>
                )}
                {warningText && (
                  <span className="base-flowchart-warning-pill" title={warningText}>
                    <AlertTriangle size={11} className="shrink-0 text-amber-500 animate-pulse" />
                    <span>{warningText}</span>
                  </span>
                )}
              </div>

              {(headerActions || onDoubleClick || onDelete) && (
                <div
                  className="base-flowchart-node-actions"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {headerActions}
                  {onDoubleClick && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDoubleClick(id, e);
                      }}
                      className="base-flowchart-action-btn is-settings"
                      title={t('dugum_ayarlari', 'Düğüm Ayarları')}
                    >
                      <Sliders size={12} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={onDelete}
                      className="base-flowchart-action-btn is-danger"
                      title={t('adimi_sil', 'Adımı Sil')}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 1. Sabit Düğüm Başlığı */}
            <div className="base-flowchart-node-title">{title}</div>

            {/* 2. Özelleştirilmiş Görsel Gövde (ör. Web Sayfası Görsel Önizlemesi), n8n Loop Gövdesi veya Standart Özet */}
            {renderBody && (
              <div className="base-flowchart-node-custom-body">{renderBody()}</div>
            )}

            {isLoop && !renderBody && (
              <div className="base-flowchart-loop-body">
                <div className="base-flowchart-loop-source-row">
                  <span
                    className="base-flowchart-loop-source-main"
                    title={loopMeta?.sourceLabel || resolvedSummary}
                  >
                    <Layers size={12} className="base-flowchart-loop-source-icon" />
                    <span className="base-flowchart-loop-source-text">
                      {loopMeta?.sourceLabel ||
                        ( !warningText ? resolvedSummary : '' ) ||
                        t('dongu_veri_kaynagi_varsayilan', 'Liste Elemanları')}
                    </span>
                  </span>
                  {loopMeta?.variableName && (
                    <code
                      className="base-flowchart-loop-var-code"
                      title={t(
                        'dongu_iterasyon_degiskeni_ipucu',
                        'Her iterasyonda döngü içi düğümlere aktarılan aktif öğe değişkeni'
                      )}
                    >
                      {`{{${loopMeta.variableName.replace(/^\{\{|\}\}$/g, '').trim()}}}`}
                    </code>
                  )}
                </div>

                <div className="base-flowchart-loop-specs-row">
                  <span
                    className={`base-flowchart-loop-spec-chip ${loopMeta?.isAsync ? 'is-async' : 'is-sync'}`}
                  >
                    {loopMeta?.isAsync ? <Zap size={10} /> : <Clock size={10} />}
                    <span>
                      {loopMeta?.modeLabel ||
                        (loopMeta?.isAsync
                          ? t('dongu_mod_paralel_kisa', 'Paralel')
                          : t('dongu_mod_sirali_kisa', 'Sıralı'))}
                    </span>
                  </span>
                  {loopMeta?.maxIterations ? (
                    <span className="base-flowchart-loop-spec-chip">
                      <span>
                        {t('dongu_maks_kisa', 'Maks')}: {loopMeta.maxIterations}
                      </span>
                    </span>
                  ) : null}
                  {loopMeta?.mergeLabel ? (
                    <span className="base-flowchart-loop-spec-chip">
                      <span>{loopMeta.mergeLabel}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            )}

            {!isLoop &&
              !hideSummary &&
              !renderBody &&
              (resolvedSummary ? (
                <div className="base-flowchart-node-summary-box" title={resolvedSummary}>
                  {resolvedSummary}
                </div>
              ) : (
                <div className="base-flowchart-node-summary-empty">
                  {t('yapilandirmak_icin_cift_tiklayin', 'Yapılandırmak için çift tıklayın')}
                </div>
              ))}

            {!isLoop && !hideSummary && renderBody && resolvedSummary && (
              <div className="base-flowchart-node-summary-box" title={resolvedSummary}>
                {resolvedSummary}
              </div>
            )}

            {/* 3. Teknik MCP / Rota Kodu Etiketi (Varsa) */}
            {toolCode && !isLoop && (
              <div className="base-flowchart-node-tags">
                <span className="base-flowchart-tag">
                  <Wrench size={10} />
                  <span>{toolCode}</span>
                </span>
              </div>
            )}

            {children}

            {/* 4. n8n Tarzı Döngü (Loop Over Items) 2 Satırlı Çıkış Port Rayı (Üst: Tamamlandı / done, Alt: Her Öğe / loop + Sol Geri Dönüş) */}
            {effectiveRightPort && isLoop && (
              <div
                className="base-flowchart-loop-ports-rail"
                onClick={(e) => e.stopPropagation()}
              >
                {/* ÇIKIŞ 0 (ÜST): DONE / TAMAMLANDI */}
                <div
                  className={`base-flowchart-loop-port-row is-done ${loopMeta?.doneTargetTitle ? 'is-connected' : ''}`}
                >
                  <div className="base-flowchart-loop-port-info">
                    <span className="base-flowchart-loop-port-badge is-done">
                      <CheckCircle2 size={11} />
                      <span>{t('loop_cikis_tamamlandi', 'Tamamlandı')}</span>
                      <span className="base-flowchart-loop-port-key">done</span>
                    </span>
                    <span
                      className="base-flowchart-loop-port-sub"
                      title={
                        loopMeta?.doneTargetTitle ||
                        t('loop_done_ipucu_kisa', 'Tüm öğeler bittiğinde devam eder')
                      }
                    >
                      {loopMeta?.doneTargetTitle
                        ? `→ ${loopMeta.doneTargetTitle}`
                        : t('loop_done_ipucu_kisa', 'Tüm öğeler bittiğinde devam eder')}
                    </span>
                  </div>
                  <button
                    type="button"
                    data-port-branch="done"
                    className="base-flowchart-handle handle-rail-right handle-done"
                    title={t(
                      'loop_done_port_ipucu',
                      'Tamamlandı (done) Çıkışı — Tüm iterasyonlar bittiğinde çalışacak adıma sürükleyin'
                    )}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (onStartConnection) onStartConnection(id, 'done', e);
                    }}
                  />
                </div>

                {/* ÇIKIŞ 1 (ALT): LOOP / HER ÖĞE + SOL GERİ DÖNÜŞ PORTU */}
                <div
                  className={`base-flowchart-loop-port-row is-loop ${resolvedLoopBodyTarget ? 'is-connected' : 'is-unconnected'}`}
                >
                  {effectiveLeftPort && (
                    <div
                      data-node-input-id={id}
                      data-port-role="loop-return"
                      className={`base-flowchart-handle handle-rail-left handle-loop-return ${hasLoopBackConnection || resolvedLoopBodyTarget ? 'is-connected' : ''}`}
                      title={t(
                        'loop_geri_donus_portu',
                        '↺ Döngü Geri Dönüşü — Döngü içi adım tamamlandığında sıradaki öğe için buraya döner'
                      )}
                    >
                      <RotateCcw size={8} />
                    </div>
                  )}
                  <div className="base-flowchart-loop-port-info">
                    <span className="base-flowchart-loop-port-badge is-loop">
                      <Repeat size={11} />
                      <span>{t('loop_cikis_her_oge', 'Her Öğe')}</span>
                      <span className="base-flowchart-loop-port-key">loop</span>
                    </span>
                    <span
                      className="base-flowchart-loop-port-sub"
                      title={
                        resolvedLoopBodyTarget ||
                        t('loop_iterasyon_ipucu_kisa', 'Tekrarlanacak adıma bağlayın')
                      }
                    >
                      {resolvedLoopBodyTarget
                        ? `↻ ${resolvedLoopBodyTarget}`
                        : t('loop_iterasyon_ipucu_kisa', 'Tekrarlanacak adıma bağlayın')}
                    </span>
                  </div>
                  <button
                    type="button"
                    data-port-branch="loop"
                    className="base-flowchart-handle handle-rail-right handle-loop"
                    title={t(
                      'loop_iterasyon_port_ipucu',
                      'Her Öğe (loop) Çıkışı — Her iterasyonda tekrarlanacak adıma sürükleyin'
                    )}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      if (onStartConnection) onStartConnection(id, 'loop', e);
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* SAĞ ÇIKIŞ PORTLARI (Normal Düğümde Tek Port, Karar Düğümünde Evet & Hayır Portları) */}
      {effectiveRightPort && !isDecision && !isLoop && (
        <button
          type="button"
          data-port-branch="next"
          className="base-flowchart-handle handle-right"
          title={rightPortTitle || t('baglanti_cekmek_icin_surukle', 'Bağlantı kurmak için sürükleyin')}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (onStartConnection) onStartConnection(id, 'next', e);
          }}
        />
      )}

      {effectiveRightPort && isDecision && (
        <>
          <div className="base-flowchart-decision-port-group is-yes">
            <span className="base-flowchart-decision-port-label is-yes">
              {t('evet_kisa', 'Evet')}
            </span>
            <button
              type="button"
              data-port-branch="yes"
              className="base-flowchart-handle handle-right handle-yes"
              title={t('evet_cikis_baglantisi', 'EVET Çıkışı — Bağlantı kurmak için sürükleyin')}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onStartConnection) onStartConnection(id, 'yes', e);
              }}
            />
          </div>

          <div className="base-flowchart-decision-port-group is-no">
            <span className="base-flowchart-decision-port-label is-no">
              {t('hayir_kisa', 'Hayır')}
            </span>
            <button
              type="button"
              data-port-branch="no"
              className="base-flowchart-handle handle-right handle-no"
              title={t('hayir_cikis_baglantisi', 'HAYIR Çıkışı — Bağlantı kurmak için sürükleyin')}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onStartConnection) onStartConnection(id, 'no', e);
              }}
            />
          </div>
        </>
      )}

      {/* ALT TOOL PORTU (Yalnızca AI İşlemi gibi Alt Araç Destekleyen Düğümlerde) */}
      {showBottomToolPort && (
        <div
          className="base-flowchart-bottom-tool-slot"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div
            className={`base-flowchart-handle handle-bottom-tool ${hasAttachedTools ? 'has-tools' : ''}`}
            title={t('bagli_ai_araclari', 'Bağlı AI Araçları (Tools)')}
          />
          {onAddTool && !hasAttachedTools && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddTool(id);
              }}
              className="base-flowchart-bottom-tool-add-pill"
              title={t('ai_islemine_rag_araci_ekle', 'Bu AI İşlemi düğümüne RAG Sorgu Aracı bağla')}
            >
              <Plus size={11} />
              <span>{t('tool_ekle_kisa', 'Tool')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Türetilmiş Bileşenler (Geriye Dönük Uyumluluk & Açık Semantik Kullanım) ──
export interface FlowchartStartNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> {}
export const FlowchartStartNode: React.FC<FlowchartStartNodeProps> = (props) => {
  const { t } = useTranslation();
  return (
    <BaseFlowchartNode
      {...props}
      shape="terminal"
      variant="start"
      title={props.title || t('basla', 'Başla')}
      shapeBadgeText={props.shapeBadgeText || t('basla', 'Başla')}
      icon={props.icon || <Play size={12} />}
      showLeftPort={false}
      showRightPort={true}
    />
  );
};

export interface FlowchartInputNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> {}
export const FlowchartInputNode: React.FC<FlowchartInputNodeProps> = (props) => {
  const { t } = useTranslation();
  return (
    <BaseFlowchartNode
      {...props}
      shape="input"
      variant="input"
      icon={props.icon || <Monitor size={11} />}
      shapeBadgeText={props.shapeBadgeText || t('form_ac', 'Form Aç')}
    />
  );
};

export interface FlowchartProcessNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> {}
export const FlowchartProcessNode: React.FC<FlowchartProcessNodeProps> = (props) => {
  const { t } = useTranslation();
  return (
    <BaseFlowchartNode
      {...props}
      shape="process"
      variant="process"
      icon={props.icon || <Cpu size={11} />}
      shapeBadgeText={props.shapeBadgeText || t('ai_islem', 'AI İşlemi')}
    />
  );
};

export interface FlowchartDocumentNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> {}
export const FlowchartDocumentNode: React.FC<FlowchartDocumentNodeProps> = (props) => {
  const { t } = useTranslation();
  return (
    <BaseFlowchartNode
      {...props}
      shape="document"
      variant="document"
      icon={props.icon || <FileText size={11} />}
      shapeBadgeText={props.shapeBadgeText || t('belge_olustur', 'Belge Oluştur')}
    />
  );
};

export interface FlowchartDecisionNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> {
  yesTargetId?: string;
  yesTargetTitle?: string;
  noTargetId?: string;
  noTargetTitle?: string;
  noFallbackRoute?: string;
  onSelectBranchTarget?: (targetId: string) => void;
}

export const FlowchartDecisionNode: React.FC<FlowchartDecisionNodeProps> = ({
  yesTargetId: _yesTargetId,
  yesTargetTitle: _yesTargetTitle,
  noTargetId: _noTargetId,
  noTargetTitle: _noTargetTitle,
  noFallbackRoute: _noFallbackRoute,
  onSelectBranchTarget: _onSelectBranchTarget,
  ...props
}) => {
  const { t } = useTranslation();
  return (
    <BaseFlowchartNode
      {...props}
      shape="decision"
      variant="decision"
      icon={props.icon || <GitBranch size={12} />}
      shapeBadgeText={props.shapeBadgeText || t('karar_onay', 'Karar / Onay')}
    />
  );
};

export interface FlowchartStorageNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> {}
export const FlowchartStorageNode: React.FC<FlowchartStorageNodeProps> = (props) => {
  const { t } = useTranslation();
  return (
    <BaseFlowchartNode
      {...props}
      shape="storage"
      variant="storage"
      icon={props.icon || <Database size={11} />}
      shapeBadgeText={props.shapeBadgeText || t('hafiza', 'Hafıza')}
    />
  );
};

export interface FlowchartScriptNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> {}
export const FlowchartScriptNode: React.FC<FlowchartScriptNodeProps> = (props) => {
  const { t } = useTranslation();
  return (
    <BaseFlowchartNode
      {...props}
      shape="script"
      variant="script"
      icon={props.icon || <Code2 size={11} />}
      shapeBadgeText={props.shapeBadgeText || t('script_islem', 'Script İşlemi')}
    />
  );
};

export interface FlowchartLoopNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> {}
export const FlowchartLoopNode: React.FC<FlowchartLoopNodeProps> = (props) => {
  const { t } = useTranslation();
  return (
    <BaseFlowchartNode
      {...props}
      shape="loop"
      variant="loop"
      icon={props.icon || <Repeat size={11} />}
      shapeBadgeText={props.shapeBadgeText || t('loop_dongu', 'Döngü (Loop)')}
    />
  );
};

export interface FlowchartEndNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> {}
export const FlowchartEndNode: React.FC<FlowchartEndNodeProps> = (props) => {
  const { t } = useTranslation();
  return (
    <BaseFlowchartNode
      {...props}
      shape="terminal"
      variant="end"
      icon={props.icon || <Sparkles size={13} />}
      shapeBadgeText={props.shapeBadgeText || t('flowchart_akis_sonu', 'AKIŞ SONU')}
      showLeftPort={true}
      showRightPort={false}
    />
  );
};

export interface FlowchartPageNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> {}
export const FlowchartPageNode: React.FC<FlowchartPageNodeProps> = (props) => {
  const { t } = useTranslation();
  return (
    <BaseFlowchartNode
      {...props}
      shape="page"
      variant="page"
      icon={props.icon || <Globe size={12} />}
      shapeBadgeText={props.shapeBadgeText || props.routePath || t('sayfa', 'Sayfa')}
      showLeftPort={props.showLeftPort ?? true}
      showRightPort={props.showRightPort ?? true}
      hideSummary={props.hideSummary ?? true}
    />
  );
};

// ─── Geriye Dönük Uyumluluk: BaseFlowchartConnector ───────────────────────────
export interface BaseFlowchartConnectorProps {
  active?: boolean;
  onInsertStep?: () => void;
  insertTitle?: string;
}

export const BaseFlowchartConnector: React.FC<BaseFlowchartConnectorProps> = ({
  active = false,
  onInsertStep,
  insertTitle
}) => {
  const { t } = useTranslation();
  return (
    <div className={`base-flowchart-connector ${active ? 'is-active' : ''}`}>
      <svg className="base-flowchart-connector-svg" viewBox="0 0 24 46">
        <line x1="12" y1="0" x2="12" y2="38" className="base-flowchart-connector-line" />
        <polygon points="7,36 17,36 12,45" className="base-flowchart-connector-arrow" />
      </svg>
      {onInsertStep && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInsertStep();
          }}
          className="base-flowchart-insert-btn"
          title={insertTitle || t('araya_adim_ekle', 'Bu Noktaya Yeni Adım Ekle')}
        >
          <Plus size={12} />
          <span className="base-flowchart-insert-label">{t('adim_ekle_kisa', 'Adım Ekle')}</span>
        </button>
      )}
    </div>
  );
};

// ─── AI İşlemi Bağlı Araç Alt Düğümü (n8n Bottom Tool Sub-Node) ───────────────
export interface FlowchartToolSubNodeProps {
  tool: FlowchartAttachedToolItem;
  parentStepId: string;
  selected?: boolean;
  onSelect?: (parentStepId: string, toolId: string) => void;
  onDoubleClick?: (parentStepId: string, toolId: string) => void;
  onDelete?: (parentStepId: string, toolId: string, e: React.MouseEvent) => void;
}

export const FlowchartToolSubNode: React.FC<FlowchartToolSubNodeProps> = ({
  tool,
  parentStepId,
  selected = false,
  onSelect,
  onDoubleClick,
  onDelete
}) => {
  const { t } = useTranslation();
  const lastClickRef = React.useRef<number>(0);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastClickRef.current < 340) {
      lastClickRef.current = 0;
      if (onDoubleClick) {
        onDoubleClick(parentStepId, tool.id);
      }
      return;
    }
    lastClickRef.current = now;
    if (onSelect) {
      onSelect(parentStepId, tool.id);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    lastClickRef.current = 0;
    if (onDoubleClick) {
      onDoubleClick(parentStepId, tool.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`base-flowchart-tool-subnode ${selected ? 'is-selected' : ''} ${tool.active === false ? 'is-inactive' : ''}`}
      title={t('cift_tikla_arac_duzenle', 'Araç ayarlarını yapılandırmak için çift tıklayın')}
    >
      {/* Üst Bağlantı Portu (Ebeveyn AI İşlemi Alt Tool Portuna Bağlanır) */}
      <div className="base-flowchart-tool-subnode-top-port" />

      <div className="base-flowchart-tool-subnode-header">
        <span className="base-flowchart-tool-subnode-badge">
          {tool.icon || <Search size={11} />}
          <span>{tool.badgeText || t('ai_arac_dugumu', 'AI Aracı')}</span>
        </span>
        <div
          className="base-flowchart-node-actions"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {onDoubleClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDoubleClick(parentStepId, tool.id);
              }}
              className="base-flowchart-action-btn is-settings"
              title={t('arac_ayarlari', 'Araç Ayarları')}
            >
              <Sliders size={11} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(parentStepId, tool.id, e);
              }}
              className="base-flowchart-action-btn is-danger"
              title={t('araci_kaldir', 'Aracı Kaldır')}
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      <div className="base-flowchart-tool-subnode-title">{tool.title}</div>

      {tool.toolCode && (
        <div className="base-flowchart-tool-subnode-code">
          <Wrench size={10} />
          <span>{tool.toolCode}</span>
        </div>
      )}

      {tool.summary && (
        <div className="base-flowchart-tool-subnode-summary" title={tool.summary}>
          {tool.summary}
        </div>
      )}
    </div>
  );
};

// ─── Geriye Dönük Uyumluluk: FlowchartNodeToolDock ────────────────────────────
export interface FlowchartNodeToolDockProps {
  parentStepId: string;
  tools?: FlowchartAttachedToolItem[];
  selectedToolId?: string | null;
  onAddTool?: (parentStepId: string, toolType?: string) => void;
  onSelectTool?: (parentStepId: string, toolId: string) => void;
  onDoubleClickTool?: (parentStepId: string, toolId: string) => void;
  onDeleteTool?: (parentStepId: string, toolId: string, e: React.MouseEvent) => void;
}

export const FlowchartNodeToolDock: React.FC<FlowchartNodeToolDockProps> = ({
  parentStepId,
  tools = [],
  selectedToolId,
  onAddTool,
  onSelectTool,
  onDoubleClickTool,
  onDeleteTool
}) => {
  const { t } = useTranslation();
  const hasTools = tools.length > 0;
  return (
    <div className={`base-flowchart-tool-dock ${hasTools ? 'has-tools' : 'is-empty'}`}>
      <div className="base-flowchart-tool-dock-stack">
        {tools.map((toolItem) => (
          <FlowchartToolSubNode
            key={toolItem.id}
            tool={toolItem}
            parentStepId={parentStepId}
            selected={selectedToolId === toolItem.id}
            onSelect={onSelectTool}
            onDoubleClick={onDoubleClickTool}
            onDelete={onDeleteTool}
          />
        ))}
        {onAddTool && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddTool(parentStepId, 'RAG_ARAC');
            }}
            className="base-flowchart-tool-attach-btn"
          >
            <Plus size={12} />
            <span>
              {hasTools ? t('arac_ekle_kisa', 'Araç Ekle') : t('rag_araci_bagla', 'RAG Aracı Bağla')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BaseFlowchartNode;
