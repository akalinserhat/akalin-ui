import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Minus, X } from 'lucide-react';
import { DocumentHeaderFieldContext } from '../../../pages/base/BaseDocumentPage';
import { focusNextElement } from '../../../utils/domUtils';

export interface DropdownOption {
    id: string | number;
    value?: string | number;
    label: string | React.ReactNode;
    group?: string;
    isAllOption?: boolean;
    rawValue?: any;
    searchText?: string;
}

export interface DropdownExtraAction {
    icon?: React.ReactNode;
    label: string;
    onClick: () => void;
}

export interface BaseDropdownSeciciProps {
    id?: string;
    value?: any;
    onChange?: (id: any, rawValue?: any) => void;
    options: DropdownOption[];
    multiple?: boolean;
    disabled?: boolean;
    placeholder?: string;
    clearable?: boolean;
    className?: string;
    style?: React.CSSProperties;
    error?: boolean | string;
    extraAction?: DropdownExtraAction;
    displayText?: string;
    openOnClick?: boolean;
    emptyMessage?: string;
    autoFocusNext?: boolean;
}

/**
 * ReactNode içerisindeki tüm metin düğümlerini (text nodes) rekürsif olarak çıkarır.
 */
export const extractTextFromNode = (node: React.ReactNode): string => {
    if (node === null || node === undefined || typeof node === 'boolean') {
        return '';
    }
    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }
    if (Array.isArray(node)) {
        return node.map(extractTextFromNode).join('');
    }
    if (React.isValidElement(node)) {
        return extractTextFromNode((node.props as any)?.children);
    }
    return '';
};

/**
 * Verilen düz metin içinde aranan ifadeyi Türkçe karakter duyarlı şekilde bulup
 * eşleşen kısımları <span className="tree-search-highlight"> ile sarar.
 */
export const highlightString = (text: string, query: string): React.ReactNode => {
    if (!query || !text) return text;

    const lowerText = text.toLocaleLowerCase('tr-TR');
    const lowerQuery = query.toLocaleLowerCase('tr-TR');
    if (!lowerQuery) return text;

    const idx = lowerText.indexOf(lowerQuery);
    if (idx === -1) return text;

    const parts: React.ReactNode[] = [];
    let startIndex = 0;
    let matchIndex = idx;
    let key = 0;

    while (matchIndex !== -1) {
        if (matchIndex > startIndex) {
            parts.push(text.substring(startIndex, matchIndex));
        }
        parts.push(
            <span key={key++} className="tree-search-highlight">
                {text.substring(matchIndex, matchIndex + query.length)}
            </span>
        );
        startIndex = matchIndex + query.length;
        matchIndex = lowerText.indexOf(lowerQuery, startIndex);
    }

    if (startIndex < text.length) {
        parts.push(text.substring(startIndex));
    }

    return <>{parts}</>;
};

/**
 * ReactNode ağacını (ikon, elementler, metinler vb.) koruyarak metin düğümlerindeki eşleşmeleri vurgular.
 */
export const highlightNode = (node: React.ReactNode, query: string): React.ReactNode => {
    if (!query || node === null || node === undefined || typeof node === 'boolean') {
        return node;
    }
    if (typeof node === 'string') {
        return highlightString(node, query);
    }
    if (typeof node === 'number') {
        return highlightString(String(node), query);
    }
    if (Array.isArray(node)) {
        return node.map((child, index) => (
            <React.Fragment key={index}>
                {highlightNode(child, query)}
            </React.Fragment>
        ));
    }
    if (React.isValidElement(node)) {
        const children = (node.props as any)?.children;
        if (children !== undefined && children !== null) {
            return React.cloneElement(node, {
                ...node.props,
                children: highlightNode(children, query)
            } as any);
        }
        return node;
    }
    return node;
};

/**
 * Seçeneğin arama metniyle eşleşip eşleşmediğini kontrol eder.
 * Türkçe karakter duyarlılığı (toLocaleLowerCase('tr-TR')) korunur.
 */
