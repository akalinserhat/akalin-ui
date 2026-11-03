/**
 * Akalin UI - Kart Sayfası Başlık Bileşeni (BaseCardPageHeader)
 * 
 * BaseCard altyapısı üzerine inşa edilmiş, BaseCardPage ve BasePage sayfalarının
 * en üstünde konumlanan başlık (ikon, sayfa başlığı, alt başlık, ekmek kırıntısı ve sağ aksiyonlar)
 * alanını Material Design 3 tasarım ilkelerine uygun olarak sunan kart bileşeni.
 */

import React from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BaseCard, { BaseCardProps, CardVariant } from '../base/card/BaseCard';

export interface BaseCardPageHeaderProps extends Omit<BaseCardProps, 'title'> {
  /**
   * Kart sayfasının ana başlığı
   */
  title?: React.ReactNode;

  /**
   * Başlık üzerine gelindiğinde (hover) gösterilecek tam metin ipucu (tooltip)
   */
  titleTooltip?: string;

  /**
   * Başlığın solunda gösterilecek büyük ikon
   */
  icon?: React.ReactNode;

  /**
   * Genel alt başlık veya açıklama metni
   */
  subtitle?: React.ReactNode;

  /**
   * Sol alt başlık / etiket (örn: VKN veya özel tanımlayıcı)
   */
  subtitleLeft?: React.ReactNode;

  /**
   * Sağ alt başlık rozeti (örn: Demo kalan gün, Lisans durumu)
   */
  subtitleRight?: React.ReactNode;

  /**
   * Başlık alanının sağ tarafında konumlandırılacak aksiyon butonları
   */
  headerExtra?: React.ReactNode;

  /**
   * headerExtra ile eşanlamlı alternatif aksiyon alanı
   */
  actions?: React.ReactNode;

  /**
   * Sayfa ekmek kırıntısı (Breadcrumb) gezinti bileşeni
   */
  breadcrumb?: React.ReactNode;

  /**
   * Kartın Material Design 3 varyantı ('elevated' | 'filled' | 'outlined')
   * @default 'elevated'
   */
  variant?: CardVariant;

  /**
   * İlave CSS sınıfları
   */
  className?: string;

  /**
   * İlave özel içerik
   */
  children?: React.ReactNode;

  /**
   * Başlık yanında düzenleme ikonu (kalem) tıklandığında çalışacak callback
   */
  onTitleEdit?: () => void;

  /**
   * Başlık düzenleme ikonunun ipucu (tooltip) metni
   */
  titleEditTooltip?: string;

  /**
   * Başlık yerinde (inline) düzenlendiğinde yeni başlık metnini dönen callback.
   * Verildiğinde başlık yanında kalem ikonu gösterilir ve başlığa veya kaleme tıklandığında yerinde düzenleme kutusu açılır.
   */
  onTitleChange?: (newTitle: string) => void;

  /**
   * Yerinde (inline) başlık düzenleme kutusunun ham metin değeri.
   * Başlıkta varsayılan/yer tutucu bir metin gösterilirken düzenleme kutusunun gerçek alan değerini (örn. boş string) almasını sağlar.
   */
  titleValue?: string;

  /**
   * Yerinde (inline) başlık düzenleme kutusunun placeholder metni
   */
  titlePlaceholder?: string;

  /**
   * Sayfa açıldığında başlık düzenleme kutusunun varsayılan olarak açık gelip gelmeyeceği
   */
  defaultEditingTitle?: boolean;

  /**
   * Alt başlık yanında düzenleme ikonu (kalem) tıklandığında çalışacak callback
   */
  onSubtitleEdit?: () => void;

  /**
   * Alt başlık düzenleme ikonunun ipucu (tooltip) metni
   */
  subtitleEditTooltip?: string;
}

