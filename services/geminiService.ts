import { Message, GroundingSource } from '../types';

export const generateChatResponse = async (
    history: Message[], 
    newMessage: string, 
    knowledgeBase: string
): Promise<{ text: string; analyzedVariable: string | null; indemnificationEvent: 'start' | 'step' | 'end' | null; }> => {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ history, newMessage, knowledgeBase }),
        });

        if (!response.ok) {
            throw new Error(`Error en la llamada al backend: ${response.statusText}`);
        }

        const data = await response.json();
        let responseText = data.text || '';
        
        let analyzedVariable: string | null = null;
        let indemnificationEvent: 'start' | 'step' | 'end' | null = null;

        const varRegex = /\[VAR_ANALYZED:([RLMACE])\]/g;
        const indemnificationStartRegex = /\[INDEMNIFICATION_START\]/g;
        const indemnificationStepRegex = /\[INDEMNIFICATION_STEP\]/g;
        const indemnificationEndRegex = /\[INDEMNIFICATION_END\]/g;
        
        let match;

        if ((match = varRegex.exec(responseText)) !== null) {
            analyzedVariable = match[1];
            responseText = responseText.replace(varRegex, '').trim();
        }
        if (indemnificationStartRegex.test(responseText)) {
            indemnificationEvent = 'start';
            responseText = responseText.replace(indemnificationStartRegex, '').trim();
        }
        if (indemnificationStepRegex.test(responseText)) {
            indemnificationEvent = 'step';
            responseText = responseText.replace(indemnificationStepRegex, '').trim();
        }
        if (indemnificationEndRegex.test(responseText)) {
            indemnificationEvent = 'end';
            responseText = responseText.replace(indemnificationEndRegex, '').trim();
        }

        return { text: responseText, analyzedVariable, indemnificationEvent };
    } catch (error) {
        console.error("Error procesando respuesta del servidor:", error);
        return { 
            text: "Disculpe, ocurrió un error. Por favor intente de nuevo.", 
            analyzedVariable: null, 
            indemnificationEvent: null 
        };
    }
};

export const generateGroundedResponse = async (prompt: string): Promise<{ text: string; sources: GroundingSource[] }> => {
    try {
        const response = await generateChatResponse([], prompt, '');
        return { text: response.text, sources: [] };
    } catch (error) {
        console.error("Error en generateGroundedResponse:", error);
        return { text: "Disculpe, ocurrió un error.", sources: [] };
    }
};

export const generateMapsResponse = async (prompt: string, location: { latitude: number, longitude: number }): Promise<{ text: string; sources: GroundingSource[] }> => {
    try {
        const response = await generateChatResponse([], prompt, '');
        return { text: response.text, sources: [] };
    } catch (error) {
        console.error("Error en generateMapsResponse:", error);
        return { text: "Disculpe, ocurrió un error.", sources: [] };
    }
};

export const analyzeImage = async (prompt: string, file: File): Promise<string> => {
    try {
        return "El análisis de documentos está deshabilitado en este momento.";
    } catch (error) {
        console.error("Error en analyzeImage:", error);
        return "Disculpe, ocurrió un error al procesar la imagen.";
    }
};
