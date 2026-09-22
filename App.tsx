import React, { useRef, useEffect, useState } from 'react';
import { ChatView } from './components/ChatView';
import { Chatbot } from './components/Chatbot';
import { Message, MessageRole, QuickReply, ChatSession, DocumentChecklistItem } from './types';
import { leyDeTransitoText } from './knowledge/leyDeTransito';
import { leyDeSegurosText } from './knowledge/leyDeSeguros';
import { baremoMedicoText } from './knowledge/baremoMedico';
import { falloDanosText } from './knowledge/falloDanos';


const useIntersectionObserver = (options: IntersectionObserverInit) => {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [node, setNode] = useState<HTMLElement | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new window.IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setEntry(entry);
        observer.current?.unobserve(entry.target);
      }
    }, options);

    const { current: currentObserver } = observer;
    if (node) currentObserver.observe(node);

    return () => currentObserver.disconnect();
  }, [node, options]);

  return [setNode, entry] as const;
};

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, className }) => {
  const [setNode, entry] = useIntersectionObserver({ threshold: 0.1 });
  const isVisible = !!entry?.isIntersecting;

  return (
    <div
      ref={setNode as React.Ref<HTMLDivElement>}
      className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
    >
      {children}
    </div>
  );
};

// SVG Icons - Restyled
const ChatBubblesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);
const AnalyticsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125z" />
    </svg>
);
const ConnectIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
);

const features = [
    {
        icon: <ChatBubblesIcon />,
        title: 'Cuéntanos tu caso',
        description: 'Inicia una conversación con nuestro asistente de IA, 24/7. Describe tu situación y sube documentos de forma segura.'
    },
    {
        icon: <AnalyticsIcon />,
        title: 'Análisis Inteligente',
        description: 'Nuestra IA analiza tu caso, evalúa la viabilidad y te brinda una orientación legal clara y precisa basada en tu jurisdicción.'
    },
    {
        icon: <ConnectIcon />,
        title: 'Conecta con Expertos',
        description: 'Si tu caso lo requiere, te conectamos de forma transparente con abogados especializados y verificados en tu área.'
    }
];

const initialMessage: Message = {
    id: 'initial-1',
    role: MessageRole.ASSISTANT,
    text: 'Hola. Soy Cassey y estoy aquí para acompañarte en este proceso. Para poder ayudarte, cuéntame qué pasó o elige una de las siguientes opciones.',
    quickReplies: [
        { title: '¿Qué es lo primero que tengo que hacer después de chocar?', payload: 'Sufrí un accidente de tránsito, ¿Qué es lo primero que tengo que hacer después de chocar?' },
        { title: 'En un choque en una esquina sin semáforo, ¿quién tiene la culpa?', payload: 'En un choque en una esquina sin semáforo, ¿quién tiene la culpa?' },
        { title: 'Comisaría cercana para realizar la denuncia', payload: 'Comisaría cercana para realizar la denuncia' },
        { title: 'Estimar Indemnización', payload: '¿Cómo se calcula la indemnización que me corresponde?' },
        { title: 'Iniciar reclamo con un abogado', payload: 'Tuve un accidente y quiero iniciar mi reclamo para que me asesoren.' }
    ]
};

const initialChecklist: DocumentChecklistItem[] = [
    { id: 'denuncia', label: 'Denuncia del siniestro', status: 'pending' },
    { id: 'dni', label: 'DNI (frente y dorso)', status: 'pending' },
    { id: 'licencia', label: 'Licencia de conducir', status: 'pending' },
    { id: 'poliza', label: 'Certificado de cobertura', status: 'pending' },
    { id: 'pruebas', label: 'Fotos y pruebas del accidente', status: 'pending' },
    { id: 'estudios', label: 'Estudios médicos (si hay lesiones)', status: 'pending' },
    { id: 'cedula', label: 'Cédula del vehículo', status: 'pending' },
];


