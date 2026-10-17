import { useEffect, RefObject } from 'react';

/**
 * Sayfa veya Modal açıldığında form içerisindeki ilk uygun (görünür ve etkileşimli)
 * input elementine otomatik odaklanmayı (auto-focus) sağlayan global hook.
 * 
 * @param containerRef Odaklanılacak elementlerin aranacağı ana DOM nesnesi (zorunlu değil, verilmezse document içinde arar)
 * @param dependencies Hook'un yeniden tetiklenmesini sağlayacak bağımlılık dizisi (Örn: modal isOpen state'i veya veri yüklenme state'i)
 */
export const useFormAutoFocus = (containerRef?: RefObject<HTMLElement>, dependencies: any[] = []) => {
    useEffect(() => {
        // Kullanıcı etkileşimi (tıklama, klavye, dokunma) algılanırsa
        // bekleyen auto-focus timer'ını iptal et.
        // Bu, satır ekleme butonu gibi aksiyonlar sırasında yanlış bir alana
        // (ör. header'daki Tarih) odaklanılmasını önler.
        let interactionCancelled = false;
        const cancelOnInteraction = () => { interactionCancelled = true; };

        document.addEventListener('mousedown', cancelOnInteraction, { once: true, capture: true });
        document.addEventListener('keydown', cancelOnInteraction, { once: true, capture: true });
        document.addEventListener('touchstart', cancelOnInteraction, { once: true, capture: true });

        // Kısa bir gecikme ekliyoruz ki render tamamlanıp DOM'a elemanlar tam olarak yerleşsin 
        // (özellikle animasyonlu modallar veya API'den asenkron veri çeken formlar için)
        const timeout = setTimeout(() => {
            // Kullanıcı bu süre içinde etkileşim yaptıysa (ör. bir butona tıkladıysa) odaklanma.
            if (interactionCancelled) return;

            const rootNode = containerRef?.current || document;
            
            // Eğer odak zaten aktif bir form elemanı (input, select, textarea vb.) veya container içindeyse focus'u çalma.
            const activeEl = document.activeElement;
            if (activeEl && activeEl !== document.body && activeEl !== document.documentElement) {
                const tag = activeEl.tagName?.toUpperCase();
                if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || activeEl.getAttribute('tabindex') !== null) {
                    return;
                }
            }
            if (containerRef?.current && containerRef.current.contains(activeEl)) {
                return;
            }

            // Focusable elementleri bul (input, select, textarea)
            // type="hidden", disabled, readonly ve tabindex="-1" olanları dışla.
            // Ayrıca BaseDropdownSecici içindeki özel inputlar için id'si "-input" ile bitenleri de kapsayabiliriz.
            const focusableElements = rootNode.querySelectorAll<HTMLElement>(
                'input:not([disabled]):not([type="hidden"]):not([readonly]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );

            // İlk uygun (görünür ve etkileşimli) elemanı bul
            for (let i = 0; i < focusableElements.length; i++) {
                const el = focusableElements[i];
                
                // Elemanın görünürlüğünü kontrol et
                const style = window.getComputedStyle(el);
                if (style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0 && el.offsetHeight > 0) {
                    
                    // Eğer eleman buton ise ve özellikle input arıyorsak onu atlayabiliriz, ancak form başındaysa odaklanılabilir.
                    // Genellikle form başındaki ilk eleman input olur.
                    el.focus({ preventScroll: true });
                    break;
                }
            }
        }, 150);

        return () => {
            clearTimeout(timeout);
            document.removeEventListener('mousedown', cancelOnInteraction, { capture: true });
            document.removeEventListener('keydown', cancelOnInteraction, { capture: true });
            document.removeEventListener('touchstart', cancelOnInteraction, { capture: true });
        };
    }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps
};
