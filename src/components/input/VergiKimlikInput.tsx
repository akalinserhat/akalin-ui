/**
 * Webakus UI Core - Vergi Kimlik Numarası (VKN) ve T.C. Kimlik Numarası (TCKN) Giriş Bileşeni (VergiKimlikInput)
 * 
 * Başlıca Görevleri:
 * - Sol tarafında VKN (10 hane / Kurumsal) veya TCKN (11 hane / Bireysel) türünü seçen pulldown menü sunar.
 * - Türkiye VKN (Mod-9/Mod-10) ve T.C. Kimlik Numarası (Mod-10/Mod-11) algoritmalarıyla anlık matematiksel doğrulama yapar.
 * - Yalnızca sayısal karakter girişine izin verir ve seçilen türe göre maksimum karakter uzunluğunu (10 veya 11) sınırlar.
 * - Geçerlilik durumunu sağ taraftaki onay/uyarı ikonları ve sayaç ile anlık olarak kullanıcıya görsel olarak bildirir.
 */

import React, { useState, useEffect, forwardRef } from 'react';
import { Check, AlertCircle } from 'lucide-react';

export type VergiKimlikTuru = 'VKN' | 'TCKN';

export interface VergiKimlikInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    /**
     * Seçili kimlik / vergi türü ('VKN' veya 'TCKN').
     */
    typeMode?: VergiKimlikTuru;
    /**
     * Varsayılan kimlik / vergi türü ('VKN' veya 'TCKN', varsayılan: 'VKN').
     */
    defaultTypeMode?: VergiKimlikTuru;
    /**
     * Tür değiştiğinde tetiklenen callback fonksiyonu.
     */
    onTypeModeChange?: (type: VergiKimlikTuru) => void;
    /**
     * Pulldown tür seçici menüsünü devre dışı bırakır.
     */
    disableTypeSelect?: boolean;
    /**
     * Değer değiştiğinde tetiklenen fonksiyon (hem React native event hem de obje desteği).
     */
    onChange?: (e: React.ChangeEvent<HTMLInputElement> & { target: { name?: string; value: string; typeMode: VergiKimlikTuru; isValid: boolean } } | any) => void;
    /**
     * Geçerlilik durumu değiştiğinde tetiklenen bildirim fonksiyonu.
     */
    onValidityChange?: (isValid: boolean, typeMode: VergiKimlikTuru, errorText?: string) => void;
    /**
     * Sağ tarafta geçerlilik onay / uyarı ikonunun gösterilip gösterilmeyeceği (varsayılan: true).
     */
    showValidationIcon?: boolean;
    /**
     * Dışarıdan gelen form hata durumu.
     */
    error?: string | boolean;
    /**
     * Ek sarmalayıcı sınıf adı.
     */
    className?: string;
    /**
     * Ek stil özellikleri.
     */
    style?: React.CSSProperties;
}

/**
 * Türkiye Vergi Kimlik Numarası (VKN) algoritma doğrulaması (10 basamak, Mod-9 / Mod-10 kontrolü).
 */
export const validateVKN = (vkn: string): boolean => {
    if (!vkn) return false;
    const clean = String(vkn).replace(/\D/g, '');
    if (clean.length !== 10) return false;

    const digits = clean.split('').map(Number);
    let sum = 0;

    for (let i = 0; i < 9; i++) {
        const v1 = (digits[i] + 10 - (i + 1)) % 10;
        if (v1 === 9) {
            sum += 9;
        } else {
            const v2 = (v1 * Math.pow(2, 9 - i)) % 9;
            sum += v2;
        }
    }

    const lastDigit = (10 - (sum % 10)) % 10;
    return lastDigit === digits[9];
};

/**
 * Türkiye Cumhuriyeti Kimlik Numarası (TCKN) algoritma doğrulaması (11 basamak, Mod-10 / Mod-11 kontrolü).
 */
export const validateTCKN = (tckn: string): boolean => {
    if (!tckn) return false;
    const clean = String(tckn).replace(/\D/g, '');
    if (clean.length !== 11) return false;
    if (clean[0] === '0') return false; // İlk hane 0 olamaz

    const digits = clean.split('').map(Number);

    // 1, 3, 5, 7, 9. haneler (0, 2, 4, 6, 8 indeksleri)
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    // 2, 4, 6, 8. haneler (1, 3, 5, 7 indeksleri)
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

    // 10. hane kontrolü: ((oddSum * 7) - evenSum) % 10
    let tenth = (oddSum * 7 - evenSum) % 10;
    if (tenth < 0) tenth += 10;
    if (tenth !== digits[9]) return false;

    // 11. hane kontrolü: İlk 10 hanenin toplamı % 10
    const firstTenSum = digits.slice(0, 10).reduce((acc, curr) => acc + curr, 0);
    const eleventh = firstTenSum % 10;
    if (eleventh !== digits[10]) return false;

    return true;
};

/**
 * Türüne göre genel doğrulama fonksiyonu.
 */
export const validateVergiKimlik = (value: string, type: VergiKimlikTuru = 'VKN'): boolean => {
    if (!value) return false;
    const clean = String(value).replace(/\D/g, '');
    if (type === 'VKN') {
        return validateVKN(clean);
    }
    return validateTCKN(clean);
};

