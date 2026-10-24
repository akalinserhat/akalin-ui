/**
 * Webakus UI Core - Seri Numarası Giriş ve Tutucu Alanı (SeriNumaraTutucu / SeriNumaraInput)
 * 
 * Başlıca Görevleri:
 * - Tablo satırlarında veya formlarda ürün seri numarası dizisini virgülle ayrılmış biçimde göstermek ve düzenlemek
 * - Satır içi hızlı metin girişi ile klavye (Enter/Blur) ve toplu barkod okuma butonunu desteklemek
 * - Düzenleme modunda SeriNoGirisModal, salt-okunur modda UrunSeriNoListModal pencerelerini tetiklemek
 */

import React, { useState, useEffect } from 'react';
import { MoreVertical, Barcode } from 'lucide-react';
import UrunSeriNoListModal from '../modal/UrunSeriNoListModal';
import SeriNoGirisModal from '../modal/SeriNoGirisModal';

export interface SeriNumaraTutucuProps {
    id?: string;
    value?: string[];
    tumSeriNolar?: string[];
    onChange?: (seriNolar: string[]) => void;
    disabled?: boolean;
    urun?: {
        id?: string;
        ad?: string;
        seriNoUzunlugu?: number;
        seriNoOneki?: string;
        [key: string]: any;
    };
    beklenenAdet?: number;
    isGiris?: boolean;
    style?: React.CSSProperties;
    className?: string;
    placeholder?: string;
    onTopluOkutmaClick?: () => void;
}

const SeriNumaraTutucu: React.FC<SeriNumaraTutucuProps> = ({ 
    id = 'seriNumaraTutucu',
    value = [], 
    tumSeriNolar = [], 
    onChange, 
    disabled = false, 
    urun, 
    beklenenAdet, 
    isGiris = false, 
    style, 
    className = '', 
    placeholder = 'Seri numaraları...',
    onTopluOkutmaClick 
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inputValue, setInputValue] = useState(Array.isArray(value) ? value.join(', ') : '');

    useEffect(() => {
        const newVal = Array.isArray(value) ? value.join(', ') : '';
        setInputValue(newVal);
    }, [value]);

    const handleOpen = () => {
        if (!disabled) setIsModalOpen(true);
    };

    const handleTopluOkutma = () => {
        if (!disabled && onTopluOkutmaClick) {
            onTopluOkutmaClick();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleBlur = () => {
        if (!onChange) return;
        const arr = inputValue.split(',').map(s => s.trim()).filter(s => s !== '');
        onChange(arr);
        setInputValue(arr.join(', '));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleBlur();
        }
    };

    const isReadOnly = !onChange || disabled;
    const canUseGirisModal = !isReadOnly && urun && beklenenAdet !== undefined && beklenenAdet > 0;

    return (
        <div 
            id={id}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', height: '100%', ...style }} 
            className={className}
        >
            <input
                type="text"
                readOnly={isReadOnly}
                value={inputValue}
                onChange={isReadOnly ? undefined : handleInputChange}
                onBlur={isReadOnly ? undefined : handleBlur}
                onKeyDown={isReadOnly ? undefined : handleKeyDown}
                placeholder={placeholder}
                title={inputValue}
                autoComplete="off"
                className={`grid-input ${onTopluOkutmaClick || !disabled ? 'with-icon' : ''}`}
                style={{
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                }}
            />
            <div style={{ position: 'absolute', right: '4px', display: 'flex', alignItems: 'center' }}>
                <button
                    type="button"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        if (!disabled) {
                            e.preventDefault();
                            if (onTopluOkutmaClick) {
                                handleTopluOkutma();
                            } else {
                                handleOpen();
                            }
                        }
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onTopluOkutmaClick) {
                            handleTopluOkutma();
                        } else {
                            handleOpen();
                        }
                    }}
                    disabled={disabled}
                    tabIndex={-1}
                    title={onTopluOkutmaClick ? "Toplu Seri No Okut" : "Seri Numaralarını Yönet"}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '6px',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {onTopluOkutmaClick ? <Barcode size={16} /> : <MoreVertical size={16} />}
                </button>
            </div>

            {isModalOpen && (
                canUseGirisModal ? (
                    <SeriNoGirisModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        urun={urun}
                        beklenenAdet={beklenenAdet!}
                        mevcutSeriNolar={value}
                        tumSeriNolar={tumSeriNolar}
                        isGiris={isGiris}
                        onSave={(newSeriNolar) => {
                            if (onChange) onChange(newSeriNolar);
                            setInputValue(newSeriNolar.join(', '));
                            setIsModalOpen(false);
                        }}
                    />
                ) : (
                    <UrunSeriNoListModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        urun={urun}
                        mevcutSeriNolar={value}
                    />
                )
            )}
        </div>
    );
};

export default SeriNumaraTutucu;
export { SeriNumaraTutucu as SeriNumaraInput };
