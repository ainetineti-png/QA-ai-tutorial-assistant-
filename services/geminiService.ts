
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Source } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

export async function* generateGroundedAnswer(prompt: string): AsyncGenerator<{ text: string; sources: Source[] }> {
    try {
        const stream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: `Answer the following question in a detailed and explanatory manner. Use your own knowledge but also ground the answer in the provided search results to ensure accuracy and detail. The question is: "${prompt}"`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        for await (const chunk of stream) {
            const groundingMetadata: GroundingMetadata | undefined = chunk.candidates?.[0]?.groundingMetadata;

            const sources: Source[] = (groundingMetadata?.groundingChunks ?? [])
                .map(ch => ch.web)
                .filter((web): web is { uri: string; title: string } => !!web && !!web.uri)
                .map(web => ({ uri: web.uri, title: web.title || web.uri }));
            
            yield { text: chunk.text, sources };
        }
    } catch (error) {
        console.error("Error in generateGroundedAnswer:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate content: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating content.");
    }
}