const VergiKimlikInput = forwardRef<HTMLInputElement, VergiKimlikInputProps>(({
    typeMode,
    defaultTypeMode = 'VKN',
    onTypeModeChange,
    disableTypeSelect = false,
    value = '',
    onChange,
    onValidityChange,
    showValidationIcon = true,
    error,
    className = '',
    style = {},
    placeholder,
    disabled = false,
    required = false,
    autoFocus = false,
    name,
    onFocus,
    onBlur,
    ...rest
}, ref) => {
    const [selectedType, setSelectedType] = useState<VergiKimlikTuru>(() => {
        if (typeMode) return typeMode;
        const clean = String(value || '').replace(/\D/g, '');
        if (clean.length === 11) return 'TCKN';
        if (clean.length === 10) return 'VKN';
        return defaultTypeMode;
    });

    const [isFocused, setIsFocused] = useState(false);

    // Dışarıdan kontrollü typeMode prop'u gelirse güncelle
    useEffect(() => {
        if (typeMode && typeMode !== selectedType) {
            setSelectedType(typeMode);
        }
    }, [typeMode]);

    const cleanValue = String(value || '').replace(/\D/g, '');
    const currentMax = selectedType === 'VKN' ? 10 : 11;
    const isValid = validateVergiKimlik(cleanValue, selectedType);
    const isComplete = cleanValue.length === currentMax;
    const hasError = Boolean(error || (isComplete && !isValid));

    useEffect(() => {
        if (onValidityChange) {
            if (!cleanValue) {
                onValidityChange(true, selectedType);
            } else {
                onValidityChange(isValid, selectedType, isValid ? undefined : (selectedType === 'VKN' ? 'Geçersiz Vergi Numarası (VKN)' : 'Geçersiz T.C. Kimlik Numarası (TCKN)'));
            }
        }
    }, [cleanValue, isValid, selectedType, onValidityChange]);

    const handleTypeSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as VergiKimlikTuru;
        setSelectedType(newType);
        if (onTypeModeChange) {
            onTypeModeChange(newType);
        }

        // Tür değiştiğinde mevcut değer yeni uzunluğu aşıyorsa kısalt
        const maxLen = newType === 'VKN' ? 10 : 11;
        let truncatedValue = cleanValue;
        if (truncatedValue.length > maxLen) {
            truncatedValue = truncatedValue.slice(0, maxLen);
        }

        if (onChange) {
            const valid = validateVergiKimlik(truncatedValue, newType);
            const fakeEvent = {
                target: {
                    name,
                    value: truncatedValue,
                    typeMode: newType,
                    isValid: valid
                }
            };
            onChange(fakeEvent as any);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Sadece rakamları al
        const raw = e.target.value.replace(/\D/g, '');
        const maxLen = selectedType === 'VKN' ? 10 : 11;
        const limitedValue = raw.slice(0, maxLen);

        const valid = validateVergiKimlik(limitedValue, selectedType);

        if (onChange) {
            e.target.value = limitedValue;
            (e as any).target.typeMode = selectedType;
            (e as any).target.isValid = valid;
            onChange(e);
        }
    };

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
    };

    const defaultPlaceholder = placeholder || (selectedType === 'VKN' ? '10 Haneli VKN' : '11 Haneli TCKN');

    return (
        <div
            className={`vergi-kimlik-input-container ${hasError ? 'is-invalid' : ''} ${isFocused ? 'is-focused' : ''} ${className || ''}`}
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                ...style
            }}
        >
            {/* Sol Pulldown Menü (VKN / TCKN Seçimi) */}
            <div className="vergi-kimlik-select-wrapper">
                <select
                    value={selectedType}
                    onChange={handleTypeSelectChange}
                    disabled={disabled || disableTypeSelect}
                    className="vergi-kimlik-type-select"
                    aria-label="Vergi veya TCKN Türü"
                >
                    <option value="VKN">VKN</option>
                    <option value="TCKN">TCKN</option>
                </select>
            </div>

            <div className="vergi-kimlik-divider" />

            {/* Sayısal Giriş Alanı */}
            <input
                ref={ref}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name={name}
                value={cleanValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder={defaultPlaceholder}
                maxLength={currentMax}
                required={required}
                disabled={disabled}
                autoFocus={autoFocus}
                className="vergi-kimlik-text-input form-input"
                {...rest}
            />

            {/* Sağ Geçerlilik İkonu / Sayaç */}
            {showValidationIcon && cleanValue.length > 0 && (
                <div
                    className="vergi-kimlik-status-icon"
                    title={
                        isValid
                            ? (selectedType === 'VKN' ? 'Geçerli Vergi Numarası' : 'Geçerli T.C. Kimlik Numarası')
                            : isComplete
                                ? (selectedType === 'VKN' ? 'Geçersiz Vergi Numarası' : 'Geçersiz T.C. Kimlik Numarası')
                                : `${selectedType} için ${currentMax - cleanValue.length} hane daha giriniz`
                    }
                >
                    {isValid ? (
                        <Check size={16} className="text-success" />
                    ) : isComplete ? (
                        <AlertCircle size={16} className="text-danger" />
                    ) : (
                        <span className="vergi-kimlik-digit-counter">
                            {cleanValue.length}/{currentMax}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
});

VergiKimlikInput.displayName = 'VergiKimlikInput';

export default VergiKimlikInput;
