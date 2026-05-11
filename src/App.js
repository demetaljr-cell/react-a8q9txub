
import { useState, useEffect, useRef } from "react";

const SUPA_URL = "https://bhirrdalujsevlwxoiji.supabase.co";
const SUPA_KEY = "sb_publishable_ian5YhEbz5fd4b0MQQuIBA_g9c46fqb";

const req = async (path, opts = {}) => {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPA_KEY,
      "Authorization": "Bearer " + SUPA_KEY,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...opts.headers
    },
    ...opts
  });
  const t = await res.text();
  return t ? JSON.parse(t) : [];
};

const db = {
  get: (t, q) => req(t + "?" + (q || "") + "&order=created_at.desc"),
  insert: (t, d) => req(t, { method: "POST", body: JSON.stringify(d) }),
  update: (t, m, d) => req(t + "?" + m, { method: "PATCH", body: JSON.stringify(d) }),
  remove: (t, m) => req(t + "?" + m, { method: "DELETE" })
};

const C = {
  accent: "#B87333",
  red: "#ef4444", redBg: "#fef2f2", redBorder: "#fecaca", redText: "#dc2626",
  green: "#22c55e", greenBg: "#f0fdf4", greenBorder: "#bbf7d0", greenText: "#16a34a",
  blue: "#3b82f6", blueBg: "#eff6ff", blueBorder: "#bfdbfe", blueText: "#1d4ed8",
  orange: "#f97316", orangeBg: "#fff7ed", orangeBorder: "#fed7aa", orangeText: "#c2410c",
  purple: "#8b5cf6", purpleBg: "#faf5ff", purpleBorder: "#ddd6fe", purpleText: "#7c3aed",
  yellow: "#eab308", yellowBg: "#fefce8", yellowBorder: "#fef08a", yellowText: "#a16207",
  border: "#e5e7eb", border2: "#d1d5db",
  bg: "#ffffff", bg2: "#f9fafb", bg3: "#f3f4f6",
  text: "#111827", muted: "#6b7280"
};

const FLOW = ["Cotizacion", "Diseno", "En produccion", "Instalacion", "Entregado"];
const FLOW_LABELS = {
  "Cotizacion": "Cotización",
  "Diseno": "Diseño",
  "En produccion": "En producción",
  "Instalacion": "Instalación",
  "Entregado": "Entregado"
};

const MAT_CATS = ["Tubos", "Platinas", "Laminas", "Pintura", "Accesorios", "Tornilleria", "Herramientas", "Vidrio", "Madera", "Otro"];
const PRIORIDADES = ["Urgente", "Alta", "Media", "Baja"];
const ESTADOS = ["Cotizacion", "Diseno", "En produccion", "Instalacion", "Entregado", "Atrasado"];

var MONEDA = { simbolo: "L", nombre: "Lempiras" };

function formatMonto(valor) {
  return MONEDA.simbolo + " " + (+valor || 0).toLocaleString();
}

const USERS = [
  { id: "U01", name: "Jose Maria", role: "Administrador", avatar: "JM", color: "#8b5cf6", user: "josemaria", pass: "planta2024" },
  { id: "U02", name: "Yamara", role: "Administrador", avatar: "YA", color: "#B87333", user: "yamara", pass: "planta2024" },
  { id: "U03", name: "De Metal Admin", role: "Supervisor", avatar: "DM", color: "#22c55e", user: "demetal", pass: "admin2024" },
  { id: "U04", name: "De Metal Disenios", role: "Produccion", avatar: "DD", color: "#f97316", user: "disenios", pass: "diseno2024" }
];

