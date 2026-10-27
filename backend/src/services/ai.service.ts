import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export const generatePaper = async (data: any) => {
  // Build per-section requirements from questionTypes array
  const questionTypesArr: Array<{ type: string; numQuestions: number; marks: number }> =
    (() => {
      try {
        if (Array.isArray(data.questionTypes)) return data.questionTypes;
        return JSON.parse(data.questionTypes);
      } catch {
        return [{ type: String(data.questionTypes), numQuestions: Number(data.totalQuestions) || 5, marks: 2 }];
      }
    })();

  const sections = questionTypesArr.map((qt, i) => ({
    sectionLabel: `Section ${String.fromCharCode(65 + i)}`,
    type: qt.type,
    count: qt.numQuestions,
    marksEach: qt.marks,
  }));

  const sectionsPrompt = sections
    .map(
      (s) =>
        `- ${s.sectionLabel}: ${s.count} "${s.type}" questions, ${s.marksEach} marks each`
    )
    .join("\n");

  const prompt = `
You are an expert exam paper creator for Indian schools (CBSE curriculum).

Generate a structured question paper WITH ANSWER KEY strictly following this format.

STRICT RULES:
1. Return ONLY raw JSON — no markdown, no backticks, no explanation.
2. Each section must contain EXACTLY the number of questions specified.
3. Difficulty must be exactly one of: "Easy", "Medium", "Hard".
4. Every question must be academic, specific, and meaningful.
5. Every question MUST include a detailed "answer" field with the model answer.
6. For MCQ questions, include "options" array with 4 choices (A, B, C, D) and mark the correct one in "answer".
7. Answers should be complete and mark-worthy, matching the marks allocated.
8. Use the uploaded content as the subject matter when provided.

Required JSON structure:
{
  "sections": [
    {
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries X marks.",
      "questions": [
        {
          "text": "full question text here",
          "difficulty": "Easy",
          "marks": 2,
          "type": "Short Questions",
          "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
          "answer": "The complete model answer here. For MCQ: state the correct option and brief explanation. For short/long: write a proper answer worth the marks given."
        }
      ]
    }
  ]
}

Note: "options" field is only required for Multiple Choice Questions. For all other types, omit it.

Sections to generate:
${sectionsPrompt}

Additional teacher instructions:
${data.instructions || "None"}

Source material / topic:
${data.sourceContent || "General academic content — pick a relevant topic from Indian school curriculum."}

Total questions: ${questionTypesArr.reduce((s, q) => s + q.numQuestions, 0)}
Total marks: ${questionTypesArr.reduce((s, q) => s + q.numQuestions * q.marks, 0)}
`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.6,
    max_tokens: 8000,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "";
  console.log("RAW AI:", raw.slice(0, 200));

  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("AI did not return JSON");
  }

  const parsed = JSON.parse(cleaned.slice(start, end + 1));

  if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
    throw new Error("AI response has no sections");
  }

  // Normalise so the UI never has to deal with missing fields
  parsed.sections = parsed.sections.map((sec: any, i: number) => {
    if (!Array.isArray(sec.questions) || sec.questions.length === 0) {
      throw new Error(`AI response: section ${i + 1} has no questions`);
    }
    const spec = sections[i];
    return {
      ...sec,
      title: sec.title || spec?.sectionLabel || `Section ${String.fromCharCode(65 + i)}`,
      questions: sec.questions.map((q: any) => ({
        ...q,
        text: String(q.text ?? ""),
        marks: Number(q.marks) || spec?.marksEach || 1,
        type: q.type || spec?.type,
        difficulty: ["Easy", "Medium", "Hard"].includes(q.difficulty) ? q.difficulty : "Medium",
      })),
    };
  });

  return parsed;
};