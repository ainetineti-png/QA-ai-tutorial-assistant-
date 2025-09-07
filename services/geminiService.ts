
import { GoogleGenAI, Type } from "@google/genai";
import { Source, YouTubeVideo } from '../types';

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
                systemInstruction: "You are a specialized AI assistant. Your primary goal is to answer questions using information grounded from a knowledge base. Critically evaluate search results for relevance and accuracy. Synthesize information from reliable sources to provide a comprehensive and trustworthy response. IMPORTANT: When you identify an important concept in your main answer that could benefit from a video explanation, wrap it in double square brackets, like this: [[keyword]]. Do not add markdown links in the main answer. AFTER providing the main answer, you may add two optional sections: '### Further Reading' and '### Explanatory Videos' for general resources.",
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


export async function findYoutubeVideo(topic: string): Promise<YouTubeVideo | null> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find the single best explanatory YouTube video for the topic: "${topic}". The ideal video is a concise, high-quality educational animation or tutorial. Return only the video title and its URL.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        url: { type: Type.STRING }
                    },
                    required: ["title", "url"],
                },
            },
        });

        const json = JSON.parse(response.text);
        const url = json.url;

        if (url && url.includes("youtube.com/watch")) {
            const videoId = new URL(url).searchParams.get("v");
            if (videoId) {
                return { title: json.title, videoId: videoId };
            }
        }
        return null;

    } catch(error) {
        console.error("Error finding YouTube video:", error);
        return null;
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

export async function* generateAnimationExplanation(keyword: string): AsyncGenerator<{ status: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR'; message?: string; url?: string; }> {
  const reassuringMessages = [
    "Sketching out the main concepts...",
    "Choosing a color palette...",
    "Animating the first few frames...",
    "Rendering the sequence, this is the longest step...",
    "Adding final touches and polish...",
    "Almost there, preparing the video file...",
  ];
  let messageIndex = 0;

  try {
    yield { status: 'PENDING', message: 'Initiating animation request...' };
    
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: `A short, simple, silent, looping educational animation explaining the concept of "${keyword}". Minimalist infographic style, clear visuals, no text overlay.`,
      config: {
        numberOfVideos: 1,
      }
    });

    yield { status: 'RUNNING', message: 'Request received, starting generation...' };

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      yield { status: 'RUNNING', message: reassuringMessages[messageIndex % reassuringMessages.length] };
      messageIndex++;
      
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.response?.generatedVideos && operation.response.generatedVideos.length > 0) {
      const downloadLink = operation.response.generatedVideos[0]?.video?.uri;
      if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was provided.");
      }
      
      yield { status: 'RUNNING', message: 'Generation complete! Downloading video...' };

      const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
      }

      const blob = await videoResponse.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      yield { status: 'DONE', url: objectUrl };

    } else {
      throw new Error("Video generation operation finished but produced no video.");
    }

  } catch (error) {
    console.error("Error generating animation:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during animation generation.";
    yield { status: 'ERROR', message: errorMessage };
  }
}
