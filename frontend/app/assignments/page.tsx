"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  AlertTriangle,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Assignment {
  _id: string;
  dueDate?: string;
  createdAt: string;
  status: string;
  questionTypes?: Array<{ type: string; numQuestions: number; marks: number }>;
  totalQuestions?: number;
  marks?: number;
  instructions?: string;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getTitle(a: Assignment) {
  if (a.questionTypes && a.questionTypes.length > 0) {
    const type = a.questionTypes[0].type;
    if (type.toLowerCase().includes("multiple")) return "MCQ Assignment";
    if (type.toLowerCase().includes("short")) return "Short Answer Quiz";
    if (type.toLowerCase().includes("long")) return "Long Answer Paper";
    if (type.toLowerCase().includes("numerical")) return "Numerical Problem Set";
    return type;
  }
  if (a.instructions && a.instructions.trim().length > 0)
    return a.instructions.slice(0, 32) + (a.instructions.length > 32 ? "…" : "");
  return "AI Assignment";
}

/* ─── Delete Confirmation Modal ─── */
function DeleteModal({
  title,
  onConfirm,
  onCancel,
  deleting,
}: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 200,
          backdropFilter: "blur(3px)",
          animation: "fadeIn 0.15s ease",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 210,
          background: "white",
          borderRadius: 20,
          padding: "32px 28px 24px",
          width: "min(420px, 90vw)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          animation: "fadeUp 0.2s ease",
        }}
      >
        {/* Icon */}
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          background: "#FEF2F2",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <AlertTriangle size={28} color="#EF4444" />
        </div>

        {/* Text */}
        <div style={{ textAlign: "center" }}>
          <h2 style={{
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}>
            Delete Assignment?
          </h2>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}>
            You're about to delete{" "}
            <strong style={{ color: "var(--text-primary)" }}>"{title}"</strong>.
            <br />
            This action cannot be undone.
          </p>
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: 1, background: "var(--border-default)" }} />

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button
            onClick={onCancel}
            disabled={deleting}
            style={{
              flex: 1,
              padding: "12px 0",
              border: "1.5px solid var(--border-default)",
              borderRadius: 12,
              background: "white",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#F5F5F5";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "white";
            }}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1,
              padding: "12px 0",
              border: "none",
              borderRadius: 12,
              background: deleting ? "#FCA5A5" : "#EF4444",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 14,
              color: "white",
              cursor: deleting ? "not-allowed" : "pointer",
              transition: "background 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (!deleting)
                (e.currentTarget as HTMLButtonElement).style.background = "#DC2626";
            }}
            onMouseLeave={(e) => {
              if (!deleting)
                (e.currentTarget as HTMLButtonElement).style.background = "#EF4444";
            }}
          >
            {deleting ? (
              <>
                <div style={{
                  width: 14, height: 14,
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }} />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 size={15} />
                Yes, Delete
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Empty State ─── */
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: "60vh", gap: 20, textAlign: "center",
      padding: "40px 20px",
    }}>
      <div style={{
        width: 160, height: 160, borderRadius: 24,
        background: "linear-gradient(135deg, #F5F5F5 0%, #EBEBEB 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
          <circle cx="45" cy="42" r="28" fill="white" stroke="#E2E2E2" strokeWidth="2"/>
          <circle cx="45" cy="42" r="20" fill="#F8F8F8" stroke="#D5D5D5" strokeWidth="1.5"/>
          <rect x="36" y="34" width="18" height="2.5" rx="1.25" fill="#C8C8C8"/>
          <rect x="36" y="40" width="14" height="2.5" rx="1.25" fill="#C8C8C8"/>
          <rect x="36" y="46" width="16" height="2.5" rx="1.25" fill="#C8C8C8"/>
          <circle cx="53" cy="55" r="10" fill="#FEE2E2"/>
          <line x1="49" y1="51" x2="57" y2="59" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="57" y1="51" x2="49" y2="59" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="20" cy="30" r="3" fill="#E8540A" opacity="0.5"/>
          <circle cx="72" cy="25" r="2" fill="#F5B800" opacity="0.6"/>
          <circle cx="68" cy="65" r="3.5" fill="#6366F1" opacity="0.35"/>
        </svg>
      </div>
      <div>
        <h2 style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 22, color: "var(--text-primary)", marginBottom: 10 }}>
          No assignments yet
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-muted)", maxWidth: 380, lineHeight: 1.65 }}>
          Create your first assignment to start collecting and grading student submissions.
        </p>
      </div>
      <button
        onClick={onCreate}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--text-primary)", color: "white",
          border: "none", borderRadius: 14, padding: "13px 28px",
          fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14,
          cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          transition: "transform 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.2)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
        }}
      >
        <Plus size={17} />
        Create Your First Assignment
      </button>
    </div>
  );
}

