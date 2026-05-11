
import { useState, useEffect, useRef } from "react";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const URL_ = "https://bhirrdalujsevlwxoiji.supabase.co";
const KEY_ = "sb_publishable_ian5YhEbz5fd4b0MQQuIBA_g9c46fqb";

const req = async (path, opts = {}) => {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { "apikey": KEY_, "Authorization": `Bearer ${KEY_}`, "Content-Type": "application/json", "Prefer": "return=representation", ...opts.headers },
    ...opts,
  });
  const t = await res.text();
  return t ? JSON.parse(t) : [];
};
const db = {
  get: (t, q = "") => req(`${t}?${q}&order=created_at.desc`),
  insert: (t, d) => req(t, { method: "POST", body: JSON.stringify(d) }),
  update: (t, m, d) => req(`${t}?${m}`, { method: "PATCH", body: JSON.stringify(d) }),
  delete: (t, m) => req(`${t}?${m}`, { method: "DELETE" }),
};

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  accent: "#B87333", accentHover: "#9a6128",
  red: "#ef4444", redBg: "#fef2f2", redBorder: "#fecaca", redText: "#dc2626",
  green: "#22c55e", greenBg: "#f0fdf4", greenBorder: "#bbf7d0", greenText: "#16a34a",
  blue: "#3b82f6", blueBg: "#eff6ff", blueBorder: "#bfdbfe", blueText: "#1d4ed8",
  orange: "#f97316", orangeBg: "#fff7ed", orangeBorder: "#fed7aa", orangeText: "#c2410c",
  purple: "#8b5cf6", purpleBg: "#faf5ff", purpleBorder: "#ddd6fe", purpleText: "#7c3aed",
  yellow: "#eab308", yellowBg: "#fefce8", yellowBorder: "#fef08a", yellowText: "#a16207",
  border: "#e5e7eb", border2: "#d1d5db",
  bg: "#ffffff", bg2: "#f9fafb", bg3: "#f3f4f6",
  text: "#111827", muted: "#6b7280", mutedLight: "#9ca3af",
};

const FLOW = ["Cotización", "Diseño", "En producción", "Instalación", "Entregado"];
const MATERIAL_CATS = ["Tubos", "Platinas", "Láminas", "Pintura", "Accesorios", "Tornillería", "Herramientas", "Vidrio", "Madera", "Otro"];
const PRIORITIES = ["Urgente", "Alta", "Media", "Baja"];
const STATUS_OPTS = ["Cotización", "Diseño", "En producción", "Instalación", "Entregado", "Atrasado"];
const MAT_STATUS = ["ok", "bajo", "critico", "agotado", "pendiente"];

const SYSTEM_USERS = [
  { id: "U01", name: "Roberto Aguilar", role: "Administrador", avatar: "RA", color: C.purple, user: "admin", pass: "demetal2024" },
  { id: "U02", name: "Carlos Martínez", role: "Supervisor", avatar: "CM", color: C.accent, user: "carlos", pass: "supervisor123" },
  { id: "U03", name: "Ana Pérez", role: "Producción", avatar: "AP", color: C.green, user: "ana", pass: "prod2024" },
  { id: "U04", name: "Luis Rodríguez", role: "Instalación", avatar: "LR", color: C.orange, user: "luis", pass: "install24" },
];

const ROLE_PERMS = {
  "Administrador": { editar: true, eliminar: true, aprobar: true, color: C.purple, bg: C.purpleBg, border: C.purpleBorder },
  "Supervisor":    { editar: true, eliminar: false, aprobar: true, color: C.accent, bg: "#fff7ed", border: "#fed7aa" },
  "Producción":    { editar: true, eliminar: false, aprobar: false, color: C.green, bg: C.greenBg, border: C.greenBorder },
  "Instalación":   { editar: true, eliminar: false, aprobar: false, color: C.orange, bg: C.orangeBg, border: C.orangeBorder },
};

const statusStyle = s => ({
  "En producción": { bg: C.greenBg, text: C.greenText, border: C.greenBorder },
  "Diseño":        { bg: C.blueBg, text: C.blueText, border: C.blueBorder },
  "Instalación":   { bg: C.orangeBg, text: C.orangeText, border: C.orangeBorder },
  "Atrasado":      { bg: C.redBg, text: C.redText, border: C.redBorder },
  "Cotización":    { bg: C.purpleBg, text: C.purpleText, border: C.purpleBorder },
  "Entregado":     { bg: "#f0fdfa", text: "#0f766e", border: "#99f6e4" },
}[s] || { bg: C.bg2, text: C.muted, border: C.border });

const matStyle = s => ({
  ok:       { bg: C.greenBg, text: C.greenText, border: C.greenBorder, label: "Disponible" },
  bajo:     { bg: C.yellowBg, text: C.yellowText, border: C.yellowBorder, label: "Stock bajo" },
  critico:  { bg: C.orangeBg, text: C.orangeText, border: C.orangeBorder, label: "Crítico" },
  agotado:  { bg: C.redBg, text: C.redText, border: C.redBorder, label: "Agotado" },
  pendiente:{ bg: C.purpleBg, text: C.purpleText, border: C.purpleBorder, label: "En camino" },
}[s] || { bg: C.bg2, text: C.muted, border: C.border, label: s });

const prioColor = p => ({ Urgente: C.red, Alta: C.orange, Media: C.yellow, Baja: C.green }[p] || C.muted);

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
const Bar = ({ pct, color = C.accent, h = 6 }) => (
  <div style={{ background: C.bg3, borderRadius: 99, height: h, overflow: "hidden" }}>
    <div style={{ width: `${Math.min(pct || 0, 100)}%`, background: color, height: "100%", borderRadius: 99, transition: "width .4s" }} />
  </div>
);

const Badge = ({ label, bg = C.bg2, text = C.muted, border = C.border }) => (
  <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 99, fontWeight: 600, background: bg, color: text, border: `1px solid ${border}`, whiteSpace: "nowrap", display:"inline-block" }}>{label}</span>
);

