import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { Source, YouTubeVideo, ChatMessage, UserProfile } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const getAdaptedSystemInstruction = (baseInstruction: string, profile: UserProfile | null): string => {
    if (!profile) {
        return baseInstruction;
    }

    let adaptation = " Based on the user's history, adapt your response with the following considerations:";
    adaptation += ` The user's knowledge level appears to be '${profile.knowledgeLevel}'.`;
    adaptation += ` Their current sentiment seems to be '${profile.sentiment}'.`;
    adaptation += ` They seem to prefer a '${profile.learningStyle}' learning style.`;

    switch (profile.knowledgeLevel) {
        case 'beginner':
            adaptation += " Simplify complex topics and use analogies.";
            break;
        case 'expert':
            adaptation += " Feel free to use technical terminology and provide in-depth details.";
            break;
    }

    switch (profile.sentiment) {
        case 'confused':
            adaptation += " Be extra encouraging, patient, and break down the explanation into smaller, clearer steps.";
            break;
        case 'confident':
             adaptation += " Challenge the user with follow-up questions or advanced concepts.";
            break;
    }
    
    return baseInstruction + adaptation;
}

export const startChat = (userProfile: UserProfile | null): Chat => {
    const baseInstruction = `You are a specialized AI assistant. Your primary goal is to answer questions using information grounded from a knowledge base. Critically evaluate search results for relevance and accuracy. Synthesize information from reliable sources to provide a comprehensive and trustworthy response.

Your response MUST be structured into three distinct sections, in this exact order: \`### Summary\`, \`### Detailed Explanation\`, and \`### In-Depth Analysis\`.

- \`### Summary\`: Provide a concise, direct answer to the user's question. This should be a brief paragraph.
- \`### Detailed Explanation\`: Elaborate on the summary. Provide more context, background information, and examples.
- \`### In-Depth Analysis\`: Offer a comprehensive, expert-level breakdown. Include nuances, technical details, and related concepts.

Within each section, use Markdown for formatting (headings, lists, bold text).
For code blocks, use language-specific triple backticks (e.g., \`\`\`javascript).
For tables, use GitHub Flavored Markdown.
For math and chemistry, use LaTeX (e.g., \`$\\ce{H2O}$\`, \`$$E=mc^2$$\`).

IMPORTANT: When you identify an important concept that could benefit from a video explanation, wrap it in double square brackets, like this: [[keyword]]. Do this within any of the three sections where it's relevant.

AFTER the \`### In-Depth Analysis\` section, you may add two optional sections: '### Further Reading' and '### Explanatory Videos' for general resources.`;
    
    const systemInstruction = getAdaptedSystemInstruction(baseInstruction, userProfile);

    return ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
        },
    });
};

/**
 * Analyzes the chat history to create a profile of the user's learning state.
 */
export async function analyzeChatHistory(messages: ChatMessage[]): Promise<UserProfile> {
    // Take the last 6 messages to keep the context relevant and the payload small.
    const recentMessages = messages.slice(-6);
    const formattedHistory = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the user's learning profile from the following conversation history. Based on their questions and language, determine their sentiment, knowledge level, and preferred learning style.
            
            Conversation History:
            ${formattedHistory}
            
            Respond with a JSON object that strictly follows the provided schema.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        sentiment: {
                            type: Type.STRING,
                            enum: ['curious', 'confused', 'confident', 'neutral'],
                        },
                        knowledgeLevel: {
                            type: Type.STRING,
                            enum: ['beginner', 'intermediate', 'expert'],
                        },
                        learningStyle: {
                            type: Type.STRING,
                            enum: ['visual', 'detailed', 'concise'],
                        },
                    },
                    required: ["sentiment", "knowledgeLevel", "learningStyle"],
                },
            },
        });

        const profile = JSON.parse(response.text);
        console.log("User Profile Updated:", profile); // For debugging
        return profile;

    } catch (error) {
        console.error("Error analyzing user profile:", error);
        // Return a default profile on error to avoid breaking the app
        return {
            sentiment: 'neutral',
            knowledgeLevel: 'intermediate',
            learningStyle: 'detailed',
        };
    }
}


export async function findYoutubeVideo(topic: string): Promise<YouTubeVideo | null> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Search for a high-quality, concise, educational YouTube video explaining "${topic}". The video must be publicly available and allow embedding. Provide the video's title and its 11-character video ID.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "The title of the YouTube video." },
                        videoId: { type: Type.STRING, description: "The 11-character unique ID of the YouTube video." }
                    },
                    required: ["title", "videoId"],
                },
            },
        });

        const json = JSON.parse(response.text);
        // Basic validation for video ID format
        if (json.videoId && /^[a-zA-Z0-9_-]{11}$/.test(json.videoId)) {
            return { title: json.title, videoId: json.videoId };
        }
        
        console.warn("LLM returned invalid video data:", json);
        return null;

    } catch(error) {
        console.error("Error finding YouTube video:", error);
        return null;
    }
}

export async function transformQuery(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Rephrase and expand the following user question to make it a more effective and detailed query for a semantic search against a knowledge base of academic and technical documents. Focus on clarity, keywords, and user intent. Return only the improved query. Original question: "${prompt}"`,
      config: { temperature: 0.3 }
    });
    const transformed = response.text.trim();
    console.log(`Original: "${prompt}" | Transformed: "${transformed}"`);
    return transformed || prompt; 
  } catch (error) {
    console.error("Error transforming query:", error);
    return prompt;
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
    return []; 
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

export async function editVisualExplanation(base64ImageDataUrl: string, prompt: string): Promise<string> {
    try {
        const match = base64ImageDataUrl.match(/^data:(image\/.+);base64,(.+)$/);
        if (!match) {
            throw new Error("Invalid base64 image data URL format.");
        }
        const mimeType = match[1];
        const base64Data = match[2];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType,
                        },
                    },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            const newBase64Data = imagePart.inlineData.data;
            const newMimeType = imagePart.inlineData.mimeType;
            return `data:${newMimeType};base64,${newBase64Data}`;
        } else {
            const textPart = response.candidates?.[0]?.content?.parts.find(part => part.text);
            if (textPart?.text) {
                 throw new Error(`Model returned text instead of an image: "${textPart.text}"`);
            }
            throw new Error("Image editing failed: The model did not return an image.");
        }
    } catch (error) {
        console.error("Error editing visual explanation:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to edit image: ${error.message}`);
        }
        throw new Error("An unknown error occurred while editing the image.");
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
