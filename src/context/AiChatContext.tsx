/**
 * @deprecated Bu dosya ve içerisindeki `AiChatProvider`, `useAiChat` ve ilgili yardımcılar
 * bağımsız `@akalin/ai-assistants` modülüne taşınmıştır.
 * Geriye dönük uyumluluk için buradan re-export edilmektedir.
 * Lütfen doğrudan `@akalin/ai-assistants` paketinden import ediniz.
 * @see @akalin/ai-assistants
 */

export {
    type AiSession,
    type AiMessage,
    type AiPanelMode,
    type AiPageContext,
    type AiChatContextType,
    resolveRouteToAgentCode,
    matchAgentForRoute,
    DEFAULT_SYSTEM_AGENTS,
    AiChatProvider,
    useAiChat
} from '@akalin/ai-assistants';
