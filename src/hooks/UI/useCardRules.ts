/**
 * @file useCardRules.ts
 * @description 
 * Projedeki tüm Kart formları (Cari Kart, Ürün/Hizmet Kartı, Kasa, POS Cihazı,
 * Tüketici Kredisi, Firma Tanımları vb.) için merkezi iş ve validasyon (doğrulama) kurallarını içerir.
 * 
 * Başlıca Görevleri:
 * - T.C. Kimlik Numarası mod-10 algoritması doğrulaması
 * - Cari, Ürün, Kasa, POS ve Firma formları için zorunlu alan ve format kontrolleri
 * - Formların varsayılan alan değerleri (default values) ve otomatik odaklanma (auto-focus) tanımları
 */

import { useTranslation } from 'react-i18next';

export const useCardRules = () => {
    const { t } = useTranslation();

    /**
     * T.C. Kimlik mod-10 algoritmasını doğrular.
     */
    const validateTcKimlikNo = (tc: string): boolean => {
        if (!tc) return true; // Boş bırakılabilir (zorunluluk iş kurallarına göre değişir)
        if (!/^[1-9][0-9]{10}$/.test(tc)) return false;

        let arr = tc.split('').map(Number);
        let oddSum = arr[0] + arr[2] + arr[4] + arr[6] + arr[8];
        let evenSum = arr[1] + arr[3] + arr[5] + arr[7];

        let tenth = (oddSum * 7 - evenSum) % 10;
        if (tenth < 0) tenth += 10;
        
        if (tenth !== arr[9]) return false;

        let eleventh = (arr.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;
        if (eleventh !== arr[10]) return false;

        return true;
    };

    /**
     * Cari kartı anlık input (onBlur veya onChange) doğrulaması.
     * Hata varsa hata mesajını, yoksa null döner.
     */
    const validateCariField = (name: string, value: any, formData: any): string | null => {
        if (name === 'tcKimlikNo' && formData.tipi === 2) {
            if (value && !validateTcKimlikNo(value)) {
                return t('validation.invalid_tc', { defaultValue: 'Geçersiz T.C. Kimlik Numarası.' });
            }
        }
        return null;
    };

    /**
     * Cari formunun toplu validasyonu (onSubmit anında vs.)
     */
    const validateCariForm = (formData: any) => {
        const errors: any = {};
        
        if (formData.tipi === 2 && formData.tcKimlikNo) {
            if (!validateTcKimlikNo(formData.tcKimlikNo)) {
                errors.tcKimlikNo = t('validation.invalid_tc', { defaultValue: 'Geçersiz T.C. Kimlik Numarası.' });
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    };

    /**
     * Ürün/Hizmet kartı anlık input doğrulaması.
     */
    const validateUrunField = (name: string, value: any, _formData: any): string | null => {
        if (name === 'satisFiyati' || name === 'alisFiyati') {
            if (value !== null && value !== '' && Number(value) < 0) {
                return t('validation.price_min_zero', { defaultValue: 'Fiyat 0 veya daha büyük olmalıdır.' });
            }
        }
        if (name === 'kdvOrani') {
            if (value !== null && value !== '' && (Number(value) < 0 || Number(value) > 100)) {
                return t('validation.vat_range', { defaultValue: 'KDV oranı %0 ile %100 arasında olmalıdır.' });
            }
        }
        return null;
    };

    /**
     * Ürün/Hizmet formunun toplu validasyonu.
     */
    const validateUrunForm = (formData: any) => {
        const errors: any = {};
        
        if (!formData.ad || formData.ad.trim() === '') {
            errors.ad = t('validation.product_name_required', { defaultValue: 'Ürün adı zorunludur.' });
        }

        if (formData.satisFiyati !== null && formData.satisFiyati !== '' && Number(formData.satisFiyati) < 0) {
            errors.satisFiyati = t('validation.sales_price_min_zero', { defaultValue: 'Satış fiyatı 0 veya daha büyük olmalıdır.' });
        }

        if (formData.kdvOrani !== null && formData.kdvOrani !== '' && (Number(formData.kdvOrani) < 0 || Number(formData.kdvOrani) > 100)) {
            errors.kdvOrani = t('validation.vat_range', { defaultValue: 'KDV oranı %0 ile %100 arasında olmalıdır.' });
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    };

    /**
     * Kasa formunun toplu validasyonu.
     */
    const validateKasaForm = (formData: any) => {
        const errors: any = {};
        
        if (!formData.kod) {
            errors.kod = t('validation.required_field', { defaultValue: 'Kasa Kodu zorunludur.' });
        }
        if (!formData.ad) {
            errors.ad = t('validation.required_field', { defaultValue: 'Kasa Adı zorunludur.' });
        }
        if (!formData.subeId) {
            errors.subeId = t('validation.required_field', { defaultValue: 'Şube seçimi zorunludur.' });
        }
        if (!formData.paraBirimiId) {
            errors.paraBirimiId = t('validation.required_field', { defaultValue: 'Para Birimi zorunludur.' });
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    };

    /**
     * POS Cihaz formunun varsayılan değerleri ve ilk odaklanılacak bileşen (auto-focus) bilgisi.
     */
    const getPosCihazDefaults = () => {
        return {
            values: {
                ad: '',
                aktifMi: true,
                tip: 1,          // 1: Fiziksel POS varsayılan
                bankaId: '',
                bankaHesapId: '',
                paraBirimi: 1,   // 1: TL varsayılan
                geriDonusTuru: 1, // 1: Normal (Anında) varsayılan — zorunlu alan
                merchantId: '',
                terminalId: '',
                storeKey: '',
                apiUser: '',
                apiPassword: '',
                secure3DType: 1
            },
            focusId: 'pos-banka-secici' // İlk odaklanılacak inputun DOM ID'si
        };
    };

    /**
     * POS Cihaz formunun toplu validasyonu.
     */
    const validatePosCihazForm = (formData: any) => {
        const errors: any = {};

        if (!formData.ad || formData.ad.trim() === '') {
            errors.ad = t('validation.required_field', { defaultValue: 'POS Adı zorunludur.' });
        }
        if (!formData.bankaId) {
            errors.bankaId = t('validation.required_field', { defaultValue: 'Banka seçimi zorunludur.' });
        }
        if (!formData.bankaHesapId) {
            errors.bankaHesapId = t('validation.required_field', { defaultValue: 'Banka hesabı seçimi zorunludur.' });
        }
        if (!formData.geriDonusTuru) {
            errors.geriDonusTuru = t('validation.required_field', { defaultValue: 'Geri Dönüş Türü zorunludur.' });
        }
        if (!formData.tip) {
            errors.tip = t('validation.required_field', { defaultValue: 'POS Tipi zorunludur.' });
        }
        if (!formData.paraBirimi) {
            errors.paraBirimi = t('validation.required_field', { defaultValue: 'Para Birimi zorunludur.' });
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    };

    /**
     * Firma formu (FirmaForm.tsx) validasyonu
     */
    const validateFirmaForm = (formData: any, editingFirma: any, kullaniciDurumu: any) => {
        const errors: any = {};

        if (!formData.firmaAdi || formData.firmaAdi.trim() === '') {
            errors.firmaAdi = t('validation.required_field', { defaultValue: 'Firma ünvanı zorunludur.' });
        }

        if (!formData.email || formData.email.trim() === '') {
            errors.email = t('validation.required_field', { defaultValue: 'E-posta adresi zorunludur.' });
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            errors.email = t('validation.invalid_email', { defaultValue: 'Geçerli bir e-posta adresi giriniz.' });
        }

        if (!editingFirma && (!kullaniciDurumu || !kullaniciDurumu.mevcutKullanici)) {
            if (!formData.sifre || formData.sifre.trim() === '') {
                errors.sifre = t('validation.required_field', { defaultValue: 'Sisteme giriş şifresi zorunludur.' });
            } else if (formData.sifre.length < 6) {
                errors.sifre = t('validation.min_length_password', { defaultValue: 'Şifre en az 6 karakter olmalıdır.' });
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    };

    return {
        validateTcKimlikNo,
        validateCariField,
        validateCariForm,
        validateUrunField,
        validateUrunForm,
        validateKasaForm,
        getPosCihazDefaults,
        validatePosCihazForm,
        validateFirmaForm,
        getTuketiciKredisiDefaults: () => {
            return {
                values: {
                    kod: '',
                    ad: '',
                    bankaId: '',
                    bankaHesapId: '',
                    paraBirimiId: 1, // TRY varsayılan
                    aktifMi: true,
                    aciklama: ''
                },
                focusId: 'tk-kod-input'
            };
        },
        validateTuketiciKredisiForm: (formData: any) => {
            const errors: any = {};
            if (!formData.kod || formData.kod.trim() === '') {
                errors.kod = t('validation.required_field', { defaultValue: 'Firma kodu zorunludur.' });
            }
            if (!formData.ad || formData.ad.trim() === '') {
                errors.ad = t('validation.required_field', { defaultValue: 'Firma adı zorunludur.' });
            }
            if (!formData.bankaId) {
                errors.bankaId = t('validation.required_field', { defaultValue: 'Banka seçimi zorunludur.' });
            }
            if (!formData.bankaHesapId) {
                errors.bankaHesapId = t('validation.required_field', { defaultValue: 'Banka hesabı seçimi zorunludur.' });
            }
            if (!formData.paraBirimiId) {
                errors.paraBirimiId = t('validation.required_field', { defaultValue: 'Para birimi seçimi zorunludur.' });
            }
            return {
                isValid: Object.keys(errors).length === 0,
                errors
            };
        },
        getTuketiciKredisiKomisyonDefaults: (tuketiciKredisiFirmasiId: number) => {
            return {
                values: {
                    tuketiciKredisiFirmasiId,
                    baslangicTarihi: new Date().toISOString().split('T')[0],
                    bitisTarihi: '',
                    aktifMi: true,
                    aciklama: '',
                    satirlar: []
                },
                focusId: 'tkk-baslangic-tarihi'
            };
        },
        validateTuketiciKredisiKomisyonForm: (formData: any) => {
            const errors: any = {};
            if (!formData.baslangicTarihi) {
                errors.baslangicTarihi = t('validation.required_field', { defaultValue: 'Başlangıç tarihi zorunludur.' });
            }
            if (formData.bitisTarihi && new Date(formData.bitisTarihi) < new Date(formData.baslangicTarihi)) {
                errors.bitisTarihi = t('validation.date_range_error', { defaultValue: 'Bitiş tarihi başlangıç tarihinden önce olamaz.' });
            }
            if (!formData.satirlar || formData.satirlar.length === 0) {
                errors.satirlar = t('validation.required_rows', { defaultValue: 'En az bir komisyon satırı eklenmelidir.' });
            }
            return {
                isValid: Object.keys(errors).length === 0,
                errors
            };
        }
    };
};