const PERMS = {
  "Administrador": { editar: true, eliminar: true, color: "#8b5cf6", bg: "#faf5ff", border: "#ddd6fe" },
  "Supervisor":    { editar: true, eliminar: false, color: "#B87333", bg: "#fff7ed", border: "#fed7aa" },
  "Produccion":    { editar: true, eliminar: false, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  "Instalacion":   { editar: true, eliminar: false, color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" }
};

function statusStyle(s) {
  var m = {
    "En produccion": { bg: C.greenBg, text: C.greenText, border: C.greenBorder },
    "Diseno": { bg: C.blueBg, text: C.blueText, border: C.blueBorder },
    "Instalacion": { bg: C.orangeBg, text: C.orangeText, border: C.orangeBorder },
    "Atrasado": { bg: C.redBg, text: C.redText, border: C.redBorder },
    "Cotizacion": { bg: C.purpleBg, text: C.purpleText, border: C.purpleBorder },
    "Entregado": { bg: "#f0fdfa", text: "#0f766e", border: "#99f6e4" }
  };
  return m[s] || { bg: C.bg2, text: C.muted, border: C.border };
}

function matStyle(s) {
  var m = {
    ok: { bg: C.greenBg, text: C.greenText, border: C.greenBorder, label: "Disponible" },
    bajo: { bg: C.yellowBg, text: C.yellowText, border: C.yellowBorder, label: "Stock bajo" },
    critico: { bg: C.orangeBg, text: C.orangeText, border: C.orangeBorder, label: "Critico" },
    agotado: { bg: C.redBg, text: C.redText, border: C.redBorder, label: "Agotado" },
    pendiente: { bg: C.purpleBg, text: C.purpleText, border: C.purpleBorder, label: "En camino" }
  };
  return m[s] || { bg: C.bg2, text: C.muted, border: C.border, label: s };
}

function prioColor(p) {
  return { Urgente: C.red, Alta: C.orange, Media: C.yellow, Baja: C.green }[p] || C.muted;
}

// ─── UI ──────────────────────────────────────────────────────────────────────
function Bar({ pct, color, h }) {
  color = color || C.accent;
  h = h || 6;
  return (
    <div style={{ background: C.bg3, borderRadius: 99, height: h, overflow: "hidden" }}>
      <div style={{ width: Math.min(pct || 0, 100) + "%", background: color, height: "100%", borderRadius: 99 }} />
    </div>
  );
}

function Badge({ label, bg, text, border }) {
  return (
    <span style={{ fontSize: 11, padding: "2px 9px", borderRadius: 99, fontWeight: 600, background: bg || C.bg2, color: text || C.muted, border: "1px solid " + (border || C.border), whiteSpace: "nowrap", display: "inline-block" }}>
      {label}
    </span>
  );
}

function Metric({ label, value, sub, color, icon }) {
  return (
    <div style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || C.text, lineHeight: 1, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Av({ initials, size, color }) {
  size = size || 36;
  color = color || C.accent;
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: color + "20", border: "2px solid " + color + "40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, color: color, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Inp({ label, value, onChange, type, placeholder, required, opts, rows }) {
  var s = { width: "100%", borderRadius: 8, border: "1.5px solid " + C.border2, background: "#fff", color: C.text, padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" };
  return (
    <div>
      {label && <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>{label}{required && <span style={{ color: C.red }}> *</span>}</div>}
      {opts
        ? <select value={value} onChange={onChange} style={s}>{opts.map(function(o) { return <option key={o} value={o}>{o}</option>; })}</select>
        : rows
          ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ ...s, resize: "vertical" }} />
          : <input value={value} onChange={onChange} type={type || "text"} placeholder={placeholder} style={s} />
      }
    </div>
  );
}

function Btn({ children, onClick, variant, color, style, disabled, size }) {
  var pad = size === "sm" ? "5px 11px" : size === "lg" ? "12px 24px" : "8px 16px";
  var bg = variant === "primary" ? (color || C.accent) : variant === "danger" ? C.red : "transparent";
  var cl = (variant === "primary" || variant === "danger") ? "#fff" : (color || C.muted);
  var bd = (variant === "primary" || variant === "danger") ? "none" : "1.5px solid " + C.border2;
  return (
    <button onClick={onClick} disabled={disabled} style={Object.assign({ padding: pad, borderRadius: 8, border: bd, background: bg, color: cl, cursor: disabled ? "not-allowed" : "pointer", fontSize: size === "sm" ? 12 : 13, fontWeight: (variant === "primary" || variant === "danger") ? 600 : 400, opacity: disabled ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: 5 }, style || {})}>
      {children}
    </button>
  );
}

function Modal({ title, onClose, children, width }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.bg, borderRadius: 16, width: "100%", maxWidth: width || 480, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid " + C.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 22 }}>×</button>
        </div>
        <div style={{ padding: "20px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

function ConfirmDel({ name, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.bg, borderRadius: 14, padding: 28, maxWidth: 360, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>Eliminar registro</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>Se eliminara <b>{name}</b>. Esta accion no se puede deshacer.</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn onClick={onCancel}>Cancelar</Btn>
          <Btn variant="danger" onClick={onConfirm}>Si, eliminar</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  var [user, setUser] = useState("");
  var [pass, setPass] = useState("");
  var [err, setErr] = useState("");
  var [loading, setLoading] = useState(false);
  var [show, setShow] = useState(false);

  var login = async function() {
    setLoading(true); setErr("");
    await new Promise(function(r) { setTimeout(r, 400); });
    var found = USERS.find(function(u) { return u.user === user.trim() && u.pass === pass; });
    if (found) {
      try { await db.insert("audit_log", { user_name: found.name, user_role: found.role, action: "inicio sesion", entity: "Sistema", detail: "Acceso al portal", module: "Auth", device: "Web" }); } catch(e) {}
      onLogin(found);
    } else {
      setErr("Usuario o contrasena incorrectos");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f5f0eb,#ede8e3)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 38, fontWeight: 700, color: C.text }}>De Metal</div>
          <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 6 }}>Lideres en hierro forjado</div>
          <div style={{ width: 44, height: 3, background: C.accent, margin: "14px auto 0", borderRadius: 2 }} />
        </div>
        <div style={{ background: "#fff", border: "1px solid " + C.border, borderRadius: 18, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: C.green }} />
            <span style={{ fontSize: 12, color: C.greenText, fontWeight: 500 }}>Base de datos conectada</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Bienvenido</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>Ingresa tus credenciales para continuar</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Inp label="Usuario" value={user} onChange={function(e) { setUser(e.target.value); }} placeholder="tu.usuario" />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>Contrasena</div>
              <div style={{ position: "relative" }}>
                <input value={pass} onChange={function(e) { setPass(e.target.value); }} onKeyDown={function(e) { if(e.key==="Enter") login(); }} type={show ? "text" : "password"} placeholder="••••••••" style={{ width: "100%", borderRadius: 8, border: "1.5px solid " + (err ? C.red : C.border2), background: "#fff", color: C.text, padding: "9px 40px 9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                <button onClick={function() { setShow(!show); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16 }}>{show ? "🙈" : "👁"}</button>
              </div>
            </div>
          </div>
          {err && <div style={{ background: C.redBg, border: "1px solid " + C.redBorder, borderRadius: 8, padding: "9px 12px", fontSize: 12, color: C.redText, marginTop: 12 }}>⚠ {err}</div>}
          <button onClick={login} disabled={!user || !pass || loading} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", cursor: (!user || !pass || loading) ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700, opacity: (!user || !pass || loading) ? 0.6 : 1, marginTop: 18 }}>
            {loading ? "Verificando..." : "Ingresar al sistema"}
          </button>
          <div style={{ borderTop: "1px solid " + C.border, paddingTop: 16, marginTop: 20 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, fontWeight: 500 }}>Accesos rapidos:</div>
            {USERS.map(function(u) {
              var rp = PERMS[u.role] || PERMS["Instalacion"];
              return (
                <button key={u.id} onClick={function() { setUser(u.user); setPass(u.pass); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid " + C.border, background: C.bg2, cursor: "pointer", marginBottom: 5 }}>
                  <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                    <Av initials={u.avatar} size={26} color={u.color} />
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{u.name}</span>
                  </div>
                  <Badge label={u.role} bg={rp.bg} text={rp.color} border={rp.border} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PHOTO UPLOADER ───────────────────────────────────────────────────────────
function PhotoUploader({ onPhoto }) {
  var ref = useRef();
  var [prev, setPrev] = useState(null);
  var handle = function(e) {
    var f = e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function(ev) { setPrev(ev.target.result); onPhoto(ev.target.result); };
    r.readAsDataURL(f);
  };
  return (
    <div>
      <input ref={ref} type="file" accept="image/*" capture="environment" onChange={handle} style={{ display: "none" }} />
      {prev
        ? <div style={{ position: "relative", borderRadius: 10, overflow: "hidden" }}>
            <img src={prev} alt="preview" style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }} />
            <button onClick={function() { setPrev(null); onPhoto(null); }} style={{ position: "absolute", top: 7, right: 7, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: 20, width: 26, height: 26, color: "#fff", cursor: "pointer", fontSize: 14 }}>x</button>
          </div>
        : <div onClick={function() { ref.current.click(); }} style={{ border: "2px dashed " + C.border2, borderRadius: 10, padding: "20px", textAlign: "center", cursor: "pointer", background: C.bg2 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Subir fotografia del avance</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Toca para tomar foto o seleccionar</div>
          </div>
      }
    </div>
  );
}

// ─── QUICK UPDATE ─────────────────────────────────────────────────────────────
function QuickUpdate({ project, currentUser, onClose, onSaved }) {
  var [pct, setPct] = useState(project.progress || 0);
  var [area, setArea] = useState(project.phase || "Diseno");
  var [note, setNote] = useState("");
  var [photo, setPhoto] = useState(null);
  var [issue, setIssue] = useState("");
  var [saving, setSaving] = useState(false);
  var [saved, setSaved] = useState(false);
  var AREAS = ["Diseno", "Corte", "Soldadura", "Pintura", "Instalacion", "Calidad", "Ensamblaje"];
  var device = navigator.userAgent.includes("iPhone") ? "iPhone" : navigator.userAgent.includes("Android") ? "Android" : "Computadora";

  var save = async function() {
    setSaving(true);
    try {
      await db.insert("project_logs", { project_id: project.id, user_name: currentUser.name, user_role: currentUser.role, prev_pct: project.progress || 0, new_pct: pct, area: area, note: note, issue: issue, device: device });
      if (photo) await db.insert("project_photos", { project_id: project.id, storage_url: photo, area: area, note: note, pct: pct, issue: issue || null, user_name: currentUser.name });
      await db.update("projects", "id=eq." + project.id, { progress: pct, phase: area, updated_at: new Date().toISOString() });
      await db.insert("audit_log", { user_name: currentUser.name, user_role: currentUser.role, action: "actualizo avance", entity: "Proyecto " + project.id, detail: (project.progress || 0) + "% -> " + pct + "% - " + area, module: "Proyectos", device: device });
      setSaved(true);
      setTimeout(function() { onSaved(); onClose(); }, 1100);
    } catch(e) { alert("Error: " + e.message); setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: C.bg, borderRadius: "18px 18px 0 0", width: "100%", maxWidth: 540, padding: 24, display: "flex", flexDirection: "column", gap: 14, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}>
        {saved
          ? <div style={{ textAlign: "center", padding: "28px 0" }}>
              <div style={{ fontSize: 44 }}>✅</div>
              <div style={{ fontWeight: 700, marginTop: 10, color: C.text, fontSize: 16 }}>Guardado correctamente</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 5 }}>Visible para todo el equipo</div>
            </div>
          : <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, color: C.text, fontSize: 16 }}>Actualizar avance</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{project.id} - {project.client}</div>
                </div>
                <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.muted }}>x</button>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>Area que actualiza</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {AREAS.map(function(a) {
                    return <button key={a} onClick={function() { setArea(a); }} style={{ padding: "6px 12px", borderRadius: 20, border: "1.5px solid " + (area === a ? C.accent : C.border), background: area === a ? C.accent + "15" : "#fff", color: area === a ? C.accent : C.muted, cursor: "pointer", fontSize: 12, fontWeight: area === a ? 600 : 400 }}>{a}</button>;
                  })}
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Porcentaje de avance</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>{pct}%</span>
                </div>
                <input type="range" min={0} max={100} step={1} value={pct} onChange={function(e) { setPct(+e.target.value); }} style={{ width: "100%", accentColor: C.accent }} />
                <Bar pct={pct} h={8} />
              </div>
              <PhotoUploader onPhoto={setPhoto} />
              <Inp label="Comentario del avance" value={note} onChange={function(e) { setNote(e.target.value); }} placeholder="Que se hizo? Que avanzo?" rows={2} />
              <Inp label="Problema o material faltante (opcional)" value={issue} onChange={function(e) { setIssue(e.target.value); }} placeholder="Ej: Falta pintura epoxica negra" />
              <div style={{ background: C.bg2, borderRadius: 8, padding: "8px 12px", fontSize: 11, color: C.muted, display: "flex", gap: 14 }}>
                <span>👤 {currentUser.name}</span>
                <span>💻 {device}</span>
              </div>
              <Btn variant="primary" onClick={save} disabled={saving} style={{ width: "100%", padding: "12px", fontSize: 14, justifyContent: "center" }}>
                {saving ? "Guardando..." : "Guardar avance"}
              </Btn>
            </>
        }
      </div>
    </div>
  );
}

// ─── PROJECTS ─────────────────────────────────────────────────────────────────
function ProjectsModule({ currentUser }) {
  var [projects, setProjects] = useState([]);
  var [loading, setLoading] = useState(true);
  var [modal, setModal] = useState(null);
  var [delConfirm, setDelConfirm] = useState(null);
  var [sel, setSel] = useState(null);
  var [updateP, setUpdateP] = useState(null);
  var [view, setView] = useState("list");
  var [logs, setLogs] = useState([]);
  var [photos, setPhotos] = useState([]);
  var rp = PERMS[currentUser.role] || PERMS["Instalacion"];
  var emptyForm = { client: "", type: "", area: "", delivery: "", responsible: "", priority: "Alta", status: "Cotizacion", phase: "Diseno", budget: "", notes: "" };
  var [form, setForm] = useState(emptyForm);

  var load = async function() {
    setLoading(true);
    try { var p = await db.get("projects", "select=*"); setProjects(p || []); } catch(e) {}
    setLoading(false);
  };

  var loadDetail = async function(id) {
    try {
      var l = await db.get("project_logs", "select=*&project_id=eq." + id);
      var ph = await db.get("project_photos", "select=*&project_id=eq." + id);
      setLogs(l || []);
      setPhotos(ph || []);
    } catch(e) {}
  };

  useEffect(function() { load(); }, []);
  useEffect(function() { if (sel) loadDetail(sel.id); }, [sel]);

  var openCreate = function() { setForm(emptyForm); setModal({ mode: "create" }); };
  var openEdit = function(p, e) { if(e) e.stopPropagation(); setForm({ client: p.client || "", type: p.type || "", area: p.area || "", delivery: p.delivery || "", responsible: p.responsible || "", priority: p.priority || "Alta", status: p.status || "Cotizacion", phase: p.phase || "Diseno", budget: p.budget || "", notes: p.notes || "" }); setModal({ mode: "edit", id: p.id }); };

  var save = async function() {
    if (!form.client || !form.type) { alert("Cliente y tipo son obligatorios"); return; }
    try {
      var data = Object.assign({}, form, { budget: parseInt(form.budget) || 0, alert: false });
      if (modal.mode === "create") {
        var id = "DM-" + Date.now().toString().slice(-4);
        await db.insert("projects", Object.assign({}, data, { id: id, client_token: "tok-" + id.toLowerCase() }));
      } else {
        await db.update("projects", "id=eq." + modal.id, Object.assign({}, data, { updated_at: new Date().toISOString() }));
      }
      setModal(null);
      load();
    } catch(e) { alert("Error: " + e.message); }
  };

  var del = async function() {
    try {
      await db.remove("projects", "id=eq." + delConfirm.id);
      setDelConfirm(null);
      if (sel && sel.id === delConfirm.id) setSel(null);
      load();
    } catch(e) { alert("Error: " + e.message); }
  };

  if (sel) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Btn onClick={function() { setSel(null); }}>Volver</Btn>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{sel.client}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{sel.id} - {sel.type}</div>
        </div>
        {rp.editar && <Btn variant="primary" onClick={function() { setUpdateP(sel); }}>📷 Actualizar</Btn>}
        {rp.editar && <Btn onClick={function(e) { openEdit(sel, e); }}>Editar</Btn>}
      </div>

      <div style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 14, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 14, color: C.muted }}>Avance general</span>
          <span style={{ fontSize: 26, fontWeight: 700, color: C.accent }}>{sel.progress || 0}%</span>
        </div>
        <Bar pct={sel.progress || 0} h={14} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[["Cliente", sel.client], ["Codigo", sel.id], ["Tipo", sel.type || "-"], ["Area", sel.area || "-"], ["Entrega", sel.delivery || "-"], ["Responsable", sel.responsible || "-"], ["Fase", sel.phase || "-"], ["Presupuesto", "$" + (sel.budget || 0).toLocaleString() + " MXN"]].map(function(item) {
          return (
            <div key={item[0]} style={{ background: C.bg2, border: "1px solid " + C.border, borderRadius: 10, padding: "11px 14px" }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginBottom: 3 }}>{item[0]}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item[1]}</div>
            </div>
          );
        })}
      </div>

      {photos.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>Fotografias ({photos.length})</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
            {photos.map(function(ph, i) {
              return (
                <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid " + C.border }}>
                  <img src={ph.storage_url} alt={"foto " + i} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                  <div style={{ padding: "7px 10px", background: C.bg2 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{ph.area}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{ph.pct}% - {ph.user_name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>Historial ({logs.length})</div>
          {logs.map(function(l, i) {
            return (
              <div key={i} style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 10, padding: "11px 14px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>{l.user_name}</span>
                  <span style={{ fontSize: 11, color: C.muted }}>{new Date(l.created_at).toLocaleString("es-MX")}</span>
                </div>
                <div style={{ fontSize: 12, color: C.text }}>{l.prev_pct}% a {l.new_pct}% - {l.area}</div>
                {l.note && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>"{l.note}"</div>}
                {l.issue && <div style={{ fontSize: 11, color: C.orangeText, marginTop: 3 }}>⚠ {l.issue}</div>}
              </div>
            );
          })}
        </div>
      )}

      {updateP && <QuickUpdate project={updateP} currentUser={currentUser} onClose={function() { setUpdateP(null); }} onSaved={function() { load(); loadDetail(sel.id); }} />}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Proyectos</h2>
          <div style={{ fontSize: 12, color: C.muted }}>{projects.length} registros</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ display: "flex", border: "1px solid " + C.border, borderRadius: 8, overflow: "hidden" }}>
            <button onClick={function() { setView("list"); }} style={{ padding: "7px 14px", border: "none", background: view === "list" ? C.accent + "15" : "#fff", color: view === "list" ? C.accent : C.muted, cursor: "pointer", fontSize: 12, fontWeight: view === "list" ? 600 : 400 }}>Lista</button>
            <button onClick={function() { setView("kanban"); }} style={{ padding: "7px 14px", border: "none", background: view === "kanban" ? C.accent + "15" : "#fff", color: view === "kanban" ? C.accent : C.muted, cursor: "pointer", fontSize: 12, fontWeight: view === "kanban" ? 600 : 400 }}>Kanban</button>
          </div>
          {rp.editar && <Btn variant="primary" onClick={openCreate}>+ Nuevo proyecto</Btn>}
        </div>
      </div>

      {loading
        ? <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Cargando...</div>
        : view === "kanban"
          ? (
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 10 }}>
              {FLOW.map(function(col) {
                var sc = statusStyle(col);
                var colP = projects.filter(function(p) { return p.status === col; });
                return (
                  <div key={col} style={{ minWidth: 200, flex: "0 0 200px" }}>
                    <div style={{ padding: "8px 12px", background: sc.bg, border: "1px solid " + sc.border, borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: sc.text }}>{FLOW_LABELS[col] || col}</span>
                      <span style={{ fontSize: 11, color: sc.text }}>{colP.length}</span>
                    </div>
                    {colP.map(function(p) {
                      return (
                        <div key={p.id} onClick={function() { setSel(p); }} style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 10, padding: 12, marginBottom: 8, cursor: "pointer" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{p.client}</div>
                          <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>{p.id}</div>
                          <Bar pct={p.progress || 0} h={5} />
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>{p.progress || 0}%</div>
                        </div>
                      );
                    })}
                    {colP.length === 0 && <div style={{ border: "1.5px dashed " + C.border, borderRadius: 10, padding: "20px 12px", textAlign: "center", fontSize: 12, color: C.muted }}>Vacio</div>}
                  </div>
                );
              })}
            </div>
          )
          : projects.length === 0
            ? <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Sin proyectos. Crea el primero.</div>
            : projects.map(function(p) {
                var sc = statusStyle(p.status);
                return (
                  <div key={p.id} onClick={function() { setSel(p); }} style={{ background: C.bg, border: "1px solid " + (p.alert ? C.redBorder : C.border), borderRadius: 12, padding: "14px 18px", cursor: "pointer", display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ width: 4, background: prioColor(p.priority), borderRadius: 2, alignSelf: "stretch", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: C.text, fontSize: 14, marginBottom: 4 }}>{p.client}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{p.id} - {p.type}</div>
                      <Bar pct={p.progress || 0} color={p.alert ? C.red : C.accent} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <Badge label={FLOW_LABELS[p.status] || p.status} bg={sc.bg} text={sc.text} border={sc.border} />
                      <span style={{ fontSize: 11, color: C.muted }}>{p.progress || 0}%</span>
                      {rp.editar && (
                        <div style={{ display: "flex", gap: 5 }}>
                          <Btn size="sm" onClick={function(e) { openEdit(p, e); }}>✏</Btn>
                          {rp.eliminar && <Btn size="sm" variant="danger" onClick={function(e) { e.stopPropagation(); setDelConfirm(p); }}>🗑</Btn>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
      }

      {modal && (
        <Modal title={modal.mode === "create" ? "Nuevo proyecto" : "Editar proyecto"} onClose={function() { setModal(null); }} width={560}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Inp label="Cliente" required value={form.client} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { client: e.target.value }); }); }} placeholder="Nombre del cliente" />
              <Inp label="Tipo de proyecto" required value={form.type} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { type: e.target.value }); }); }} placeholder="Ej: Barandal residencial" />
              <Inp label="Ubicacion" value={form.area} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { area: e.target.value }); }); }} placeholder="Col. Las Palmas" />
              <Inp label="Fecha de entrega" value={form.delivery} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { delivery: e.target.value }); }); }} type="date" />
              <Inp label="Responsable" value={form.responsible} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { responsible: e.target.value }); }); }} />
              <Inp label="Presupuesto (MXN)" value={form.budget} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { budget: e.target.value }); }); }} type="number" />
              <Inp label="Prioridad" value={form.priority} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { priority: e.target.value }); }); }} opts={PRIORIDADES} />
              <Inp label="Estado" value={form.status} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { status: e.target.value }); }); }} opts={ESTADOS} />
            </div>
            <Inp label="Notas internas" value={form.notes} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { notes: e.target.value }); }); }} placeholder="Notas adicionales..." rows={2} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
              <Btn onClick={function() { setModal(null); }}>Cancelar</Btn>
              <Btn variant="primary" onClick={save}>{modal.mode === "create" ? "Crear proyecto" : "Guardar cambios"}</Btn>
            </div>
          </div>
        </Modal>
      )}
      {delConfirm && <ConfirmDel name={delConfirm.client} onConfirm={del} onCancel={function() { setDelConfirm(null); }} />}
    </div>
  );
}

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
function EmployeesModule({ currentUser }) {
  var [emps, setEmps] = useState([]);
  var [loading, setLoading] = useState(true);
  var [modal, setModal] = useState(null);
  var [delConfirm, setDelConfirm] = useState(null);
  var rp = PERMS[currentUser.role] || PERMS["Instalacion"];
  var emptyForm = { name: "", role: "", area: "Soldadura", phone: "", since: "", efficiency: 80, load: "normal", attend: "presente", entry_time: "", hours: 0, overtime: 0 };
  var [form, setForm] = useState(emptyForm);
  var AREAS_EMP = ["Diseno", "Corte", "Soldadura", "Pintura", "Instalacion", "Calidad", "Ensamblaje", "Tapiceria", "Administracion"];

  var load = async function() {
    setLoading(true);
    try { var e = await db.get("employees", "select=*"); setEmps(e || []); } catch(e) {}
    setLoading(false);
  };
  useEffect(function() { load(); }, []);

  var openCreate = function() { setForm(emptyForm); setModal({ mode: "create" }); };
  var openEdit = function(e, ev) {
    if(ev) ev.stopPropagation();
    setForm({ name: e.name || "", role: e.role || "", area: e.area || "Soldadura", phone: e.phone || "", since: e.since || "", efficiency: e.efficiency || 80, load: e.load || "normal", attend: e.attend || "presente", entry_time: e.entry_time || "", hours: e.hours || 0, overtime: e.overtime || 0 });
    setModal({ mode: "edit", id: e.id });
  };

  var save = async function() {
    if (!form.name || !form.role) { alert("Nombre y puesto son obligatorios"); return; }
    var av = form.name.split(" ").map(function(n) { return n[0]; }).join("").slice(0, 2).toUpperCase();
    try {
      if (modal.mode === "create") await db.insert("employees", Object.assign({}, form, { avatar: av, efficiency: +form.efficiency, hours: +form.hours, overtime: +form.overtime }));
      else await db.update("employees", "id=eq." + modal.id, Object.assign({}, form, { avatar: av, efficiency: +form.efficiency, hours: +form.hours, overtime: +form.overtime }));
      setModal(null); load();
    } catch(e) { alert("Error: " + e.message); }
  };

  var del = async function() {
    try { await db.remove("employees", "id=eq." + delConfirm.id); setDelConfirm(null); load(); } catch(e) { alert("Error: " + e.message); }
  };

  var lcol = function(l) { return { alta: C.orange, saturado: C.red, baja: C.blue, normal: C.green }[l] || C.muted; };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Empleados</h2>
          <div style={{ fontSize: 12, color: C.muted }}>{emps.length} en total</div>
        </div>
        {rp.editar && <Btn variant="primary" onClick={openCreate}>+ Nuevo empleado</Btn>}
      </div>

      {loading
        ? <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Cargando...</div>
        : emps.length === 0
          ? <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Sin empleados registrados.</div>
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
              {emps.map(function(e) {
                var lc = lcol(e.load);
                return (
                  <div key={e.id} style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <Av initials={e.avatar || (e.name || "?").slice(0, 2)} size={46} color={lc} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{e.name}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{e.role}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{e.area}</div>
                      </div>
                      <Badge label={e.load || "normal"} bg={lc + "15"} text={lc} border={lc + "30"} />
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: C.muted }}>Eficiencia</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: (e.efficiency || 80) >= 90 ? C.greenText : C.accent }}>{e.efficiency || 80}%</span>
                      </div>
                      <Bar pct={e.efficiency || 80} color={(e.efficiency || 80) >= 90 ? C.green : C.accent} h={7} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[["Horas", (e.hours || 0) + "h"], ["Extras", (e.overtime || 0) + "h"], ["Tel", e.phone || "-"], ["Desde", e.since || "-"]].map(function(item) {
                        return (
                          <div key={item[0]} style={{ background: C.bg2, borderRadius: 7, padding: "7px 10px" }}>
                            <div style={{ fontSize: 10, color: C.muted }}>{item[0]}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{item[1]}</div>
                          </div>
                        );
                      })}
                    </div>
                    {rp.editar && (
                      <div style={{ display: "flex", gap: 8, borderTop: "1px solid " + C.border, paddingTop: 10 }}>
                        <Btn size="sm" onClick={function(ev) { openEdit(e, ev); }} style={{ flex: 1, justifyContent: "center" }}>Editar</Btn>
                        {rp.eliminar && <Btn size="sm" variant="danger" onClick={function(ev) { ev.stopPropagation(); setDelConfirm(e); }} style={{ flex: 1, justifyContent: "center" }}>Eliminar</Btn>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
      }

      {modal && (
        <Modal title={modal.mode === "create" ? "Nuevo empleado" : "Editar empleado"} onClose={function() { setModal(null); }} width={540}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Inp label="Nombre completo" required value={form.name} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { name: e.target.value }); }); }} />
              <Inp label="Puesto" required value={form.role} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { role: e.target.value }); }); }} />
              <Inp label="Area" value={form.area} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { area: e.target.value }); }); }} opts={AREAS_EMP} />
              <Inp label="Telefono" value={form.phone} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { phone: e.target.value }); }); }} placeholder="9999-0000" />
              <Inp label="Fecha de ingreso" value={form.since} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { since: e.target.value }); }); }} type="date" />
              <Inp label="Eficiencia (%)" value={form.efficiency} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { efficiency: e.target.value }); }); }} type="number" />
              <Inp label="Horas este mes" value={form.hours} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { hours: e.target.value }); }); }} type="number" />
              <Inp label="Horas extras" value={form.overtime} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { overtime: e.target.value }); }); }} type="number" />
              <Inp label="Carga laboral" value={form.load} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { load: e.target.value }); }); }} opts={["normal", "baja", "alta", "saturado"]} />
              <Inp label="Asistencia hoy" value={form.attend} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { attend: e.target.value }); }); }} opts={["presente", "atrasado", "ausente", "instalacion", "vacaciones"]} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn onClick={function() { setModal(null); }}>Cancelar</Btn>
              <Btn variant="primary" onClick={save}>{modal.mode === "create" ? "Crear empleado" : "Guardar cambios"}</Btn>
            </div>
          </div>
        </Modal>
      )}
      {delConfirm && <ConfirmDel name={delConfirm.name} onConfirm={del} onCancel={function() { setDelConfirm(null); }} />}
    </div>
  );
}

