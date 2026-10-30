/**
 * @file McpVarlikSeciciInput.tsx
 * @description
 * @akalin/ui - MCP Form & Varlık Seçici Giriş Alanı (McpVarlikSeciciInput)
 *
 * Başlıca Sorumlulukları:
 * - BaseSeciciInput mimarisine %100 uyumlu olmak
 * - Tıklandığında veya menü tetiklendiğinde MCP seçim listesini (selectionList) modal içinde mode="varlik" ile açmak
 * - Modül fonksiyonlarını kesinlikle göstermemek, yalnızca Liste, Belge ve Kart varlıklarının seçimine olanak tanımak
 * - Seçili varlığa göre dinamik ikon (CreditCard, FileText, Table, Boxes) ve formatlı etiket sunmak
 * - Temizleme (Clear) ve doğrudan klavye etkileşimlerini yönetmek
 * - Sıfır inline CSS ve %100 i18n uyumlu çalışmak
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, FileText, Table, Boxes, MoreVertical, Settings } from 'lucide-react';
import BaseSeciciInput from '../base/input/BaseSeciciInput';
import type { HarfDonusumu } from '../base/input/BaseInput';

export interface McpVarlikEntity {
  id: string;
  kod: string;
  ad: string;
  kategori?: 'liste' | 'belge' | 'kart';
  varlikTuruLabel?: string;
  modulKodu?: string;
  modulAdi?: string;
  ustListeAdi?: string;
  rota?: string;
  aciklama?: string;
  hasExternalSettings?: boolean;
  externalSettingsRoute?: string;
  externalSettingsComponent?: React.ComponentType<any>;
  [key: string]: any;
}

export interface McpVarlikSeciciInputProps {
  id?: string;
  value?: any;
  selectedEntity?: McpVarlikEntity | null;
  seciliAracKodlari?: string[];
  onlyActive?: boolean;
  categoryFilter?: 'all' | 'kart' | 'belge' | 'liste';
  selectionList?: React.ComponentType<any>;
  hasExternalSettings?: boolean;
  externalSettingsComponent?: React.ComponentType<any>;
  externalSettingsValue?: any;
  onExternalSettingsChange?: (settings: any) => void;
  onSettingsClick?: (entity: McpVarlikEntity) => void;
  isSettingsOpen?: boolean;
  onSettingsClose?: () => void;
  settingsButtonTitle?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: boolean | string;
  readOnly?: boolean;
  clearable?: boolean;
  detailsUrl?: string | null;
  detailsUrlTitle?: string;
  alertTitle?: string;
  alertMessage?: string;
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
  icon?: React.ReactNode;
  menuIcon?: React.ReactNode | false;
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onMenuClick?: () => void;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onChange?: (e: any, displayValue: string, entity: McpVarlikEntity | null) => void;
  onSelect?: (entity: McpVarlikEntity) => void;
  onClear?: () => void;
  hasSelection?: boolean;
  modalTitle?: string;
  modalSubtitle?: string;
  selectionListProps?: any;
  casing?: HarfDonusumu;
  harfDonusumu?: HarfDonusumu;
  harfFormati?: HarfDonusumu;
  textTransform?: HarfDonusumu;
  [key: string]: any;
}

export const McpVarlikSeciciInput: React.FC<McpVarlikSeciciInputProps> = ({
  id = 'mcpVarlikId',
  value,
  selectedEntity: propSelectedEntity,
  seciliAracKodlari,
  onlyActive,
  categoryFilter = 'all',
  selectionList: SelectionListComponent,
  hasExternalSettings: propHasExternalSettings,
  externalSettingsComponent: propExternalSettingsComponent,
  externalSettingsValue,
  onExternalSettingsChange,
  onSettingsClick,
  isSettingsOpen: propIsSettingsOpen,
  onSettingsClose: propOnSettingsClose,
  settingsButtonTitle,
  placeholder,
  disabled = false,
  autoFocus = false,
  error = false,
  readOnly = false,
  clearable = true,
  detailsUrl = null,
  detailsUrlTitle,
  alertTitle,
  alertMessage,
  inputClassName = 'form-input',
  inputStyle,
  icon: propIcon,
  menuIcon,
  isOpen: propIsOpen,
  onClose: propOnClose,
  onOpen: propOnOpen,
  onMenuClick,
  onClick,
  onKeyDown,
  onFocus,
  onBlur,
  onChange,
  onSelect,
  onClear,
  hasSelection: propHasSelection,
  modalTitle,
  modalSubtitle,
  selectionListProps,
  casing,
  harfDonusumu,
  harfFormati,
  textTransform,
  ...restProps
}) => {
  const { t } = useTranslation();

  const isControlled = propIsOpen !== undefined;
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const isSelectionOpen = isControlled ? Boolean(propIsOpen) : internalIsOpen;

  const isSettingsControlled = propIsSettingsOpen !== undefined;
  const [internalIsSettingsOpen, setInternalIsSettingsOpen] = useState<boolean>(false);
  const isExternalSettingsOpen = isSettingsControlled
    ? Boolean(propIsSettingsOpen)
    : internalIsSettingsOpen;

  const [selectedItem, setSelectedItem] = useState<McpVarlikEntity | null>(
    propSelectedEntity || null
  );

  useEffect(() => {
    if (propSelectedEntity !== undefined) {
      setSelectedItem(propSelectedEntity);
    }
  }, [propSelectedEntity]);

  const activeEntity = selectedItem || propSelectedEntity;

  const getCleanStringValue = useCallback((val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
      const typeLabel = val.varlikTuruLabel || (val.kategori ? String(val.kategori).toUpperCase() : '');
      const prefix = typeLabel ? `[${typeLabel}] ` : '';
      const modulePart = val.modulAdi ? ` — ${val.modulAdi}` : '';
      const codePart = val.rota || val.kod ? ` (${val.rota || val.kod})` : '';
      return `${prefix}${val.ad || val.name || val.kod || ''}${modulePart}${codePart}`;
    }
    return String(val);
  }, []);

  const isControlledValue = value !== undefined;
  const [internalInputValue, setInternalInputValue] = useState<string>(() => {
    if (activeEntity) return getCleanStringValue(activeEntity);
    if (typeof value === 'string') return value;
    return '';
  });

  useEffect(() => {
    if (activeEntity) {
      setInternalInputValue(getCleanStringValue(activeEntity));
    } else if (!isControlledValue) {
      if (typeof value === 'string') {
        setInternalInputValue(value);
      } else if (value && typeof value === 'object') {
        setInternalInputValue(getCleanStringValue(value));
      } else if (value === null || value === undefined || value === '') {
        setSelectedItem(null);
        setInternalInputValue('');
      }
    }
  }, [activeEntity, value, isControlledValue, getCleanStringValue]);

  const displayValue = isControlledValue
    ? (activeEntity ? getCleanStringValue(activeEntity) : getCleanStringValue(value))
    : internalInputValue;

  const hasSelection = Boolean(
    propHasSelection !== undefined ? propHasSelection : (activeEntity !== null && Boolean(activeEntity))
  );

  const ExternalSettingsComponent = useMemo<React.ComponentType<any> | undefined>(() => {
    return propExternalSettingsComponent || activeEntity?.externalSettingsComponent;
  }, [propExternalSettingsComponent, activeEntity?.externalSettingsComponent]);

  const effectiveHasExternalSettings = useMemo<boolean>(() => {
    if (propHasExternalSettings !== undefined) {
      return Boolean(propHasExternalSettings);
    }
    return Boolean(
      activeEntity?.hasExternalSettings ??
      Boolean(activeEntity?.externalSettingsComponent || propExternalSettingsComponent)
    );
  }, [propHasExternalSettings, activeEntity?.hasExternalSettings, activeEntity?.externalSettingsComponent, propExternalSettingsComponent]);

  const resolvedIcon = useMemo(() => {
    if (propIcon) return propIcon;
    if (activeEntity) {
      if (activeEntity.kategori === 'kart') return <CreditCard size={16} />;
      if (activeEntity.kategori === 'belge') return <FileText size={16} />;
      if (activeEntity.kategori === 'liste') return <Table size={16} />;
    }
    return <Boxes size={16} />;
  }, [propIcon, activeEntity]);

  // Seçim yapıldıktan sonra:
  // - hasExternalSettings === true ise 3 nokta ikonu "Ayar" (Settings) ikonuna dönüşür.
  // - hasExternalSettings === false ise 3 nokta ikonu kendini gizler (false).
  // Seçim yapılmamışken 3 nokta (MoreVertical) ikonu gösterilir.
  const resolvedMenuIcon = useMemo<React.ReactNode | false>(() => {
    if (hasSelection) {
      if (effectiveHasExternalSettings) {
        return <Settings size={16} />;
      }
      return false;
    }
    if (menuIcon !== undefined) {
      return menuIcon;
    }
    return <MoreVertical size={16} />;
  }, [hasSelection, effectiveHasExternalSettings, menuIcon]);

  const resolvedMenuButtonTitle = useMemo<string | undefined>(() => {
    if (hasSelection && effectiveHasExternalSettings) {
      return settingsButtonTitle || t('sayfa_dis_ayarlari', 'Sayfa Dış Ayarları');
    }
    return t('auto_secim_menusu', 'Seçim Menüsü (Ctrl+Enter)');
  }, [hasSelection, effectiveHasExternalSettings, settingsButtonTitle, t]);

  const handleOpen = useCallback(() => {
    if (disabled || readOnly) return;
    setInternalIsOpen(true);
    if (propOnOpen) propOnOpen();
  }, [disabled, readOnly, propOnOpen]);

  const handleClose = useCallback(() => {
    setInternalIsOpen(false);
    if (propOnClose) propOnClose();
  }, [propOnClose]);

  const handleSettingsClose = useCallback(() => {
    setInternalIsSettingsOpen(false);
    if (propOnSettingsClose) propOnSettingsClose();
  }, [propOnSettingsClose]);

  const handleMenuClick = useCallback(() => {
    if (disabled) return;
    if (hasSelection) {
      if (!effectiveHasExternalSettings) return;
      if (onSettingsClick && activeEntity) {
        onSettingsClick(activeEntity);
        return;
      }
      if (ExternalSettingsComponent) {
        setInternalIsSettingsOpen(true);
        return;
      }
      if (onMenuClick) {
        onMenuClick();
      }
      return;
    }
    if (onMenuClick) {
      onMenuClick();
    } else {
      handleOpen();
    }
  }, [disabled, hasSelection, effectiveHasExternalSettings, onSettingsClick, activeEntity, ExternalSettingsComponent, onMenuClick, handleOpen]);

  const handleEntitySelect = useCallback(
    (entity: McpVarlikEntity) => {
      setSelectedItem(entity);
      const strVal = getCleanStringValue(entity);
      if (!isControlledValue) {
        setInternalInputValue(strVal);
      }
      if (onSelect) {
        onSelect(entity);
      }
      if (onChange) {
        const syntheticEvent = {
          target: { value: strVal, name: id },
          currentTarget: { value: strVal, name: id }
        };
        onChange(syntheticEvent as any, strVal, entity);
      }
      handleClose();
    },
    [getCleanStringValue, isControlledValue, onSelect, onChange, id, handleClose]
  );

  const handleClear = useCallback(() => {
    setSelectedItem(null);
    if (!isControlledValue) {
      setInternalInputValue('');
    }
    if (onClear) {
      onClear();
    }
    if (onChange) {
      const syntheticEvent = {
        target: { value: '', name: id },
        currentTarget: { value: '', name: id }
      };
      onChange(syntheticEvent as any, '', null);
    }
  }, [isControlledValue, onClear, onChange, id]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, rawValue?: any) => {
      const val = rawValue !== undefined ? rawValue : (e?.target?.value ?? '');
      if (!isControlledValue) {
        setInternalInputValue(val);
      }
      setSelectedItem(null);
      if (onChange) {
        onChange(e, val, null);
      }
    },
    [onChange, isControlledValue]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Windows/Linux Ctrl+Enter veya Mac Cmd+Enter / Ctrl+Enter: MCPSelectionList modalını aç
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleOpen();
        return;
      }

      // Alt + ↓ ile evrensel seçim menüsü açma standardı
      if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        handleOpen();
        return;
      }

      if (onKeyDown) {
        onKeyDown(e);
      }
    },
    [handleOpen, onKeyDown]
  );

  return (
    <>
      <BaseSeciciInput
        id={id}
        placeholder={placeholder || t('mcp_belge_kart_liste_secin', 'Açılacak Belge, Kart veya Listeyi seçin...')}
        detailsUrl={detailsUrl}
        detailsUrlTitle={detailsUrlTitle || t('varlik_detayini_ac', 'Seçili Varlığı Aç')}
        alertTitle={alertTitle}
        alertMessage={alertMessage || t('secili_mcp_varligi_temizlenecektir', 'Seçili form ve MCP varlığı kaldırılacaktır.')}
        icon={resolvedIcon}
        menuIcon={resolvedMenuIcon}
        menuButtonTitle={resolvedMenuButtonTitle}
        clearable={clearable}
        disabled={disabled}
        autoFocus={autoFocus}
        error={error}
        readOnly={readOnly}
        inputClassName={inputClassName}
        inputStyle={inputStyle}
        value={displayValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        hasSelection={hasSelection}
        onClear={handleClear}
        onClick={onClick}
        onMenuClick={handleMenuClick}
        casing={casing}
        harfDonusumu={harfDonusumu}
        harfFormati={harfFormati}
        textTransform={textTransform}
        {...restProps}
      />

      {isSelectionOpen && SelectionListComponent && (
        <SelectionListComponent
          isOpen={true}
          inModal={true}
          mode="varlik"
          seciliAracKodlari={seciliAracKodlari}
          onlyActive={onlyActive}
          categoryFilter={categoryFilter}
          title={modalTitle || t('form_secimi', 'Form Seçimi')}
          subtitle={
            modalSubtitle ||
            t(
              'mcp_varlik_secimi_alt_baslik',
              'Açılacak veya işlem yapılacak Belge, Kart veya Listeyi seçin.'
            )
          }
          initialSearchText={hasSelection ? '' : displayValue}
          initialSelectedId={activeEntity?.id}
          onClose={handleClose}
          onSelect={handleEntitySelect}
          {...selectionListProps}
        />
      )}

      {isExternalSettingsOpen && ExternalSettingsComponent && activeEntity && (
        <ExternalSettingsComponent
          isOpen={true}
          inModal={true}
          entity={activeEntity}
          value={externalSettingsValue}
          onChange={onExternalSettingsChange}
          onSave={(updatedSettings: any) => {
            if (onExternalSettingsChange) {
              onExternalSettingsChange(updatedSettings);
            }
            handleSettingsClose();
          }}
          onClose={handleSettingsClose}
        />
      )}
    </>
  );
};

export default McpVarlikSeciciInput;
