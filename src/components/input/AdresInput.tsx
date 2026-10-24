/**
 * @file AdresInput.tsx
 * @description 
 * Webakus UI Core - İl, İlçe ve Açık Adres Giriş Bileşeni (AdresInput)
 * 
 * Başlıca Özellikleri:
 * - İl (Dropdown/Select) ve İlçe (İl'e bağımlı Dropdown/Select) alanlarını 2 sütunlu satırda sunar.
 * - Açık Adres textarea alanını alt satırda tam genişlikte konumlandırır.
 * - In-memory önbellekleme (cached API) ile illeri ve ilçeleri ağ yükü olmadan anında sunar.
 * - Hem nesne (AdresValue) hem de bağımsız prop'lar (ilId, ilceId, adres vb.) ile çift yönlü esnek kullanım sağlar.
 * - Sıfır inline CSS ve Material Design 3 tasarım token'larıyla tam uyumludur.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { MapPin, AlignLeft, Building } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FieldError } from '@akalin/ui';

export interface AdresItemOption {
    id: number;
    ad: string;
    [key: string]: any;
}

export interface AdresValue {
    ilId?: number | string | null;
    ilceId?: number | string | null;
    ilAdi?: string | null;
    ilceAdi?: string | null;
    acikAdres?: string;
    adres?: string;
    [key: string]: any;
}

export interface AdresInputProps {
    value?: AdresValue;
    onChange?: (val: AdresValue) => void;

    // Ayrık / Flat prop desteği
    ilId?: number | string | null;
    ilceId?: number | string | null;
    ilAdi?: string | null;
    ilceAdi?: string | null;
    acikAdres?: string;
    adres?: string;

    onIlChange?: (ilId: number | null, ilAdi?: string | null, ilItem?: AdresItemOption | null) => void;
    onIlceChange?: (ilceId: number | null, ilceAdi?: string | null, ilceItem?: AdresItemOption | null) => void;
    onAdresChange?: (adresText: string) => void;

    ilLabel?: string;
    ilceLabel?: string;
    adresLabel?: string;

    ilPlaceholder?: string;
    ilcePlaceholder?: string;
    adresPlaceholder?: string;

    showLabels?: boolean;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    rows?: number;
    className?: string;

    errors?: {
        il?: string;
        ilce?: string;
        adres?: string;
        [key: string]: string | undefined;
    };
}

// Global In-Memory Önbellek
let cachedIller: AdresItemOption[] | null = null;
let fetchingIllerPromise: Promise<AdresItemOption[]> | null = null;
const cachedIlcelerMap = new Map<number, AdresItemOption[]>();

const fetchIllerCached = async (): Promise<AdresItemOption[]> => {
    if (cachedIller) return cachedIller;
    if (fetchingIllerPromise) return fetchingIllerPromise;

    fetchingIllerPromise = axios.get('/api/AdresYonetimi/Iller')
        .then(res => {
            const data = (res.data || []).map((item: any) => ({
                id: item.id,
                ad: item.gorunurAd || item.ad
            }));
            cachedIller = data;
            fetchingIllerPromise = null;
            return data;
        })
        .catch(err => {
            console.error('İller yüklenemedi:', err);
            fetchingIllerPromise = null;
            return [];
        });

    return fetchingIllerPromise;
};

const fetchIlcelerCached = async (ilId: number): Promise<AdresItemOption[]> => {
    if (cachedIlcelerMap.has(ilId)) {
        return cachedIlcelerMap.get(ilId)!;
    }

    try {
        const res = await axios.get(`/api/AdresYonetimi/Ilceler/${ilId}`);
        const data = (res.data || []).map((item: any) => ({
            id: item.id,
            ad: item.gorunurAd || item.ad
        }));
        cachedIlcelerMap.set(ilId, data);
        return data;
    } catch (err) {
        console.error('İlçeler yüklenemedi:', err);
        return [];
    }
};

export const AdresInput: React.FC<AdresInputProps> = ({
    value,
    onChange,
    ilId: propIlId,
    ilceId: propIlceId,
    ilAdi: propIlAdi,
    ilceAdi: propIlceAdi,
    acikAdres: propAcikAdres,
    adres: propAdres,
    onIlChange,
    onIlceChange,
    onAdresChange,
    ilLabel,
    ilceLabel,
    adresLabel,
    ilPlaceholder,
    ilcePlaceholder,
    adresPlaceholder,
    showLabels = true,
    required = false,
    disabled = false,
    readOnly = false,
    rows = 3,
    className = '',
    errors
}) => {
    const { t } = useTranslation();

    const [iller, setIller] = useState<AdresItemOption[]>(cachedIller || []);
    const [ilceler, setIlceler] = useState<AdresItemOption[]>([]);
    const [loadingIller, setLoadingIller] = useState<boolean>(!cachedIller);
    const [loadingIlceler, setLoadingIlceler] = useState<boolean>(false);

    // Değerleri birleştir (value nesnesi veya ayrık proplar)
    const rawIlId = value?.ilId !== undefined ? value.ilId : propIlId;
    const rawIlceId = value?.ilceId !== undefined ? value.ilceId : propIlceId;
    const currentIlAdi = value?.ilAdi !== undefined ? value.ilAdi : propIlAdi;
    const currentIlceAdi = value?.ilceAdi !== undefined ? value.ilceAdi : propIlceAdi;
    const currentAdres = value?.acikAdres !== undefined 
        ? value.acikAdres 
        : (value?.adres !== undefined ? value.adres : (propAcikAdres !== undefined ? propAcikAdres : (propAdres || '')));

    const currentIlId = useMemo(() => {
        if (rawIlId !== undefined && rawIlId !== null && rawIlId !== '') {
            return Number(rawIlId);
        }
        // Eğer id yoksa ama isim varsa listeden eşleştir
        if (currentIlAdi && iller.length > 0) {
            const matched = iller.find(i => i.ad.toLocaleLowerCase('tr-TR') === currentIlAdi.toLocaleLowerCase('tr-TR'));
            if (matched) return matched.id;
        }
        return null;
    }, [rawIlId, currentIlAdi, iller]);

    const currentIlceId = useMemo(() => {
        if (rawIlceId !== undefined && rawIlceId !== null && rawIlceId !== '') {
            return Number(rawIlceId);
        }
        if (currentIlceAdi && ilceler.length > 0) {
            const matched = ilceler.find(i => i.ad.toLocaleLowerCase('tr-TR') === currentIlceAdi.toLocaleLowerCase('tr-TR'));
            if (matched) return matched.id;
        }
        return null;
    }, [rawIlceId, currentIlceAdi, ilceler]);

    // İlleri Yükle
    useEffect(() => {
        let isMounted = true;
        if (!cachedIller) {
            setLoadingIller(true);
            fetchIllerCached().then(data => {
                if (isMounted) {
                    setIller(data);
                    setLoadingIller(false);
                }
            });
        } else {
            setIller(cachedIller);
            setLoadingIller(false);
        }
        return () => { isMounted = false; };
    }, []);

    // Seçili ile göre İlçeleri Yükle
    useEffect(() => {
        let isMounted = true;
        if (currentIlId) {
            setLoadingIlceler(true);
            fetchIlcelerCached(currentIlId).then(data => {
                if (isMounted) {
                    setIlceler(data);
                    setLoadingIlceler(false);
                }
            });
        } else {
            setIlceler([]);
            setLoadingIlceler(false);
        }
        return () => { isMounted = false; };
    }, [currentIlId]);

    const handleIlChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const newIlId = val ? Number(val) : null;
        const matchedIl = newIlId ? iller.find(i => i.id === newIlId) || null : null;
        const newIlAdi = matchedIl?.ad || null;

        if (onIlChange) {
            onIlChange(newIlId, newIlAdi, matchedIl);
        }

        if (onChange) {
            onChange({
                ...(value || {}),
                ilId: newIlId,
                ilAdi: newIlAdi,
                ilceId: null,
                ilceAdi: null,
                acikAdres: currentAdres,
                adres: currentAdres
            });
        }
    };

    const handleIlceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const newIlceId = val ? Number(val) : null;
        const matchedIlce = newIlceId ? ilceler.find(i => i.id === newIlceId) || null : null;
        const newIlceAdi = matchedIlce?.ad || null;

        if (onIlceChange) {
            onIlceChange(newIlceId, newIlceAdi, matchedIlce);
        }

        if (onChange) {
            onChange({
                ...(value || {}),
                ilId: currentIlId,
                ilAdi: currentIlAdi,
                ilceId: newIlceId,
                ilceAdi: newIlceAdi,
                acikAdres: currentAdres,
                adres: currentAdres
            });
        }
    };

    const handleAdresChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;

        if (onAdresChange) {
            onAdresChange(text);
        }

        if (onChange) {
            onChange({
                ...(value || {}),
                ilId: currentIlId,
                ilAdi: currentIlAdi,
                ilceId: currentIlceId,
                ilceAdi: currentIlceAdi,
                acikAdres: text,
                adres: text
            });
        }
    };

    const resolvedIlLabel = ilLabel || t('il', 'İl');
    const resolvedIlceLabel = ilceLabel || t('ilce', 'İlçe');
    const resolvedAdresLabel = adresLabel || t('Açık Adres', 'Açık Adres');

    const resolvedIlPlaceholder = ilPlaceholder || (loadingIller ? t('iller_yukleniyor', 'İller Yükleniyor...') : t('il_seciniz', 'İl Seçiniz'));
    const resolvedIlcePlaceholder = ilcePlaceholder || (!currentIlId 
        ? t('once_il_seciniz', 'Önce İl Seçiniz') 
        : loadingIlceler 
            ? t('ilceler_yukleniyor', 'İlçeler Yükleniyor...') 
            : t('ilce_seciniz', 'İlçe Seçiniz'));
    const resolvedAdresPlaceholder = adresPlaceholder || t('auto_acik_adres_placeholder', 'Cadde, sokak, mahalle, bina, kapı no...');

    return (
        <div className={`adres-input-container ${className}`}>
            {/* Üst Satır: İl ve İlçe (2 Sütunlu Grid) */}
            <div className="adres-input-row">
                {/* İl Seçici */}
                <div className="document-header-field">
                    {showLabels && (
                        <label className="document-field-label">
                            <span>{resolvedIlLabel}</span>
                            {required && <span className="required-mark ml-4">*</span>}
                        </label>
                    )}
                    <div className="input-with-icon">
                        <span className="icon">
                            <MapPin size={16} />
                        </span>
                        <select
                            className={`form-input adres-input-select ${errors?.il ? 'is-invalid' : ''}`}
                            value={currentIlId ?? ''}
                            onChange={handleIlChange}
                            disabled={disabled || readOnly || loadingIller}
                        >
                            <option value="">{resolvedIlPlaceholder}</option>
                            {iller.map(il => (
                                <option key={il.id} value={il.id}>
                                    {il.ad}
                                </option>
                            ))}
                        </select>
                    </div>
                    <FieldError error={errors?.il} />
                </div>

                {/* İlçe Seçici */}
                <div className="document-header-field">
                    {showLabels && (
                        <label className="document-field-label">
                            <span>{resolvedIlceLabel}</span>
                            {required && <span className="required-mark ml-4">*</span>}
                        </label>
                    )}
                    <div className="input-with-icon">
                        <span className="icon">
                            <Building size={16} />
                        </span>
                        <select
                            className={`form-input adres-input-select ${errors?.ilce ? 'is-invalid' : ''}`}
                            value={currentIlceId ?? ''}
                            onChange={handleIlceChange}
                            disabled={disabled || readOnly || !currentIlId || loadingIlceler}
                        >
                            <option value="">{resolvedIlcePlaceholder}</option>
                            {ilceler.map(ilce => (
                                <option key={ilce.id} value={ilce.id}>
                                    {ilce.ad}
                                </option>
                            ))}
                        </select>
                    </div>
                    <FieldError error={errors?.ilce} />
                </div>
            </div>

            {/* Alt Satır: Açık Adres (Tam Genişlik) */}
            <div className="document-header-field full-width">
                {showLabels && (
                    <label className="document-field-label">
                        <span>{resolvedAdresLabel}</span>
                        {required && <span className="required-mark ml-4">*</span>}
                    </label>
                )}
                <div className="input-with-icon is-textarea">
                    <span className="icon is-top">
                        <AlignLeft size={16} />
                    </span>
                    <textarea
                        className={`form-input adres-input-textarea ${errors?.adres ? 'is-invalid' : ''}`}
                        value={currentAdres}
                        onChange={handleAdresChange}
                        placeholder={resolvedAdresPlaceholder}
                        rows={rows}
                        disabled={disabled || readOnly}
                    />
                </div>
                <FieldError error={errors?.adres} />
            </div>
        </div>
    );
};

export default AdresInput;
