/**
 * @akalin/ui - Temel Flowchart Düğüm Sınıfı ve Türetilmiş Flowchart Bileşenleri (BaseFlowchartNode.tsx)
 *
 * Başlıca Sorumlulukları:
 * - Tüm akış diyagramı (Flowchart) elemanları için ortak görsel, etkileşimsel ve yapısal temel sınıfı (BaseFlowchartNode) sunmak
 * - Bu temel sınıftan türeyen özelleşmiş standart Flowchart bileşenlerini sağlamak:
 *   1. FlowchartStartNode    : Başlangıç / Tetikleyici Kapsül (Terminal) Düğümü
 *   2. FlowchartInputNode    : Girdi / ERP Ekran Etkileşimi (Parallelogram) Düğümü
 *   3. FlowchartProcessNode  : Süreç / MCP Sorgu & İşlem (Process Box) Düğümü
 *   4. FlowchartDecisionNode : Karar / Onay (Baklava / Diamond + Gerçek Evet/Hayır SVG Çatallanma) Düğümü
 *   5. FlowchartDocumentNode : Belge / Taslak Oluşturma (Document) Düğümü
 *   6. FlowchartEndNode      : Bitiş / Tamamlama Kapsül (Terminal) Düğümü
 *   7. BaseFlowchartConnector: Düğümler arası gerçek SVG ok bağlantısı ve araya adım ekleme (+) düğmesi
 * - Sıfır inline CSS ve %100 i18n uyumlu çalışmak
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
  ArrowUp,
  ArrowDown,
  Trash2,
  ChevronRight,
  Sparkles,
  CornerDownRight,
  Sliders,
  Database,
  Code2,
  Wrench,
  Search
} from 'lucide-react';
import './BaseFlowchart.css';

export type FlowchartNodeShape = 'terminal' | 'process' | 'input' | 'decision' | 'document' | 'storage' | 'script' | 'tool';
export type FlowchartNodeVariant = 'start' | 'process' | 'input' | 'decision' | 'document' | 'end' | 'storage' | 'script' | 'tool';

export interface FlowchartAttachedToolItem {
  id: string;
  type: string;
  title: string;
  badgeText?: string;
  summary?: string;
  toolCode?: string;
  icon?: React.ReactNode;
}

export interface BaseFlowchartNodeProps {
  id: string;
  shape?: FlowchartNodeShape;
  variant?: FlowchartNodeVariant;
  stepNumber?: number | string;
  shapeBadgeText?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  promptPreview?: string;
  toolCode?: string;
  uiActionLabel?: string;
  routePath?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  showTopPort?: boolean;
  showBottomPort?: boolean;
  onSelect?: (id: string) => void;
  onDoubleClick?: (id: string, e: React.MouseEvent) => void;
  onMoveUp?: (e: React.MouseEvent) => void;
  onMoveDown?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Temel Flowchart Düğüm Bileşeni (Base Class / Component)
 * Diğer tüm standart akış diyagramı düğümleri bu bileşenden türetilir.
 */
