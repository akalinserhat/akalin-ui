import { Capacitor } from '@capacitor/core';

/**
 * Uygulamanın Capacitor ile derlenmiş native bir ortamda (Android/iOS uygulaması) çalışıp çalışmadığını döndürür.
 */
export const isNativePlatform = (): boolean => {
    return Capacitor.isNativePlatform();
};

/**
 * Kullanıcının mobil bir cihaz tarayıcısından (Brave, Safari, Chrome Android vb.) girip girmediğini döndürür.
 */
export const isMobileBrowser = (): boolean => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

/**
 * Kullanıcının genel olarak bir mobil cihazda (Native Uygulama VEYA Mobil Tarayıcı) olup olmadığını döndürür.
 */
export const isMobileDevice = (): boolean => {
    return isNativePlatform() || isMobileBrowser();
};
