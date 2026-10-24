/**
 * @file useDocumentRules.ts
 * @description 
 * Webakus projesindeki tüm Belge formları (Sipariş, Fatura, İrsaliye, Depo Hareketi, Fiyat Listesi vb.)
 * için merkezi iş kurallarını, aktarım öncesi ön koşul kontrollerini ve kayıt validasyonlarını içerir.
 * 
 * Başlıca Görevleri:
 * - Depo ve Ticari belge aktarımlarında Depo/Cari seçimi ön koşul doğrulaması ve otomatik odaklama (`focus`)
 * - Belge kaydı anında ürün satırı varlığı ve sıfır miktar kontrolü (`validateBelgeKayit`)
 * - Fiyat Listesi belgesi zorunlu alan ve satır kontrolleri (`validateFiyatListesiForm`)
 */

import { useAlertDialog } from '@akalin/ui';
import { useTranslation } from 'react-i18next';

export const useDocumentRules = () => {
    const { showAlert } = useAlertDialog();
    const { t } = useTranslation();

    /**
     * Depo belgeleri (DepoHareketForm vb.) için aktarım veya modal açılış kuralları
     */
    const validateDepoBelgesiOnKosul = (formData: any) => {
        if (!formData.depoId) {
            showAlert('warning', 'Eksik Seçim', "Lütfen belge aktarımı yapmadan önce işlem yapılacak Depo'yu seçiniz.", () => {
                const depoInput = document.getElementById('depoId') || document.getElementById('depoHareketDepoInput');
                if (depoInput) depoInput.focus();
            });
            return false;
        }
        if (!formData.cariId) {
            showAlert('warning', 'Eksik Seçim', "Lütfen belge aktarımı yapmadan önce işlem yapılacak Cari'yi seçiniz.", () => {
                const cariInput = document.getElementById('cariId') || document.getElementById('depoHareketCariInput');
                if (cariInput) cariInput.focus();
            });
            return false;
        }
        return true;
    };

    /**
     * Ticari belgeler (İrsaliye, Fatura, Sipariş vb.) için aktarım veya modal açılış kuralları
     */
    const validateTicariBelgeOnKosul = (formData: any) => {
        if (!formData.cariId) {
            showAlert('warning', 'Eksik Seçim', "Lütfen belge aktarımı yapmadan önce işlem yapılacak Cari'yi seçiniz.", () => {
                const cariInput = document.getElementById('cariId') || document.getElementById('depoHareketCariInput');
                if (cariInput) cariInput.focus();
            });
            return false;
        }
        return true;
    };

    /**
     * Tüm belgelerin kayıt anında çalıştırılacak global kontroller
     */
    const validateBelgeKayit = (kalemler: any[], _formData: any) => {
        if (!kalemler || kalemler.length === 0 || kalemler.every(k => !k.urunVeHizmetKartiId && !k.urunId)) {
            showAlert('warning', 'Kayıt Hatası', 'En az bir ürün eklenmelidir.');
            return false;
        }
        
        const isMiktarSifir = kalemler.some(k => (k.urunVeHizmetKartiId || k.urunId) && (parseFloat(k.miktar) === 0 || !k.miktar));
        if (isMiktarSifir) {
            showAlert('warning', 'Kayıt Hatası', 'Miktar 0 olamaz.');
            return false;
        }
        return true;
    };

    /**
     * Fiyat listesi zorunlu alan doğrulamaları
     */
    const validateFiyatListesiForm = (formData: any) => {
        const errors: any = {};
        
        if (!formData.fiyatListesiTanimiId) errors.fiyatListesiTanimiId = t('auto_fiyat_tanimi_zorunludur', 'Fiyat tanımı seçilmesi zorunludur.');
        if (!formData.baslangicTarihi) errors.baslangicTarihi = t('auto_baslangic_tarihi_zorunludur', 'Başlangıç tarihi zorunludur.');
        if (!formData.bitisTarihi) errors.bitisTarihi = t('auto_bitis_tarihi_zorunludur', 'Bitiş tarihi zorunludur.');
        if (!formData.belgeNo || String(formData.belgeNo).trim() === '') errors.belgeNo = t('auto_belge_no_zorunludur', 'Belge no zorunludur.');
        if (!formData.cariId) errors.cariId = t('auto_cari_secimi_zorunludur', 'Cari seçimi zorunludur.');

        const gecerliKalemler = formData.kalemler?.filter((k: any) => k && (
            (k.tedarikciUrunKodu && String(k.tedarikciUrunKodu).trim()) || 
            k.urunVeHizmetKartiId || 
            (k.fiyat !== undefined && k.fiyat !== null && k.fiyat !== '' && Number(k.fiyat) > 0) ||
            (k.valorTarihi && String(k.valorTarihi).trim())
        )) || [];

        if (gecerliKalemler.length === 0) {
            errors.kalemler = t('auto_en_az_bir_satir_girilmeli', 'En az bir satır bilgi girilmelidir.');
        } else {
            const eksikSatirVar = gecerliKalemler.some((k: any) => 
                !k.tedarikciUrunKodu || 
                String(k.tedarikciUrunKodu).trim() === '' ||
                !k.urunVeHizmetKartiId ||
                k.fiyat === undefined || 
                k.fiyat === null || 
                k.fiyat === '' || 
                Number(k.fiyat) <= 0 ||
                !k.valorTarihi ||
                String(k.valorTarihi).trim() === ''
            );

            if (eksikSatirVar) {
                errors.kalemler = t('auto_eksik_satir_bilgisi', 'Lütfen eklediğiniz tüm satırlarda Tedarikçi Ürün Kodu, Ürün, Fiyat ve Valör Tarihi alanlarını eksiksiz doldurun.');
            } else {
                const hataliKalemler = gecerliKalemler.filter((k: any) => Number(k.fiyat) < 0);
                if (hataliKalemler.length > 0) {
                    errors.kalemler = t('auto_fiyat_negatif_olamaz', "Fiyat 0'dan küçük olamaz.");
                }
            }
        }

        const isValid = Object.keys(errors).length === 0;
        return { isValid, errors };
    };

    return {
        validateDepoBelgesiOnKosul,
        validateTicariBelgeOnKosul,
        validateBelgeKayit,
        validateFiyatListesiForm
    };
};
