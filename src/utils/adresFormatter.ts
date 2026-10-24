export interface FormatAdresParams {
  ilAdi?: string | null;
  ilceAdi?: string | null;
  acikAdres?: string | null;
}

export const formatAdres = ({ ilAdi, ilceAdi, acikAdres }: FormatAdresParams) => {
  const ilStr = ilAdi ? ilAdi.trim() : '';
  const ilceStr = ilceAdi ? ilceAdi.trim() : '';
  const acikStr = acikAdres ? acikAdres.trim() : '';

  if (ilStr && ilceStr) {
    return acikStr ? `${acikStr} ${ilceStr} / ${ilStr}` : `${ilceStr} / ${ilStr}`;
  } else if (ilStr) {
    return acikStr ? `${acikStr} ${ilStr}` : ilStr;
  }
  
  return acikStr || 'Adres belirtilmemiş';
};