const BaseCardPageHeader = React.forwardRef<HTMLElement, BaseCardPageHeaderProps>(
  (
    {
      title,
      titleTooltip,
      icon,
      subtitle,
      subtitleLeft,
      subtitleRight,
      headerExtra,
      actions,
      breadcrumb,
      variant = 'elevated',
      className = '',
      children,
      onTitleEdit,
      titleEditTooltip,
      onTitleChange,
      titleValue,
      titlePlaceholder,
      defaultEditingTitle = false,
      onSubtitleEdit,
      subtitleEditTooltip,
      ...rest
    },
    ref
  ) => {
    const { t } = useTranslation();
    const actionContent = headerExtra || actions;
    const subLeft = subtitleLeft || subtitle;

    const resolvedRawTitle =
      titleValue !== undefined ? titleValue : typeof title === 'string' ? title : '';
    const [isEditingTitle, setIsEditingTitle] = React.useState<boolean>(
      Boolean(defaultEditingTitle && onTitleChange)
    );
    const [draftTitle, setDraftTitle] = React.useState<string>(resolvedRawTitle);
    const originalTitleRef = React.useRef<string>(resolvedRawTitle);
    const titleInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      if (!isEditingTitle) {
        setDraftTitle(resolvedRawTitle);
        originalTitleRef.current = resolvedRawTitle;
      }
    }, [resolvedRawTitle, isEditingTitle]);

    React.useEffect(() => {
      if (isEditingTitle && titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }, [isEditingTitle]);

    const handleStartTitleEdit = React.useCallback(
      (e?: React.MouseEvent) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (onTitleChange) {
          originalTitleRef.current = resolvedRawTitle;
          setDraftTitle(resolvedRawTitle);
          setIsEditingTitle(true);
        }
        if (onTitleEdit) {
          onTitleEdit();
        }
      },
      [onTitleChange, onTitleEdit, resolvedRawTitle]
    );

    const handleCommitTitleEdit = React.useCallback(() => {
      if (onTitleChange) {
        const trimmed = draftTitle.trim();
        setDraftTitle(trimmed);
        originalTitleRef.current = trimmed;
        onTitleChange(trimmed);
      }
      setIsEditingTitle(false);
    }, [onTitleChange, draftTitle]);

    const handleCancelTitleEdit = React.useCallback(() => {
      const orig = originalTitleRef.current;
      setDraftTitle(orig);
      if (onTitleChange) {
        onTitleChange(orig);
      }
      setIsEditingTitle(false);
    }, [onTitleChange]);

    // Herhangi bir başlık veya aksiyon içeriği verilmemişse render etme
    if (
      !title &&
      !onTitleChange &&
      !icon &&
      !subLeft &&
      !subtitleRight &&
      !actionContent &&
      !breadcrumb &&
      !children
    ) {
      return null;
    }

    const headerClasses = [
      'w-full',
      'base-page-header',
      'base-card-page-header',
      className
    ]
      .filter(Boolean)
      .join(' ');

    const isTitleEditable = Boolean(onTitleChange || onTitleEdit);

    return (
      <BaseCard
        ref={ref}
        variant={variant}
        className={headerClasses}
        {...rest}
      >
        <div className="flex items-center gap-16 flex-1 min-w-0">
          {icon && (
            <div className={`icon-box-large ${React.isValidElement(icon) && ((icon.props as any)?.imageUrl !== undefined || (icon.props as any)?.gostergeUst !== undefined || (icon.props as any)?.title !== undefined) ? 'avatar-box-transparent' : ''}`}>
              {icon}
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {(title || onTitleChange) && (
              <div className="flex items-center gap-8 group/header-title min-w-0">
                {isEditingTitle && onTitleChange ? (
                  <div className="title-edit-box" onClick={(e) => e.stopPropagation()}>
                    <input
                      ref={titleInputRef}
                      type="text"
                      className="title-edit-input"
                      value={draftTitle}
                      placeholder={titlePlaceholder || (typeof title === 'string' ? title : '')}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        setDraftTitle(nextVal);
                        onTitleChange(nextVal);
                      }}
                      onBlur={handleCommitTitleEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCommitTitleEdit();
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCancelTitleEdit();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCommitTitleEdit();
                      }}
                      className="title-edit-action-btn btn-save"
                      title={t('common.ok', 'Tamam')}
                      aria-label={t('common.ok', 'Tamam')}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCancelTitleEdit();
                      }}
                      className="title-edit-action-btn btn-cancel"
                      title={t('common.cancel', 'İptal')}
                      aria-label={t('common.cancel', 'İptal')}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    {typeof title === 'string' ? (
                      <h1
                        className={`m-0 text-20 font-700 tracking-tight text-primary leading-tight truncate base-card-header-title${isTitleEditable ? ' base-card-header-title-editable' : ''}`}
                        title={titleEditTooltip || titleTooltip || title}
                        onClick={isTitleEditable ? handleStartTitleEdit : undefined}
                      >
                        {title}
                      </h1>
                    ) : (
                      titleTooltip ? (
                        <div className="min-w-0 truncate base-card-header-title" title={titleTooltip}>
                          {title}
                        </div>
                      ) : (
                        title
                      )
                    )}

                    {isTitleEditable && (
                      <button
                        type="button"
                        onClick={handleStartTitleEdit}
                        className="title-edit-btn"
                        title={titleEditTooltip || t('common.edit', 'Düzenle')}
                        aria-label={titleEditTooltip || t('common.edit', 'Düzenle')}
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {breadcrumb && (
              <div className="base-page-breadcrumb">
                {breadcrumb}
              </div>
            )}

            {(subLeft || subtitleRight) && (
              <div className="flex items-center gap-8 text-secondary text-13 min-w-0">
                {subLeft && (
                  <div className="flex items-center gap-6 text-13 text-secondary min-w-0">
                    <span className="flex items-center gap-6 text-13 text-secondary min-w-0">
                      {subLeft}
                    </span>
                    {onSubtitleEdit && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onSubtitleEdit();
                        }}
                        className="title-edit-btn subtitle-edit-btn"
                        title={subtitleEditTooltip || 'Düzenle'}
                        aria-label={subtitleEditTooltip || 'Düzenle'}
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                  </div>
                )}
                {subLeft && subtitleRight && <span className="text-muted opacity-50">•</span>}
                {subtitleRight && (
                  <span className="chip-primary px-6 py-2 text-11">
                    {subtitleRight}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {actionContent && (
          <div className="base-card-header-actions flex items-center gap-8 flex-shrink-0">
            {actionContent}
          </div>
        )}

        {children}
      </BaseCard>
    );
  }
);

BaseCardPageHeader.displayName = 'BaseCardPageHeader';

export default BaseCardPageHeader;
