import { ResourceLinkInfo } from '../types';

export const parseContent = (content: string) => {
    const sections: { [key: string]: string } = {};
    const furtherReadingLinks: ResourceLinkInfo[] = [];
    const videoLinks: ResourceLinkInfo[] = [];
    const linkRegex = /\*\s*\[([^\]]+)\]\(([^)]+)\)/g;

    const validHeaders = ['Summary', 'Detailed Explanation', 'In-Depth Analysis', 'Further Reading', 'Explanatory Videos'];
    const splitRegex = new RegExp(`(?=###\\s+(?:${validHeaders.join('|')}))`, 'i');
    
    // Split the content by section headers. The regex includes the header in the split result.
    const parts = content.split(splitRegex).filter(part => part.trim());

    if (parts.length === 0 && content.trim()) {
        // No headers found, treat the whole content as summary.
        sections.summary = content.trim();
        return { sections, furtherReadingLinks, videoLinks };
    }
    
    // Handle content that might appear before the first header.
    if (parts.length > 0 && !parts[0].trim().startsWith('###')) {
      const preamble = parts.shift()?.trim();
      if(preamble) {
        sections.summary = preamble;
      }
    }

    for (const part of parts) {
        if (!part.trim()) continue;

        const headerRegex = /###\s*(Summary|Detailed Explanation|In-Depth Analysis|Further Reading|Explanatory Videos)/i;
        const headerMatch = part.match(headerRegex);

        if (!headerMatch) continue;

        const title = headerMatch[1].toLowerCase().replace(/[\s-]+/g, '');
        const text = part.substring(headerMatch[0].length).trim();

        if (title === 'furtherreading') {
            let linkMatch;
            linkRegex.lastIndex = 0; 
            while ((linkMatch = linkRegex.exec(text)) !== null) {
                furtherReadingLinks.push({ title: linkMatch[1], url: linkMatch[2] });
            }
        } else if (title === 'explanatoryvideos') {
            let linkMatch;
            linkRegex.lastIndex = 0;
            while ((linkMatch = linkRegex.exec(text)) !== null) {
                videoLinks.push({ title: linkMatch[1], url: linkMatch[2] });
            }
        } else {
             // Only add the section if it has actual text content.
             if (text) {
                sections[title] = text;
             }
        }
    }
    
    // Final fallback if parsing yielded nothing but content exists
    if (Object.keys(sections).length === 0 && content.trim()) {
        sections.summary = content.trim();
    }

    return { sections, furtherReadingLinks, videoLinks };
}