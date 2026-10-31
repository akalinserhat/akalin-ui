/**
 * @file BaseJsonView.tsx
 * @description
 * @akalin/ui - JSON Verisi Görüntüleme Bileşeni (BaseJsonView / JsonView)
 *
 * Başlıca Sorumlulukları:
 * - JSON nesnelerini, dizilerini veya JSON metinlerini sade, okunabilir ve biçimlendirilmiş olarak ekranda göstermek
 * - Tek tıkla panoya kopyalama (copyable) ve opsiyonel başlık / alt başlık desteği sunmak
 * - Sıfır satır içi CSS (No Inline CSS) ve %100 i18n standartlarına uygun çalışmak
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Braces, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import './BaseJsonView.css';

export interface BaseJsonViewProps {
  id?: string;
  /** Gösterilecek JSON verisi (nesne, dizi veya JSON string) */
  data?: any;
  /** `data` için alternatif prop */
  value?: any;
  /** Opsiyonel üst başlık */
  title?: React.ReactNode;
  /** Opsiyonel alt açıklama */
  subtitle?: React.ReactNode;
  /** Üst başlık çubuğunu gizle (varsayılan: false) */
  hideHeader?: boolean;
  /** Kopyala düğmesini göster (varsayılan: true) */
  copyable?: boolean;
  /** JSON girinti boşluk sayısı (varsayılan: 2) */
  indent?: number;
  /** Veri boş olduğunda gösterilecek metin */
  emptyText?: string;
  className?: string;
}

export type JsonViewProps = BaseJsonViewProps;

export const BaseJsonView: React.FC<BaseJsonViewProps> = ({
  id,
  data,
  value,
  title,
  subtitle,
  hideHeader = false,
  copyable = true,
  indent = 2,
  emptyText,
  className = ''
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<boolean>(false);

  const effectivePayload = data !== undefined ? data : value;

  const formattedJson = useMemo<string>(() => {
    if (effectivePayload === undefined || effectivePayload === null) {
      return '';
    }
    if (typeof effectivePayload === 'string') {
      const trimmed = effectivePayload.trim();
      if (!trimmed) return '';
      try {
        const parsed = JSON.parse(trimmed);
        return JSON.stringify(parsed, null, indent);
      } catch {
        return effectivePayload;
      }
    }
    try {
      return JSON.stringify(effectivePayload, null, indent);
    } catch {
      return String(effectivePayload);
    }
  }, [effectivePayload, indent]);

  const handleCopy = () => {
    if (!formattedJson) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(formattedJson)
        .then(() => {
          setCopied(true);
          toast.success(t('json_verisi_kopyalandi', 'JSON verisi panoya kopyalandı.'));
          setTimeout(() => setCopied(false), 1800);
        })
        .catch(() => {
          toast.error(t('kopyalama_basarisiz', 'Kopyalama işlemi başarısız oldu.'));
        });
    }
  };

  const resolvedTitle = title !== undefined ? title : t('json_verisi', 'JSON Verisi');

  return (
    <div id={id} className={`akalin-json-view-card ${className}`.trim()}>
      {!hideHeader && (
        <div className="akalin-json-view-header">
          <div className="akalin-json-view-header-left">
            <div className="akalin-json-view-icon">
              <Braces size={16} />
            </div>
            <div className="akalin-json-view-titles">
              {resolvedTitle && <h4 className="akalin-json-view-title">{resolvedTitle}</h4>}
              {subtitle && <p className="akalin-json-view-subtitle">{subtitle}</p>}
            </div>
          </div>

          {copyable && formattedJson && (
            <button
              type="button"
              className={`akalin-json-view-copy-btn ${copied ? 'is-copied' : ''}`.trim()}
              onClick={handleCopy}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>
                {copied ? t('kopyalandi', 'Kopyalandı') : t('kopyala', 'Kopyala')}
              </span>
            </button>
          )}
        </div>
      )}

      {formattedJson ? (
        <div className="akalin-json-view-body">
          <pre className="akalin-json-view-pre">
            <code>{formattedJson}</code>
          </pre>
        </div>
      ) : (
        <div className="akalin-json-view-empty">
          {emptyText || t('gosterilecek_json_verisi_yok', 'Gösterilecek JSON verisi bulunmuyor.')}
        </div>
      )}
    </div>
  );
};

export const JsonView = BaseJsonView;
export default BaseJsonView;
