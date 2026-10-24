/**
 * Webakus ERP - Yapay Zeka Sohbet ve Durum Yönetimi Context Sağlayıcısı (AiChatContext).
 * Aktif oturumlar, mesaj geçmişi, aktif sayfa bağlamı (pageContext), uzman ajanlar (agents)
 * ve rotaya göre otomatik uzman ajan seçimi mantığını yönetir.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export interface AiSession {
    id: number;
    baslik: string;
    aiAjanId?: number;
    aiAjanAdi?: string;
    sonAktiviteTarihi: string;
    sonMesajOzet?: string;
    mesajSayisi: number;
}

export interface AiMessage {
    id: number;
    aiSohbetOturumuId: number;
    role: 'user' | 'assistant' | 'system' | 'tool';
    icerik: string;
    eylemVerisiJson?: string;
    sayfaBaglami?: string;
    modelBilgisi?: string;
    islemSuresiMs?: number;
    canliLlmMi?: boolean;
    tarih: string;
}

export type AiPanelMode = 'docked' | 'floating' | 'collapsed';

export interface AiPageContext {
    route: string;
    title?: string;
    documentType?: string;
    data?: any;
}

/**
 * Aktif sayfa rotasını analiz ederek uygun AI Uzman Ajan kodunu tespit eder.
 */
export const resolveRouteToAgentCode = (pathname: string): string | null => {
    const cleanPath = (pathname || '').split('?')[0].toLowerCase();

    // 1. Kampanyalar & Fiyat Farkı & Fiyat Listeleri
    if (
        cleanPath.startsWith('/kampanyalar') ||
        cleanPath.startsWith('/bsh-fiyat-farki') ||
        cleanPath.startsWith('/fiyat-listeleri') ||
        cleanPath.startsWith('/fiyat-liste-tanimlari')
    ) {
        return 'KAMPANYA_UZMANI';
    }

    // 2. Stok & Envanter & Depo Yönetimi & Ürünler
    if (
        cleanPath.startsWith('/urun-ve-hizmetler') ||
        cleanPath.startsWith('/depo-hareketleri') ||
        cleanPath.startsWith('/depolar') ||
        cleanPath.startsWith('/sayim-fisleri') ||
        cleanPath.startsWith('/stok-hareketleri') ||
        cleanPath.startsWith('/kargo-firmalari') ||
        cleanPath.startsWith('/barkod-terminali') ||
        cleanPath.startsWith('/ozellik-tanimlari')
    ) {
        return 'STOK_UZMANI';
    }

    // 3. Sipariş, Fatura, İrsaliye Belge Otomasyonu
    if (
        cleanPath.startsWith('/siparisler') ||
        cleanPath.startsWith('/faturalar') ||
        cleanPath.startsWith('/irsaliyeler') ||
        cleanPath.startsWith('/irsaliyeli-faturalar') ||
        cleanPath.startsWith('/pos-komisyon-belgeleri') ||
        cleanPath.startsWith('/tuketici-kredisi-komisyon-belgeleri')
    ) {
        return 'SIPARIS_ASISTANI';
    }

    // 4. Finans, Cari, Kasa, Banka, Çek-Senet
    if (
        cleanPath.startsWith('/cariler') ||
        cleanPath.startsWith('/kasalar') ||
        cleanPath.startsWith('/kasa-hareketleri') ||
        cleanPath.startsWith('/kasa-virman') ||
        cleanPath.startsWith('/kasa-banka-islemleri') ||
        cleanPath.startsWith('/kasa-doviz-islemleri') ||
        cleanPath.startsWith('/bankalar') ||
        cleanPath.startsWith('/banka-hesaplari') ||
        cleanPath.startsWith('/banka-virman') ||
        cleanPath.startsWith('/banka-doviz-islemleri') ||
        cleanPath.startsWith('/banka-gelir-gider-fisleri') ||
        cleanPath.startsWith('/cek-senet-bordrolari') ||
        cleanPath.startsWith('/gelir-gider-kartlari') ||
        cleanPath.startsWith('/kdv-oranlari')
    ) {
        return 'FINANS_UZMANI';
    }

    // 5. Admin / Sistem Yönetimi
    if (
        cleanPath.startsWith('/firmalar') ||
        cleanPath.startsWith('/kullanicilar') ||
        cleanPath.startsWith('/sistem-ayarlari') ||
        cleanPath.startsWith('/denetim-loglari') ||
        cleanPath.startsWith('/modul-yonetimi') ||
        cleanPath.startsWith('/faaliyet-alanlari')
    ) {
        return 'ADMIN_SISTEM_UZMANI';
    }

    return null;
};

