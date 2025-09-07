
import { GoogleGenAI } from "@google/genai";
import { Source } from '../types';

// Fix: Updated local types to match @google/genai, where uri and title can be optional to fix type error.
interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

// Fix: Removed apiKey parameter and using process.env.API_KEY as per guidelines.
export async function* generateGroundedAnswer(prompt: string): AsyncGenerator<{ text: string; sources: Source[] }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    try {
        const stream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are an expert assistant for a knowledge base sourced from the public Google Drive folder with ID '146zHLEQjr0GL_Hn1ovOA-o1H0O6vxXmX'. Your task is to answer user questions based on the documents found within this folder. Use the information from the grounded search results to formulate your answers. If the answer is not in the documents, state that clearly. Always be helpful and accurate, and cite your sources.",
                tools: [{ googleSearch: {} }],
            },
        });

        for await (const chunk of stream) {
            const groundingMetadata: GroundingMetadata | undefined = chunk.candidates?.[0]?.groundingMetadata;

            const sources: Source[] = (groundingMetadata?.groundingChunks ?? [])
                .map(ch => ch.web)
                // Fix: Updated type guard to correctly reflect that title is optional after filtering for uri.
                .filter((web): web is { uri: string; title?: string } => !!web && !!web.uri)
                .map(web => ({ uri: web.uri, title: web.title || web.uri }));
            
            yield { text: chunk.text, sources };
        }
    } catch (error) {
        console.error("Error in generateGroundedAnswer:", error);
        if (error instanceof Error) {
            // Fix: Removed specific API key error handling as per guidelines.
            throw new Error(`Failed to generate content: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating content.");
    }
}
