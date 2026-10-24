/**
 * Webakus UI Core - Basit Modül Kartı Bileşeni (ModulCardBasit)
 * BaseCard bileşeninden türetilmiş; sol tarafında modülle ilişkili dairesel (circular)
 * ikon, orta kısmında başlık ve alt başlık (açıklama), sağ tarafında ise BaseSwitch
 * anahtarını barındıran Material Design 3 standartlarında modül kartı.
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
  ShieldCheck, 
  Tag, 
  Sparkles,
  Layers,
  Activity,
  FileCheck,
  CreditCard,
  Settings2,
  Lock,
  Mail,
  Sliders,
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
import { BaseSwitch } from '@akalin/ui';
import { ModuleSettingsRegistry } from '../../modules/ModuleSettingsRegistry';

export interface ModulItem {
  id?: string | number;
  kod: string;
  ad: string;
  aciklama?: string;
  aktifMi?: boolean;
  ikon?: string;
  iconName?: string;
  icon?: string | React.ReactNode;
  tanitimIkon?: string;
  [key: string]: any;
}

export interface ModulCardBasitProps extends Omit<BaseCardProps, 'onClick'> {
  /** Görüntülenecek modül nesnesi */
  modul: ModulItem;
  /** Modül seçili / aktif mi? */
  isSelected?: boolean;
  /** Seçim durumu değiştiğinde (karta veya switch'e tıklandığında) çalışır */
  onToggle?: (modul: ModulItem, e?: React.MouseEvent | React.ChangeEvent) => void;
  /** Karta doğrudan tıklandığında çalışır */
  onClick?: (modul: ModulItem, e?: React.MouseEvent) => void;
  /** Modülün yapılandırılabilir ayar sayfası mevcut mu? */
  hasSettings?: boolean;
  /** "Ayarlar" butonuna tıklandığında çalışır */
  onSettingsClick?: (modul: ModulItem, e: React.MouseEvent) => void;
  /** Ayarlar butonu etiketi (varsayılan: 'Ayarlar') */
  settingsButtonLabel?: string;
  /** Yapılandır butonu title/tooltip metni */
  settingsButtonTitle?: string;
  /** Kart veya anahtar devre dışı mı? */
  disabled?: boolean;
  /** Özel dairesel ikon geçilmek istenirse */
  customIcon?: React.ReactNode;
  /** Kartın sağ tarafına switch öncesinde eklenebilecek ilave aksiyonlar */
  extraActions?: React.ReactNode;
  /** Kartın MD3 görsel varyantı ('elevated' | 'filled' | 'outlined') */
  variant?: CardVariant;
  /** Kart tıklanabilir / etkileşimli mi? */
  interactive?: boolean;
  /** Ekstra CSS sınıfları */
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
 * Modül bilgisine göre en uygun görsel ikonu akıllı olarak çözümler.
 */
const resolveModulIcon = (modul: ModulItem, customIcon?: React.ReactNode): React.ReactNode => {
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
    return <Comp size={20} />;
  }

  // 2. ModuleSettingsRegistry üzerinde kayıtlı bir ikon var mı?
  const regDef = ModuleSettingsRegistry.get(modul.kod || '');
  if (regDef) {
    if (React.isValidElement(regDef.icon)) return regDef.icon;
    const regIconName = (regDef.iconName || (typeof regDef.icon === 'string' ? regDef.icon : '') || '').trim().toLowerCase();
    if (regIconName && ICON_COMPONENTS[regIconName]) {
      const Comp = ICON_COMPONENTS[regIconName];
      return <Comp size={20} />;
    }
  }

  // 3. Modül Koduna (kod) göre akıllı eşleştirme
  const code = (modul.kod || '').toLowerCase();
  if (code.includes('cari')) return <Users size={20} />;
  if (code.includes('stok') || code.includes('urun')) return <Package size={20} />;
  if (code.includes('fatura') || code.includes('irsaliye')) return <FileText size={20} />;
  if (code.includes('siparis')) return <ShoppingCart size={20} />;
  if (code.includes('kasa')) return <Wallet size={20} />;
  if (code.includes('banka') || code.includes('finans')) return <Landmark size={20} />;
  if (code.includes('depo') || code.includes('sube')) return <Warehouse size={20} />;
  if (code.includes('kargo')) return <Truck size={20} />;
  if (code.includes('adres')) return <MapPin size={20} />;
  if (code.includes('bulut') || code.includes('cloud')) return <Cloud size={20} />;
  if (code.includes('terminal')) return <ScanLine size={20} />;
  if (code.includes('barkod')) return <Barcode size={20} />;
  if (code.includes('firma')) return <Building2 size={20} />;
  if (code.includes('ai') || code.includes('yapay')) return <Bot size={20} />;
  if (code.includes('kullanici') || code.includes('yetki')) return <UserCog size={20} />;
  if (code.includes('email') || code.includes('eposta') || code.includes('mail')) return <Mail size={20} />;
  if (code.includes('seed')) return <Database size={20} />;
  if (code.includes('modul')) return <PackageOpen size={20} />;
  if (code.includes('bildirim')) return <Bell size={20} />;
  if (code.includes('yardim') || code.includes('destek')) return <HelpCircle size={20} />;
  if (code.includes('dashboard') || code.includes('pano')) return <LayoutDashboard size={20} />;
  if (code.includes('auth') || code.includes('login')) return <Lock size={20} />;
  if (code.includes('ayar') || code.includes('sistem') || code.includes('tanim')) return <Sliders size={20} />;

  // 4. Modül Adına (ad) göre akıllı eşleştirme
  const name = (modul.ad || '').toLowerCase();
  if (name.includes('cari')) return <Users size={20} />;
  if (name.includes('stok') || name.includes('ürün') || name.includes('urun')) return <Package size={20} />;
  if (name.includes('fatura') || name.includes('irsaliye')) return <FileText size={20} />;
  if (name.includes('sipariş') || name.includes('siparis')) return <ShoppingCart size={20} />;
  if (name.includes('kasa')) return <Wallet size={20} />;
  if (name.includes('banka') || name.includes('finans')) return <Landmark size={20} />;
  if (name.includes('depo') || name.includes('şube') || name.includes('sube')) return <Warehouse size={20} />;
  if (name.includes('kargo') || name.includes('lojistik')) return <Truck size={20} />;
  if (name.includes('adres')) return <MapPin size={20} />;
  if (name.includes('bulut')) return <Cloud size={20} />;
  if (name.includes('terminal')) return <ScanLine size={20} />;
  if (name.includes('barkod')) return <Barcode size={20} />;
  if (name.includes('firma')) return <Building2 size={20} />;
  if (name.includes('yapay') || name.includes('llm')) return <Bot size={20} />;
  if (name.includes('yetki') || name.includes('kullanıcı') || name.includes('kullanici')) return <UserCog size={20} />;
  if (name.includes('posta') || name.includes('mail')) return <Mail size={20} />;
  if (name.includes('seed')) return <Database size={20} />;
  if (name.includes('modül') || name.includes('modul')) return <PackageOpen size={20} />;
  if (name.includes('bildirim')) return <Bell size={20} />;
  if (name.includes('yardım') || name.includes('yardim')) return <HelpCircle size={20} />;
  if (name.includes('gösterge') || name.includes('dashboard')) return <LayoutDashboard size={20} />;
  if (name.includes('tanım') || name.includes('ayar')) return <Sliders size={20} />;

  return <Package size={20} />;
};