/**
 * Rota ve mevcut ajan listesini eşleştirerek ilgili uzman ajanı döndürür.
 */
export const matchAgentForRoute = (route: string, agents: any[]): any | null => {
    if (!route || !Array.isArray(agents) || agents.length === 0) return null;
    const targetCode = resolveRouteToAgentCode(route);
    if (!targetCode) return null;

    return agents.find(a => 
        (a.kod && a.kod.toUpperCase() === targetCode.toUpperCase()) ||
        (targetCode === 'KAMPANYA_UZMANI' && (a.ad?.toLowerCase().includes('kampanya') || a.ad?.toLowerCase().includes('fiyat farkı'))) ||
        (targetCode === 'STOK_UZMANI' && (a.ad?.toLowerCase().includes('stok') || a.ad?.toLowerCase().includes('envanter'))) ||
        (targetCode === 'SIPARIS_ASISTANI' && (a.ad?.toLowerCase().includes('sipariş') || a.ad?.toLowerCase().includes('fatura') || a.ad?.toLowerCase().includes('belge'))) ||
        (targetCode === 'FINANS_UZMANI' && (a.ad?.toLowerCase().includes('finans') || a.ad?.toLowerCase().includes('cari'))) ||
        (targetCode === 'ADMIN_SISTEM_UZMANI' && (a.ad?.toLowerCase().includes('admin') || a.ad?.toLowerCase().includes('sistem')))
    ) || null;
};

export interface AiChatContextType {
    isOpen: boolean;
    panelMode: AiPanelMode;
    setPanelMode: (mode: AiPanelMode) => void;
    togglePanel: () => void;
    openPanel: () => void;
    closePanel: () => void;
    sessions: AiSession[];
    activeSessionId: number | null;
    setActiveSessionId: (id: number | null) => void;
    messages: AiMessage[];
    loading: boolean;
    isSending: boolean;
    sendMessage: (text: string, customAgentId?: number) => Promise<void>;
    stopGenerating: () => void;
    createNewSession: (title?: string) => Promise<number | null>;
    startNewSession: () => Promise<void>;
    deleteSession: (id: number) => Promise<void>;
    renameSession: (id: number, newTitle: string) => Promise<void>;
    pageContext: AiPageContext;
    setPageContext: React.Dispatch<React.SetStateAction<AiPageContext>>;
    agents: any[];
    selectedAgentId: number | null;
    setSelectedAgentId: (id: number | null) => void;
    refreshSessions: () => Promise<void>;
}

const AiChatContext = createContext<AiChatContextType | undefined>(undefined);

