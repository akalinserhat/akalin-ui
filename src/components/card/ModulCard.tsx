/**
 * Webakus UI Core - Sistem Modülü Kartı Bileşeni (ModulCard)
 * BaseCard bileşeninden türetilmiş; Admin veya UI (ERP) modüllerini detaylı olarak
 * listelemek, durum rozetlerini göstermek ve modül kurulum/kaldırma/pasife alma
 * işlemlerini yönetmek için kullanılan Material Design 3 kart bileşeni.
 * 
 * Düzen Desteği (Layout):
 * - 'row' (Varsayılan): Satır satır liste görünümü (Sol: Circular İkon, Orta: Bilgiler & Rozetler, Sağ: Aksiyonlar)
 * - 'grid': Kare/kutu ızgara görünümü
 */

import React from 'react';
import { 
  LucideIcon,
  Users, 
  Package, 
  FileText, 
  ShoppingCart, 
  Landmark, 
  Wallet, 
  Warehouse, 
  Truck, 
  MapPin, 
  Cloud, 
  ScanLine, 
  Settings, 
  Settings2, 
  ShieldCheck, 
  Tag, 
  Sparkles, 
  Layers, 
  Activity, 
  FileCheck, 
  CreditCard, 
  Lock, 
  Mail, 
  Sliders, 
  Code, 
  Folder, 
  AlertCircle, 
  CheckCircle2, 
  Power, 
  XCircle, 
  RefreshCcw, 
  PlusCircle, 
  Trash2,
  LayoutDashboard,
  Building,
  Building2,
  Bot,
  Cpu,
  UserCog,
  PackageOpen,
  Database,
  Bell,
  HelpCircle,
  LogIn,
  Barcode,
  ScanBarcode,
  Box
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BaseCard, BaseCardProps, CardVariant } from '@akalin/ui';
import { ModuleSettingsRegistry } from '../../modules/ModuleSettingsRegistry';

export type ModulScope = 'Admin' | 'UI' | 'ERP';
export type ModulStatus = 'REGISTERED' | 'UNREGISTERED' | 'DISABLED' | 'MISSING' | string;
export type ModulType = 'FullStack' | 'Backend' | 'Frontend' | string;
export type ModulCardLayout = 'row' | 'grid';

export interface ModulData {
  id?: string | number;
  kod: string;
  ad: string;
  aciklama?: string;
  klasorYolu?: string;
  modulTipi?: ModulType;
  durum?: ModulStatus;
  aktifMi?: boolean;
  isCore?: boolean;
  ikon?: string;
  iconName?: string;
  icon?: string | React.ReactNode;
  tanitimIkon?: string;
  [key: string]: any;
}

export interface ModulCardProps extends Omit<BaseCardProps, 'onClick'> {
  /** Görüntülenecek modül verisi */
  modul: ModulData;
  /** Kart görünüm düzeni: 'row' (satır satır / varsayılan) veya 'grid' (kare/kutu) */
  layout?: ModulCardLayout;
  /** Modülün Admin mi yoksa UI (ERP) modülü mü olduğunu belirler */
  scope?: ModulScope;
  /** Alternatif Türkçe prop adı */
  kapsam?: ModulScope;
  /** Admin modülü olup olmadığını belirten hızlı bayrak */
  isAdmin?: boolean;
  /** UI modülü olup olmadığını belirten hızlı bayrak */
  isUiModule?: boolean;
  /** Özel dairesel (circular) ikon */
  customIcon?: React.ReactNode;
  /** Kapsam rozeti (Admin / UI) gösterilsin mi? (Varsayılan: true) */
  showScopeBadge?: boolean;
  /** İşlem devam ediyor mu (loading/spinning)? */
  isProcessing?: boolean;
  /** Sisteme Kaydet / Kur butonuna tıklandığında */
  onRegister?: (modul: ModulData) => void;
  /** Kaydı Kaldır veya Kalıcı Sil butonuna tıklandığında */
  onUnregister?: (modul: ModulData, kaliciSil?: boolean) => void;
  /** Aktif/Pasif durumunu değiştirme butonuna tıklandığında */
  onToggle?: (modul: ModulData) => void;
  /** Eksiklik Arabirimi butonuna tıklandığında */
  onEksiklikClick?: (modul: ModulData) => void;
  /** Karta doğrudan tıklandığında */
  onClick?: (modul: ModulData, e: React.MouseEvent) => void;
  /** Özel kart alt aksiyonları */
  extraActions?: React.ReactNode;
  /** Özel kart üst bar öğeleri */
  extraTopBarItems?: React.ReactNode;
  /** Kart görsel varyantı ('outlined' | 'elevated' | 'filled') */
  variant?: CardVariant;
  /** Kart tıklanabilir / etkileşimli mi? */
  interactive?: boolean;
  /** İlave CSS sınıfları */
  className?: string;
}

