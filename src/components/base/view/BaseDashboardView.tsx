/**
 * Akalin UI - Temel Dashboard Görünüm Sınıfı (BaseDashboardView)
 * Dashboard içindeki istatistik, özet veri ve kartların (widget) miras alacağı
 * veya doğrudan kullanacağı temel OOP Sınıf (Class) bileşenidir.
 */
import React, { Component, ReactNode } from 'react';

export interface BaseDashboardViewProps {
    title: string;
    value?: any;
    subtitle?: string;
    subtitleColor?: string;
    icon?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    emptyText?: string;
}

export default class BaseDashboardView<P extends BaseDashboardViewProps = BaseDashboardViewProps, S = {}> extends Component<P, S> {
    
    static defaultProps = {
        emptyText: '-'
    };

    /**
     * Alt sınıfların (Child classes) miras alıp override (ezebileceği) 
     * ederek kendi veri formatlama mantıklarını kuracağı metot.
     */
    protected formatValue(val: any): any {
        return String(val);
    }

    render() {
        const { title, value, subtitle, subtitleColor, icon, className, style, emptyText } = this.props;
        
        // Değer varsa alt sınıfın (veya base'in) formatValue fonksiyonunu çağır
        const displayValue = value !== undefined && value !== null && value !== '' ? this.formatValue(value) : emptyText;

        return (
            <div 
                className={`surface-card base-dashboard-view ${className || ''}`} 
                style={{ ...style }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="stat-title">{title}</div>
                    {icon && (
                        <div style={{ color: 'var(--text-secondary)' }}>
                            {icon}
                        </div>
                    )}
                </div>
                
                <div className="stat-value">{displayValue}</div>
                
                {subtitle && (
                    <div style={{ fontSize: '12px', color: subtitleColor || 'var(--text-secondary)', marginTop: '8px' }}>
                        {subtitle}
                    </div>
                )}
            </div>
        );
    }
}
