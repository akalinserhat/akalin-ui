/**
 * @akalin/ui - n8n Tarzı 2B Serbest Konumlandırılabilir Akış Diyagramı Tuvali (BaseFlowchart.tsx)
 *
 * Başlıca Sorumlulukları:
 * - Noktalı (blueprint dot-grid) 2 boyutlu interaktif serbest çizim tuvalini (Pan, Zoom, Grid Snap) sunmak
 * - Sol Giriş -> Sağ Çıkış + Alt Tool Portu mimarisiyle düğümleri ve alt araç düğümlerini serbest konumlandırmak
 * - Düğüm hareketlerine anlık uyum sağlayan dinamik Cubic Bezier SVG bağlantı motorunu çalıştırmak
 * - Çıkış portlarından sürükleyerek yeni bağlantı çekme, bağlantı koparma ve otomatik topolojik hizalama (Auto-Layout) sunmak
 * - Sıfır statik inline CSS ve %100 i18n uyumlu çalışmak
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GitBranch,
  Play,
  Monitor,
  Cpu,
  Database,
  Code2,
  FileText,
  Layers,
  Wrench,
  Plus,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  LayoutGrid
} from 'lucide-react';
import {
  BaseFlowchartNode,
  FlowchartToolSubNode,
  type FlowchartNodeShape,
  type FlowchartAttachedToolItem,
  type FlowchartPoint,
  type FlowchartConnectionBranch
} from './BaseFlowchartNode';
import './BaseFlowchart.css';

const GRID_SIZE = 16;
const DEFAULT_NODE_WIDTH = 276;
const DEFAULT_TERMINAL_WIDTH = 248;
const DEFAULT_NODE_HEIGHT = 114;
const DEFAULT_TOOL_WIDTH = 224;
const DEFAULT_TOOL_HEIGHT = 96;
const H_SPACING = 352;
const V_SPACING = 196;

const snapToGrid = (value: number): number =>
  Math.max(24, Math.round(value / GRID_SIZE) * GRID_SIZE);

export interface FlowchartStepItem {
  id: string;
  type?: string;
  title: string;
  shapeBadgeText?: string;
  summaryText?: string;
  warningText?: string;
  inactive?: boolean;
  prompt?: string;
  toolCode?: string;
  uiAction?: string;
  uiActionLabel?: string;
  routePath?: string;
  nextStepId?: string;
  yesStepId?: string;
  noStepId?: string;
  position?: FlowchartPoint;
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
  onAddStep?: (
    stepType: string,
    insertAtIndex?: number,
    position?: FlowchartPoint,
    connectFrom?: { sourceId: string; branch: FlowchartConnectionBranch; previousTargetId?: string }
  ) => void;
  onMoveStep?: (index: number, direction: 'up' | 'down', e?: React.MouseEvent) => void;
  onDeleteStep?: (stepId: string, e?: React.MouseEvent) => void;
  onNodePositionChange?: (stepId: string, position: FlowchartPoint) => void;
  onToolPositionChange?: (parentStepId: string, toolId: string, position: FlowchartPoint) => void;
  onAutoLayout?: (
    nodePositions: Record<string, FlowchartPoint>,
    toolPositions: Record<string, FlowchartPoint>
  ) => void;
  onConnectSteps?: (
    sourceId: string,
    targetId: string,
    branch: FlowchartConnectionBranch
  ) => void;
  onDisconnectSteps?: (sourceId: string, branch: FlowchartConnectionBranch) => void;
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

interface ComputedEdge {
  id: string;
  sourceId: string;
  targetId: string;
  branch: FlowchartConnectionBranch;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  path: string;
  midX: number;
  midY: number;
}

interface ComputedToolEdge {
  id: string;
  parentStepId: string;
  toolId: string;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  path: string;
}

function buildHorizontalBezier(
  sx: number,
  sy: number,
  tx: number,
  ty: number
): { path: string; midX: number; midY: number } {
  if (tx >= sx - 16) {
    const dx = Math.max(72, Math.abs(tx - sx) * 0.46);
    const c1x = sx + dx;
    const c1y = sy;
    const c2x = tx - dx;
    const c2y = ty;
    const midX = 0.125 * sx + 0.375 * c1x + 0.375 * c2x + 0.125 * tx;
    const midY = 0.125 * sy + 0.375 * c1y + 0.375 * c2y + 0.125 * ty;
    return {
      path: `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`,
      midX,
      midY
    };
  }

  // Hedef düğüm kaynağın soluna taşınmışsa geri dönüş S-eğrisi
  const loopOffset = 110;
  const verticalArc = sy <= ty ? Math.max(sy, ty) + 110 : Math.min(sy, ty) - 110;
  const c1x = sx + loopOffset;
  const c1y = verticalArc;
  const c2x = tx - loopOffset;
  const c2y = verticalArc;
  const midX = 0.125 * sx + 0.375 * c1x + 0.375 * c2x + 0.125 * tx;
  const midY = 0.125 * sy + 0.375 * c1y + 0.375 * c2y + 0.125 * ty;
  return {
    path: `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`,
    midX,
    midY
  };
}

function buildVerticalToolBezier(sx: number, sy: number, tx: number, ty: number): string {
  const dy = Math.max(32, Math.abs(ty - sy) * 0.5);
  return `M ${sx} ${sy} C ${sx} ${sy + dy}, ${tx} ${ty - dy}, ${tx} ${ty}`;
}

/**
 * Soldan sağa topolojik yerleşim (n8n Auto-Layout) hesaplayıcısı.
 * Koordinatı olmayan mevcut akışlar için de otomatik olarak kullanılır.
 */
