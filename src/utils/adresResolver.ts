/**
 * Webakus UI Core - Akıllı Adres Çözümleyici ve Eşleştirici (adresResolver.ts)
 * 
 * Başlıca Sorumlulukları:
 * - Eski / serbest metinli (legacy) adres kayıtlarını (açık adres, il, ilçe, mahalle vb.) analiz eder.
 * - Adres Yönetimi modülü hiyerarşik veri tabanı (İl -> İlçe -> Köy/Merkez -> Mahalle -> Cadde/Sokak -> Dış Kapı -> İç Kapı)
 *   ile adım adım akıllı eşleştirme ve fuzzy-matching yapar.
 * - Eşleşen adımları otomatik olarak seçili hale getirerek kullanıcıya tam dolu seçim objesi sunar.
 */

import axios from 'axios';

export interface LegacyAddressInput {
  adresIlId?: string | number | null;
  adresIlceId?: string | number | null;
  adresKoyId?: string | number | null;
  adresMahalleId?: string | number | null;
  adresCaddeSokakId?: string | number | null;
  adresDisKapiId?: string | number | null;
  adresIcKapiId?: string | number | null;
  il?: string | null;
  ilAdi?: string | null;
  adresIl?: string | null;
  sehir?: string | null;
  ilce?: string | null;
  ilceAdi?: string | null;
  adresIlce?: string | null;
  mahalle?: string | null;
  mahalleAdi?: string | null;
  adresMahalle?: string | null;
  caddeSokak?: string | null;
  sokak?: string | null;
  cadde?: string | null;
  acikAdres?: string | null;
  adres?: string | null;
  formattedAdres?: string | null;
  adresMetni?: string | null;
  [key: string]: any;
}

export interface ResolvedAddressResult {
  ids: {
    adresIlId: string | number | null;
    adresIlceId: string | number | null;
    adresKoyId: string | number | null;
    adresMahalleId: string | number | null;
    adresCaddeSokakId: string | number | null;
    adresDisKapiId: string | number | null;
    adresIcKapiId: string | number | null;
  };
  selections: Array<{
    levelId: string;
    id: string | number;
    ad: string;
    stateKey: string;
  }>;
  nextLevelIndex: number;
}

/**
 * Türkçe karakter ve noktalama normalizasyonu yaparak büyük harfe dönüştürür.
 */
