import React, { createContext, useContext, useState, useRef, useCallback, useMemo } from 'react';

export type DocumentBackInterceptor = () => boolean | Promise<boolean>;

export interface HeaderContextType {
  headerContent: any;
  setHeaderContent: React.Dispatch<React.SetStateAction<any>>;
  setHeader: (id: string, content: any) => void;
  clearHeader: (id: string) => void;
  headerBreadcrumbOptions: any;
  setHeaderBreadcrumbOptions: React.Dispatch<React.SetStateAction<any>>;
  isDocumentDirty: boolean;
  setIsDocumentDirty: React.Dispatch<React.SetStateAction<boolean>>;
  documentBackInterceptor: DocumentBackInterceptor | null;
  setDocumentBackInterceptor: (fn: DocumentBackInterceptor | null) => void;
}

export interface HeaderApiContextType {
  setHeader: (id: string, content: any) => void;
  clearHeader: (id: string) => void;
  setHeaderBreadcrumbOptions: (options: any) => void;
  isDocumentDirty: boolean;
  setIsDocumentDirty: React.Dispatch<React.SetStateAction<boolean>>;
  documentBackInterceptor: DocumentBackInterceptor | null;
  setDocumentBackInterceptor: (fn: DocumentBackInterceptor | null) => void;
}

const defaultHeaderContext: HeaderContextType = {
  headerContent: null,
  setHeaderContent: () => {},
  setHeader: () => {},
  clearHeader: () => {},
  headerBreadcrumbOptions: null,
  setHeaderBreadcrumbOptions: () => {},
  isDocumentDirty: false,
  setIsDocumentDirty: () => {},
  documentBackInterceptor: null,
  setDocumentBackInterceptor: () => {}
};

const defaultHeaderApiContext: HeaderApiContextType = {
  setHeader: () => {},
  clearHeader: () => {},
  setHeaderBreadcrumbOptions: () => {},
  isDocumentDirty: false,
  setIsDocumentDirty: () => {},
  documentBackInterceptor: null,
  setDocumentBackInterceptor: () => {}
};

const HeaderContext = createContext<HeaderContextType>(defaultHeaderContext);
const HeaderApiContext = createContext<HeaderApiContextType>(defaultHeaderApiContext);

export const HeaderProvider = ({ children }: { children: React.ReactNode }) => {
    const [headerContent, setHeaderContent] = useState<any>(null);
    const [headerBreadcrumbOptions, setHeaderBreadcrumbOptions] = useState<any>(null);
    const [isDocumentDirty, setIsDocumentDirty] = useState<boolean>(false);
    const stackRef = useRef<{ id: string; content: any }[]>([]);

    const setHeader = useCallback((id: string, content: any) => {
        const existingIndex = stackRef.current.findIndex(item => item.id === id);
        if (existingIndex >= 0) {
            stackRef.current[existingIndex].content = content;
        } else {
            stackRef.current.push({ id, content });
        }
        setHeaderContent(content);
    }, []);

    const clearHeader = useCallback((id: string) => {
        stackRef.current = stackRef.current.filter(item => item.id !== id);
        if (stackRef.current.length > 0) {
            setHeaderContent(stackRef.current[stackRef.current.length - 1].content);
        } else {
            setHeaderContent(null);
        }
    }, []);

    const [documentBackInterceptor, setDocumentBackInterceptorState] = useState<DocumentBackInterceptor | null>(null);
    const interceptorRef = useRef<DocumentBackInterceptor | null>(null);

    const setDocumentBackInterceptor = useCallback((fn: DocumentBackInterceptor | null) => {
        interceptorRef.current = fn;
        setDocumentBackInterceptorState(() => fn);
    }, []);

    const value = useMemo(() => ({
      headerContent,
      setHeaderContent,
      setHeader,
      clearHeader,
      headerBreadcrumbOptions,
      setHeaderBreadcrumbOptions,
      isDocumentDirty,
      setIsDocumentDirty,
      documentBackInterceptor,
      setDocumentBackInterceptor
    }), [headerContent, setHeaderContent, setHeader, clearHeader, headerBreadcrumbOptions, setHeaderBreadcrumbOptions, isDocumentDirty, setIsDocumentDirty, documentBackInterceptor, setDocumentBackInterceptor]);

    const apiValue = useMemo(() => ({
      setHeader,
      clearHeader,
      setHeaderBreadcrumbOptions,
      isDocumentDirty,
      setIsDocumentDirty,
      documentBackInterceptor,
      setDocumentBackInterceptor
    }), [setHeader, clearHeader, setHeaderBreadcrumbOptions, isDocumentDirty, setIsDocumentDirty, documentBackInterceptor, setDocumentBackInterceptor]);

    return (
        <HeaderContext.Provider value={value}>
            <HeaderApiContext.Provider value={apiValue}>
                {children}
            </HeaderApiContext.Provider>
        </HeaderContext.Provider>
    );
};

export const useHeader = () => useContext(HeaderContext) || defaultHeaderContext;
export const useHeaderApi = () => useContext(HeaderApiContext) || defaultHeaderApiContext;

/**
 * useDocumentDirty
 * Belge formlarının kaydedilmemiş değişiklik (dirty) durumunu okumak ve değiştirmek için merkezi hook.
 */
export const useDocumentDirty = () => {
    const { isDocumentDirty, setIsDocumentDirty } = useHeader();
    return {
        isDirty: isDocumentDirty,
        setDirty: setIsDocumentDirty,
        setIsDocumentDirty
    };
};