const ICON_COMPONENTS: Record<string, LucideIcon | React.ComponentType<any>> = {
  users: Users,
  user: Users,
  cari: Users,
  usercog: UserCog,
  package: Package,
  boxes: Package,
  box: Box,
  stok: Package,
  filetext: FileText,
  fatura: FileText,
  filecheck: FileCheck,
  irsaliye: FileText,
  shoppingcart: ShoppingCart,
  siparis: ShoppingCart,
  landmark: Landmark,
  banka: Landmark,
  finans: Landmark,
  wallet: Wallet,
  kasa: Wallet,
  coins: Wallet,
  creditcard: CreditCard,
  warehouse: Warehouse,
  depo: Warehouse,
  sube: Warehouse,
  truck: Truck,
  kargo: Truck,
  mappin: MapPin,
  adres: MapPin,
  cloud: Cloud,
  bulut: Cloud,
  scanline: ScanLine,
  barcode: Barcode,
  scanbarcode: ScanBarcode,
  barkod: Barcode,
  settings: Settings,
  settings2: Settings2,
  shieldcheck: ShieldCheck,
  auth: ShieldCheck,
  tag: Tag,
  sparkles: Sparkles,
  layers: Layers,
  activity: Activity,
  lock: Lock,
  login: LogIn,
  mail: Mail,
  email: Mail,
  sliders: Sliders,
  layoutdashboard: LayoutDashboard,
  dashboard: LayoutDashboard,
  building: Building,
  building2: Building2,
  firma: Building2,
  bot: Bot,
  cpu: Cpu,
  ai: Bot,
  packageopen: PackageOpen,
  modul: PackageOpen,
  database: Database,
  seed: Database,
  bell: Bell,
  bildirim: Bell,
  helpcircle: HelpCircle,
  yardim: HelpCircle
};

/**
 * Modül bilgisine göre dairesel ikon için en uygun Lucide ikonunu akıllı olarak çözümler.
 */
