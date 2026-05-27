"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { socket } from "@/lib/socket";
import {
  Download,
  RefreshCw,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const POLL_INTERVAL = 3000; // ms — poll every 3s if socket hasn't fired
const MAX_POLLS = 60;       // give up after 3 minutes

const DIFFICULTY_STYLES: Record<string, React.CSSProperties> = {
  Easy:     { background: "var(--badge-easy)",   color: "var(--badge-easy-text)" },
  Medium:   { background: "var(--badge-medium)", color: "var(--badge-medium-text)" },
  Moderate: { background: "var(--badge-medium)", color: "var(--badge-medium-text)" },
  Hard:     { background: "var(--badge-hard)",   color: "var(--badge-hard-text)" },
};

function DifficultyBadge({ level }: { level: string }) {
  const style = DIFFICULTY_STYLES[level] ?? DIFFICULTY_STYLES["Medium"];
  return (
    <span style={{
      ...style,
      fontSize: 11, fontWeight: 600,
      padding: "3px 10px", borderRadius: 99,
      fontFamily: "var(--font-body)", letterSpacing: 0.2,
    }}>
      {level}
    </span>
  );
}

function MarksBadge({ marks }: { marks: number }) {
  return (
    <span style={{
      background: "#EFF6FF", color: "#1D4ED8",
      fontSize: 11, fontWeight: 600,
      padding: "3px 10px", borderRadius: 99,
      fontFamily: "var(--font-body)",
    }}>
      {marks} {marks === 1 ? "Mark" : "Marks"}
    </span>
  );
}

/* ─── Loading State ─── */
function LoadingState({ pollCount }: { pollCount: number }) {
  const dots = [".", "..", "..."][pollCount % 3];
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: "60vh", gap: 24,
    }}>
      {/* Animated ring */}
      <div style={{ position: "relative", width: 80, height: 80 }}>
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "50%",
          border: "3px solid var(--border-default)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "50%",
          border: "3px solid transparent",
          borderTopColor: "var(--brand-primary)",
          animation: "spin 1s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: 10,
          borderRadius: "50%",
          background: "var(--bg-tag)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="var(--brand-primary)" opacity="0.9"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="var(--brand-primary)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <h2 style={{
          fontWeight: 700, fontSize: 20,
          color: "var(--text-primary)", fontFamily: "var(--font-body)",
          marginBottom: 8,
        }}>
          Generating AI Paper{dots}
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 14, fontFamily: "var(--font-body)" }}>
          Our AI is crafting your assessment. This usually takes 15–30 seconds.
        </p>
        {pollCount > 5 && (
          <p style={{
            marginTop: 12, fontSize: 12,
            color: "var(--text-muted)", fontFamily: "var(--font-body)",
          }}>
            Still working… ({pollCount * 3}s elapsed)
          </p>
        )}
      </div>

      {/* Steps indicator */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 240 }}>
        {[
          { label: "Assignment received", done: true },
          { label: "Building prompt", done: pollCount > 1 },
          { label: "AI generating questions", done: pollCount > 4 },
          { label: "Parsing & structuring", done: pollCount > 8 },
        ].map(({ label, done }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
              background: done ? "var(--status-active)" : "var(--border-default)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.4s",
            }}>
              {done && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{
              fontSize: 13, fontFamily: "var(--font-body)",
              color: done ? "var(--text-primary)" : "var(--text-muted)",
              fontWeight: done ? 500 : 400,
              transition: "color 0.4s",
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Failed State ─── */
function FailedState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: "60vh", gap: 20, textAlign: "center",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "#FEE2E2",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <AlertCircle size={32} color="#EF4444" />
      </div>
      <div>
        <h2 style={{ fontWeight: 700, fontSize: 20, color: "var(--text-primary)", fontFamily: "var(--font-body)", marginBottom: 8 }}>
          Generation Failed
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 14, fontFamily: "var(--font-body)" }}>
          Something went wrong while generating your paper. Please try again.
        </p>
      </div>
      <button
        onClick={onRetry}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--text-primary)", color: "white",
          border: "none", borderRadius: 12,
          padding: "12px 24px",
          fontSize: 14, fontWeight: 600,
          fontFamily: "var(--font-body)", cursor: "pointer",
        }}
      >
        <RefreshCw size={15} />
        Try Again
      </button>
    </div>
  );
}

