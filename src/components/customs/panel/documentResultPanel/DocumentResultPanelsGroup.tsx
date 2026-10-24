import React, { ReactNode } from 'react';

export interface DocumentResultPanelsGroupProps {
    children: ReactNode;
    className?: string;
    align?: 'end' | 'start' | 'center' | 'between';
}

/**
 * Belge formlarının footer alanında birden fazla DocumentResultPanel bileşenini
 * estetik, orantılı ve duyarlı bir şekilde yan yana konumlandıran grup sarmalayıcısı.
 */
export const DocumentResultPanelsGroup: React.FC<DocumentResultPanelsGroupProps> = ({
    children,
    className = '',
    align = 'end'
}) => {
    return (
        <div className={`document-result-panels-group align-${align} ${className}`.trim()}>
            {children}
        </div>
    );
};

export default DocumentResultPanelsGroup;
