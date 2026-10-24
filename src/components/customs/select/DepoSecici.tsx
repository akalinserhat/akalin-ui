/**
 * @file DepoSecici.tsx
 * @description Webakus ERP - Depo Seçici Bileşeni.
 * API'den veya statik listeden depoları yükleyerek portal tabanlı açılır menü (dropdown) ile depo seçimi yapılmasını sağlar.
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Check, ExternalLink, Warehouse } from 'lucide-react';
import { createPortal } from 'react-dom';
import { BaseSeciciInput } from '@akalin/ui';

export interface DepoItem {
    id: number | string;
    ad?: string;
    depoAdi?: string;
    kod?: string;
    depoKodu?: string;
    [key: string]: any;
}

export interface DepoSeciciProps {
    id?: string;
    name?: string;
    value?: number | string | null;
    onChange?: (e: { target: { name?: string; value: any } }) => void;
    disabled?: boolean;
    options?: DepoItem[] | null;
    placeholder?: string;
    className?: string;
    variant?: 'default' | 'grid';
    error?: boolean;
    style?: React.CSSProperties;
}

const DepoSecici: React.FC<DepoSeciciProps> = ({ 
    id = 'depoId',
    name = "depoId", 
    value, 
    onChange, 
    disabled = false, 
    options = null, 
    placeholder = "Depo Seçin",
    className = "form-input",
    variant = 'default',
    error,
    style
}) => {
    const [depolar, setDepolar] = useState<DepoItem[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});
    const dropdownRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (options) {
            setDepolar(options);
            return;
        }
        
        let isMounted = true;
        const fetchDepolar = async () => {
            try {
                const res = await axios.get('/api/Depolar');
                if (isMounted) {
                    const data = res.data?.veriler || res.data || [];
                    setDepolar(data);
                }
            } catch (err) {
                if (isMounted) toast.error("Depolar yüklenemedi.");
            }
        };
        fetchDepolar();
        
        return () => {
            isMounted = false;
        };
    }, [options]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && 
                menuRef.current && !menuRef.current.contains(e.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updatePosition = () => {
        if (dropdownRef.current && isDropdownOpen) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setDropdownStyles({
                position: 'fixed',
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
                background: 'var(--bg-primary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                maxHeight: '280px',
                overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            });
        }
    };

    useEffect(() => {
        if (isDropdownOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isDropdownOpen]);

    // Dropdown açıldığında ekranın altına taşıyorsa scroll yap
    useEffect(() => {
        if (isDropdownOpen && menuRef.current) {
            setTimeout(() => {
                if (!menuRef.current) return;
                const rect = menuRef.current.getBoundingClientRect();
                const isOutOfViewport = rect.bottom > (window.innerHeight || document.documentElement.clientHeight);
                if (isOutOfViewport && dropdownRef.current) {
                    const inputRect = dropdownRef.current.getBoundingClientRect();
                    setDropdownStyles(prev => ({
                        ...prev,
                        top: inputRect.top - rect.height - 4
                    }));
                }
            }, 50);
        }
    }, [isDropdownOpen]);

    // Odaklanan item'ı kaydır
    useEffect(() => {
        if (isDropdownOpen && focusedIndex >= 0) {
            const el = document.querySelector('.tree-node.focused');
            if (el) el.scrollIntoView({ block: 'nearest' });
        }
    }, [focusedIndex, isDropdownOpen]);

    useEffect(() => {
        if (isDropdownOpen) {
            if (value) {
                const idx = depolar.findIndex(d => String(d.id) === String(value));
                setFocusedIndex(idx >= 0 ? idx : 0);
            } else {
                setFocusedIndex(0);
            }
        }
    }, [isDropdownOpen, value, depolar]);

    const handleSelect = (depo: DepoItem | null) => {
        if (onChange) {
            onChange({
                target: {
                    name,
                    value: depo ? depo.id : ''
                }
            });
        }
        setIsDropdownOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isDropdownOpen) {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setIsDropdownOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(prev => Math.min(prev + 1, depolar.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter': {
                e.preventDefault();
                const item = depolar[focusedIndex];
                if (item) handleSelect(item);
                break;
            }
            case 'Escape':
                e.preventDefault();
                setIsDropdownOpen(false);
                break;
        }
    };

    const selectedDepo = depolar.find(d => String(d.id) === String(value));
    const displayName = selectedDepo ? (selectedDepo.ad || selectedDepo.depoAdi || selectedDepo.kod || '') : '';

    return (
        <div 
            style={{ position: 'relative', width: '100%', ...style }} 
            ref={dropdownRef}
            onBlur={(e) => {
                if (
                    dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget as Node) &&
                    (!menuRef.current || !menuRef.current.contains(e.relatedTarget as Node))
                ) {
                    setIsDropdownOpen(false);
                }
            }}
        >
            <BaseSeciciInput
                id={id}
                value={displayName}
                onChange={() => {}}
                onKeyDown={disabled ? undefined : handleKeyDown}
                onMenuClick={() => {
                    if (!disabled) {
                        setIsDropdownOpen(prev => !prev);
                    }
                }}
                onClick={() => {
                    if (!disabled) {
                        setIsDropdownOpen(prev => !prev);
                    }
                }}
                hasSelection={!!value}
                onClear={() => {
                    handleSelect(null);
                }}
                disabled={disabled}
                readOnly={true}
                error={error}
                placeholder={placeholder || 'Depo Seçin...'}
                isMenuOpen={isDropdownOpen}
                detailsUrl={value ? `/ayarlar/sistem` : null}
                detailsUrlTitle="Depo Ayarlarına Git"
                icon={<Warehouse size={16} />}
                inputClassName={variant === 'grid' ? '' : className}
                inputStyle={{ 
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    caretColor: 'transparent',
                    ...(variant === 'grid' ? {
                        border: 'none',
                        background: 'transparent',
                        paddingLeft: '12px',
                        paddingRight: '28px',
                        borderRadius: '0',
                        fontSize: '13px',
                        height: '100%',
                        boxSizing: 'border-box',
                        outline: 'none',
                        boxShadow: 'none'
                    } : {})
                }}
                clearable={false}
            />

            {isDropdownOpen && !disabled && createPortal(
                <div
                    ref={menuRef}
                    className="custom-tree-dropdown fade-in-fast"
                    tabIndex={-1}
                    style={dropdownStyles}
                >
                    {depolar.length === 0 ? (
                        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                            Depo bulunamadı.
                        </div>
                    ) : (
                        depolar.map((depo, idx) => {
                            const isSelected = String(depo.id) === String(value);
                            const itemLabel = depo.ad || depo.depoAdi || depo.kod || `Depo #${depo.id}`;
                            return (
                                <div
                                    key={depo.id}
                                    className={`tree-node leaf ${isSelected ? 'selected' : ''} ${idx === focusedIndex ? 'focused' : ''}`}
                                    style={{ paddingLeft: '12px', display: 'flex', alignItems: 'center', paddingRight: '8px' }}
                                    onClick={() => handleSelect(depo)}
                                    onMouseEnter={() => setFocusedIndex(idx)}
                                >
                                    <span className="tree-node-label" style={{ flex: 1 }}>{itemLabel}</span>
                                    {isSelected && <Check size={14} className="tree-check-icon" style={{ marginRight: '8px' }} />}
                                    <a 
                                        href="/ayarlar/sistem"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Depo Ayarlarına Git"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ 
                                             display: 'flex',
                                             alignItems: 'center',
                                             color: 'var(--accent-primary)',
                                             textDecoration: 'none',
                                             padding: '4px'
                                        }}
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </div>
                            );
                        })
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

export default DepoSecici;