function MetaRow({ label, value, right }: { label: string; value: string; right?: boolean }) {
  return (
    <div style={{ textAlign: right ? "right" : "left" }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
        {label}:{" "}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
        {value}
      </span>
    </div>
  );
}

export default function OutputPaper() {
  const router = useRouter();
  const paperRef = useRef<HTMLDivElement>(null);

  const [assignment, setAssignment] = useState<any>(null);
  const [studentName,  setStudentName]  = useState("");
  const [rollNumber,   setRollNumber]   = useState("");
  const [sectionName,  setSectionName]  = useState("");
  const [downloading,  setDownloading]  = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showAnswers,  setShowAnswers]  = useState(false);
  const [pollCount,    setPollCount]    = useState(0);
  const [failed,       setFailed]       = useState(false);

  const assignmentIdRef = useRef<string | null>(null);
  const pollTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ─── Fetch helper ─── */
  const fetchAssignment = useCallback(async (id: string) => {
    try {
      const res = await axios.get(`${API}/api/assignments/${id}`);
      const data = res.data;
      if (data.status === "completed" && data.result) {
        setAssignment(data);
        stopPolling();
      } else if (data.status === "failed") {
        setFailed(true);
        stopPolling();
      } else {
        // still pending / processing — keep polling
        setPollCount((c) => {
          if (c + 1 >= MAX_POLLS) {
            setFailed(true);
            stopPolling();
          }
          return c + 1;
        });
      }
    } catch {
      // network error — keep trying silently
    }
  }, []); // eslint-disable-line

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  /* ─── Boot ─── */
  useEffect(() => {
    const id = localStorage.getItem("assignmentId");
    if (!id) return;
    assignmentIdRef.current = id;

    // 1) Immediate fetch — handles the case where generation already completed
    fetchAssignment(id);

    // 2) Polling fallback — runs every 3s until done
    pollTimerRef.current = setInterval(() => {
      fetchAssignment(id);
    }, POLL_INTERVAL);

    // 3) WebSocket — instant update if connection is live
    const onComplete = (data: any) => {
      if (data.id === id || data.id === id.toString()) {
        setAssignment((prev: any) => ({ ...prev, result: data.result, status: "completed" }));
        stopPolling();
      }
    };
    const onFailed = (data: any) => {
      if (data.id === id || data.id === id.toString()) {
        setFailed(true);
        stopPolling();
      }
    };

    socket.on("generation-complete", onComplete);
    socket.on("generation-failed", onFailed);

    return () => {
      stopPolling();
      socket.off("generation-complete", onComplete);
      socket.off("generation-failed", onFailed);
    };
  }, [fetchAssignment]);

  /* ─── Download PDF ─── */
  const downloadPDF = async () => {
    if (!paperRef.current) return;
    setDownloading(true);
    try {
      const { default: jsPDF }       = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const canvas = await html2canvas(paperRef.current, {
        backgroundColor: "#ffffff",
        useCORS: true,
        scale: 2,
      });

      const pdf  = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      const pdfW = 210;
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);

      let remaining = pdfH - 297;
      while (remaining > 0) {
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -(pdfH - remaining), pdfW, pdfH);
        remaining -= 297;
      }
      pdf.save("assessment.pdf");
    } catch (err) {
      console.error("PDF error:", err);
    } finally {
      setDownloading(false);
    }
  };

  /* ─── Regenerate ─── */
  const regenerate = async () => {
    setRegenerating(true);
    setFailed(false);
    try {
      const saved = localStorage.getItem("lastForm");
      if (!saved) return;
      const form = JSON.parse(saved);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) =>
        fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v))
      );
      const res = await axios.post(`${API}/api/assignments`, fd);
      const newId = res.data.assignment._id;
      localStorage.setItem("assignmentId", newId);
      assignmentIdRef.current = newId;

      // Reset state and start polling again
      setAssignment(null);
      setPollCount(0);

      pollTimerRef.current = setInterval(() => {
        fetchAssignment(newId);
      }, POLL_INTERVAL);
    } catch (err) {
      console.error(err);
    } finally {
      setRegenerating(false);
    }
  };

  /* ─── Render ─── */
  if (failed) return <FailedState onRetry={regenerate} />;
  if (!assignment?.result) return <LoadingState pollCount={pollCount} />;

  const { result } = assignment;
  const totalQ = result.sections?.reduce(
    (s: number, sec: any) => s + (sec.questions?.length ?? 0), 0
  ) ?? 0;
  const totalM = result.sections?.reduce(
    (s: number, sec: any) =>
      s + (sec.questions?.reduce((ss: number, q: any) => ss + (q.marks ?? 0), 0) ?? 0),
    0
  ) ?? 0;

  return (
    <div className="animate-fade-up" style={{ maxWidth: 860, margin: "0 auto" }}>

      {/* ── Action bar ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <CheckCircle2 size={18} color="var(--status-active)" />
            <h1 style={{ fontWeight: 700, fontSize: 20, color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
              Generated Assessment
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 28, fontFamily: "var(--font-body)" }}>
            {totalQ} questions · {totalM} marks
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* Toggle answers */}
          <button
            onClick={() => setShowAnswers((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: showAnswers ? "#F0FDF4" : "white",
              border: `1px solid ${showAnswers ? "#22C55E" : "var(--border-default)"}`,
              borderRadius: 12, padding: "10px 18px",
              fontSize: 14, fontWeight: 500,
              fontFamily: "var(--font-body)", cursor: "pointer",
              color: showAnswers ? "#16A34A" : "var(--text-secondary)",
              transition: "all 0.2s",
            }}
          >
            {showAnswers ? <EyeOff size={15} /> : <Eye size={15} />}
            {showAnswers ? "Hide Answers" : "Show Answers"}
          </button>

          {/* Regenerate */}
          <button
            onClick={regenerate}
            disabled={regenerating}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "white",
              border: "1px solid var(--border-default)",
              borderRadius: 12, padding: "10px 18px",
              fontSize: 14, fontWeight: 500,
              fontFamily: "var(--font-body)",
              cursor: regenerating ? "not-allowed" : "pointer",
              color: "var(--text-secondary)",
              transition: "all 0.2s",
            }}
          >
            <RefreshCw size={15} style={regenerating ? { animation: "spin 1s linear infinite" } : {}} />
            Regenerate
          </button>

          {/* Download PDF */}
          <button
            onClick={downloadPDF}
            disabled={downloading}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--text-primary)", border: "none",
              borderRadius: 12, padding: "10px 18px",
              fontSize: 14, fontWeight: 600,
              fontFamily: "var(--font-body)",
              cursor: downloading ? "not-allowed" : "pointer",
              color: "white", transition: "background 0.2s",
            }}
          >
            {downloading
              ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
              : <Download size={15} />}
            Download PDF
          </button>
        </div>
      </div>

      {/* ── Paper ── */}
      <div
        ref={paperRef}
        style={{
          background: "white",
          border: "1px solid var(--border-card)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}
      >
        {/* School header */}
        <div style={{
          background: "var(--text-primary)",
          color: "white",
          padding: "28px 36px",
          textAlign: "center",
        }}>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: 22, fontWeight: 400,
            letterSpacing: 0.5, marginBottom: 4,
          }}>
            Delhi Public School, Sector-4, Bokaro
          </h2>
          <p style={{ fontSize: 14, opacity: 0.7, fontFamily: "var(--font-body)" }}>
            AI-Generated Assessment Paper
          </p>
        </div>

        {/* Meta row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          borderBottom: "2px solid var(--border-default)",
          padding: "16px 36px",
          background: "#FAFAFA",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <MetaRow label="Time Allowed" value="3 Hours" />
            <MetaRow label="Due Date" value={
              assignment.dueDate
                ? new Date(assignment.dueDate).toLocaleDateString("en-GB")
                : "—"
            } />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: "right" }}>
            <MetaRow label="Maximum Marks" value={String(totalM)} right />
            <MetaRow label="Total Questions" value={String(totalQ)} right />
          </div>
        </div>

        <div style={{
          padding: "12px 36px",
          borderBottom: "1px solid var(--border-default)",
          background: "#FAFAFA",
        }}>
          <p style={{
            fontSize: 13, color: "var(--text-secondary)",
            fontStyle: "italic", fontFamily: "var(--font-body)",
          }}>
            All questions are compulsory unless stated otherwise.
          </p>
        </div>

        {/* Student info */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 20,
          padding: "20px 36px",
          borderBottom: "1px solid var(--border-default)",
        }}>
          {[
            { label: "Name",         value: studentName,  setter: setStudentName },
            { label: "Roll Number",  value: rollNumber,   setter: setRollNumber },
            { label: "Class/Section",value: sectionName,  setter: setSectionName },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <span style={{
                fontSize: 13, fontWeight: 600,
                color: "var(--text-secondary)", fontFamily: "var(--font-body)",
              }}>
                {label}:{" "}
              </span>
              <input
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder="________________"
                style={{
                  border: "none",
                  borderBottom: "1px solid var(--text-primary)",
                  outline: "none",
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                  width: "60%",
                  paddingBottom: 2,
                  background: "transparent",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          ))}
        </div>

        {/* Sections */}
        <div style={{ padding: "28px 36px" }}>
          {result.sections?.map((section: any, si: number) => (
            <div key={si} style={{ marginBottom: 36 }}>
              {/* Section header */}
              <div style={{
                display: "flex", alignItems: "baseline", gap: 12,
                marginBottom: 6, paddingBottom: 10,
                borderBottom: "2px solid var(--text-primary)",
              }}>
                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 20, fontWeight: 400,
                  color: "var(--text-primary)",
                }}>
                  {section.title}
                </h3>
                <span style={{
                  fontSize: 11, color: "var(--text-muted)",
                  fontFamily: "var(--font-body)",
                }}>
                  ({section.questions?.length ?? 0} questions)
                </span>
              </div>

              {section.instruction && (
                <p style={{
                  fontSize: 13, color: "var(--text-secondary)",
                  fontStyle: "italic", marginBottom: 16,
                  fontFamily: "var(--font-body)",
                }}>
                  {section.instruction}
                </p>
              )}

              {/* Questions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {section.questions?.map((q: any, qi: number) => {
                  const globalIdx =
                    result.sections
                      .slice(0, si)
                      .reduce((s: number, sec: any) => s + (sec.questions?.length ?? 0), 0) +
                    qi +
                    1;

                  return (
                    <div
                      key={qi}
                      style={{
                        background: "#FAFAFA",
                        border: "1px solid var(--border-card)",
                        borderRadius: 12,
                        padding: "14px 18px",
                        transition: "box-shadow 0.15s",
                      }}
                    >
                      {/* Question text + marks */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                      }}>
                        <p style={{
                          fontSize: 14, lineHeight: 1.6,
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-body)", flex: 1,
                        }}>
                          <strong style={{ marginRight: 4 }}>{globalIdx}.</strong>
                          {q.text}
                        </p>
                        <span style={{
                          flexShrink: 0, fontSize: 12, fontWeight: 600,
                          color: "var(--text-muted)", fontFamily: "var(--font-body)",
                          whiteSpace: "nowrap",
                        }}>
                          [{q.marks} Marks]
                        </span>
                      </div>

                      {/* MCQ options */}
                      {q.options && q.options.length > 0 && (
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "4px 16px",
                          marginTop: 10, paddingLeft: 16,
                        }}>
                          {q.options.map((opt: string, oi: number) => (
                            <span key={oi} style={{
                              fontSize: 13,
                              color: "var(--text-secondary)",
                              fontFamily: "var(--font-body)",
                              lineHeight: 1.5,
                            }}>
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Badges */}
                      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                        <DifficultyBadge level={q.difficulty ?? "Medium"} />
                        <MarksBadge marks={q.marks ?? 1} />
                        {q.type && (
                          <span style={{
                            background: "#F0F0F0",
                            color: "var(--text-secondary)",
                            fontSize: 11, fontWeight: 500,
                            padding: "3px 10px", borderRadius: 99,
                            fontFamily: "var(--font-body)",
                          }}>
                            {q.type}
                          </span>
                        )}
                      </div>

                      {/* Inline answer */}
                      {showAnswers && q.answer && (
                        <div style={{
                          marginTop: 14,
                          background: "#F0FDF4",
                          borderRadius: "0 0 8px 8px",
                          margin: "14px -18px -14px -18px",
                          padding: "12px 18px 14px 18px",
                          borderTop: "1px dashed #D1FAE5",
                        }}>
                          <div style={{
                            display: "flex", alignItems: "center",
                            gap: 6, marginBottom: 6,
                          }}>
                            <span style={{
                              background: "#22C55E", color: "white",
                              fontSize: 10, fontWeight: 700,
                              padding: "2px 8px", borderRadius: 99,
                              fontFamily: "var(--font-body)", letterSpacing: 0.5,
                            }}>
                              ANSWER
                            </span>
                          </div>
                          <p style={{
                            fontSize: 13, lineHeight: 1.65,
                            color: "#166534", fontFamily: "var(--font-body)", margin: 0,
                          }}>
                            {q.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* End of paper */}
          <div style={{
            textAlign: "center", marginTop: 28,
            paddingTop: 20, borderTop: "2px solid var(--text-primary)",
          }}>
            <p style={{
              fontSize: 13, fontWeight: 600,
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)", letterSpacing: 1,
            }}>
              *** End of Question Paper ***
            </p>
          </div>
        </div>
      </div>

      {/* ── Answer Key ── */}
      {showAnswers && (
        <div style={{
          marginTop: 24, background: "white",
          border: "1px solid #BBF7D0",
          borderRadius: 20, overflow: "hidden",
          boxShadow: "0 2px 12px rgba(34,197,94,0.08)",
        }}>
          <div style={{
            background: "linear-gradient(135deg, #16A34A, #22C55E)",
            padding: "20px 28px",
          }}>
            <h3 style={{
              fontFamily: "var(--font-body)", fontWeight: 700,
              fontSize: 18, color: "white", margin: 0,
            }}>
              📋 Answer Key
            </h3>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: 13,
              color: "rgba(255,255,255,0.8)", marginTop: 4, marginBottom: 0,
            }}>
              Model answers for all {totalQ} questions
            </p>
          </div>
          <div style={{ padding: "20px 28px" }}>
            {result.sections?.map((section: any, si: number) => (
              <div key={si} style={{ marginBottom: 28 }}>
                <h4 style={{
                  fontFamily: "var(--font-body)", fontWeight: 700,
                  fontSize: 15, color: "#16A34A",
                  marginBottom: 14, paddingBottom: 8,
                  borderBottom: "2px solid #BBF7D0",
                }}>
                  {section.title}
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {section.questions?.map((q: any, qi: number) => {
                    const globalIdx =
                      result.sections
                        .slice(0, si)
                        .reduce((s: number, sec: any) => s + (sec.questions?.length ?? 0), 0) +
                      qi +
                      1;
                    return (
                      <div key={qi} style={{
                        display: "flex", gap: 12,
                        padding: "12px 16px",
                        background: "#F0FDF4",
                        borderRadius: 10, border: "1px solid #D1FAE5",
                      }}>
                        <span style={{
                          fontFamily: "var(--font-body)", fontWeight: 800,
                          fontSize: 14, color: "#16A34A",
                          flexShrink: 0, minWidth: 24,
                        }}>
                          {globalIdx}.
                        </span>
                        <div>
                          <p style={{
                            fontFamily: "var(--font-body)", fontSize: 12,
                            color: "#6B7280", marginBottom: 4, fontStyle: "italic",
                          }}>
                            {q.text.slice(0, 70)}{q.text.length > 70 ? "…" : ""}
                          </p>
                          <p style={{
                            fontFamily: "var(--font-body)", fontSize: 13,
                            color: "#166534", lineHeight: 1.6, margin: 0,
                          }}>
                            {q.answer || "—"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => router.push("/create")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "transparent", border: "none",
            fontSize: 13, fontFamily: "var(--font-body)",
            color: "var(--text-muted)", cursor: "pointer", padding: 0,
          }}
        >
          <ChevronLeft size={14} />
          Create another assignment
        </button>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .paper-meta-grid    { grid-template-columns: 1fr !important; }
          .paper-student-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
