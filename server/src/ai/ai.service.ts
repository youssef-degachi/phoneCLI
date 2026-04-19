import fetch from 'node-fetch';
import { env } from '../config.js';

export interface AiResponse {
    content: string;
    commands: string[];
}

export const askAi = async (message: string, streamHandler?: (chunk: string) => void): Promise<AiResponse> => {
    const systemPrompt = `You are a remote developer assistant. The user is away from their PC and is giving you instructions via their phone. Your job is to help them understand what to do and provide exact terminal commands or instructions to carry out their request. Always be concise. If you suggest running commands, wrap them in a <cmd> tag so the UI can offer a one-click run button.`;

    const response = await fetch(`${env.OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        body: JSON.stringify({
            model: env.OLLAMA_MODEL,
            prompt: `${systemPrompt}\n\nUser: ${message}`,
            stream: !!streamHandler,
        }),
    });

    if (streamHandler && response.body) {
        let fullContent = '';
        response.body.on('data', (chunk) => {
            try {
                const json = JSON.parse(chunk.toString());
                if (json.response) {
                    fullContent += json.response;
                    streamHandler(json.response);
                }
            } catch (e) { /* ignore partial json */ }
        });

        return new Promise((resolve) => {
            response.body!.on('end', () => {
                const commands = extractCommands(fullContent);
                resolve({ content: fullContent, commands });
            });
        });
    }

    const json = (await response.json()) as any;
    const content = json.response || '';
    return {
        content,
        commands: extractCommands(content),
    };
};

const extractCommands = (text: string): string[] => {
    const matches = text.match(/<cmd>(.*?)<\/cmd>/g) || [];
    return matches.map((m) => m.replace(/<\/?cmd>/g, '').trim());
};
