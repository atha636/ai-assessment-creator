"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ClipboardList,
  Plus,
  Wand2,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  BookOpen,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-card)",
      borderRadius: 18,
      padding: "22px 24px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      transition: "box-shadow 0.2s, transform 0.15s",
      cursor: "default",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
    }}
    >
      <div style={{
        width: 50, height: 50,
        borderRadius: 14,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <div style={{
          fontSize: 26,
          fontWeight: 800,
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
          lineHeight: 1,
          marginBottom: 4,
        }}>
          {value}
        </div>
        <div style={{
          fontSize: 12,
          color: "var(--text-muted)",
          fontFamily: "var(--font-body)",
          fontWeight: 500,
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  desc,
  color,
  bg,
  onClick,
}: {
  icon: any;
  title: string;
  desc: string;
  color: string;
  bg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-card)",
        borderRadius: 18,
        padding: "22px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
      }}
    >
      <div style={{
        width: 50, height: 50,
        borderRadius: 14,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={24} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
          marginBottom: 3,
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 12,
          color: "var(--text-muted)",
          fontFamily: "var(--font-body)",
        }}>
          {desc}
        </div>
      </div>
      <ChevronRight size={18} color="var(--text-muted)" />
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/api/assignments`)
      .then((res) => {
        const all = res.data.assignments || [];
        setStats({
          total: all.length,
          pending: all.filter((a: any) => a.status === "pending" || a.status === "processing").length,
          completed: all.filter((a: any) => a.status === "completed").length,
        });
        setRecent(all.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getTitle = (a: any) => {
    if (a.questionTypes?.length > 0) {
      const t = a.questionTypes[0].type;
      if (t.toLowerCase().includes("multiple")) return "MCQ Assignment";
      if (t.toLowerCase().includes("short")) return "Short Answer Quiz";
      if (t.toLowerCase().includes("long")) return "Long Answer Paper";
      return t;
    }
    return "AI Assignment";
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Welcome banner */}
      <div style={{
        background: "linear-gradient(135deg, var(--text-primary) 0%, #3D3D3D 100%)",
        borderRadius: 22,
        padding: "32px 36px",
        marginBottom: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        flexWrap: "wrap",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", right: -30, top: -30,
          width: 180, height: 180,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
        }} />
        <div style={{
          position: "absolute", right: 60, bottom: -50,
          width: 120, height: 120,
          borderRadius: "50%",
          background: "rgba(232,84,10,0.15)",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
          }}>
            <div style={{
              background: "var(--brand-primary)",
              borderRadius: 8,
              padding: "3px 12px",
              fontSize: 11,
              fontWeight: 700,
              color: "white",
              fontFamily: "var(--font-body)",
              letterSpacing: 0.5,
            }}>
              DASHBOARD
            </div>
          </div>
          <h1 style={{
            fontFamily: "var(--font-body)",
            fontWeight: 800,
            fontSize: 26,
            color: "white",
            marginBottom: 6,
          }}>
            Welcome back, Delhi Public School 👋
          </h1>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "rgba(255,255,255,0.6)",
          }}>
            Bokaro Steel City · AI-powered teaching toolkit
          </p>
        </div>

        <button
          onClick={() => router.push("/create")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--brand-primary)",
            color: "white",
            border: "none",
            borderRadius: 14,
            padding: "13px 24px",
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            flexShrink: 0,
            position: "relative",
            zIndex: 1,
            boxShadow: "0 4px 16px rgba(232,84,10,0.4)",
            transition: "transform 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Plus size={16} />
          Create Assignment
        </button>
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 32,
      }}>
        <StatCard
          icon={ClipboardList}
          label="Total Assignments"
          value={loading ? "—" : stats.total}
          color="#E8540A"
          bg="#FFF3EE"
        />
        <StatCard
          icon={Clock}
          label="Processing"
          value={loading ? "—" : stats.pending}
          color="#F5B800"
          bg="#FFFBEB"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={loading ? "—" : stats.completed}
          color="#22C55E"
          bg="#F0FDF4"
        />
        <StatCard
          icon={TrendingUp}
          label="This Week"
          value={loading ? "—" : recent.length}
          color="#6366F1"
          bg="#EEF2FF"
        />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        flexWrap: "wrap",
      }}
      className="home-grid"
      >
        {/* Quick actions */}
        <div>
          <h2 style={{
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: 16,
            color: "var(--text-primary)",
            marginBottom: 14,
          }}>
            Quick Actions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <QuickActionCard
              icon={Plus}
              title="Create Assignment"
              desc="Generate AI-powered question papers"
              color="#E8540A"
              bg="#FFF3EE"
              onClick={() => router.push("/create")}
            />
            <QuickActionCard
              icon={ClipboardList}
              title="View Assignments"
              desc={`${stats.total} assignments in total`}
              color="#6366F1"
              bg="#EEF2FF"
              onClick={() => router.push("/assignments")}
            />
            <QuickActionCard
              icon={Wand2}
              title="AI Teacher's Toolkit"
              desc="Smart tools for educators"
              color="#F5B800"
              bg="#FFFBEB"
              onClick={() => router.push("/toolkit")}
            />
            <QuickActionCard
              icon={BookOpen}
              title="My Library"
              desc="Saved resources and papers"
              color="#22C55E"
              bg="#F0FDF4"
              onClick={() => router.push("/library")}
            />
          </div>
        </div>

        {/* Recent assignments */}
        <div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}>
            <h2 style={{
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--text-primary)",
            }}>
              Recent Assignments
            </h2>
            <button
              onClick={() => router.push("/assignments")}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 12,
                fontFamily: "var(--font-body)",
                color: "var(--brand-primary)",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              View all <ChevronRight size={13} />
            </button>
          </div>

          {loading ? (
            <div style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: 18,
              padding: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 200,
            }}>
              <div style={{
                width: 32, height: 32,
                border: "3px solid var(--border-default)",
                borderTopColor: "var(--brand-primary)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
            </div>
          ) : recent.length === 0 ? (
            <div style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: 18,
              padding: "40px 24px",
              textAlign: "center",
            }}>
              <ClipboardList size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                color: "var(--text-muted)",
                marginBottom: 16,
              }}>
                No assignments yet. Create your first one!
              </p>
              <button
                onClick={() => router.push("/create")}
                style={{
                  background: "var(--text-primary)",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "9px 20px",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Create Assignment
              </button>
            </div>
          ) : (
            <div style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: 18,
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              {recent.map((a, i) => (
                <div
                  key={a._id}
                  onClick={() => {
                    localStorage.setItem("assignmentId", a._id);
                    router.push("/output");
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px 20px",
                    borderBottom: i < recent.length - 1 ? "1px solid var(--border-default)" : "none",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{
                    width: 36, height: 36,
                    borderRadius: 10,
                    background: "var(--bg-tag)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <ClipboardList size={18} color="var(--brand-primary)" />
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 600,
                      fontSize: 13,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {getTitle(a)}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}>
                      Due: {a.dueDate
                        ? new Date(a.dueDate).toLocaleDateString("en-GB")
                        : "No due date"}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 99,
                    fontFamily: "var(--font-body)",
                    background: a.status === "completed" ? "#F0FDF4" : "#FFFBEB",
                    color: a.status === "completed" ? "#16A34A" : "#CA8A04",
                    flexShrink: 0,
                  }}>
                    {a.status === "completed" ? "Done" : "Processing"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .home-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}