export const isOptionMatch = (opt: DropdownOption, query: string): boolean => {
    if (!query) return true;
    const lowerQuery = query.toLocaleLowerCase('tr-TR');

    // 1. Grup adı kontrolü
    if (opt.group && opt.group.toLocaleLowerCase('tr-TR').includes(lowerQuery)) {
        return true;
    }

    // 2. DropdownOption searchText kontrolü
    if (opt.searchText !== undefined && opt.searchText !== null) {
        if (opt.searchText.toLocaleLowerCase('tr-TR').includes(lowerQuery)) {
            return true;
        }
    }

    // 2. label string ise kontrol
    if (typeof opt.label === 'string') {
        if (opt.label.toLocaleLowerCase('tr-TR').includes(lowerQuery)) {
            return true;
        }
    } else if (opt.label) {
        // 3. label bir ReactNode ise rekürsif metin çıkarımı
        const extracted = extractTextFromNode(opt.label);
        if (extracted && extracted.toLocaleLowerCase('tr-TR').includes(lowerQuery)) {
            return true;
        }
    }

    // 4. rawValue alanları (ad, kdvOrani, Label, name, title)
    if (opt.rawValue) {
        const rawLabel = opt.rawValue.ad ?? opt.rawValue.kdvOrani ?? opt.rawValue.Label ?? opt.rawValue.name ?? opt.rawValue.title;
        if (rawLabel !== undefined && rawLabel !== null) {
            if (String(rawLabel).toLocaleLowerCase('tr-TR').includes(lowerQuery)) {
                return true;
            }
        }
    }

    return false;
};

/**
 * Seçeneğin label içeriğini arama sorgusuna göre vurgulu şekilde oluşturur.
 */
export const renderOptionLabel = (option: DropdownOption, query: string): React.ReactNode => {
    if (!query) {
        return option.label ?? option.searchText ?? null;
    }

    if (option.label !== undefined && option.label !== null) {
        if (typeof option.label === 'string') {
            return highlightString(option.label, query);
        }

        const hasText = extractTextFromNode(option.label).trim().length > 0;
        if (hasText) {
            return highlightNode(option.label, query);
        }

        if (option.searchText) {
            return (
                <span className="flex items-center gap-2">
                    {option.label}
                    {highlightString(option.searchText, query)}
                </span>
            );
        }

        return option.label;
    }

    if (option.searchText) {
        return highlightString(option.searchText, query);
    }

    return null;
};

export const renderHighlightedLabel = (label: string | React.ReactNode, query: string): React.ReactNode => {
    return highlightNode(label, query);
};

