/**
 * @file useCardValidation.ts
 * @description 
 * Webakus kart formlarında form hatalarının state yönetimini (errors),
 * tekil alan hata temizliğini (clearError, clearErrors) ve Kampanya gibi
 * özel kartların validasyon süreçlerini yöneten merkezi kanca (hook).
 * 
 * Başlıca Görevleri:
 * - `errors` state'ini tutmak ve bileşenlere sunmak
 * - Kullanıcı alana değer girdikçe ilgili alanın hatasını temizlemek (`clearError`)
 * - Kampanya kartı ve kural validasyonlarını (`validateKampanya`) gerçekleştirmek
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useCardValidation = () => {
    const { t } = useTranslation();
    const [errors, setErrors] = useState<Record<string, string>>({});

    const clearError = useCallback((fieldName: string) => {
        setErrors((prev) => {
            if (!prev[fieldName]) return prev;
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }, []);

    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);

    // Kampanya Validasyon Mantığı
    const validateKampanya = (localKampanya: any, isIndirimActive: boolean, isHakedisActive: boolean): boolean => {
        const newErrors: Record<string, string> = {};

        if (!localKampanya.adi?.trim()) {
            newErrors.adi = t('Kampanya adı zorunludur.');
        }

        if (!localKampanya.kurallar || localKampanya.kurallar.length === 0) {
            newErrors.kurallar = t('En az bir kural eklemelisiniz.');
        }

        if (!isIndirimActive && !isHakedisActive) {
            newErrors.indirimHakedis = t('İndirim veya Hakedişten en az birini aktif etmelisiniz.');
        }

        if (isIndirimActive) {
            if (!localKampanya.indirimTuru) {
                newErrors.indirimTuru = t('İndirim türü seçmelisiniz.');
            }
            if (!localKampanya.aksiyonDegeri || Number(localKampanya.aksiyonDegeri) <= 0) {
                newErrors.aksiyonDegeri = t('İndirim değeri girmelisiniz.');
            }
        }

        if (isHakedisActive) {
            if (!localKampanya.hakedisTuru) {
                newErrors.hakedisTuru = t('Hakediş türü seçmelisiniz.');
            }
            if (localKampanya.hakedisTuru === 3) {
                if (!localKampanya.fiyatFarkiBelgesiId) {
                    newErrors.fiyatFarkiBelgesiId = t('Fiyat farkı belgesi seçmelisiniz.');
                }
            } else {
                if (!localKampanya.firmaHakEdisTutari || Number(localKampanya.firmaHakEdisTutari) <= 0) {
                    newErrors.firmaHakEdisTutari = t('Hakediş tutarı/oranı girmelisiniz.');
                }
            }
        }

        // Cari Katılım Koşulları Validasyonu
        if (!localKampanya.cariKatilimZamanAraligi) {
            newErrors.cariKatilimZamanAraligi = t('Yararlanma periyodu seçmelisiniz.');
        } else if (localKampanya.cariKatilimZamanAraligi === 6) { // Belirli Bir Sürede (Gün)
            if (!localKampanya.cariKatilimPeriyotSuresiGun || Number(localKampanya.cariKatilimPeriyotSuresiGun) <= 0) {
                newErrors.cariKatilimPeriyotSuresiGun = t('Periyot süresi 0\'dan büyük olmalıdır.');
            }
        }

        if (!localKampanya.cariKatilimSiniriTuru) {
            newErrors.cariKatilimSiniriTuru = t('Katılım sınırı seçmelisiniz.');
        } else if (localKampanya.cariKatilimSiniriTuru === 2) { // Belirli Sayıda
            if (!localKampanya.cariKatilimSayisi || Number(localKampanya.cariKatilimSayisi) <= 0) {
                newErrors.cariKatilimSayisi = t('Katılım sayısı 0\'dan büyük olmalıdır.');
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    return {
        errors,
        setErrors,
        clearError,
        clearErrors,
        validateKampanya
    };
};
