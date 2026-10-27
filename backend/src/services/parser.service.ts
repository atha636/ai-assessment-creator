import { PDFParse } from "pdf-parse";

// Keep prompts within the model's context window
export const MAX_SOURCE_CHARS = 12000;

export const parseFile = async (file: any): Promise<string> => {
  if (!file) return "";

  try {
    if (file.mimetype === "application/pdf") {
      const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
      try {
        const result = await parser.getText();
        return (result.text || "").trim().slice(0, MAX_SOURCE_CHARS);
      } finally {
        await parser.destroy();
      }
    }

    if (file.mimetype === "text/plain") {
      return file.buffer.toString("utf-8").trim().slice(0, MAX_SOURCE_CHARS);
    }

    // Images are accepted by the upload form, but there is no OCR/vision step yet,
    // so no text can be extracted from them.
    return "";
  } catch (err) {
    console.error("PARSER ERROR:", err);
    return "";
  }
};