const ModulCardBasit = React.forwardRef<HTMLElement, ModulCardBasitProps>(
  (
    {
      modul,
      isSelected = false,
      onToggle,
      onClick,
      hasSettings = false,
      onSettingsClick,
      settingsButtonLabel,
      settingsButtonTitle,
      disabled = false,
      customIcon,
      extraActions,
      variant = 'outlined',
      interactive = true,
      className = '',
      ...rest
    },
    ref
  ) => {
    const { t } = useTranslation();

    const handleCardClick = (e: React.MouseEvent) => {
      if (disabled) return;
      if (onToggle) {
        onToggle(modul, e);
      }
      if (onClick) {
        onClick(modul, e);
      }
    };

    const cardClasses = [
      'firma-modul-row-card',
      isSelected ? 'is-selected' : '',
      disabled ? 'is-disabled' : '',
      className
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <BaseCard
        ref={ref}
        variant={variant}
        interactive={interactive && !disabled}
        onClick={handleCardClick}
        className={cardClasses}
        {...rest}
      >
        {/* 1. Sol: Modülle alakalı dairesel (circular) ikon */}
        <div className="modul-card-avatar" aria-hidden="true">
          {resolveModulIcon(modul, customIcon)}
        </div>

        {/* 2. Orta: Başlık ve Subtitle */}
        <div className="modul-card-body">
          <div className="modul-card-header-row">
            <h4 className="modul-card-title">{modul.ad}</h4>
            {modul.kod && (
              <span className="modul-card-code">{modul.kod}</span>
            )}
          </div>
          {modul.aciklama ? (
            <p className="modul-card-desc">{modul.aciklama}</p>
          ) : (
            <p className="modul-card-desc text-muted">{modul.kod || modul.ad}</p>
          )}
        </div>

        {/* 3. Sağ: Ayarlar (varsa) ve BaseSwitch anahtarı */}
        <div className="modul-card-actions">
          {extraActions}
          {hasSettings && (
            <button
              type="button"
              className="btn btn-secondary firma-action-btn-sm flex-row items-center gap-6"
              onClick={(e) => {
                e.stopPropagation();
                if (onSettingsClick) {
                  onSettingsClick(modul, e);
                }
              }}
              title={settingsButtonTitle || t('modul_ayarlarini_yapilandir', 'Modül Ayarlarını Yapılandır')}
            >
              <Settings2 size={13} />
              {settingsButtonLabel || t('ayarlar', 'Ayarlar')}
            </button>
          )}

          <div
            className="modul-card-switch-container"
            onClick={(e) => e.stopPropagation()}
          >
            <BaseSwitch
              checked={isSelected}
              disabled={disabled}
              onChange={(e) => {
                if (onToggle) {
                  onToggle(modul, e as any);
                }
              }}
            />
          </div>
        </div>
      </BaseCard>
    );
  }
);

ModulCardBasit.displayName = 'ModulCardBasit';

export default ModulCardBasit;
