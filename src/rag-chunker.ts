export interface Chunk {
  heading: string | null;
  text: string;       // includes heading prefix for encoding
  charStart: number;  // character offset in original file
}

const MAX_CHARS = 800;
const MIN_CHARS = 100;

export function chunkMarkdown(content: string): Chunk[] {
  const lines = content.split("\n");
  const sections: { heading: string | null; startChar: number; lines: string[] }[] = [];
  let currentHeading: string | null = null;
  let currentLines: string[] = [];
  let currentStart = 0;
  let charPos = 0;

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch) {
      if (currentLines.length > 0) {
        sections.push({ heading: currentHeading, startChar: currentStart, lines: currentLines });
      }
      currentHeading = headingMatch[1].trim();
      currentLines = [];
      currentStart = charPos;
    } else {
      currentLines.push(line);
    }
    charPos += line.length + 1;
  }
  if (currentLines.length > 0) {
    sections.push({ heading: currentHeading, startChar: currentStart, lines: currentLines });
  }

  const chunks: Chunk[] = [];
  for (const section of sections) {
    const body = section.lines.join("\n").trim();
    if (!body) continue;
    const stripped = body
      .replace(/```[\s\S]*?```/g, "")
      .replace(/^!\[.*?\]\(.*?\)$/gm, "")
      .replace(/^---+$/gm, "")
      .trim();
    if (!stripped || stripped.length < MIN_CHARS) continue;

    if (stripped.length <= MAX_CHARS) {
      const text = section.heading ? `${section.heading}\n${stripped}` : stripped;
      chunks.push({ heading: section.heading, text, charStart: section.startChar });
    } else {
      const paras = stripped.split(/\n{2,}/);
      let buf = "";
      let bufStart = section.startChar;
      for (const para of paras) {
        if (buf.length + para.length > MAX_CHARS && buf.length >= MIN_CHARS) {
          const text = section.heading ? `${section.heading}\n${buf.trim()}` : buf.trim();
          chunks.push({ heading: section.heading, text, charStart: bufStart });
          buf = para;
          const idx = stripped.indexOf(para);
          bufStart = section.startChar + (idx >= 0 ? idx : 0);
        } else {
          buf = buf ? `${buf}\n\n${para}` : para;
        }
      }
      if (buf.trim().length >= MIN_CHARS) {
        const text = section.heading ? `${section.heading}\n${buf.trim()}` : buf.trim();
        chunks.push({ heading: section.heading, text, charStart: bufStart });
      }
    }
  }
  return chunks;
}
