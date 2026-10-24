/**
 * @file BirimlerGrid.tsx
 * @description
 * Ürün ve hizmet kartlarında kullanılan ölçü birimlerini kategorilerine göre
 * gruplanmış, duyarlı, klavye/seçim destekli ve SpreadsheetGrid sütun mimarisiyle
 * (yeniden boyutlandırılabilir sütunlar, colgroup, th/td yapısı) sunan modern bir grid bileşeni.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Box, 
  Scale, 
  Droplet, 
  Ruler, 
  Grid as GridIcon, 
  Clock, 
  MoreHorizontal, 
  Edit2, 
  Trash2 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ActionMenu } from '@akalin/ui';
import { useTableNavigation } from '../../hooks/useTableNavigation';

export interface BirimItem {
  id?: number | string;
  ad: string;
  tip?: number;
  carpan: number;
  anaBirimMi?: boolean;
  aktifMi: boolean;
  [key: string]: any;
}

export interface BirimTipiOption {
  value: number;
  label: string;
  id?: number;
  ad?: string;
}

export interface BirimlerColumn {
  id: string;
  header: React.ReactNode;
  width?: number | string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  resizable?: boolean;
}

export interface BirimlerGridProps {
  data?: BirimItem[];
  loading?: boolean;
  birimTipleri?: BirimTipiOption[];
  onEdit?: (item: BirimItem) => void;
  onDelete?: (item: BirimItem) => void;
  emptyMessage?: string;
  className?: string;
  initialColumnWidths?: Record<string, number | string>;
}

interface CategoryConfig {
  icon: React.ReactNode;
  cssClass: string;
}

const DEFAULT_CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'Sayılabilir': { icon: <Box size={16} />, cssClass: 'birimler-category-sayilabilir' },
  'Ağırlık': { icon: <Scale size={16} />, cssClass: 'birimler-category-agirlik' },
  'Hacim (Sıvı)': { icon: <Droplet size={16} />, cssClass: 'birimler-category-hacim' },
  'Uzunluk': { icon: <Ruler size={16} />, cssClass: 'birimler-category-uzunluk' },
  'Alan': { icon: <GridIcon size={16} />, cssClass: 'birimler-category-alan' },
  'Zaman': { icon: <Clock size={16} />, cssClass: 'birimler-category-zaman' },
  'Diğer': { icon: <MoreHorizontal size={16} />, cssClass: 'birimler-category-diger' }
};

export const BirimlerGrid: React.FC<BirimlerGridProps> = ({
  data = [],
  loading = false,
  birimTipleri = [],
  onEdit,
  onDelete,
  emptyMessage,
  className = '',
  initialColumnWidths
}) => {
  const { t } = useTranslation();

  // SpreadsheetGrid tarzı sütun tanımları
  const columns: BirimlerColumn[] = useMemo(() => [
    {
      id: 'ad',
      header: t('auto_birim_adi_4187', 'Birim Adı'),
      width: '100%',
      minWidth: 160,
      align: 'left',
      resizable: true
    },
    {
      id: 'carpan',
      header: t('auto_carpani_2106', 'Çarpanı'),
      width: 140,
      minWidth: 100,
      align: 'left',
      resizable: true
    },
    {
      id: 'durum',
      header: t('auto_durum', 'Durum'),
      width: 130,
      minWidth: 90,
      align: 'left',
      resizable: true
    },
    {
      id: 'actions',
      header: '',
      width: 50,
      minWidth: 50,
      align: 'center',
      resizable: false
    }
  ], [t]);

  // Sütun genişlikleri yönetimi (SpreadsheetGrid mimarisi)
  const [columnWidths, setColumnWidths] = useState<Record<string, number | string>>(() => {
    const widths: Record<string, number | string> = {};
    columns.forEach((c) => {
      widths[c.id] = c.width ?? 120;
    });
    if (initialColumnWidths) {
      Object.assign(widths, initialColumnWidths);
    }
    return widths;
  });

  // Resizing state'leri
  const [isResizing, setIsResizing] = useState(false);
  const [currentResizer, setCurrentResizer] = useState<{ colId: string; startX: number; startWidth: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const resizerEl = e.currentTarget as HTMLElement;
    const thisTh = resizerEl.closest('th');
    const actualWidth = thisTh ? thisTh.offsetWidth : (typeof columnWidths[colId] === 'number' ? Number(columnWidths[colId]) : 120);

    setIsResizing(true);
    setCurrentResizer({ colId, startX: e.clientX, startWidth: actualWidth });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !currentResizer) return;
      const { colId, startX, startWidth } = currentResizer;
      const col = columns.find(c => c.id === colId);
      const minW = col?.minWidth ?? 60;
      const diff = e.clientX - startX;
      const newWidth = Math.max(minW, Math.round(startWidth + diff));

      setColumnWidths(prev => {
        if (prev[colId] === newWidth) return prev;
        return { ...prev, [colId]: newWidth };
      });
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        setCurrentResizer(null);
      }
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, currentResizer, columns]);

  // Gruplama ve düz sıralama hesaplaması
  const { groupedBirimler, flatBirimler } = useMemo(() => {
    // Hem frontend güvenliği hem de inMemory/API tutarlılığı için Ad ve Tip bazında tekilleştirme:
    // Firma birimleri (firmaId > 0), sistem birimlerine (sistemBirimiMi veya firmaId === 0) önceliklidir.
    const uniqueMap = new Map<string, BirimItem>();
    (data || []).forEach((b: BirimItem) => {
      const key = `${(b.ad || '').trim().toLowerCase()}_${b.tip}`;
      const existing = uniqueMap.get(key);
      if (!existing) {
        uniqueMap.set(key, b);
      } else {
        const existingIsSystem = !!(existing.sistemBirimiMi || existing.firmaId === 0 || existing.FirmaId === 0);
        const currentIsSystem = !!(b.sistemBirimiMi || b.firmaId === 0 || b.FirmaId === 0);
        if (existingIsSystem && !currentIsSystem) {
          uniqueMap.set(key, b);
        }
      }
    });

    const deduplicatedData = Array.from(uniqueMap.values());

    const grouped = deduplicatedData.reduce((acc: Record<string, BirimItem[]>, b: BirimItem) => {
      const tipOption = birimTipleri.find((tip) => (tip.value ?? tip.id) === b.tip);
      const tipLabel = tipOption ? (tipOption.label ?? tipOption.ad) : t('kategori_sayilabilir', 'Sayılabilir');
      const resolvedLabel = tipLabel || t('kategori_sayilabilir', 'Sayılabilir');
      
      if (!acc[resolvedLabel]) {
        acc[resolvedLabel] = [];
      }
      acc[resolvedLabel].push(b);
      return acc;
    }, {});

    const flat: BirimItem[] = [];
    Object.values(grouped).forEach((groupList) => flat.push(...groupList));

    return { groupedBirimler: grouped, flatBirimler: flat };
  }, [data, birimTipleri, t]);

  const { selectedIndex, setSelectedIndex } = useTableNavigation({
    data: flatBirimler,
    onEdit: onEdit,
    isActive: true
  });

  if (loading) {
    return (
      <div className="birimler-loading-state">
        {t('auto_yukleniyor_4deb', 'Yükleniyor...')}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="birimler-empty-state">
        <Box size={32} className="birimler-empty-icon" />
        <p className="birimler-empty-text">
          {emptyMessage || t('auto_henuz_birim_eklenmem_d7a1', 'Henüz birim eklenmemiş.')}
        </p>
      </div>
    );
  }

  return (
    <div className={`spreadsheet-table-wrapper spreadsheet-table-wrapper-bordered birimler-table-wrapper ${className}`.trim()}>
      <table className="spreadsheet-table w-full">
        {/* SpreadsheetGrid Tarzı colgroup */}
        <colgroup>
          {columns.map((col) => {
            const widthVal = columnWidths[col.id];
            const isActions = col.id === 'actions';
            return (
              <col 
                key={col.id} 
                className={isActions ? 'spreadsheet-settings-col' : undefined}
                style={{ width: typeof widthVal === 'number' ? `${widthVal}px` : widthVal }} 
              />
            );
          })}
        </colgroup>

        {/* SpreadsheetGrid Tarzı thead */}
        <thead className="spreadsheet-thead">
          <tr className="spreadsheet-header-row">
            {columns.map((col) => {
              const widthVal = columnWidths[col.id];
              const isActions = col.id === 'actions';

              return (
                <th
                  key={col.id}
                  className={`spreadsheet-th ${isActions ? 'spreadsheet-settings-column' : ''}`.trim()}
                  style={{
                    width: typeof widthVal === 'number' ? `${widthVal}px` : widthVal,
                    minWidth: col.minWidth ? `${col.minWidth}px` : undefined,
                    backgroundColor: 'var(--bg-secondary)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 30
                  }}
                >
                  <div className="spreadsheet-th-cell">
                    <div className="spreadsheet-th-content">
                      <div className="spreadsheet-th-label-wrapper">
                        <span 
                          className="spreadsheet-th-label"
                          style={{ textAlign: col.align || 'left' }}
                        >
                          {col.header}
                        </span>
                      </div>
                    </div>

                    {/* Sütun Boyutlandırma Çubuğu (Resize Handle) */}
                    {col.resizable && (
                      <div
                        className={`spreadsheet-resize-handle ${currentResizer?.colId === col.id ? 'is-active' : ''}`}
                        onMouseDown={(e) => handleMouseDown(e, col.id)}
                      />
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Tablo Gövdesi */}
        <tbody>
          {Object.entries(groupedBirimler).map(([grupAdi, grupBirimler]) => {
            const config = DEFAULT_CATEGORY_CONFIGS[grupAdi] || DEFAULT_CATEGORY_CONFIGS['Diğer'];

            return (
              <React.Fragment key={grupAdi}>
                {/* Kategori Grup Başlığı */}
                <tr className="birimler-group-header-row">
                  <td colSpan={columns.length} className="birimler-group-header-cell spreadsheet-td">
                    <div className="birimler-group-content">
                      <div className={`birimler-category-icon-wrapper ${config.cssClass}`}>
                        {config.icon}
                      </div>
                      <span className="birimler-group-title">{grupAdi}</span>
                      <span className="birimler-count-badge">
                        {t('birim_sayisi', '{{count}} birim', { count: grupBirimler.length })}
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Birim Satırları */}
                {grupBirimler.map((b) => {
                  const index = flatBirimler.findIndex((item) => (item.id && item.id === b.id) || item.ad === b.ad);
                  const isSelected = selectedIndex === index;
                  let rowClass = 'birimler-row table-row-hover';
                  if (isSelected) rowClass += ' row-selected';

                  const isSystem = !!(b.sistemBirimiMi || b.firmaId === 0 || b.FirmaId === 0);

                  return (
                    <tr
                      key={b.id || b.ad}
                      className={rowClass}
                      onClick={() => setSelectedIndex(index)}
                      onDoubleClick={() => !isSystem && onEdit && onEdit(b)}
                    >
                      {/* Birim Adı */}
                      <td className="spreadsheet-td birimler-td-name">
                        <div className="birim-name-wrapper">
                          <span>{b.ad}</span>
                          {b.anaBirimMi && (
                            <span className="birim-main-badge">
                              {t('auto_ana_birim_001', 'ANA BİRİM')}
                            </span>
                          )}
                          {isSystem && (
                            <span className="birim-system-badge">
                              {t('sistem_birimi_badge', 'SİSTEM')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Çarpanı */}
                      <td className="spreadsheet-td">
                        <span className="birim-multiplier-badge">
                          x {b.carpan}
                        </span>
                      </td>

                      {/* Durum */}
                      <td className="spreadsheet-td">
                        {b.aktifMi ? (
                          <span className="status-active-badge">
                            <span className="dot"></span>
                            {t('auto_aktif', 'Aktif')}
                          </span>
                        ) : (
                          <span className="status-passive-badge">
                            <span className="dot"></span>
                            {t('auto_pasif', 'Pasif')}
                          </span>
                        )}
                      </td>

                      {/* İşlem Menüsü */}
                      <td className="spreadsheet-td birimler-td-actions">
                        <div className="spreadsheet-row-actions-container">
                          {!isSystem && (
                            <ActionMenu
                              actions={[
                                ...(onEdit ? [{
                                  label: t('auto_duzenle_38cf', 'Düzenle'),
                                  icon: <Edit2 size={16} />,
                                  onClick: (e?: React.MouseEvent) => {
                                    e?.stopPropagation();
                                    onEdit(b);
                                  }
                                }] : []),
                                ...(onDelete ? [{
                                  label: t('auto_sil_686e', 'Sil'),
                                  icon: <Trash2 size={16} />,
                                  danger: true,
                                  onClick: (e?: React.MouseEvent) => {
                                    e?.stopPropagation();
                                    onDelete(b);
                                  }
                                }] : [])
                              ]}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BirimlerGrid;
