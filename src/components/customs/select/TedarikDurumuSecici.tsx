/**
 * @file TedarikDurumuSecici.tsx
 * @description 
 * Webakus UI Core - Tedarik Durumu Seçici Bileşeni (TedarikDurumuSecici)
 * 
 * Başlıca Görevleri:
 * - Ürün ve Hizmet kartları için tedarik durumlarını (Satışta, Tedarik Aşamasında, Stokta Yok, Üretimden Kalktı) listeler.
 * - BaseDropdownSecici altyapısını kullanarak seçim sağlar.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseDropdownSecici } from '@akalin/ui';

export interface TedarikDurumuSeciciProps {
    id?: string;
    value?: string | number | null;
    onChange?: (id: any, rawValue?: any) => void;
    disabled?: boolean;
    clearable?: boolean;
    style?: React.CSSProperties;
    className?: string;
    placeholder?: string;
    error?: string;
}

export const TedarikDurumuSecici: React.FC<TedarikDurumuSeciciProps> = ({
    id = 'tedarik-durumu-secici',
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
    const defaultPlaceholder = placeholder || t('TedarikDurumuSecici_seciniz', { defaultValue: 'Tedarik Durumu Seçiniz...' });

    const staticOptions = useMemo(() => [
        { id: 'Satista', label: t('TedarikDurumu_Satista', { defaultValue: 'Satışta' }) },
        { id: 'TedarikAsamasinda', label: t('TedarikDurumu_TedarikAsamasinda', { defaultValue: 'Tedarik Aşamasında' }) },
        { id: 'StoktaYok', label: t('TedarikDurumu_StoktaYok', { defaultValue: 'Stokta Yok' }) },
        { id: 'UretimdenKalkti', label: t('TedarikDurumu_UretimdenKalkti', { defaultValue: 'Üretimden Kalktı' }) }
    ], [t]);

    const options = useMemo(() => {
        return staticOptions.map(opt => ({
            id: opt.id,
            label: opt.label,
            rawValue: opt
        }));
    }, [staticOptions]);

    const selectedOption = staticOptions.find(o => o.id === value);
    const displayText = selectedOption ? selectedOption.label : undefined;

    return (
        <div style={style} className={`w-full ${className || ''}`}>
            <BaseDropdownSecici
                id={id}
                value={value?.toString()}
                onChange={(selectedId, rawValue) => {
                    if (onChange) onChange(selectedId, rawValue);
                }}
                options={options}
                disabled={disabled}
                placeholder={defaultPlaceholder}
                clearable={clearable}
                displayText={displayText}
                error={error}
            />
        </div>
    );
};

export default TedarikDurumuSecici;
