import React from 'react';
import { Chatbot } from './Chatbot';
import { Message, MessageRole, ChatSession, DocumentChecklistItem } from '../types';

interface ChatViewProps {
  onClose: () => void;
  onNewChat: () => void;
  knowledgeBase: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  chatSessions: ChatSession[];
  activeChatId: string;
  setActiveChatId: (id: string) => void;
  onDocumentUpload: (documentId: string) => void;
  onStartPhase2: () => void;
  onVariableAnalyzed: (variable: string) => void;
  onIndemnificationStart: () => void;
  onIndemnificationStep: () => void;
  onIndemnificationEnd: () => void;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);
  
const CircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-muted mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="w-full bg-white/10 rounded-full h-2.5 mb-2">
        <div 
            className="bg-primary h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
        ></div>
    </div>
);

const DocumentChecklist: React.FC<{ items: DocumentChecklistItem[] }> = ({ items }) => (
    <ul className="space-y-3">
      {items.map(item => (
        <li key={item.id} className="flex items-center text-sm transition-colors">
          {item.status === 'uploaded' ? (
            <CheckIcon />
          ) : (
            <CircleIcon />
          )}
          <span className={item.status === 'uploaded' ? 'text-text-main' : 'text-text-muted'}>
            {item.label}
          </span>
        </li>
      ))}
    </ul>
);

export const ChatView: React.FC<ChatViewProps> = ({ 
  onClose, 
  onNewChat, 
  knowledgeBase, 
  messages, 
  setMessages, 
  isLoading, 
  setIsLoading,
  chatSessions,
  activeChatId,
  setActiveChatId,
  onDocumentUpload,
  onStartPhase2,
  onVariableAnalyzed,
  onIndemnificationStart,
  onIndemnificationStep,
  onIndemnificationEnd
}) => {

  const activeChat = chatSessions.find(s => s.id === activeChatId);

  return (
    <div className="fixed inset-0 bg-background z-50 flex animate-fade-in font-sans">
      <aside className="w-1/4 max-w-xs bg-primary-dark border-r border-card/80 flex flex-col p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-text-main">Recientes</h2>
          <button onClick={onNewChat} className="text-primary p-1 rounded-full hover:bg-primary/20 transition-colors" aria-label="Nuevo Chat">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
            <ul className="space-y-2">
                {chatSessions.map((session) => {
                  const firstUserMessage = session.messages.find(m => m.role === MessageRole.USER);
                  const chatTitle = firstUserMessage 
                    ? firstUserMessage.text.length > 35 
                      ? `${firstUserMessage.text.substring(0, 32)}...` 
                      : firstUserMessage.text
                    : 'Nueva Conversación';

                  return (
                    <li 
                        key={session.id}
                        onClick={() => setActiveChatId(session.id)}
                        className={`p-3 rounded-lg cursor-pointer truncate transition-colors text-sm ${session.id === activeChatId ? 'bg-primary/20 text-text-main font-semibold' : 'hover:bg-white/5 text-text-muted'}`}
                        title={firstUserMessage?.text || 'Nueva Conversación'}
                    >
                        {chatTitle}
                    </li>
                  );
                })}
            </ul>
            {activeChat?.isChecklistVisible && (
                <div className="mt-8 pt-6 border-t border-card/80">
                    <h3 className="text-lg font-bold text-text-main mb-4">Armado del Caso</h3>
                    <div className="flex items-center mb-4">
                        <ProgressBar progress={activeChat.progress || 0} />
                        <span className="text-sm font-semibold text-primary ml-3 w-12 text-right">{`${activeChat.progress || 0}%`}</span>
                    </div>
                    {activeChat.checklist && <DocumentChecklist items={activeChat.checklist} />}
                </div>
            )}
            {(activeChat?.indemnificationProgress || 0) > 0 && (
                 <div className="mt-6">
                    <h4 className="text-md font-bold text-text-main mb-3">Estimando Indemnización</h4>
                    <div className="flex items-center">
                        <ProgressBar progress={activeChat.indemnificationProgress || 0} />
                        <span className="text-sm font-semibold text-primary ml-3 w-12 text-right">{`${Math.round(activeChat.indemnificationProgress || 0)}%`}</span>
                    </div>
                </div>
            )}
        </div>
      </aside>
      <main className="flex-1 flex flex-col relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-text-main transition-colors z-10" aria-label="Cerrar chat">
          <CloseIcon />
        </button>
        <Chatbot 
            knowledgeBase={knowledgeBase}
            messages={messages}
            setMessages={setMessages}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onDocumentUpload={onDocumentUpload}
            onStartPhase2={onStartPhase2}
            onVariableAnalyzed={onVariableAnalyzed}
            onIndemnificationStart={onIndemnificationStart}
            onIndemnificationStep={onIndemnificationStep}
            onIndemnificationEnd={onIndemnificationEnd}
        />
      </main>
    </div>
  );
};