/**
 * @file useAdminValidation.ts
 * @description 
 * Webakus Admin paneli (Webakus.AdminUI) formları için generic hata state yönetimi
 * ve form doğrulama (validation) kancasıdır.
 * 
 * Başlıca Görevleri:
 * - Admin formlarında errors state'ini yönetmek (`errors`, `setErrors`)
 * - Tekil alan veya toplu hata temizleme (`clearError`, `clearErrors`)
 * - Modüle özel validasyon fonksiyonlarını çalıştırıp sonuç hatalarını state'e aktarma (`validate`)
 */

import { useState, useCallback } from 'react';

export const useAdminValidation = () => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const clearError = useCallback((fieldName: string) => {
        setErrors((prev) => {
            if (!prev[fieldName]) return prev;
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }, []);

    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);

    const setFieldError = useCallback((fieldName: string, message: string) => {
        setErrors((prev) => ({ ...prev, [fieldName]: message }));
    }, []);

    /**
     * Modül seviyesindeki saf doğrulama fonksiyonunu (pure validator) çalıştırır
     * ve hata nesnesini güncelleyerek formun geçerli olup olmadığını döner.
     */
    const validate = useCallback((
        validationFn: (data: any, ...args: any[]) => Record<string, string>,
        data: any,
        ...args: any[]
    ): boolean => {
        const resultErrors = validationFn(data, ...args) || {};
        setErrors(resultErrors);
        return Object.keys(resultErrors).length === 0;
    }, []);

    return {
        errors,
        setErrors,
        clearError,
        clearErrors,
        setFieldError,
        validate
    };
};

export default useAdminValidation;
