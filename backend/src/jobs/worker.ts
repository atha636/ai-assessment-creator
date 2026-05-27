import { Worker } from "bullmq";
import Assignment from "../models/Assignment";
import { generatePaper } from "../services/ai.service";
import { redis } from "../config/redis";
import { getIO } from "../sockets/socket";

new Worker(
  "generation",
  async (job) => {
    const { id } = job.data;
    console.log(`[Worker] Processing job for assignment: ${id}`);

    // Mark as processing
    await Assignment.findByIdAndUpdate(id, { status: "processing" });

    const assignment = await Assignment.findById(id);
    if (!assignment) throw new Error(`Assignment ${id} not found`);

    try {
      const result = await generatePaper(assignment);

      await Assignment.findByIdAndUpdate(id, {
        status: "completed",
        result,
      });

      console.log(`[Worker] Done: ${id}`);

      getIO().emit("generation-complete", { id, result });
    } catch (err) {
      await Assignment.findByIdAndUpdate(id, { status: "failed" });
      getIO().emit("generation-failed", { id, error: String(err) });
      throw err;
    }
  },
  { connection: redis }
);

console.log("[Worker] Generation worker started");