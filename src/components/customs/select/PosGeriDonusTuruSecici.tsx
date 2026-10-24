/**
 * @file PosGeriDonusTuruSecici.tsx
 * @description 
 * Webakus UI Core - POS Geri Dönüş Türü Seçici Bileşeni (PosGeriDonusTuruSecici)
 * 
 * Başlıca Görevleri:
 * - POS Cihazları için geri dönüş türlerini (Ertesi Gün, Blokeli) listeler.
 * - BaseDropdownSecici altyapısını kullanarak seçim sağlar.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseDropdownSecici } from '@akalin/ui';

export interface PosGeriDonusTuruSeciciProps {
    id?: string;
    value?: number | string | null;
    onChange?: (id: any, rawValue?: any) => void;
    disabled?: boolean;
    clearable?: boolean;
    style?: React.CSSProperties;
    className?: string;
    placeholder?: string;
    error?: string;
}

export const PosGeriDonusTuruSecici: React.FC<PosGeriDonusTuruSeciciProps> = ({
    id = 'pos-geri-donus-turu-secici',
    value,
    onChange,
    disabled = false,
    clearable = false,
    style,
    className,
    placeholder,
    error
}) => {
    const { t } = useTranslation();
    const defaultPlaceholder = placeholder || t('PosGeriDonusTuruSecici_seciniz', { defaultValue: 'Geri Dönüş Türü Seçiniz...' });

    const options = useMemo(() => [
        { id: '1', label: t('PosGeriDonusTuru_ErtesiGun', { defaultValue: 'Ertesi Gün' }), rawValue: 1 },
        { id: '2', label: t('PosGeriDonusTuru_Blokeli', { defaultValue: 'Blokeli' }), rawValue: 2 }
    ], [t]);

    return (
        <div style={style} className={`w-full ${className || ''}`}>
            <BaseDropdownSecici
                id={id}
                value={value?.toString()}
                onChange={(selectedId, rawValue) => {
                    if (onChange) onChange(selectedId ? Number(selectedId) : null, rawValue);
                }}
                options={options}
                disabled={disabled}
                placeholder={defaultPlaceholder}
                clearable={clearable}
                error={error}
            />
        </div>
    );
};

export default PosGeriDonusTuruSecici;
