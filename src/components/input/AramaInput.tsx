import React from 'react';
import { Search } from 'lucide-react';
import BaseSeciciInput from '../base/input/BaseSeciciInput';

export interface AramaInputProps {
    id?: string;
    value?: string;
    onChange?: (e: any) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    placeholder?: string;
    autoFocus?: boolean;
    inputClassName?: string;
    style?: React.CSSProperties;
}

const AramaInput: React.FC<AramaInputProps> = ({ 
    id,
    value, 
    onChange, 
    onKeyDown, 
    onFocus, 
    onBlur, 
    placeholder = 'Ara...', 
    autoFocus = false, 
    inputClassName = "form-input",
    style
}) => {
    return (
        <div style={style}>
            <BaseSeciciInput
                id={id || "arama-input"}
                onMenuClick={() => {}}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder={placeholder}
                autoFocus={autoFocus}
                icon={<Search size={18} />}
                hasSelection={!!value}
                onClear={() => onChange && onChange({ target: { value: '' }})}
                clearable={true}
                inputClassName={inputClassName}
                // Menü/Dropdown özelliği kapalı
                menuIcon={null}
            />
        </div>
    );
};

export default AramaInput;