export const AiChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const isInitialMountRef = useRef<boolean>(true);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [isOpen, setIsOpen] = useState<boolean>(() => {
        return localStorage.getItem('webakus_ai_panel_open') === 'true';
    });

    const [panelMode, setPanelModeState] = useState<AiPanelMode>(() => {
        return (localStorage.getItem('webakus_ai_panel_mode') as AiPanelMode) || 'docked';
    });

    const [sessions, setSessions] = useState<AiSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<number | null>(() => {
        const saved = localStorage.getItem('webakus_ai_active_session');
        return saved ? parseInt(saved, 10) : null;
    });

    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [agents, setAgents] = useState<any[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);

    const [pageContext, setPageContextState] = useState<AiPageContext>({
        route: typeof window !== 'undefined' ? window.location.pathname : '/'
    });

    // Yeni temiz oturum oluştur ve aktif yap
    const startNewSession = useCallback(async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (token) {
                const res = await axios.post('/api/AiChat/oturumlar', {
                    baslik: 'Yeni Sohbet',
                    aiAjanId: selectedAgentId
                });
                if (res.data && res.data.id) {
                    setSessions(prev => [res.data, ...prev.filter(s => s.id !== res.data.id)]);
                    setActiveSessionId(res.data.id);
                    setMessages([]);
                    localStorage.setItem('webakus_ai_active_session', String(res.data.id));
                    toast.success('Yeni sohbet başlatıldı.');
                    return;
                }
            }
        } catch {
            // Offline / sessiz fallback
        }
        setActiveSessionId(null);
        setMessages([]);
        localStorage.removeItem('webakus_ai_active_session');
        toast.success('Yeni sohbet başlatıldı.');
    }, [selectedAgentId]);

    // Sayfa bağlamı değiştiğinde oturumu sıfırla
    const setPageContext = useCallback((newContext: AiPageContext | ((prev: AiPageContext) => AiPageContext)) => {
        setPageContextState(prev => {
            const next = typeof newContext === 'function' ? newContext(prev) : newContext;
            if (next.route && prev.route && next.route !== prev.route) {
                // Farklı bir belge/sayfaya geçildiğinde yeni bir oturum başlat
                setActiveSessionId(null);
                setMessages([]);
                localStorage.removeItem('webakus_ai_active_session');
            }
            return next;
        });
    }, []);

    // Panel durumunu localStorage'a kaydet
    const setPanelMode = (mode: AiPanelMode) => {
        setPanelModeState(mode);
        localStorage.setItem('webakus_ai_panel_mode', mode);
    };

    const togglePanel = () => {
        setIsOpen(prev => {
            const next = !prev;
            localStorage.setItem('webakus_ai_panel_open', String(next));
            return next;
        });
    };

    const openPanel = () => {
        setIsOpen(true);
        localStorage.setItem('webakus_ai_panel_open', 'true');
    };

    const closePanel = () => {
        setIsOpen(false);
        localStorage.setItem('webakus_ai_panel_open', 'false');
    };

    // Ajan listesini getir
    const fetchAgents = useCallback(async () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;
        try {
            const res = await axios.get('/api/AiAjanlar');
            if (Array.isArray(res.data)) {
                setAgents(res.data);
            }
        } catch {
            // Sessiz geç
        }
    }, []);

    // Oturumları API'den çek
    const refreshSessions = useCallback(async () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;
        try {
            const res = await axios.get('/api/AiChat/oturumlar');
            if (Array.isArray(res.data)) {
                setSessions(res.data);
                if (isInitialMountRef.current) {
                    isInitialMountRef.current = false;
                    const savedId = localStorage.getItem('webakus_ai_active_session');
                    if (savedId) {
                        const parsed = parseInt(savedId, 10);
                        if (res.data.some((s: any) => s.id === parsed)) {
                            setActiveSessionId(parsed);
                            return;
                        }
                    }
                    if (res.data.length > 0) {
                        setActiveSessionId(res.data[0].id);
                    }
                }
            }
        } catch {
            // API henüz hazır değilse sessiz geç
        }
    }, []);

    // Aktif oturumun mesajlarını çek
    const fetchMessages = useCallback(async (sessionId: number) => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/AiChat/oturumlar/${sessionId}/mesajlar`);
            if (Array.isArray(res.data)) {
                setMessages(res.data);
            }
        } catch {
            setMessages([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgents();
        refreshSessions();
    }, [fetchAgents, refreshSessions]);

    useEffect(() => {
        if (activeSessionId) {
            localStorage.setItem('webakus_ai_active_session', String(activeSessionId));
            fetchMessages(activeSessionId);
            const currentSession = sessions.find(s => s.id === activeSessionId);
            if (currentSession && currentSession.aiAjanId !== undefined && currentSession.aiAjanId !== null) {
                setSelectedAgentId(currentSession.aiAjanId);
            }
        } else {
            setMessages([]);
        }
    }, [activeSessionId, fetchMessages, sessions]);

    // Rota değiştikçe veya ajanlar yüklendikçe otomatik ilgili ajanı seç
    useEffect(() => {
        if (!pageContext.route || agents.length === 0) return;

        // Eğer aktif bir oturum seçiliyse ve oturumun kendi atanmış ajanı varsa onu koru
        const currentSession = sessions.find(s => s.id === activeSessionId);
        if (currentSession && currentSession.aiAjanId) {
            setSelectedAgentId(currentSession.aiAjanId);
            return;
        }

        const matchedAgent = matchAgentForRoute(pageContext.route, agents);
        if (matchedAgent) {
            setSelectedAgentId(matchedAgent.id);
        } else if (!activeSessionId) {
            setSelectedAgentId(null);
        }
    }, [pageContext.route, agents, activeSessionId, sessions]);

    // Yeni Oturum Oluştur
    const createNewSession = async (title: string = 'Yeni Sohbet'): Promise<number | null> => {
        try {
            const res = await axios.post('/api/AiChat/oturumlar', {
                baslik: title,
                aiAjanId: selectedAgentId
            });
            if (res.data && res.data.id) {
                setSessions(prev => [res.data, ...prev.filter(s => s.id !== res.data.id)]);
                setActiveSessionId(res.data.id);
                setMessages([]);
                localStorage.setItem('webakus_ai_active_session', String(res.data.id));
                toast.success('Yeni sohbet başlatıldı.');
                return res.data.id;
            }
        } catch (err: any) {
            toast.error('Yeni oturum oluşturulamadı.');
        }
        return null;
    };

    // Oturum Sil
    const deleteSession = async (id: number) => {
        try {
            await axios.delete(`/api/AiChat/oturumlar/${id}`);
            setSessions(prev => prev.filter(s => s.id !== id));
            if (activeSessionId === id) {
                const remaining = sessions.filter(s => s.id !== id);
                setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
            }
            toast.success('Oturum silindi.');
        } catch {
            toast.error('Oturum silinemedi.');
        }
    };

    // Oturum Yeniden Adlandır
    const renameSession = async (id: number, newTitle: string) => {
        if (!newTitle.trim()) return;
        try {
            await axios.put(`/api/AiChat/oturumlar/${id}`, { baslik: newTitle.trim() });
            setSessions(prev => prev.map(s => s.id === id ? { ...s, baslik: newTitle.trim() } : s));
            toast.success('Oturum adı güncellendi.');
        } catch {
            toast.error('Oturum güncellenemedi.');
        }
    };

    // Yanıt Üretimini Durdur (Stop Generating)
    const stopGenerating = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsSending(false);
        setMessages(prev => [
            ...prev,
            {
                id: Date.now(),
                aiSohbetOturumuId: activeSessionId || 0,
                role: 'assistant',
                icerik: '⏹️ Yanıt üretimi kullanıcı tarafından durduruldu.',
                tarih: new Date().toISOString()
            }
        ]);
        toast('Yapay zeka yanıtı durduruldu.', { icon: '⏹️' });
    }, [activeSessionId]);

    // Mesaj Gönder
    const sendMessage = async (text: string, customAgentId?: number) => {
        if (!text.trim() || isSending) return;

        const optimisticUserMessage: AiMessage = {
            id: Date.now(),
            aiSohbetOturumuId: activeSessionId || 0,
            role: 'user',
            icerik: text.trim(),
            sayfaBaglami: pageContext.route,
            tarih: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticUserMessage]);
        setIsSending(true);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const payload = {
                aiSohbetOturumuId: activeSessionId,
                mesaj: text.trim(),
                sayfaBaglami: pageContext.route,
                aiAjanId: customAgentId || selectedAgentId
            };

            const res = await axios.post('/api/AiChat/mesaj-gonder', payload, {
                signal: controller.signal
            });

            if (res.data) {
                const { oturumId, oturumBaslik, asistanCevabi } = res.data;

                // Eğer yeni oturum id geldiyse güncelle
                if (!activeSessionId || activeSessionId !== oturumId) {
                    setActiveSessionId(oturumId);
                    setSessions(prev => {
                        const exists = prev.some(s => s.id === oturumId);
                        if (!exists) {
                            return [{
                                id: oturumId,
                                baslik: oturumBaslik || text.substring(0, 30),
                                sonAktiviteTarihi: new Date().toISOString(),
                                sonMesajOzet: asistanCevabi?.icerik?.substring(0, 80),
                                mesajSayisi: 2
                            }, ...prev];
                        }
                        return prev;
                    });
                }

                if (asistanCevabi) {
                    setMessages(prev => [...prev, asistanCevabi]);
                }
            }
        } catch (err: any) {
            // Kullanıcı bilinçli olarak durdurduysa hata fırlatma
            if (axios.isCancel(err) || err.name === 'CanceledError' || err.code === 'ERR_CANCELED' || err.response?.status === 499) {
                return;
            }

            const errorMessage: AiMessage = {
                id: Date.now() + 1,
                aiSohbetOturumuId: activeSessionId || 0,
                role: 'assistant',
                icerik: '⚠️ Yanıt alınırken bir hata oluştu: ' + (err.response?.data?.mesaj || err.message || 'Bilinmeyen hata'),
                tarih: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            abortControllerRef.current = null;
            setIsSending(false);
        }
    };

    return (
        <AiChatContext.Provider
            value={{
                isOpen,
                panelMode,
                setPanelMode,
                togglePanel,
                openPanel,
                closePanel,
                sessions,
                activeSessionId,
                setActiveSessionId,
                messages,
                loading,
                isSending,
                sendMessage,
                stopGenerating,
                createNewSession,
                startNewSession,
                deleteSession,
                renameSession,
                pageContext,
                setPageContext,
                agents,
                selectedAgentId,
                setSelectedAgentId,
                refreshSessions
            }}
        >
            {children}
        </AiChatContext.Provider>
    );
};

export const useAiChat = () => {
    const context = useContext(AiChatContext);
    if (!context) {
        throw new Error('useAiChat must be used within an AiChatProvider');
    }
    return context;
};