const App: React.FC = () => {
    // All state and logic remains unchanged
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([
        { 
            id: `chat-${Date.now()}`, 
            messages: [initialMessage],
            checklist: JSON.parse(JSON.stringify(initialChecklist)),
            isChecklistVisible: false,
            progress: 0,
            analyzedVariables: [],
            indemnificationProgress: 0,
        }
    ]);
    const [activeChatId, setActiveChatId] = useState<string>(chatSessions[0].id);
    const [isFullScreenChat, setIsFullScreenChat] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const activeChat = chatSessions.find(s => s.id === activeChatId) || chatSessions[0];

    const setMessagesForActiveChat = (updater: React.SetStateAction<Message[]>) => {
      setChatSessions(prevSessions =>
        prevSessions.map(session => {
          if (session.id === activeChatId) {
            const newMessages = typeof updater === 'function' ? updater(session.messages) : updater;
            return { ...session, messages: newMessages };
          }
          return session;
        })
      );
    };

    const handleStartPhase2 = () => {
        setChatSessions(prevSessions =>
            prevSessions.map(session => {
                if (session.id === activeChatId && !session.isChecklistVisible) {
                    return { ...session, isChecklistVisible: true };
                }
                return session;
            })
        );
    };

    const handleDocumentUpload = (documentId: string) => {
        setChatSessions(prevSessions =>
          prevSessions.map(session => {
            if (session.id === activeChatId) {
              const currentChecklist = session.checklist || JSON.parse(JSON.stringify(initialChecklist));
              const updatedChecklist = currentChecklist.map(item =>
                item.id === documentId ? { ...item, status: 'uploaded' } : item
              );
              
              return {
                ...session,
                checklist: updatedChecklist,
              };
            }
            return session;
          })
        );
      };
      
      const handleVariableAnalyzed = (variable: string) => {
        setChatSessions(prevSessions =>
            prevSessions.map(session => {
                if (session.id === activeChatId) {
                    const currentVars = session.analyzedVariables || [];
                    if (currentVars.includes(variable)) {
                        return session; 
                    }
                    const newAnalyzedVariables = [...currentVars, variable];
                    const newProgress = Math.round((newAnalyzedVariables.length / 6) * 100);
                    
                    return {
                        ...session,
                        analyzedVariables: newAnalyzedVariables,
                        progress: newProgress,
                    };
                }
                return session;
            })
        );
    };

    const handleIndemnificationStart = () => {
        setChatSessions(prevSessions =>
            prevSessions.map(session => {
                if (session.id === activeChatId) {
                    return { ...session, isChecklistVisible: true, indemnificationProgress: 33 };
                }
                return session;
            })
        );
    };

    const handleIndemnificationStep = () => {
        setChatSessions(prevSessions =>
            prevSessions.map(session => {
                if (session.id === activeChatId) {
                    const currentProgress = session.indemnificationProgress || 0;
                    return { ...session, indemnificationProgress: Math.min(currentProgress + 33, 100) };
                }
                return session;
            })
        );
    };

    const handleIndemnificationEnd = () => {
        setChatSessions(prevSessions =>
            prevSessions.map(session => {
                if (session.id === activeChatId) {
                    return { ...session, indemnificationProgress: 0 };
                }
                return session;
            })
        );
    };
    
    const handleFirstMessage = () => {
        setIsFullScreenChat(true);
    };

    const closeFullScreenChat = () => {
        setIsFullScreenChat(false);
    }
    
    const handleNewChat = () => {
        const newChatId = `chat-${Date.now()}`;
        const newSession: ChatSession = { 
            id: newChatId, 
            messages: [initialMessage],
            checklist: JSON.parse(JSON.stringify(initialChecklist)),
            isChecklistVisible: false,
            progress: 0,
            analyzedVariables: [],
            indemnificationProgress: 0,
        };
        setChatSessions(prev => [...prev, newSession]);
        setActiveChatId(newChatId);
    };

    const combinedKnowledgeBase = `
      ${leyDeTransitoText}
      ${leyDeSegurosText}
      ${baremoMedicoText}
      ${falloDanosText}
    `;

    if (isFullScreenChat) {
        return <ChatView 
            onClose={closeFullScreenChat} 
            onNewChat={handleNewChat}
            onDocumentUpload={handleDocumentUpload}
            knowledgeBase={combinedKnowledgeBase} 
            messages={activeChat.messages} 
            setMessages={setMessagesForActiveChat} 
            isLoading={isLoading} 
            setIsLoading={setIsLoading}
            chatSessions={chatSessions}
            activeChatId={activeChatId}
            setActiveChatId={setActiveChatId}
            onStartPhase2={handleStartPhase2}
            onVariableAnalyzed={handleVariableAnalyzed}
            onIndemnificationStart={handleIndemnificationStart}
            onIndemnificationStep={handleIndemnificationStep}
            onIndemnificationEnd={handleIndemnificationEnd}
        />;
    }

    return (
        <div className="min-h-screen text-text-muted font-sans antialiased relative">
            <div className="absolute inset-0 z-[-1]">
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl animate-pulse"></div>
            </div>
            
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-card/80">
                <div className="container mx-auto flex justify-between items-center h-full px-6">
                    <div className="flex-shrink-0 text-2xl font-bold text-text-main">
                        Case<span className="text-primary">Flow</span>
                    </div>
                    <nav className="hidden md:flex space-x-8 items-center">
                        <a href="#how-it-works" className="text-sm hover:text-primary transition-colors">Cómo Funciona</a>
                        <a href="#why-us" className="text-sm hover:text-primary transition-colors">Por Qué Elegirnos</a>
                        <a href="#cta" className="text-sm hover:text-primary transition-colors">Contacto</a>
                    </nav>
                </div>
            </header>

            <main>
                <section id="hero" className="min-h-screen flex flex-col items-center justify-center p-4 pt-20">
                    <div className="container mx-auto flex flex-col items-center text-center">
                        <AnimatedSection className="w-full max-w-4xl">
                            <h1 className="text-5xl md:text-6xl font-bold mb-4 mt-[30px] bg-gradient-to-r from-text-main via-primary to-text-main bg-clip-text text-transparent">
                                ¿Tuviste un accidente de tránsito?
                            </h1>
                            <p className="text-lg md:text-xl text-text-muted mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                                Te guiamos gratis y en minutos para que sepas qué hacer.
                                <br />
                                Hablá con nuestro asistente para empezar.
                            </p>
                        </AnimatedSection>
                        
                        <AnimatedSection className="w-full max-w-6xl mx-auto">
                            <div className="h-[70vh] max-h-[700px] bg-card/50 backdrop-blur-md rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-card-border/60">
                                <Chatbot
                                    knowledgeBase={combinedKnowledgeBase}
                                    messages={activeChat.messages}
                                    setMessages={setMessagesForActiveChat}
                                    onFirstMessage={handleFirstMessage}
                                    isLoading={isLoading}
                                    setIsLoading={setIsLoading}
                                    showExpandButton={activeChat.messages.length > 1}
                                    onExpand={() => setIsFullScreenChat(true)}
                                    onDocumentUpload={handleDocumentUpload}
                                    onStartPhase2={handleStartPhase2}
                                    onVariableAnalyzed={handleVariableAnalyzed}
                                    onIndemnificationStart={handleIndemnificationStart}
                                    onIndemnificationStep={handleIndemnificationStep}
                                    onIndemnificationEnd={handleIndemnificationEnd}
                                />
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                <section id="how-it-works" className="pt-28 container mx-auto px-6 scroll-mt-24">
                    <AnimatedSection>
                        <h3 className="text-4xl font-bold text-center mb-4 text-text-main">Cómo <span className="text-primary">Funciona</span></h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {features.map((feature, index) => (
                                <div key={index} className="bg-card/50 backdrop-blur-md border border-card-border/60 rounded-xl p-8 text-center flex flex-col items-center hover:border-card-border hover:shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all duration-300">
                                    <div className="bg-primary/10 p-4 rounded-full mb-6">
                                        {feature.icon}
                                    </div>
                                    <h4 className="text-xl font-semibold mb-4 text-text-main">{feature.title}</h4>
                                    <p className="text-text-muted flex-grow">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </AnimatedSection>
                </section>
                
                <section id="why-us" className="pt-32 pb-8 scroll-mt-24">
                    <div className="container mx-auto px-6">
                        <AnimatedSection>
                            <div className="bg-card/50 backdrop-blur-md border border-card-border/60 rounded-2xl p-8 md:p-12">
                                <h3 className="text-4xl font-bold text-center mb-4 text-text-main">Por Qué Elegir <span className="text-primary">CaseFlow</span></h3>
                                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                                    {[
                                        { title: "Orientación Inmediata", desc: "No más esperas ni información confusa. Obtén respuestas claras al instante, a cualquier hora del día." },
                                        { title: "Gratis y sin Compromiso", desc: "Nuestra orientación inicial es completamente gratuita. Tú decides los próximos pasos, con total autonomía." },
                                        { title: "Seguro y Confidencial", desc: "Tu privacidad es nuestra prioridad. Toda tu información es encriptada y manejada con la máxima confidencialidad." },
                                        { title: "Empoderamiento Legal", desc: "Te damos las herramientas para que entiendas tus derechos y tomes decisiones informadas sobre tu caso." }
                                    ].map(item => (
                                        <div key={item.title} className="flex items-start space-x-4">
                                            <div className="text-primary flex-shrink-0 text-2xl mt-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-semibold text-text-main">{item.title}</h4>
                                                <p className="text-text-muted">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>
                
                <section id="cta" className="pb-32 pt-20 scroll-mt-24">
                    <AnimatedSection className="container mx-auto px-6 text-center">
                        <h3 className="text-4xl font-bold text-text-main mb-4">Transforma tu gestión de <span className="text-primary">casos</span></h3>
                        <p className="text-lg text-text-muted max-w-2xl mx-auto mb-8">
                            Descubre cómo CaseFlow puede optimizar tu estudio, reducir costos y captar leads de mayor calidad. Únete a la nueva era de la abogacía digital.
                        </p>
                        <div className="flex justify-center items-center gap-4 flex-wrap">
                            <a href="#hero" className="bg-primary text-primary-dark font-semibold py-3 px-8 rounded-lg text-lg shadow-lg shadow-primary/40 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105">
                                Probar Asistente IA
                            </a>
                            <a href="#demo" className="border-2 border-card-border text-text-main font-semibold py-3 px-8 rounded-lg text-lg hover:bg-card-border/20 hover:border-card-border/80 transition-all duration-300 transform hover:scale-105">
                                Solicitar Demo
                            </a>
                        </div>
                    </AnimatedSection>
                </section>
            </main>

            <footer id="contact" className="bg-primary-dark py-12 border-t border-card/80">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                        <div className="col-span-2 md:col-span-1">
                            <h3 className="text-2xl font-bold text-text-main">
                              Case<span className="text-primary">Flow</span>
                            </h3>
                            <p className="text-text-muted mt-2 text-sm">
                              Optimizando la adquisición de casos legales.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-text-main mb-4">SOLUCIONES</h4>
                            <ul className="space-y-2">
                              <li><a href="#" className="text-text-muted text-sm hover:text-text-main transition-colors">Para Abogados</a></li>
                              <li><a href="#" className="text-text-muted text-sm hover:text-text-main transition-colors">Para Víctimas</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-text-main mb-4">COMPAÑÍA</h4>
                            <ul className="space-y-2">
                              <li><a href="#" className="text-text-muted text-sm hover:text-text-main transition-colors">Nosotros</a></li>
                              <li><a href="#" className="text-text-muted text-sm hover:text-text-main transition-colors">Contacto</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-text-main mb-4">LEGAL</h4>
                            <ul className="space-y-2">
                              <li><a href="#" className="text-text-muted text-sm hover:text-text-main transition-colors">Privacidad</a></li>
                              <li><a href="#" className="text-text-muted text-sm hover:text-text-main transition-colors">Términos</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-text-main mb-4">REDES</h4>
                            <ul className="space-y-2">
                              <li><a href="#" className="text-text-muted text-sm hover:text-text-main transition-colors">LinkedIn</a></li>
                              <li><a href="#" className="text-text-muted text-sm hover:text-text-main transition-colors">Twitter</a></li>
                            </ul>
                        </div>
                    </div>
                    <hr className="my-8 border-t border-card/80" />
                    <div className="text-center text-text-muted text-sm">
                      <p>&copy; {new Date().getFullYear()} CaseFlow. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default App;