const resolveModulIcon = (modul: ModulData, customIcon?: React.ReactNode): React.ReactNode => {
  if (customIcon) return customIcon;
  if (React.isValidElement(modul.icon)) return modul.icon;

  // 1. Modül nesnesinde açık belirtilen iconName / ikon / tanitimIkon / string icon
  const explicitIconName = (
    modul.iconName || 
    modul.ikon || 
    modul.tanitimIkon || 
    (typeof modul.icon === 'string' ? modul.icon : '') || 
    ''
  ).trim().toLowerCase();

  if (explicitIconName && ICON_COMPONENTS[explicitIconName]) {
    const Comp = ICON_COMPONENTS[explicitIconName];
    return <Comp size={22} />;
  }

  // 2. ModuleSettingsRegistry üzerinde kayıtlı bir ikon var mı?
  const regDef = ModuleSettingsRegistry.get(modul.kod || '');
  if (regDef) {
    if (React.isValidElement(regDef.icon)) return regDef.icon;
    const regIconName = (regDef.iconName || (typeof regDef.icon === 'string' ? regDef.icon : '') || '').trim().toLowerCase();
    if (regIconName && ICON_COMPONENTS[regIconName]) {
      const Comp = ICON_COMPONENTS[regIconName];
      return <Comp size={22} />;
    }
  }

  // 3. Modül Koduna (kod) göre akıllı eşleştirme
  const code = (modul.kod || '').toLowerCase();
  if (code.includes('cari')) return <Users size={22} />;
  if (code.includes('stok') || code.includes('urun')) return <Package size={22} />;
  if (code.includes('fatura') || code.includes('irsaliye')) return <FileText size={22} />;
  if (code.includes('siparis')) return <ShoppingCart size={22} />;
  if (code.includes('kasa')) return <Wallet size={22} />;
  if (code.includes('banka') || code.includes('finans')) return <Landmark size={22} />;
  if (code.includes('depo') || code.includes('sube')) return <Warehouse size={22} />;
  if (code.includes('kargo')) return <Truck size={22} />;
  if (code.includes('adres')) return <MapPin size={22} />;
  if (code.includes('bulut') || code.includes('cloud')) return <Cloud size={22} />;
  if (code.includes('terminal')) return <ScanLine size={22} />;
  if (code.includes('barkod')) return <Barcode size={22} />;
  if (code.includes('firma')) return <Building2 size={22} />;
  if (code.includes('ai') || code.includes('yapay')) return <Bot size={22} />;
  if (code.includes('kullanici') || code.includes('yetki')) return <UserCog size={22} />;
  if (code.includes('email') || code.includes('eposta') || code.includes('mail')) return <Mail size={22} />;
  if (code.includes('seed')) return <Database size={22} />;
  if (code.includes('modul')) return <PackageOpen size={22} />;
  if (code.includes('bildirim')) return <Bell size={22} />;
  if (code.includes('yardim') || code.includes('destek')) return <HelpCircle size={22} />;
  if (code.includes('dashboard') || code.includes('pano')) return <LayoutDashboard size={22} />;
  if (code.includes('auth') || code.includes('login')) return <Lock size={22} />;
  if (code.includes('ayar') || code.includes('sistem') || code.includes('tanim')) return <Sliders size={22} />;

  // 4. Modül Adına (ad) göre akıllı eşleştirme
  const name = (modul.ad || '').toLowerCase();
  if (name.includes('cari')) return <Users size={22} />;
  if (name.includes('stok') || name.includes('ürün') || name.includes('urun')) return <Package size={22} />;
  if (name.includes('fatura') || name.includes('irsaliye')) return <FileText size={22} />;
  if (name.includes('sipariş') || name.includes('siparis')) return <ShoppingCart size={22} />;
  if (name.includes('kasa')) return <Wallet size={22} />;
  if (name.includes('banka') || name.includes('finans')) return <Landmark size={22} />;
  if (name.includes('depo') || name.includes('şube') || name.includes('sube')) return <Warehouse size={22} />;
  if (name.includes('kargo') || name.includes('lojistik')) return <Truck size={22} />;
  if (name.includes('adres')) return <MapPin size={22} />;
  if (name.includes('bulut')) return <Cloud size={22} />;
  if (name.includes('terminal')) return <ScanLine size={22} />;
  if (name.includes('barkod')) return <Barcode size={22} />;
  if (name.includes('firma')) return <Building2 size={22} />;
  if (name.includes('yapay') || name.includes('llm')) return <Bot size={22} />;
  if (name.includes('yetki') || name.includes('kullanıcı') || name.includes('kullanici')) return <UserCog size={22} />;
  if (name.includes('posta') || name.includes('mail')) return <Mail size={22} />;
  if (name.includes('seed')) return <Database size={22} />;
  if (name.includes('modül') || name.includes('modul')) return <PackageOpen size={22} />;
  if (name.includes('bildirim')) return <Bell size={22} />;
  if (name.includes('yardım') || name.includes('yardim')) return <HelpCircle size={22} />;
  if (name.includes('gösterge') || name.includes('dashboard')) return <LayoutDashboard size={22} />;
  if (name.includes('tanım') || name.includes('ayar')) return <Sliders size={22} />;

  return <Package size={22} />;
};

