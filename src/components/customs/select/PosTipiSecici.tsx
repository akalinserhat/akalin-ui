/**
 * @file PosTipiSecici.tsx
 * @description 
 * Webakus UI Core - POS Tipi Seçici Bileşeni (PosTipiSecici)
 * 
 * Başlıca Görevleri:
 * - POS cihazları için POS tiplerini (Fiziksel POS, Sanal POS, Tedarikçi POS, Ortak POS) listeler.
 * - BaseDropdownSecici altyapısını kullanarak seçim sağlar.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseDropdownSecici } from '@akalin/ui';

export interface PosTipiSeciciProps {
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

export const PosTipiSecici: React.FC<PosTipiSeciciProps> = ({
    id = 'pos-tipi-secici',
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
    const defaultPlaceholder = placeholder || t('PosTipiSecici_seciniz', { defaultValue: 'POS Tipi Seçiniz...' });

    const options = useMemo(() => [
        { id: '1', label: t('PosTipi_Fiziksel', { defaultValue: 'Fiziksel POS' }), rawValue: 1 },
        { id: '2', label: t('PosTipi_Sanal', { defaultValue: 'Sanal POS' }), rawValue: 2 },
        { id: '4', label: t('PosTipi_Tedarikci', { defaultValue: 'Tedarikçi POS' }), rawValue: 4 },
        { id: '5', label: t('PosTipi_Ortak', { defaultValue: 'Ortak POS (PayTR, Param vb.)' }), rawValue: 5 }
    ], [t]);

    const selectedOption = useMemo(() => {
        if (!value) return undefined;
        return options.find(o => o.id === value?.toString());
    }, [value, options]);

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
                displayText={selectedOption?.label as string}
                error={error}
            />
        </div>
    );
};

export default PosTipiSecici;
