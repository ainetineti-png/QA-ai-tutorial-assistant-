
import { GoogleGenAI, Type } from "@google/genai";
import { Source } from '../types';

interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export async function* generateGroundedAnswer(prompt: string): AsyncGenerator<{ text: string; sources: Source[] }> {
    try {
        const stream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "You are a specialized AI assistant with expertise in analyzing documents from a specific knowledge base, represented by the public Google Drive folder '146zHLEQjr0GL_Hn1ovOA-o1H0O6vxXmX'. This folder contains educational materials, including PDFs with text, diagrams, and maps. When a user asks a question, your primary goal is to answer it using information grounded from this knowledge base via web search. Critically evaluate the retrieved search results for relevance, accuracy, and depth before constructing your answer. Synthesize information from the most reliable sources to provide a comprehensive and trustworthy response. Pay special attention to visual details described in questions, such as interpreting maps or diagrams (e.g., 'Figure 4.4'). For map-related questions, carefully analyze symbols for roads (e.g., solid lines for metalled/paved roads, dashed lines for unmetalled/unpaved roads), rivers, buildings, and directional indicators. If the information is not available in the search results, state that you could not find the specific information within the provided context. Always be helpful and accurate, and cite your sources.",
                tools: [{ googleSearch: {} }],
            },
        });

        for await (const chunk of stream) {
            const groundingMetadata: GroundingMetadata | undefined = chunk.candidates?.[0]?.groundingMetadata;
            const sources: Source[] = (groundingMetadata?.groundingChunks ?? [])
                .map(ch => ch.web)
                .filter((web): web is { uri: string; title?: string } => !!web && !!web.uri)
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

/**
 * RAG Improvement: Transforms a user's query into a more detailed, specific
 * query to improve retrieval accuracy from the knowledge base.
 */
export async function transformQuery(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Rephrase and expand the following user question to make it a more effective and detailed query for a semantic search against a knowledge base of academic and technical documents. Focus on clarity, keywords, and user intent. Return only the improved query. Original question: "${prompt}"`,
      config: { temperature: 0.3 }
    });
    const transformed = response.text.trim();
    // For debugging: log the transformation
    console.log(`Original: "${prompt}" | Transformed: "${transformed}"`);
    return transformed || prompt; // Fallback to original prompt if generation is empty
  } catch (error) {
    console.error("Error transforming query:", error);
    return prompt; // Fallback to original prompt on error
  }
}

export async function extractKeywords(text: string): Promise<string[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `From the following text, extract up to 5 of the most important technical or conceptual keywords that would be good candidates for a visual explanation. Focus on nouns or scientific terms. Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keywords: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              }
            }
          }
        }
      }
    });

    const json = JSON.parse(response.text);
    return json.keywords || [];
  } catch (error) {
    console.error("Error extracting keywords:", error);
    return []; // Return empty array on failure
  }
}

export async function generateVisualExplanation(keyword: string): Promise<string> {
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A simple, clear, educational diagram explaining the concept of "${keyword}". Minimalist, infographic style, with clear labels and annotations. White background.`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
  } catch(error) {
    console.error("Error generating visual explanation:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the image.");
  }
}
