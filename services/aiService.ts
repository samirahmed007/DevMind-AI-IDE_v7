
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, FileAttachment, SettingsState, ModelConfig } from "../types";
import { SYSTEM_INSTRUCTION_AGENT } from "../constants";

const getFetchConfig = (settings: SettingsState, model: ModelConfig) => {
  let url = '';
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (model.provider === 'openrouter') {
    url = `${settings.customEndpoints.openrouter}/chat/completions`;
    headers['Authorization'] = `Bearer ${settings.apiKeys.openrouter}`;
    headers['HTTP-Referer'] = window.location.origin;
  } else if (model.provider === 'local') {
    url = `${settings.customEndpoints.local}/chat/completions`;
  } else if (model.provider === 'openai') {
    url = `${settings.customEndpoints.openai}/chat/completions`;
    headers['Authorization'] = `Bearer ${settings.apiKeys.openai}`;
  } else if (model.provider === 'anthropic') {
    url = `https://api.anthropic.com/v1/messages`;
    headers['x-api-key'] = settings.apiKeys.anthropic;
    headers['anthropic-version'] = '2023-06-01';
  }

  return { url, headers };
};

export const streamResponse = async (
  messages: ChatMessage[],
  settings: SettingsState,
  model: ModelConfig,
  currentFileContext: string | null,
  onChunk: (text: string, thought?: string) => void
) => {
  const systemPrompt = SYSTEM_INSTRUCTION_AGENT + (currentFileContext ? `\n\nCURRENT OPEN FILE CONTEXT:\n${currentFileContext}` : '');

  if (model.provider === 'google') {
    const apiKey = settings.apiKeys.google || process.env.API_KEY;
    if (!apiKey) throw new Error("Google API Key not found. Please set it in Settings.");
    
    const ai = new GoogleGenAI({ apiKey });
    
    let contents = [];
    for (const msg of messages) {
       const parts: any[] = [{ text: msg.content }];
       if (msg.attachments && msg.attachments.length > 0) {
         for (const att of msg.attachments) {
            const base64Data = att.data.split(',')[1] || att.data;
            parts.push({
                inlineData: {
                    mimeType: att.mimeType,
                    data: base64Data
                }
            });
         }
       }
       contents.push({
           role: msg.role === 'assistant' ? 'model' : 'user',
           parts: parts
       });
    }

    const isThinkingModel = model.id.includes('gemini-3') || model.id.includes('gemini-2.5');

    const chat = ai.chats.create({
        model: model.id,
        config: { 
            systemInstruction: systemPrompt,
            thinkingConfig: isThinkingModel ? { thinkingBudget: 16000 } : undefined
        },
        history: contents.slice(0, -1)
    });

    const lastMsg = messages[messages.length - 1];
    const lastParts: any[] = [{ text: lastMsg.content }];
    
    if (lastMsg.attachments && lastMsg.attachments.length > 0) {
         for (const att of lastMsg.attachments) {
            const base64Data = att.data.split(',')[1] || att.data;
            lastParts.push({ inlineData: { mimeType: att.mimeType, data: base64Data } });
         }
    }

    const result = await chat.sendMessageStream({ 
        message: lastParts.length === 1 ? lastParts[0].text : lastParts
    });

    for await (const chunk of result) {
      let textChunk = "";
      let thoughtChunk = "";

      if (chunk.candidates?.[0]?.content?.parts) {
        for (const part of chunk.candidates[0].content.parts) {
          // Robust check for thought/reasoning parts
          // Note: In some versions, 'thought' might be a boolean flag and text is reasoning
          if (part.thought === true || part.thought) {
            thoughtChunk += part.text || "";
          } else if (part.text) {
            textChunk += part.text;
          }
        }
      } else {
        textChunk = chunk.text || "";
      }

      onChunk(textChunk, thoughtChunk);
    }
    return;
  }

  const { url, headers } = getFetchConfig(settings, model);
  if (!url) throw new Error("Provider URL not configured");

  const openAiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => {
        if (m.attachments && m.attachments.length > 0) {
            const content = [
                { type: 'text', text: m.content },
                ...m.attachments.map(att => ({
                    type: 'image_url',
                    image_url: { url: att.data }
                }))
            ];
            return { role: m.role, content };
        }
        return { role: m.role, content: m.content };
    })
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model.id,
      messages: openAiMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error: ${response.status} - ${err}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error("No response body");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim() !== '');

    for (const line of lines) {
      if (line.trim() === 'data: [DONE]') return;
      if (line.startsWith('data: ')) {
        try {
          const json = JSON.parse(line.substring(6));
          const content = json.choices?.[0]?.delta?.content || json.delta?.content;
          if (content) onChunk(content);
        } catch (e) {}
      }
    }
  }
};

export const enhancePrompt = async (originalPrompt: string, settings: SettingsState, model: ModelConfig): Promise<string> => {
    let fullText = "";
    const messages: ChatMessage[] = [
        {
            id: 'enhancer',
            role: 'user',
            content: `Enhance this prompt for a coding assistant. Expert level. Output text only.\n\nPrompt:\n${originalPrompt}`,
            timestamp: Date.now()
        }
    ];

    await streamResponse(messages, settings, model, null, (chunk) => {
        fullText += chunk;
    });

    return fullText.trim();
};
