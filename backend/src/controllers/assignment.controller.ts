import { Request, Response } from "express";
import mongoose from "mongoose";
import Assignment from "../models/Assignment";
import { generationQueue } from "../jobs/queue";
import { parseFile } from "../services/parser.service";

interface QuestionTypeInput {
  id?: string;
  type: string;
  numQuestions: number;
  marks: number;
}

const parseQuestionTypes = (raw: unknown): QuestionTypeInput[] => {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];

  return value
    .map((q: any) => ({
      id: q?.id ? String(q.id) : undefined,
      type: String(q?.type ?? "").trim(),
      numQuestions: Math.floor(Number(q?.numQuestions)),
      marks: Math.floor(Number(q?.marks)),
    }))
    .filter(
      (q) =>
        q.type &&
        q.numQuestions >= 1 && q.numQuestions <= 50 &&
        q.marks >= 1 && q.marks <= 100
    );
};

const badId = (res: Response) =>
  res.status(400).json({ success: false, message: "Invalid assignment id" });

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const questionTypes = parseQuestionTypes(req.body.questionTypes);
    if (questionTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Add at least one valid question type (1-50 questions, 1-100 marks each).",
      });
    }

    let dueDate: Date | null = null;
    if (req.body.dueDate) {
      dueDate = new Date(req.body.dueDate);
      if (isNaN(dueDate.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid due date" });
      }
    }

    let sourceContent = "";
    if (req.file) {
      sourceContent = await parseFile(req.file);
    }

    const assignment = await Assignment.create({
      dueDate,
      questionTypes,
      totalQuestions: questionTypes.reduce((s, q) => s + q.numQuestions, 0),
      marks: questionTypes.reduce((s, q) => s + q.numQuestions * q.marks, 0),
      instructions: String(req.body.instructions || "").slice(0, 2000),
      sourceContent,
      status: "pending",
    });

    await generationQueue.add("generate", { id: String(assignment._id) });
    console.log("✅ Assignment created & queued:", assignment._id);

    res.status(201).json({ success: true, assignment });
  } catch (err) {
    console.error("❌ CREATE ERROR:", err);
    res.status(500).json({ success: false, message: "Could not create assignment" });
  }
};

export const getAssignment = async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badId(res);

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json(assignment);
  } catch (err) {
    console.error("❌ GET ERROR:", err);
    res.status(500).json({ success: false, message: "Could not load assignment" });
  }
};

export const getAllAssignments = async (_req: Request, res: Response) => {
  try {
    // sourceContent can be large and the list view never needs it
    const assignments = await Assignment.find()
      .select("-sourceContent")
      .sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch (err) {
    console.error("❌ LIST ERROR:", err);
    res.status(500).json({ success: false, message: "Could not load assignments" });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badId(res);

    const deleted = await Assignment.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE ERROR:", err);
    res.status(500).json({ success: false, message: "Could not delete assignment" });
  }
};

/**
 * POST /api/assignments/:id/regenerate
 * Clears the existing result and re-queues the same assignment for AI generation.
 */
export const regenerateAssignment = async (req: Request, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return badId(res);

    const assignment = await Assignment.findByIdAndUpdate(req.params.id, {
      status: "pending",
      result: null,
    });
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    await generationQueue.add("generate", { id: String(assignment._id) });

    console.log("✅ Regeneration queued for:", assignment._id);
    res.json({ success: true, message: "Regeneration started" });
  } catch (err) {
    console.error("❌ REGENERATE ERROR:", err);
    res.status(500).json({ success: false, message: "Could not regenerate" });
  }
};