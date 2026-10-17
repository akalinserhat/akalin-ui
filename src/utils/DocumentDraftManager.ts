/**
 * @file DocumentDraftManager.ts
 * @description
 * Merkezi Belge Taslak ve Şablon Yöneticisi.
 * Belge formlarında (Fiyat Listesi, Fatura, Sipariş, Kasa/Banka fişleri vb.)
 * kullanıcının henüz kaydetmediği verileri tarayıcının `sessionStorage` alanında
 * şablon olarak saklar, liste sayfalarında en üstte "Şablon" etiketi ile gösterilmesini sağlar
 * ve "Ekle" dendiğinde temiz form açılmasını garanti eder.
 */

export interface DocumentDraftPayload {
    baseRoute?: string;
    documentType?: string;
    formData?: any;
    [key: string]: any;
}

/**
 * Belge türü veya temel rota bilgisine göre standart sessionStorage anahtarını üretir.
 */
export const getDraftKey = (baseRoute?: string, documentType?: string): string => {
    if (baseRoute) {
        const clean = baseRoute.replace(/^\/+|\/+$/g, '').replace(/\//g, '_').toLowerCase();
        return `akalin_draft_${clean}`;
    }
    if (documentType) {
        return `akalin_draft_${documentType.toLowerCase()}`;
    }
    return 'akalin_document_draft';
};

/**
 * Geriye dönük uyumluluk (legacy keys) için aranabilecek tüm olası anahtarları döner.
 */
export const getAllPossibleKeys = (baseRoute?: string, documentType?: string): string[] => {
    const keys: string[] = [];

    const primaryKey = getDraftKey(baseRoute, documentType);
    keys.push(primaryKey);

    if (baseRoute) {
        const clean = baseRoute.replace(/^\/+|\/+$/g, '').replace(/\//g, '_').toLowerCase();
        keys.push(`akalin_draft_${clean}`);
        keys.push(`draft_${clean}`);
        keys.push(`akalin_${clean}_draft`);

        if (clean.includes('fiyat')) {
            keys.push('akalin_fiyatlistesi_draft');
            keys.push('draft_fiyatlistesi');
        }
        if (clean.includes('siparis')) {
            keys.push('draft_siparis_satis');
            keys.push('draft_siparis_alis');
            keys.push('akalin_siparis_draft');
        }
        if (clean.includes('fatura')) {
            keys.push('draft_fatura_satis');
            keys.push('draft_fatura_alis');
            keys.push('akalin_fatura_draft');
        }
        if (clean.includes('cari')) {
            keys.push('akalin_cari_form_draft');
            keys.push('draft_cari');
        }
        if (clean.includes('urun')) {
            keys.push('draft_urunvehizmet');
        }
    }

    if (documentType) {
        const docLower = documentType.toLowerCase();
        keys.push(`akalin_draft_${docLower}`);
        keys.push(`akalin_${docLower}_draft`);
        keys.push(`draft_${docLower}`);
    }

    return Array.from(new Set(keys));
};

/**
 * Bir satır / kalem verisinin gerçekten ürün, miktar, tutar veya açıklama içerip içermediğini kontrol eder.
 * Izgaranın açılışta oluşturduğu boş satırları ({ urunId: null, fiyat: 0, vb. }) taslak saymaz.
 */
export const isItemRowMeaningful = (row: any): boolean => {
    if (!row || typeof row !== 'object') return false;

    // Ürün veya hizmet seçilmiş mi?
    const entityIds = [
        row.urunVeHizmetKartiId, row.urunId, row.hizmetId, row.stokId,
        row.tedarikciUrunKodu, row.urunKodu, row.barkod
    ];
    for (const id of entityIds) {
        if (id !== null && id !== undefined && String(id).trim() !== '') {
            return true;
        }
    }

    // Kullanıcı ürün/hizmet adı veya satır açıklaması yazmış mı?
    const textVals = [row.urunVeHizmetAdi, row.urunAdi, row.ad, row.aciklama, row.notlar];
    for (const text of textVals) {
        if (typeof text === 'string' && text.trim().length > 0) {
            return true;
        }
    }

    // Kullanıcı miktar veya fiyat/tutar girmiş mi? (varsayılan 0 veya boş değilse)
    const numVals = [row.fiyat, row.tutar, row.birimFiyat, row.miktar];
    for (const num of numVals) {
        const n = Number(num);
        if (!isNaN(n) && n > 0) {
            return true;
        }
    }

    // Valör tarihi veya özel bir tarih girilmiş mi?
    if (row.valorTarihi && String(row.valorTarihi).trim() !== '') {
        return true;
    }

    return false;
};

/**
 * Bir taslak verisinin gerçekten kullanıcı tarafından girilmiş anlamlı bir veri içerip içermediğini denetler.
 * Varsayılan boş form objelerini (örn: sadece { belgeNo: '[OTOMATİK]' }) veya boş satırları taslak olarak kabul etmez.
 */
export const isDraftMeaningful = (draft: any): boolean => {
    if (!draft || typeof draft !== 'object') return false;

    const data = draft.formData || draft;
    if (!data || typeof data !== 'object') return false;

    // 1. Kalemler / satırlar dizisinde en az bir anlamlı satır var mı?
    const listFields = ['kalemler', 'items', 'satirlar', 'detaylar', 'barkodlar', 'hareketler'];
    for (const field of listFields) {
        const arr = data[field];
        if (Array.isArray(arr) && arr.some(isItemRowMeaningful)) {
            return true;
        }
    }

    // 2. Anlamlı yabancı anahtarlar / ilişkiler seçilmiş mi?
    const relationFields = [
        'cariId', 'cariUnvani', 'cariKodu', 'unvan',
        'fiyatListesiTanimiId', 'kasaId', 'bankaId', 'depoId',
        'hedefKasaId', 'hedefBankaId', 'girisDepoId', 'cikisDepoId',
        'subeId', 'personelId', 'projeId'
    ];
    for (const field of relationFields) {
        const val = data[field];
        if (val !== null && val !== undefined && val !== '' && val !== 0) {
            return true;
        }
    }

    // 3. Kullanıcı metin alanlarına bir şey yazmış mı?
    const ignoredStrings = ['[OTOMATİK]', '[OTOMATIK]', '', 'TRY', 'TL'];
    const textFields = ['aciklama', 'notlar', 'aciklamalar', 'adres', 'ad', 'soyad', 'telefon', 'email', 'bitisTarihi'];
    for (const field of textFields) {
        const val = data[field];
        if (typeof val === 'string' && val.trim().length > 0 && !ignoredStrings.includes(val.trim())) {
            return true;
        }
    }

    // 4. Kullanıcı özel bir anahtar/seçim (toggle) işaretlemiş mi?
    const toggleFields = ['kampanyaMi', 'eFaturaMi', 'tevkifatliMi', 'istisnaMi'];
    for (const field of toggleFields) {
        if (data[field] === true) {
            return true;
        }
    }

    return false;
};

/**
 * Belge türü veya rotası için kayıtlı anlamlı bir taslak varsa döner, yoksa null döner.
 */
export const getDocumentDraft = (baseRoute?: string, documentType?: string): any | null => {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;

    try {
        const keys = getAllPossibleKeys(baseRoute, documentType);
        for (const key of keys) {
            const raw = sessionStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (isDraftMeaningful(parsed)) {
                    return parsed;
                }
            }
        }
    } catch (e) {
        console.error('DocumentDraftManager: Draft okunurken hata oluştu:', e);
    }

    return null;
};

/**
 * Belge taslağını sessionStorage'a kaydeder ve 'document-draft-updated' olayını tetikler.
 */
export const saveDocumentDraft = (baseRoute?: string, documentType?: string, data?: any): void => {
    if (typeof window === 'undefined' || !window.sessionStorage || !data) return;

    try {
        if (!isDraftMeaningful(data)) {
            // Veri anlamlı değilse (kullanıcı henüz hiçbir şey girmediyse veya sildiyse)
            // eski taslağı temizle!
            clearDocumentDraft(baseRoute, documentType);
            return;
        }

        const key = getDraftKey(baseRoute, documentType);
        sessionStorage.setItem(key, JSON.stringify(data));

        window.dispatchEvent(new CustomEvent('document-draft-updated', {
            detail: { baseRoute, documentType, key }
        }));
    } catch (e) {
        console.error('DocumentDraftManager: Draft kaydedilirken hata oluştu:', e);
    }
};

/**
 * İlgili belgeye ait tüm olası taslak kayıtlarını temizler ve 'document-draft-cleared' olayını tetikler.
 */
export const clearDocumentDraft = (baseRoute?: string, documentType?: string): void => {
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    try {
        const keys = getAllPossibleKeys(baseRoute, documentType);
        for (const key of keys) {
            sessionStorage.removeItem(key);
        }

        window.dispatchEvent(new CustomEvent('document-draft-cleared', {
            detail: { baseRoute, documentType }
        }));
    } catch (e) {
        console.error('DocumentDraftManager: Draft temizlenirken hata oluştu:', e);
    }
};

/**
 * Form verilerini dirty kontrolü için normalize eder.
 * Anlamsız boş satırları, sistem UUID'lerini ve otomatik anahtarları eler.
 */
export const normalizeFormDataForComparison = (formData: any, documentId?: number | string): string => {
    if (!formData || typeof formData !== 'object') return '';

    // Yeni belge modunda (!documentId), eğer formda anlamlı hiçbir kullanıcı girdisi yoksa
    // form kesinlikle temizdir.
    if (!documentId && !isDraftMeaningful(formData)) {
        return '__CLEAN_NEW_DOCUMENT__';
    }

    const {
        belgeGuid,
        _gridId,
        _isDraftTemplate,
        _draftData,
        tempId,
        id: entityId,
        createdAt,
        updatedAt,
        silindiMi,
        ...rest
    } = formData;

    const normalizedRest: any = { ...rest };
    const listFields = ['kalemler', 'items', 'satirlar', 'detaylar', 'barkodlar', 'hareketler'];

    for (const field of listFields) {
        if (Array.isArray(normalizedRest[field])) {
            normalizedRest[field] = normalizedRest[field]
                .filter(isItemRowMeaningful)
                .map((row: any) => {
                    const { id: rowId, _key, _index, _rowKey, ...rowRest } = row;
                    return rowRest;
                });
        }
    }

    return JSON.stringify(normalizedRest);
};

export const DocumentDraftManager = {
    getDraftKey,
    getAllPossibleKeys,
    isItemRowMeaningful,
    isDraftMeaningful,
    normalizeFormDataForComparison,
    getDocumentDraft,
    saveDocumentDraft,
    clearDocumentDraft
};

export default DocumentDraftManager;