export function computeAutoLayoutPositions(steps: FlowchartStepItem[]): {
  nodePositions: Record<string, FlowchartPoint>;
  toolPositions: Record<string, FlowchartPoint>;
} {
  const nodePositions: Record<string, FlowchartPoint> = {};
  const toolPositions: Record<string, FlowchartPoint> = {};
  if (!steps || steps.length === 0) {
    return { nodePositions, toolPositions };
  }

  const byId = new Map<string, FlowchartStepItem>();
  steps.forEach((s) => byId.set(s.id, s));

  const startStep =
    steps.find((s) => s.type === 'BASLA' || s.type === 'START' || s.id === 'BASLA') || steps[0];

  const colOf = new Map<string, number>();
  const rowOf = new Map<string, number>();
  const occupied = new Set<string>();

  const reserveSlot = (col: number, preferredRow: number): number => {
    let r = preferredRow;
    let delta = 0;
    while (occupied.has(`${col}:${r}`)) {
      delta += 1;
      r = delta % 2 === 1 ? preferredRow + Math.ceil(delta / 2) : preferredRow - Math.ceil(delta / 2);
    }
    occupied.add(`${col}:${r}`);
    return r;
  };

  const queue: Array<{ id: string; col: number; row: number }> = [
    { id: startStep.id, col: 0, row: 0 }
  ];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr.id)) continue;
    const item = byId.get(curr.id);
    if (!item) continue;
    visited.add(curr.id);

    const assignedRow = reserveSlot(curr.col, curr.row);
    colOf.set(curr.id, curr.col);
    rowOf.set(curr.id, assignedRow);

    if (item.type === 'KARAR_ONAY') {
      if (item.yesStepId && byId.has(item.yesStepId) && !visited.has(item.yesStepId)) {
        queue.push({ id: item.yesStepId, col: curr.col + 1, row: assignedRow - 0.75 });
      }
      if (item.noStepId && byId.has(item.noStepId) && !visited.has(item.noStepId)) {
        queue.push({ id: item.noStepId, col: curr.col + 1, row: assignedRow + 0.75 });
      }
    } else if (item.nextStepId && byId.has(item.nextStepId) && !visited.has(item.nextStepId)) {
      queue.push({ id: item.nextStepId, col: curr.col + 1, row: assignedRow });
    }
  }

  // Bağlantısız (serbest) kalan düğümleri alt satırlara yerleştir
  let disconnectedCol = 1;
  steps.forEach((s) => {
    if (!visited.has(s.id)) {
      const assignedRow = reserveSlot(disconnectedCol, 2);
      colOf.set(s.id, disconnectedCol);
      rowOf.set(s.id, assignedRow);
      disconnectedCol += 1;
    }
  });

  const rows = Array.from(rowOf.values());
  const minRow = rows.length > 0 ? Math.min(...rows) : 0;
  const baseY = 144 - minRow * V_SPACING;

  steps.forEach((s) => {
    const c = colOf.get(s.id) ?? 0;
    const r = rowOf.get(s.id) ?? 0;
    const nx = snapToGrid(64 + c * H_SPACING);
    const ny = snapToGrid(baseY + r * V_SPACING);
    nodePositions[s.id] = { x: nx, y: ny };

    if (Array.isArray(s.attachedTools) && s.attachedTools.length > 0) {
      const totalWidth =
        s.attachedTools.length * DEFAULT_TOOL_WIDTH + (s.attachedTools.length - 1) * 20;
      const startX = nx + (DEFAULT_NODE_WIDTH - totalWidth) / 2;
      s.attachedTools.forEach((tool, idx) => {
        toolPositions[tool.id] = {
          x: snapToGrid(startX + idx * (DEFAULT_TOOL_WIDTH + 20)),
          y: snapToGrid(ny + DEFAULT_NODE_HEIGHT + 76)
        };
      });
    }
  });

  return { nodePositions, toolPositions };
}

