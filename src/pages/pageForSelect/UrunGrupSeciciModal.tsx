/**
 * Webakus UI Core - Ürün ve Hizmet Grubu Seçici Modal (UrunGrupSeciciModal)
 * Hiyerarşik ağaç yapısında ürün ve hizmet gruplarının aranması ve seçilmesini sağlar.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Package, ChevronRight, ChevronDown, CheckSquare, Square, Search } from 'lucide-react';
import { BasePopup } from '@akalin/ui';
import { BaseTreeView, TreeItem, CancelButton, OkButton } from '@akalin/ui';

interface UrunGrupSeciciModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (selectedId: any, selectedItem: any) => void;
    isMultiSelect?: boolean;
    tur?: number;
}

const UrunGrupSeciciModal: React.FC<UrunGrupSeciciModalProps> = ({ 
    isOpen, 
    onClose, 
    onSelect,
    isMultiSelect = false,
    tur = 1 // 1: Ürün, 2: Hizmet vs.
}) => {
    const [gruplar, setGruplar] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<any>>(new Set());
    const [expandedNodes, setExpandedNodes] = useState<Record<string | number, boolean>>({});

    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSelectedIds(new Set());
            fetchGruplar();
        }
    }, [isOpen, tur]);

    const fetchGruplar = async () => {
        try {
            const { default: axios } = await import('axios');
            const res = await axios.get('/api/UrunVeHizmetGruplari');
            let data = res.data || [];
            
            // Türe göre filtrele
            data = data.filter((g: any) => g.tur === tur);
            setGruplar(data);
        } catch (error) {
            console.error("Grup listesi alınamadı", error);
        }
    };

    // Düz listeyi hiyerarşik ağaca dönüştürür
    const buildTree = (flatList: any[]): TreeItem[] => {
        const tree: TreeItem[] = [];
        const lookup: Record<string | number, TreeItem> = {};
        
        flatList.forEach(item => {
            lookup[item.id] = { 
                id: item.id, 
                label: item.ad || item.Ad,
                children: [], 
                rawValue: item 
            };
        });
        
        flatList.forEach(item => {
            const parentId = item.ustGrupId || item.UstGrupId;
            if (parentId && lookup[parentId]) {
                lookup[parentId].children!.push(lookup[item.id]);
            } else {
                tree.push(lookup[item.id]);
            }
        });
        return tree;
    };

    const treeData = useMemo(() => buildTree(gruplar), [gruplar]);

    const toggleSelection = (id: any, rawValue: any) => {
        if (isMultiSelect) {
            const newSet = new Set(selectedIds);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            setSelectedIds(newSet);
        } else {
            onSelect(rawValue, rawValue);
            onClose();
        }
    };

    const handleSelectConfirm = () => {
        if (isMultiSelect) {
            const selectedItems = gruplar.filter(g => selectedIds.has(g.id));
            onSelect(selectedItems, selectedItems);
        }
        onClose();
    };

    // Filtreleme (Sadece görsel, ağaç yapısını bozmamak için)
    const filterTree = (nodes: TreeItem[], query: string): TreeItem[] => {
        if (!query) return nodes;
        const lowerQuery = query.toLocaleLowerCase('tr-TR');

        return nodes.map(node => {
            const match = (node.label as string).toLocaleLowerCase('tr-TR').includes(lowerQuery);
            const filteredChildren = node.children ? filterTree(node.children, query) : [];
            
            if (match || filteredChildren.length > 0) {
                return { ...node, children: filteredChildren };
            }
            return null;
        }).filter(Boolean) as TreeItem[];
    };

    const filteredTreeData = useMemo(() => filterTree(treeData, searchQuery), [treeData, searchQuery]);

    useEffect(() => {
        if (searchQuery && filteredTreeData.length > 0) {
            const expandAll = (nodes: TreeItem[], state: Record<string, boolean>) => {
                nodes.forEach(node => {
                    if (node.children && node.children.length > 0) {
                        state[node.id] = true;
                        expandAll(node.children, state);
                    }
                });
            };
            const nextExpanded = { ...expandedNodes };
            expandAll(filteredTreeData, nextExpanded);
            setExpandedNodes(nextExpanded);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, filteredTreeData]);

    const renderItem = (item: TreeItem, level: number, isExpanded: boolean, onToggleExpand: () => void) => {
        const hasChildren = item.children && item.children.length > 0;
        const isSelected = selectedIds.has(item.id);

        return (
            <div 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    paddingLeft: `${level * 24 + 12}px`,
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--glass-border)',
                    background: isSelected && !isMultiSelect ? 'var(--accent-light)' : 'transparent'
                }}
                className="hover:bg-[var(--bg-secondary)]"
                onClick={() => toggleSelection(item.id, item.rawValue)}
            >
                <div 
                    style={{ width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '4px' }}
                    onClick={(e) => {
                        if (hasChildren) {
                            e.stopPropagation();
                            onToggleExpand();
                            setExpandedNodes(prev => ({ ...prev, [item.id]: !isExpanded }));
                        }
                    }}
                >
                    {hasChildren ? (isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />) : null}
                </div>

                {isMultiSelect && (
                    <div style={{ marginRight: '12px', color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)', display: 'flex' }}>
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </div>
                )}
                
                <div style={{ 
                    width: '28px', height: '28px', 
                    background: 'var(--bg-secondary)', 
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    marginRight: '12px'
                }}>
                    <Package size={14} />
                </div>
                
                <div style={{ fontWeight: hasChildren ? '600' : '500', color: 'var(--text-primary)' }}>
                    {item.label}
                </div>
            </div>
        );
    };

    return (
        <BasePopup
            isOpen={isOpen}
            onClose={onClose}
            title={tur === 1 ? "Ürün Grubu Seç" : "Hizmet Grubu Seç"}
            modalSize={isMultiSelect ? "xl" : "lg"}
            hideFooter={true}
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                <div className="mb-16">
                    <div style={{ position: 'relative', height: '42px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Grup adı ile ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '36px', height: '100%', width: '100%' }}
                            autoFocus
                        />
                    </div>
                </div>

                <div style={{ 
                    flex: 1, 
                    minHeight: 0, 
                    overflowY: 'auto', 
                    border: '1px solid var(--glass-border)', 
                    borderRadius: '8px',
                    background: 'var(--bg-primary)'
                }}>
                    {filteredTreeData.length > 0 ? (
                        <BaseTreeView 
                            data={filteredTreeData} 
                            renderItem={renderItem} 
                            isItemExpanded={(item) => !!expandedNodes[item.id]}
                        />
                    ) : (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Arama kriterlerine uygun grup bulunamadı.
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div style={{ padding: '16px 0 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {isMultiSelect && (
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                Seçilen Kayıt: <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedIds.size}</span>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <CancelButton onClick={onClose} />
                        {isMultiSelect && (
                            <OkButton 
                                onClick={handleSelectConfirm}
                                disabled={selectedIds.size === 0}
                            />
                        )}
                    </div>
                </div>
            </div>
        </BasePopup>
    );
};

export default UrunGrupSeciciModal;
