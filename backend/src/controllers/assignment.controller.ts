import { Request, Response } from "express";
import Assignment from "../models/Assignment";
import { generationQueue } from "../jobs/queue";
import { parseFile } from "../services/parser.service";

export const createAssignment = async (req: Request, res: Response) => {
  try {
    console.log("BODY:", req.body);

    let questionTypes = [];
    try {
      const raw = req.body.questionTypes;
      if (typeof raw === "string") {
        questionTypes = JSON.parse(raw);
      } else if (Array.isArray(raw)) {
        questionTypes = raw;
      }
    } catch {
      questionTypes = [];
    }

    let sourceContent = "";
    if ((req as any).file) {
      try {
        sourceContent = await parseFile((req as any).file);
      } catch (e) {
        console.warn("File parse skipped:", e);
      }
    }

    const assignment = await Assignment.create({
      dueDate: req.body.dueDate || null,
      questionTypes,
      totalQuestions: Number(req.body.totalQuestions) || 0,
      marks: Number(req.body.marks) || 0,
      instructions: req.body.instructions || "",
      sourceContent,
      status: "pending",
    });

    console.log("✅ Assignment created:", assignment._id);
    await generationQueue.add("generate", { id: assignment._id });
    console.log("✅ Job queued for:", assignment._id);

    res.status(201).json({ success: true, assignment });
  } catch (err) {
    console.error("❌ CREATE ERROR:", err);
    res.status(500).json({ success: false, error: String(err) });
  }
};

export const getAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
};

export const getAllAssignments = async (req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
};

/**
 * POST /api/assignments/:id/regenerate
 * Clears the existing result and re-queues the same assignment for AI generation.
 */
export const regenerateAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    // Reset to pending and wipe old result
    await Assignment.findByIdAndUpdate(req.params.id, {
      status: "pending",
      result: null,
    });

    await generationQueue.add("generate", { id: assignment._id });

    console.log("✅ Regeneration queued for:", assignment._id);
    res.json({ success: true, message: "Regeneration started" });
  } catch (err) {
    console.error("❌ REGENERATE ERROR:", err);
    res.status(500).json({ success: false, error: String(err) });
  }
};
