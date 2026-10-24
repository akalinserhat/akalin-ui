/**
 * Webakus UI Core - Merkezi Adres Seçici Formu (AdresSeciciForm)
 * İl, İlçe, Köy, Mahalle, Cadde/Sokak, Dış Kapı ve İç Kapı hiyerarşik adımlarını
 * BaseCardPage yapısı üzerinde kullanıcıya sunan ve seçim sonucunda resmi formatta
 * açık adres ile ilgili id parametrelerini döndüren merkezi bileşendir.
 * 
 * Başlıca Görevleri:
 * - 7 Seviyeli hiyerarşik adres seçimi (İl -> İlçe -> Köy -> Mahalle -> Cadde/Sokak -> Dış Kapı -> İç Kapı)
 * - Klavye kısayolları ve anlık filtreleme ile hızlı arama
 * - API üzerinden anlık eşitleme ve adres formatlayıcı entegrasyonu
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, MapPin, Search, Check, ArrowRight, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { formatAdres } from '../../utils/adresFormatter';
import { resolveLegacyAddress } from '../../utils/adresResolver';
import { BaseCardPage } from '@akalin/ui';
import { BaseCardPageHeader, BaseCardPageHeaderProps, CancelButton, useHeaderApi } from '@akalin/ui';
import { useTranslation } from 'react-i18next';

export interface SelectionItem {
  levelId: string;
  id: string | number;
  ad: string;
  stateKey: string;
}

export interface AdresSeciciFormResult {
  ids: {
    adresIlId: string | number | null;
    adresIlceId: string | number | null;
    adresKoyId: string | number | null;
    adresMahalleId: string | number | null;
    adresCaddeSokakId: string | number | null;
    adresDisKapiId: string | number | null;
    adresIcKapiId: string | number | null;
    [key: string]: any;
  };
  formattedAdres: string;
  parts: {
    il: string;
    ilce: string;
    koy: string;
    mahalle: string;
    cadde: string;
    disKapi: string;
    icKapi: string;
  };
}

export type AdresSeciciModalResult = AdresSeciciFormResult;

export interface AdresSeciciFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AdresSeciciFormResult) => void;
  initialData?: any;
  inModal?: boolean;
  headerProps?: Partial<BaseCardPageHeaderProps>;
  title?: string;
  subtitle?: React.ReactNode;
}

export type AdresSeciciModalProps = AdresSeciciFormProps;

const LEVELS = [
  { id: 'il', titleKey: 'auto_il_secin_d1a2', defaultTitle: 'İl Seçin', endpoint: 'Iller', parentParam: null, stateKey: 'adresIlId' },
  { id: 'ilce', titleKey: 'auto_ilce_secin_d2a3', defaultTitle: 'İlçe Seçin', endpoint: 'Ilceler', parentParam: 'ilId', stateKey: 'adresIlceId' },
  { id: 'koy', titleKey: 'auto_koy_secin_d3a4', defaultTitle: 'Köy Seçin', endpoint: 'Koyler', parentParam: 'ilceId', stateKey: 'adresKoyId' },
  { id: 'mahalle', titleKey: 'auto_mahalle_secin_d4a5', defaultTitle: 'Mahalle Seçin', endpoint: 'Mahalleler', parentParam: 'koyId', stateKey: 'adresMahalleId' },
  { id: 'cadde', titleKey: 'auto_cadde_sokak_secin_d5a6', defaultTitle: 'Cadde / Sokak Seçin', endpoint: 'CaddeSokaklar', parentParam: 'mahalleId', stateKey: 'adresCaddeSokakId' },
  { id: 'disKapi', titleKey: 'auto_dis_kapi_secin_d6a7', defaultTitle: 'Dış Kapı No Seçin', endpoint: 'DisKapilar', parentParam: 'caddeSokakId', stateKey: 'adresDisKapiId' },
  { id: 'icKapi', titleKey: 'auto_ic_kapi_secin_d7a8', defaultTitle: 'İç Kapı No Seçin', endpoint: 'IcKapilar', parentParam: 'disKapiId', stateKey: 'adresIcKapiId' }
];

const AdresSeciciForm: React.FC<AdresSeciciFormProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  headerProps,
  title,
  subtitle,
  inModal = true 
}) => {
  const { t } = useTranslation();
  const { setHeaderBreadcrumbOptions } = useHeaderApi() || {};
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [selections, setSelections] = useState<SelectionItem[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inModal && setHeaderBreadcrumbOptions) {
      setHeaderBreadcrumbOptions({ hideBreadcrumb: true });
    }
  }, [inModal, setHeaderBreadcrumbOptions]);

  const filteredItems = items.filter(item =>
    (item.gorunurAd || item.ad).toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'))
  );

  const currentLevel = LEVELS[currentLevelIndex];
  const parentSelection = currentLevelIndex > 0 ? selections[currentLevelIndex - 1] : null;

  const translate = (key: string, fallback: string) => {
    if (!t) return fallback;
    const val = t(key);
    return val && val !== key ? val : fallback;
  };

  const getStepTitle = (level: typeof LEVELS[number]) => {
    const fullTitle = translate(level.titleKey, level.defaultTitle);
    return fullTitle.replace(/ Seçin| Select/gi, '').trim();
  };


  const loadInitialData = async () => {
    setLoading(true);
    try {
      let resolvedData = initialData;
      if (initialData && initialData.genelAdresId && !initialData.adresIlId) {
        try {
          const res = await axios.get(`/api/AdresYonetimi/GenelAdres/${initialData.genelAdresId}`);
          if (res.data) {
            resolvedData = {
              ...initialData,
              adresIlId: res.data.ilId,
              adresIlceId: res.data.ilceId,
              adresKoyId: res.data.koyId,
              adresMahalleId: res.data.mahalleId,
              adresCaddeSokakId: res.data.caddeSokakId,
              adresDisKapiId: res.data.disKapiId,
              adresIcKapiId: res.data.icKapiId
            };
          }
        } catch (err) {
          console.error('GenelAdres detayları alınamadı:', err);
        }
      }

      let currentSelections: SelectionItem[] = [];
      let parentSel: SelectionItem | null = null;
      let nextLevelIndexToFetch = 0;

      // Eğer doğrudan adresIlId yoksa veya boşsa, serbest metinli adresi akıllı çözümle
      if (!resolvedData.adresIlId && (resolvedData.acikAdres || resolvedData.adres || resolvedData.il || resolvedData.ilce)) {
        try {
          const autoMatched = await resolveLegacyAddress(resolvedData);
          if (autoMatched.selections.length > 0) {
            setSelections(autoMatched.selections);
            const targetLevelIdx = Math.min(autoMatched.nextLevelIndex, LEVELS.length - 1);
            setCurrentLevelIndex(targetLevelIdx);
            
            const parentItem = autoMatched.selections[autoMatched.selections.length - 1] || null;
            if (targetLevelIdx < LEVELS.length) {
              fetchItems(targetLevelIdx, parentItem);
            } else {
              setItems([]);
              setLoading(false);
            }
            toast.success(translate('auto_adres_otomatik_cozuldu_82df', 'Mevcut adres metninden otomatik seçimler yapıldı.'));
            return;
          }
        } catch (err) {
          console.warn('Otomatik adres eşleştirme başarısız:', err);
        }
      }

      for (let i = 0; i < LEVELS.length; i++) {
        const level = LEVELS[i];
        const selectedId = resolvedData[level.stateKey];
        if (!selectedId) {
          nextLevelIndexToFetch = i;
          break;
        }

        const url = level.parentParam
          ? `/api/AdresYonetimi/${level.endpoint}/${parentSel?.id}`
          : `/api/AdresYonetimi/${level.endpoint}`;

        const res = await axios.get(url);
        const itemsList = res.data;
        const selectedItem = itemsList.find((item: any) => item.id === selectedId);

        if (selectedItem) {
          const newSel: SelectionItem = {
            levelId: level.id,
            id: selectedItem.id,
            ad: selectedItem.gorunurAd || selectedItem.ad,
            stateKey: level.stateKey
          };
          currentSelections.push(newSel);
          parentSel = newSel;
          nextLevelIndexToFetch = i + 1;
        } else {
          nextLevelIndexToFetch = i;
          break;
        }
      }

      setSelections(currentSelections);
      setCurrentLevelIndex(nextLevelIndexToFetch);

      if (nextLevelIndexToFetch < LEVELS.length) {
        fetchItems(nextLevelIndexToFetch, parentSel);
      } else {
        setItems([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Kayıtlı adres yüklenirken hata oluştu:', error);
      setCurrentLevelIndex(0);
      setSelections([]);
      fetchItems(0, null);
    }
  };

  const handleSync = async () => {
    if (currentLevelIndex === 0) {
      toast.error(translate('auto_iller_seviyesinde_esitleme_e21b', 'İller seviyesinde eşitleme yapılamaz.'));
      return;
    }
    const level = currentLevel;
    const pSelection = parentSelection;
    if (!pSelection) return;

    setSyncing(true);
    const levelTitle = translate(level.titleKey, level.defaultTitle);
    const loadingMsg = `${levelTitle} ${translate('auto_api_guncelleniyor_f12a', "API'den güncelleniyor...")}`;
    const loadingToast = toast.loading(loadingMsg);
    try {
      const syncEndpoint = `/api/AdresYonetimi/Sync${level.endpoint}/${pSelection.id}`;
      const res = await axios.post(syncEndpoint);

      const { added, updated, deleted } = res.data;

      if (added === 0 && updated === 0 && deleted === 0) {
        toast.success(
          translate('auto_esitleme_bos_yanit_34da', 'İşlem tamamlandı ancak API\'de bu kayda ait yeni bir alt veri bulunamadı.'),
          { id: loadingToast, duration: 4000 }
        );
      } else {
        const syncSuccessMsg = translate(
          'auto_esitleme_tamamlandi_98cb',
          `Eşitleme tamamlandı. ${added} eklendi, ${updated} güncellendi, ${deleted} silindi.`
        ).replace('{{added}}', added).replace('{{updated}}', updated).replace('{{deleted}}', deleted);

        toast.success(syncSuccessMsg, { id: loadingToast, duration: 4000 });
      }

      fetchItems(currentLevelIndex, pSelection);
    } catch (error) {
      console.error('API Eşitleme Hatası:', error);
      toast.error(translate('auto_esitleme_hata_56fa', "Adresler API'den eşitlenirken bir hata oluştu."), {
        id: loadingToast,
        duration: 4000
      });
    } finally {
      setSyncing(false);
    }
  };

  const initialDataKey = JSON.stringify(initialData || {});

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      const hasAnyData = initialData && (
        initialData.adresIlId || 
        initialData.genelAdresId || 
        initialData.il || 
        initialData.ilce || 
        initialData.ilAdi ||
        initialData.ilceAdi ||
        initialData.adresIl ||
        initialData.adresIlce ||
        initialData.acikAdres || 
        initialData.adres ||
        initialData.formattedAdres ||
        initialData.adresMetni
      );

      if (hasAnyData) {
        loadInitialData();
      } else {
        setCurrentLevelIndex(0);
        setSelections([]);
        fetchItems(0, null);
      }
    }
  }, [isOpen, initialDataKey]);

  const fetchItems = async (levelIndex: number, pSelection: SelectionItem | null, baseSelections?: SelectionItem[]) => {
    if (levelIndex >= LEVELS.length) {
      setItems([]);
      setLoading(false);
      return;
    }

    const level = LEVELS[levelIndex];
    if (!level) return;

    setLoading(true);
    setItems([]);
    try {
      const url = level.parentParam
        ? `/api/AdresYonetimi/${level.endpoint}/${pSelection?.id}`
        : `/api/AdresYonetimi/${level.endpoint}`;

      const res = await axios.get(url);
      const fetched: any[] = res.data || [];

      // EĞER TEK SEÇENEK VARSA DOĞRUDAN SEÇ VE BİR SONRAKİ BASAMAĞA GEÇ
      if (fetched.length === 1) {
        const singleItem = fetched[0];
        const newSel: SelectionItem = {
          levelId: level.id,
          id: singleItem.id,
          ad: singleItem.gorunurAd || singleItem.ad,
          stateKey: level.stateKey
        };

        const currentActiveSels = baseSelections || selections;
        const updatedSelections = [...currentActiveSels.slice(0, levelIndex), newSel];
        setSelections(updatedSelections);
        setSearchTerm('');

        if (levelIndex < LEVELS.length - 1) {
          const nextIndex = levelIndex + 1;
          setCurrentLevelIndex(nextIndex);
          await fetchItems(nextIndex, newSel, updatedSelections);
        } else {
          setCurrentLevelIndex(LEVELS.length);
          setItems([]);
          setLoading(false);
        }
        return;
      }

      setItems(fetched);
      setCurrentLevelIndex(levelIndex);
    } catch (error) {
      console.error('Adres verileri alınamadı', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Arama filtresi sonucunda tek bir seçenek kaldığında otomatik seç
  useEffect(() => {
    if (!loading && isOpen && searchTerm.trim().length > 0 && filteredItems.length === 1) {
      const timer = setTimeout(() => {
        handleItemClick(filteredItems[0]);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, filteredItems, loading, isOpen]);

  // Arama inputuna otomatik odaklan
  useEffect(() => {
    if (!loading && isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [loading, isOpen, currentLevelIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || syncing || loading) return;

      const filtered = items.filter(item =>
        (item.gorunurAd || item.ad).toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'))
      );

      if (filtered.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filtered.length) {
          handleItemClick(filtered[focusedIndex]);
        } else if (filtered.length === 1) {
          handleItemClick(filtered[0]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, loading, isOpen, syncing, focusedIndex, searchTerm, currentLevelIndex, selections]);

  // Reset focus when search or items change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchTerm, items]);

  const handleItemClick = (item: any) => {
    const activeLevel = LEVELS[currentLevelIndex];
    if (!activeLevel || !item) return;

    const newSelection: SelectionItem = {
      levelId: activeLevel.id,
      id: item.id,
      ad: item.gorunurAd || item.ad,
      stateKey: activeLevel.stateKey
    };

    const updatedSelections = [...selections.slice(0, currentLevelIndex), newSelection];
    setSelections(updatedSelections);
    setSearchTerm('');

    if (currentLevelIndex < LEVELS.length - 1) {
      const nextIndex = currentLevelIndex + 1;
      setCurrentLevelIndex(nextIndex);
      fetchItems(nextIndex, newSelection, updatedSelections);
    } else {
      setCurrentLevelIndex(LEVELS.length);
      setItems([]);
    }
  };

  const navigateToLevel = (index: number) => {
    if (index <= selections.length) {
      setCurrentLevelIndex(index);
      const newSels = selections.slice(0, index);
      setSelections(newSels);
      setSearchTerm('');
      const pSelection = index > 0 ? newSels[index - 1] : null;
      fetchItems(index, pSelection, newSels);
    }
  };

  const handleSave = () => {
    const ids: Record<string, string | number | null> = {
      adresIlId: null,
      adresIlceId: null,
      adresKoyId: null,
      adresMahalleId: null,
      adresCaddeSokakId: null,
      adresDisKapiId: null,
      adresIcKapiId: null,
    };

    selections.forEach(sel => {
      ids[sel.stateKey] = sel.id;
    });

    const getAd = (lvl: string) => selections.find(s => s.levelId === lvl)?.ad || '';

    const il = getAd('il');
    const ilce = getAd('ilce');
    const koy = getAd('koy');
    const mahalle = getAd('mahalle');
    const cadde = getAd('cadde');
    const disKapi = getAd('disKapi');
    const icKapi = getAd('icKapi');

    const parts: string[] = [];
    if (koy && !koy.toLocaleLowerCase('tr-TR').includes('merkez köy')) parts.push(koy);
    if (mahalle && mahalle.toLocaleLowerCase('tr-TR') !== 'merkez mahallesi' && mahalle.toLocaleLowerCase('tr-TR') !== 'merkez') parts.push(mahalle);
    if (cadde) parts.push(cadde);
    if (disKapi) parts.push(`No: ${disKapi}`);
    if (icKapi && !icKapi.toLocaleLowerCase('tr-TR').includes('yok')) parts.push(`İç Kapı: ${icKapi}`);

    const streetPart = parts.join(' ').trim();
    const formattedAdres = formatAdres({ ilAdi: il, ilceAdi: ilce, acikAdres: streetPart });

    onSave({
      ids: ids as any,
      formattedAdres,
      parts: { il, ilce, koy, mahalle, cadde, disKapi, icKapi }
    });
    if (inModal && onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const baseCardPageElement = (
    <BaseCardPage
      inModal={inModal}
      overlayClassName="adres-secici-overlay"
      id="adresSeciciCardPage"
      title={title || translate('auto_merkezi_adres_secimi_ecb5', 'Merkezi Adres Seçimi')}
      icon={<MapPin size={20} />}
      subtitle={subtitle}
      hideBreadcrumb={true}
      breadcrumb={null}
      headerProps={headerProps}
      onClose={onClose}
      onSave={selections.length > 0 ? handleSave : undefined}
      hideSaveButton={true}
      isSaving={syncing}
      asForm={false}
      showBackButton={true}
    >
        <div className="adres-secici-container">
          {/* Left Sidebar - Vertical Stepper */}
          <div className="adres-secici-sidebar">
            <h4 className="adres-secici-sidebar-title">
              {translate('auto_adres_adimlari_41d3', 'Adres Adımları')}
            </h4>
            <div className="adres-secici-timeline">
              <div className="adres-secici-timeline-line" />
              {LEVELS.map((level, idx) => {
                const isCompleted = idx < currentLevelIndex;
                const isActive = idx === currentLevelIndex;
                const isPending = idx > currentLevelIndex;
                const selection = isCompleted ? selections[idx] : null;

                return (
                  <div key={level.id} className="adres-secici-step">
                    <div className="adres-secici-step-badge-wrap">
                      <div
                        className={`adres-secici-step-badge ${
                          isCompleted ? 'completed' : isActive ? 'active' : 'pending'
                        }`}
                      >
                        {isCompleted ? <Check size={14} strokeWidth={3} /> : idx + 1}
                      </div>
                    </div>
                    <div className="adres-secici-step-content">
                      <div
                        onClick={() => {
                          if (isCompleted) navigateToLevel(idx);
                        }}
                        className={`adres-secici-step-title ${
                          isActive ? 'active' : isCompleted ? 'completed' : 'pending'
                        }`}
                      >
                        {getStepTitle(level)}
                      </div>
                      {isCompleted && selection && (
                        <div className="adres-secici-step-tag">
                          {selection.ad}
                        </div>
                      )}
                      {isActive && (
                        <div className="adres-secici-step-status">
                          {translate('auto_secim_bekleniyor_1e58', 'Seçim bekleniyor...')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="adres-secici-main">
            {/* Header / Search */}
            <div className="adres-secici-header">
              <div className="flex-row items-center justify-between gap-12 flex-wrap">
                <div className="flex-col gap-4">
                  <h4 className="adres-secici-title">
                    {currentLevel
                      ? translate(currentLevel.titleKey, currentLevel.defaultTitle)
                      : translate('auto_tum_adimlar_tamamlan_60cc', 'Tüm Adımlar Tamamlandı')}
                  </h4>
                  {selections.length > 0 && (
                    <div className="flex-row items-center gap-8 text-13 text-secondary flex-wrap">
                      <span className="badge badge-subtle-primary text-12 font-semibold">
                        {selections.length} / {LEVELS.length} {translate('auto_adim_tamamlandi_b606', 'adım tamamlandı.')}
                      </span>
                      <span className="text-secondary opacity-60">|</span>
                      <span className="font-medium text-primary">
                        {selections.map(s => s.ad).join(' / ')}
                      </span>
                    </div>
                  )}
                </div>

                {currentLevel && currentLevelIndex > 0 && (
                  <button
                    type="button"
                    className="adres-secici-sync-icon-btn"
                    onClick={handleSync}
                    disabled={syncing || loading}
                    title={translate('auto_api_guncelle_title_8a91', "API'den Güncelle")}
                  >
                    <RefreshCw size={16} className={syncing ? 'spinning' : ''} />
                  </button>
                )}
              </div>

              {currentLevel && (
                <div className="adres-secici-search-wrap">
                  <Search size={18} strokeWidth={2.5} className="adres-secici-search-icon" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={`${getStepTitle(currentLevel)} ${translate('auto_ara_898f', 'ara...')}`}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="adres-secici-search-input"
                  />
                </div>
              )}
            </div>

            {/* List */}
            <div className="adres-secici-list">
              {loading ? (
                <div className="flex-col items-center justify-center h-full text-accent-primary gap-16">
                  <div className="spinner-loading" />
                  <span className="text-15 font-semibold">
                    {translate('auto_veriler_yukleniyor_67b7', 'Veriler Yükleniyor...')}
                  </span>
                </div>
              ) : !currentLevel ? (
                <div className="adres-secici-completed-view">
                  <div className="adres-secici-completed-icon">
                    <Check size={40} strokeWidth={2.5} />
                  </div>
                  <div className="text-center">
                    <h3 className="m-0 mb-8 text-22 font-bold">
                      {translate('auto_tum_adimlar_tamamlan_60cc', 'Tüm Adımlar Tamamlandı')}
                    </h3>
                    <p className="m-0 text-secondary text-15">
                      {translate(
                        'auto_adresi_kaydetmek_ici_81d7',
                        'Adresi kaydetmek için alttaki "Seçimi Tamamla" butonunu kullanabilirsiniz.'
                      )}
                    </p>
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="adres-secici-empty-view">
                  <div className="adres-secici-empty-icon">
                    <Search size={40} strokeWidth={1.5} opacity={0.5} />
                  </div>
                  <span className="text-15 font-500">
                    {translate('auto_kayit_bulunamadi_3696', 'Kayıt bulunamadı')}
                  </span>
                </div>
              ) : (
                <div className="adres-secici-grid">
                  {filteredItems.map((item, index) => {
                    const isFocused = focusedIndex === index;
                    const isSelected = selections[currentLevelIndex]?.id === item.id;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`adres-secici-card ${isSelected ? 'is-selected' : ''} ${isFocused ? 'is-focused' : ''}`}
                      >
                        <span className="adres-secici-card-text">{item.gorunurAd || item.ad}</span>
                        <ChevronRight size={16} strokeWidth={isSelected ? 3 : 2} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom bar summary and action buttons */}
            <div className="adres-secici-footer">
              <div className="text-13 text-secondary flex-row items-center gap-6">
                <Check size={14} color={selections.length > 0 ? '#10b981' : 'var(--text-muted)'} />
                <span>
                  {selections.length > 0
                    ? `${selections.length} ${translate('auto_adim_tamamlandi_b606', 'adım tamamlandı.')}`
                    : translate('auto_henuz_secim_yapilmad_671b', 'Henüz seçim yapılmadı.')}
                </span>
              </div>
              <div className="flex-row items-center gap-12">
                <CancelButton onClick={onClose} />
                <button
                  type="button"
                  className="btn btn-primary flex-row items-center gap-8"
                  onClick={handleSave}
                  disabled={selections.length === 0}
                >
                  <span>{translate('auto_secimi_tamamla_5044', 'Seçimi Tamamla')}</span>
                  <ArrowRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </BaseCardPage>
  );

  return baseCardPageElement;
};

export const AdresSeciciModal = AdresSeciciForm;
export default AdresSeciciForm;
