/**
 * @file IdOlusturucuInput.tsx
 * @description
 * Akalin UI - Benzersiz Kimlik Oluşturucu Giriş Bileşeni (IdOlusturucuInput / IdInput)
 *
 * Başlıca Görevleri:
 * - Uygulama Kimliği (App ID), Ajan Kimliği (Agent ID) ve benzersiz kayıt anahtarları için
 *   kriptografik olarak güvenli alfanümerik ID üretimi sağlar.
 * - Alan boş olduğunda (!currentValue) 'Oluştur' (Generate) düğmesi gösterilir; değer üretildiğinde
 *   veya girildiğinde düğme otomatik olarak gizlenir (hideGenerateWhenFilled=true).
 * - Input'un sağ iç kısmında kopyalama düğmesi (`Copy` -> `Check`) barındırır.
 * - BaseInput ve AnahtarOlusturucuInput üzerinden tüm form, casing, ref ve stil standartlarını devralır.
 */

import React, { useCallback, forwardRef } from 'react';
import { Fingerprint } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AnahtarOlusturucuInput, {
  AnahtarOlusturucuInputProps,
} from './AnahtarOlusturucuInput';

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
}

export type IdInputProps = IdOlusturucuInputProps;

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
      idLength = 16,
      idPrefix,
      keyLength,
      keyPrefix,
      hideGenerateWhenFilled = true,
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

    const handleGenerate = useCallback(async () => {
      if (onGenerate) {
        return onGenerate();
      }
      return generateRandomId(resolvedLength, resolvedPrefix);
    }, [onGenerate, resolvedLength, resolvedPrefix]);

    return (
      <AnahtarOlusturucuInput
        ref={ref}
        icon={icon !== undefined ? icon : <Fingerprint size={16} />}
        placeholder={placeholder || t('auto_benzersiz_kimlik_id', 'Benzersiz kimlik (ID)...')}
        hideGenerateWhenFilled={hideGenerateWhenFilled}
        onGenerate={handleGenerate}
        casing={casing}
        {...restProps}
      />
    );
  }
);

IdOlusturucuInput.displayName = 'IdOlusturucuInput';

export { IdOlusturucuInput, IdOlusturucuInput as IdInput };
export default IdOlusturucuInput;
