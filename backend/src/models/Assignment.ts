import mongoose from "mongoose";

const questionTypeSchema = new mongoose.Schema({
  id: String,
  type: String,
  numQuestions: Number,
  marks: Number,
}, { _id: false });

const schema = new mongoose.Schema({
  dueDate: Date,
  questionTypes: [questionTypeSchema],
  totalQuestions: Number,
  marks: Number,
  instructions: String,
  sourceContent: String,
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
  },
  result: Object,
}, { timestamps: true });

export default mongoose.model("Assignment", schema);