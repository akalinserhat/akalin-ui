/**
 * Webakus UI Core - Cari Türü ve Tipi TreeView Seçici Bileşeni (CariTuruSeciciInput.tsx)
 * 
 * Başlıca Sorumlulukları:
 * - Cari kartlarında hem Cari Tipi'ni (Kurumsal, Bireysel) hem de Cari Türü'nü (Alıcı, Satıcı, Personel, Ortak vb.)
 *   hiyerarşik ağaç (TreeView) şeklinde sunar.
 * - Sektörel konfigürasyona (CariTuruYapilandirma) göre kök dal sırasını (Kurumsal Önce / Bireysel Önce),
 *   alt dalların görünürlüğünü ve öncelik sırasını dinamik olarak yönetir.
 * - BaseTreeDropdownSecici altyapısını kullanarak tam i18n (çoklu dil) desteği, klavye ve arama desteği sağlar.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseTreeDropdownSecici, TreeDropdownNode } from '@akalin/ui';

export interface CariTuruValuePayload {
    tipi: number;
    tur: number;
    id?: string;
}

export interface CariTuruBranchConfig {
    id: string;
    label?: string;
    aktif?: boolean;
    sira?: number;
}

export interface CariTuruYapilandirma {
    kokSiralama?: 'kurumsal_once' | 'bireysel_once' | string;
    varsayilanTur?: string;
    kurumsalDallar?: CariTuruBranchConfig[];
    bireyselDallar?: CariTuruBranchConfig[];
}

export interface CariTuruSeciciInputProps {
    id?: string;
    tipi?: number | string;
    tur?: number | string;
    value?: any;
    config?: CariTuruYapilandirma | string | null;
    onChange?: (payload: CariTuruValuePayload) => void;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
    inputStyle?: React.CSSProperties;
    usePortal?: boolean;
}

/**
 * Sektörel konfigürasyon ve i18n çeviri motorunu kullanarak dinamik TreeDropdownNode listesi üretir.
 */
export function buildCariTuruTreeData(
    config: CariTuruYapilandirma | string | null | undefined, 
    t: (key: string) => string = (k) => k
): TreeDropdownNode[] {
    let parsedConfig: any = null;
    if (typeof config === 'string' && config.trim().length > 0) {
        try {
            parsedConfig = JSON.parse(config);
            if (typeof parsedConfig === 'string') {
                parsedConfig = JSON.parse(parsedConfig);
            }
        } catch (e) {
            console.error('CariTuru config parse hatası:', e);
        }
    } else if (typeof config === 'object' && config !== null) {
        parsedConfig = config;
    }

    const allKurumsalLeaves: Record<string, { label: string; rawValue: { tipi: number; tur: number }; searchableText: string }> = {
        '1_1': {
            label: t('Alıcı (Müşteri)'),
            rawValue: { tipi: 1, tur: 1 },
            searchableText: 'kurumsal alıcı müşteri şirket firma corporate customer buyer'
        },
        '1_2': {
            label: t('Satıcı (Tedarikçi)'),
            rawValue: { tipi: 1, tur: 2 },
            searchableText: 'kurumsal satıcı tedarikçi toptancı şirket corporate supplier vendor'
        },
        '1_3': {
            label: t('Alıcı & Satıcı'),
            rawValue: { tipi: 1, tur: 3 },
            searchableText: 'kurumsal alıcı satıcı müşteri tedarikçi corporate customer supplier'
        },
        '1_99': {
            label: t('Diğer / Grup Şirketi'),
            rawValue: { tipi: 1, tur: 99 },
            searchableText: 'kurumsal diğer grup şirketi holding other group company'
        }
    };

    const allBireyselLeaves: Record<string, { label: string; rawValue: { tipi: number; tur: number }; searchableText: string }> = {
        '2_1': {
            label: t('Alıcı (Bireysel / Perakende Müşteri)'),
            rawValue: { tipi: 2, tur: 1 },
            searchableText: 'bireysel alıcı müşteri perakende son tüketici şahıs individual customer retail'
        },
        '2_2': {
            label: t('Satıcı (Şahıs Tedarikçi / Danışman)'),
            rawValue: { tipi: 2, tur: 2 },
            searchableText: 'bireysel satıcı tedarikçi şahıs danışman usta serbest meslek individual supplier vendor'
        },
        '2_3': {
            label: t('Alıcı & Satıcı (Şahıs)'),
            rawValue: { tipi: 2, tur: 3 },
            searchableText: 'bireysel alıcı satıcı şahıs individual customer supplier'
        },
        '2_4': {
            label: t('Personel (Çalışan)'),
            rawValue: { tipi: 2, tur: 4 },
            searchableText: 'personel çalışan maaş avans işçi eleman employee staff worker'
        },
        '2_5': {
            label: t('Ortak (Şirket Ortağı)'),
            rawValue: { tipi: 2, tur: 5 },
            searchableText: 'ortak şirket ortağı hissedar partner shareholder'
        }
    };

    // Kurumsal yaprakları hazırla
    const rawKurumsal = parsedConfig?.kurumsalDallar || parsedConfig?.KurumsalDallar;
    let kurumsalLeaves: TreeDropdownNode[] = [];
    if (rawKurumsal && Array.isArray(rawKurumsal)) {
        const sorted = [...rawKurumsal]
            .filter(d => d.aktif !== false && d.Aktif !== false && allKurumsalLeaves[d.id || d.Id])
            .sort((a, b) => (a.sira ?? a.Sira ?? 0) - (b.sira ?? b.Sira ?? 0));
        
        kurumsalLeaves = sorted.map(d => {
            const leafId = d.id || d.Id;
            return {
                id: leafId,
                label: allKurumsalLeaves[leafId].label,
                rawValue: allKurumsalLeaves[leafId].rawValue,
                searchableText: allKurumsalLeaves[leafId].searchableText
            };
        });
    } else {
        kurumsalLeaves = Object.entries(allKurumsalLeaves).map(([id, item]) => ({
            id,
            label: item.label,
            rawValue: item.rawValue,
            searchableText: item.searchableText
        }));
    }

    // Bireysel yaprakları hazırla
    const rawBireysel = parsedConfig?.bireyselDallar || parsedConfig?.BireyselDallar;
    let bireyselLeaves: TreeDropdownNode[] = [];
    if (rawBireysel && Array.isArray(rawBireysel)) {
        const sorted = [...rawBireysel]
            .filter(d => d.aktif !== false && d.Aktif !== false && allBireyselLeaves[d.id || d.Id])
            .sort((a, b) => (a.sira ?? a.Sira ?? 0) - (b.sira ?? b.Sira ?? 0));
        
        bireyselLeaves = sorted.map(d => {
            const leafId = d.id || d.Id;
            return {
                id: leafId,
                label: allBireyselLeaves[leafId].label,
                rawValue: allBireyselLeaves[leafId].rawValue,
                searchableText: allBireyselLeaves[leafId].searchableText
            };
        });
    } else {
        bireyselLeaves = Object.entries(allBireyselLeaves).map(([id, item]) => ({
            id,
            label: item.label,
            rawValue: item.rawValue,
            searchableText: item.searchableText
        }));
    }

    const kurumsalGroup: TreeDropdownNode = {
        id: 'kurumsal',
        label: t('Kurumsal (Tüzel Kişiler / Şirketler)'),
        isGroup: true,
        children: kurumsalLeaves
    };

    const bireyselGroup: TreeDropdownNode = {
        id: 'bireysel',
        label: t('Bireysel (Gerçek Kişiler / Şahıslar)'),
        isGroup: true,
        children: bireyselLeaves
    };

    // Kök dal önceliğine göre dizilimi oluştur
    const siralama = parsedConfig?.kokSiralama || parsedConfig?.KokSiralama;
    const isBireyselFirst = siralama === 'bireysel_once' || siralama === 'bireysel';
    return isBireyselFirst ? [bireyselGroup, kurumsalGroup] : [kurumsalGroup, bireyselGroup];
}

