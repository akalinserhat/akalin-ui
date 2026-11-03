/**
 * Akalin UI - Tarih Aralığı Seçici Giriş Bileşeni (DateRangeInput.tsx)
 * 
 * Başlıca Görevleri:
 * - Başlangıç ve bitiş tarihlerini klavyeden doğrudan yazarak veya takvim üzerinden aralık (range) şeklinde seçtirmek
 * - Popover takvim açılır penceresi üzerinden ay ve gün navigasyonu sağlamak
 * - Aktif alan (Başlangıç / Bitiş) odaklanma desteği ile hedef tarihin doğrudan seçilebilmesini garanti etmek
 * - Form doğrulama (DocumentFormContext) ve hata durumlarını yönetmek
 */

import React, { forwardRef, useContext, useRef, useImperativeHandle, useState, useEffect, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FieldError from '../common/FieldError';
import { DocumentFormContext } from '../../pages/base/BaseDocumentPage';

export interface DateRangeInputProps {
    id?: string;
    startDate?: string;
    endDate?: string;
    baslangicTarihi?: string;
    bitisTarihi?: string;
    onChange?: (startDate: string, endDate: string) => void;
    startName?: string;
    endName?: string;
    baslangicName?: string;
    bitisName?: string;
    disabled?: boolean;
    required?: boolean;
    placeholderStart?: string;
    placeholderEnd?: string;
    placeholderBaslangic?: string;
    placeholderBitis?: string;
    errorStart?: boolean;
    errorEnd?: boolean;
    errorBaslangic?: boolean;
    errorBitis?: boolean;
    className?: string;
    autoFocus?: boolean;
}

export type TarihAraligiSeciciProps = DateRangeInputProps;

const normalizeDate = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    let s = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    s = s.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        return s;
    }
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) {
        const [d, m, y] = s.split('.');
        return `${y}-${m}-${d}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
        const [d, m, y] = s.split('/');
        return `${y}-${m}-${d}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    return s;
};

const formatDateToDisplay = (dateStr?: string | null) => {
    const normalized = normalizeDate(dateStr);
    if (!normalized) return '';
    const parts = normalized.split('-');
    if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return normalized;
};

const getDateString = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const parseUserDateInput = (val: string): string | null => {
    if (!val) return null;
    const s = val.trim();
    if (!s) return null;

    // YYYY-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
        const [y, m, d] = s.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
    }

    // DD.MM.YYYY or DD/MM/YYYY
    if (/^\d{1,2}[./-]\d{1,2}[./-]\d{4}$/.test(s)) {
        const parts = s.split(/[./-]/).map(Number);
        const d = parts[0];
        const m = parts[1];
        const y = parts[2];
        const date = new Date(y, m - 1, d);
        if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
    }

    // DDMMYYYY (8 digits)
    if (/^\d{8}$/.test(s)) {
        const d = Number(s.substring(0, 2));
        const m = Number(s.substring(2, 4));
        const y = Number(s.substring(4, 8));
        const date = new Date(y, m - 1, d);
        if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
            return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
    }

    return null;
};

