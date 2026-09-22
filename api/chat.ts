import { GoogleGenAI } from "@google/genai";

// Vercel leerá esta clave desde el servidor de forma 100% privada
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { history, newMessage, knowledgeBase } = req.body;

        const chatHistory = (history || []).map((msg: any) => ({
            role: msg.role === 'USER' || msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const augmentedPrompt = `Utilizando la base de conocimiento adjunta, responde a la consulta del usuario.\n\nBase de conocimiento:\n${knowledgeBase}\n\nPregunta: ${newMessage}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [...chatHistory, { role: 'user', parts: [{ text: augmentedPrompt }] }]
        });

        return res.status(200).json({ text: response.text });
    } catch (error: any) {
        console.error("Error en /api/chat:", error);
        return res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
}
