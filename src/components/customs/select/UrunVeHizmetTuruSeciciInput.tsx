/**
 * Webakus UI Core - Ürün ve Hizmet Türü Seçici Bileşeni (UrunVeHizmetTuruSeciciInput.tsx)
 * 
 * Başlıca Sorumlulukları:
 * - Ürün ve Hizmet kartları için kart türünü (Ürün, Hizmet, Sarf Malzemesi, Hammadde, Demirbaş, Yarı Mamul, Mamul, Paket/Set)
 *   açılır menü / ağaç şeklinde seçtirir.
 * - BaseDropdownSecici altyapısını kullanarak tam i18n (çoklu dil) desteği, klavye ve arama desteği sağlar.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseDropdownSecici, DropdownOption } from '@akalin/ui';

export interface UrunVeHizmetTuruOption {
    id: number | string;
    label: string;
    description?: string;
    iconName?: string;
}

export interface UrunVeHizmetTuruSeciciInputProps {
    id?: string;
    value?: number | string | null;
    onChange?: (turId: number, rawValue?: any) => void;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
    error?: string;
}

export const URUN_VE_HIZMET_TURLERI = [
    { id: 1, key: 'Urun', label: 'Ürün (Ticari Mal)', desc: 'Alıp satılan, stok takibi yapılan fiziksel ürünler' },
    { id: 2, key: 'Hizmet', label: 'Hizmet / Servis', desc: 'Fiziksel olmayan, stoksuz danışmanlık ve servis kalemleri' },
    { id: 3, key: 'SarfMalzemesi', label: 'Sarf Malzemesi', desc: 'İşletme içinde tüketilen malzemeler' },
    { id: 4, key: 'Hammadde', label: 'Hammadde', desc: 'Üretimde girdi olarak kullanılan hammaddeler' },
    { id: 6, key: 'YariMamul', label: 'Yarı Mamul', desc: 'Üretim süreçlerinde ara aşama ürünleri' },
    { id: 7, key: 'Mamul', label: 'Mamul', desc: 'Üretimi tamamlanmış satışa hazır ürünler' },
    { id: 5, key: 'Demirbas', label: 'Demirbaş', desc: 'Şirket demirbaşı ve duran varlıklar' }
];


export const UrunVeHizmetTuruSeciciInput: React.FC<UrunVeHizmetTuruSeciciInputProps> = ({
    id = 'urun-ve-hizmet-turu-secici',
    value = 1,
    onChange,
    disabled = false,
    required = false,
    placeholder,
    className,
    style,
    error
}) => {
    const { t } = useTranslation();
    const defaultPlaceholder = placeholder || t('Ürün / Hizmet Türü Seçiniz...');

    const options: DropdownOption[] = useMemo(() => {
        return URUN_VE_HIZMET_TURLERI.map(item => ({
            id: String(item.id),
            label: t(item.label),
            rawValue: item
        }));
    }, [t]);

    // Normalize value to string for BaseDropdownSecici
    const normalizedValue = value ? String(value) : '1';
    const selectedItem = options.find(o => o.id === normalizedValue);
    const displayText = selectedItem ? String(selectedItem.label) : undefined;

    return (
        <div style={style} className={`w-full ${className || ''}`}>
            <BaseDropdownSecici
                id={id}
                value={normalizedValue}
                onChange={(selectedId, rawOption) => {
                    const numId = parseInt(selectedId, 10) || 1;
                    if (onChange) onChange(numId, rawOption?.rawValue);
                }}
                options={options}
                disabled={disabled}
                placeholder={defaultPlaceholder}
                clearable={false}
                displayText={displayText}
                error={error}
            />
        </div>
    );
};

export default UrunVeHizmetTuruSeciciInput;
