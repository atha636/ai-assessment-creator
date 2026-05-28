"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Upload,
  X,
  Plus,
  Minus,
  ChevronDown,
  Calendar,
  FileText,
  Loader2,
} from "lucide-react";
import { useAssignmentStore } from "@/store/assignmentStore";

const QUESTION_TYPE_OPTIONS = [
  "Multiple Choice Questions",
  "Short Questions",
  "Long Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "True/False",
  "Fill in the Blanks",
];

/* ─── Step Bar ─── */
function StepBar({ step }: { step: number }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2].map((s) => (
          <div
            key={s}
            style={{
              height: 4,
              flex: 1,
              borderRadius: 99,
              background: s <= step ? "var(--text-primary)" : "var(--border-default)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── File Dropzone ─── */
function FileDropzone({
  file,
  onFile,
  onClear,
}: {
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  return (
    <div
      onClick={() => !file && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? "var(--brand-primary)" : "var(--border-default)"}`,
        borderRadius: 14,
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        cursor: file ? "default" : "pointer",
        background: dragging ? "var(--bg-tag)" : "var(--bg-input)",
        transition: "all 0.2s",
        position: "relative",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />

      {file ? (
        <>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "var(--bg-tag)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FileText size={22} color="var(--brand-primary)" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", wordBreak: "break-all" }}>
              {file.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            style={{
              position: "absolute", top: 10, right: 10,
              background: "var(--border-default)", border: "none",
              borderRadius: "50%", width: 26, height: 26,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={13} />
          </button>
        </>
      ) : (
        <>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "var(--border-default)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Upload size={22} color="var(--text-muted)" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 500, fontSize: 14, color: "var(--text-primary)" }}>
              Choose a file or drag &amp; drop it here
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
              PDF, JPEG, PNG · up to 10MB
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            style={{
              marginTop: 4,
              background: "white",
              border: "1px solid var(--border-default)",
              borderRadius: 8,
              padding: "8px 22px",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
              color: "var(--text-primary)",
            }}
          >
            Browse Files
          </button>
        </>
      )}
    </div>
  );
}

/* ─── Stepper Control ─── */
function Stepper({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "center" }}>
      <span style={{
        fontSize: 10,
        color: "var(--text-muted)",
        fontWeight: 600,
        fontFamily: "var(--font-body)",
        textAlign: "center",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button type="button" onClick={onDec} style={stepBtnStyle}>
          <Minus size={11} />
        </button>
        <span style={{
          minWidth: 22,
          textAlign: "center",
          fontWeight: 700,
          fontSize: 14,
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
        }}>
          {value}
        </span>
        <button type="button" onClick={onInc} style={stepBtnStyle}>
          <Plus size={11} />
        </button>
      </div>
    </div>
  );
}

/* ─── Question Type Row ─── */
function QuestionTypeRow({
  row,
  onRemove,
  onUpdate,
  index,
}: {
  row: { id: string; type: string; numQuestions: number; marks: number };
  onRemove: () => void;
  onUpdate: (field: string, value: any) => void;
  index: number;
}) {
  const [typeOpen, setTypeOpen] = useState(false);

  return (
    <div style={{
      background: "var(--bg-input)",
      border: "1px solid var(--border-default)",
      borderRadius: 12,
      padding: "12px 14px",
      marginBottom: 10,
      position: "relative",
    }}>
      {/* Row number + remove */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--brand-primary)",
          fontFamily: "var(--font-body)",
          background: "var(--bg-tag)",
          padding: "2px 10px",
          borderRadius: 99,
        }}>
          Section {String.fromCharCode(64 + index + 1)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: "transparent",
            border: "1px solid var(--border-default)",
            borderRadius: 8,
            width: 28, height: 28,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-muted)",
          }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Type dropdown */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <label style={{ ...labelStyle, marginBottom: 6, fontSize: 12 }}>Question Type</label>
        <button
          type="button"
          onClick={() => setTypeOpen((o) => !o)}
          style={{
            width: "100%",
            background: "white",
            border: "1px solid var(--border-default)",
            borderRadius: 10,
            padding: "11px 40px 11px 14px",
            textAlign: "left",
            fontSize: 13,
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            color: "var(--text-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {row.type}
          </span>
          <ChevronDown
            size={15}
            color="var(--text-muted)"
            style={{
              position: "absolute", right: 12,
              transition: "transform 0.2s",
              transform: typeOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>

        {typeOpen && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 100 }}
              onClick={() => setTypeOpen(false)}
            />
            <div style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0, right: 0,
              background: "white",
              border: "1px solid var(--border-default)",
              borderRadius: 12,
              zIndex: 101,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              overflow: "hidden",
            }}>
              {QUESTION_TYPE_OPTIONS.map((opt) => (
                <div
                  key={opt}
                  onClick={() => { onUpdate("type", opt); setTypeOpen(false); }}
                  style={{
                    padding: "12px 14px",
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    background: opt === row.type ? "var(--bg-tag)" : "transparent",
                    color: opt === row.type ? "var(--brand-primary)" : "var(--text-primary)",
                    fontWeight: opt === row.type ? 600 : 400,
                    borderBottom: "1px solid var(--border-default)",
                  }}
                >
                  {opt}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Steppers row */}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{
          flex: 1,
          background: "white",
          border: "1px solid var(--border-default)",
          borderRadius: 10,
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "center",
        }}>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: "var(--text-muted)", fontFamily: "var(--font-body)",
          }}>
            No. of Questions
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={() => onUpdate("numQuestions", Math.max(1, row.numQuestions - 1))}
              style={stepBtnStyle}
            >
              <Minus size={12} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 16, minWidth: 28, textAlign: "center", color: "var(--text-primary)" }}>
              {row.numQuestions}
            </span>
            <button
              type="button"
              onClick={() => onUpdate("numQuestions", row.numQuestions + 1)}
              style={stepBtnStyle}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        <div style={{
          flex: 1,
          background: "white",
          border: "1px solid var(--border-default)",
          borderRadius: 10,
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "center",
        }}>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: "var(--text-muted)", fontFamily: "var(--font-body)",
          }}>
            Marks Each
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={() => onUpdate("marks", Math.max(1, row.marks - 1))}
              style={stepBtnStyle}
            >
              <Minus size={12} />
            </button>
            <span style={{ fontWeight: 700, fontSize: 16, minWidth: 28, textAlign: "center", color: "var(--text-primary)" }}>
              {row.marks}
            </span>
            <button
              type="button"
              onClick={() => onUpdate("marks", row.marks + 1)}
              style={stepBtnStyle}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const stepBtnStyle: React.CSSProperties = {
  width: 30, height: 30,
  borderRadius: 8,
  border: "1px solid var(--border-default)",
  background: "white",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer",
  color: "var(--text-secondary)",
  flexShrink: 0,
};

/* ─── Main Form ─── */
export default function AssignmentForm() {
  const router = useRouter();
  const {
    loading, setLoading,
    formData, setFormData,
    addQuestionType, removeQuestionType, updateQuestionType,
  } = useAssignmentStore();

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const totalQuestions = formData.questionTypes.reduce((s, q) => s + q.numQuestions, 0);
  const totalMarks = formData.questionTypes.reduce((s, q) => s + q.numQuestions * q.marks, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.dueDate) { setError("Please select a due date."); return; }
    if (formData.questionTypes.length === 0) { setError("Add at least one question type."); return; }
    for (const qt of formData.questionTypes) {
      if (qt.numQuestions <= 0) { setError("Number of questions must be positive."); return; }
      if (qt.marks <= 0) { setError("Marks must be positive."); return; }
    }

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("dueDate", formData.dueDate);
      fd.append("questionTypes", JSON.stringify(formData.questionTypes));
      fd.append("totalQuestions", String(totalQuestions));
      fd.append("marks", String(totalMarks));
      fd.append("instructions", formData.instructions);
      if (file) fd.append("file", file);

      localStorage.setItem("lastForm", JSON.stringify({
        dueDate: formData.dueDate,
        questionTypes: formData.questionTypes,
        totalQuestions,
        marks: totalMarks,
        instructions: formData.instructions,
      }));

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/assignments`,
        fd
      );

      localStorage.setItem("assignmentId", res.data.assignment._id);
      router.push("/output");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .form-wrapper {
          max-width: 680px;
          margin: 0 auto;
          padding: 0 0 100px 0;
        }
        .form-card {
          background: var(--bg-card);
          border: 1px solid var(--border-card);
          border-radius: 20px;
          padding: 24px 24px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        @media (max-width: 480px) {
          .form-card { padding: 18px 16px; border-radius: 16px; }
        }
        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .btn-prev {
          display: flex; align-items: center; gap: 8px;
          background: transparent;
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 12px 20px;
          font-size: 14px; font-weight: 500;
          font-family: var(--font-body);
          cursor: pointer;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .btn-submit {
          display: flex; align-items: center; gap: 8px;
          border: none;
          border-radius: 12px;
          padding: 12px 28px;
          font-size: 14px; font-weight: 600;
          font-family: var(--font-body);
          cursor: pointer;
          color: white;
          white-space: nowrap;
          flex: 1;
          justify-content: center;
          max-width: 200px;
          margin-left: auto;
        }
        @media (max-width: 380px) {
          .btn-prev { padding: 12px 14px; font-size: 13px; }
          .btn-submit { padding: 12px 18px; font-size: 13px; }
        }
        .totals-row {
          display: flex;
          justify-content: flex-end;
          gap: 20px;
          padding: 12px 0;
          border-top: 1px solid var(--border-default);
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        @media (max-width: 400px) {
          .totals-row { justify-content: space-between; gap: 8px; }
        }
      `}</style>

      <div className="animate-fade-up form-wrapper">
        {/* Page header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: "var(--status-active)", flexShrink: 0,
            }} />
            <h1 style={{
              fontFamily: "var(--font-body)", fontWeight: 700,
              fontSize: 20, color: "var(--text-primary)",
            }}>
              Create Assignment
            </h1>
          </div>
          <p style={{
            fontSize: 13, color: "var(--text-muted)",
            marginLeft: 20, fontFamily: "var(--font-body)",
          }}>
            Set up a new assignment for your students
          </p>
        </div>

        <StepBar step={1} />

        <form onSubmit={handleSubmit}>
          <div className="form-card">

            {/* Section header */}
            <div style={{ marginBottom: 20 }}>
              <h2 style={{
                fontWeight: 700, fontSize: 17,
                color: "var(--text-primary)", fontFamily: "var(--font-body)",
              }}>
                Assignment Details
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3, fontFamily: "var(--font-body)" }}>
                Basic information about your assignment
              </p>
            </div>

            {/* File upload */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Upload File <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
              <FileDropzone file={file} onFile={setFile} onClear={() => setFile(null)} />
            </div>

            {/* Due Date */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Due Date</label>
              <div style={{ position: "relative" }}>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ dueDate: e.target.value })}
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <Calendar
                  size={17}
                  color="var(--text-muted)"
                  style={{
                    position: "absolute", right: 14, top: "50%",
                    transform: "translateY(-50%)", pointerEvents: "none",
                  }}
                />
              </div>
            </div>

            {/* Question Types */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 12 }}>Question Types</label>

              {formData.questionTypes.map((row, index) => (
                <QuestionTypeRow
                  key={row.id}
                  row={row}
                  index={index}
                  onRemove={() => removeQuestionType(row.id)}
                  onUpdate={(field, value) => updateQuestionType(row.id, field as any, value)}
                />
              ))}

              <button
                type="button"
                onClick={addQuestionType}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  marginTop: 4, marginBottom: 16,
                  background: "transparent",
                  border: "1.5px dashed var(--border-default)",
                  borderRadius: 12,
                  width: "100%",
                  padding: "12px 16px",
                  color: "var(--text-secondary)",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  justifyContent: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--brand-primary)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--brand-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-default)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "var(--text-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Plus size={12} color="white" />
                </div>
                Add Question Type
              </button>
            </div>

            {/* Totals */}
            <div className="totals-row">
              <div style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-default)",
                borderRadius: 10,
                padding: "8px 16px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-body)", marginBottom: 2 }}>
                  Total Questions
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
                  {totalQuestions}
                </div>
              </div>
              <div style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-default)",
                borderRadius: 10,
                padding: "8px 16px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-body)", marginBottom: 2 }}>
                  Total Marks
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
                  {totalMarks}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Additional Instructions</label>
              <div style={{ position: "relative" }}>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ instructions: e.target.value })}
                  placeholder="e.g. Generate a question paper for 3 hour exam, Class 10 CBSE..."
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: 100,
                    paddingBottom: 40,
                  }}
                />
                {/* mic button */}
                <div style={{
                  position: "absolute", bottom: 12, right: 12,
                  width: 28, height: 28, borderRadius: "50%",
                  background: "var(--text-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "#FEE2E2", border: "1px solid #FECACA",
                borderRadius: 10, padding: "11px 14px",
                fontSize: 13, color: "#991B1B",
                marginBottom: 20, fontFamily: "var(--font-body)",
                lineHeight: 1.5,
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Actions */}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-prev"
              >
                ← Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="btn-submit"
                style={{
                  background: loading ? "var(--text-muted)" : "var(--text-primary)",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                    Generating…
                  </>
                ) : (
                  "Generate Paper →"
                )}
              </button>
            </div>

          </div>
        </form>
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: 8,
  fontFamily: "var(--font-body)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg-input)",
  border: "1px solid var(--border-default)",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 14,
  fontFamily: "var(--font-body)",
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};