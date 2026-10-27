import { Worker } from "bullmq";
import Assignment from "../models/Assignment";
import { generatePaper } from "../services/ai.service";
import { redis } from "../config/redis";
import { getIO } from "../sockets/socket";

const worker = new Worker(
  "generation",
  async (job) => {
    const { id } = job.data;
    console.log(`[Worker] Processing job for assignment: ${id}`);

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      // Deleted before the job ran - nothing to do, don't retry
      console.warn(`[Worker] Assignment ${id} no longer exists, skipping`);
      return;
    }

    await Assignment.findByIdAndUpdate(id, { status: "processing" });

    try {
      const result = await generatePaper(assignment);

      await Assignment.findByIdAndUpdate(id, { status: "completed", result });
      console.log(`[Worker] Done: ${id}`);

      getIO()?.emit("generation-complete", { id: String(id), result });
    } catch (err) {
      console.error(`[Worker] Generation failed for ${id}:`, err);
      await Assignment.findByIdAndUpdate(id, { status: "failed" });
      getIO()?.emit("generation-failed", { id: String(id), error: String(err) });
      throw err;
    }
  },
  { connection: redis, concurrency: 2 }
);

worker.on("error", (err) => console.error("[Worker] error:", err.message));

console.log("[Worker] Generation worker started");