/* ─── Assignment Card ─── */
function AssignmentCard({
  assignment,
  onView,
  onDelete,
}: {
  assignment: Assignment;
  onView: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const title = getTitle(assignment);

  return (
    <div
      style={{
        background: "white", border: "1px solid var(--border-card)",
        borderRadius: 16, padding: "18px 20px",
        display: "flex", flexDirection: "column", gap: 12,
        position: "relative", cursor: "pointer",
        transition: "box-shadow 0.2s, transform 0.15s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
      onClick={() => { if (!menuOpen) onView(); }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h3 style={{
          fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15,
          color: "var(--text-primary)", lineHeight: 1.35,
          flex: 1, paddingRight: 8,
        }}>
          {title}
        </h3>

        {/* 3-dot menu */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: "4px 6px", borderRadius: 6,
              color: "var(--text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 90 }}
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
              />
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", right: 0,
                background: "white", border: "1px solid var(--border-default)",
                borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                zIndex: 100, minWidth: 160, overflow: "hidden",
              }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onView(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "11px 16px",
                    background: "transparent", border: "none", cursor: "pointer",
                    fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
                    color: "var(--text-primary)", textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F5F5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Eye size={14} />
                  View Assignment
                </button>
                <div style={{ height: 1, background: "var(--border-default)", margin: "0 12px" }} />
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "11px 16px",
                    background: "transparent", border: "none", cursor: "pointer",
                    fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
                    color: "#EF4444", textAlign: "left", transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Type tags */}
      {assignment.questionTypes && assignment.questionTypes.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {assignment.questionTypes.slice(0, 2).map((qt, i) => (
            <span key={i} style={{
              background: "var(--bg-tag)", color: "var(--brand-primary)",
              fontSize: 11, fontWeight: 600, padding: "3px 10px",
              borderRadius: 99, fontFamily: "var(--font-body)",
            }}>
              {qt.numQuestions} {qt.type.split(" ")[0]}
            </span>
          ))}
          {assignment.questionTypes.length > 2 && (
            <span style={{
              background: "#F5F5F5", color: "var(--text-muted)",
              fontSize: 11, fontWeight: 600, padding: "3px 10px",
              borderRadius: 99, fontFamily: "var(--font-body)",
            }}>
              +{assignment.questionTypes.length - 2} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        paddingTop: 10, borderTop: "1px solid var(--border-default)",
        flexWrap: "wrap", gap: 6,
      }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
          <strong style={{ color: "var(--text-secondary)" }}>Assigned on</strong> : {formatDate(assignment.createdAt)}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
          <strong style={{ color: "var(--text-secondary)" }}>Due</strong> : {formatDate(assignment.dueDate)}
        </span>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/assignments`);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error(err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await axios.delete(`${API}/api/assignments/${deleteTarget._id}`);
      setAssignments((prev) => prev.filter((a) => a._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleView = (id: string) => {
    localStorage.setItem("assignmentId", id);
    router.push("/output");
  };

  const filtered = assignments.filter((a) =>
    getTitle(a).toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{
          width: 40, height: 40,
          border: "3px solid var(--border-default)",
          borderTopColor: "var(--brand-primary)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          title={getTitle(deleteTarget)}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleting && setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--status-active)" }} />
          <h1 style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 22, color: "var(--text-primary)" }}>
            Assignments
          </h1>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginLeft: 20, fontFamily: "var(--font-body)" }}>
          Manage and create assignments for your classes.
        </p>
      </div>

      {assignments.length === 0 ? (
        <EmptyState onCreate={() => router.push("/create")} />
      ) : (
        <>
          {/* Filter/Search */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
            <button style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "white", border: "1px solid var(--border-default)",
              borderRadius: 10, padding: "9px 16px",
              fontFamily: "var(--font-body)", fontSize: 13,
              color: "var(--text-secondary)", cursor: "pointer", fontWeight: 500,
            }}>
              <Filter size={14} />
              Filter By
            </button>

            <div style={{ position: "relative", flex: 1, minWidth: 180, maxWidth: 340 }}>
              <Search
                size={15} color="var(--text-muted)"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Assignment"
                style={{
                  width: "100%", background: "white",
                  border: "1px solid var(--border-default)",
                  borderRadius: 10, padding: "9px 14px 9px 36px",
                  fontFamily: "var(--font-body)", fontSize: 13,
                  color: "var(--text-primary)", outline: "none",
                }}
              />
            </div>

            <span style={{
              background: "var(--brand-primary)", color: "white",
              fontSize: 12, fontWeight: 700, padding: "3px 10px",
              borderRadius: 99, fontFamily: "var(--font-body)",
            }}>
              {assignments.length}
            </span>
          </div>

          {/* Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16, marginBottom: 32,
          }}>
            {filtered.map((a) => (
              <AssignmentCard
                key={a._id}
                assignment={a}
                onView={() => handleView(a._id)}
                onDelete={() => setDeleteTarget(a)}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{
              textAlign: "center", padding: "60px 20px",
              color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: 14,
            }}>
              No assignments match "{search}"
            </div>
          )}

          {/* Sticky create button */}
          <div style={{
            position: "fixed", bottom: 28, left: "50%",
            transform: "translateX(-50%)", zIndex: 30,
          }}>
            <button
              onClick={() => router.push("/create")}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "var(--text-primary)", color: "white",
                border: "none", borderRadius: 99, padding: "13px 28px",
                fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14,
                cursor: "pointer", boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <Plus size={16} />
              Create Assignment
            </button>
          </div>
        </>
      )}
    </div>
  );
}