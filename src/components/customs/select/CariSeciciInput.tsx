// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BaseSeciciInput } from '@akalin/ui';
import { type HarfDonusumu } from '@akalin/ui';
import { User, MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CariSeciciList from '@modules/CariYonetimi/components/CariSeciciList';

export interface CariSeciciInputProps {
    id?: string;
    value?: any;
    onChange?: (val: any, rawValue?: any) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onMenuClick?: () => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    error?: boolean;
    placeholder?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    hasSelection?: boolean;
    cariId?: string | number | null;
    selectedCariId?: string | number | null;
    onClear?: () => void;
    detailsUrl?: string | null;
    detailsUrlTitle?: string;
    alertTitle?: string;
    alertMessage?: string;
    inputClassName?: string;
    inputStyle?: React.CSSProperties;
    icon?: React.ReactNode;
    menuIcon?: React.ReactNode;
    readOnly?: boolean;
    isMenuOpen?: boolean;
    onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
    clearable?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
    onSelect?: (cari: any) => void;
    modalTitle?: string;
    modalSubtitle?: string;
    selectionListProps?: any;
    casing?: HarfDonusumu;
    harfDonusumu?: HarfDonusumu;
    harfFormati?: HarfDonusumu;
    textTransform?: HarfDonusumu;
    [key: string]: any;
}

const CariSeciciInput: React.FC<CariSeciciInputProps> = ({ 
    id = 'cariId', 
    value,
    onChange,
    onKeyDown,
    onMenuClick,
    onClear,
    onClick,
    hasSelection: propHasSelection,
    cariId,
    selectedCariId,
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
    inputClassName = "form-input",
    inputStyle,
    icon,
    menuIcon,
    isOpen: propIsOpen,
    onClose: propOnClose,
    onSelect,
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
    const navigate = useNavigate();
    const location = useLocation();

    const isControlled = propIsOpen !== undefined;
    const hasExternalModal = !isControlled && Boolean(onMenuClick);

    const isCariSecimRoute = !hasExternalModal && location.pathname.endsWith('/cari-secim');
    const [internalIsOpen, setInternalIsOpen] = useState(() => isCariSecimRoute);

    const isSelectionOpen = isControlled ? propIsOpen : (hasExternalModal ? false : internalIsOpen);

    const isControlledValue = value !== undefined;
    const [internalInputValue, setInternalInputValue] = useState(() => {
        if (typeof value === 'string') return value;
        return '';
    });
    const [selectedItem, setSelectedItem] = useState<any>(null);

    const getCleanStringValue = (val: any): string => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return val;
        if (typeof val === 'object') {
            return val.unvan || `${val.ad || ''} ${val.soyad || ''}`.trim() || val.kod || val.name || '';
        }
        return String(val);
    };

    // Controlled modda dışarıdan gelen value doğrudan kullanılır; nesne gelse dahi [object Object] değil unvan basılır.
    const displayValue = isControlledValue ? getCleanStringValue(value) : internalInputValue;

    // hasSelection YALNIZCA ve YALNIZCA listeden bir seçim yapıldığında (selectedItem) veya
    // dışarıdan geçerli bir cari ID'si aktarıldığında true olur!
    const effectiveCariId = cariId || selectedCariId;
    const isActuallySelected = selectedItem !== null || (effectiveCariId !== undefined && effectiveCariId !== null && effectiveCariId !== '');
    const hasSelection = Boolean(
        propHasSelection !== undefined ? propHasSelection : isActuallySelected
    );

    // Uncontrolled modda dışarıdan value değişirse internal state ile senkronize et
    useEffect(() => {
        if (!isControlledValue) {
            if (typeof value === 'string') {
                setInternalInputValue(value);
            } else if (value && typeof value === 'object') {
                setInternalInputValue(getCleanStringValue(value));
            } else if (value === null || value === undefined || value === '') {
                setSelectedItem(null);
                setInternalInputValue('');
            }
        }
    }, [value, isControlledValue]);

    // URL rota değişimi ile seçim penceresi görünürlüğünü senkronize et
    useEffect(() => {
        if (hasExternalModal) return;
        if (location.pathname.endsWith('/cari-secim')) {
            setInternalIsOpen(true);
        } else if (!isControlled) {
            setInternalIsOpen(false);
        }
    }, [location.pathname, isControlled, hasExternalModal]);

    const handleOpen = useCallback(() => {
        if (hasExternalModal) return;
        setInternalIsOpen(true);
        if (!location.pathname.endsWith('/cari-secim')) {
            const cleanPath = location.pathname.replace(/\/+$/, '').replace(/\/(bulut-dosyalari|excel-import|cari-secim)$/, '');
            navigate(`${cleanPath}/cari-secim`, {
                state: {
                    ...location.state,
                    searchText: displayValue,
                    initialSearchText: displayValue
                }
            });
        }
    }, [location.pathname, location.state, navigate, displayValue, hasExternalModal]);

    const handleClose = useCallback(() => {
        setInternalIsOpen(false);
        if (propOnClose) {
            propOnClose();
        }
        if (!hasExternalModal && location.pathname.endsWith('/cari-secim')) {
            const parentPath = location.pathname.replace(/\/cari-secim$/, '');
            navigate(parentPath, {
                state: {
                    ...location.state
                }
            });
        }
    }, [location.pathname, location.state, navigate, propOnClose, hasExternalModal]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, rawValue?: any) => {
        const val = rawValue !== undefined ? rawValue : (e?.target?.value ?? '');
        if (!isControlledValue) {
            setInternalInputValue(val);
        }
        // Kullanıcı klavyeyle yazı yazarken seçim durumu bozulur
        setSelectedItem(null);
        if (onChange) {
            onChange(e, val);
        }
    }, [onChange, isControlledValue]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
        // Input text alanına tıklandığında seçim modalı açılmaz; kullanıcı serbestçe yazı yazabilmelidir.
        if (onClick) {
            onClick(e);
        }
    }, [onClick]);

    const handleMenuClick = useCallback(() => {
        if (disabled) return;
        if (onMenuClick) {
            onMenuClick();
        } else {
            handleOpen();
        }
    }, [disabled, handleOpen, onMenuClick]);

    const handleCariSelect = useCallback((selectedCari: any) => {
        setSelectedItem(selectedCari);
        const displayName = selectedCari?.unvan || `${selectedCari?.ad || ''} ${selectedCari?.soyad || ''}`.trim() || selectedCari?.kod || '';
        if (!isControlledValue) {
            setInternalInputValue(displayName);
        }
        if (onSelect) {
            onSelect(selectedCari);
        }
        if (onChange) {
            const syntheticEvent = {
                target: { value: displayName, name: id },
                currentTarget: { value: displayName, name: id }
            };
            // 2. parametre string displayName, 3. parametre tam selectedCari nesnesi
            onChange(syntheticEvent as any, displayName, selectedCari);
        }
        handleClose();
    }, [onSelect, onChange, handleClose, id, isControlledValue]);

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
    }, [onClear, onChange, id, isControlledValue]);

    return (
        <>
            <BaseSeciciInput
                id={id}
                placeholder={placeholder || t('Cari Hesap...')}
                detailsUrl={detailsUrl}
                detailsUrlTitle={detailsUrlTitle || t('Cari Hesap Kartını Yeni Sekmede Aç')}
                alertTitle={alertTitle}
                alertMessage={alertMessage || t('Seçili cari hesap kaydı temizlenecektir.')}
                icon={icon || <User size={16} />}
                menuIcon={menuIcon}
                clearable={clearable}
                disabled={disabled}
                autoFocus={autoFocus}
                error={error}
                readOnly={readOnly}
                inputClassName={inputClassName}
                inputStyle={inputStyle}
                value={displayValue}
                onChange={handleInputChange}
                onKeyDown={onKeyDown}
                hasSelection={hasSelection}
                onClear={handleClear}
                onClick={handleClick}
                onMenuClick={handleMenuClick}
                casing={casing}
                harfDonusumu={harfDonusumu}
                harfFormati={harfFormati}
                textTransform={textTransform}
                {...restProps}
            />

            {isSelectionOpen && (
                <CariSeciciList
                    isOpen={true}
                    inModal={true}
                    title={modalTitle}
                    subtitle={modalSubtitle}
                    initialSearchText={displayValue}
                    onClose={handleClose}
                    onSelect={handleCariSelect}
                    {...selectionListProps}
                />
            )}
        </>
    );
};

export default CariSeciciInput;