export const cleanTurkishText = (text: string): string => {
  if (!text) return '';
  return text
    .normalize('NFC')
    .replace(/\u0307/g, '') // Birleşik nokta karakterini (combining dot above) temizle
    .trim()
    .toLocaleUpperCase('tr-TR')
    .replace(/\u0307/g, '')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()\\|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Türkçe karakter varyasyonlarını ve takıları temizleyen kanonik dönüştürücü.
 */
export const canonicalizeTurkishText = (text: string): string => {
  if (!text) return '';
  let str = cleanTurkishText(text);
  str = str
    .replace(/İ/g, 'I')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C');

  // Standart adres takı ve eklerini temizle
  str = str.replace(/\bMAHALLESI\b|\bMAHALLE\b|\bMAH\b/g, '');
  str = str.replace(/\bSOKAGI\b|\bSOKAK\b|\bSOK\b|\bSK\b/g, '');
  str = str.replace(/\bCADDESI\b|\bCADDE\b|\bCAD\b|\bCD\b/g, '');
  str = str.replace(/\bBULVARI\b|\bBULVAR\b|\bBLV\b/g, '');
  str = str.replace(/\bKOYU\b|\bKOY\b/g, '');
  str = str.replace(/\bKAPISI\b|\bKAPI\b/g, '');
  str = str.replace(/\bNUMARASI\b|\bNUMARA\b|\bNO\b/g, '');
  return str.replace(/\s+/g, ' ').trim();
};

/**
 * Veritabanındaki birim adının aranan metin veya tam adres içinde geçip geçmediğini denetler.
 */
export const isAddressMatch = (dbName: string, queryName: string, fullAddressText: string): boolean => {
  const normDb = canonicalizeTurkishText(dbName);
  const normQuery = canonicalizeTurkishText(queryName);
  const normFull = canonicalizeTurkishText(fullAddressText);

  if (!normDb) return false;

  // 1. Doğrudan alan eşleşmesi (örn: il="Kocaeli" -> db="KOCAELİ")
  if (normQuery && (normDb === normQuery || normDb.includes(normQuery) || normQuery.includes(normDb))) {
    return true;
  }

  // 2. Açık adres metni içinde tam kelime eşleşmesi
  if (normFull) {
    if (normFull === normDb || normFull.includes(normDb)) return true;

    const dbWords = normDb.split(' ').filter(w => w.length > 2);
    if (dbWords.length > 0) {
      const allWordsInAddress = dbWords.every(w => {
        const regex = new RegExp(`\\b${w}\\b`, 'i');
        return regex.test(normFull) || normFull.includes(w);
      });
      if (allWordsInAddress) return true;
    }
  }

  return false;
};

/**
 * Eski serbest metinli adresi Adres Yönetimi hiyerarşik servisiyle adım adım eşleştirir.
 */
export async function resolveLegacyAddress(input: LegacyAddressInput): Promise<ResolvedAddressResult> {
  const result: ResolvedAddressResult = {
    ids: {
      adresIlId: input.adresIlId || null,
      adresIlceId: input.adresIlceId || null,
      adresKoyId: input.adresKoyId || null,
      adresMahalleId: input.adresMahalleId || null,
      adresCaddeSokakId: input.adresCaddeSokakId || null,
      adresDisKapiId: input.adresDisKapiId || null,
      adresIcKapiId: input.adresIcKapiId || null
    },
    selections: [],
    nextLevelIndex: 0
  };

  const ilQuery = input.il || input.ilAdi || input.adresIl || input.sehir || '';
  const ilceQuery = input.ilce || input.ilceAdi || input.adresIlce || '';
  const mahalleQuery = input.mahalle || input.mahalleAdi || input.adresMahalle || '';
  const caddeSokakQuery = input.caddeSokak || input.sokak || input.cadde || input.adresCaddeSokak || '';
  const acikAdresText = input.acikAdres || input.adres || input.formattedAdres || input.adresMetni || '';
  
  const fullText = [acikAdresText, ilceQuery, ilQuery].filter(Boolean).join(' ');
  
  if (!fullText.trim() && !ilQuery && !ilceQuery) {
    return result;
  }

  try {
    // 1. İL SEVİYESİ
    const illerRes = await axios.get('/api/AdresYonetimi/Iller');
    const illerList: any[] = illerRes.data || [];
    let selectedIl = illerList.find(il => il.id === result.ids.adresIlId);

    if (!selectedIl && illerList.length > 0) {
      selectedIl = illerList.find(il => isAddressMatch(il.ad, ilQuery, fullText));
    }

    if (!selectedIl) {
      result.nextLevelIndex = 0;
      return result;
    }

    result.ids.adresIlId = selectedIl.id;
    result.selections.push({
      levelId: 'il',
      id: selectedIl.id,
      ad: selectedIl.gorunurAd || selectedIl.ad,
      stateKey: 'adresIlId'
    });
    result.nextLevelIndex = 1;

    // 2. İLÇE SEVİYESİ
    const ilcelerRes = await axios.get(`/api/AdresYonetimi/Ilceler/${selectedIl.id}`);
    const ilcelerList: any[] = ilcelerRes.data || [];
    let selectedIlce = ilcelerList.find(ilce => ilce.id === result.ids.adresIlceId);

    if (!selectedIlce && ilcelerList.length > 0) {
      selectedIlce = ilcelerList.find(ilce => isAddressMatch(ilce.ad, ilceQuery, fullText));
    }

    if (!selectedIlce) {
      return result;
    }

    result.ids.adresIlceId = selectedIlce.id;
    result.selections.push({
      levelId: 'ilce',
      id: selectedIlce.id,
      ad: selectedIlce.gorunurAd || selectedIlce.ad,
      stateKey: 'adresIlceId'
    });
    result.nextLevelIndex = 2;

    // 3. KÖY / MERKEZ SEVİYESİ
    const koylerRes = await axios.get(`/api/AdresYonetimi/Koyler/${selectedIlce.id}`);
    const koylerList: any[] = koylerRes.data || [];
    let selectedKoy = koylerList.find(k => k.id === result.ids.adresKoyId);

    if (!selectedKoy && koylerList.length > 0) {
      if (koylerList.length === 1) {
        selectedKoy = koylerList[0];
      } else {
        selectedKoy = koylerList.find(k => canonicalizeTurkishText(k.ad) === 'MERKEZ') ||
                      koylerList.find(k => isAddressMatch(k.ad, '', fullText)) ||
                      koylerList[0];
      }
    }

    if (!selectedKoy) {
      return result;
    }

    result.ids.adresKoyId = selectedKoy.id;
    result.selections.push({
      levelId: 'koy',
      id: selectedKoy.id,
      ad: selectedKoy.gorunurAd || selectedKoy.ad,
      stateKey: 'adresKoyId'
    });
    result.nextLevelIndex = 3;

    // 4. MAHALLE SEVİYESİ
    const mahallelerRes = await axios.get(`/api/AdresYonetimi/Mahalleler/${selectedKoy.id}`);
    const mahallelerList: any[] = mahallelerRes.data || [];
    let selectedMahalle = mahallelerList.find(m => m.id === result.ids.adresMahalleId);

    if (!selectedMahalle && mahallelerList.length > 0) {
      selectedMahalle = mahallelerList.find(m => isAddressMatch(m.ad, mahalleQuery, fullText));
    }

    if (!selectedMahalle) {
      return result;
    }

    result.ids.adresMahalleId = selectedMahalle.id;
    result.selections.push({
      levelId: 'mahalle',
      id: selectedMahalle.id,
      ad: selectedMahalle.gorunurAd || selectedMahalle.ad,
      stateKey: 'adresMahalleId'
    });
    result.nextLevelIndex = 4;

    // 5. CADDE / SOKAK SEVİYESİ
    const caddeRes = await axios.get(`/api/AdresYonetimi/CaddeSokaklar/${selectedMahalle.id}`);
    const caddeList: any[] = caddeRes.data || [];
    let selectedCadde = caddeList.find(c => c.id === result.ids.adresCaddeSokakId);

    if (!selectedCadde && caddeList.length > 0) {
      selectedCadde = caddeList.find(c => isAddressMatch(c.ad, caddeSokakQuery, fullText));
    }

    if (!selectedCadde) {
      return result;
    }

    result.ids.adresCaddeSokakId = selectedCadde.id;
    result.selections.push({
      levelId: 'cadde',
      id: selectedCadde.id,
      ad: selectedCadde.gorunurAd || selectedCadde.ad,
      stateKey: 'adresCaddeSokakId'
    });
    result.nextLevelIndex = 5;

    // 6. DIŞ KAPI NO SEVİYESİ
    const disKapiRes = await axios.get(`/api/AdresYonetimi/DisKapilar/${selectedCadde.id}`);
    const disKapiList: any[] = disKapiRes.data || [];
    let selectedDisKapi = disKapiList.find(d => d.id === result.ids.adresDisKapiId);

    if (!selectedDisKapi && disKapiList.length > 0) {
      const match = fullText.match(/(?:NO|NUMARA|KAPI)\s*[:.]?\s*(\d+[\w-]*)/i);
      const disKapiNo = match ? match[1] : '';
      if (disKapiNo) {
        selectedDisKapi = disKapiList.find(d => canonicalizeTurkishText(d.ad) === canonicalizeTurkishText(disKapiNo));
      }
    }

    if (!selectedDisKapi) {
      return result;
    }

    result.ids.adresDisKapiId = selectedDisKapi.id;
    result.selections.push({
      levelId: 'disKapi',
      id: selectedDisKapi.id,
      ad: selectedDisKapi.gorunurAd || selectedDisKapi.ad,
      stateKey: 'adresDisKapiId'
    });
    result.nextLevelIndex = 6;

    // 7. İÇ KAPI NO SEVİYESİ
    const icKapiRes = await axios.get(`/api/AdresYonetimi/IcKapilar/${selectedDisKapi.id}`);
    const icKapiList: any[] = icKapiRes.data || [];
    let selectedIcKapi = icKapiList.find(i => i.id === result.ids.adresIcKapiId);

    if (!selectedIcKapi && icKapiList.length > 0) {
      const match = fullText.match(/(?:DAİRE|DAIRE|D|İÇ KAPI|IC KAPI|KAT)\s*[:.]?\s*(\d+[\w-]*)/i);
      const icKapiNo = match ? match[1] : '';
      if (icKapiNo) {
        selectedIcKapi = icKapiList.find(i => canonicalizeTurkishText(i.ad) === canonicalizeTurkishText(icKapiNo));
      }
    }

    if (selectedIcKapi) {
      result.ids.adresIcKapiId = selectedIcKapi.id;
      result.selections.push({
        levelId: 'icKapi',
        id: selectedIcKapi.id,
        ad: selectedIcKapi.gorunurAd || selectedIcKapi.ad,
        stateKey: 'adresIcKapiId'
      });
      result.nextLevelIndex = 7;
    }

    return result;
  } catch (err) {
    console.warn('[resolveLegacyAddress] Adres çözümlenirken hata oluştu:', err);
    return result;
  }
}

export default resolveLegacyAddress;
