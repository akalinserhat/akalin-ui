// @ts-nocheck
import React, { useEffect, useRef, useCallback } from 'react';
import { useHeaderApi, useAlertDialog, BackButton } from '@akalin/ui';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from './usePageTitle';

/**
 * Bu hook, sayfa yüklendiğinde .content-area div'ine 'content-area-document' class'ını ekler.
 * Böylece Fatura, Sipariş, İrsaliye gibi belge form ekranları BaseListPage standartlarındaki dış boşluklara
 * (var(--content-area-padding, 16px 24px 24px 24px)), tam ekran (flex-1) ve scroll-sız (overflow-hidden)
 * düzenli bir görünüme sahip olur.
 * Sayfadan çıkıldığında bu class otomatik olarak silinir ve standart görünüm geri gelir.
 * Ayrıca, form açıldığında browser tab başlığını '[Sayfa Başlığı] | Webakus' olarak ayarlar.
 * Formda kaydedilmemiş değişiklikler varken geri düğmesine basıldığında onay modalı açar.
 */
export const useDocumentLayout = (
    title?: string, 
    onBack: any = null, 
    customHeaderContent: any = null, 
    rightHeaderContent: any = null,
    isDocument: boolean = true
) => {
    usePageTitle(title);
    const { t } = useTranslation();
    const { showAlert } = useAlertDialog();
    const headerApi = useHeaderApi();
    const setHeader = headerApi?.setHeader;
    const clearHeader = headerApi?.clearHeader;
    const isDocumentDirty = headerApi?.isDocumentDirty ?? false;
    const setIsDocumentDirty = headerApi?.setIsDocumentDirty;
    const documentBackInterceptor = headerApi?.documentBackInterceptor ?? null;
    const onBackRef = useRef(onBack);
    const headerIdRef = useRef(Math.random().toString(36).substr(2, 9));
    const documentBackInterceptorRef = useRef(documentBackInterceptor);

    useEffect(() => {
        documentBackInterceptorRef.current = documentBackInterceptor;
    }, [documentBackInterceptor]);

    useEffect(() => {
        onBackRef.current = onBack;
    }, [onBack]);

    // Sayfa/form ilk açıldığında kaydedilmemiş değişiklik bayrağını temizle
    useEffect(() => {
        if (typeof setIsDocumentDirty === 'function') {
            setIsDocumentDirty(false);
        }
    }, [setIsDocumentDirty]);

    // Sayfa yenileme veya sekme kapatma durumunda tarayıcı uyarısı
    useEffect(() => {
        if (!isDocumentDirty) return;
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDocumentDirty]);

    const isCloudRoute = typeof window !== 'undefined' && window.location.pathname.endsWith('/bulut-dosyalari');
    const isExcelImportRoute = typeof window !== 'undefined' && window.location.pathname.endsWith('/excel-import');
    const isCariSecimRoute = typeof window !== 'undefined' && window.location.pathname.endsWith('/cari-secim');
    const isSubRoute = isCloudRoute || isExcelImportRoute || isCariSecimRoute;
    const effectiveIsDocument = isDocument && !isSubRoute;

    const isDocumentDirtyRef = useRef(isDocumentDirty);
    useEffect(() => {
        isDocumentDirtyRef.current = isDocumentDirty;
    }, [isDocumentDirty]);

    const handleBackClick = useCallback(async (e: any) => {
        if (documentBackInterceptorRef.current) {
            try {
                const canExit = await documentBackInterceptorRef.current();
                if (!canExit) {
                    return;
                }
            } catch (err) {
                console.error('useDocumentLayout back interceptor error:', err);
            }
        }

        if (isDocumentDirtyRef.current) {
            showAlert(
                'confirm',
                t('common.unsaved_changes', 'Kaydedilmemiş Değişiklikler'),
                t('common.unsaved_changes_confirm', 'Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinize emin misiniz?'),
                () => {
                    if (typeof setIsDocumentDirty === 'function') {
                        setIsDocumentDirty(false);
                    }
                    if (onBackRef.current) {
                        onBackRef.current(e);
                    }
                },
                t('common.yes_exit', 'Evet, Çık'),
                t('common.cancel', 'İptal')
            );
        } else {
            if (onBackRef.current) {
                onBackRef.current(e);
            }
        }
    }, [showAlert, t, setIsDocumentDirty]);

    useEffect(() => {
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            if (effectiveIsDocument) {
                contentArea.classList.add('content-area-document');
            } else {
                contentArea.classList.remove('content-area-document');
            }
        }
        
        if (!isSubRoute && (onBack || customHeaderContent || (!onBack && title))) {
            if (typeof setHeader === 'function') {
                setHeader(
                    headerIdRef.current,
                    <div className="flex-row items-center justify-between w-full">
                        <div className="flex-row items-center gap-12 flex-1 min-w-0">
                            {onBack && (
                                <BackButton onClick={handleBackClick} />
                            )}
                            {customHeaderContent ? (
                                customHeaderContent
                            ) : (!onBack && title ? (
                                <h2 className="m-0 text-lg font-bold">
                                    {title}
                                </h2>
                            ) : null)}
                        </div>
                        {rightHeaderContent && (
                            <div className="flex-row items-center gap-8">
                                {rightHeaderContent}
                            </div>
                        )}
                    </div>
                );
            }
        }

        return () => {
            if (contentArea) {
                contentArea.classList.remove('content-area-document');
            }
            if (typeof clearHeader === 'function') {
                clearHeader(headerIdRef.current);
            }
            if (typeof setIsDocumentDirty === 'function') {
                setIsDocumentDirty(false);
            }
        };
    }, [title, setHeader, clearHeader, customHeaderContent, rightHeaderContent, onBack, effectiveIsDocument, isCloudRoute, handleBackClick, setIsDocumentDirty]);
};