// ─── MATERIALS ────────────────────────────────────────────────────────────────
function MaterialsModule({ currentUser }) {
  var [mats, setMats] = useState([]);
  var [loading, setLoading] = useState(true);
  var [modal, setModal] = useState(null);
  var [delConfirm, setDelConfirm] = useState(null);
  var [catFilter, setCatFilter] = useState("Todos");
  var rp = PERMS[currentUser.role] || PERMS["Instalacion"];
  var emptyForm = { name: "", category: "Tubos", unit: "ml", stock: 0, reserved: 0, min_stock: 0, cost: 0, status: "ok", supplier: "", alert_msg: "" };
  var [form, setForm] = useState(emptyForm);

  var load = async function() {
    setLoading(true);
    try { var m = await db.get("materials", "select=*"); setMats(m || []); } catch(e) {}
    setLoading(false);
  };
  useEffect(function() { load(); }, []);

  var openCreate = function() { setForm(emptyForm); setModal({ mode: "create" }); };
  var openEdit = function(m, e) {
    if(e) e.stopPropagation();
    setForm({ name: m.name || "", category: m.category || "Tubos", unit: m.unit || "ml", stock: m.stock || 0, reserved: m.reserved || 0, min_stock: m.min_stock || 0, cost: m.cost || 0, status: m.status || "ok", supplier: m.supplier || "", alert_msg: m.alert_msg || "" });
    setModal({ mode: "edit", id: m.id });
  };

  var save = async function() {
    if (!form.name) { alert("Nombre es obligatorio"); return; }
    try {
      var data = Object.assign({}, form, { stock: +form.stock, reserved: +form.reserved, min_stock: +form.min_stock, cost: +form.cost });
      if (modal.mode === "create") {
        await db.insert("materials", Object.assign({}, data, { id: "M-" + Date.now().toString().slice(-4) }));
      } else {
        await db.update("materials", "id=eq." + modal.id, Object.assign({}, data, { updated_at: new Date().toISOString() }));
      }
      setModal(null); load();
    } catch(e) { alert("Error: " + e.message); }
  };

  var del = async function() {
    try { await db.remove("materials", "id=eq." + delConfirm.id); setDelConfirm(null); load(); } catch(e) { alert("Error: " + e.message); }
  };

  var cats = ["Todos"].concat(MAT_CATS);
  var filtered = catFilter === "Todos" ? mats : mats.filter(function(m) { return m.category === catFilter; });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Materiales</h2>
          <div style={{ fontSize: 12, color: C.muted }}>{mats.length} registros - {mats.filter(function(m) { return m.status !== "ok"; }).length} requieren atencion</div>
        </div>
        {rp.editar && <Btn variant="primary" onClick={openCreate}>+ Agregar material</Btn>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10 }}>
        <Metric label="Total" value={mats.length} icon="📦" />
        <Metric label="Disponibles" value={mats.filter(function(m) { return m.status === "ok"; }).length} color={C.greenText} icon="✅" />
        <Metric label="Criticos" value={mats.filter(function(m) { return m.status === "agotado" || m.status === "critico"; }).length} color={C.redText} icon="⚠️" />
        <Metric label="Stock bajo" value={mats.filter(function(m) { return m.status === "bajo"; }).length} color={C.yellowText} icon="📉" />
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {cats.map(function(c) {
          var count = c === "Todos" ? mats.length : mats.filter(function(m) { return m.category === c; }).length;
          return (
            <button key={c} onClick={function() { setCatFilter(c); }} style={{ padding: "6px 14px", borderRadius: 20, border: "1.5px solid " + (catFilter === c ? C.accent : C.border), background: catFilter === c ? C.accent + "15" : "#fff", color: catFilter === c ? C.accent : C.muted, cursor: "pointer", fontSize: 12, fontWeight: catFilter === c ? 600 : 400 }}>
              {c} ({count})
            </button>
          );
        })}
      </div>

      {loading
        ? <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Cargando...</div>
        : filtered.length === 0
          ? <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Sin materiales en esta categoria.</div>
          : filtered.map(function(m) {
              var ms = matStyle(m.status);
              var pct = Math.round((m.stock / Math.max(+m.stock + (+m.reserved || 0), 1)) * 100);
              return (
                <div key={m.id} style={{ background: C.bg, border: "1px solid " + (m.status !== "ok" ? ms.border : C.border), borderRadius: 12, padding: "14px 18px" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{m.name}</span>
                        <Badge label={ms.label} bg={ms.bg} text={ms.text} border={ms.border} />
                        <Badge label={m.category} bg={C.bg2} text={C.muted} border={C.border} />
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
                        {m.stock} {m.unit} disponibles - {m.reserved || 0} reservados - Min: {m.min_stock || 0} - Proveedor: {m.supplier || "-"}
                      </div>
                      <Bar pct={pct} color={m.status === "agotado" ? C.red : m.status === "bajo" ? C.yellow : C.green} h={6} />
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>${(+m.cost).toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>/{m.unit}</div>
                      {rp.editar && (
                        <div style={{ display: "flex", gap: 5, marginTop: 8, justifyContent: "flex-end" }}>
                          <Btn size="sm" onClick={function(e) { openEdit(m, e); }}>✏</Btn>
                          {rp.eliminar && <Btn size="sm" variant="danger" onClick={function(e) { e.stopPropagation(); setDelConfirm(m); }}>🗑</Btn>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
      }

      {modal && (
        <Modal title={modal.mode === "create" ? "Nuevo material" : "Editar material"} onClose={function() { setModal(null); }} width={520}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Inp label="Nombre del material" required value={form.name} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { name: e.target.value }); }); }} placeholder='Ej: Tubo cuadrado 1 1/2"' />
              <Inp label="Categoria" value={form.category} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { category: e.target.value }); }); }} opts={MAT_CATS} />
              <Inp label="Unidad" value={form.unit} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { unit: e.target.value }); }); }} opts={["ml", "m2", "kg", "lt", "pz", "rollo", "caja", "galon"]} />
              <Inp label="Costo por unidad (MXN)" value={form.cost} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { cost: e.target.value }); }); }} type="number" />
              <Inp label="Stock disponible" value={form.stock} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { stock: e.target.value }); }); }} type="number" />
              <Inp label="Reservado" value={form.reserved} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { reserved: e.target.value }); }); }} type="number" />
              <Inp label="Stock minimo" value={form.min_stock} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { min_stock: e.target.value }); }); }} type="number" />
              <Inp label="Estado" value={form.status} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { status: e.target.value }); }); }} opts={["ok", "bajo", "critico", "agotado", "pendiente"]} />
              <Inp label="Proveedor" value={form.supplier} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { supplier: e.target.value }); }); }} placeholder="Nombre del proveedor" />
            </div>
            <Inp label="Alerta especial (opcional)" value={form.alert_msg} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { alert_msg: e.target.value }); }); }} placeholder="Ej: Material critico para proyecto X" />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn onClick={function() { setModal(null); }}>Cancelar</Btn>
              <Btn variant="primary" onClick={save}>{modal.mode === "create" ? "Agregar material" : "Guardar cambios"}</Btn>
            </div>
          </div>
        </Modal>
      )}
      {delConfirm && <ConfirmDel name={delConfirm.name} onConfirm={del} onCancel={function() { setDelConfirm(null); }} />}
    </div>
  );
}

