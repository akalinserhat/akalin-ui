/**
 * @file IdOlusturucuInput.tsx
 * @description
 * Akalin UI - Benzersiz Kimlik Oluşturucu Giriş Bileşeni (IdOlusturucuInput / IdInput)
 *
 * Başlıca Görevleri:
 * - Uygulama Kimliği (App ID), Ajan Kimliği (Agent ID), modül/şablon/özellik kodları ve benzeri
 *   benzersiz kayıt anahtarları için kriptografik olarak güvenli ID üretimi sağlar.
 * - Yazım sırasında Türkçe karakterleri ASCII karşılıklarına dönüştürür, Space tuşunu otomatik '-'
 *   karakterine çevirir, yalnızca alfanümerik / '-' / '_' karakterlerine izin verir, ':' ve geçersiz
 *   karakterleri engeller, alan odağı kaybolduğunda (onBlur) uçlardaki '-'/'_' karakterlerini temizler.
 * - Alan boş olduğunda (!currentValue) 'Oluştur' (Generate) düğmesi gösterilir; değer üretildiğinde
 *   veya girildiğinde düğme otomatik olarak gizlenir (hideGenerateWhenFilled=true).
 * - Input'un sağ iç kısmında kopyalama düğmesi (`Copy` -> `Check`) barındırır.
 * - BaseInput ve AnahtarOlusturucuInput üzerinden tüm form, casing, ref ve stil standartlarını devralır.
 */

import React, { useState, useCallback, forwardRef } from 'react';
import { Fingerprint } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type HarfDonusumu } from '../base/input/BaseInput';
import AnahtarOlusturucuInput, {
  AnahtarOlusturucuInputProps,
} from './AnahtarOlusturucuInput';

export type IdCasingMode = 'upper' | 'lower' | 'preserve';

export interface IdOlusturucuInputProps extends Omit<AnahtarOlusturucuInputProps, 'keyLength' | 'keyPrefix'> {
  /** ID rastgele bölüm uzunluğu (Varsayılan: 16) */
  idLength?: number;
  /** ID ön eki (Örn: 'APP', 'AGENT'). Otomatik olarak büyük harfe normalize edilip '_' ile ayrılır */
  idPrefix?: string;
  /** Geriye dönük uyumluluk alias: keyLength */
  keyLength?: number;
  /** Geriye dönük uyumluluk alias: keyPrefix */
  keyPrefix?: string;
  /**
   * Değer dolu olduğunda oluştur düğmesi gizlensin mi?
   * IdOlusturucuInput için varsayılan: true (R1 gereksinimi)
   */
  hideGenerateWhenFilled?: boolean;
  /**
   * Yazım sırasında ID normalizasyonu (Space -> '-', Türkçe -> ASCII, yalnız alfanümerik/'-'/'_',
   * onBlur ile baş/sondaki '-'/'_' temizliği) otomatik uygulansın mı? (Varsayılan: true)
   */
  autoFormatId?: boolean;
}

export type IdInputProps = IdOlusturucuInputProps;

