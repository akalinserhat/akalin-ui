/**
 * @file StokTakipYontemiSecici.tsx
 * @description 
 * Webakus UI Core - Stok Takip Yöntemi Seçici Bileşeni (StokTakipYontemiSecici)
 * 
 * Başlıca Görevleri:
 * - Ürün ve Hizmet kartları için stok takip yöntemlerini (Standart, Seri No Zorunlu, Lot/Parti No, Takipsiz) listeler.
 * - BaseDropdownSecici altyapısını kullanarak seçim sağlar.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseDropdownSecici } from '@akalin/ui';

export interface StokTakipYontemiSeciciProps {
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

export const StokTakipYontemiSecici: React.FC<StokTakipYontemiSeciciProps> = ({
    id = 'stok-takip-yontemi-secici',
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
    const defaultPlaceholder = placeholder || t('StokTakipYontemiSecici_seciniz', { defaultValue: 'Stok Takip Yöntemi Seçiniz...' });

    const staticOptions = useMemo(() => [
        { id: 'MiktarBazli', label: t('StokTakipYontemi_MiktarBazli', { defaultValue: 'Standart (Miktar Bazlı)' }) },
        { id: 'SeriNoBazli', label: t('StokTakipYontemi_SeriNoBazli', { defaultValue: 'Seri Numaralı Takip Zorunlu' }) },
        { id: 'LotNoBazli', label: t('StokTakipYontemi_LotNoBazli', { defaultValue: 'Lot/Parti Numaralı Takip' }) },
        { id: 'Takipsiz', label: t('StokTakipYontemi_Takipsiz', { defaultValue: 'Stok Takibi Yapılmaz' }) }
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

export default StokTakipYontemiSecici;