export const BaseFlowchartNode: React.FC<BaseFlowchartNodeProps> = ({
  id,
  shape = 'process',
  variant = 'process',
  stepNumber,
  shapeBadgeText,
  title,
  subtitle,
  promptPreview,
  toolCode,
  uiActionLabel,
  routePath,
  icon,
  selected = false,
  isFirst = false,
  isLast = false,
  showTopPort = true,
  showBottomPort = true,
  onSelect,
  onDoubleClick,
  onMoveUp,
  onMoveDown,
  onDelete,
  children,
  className = ''
}) => {
  const { t } = useTranslation();

  const lastClickTimeRef = React.useRef<number>(0);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastClickTimeRef.current < 350) {
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
        className="base-flowchart-node-wrapper"
        onDoubleClick={handleDoubleClick}
      >
        {showTopPort && <div className="base-flowchart-port port-end" />}
        <div
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          className={`base-flowchart-node base-flowchart-node--terminal variant-${variant} ${selected ? 'is-selected' : ''} ${className}`}
          title={t('cift_tikla_duzenle', 'Düzenlemek için çift tıklayın')}
        >
          <div className="base-flowchart-terminal-left">
            <div className="base-flowchart-terminal-icon">
              {icon || (variant === 'start' ? <Play size={14} /> : <CheckCircle2 size={14} />)}
            </div>
            <div className="base-flowchart-terminal-texts">
              <span className="base-flowchart-terminal-label">
                {shapeBadgeText || (variant === 'start' ? t('flowchart_baslangic', 'BAŞLANGIÇ / TETİKLEYİCİ') : t('flowchart_bitis', 'AKIŞ SONU'))}
              </span>
              <span className="base-flowchart-terminal-title">{title}</span>
              {subtitle && <span className="base-flowchart-branch-target-sub">{subtitle}</span>}
            </div>
          </div>

          <div className="base-flowchart-terminal-right flex items-center gap-6">
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
            {selected && (
              <div className="base-flowchart-selected-indicator" title={t('secili_adim', 'Seçili Adım')}>
                <ChevronRight size={13} />
              </div>
            )}
          </div>
        </div>
        {showBottomPort && <div className="base-flowchart-port" />}
      </div>
    );
  }

  return (
    <div
      className="base-flowchart-node-wrapper"
      onDoubleClick={handleDoubleClick}
    >
      {showTopPort && (
        <div className={`base-flowchart-port ${shape === 'decision' ? 'port-decision' : ''}`} />
      )}

      {shape === 'decision' && (
        <div className="base-flowchart-diamond-crest" title={t('karar_onay_noktasi', 'Karar / Onay Noktası (Evet / Hayır)')}>
          <span className="base-flowchart-diamond-crest-icon">
            {icon || <GitBranch size={15} />}
          </span>
        </div>
      )}

      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={`base-flowchart-node base-flowchart-node--${shape} variant-${variant} ${selected ? 'is-selected' : ''} ${className}`}
        title={t('cift_tikla_duzenle', 'Düzenlemek için çift tıklayın')}
      >
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
          </div>

          {(onDoubleClick || onMoveUp || onMoveDown || onDelete) && (
            <div className="base-flowchart-node-actions" onClick={e => e.stopPropagation()}>
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
              {onMoveUp && (
                <button
                  type="button"
                  disabled={isFirst}
                  onClick={onMoveUp}
                  className="base-flowchart-action-btn"
                  title={t('yukari_tasi', 'Yukarı Taşı')}
                >
                  <ArrowUp size={12} />
                </button>
              )}
              {onMoveDown && (
                <button
                  type="button"
                  disabled={isLast}
                  onClick={onMoveDown}
                  className="base-flowchart-action-btn"
                  title={t('asagi_tasi', 'Aşağı Taşı')}
                >
                  <ArrowDown size={12} />
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

        <div className="base-flowchart-node-title">{title}</div>

        {(toolCode || (uiActionLabel && uiActionLabel !== 'YOK') || routePath) && (
          <div className="base-flowchart-node-tags">
            {toolCode && (
              <span className="base-flowchart-tag">
                <span>🛠️</span>
                <span>{toolCode}</span>
              </span>
            )}
            {uiActionLabel && uiActionLabel !== 'YOK' && (
              <span className="base-flowchart-tag">
                <span>🖥️</span>
                <span>{uiActionLabel}</span>
              </span>
            )}
            {routePath && (
              <span className="base-flowchart-tag">
                <span>🔗</span>
                <span>{routePath}</span>
              </span>
            )}
          </div>
        )}

        {promptPreview && (
          <div className="base-flowchart-node-prompt">
            {promptPreview}
          </div>
        )}

        {children}

        {selected && (
          <div className="base-flowchart-selected-indicator" title={t('secili_adim', 'Seçili Adım')}>
            <ChevronRight size={13} />
          </div>
        )}
      </div>

      {showBottomPort && (
        <div className={`base-flowchart-port ${shape === 'decision' ? 'port-decision' : ''}`} />
      )}
    </div>
  );
};

// ─── 1. Türetilmiş Bileşen: "Başla" Düğümü (Geleneksel Terminator / Oval) ────
export interface FlowchartStartNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> { }

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
      showTopPort={false}
      showBottomPort={true}
    />
  );
};

// ─── 2. Türetilmiş Bileşen: Girdi / ERP Ekran Açma Düğümü ────────────────────
export interface FlowchartInputNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> { }

export const FlowchartInputNode: React.FC<FlowchartInputNodeProps> = (props) => {
  const { t } = useTranslation();
  return (
    <BaseFlowchartNode
      {...props}
      shape="input"
      variant="input"
      icon={props.icon || <Monitor size={11} />}
      shapeBadgeText={props.shapeBadgeText || t('flowchart_girdi_ekran', 'Girdi / Ekran')}
    />
  );
};

// ─── 3. Türetilmiş Bileşen: Süreç / MCP Sorgu & İşlem Düğümü ─────────────────
export interface FlowchartProcessNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> { }

export const FlowchartProcessNode: React.FC<FlowchartProcessNodeProps> = (props) => {
  const { t } = useTranslation();
  return (
    <BaseFlowchartNode
      {...props}
      shape="process"
      variant="process"
      icon={props.icon || <Cpu size={11} />}
      shapeBadgeText={props.shapeBadgeText || t('flowchart_mcp_islem', 'MCP Sorgu / İşlem')}
    />
  );
};

// ─── 4. Türetilmiş Bileşen: Belge / Taslak Oluşturma Düğümü ──────────────────
export interface FlowchartDocumentNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> { }

export const FlowchartDocumentNode: React.FC<FlowchartDocumentNodeProps> = (props) => {
  const { t } = useTranslation();
  return (
    <BaseFlowchartNode
      {...props}
      shape="document"
      variant="document"
      icon={props.icon || <FileText size={11} />}
      shapeBadgeText={props.shapeBadgeText || t('flowchart_belge_olustur', 'Belge / Taslak Oluştur')}
    />
  );
};

// ─── 5. Türetilmiş Bileşen: Karar / Onay (Evet-Hayır Dallanmalı) Düğümü ───────
export interface FlowchartDecisionNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> {
  yesTargetId?: string;
  yesTargetTitle?: string;
  noTargetId?: string;
  noTargetTitle?: string;
  noFallbackRoute?: string;
  onSelectBranchTarget?: (targetId: string) => void;
}

export const FlowchartDecisionNode: React.FC<FlowchartDecisionNodeProps> = ({
  yesTargetId,
  yesTargetTitle,
  noTargetId,
  noTargetTitle,
  noFallbackRoute,
  onSelectBranchTarget,
  ...props
}) => {
  const { t } = useTranslation();

  return (
    <div className="base-flowchart-decision-container">
      <BaseFlowchartNode
        {...props}
        shape="decision"
        variant="decision"
        icon={props.icon || <GitBranch size={12} />}
        shapeBadgeText={props.shapeBadgeText || t('flowchart_karar_onay', 'Karar / Onay (E/H)')}
      />

      {/* Gerçek SVG EVET / HAYIR Çatallanma Diyagramı */}
      <div className="base-flowchart-decision-fork">
        <svg className="base-flowchart-fork-svg" viewBox="0 0 400 34" preserveAspectRatio="none">
          <path
            d="M 200 0 L 200 12 L 95 12 L 95 34"
            className="base-flowchart-fork-path-yes"
          />
          <path
            d="M 200 0 L 200 12 L 305 12 L 305 34"
            className="base-flowchart-fork-path-no"
          />
        </svg>

        <div className="base-flowchart-branches-row">
          {/* SOL KOL: EVET / ONAY DALI */}
          <div className="base-flowchart-branch-col">
            <span className="base-flowchart-branch-badge branch-yes">
              <span>🟢</span>
              <span>{t('evet_onay', 'EVET / ONAY')}</span>
            </span>
            <div
              className="base-flowchart-branch-card branch-yes"
              onClick={(e) => {
                e.stopPropagation();
                if (yesTargetId && onSelectBranchTarget) {
                  onSelectBranchTarget(yesTargetId);
                } else if (props.onSelect) {
                  props.onSelect(props.id);
                }
              }}
            >
              <div className="base-flowchart-branch-target-title">
                <CornerDownRight size={11} />
                <span>
                  {yesTargetTitle
                    ? yesTargetTitle
                    : t('sonraki_adima_gec', 'Sonraki Adıma İlerle')}
                </span>
              </div>
              <span className="base-flowchart-branch-target-sub">
                {yesTargetId ? `${t('hedef', 'Hedef')}: ${yesTargetId}` : t('tiklayip_hedef_secin', 'Sağ panelden hedef seçin')}
              </span>
            </div>
          </div>

          {/* SAĞ KOL: HAYIR / RED DALI */}
          <div className="base-flowchart-branch-col">
            <span className="base-flowchart-branch-badge branch-no">
              <span>🔴</span>
              <span>{t('hayir_red', 'HAYIR / RED')}</span>
            </span>
            <div
              className="base-flowchart-branch-card branch-no"
              onClick={(e) => {
                e.stopPropagation();
                if (noTargetId && onSelectBranchTarget) {
                  onSelectBranchTarget(noTargetId);
                } else if (props.onSelect) {
                  props.onSelect(props.id);
                }
              }}
            >
              <div className="base-flowchart-branch-target-title">
                <CornerDownRight size={11} />
                <span>
                  {noTargetTitle
                    ? noTargetTitle
                    : (noFallbackRoute ? t('ekrana_yonlendir', 'ERP Ekranı Aç') : t('alternatif_islem', 'Alternatif İşlem / Durdur'))}
                </span>
              </div>
              <span className="base-flowchart-branch-target-sub">
                {noTargetId
                  ? `${t('hedef', 'Hedef')}: ${noTargetId}`
                  : (noFallbackRoute || t('tiklayip_hedef_secin', 'Sağ panelden hedef seçin'))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── 6. Türetilmiş Bileşen: Hafıza / Veri Depolama Düğümü ────────────────────
export interface FlowchartStorageNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> { }

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

// ─── 7. Türetilmiş Bileşen: Script İşlemi (JavaScript) Düğümü ────────────────
export interface FlowchartScriptNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> { }

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

// ─── 8. Türetilmiş Bileşen: Bitiş / Tamamlama Düğümü ─────────────────────────
export interface FlowchartEndNodeProps extends Omit<BaseFlowchartNodeProps, 'shape' | 'variant'> { }

export const FlowchartEndNode: React.FC<FlowchartEndNodeProps> = (props) => {
  const { t } = useTranslation();
  return (
    <BaseFlowchartNode
      {...props}
      shape="terminal"
      variant="end"
      icon={props.icon || <Sparkles size={13} />}
      shapeBadgeText={props.shapeBadgeText || t('flowchart_akis_sonu', 'AKIŞ SONU')}
      showTopPort={true}
      showBottomPort={false}
    />
  );
};

// ─── 7. Düğümler Arası Gerçek SVG Bağlantı Oku ve Araya Adım Ekleme (+) ──────
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
        <line
          x1="12"
          y1="0"
          x2="12"
          y2="38"
          className="base-flowchart-connector-line"
        />
        <polygon
          points="7,36 17,36 12,45"
          className="base-flowchart-connector-arrow"
        />
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
          <span className="base-flowchart-insert-label">
            {t('adim_ekle_kisa', 'Adım Ekle')}
          </span>
        </button>
      )}
    </div>
  );
};