const Metric = ({ label, value, sub, color, icon }) => (
  <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</div>
      {icon && <span style={{ fontSize:18 }}>{icon}</span>}
    </div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || C.text, lineHeight: 1, marginTop:6 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const Avatar = ({ initials, size = 36, color = C.accent }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, background: `${color}20`, border: `2px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, color, flexShrink: 0 }}>{initials}</div>
);

// Input con estilos claros y legibles
const Input = ({ label, value, onChange, type = "text", placeholder = "", required = false, opts = null, rows = null }) => (
  <div>
    {label && <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>{label}{required && <span style={{ color: C.red }}> *</span>}</div>}
    {opts
      ? <select value={value} onChange={onChange} style={{ width: "100%", borderRadius: 8, border: `1.5px solid ${C.border2}`, background: "#fff", color: C.text, padding: "9px 12px", fontSize: 13, outline: "none", appearance:"none" }}>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      : rows
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ width: "100%", borderRadius: 8, border: `1.5px solid ${C.border2}`, background: "#fff", color: C.text, padding: "9px 12px", fontSize: 13, outline: "none", resize: "vertical", boxSizing:"border-box" }} />
        : <input value={value} onChange={onChange} type={type} placeholder={placeholder} style={{ width: "100%", borderRadius: 8, border: `1.5px solid ${C.border2}`, background: "#fff", color: C.text, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing:"border-box" }} />
    }
  </div>
);

const Btn = ({ children, onClick, variant = "ghost", color, style = {}, disabled = false, size="md" }) => {
  const pad = size==="sm" ? "5px 12px" : size==="lg" ? "11px 22px" : "7px 16px";
  const bg = variant==="primary" ? (color||C.accent) : variant==="danger" ? C.red : "transparent";
  const cl = variant==="primary"||variant==="danger" ? "#fff" : color || C.muted;
  const bd = variant==="ghost" ? `1.5px solid ${C.border2}` : "none";
  return <button onClick={onClick} disabled={disabled} style={{ padding:pad, borderRadius:8, border:bd, background:bg, color:cl, cursor:disabled?"not-allowed":"pointer", fontSize:size==="sm"?12:13, fontWeight:variant==="primary"||variant==="danger"?600:400, opacity:disabled?.5:1, display:"inline-flex", alignItems:"center", gap:5, ...style }}>{children}</button>;
};

// Modal wrapper
const Modal = ({ title, onClose, children, width=480 }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div style={{ background:C.bg, borderRadius:16, width:"100%", maxWidth:width, maxHeight:"92vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
      <div style={{ padding:"18px 22px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{title}</div>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:20, lineHeight:1, padding:2 }}>×</button>
      </div>
      <div style={{ padding:"20px 22px" }}>{children}</div>
    </div>
  </div>
);

// Confirm delete dialog
const ConfirmDelete = ({ name, onConfirm, onCancel }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div style={{ background:C.bg, borderRadius:14, padding:28, maxWidth:380, width:"100%", textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>🗑</div>
      <div style={{ fontSize:16, fontWeight:700, color:C.text, marginBottom:8 }}>¿Eliminar registro?</div>
      <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Se eliminará <b>{name}</b>. Esta acción no se puede deshacer.</div>
      <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
        <Btn onClick={onCancel}>Cancelar</Btn>
        <Btn variant="danger" onClick={onConfirm}>Sí, eliminar</Btn>
      </div>
    </div>
  </div>
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState(""); const [pass, setPass] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false); const [show, setShow] = useState(false);
  const login = async () => {
    setLoading(true); setErr("");
    await new Promise(r => setTimeout(r, 400));
    const found = SYSTEM_USERS.find(u => u.user === user.trim() && u.pass === pass);
    if (found) { try { await db.insert("audit_log", { user_name: found.name, user_role: found.role, action: "inició sesión", entity: "Sistema", detail: "Acceso al portal", module: "Auth", device: "Web" }); } catch (e) { } onLogin(found); }
    else { setErr("Usuario o contraseña incorrectos"); setLoading(false); }
  };
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f5f0eb 0%, #ede8e3 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 38, fontWeight: 700, color: C.text, letterSpacing: "-1px" }}>De Metal</div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 6 }}>Líderes en hierro forjado</div>
          <div style={{ width: 44, height: 3, background: C.accent, margin: "14px auto 0", borderRadius: 2 }} />
        </div>
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 18, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: C.green }} />
            <span style={{ fontSize: 12, color: C.greenText, fontWeight: 500 }}>Base de datos conectada</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Bienvenido</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>Ingresa tus credenciales para continuar</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Usuario" value={user} onChange={e => setUser(e.target.value)} placeholder="tu.usuario" />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>Contraseña</div>
              <div style={{ position: "relative" }}>
                <input value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} type={show ? "text" : "password"} placeholder="••••••••" style={{ width: "100%", borderRadius: 8, border: `1.5px solid ${err ? C.red : C.border2}`, background: "#fff", color: C.text, padding: "9px 40px 9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16 }}>{show ? "🙈" : "👁"}</button>
              </div>
            </div>
          </div>
          {err && <div style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8, padding: "9px 12px", fontSize: 12, color: C.redText, marginTop: 12 }}>⚠ {err}</div>}
          <button onClick={login} disabled={!user || !pass || loading} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", cursor: (!user || !pass || loading) ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, opacity: (!user || !pass || loading) ? .6 : 1, marginTop: 18 }}>{loading ? "Verificando…" : "Ingresar al sistema →"}</button>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, fontWeight:500 }}>Accesos rápidos:</div>
            {SYSTEM_USERS.map(u => { const rp = ROLE_PERMS[u.role]; return (
              <button key={u.id} onClick={() => { setUser(u.user); setPass(u.pass); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg2, cursor: "pointer", marginBottom: 5 }}>
                <div style={{ display: "flex", gap: 9, alignItems: "center" }}><Avatar initials={u.avatar} size={26} color={u.color} /><span style={{ fontSize: 13, color: C.text, fontWeight:500 }}>{u.name}</span></div>
                <Badge label={u.role} bg={rp.bg} text={rp.color} border={rp.border} />
              </button>
            );})}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PHOTO UPLOADER ───────────────────────────────────────────────────────────
function PhotoUploader({ onPhoto }) {
  const ref = useRef(); const [prev, setPrev] = useState(null);
  const handle = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { setPrev(ev.target.result); onPhoto(ev.target.result); }; r.readAsDataURL(f); };
  return (
    <div>
      <input ref={ref} type="file" accept="image/*" capture="environment" onChange={handle} style={{ display: "none" }} />
      {prev ? <div style={{ position: "relative", borderRadius: 10, overflow: "hidden" }}><img src={prev} alt="p" style={{ width: "100%", height: 150, objectFit: "cover", display:"block" }} /><button onClick={() => { setPrev(null); onPhoto(null); }} style={{ position: "absolute", top: 7, right: 7, background: "rgba(0,0,0,.6)", border: "none", borderRadius: 20, width: 26, height: 26, color: "#fff", cursor: "pointer", fontSize:14 }}>×</button></div>
        : <div onClick={() => ref.current.click()} style={{ border: `2px dashed ${C.border2}`, borderRadius: 10, padding: "20px", textAlign: "center", cursor: "pointer", background: C.bg2 }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border2}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Subir fotografía del avance</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Toca para tomar foto o seleccionar de galería</div>
          </div>}
    </div>
  );
}

// ─── QUICK UPDATE ─────────────────────────────────────────────────────────────
function QuickUpdate({ project, currentUser, onClose, onSaved }) {
  const [pct, setPct] = useState(project.progress || 0); const [area, setArea] = useState(project.phase || "Diseño"); const [note, setNote] = useState(""); const [photo, setPhoto] = useState(null); const [issue, setIssue] = useState(""); const [saving, setSaving] = useState(false); const [saved, setSaved] = useState(false);
  const AREAS = ["Diseño", "Corte", "Soldadura", "Pintura", "Instalación", "Calidad", "Ensamblaje", "Tapicería"];
  const device = navigator.userAgent.includes("iPhone") ? "iPhone" : navigator.userAgent.includes("Android") ? "Android" : "Computadora";
  const save = async () => {
    setSaving(true);
    try {
      await db.insert("project_logs", { project_id: project.id, user_name: currentUser.name, user_role: currentUser.role, prev_pct: project.progress || 0, new_pct: pct, area, note, issue, device });
      if (photo) await db.insert("project_photos", { project_id: project.id, storage_url: photo, area, note, pct, issue: issue || null, user_name: currentUser.name });
      await db.update("projects", `id=eq.${project.id}`, { progress: pct, phase: area, updated_at: new Date().toISOString() });
      await db.insert("audit_log", { user_name: currentUser.name, user_role: currentUser.role, action: "actualizó avance", entity: `Proyecto ${project.id}`, detail: `${project.progress || 0}% → ${pct}% · ${area}${issue ? ` · ⚠ ${issue}` : ""}`, module: "Proyectos", device });
      setSaved(true); setTimeout(() => { onSaved(); onClose(); }, 1100);
    } catch (e) { alert("Error: " + e.message); setSaving(false); }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: C.bg, borderRadius: "18px 18px 0 0", width: "100%", maxWidth: 540, padding: 24, display: "flex", flexDirection: "column", gap: 14, maxHeight: "92vh", overflowY: "auto", boxShadow:"0 -8px 40px rgba(0,0,0,0.15)" }}>
        {saved ? <div style={{ textAlign: "center", padding: "28px 0" }}><div style={{ fontSize: 44 }}>✅</div><div style={{ fontWeight: 700, marginTop: 10, color: C.text, fontSize: 16 }}>Guardado correctamente</div><div style={{ fontSize: 13, color: C.muted, marginTop: 5 }}>Visible para todo el equipo en tiempo real</div></div>
          : <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontWeight: 700, color: C.text, fontSize: 16 }}>Actualizar avance</div><div style={{ fontSize: 12, color: C.muted, marginTop:2 }}>{project.id} · {project.client}</div></div><button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.muted }}>×</button></div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>Área que actualiza</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{AREAS.map(a => <button key={a} onClick={() => setArea(a)} style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${area === a ? C.accent : C.border}`, background: area === a ? `${C.accent}15` : "#fff", color: area === a ? C.accent : C.muted, cursor: "pointer", fontSize: 12, fontWeight: area===a?600:400 }}>{a}</button>)}</div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Porcentaje de avance</span><span style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>{pct}%</span></div>
              <input type="range" min={0} max={100} step={1} value={pct} onChange={e => setPct(+e.target.value)} style={{ width: "100%", accentColor: C.accent }} />
              <Bar pct={pct} h={8} />
            </div>
            <PhotoUploader onPhoto={setPhoto} />
            <Input label="Comentario del avance" value={note} onChange={e => setNote(e.target.value)} placeholder="¿Qué se hizo? ¿Qué avanzó?" rows={2} />
            <Input label="⚠ Problema o material faltante (opcional)" value={issue} onChange={e => setIssue(e.target.value)} placeholder="Ej: Falta pintura epóxica negra" />
            <div style={{ background: C.bg2, borderRadius: 8, padding: "8px 12px", fontSize: 11, color: C.muted, display: "flex", gap: 14, flexWrap: "wrap" }}><span>👤 {currentUser.name}</span><span>🎯 {currentUser.role}</span><span>💻 {device}</span></div>
            <Btn variant="primary" onClick={save} disabled={saving} style={{ width: "100%", padding: "12px", fontSize: 14, justifyContent:"center" }}>{saving ? "Guardando…" : "Guardar avance con registro →"}</Btn>
          </>}
      </div>
    </div>
  );
}

