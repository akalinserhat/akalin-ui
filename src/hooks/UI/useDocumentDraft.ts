/**
 * @file useDocumentDraft.ts
 * @description 
 * Belge formlarının (Fatura, İrsaliye, Sipariş, Bordro vb.) yerel state'lerini (formData, kalemler vb.)
 * tarayıcının `sessionStorage` alanında otomatik olarak taslak olarak saklar ve geri yükler.
 * 
 * Başlıca Görevleri:
 * - Sayfadan ayrılma veya yeni ürün/cari ekleme sayfasına gidip geri dönme durumunda girilen verilerin kaybolmasını engeller.
 * - Form başarıyla kaydedildiğinde taslağı otomatik olarak temizler (`clearDraft`).
 * 
 * @param draftKey sessionStorage'da kullanılacak benzersiz anahtar (örn: 'draft_fatura_giris')
 * @param state Saklanacak tüm state objesi (örn: { formData, kalemler, activeRowId })
 * @param setStateFn Sayfa ilk açıldığında veya taslak okunduğunda çağrılacak fonksiyon
 * @param enabled Sadece yeni kayıt eklerken (id yoksa) aktif olması için boolean bayrak
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { isDraftMeaningful } from '../../utils/DocumentDraftManager';

export const useDocumentDraft = (
    draftKey: string, 
    state: any, 
    setStateFn: (draft: any) => void, 
    enabled: boolean = true
) => {
    let location: any = null;
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        location = useLocation();
    } catch (e) {
        location = null;
    }

    const isRestoring = useRef(false);
    const isCleared = useRef(false);

    // 1. Mount anında taslağı oku - Yalnızca Şablon seçildiğinde veya currentFormData varsa geri yükle!
    useEffect(() => {
        if (!enabled) return;
        
        // Eğer kullanıcı doğrudan "Ekle" düğmesiyle geldiyse veya temiz sayfa istendiyse taslağı otomatik geri yükleme
        const isTemplateRequested = Boolean(
            location?.state?.isDraftTemplate || 
            location?.state?.currentFormData || 
            location?.state?.restoreDraft
        );

        if (!isTemplateRequested) {
            return;
        }

        const draftStr = sessionStorage.getItem(draftKey);
        if (draftStr) {
            try {
                const draft = JSON.parse(draftStr);
                if (isDraftMeaningful(draft)) {
                    isRestoring.current = true;
                    setStateFn(draft);
                    
                    // State update'in bitmesi için kısa bir timeout veriyoruz
                    setTimeout(() => {
                        isRestoring.current = false;
                    }, 100);
                }
            } catch (e) {
                console.error("Draft yüklenirken hata oluştu", e);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftKey, enabled]);

    // 2. State değiştikçe taslağı kaydet (sadece anlamlı veri girilmişse)
    useEffect(() => {
        if (!enabled || !state || isRestoring.current || isCleared.current) return;
        
        if (isDraftMeaningful(state)) {
            sessionStorage.setItem(draftKey, JSON.stringify(state));
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('document-draft-updated', {
                    detail: { key: draftKey }
                }));
            }
        }
    }, [draftKey, JSON.stringify(state), enabled]);

    // 3. Form başarıyla kaydedildiğinde taslağı sil
    const clearDraft = useCallback(() => {
        isCleared.current = true;
        sessionStorage.removeItem(draftKey);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('document-draft-cleared', {
                detail: { key: draftKey }
            }));
        }
    }, [draftKey]);

    return { clearDraft };
};
