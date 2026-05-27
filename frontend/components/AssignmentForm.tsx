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

function StepBar({ step }: { step: number }) {
  return (
    <div style={{ marginBottom: 28 }}>
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
        padding: "28px 20px",
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
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
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
              borderRadius: "50%", width: 24, height: 24,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={12} />
          </button>
        </>
      ) : (
        <>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "var(--border-default)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Upload size={20} color="var(--text-muted)" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 500, fontSize: 14, color: "var(--text-primary)" }}>
              Choose a file or drag &amp; drop it here
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              JPEG, PNG, upto 10MB
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            style={{
              marginTop: 4,
              background: "white",
              border: "1px solid var(--border-default)",
              borderRadius: 8,
              padding: "7px 18px",
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

function QuestionTypeRow({
  row,
  onRemove,
  onUpdate,
}: {
  row: { id: string; type: string; numQuestions: number; marks: number };
  onRemove: () => void;
  onUpdate: (field: string, value: any) => void;
}) {
  const [typeOpen, setTypeOpen] = useState(false);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr auto auto auto",
      gap: 12,
      alignItems: "center",
      marginBottom: 12,
    }}>
      {/* Type dropdown */}
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setTypeOpen((o) => !o)}
          style={{
            width: "100%",
            background: "white",
            border: "1px solid var(--border-default)",
            borderRadius: 10,
            padding: "10px 36px 10px 14px",
            textAlign: "left",
            fontSize: 13,
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            color: "var(--text-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.type}
          </span>
          <ChevronDown size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        </button>
        {typeOpen && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid var(--border-default)",
            borderRadius: 10,
            zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}>
            {QUESTION_TYPE_OPTIONS.map((opt) => (
              <div
                key={opt}
                onClick={() => { onUpdate("type", opt); setTypeOpen(false); }}
                style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  background: opt === row.type ? "var(--bg-tag)" : "transparent",
                  color: opt === row.type ? "var(--brand-primary)" : "var(--text-primary)",
                  transition: "background 0.15s",
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Num Questions stepper */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>No. of Questions</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => onUpdate("numQuestions", Math.max(1, row.numQuestions - 1))}
            style={stepBtn}
          >
            <Minus size={12} />
          </button>
          <span style={{ minWidth: 24, textAlign: "center", fontWeight: 600, fontSize: 14 }}>
            {row.numQuestions}
          </span>
          <button
            type="button"
            onClick={() => onUpdate("numQuestions", row.numQuestions + 1)}
            style={stepBtn}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Marks stepper */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>Marks</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => onUpdate("marks", Math.max(1, row.marks - 1))}
            style={stepBtn}
          >
            <Minus size={12} />
          </button>
          <span style={{ minWidth: 24, textAlign: "center", fontWeight: 600, fontSize: 14 }}>
            {row.marks}
          </span>
          <button
            type="button"
            onClick={() => onUpdate("marks", row.marks + 1)}
            style={stepBtn}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: "transparent",
          border: "1px solid var(--border-default)",
          borderRadius: 8,
          width: 32, height: 32,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          color: "var(--text-muted)",
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

const stepBtn: React.CSSProperties = {
  width: 28, height: 28,
  borderRadius: 8,
  border: "1px solid var(--border-default)",
  background: "white",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer",
  color: "var(--text-secondary)",
  flexShrink: 0,
};

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

    // Validation
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
    <div className="animate-fade-up" style={{ maxWidth: 780, margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: "var(--status-active)",
          }} />
          <h1 style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 22, color: "var(--text-primary)" }}>
            Create Assignment
          </h1>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 20, fontFamily: "var(--font-body)" }}>
          Set up a new assignment for your students
        </p>
      </div>

      <StepBar step={1} />

      <form onSubmit={handleSubmit}>
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          borderRadius: 20,
          padding: 28,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          {/* Assignment Details header */}
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontWeight: 700, fontSize: 17, color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>
              Assignment Details
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
              Basic information about your assignment
            </p>
          </div>

          {/* File upload */}
          <div style={{ marginBottom: 20 }}>
            <FileDropzone
              file={file}
              onFile={setFile}
              onClear={() => setFile(null)}
            />
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, textAlign: "center" }}>
              Upload images of your preferred document/image
            </p>
          </div>

          {/* Due Date */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Due Date</label>
            <div style={{ position: "relative" }}>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ dueDate: e.target.value })}
                style={{
                  ...inputStyle,
                  paddingRight: 44,
                }}
              />
              <Calendar
                size={18}
                color="var(--text-muted)"
                style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
            </div>
          </div>

          {/* Question Types */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Question Type</label>
              <div style={{ display: "flex", gap: 40 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>No. of Questions</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginRight: 40 }}>Marks</span>
              </div>
            </div>

            {formData.questionTypes.map((row) => (
              <QuestionTypeRow
                key={row.id}
                row={row}
                onRemove={() => removeQuestionType(row.id)}
                onUpdate={(field, value) => updateQuestionType(row.id, field as any, value)}
              />
            ))}

            <button
              type="button"
              onClick={addQuestionType}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                marginTop: 8,
                background: "transparent",
                border: "none",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                padding: "6px 0",
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--text-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Plus size={14} color="white" />
              </div>
              Add Question Type
            </button>
          </div>

          {/* Totals */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 24,
            padding: "12px 0",
            borderTop: "1px solid var(--border-default)",
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
              Total Questions : <strong style={{ color: "var(--text-primary)" }}>{totalQuestions}</strong>
            </span>
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>
              Total Marks : <strong style={{ color: "var(--text-primary)" }}>{totalMarks}</strong>
            </span>
          </div>

          {/* Additional Info */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Additional Information (For better output)</label>
            <div style={{ position: "relative" }}>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ instructions: e.target.value })}
                placeholder="e.g Generate a question paper for 3 hour exam duration..."
                style={{
                  ...inputStyle,
                  minHeight: 100,
                  resize: "vertical",
                  paddingBottom: 36,
                }}
              />
              {/* mic icon */}
              <div style={{
                position: "absolute", bottom: 12, right: 14,
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--text-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
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
              borderRadius: 10, padding: "10px 14px",
              fontSize: 13, color: "#991B1B",
              marginBottom: 20, fontFamily: "var(--font-body)",
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "transparent",
                border: "1px solid var(--border-default)",
                borderRadius: 12,
                padding: "11px 22px",
                fontSize: 14, fontWeight: 500,
                fontFamily: "var(--font-body)",
                cursor: "pointer",
                color: "var(--text-secondary)",
              }}
            >
              ← Previous
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: loading ? "var(--text-muted)" : "var(--text-primary)",
                border: "none",
                borderRadius: 12,
                padding: "11px 28px",
                fontSize: 14, fontWeight: 600,
                fontFamily: "var(--font-body)",
                cursor: loading ? "not-allowed" : "pointer",
                color: "white",
                transition: "background 0.2s",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Generating…
                </>
              ) : (
                "Next →"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
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
  padding: "11px 14px",
  fontSize: 14,
  fontFamily: "var(--font-body)",
  color: "var(--text-primary)",
  outline: "none",
  transition: "border-color 0.2s",
};