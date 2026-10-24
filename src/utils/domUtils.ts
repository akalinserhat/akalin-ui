/**
 * @file domUtils.ts
 * @description Akalin UI - DOM, Title and Focus Helpers
 */

/**
 * Extracts plain text from a ReactNode or any value.
 */
export const extractTextFromNode = (node: any): string => {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string') {
    return node;
  }
  if (typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromNode).filter(Boolean).join(' ');
  }
  if (typeof node === 'object' && node.props && node.props.children) {
    return extractTextFromNode(node.props.children);
  }
  return '';
};

/**
 * Sets document.title formatted as "[Title] | Akalin UI".
 */
export const updateDocumentTitle = (title?: any, brandSuffix = 'Akalin UI'): void => {
  if (typeof document === 'undefined') return;
  const clean = extractTextFromNode(title).trim();
  if (clean) {
    document.title = `${clean} | ${brandSuffix}`;
  }
};

/**
 * Checks whether an element is an interactive input candidate.
 * Includes text inputs, number, email, date, selects, textareas,
 * and specifically .dropdown-secici-wrapper inputs (even if readOnly).
 */
export const isInteractiveInputElement = (el: HTMLElement): boolean => {
  if (el.hasAttribute('disabled')) return false;
  if (el.getAttribute('type') === 'hidden') return false;
  if (el.getAttribute('tabindex') === '-1') return false;

  // Görünürlük kontrolü
  if (el.offsetWidth === 0 && el.offsetHeight === 0) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;

  const tag = el.tagName.toUpperCase();
  if (tag === 'SELECT' || tag === 'TEXTAREA') return true;
  if (tag === 'INPUT') {
    const input = el as HTMLInputElement;
    // Eğer readOnly ise, yalnızca dropdown seçiciler (.dropdown-secici-wrapper veya form-input) odaklanabilir
    if (input.readOnly && !input.closest('.dropdown-secici-wrapper') && !input.classList.contains('form-input')) {
      return false;
    }
    return true;
  }

  return false;
};

/**
 * Automatically focuses the first interactive, visible input within a container or document.
 */
export const autoFocusFirstInput = (container?: HTMLElement | null): void => {
  if (typeof document === 'undefined') return;

  const rootNode = container || document;
  const activeEl = document.activeElement;

  if (activeEl && activeEl !== document.body && activeEl !== document.documentElement) {
    const tag = activeEl.tagName?.toUpperCase();
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || activeEl.getAttribute('tabindex') !== null) {
      return;
    }
  }

  if (container && container.contains(activeEl)) {
    return;
  }

  const focusable = rootNode.querySelectorAll<HTMLElement>(
    'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  for (let i = 0; i < focusable.length; i++) {
    const el = focusable[i];
    if (isInteractiveInputElement(el)) {
      el.focus({ preventScroll: true });
      break;
    }
  }
};

/**
 * Moves focus to the next focusable interactive element within the nearest form/card/document container.
 * Specifically supports BaseDropdownSecici components, cascading dropdowns, and async-enabled inputs.
 */
export const focusNextElement = (currentElement: HTMLElement | null, container?: HTMLElement | null): boolean => {
  if (!currentElement || typeof document === 'undefined') return false;

  // 1. Kapsayıcı konteyneri bul (BaseCardPage, BaseDocumentPage, form, panel veya document)
  const root = container || currentElement.closest(
    '.base-card-page, .base-document-page, .document-page-header, form, .base-page-content-area, .content-area'
  ) as HTMLElement || document.body;

  // 2. Mevcut input'u belirle
  const currentInput = (currentElement.tagName === 'INPUT' || currentElement.tagName === 'SELECT' || currentElement.tagName === 'TEXTAREA')
    ? currentElement
    : (currentElement.querySelector('input, select, textarea') as HTMLElement) || currentElement;

  // 3. Konteyner içerisindeki tüm odaklanabilir girdi adaylarını bul
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(
    'input:not([type="hidden"]), select, textarea'
  )).filter(el => {
    if (el.getAttribute('type') === 'hidden' || el.getAttribute('tabindex') === '-1') return false;

    // Görünürlük kontrolü
    if (el.offsetWidth === 0 && el.offsetHeight === 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;

    if (el.tagName.toUpperCase() === 'INPUT') {
      const input = el as HTMLInputElement;
      if (input.readOnly && !input.closest('.dropdown-secici-wrapper') && !input.classList.contains('form-input')) {
        return false;
      }
    }
    return true;
  });

  const currentIndex = candidates.indexOf(currentInput);
  if (currentIndex === -1 || currentIndex >= candidates.length - 1) {
    return false;
  }

  const nextElement = candidates[currentIndex + 1];

  // 4. Kısa bir gecikmeyle (React re-render döngüsünden hemen sonra) odaklanmayı sağla
  setTimeout(() => {
    const activeEl = document.activeElement;
    // Eğer kullanıcı bu sürede başka bir form elemanına tıkladıysa/geçtiyse odağı çalma
    if (activeEl && activeEl !== document.body && activeEl !== document.documentElement &&
        activeEl !== currentInput && activeEl !== nextElement &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA')) {
      return;
    }

    if (!nextElement.hasAttribute('disabled')) {
      nextElement.focus();
      if ((nextElement as HTMLInputElement).select && !(nextElement as HTMLInputElement).readOnly) {
        (nextElement as HTMLInputElement).select();
      }
    } else {
      // Eğer bir sonraki eleman asenkron yükleniyorsa (örneğin Banka seçildiğinde Şube listesi API'den çekilirken disabled ise),
      // 50ms aralıklarla (en fazla 1.5 sn) etkinleşmesini bekleyip odaklar.
      let attempts = 0;
      const maxAttempts = 30;
      const interval = setInterval(() => {
        attempts++;
        const currentActive = document.activeElement;
        if (currentActive && currentActive !== document.body && currentActive !== document.documentElement &&
            currentActive !== currentInput && currentActive !== nextElement &&
            (currentActive.tagName === 'INPUT' || currentActive.tagName === 'SELECT' || currentActive.tagName === 'TEXTAREA')) {
          clearInterval(interval);
          return;
        }

        if (!nextElement.hasAttribute('disabled')) {
          nextElement.focus();
          clearInterval(interval);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
        }
      }, 50);
    }
  }, 50);

  return true;
};

