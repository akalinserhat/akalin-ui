/**
 * @file IbanInput.tsx
 * @description 
 * Akalin UI - IBAN Giriş ve Formatlama Bileşeni (IbanInput)
 * 
 * Başlıca Görevleri:
 * - IBAN metnini 4'erli bloklar halinde formatlayarak kullanıcıya gösterir.
 * - Uluslararası standart MOD-97 algoritması ile anlık IBAN doğrulaması yapar.
 * - Geçerlilik durumunu görsel hata mesajı ile anlık bildirir.
 * - Blok boşlukları eklendiğinde veya silindiğinde imleç (cursor) konumunu akıllıca korur.
 */

import React, { useState, useEffect, useLayoutEffect, useRef, forwardRef, useCallback } from 'react';
import { CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BaseInput from '../base/input/BaseInput';

export interface IbanInputProps {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onValidityChange?: (isValid: boolean) => void;
    name?: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
    inputClassName?: string;
    style?: React.CSSProperties;
    autoFocus?: boolean;
    disabled?: boolean;
    error?: boolean | string;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * IBAN MOD-97 algoritması ile matematiksel doğrulama
 */
export const validateIBAN = (iban: string): boolean => {
    const sanitizedIBAN = iban.replace(/\s+/g, '').toUpperCase();
    if (sanitizedIBAN.length < 15) return false;
    
    const rearranged = sanitizedIBAN.substr(4) + sanitizedIBAN.substr(0, 4);
    
    let numericIBAN = '';
    for (let i = 0; i < rearranged.length; i++) {
        const code = rearranged.charCodeAt(i);
        if (code >= 65 && code <= 90) { 
            numericIBAN += (code - 55).toString();
        } else {
            numericIBAN += rearranged[i];
        }
    }

    let remainder = numericIBAN;
    let block;
    while (remainder.length > 2) {
        block = remainder.slice(0, 9);
        remainder = (parseInt(block, 10) % 97) + remainder.slice(block.length);
    }
    
    return parseInt(remainder, 10) % 97 === 1;
};

/**
 * IBAN'ı 4'erli bloklar halinde formatlar (örn: TR00 0000 0000 ...)
 */
export const formatIBAN = (iban: string): string => {
    let clean = iban.replace(/[^a-zA-Z0-9]/gi, '').toUpperCase();
    let formatted = '';
    for (let i = 0; i < clean.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formatted += ' ';
        }
        formatted += clean[i];
    }
    return formatted;
};

/**
 * Formatlanmış IBAN metni içerisinde hedeflenen alfanümerik karakter sayısına karşılık gelen imleç konumunu hesaplar.
 */
export const calculateNewCursorPosition = (formatted: string, targetCharsCount: number): number => {
    if (targetCharsCount <= 0 || !formatted) return 0;

    let counted = 0;
    for (let i = 0; i < formatted.length; i++) {
        if (/[a-zA-Z0-9]/.test(formatted[i])) {
            counted++;
            if (counted === targetCharsCount) {
                return i + 1;
            }
        }
    }
    return formatted.length;
};

export const IbanInput = forwardRef<HTMLInputElement, IbanInputProps>(({
    value,
    onChange,
    onValidityChange,
    name,
    placeholder = "TR00 0000 0000 0000 0000 0000 00",
    required = false,
    className = "",
    inputClassName,
    style,
    autoFocus,
    disabled,
    error,
    onBlur,
    onKeyDown
}, ref) => {
    const { t } = useTranslation();
    const [displayValue, setDisplayValue] = useState<string>(() => formatIBAN(value || ''));
    const [isValid, setIsValid] = useState<boolean>(() => {
        const cleanVal = (value || '').replace(/\s+/g, '');
        return cleanVal ? validateIBAN(cleanVal) : true;
    });

    const inputRef = useRef<HTMLInputElement | null>(null);
    const nextCursorPosRef = useRef<number | null>(null);
    const clearTimerRef = useRef<any>(null);
    const onValidityChangeRef = useRef(onValidityChange);

    useEffect(() => {
        onValidityChangeRef.current = onValidityChange;
    }, [onValidityChange]);

    const setCombinedRef = useCallback((node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') {
            ref(node);
        } else if (ref) {
            (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
    }, [ref]);

    // Dışarıdan value prop'u değiştiğinde senkronize et
    useEffect(() => {
        const cleanVal = (value || '').replace(/\s+/g, '');
        if (cleanVal) {
            const formatted = formatIBAN(cleanVal);
            setDisplayValue(formatted);
            const valid = validateIBAN(cleanVal);
            setIsValid(valid);
            if (onValidityChangeRef.current) onValidityChangeRef.current(valid);
        } else {
            setDisplayValue('');
            setIsValid(true);
            if (onValidityChangeRef.current) onValidityChangeRef.current(false);
        }
    }, [value]);

    // Render commit sonrasında imleci hedef pozisyonda tut
    useLayoutEffect(() => {
        if (nextCursorPosRef.current !== null && inputRef.current) {
            const pos = nextCursorPosRef.current;
            inputRef.current.setSelectionRange(pos, pos);
        }
    });

    const setSelection = useCallback((pos: number) => {
        nextCursorPosRef.current = pos;

        if (clearTimerRef.current) {
            clearTimeout(clearTimerRef.current);
        }

        const apply = () => {
            if (inputRef.current) {
                inputRef.current.setSelectionRange(pos, pos);
            }
        };

        // 1. Anlık çağrı
        apply();

        // 2. Microtask / Sıfır gecikmeli timeout
        setTimeout(apply, 0);

        // 3. Çift frame animasyon döngüsü (React render ve paint sonrasını garantiye alma)
        requestAnimationFrame(() => {
            apply();
            requestAnimationFrame(apply);
        });

        // 100ms sonra hedef imleç referansını temizle
        clearTimerRef.current = setTimeout(() => {
            nextCursorPosRef.current = null;
        }, 100);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const cursorPositionBefore = input.selectionStart || 0;
        const rawInput = input.value;
        const charsBeforeCursor = rawInput.slice(0, cursorPositionBefore).replace(/[^a-zA-Z0-9]/g, '').length;

        const rawValue = rawInput.replace(/[^a-zA-Z0-9]/gi, '').toUpperCase();
        if (rawValue.length > 34) return;
        
        const formatted = formatIBAN(rawValue);
        setDisplayValue(formatted);

        const newPos = calculateNewCursorPosition(formatted, charsBeforeCursor);
        setSelection(newPos);
        
        const valid = validateIBAN(rawValue);
        setIsValid(rawValue.length === 0 ? true : valid);
        if (onValidityChangeRef.current) onValidityChangeRef.current(valid);

        if (onChange) {
            const fakeEvent = {
                ...e,
                target: {
                    ...e.target,
                    name: e.target.name,
                    value: rawValue
                },
                rawValue,
                isValid: valid
            };
            onChange(fakeEvent as any);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (onKeyDown) {
            onKeyDown(e);
            if (e.defaultPrevented) return;
        }

        if (e.key === 'Backspace') {
            const input = e.currentTarget;
            const start = input.selectionStart;
            const end = input.selectionEnd;

            // Tekil imleç ve imlecin solundaki karakter blok boşluğu ise
            if (start !== null && start === end && start > 0) {
                const val = input.value;
                if (val[start - 1] === ' ') {
                    e.preventDefault();

                    // Boşluktan önceki karakteri bul ve sil
                    let targetDeleteIndex = -1;
                    for (let i = start - 1; i >= 0; i--) {
                        if (/[a-zA-Z0-9]/.test(val[i])) {
                            targetDeleteIndex = i;
                            break;
                        }
                    }

                    if (targetDeleteIndex !== -1) {
                        const newVal = val.slice(0, targetDeleteIndex) + val.slice(targetDeleteIndex + 1);
                        const rawValue = newVal.replace(/[^a-zA-Z0-9]/gi, '').toUpperCase();
                        const formatted = formatIBAN(rawValue);
                        setDisplayValue(formatted);

                        const charsBefore = val.slice(0, targetDeleteIndex).replace(/[^a-zA-Z0-9]/gi, '').length;
                        const newPos = calculateNewCursorPosition(formatted, charsBefore);
                        setSelection(newPos);

                        const valid = validateIBAN(rawValue);
                        setIsValid(rawValue.length === 0 ? true : valid);
                        if (onValidityChangeRef.current) onValidityChangeRef.current(valid);

                        if (onChange) {
                            const fakeEvent = {
                                ...e,
                                target: {
                                    ...input,
                                    name: input.name,
                                    value: rawValue
                                },
                                rawValue,
                                isValid: valid
                            };
                            onChange(fakeEvent as any);
                        }
                    }
                }
            }
        }
    };

    return (
        <div style={style} className={`w-full relative ${className || ''}`}>
            <BaseInput
                ref={setCombinedRef}
                icon={<CreditCard size={16} />}
                type="text"
                casing="none"
                harfDonusumu="none"
                harfFormati="none"
                textTransform="none"
                name={name}
                value={displayValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={onBlur}
                placeholder={placeholder}
                required={required}
                inputClassName={inputClassName || "w-full"}
                autoFocus={autoFocus}
                disabled={disabled}
                error={Boolean(error) || (displayValue.length > 0 && !isValid)}
                maxLength={42} 
            />
            {displayValue.length > 0 && !isValid && (
                <span className="text-xs text-danger mt-1 block">
                    {t('auto_gecersiz_iban_format_060d', 'Geçersiz IBAN formatı')}
                </span>
            )}
        </div>
    );
});

IbanInput.displayName = 'IbanInput';

export default IbanInput;
