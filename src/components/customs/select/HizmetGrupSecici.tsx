/**
 * @file HizmetGrupSecici.tsx
 * @description 
 * Webakus UI Core - Merkezi Hizmet Grubu Seçici Bileşeni (HizmetGrupSecici)
 * 
 * Başlıca Görevleri:
 * - Hizmet gruplarını (tur = 2) hiyerarşik ağaç yapısında listeler.
 * - UrunGrupSecici bileşenini `tur={2}` parametresi ile sarmalar.
 */

import React from 'react';
import UrunGrupSecici from './UrunGrupSecici';

export interface HizmetGrupSeciciProps {
    id?: string;
    value?: any;
    onChange?: (selectedId: any, rawValue?: any) => void;
    disabled?: boolean;
    style?: React.CSSProperties;
    className?: string;
    sadecaAnaGruplar?: boolean;
    [key: string]: any;
}

export const HizmetGrupSecici: React.FC<HizmetGrupSeciciProps> = (props) => {
    const { menuIcon, ...rest } = props;
    return <UrunGrupSecici {...rest} tur={2} />;
};

export default HizmetGrupSecici;