// ─── PROJECTS MODULE ──────────────────────────────────────────────────────────
function ProjectsModule({ currentUser }) {
  const [projects, setProjects] = useState([]); const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | {mode:'create'|'edit', data}
  const [delConfirm, setDelConfirm] = useState(null);
  const [selProject, setSelProject] = useState(null);
  const [updateP, setUpdateP] = useState(null);
  const [view, setView] = useState("list");
  const [logs, setLogs] = useState([]); const [photos, setPhotos] = useState([]);
  const rp = ROLE_PERMS[currentUser.role];
  const empty = { client:"", type:"", area:"", delivery:"", responsible:"", priority:"Alta", status:"Cotización", phase:"Diseño", budget:"", notes:"" };
  const [form, setForm] = useState(empty);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const load = async () => { setLoading(true); try { const p = await db.get("projects", "select=*"); setProjects(p || []); } catch (e) { } setLoading(false); };
  const loadDetail = async id => { try { const [l, ph] = await Promise.all([db.get("project_logs", `select=*&project_id=eq.${id}`), db.get("project_photos", `select=*&project_id=eq.${id}`)]); setLogs(l || []); setPhotos(ph || []); } catch (e) { } };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (selProject) loadDetail(selProject.id); }, [selProject]);

  const openCreate = () => { setForm(empty); setModal({ mode: "create" }); };
  const openEdit = (p, e) => { e?.stopPropagation(); setForm({ client: p.client||"", type: p.type||"", area: p.area||"", delivery: p.delivery||"", responsible: p.responsible||"", priority: p.priority||"Alta", status: p.status||"Cotización", phase: p.phase||"Diseño", budget: p.budget||"", notes: p.notes||"" }); setModal({ mode: "edit", id: p.id }); };
  const openDel = (p, e) => { e?.stopPropagation(); setDelConfirm(p); };

  const save = async () => {
    if (!form.client || !form.type) return alert("Cliente y tipo son obligatorios");
    try {
      const data = { ...form, budget: parseInt(form.budget) || 0, alert: false };
      if (modal.mode === "create") {
        const id = `DM-${Date.now().toString().slice(-4)}`;
        await db.insert("projects", { ...data, id, client_token: `tok-${id.toLowerCase()}` });
        await db.insert("audit_log", { user_name: currentUser.name, user_role: currentUser.role, action: "creó proyecto", entity: id, detail: form.client, module: "Proyectos", device: "Web" });
      } else {
        await db.update("projects", `id=eq.${modal.id}`, { ...data, updated_at: new Date().toISOString() });
        await db.insert("audit_log", { user_name: currentUser.name, user_role: currentUser.role, action: "editó proyecto", entity: modal.id, detail: form.client, module: "Proyectos", device: "Web" });
      }
      setModal(null); load();
    } catch (e) { alert("Error: " + e.message); }
  };

  const del = async () => {
    try { await db.delete("projects", `id=eq.${delConfirm.id}`); setDelConfirm(null); if (selProject?.id === delConfirm.id) setSelProject(null); load(); } catch (e) { alert("Error: " + e.message); }
  };

  if (selProject) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Btn onClick={() => setSelProject(null)}>← Volver</Btn>
        <div style={{ flex: 1 }}><div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{selProject.client}</div><div style={{ fontSize: 12, color: C.muted }}>{selProject.id} · {selProject.type}</div></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {rp.editar && <Btn variant="primary" onClick={() => setUpdateP(selProject)}>📷 Actualizar</Btn>}
          {rp.editar && <Btn onClick={e => openEdit(selProject, e)}>✏ Editar</Btn>}
        </div>
      </div>
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 14, color: C.muted }}>Avance general</span>
          <span style={{ fontSize: 26, fontWeight: 700, color: C.accent }}>{selProject.progress || 0}%</span>
        </div>
        <Bar pct={selProject.progress || 0} h={14} />
        <div style={{ display: "flex", gap: 0, marginTop: 16, overflowX: "auto" }}>
          {FLOW.map((s, i) => { const cur = s === selProject.status; const past = FLOW.indexOf(s) < FLOW.indexOf(selProject.status); return (
            <div key={s} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ textAlign: "center", minWidth: 82 }}>
                <div style={{ width: 26, height: 26, borderRadius: 13, background: past ? C.greenBg : cur ? `${C.accent}20` : C.bg3, border: `2px solid ${past ? C.green : cur ? C.accent : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 5px", fontSize: 11, color: past ? C.greenText : cur ? C.accent : C.muted, fontWeight: 600 }}>{past ? "✓" : cur ? "●" : "○"}</div>
                <div style={{ fontSize: 10, color: cur ? C.accent : past ? C.greenText : C.muted, fontWeight: cur ? 600 : 400 }}>{s}</div>
              </div>
              {i < FLOW.length - 1 && <div style={{ width: 18, height: 2, background: past ? C.green : C.border, flexShrink: 0 }} />}
            </div>
          );})}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[["Cliente", selProject.client], ["Código", selProject.id], ["Tipo", selProject.type || "—"], ["Área", selProject.area || "—"], ["Entrega", selProject.delivery || "—"], ["Responsable", selProject.responsible || "—"], ["Fase actual", selProject.phase || "—"], ["Presupuesto", `$${(selProject.budget || 0).toLocaleString()} MXN`]].map(([k, v]) => (
          <div key={k} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px" }}><div style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginBottom: 3 }}>{k}</div><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{v}</div></div>
        ))}
      </div>
      {photos.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>Fotografías ({photos.length})</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
            {photos.map((ph, i) => (
              <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <img src={ph.storage_url} alt={`${i}`} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                <div style={{ padding: "7px 10px", background: C.bg2 }}><div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{ph.area}</div><div style={{ fontSize: 10, color: C.muted }}>{ph.pct}% · {ph.user_name}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {logs.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>Historial de cambios ({logs.length})</div>
          {logs.map((l, i) => (
            <div key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>{l.user_name}</span><span style={{ fontSize: 11, color: C.muted }}>{new Date(l.created_at).toLocaleString("es-MX")}</span></div>
              <div style={{ fontSize: 12, color: C.text }}>{l.prev_pct}% → <b>{l.new_pct}%</b> · {l.area}</div>
              {l.note && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>"{l.note}"</div>}
              {l.issue && <div style={{ fontSize: 11, color: C.orangeText, marginTop: 3 }}>⚠ {l.issue}</div>}
            </div>
          ))}
        </div>
      )}
      {updateP && <QuickUpdate project={updateP} currentUser={currentUser} onClose={() => setUpdateP(null)} onSaved={() => { load(); loadDetail(selProject.id); }} />}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Proyectos</h2><div style={{ fontSize: 12, color: C.muted }}>{projects.length} registros en total</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            <button onClick={() => setView("list")} style={{ padding: "7px 14px", border: "none", background: view === "list" ? `${C.accent}15` : "#fff", color: view === "list" ? C.accent : C.muted, cursor: "pointer", fontSize: 12, fontWeight: view==="list"?600:400 }}>≡ Lista</button>
            <button onClick={() => setView("kanban")} style={{ padding: "7px 14px", border: "none", background: view === "kanban" ? `${C.accent}15` : "#fff", color: view === "kanban" ? C.accent : C.muted, cursor: "pointer", fontSize: 12, fontWeight: view==="kanban"?600:400 }}>⊞ Kanban</button>
          </div>
          {rp.editar && <Btn variant="primary" onClick={openCreate}>+ Nuevo proyecto</Btn>}
        </div>
      </div>

      {loading ? <div style={{ padding: 40, textAlign: "center", color: C.muted }}>⏳ Cargando proyectos…</div>
        : view === "kanban" ? (
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 10 }}>
            {FLOW.map(col => { const sc = statusStyle(col); const colP = projects.filter(p => p.status === col); return (
              <div key={col} style={{ minWidth: 200, flex: "0 0 200px" }}>
                <div style={{ padding: "8px 12px", background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: sc.text }}>{col}</span>
                  <span style={{ fontSize: 11, color: sc.text }}>{colP.length}</span>
                </div>
                {colP.map(p => (
                  <div key={p.id} onClick={() => setSelProject(p)} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 8, cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.accent} onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{p.client}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>{p.id}</div>
                    <Bar pct={p.progress || 0} h={5} />
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>{p.progress || 0}%</div>
                  </div>
                ))}
                {colP.length === 0 && <div style={{ border: `1.5px dashed ${C.border}`, borderRadius: 10, padding: "20px 12px", textAlign: "center", fontSize: 12, color: C.muted }}>Vacío</div>}
              </div>
            );})}
          </div>
        ) : projects.length === 0 ? <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Sin proyectos. Crea el primero.</div>
        : projects.map(p => { const sc = statusStyle(p.status); return (
          <div key={p.id} onClick={() => setSelProject(p)} style={{ background: C.bg, border: `1px solid ${p.alert ? C.redBorder : C.border}`, borderRadius: 12, padding: "14px 18px", cursor: "pointer", display: "flex", gap: 14, alignItems: "center" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
            <div style={{ width: 4, background: prioColor(p.priority), borderRadius: 2, alignSelf: "stretch", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}><span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{p.client}</span>{p.alert && <Badge label="⚠ ALERTA" bg={C.redBg} text={C.redText} border={C.redBorder} />}</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{p.id} · {p.type} · {p.area}</div>
              <Bar pct={p.progress || 0} color={p.alert ? C.red : C.accent} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
              <Badge label={p.status} bg={sc.bg} text={sc.text} border={sc.border} />
              <span style={{ fontSize: 11, color: C.muted }}>{p.progress || 0}% · {p.responsible || "—"}</span>
              {rp.editar && <div style={{ display: "flex", gap: 5 }}>
                <Btn size="sm" onClick={e => openEdit(p, e)}>✏</Btn>
                {rp.eliminar && <Btn size="sm" variant="danger" onClick={e => openDel(p, e)}>🗑</Btn>}
              </div>}
            </div>
          </div>
        );})}

      {modal && (
        <Modal title={modal.mode === "create" ? "Nuevo proyecto" : "Editar proyecto"} onClose={() => setModal(null)} width={560}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Cliente" required value={form.client} onChange={set("client")} placeholder="Nombre del cliente" />
              <Input label="Tipo de proyecto" required value={form.type} onChange={set("type")} placeholder="Ej: Barandal residencial" />
              <Input label="Ubicación / Dirección" value={form.area} onChange={set("area")} placeholder="Col. Las Palmas" />
              <Input label="Fecha de entrega" value={form.delivery} onChange={set("delivery")} type="date" />
              <Input label="Responsable" value={form.responsible} onChange={set("responsible")} placeholder="Nombre del responsable" />
              <Input label="Presupuesto (MXN)" value={form.budget} onChange={set("budget")} type="number" placeholder="0" />
              <Input label="Prioridad" value={form.priority} onChange={set("priority")} opts={PRIORITIES} />
              <Input label="Estado" value={form.status} onChange={set("status")} opts={STATUS_OPTS} />
            </div>
            <Input label="Notas internas" value={form.notes} onChange={set("notes")} placeholder="Notas adicionales…" rows={2} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
              <Btn onClick={() => setModal(null)}>Cancelar</Btn>
              <Btn variant="primary" onClick={save}>💾 {modal.mode === "create" ? "Crear proyecto" : "Guardar cambios"}</Btn>
            </div>
          </div>
        </Modal>
      )}
      {delConfirm && <ConfirmDelete name={delConfirm.client} onConfirm={del} onCancel={() => setDelConfirm(null)} />}
    </div>
  );
}

// ─── EMPLOYEES MODULE ─────────────────────────────────────────────────────────
function EmployeesModule({ currentUser }) {
  const [emps, setEmps] = useState([]); const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); const [delConfirm, setDelConfirm] = useState(null);
  const rp = ROLE_PERMS[currentUser.role];
  const empty = { name:"", role:"", area:"Soldadura", phone:"", since:"", efficiency:80, load:"normal", attend:"presente", entry_time:"", hours:0, overtime:0, avatar:"" };
  const [form, setForm] = useState(empty);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const AREAS_EMP = ["Diseño","Corte","Soldadura","Pintura","Instalación","Calidad","Ensamblaje","Tapicería","Carpintería","Administración"];
  const load = async () => { setLoading(true); try { const e = await db.get("employees", "select=*"); setEmps(e || []); } catch (e) { } setLoading(false); };
  useEffect(() => { load(); }, []);
  const openCreate = () => { setForm(empty); setModal({ mode: "create" }); };
  const openEdit = (e, ev) => { ev?.stopPropagation(); setForm({ name:e.name||"",role:e.role||"",area:e.area||"Soldadura",phone:e.phone||"",since:e.since||"",efficiency:e.efficiency||80,load:e.load||"normal",attend:e.attend||"presente",entry_time:e.entry_time||"",hours:e.hours||0,overtime:e.overtime||0,avatar:e.avatar||"" }); setModal({ mode:"edit", id:e.id }); };
  const save = async () => {
    if (!form.name || !form.role) return alert("Nombre y puesto son obligatorios");
    const av = form.avatar || form.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
    try {
      if (modal.mode === "create") await db.insert("employees", { ...form, avatar:av, efficiency:+form.efficiency, hours:+form.hours, overtime:+form.overtime });
      else await db.update("employees", `id=eq.${modal.id}`, { ...form, avatar:av, efficiency:+form.efficiency, hours:+form.hours, overtime:+form.overtime });
      setModal(null); load();
    } catch (e) { alert("Error: " + e.message); }
  };
  const del = async () => { try { await db.delete("employees", `id=eq.${delConfirm.id}`); setDelConfirm(null); load(); } catch(e){ alert("Error: "+e.message); } };
  const loadColor2 = l => ({ alta:C.orange,saturado:C.red,baja:C.blue,normal:C.green }[l]||C.muted);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
        <div><h2 style={{ margin:0, fontSize:20, fontWeight:700, color:C.text }}>Empleados</h2><div style={{ fontSize:12, color:C.muted }}>{emps.length} en total</div></div>
        {rp.editar && <Btn variant="primary" onClick={openCreate}>+ Nuevo empleado</Btn>}
      </div>
      {loading ? <div style={{ padding:40, textAlign:"center", color:C.muted }}>⏳ Cargando…</div>
      : emps.length===0 ? <div style={{ padding:40, textAlign:"center", color:C.muted }}>Sin empleados registrados.</div>
      : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
        {emps.map(e=>{
          const lc=loadColor2(e.load);
          return (
            <div key={e.id} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, padding:18, display:"flex", flexDirection:"column", gap:12, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                <Avatar initials={e.avatar||e.name?.slice(0,2)||"?"} size={46} color={lc} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{e.name}</div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{e.role}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{e.area}</div>
                </div>
                <Badge label={e.load||"normal"} bg={`${lc}15`} text={lc} border={`${lc}30`} />
              </div>
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}><span style={{ fontSize:12, color:C.muted }}>Eficiencia</span><span style={{ fontSize:13, fontWeight:700, color:(e.efficiency||80)>=90?C.greenText:C.accent }}>{e.efficiency||80}%</span></div>
                <Bar pct={e.efficiency||80} color={(e.efficiency||80)>=90?C.green:C.accent} h={7} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[["Horas mes",`${e.hours||0}h`],["Horas extras",`${e.overtime||0}h`],["Teléfono",e.phone||"—"],["Desde",e.since||"—"]].map(([k,v])=>(
                  <div key={k} style={{ background:C.bg2, borderRadius:7, padding:"7px 10px" }}><div style={{ fontSize:10, color:C.muted }}>{k}</div><div style={{ fontSize:12, fontWeight:600, color:C.text }}>{v}</div></div>
                ))}
              </div>
              <div style={{ fontSize:12, color:{ presente:C.greenText,atrasado:C.yellowText,instalación:C.orangeText,vacaciones:C.blueText,ausente:C.redText }[e.attend]||C.muted }}>● {e.attend||"presente"} {e.entry_time?`· Entrada: ${e.entry_time}`:""}</div>
              {rp.editar && <div style={{ display:"flex", gap:8, borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
                <Btn size="sm" onClick={ev=>openEdit(e,ev)} style={{ flex:1, justifyContent:"center" }}>✏ Editar</Btn>
                {rp.eliminar && <Btn size="sm" variant="danger" onClick={ev=>{ev.stopPropagation();setDelConfirm(e);}} style={{ flex:1, justifyContent:"center" }}>🗑 Eliminar</Btn>}
              </div>}
            </div>
          );
        })}
      </div>}

      {modal && (
        <Modal title={modal.mode==="create"?"Nuevo empleado":"Editar empleado"} onClose={()=>setModal(null)} width={560}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Input label="Nombre completo" required value={form.name} onChange={set("name")} placeholder="Nombre del empleado" />
              <Input label="Puesto" required value={form.role} onChange={set("role")} placeholder="Ej: Soldador senior" />
              <Input label="Área" value={form.area} onChange={set("area")} opts={AREAS_EMP} />
              <Input label="Teléfono" value={form.phone} onChange={set("phone")} placeholder="9999-0000" />
              <Input label="Fecha de ingreso" value={form.since} onChange={set("since")} type="date" />
              <Input label="Eficiencia (%)" value={form.efficiency} onChange={set("efficiency")} type="number" placeholder="80" />
              <Input label="Horas este mes" value={form.hours} onChange={set("hours")} type="number" placeholder="0" />
              <Input label="Horas extras" value={form.overtime} onChange={set("overtime")} type="number" placeholder="0" />
              <Input label="Carga laboral" value={form.load} onChange={set("load")} opts={["normal","baja","alta","saturado"]} />
              <Input label="Asistencia hoy" value={form.attend} onChange={set("attend")} opts={["presente","atrasado","ausente","instalación","vacaciones"]} />
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:6 }}>
              <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
              <Btn variant="primary" onClick={save}>💾 {modal.mode==="create"?"Crear empleado":"Guardar cambios"}</Btn>
            </div>
          </div>
        </Modal>
      )}
      {delConfirm && <ConfirmDelete name={delConfirm.name} onConfirm={del} onCancel={()=>setDelConfirm(null)} />}
    </div>
  );
}

// ─── MATERIALS MODULE ─────────────────────────────────────────────────────────
function MaterialsModule({ currentUser }) {
  const [mats, setMats] = useState([]); const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); const [delConfirm, setDelConfirm] = useState(null);
  const [catFilter, setCatFilter] = useState("Todos");
  const rp = ROLE_PERMS[currentUser.role];
  const empty = { name:"", category:"Tubos", unit:"ml", stock:0, reserved:0, min_stock:0, cost:0, status:"ok", supplier:"", alert_msg:"" };
  const [form, setForm] = useState(empty);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const load = async () => { setLoading(true); try { const m = await db.get("materials","select=*"); setMats(m||[]); } catch(e){} setLoading(false); };
  useEffect(()=>{ load(); },[]);
  const openCreate=()=>{ setForm(empty); setModal({mode:"create"}); };
  const openEdit=(m,e)=>{ e?.stopPropagation(); setForm({name:m.name||"",category:m.category||"Tubos",unit:m.unit||"ml",stock:m.stock||0,reserved:m.reserved||0,min_stock:m.min_stock||0,cost:m.cost||0,status:m.status||"ok",supplier:m.supplier||"",alert_msg:m.alert_msg||""}); setModal({mode:"edit",id:m.id}); };
  const save=async()=>{
    if(!form.name) return alert("Nombre es obligatorio");
    const id=modal.mode==="create"?`M-${Date.now().toString().slice(-4)}`:modal.id;
    try {
      if(modal.mode==="create") await db.insert("materials",{...form,id,stock:+form.stock,reserved:+form.reserved,min_stock:+form.min_stock,cost:+form.cost});
      else await db.update("materials",`id=eq.${modal.id}`,{...form,stock:+form.stock,reserved:+form.reserved,min_stock:+form.min_stock,cost:+form.cost,updated_at:new Date().toISOString()});
      setModal(null); load();
    } catch(e){ alert("Error: "+e.message); }
  };
  const del=async()=>{ try{ await db.delete("materials",`id=eq.${delConfirm.id}`); setDelConfirm(null); load(); }catch(e){ alert("Error: "+e.message); } };

  const filtered = catFilter==="Todos" ? mats : mats.filter(m=>m.category===catFilter);
  const cats = ["Todos",...MATERIAL_CATS];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
        <div><h2 style={{ margin:0, fontSize:20, fontWeight:700, color:C.text }}>Materiales</h2><div style={{ fontSize:12, color:C.muted }}>{mats.length} registros · {mats.filter(m=>m.status!=="ok").length} requieren atención</div></div>
        {rp.editar && <Btn variant="primary" onClick={openCreate}>+ Agregar material</Btn>}
      </div>

      {mats.filter(m=>m.alert_msg).map(m=>(
        <div key={m.id} style={{ background:C.redBg, border:`1px solid ${C.redBorder}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:C.redText }}>🚨 {m.alert_msg}</div>
      ))}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10 }}>
        <Metric label="Total" value={mats.length} icon="📦" />
        <Metric label="Disponibles" value={mats.filter(m=>m.status==="ok").length} color={C.greenText} icon="✅" />
        <Metric label="Críticos" value={mats.filter(m=>["agotado","critico"].includes(m.status)).length} color={C.redText} icon="⚠️" />
        <Metric label="Stock bajo" value={mats.filter(m=>m.status==="bajo").length} color={C.yellowText} icon="📉" />
      </div>

      {/* Filtro por categoría */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setCatFilter(c)} style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${catFilter===c?C.accent:C.border}`, background:catFilter===c?`${C.accent}15`:"#fff", color:catFilter===c?C.accent:C.muted, cursor:"pointer", fontSize:12, fontWeight:catFilter===c?600:400 }}>{c} {c!=="Todos"?`(${mats.filter(m=>m.category===c).length})`:""}</button>
        ))}
      </div>

      {loading ? <div style={{ padding:40, textAlign:"center", color:C.muted }}>⏳ Cargando…</div>
      : filtered.length===0 ? <div style={{ padding:40, textAlign:"center", color:C.muted }}>Sin materiales en esta categoría.</div>
      : filtered.map(m=>{ const ms=matStyle(m.status); const pct=Math.round((m.stock/Math.max(+m.stock+(+m.reserved||0),1))*100); return (
        <div key={m.id} style={{ background:C.bg, border:`1px solid ${m.status!=="ok"?ms.border:C.border}`, borderRadius:12, padding:"14px 18px" }}>
          <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5, flexWrap:"wrap" }}>
                <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{m.name}</span>
                <Badge label={ms.label} bg={ms.bg} text={ms.text} border={ms.border} />
                <Badge label={m.category} bg={C.bg2} text={C.muted} border={C.border} />
              </div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>
                {m.stock} {m.unit} disponibles · {m.reserved||0} reservados · Mín: {m.min_stock||0} · Proveedor: {m.supplier||"—"}
              </div>
              <Bar pct={pct} color={m.status==="agotado"?C.red:m.status==="bajo"?C.yellow:C.green} h={6} />
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontSize:18, fontWeight:700, color:C.accent }}>${(+m.cost).toLocaleString()}</div>
              <div style={{ fontSize:11, color:C.muted }}>/{m.unit}</div>
              {rp.editar && <div style={{ display:"flex", gap:5, marginTop:8, justifyContent:"flex-end" }}>
                <Btn size="sm" onClick={e=>openEdit(m,e)}>✏</Btn>
                {rp.eliminar && <Btn size="sm" variant="danger" onClick={e=>{e.stopPropagation();setDelConfirm(m);}}>🗑</Btn>}
              </div>}
            </div>
          </div>
        </div>
      );})}

      {modal && (
        <Modal title={modal.mode==="create"?"Nuevo material":"Editar material"} onClose={()=>setModal(null)} width={540}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Input label="Nombre del material" required value={form.name} onChange={set("name")} placeholder="Ej: Tubo cuadrado 1½\"" />
              <Input label="Categoría" value={form.category} onChange={set("category")} opts={MATERIAL_CATS} />
              <Input label="Unidad" value={form.unit} onChange={set("unit")} opts={["ml","m²","kg","lt","pz","rollo","caja","galón"]} />
              <Input label="Costo por unidad (MXN)" value={form.cost} onChange={set("cost")} type="number" placeholder="0" />
              <Input label="Stock disponible" value={form.stock} onChange={set("stock")} type="number" placeholder="0" />
              <Input label="Reservado" value={form.reserved} onChange={set("reserved")} type="number" placeholder="0" />
              <Input label="Stock mínimo" value={form.min_stock} onChange={set("min_stock")} type="number" placeholder="0" />
              <Input label="Estado" value={form.status} onChange={set("status")} opts={MAT_STATUS} />
              <Input label="Proveedor" value={form.supplier} onChange={set("supplier")} placeholder="Nombre del proveedor" />
            </div>
            <Input label="Alerta especial (opcional)" value={form.alert_msg} onChange={set("alert_msg")} placeholder="Ej: Proyecto X detenido por falta de este material" />
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:6 }}>
              <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
              <Btn variant="primary" onClick={save}>💾 {modal.mode==="create"?"Agregar material":"Guardar cambios"}</Btn>
            </div>
          </div>
        </Modal>
      )}
      {delConfirm && <ConfirmDelete name={delConfirm.name} onConfirm={del} onCancel={()=>setDelConfirm(null)} />}
    </div>
  );
}

// ─── SUPPLIERS MODULE ─────────────────────────────────────────────────────────
function SuppliersModule({ currentUser }) {
  const [suppliers, setSuppliers] = useState([]); const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); const [delConfirm, setDelConfirm] = useState(null); const [selSup, setSelSup] = useState(null);
  const rp = ROLE_PERMS[currentUser.role];
  const empty = { name:"", contact:"", phone:"", email:"", location:"", category:"Ferretería", notes:"" };
  const [form, setForm] = useState(empty);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const load=async()=>{ setLoading(true); try{ const s=await db.get("suppliers","select=*"); setSuppliers(s||[]); }catch(e){ setSuppliers([]); } setLoading(false); };
  useEffect(()=>{ load(); },[]);
  const openCreate=()=>{ setForm(empty); setModal({mode:"create"}); };
  const openEdit=(s,e)=>{ e?.stopPropagation(); setForm({name:s.name||"",contact:s.contact||"",phone:s.phone||"",email:s.email||"",location:s.location||"",category:s.category||"Ferretería",notes:s.notes||""}); setModal({mode:"edit",id:s.id}); };
  const save=async()=>{
    if(!form.name) return alert("Nombre es obligatorio");
    try{
      if(modal.mode==="create") await db.insert("suppliers",{...form,id:`SUP-${Date.now().toString().slice(-4)}`});
      else await db.update("suppliers",`id=eq.${modal.id}`,{...form,updated_at:new Date().toISOString()});
      setModal(null); load();
    }catch(e){ alert("Error: "+e.message); }
  };
  const del=async()=>{ try{ await db.delete("suppliers",`id=eq.${delConfirm.id}`); setDelConfirm(null); if(selSup?.id===delConfirm.id) setSelSup(null); load(); }catch(e){ alert("Error: "+e.message); } };

  const CAT_COLORS = { "Ferretería":{ bg:C.blueBg,text:C.blueText,border:C.blueBorder },"Pinturería":{ bg:C.purpleBg,text:C.purpleText,border:C.purpleBorder },"Vidriería":{ bg:`#f0fdfa`,text:"#0f766e",border:"#99f6e4" },"Maderería":{ bg:C.orangeBg,text:C.orangeText,border:C.orangeBorder },"Otro":{ bg:C.bg2,text:C.muted,border:C.border } };

  if(selSup) return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
        <Btn onClick={()=>setSelSup(null)}>← Volver</Btn>
        <div style={{ flex:1 }}><div style={{ fontSize:18, fontWeight:700, color:C.text }}>{selSup.name}</div><div style={{ fontSize:12, color:C.muted }}>{selSup.category} · {selSup.location}</div></div>
        {rp.editar && <div style={{ display:"flex", gap:8 }}>
          <Btn onClick={e=>openEdit(selSup,e)}>✏ Editar</Btn>
          {rp.eliminar && <Btn variant="danger" onClick={()=>setDelConfirm(selSup)}>🗑 Eliminar</Btn>}
        </div>}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[["Nombre",selSup.name],["Categoría",selSup.category],["Contacto",selSup.contact||"—"],["Teléfono",selSup.phone||"—"],["Correo",selSup.email||"—"],["Ubicación",selSup.location||"—"]].map(([k,v])=>(
          <div key={k} style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, padding:"11px 14px" }}><div style={{ fontSize:11, color:C.muted, fontWeight:500, marginBottom:3 }}>{k}</div><div style={{ fontSize:14, fontWeight:600, color:C.text }}>{v}</div></div>
        ))}
      </div>
      {selSup.notes && <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, padding:"13px 16px" }}><div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:6 }}>Notas</div><div style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>{selSup.notes}</div></div>}
      {modal && <Modal title="Editar proveedor" onClose={()=>setModal(null)} width={520}><div style={{ display:"flex",flexDirection:"column",gap:14 }}><div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}><Input label="Nombre" required value={form.name} onChange={set("name")} /><Input label="Categoría" value={form.category} onChange={set("category")} opts={["Ferretería","Pinturería","Vidriería","Maderería","Otro"]} /><Input label="Contacto" value={form.contact} onChange={set("contact")} placeholder="Nombre del contacto" /><Input label="Teléfono" value={form.phone} onChange={set("phone")} placeholder="9999-0000" /><Input label="Correo" value={form.email} onChange={set("email")} type="email" placeholder="correo@ejemplo.com" /><Input label="Ubicación" value={form.location} onChange={set("location")} placeholder="Col. Centro, SPS" /></div><Input label="Notas" value={form.notes} onChange={set("notes")} rows={2} placeholder="Notas adicionales…" /><div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn variant="primary" onClick={save}>💾 Guardar</Btn></div></div></Modal>}
      {delConfirm && <ConfirmDelete name={delConfirm.name} onConfirm={del} onCancel={()=>setDelConfirm(null)} />}
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
        <div><h2 style={{ margin:0, fontSize:20, fontWeight:700, color:C.text }}>Proveedores</h2><div style={{ fontSize:12, color:C.muted }}>{suppliers.length} registrados</div></div>
        {rp.editar && <Btn variant="primary" onClick={openCreate}>+ Nuevo proveedor</Btn>}
      </div>
      {loading ? <div style={{ padding:40, textAlign:"center", color:C.muted }}>⏳ Cargando…</div>
      : suppliers.length===0 ? <div style={{ padding:40, textAlign:"center", color:C.muted, border:`2px dashed ${C.border}`, borderRadius:12 }}><div style={{ fontSize:32, marginBottom:10 }}>🏪</div><div>Sin proveedores registrados.</div><div style={{ marginTop:10 }}>{rp.editar && <Btn variant="primary" onClick={openCreate}>+ Agregar primer proveedor</Btn>}</div></div>
      : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
        {suppliers.map(s=>{ const cc=CAT_COLORS[s.category]||CAT_COLORS["Otro"]; return (
          <div key={s.id} onClick={()=>setSelSup(s)} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, padding:18, cursor:"pointer", display:"flex", flexDirection:"column", gap:12 }}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.08)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{s.name}</div>
                <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{s.location||"Sin ubicación"}</div>
              </div>
              <Badge label={s.category||"Otro"} bg={cc.bg} text={cc.text} border={cc.border} />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              {s.contact && <div style={{ fontSize:12, color:C.muted }}>👤 {s.contact}</div>}
              {s.phone && <div style={{ fontSize:12, color:C.muted }}>📞 {s.phone}</div>}
              {s.email && <div style={{ fontSize:12, color:C.muted }}>✉ {s.email}</div>}
            </div>
            {s.notes && <div style={{ fontSize:11, color:C.muted, background:C.bg2, borderRadius:7, padding:"6px 10px", lineHeight:1.5 }}>{s.notes.slice(0,80)}{s.notes.length>80?"…":""}</div>}
            {rp.editar && <div style={{ display:"flex", gap:8, borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
              <Btn size="sm" onClick={e=>openEdit(s,e)} style={{ flex:1, justifyContent:"center" }}>✏ Editar</Btn>
              {rp.eliminar && <Btn size="sm" variant="danger" onClick={e=>{e.stopPropagation();setDelConfirm(s);}} style={{ flex:1, justifyContent:"center" }}>🗑 Eliminar</Btn>}
            </div>}
          </div>
        );})}
      </div>}

      {modal && (
        <Modal title={modal.mode==="create"?"Nuevo proveedor":"Editar proveedor"} onClose={()=>setModal(null)} width={520}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Input label="Nombre del proveedor" required value={form.name} onChange={set("name")} placeholder="Ej: FerreMax SPS" />
              <Input label="Categoría" value={form.category} onChange={set("category")} opts={["Ferretería","Pinturería","Vidriería","Maderería","Otro"]} />
              <Input label="Nombre del contacto" value={form.contact} onChange={set("contact")} placeholder="Juan García" />
              <Input label="Teléfono" value={form.phone} onChange={set("phone")} placeholder="9999-0000" />
              <Input label="Correo electrónico" value={form.email} onChange={set("email")} type="email" placeholder="contacto@ferreteria.com" />
              <Input label="Ubicación / Dirección" value={form.location} onChange={set("location")} placeholder="Col. Centro, SPS" />
            </div>
            <Input label="Notas adicionales" value={form.notes} onChange={set("notes")} rows={2} placeholder="Horarios, condiciones, descuentos…" />
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:6 }}>
              <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
              <Btn variant="primary" onClick={save}>💾 {modal.mode==="create"?"Agregar proveedor":"Guardar cambios"}</Btn>
            </div>
          </div>
        </Modal>
      )}
      {delConfirm && <ConfirmDelete name={delConfirm.name} onConfirm={del} onCancel={()=>setDelConfirm(null)} />}
    </div>
  );
}