const DateRangeInput = forwardRef<any, DateRangeInputProps>(({
    id = 'dateRangeInput',
    startDate,
    endDate,
    baslangicTarihi,
    bitisTarihi,
    onChange,
    startName,
    endName,
    baslangicName = 'baslangicTarihi',
    bitisName = 'bitisTarihi',
    disabled,
    required,
    placeholderStart,
    placeholderEnd,
    placeholderBaslangic,
    placeholderBitis,
    errorStart,
    errorEnd,
    errorBaslangic,
    errorBitis,
    className = '',
    autoFocus = false,
}, ref) => {
    const { t, i18n } = useTranslation();
    const formContext = (useContext as any)(DocumentFormContext);
    const formErrors = formContext?.errors;

    const actualStartDate = startDate !== undefined ? startDate : baslangicTarihi;
    const actualEndDate = endDate !== undefined ? endDate : bitisTarihi;
    const actualStartName = startName || baslangicName;
    const actualEndName = endName || bitisName;

    const [isOpen, setIsOpen] = useState(false);
    const [activeField, setActiveField] = useState<'start' | 'end' | null>(null);

    const [startText, setStartText] = useState(() => formatDateToDisplay(actualStartDate));
    const [endText, setEndText] = useState(() => formatDateToDisplay(actualEndDate));
    const [isEditingStart, setIsEditingStart] = useState(false);
    const [isEditingEnd, setIsEditingEnd] = useState(false);

    useEffect(() => {
        if (!isEditingStart) {
            setStartText(formatDateToDisplay(actualStartDate));
        }
    }, [actualStartDate, isEditingStart]);

    useEffect(() => {
        if (!isEditingEnd) {
            setEndText(formatDateToDisplay(actualEndDate));
        }
    }, [actualEndDate, isEditingEnd]);

    const [viewDate, setViewDate] = useState<Date>(() => {
        const s = normalizeDate(actualStartDate);
        if (s) {
            const [y, m, d] = s.split('-').map(Number);
            if (y && m) return new Date(y, m - 1, d || 1);
        }
        return new Date();
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const startInputRef = useRef<HTMLInputElement>(null);
    const endInputRef = useRef<HTMLInputElement>(null);

    const syncViewDateToField = useCallback((field: 'start' | 'end') => {
        const targetDate = field === 'end' ? (actualEndDate || actualStartDate) : (actualStartDate || actualEndDate);
        const norm = normalizeDate(targetDate);
        if (norm) {
            const [y, m, d] = norm.split('-').map(Number);
            if (y && m) {
                setViewDate(new Date(y, m - 1, d || 1));
            }
        }
    }, [actualStartDate, actualEndDate]);

    // Forward ref to allow parent components to programmatically open/focus the calendar
    useImperativeHandle(ref, () => ({
        focus: () => {
            if (!disabled) {
                setActiveField('start');
                syncViewDateToField('start');
                setIsOpen(true);
                startInputRef.current?.focus();
            }
        }
    }));

    // Handle outside clicks to close the calendar popover
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setActiveField(null);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Handle autoFocus property
    useEffect(() => {
        if (autoFocus && !disabled) {
            setActiveField('start');
            syncViewDateToField('start');
            setIsOpen(true);
        }
    }, [autoFocus, disabled, syncViewDateToField]);

    const baslangicError = errorStart || errorBaslangic || (formErrors && formErrors[actualStartName]);
    const bitisError = errorEnd || errorBitis || (formErrors && formErrors[actualEndName]);
    const hasError = !!baslangicError || !!bitisError;

    const isSameDay = (d: Date, dateStr?: string | null) => {
        const normalized = normalizeDate(dateStr);
        if (!normalized) return false;
        return getDateString(d) === normalized;
    };

    const isDayInRange = (d: Date, startStr?: string | null, endStr?: string | null) => {
        const s = normalizeDate(startStr);
        const e = normalizeDate(endStr);
        if (!s || !e) return false;
        const currentStr = getDateString(d);
        return currentStr > s && currentStr < e;
    };

    // Calendar Generation Helpers
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        // Monday as start of the week
        let startDayOfWeek = firstDayOfMonth.getDay() - 1;
        if (startDayOfWeek === -1) startDayOfWeek = 6;

        const totalDays = lastDayOfMonth.getDate();
        const days: (Date | null)[] = [];

        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }
        for (let day = 1; day <= totalDays; day++) {
            days.push(new Date(year, month, day));
        }
        return days;
    };

    const getWeekDays = () => {
        const lang = i18n.language || 'tr';
        if (lang.startsWith('en')) {
            return ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
        }
        return ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];
    };

    const getMonthName = (monthIndex: number) => {
        const lang = i18n.language || 'tr';
        const trMonths = [
            'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
        ];
        const enMonths = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return lang.startsWith('en') ? enMonths[monthIndex] : trMonths[monthIndex];
    };

    // Month Navigation handlers
    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // Calendar click logic
    const handleDayClick = (dayDate: Date) => {
        const dateStr = getDateString(dayDate);
        const s = normalizeDate(actualStartDate);
        const e = normalizeDate(actualEndDate);

        if (activeField === 'end') {
            // User explicitly wants to select or update the END date
            if (s && dateStr < s) {
                if (onChange) {
                    onChange(dateStr, s);
                }
            } else {
                if (onChange) {
                    onChange(s || dateStr, dateStr);
                }
            }
            setIsOpen(false);
            setActiveField(null);
            return;
        }

        if (activeField === 'start') {
            // User explicitly wants to select or update the START date
            if (e && dateStr > e) {
                if (onChange) {
                    onChange(dateStr, '');
                }
            } else {
                if (onChange) {
                    onChange(dateStr, e || '');
                }
            }
            setActiveField('end');
            return;
        }

        // Generic click (neither field specifically focused)
        if (!s) {
            if (onChange) {
                onChange(dateStr, '');
            }
            setActiveField('end');
        } else if (!e) {
            if (dateStr >= s) {
                if (onChange) {
                    onChange(s, dateStr);
                }
                setIsOpen(false);
                setActiveField(null);
            } else {
                if (onChange) {
                    onChange(dateStr, s);
                }
                setIsOpen(false);
                setActiveField(null);
            }
        } else {
            // Both are set:
            if (dateStr >= s) {
                if (onChange) {
                    onChange(s, dateStr);
                }
                setIsOpen(false);
                setActiveField(null);
            } else {
                if (onChange) {
                    onChange(dateStr, '');
                }
                setActiveField('end');
            }
        }
    };

    // Text Input typing handlers
    const handleStartBlur = () => {
        setIsEditingStart(false);
        const parsed = parseUserDateInput(startText);
        if (parsed) {
            const e = normalizeDate(actualEndDate);
            if (e && parsed > e) {
                if (onChange) onChange(parsed, parsed);
            } else {
                if (onChange) onChange(parsed, e || '');
            }
        } else if (!startText.trim()) {
            if (onChange) onChange('', normalizeDate(actualEndDate) || '');
        } else {
            setStartText(formatDateToDisplay(actualStartDate));
        }
    };

    const handleEndBlur = () => {
        setIsEditingEnd(false);
        const parsed = parseUserDateInput(endText);
        if (parsed) {
            const s = normalizeDate(actualStartDate);
            if (s && parsed < s) {
                if (onChange) onChange(parsed, s);
            } else {
                if (onChange) onChange(s || '', parsed);
            }
        } else if (!endText.trim()) {
            if (onChange) onChange(normalizeDate(actualStartDate) || '', '');
        } else {
            setEndText(formatDateToDisplay(actualEndDate));
        }
    };

    const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setStartText(val);
        const parsed = parseUserDateInput(val);
        if (parsed) {
            const currentEnd = normalizeDate(actualEndDate);
            if (currentEnd && parsed > currentEnd) {
                if (onChange) onChange(parsed, parsed);
            } else {
                if (onChange) onChange(parsed, currentEnd || '');
            }
        }
    };

    const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setEndText(val);
        const parsed = parseUserDateInput(val);
        if (parsed) {
            const currentStart = normalizeDate(actualStartDate);
            if (currentStart && parsed < currentStart) {
                if (onChange) onChange(parsed, currentStart);
            } else {
                if (onChange) onChange(currentStart || '', parsed);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'start' | 'end') => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setActiveField(null);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (field === 'start') {
                handleStartBlur();
                endInputRef.current?.focus();
            } else {
                handleEndBlur();
                setIsOpen(false);
                setActiveField(null);
            }
        }
    };

    const handleContainerClick = () => {
        if (disabled) return;
        if (!isOpen) {
            const s = normalizeDate(actualStartDate);
            if (!s) {
                setActiveField('start');
                syncViewDateToField('start');
            } else {
                setActiveField('end');
                syncViewDateToField('end');
            }
            setIsOpen(true);
        }
    };

    return (
        <div id={id} ref={containerRef} className={`flex-col w-full ${className}`} style={{ position: 'relative' }}>
            <div 
                className={`tarih-araligi-input-container ${hasError ? 'is-invalid' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={handleContainerClick}
            >
                <input
                    ref={startInputRef}
                    type="text"
                    name={actualStartName}
                    value={isEditingStart ? startText : formatDateToDisplay(actualStartDate)}
                    placeholder={placeholderStart || placeholderBaslangic || t('TarihAraligi_baslangic') || 'Başlangıç'}
                    className={`tarih-araligi-sub-input start-date ${activeField === 'start' && isOpen ? 'active' : ''}`}
                    disabled={disabled}
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveField('start');
                        syncViewDateToField('start');
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        setActiveField('start');
                        setIsEditingStart(true);
                        setStartText(formatDateToDisplay(actualStartDate));
                        syncViewDateToField('start');
                        setIsOpen(true);
                    }}
                    onBlur={handleStartBlur}
                    onChange={handleStartChange}
                    onKeyDown={(e) => handleKeyDown(e, 'start')}
                />

                <span className="tarih-araligi-separator">-</span>

                <input
                    ref={endInputRef}
                    type="text"
                    name={actualEndName}
                    value={isEditingEnd ? endText : formatDateToDisplay(actualEndDate)}
                    placeholder={placeholderEnd || placeholderBitis || t('TarihAraligi_bitis') || 'Bitiş'}
                    className={`tarih-araligi-sub-input end-date ${activeField === 'end' && isOpen ? 'active' : ''}`}
                    disabled={disabled}
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveField('end');
                        syncViewDateToField('end');
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        setActiveField('end');
                        setIsEditingEnd(true);
                        setEndText(formatDateToDisplay(actualEndDate));
                        syncViewDateToField('end');
                        setIsOpen(true);
                    }}
                    onBlur={handleEndBlur}
                    onChange={handleEndChange}
                    onKeyDown={(e) => handleKeyDown(e, 'end')}
                />

                <div className="flex-grow flex-1" />

                <span 
                    className="tarih-araligi-icon-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!disabled) {
                            if (!isOpen) {
                                const s = normalizeDate(actualStartDate);
                                if (!s) {
                                    setActiveField('start');
                                    syncViewDateToField('start');
                                } else {
                                    setActiveField('end');
                                    syncViewDateToField('end');
                                }
                                setIsOpen(true);
                            } else {
                                setIsOpen(false);
                                setActiveField(null);
                            }
                        }
                    }}
                >
                    <Calendar size={16} />
                </span>

                {isOpen && !disabled && (
                    <div className="date-range-popover" onClick={(e) => e.stopPropagation()}>
                        <div className="popover-header">
                            <button type="button" className="month-nav-btn" onClick={handlePrevMonth}>
                                &lt;
                            </button>
                            <span className="month-title">
                                {getMonthName(viewDate.getMonth())} {viewDate.getFullYear()}
                            </span>
                            <button type="button" className="month-nav-btn" onClick={handleNextMonth}>
                                &gt;
                            </button>
                        </div>

                        <div className="days-grid">
                            {getWeekDays().map(day => (
                                <span key={day} className="day-name">{day}</span>
                            ))}
                        </div>

                        <div className="days-grid">
                            {getDaysInMonth(viewDate).map((day, idx) => {
                                if (!day) return <span key={`empty-${idx}`} className="day-cell empty" />;

                                const isStart = isSameDay(day, actualStartDate);
                                const isEnd = isSameDay(day, actualEndDate);
                                const isInRange = isDayInRange(day, actualStartDate, actualEndDate);
                                const dayStr = getDateString(day);

                                return (
                                    <button
                                        key={dayStr}
                                        type="button"
                                        className={`day-cell ${isStart ? 'range-start' : ''} ${isEnd ? 'range-end' : ''} ${isInRange ? 'range-between' : ''}`}
                                        onClick={() => handleDayClick(day)}
                                    >
                                        {day.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {(baslangicError || bitisError) && (
                <div className="flex-col gap-4 mt-4 w-full">
                    {baslangicError && <FieldError error={baslangicError} />}
                    {bitisError && bitisError !== baslangicError && <FieldError error={bitisError} />}
                </div>
            )}
        </div>
    );
});

DateRangeInput.displayName = 'DateRangeInput';

export { DateRangeInput as TarihAraligiSecici };
export default DateRangeInput;