// ─── SUPPLIERS ────────────────────────────────────────────────────────────────
function SuppliersModule({ currentUser }) {
  var [suppliers, setSuppliers] = useState([]);
  var [loading, setLoading] = useState(true);
  var [modal, setModal] = useState(null);
  var [delConfirm, setDelConfirm] = useState(null);
  var [sel, setSel] = useState(null);
  var rp = PERMS[currentUser.role] || PERMS["Instalacion"];
  var emptyForm = { name: "", contact: "", phone: "", email: "", location: "", category: "Ferreteria", notes: "" };
  var [form, setForm] = useState(emptyForm);

  var load = async function() {
    setLoading(true);
    try { var s = await db.get("suppliers", "select=*"); setSuppliers(s || []); } catch(e) { setSuppliers([]); }
    setLoading(false);
  };
  useEffect(function() { load(); }, []);

  var openCreate = function() { setForm(emptyForm); setModal({ mode: "create" }); };
  var openEdit = function(s, e) {
    if(e) e.stopPropagation();
    setForm({ name: s.name || "", contact: s.contact || "", phone: s.phone || "", email: s.email || "", location: s.location || "", category: s.category || "Ferreteria", notes: s.notes || "" });
    setModal({ mode: "edit", id: s.id });
  };

  var save = async function() {
    if (!form.name) { alert("Nombre es obligatorio"); return; }
    try {
      if (modal.mode === "create") await db.insert("suppliers", Object.assign({}, form, { id: "SUP-" + Date.now().toString().slice(-4) }));
      else await db.update("suppliers", "id=eq." + modal.id, Object.assign({}, form, { updated_at: new Date().toISOString() }));
      setModal(null); load();
    } catch(e) { alert("Error: " + e.message); }
  };

  var del = async function() {
    try { await db.remove("suppliers", "id=eq." + delConfirm.id); setDelConfirm(null); if(sel && sel.id === delConfirm.id) setSel(null); load(); } catch(e) { alert("Error: " + e.message); }
  };

  if (sel) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Btn onClick={function() { setSel(null); }}>Volver</Btn>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{sel.name}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{sel.category} - {sel.location}</div>
        </div>
        {rp.editar && <Btn onClick={function(e) { openEdit(sel, e); }}>Editar</Btn>}
        {rp.eliminar && <Btn variant="danger" onClick={function() { setDelConfirm(sel); }}>Eliminar</Btn>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[["Nombre", sel.name], ["Categoria", sel.category], ["Contacto", sel.contact || "-"], ["Telefono", sel.phone || "-"], ["Correo", sel.email || "-"], ["Ubicacion", sel.location || "-"]].map(function(item) {
          return (
            <div key={item[0]} style={{ background: C.bg2, border: "1px solid " + C.border, borderRadius: 10, padding: "11px 14px" }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginBottom: 3 }}>{item[0]}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item[1]}</div>
            </div>
          );
        })}
      </div>
      {sel.notes && (
        <div style={{ background: C.bg2, border: "1px solid " + C.border, borderRadius: 10, padding: "13px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Notas</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{sel.notes}</div>
        </div>
      )}
      {delConfirm && <ConfirmDel name={delConfirm.name} onConfirm={del} onCancel={function() { setDelConfirm(null); }} />}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Proveedores</h2>
          <div style={{ fontSize: 12, color: C.muted }}>{suppliers.length} registrados</div>
        </div>
        {rp.editar && <Btn variant="primary" onClick={openCreate}>+ Nuevo proveedor</Btn>}
      </div>

      {loading
        ? <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Cargando...</div>
        : suppliers.length === 0
          ? <div style={{ padding: 40, textAlign: "center", color: C.muted, border: "2px dashed " + C.border, borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🏪</div>
              <div>Sin proveedores registrados.</div>
              {rp.editar && <div style={{ marginTop: 12 }}><Btn variant="primary" onClick={openCreate}>Agregar primer proveedor</Btn></div>}
            </div>
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
              {suppliers.map(function(s) {
                return (
                  <div key={s.id} onClick={function() { setSel(s); }} style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 14, padding: 18, cursor: "pointer", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.location || "Sin ubicacion"}</div>
                      </div>
                      <Badge label={s.category || "Otro"} bg={C.blueBg} text={C.blueText} border={C.blueBorder} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {s.contact && <div style={{ fontSize: 12, color: C.muted }}>👤 {s.contact}</div>}
                      {s.phone && <div style={{ fontSize: 12, color: C.muted }}>📞 {s.phone}</div>}
                      {s.email && <div style={{ fontSize: 12, color: C.muted }}>✉ {s.email}</div>}
                    </div>
                    {rp.editar && (
                      <div style={{ display: "flex", gap: 8, borderTop: "1px solid " + C.border, paddingTop: 10 }}>
                        <Btn size="sm" onClick={function(e) { openEdit(s, e); }} style={{ flex: 1, justifyContent: "center" }}>Editar</Btn>
                        {rp.eliminar && <Btn size="sm" variant="danger" onClick={function(e) { e.stopPropagation(); setDelConfirm(s); }} style={{ flex: 1, justifyContent: "center" }}>Eliminar</Btn>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
      }

      {modal && (
        <Modal title={modal.mode === "create" ? "Nuevo proveedor" : "Editar proveedor"} onClose={function() { setModal(null); }} width={500}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Inp label="Nombre del proveedor" required value={form.name} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { name: e.target.value }); }); }} placeholder="Ej: FerreMax SPS" />
              <Inp label="Categoria" value={form.category} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { category: e.target.value }); }); }} opts={["Ferreteria", "Pintureria", "Vidriera", "Madereria", "Otro"]} />
              <Inp label="Nombre del contacto" value={form.contact} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { contact: e.target.value }); }); }} placeholder="Juan Garcia" />
              <Inp label="Telefono" value={form.phone} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { phone: e.target.value }); }); }} placeholder="9999-0000" />
              <Inp label="Correo electronico" value={form.email} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { email: e.target.value }); }); }} type="email" />
              <Inp label="Ubicacion" value={form.location} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { location: e.target.value }); }); }} placeholder="Col. Centro, SPS" />
            </div>
            <Inp label="Notas adicionales" value={form.notes} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { notes: e.target.value }); }); }} rows={2} placeholder="Horarios, condiciones, descuentos..." />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn onClick={function() { setModal(null); }}>Cancelar</Btn>
              <Btn variant="primary" onClick={save}>{modal.mode === "create" ? "Agregar proveedor" : "Guardar cambios"}</Btn>
            </div>
          </div>
        </Modal>
      )}
      {delConfirm && <ConfirmDel name={delConfirm.name} onConfirm={del} onCancel={function() { setDelConfirm(null); }} />}
    </div>
  );
}

