"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Users,
  ClipboardList,
  Wand2,
  BookOpen,
  Settings,
  Bell,
  ChevronDown,
  Plus,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { icon: Home,          label: "Home",               href: "/" },
  { icon: Users,         label: "My Groups",          href: "/groups" },
  { icon: ClipboardList, label: "Assignments",        href: "/assignments" },
  { icon: Wand2,         label: "AI Teacher's Toolkit", href: "/toolkit" },
  { icon: BookOpen,      label: "My Library",         href: "/library" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--border-default)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--brand-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>
            VedaAI
          </span>
        </div>

        <Link href="/create" style={{ textDecoration: "none" }} onClick={() => setMobileOpen(false)}>
          <button style={{
            width: "100%",
            background: "var(--text-primary)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "11px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            transition: "background 0.2s",
          }}>
            <Plus size={16} />
            Create Assignment
          </button>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {navItems.map(({ icon: Icon, label, href }) => {
          const active = pathname === href ||
            (href === "/assignments" && (pathname?.startsWith("/create") || pathname?.startsWith("/output")));
          return (
            <Link key={href} href={href} style={{ textDecoration: "none" }} onClick={() => setMobileOpen(false)}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                marginBottom: 2,
                background: active ? "#FFF3EE" : "transparent",
                color: active ? "var(--brand-primary)" : "var(--text-secondary)",
                fontFamily: "var(--font-body)",
                fontWeight: active ? 600 : 400,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.15s",
              }}>
                <Icon size={18} />
                <span>{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid var(--border-default)" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", cursor: "pointer",
          color: "var(--text-secondary)", fontSize: 14,
          fontFamily: "var(--font-body)",
        }}>
          <Settings size={18} />
          <span>Settings</span>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", marginTop: 4,
          background: "var(--bg-input)", borderRadius: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #E8540A, #F5B800)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "white", flexShrink: 0,
          }}>D</div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Delhi Public School
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Bokaro Steel City</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-app)" }}>

          {/* ── Desktop Sidebar ── */}
          <aside className="desktop-sidebar" style={{
            width: "var(--sidebar-width)",
            minHeight: "100vh",
            background: "var(--bg-sidebar)",
            borderRight: "1px solid var(--border-default)",
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 50,
          }}>
            <SidebarContent />
          </aside>

          {/* ── Mobile Sidebar Overlay ── */}
          {mobileOpen && (
            <div
              style={{
                position: "fixed", inset: 0, zIndex: 60,
                background: "rgba(0,0,0,0.4)",
              }}
              onClick={() => setMobileOpen(false)}
            />
          )}
          <aside className="mobile-sidebar" style={{
            position: "fixed",
            top: 0,
            left: mobileOpen ? 0 : "-280px",
            width: 260,
            height: "100vh",
            background: "var(--bg-sidebar)",
            borderRight: "1px solid var(--border-default)",
            display: "flex",
            flexDirection: "column",
            zIndex: 70,
            transition: "left 0.3s ease",
          }}>
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "transparent", border: "none",
                cursor: "pointer", padding: 4,
                color: "var(--text-muted)",
              }}
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>

          {/* ── Main content ── */}
          <div className="main-content" style={{
            marginLeft: "var(--sidebar-width)",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Topbar */}
            <header style={{
              height: "var(--topbar-height)",
              background: "var(--bg-card)",
              borderBottom: "1px solid var(--border-default)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 28px",
              position: "sticky",
              top: 0,
              zIndex: 40,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Mobile hamburger */}
                <button
                  className="mobile-menu-btn"
                  onClick={() => setMobileOpen(true)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    color: "var(--text-secondary)",
                    display: "none",
                  }}
                >
                  <Menu size={22} />
                </button>
                <div style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                  {navItems.find(n => pathname === n.href || (pathname?.startsWith(n.href) && n.href !== "/"))?.label || "Dashboard"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ position: "relative", cursor: "pointer" }}>
                  <Bell size={20} color="var(--text-secondary)" />
                  <span style={{
                    position: "absolute", top: -4, right: -4,
                    width: 8, height: 8, borderRadius: "50%",
                    background: "var(--brand-primary)",
                  }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "linear-gradient(135deg, #667eea, #764ba2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 600, color: "white",
                  }}>J</div>
                  <span className="user-name" style={{ fontSize: 14, fontWeight: 500, fontFamily: "var(--font-body)", color: "var(--text-primary)" }}>
                    John Doe
                  </span>
                  <ChevronDown size={16} color="var(--text-muted)" />
                </div>
              </div>
            </header>

            {/* Page */}
            <main style={{ flex: 1, padding: "28px" }}>
              {children}
            </main>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .desktop-sidebar { display: none !important; }
            .mobile-menu-btn { display: flex !important; }
            .main-content { margin-left: 0 !important; }
            .user-name { display: none !important; }
            main { padding: 16px !important; }
          }
          @media (min-width: 769px) {
            .mobile-sidebar { display: none !important; }
          }
        `}</style>
      </body>
    </html>
  );
}