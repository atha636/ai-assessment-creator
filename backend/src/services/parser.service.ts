export const parseFile = async (file: any): Promise<string> => {
  if (!file) return "";

  try {
    if (file.mimetype === "application/pdf") {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdf = require("pdf-parse/lib/pdf-parse");
      const data = await pdf(file.buffer);
      return data.text;
    }

    if (file.mimetype === "text/plain") {
      return file.buffer.toString("utf-8");
    }

    if (file.mimetype?.startsWith("image/")) {
      return `[Image uploaded: ${file.originalname}]`;
    }

    return "";
  } catch (err) {
    console.error("PARSER ERROR:", err);
    return "";
  }
};