const replaceTurkishChars = (text: string): string =>
  (text || '')
    .replace(/I\u0307/g, 'I')
    .replace(/i\u0307/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c');

/**
 * Verilen `casing` prop'unu ID formatlama moduna dönüştürür.
 */
export const resolveIdCasingMode = (casing?: HarfDonusumu): IdCasingMode => {
  if (!casing) return 'upper';
  const normalized = casing.toString().toLowerCase().replace(/[\s_-]/g, '');
  if (normalized === 'hepsikucuk' || normalized === 'lowercase' || normalized === 'lower') {
    return 'lower';
  }
  if (normalized === 'none' || normalized === 'girildigigibi' || normalized === 'serbest') {
    return 'preserve';
  }
  return 'upper';
};

/**
 * Kullanıcı yazımını anlık olarak geçerli benzersiz ID formatına çevirir:
 * - Türkçe karakterleri ASCII karşılıklarına dönüştürür.
 * - Boşluk / Space karakterlerini '-' tireye çevirir.
 * - Alfanümerik, '-' ve '_' dışındaki karakterleri (':' dahil) temizler.
 * - Ardışık '--' tekrarlarını tek '-' karakterine indirger.
 */
export const formatIdInput = (raw: string, casingMode: IdCasingMode = 'upper'): string => {
  let ascii = replaceTurkishChars(raw || '');
  if (casingMode === 'upper') {
    ascii = ascii.toUpperCase();
  } else if (casingMode === 'lower') {
    ascii = ascii.toLowerCase();
  }

  const disallowedRegex =
    casingMode === 'upper'
      ? /[^A-Z0-9_-]+/g
      : casingMode === 'lower'
        ? /[^a-z0-9_-]+/g
        : /[^A-Za-z0-9_-]+/g;

  return ascii
    .replace(/\s+/g, '-')
    .replace(disallowedRegex, '')
    .replace(/-{2,}/g, '-');
};

/**
 * Kaydetme veya blur anında ID değerini normalize eder (kenarlardaki '-' ve '_' karakterlerini siler).
 */
export const normalizeIdValue = (raw: string, casingMode: IdCasingMode = 'upper'): string => {
  return formatIdInput((raw || '').trim(), casingMode).replace(/^[-_]+|[-_]+$/g, '');
};

/**
 * Kriptografik olarak rastgele ve benzersiz ID üreten yardımcı fonksiyon.
 *
 * Özellikler:
 * - Karakter kümesi: [0-9A-Z] (Büyük harf ve rakamlar)
 * - İki nokta (:), tire (-), boşluk veya küçük harf içermez (composite token ve normalizeAgentCode ile tam uyumlu)
 * - prefix parametresi verilmişse (örn: 'APP', 'AGENT'), sonuna alt çizgi '_' eklenerek birleştirilir (örn: 'APP_4F8E2A1C9B7D3E5F')
 * - window.crypto.getRandomValues kullanır; SSR / tarayıcı dışı ortamlarda Math.random fallback'ine sahiptir.
 *
 * @param length Üretilecek rastgele karakter uzunluğu (ön ek hariç, varsayılan: 16)
 * @param prefix ID ön eki (Örn: 'APP', 'AGENT')
 * @returns Formatlanmış benzersiz ID dizesi (Örn: 'APP_7K9P2X4M1Q8Z3W5R')
 */
export const generateRandomId = (length: number = 16, prefix: string = ''): string => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const targetLength = Math.max(4, length);
  let randomPart = '';

  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const randomBytes = new Uint8Array(targetLength);
    window.crypto.getRandomValues(randomBytes);
    for (let i = 0; i < targetLength; i++) {
      randomPart += chars[randomBytes[i] % chars.length];
    }
  } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomBytes = new Uint8Array(targetLength);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < targetLength; i++) {
      randomPart += chars[randomBytes[i] % chars.length];
    }
  } else {
    for (let i = 0; i < targetLength; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  const cleanPrefix = (prefix || '')
    .trim()
    .toLocaleUpperCase('tr-TR')
    .replace(/İ/g, 'I')
    .replace(/İ/g, 'I')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '')
    .replace(/^_+|_+$/g, '');

  if (cleanPrefix) {
    return `${cleanPrefix}_${randomPart}`;
  }

  return randomPart;
};