// ─── CLIENTS MODULE ───────────────────────────────────────────────────────────
function ClientsModule({ currentUser }) {
  const [clients, setClients] = useState([]); const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); const [delConfirm, setDelConfirm] = useState(null);
  const rp = ROLE_PERMS[currentUser.role];
  const empty = { name:"", phone:"", email:"", address:"", type:"Particular", notes:"" };
  const [form, setForm] = useState(empty);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const load=async()=>{ setLoading(true); try{ const c=await db.get("clients","select=*"); setClients(c||[]); }catch(e){ setClients([]); } setLoading(false); };
  useEffect(()=>{ load(); },[]);
  const openCreate=()=>{ setForm(empty); setModal({mode:"create"}); };
  const openEdit=(c,e)=>{ e?.stopPropagation(); setForm({name:c.name||"",phone:c.phone||"",email:c.email||"",address:c.address||"",type:c.type||"Particular",notes:c.notes||""}); setModal({mode:"edit",id:c.id}); };
  const save=async()=>{
    if(!form.name) return alert("Nombre es obligatorio");
    try{
      if(modal.mode==="create") await db.insert("clients",{...form,id:`CLI-${Date.now().toString().slice(-4)}`});
      else await db.update("clients",`id=eq.${modal.id}`,{...form,updated_at:new Date().toISOString()});
      setModal(null); load();
    }catch(e){ alert("Error: "+e.message); }
  };
  const del=async()=>{ try{ await db.delete("clients",`id=eq.${delConfirm.id}`); setDelConfirm(null); load(); }catch(e){ alert("Error: "+e.message); } };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
        <div><h2 style={{ margin:0, fontSize:20, fontWeight:700, color:C.text }}>Clientes</h2><div style={{ fontSize:12, color:C.muted }}>{clients.length} registrados</div></div>
        {rp.editar && <Btn variant="primary" onClick={openCreate}>+ Nuevo cliente</Btn>}
      </div>
      {loading ? <div style={{ padding:40, textAlign:"center", color:C.muted }}>⏳ Cargando…</div>
      : clients.length===0 ? <div style={{ padding:40, textAlign:"center", color:C.muted, border:`2px dashed ${C.border}`, borderRadius:12 }}><div style={{ fontSize:32, marginBottom:10 }}>👥</div><div>Sin clientes registrados.</div><div style={{ marginTop:10 }}>{rp.editar && <Btn variant="primary" onClick={openCreate}>+ Agregar primer cliente</Btn>}</div></div>
      : <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
          {clients.map((c,i)=>(
            <div key={c.id} style={{ padding:"14px 18px", borderBottom:i<clients.length-1?`1px solid ${C.border}`:"none", display:"flex", gap:14, alignItems:"center" }}>
              <Avatar initials={c.name?.slice(0,2)||"?"} size={40} color={C.accent} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{c.name}</div>
                <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>
                  {c.phone&&`📞 ${c.phone}`}{c.phone&&c.email?" · ":""}{c.email&&`✉ ${c.email}`}
                </div>
                {c.address && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>📍 {c.address}</div>}
                {c.notes && <div style={{ fontSize:11, color:C.muted, marginTop:3, fontStyle:"italic" }}>{c.notes.slice(0,80)}{c.notes.length>80?"…":""}</div>}
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                <Badge label={c.type||"Particular"} bg={C.blueBg} text={C.blueText} border={C.blueBorder} />
                {rp.editar && <div style={{ display:"flex", gap:5 }}>
                  <Btn size="sm" onClick={e=>openEdit(c,e)}>✏</Btn>
                  {rp.eliminar && <Btn size="sm" variant="danger" onClick={e=>{e.stopPropagation();setDelConfirm(c);}}>🗑</Btn>}
                </div>}
              </div>
            </div>
          ))}
        </div>}

      {modal && (
        <Modal title={modal.mode==="create"?"Nuevo cliente":"Editar cliente"} onClose={()=>setModal(null)} width={500}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Input label="Nombre completo" required value={form.name} onChange={set("name")} placeholder="Nombre del cliente" />
              <Input label="Tipo" value={form.type} onChange={set("type")} opts={["Particular","Empresa","Arquitecto","Constructor","Gobierno"]} />
              <Input label="Teléfono" value={form.phone} onChange={set("phone")} placeholder="9999-0000" />
              <Input label="Correo electrónico" value={form.email} onChange={set("email")} type="email" placeholder="correo@ejemplo.com" />
              <div style={{ gridColumn:"1/-1" }}><Input label="Dirección" value={form.address} onChange={set("address")} placeholder="Col. Centro, San Pedro Sula" /></div>
            </div>
            <Input label="Notas" value={form.notes} onChange={set("notes")} rows={2} placeholder="Notas adicionales…" />
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:6 }}>
              <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
              <Btn variant="primary" onClick={save}>💾 {modal.mode==="create"?"Agregar cliente":"Guardar cambios"}</Btn>
            </div>
          </div>
        </Modal>
      )}
      {delConfirm && <ConfirmDelete name={delConfirm.name} onConfirm={del} onCancel={()=>setDelConfirm(null)} />}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ currentUser, onNav }) {
  const [projects, setProjects] = useState([]); const [employees, setEmployees] = useState([]); const [materials, setMaterials] = useState([]); const [audit, setAudit] = useState([]); const [loading, setLoading] = useState(true);
  const load=async()=>{ setLoading(true); try{ const [p,e,m,a]=await Promise.all([db.get("projects","select=*"),db.get("employees","select=*"),db.get("materials","select=*"),db.get("audit_log","select=*&limit=8")]); setProjects(p||[]); setEmployees(e||[]); setMaterials(m||[]); setAudit(a||[]); }catch(e){} setLoading(false); };
  useEffect(()=>{ load(); },[]);

  if(loading) return <div style={{ padding:60, textAlign:"center", color:C.muted, fontSize:14 }}>⏳ Cargando dashboard…</div>;

  const avgProgress = projects.length ? Math.round(projects.reduce((a,p)=>a+(p.progress||0),0)/projects.length) : 0;
  const critical = materials.filter(m=>["agotado","critico"].includes(m.status));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:C.text }}>Bienvenido, {currentUser.name.split(" ")[0]} 👋</h2>
          <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>{new Date().toLocaleDateString("es-MX",{ weekday:"long",day:"numeric",month:"long",year:"numeric" })}</div>
        </div>
        <button onClick={load} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, color:C.muted, cursor:"pointer", fontSize:13 }}>↻ Actualizar</button>
      </div>

      {projects.filter(p=>p.alert).map(p=>(
        <div key={p.id} onClick={()=>onNav("projects")} style={{ background:C.redBg, border:`1px solid ${C.redBorder}`, borderRadius:10, padding:"11px 16px", cursor:"pointer", display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:16 }}>⚠️</span>
          <span style={{ fontSize:13, color:C.redText }}><b>{p.id}</b> · {p.client} — entrega {p.delivery}</span>
        </div>
      ))}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12 }}>
        <Metric label="Proyectos activos" value={projects.length} icon="📁" />
        <Metric label="Avance promedio" value={`${avgProgress}%`} color={C.accent} icon="📊" />
        <Metric label="Empleados" value={employees.length} color={C.greenText} icon="👷" />
        <Metric label="Mat. críticos" value={critical.length} color={critical.length>0?C.redText:C.greenText} icon="📦" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16 }}>
        <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:15, fontWeight:700, color:C.text }}>Proyectos recientes</span>
            <button onClick={()=>onNav("projects")} style={{ fontSize:12, color:C.accent, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>Ver todos →</button>
          </div>
          {projects.slice(0,5).map(p=>{ const sc=statusStyle(p.status); return (
            <div key={p.id} style={{ padding:"12px 18px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:12, alignItems:"center" }}>
              <div style={{ width:4, background:prioColor(p.priority), borderRadius:2, alignSelf:"stretch", flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:4 }}>{p.client}</div>
                <Bar pct={p.progress||0} color={p.alert?C.red:C.accent} h={5} />
              </div>
              <Badge label={p.status} bg={sc.bg} text={sc.text} border={sc.border} />
            </div>
          );})}
          {projects.length===0 && <div style={{ padding:24, textAlign:"center", color:C.muted, fontSize:13 }}>Sin proyectos aún.</div>}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, fontSize:14, fontWeight:700, color:C.text }}>Actividad reciente</div>
            {audit.length===0 ? <div style={{ padding:"14px 16px", fontSize:12, color:C.muted }}>Sin actividad registrada.</div>
            : audit.slice(0,5).map(l=>(
              <div key={l.id} style={{ padding:"9px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", gap:8 }}>
                <span style={{ fontSize:14 }}>{{ "actualizó avance":"📊","aprobó etapa":"✅","inició sesión":"🔐","creó proyecto":"✨" }[l.action]||"📋"}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}><b>{l.user_name}</b> {l.action}</div>
                  <div style={{ fontSize:10, color:C.muted }}>{new Date(l.created_at).toLocaleString("es-MX")}</div>
                </div>
              </div>
            ))}
          </div>

          {critical.length>0 && (
            <div style={{ background:C.redBg, border:`1px solid ${C.redBorder}`, borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.redBorder}`, fontSize:14, fontWeight:700, color:C.redText }}>⚠ Materiales críticos</div>
              {critical.map(m=>{ const ms=matStyle(m.status); return (
                <div key={m.id} style={{ padding:"9px 16px", borderBottom:`1px solid ${C.redBorder}` }}>
                  <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{m.name}</div>
                  <div style={{ fontSize:11, color:ms.text }}>{ms.label} · {m.stock} {m.unit} disponibles</div>
                </div>
              );})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AI ASSISTANT ─────────────────────────────────────────────────────────────
function AIAssistant({ currentUser }) {
  const [messages,setMessages]=useState([{ role:"assistant",content:`Hola ${currentUser.name.split(" ")[0]}. Soy el asistente operativo de De Metal. ¿En qué te puedo ayudar hoy?` }]);
  const [input,setInput]=useState(""); const [loading,setLoading]=useState(false);
  const SUGGESTIONS=["¿Qué proyecto tiene mayor riesgo esta semana?","¿Qué debo priorizar hoy?","Genera un resumen ejecutivo","¿Cómo mejorar la eficiencia del equipo?"];
  const CTX=`Eres el asistente operativo de "De Metal", fábrica premium de barandales, portones y estructuras metálicas en San Pedro Sula, Honduras. Usuario activo: ${currentUser.name} (${currentUser.role}). Responde en español, sé directo y práctico. Máximo 180 palabras.`;
  const send=async(text)=>{ const q=text||input.trim(); if(!q||loading) return; setInput(""); const msgs=[...messages,{role:"user",content:q}]; setMessages(msgs); setLoading(true);
    try{ const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,system:CTX,messages:msgs.map(m=>({role:m.role,content:m.content}))})}); const data=await res.json(); setMessages(prev=>[...prev,{role:"assistant",content:data.content?.[0]?.text||"Error."}]); }catch{ setMessages(prev=>[...prev,{role:"assistant",content:"Error de conexión."}]); } setLoading(false); };
  const fmt=t=>t.split("\n").map((l,i)=><div key={i} style={{marginBottom:l?2:5,color:C.text}} dangerouslySetInnerHTML={{__html:l.replace(/\*\*(.*?)\*\*/g,"<b>$1</b>")||"&nbsp;"}} />);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:14,height:"calc(100vh - 100px)",maxHeight:680}}>
      <div><h2 style={{margin:0,fontSize:20,fontWeight:700,color:C.text}}>🤖 Asistente IA</h2><div style={{fontSize:12,color:C.muted}}>Análisis inteligente de operaciones</div></div>
      <div style={{flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
        <div style={{flex:1,overflowY:"auto",padding:18,display:"flex",flexDirection:"column",gap:12}}>
          {messages.map((m,i)=>(
            <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",flexDirection:m.role==="user"?"row-reverse":"row"}}>
              {m.role==="assistant"?<div style={{width:32,height:32,borderRadius:10,background:`${C.accent}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🤖</div>:<Avatar initials={currentUser.avatar} size={32} color={currentUser.color} />}
              <div style={{maxWidth:"78%",background:m.role==="user"?`${C.accent}15`:C.bg2,border:`1px solid ${m.role==="user"?`${C.accent}30`:C.border}`,borderRadius:m.role==="user"?"14px 4px 14px 14px":"4px 14px 14px 14px",padding:"10px 14px",fontSize:13,lineHeight:1.6}}>{fmt(m.content)}</div>
            </div>
          ))}
          {loading&&<div style={{display:"flex",gap:10}}><div style={{width:32,height:32,borderRadius:10,background:`${C.accent}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🤖</div><div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:"4px 14px 14px 14px",padding:"12px 16px",display:"flex",gap:5}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:4,background:C.accent,animation:`pulse 1.2s ${i*.2}s infinite`}} />)}</div></div>}
        </div>
        {messages.length<=1&&<div style={{padding:"0 16px 12px",display:"flex",gap:6,flexWrap:"wrap"}}>{SUGGESTIONS.map((s,i)=><button key={i} onClick={()=>send(s)} style={{fontSize:12,padding:"6px 12px",borderRadius:20,border:`1px solid ${C.border}`,background:C.bg2,color:C.muted,cursor:"pointer"}}>{s}</button>)}</div>}
        <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Escribe tu pregunta…" style={{flex:1,borderRadius:10,border:`1.5px solid ${C.border2}`,background:"#fff",color:C.text,padding:"10px 14px",fontSize:13,outline:"none"}} />
          <Btn variant="primary" onClick={()=>send()} disabled={!input.trim()||loading} style={{padding:"10px 18px"}}>{loading?"…":"→"}</Btn>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [nav, setNav] = useState("dashboard");
  const [sidebar, setSidebar] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => { const on=()=>setIsOnline(true); const off=()=>setIsOnline(false); window.addEventListener("online",on); window.addEventListener("offline",off); return()=>{ window.removeEventListener("online",on); window.removeEventListener("offline",off); }; }, []);
  useEffect(() => { try { const s=localStorage.getItem("dm_session"); if(s){ const u=JSON.parse(s); const f=SYSTEM_USERS.find(x=>x.id===u.id); if(f) setCurrentUser(f); } } catch(e){} }, []);

  const handleLogin = u => { setCurrentUser(u); try { localStorage.setItem("dm_session", JSON.stringify({ id:u.id })); } catch(e){} };
  const handleLogout = () => { setCurrentUser(null); try { localStorage.removeItem("dm_session"); } catch(e){} };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  const rp = ROLE_PERMS[currentUser.role];

  const navItems = [
    { id:"dashboard",  emoji:"▦",  label:"Dashboard" },
    { id:"projects",   emoji:"📁", label:"Proyectos" },
    { id:"employees",  emoji:"👷", label:"Empleados" },
    { id:"materials",  emoji:"📦", label:"Materiales" },
    { id:"suppliers",  emoji:"🏪", label:"Proveedores" },
    { id:"clients",    emoji:"👥", label:"Clientes" },
    { id:"ai",         emoji:"🤖", label:"Asistente IA" },
  ];

  const renderContent = () => {
    if (nav==="dashboard")  return <Dashboard currentUser={currentUser} onNav={setNav} />;
    if (nav==="projects")   return <ProjectsModule currentUser={currentUser} />;
    if (nav==="employees")  return <EmployeesModule currentUser={currentUser} />;
    if (nav==="materials")  return <MaterialsModule currentUser={currentUser} />;
    if (nav==="suppliers")  return <SuppliersModule currentUser={currentUser} />;
    if (nav==="clients")    return <ClientsModule currentUser={currentUser} />;
    if (nav==="ai")         return <AIAssistant currentUser={currentUser} />;
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", background:"#f3f4f6", fontSize:14, color:C.text }}>
      {/* Sidebar */}
      <div style={{ width:sidebar?220:60, background:"#fff", borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0, transition:"width .2s", overflow:"hidden" }}>
        <div style={{ padding:"16px 14px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:sidebar?"flex-start":"center", minHeight:70 }}>
          {sidebar ? <div>
            <div style={{ fontFamily:"Georgia,'Times New Roman',serif", fontSize:22, fontWeight:700, color:C.text, lineHeight:1 }}>De Metal</div>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:"0.14em", textTransform:"uppercase", marginTop:4 }}>Líderes en hierro forjado</div>
          </div> : <div style={{ width:32, height:32, borderRadius:10, background:`${C.accent}20`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Georgia,serif", fontSize:16, fontWeight:700, color:C.accent }}>D</div>}
        </div>

        <nav style={{ flex:1, padding:"10px 8px", display:"flex", flexDirection:"column", gap:2 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setNav(item.id)} style={{ display:"flex", alignItems:"center", gap:11, padding:"9px 10px", borderRadius:10, border:"none", cursor:"pointer", background:nav===item.id?`${C.accent}15`:"transparent", color:nav===item.id?C.accent:C.muted, fontWeight:nav===item.id?700:400, fontSize:13, textAlign:"left", width:"100%", whiteSpace:"nowrap", transition:"all .15s" }}
              onMouseEnter={e=>{ if(nav!==item.id) e.currentTarget.style.background=C.bg2; }}
              onMouseLeave={e=>{ if(nav!==item.id) e.currentTarget.style.background="transparent"; }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{item.emoji}</span>
              {sidebar && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User profile */}
        <div style={{ padding:"10px 10px 8px", borderTop:`1px solid ${C.border}` }}>
          {sidebar ? <div style={{ display:"flex", gap:9, alignItems:"center" }}>
            <Avatar initials={currentUser.avatar} size={32} color={currentUser.color} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentUser.name.split(" ")[0]}</div>
              <div style={{ fontSize:10, color:C.muted }}>{currentUser.role}</div>
            </div>
            <button onClick={handleLogout} title="Cerrar sesión" style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:16, padding:4, borderRadius:6 }}>⏻</button>
          </div> : <button onClick={handleLogout} style={{ width:"100%", background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:18, padding:"6px 0", borderRadius:8 }}>⏻</button>}
        </div>
        <button onClick={() => setSidebar(!sidebar)} style={{ margin:"2px 8px 10px", padding:"7px", border:`1px solid ${C.border}`, borderRadius:8, cursor:"pointer", background:"transparent", color:C.muted, fontSize:11, display:"flex", alignItems:"center", justifyContent:"center" }}>{sidebar ? "◀ Colapsar" : "▶"}</button>
      </div>

      {/* Main area */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        {/* Topbar */}
        <div style={{ background:"#fff", borderBottom:`1px solid ${C.border}`, padding:"12px 24px", display:"flex", alignItems:"center", gap:12, boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontFamily:"Georgia,serif", fontSize:15, fontWeight:700, color:C.text }}>De Metal</div>
          <div style={{ width:1, height:18, background:C.border }} />
          <div style={{ fontSize:14, color:C.muted, fontWeight:500 }}>{navItems.find(n=>n.id===nav)?.label}</div>
          <div style={{ flex:1 }} />
          <div style={{ display:"flex", gap:7, alignItems:"center" }}>
            <div style={{ width:7, height:7, borderRadius:4, background:isOnline?C.green:C.red }} />
            <span style={{ fontSize:11, color:C.muted }}>{isOnline?"Supabase conectado":"Sin conexión"}</span>
          </div>
          <Badge label={currentUser.role} bg={rp.bg} text={rp.color} border={rp.border} />
        </div>

        {/* Content */}
        <div style={{ flex:1, padding:"24px", overflowY:"auto" }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
