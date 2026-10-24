/**
 * @file useAdminAutoFocus.ts
 * @description 
 * Webakus AdminUI sayfalarında ve form modallarında (FirmaForm, SektörForm vb.)
 * bileşen yüklendiğinde ilk etkileşimli ve görünür form elemanına (input/select)
 * otomatik odaklanmayı (auto-focus) sağlayan kanca (hook).
 * 
 * Başlıca Görevleri:
 * - Sayfa veya modal açıldığında ilk input alanına odaklanır
 * - DOM render gecikmelerini ve animasyon sürelerini tolere eder
 * - Kullanıcı form açılır açılmaz bir yere tıkladıysa odağı çalmaz (interaction-safe)
 */

import { useEffect, RefObject } from 'react';

export const useAdminAutoFocus = (containerRef?: RefObject<HTMLElement>, dependencies: any[] = []) => {
    useEffect(() => {
        let interactionCancelled = false;
        const cancelOnInteraction = () => { interactionCancelled = true; };

        document.addEventListener('mousedown', cancelOnInteraction, { once: true, capture: true });
        document.addEventListener('keydown', cancelOnInteraction, { once: true, capture: true });
        document.addEventListener('touchstart', cancelOnInteraction, { once: true, capture: true });

        const timeout = setTimeout(() => {
            if (interactionCancelled) return;

            const rootNode = containerRef?.current || document;
            
            // Eğer odak zaten aktif bir form elemanı üzerindeyse odağı değiştirme
            const activeEl = document.activeElement;
            if (activeEl && activeEl !== document.body && activeEl !== document.documentElement) {
                const tag = activeEl.tagName?.toUpperCase();
                if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || activeEl.getAttribute('tabindex') !== null) {
                    return;
                }
            }

            const focusableElements = rootNode.querySelectorAll<HTMLElement>(
                'input:not([disabled]):not([type="hidden"]):not([readonly]), select:not([disabled]), textarea:not([disabled])'
            );

            for (let i = 0; i < focusableElements.length; i++) {
                const el = focusableElements[i];
                const style = window.getComputedStyle(el);
                if (style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0 && el.offsetHeight > 0) {
                    el.focus();
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
