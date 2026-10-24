/**
 * @component UrunGrupSecici (core/common)
 *
 * @description
 * Ürün veya Hizmet Grubu seçmek için kullanılan, hiyerarşik ağaç yapısını
 * (tree dropdown) bir açılır menü içinde gösteren seçici bileşendir.
 *
 * Bu bileşen yalnızca Ürün Kartı ve benzeri FORM'larda kullanılır.
 * Ürün Grubu Ekle/Düzenle ekranı (UrunGrupForm) için ise @core/ui/crud/UrunGrupSecici
 * bileşenini kullanın — o bileşen BaseSeciciInput + BaseSeciciModal altyapısı üzerine
 * kuruludur ve ana grup seçiminde döngüsel seçimi engeller.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BaseTreeDropdownSecici, TreeDropdownNode } from '@akalin/ui';

const UrunGrupSecici = ({ id, value, onChange, disabled, style, className, tur = 1, sadecaAnaGruplar = false, hideExtraAction = false }: any) => {
    const [gruplar, setGruplar] = useState<any[]>([]);
    const navigate = useNavigate();
    const location = useLocation();

    const fetchGruplar = async () => {
        try {
            const res = await axios.get('/api/UrunVeHizmetGruplari', { params: { tur } });
            const data = res.data || [];
            let filtered = data;
            if (tur !== undefined && tur !== null) {
                filtered = data.filter((g: any) => {
                    const itemTur = g.tur ?? g.Tur;
                    if (itemTur === undefined || itemTur === null) return true;
                    if (typeof itemTur === 'string') {
                        if (itemTur === 'Urun') return Number(tur) === 1;
                        if (itemTur === 'Hizmet') return Number(tur) === 2;
                    }
                    return Number(itemTur) === Number(tur);
                });
            }
            // Sadece ana gruplar isteniyorsa, ustGrupId olmayan (kök) grupları filtrele
            if (sadecaAnaGruplar) {
                filtered = filtered.filter((g: any) => !g.ustGrupId && !g.UstGrupId);
            }
            setGruplar(filtered);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchGruplar();
    }, [tur]);

    // Düz listeyi hiyerarşik ağaca dönüştürür
    const buildTree = (flatList: any[]): TreeDropdownNode[] => {
        if (sadecaAnaGruplar) {
            return flatList.map(item => ({
                id: item.id,
                label: item.ad || item.Ad,
                searchableText: item.ad || item.Ad,
                isGroup: false,
                rawValue: item
            }));
        }

        const tree: TreeDropdownNode[] = [];
        const lookup: Record<string | number, TreeDropdownNode> = {};
        
        flatList.forEach(item => {
            lookup[item.id] = { 
                id: item.id, 
                label: item.ad || item.Ad,
                searchableText: item.ad || item.Ad,
                isGroup: false, 
                children: [], 
                rawValue: item 
            };
        });
        
        flatList.forEach(item => {
            const parentId = item.ustGrupId || item.UstGrupId;
            if (parentId && lookup[parentId]) {
                lookup[parentId].children!.push(lookup[item.id]);
                lookup[parentId].isGroup = true;
            } else {
                tree.push(lookup[item.id]);
            }
        });
        return tree;
    };

    const treeData = buildTree(gruplar);

    return (
        <div style={{ ...style }} className={className}>
            <BaseTreeDropdownSecici
                id={id || 'urun-grup-secici'}
                value={value}
                onChange={(selectedId, rawValue) => {
                    if (onChange) onChange(selectedId, rawValue);
                }}
                treeData={treeData}
                disabled={disabled}
                placeholder="Seçiniz..."
                usePortal={false}
                extraAction={
                    (!sadecaAnaGruplar && !hideExtraAction) ? {
                        label: `Yeni ${tur === 1 ? 'Ürün' : 'Hizmet'} Grubu Ekle`,
                        icon: <Plus size={14} style={{ marginRight: '8px' }} />,
                        onClick: (expandedNodes) => {
                            let ustGrupId = '';
                            if (expandedNodes) {
                                // Ağacın en altından (son eklenenlerden) en üstüne (root) doğru genişletilen son klasörü bul
                                const keys = Object.keys(expandedNodes);
                                for (let i = keys.length - 1; i >= 0; i--) {
                                    if (expandedNodes[keys[i]]) {
                                        ustGrupId = keys[i];
                                        break;
                                    }
                                }
                            }
                            navigate(`/urun-gruplari/yeni?tur=${tur}&ustGrupId=${ustGrupId}`, { state: { returnTo: location.pathname + location.search } });
                        }
                    } : undefined
                }
            />
        </div>
    );
};

export default UrunGrupSecici;