export const BaseFlowchart: React.FC<BaseFlowchartProps> = ({
  title,
  showHeader = false,
  fit = false,
  showSidebar = true,
  sidebar,
  paletteItems,
  steps = [],
  selectedStepId,
  selectedToolId,
  onSelectStep,
  onDoubleClickStep,
  onAddStep,
  onDeleteStep,
  onNodePositionChange,
  onToolPositionChange,
  onAutoLayout,
  onConnectSteps,
  onDisconnectSteps,
  onAddToolToStep,
  onSelectTool,
  onDoubleClickTool,
  onDeleteTool,
  className = '',
  initialZoom = 1,
  minZoom = 0.45,
  maxZoom = 1.8,
  showZoomControls = true,
  children
}) => {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [isWheelZooming, setIsWheelZooming] = useState<boolean>(false);
  const zoomRef = useRef<number>(zoom);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasSurfaceRef = useRef<HTMLDivElement>(null);
  const nodeDomRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const rafIdRef = useRef<number | null>(null);
  const wheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [nodeSizes, setNodeSizes] = useState<Record<string, { w: number; h: number }>>({});
  const [localNodePositions, setLocalNodePositions] = useState<Record<string, FlowchartPoint>>({});
  const [localToolPositions, setLocalToolPositions] = useState<Record<string, FlowchartPoint>>({});

  // Aktif sürükleme durumları (Düğüm taşıma, Alt Araç taşıma, Tuval Pan, Porttan bağlantı çizme)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [draggingToolKey, setDraggingToolKey] = useState<{
    parentStepId: string;
    toolId: string;
  } | null>(null);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const dragOriginRef = useRef<{
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
    moved: boolean;
    attachedToolSnapshot?: Record<string, FlowchartPoint>;
  } | null>(null);
  const panOriginRef = useRef<{
    pointerX: number;
    pointerY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  const [connectionDraft, setConnectionDraft] = useState<{
    sourceId: string;
    branch: FlowchartConnectionBranch;
    sx: number;
    sy: number;
    currX: number;
    currY: number;
    hoveredTargetId: string | null;
  } | null>(null);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    if (draggingNodeId) return;
    setLocalNodePositions((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      const next = { ...prev };
      let mutated = false;
      steps.forEach((s) => {
        if (
          s.position &&
          typeof s.position.x === 'number' &&
          typeof s.position.y === 'number' &&
          next[s.id]
        ) {
          delete next[s.id];
          mutated = true;
        }
      });
      return mutated ? next : prev;
    });
  }, [steps, draggingNodeId]);

  useEffect(() => {
    if (draggingToolKey) return;
    setLocalToolPositions((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      const next = { ...prev };
      let mutated = false;
      steps.forEach((s) => {
        (s.attachedTools || []).forEach((tItem) => {
          if (
            tItem.position &&
            typeof tItem.position.x === 'number' &&
            typeof tItem.position.y === 'number' &&
            next[tItem.id]
          ) {
            delete next[tItem.id];
            mutated = true;
          }
        });
      });
      return mutated ? next : prev;
    });
  }, [steps, draggingToolKey]);

  // Otomatik yerleşim tabanı (koordinatı kayıtlı olmayan düğümler için)
  const autoLayoutDefaults = useMemo(() => computeAutoLayoutPositions(steps), [steps]);

  // Efektif düğüm koordinatları (önce yerel anlık sürükleme -> sonra kayıtlı prop pozisyonu -> sonra Auto-Layout)
  const effectiveNodePositions = useMemo<Record<string, FlowchartPoint>>(() => {
    const map: Record<string, FlowchartPoint> = {};
    steps.forEach((step) => {
      if (localNodePositions[step.id]) {
        map[step.id] = localNodePositions[step.id];
      } else if (
        step.position &&
        typeof step.position.x === 'number' &&
        typeof step.position.y === 'number'
      ) {
        map[step.id] = step.position;
      } else {
        map[step.id] = autoLayoutDefaults.nodePositions[step.id] || { x: 80, y: 144 };
      }
    });
    return map;
  }, [steps, localNodePositions, autoLayoutDefaults.nodePositions]);

  // Efektif alt araç koordinatları
  const effectiveToolPositions = useMemo<Record<string, FlowchartPoint>>(() => {
    const map: Record<string, FlowchartPoint> = {};
    steps.forEach((step) => {
      const parentPos = effectiveNodePositions[step.id] || { x: 80, y: 144 };
      const parentSize = nodeSizes[step.id] || {
        w: DEFAULT_NODE_WIDTH,
        h: DEFAULT_NODE_HEIGHT
      };
      (step.attachedTools || []).forEach((tool, idx) => {
        if (localToolPositions[tool.id]) {
          map[tool.id] = localToolPositions[tool.id];
        } else if (
          tool.position &&
          typeof tool.position.x === 'number' &&
          typeof tool.position.y === 'number'
        ) {
          map[tool.id] = tool.position;
        } else if (autoLayoutDefaults.toolPositions[tool.id]) {
          map[tool.id] = autoLayoutDefaults.toolPositions[tool.id];
        } else {
          map[tool.id] = {
            x: snapToGrid(parentPos.x + idx * (DEFAULT_TOOL_WIDTH + 20)),
            y: snapToGrid(parentPos.y + parentSize.h + 72)
          };
        }
      });
    });
    return map;
  }, [steps, effectiveNodePositions, localToolPositions, autoLayoutDefaults.toolPositions, nodeSizes]);

  // Düğüm DOM boyutlarını ölç (port merkezlerinin milimetrik hizalanması için)
  useEffect(() => {
    const nextSizes: Record<string, { w: number; h: number }> = {};
    let changed = false;

    steps.forEach((step) => {
      const el = nodeDomRefs.current[step.id];
      if (el) {
        const w = el.offsetWidth || DEFAULT_NODE_WIDTH;
        const h = el.offsetHeight || DEFAULT_NODE_HEIGHT;
        const prev = nodeSizes[step.id];
        if (!prev || Math.abs(prev.w - w) > 1 || Math.abs(prev.h - h) > 1) {
          changed = true;
        }
        nextSizes[step.id] = { w, h };
      }
    });

    if (changed) {
      setNodeSizes((prev) => ({ ...prev, ...nextSizes }));
    }
  }, [steps, nodeSizes]);

  // Tuval çalışma alanı genişlik/yükseklik hesabı (dinamik genişleyen sonsuz tuval)
  const canvasDimensions = useMemo(() => {
    let maxX = 1280;
    let maxY = 720;
    Object.values(effectiveNodePositions).forEach((p) => {
      if (p.x + 480 > maxX) maxX = p.x + 480;
      if (p.y + 360 > maxY) maxY = p.y + 360;
    });
    Object.values(effectiveToolPositions).forEach((p) => {
      if (p.x + 380 > maxX) maxX = p.x + 380;
      if (p.y + 260 > maxY) maxY = p.y + 260;
    });
    return { width: maxX, height: maxY };
  }, [effectiveNodePositions, effectiveToolPositions]);

  // Port koordinat yardımcıları
  const getOutputPortCoords = useCallback(
    (step: FlowchartStepItem, branch: FlowchartConnectionBranch): FlowchartPoint => {
      const pos = effectiveNodePositions[step.id] || { x: 80, y: 144 };
      const isBasla = step.type === 'BASLA' || step.type === 'START';
      const size = nodeSizes[step.id] || {
        w: isBasla ? DEFAULT_TERMINAL_WIDTH : DEFAULT_NODE_WIDTH,
        h: isBasla ? 68 : DEFAULT_NODE_HEIGHT
      };
      if (step.type === 'KARAR_ONAY') {
        const ratio = branch === 'yes' ? 0.38 : 0.72;
        return { x: pos.x + size.w, y: pos.y + size.h * ratio };
      }
      return { x: pos.x + size.w, y: pos.y + size.h * 0.5 };
    },
    [effectiveNodePositions, nodeSizes]
  );

  const getInputPortCoords = useCallback(
    (step: FlowchartStepItem): FlowchartPoint => {
      const pos = effectiveNodePositions[step.id] || { x: 80, y: 144 };
      const size = nodeSizes[step.id] || { w: DEFAULT_NODE_WIDTH, h: DEFAULT_NODE_HEIGHT };
      return { x: pos.x, y: pos.y + size.h * 0.5 };
    },
    [effectiveNodePositions, nodeSizes]
  );

  // Ana akış SVG bağlantıları (Sol -> Sağ Cubic Bezier)
  const computedEdges = useMemo<ComputedEdge[]>(() => {
    const byId = new Map<string, FlowchartStepItem>();
    steps.forEach((s) => byId.set(s.id, s));
    const list: ComputedEdge[] = [];

    steps.forEach((step) => {
      if (step.type === 'KARAR_ONAY') {
        if (step.yesStepId && byId.has(step.yesStepId)) {
          const target = byId.get(step.yesStepId)!;
          const outPt = getOutputPortCoords(step, 'yes');
          const inPt = getInputPortCoords(target);
          const bez = buildHorizontalBezier(outPt.x, outPt.y, inPt.x, inPt.y);
          list.push({
            id: `${step.id}__yes__${target.id}`,
            sourceId: step.id,
            targetId: target.id,
            branch: 'yes',
            sx: outPt.x,
            sy: outPt.y,
            tx: inPt.x,
            ty: inPt.y,
            path: bez.path,
            midX: bez.midX,
            midY: bez.midY
          });
        }
        if (step.noStepId && byId.has(step.noStepId)) {
          const target = byId.get(step.noStepId)!;
          const outPt = getOutputPortCoords(step, 'no');
          const inPt = getInputPortCoords(target);
          const bez = buildHorizontalBezier(outPt.x, outPt.y, inPt.x, inPt.y);
          list.push({
            id: `${step.id}__no__${target.id}`,
            sourceId: step.id,
            targetId: target.id,
            branch: 'no',
            sx: outPt.x,
            sy: outPt.y,
            tx: inPt.x,
            ty: inPt.y,
            path: bez.path,
            midX: bez.midX,
            midY: bez.midY
          });
        }
      } else if (step.nextStepId && byId.has(step.nextStepId)) {
        const target = byId.get(step.nextStepId)!;
        const outPt = getOutputPortCoords(step, 'next');
        const inPt = getInputPortCoords(target);
        const bez = buildHorizontalBezier(outPt.x, outPt.y, inPt.x, inPt.y);
        list.push({
          id: `${step.id}__next__${target.id}`,
          sourceId: step.id,
          targetId: target.id,
          branch: 'next',
          sx: outPt.x,
          sy: outPt.y,
          tx: inPt.x,
          ty: inPt.y,
          path: bez.path,
          midX: bez.midX,
          midY: bez.midY
        });
      }
    });

    return list;
  }, [steps, getOutputPortCoords, getInputPortCoords]);

  // Alt Araç (Tool Sub-Node) SVG bağlantıları (AI İşlemi Alt Port -> Tool Üst Port)
  const computedToolEdges = useMemo<ComputedToolEdge[]>(() => {
    const list: ComputedToolEdge[] = [];
    steps.forEach((step) => {
      if (!step.attachedTools || step.attachedTools.length === 0) return;
      const parentPos = effectiveNodePositions[step.id] || { x: 80, y: 144 };
      const parentSize = nodeSizes[step.id] || {
        w: DEFAULT_NODE_WIDTH,
        h: DEFAULT_NODE_HEIGHT
      };
      const sx = parentPos.x + parentSize.w * 0.5;
      const sy = parentPos.y + parentSize.h;

      step.attachedTools.forEach((tool) => {
        const tPos = effectiveToolPositions[tool.id] || {
          x: parentPos.x,
          y: parentPos.y + parentSize.h + 72
        };
        const tx = tPos.x + DEFAULT_TOOL_WIDTH * 0.5;
        const ty = tPos.y;
        list.push({
          id: `tool_edge_${step.id}_${tool.id}`,
          parentStepId: step.id,
          toolId: tool.id,
          sx,
          sy,
          tx,
          ty,
          path: buildVerticalToolBezier(sx, sy, tx, ty)
        });
      });
    });
    return list;
  }, [steps, effectiveNodePositions, effectiveToolPositions, nodeSizes]);

  // Client koordinatını tuval koordinatına çevir
  const clientToCanvasPoint = useCallback((clientX: number, clientY: number): FlowchartPoint => {
    const surface = canvasSurfaceRef.current;
    const currentZoom = zoomRef.current || 1;
    if (!surface) return { x: 80, y: 144 };
    const rect = surface.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / currentZoom,
      y: (clientY - rect.top) / currentZoom
    };
  }, []);

  // Ana düğüm sürükleme başlat
  const handleNodePointerDown = useCallback(
    (step: FlowchartStepItem, e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const targetEl = e.target as HTMLElement;
      if (targetEl.closest('button') || targetEl.closest('.base-flowchart-handle')) {
        return;
      }
      e.stopPropagation();
      const startPos = effectiveNodePositions[step.id] || { x: 80, y: 144 };
      const toolSnapshot: Record<string, FlowchartPoint> = {};
      (step.attachedTools || []).forEach((tItem) => {
        if (effectiveToolPositions[tItem.id]) {
          toolSnapshot[tItem.id] = { ...effectiveToolPositions[tItem.id] };
        }
      });

      dragOriginRef.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        startX: startPos.x,
        startY: startPos.y,
        moved: false,
        attachedToolSnapshot: toolSnapshot
      };
      setDraggingNodeId(step.id);
    },
    [effectiveNodePositions, effectiveToolPositions]
  );

  // Alt araç düğümü sürükleme başlat
  const handleToolPointerDown = useCallback(
    (parentStepId: string, toolId: string, e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const targetEl = e.target as HTMLElement;
      if (targetEl.closest('button')) return;
      e.stopPropagation();
      const startPos = effectiveToolPositions[toolId] || { x: 80, y: 320 };
      dragOriginRef.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        startX: startPos.x,
        startY: startPos.y,
        moved: false
      };
      setDraggingToolKey({ parentStepId, toolId });
    },
    [effectiveToolPositions]
  );

  // Çıkış portundan bağlantı çizimi başlat
  const handleStartConnection = useCallback(
    (
      sourceId: string,
      branch: FlowchartConnectionBranch,
      e: React.PointerEvent<HTMLButtonElement>
    ) => {
      e.preventDefault();
      e.stopPropagation();
      const sourceStep = steps.find((s) => s.id === sourceId);
      if (!sourceStep) return;
      const startPt = getOutputPortCoords(sourceStep, branch);
      const currPt = clientToCanvasPoint(e.clientX, e.clientY);
      setConnectionDraft({
        sourceId,
        branch,
        sx: startPt.x,
        sy: startPt.y,
        currX: currPt.x,
        currY: currPt.y,
        hoveredTargetId: null
      });
    },
    [steps, getOutputPortCoords, clientToCanvasPoint]
  );

  // Boş tuval alanında Pan başlat
  const handleStagePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const targetEl = e.target as HTMLElement;
    if (
      targetEl.closest('.base-flowchart-canvas-node') ||
      targetEl.closest('.base-flowchart-canvas-tool') ||
      targetEl.closest('.base-flowchart-edge-controls') ||
      targetEl.closest('button')
    ) {
      return;
    }
    const stageEl = stageRef.current;
    if (!stageEl) return;
    panOriginRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      scrollLeft: stageEl.scrollLeft,
      scrollTop: stageEl.scrollTop
    };
    setIsPanning(true);
  }, []);

  // Global PointerMove & PointerUp dinleyicileri
  useEffect(() => {
    if (!draggingNodeId && !draggingToolKey && !connectionDraft && !isPanning) {
      return;
    }

    const handleWindowPointerMove = (e: PointerEvent) => {
      const currentZoom = zoomRef.current || 1;

      if (draggingNodeId && dragOriginRef.current) {
        const dx = (e.clientX - dragOriginRef.current.pointerX) / currentZoom;
        const dy = (e.clientY - dragOriginRef.current.pointerY) / currentZoom;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          dragOriginRef.current.moved = true;
        }
        const nextPos = {
          x: snapToGrid(dragOriginRef.current.startX + dx),
          y: snapToGrid(dragOriginRef.current.startY + dy)
        };
        setLocalNodePositions((prev) => ({ ...prev, [draggingNodeId]: nextPos }));

        const toolSnap = dragOriginRef.current.attachedToolSnapshot;
        if (toolSnap && Object.keys(toolSnap).length > 0) {
          const movedTools: Record<string, FlowchartPoint> = {};
          Object.entries(toolSnap).forEach(([tId, orig]) => {
            movedTools[tId] = {
              x: snapToGrid(orig.x + dx),
              y: snapToGrid(orig.y + dy)
            };
          });
          setLocalToolPositions((prev) => ({ ...prev, ...movedTools }));
        }
        return;
      }

      if (draggingToolKey && dragOriginRef.current) {
        const dx = (e.clientX - dragOriginRef.current.pointerX) / currentZoom;
        const dy = (e.clientY - dragOriginRef.current.pointerY) / currentZoom;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          dragOriginRef.current.moved = true;
        }
        const nextPos = {
          x: snapToGrid(dragOriginRef.current.startX + dx),
          y: snapToGrid(dragOriginRef.current.startY + dy)
        };
        setLocalToolPositions((prev) => ({ ...prev, [draggingToolKey.toolId]: nextPos }));
        return;
      }

      if (connectionDraft) {
        const pt = clientToCanvasPoint(e.clientX, e.clientY);
        let hoveredId: string | null = null;

        for (const s of steps) {
          if (s.id === connectionDraft.sourceId) continue;
          if (s.type === 'BASLA' || s.type === 'START') continue;
          const pos = effectiveNodePositions[s.id];
          const size = nodeSizes[s.id] || { w: DEFAULT_NODE_WIDTH, h: DEFAULT_NODE_HEIGHT };
          if (!pos) continue;
          const withinBox =
            pt.x >= pos.x - 28 &&
            pt.x <= pos.x + size.w * 0.65 &&
            pt.y >= pos.y - 16 &&
            pt.y <= pos.y + size.h + 16;
          if (withinBox) {
            hoveredId = s.id;
            break;
          }
        }

        setConnectionDraft((prev) =>
          prev
            ? {
                ...prev,
                currX: pt.x,
                currY: pt.y,
                hoveredTargetId: hoveredId
              }
            : null
        );
        return;
      }

      if (isPanning && panOriginRef.current && stageRef.current) {
        const dx = e.clientX - panOriginRef.current.pointerX;
        const dy = e.clientY - panOriginRef.current.pointerY;
        stageRef.current.scrollLeft = panOriginRef.current.scrollLeft - dx;
        stageRef.current.scrollTop = panOriginRef.current.scrollTop - dy;
      }
    };

    const handleWindowPointerUp = () => {
      if (draggingNodeId) {
        const finalPos = localNodePositions[draggingNodeId] || effectiveNodePositions[draggingNodeId];
        if (dragOriginRef.current?.moved && finalPos && onNodePositionChange) {
          onNodePositionChange(draggingNodeId, finalPos);
          const snapTools = dragOriginRef.current.attachedToolSnapshot;
          if (snapTools && onToolPositionChange) {
            Object.keys(snapTools).forEach((tId) => {
              const finalToolPos = localToolPositions[tId];
              if (finalToolPos) {
                onToolPositionChange(draggingNodeId, tId, finalToolPos);
              }
            });
          }
        }
        setDraggingNodeId(null);
        dragOriginRef.current = null;
      }

      if (draggingToolKey) {
        const finalToolPos =
          localToolPositions[draggingToolKey.toolId] ||
          effectiveToolPositions[draggingToolKey.toolId];
        if (dragOriginRef.current?.moved && finalToolPos && onToolPositionChange) {
          onToolPositionChange(draggingToolKey.parentStepId, draggingToolKey.toolId, finalToolPos);
        }
        setDraggingToolKey(null);
        dragOriginRef.current = null;
      }

      if (connectionDraft) {
        if (connectionDraft.hoveredTargetId && onConnectSteps) {
          onConnectSteps(
            connectionDraft.sourceId,
            connectionDraft.hoveredTargetId,
            connectionDraft.branch
          );
        }
        setConnectionDraft(null);
      }

      if (isPanning) {
        setIsPanning(false);
        panOriginRef.current = null;
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [
    draggingNodeId,
    draggingToolKey,
    connectionDraft,
    isPanning,
    steps,
    localNodePositions,
    localToolPositions,
    effectiveNodePositions,
    effectiveToolPositions,
    nodeSizes,
    clientToCanvasPoint,
    onNodePositionChange,
    onToolPositionChange,
    onConnectSteps
  ]);

  // Otomatik Hizala (Auto-Layout) aksiyonu
  const handleTriggerAutoLayout = useCallback(() => {
    const computed = computeAutoLayoutPositions(steps);
    setLocalNodePositions(computed.nodePositions);
    setLocalToolPositions(computed.toolPositions);
    if (onAutoLayout) {
      onAutoLayout(computed.nodePositions, computed.toolPositions);
    } else if (onNodePositionChange) {
      Object.entries(computed.nodePositions).forEach(([sId, pt]) => {
        onNodePositionChange(sId, pt);
      });
    }
    if (stageRef.current) {
      stageRef.current.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    }
  }, [steps, onAutoLayout, onNodePositionChange]);

  // Zoom Kontrolleri
  const handleZoomIn = useCallback(() => {
    setIsWheelZooming(false);
    setZoom((prev) => Math.min(maxZoom, Math.round((prev + 0.1) * 10) / 10));
  }, [maxZoom]);

  const handleZoomOut = useCallback(() => {
    setIsWheelZooming(false);
    setZoom((prev) => Math.max(minZoom, Math.round((prev - 0.1) * 10) / 10));
  }, [minZoom]);

  const handleZoomReset = useCallback(() => {
    setIsWheelZooming(false);
    setZoom(1);
    if (stageRef.current) {
      stageRef.current.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return;

    const onWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setIsWheelZooming(true);
        if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
        wheelTimeoutRef.current = setTimeout(() => setIsWheelZooming(false), 160);

        const factor = Math.exp(-e.deltaY * 0.0015);
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

  // Sol Paletten Sürükle-Bırak (Drag & Drop) Desteği
  const handleCanvasDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes('application/x-webakus-flowchart-type')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const droppedType = e.dataTransfer.getData('application/x-webakus-flowchart-type');
      const droppedCategory = e.dataTransfer.getData('application/x-webakus-flowchart-category');
      if (!droppedType) return;
      e.preventDefault();

      const dropPt = clientToCanvasPoint(e.clientX, e.clientY);

      if (droppedCategory === 'tool') {
        const aiNodes = steps.filter((s) => s.supportsTools || s.type === 'AI_ISLEM');
        let nearestAi: FlowchartStepItem | undefined;
        let minDist = Number.POSITIVE_INFINITY;
        aiNodes.forEach((ai) => {
          const p = effectiveNodePositions[ai.id] || { x: 0, y: 0 };
          const d = Math.hypot(p.x + 140 - dropPt.x, p.y + 60 - dropPt.y);
          if (d < minDist) {
            minDist = d;
            nearestAi = ai;
          }
        });
        if (nearestAi && onAddToolToStep) {
          onAddToolToStep(nearestAi.id, droppedType);
        } else if (onAddStep) {
          onAddStep(droppedType);
        }
        return;
      }

      if (onAddStep) {
        onAddStep(droppedType, undefined, {
          x: snapToGrid(dropPt.x - DEFAULT_NODE_WIDTH * 0.5),
          y: snapToGrid(dropPt.y - 48)
        });
      }
    },
    [steps, effectiveNodePositions, clientToCanvasPoint, onAddStep, onAddToolToStep]
  );

  // Varsayılan Palet Öğeleri (paletteItems verilmemişse)
  const resolvedPaletteItems = useMemo<FlowchartPaletteItem[]>(() => {
    if (paletteItems && paletteItems.length > 0) return paletteItems;
    return [
      {
        id: 'default_basla',
        type: 'BASLA',
        title: t('basla', 'Başla'),
        subTitle: t('akisi_baslat', 'Akışı Başlat'),
        shape: 'terminal',
        icon: <Play size={13} />
      },
      {
        id: 'default_form_ac',
        type: 'FORM_AC',
        title: t('form_ac', 'Form Aç'),
        subTitle: t('belge_kart_liste_ac', 'Belge, Kart veya Liste Aç'),
        shape: 'input',
        icon: <Monitor size={13} />
      },
      {
        id: 'default_ai_islem',
        type: 'AI_ISLEM',
        title: t('ai_islem', 'AI İşlemi'),
        subTitle: t('ai_analiz_ve_sentez', 'LLM Analiz & Sentez'),
        shape: 'process',
        icon: <Cpu size={13} />
      },
      {
        id: 'default_hafiza',
        type: 'HAFIZA',
        title: t('hafiza', 'Hafıza'),
        subTitle: t('llm_verisini_dosya_olarak_depola', 'Veriyi Dosya Olarak Depola'),
        shape: 'storage',
        icon: <Database size={13} />
      },
      {
        id: 'default_script_islem',
        type: 'SCRIPT_ISLEM',
        title: t('script_islem', 'Script İşlemi'),
        subTitle: t('js_veri_donusturucu', 'JavaScript Veri Dönüştürücü'),
        shape: 'script',
        icon: <Code2 size={13} />
      },
      {
        id: 'default_belge_olustur',
        type: 'BELGE_OLUSTUR',
        title: t('belge_olustur', 'Belge Oluştur'),
        subTitle: t('erp_belge_taslagi_olustur', 'ERP Belge / Kart Taslağı'),
        shape: 'document',
        icon: <FileText size={13} />
      },
      {
        id: 'default_karar_onay',
        type: 'KARAR_ONAY',
        title: t('karar_onay', 'Karar / Onay'),
        subTitle: t('evet_hayir_dallanmasi', 'Evet / Hayır Dallanması'),
        shape: 'decision',
        icon: <GitBranch size={13} />
      }
    ];
  }, [paletteItems, t]);

  const draftPreviewBezier = useMemo(() => {
    if (!connectionDraft) return null;
    return buildHorizontalBezier(
      connectionDraft.sx,
      connectionDraft.sy,
      connectionDraft.currX,
      connectionDraft.currY
    );
  }, [connectionDraft]);

  return (
    <div className={`base-flowchart-container ${fit ? 'base-flowchart--fit' : ''} ${className}`}>
      {showHeader && (
        <div className="base-flowchart-toolbar">
          <div className="base-flowchart-toolbar-title">
            <GitBranch size={16} />
            <span>{title || t('gorev_akis_diyagrami', 'Görev Akış Diyagramı (Flowchart)')}</span>
            <span className="base-flowchart-count-pill">{steps.length}</span>
          </div>
        </div>
      )}

      <div className="base-flowchart-main-body">
        {/* SOL PANEL: DİYAGRAM ÖĞELERİ VE ALT ARAÇLAR PALETİ */}
        {showSidebar && (sidebar || resolvedPaletteItems.length > 0) && (
          <aside
            className="base-flowchart-sidebar-palette"
            aria-label={t('diyagram_ogeleri', 'Diyagram Öğeleri')}
          >
            <div className="base-flowchart-sidebar-header">
              <Layers size={13} />
              <span>{t('diyagram_ogeleri', 'Diyagram Öğeleri')}</span>
            </div>

            <div className="base-flowchart-sidebar-items">
              {sidebar ? (
                sidebar
              ) : (
                <>
                  {resolvedPaletteItems
                    .filter((item) => item.category !== 'tool')
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            'application/x-webakus-flowchart-type',
                            item.type
                          );
                          e.dataTransfer.setData(
                            'application/x-webakus-flowchart-category',
                            'step'
                          );
                        }}
                        onClick={() => {
                          if (item.onClick) item.onClick();
                          else if (onAddStep) onAddStep(item.type);
                        }}
                        className={`base-flowchart-sidebar-item palette-shape-${item.shape || 'process'}`}
                        title={t('tikla_veya_tuvale_surukle', 'Tıklayın veya tuvale sürükleyip bırakın')}
                      >
                        <div className="base-flowchart-sidebar-item-icon">{item.icon}</div>
                        <div className="base-flowchart-sidebar-item-text">
                          <span className="base-flowchart-sidebar-item-title">{item.title}</span>
                          {item.subTitle && (
                            <span className="base-flowchart-sidebar-item-sub">{item.subTitle}</span>
                          )}
                        </div>
                        <Plus size={13} className="base-flowchart-sidebar-item-add" />
                      </button>
                    ))}

                  {resolvedPaletteItems.some((item) => item.category === 'tool') && (
                    <>
                      <div className="base-flowchart-sidebar-section-divider">
                        <Wrench size={12} />
                        <span>{t('ai_islemi_araclari', 'AI İşlemi Araçları')}</span>
                      </div>
                      {resolvedPaletteItems
                        .filter((item) => item.category === 'tool')
                        .map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData(
                                'application/x-webakus-flowchart-type',
                                item.type
                              );
                              e.dataTransfer.setData(
                                'application/x-webakus-flowchart-category',
                                'tool'
                              );
                            }}
                            onClick={() => {
                              if (item.onClick) item.onClick();
                              else if (onAddStep) onAddStep(item.type);
                            }}
                            className={`base-flowchart-sidebar-item palette-shape-${item.shape || 'tool'}`}
                            title={t(
                              'ai_islem_dugumune_surukle_veya_tikla',
                              'AI İşlemi düğümüne bağlamak için tıklayın veya üzerine bırakın'
                            )}
                          >
                            <div className="base-flowchart-sidebar-item-icon">{item.icon}</div>
                            <div className="base-flowchart-sidebar-item-text">
                              <span className="base-flowchart-sidebar-item-title">{item.title}</span>
                              {item.subTitle && (
                                <span className="base-flowchart-sidebar-item-sub">
                                  {item.subTitle}
                                </span>
                              )}
                            </div>
                            <Plus size={13} className="base-flowchart-sidebar-item-add" />
                          </button>
                        ))}
                    </>
                  )}
                </>
              )}
            </div>
          </aside>
        )}

        {/* SAĞ SAHNE: 2B SERBEST KONUMLANDIRILABİLİR NOKTALI TUVAL + DİNAMİK SVG OKLAR */}
        <div
          ref={stageRef}
          onPointerDown={handleStagePointerDown}
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          className={`base-flowchart-stage is-free-canvas ${isPanning ? 'is-panning' : ''} ${connectionDraft ? 'is-connecting' : ''}`}
        >
          {children ? (
            <div
              className={`base-flowchart-canvas-transform ${isWheelZooming ? 'is-wheel-zooming' : ''}`}
              style={{ zoom }}
            >
              <div className="base-flowchart-spine">{children}</div>
            </div>
          ) : (
            <div
              ref={canvasSurfaceRef}
              className={`base-flowchart-free-surface ${isWheelZooming ? 'is-wheel-zooming' : ''}`}
              style={{
                width: `${canvasDimensions.width}px`,
                height: `${canvasDimensions.height}px`,
                zoom
              }}
            >
              {/* 1. KATMAN: DİNAMİK SVG BAĞLANTI EĞRİLERİ (MAIN EDGES + TOOL EDGES + LIVE DRAFT) */}
              <svg
                className="base-flowchart-edges-svg"
                width={canvasDimensions.width}
                height={canvasDimensions.height}
              >
                <defs>
                  <marker
                    id="fc-arrow-default"
                    viewBox="0 0 10 10"
                    refX="8.5"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" className="fc-marker-fill-default" />
                  </marker>
                  <marker
                    id="fc-arrow-active"
                    viewBox="0 0 10 10"
                    refX="8.5"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" className="fc-marker-fill-active" />
                  </marker>
                  <marker
                    id="fc-arrow-yes"
                    viewBox="0 0 10 10"
                    refX="8.5"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" className="fc-marker-fill-yes" />
                  </marker>
                  <marker
                    id="fc-arrow-no"
                    viewBox="0 0 10 10"
                    refX="8.5"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" className="fc-marker-fill-no" />
                  </marker>
                  <marker
                    id="fc-arrow-tool"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <circle cx="5" cy="5" r="3.5" className="fc-marker-fill-tool" />
                  </marker>
                </defs>

                {/* Alt Araç (Tool) Kesikli Dinamik Eğrileri */}
                {computedToolEdges.map((tEdge) => {
                  const isHighlighted =
                    selectedToolId === tEdge.toolId || selectedStepId === tEdge.parentStepId;
                  return (
                    <path
                      key={tEdge.id}
                      d={tEdge.path}
                      className={`base-flowchart-svg-tool-edge ${isHighlighted ? 'is-active' : ''}`}
                      markerEnd="url(#fc-arrow-tool)"
                    />
                  );
                })}

                {/* Ana Akış (Sol -> Sağ) Dinamik Bezier Eğrileri */}
                {computedEdges.map((edge) => {
                  const isEdgeSelected =
                    selectedStepId === edge.sourceId || selectedStepId === edge.targetId;
                  const markerId =
                    edge.branch === 'yes'
                      ? 'url(#fc-arrow-yes)'
                      : edge.branch === 'no'
                        ? 'url(#fc-arrow-no)'
                        : isEdgeSelected
                          ? 'url(#fc-arrow-active)'
                          : 'url(#fc-arrow-default)';

                  return (
                    <g key={edge.id} className="base-flowchart-svg-edge-group">
                      <path d={edge.path} className="base-flowchart-svg-edge-hit" />
                      <path
                        d={edge.path}
                        className={`base-flowchart-svg-edge branch-${edge.branch} ${isEdgeSelected ? 'is-active' : ''}`}
                        markerEnd={markerId}
                      />
                    </g>
                  );
                })}

                {/* Canlı Bağlantı Çizim Önizlemesi */}
                {connectionDraft && draftPreviewBezier && (
                  <path
                    d={draftPreviewBezier.path}
                    className={`base-flowchart-svg-edge-draft branch-${connectionDraft.branch}`}
                    markerEnd="url(#fc-arrow-active)"
                  />
                )}
              </svg>

              {/* 2. KATMAN: BAĞLANTI ORTA NOKTASI EYLEMLERİ (+ Araya Ekle / × Bağlantıyı Kaldır) */}
              {computedEdges.map((edge) => (
                <div
                  key={`ctrl_${edge.id}`}
                  className={`base-flowchart-edge-controls branch-${edge.branch}`}
                  style={{
                    left: `${edge.midX}px`,
                    top: `${edge.midY}px`
                  }}
                >
                  {edge.branch !== 'next' && (
                    <span className={`base-flowchart-edge-branch-tag branch-${edge.branch}`}>
                      {edge.branch === 'yes'
                        ? t('evet_kisa', 'Evet')
                        : t('hayir_kisa', 'Hayır')}
                    </span>
                  )}

                  {onAddStep && (
                    <button
                      type="button"
                      className="base-flowchart-edge-btn is-insert"
                      title={t('araya_adim_ekle', 'Bu Bağlantıya Yeni Düğüm Ekle')}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddStep(
                          'AI_ISLEM',
                          undefined,
                          {
                            x: snapToGrid(edge.midX - DEFAULT_NODE_WIDTH * 0.5),
                            y: snapToGrid(edge.midY - 48)
                          },
                          {
                            sourceId: edge.sourceId,
                            branch: edge.branch,
                            previousTargetId: edge.targetId
                          }
                        );
                      }}
                    >
                      <Plus size={11} />
                    </button>
                  )}

                  {onDisconnectSteps && (
                    <button
                      type="button"
                      className="base-flowchart-edge-btn is-disconnect"
                      title={t('baglantiyi_kaldir', 'Bağlantıyı Kaldır')}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDisconnectSteps(edge.sourceId, edge.branch);
                      }}
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
              ))}

              {/* 3. KATMAN: SERBEST KONUMLU ANA AKIŞ DÜĞÜMLERİ */}
              {steps.map((step, index) => {
                const pos = effectiveNodePositions[step.id] || { x: 80, y: 144 };
                const isSelected = selectedStepId === step.id && !selectedToolId;
                const isDragging = draggingNodeId === step.id;
                const isConnectTarget = connectionDraft?.hoveredTargetId === step.id;

                const isBasla = step.type === 'BASLA' || step.type === 'START';
                const isFormAc = step.type === 'FORM_AC' || step.type === 'EKRAN_AC';
                const isHafiza = step.type === 'HAFIZA';
                const isScriptIslem = step.type === 'SCRIPT_ISLEM';
                const isBelgeOlustur = step.type === 'BELGE_OLUSTUR';
                const isKararOnay = step.type === 'KARAR_ONAY';

                const resolvedShape: FlowchartNodeShape = isBasla
                  ? 'terminal'
                  : isFormAc
                    ? 'input'
                    : isHafiza
                      ? 'storage'
                      : isScriptIslem
                        ? 'script'
                        : isBelgeOlustur
                          ? 'document'
                          : isKararOnay
                            ? 'decision'
                            : 'process';

                const resolvedVariant = isBasla
                  ? 'start'
                  : isFormAc
                    ? 'input'
                    : isHafiza
                      ? 'storage'
                      : isScriptIslem
                        ? 'script'
                        : isBelgeOlustur
                          ? 'document'
                          : isKararOnay
                            ? 'decision'
                            : 'process';

                const resolvedIcon = isBasla ? (
                  <Play size={13} />
                ) : isFormAc ? (
                  <Monitor size={13} />
                ) : isHafiza ? (
                  <Database size={13} />
                ) : isScriptIslem ? (
                  <Code2 size={13} />
                ) : isBelgeOlustur ? (
                  <FileText size={13} />
                ) : isKararOnay ? (
                  <GitBranch size={13} />
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
                        : isBelgeOlustur
                          ? t('belge_olustur', 'Belge Oluştur')
                          : isKararOnay
                            ? t('karar_onay', 'Karar / Onay')
                            : t('ai_islem', 'AI İşlemi');

                const canAttachTools = Boolean(
                  step.supportsTools ||
                    step.type === 'AI_ISLEM' ||
                    (step.attachedTools && step.attachedTools.length > 0)
                );

                return (
                  <div
                    key={step.id || index}
                    ref={(el) => {
                      nodeDomRefs.current[step.id] = el;
                    }}
                    onPointerDown={(e) => handleNodePointerDown(step, e)}
                    className={`base-flowchart-canvas-node ${isBasla ? 'is-terminal-node' : ''} ${isDragging ? 'is-dragging' : ''} ${isSelected ? 'is-z-top' : ''}`}
                    style={{
                      left: `${pos.x}px`,
                      top: `${pos.y}px`
                    }}
                  >
                    <BaseFlowchartNode
                      id={step.id}
                      stepNumber={isBasla ? undefined : index}
                      shape={resolvedShape}
                      variant={resolvedVariant}
                      icon={resolvedIcon}
                      showLeftPort={!isBasla}
                      showRightPort={true}
                      showBottomToolPort={canAttachTools}
                      hasAttachedTools={Boolean(step.attachedTools && step.attachedTools.length > 0)}
                      isConnectTarget={isConnectTarget}
                      shapeBadgeText={step.shapeBadgeText || defaultTypeTitle}
                      title={step.title || defaultTypeTitle}
                      summaryText={step.summaryText}
                      warningText={step.warningText}
                      inactive={step.inactive}
                      promptPreview={step.prompt}
                      toolCode={step.toolCode}
                      uiActionLabel={step.uiActionLabel}
                      routePath={step.routePath}
                      selected={isSelected}
                      onSelect={onSelectStep}
                      onDoubleClick={
                        onDoubleClickStep ? () => onDoubleClickStep(step.id) : undefined
                      }
                      onDelete={!isBasla && onDeleteStep ? (e) => onDeleteStep(step.id, e) : undefined}
                      onStartConnection={handleStartConnection}
                      onAddTool={
                        canAttachTools && onAddToolToStep
                          ? (pId) => onAddToolToStep(pId, 'RAG_ARAC')
                          : undefined
                      }
                    />
                  </div>
                );
              })}

              {/* 4. KATMAN: SERBEST KONUMLU ALT ARAÇ DÜĞÜMLERİ (TOOL SUB-NODES) */}
              {steps.map((step) =>
                (step.attachedTools || []).map((tool) => {
                  const tPos = effectiveToolPositions[tool.id] || { x: 80, y: 340 };
                  const isToolDragging = draggingToolKey?.toolId === tool.id;
                  const isToolSelected = selectedToolId === tool.id;

                  return (
                    <div
                      key={`tool_${step.id}_${tool.id}`}
                      onPointerDown={(e) => handleToolPointerDown(step.id, tool.id, e)}
                      className={`base-flowchart-canvas-tool ${isToolDragging ? 'is-dragging' : ''} ${isToolSelected ? 'is-z-top' : ''}`}
                      style={{
                        left: `${tPos.x}px`,
                        top: `${tPos.y}px`
                      }}
                    >
                      <FlowchartToolSubNode
                        tool={tool}
                        parentStepId={step.id}
                        selected={isToolSelected}
                        onSelect={onSelectTool}
                        onDoubleClick={onDoubleClickTool}
                        onDelete={onDeleteTool}
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* SAĞ ALT KÖŞE: YAKINLAŞTIRMA & OTOMATİK HİZALAMA (AUTO-LAYOUT) KONTROLLERİ */}
        {showZoomControls && (
          <div
            className="base-flowchart-floating-zoom"
            aria-label={t('yakinlastirma_kontrolleri', 'Yakınlaştırma Kontrolleri')}
          >
            {!children && steps.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleTriggerAutoLayout}
                  className="base-flowchart-zoom-btn is-autolayout"
                  title={t('otomatik_hizala', 'Düğümleri Otomatik Hizala (Auto-Layout)')}
                >
                  <LayoutGrid size={14} />
                </button>
                <div className="base-flowchart-zoom-divider" />
              </>
            )}

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
              title={t('sigdir_ve_sifirla', 'Görünümü Sıfırla (%100)')}
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
