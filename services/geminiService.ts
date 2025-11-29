import { GoogleGenAI, Modality } from "@google/genai";

// Models
const MODEL_CREATIVE = 'gemini-3-pro-preview';
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

// Helper to safely get the API key in various environments (Vite/Node)
const getApiKey = (): string => {
  try {
    // Check process.env (Node/Webpack/Defined in Vite config)
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore ReferenceError if process is not defined
  }

  try {
    // Check import.meta.env (Standard Vite)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore
  }
  
  return '';
};

const getAiClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("Gemini API Key is missing. Please set API_KEY or VITE_API_KEY in your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateStoryFromImage = async (base64Image: string, mimeType: string, promptText?: string) => {
  try {
    const ai = getAiClient();
    const prompt = promptText || "Analyze the mood, lighting, and scene details of this image. Then, acting as a creative author, ghostwrite an engaging opening paragraph to a story set in this world. Keep it evocative and under 200 words.";
    
    const response = await ai.models.generateContent({
      model: MODEL_CREATIVE,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        systemInstruction: "You are a master storyteller known for vivid descriptions and captivating hooks.",
      }
    });

    return response.text || "No story could be generated.";
  } catch (error) {
    console.error("Story generation error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: MODEL_TTS,
      contents: {
        parts: [
          { text: text }
        ]
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' } // 'Puck' or 'Kore' are good for storytelling
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from Gemini.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Speech generation error:", error);
    throw error;
  }
};

export const streamChatMessage = async function* (
  history: { role: 'user' | 'model'; text: string; image?: { data: string; mimeType: string } }[],
  newMessage: string,
  newImage?: { data: string; mimeType: string }
) {
  try {
    const ai = getAiClient();
    // We recreate the chat session for each turn to include images properly if they are part of history
    // Since simple chat history array in SDK doesn't always support inline images easily in `history` prop for all models,
    // we will construct the `contents` manually.
    
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [
        ...(msg.image ? [{ inlineData: msg.image }] : []),
        { text: msg.text }
      ]
    }));

    // Add current message
    contents.push({
      role: 'user',
      parts: [
        ...(newImage ? [{ inlineData: newImage }] : []),
        { text: newMessage }
      ]
    });

    // We use generateContentStream instead of chats.sendMessageStream to have full control over history + images
    const streamResult = await ai.models.generateContentStream({
      model: MODEL_CREATIVE,
      contents: contents,
      config: {
        systemInstruction: "You are a helpful, witty, and knowledgeable AI assistant.",
      }
    });

    for await (const chunk of streamResult) {
      yield chunk.text || '';
    }

  } catch (error) {
    console.error("Chat stream error:", error);
    throw error;
  }
};