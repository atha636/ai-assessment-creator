import express from "express";
import {
  createAssignment,
  getAssignment,
  getAllAssignments,
  deleteAssignment,
} from "../controllers/assignment.controller";
import { upload } from "../middleware/upload";

const router = express.Router();

router.post("/",   upload.single("file"), createAssignment);
router.get("/",    getAllAssignments);
router.get("/:id", getAssignment);
router.delete("/:id", deleteAssignment);

export default router;