const ModulCard = React.forwardRef<HTMLElement, ModulCardProps>(
  (
    {
      modul,
      layout = 'row',
      scope,
      kapsam,
      isAdmin,
      isUiModule,
      customIcon,
      showScopeBadge = true,
      isProcessing = false,
      onRegister,
      onUnregister,
      onToggle,
      onEksiklikClick,
      onClick,
      extraActions,
      extraTopBarItems,
      variant = 'outlined',
      interactive = false,
      className = '',
      ...rest
    },
    ref
  ) => {
    const { t } = useTranslation();

    // Kapsam tespiti (Admin veya UI/ERP)
    const rawScope = scope || kapsam;
    const effectiveScope: ModulScope = 
      rawScope || (isAdmin ? 'Admin' : (isUiModule ? 'UI' : 'ERP'));

    const isScopeAdmin = effectiveScope === 'Admin' || isAdmin === true;

    // Kart tıklama işlemi
    const handleCardClick = (e: React.MouseEvent) => {
      if (onClick) {
        onClick(modul, e);
      }
    };

    // Modül Tip Rozeti Render
    const renderTypeBadge = (tip?: string) => {
      switch (tip) {
        case 'FullStack':
          return <span className="modul-type-badge type-fullstack">{t('modul_tip_fullstack', 'Full-Stack')}</span>;
        case 'Backend':
          return <span className="modul-type-badge type-backend">{t('modul_tip_backend', 'Backend')}</span>;
        case 'Frontend':
        default:
          return <span className="modul-type-badge type-frontend">{t('modul_tip_frontend', 'Frontend')}</span>;
      }
    };

    // Modül Durum Rozeti Render
    const renderStatusBadge = () => {
      if (modul.isCore) {
        return (
          <span className="modul-badge badge-core">
            <ShieldCheck size={13} /> {t('cekirdek_sistem', 'ÇEKİRDEK SİSTEM')}
          </span>
        );
      }

      switch (modul.durum) {
        case 'REGISTERED':
          if (!modul.aktifMi) {
            return (
              <span className="modul-badge badge-disabled">
                <Power size={13} /> {t('pasif_durumda', 'PASİF DURUMDA')}
              </span>
            );
          }
          return (
            <span className="modul-badge badge-registered">
              <CheckCircle2 size={13} /> {t('kayitli_aktif', 'KAYITLI & AKTİF')}
            </span>
          );
        case 'UNREGISTERED':
          return (
            <span className="modul-badge badge-unregistered">
              <Sparkles size={13} /> {t('kayitsiz_yeni_badge', 'KAYITSIZ (YENİ)')}
            </span>
          );
        case 'DISABLED':
          return (
            <span className="modul-badge badge-disabled">
              <Power size={13} /> {t('devre_disi', 'DEVRE DIŞI')}
            </span>
          );
        case 'MISSING':
          return (
            <span className="modul-badge badge-missing">
              <XCircle size={13} /> {t('dosya_eksik', 'DOSYA EKSİK')}
            </span>
          );
        default:
          return null;
      }
    };

    const isRowLayout = layout === 'row';

    const cardClasses = [
      'modul-card',
      isRowLayout ? 'modul-row-card' : '',
      modul.durum === 'UNREGISTERED' ? 'card-unregistered' : '',
      isScopeAdmin ? 'scope-admin-card' : 'scope-ui-card',
      className
    ]
      .filter(Boolean)
      .join(' ');

    // ─────────────────────────────────────────────────────────────
    // 1. SATIR SATIR LİSTE DÜZENİ (layout === 'row')
    // ─────────────────────────────────────────────────────────────
    if (isRowLayout) {
      return (
        <BaseCard
          ref={ref}
          variant={variant}
          interactive={interactive}
          onClick={handleCardClick}
          className={cardClasses}
          {...rest}
        >
          {/* 1. Sol: Modülle ilişkili dairesel (circular) ikon */}
          <div className="modul-card-avatar" aria-hidden="true">
            {resolveModulIcon(modul, customIcon)}
          </div>

          {/* 2. Orta: Modül Bilgileri, Rozetler ve Fiziksel Konum */}
          <div className="modul-card-body">
            <div className="modul-card-header-row">
              <h4 className="modul-card-title">{modul.ad}</h4>

              <div className="code-badge">
                <Code size={11} />
                <span>{modul.kod}</span>
              </div>

              {showScopeBadge && (
                <span className={`modul-scope-badge ${isScopeAdmin ? 'scope-admin' : 'scope-ui'}`}>
                  {isScopeAdmin ? (
                    <>
                      <ShieldCheck size={11} />
                      <span>{t('admin_modulu', 'Admin')}</span>
                    </>
                  ) : (
                    <>
                      <Layers size={11} />
                      <span>{t('ui_modulu', 'UI')}</span>
                    </>
                  )}
                </span>
              )}

              {renderTypeBadge(modul.modulTipi)}
              {renderStatusBadge()}
              {extraTopBarItems}
            </div>

            <p className="modul-card-desc">
              {modul.aciklama || t('modul_aciklama_yok', 'Bu modül için özel bir açıklama girilmemiş.')}
            </p>

            <div className="modul-card-meta-row">
              <div className="modul-row-path-bar" title={modul.klasorYolu}>
                <Folder size={12} className="path-icon" />
                <span className="path-text">{modul.klasorYolu || t('bilinmiyor', 'Bilinmiyor')}</span>
              </div>

              {modul.durum === 'MISSING' && (
                <div className="missing-alert-inline">
                  <AlertCircle size={12} />
                  <span>{t('modul_dosyalari_diskte_bulunamadi', 'Veritabanında kayıtlı fakat fiziksel dosyaları diskte bulunamadı.')}</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. Sağ: Aksiyon Butonları */}
          <div className="modul-card-actions">
            {/* Eksiklik Arabirimi */}
            {!modul.isCore && onEksiklikClick && (
              <button
                type="button"
                className="btn btn-action-tanitim"
                title={t('eksiklik_arabirimi_ipucu', 'Müşteriye Gösterilecek Eksiklik ve Tanıtım Arabirimini (HTML Şablonu) Düzenle')}
                disabled={isProcessing}
                onClick={(e) => {
                  e.stopPropagation();
                  onEksiklikClick(modul);
                }}
              >
                <Code size={13} />
                <span>{t('eksiklik_arabirimi', 'Eksiklik Arabirimi')}</span>
              </button>
            )}

            {modul.isCore ? (
              <div 
                className="core-locked-notice" 
                title={t('cekirdek_modul_koruma_aciklamasi', 'Bu modül sistemin çalışması için zorunlu çekirdek modüldür, devre dışı bırakılamaz veya kaldırılamaz.')}
              >
                <Lock size={13} />
                <span>{t('cekirdek_sistem_modulu_korumali', 'Çekirdek Sistem (Korumalı)')}</span>
              </div>
            ) : (
              <>
                {modul.durum === 'UNREGISTERED' && onRegister && (
                  <button
                    type="button"
                    className="btn btn-register"
                    disabled={isProcessing}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRegister(modul);
                    }}
                  >
                    {isProcessing ? (
                      <RefreshCcw size={14} className="spinning" />
                    ) : (
                      <PlusCircle size={14} />
                    )}
                    <span>{t('sisteme_kaydet_kur', 'Sisteme Kaydet / Kur')}</span>
                  </button>
                )}

                {modul.durum === 'REGISTERED' && (
                  <div className="action-buttons-group-row">
                    {onToggle && (
                      <button
                        type="button"
                        className="btn btn-action-toggle"
                        title={modul.aktifMi ? t('modulu_pasife_al', 'Modülü Pasife Al') : t('modulu_aktife_al', 'Modülü Aktife Al')}
                        disabled={isProcessing}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggle(modul);
                        }}
                      >
                        <Power size={13} />
                        <span>{modul.aktifMi ? t('pasife_al', 'Pasife Al') : t('aktif_et', 'Aktif Et')}</span>
                      </button>
                    )}

                    {onUnregister && (
                      <button
                        type="button"
                        className="btn btn-action-unregister"
                        title={t('modulun_kaydini_kaldir', 'Modülün Kaydını Kaldır')}
                        disabled={isProcessing}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnregister(modul, false);
                        }}
                      >
                        <Trash2 size={13} />
                        <span>{t('kaydi_kaldir', 'Kaydı Kaldır')}</span>
                      </button>
                    )}
                  </div>
                )}

                {modul.durum === 'DISABLED' && (
                  <div className="action-buttons-group-row">
                    {onToggle && (
                      <button
                        type="button"
                        className="btn btn-register"
                        disabled={isProcessing}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggle(modul);
                        }}
                      >
                        <Power size={13} />
                        <span>{t('tekrar_aktifleştir', 'Tekrar Aktifleştir')}</span>
                      </button>
                    )}

                    {onUnregister && (
                      <button
                        type="button"
                        className="btn btn-action-unregister"
                        title={t('veritabanindan_tamamen_sil', 'Veritabanından Tamamen Sil')}
                        disabled={isProcessing}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnregister(modul, true);
                        }}
                      >
                        <Trash2 size={13} />
                        <span>{t('kalici_sil', 'Kalıcı Sil')}</span>
                      </button>
                    )}
                  </div>
                )}

                {modul.durum === 'MISSING' && onUnregister && (
                  <button
                    type="button"
                    className="btn btn-action-unregister"
                    disabled={isProcessing}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnregister(modul, true);
                    }}
                  >
                    <Trash2 size={13} />
                    <span>{t('db_kaydini_temizle', 'DB Kaydını Temizle')}</span>
                  </button>
                )}
              </>
            )}

            {extraActions}
          </div>
        </BaseCard>
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 2. KARE / IZGARA GÖRÜNÜMÜ (layout === 'grid')
    // ─────────────────────────────────────────────────────────────
    return (
      <BaseCard
        ref={ref}
        variant={variant}
        interactive={interactive}
        onClick={handleCardClick}
        className={cardClasses}
        {...rest}
      >
        {/* 1. Kart Üst Barı */}
        <div className="card-top-bar">
          <div className="card-codes">
            <div className="code-badge">
              <Code size={13} />
              <span>{modul.kod}</span>
            </div>

            {showScopeBadge && (
              <span className={`modul-scope-badge ${isScopeAdmin ? 'scope-admin' : 'scope-ui'}`}>
                {isScopeAdmin ? (
                  <>
                    <ShieldCheck size={11} />
                    <span>{t('admin_modulu', 'Admin')}</span>
                  </>
                ) : (
                  <>
                    <Layers size={11} />
                    <span>{t('ui_modulu', 'UI')}</span>
                  </>
                )}
              </span>
            )}

            {renderTypeBadge(modul.modulTipi)}
            {extraTopBarItems}
          </div>
          {renderStatusBadge()}
        </div>

        {/* 2. Kart İçeriği */}
        <div className="card-content">
          <h3 className="modul-name">{modul.ad}</h3>
          <p className="modul-desc">
            {modul.aciklama || t('modul_aciklama_yok', 'Bu modül için özel bir açıklama girilmemiş.')}
          </p>
        </div>

        {/* 3. Fiziksel Dizin Bilgisi */}
        <div className="card-path-bar">
          <Folder size={14} className="path-icon" />
          <span className="path-text" title={modul.klasorYolu}>
            {modul.klasorYolu || t('bilinmiyor', 'Bilinmiyor')}
          </span>
        </div>

        {/* 4. Eksik Dosya Uyarısı */}
        {modul.durum === 'MISSING' && (
          <div className="missing-alert">
            <AlertCircle size={15} />
            <span>{t('modul_dosyalari_diskte_bulunamadi', 'Veritabanında kayıtlı fakat fiziksel dosyaları diskte bulunamadı.')}</span>
          </div>
        )}

        {/* 5. Kart Alt Aksiyon Butonları */}
        <div className="card-actions">
          {!modul.isCore && onEksiklikClick && (
            <button
              type="button"
              className="btn btn-action-tanitim"
              title={t('eksiklik_arabirimi_ipucu', 'Müşteriye Gösterilecek Eksiklik ve Tanıtım Arabirimini (HTML Şablonu) Düzenle')}
              disabled={isProcessing}
              onClick={(e) => {
                e.stopPropagation();
                onEksiklikClick(modul);
              }}
            >
              <Code size={14} />
              <span>{t('eksiklik_arabirimi', 'Eksiklik Arabirimi')}</span>
            </button>
          )}

          {modul.isCore ? (
            <div 
              className="core-locked-notice" 
              title={t('cekirdek_modul_koruma_aciklamasi', 'Bu modül sistemin çalışması için zorunlu çekirdek modüldür, devre dışı bırakılamaz veya kaldırılamaz.')}
            >
              <Lock size={14} />
              <span>{t('cekirdek_sistem_modulu_korumali', 'Çekirdek Sistem Modülü (Korumalı)')}</span>
            </div>
          ) : (
            <>
              {modul.durum === 'UNREGISTERED' && onRegister && (
                <button
                  type="button"
                  className="btn btn-register"
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegister(modul);
                  }}
                >
                  {isProcessing ? (
                    <RefreshCcw size={16} className="spinning" />
                  ) : (
                    <PlusCircle size={16} />
                  )}
                  <span>{t('sisteme_kaydet_kur', 'Sisteme Kaydet / Kur')}</span>
                </button>
              )}

              {modul.durum === 'REGISTERED' && (
                <div className="action-buttons-group">
                  {onToggle && (
                    <button
                      type="button"
                      className="btn btn-action-toggle"
                      title={modul.aktifMi ? t('modulu_pasife_al', 'Modülü Pasife Al') : t('modulu_aktife_al', 'Modülü Aktife Al')}
                      disabled={isProcessing}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(modul);
                      }}
                    >
                      <Power size={15} />
                      <span>{modul.aktifMi ? t('pasife_al', 'Pasife Al') : t('aktif_et', 'Aktif Et')}</span>
                    </button>
                  )}

                  {onUnregister && (
                    <button
                      type="button"
                      className="btn btn-action-unregister"
                      title={t('modulun_kaydini_kaldir', 'Modülün Kaydını Kaldır')}
                      disabled={isProcessing}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnregister(modul, false);
                      }}
                    >
                      <Trash2 size={15} />
                      <span>{t('kaydi_kaldir', 'Kaydı Kaldır')}</span>
                    </button>
                  )}
                </div>
              )}

              {modul.durum === 'DISABLED' && (
                <div className="action-buttons-group">
                  {onToggle && (
                    <button
                      type="button"
                      className="btn btn-register"
                      disabled={isProcessing}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(modul);
                      }}
                    >
                      <Power size={15} />
                      <span>{t('tekrar_aktifleştir', 'Tekrar Aktifleştir')}</span>
                    </button>
                  )}

                  {onUnregister && (
                    <button
                      type="button"
                      className="btn btn-action-unregister"
                      title={t('veritabanindan_tamamen_sil', 'Veritabanından Tamamen Sil')}
                      disabled={isProcessing}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnregister(modul, true);
                      }}
                    >
                      <Trash2 size={15} />
                      <span>{t('kalici_sil', 'Kalıcı Sil')}</span>
                    </button>
                  )}
                </div>
              )}

              {modul.durum === 'MISSING' && onUnregister && (
                <button
                  type="button"
                  className="btn btn-action-unregister btn-full"
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnregister(modul, true);
                  }}
                >
                  <Trash2 size={15} />
                  <span>{t('db_kaydini_temizle', 'DB Kaydını Temizle')}</span>
                </button>
              )}
            </>
          )}

          {extraActions}
        </div>
      </BaseCard>
    );
  }
);

ModulCard.displayName = 'ModulCard';

export default ModulCard;
