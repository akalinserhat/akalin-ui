/**
 * @file DocumentResultPanelEditDialog.tsx
 * @description Belge sonuç panelindeki iskonto, KDV ve diğer dip toplam kalemlerinin düzenlendiği modal diyalog.
 */

import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Calculator } from 'lucide-react';
import { BaseDetailDialog, CurrencyInput, BaseNumericInput } from '@akalin/ui';
import { ResultItem } from './DocumentResultPanel';

export interface DocumentResultPanelEditDialogProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    items: ResultItem[];
    onSave: (title: string, items: ResultItem[]) => void;
    hideAddButton?: boolean;
}

const DocumentResultPanelEditDialog: React.FC<DocumentResultPanelEditDialogProps> = ({
    isOpen, onClose, title, items, onSave, hideAddButton
}) => {
    const [editTitle, setEditTitle] = useState(title);
    const [editItems, setEditItems] = useState<ResultItem[]>([]);

    useEffect(() => {
        if (isOpen) {
            setEditTitle(title);
            setEditItems([...items]);
        }
    }, [isOpen, title, items]);

    const handleSave = () => {
        const validItems = editItems.filter(i => {
            const hasLabel = typeof i.label === 'string' ? i.label.trim() !== '' : true;
            const hasValue = typeof i.value === 'string' ? i.value.trim() !== '' : true;
            return hasLabel || hasValue;
        });
        onSave(editTitle, validItems);
        onClose();
    };

    const handleItemChange = (id: string, updates: Partial<ResultItem>) =>
        setEditItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    const handleAddItem = () =>
        setEditItems(prev => [...prev, { id: Math.random().toString(), label: '', value: '', inputType: 'currency', isEditable: true }]);
    const handleRemoveItem = (id: string) =>
        setEditItems(prev => prev.filter(item => item.id !== id));

    return (
        <BaseDetailDialog 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Düzenle: ${title}`} 
            size="md"
            onSave={handleSave}
        >
            <div style={{
                padding: '24px 32px',
                background: 'linear-gradient(145deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                margin: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '6px', background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
                        <Calculator size={14} strokeWidth={2.5} />
                    </div>
                    <input
                        className="form-input"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        placeholder="Panel Başlığı"
                        style={{ 
                            fontWeight: '700', fontSize: '12px', color: 'var(--text-secondary)', 
                            textTransform: 'uppercase', letterSpacing: '0.5px', 
                            background: 'transparent', border: '1px dashed transparent', padding: '4px 8px', height: 'auto', flex: 1,
                            transition: 'border 0.2s', borderRadius: '6px'
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--glass-border)'}
                        onBlur={e => e.target.style.borderColor = 'transparent'}
                    />
                </div>
                
                {editItems.map((item) => {
                    const isLocked = item.isEditable === false;
                    const isPrimary = item.isPrimary;

                    return (
                        <div key={item.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                            borderTop: isPrimary ? '1px dashed var(--glass-border)' : 'none',
                            paddingTop: isPrimary ? '16px' : '0',
                            marginTop: isPrimary ? '4px' : '0'
                        }}>
                            {/* Label */}
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isLocked ? (
                                    <span style={{ fontSize: isPrimary ? '14px' : '13px', color: item.isAccent ? 'var(--accent-primary)' : (isPrimary ? 'var(--text-primary)' : 'var(--text-secondary)'), fontWeight: isPrimary ? '600' : '500' }}>
                                        {item.label}
                                    </span>
                                ) : (
                                    <>
                                        {!hideAddButton && (
                                            <button type="button" onClick={() => handleRemoveItem(item.id)} className="btn-icon" style={{ width: '28px', height: '28px', padding: 0, color: 'var(--danger)', background: 'var(--danger-light)', border: 'none', borderRadius: '6px' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                        {item.editLabelNode ? item.editLabelNode : (
                                            <input 
                                                className="form-input" 
                                                value={typeof item.label === 'string' ? item.label : ''} 
                                                onChange={e => handleItemChange(item.id, { label: e.target.value })} 
                                                placeholder="Başlık" 
                                                style={{ height: '32px', fontSize: isPrimary ? '14px' : '13px', padding: '0 12px', borderRadius: '8px', fontWeight: isPrimary ? '600' : '500', flex: 1, minWidth: '80px' }} 
                                            />
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Value */}
                            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {isLocked ? (
                                    <span style={{ fontSize: isPrimary ? '18px' : '14px', fontWeight: isPrimary ? '800' : '600', color: item.isAccent ? 'var(--danger)' : (isPrimary ? 'var(--accent-primary)' : 'var(--text-primary)') }}>
                                        {item.value}
                                    </span>
                                ) : (
                                    item.editValueNode ? item.editValueNode : (
                                        item.inputType === 'currency' ? (
                                            <CurrencyInput 
                                                className="form-input"
                                                value={item.numericValue ?? (parseFloat(String(item.value).replace(/[^0-9,-]/g, '').replace(',', '.')) || 0)}
                                                onChange={(e: any) => {
                                                    const num = e.target.value;
                                                    handleItemChange(item.id, { 
                                                        numericValue: num, 
                                                        value: new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
                                                    });
                                                }}
                                                style={{ height: '32px', fontSize: isPrimary ? '18px' : '14px', padding: '0 12px', borderRadius: '8px', fontWeight: isPrimary ? '800' : '600', width: '120px', textAlign: 'right' }}
                                            />
                                        ) : item.inputType === 'number' ? (
                                            <BaseNumericInput 
                                                className="form-input"
                                                value={item.numericValue ?? (parseFloat(String(item.value).replace(/[^0-9,-]/g, '').replace(',', '.')) || 0)}
                                                onChange={(e: any) => {
                                                    const num = e.target.value;
                                                    handleItemChange(item.id, { 
                                                        numericValue: num, 
                                                        value: new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(num)
                                                    });
                                                }}
                                                style={{ height: '32px', fontSize: isPrimary ? '18px' : '14px', padding: '0 12px', borderRadius: '8px', fontWeight: isPrimary ? '800' : '600', width: '120px', textAlign: 'right' }}
                                            />
                                        ) : (
                                            <input 
                                                className="form-input" 
                                                value={typeof item.value === 'string' ? item.value : ''} 
                                                onChange={e => handleItemChange(item.id, { value: e.target.value })} 
                                                placeholder="Değer" 
                                                style={{ height: '32px', fontSize: isPrimary ? '18px' : '14px', padding: '0 12px', borderRadius: '8px', fontWeight: isPrimary ? '800' : '600', width: '120px', textAlign: 'right' }} 
                                            />
                                        )
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}

                {!hideAddButton && (
                    <button
                        type="button"
                        onClick={handleAddItem}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'transparent', border: '1px dashed var(--glass-border)', color: 'var(--text-secondary)', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', marginTop: '12px', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.background = 'var(--accent-light)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                        <Plus size={16} /> Yeni İskonto / Tutar Alanı Ekle
                    </button>
                )}
            </div>
        </BaseDetailDialog>
    );
};

export default DocumentResultPanelEditDialog;
