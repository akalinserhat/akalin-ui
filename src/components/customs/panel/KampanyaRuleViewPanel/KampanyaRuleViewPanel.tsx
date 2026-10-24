import React from 'react';
import { Edit2, Trash2, ShieldAlert, Plus } from 'lucide-react';
import { ActionMenu } from '@akalin/ui';
import './KampanyaRuleViewPanel.css';

export interface KampanyaRuleViewPanelProps {
    rules: any[];
    onEdit: (rule: any) => void;
    onDelete: (ruleUid: string) => void;
    onAdd: () => void;
    getKuralAlaniAdi: (kuralAlani: number) => string;
    getOperatorAdi: (operator: number) => string;
    getDeger: (rule: any) => string;
    emptyMessage?: string;
    addRuleText?: string;
}

const KampanyaRuleViewPanel: React.FC<KampanyaRuleViewPanelProps> = ({
    rules = [],
    onEdit,
    onDelete,
    onAdd,
    getKuralAlaniAdi,
    getOperatorAdi,
    getDeger,
    emptyMessage = "Henüz kural eklenmemiş",
    addRuleText = "Yeni Kural Ekle"
}) => {
    
    if (rules.length === 0) {
        return (
            <div className="kampanya-rule-empty">
                <div className="kampanya-rule-empty-icon">
                    <ShieldAlert size={24} />
                </div>
                <div className="text-secondary text-13 font-medium">{emptyMessage}</div>
                <button 
                    type="button" 
                    className="btn btn-secondary btn-sm flex items-center gap-6 mt-8" 
                    onClick={onAdd}
                >
                    <Plus size={14} />
                    <span>{addRuleText}</span>
                </button>
            </div>
        );
    }

    return (
        <div className="kampanya-rule-panel">
            {rules.map((rule) => {
                const kuralAlaniAdi = getKuralAlaniAdi(rule.kuralAlani);
                const operatorAdi = getOperatorAdi(rule.kuralOperatoru);
                const deger = getDeger(rule);

                return (
                    <div key={rule._uid} className="kampanya-rule-card">
                        <div className="kampanya-rule-details">
                            <div className="kampanya-rule-header">
                                <span className="kampanya-rule-title">
                                    <span className="text-primary font-semibold">{kuralAlaniAdi}</span>
                                </span>
                                <span className="chip-primary text-12 font-medium">
                                    {operatorAdi}
                                </span>
                            </div>
                            <div className="kampanya-rule-values">
                                <strong className="text-primary font-medium">Değer:</strong> {deger}
                            </div>
                        </div>
                        <div>
                            <ActionMenu 
                                actions={[
                                    { label: 'Düzenle', icon: <Edit2 size={16} />, onClick: () => onEdit(rule) },
                                    { label: 'Sil', icon: <Trash2 size={16} />, onClick: () => onDelete(rule._uid), danger: true }
                                ]}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default KampanyaRuleViewPanel;