// ─── CLIENTS ─────────────────────────────────────────────────────────────────
function ClientsModule({ currentUser }) {
  var [clients, setClients] = useState([]);
  var [loading, setLoading] = useState(true);
  var [modal, setModal] = useState(null);
  var [delConfirm, setDelConfirm] = useState(null);
  var rp = PERMS[currentUser.role] || PERMS["Instalacion"];
  var emptyForm = { name: "", phone: "", email: "", address: "", type: "Particular", notes: "" };
  var [form, setForm] = useState(emptyForm);

  var load = async function() {
    setLoading(true);
    try { var c = await db.get("clients", "select=*"); setClients(c || []); } catch(e) { setClients([]); }
    setLoading(false);
  };
  useEffect(function() { load(); }, []);

  var openCreate = function() { setForm(emptyForm); setModal({ mode: "create" }); };
  var openEdit = function(c, e) {
    if(e) e.stopPropagation();
    setForm({ name: c.name || "", phone: c.phone || "", email: c.email || "", address: c.address || "", type: c.type || "Particular", notes: c.notes || "" });
    setModal({ mode: "edit", id: c.id });
  };

  var save = async function() {
    if (!form.name) { alert("Nombre es obligatorio"); return; }
    try {
      if (modal.mode === "create") await db.insert("clients", Object.assign({}, form, { id: "CLI-" + Date.now().toString().slice(-4) }));
      else await db.update("clients", "id=eq." + modal.id, Object.assign({}, form, { updated_at: new Date().toISOString() }));
      setModal(null); load();
    } catch(e) { alert("Error: " + e.message); }
  };

  var del = async function() {
    try { await db.remove("clients", "id=eq." + delConfirm.id); setDelConfirm(null); load(); } catch(e) { alert("Error: " + e.message); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Clientes</h2>
          <div style={{ fontSize: 12, color: C.muted }}>{clients.length} registrados</div>
        </div>
        {rp.editar && <Btn variant="primary" onClick={openCreate}>+ Nuevo cliente</Btn>}
      </div>

      {loading
        ? <div style={{ padding: 40, textAlign: "center", color: C.muted }}>Cargando...</div>
        : clients.length === 0
          ? <div style={{ padding: 40, textAlign: "center", color: C.muted, border: "2px dashed " + C.border, borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
              <div>Sin clientes registrados.</div>
              {rp.editar && <div style={{ marginTop: 12 }}><Btn variant="primary" onClick={openCreate}>Agregar primer cliente</Btn></div>}
            </div>
          : <div style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 12, overflow: "hidden" }}>
              {clients.map(function(c, i) {
                return (
                  <div key={c.id} style={{ padding: "14px 18px", borderBottom: i < clients.length - 1 ? "1px solid " + C.border : "none", display: "flex", gap: 14, alignItems: "center" }}>
                    <Av initials={(c.name || "?").slice(0, 2)} size={40} color={C.accent} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                        {c.phone ? "📞 " + c.phone : ""}{c.phone && c.email ? " - " : ""}{c.email ? "✉ " + c.email : ""}
                      </div>
                      {c.address && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>📍 {c.address}</div>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <Badge label={c.type || "Particular"} bg={C.blueBg} text={C.blueText} border={C.blueBorder} />
                      {rp.editar && (
                        <div style={{ display: "flex", gap: 5 }}>
                          <Btn size="sm" onClick={function(e) { openEdit(c, e); }}>✏</Btn>
                          {rp.eliminar && <Btn size="sm" variant="danger" onClick={function(e) { e.stopPropagation(); setDelConfirm(c); }}>🗑</Btn>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
      }

      {modal && (
        <Modal title={modal.mode === "create" ? "Nuevo cliente" : "Editar cliente"} onClose={function() { setModal(null); }} width={480}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Inp label="Nombre completo" required value={form.name} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { name: e.target.value }); }); }} placeholder="Nombre del cliente" />
              <Inp label="Tipo" value={form.type} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { type: e.target.value }); }); }} opts={["Particular", "Empresa", "Arquitecto", "Constructor", "Gobierno"]} />
              <Inp label="Telefono" value={form.phone} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { phone: e.target.value }); }); }} placeholder="9999-0000" />
              <Inp label="Correo electronico" value={form.email} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { email: e.target.value }); }); }} type="email" />
              <div style={{ gridColumn: "1/-1" }}>
                <Inp label="Direccion" value={form.address} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { address: e.target.value }); }); }} placeholder="Col. Centro, San Pedro Sula" />
              </div>
            </div>
            <Inp label="Notas" value={form.notes} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { notes: e.target.value }); }); }} rows={2} placeholder="Notas adicionales..." />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn onClick={function() { setModal(null); }}>Cancelar</Btn>
              <Btn variant="primary" onClick={save}>{modal.mode === "create" ? "Agregar cliente" : "Guardar cambios"}</Btn>
            </div>
          </div>
        </Modal>
      )}
      {delConfirm && <ConfirmDel name={delConfirm.name} onConfirm={del} onCancel={function() { setDelConfirm(null); }} />}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ currentUser, onNav }) {
  var [projects, setProjects] = useState([]);
  var [employees, setEmployees] = useState([]);
  var [materials, setMaterials] = useState([]);
  var [audit, setAudit] = useState([]);
  var [loading, setLoading] = useState(true);

  var load = async function() {
    setLoading(true);
    try {
      var p = await db.get("projects", "select=*");
      var e = await db.get("employees", "select=*");
      var m = await db.get("materials", "select=*");
      var a = await db.get("audit_log", "select=*&limit=8");
      setProjects(p || []); setEmployees(e || []); setMaterials(m || []); setAudit(a || []);
    } catch(e) {}
    setLoading(false);
  };
  useEffect(function() { load(); }, []);

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: C.muted }}>Cargando dashboard...</div>;

  var avgProgress = projects.length ? Math.round(projects.reduce(function(a, p) { return a + (p.progress || 0); }, 0) / projects.length) : 0;
  var critical = materials.filter(function(m) { return m.status === "agotado" || m.status === "critico"; });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.text }}>Bienvenido, {currentUser.name.split(" ")[0]} 👋</h2>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
        </div>
        <button onClick={load} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid " + C.border, background: C.bg, color: C.muted, cursor: "pointer", fontSize: 13 }}>Actualizar</button>
      </div>

      {projects.filter(function(p) { return p.alert; }).map(function(p) {
        return (
          <div key={p.id} onClick={function() { onNav("projects"); }} style={{ background: C.redBg, border: "1px solid " + C.redBorder, borderRadius: 10, padding: "11px 16px", cursor: "pointer", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontSize: 13, color: C.redText }}><b>{p.id}</b> - {p.client} - entrega {p.delivery}</span>
          </div>
        );
      })}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12 }}>
        <Metric label="Proyectos" value={projects.length} icon="📁" />
        <Metric label="Avance promedio" value={avgProgress + "%"} color={C.accent} icon="📊" />
        <Metric label="Empleados" value={employees.length} color={C.greenText} icon="👷" />
        <Metric label="Mat. criticos" value={critical.length} color={critical.length > 0 ? C.redText : C.greenText} icon="📦" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <div style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid " + C.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Proyectos recientes</span>
            <button onClick={function() { onNav("projects"); }} style={{ fontSize: 12, color: C.accent, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Ver todos</button>
          </div>
          {projects.slice(0, 5).map(function(p) {
            var sc = statusStyle(p.status);
            return (
              <div key={p.id} style={{ padding: "12px 18px", borderBottom: "1px solid " + C.border, display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 4, background: prioColor(p.priority), borderRadius: 2, alignSelf: "stretch", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{p.client}</div>
                  <Bar pct={p.progress || 0} color={p.alert ? C.red : C.accent} h={5} />
                </div>
                <Badge label={FLOW_LABELS[p.status] || p.status} bg={sc.bg} text={sc.text} border={sc.border} />
              </div>
            );
          })}
          {projects.length === 0 && <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>Sin proyectos aun.</div>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: C.bg, border: "1px solid " + C.border, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid " + C.border, fontSize: 14, fontWeight: 700, color: C.text }}>Actividad reciente</div>
            {audit.length === 0
              ? <div style={{ padding: "14px 16px", fontSize: 12, color: C.muted }}>Sin actividad registrada.</div>
              : audit.slice(0, 5).map(function(l) {
                  return (
                    <div key={l.id} style={{ padding: "9px 16px", borderBottom: "1px solid " + C.border, display: "flex", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>📋</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><b>{l.user_name}</b> {l.action}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{new Date(l.created_at).toLocaleString("es-MX")}</div>
                      </div>
                    </div>
                  );
                })
            }
          </div>

          {critical.length > 0 && (
            <div style={{ background: C.redBg, border: "1px solid " + C.redBorder, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid " + C.redBorder, fontSize: 14, fontWeight: 700, color: C.redText }}>⚠ Materiales criticos</div>
              {critical.map(function(m) {
                var ms = matStyle(m.status);
                return (
                  <div key={m.id} style={{ padding: "9px 16px", borderBottom: "1px solid " + C.redBorder }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: ms.text }}>{ms.label} - {m.stock} {m.unit}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AI ASSISTANT ─────────────────────────────────────────────────────────────
function AIAssistant({ currentUser }) {
  var [messages, setMessages] = useState([{ role: "assistant", content: "Hola " + currentUser.name.split(" ")[0] + ". Soy el asistente operativo de De Metal. En que te puedo ayudar hoy?" }]);
  var [input, setInput] = useState("");
  var [loading, setLoading] = useState(false);
  var SUGGESTIONS = ["Que proyecto tiene mayor riesgo esta semana?", "Que debo priorizar hoy?", "Genera un resumen ejecutivo", "Como mejorar la eficiencia del equipo?"];
  var CTX = "Eres el asistente operativo de De Metal, fabrica premium de barandales, portones y estructuras metalicas en San Pedro Sula, Honduras. Usuario activo: " + currentUser.name + " (" + currentUser.role + "). Responde en espanol, se directo y practico. Maximo 180 palabras.";

  var send = async function(text) {
    var q = text || input.trim();
    if (!q || loading) return;
    setInput("");
    var msgs = messages.concat([{ role: "user", content: q }]);
    setMessages(msgs);
    setLoading(true);
    try {
      var res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 600, system: CTX, messages: msgs.map(function(m) { return { role: m.role, content: m.content }; }) }) });
      var data = await res.json();
      setMessages(function(prev) { return prev.concat([{ role: "assistant", content: (data.content && data.content[0] && data.content[0].text) || "Error." }]); });
    } catch(e) {
      setMessages(function(prev) { return prev.concat([{ role: "assistant", content: "Error de conexion." }]); });
    }
    setLoading(false);
  };

  var fmt = function(t) {
    return t.split("\n").map(function(l, i) {
      return <div key={i} style={{ marginBottom: l ? 2 : 5, color: C.text }} dangerouslySetInnerHTML={{ __html: l.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") || "&nbsp;" }} />;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "calc(100vh - 100px)", maxHeight: 680 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Asistente IA</h2>
        <div style={{ fontSize: 12, color: C.muted }}>Analisis inteligente de operaciones</div>
      </div>
      <div style={{ flex: 1, background: C.bg, border: "1px solid " + C.border, borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map(function(m, i) {
            return (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                {m.role === "assistant"
                  ? <div style={{ width: 32, height: 32, borderRadius: 10, background: C.accent + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🤖</div>
                  : <Av initials={currentUser.avatar} size={32} color={currentUser.color} />
                }
                <div style={{ maxWidth: "78%", background: m.role === "user" ? C.accent + "15" : C.bg2, border: "1px solid " + (m.role === "user" ? C.accent + "30" : C.border), borderRadius: m.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px", padding: "10px 14px", fontSize: 13, lineHeight: 1.6 }}>
                  {fmt(m.content)}
                </div>
              </div>
            );
          })}
          {loading && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: C.accent + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
              <div style={{ background: C.bg2, border: "1px solid " + C.border, borderRadius: "4px 14px 14px 14px", padding: "12px 16px", display: "flex", gap: 5 }}>
                {[0, 1, 2].map(function(i) { return <div key={i} style={{ width: 7, height: 7, borderRadius: 4, background: C.accent, animation: "pulse 1.2s " + (i * 0.2) + "s infinite" }} />; })}
              </div>
            </div>
          )}
        </div>
        {messages.length <= 1 && (
          <div style={{ padding: "0 16px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SUGGESTIONS.map(function(s, i) {
              return <button key={i} onClick={function() { send(s); }} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 20, border: "1px solid " + C.border, background: C.bg2, color: C.muted, cursor: "pointer" }}>{s}</button>;
            })}
          </div>
        )}
        <div style={{ padding: "12px 16px", borderTop: "1px solid " + C.border, display: "flex", gap: 8 }}>
          <input value={input} onChange={function(e) { setInput(e.target.value); }} onKeyDown={function(e) { if(e.key === "Enter") send(); }} placeholder="Escribe tu pregunta..." style={{ flex: 1, borderRadius: 10, border: "1.5px solid " + C.border2, background: "#fff", color: C.text, padding: "10px 14px", fontSize: 13, outline: "none" }} />
          <Btn variant="primary" onClick={function() { send(); }} disabled={!input.trim() || loading} style={{ padding: "10px 18px" }}>{loading ? "..." : "Enviar"}</Btn>
        </div>
      </div>
      <style>{".pulse{animation:pulse 1.2s infinite}@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}"}</style>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  var [currentUser, setCurrentUser] = useState(null);
  var [nav, setNav] = useState("dashboard");
  var [sidebar, setSidebar] = useState(true);
  var [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(function() {
    var on = function() { setIsOnline(true); };
    var off = function() { setIsOnline(false); };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return function() { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(function() {
    try {
      var s = localStorage.getItem("dm_session");
      if (s) {
        var u = JSON.parse(s);
        var f = USERS.find(function(x) { return x.id === u.id; });
        if (f) setCurrentUser(f);
      }
    } catch(e) {}
  }, []);

  var handleLogin = function(u) {
    setCurrentUser(u);
    try { localStorage.setItem("dm_session", JSON.stringify({ id: u.id })); } catch(e) {}
  };

  var handleLogout = function() {
    setCurrentUser(null);
    try { localStorage.removeItem("dm_session"); } catch(e) {}
  };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  var rp = PERMS[currentUser.role] || PERMS["Instalacion"];

  var navItems = [
    { id: "dashboard", emoji: "▦", label: "Dashboard" },
    { id: "projects", emoji: "📁", label: "Proyectos" },
    { id: "employees", emoji: "👷", label: "Empleados" },
    { id: "materials", emoji: "📦", label: "Materiales" },
    { id: "suppliers", emoji: "🏪", label: "Proveedores" },
    { id: "clients", emoji: "👥", label: "Clientes" },
    { id: "ai", emoji: "🤖", label: "Asistente IA" }
  ];

  var renderContent = function() {
    if (nav === "dashboard") return <Dashboard currentUser={currentUser} onNav={setNav} />;
    if (nav === "projects") return <ProjectsModule currentUser={currentUser} />;
    if (nav === "employees") return <EmployeesModule currentUser={currentUser} />;
    if (nav === "materials") return <MaterialsModule currentUser={currentUser} />;
    if (nav === "suppliers") return <SuppliersModule currentUser={currentUser} />;
    if (nav === "clients") return <ClientsModule currentUser={currentUser} />;
    if (nav === "ai") return <AIAssistant currentUser={currentUser} />;
    return null;
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", background: "#f3f4f6", fontSize: 14, color: C.text }}>
      <div style={{ width: sidebar ? 220 : 60, background: "#fff", borderRight: "1px solid " + C.border, display: "flex", flexDirection: "column", flexShrink: 0, transition: "width .2s", overflow: "hidden" }}>
        <div style={{ padding: "16px 14px", borderBottom: "1px solid " + C.border, display: "flex", alignItems: "center", justifyContent: sidebar ? "flex-start" : "center", minHeight: 70 }}>
          {sidebar
            ? <div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1 }}>De Metal</div>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 4 }}>Lideres en hierro forjado</div>
              </div>
            : <div style={{ width: 32, height: 32, borderRadius: 10, background: C.accent + "20", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia,serif", fontSize: 16, fontWeight: 700, color: C.accent }}>D</div>
          }
        </div>

        <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map(function(item) {
            return (
              <button key={item.id} onClick={function() { setNav(item.id); }} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 10px", borderRadius: 10, border: "none", cursor: "pointer", background: nav === item.id ? C.accent + "15" : "transparent", color: nav === item.id ? C.accent : C.muted, fontWeight: nav === item.id ? 700 : 400, fontSize: 13, textAlign: "left", width: "100%", whiteSpace: "nowrap" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.emoji}</span>
                {sidebar && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "10px 10px 8px", borderTop: "1px solid " + C.border }}>
          {sidebar
            ? <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
                <Av initials={currentUser.avatar} size={32} color={currentUser.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name.split(" ")[0]}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{currentUser.role}</div>
                </div>
                <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16, padding: 4, borderRadius: 6 }}>⏻</button>
              </div>
            : <button onClick={handleLogout} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 18, padding: "6px 0", borderRadius: 8 }}>⏻</button>
          }
        </div>
        <button onClick={function() { setSidebar(!sidebar); }} style={{ margin: "2px 8px 10px", padding: "7px", border: "1px solid " + C.border, borderRadius: 8, cursor: "pointer", background: "transparent", color: C.muted, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {sidebar ? "Colapsar" : ">"}
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ background: "#fff", borderBottom: "1px solid " + C.border, padding: "12px 24px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 15, fontWeight: 700, color: C.text }}>De Metal</div>
          <div style={{ width: 1, height: 18, background: C.border }} />
          <div style={{ fontSize: 14, color: C.muted, fontWeight: 500 }}>{(navItems.find(function(n) { return n.id === nav; }) || {}).label}</div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <div style={{ width: 7, height: 7, borderRadius: 4, background: isOnline ? C.green : C.red }} />
            <span style={{ fontSize: 11, color: C.muted }}>{isOnline ? "Conectado" : "Sin conexion"}</span>
          </div>
          <div style={{ display: "flex", border: "1px solid " + C.border, borderRadius: 8, overflow: "hidden" }}>
            <button onClick={function() { MONEDA.simbolo = "L"; MONEDA.nombre = "Lempiras"; window.dispatchEvent(new Event("moneda")); }} style={{ padding: "4px 10px", border: "none", background: MONEDA.simbolo === "L" ? C.accent + "15" : "#fff", color: MONEDA.simbolo === "L" ? C.accent : C.muted, cursor: "pointer", fontSize: 11, fontWeight: MONEDA.simbolo === "L" ? 700 : 400 }}>L</button>
            <button onClick={function() { MONEDA.simbolo = "$"; MONEDA.nombre = "Dolares"; window.dispatchEvent(new Event("moneda")); }} style={{ padding: "4px 10px", border: "none", background: MONEDA.simbolo === "$" ? C.accent + "15" : "#fff", color: MONEDA.simbolo === "$" ? C.accent : C.muted, cursor: "pointer", fontSize: 11, fontWeight: MONEDA.simbolo === "$" ? 700 : 400 }}>$</button>
          </div>
          <Badge label={currentUser.role} bg={rp.bg} text={rp.color} border={rp.border} />
        </div>

        <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