// ─── 9. Türetilmiş Bileşen: AI İşlemi Bağlı Araç Alt Düğümü (Tool Sub-Node) ───
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
    if (now - lastClickRef.current < 350) {
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
      className={`base-flowchart-tool-subnode ${selected ? 'is-selected' : ''}`}
      title={t('cift_tikla_arac_duzenle', 'Araç ayarlarını yapılandırmak için çift tıklayın')}
    >
      <div className="base-flowchart-tool-subnode-port" />
      <div className="base-flowchart-tool-subnode-header">
        <span className="base-flowchart-tool-subnode-badge">
          {tool.icon || <Search size={11} />}
          <span>{tool.badgeText || t('ai_arac_dugumu', 'AI Aracı')}</span>
        </span>
        <div className="base-flowchart-node-actions" onClick={(e) => e.stopPropagation()}>
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
        <div className="base-flowchart-tool-subnode-summary">{tool.summary}</div>
      )}
    </div>
  );
};

// ─── 10. AI İşlemi Araç Bağlantı İstasyonu (Tool Dock / Sub-Node Port) ────────
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
      <div className="base-flowchart-tool-link-row">
        <div className="base-flowchart-tool-port-dot" title={t('bagli_ai_araclari', 'Bağlı AI Araçları (Tools)')} />
        <svg className="base-flowchart-tool-link-svg" viewBox="0 0 36 16" preserveAspectRatio="none">
          <line x1="0" y1="8" x2="30" y2="8" className="base-flowchart-tool-link-line" />
          <polygon points="28,4 36,8 28,12" className="base-flowchart-tool-link-arrow" />
        </svg>
      </div>

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
            title={t('ai_islemine_rag_araci_ekle', 'Bu AI İşlemi düğümüne RAG Sorgu Aracı bağla')}
          >
            <Plus size={12} />
            <span>
              {hasTools
                ? t('arac_ekle_kisa', 'Araç Ekle')
                : t('rag_araci_bagla', 'RAG Aracı Bağla')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default BaseFlowchartNode;
