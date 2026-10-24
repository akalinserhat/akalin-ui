/**
 * Webakus UI Core - Modül Doğrulama & Tanıtım Hook'u (useModulGate)
 * 
 * Belirli bir modülün (Örn: 'MOD_ADRES', 'MOD_BULUT_DEPOLAMA') firmada aktif olup olmadığını denetler.
 * Modül aktif değilse kullanıcıya otomatik olarak ModulTanitimModal'ı açarak kampanya ve
 * satın alma yönlendirmesi sağlar.
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

let cachedActiveModules: string[] | null = null;
let activeModulesPromise: Promise<string[]> | null = null;

const checkModuleMatch = (activeList: string[], modulKodu: string): boolean => {
    const normalizedTarget = modulKodu.toLowerCase().replace(/[^a-z0-9]/g, '');
    return activeList.some((code) => {
        const normalizedActive = code.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedActive === normalizedTarget || 
               normalizedActive === normalizedTarget.replace(/^mod/, '') ||
               normalizedTarget === normalizedActive.replace(/^mod/, '');
    });
};

export interface UseModulGateOptions {
    modulKodu: string;
    onGranted?: () => void;
    onDenied?: () => void;
}

export function useModulGate(modulKodu: string) {
    const [isActive, setIsActive] = useState<boolean | null>(() => {
        if (cachedActiveModules) {
            return checkModuleMatch(cachedActiveModules, modulKodu);
        }
        return null;
    });
    const [isChecking, setIsChecking] = useState<boolean>(() => cachedActiveModules === null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const checkStatus = useCallback(async () => {
        if (cachedActiveModules) {
            const hasModule = checkModuleMatch(cachedActiveModules, modulKodu);
            setIsActive(hasModule);
            setIsChecking(false);
            return hasModule;
        }

        setIsChecking(true);
        try {
            if (!activeModulesPromise) {
                activeModulesPromise = axios.get('/api/Moduller/aktif').then(res => {
                    const list: string[] = Array.isArray(res.data) ? res.data : [];
                    cachedActiveModules = list;
                    return list;
                }).catch(err => {
                    activeModulesPromise = null;
                    return [];
                });
            }
            const activeList = await activeModulesPromise;
            cachedActiveModules = activeList;
            const hasModule = checkModuleMatch(activeList, modulKodu);

            setIsActive(hasModule);
            return hasModule;
        } catch (err) {
            console.error('[useModulGate] Aktif modüller kontrol edilemedi:', err);
            setIsActive(false);
            return false;
        } finally {
            setIsChecking(false);
        }
    }, [modulKodu]);

    useEffect(() => {
        if (modulKodu) {
            checkStatus();
        }
    }, [modulKodu, checkStatus]);

    /**
     * Modül aktif ise callback'i çalıştırır; aktif değilse Tanıtım/Reklam modalını açar.
     */
    const requireModule = useCallback(
        async (onGrantedCallback?: () => void) => {
            let active = isActive;
            if (active === null) {
                active = await checkStatus();
            }

            if (active) {
                if (typeof onGrantedCallback === 'function') {
                    onGrantedCallback();
                }
                return true;
            } else {
                setIsModalOpen(true);
                return false;
            }
        },
        [isActive, checkStatus]
    );

    const openModal = useCallback(() => setIsModalOpen(true), []);
    const closeModal = useCallback(() => setIsModalOpen(false), []);

    return {
        isActive,
        isChecking,
        isModalOpen,
        openModal,
        closeModal,
        requireModule,
        checkStatus
    };
}

export default useModulGate;