export const CariTuruSeciciInput: React.FC<CariTuruSeciciInputProps> = ({
    id = 'cari-turu-secici',
    tipi,
    tur,
    value,
    config,
    onChange,
    disabled = false,
    required = false,
    placeholder,
    className,
    style,
    inputStyle,
    usePortal = false
}) => {
    const { t } = useTranslation();

    // Sektörel konfigürasyona ve dile göre ağaç verisini oluştur
    const treeData: TreeDropdownNode[] = useMemo(() => {
        return buildCariTuruTreeData(config, t);
    }, [config, t]);

    // Seçili node ID'sini türet
    const resolvedValue = useMemo(() => {
        if (tipi !== undefined && tur !== undefined && tipi !== null && tur !== null) {
            return `${tipi}_${tur}`;
        }
        if (typeof value === 'object' && value !== null) {
            return `${value.tipi}_${value.tur}`;
        }
        if (typeof value === 'string' && value.includes('_')) {
            return value;
        }
        if (typeof value === 'number') {
            return value === 4 ? '2_4' : `1_${value}`;
        }
        const firstLeaf = treeData?.[0]?.children?.[0];
        if (firstLeaf?.id) {
            return firstLeaf.id;
        }
        return '1_1';
    }, [tipi, tur, value, treeData]);

    // Seçilen öğenin gösterim metnini hesapla (i18n t() destekli)
    const displayText = useMemo(() => {
        switch (resolvedValue) {
            case '1_1': return t('Kurumsal / Alıcı (Müşteri)');
            case '1_2': return t('Kurumsal / Satıcı (Tedarikçi)');
            case '1_3': return t('Kurumsal / Alıcı & Satıcı');
            case '1_99': return t('Kurumsal / Diğer (Grup Şirketi)');
            case '2_1': return t('Bireysel / Alıcı (Müşteri)');
            case '2_2': return t('Bireysel / Satıcı (Şahıs Tedarikçi)');
            case '2_3': return t('Bireysel / Alıcı & Satıcı (Şahıs)');
            case '2_4': return t('Bireysel / Personel (Çalışan)');
            case '2_5': return t('Bireysel / Ortak (Şirket Ortağı)');
            default: return '';
        }
    }, [resolvedValue, t]);

    const handleTreeChange = (nodeId: any, rawValue: any) => {
        if (!onChange) return;

        if (rawValue && typeof rawValue.tipi === 'number' && typeof rawValue.tur === 'number') {
            onChange({ tipi: rawValue.tipi, tur: rawValue.tur, id: nodeId });
        } else if (typeof nodeId === 'string' && nodeId.includes('_')) {
            const parts = nodeId.split('_');
            onChange({
                tipi: parseInt(parts[0], 10),
                tur: parseInt(parts[1], 10),
                id: nodeId
            });
        }
    };

    return (
        <BaseTreeDropdownSecici
            id={id}
            value={resolvedValue}
            displayText={displayText}
            treeData={treeData}
            onChange={handleTreeChange}
            disabled={disabled}
            required={required}
            placeholder={placeholder || t('Cari Türü ve Tipi Seçiniz...')}
            clearable={false}
            usePortal={usePortal}
            inputClassName={className}
            inputStyle={inputStyle || style}
        />
    );
};

export default CariTuruSeciciInput;
