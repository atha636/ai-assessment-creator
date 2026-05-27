"use client";

import { useEffect, useState, useRef } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const DIFFICULTY_STYLES: Record<string, React.CSSProperties> = {
  Easy: { background: "var(--badge-easy)", color: "var(--badge-easy-text)" },
  Medium: { background: "var(--badge-medium)", color: "var(--badge-medium-text)" },
  Moderate: { background: "var(--badge-medium)", color: "var(--badge-medium-text)" },
  Hard: { background: "var(--badge-hard)", color: "var(--badge-hard-text)" },
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

function LoadingState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: "60vh", gap: 20,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "var(--bg-tag)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Loader2 size={32} color="var(--brand-primary)"
          style={{ animation: "spin 1s linear infinite" }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontWeight: 700, fontSize: 20, color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
          Generating AI Paper…
        </h2>
        <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 14, fontFamily: "var(--font-body)" }}>
          Please wait while AI creates your assessment
        </p>
      </div>
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
  const [studentName, setStudentName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("assignmentId");
    if (!id) return;
    axios.get(`${API}/api/assignments/${id}`)
      .then((res) => setAssignment(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    socket.on("generation-complete", (data) => {
      setAssignment((prev: any) => ({ ...prev, result: data.result, status: "completed" }));
    });
    return () => { socket.off("generation-complete"); };
  }, []);

  const downloadPDF = async () => {
    if (!paperRef.current) return;
    setDownloading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const canvas = await html2canvas(paperRef.current, {
        backgroundColor: "#ffffff",
        useCORS: true,
        scale: 2,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      const pdfW = 210;
      const pdfH = (canvas.height * pdfW) / canvas.width;
      let pos = 0;
      let remaining = pdfH;

      pdf.addImage(imgData, "PNG", 0, pos, pdfW, pdfH);
      remaining -= 297;
      while (remaining > 0) {
        pos = remaining - pdfH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, pos, pdfW, pdfH);
        remaining -= 297;
      }
      pdf.save("assessment.pdf");
    } catch (err) {
      console.error("PDF error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const saved = localStorage.getItem("lastForm");
      if (!saved) return;
      const form = JSON.parse(saved);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) =>
        fd.append(k, typeof v === "object" ? JSON.stringify(v) : String(v))
      );
      const res = await axios.post(`${API}/api/assignments`, fd);
      localStorage.setItem("assignmentId", res.data.assignment._id);
      setAssignment(null);
    } catch (err) {
      console.error(err);
    } finally {
      setRegenerating(false);
    }
  };

  if (!assignment || !assignment.result) return <LoadingState />;

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
      {/* Page header */}
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
          {/* Toggle answers button */}
          <button
            onClick={() => setShowAnswers((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: showAnswers ? "#F0FDF4" : "white",
              border: `1px solid ${showAnswers ? "#22C55E" : "var(--border-default)"}`,
              borderRadius: 12,
              padding: "10px 18px",
              fontSize: 14, fontWeight: 500,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
              color: showAnswers ? "#16A34A" : "var(--text-secondary)",
              transition: "all 0.2s",
            }}
          >
            {showAnswers ? <EyeOff size={15} /> : <Eye size={15} />}
            {showAnswers ? "Hide Answers" : "Show Answers"}
          </button>

          <button
            onClick={regenerate}
            disabled={regenerating}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "white",
              border: "1px solid var(--border-default)",
              borderRadius: 12,
              padding: "10px 18px",
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

          <button
            onClick={downloadPDF}
            disabled={downloading}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--text-primary)",
              border: "none",
              borderRadius: 12,
              padding: "10px 18px",
              fontSize: 14, fontWeight: 600,
              fontFamily: "var(--font-body)",
              cursor: downloading ? "not-allowed" : "pointer",
              color: "white",
              transition: "background 0.2s",
            }}
          >
            {downloading
              ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
              : <Download size={15} />}
            Download PDF
          </button>
        </div>
      </div>

      {/* Paper */}
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
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: 0.5,
            marginBottom: 4,
          }}>
            Delhi Public School, Sector-4, Bokaro
          </h2>
          <p style={{ fontSize: 14, opacity: 0.7, fontFamily: "var(--font-body)" }}>
            AI-Generated Assessment Paper
          </p>
        </div>

        {/* Meta */}
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
            <MetaRow label="Due Date" value={assignment.dueDate
              ? new Date(assignment.dueDate).toLocaleDateString("en-GB")
              : "—"} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: "right" }}>
            <MetaRow label="Maximum Marks" value={String(totalM)} right />
            <MetaRow label="Total Questions" value={String(totalQ)} right />
          </div>
        </div>

        <div style={{ padding: "20px 36px", borderBottom: "1px solid var(--border-default)", background: "#FAFAFA" }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic", fontFamily: "var(--font-body)" }}>
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
            { label: "Name", value: studentName, setter: setStudentName },
            { label: "Roll Number", value: rollNumber, setter: setRollNumber },
            { label: "Class/Section", value: sectionName, setter: setSectionName },
          ].map(({ label, value, setter }) => (
            <div key={label}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
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
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                marginBottom: 6,
                paddingBottom: 10,
                borderBottom: "2px solid var(--text-primary)",
              }}>
                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 20,
                  fontWeight: 400,
                  color: "var(--text-primary)",
                }}>
                  {section.title}
                </h3>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                  ({section.questions?.length ?? 0} questions)
                </span>
              </div>

              {section.instruction && (
                <p style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  fontStyle: "italic",
                  marginBottom: 16,
                  fontFamily: "var(--font-body)",
                }}>
                  {section.instruction}
                </p>
              )}

              {/* Questions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {section.questions?.map((q: any, qi: number) => {
                  const globalIdx = result.sections
                    .slice(0, si)
                    .reduce((s: number, sec: any) => s + (sec.questions?.length ?? 0), 0) + qi + 1;

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
                      {/* Question text */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <p style={{
                          fontSize: 14,
                          lineHeight: 1.6,
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-body)",
                          flex: 1,
                        }}>
                          <strong style={{ marginRight: 4 }}>{globalIdx}.</strong>
                          {q.text}
                        </p>
                        <span style={{
                          flexShrink: 0,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-body)",
                          whiteSpace: "nowrap",
                        }}>
                          [{q.marks} Marks]
                        </span>
                      </div>

                      {/* MCQ Options */}
                      {q.options && q.options.length > 0 && (
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "4px 16px",
                          marginTop: 10,
                          paddingLeft: 16,
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
                            fontSize: 11,
                            fontWeight: 500,
                            padding: "3px 10px",
                            borderRadius: 99,
                            fontFamily: "var(--font-body)",
                          }}>
                            {q.type}
                          </span>
                        )}
                      </div>

                      {/* Answer — shown when toggled */}
                      {showAnswers && q.answer && (
                        <div style={{
                          marginTop: 14,
                          paddingTop: 12,
                          borderTop: "1px dashed #D1FAE5",
                          background: "#F0FDF4",
                          borderRadius: "0 0 8px 8px",
                          margin: "14px -18px -14px -18px",
                          padding: "12px 18px 14px 18px",
                        }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 6,
                          }}>
                            <span style={{
                              background: "#22C55E",
                              color: "white",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 99,
                              fontFamily: "var(--font-body)",
                              letterSpacing: 0.5,
                            }}>
                              ANSWER
                            </span>
                          </div>
                          <p style={{
                            fontSize: 13,
                            lineHeight: 1.65,
                            color: "#166534",
                            fontFamily: "var(--font-body)",
                            margin: 0,
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

          {/* End line */}
          <div style={{
            textAlign: "center",
            marginTop: 28,
            paddingTop: 20,
            borderTop: "2px solid var(--text-primary)",
          }}>
            <p style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              letterSpacing: 1,
            }}>
              *** End of Question Paper ***
            </p>
          </div>
        </div>
      </div>

      {/* Answer Key section — full list at bottom */}
      {showAnswers && (
        <div style={{
          marginTop: 24,
          background: "white",
          border: "1px solid #BBF7D0",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(34,197,94,0.08)",
        }}>
          <div style={{
            background: "linear-gradient(135deg, #16A34A, #22C55E)",
            padding: "20px 28px",
          }}>
            <h3 style={{
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 18,
              color: "white",
              margin: 0,
            }}>
              📋 Answer Key
            </h3>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: "rgba(255,255,255,0.8)",
              marginTop: 4,
              marginBottom: 0,
            }}>
              Model answers for all {totalQ} questions
            </p>
          </div>

          <div style={{ padding: "20px 28px" }}>
            {result.sections?.map((section: any, si: number) => (
              <div key={si} style={{ marginBottom: 28 }}>
                <h4 style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#16A34A",
                  marginBottom: 14,
                  paddingBottom: 8,
                  borderBottom: "2px solid #BBF7D0",
                }}>
                  {section.title}
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {section.questions?.map((q: any, qi: number) => {
                    const globalIdx = result.sections
                      .slice(0, si)
                      .reduce((s: number, sec: any) => s + (sec.questions?.length ?? 0), 0) + qi + 1;

                    return (
                      <div key={qi} style={{
                        display: "flex",
                        gap: 12,
                        padding: "12px 16px",
                        background: "#F0FDF4",
                        borderRadius: 10,
                        border: "1px solid #D1FAE5",
                      }}>
                        <span style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 800,
                          fontSize: 14,
                          color: "#16A34A",
                          flexShrink: 0,
                          minWidth: 24,
                        }}>
                          {globalIdx}.
                        </span>
                        <div>
                          <p style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 12,
                            color: "#6B7280",
                            marginBottom: 4,
                            fontStyle: "italic",
                          }}>
                            {q.text.slice(0, 60)}{q.text.length > 60 ? "…" : ""}
                          </p>
                          <p style={{
                            fontFamily: "var(--font-body)",
                            fontSize: 13,
                            color: "#166534",
                            lineHeight: 1.6,
                            margin: 0,
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

      {/* Back button */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => router.push("/create")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "transparent",
            border: "none",
            fontSize: 13,
            fontFamily: "var(--font-body)",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <ChevronLeft size={14} />
          Create another assignment
        </button>
      </div>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 640px) {
          .paper-meta-grid { grid-template-columns: 1fr !important; }
          .paper-student-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}