const IdOlusturucuInput = forwardRef<HTMLInputElement, IdOlusturucuInputProps>(
  (
    {
      id,
      name,
      value,
      defaultValue,
      onChange,
      onValueChange,
      onBlur,
      idLength = 16,
      idPrefix,
      keyLength,
      keyPrefix,
      hideGenerateWhenFilled = true,
      autoFormatId = true,
      icon,
      placeholder,
      onGenerate,
      casing = 'hepsiBuyuk',
      ...restProps
    },
    ref
  ) => {
    const { t } = useTranslation();
    const resolvedLength = idLength ?? keyLength ?? 16;
    const resolvedPrefix = idPrefix ?? keyPrefix ?? '';
    const casingMode = resolveIdCasingMode(casing);
    const isControlled = value !== undefined;

    const [uncontrolledValue, setUncontrolledValue] = useState<string>(() =>
      value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : ''
    );

    const buildEventWithValue = useCallback(
      (originalEvent: any, formatted: string) => {
        if (originalEvent && originalEvent.target) {
          if (originalEvent.target.value !== formatted) {
            try {
              originalEvent.target.value = formatted;
            } catch {
              return {
                ...originalEvent,
                target: { ...originalEvent.target, name, id, value: formatted },
                currentTarget: {
                  ...(originalEvent.currentTarget || originalEvent.target),
                  name,
                  id,
                  value: formatted,
                },
              };
            }
          }
          return originalEvent;
        }
        return {
          target: { name, id, value: formatted },
          currentTarget: { name, id, value: formatted },
        };
      },
      [name, id]
    );

    const handleGenerate = useCallback(async () => {
      if (onGenerate) {
        return onGenerate();
      }
      return generateRandomId(resolvedLength, resolvedPrefix);
    }, [onGenerate, resolvedLength, resolvedPrefix]);

    const handleChildChange = useCallback(
      (e: any, emittedVal?: string) => {
        const raw = emittedVal !== undefined ? String(emittedVal) : String(e?.target?.value ?? '');
        const inputEl =
          e?.target && typeof (e.target as HTMLInputElement).selectionStart === 'number'
            ? (e.target as HTMLInputElement)
            : null;
        const selStart = inputEl ? inputEl.selectionStart : null;
        const selEnd = inputEl ? inputEl.selectionEnd : null;

        const formatted = autoFormatId ? formatIdInput(raw, casingMode) : raw;

        if (autoFormatId && inputEl && inputEl.value !== formatted) {
          inputEl.value = formatted;
          if (selStart !== null && selEnd !== null && typeof requestAnimationFrame === 'function') {
            const nextStart = formatIdInput(raw.slice(0, selStart), casingMode).length;
            const nextEnd =
              selStart === selEnd
                ? nextStart
                : formatIdInput(raw.slice(0, selEnd), casingMode).length;
            requestAnimationFrame(() => {
              try {
                if (typeof document === 'undefined' || document.activeElement === inputEl) {
                  inputEl.setSelectionRange(nextStart, nextEnd);
                }
              } catch {
                // selection API desteklemeyen ortamlarda sessizce geç
              }
            });
          }
        }

        if (!isControlled) {
          setUncontrolledValue(formatted);
        }

        const nextEvent = buildEventWithValue(e, formatted);
        if (onChange) {
          onChange(nextEvent, formatted);
        }
        if (onValueChange) {
          onValueChange(formatted);
        }
      },
      [autoFormatId, casingMode, isControlled, buildEventWithValue, onChange, onValueChange]
    );

    const handleChildBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        const currentRaw =
          e?.target?.value !== undefined
            ? String(e.target.value)
            : isControlled
              ? String(value ?? '')
              : uncontrolledValue;

        const normalized = autoFormatId ? normalizeIdValue(currentRaw, casingMode) : currentRaw;

        if (autoFormatId && normalized !== currentRaw) {
          if (!isControlled) {
            setUncontrolledValue(normalized);
          }
          const changeEvt = buildEventWithValue(e, normalized);
          if (onChange) {
            onChange(changeEvt, normalized);
          }
          if (onValueChange) {
            onValueChange(normalized);
          }
        }

        if (onBlur) {
          const nextBlurEvent =
            autoFormatId && normalized !== currentRaw ? buildEventWithValue(e, normalized) : e;
          onBlur(nextBlurEvent);
        }
      },
      [
        autoFormatId,
        casingMode,
        isControlled,
        value,
        uncontrolledValue,
        buildEventWithValue,
        onChange,
        onValueChange,
        onBlur,
      ]
    );

    return (
      <AnahtarOlusturucuInput
        ref={ref}
        id={id}
        name={name}
        value={isControlled ? value : uncontrolledValue}
        defaultValue={defaultValue}
        onChange={handleChildChange}
        onBlur={handleChildBlur}
        icon={icon !== undefined ? icon : <Fingerprint size={16} />}
        placeholder={placeholder || t('auto_benzersiz_kimlik_id', 'Benzersiz kimlik (ID)...')}
        hideGenerateWhenFilled={hideGenerateWhenFilled}
        onGenerate={handleGenerate}
        casing={autoFormatId ? 'none' : casing}
        {...restProps}
      />
    );
  }
);

IdOlusturucuInput.displayName = 'IdOlusturucuInput';

export { IdOlusturucuInput, IdOlusturucuInput as IdInput };
export default IdOlusturucuInput;