const BaseDropdownSecici: React.FC<BaseDropdownSeciciProps> = ({
    id,
    value,
    onChange,
    options = [],
    multiple = false,
    disabled = false,
    placeholder = "Seçiniz...",
    clearable = false,
    className,
    style,
    error,
    extraAction,
    displayText,
    openOnClick = true,
    emptyMessage = "Sonuç bulunamadı",
    autoFocusNext = true
}) => {
    const headerFieldContext = useContext(DocumentHeaderFieldContext);
    const effectiveError = Boolean(error || headerFieldContext?.hasError);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchStringRef = useRef<string>('');

    // Çoklu seçim için normalize edilmiş seçili ID dizisi
    const selectedIds = useMemo<string[]>(() => {
        if (!multiple) {
            if (value === undefined || value === null || value === '') return [];
            return [String(value)];
        }
        if (Array.isArray(value)) {
            return value
                .filter((v) => v !== undefined && v !== null && v !== '')
                .map((v) => String(v));
        }
        if (value !== undefined && value !== null && value !== '') {
            return [String(value)];
        }
        return [];
    }, [multiple, value]);

    const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    // Filtrelenmiş seçenekler
    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) {
            return options;
        }
        return options.filter(opt => isOptionMatch(opt, searchQuery.trim()));
    }, [options, searchQuery]);

    // Gruplanmış görünüm verisi
    const groupedSections = useMemo(() => {
        const hasAnyGroup = filteredOptions.some((o) => Boolean(o.group));
        if (!hasAnyGroup) return null;

        const ungrouped: { opt: DropdownOption; flatIdx: number }[] = [];
        const groupsMap = new Map<string, { opt: DropdownOption; flatIdx: number }[]>();

        filteredOptions.forEach((opt, flatIdx) => {
            if (!opt.group) {
                ungrouped.push({ opt, flatIdx });
            } else {
                const list = groupsMap.get(opt.group) || [];
                list.push({ opt, flatIdx });
                groupsMap.set(opt.group, list);
            }
        });

        return {
            ungrouped,
            groups: Array.from(groupsMap.entries()).map(([groupName, items]) => ({
                groupName,
                items
            }))
        };
    }, [filteredOptions]);

    // Dışarı tıklayınca kapat ve aramayı sıfırla
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const isOutsideContainer = containerRef.current && !containerRef.current.contains(event.target as Node);
            const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target as Node);

            if (isOutsideContainer && isOutsideDropdown) {
                searchStringRef.current = '';
                setSearchQuery('');
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Dropdown açıldığında veya arama değiştiğinde odaklanan öğeyi ayarla
    useEffect(() => {
        if (isDropdownOpen) {
            if (!searchQuery) {
                if (value !== undefined && value !== null) {
                    const idx = filteredOptions.findIndex(o => o.id?.toString() === value?.toString());
                    setFocusedIndex(idx >= 0 ? idx : 0);
                } else {
                    setFocusedIndex(0);
                }
            } else {
                setFocusedIndex(filteredOptions.length > 0 ? 0 : (extraAction ? 0 : -1));
            }
        }
    }, [isDropdownOpen, searchQuery, value, filteredOptions.length, extraAction]);

    // Odaklanan item'ı kaydır
    useEffect(() => {
        if (isDropdownOpen && focusedIndex >= 0) {
            const el = dropdownRef.current?.querySelector('.tree-node.focused') ||
                document.body.querySelector('.custom-tree-dropdown .tree-node.focused');
            if (el) {
                el.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [focusedIndex, isDropdownOpen]);

    const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});

    useEffect(() => {
        if (!isDropdownOpen) return;

        const updatePosition = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDropdownStyles({
                    position: 'fixed',
                    top: `${rect.bottom + 4}px`,
                    left: `${rect.left}px`,
                    width: `${rect.width}px`,
                    zIndex: 9999
                });
            }
        };

        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isDropdownOpen, filteredOptions.length]);

    const isAllOptionItem = (opt?: DropdownOption) =>
        Boolean(opt && (opt.isAllOption || String(opt.id) === 'all'));

    const handleSelect = (optionId: any) => {
        searchStringRef.current = '';
        setSearchQuery('');

        if (optionId === 'EXTRA_ACTION' && extraAction) {
            setIsDropdownOpen(false);
            extraAction.onClick();
            return;
        }

        if (multiple) {
            const clickedOpt = options.find((o) => String(o.id) === String(optionId));
            const allOpt = options.find((o) => isAllOptionItem(o));
            let nextIds: (string | number)[];

            if (isAllOptionItem(clickedOpt)) {
                nextIds = [clickedOpt!.id];
            } else {
                const withoutAll = selectedIds.filter((idStr) => {
                    const matchOpt = options.find((o) => String(o.id) === idStr);
                    return !isAllOptionItem(matchOpt);
                });
                const targetStr = String(optionId);
                if (withoutAll.includes(targetStr)) {
                    const remaining = withoutAll.filter((idStr) => idStr !== targetStr);
                    nextIds = remaining.length > 0 ? remaining : (allOpt ? [allOpt.id] : []);
                } else {
                    nextIds = [...withoutAll, optionId];
                }
            }

            if (onChange) {
                const selectedRaw = options
                    .filter((o) => nextIds.map(String).includes(String(o.id)))
                    .map((o) => o.rawValue ?? o);
                onChange(nextIds, selectedRaw);
            }
            return;
        }

        if (onChange) {
            const selectedOpt = options.find(o => o.id === optionId);
            onChange(optionId, selectedOpt?.rawValue);
        }
        setIsDropdownOpen(false);

        if (autoFocusNext) {
            focusNextElement(containerRef.current);
        }
    };

    const handleGroupToggle = (groupName: string) => {
        if (!multiple || disabled) return;
        const groupOpts = options.filter((o) => o.group === groupName && !isAllOptionItem(o));
        if (groupOpts.length === 0) return;

        const groupIds = groupOpts.map((o) => String(o.id));
        const allOpt = options.find((o) => isAllOptionItem(o));
        const withoutAll = selectedIds.filter((idStr) => {
            const matchOpt = options.find((o) => String(o.id) === idStr);
            return !isAllOptionItem(matchOpt);
        });

        const isEveryGroupItemSelected = groupIds.every((gid) => withoutAll.includes(gid));
        let nextIds: string[];

        if (isEveryGroupItemSelected) {
            const remaining = withoutAll.filter((idStr) => !groupIds.includes(idStr));
            nextIds = remaining.length > 0 ? remaining : (allOpt ? [String(allOpt.id)] : []);
        } else {
            const combined = new Set([...withoutAll, ...groupIds]);
            nextIds = Array.from(combined);
        }

        if (onChange) {
            const selectedRaw = options
                .filter((o) => nextIds.includes(String(o.id)))
                .map((o) => o.rawValue ?? o);
            onChange(nextIds, selectedRaw);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;
        const totalItems = filteredOptions.length + (extraAction ? 1 : 0);

        // Alphanumeric search (Typeahead)
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            if (e.key === ' ' && !isDropdownOpen) {
                e.preventDefault();
                setIsDropdownOpen(true);
                return;
            }
            if (e.key === ' ' && searchStringRef.current.length === 0) {
                return;
            }

            e.preventDefault();
            if (!isDropdownOpen) {
                setIsDropdownOpen(true);
            }

            searchStringRef.current += e.key;
            setSearchQuery(searchStringRef.current);
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!isDropdownOpen) {
                    setIsDropdownOpen(true);
                } else if (totalItems > 0) {
                    setFocusedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev));
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (isDropdownOpen && totalItems > 0) {
                    setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (isDropdownOpen) {
                    if (extraAction && focusedIndex === filteredOptions.length) {
                        handleSelect('EXTRA_ACTION');
                    } else if (filteredOptions[focusedIndex]) {
                        handleSelect(filteredOptions[focusedIndex].id);
                    }
                } else {
                    setIsDropdownOpen(true);
                }
                break;
            case 'Escape':
            case 'Tab':
                searchStringRef.current = '';
                setSearchQuery('');
                setIsDropdownOpen(false);
                break;
            case 'Backspace':
                e.preventDefault();
                if (searchStringRef.current.length > 0) {
                    searchStringRef.current = searchStringRef.current.slice(0, -1);
                    setSearchQuery(searchStringRef.current);
                }
                break;
        }
    };

    const getOptionLabelText = (opt: DropdownOption): string => {
        if (typeof opt.label === 'string') return opt.label;
        if (opt.searchText) return opt.searchText;
        const extracted = extractTextFromNode(opt.label);
        return extracted.trim() ? extracted : `Seçildi (${opt.id})`;
    };

    let resolvedDisplayText = displayText;
    if (!resolvedDisplayText) {
        if (multiple) {
            if (selectedIds.length === 0) {
                resolvedDisplayText = '';
            } else {
                const matchedOpts = selectedIds
                    .map((idStr) => options.find((o) => String(o.id) === idStr))
                    .filter((o): o is DropdownOption => Boolean(o));
                if (matchedOpts.length > 0) {
                    resolvedDisplayText = matchedOpts.map(getOptionLabelText).join(', ');
                } else {
                    resolvedDisplayText = selectedIds.join(', ');
                }
            }
        } else {
            const selectedOpt = options.find(o => o.id?.toString() === value?.toString());
            if (selectedOpt) {
                resolvedDisplayText = getOptionLabelText(selectedOpt);
            } else if (value !== undefined && value !== null && value !== '') {
                resolvedDisplayText = `Seçildi (${value})`;
            } else {
                resolvedDisplayText = '';
            }
        }
    }

    const hasEffectiveValue = multiple
        ? selectedIds.length > 0 && !(selectedIds.length === 1 && selectedIds[0] === 'all')
        : Boolean(value);

    const inputValue = (isDropdownOpen && searchQuery) ? searchQuery : (resolvedDisplayText || '');

    return (
        <div
            ref={containerRef}
            className={`relative w-full ${className || ''}`}
            style={style}
            onBlur={(e) => {
                const isOutsideContainer = containerRef.current && !containerRef.current.contains(e.relatedTarget as Node);
                const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget as Node);

                if (isOutsideContainer && isOutsideDropdown) {
                    searchStringRef.current = '';
                    setSearchQuery('');
                    setIsDropdownOpen(false);
                }
            }}
            tabIndex={-1}
        >
            <div className={`dropdown-secici-wrapper ${effectiveError ? 'is-invalid' : ''}`}>
                <input
                    id={id || 'dropdown-secici'}
                    type="text"
                    className={`form-input ${effectiveError ? 'is-invalid' : ''} ${clearable && hasEffectiveValue ? 'has-clear' : ''}`}
                    value={inputValue}
                    onChange={() => { }}
                    onKeyDown={handleKeyDown}
                    onClick={() => {
                        if (openOnClick && !disabled && !isDropdownOpen) {
                            setIsDropdownOpen(true);
                        }
                    }}
                    disabled={disabled}
                    readOnly
                    placeholder={placeholder || 'Seçiniz...'}
                    autoComplete="off"
                />
                <div className="dropdown-action-container">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (disabled) return;
                            if (clearable && hasEffectiveValue) {
                                // For dropdowns, immediately clear without alert, as standard dropdowns do
                                const allOpt = options.find((o) => isAllOptionItem(o));
                                if (onChange) {
                                    onChange(multiple ? (allOpt ? [allOpt.id] : []) : null, null);
                                }
                                searchStringRef.current = '';
                                setSearchQuery('');
                            } else {
                                if (isDropdownOpen) {
                                    searchStringRef.current = '';
                                    setSearchQuery('');
                                }
                                setIsDropdownOpen(!isDropdownOpen);
                            }
                        }}
                        disabled={disabled}
                        tabIndex={-1}
                        title={(clearable && hasEffectiveValue) ? "Seçimi Temizle" : "Seçim Menüsü"}
                        className="dropdown-action-btn"
                    >
                        {(clearable && hasEffectiveValue) ? <X size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            {isDropdownOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="custom-tree-dropdown fade-in-fast"
                    style={dropdownStyles}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
                            e.nativeEvent.stopImmediatePropagation();
                        }
                    }}
                >
                    <div className="tree-content">
                        {filteredOptions.length === 0 ? (
                            <div className="tree-node-empty">
                                {emptyMessage || 'Sonuç bulunamadı'}
                            </div>
                        ) : groupedSections ? (
                            <>
                                {groupedSections.ungrouped.map(({ opt: o, flatIdx: idx }) => {
                                    const isSelected = selectedIdSet.has(String(o.id));
                                    return (
                                        <div
                                            key={o.id}
                                            className={`tree-node ${focusedIndex === idx ? 'focused' : ''} ${isSelected ? 'selected' : ''}`}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
                                                    e.nativeEvent.stopImmediatePropagation();
                                                }
                                                handleSelect(o.id);
                                            }}
                                            onMouseEnter={() => setFocusedIndex(idx)}
                                        >
                                            <div className="tree-node-content flex justify-between items-center w-full">
                                                <div className={`tree-node-label flex-1 flex items-center ${isSelected ? 'font-semibold' : ''}`}>
                                                    {multiple && (
                                                        <span className={`tree-multi-checkbox ${isSelected ? 'checked' : ''}`}>
                                                            {isSelected && <Check size={12} />}
                                                        </span>
                                                    )}
                                                    {renderOptionLabel(o, searchQuery)}
                                                </div>
                                                {!multiple && isSelected && <Check size={18} className="tree-check-icon" />}
                                            </div>
                                        </div>
                                    );
                                })}

                                {groupedSections.groups.map(({ groupName, items }) => {
                                    const groupSelectableItems = items.filter(({ opt }) => !isAllOptionItem(opt));
                                    const selectedCountInGroup = groupSelectableItems.filter(({ opt }) =>
                                        selectedIdSet.has(String(opt.id))
                                    ).length;
                                    const isAllGroupSelected =
                                        groupSelectableItems.length > 0 &&
                                        selectedCountInGroup === groupSelectableItems.length;
                                    const isPartialGroupSelected =
                                        selectedCountInGroup > 0 && !isAllGroupSelected;

                                    return (
                                        <React.Fragment key={`group_${groupName}`}>
                                            <div
                                                className={`tree-group-header ${multiple ? 'selectable' : ''} ${isAllGroupSelected ? 'group-selected' : ''
                                                    }`}
                                                onMouseDown={(e) => {
                                                    if (!multiple) return;
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
                                                        e.nativeEvent.stopImmediatePropagation();
                                                    }
                                                    handleGroupToggle(groupName);
                                                }}
                                            >
                                                <div className="flex items-center">
                                                    {multiple && (
                                                        <span
                                                            className={`tree-multi-checkbox ${isAllGroupSelected
                                                                    ? 'checked'
                                                                    : isPartialGroupSelected
                                                                        ? 'partial'
                                                                        : ''
                                                                }`}
                                                        >
                                                            {isAllGroupSelected ? (
                                                                <Check size={12} />
                                                            ) : isPartialGroupSelected ? (
                                                                <Minus size={12} />
                                                            ) : null}
                                                        </span>
                                                    )}
                                                    <span>{groupName}</span>
                                                </div>
                                                {multiple && groupSelectableItems.length > 0 && (
                                                    <span className="tree-group-badge">
                                                        {selectedCountInGroup}/{groupSelectableItems.length}
                                                    </span>
                                                )}
                                            </div>

                                            {items.map(({ opt: o, flatIdx: idx }) => {
                                                const isSelected = selectedIdSet.has(String(o.id));
                                                return (
                                                    <div
                                                        key={o.id}
                                                        className={`tree-node grouped-item ${focusedIndex === idx ? 'focused' : ''} ${isSelected ? 'selected' : ''
                                                            }`}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
                                                                e.nativeEvent.stopImmediatePropagation();
                                                            }
                                                            handleSelect(o.id);
                                                        }}
                                                        onMouseEnter={() => setFocusedIndex(idx)}
                                                    >
                                                        <div className="tree-node-content flex justify-between items-center w-full">
                                                            <div
                                                                className={`tree-node-label flex-1 flex items-center ${isSelected ? 'font-semibold' : ''
                                                                    }`}
                                                            >
                                                                {multiple && (
                                                                    <span
                                                                        className={`tree-multi-checkbox ${isSelected ? 'checked' : ''
                                                                            }`}
                                                                    >
                                                                        {isSelected && <Check size={12} />}
                                                                    </span>
                                                                )}
                                                                {renderOptionLabel(o, searchQuery)}
                                                            </div>
                                                            {!multiple && isSelected && (
                                                                <Check size={18} className="tree-check-icon" />
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })}
                            </>
                        ) : (
                            filteredOptions.map((o, idx) => {
                                const isSelected = selectedIdSet.has(String(o.id));
                                return (
                                    <div
                                        key={o.id}
                                        className={`tree-node ${focusedIndex === idx ? 'focused' : ''} ${isSelected ? 'selected' : ''}`}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
                                                e.nativeEvent.stopImmediatePropagation();
                                            }
                                            handleSelect(o.id);
                                        }}
                                        onMouseEnter={() => setFocusedIndex(idx)}
                                    >
                                        <div className="tree-node-content flex justify-between items-center w-full">
                                            <div className={`tree-node-label flex-1 flex items-center ${isSelected ? 'font-semibold' : ''}`}>
                                                {multiple && (
                                                    <span className={`tree-multi-checkbox ${isSelected ? 'checked' : ''}`}>
                                                        {isSelected && <Check size={12} />}
                                                    </span>
                                                )}
                                                {renderOptionLabel(o, searchQuery)}
                                            </div>
                                            {!multiple && isSelected && <Check size={18} className="tree-check-icon" />}
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {extraAction && (
                            <div
                                className={`tree-node tree-node-extra-action ${focusedIndex === filteredOptions.length ? 'focused' : ''}`}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
                                        e.nativeEvent.stopImmediatePropagation();
                                    }
                                    handleSelect('EXTRA_ACTION');
                                }}
                                onMouseEnter={() => setFocusedIndex(filteredOptions.length)}
                            >
                                <div className="tree-node-content flex items-center">
                                    {extraAction.icon && <span className="mr-2 flex items-center">{extraAction.icon}</span>}
                                    <span className="tree-node-label">{extraAction.label}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default BaseDropdownSecici;
