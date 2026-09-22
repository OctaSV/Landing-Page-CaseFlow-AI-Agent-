import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, MessageRole, GroundingSource, QuickReply } from '../types';
import { generateChatResponse, generateGroundedResponse, analyzeImage, generateMapsResponse } from '../services/geminiService';

const renderMarkdown = (text: string) => {
    if (!text) return text;
    return (
      <React.Fragment>
        {text.split('**').map((part, index) =>
          index % 2 === 1 ? <strong key={index}>{part}</strong> : part
        )}
      </React.Fragment>
    );
  };

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
);

const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 2a6 6 0 00-6 6c0 4.418 6 10 6 10s6-5.582 6-10a6 6 0 00-6-6zM8 8a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
    </svg>
);

const ExpandIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8V5a2 2 0 012-2h3m8 0h3a2 2 0 012 2v3m0 8v3a2 2 0 01-2 2h-3m-8 0H5a2 2 0 01-2-2v-3" />
    </svg>
);

interface ChatbotProps {
    knowledgeBase: string;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    onFirstMessage?: () => void;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    showExpandButton?: boolean;
    onExpand?: () => void;
    onDocumentUpload?: (documentId: string) => void;
    onStartPhase2?: () => void;
    onVariableAnalyzed?: (variable: string) => void;
    onIndemnificationStart?: () => void;
    onIndemnificationStep?: () => void;
    onIndemnificationEnd?: () => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({ 
    knowledgeBase, messages, setMessages, onFirstMessage, isLoading, setIsLoading, 
    showExpandButton, onExpand, onDocumentUpload, onStartPhase2, onVariableAnalyzed,
    onIndemnificationStart, onIndemnificationStep, onIndemnificationEnd
}) => {
    // All logic remains unchanged
    const [input, setInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = useCallback(async (text: string, attachedFile?: File) => {
        if (!text && !attachedFile) return;
        
        if (onFirstMessage && messages.length === 1) {
            onFirstMessage();
        }

        if (text === 'Tuve un accidente y quiero iniciar mi reclamo para que me asesoren.' && onStartPhase2) {
            onStartPhase2();
        }

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: MessageRole.USER,
            text,
            image: attachedFile ? URL.createObjectURL(attachedFile) : undefined,
        };
        
        setMessages(prev => [...prev.map(m => ({...m, quickReplies: []})), userMessage]);
        setInput('');
        setIsLoading(true);

        const locationKeywords = ['comisaría', 'dónde está', 'cerca de', 'ubicación de', 'mapa de', 'cómo llego'];
        const needsLocation = !attachedFile && locationKeywords.some(kw => text.toLowerCase().includes(kw));

        if (needsLocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const mapsResult = await generateMapsResponse(text, { latitude, longitude });
                    const assistantMessage: Message = {
                        id: `assistant-maps-${Date.now()}`,
                        role: MessageRole.ASSISTANT,
                        text: mapsResult.text,
                        isGrounded: true,
                        groundingSources: mapsResult.sources,
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                } catch (error) {
                    console.error("Error in maps response:", error);
                    const errorMessage: Message = { id: `error-${Date.now()}`, role: MessageRole.ASSISTANT, text: "Lo siento, ha ocurrido un error al buscar en el mapa." };
                    setMessages(prev => [...prev, errorMessage]);
                } finally {
                    setIsLoading(false);
                }
            }, (error) => {
                console.error("Geolocation error:", error);
                const errorMessage: Message = { id: `error-loc-${Date.now()}`, role: MessageRole.ASSISTANT, text: "No pude acceder a tu ubicación. Por favor, asegúrate de tener los permisos activados en tu navegador e inténtalo de nuevo." };
                setMessages(prev => [...prev, errorMessage]);
                setIsLoading(false);
            });
            return; 
        }

        try {
            if (attachedFile) {
                let responseText = '';
                let documentId: string | null = null;

                if (text === 'Esta es mi denuncia policial') {
                    responseText = await analyzeImage('Esta es mi denuncia policial. Por favor, extrae los datos más importantes como nombres, matrículas, fecha, lugar y un resumen de los hechos.', attachedFile);
                    documentId = 'denuncia';
                } else {
                    responseText = await analyzeImage(text || 'Describe este documento y extrae información relevante para un caso de accidente de tránsito.', attachedFile);
                }

                if (documentId && onDocumentUpload) {
                    onDocumentUpload(documentId);
                }

                const assistantMessage: Message = {
                    id: `assistant-${Date.now()}`,
                    role: MessageRole.ASSISTANT,
                    text: responseText,
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else if (text.toLowerCase().startsWith('/search ')) {
                const query = text.substring(8);
                const groundedResult = await generateGroundedResponse(query);
                const assistantMessage: Message = {
                    id: `assistant-${Date.now()}`,
                    role: MessageRole.ASSISTANT,
                    text: groundedResult.text,
                    isGrounded: true,
                    groundingSources: groundedResult.sources,
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                const chatResult = await generateChatResponse(messages, text, knowledgeBase);

                if (chatResult.analyzedVariable && onVariableAnalyzed) {
                    onVariableAnalyzed(chatResult.analyzedVariable);
                }

                if (chatResult.indemnificationEvent === 'start' && onIndemnificationStart) {
                    onIndemnificationStart();
                } else if (chatResult.indemnificationEvent === 'step' && onIndemnificationStep) {
                    onIndemnificationStep();
                }


                const initialResponse = chatResult.text;

                if (initialResponse.trim() === '[KNOWLEDGE_BASE_FALLBACK]') {
                    const disclaimerMessage: Message = {
                        id: `assistant-disclaimer-${Date.now()}`,
                        role: MessageRole.ASSISTANT,
                        text: 'No encontré una respuesta precisa en mi base de conocimiento legal para CABA/AMBA. A continuación, buscaré en la web para darte una orientación general. Ten en cuenta que esta información podría no ser legalmente exacta para tu caso específico y es solo orientativa.',
                    };
                    setMessages(prev => [...prev, disclaimerMessage]);
                    
                    const groundedResult = await generateGroundedResponse(text);
                    const groundedMessage: Message = {
                        id: `assistant-grounded-${Date.now()}`,
                        role: MessageRole.ASSISTANT,
                        text: groundedResult.text,
                        isGrounded: true,
                        groundingSources: groundedResult.sources,
                    };
                    setMessages(prev => [...prev.filter(m => m.id !== disclaimerMessage.id), groundedMessage]);
                } else {
                    const assistantMessage: Message = {
                        id: `assistant-${Date.now()}`,
                        role: MessageRole.ASSISTANT,
                        text: initialResponse,
                    };

                    if (chatResult.indemnificationEvent === 'end') {
                        if (onIndemnificationEnd) {
                            onIndemnificationEnd();
                        }
                        assistantMessage.quickReplies = [
                            { title: 'Unirse', payload: 'Tuve un accidente y quiero iniciar mi reclamo para que me asesoren.' }
                        ];
                    }
                    
                    setMessages(prev => [...prev, assistantMessage]);
                }
            }
        } catch (error) {
            console.error("Error in handleSendMessage:", error);
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: MessageRole.ASSISTANT,
                text: "Lo siento, ha ocurrido un error al procesar tu solicitud."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [messages, knowledgeBase, setMessages, onFirstMessage, setIsLoading, onDocumentUpload, onStartPhase2, onVariableAnalyzed, onIndemnificationStart, onIndemnificationStep, onIndemnificationEnd]);
    
    const handleQuickReplyClick = (reply: QuickReply) => {
        if (reply.payload === 'Esta es mi denuncia policial') {
            fileInputRef.current?.click();
        } else {
            handleSendMessage(reply.payload);
        }
    };


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const currentInput = input || "Esta es mi denuncia policial";
            handleSendMessage(currentInput, file);
        }
    };

    return (
        <div className="bg-transparent w-full h-full flex flex-col font-sans relative">
             {showExpandButton && onExpand && (
                <button
                    onClick={onExpand}
                    className="absolute top-4 left-4 z-10 bg-primary text-primary-dark p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                    aria-label="Expandir chat"
                >
                    <ExpandIcon />
                </button>
            )}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id}>
                        <div className={`flex items-end gap-3 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : ''}`}>
                            {msg.role === MessageRole.ASSISTANT && (
                                 <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-dark font-bold text-xl flex-shrink-0">
                                    C
                                 </div>
                            )}
                            <div className={`p-4 rounded-2xl max-w-md ${msg.role === MessageRole.USER ? 'bg-primary text-primary-dark rounded-br-none' : 'bg-card text-text-main rounded-bl-none text-left'}`}>
                                {msg.image && <img src={msg.image} alt="Uploaded content" className="rounded-lg mb-2 max-h-48" />}
                                <p className="whitespace-pre-wrap">{renderMarkdown(msg.text)}</p>
                                {msg.isGrounded && msg.groundingSources && msg.groundingSources.length > 0 && (
                                    <div className="mt-3 border-t border-primary/30 pt-2">
                                        <h4 className="text-xs font-semibold text-primary mb-1.5 flex items-center">
                                            {msg.groundingSources.some(s => s.uri.includes('google.com/maps')) ? <MapPinIcon /> : <SearchIcon />}
                                            Fuentes:
                                        </h4>
                                        <ul className="text-xs space-y-1">
                                            {msg.groundingSources.map((source, i) => (
                                                <li key={i}>
                                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-text-main hover:text-primary underline truncate block">
                                                        {source.title || source.uri}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        {msg.id === messages[messages.length - 1].id && msg.role === MessageRole.ASSISTANT && msg.quickReplies && msg.quickReplies.length > 0 && !isLoading && (
                            <div className="flex flex-wrap gap-2 justify-start mt-3 ml-14">
                                {msg.quickReplies.map((reply, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleQuickReplyClick(reply)}
                                        className="bg-card text-primary text-sm font-semibold py-2 px-4 rounded-full hover:bg-primary hover:text-primary-dark transition-colors border border-card-border/50"
                                    >
                                        {reply.title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-end gap-3">
                         <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-dark font-bold text-xl flex-shrink-0">
                            C
                         </div>
                        <div className="p-4 rounded-2xl bg-card text-text-main rounded-bl-none">
                            <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-card-border/20">
                <div className="bg-card rounded-xl flex items-center p-2">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-text-muted hover:text-text-main rounded-full transition-colors">
                        <FileIcon/>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage(input)}
                        placeholder="Pregúntame sobre tu caso..."
                        className="flex-1 bg-transparent px-4 text-text-main placeholder-text-muted focus:outline-none"
                        disabled={isLoading}
                    />
                    <button onClick={() => handleSendMessage(input)} disabled={isLoading || !input.trim()} className="p-2 bg-primary text-primary-dark rounded-full disabled:opacity-50 transition-opacity">
                        <SendIcon />
                    </button>
                </div>
                 <div className="text-xs text-text-muted mt-2 px-2">
                    Las respuestas se basan en nuestra base de conocimiento legal para CABA/AMBA.
                </div>
            </div>
        </div>
    );
};