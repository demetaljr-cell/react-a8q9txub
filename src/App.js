
import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://bhirrdalujsevlwxoiji.supabase.co";
const SUPABASE_KEY = "sb_publishable_ian5YhEbz5fd4b0MQQuIBA_g9c46fqb";

const sb = async (path, opts = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer || "return=representation",
      ...opts.headers,
    },
    ...opts,
  });
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

const db = {
  get: (t, q = "") => sb(`${t}?${q}&order=created_at.desc`),
  insert: (t, d) => sb(t, { method: "POST", body: JSON.stringify(d) }),
  update: (t, m, d) => sb(`${t}?${m}`, { method: "PATCH", body: JSON.stringify(d) }),
  del: (t, m) => sb(`${t}?${m}`, { method: "DELETE", prefer: "return=minimal" }),
};

// ─── COLOR TOKENS ────────────────────────────────────────────────────────────
const C = {
  accent: "#B87333",
  red: "#dc2626", redBg: "#fef2f2", redBorder: "#fca5a5", redText: "#991b1b",
  green: "#16a34a", greenBg: "#f0fdf4", greenBorder: "#86efac",
  blue: "#2563eb", blueBg: "#eff6ff", blueBorder: "#93c5fd",
  orange: "#ea580c", orangeBg: "#fff7ed", orangeBorder: "#fdba74",
  purple: "#7c3aed", purpleBg: "#f5f3ff", purpleBorder: "#c4b5fd",
  yellow: "#ca8a04", yellowBg: "#fefce8", yellowBorder: "#fde047",
  teal: "#0d9488", tealBg: "#f0fdfa", tealBorder: "#5eead4",
  border: "#e5e7eb", border2: "#d1d5db",
  bg: "#ffffff", bg2: "#f9fafb", bg3: "#f3f4f6",
  text: "#111827", muted: "#6b7280",
  inputBg: "#ffffff", inputBorder: "#d1d5db", inputText: "#111827",
};

const FLOW = ["Cotización","Diseño","En producción","Instalación","Entregado"];
const FLOW_APPROVERS = { Diseño:"Supervisor","En producción":"Supervisor",Instalación:"Administrador",Entregado:"Administrador" };
const AREAS = ["Diseño","Corte","Soldadura","Pintura","Instalación","Calidad","Ensamblaje","Tapicería","Carpintería"];
const MAT_CATS = ["Tubos","Platinas","Láminas","Pintura","Accesorios","Tornillería","Herramientas","Otros"];

const SYSTEM_USERS = [
  { id:"U01",name:"Roberto Aguilar",role:"Administrador",avatar:"RA",color:C.purple,user:"admin",pass:"demetal2024" },
  { id:"U02",name:"Carlos Martínez",role:"Supervisor",avatar:"CM",color:C.accent,user:"carlos",pass:"supervisor123" },
  { id:"U03",name:"Ana Pérez",role:"Producción",avatar:"AP",color:C.green,user:"ana",pass:"prod2024" },
  { id:"U04",name:"Luis Rodríguez",role:"Instalación",avatar:"LR",color:C.orange,user:"luis",pass:"install24" },
];

const ROLE_PERMS = {
  Administrador:{ ver:true,editar:true,eliminar:true,aprobar:true,exportar:true,color:C.purple,bg:C.purpleBg,border:C.purpleBorder },
  Supervisor:   { ver:true,editar:true,eliminar:false,aprobar:true,exportar:true,color:C.accent,bg:"#fff7ed",border:"#fdba74" },
  Producción:   { ver:true,editar:true,eliminar:false,aprobar:false,exportar:false,color:C.green,bg:C.greenBg,border:C.greenBorder },
  Instalación:  { ver:true,editar:true,eliminar:false,aprobar:false,exportar:false,color:C.orange,bg:C.orangeBg,border:C.orangeBorder },
};

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────
const Bar = ({ pct, color = C.accent, h = 6 }) => (
  <div style={{ background:C.border,borderRadius:99,height:h,overflow:"hidden" }}>
    <div style={{ width:`${Math.min(pct||0,100)}%`,background:color,height:"100%",borderRadius:99,transition:"width .4s" }} />
  </div>
);

const Badge = ({ label, bg=C.bg2,text=C.muted,border=C.border }) => (
  <span style={{ fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:500,background:bg,color:text,border:`1px solid ${border}`,whiteSpace:"nowrap" }}>{label}</span>
);

const Metric = ({ label,value,sub,color }) => (
  <div style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px" }}>
    <div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:22,fontWeight:600,color:color||C.text,lineHeight:1 }}>{value}</div>
    {sub&&<div style={{ fontSize:11,color:C.muted,marginTop:3 }}>{sub}</div>}
  </div>
);

const Avatar = ({ initials,size=34,color=C.accent }) => (
  <div style={{ width:size,height:size,borderRadius:size/2,background:`${color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.33,fontWeight:600,color,flexShrink:0 }}>{initials}</div>
);

// Input con fondo blanco garantizado
const Inp = ({ value,onChange,placeholder="",type="text",style={},rows }) => {
  const base = { width:"100%",borderRadius:8,border:`1px solid ${C.inputBorder}`,background:C.inputBg,color:C.inputText,padding:"9px 12px",fontSize:13,boxSizing:"border-box",outline:"none",...style };
  return rows
    ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ ...base,resize:"vertical" }} />
    : <input value={value} onChange={onChange} placeholder={placeholder} type={type} style={base} />;
};

const Sel = ({ value,onChange,options,style={} }) => (
  <select value={value} onChange={onChange} style={{ width:"100%",borderRadius:8,border:`1px solid ${C.inputBorder}`,background:C.inputBg,color:C.inputText,padding:"9px 12px",fontSize:13,boxSizing:"border-box",outline:"none",...style }}>
    {options.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const PrimaryBtn = ({ children,onClick,disabled=false,style={} }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding:"9px 18px",borderRadius:8,border:"none",background:disabled?"#d1d5db":C.accent,color:"#fff",cursor:disabled?"not-allowed":"pointer",fontSize:13,fontWeight:500,...style }}>{children}</button>
);

const GhostBtn = ({ children,onClick,style={} }) => (
  <button onClick={onClick} style={{ padding:"8px 14px",borderRadius:8,border:`1px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:13,...style }}>{children}</button>
);

const DangerBtn = ({ children,onClick,style={} }) => (
  <button onClick={onClick} style={{ padding:"8px 14px",borderRadius:8,border:`1px solid ${C.redBorder}`,background:C.redBg,color:C.red,cursor:"pointer",fontSize:13,...style }}>{children}</button>
);

const statusColor = s => ({
  "En producción":{ bg:C.greenBg,text:C.green,border:C.greenBorder },
  Diseño:{ bg:C.blueBg,text:C.blue,border:C.blueBorder },
  Instalación:{ bg:C.orangeBg,text:C.orange,border:C.orangeBorder },
  Atrasado:{ bg:C.redBg,text:C.red,border:C.redBorder },
  Cotización:{ bg:C.purpleBg,text:C.purple,border:C.purpleBorder },
  Entregado:{ bg:C.tealBg,text:C.teal,border:C.tealBorder },
}[s]||{ bg:C.bg2,text:C.muted,border:C.border });

const prioColor = p => ({ Urgente:C.red,Alta:C.orange,Media:C.yellow,Baja:C.green }[p]||C.muted);

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function ConfirmModal({ msg, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:14,padding:24,maxWidth:380,width:"100%",boxShadow:"0 10px 40px rgba(0,0,0,.15)" }}>
        <div style={{ fontSize:24,marginBottom:12,textAlign:"center" }}>⚠️</div>
        <div style={{ fontSize:14,color:C.text,textAlign:"center",marginBottom:20 }}>{msg}</div>
        <div style={{ display:"flex",gap:8,justifyContent:"center" }}>
          <GhostBtn onClick={onCancel}>Cancelar</GhostBtn>
          <DangerBtn onClick={onConfirm}>Sí, eliminar</DangerBtn>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, maxWidth=500 }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:C.bg,borderRadius:14,width:"100%",maxWidth,padding:24,display:"flex",flexDirection:"column",gap:16,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 10px 40px rgba(0,0,0,.15)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ fontSize:15,fontWeight:600,color:C.text }}>{title}</div>
          <button onClick={onClose} style={{ background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.muted,lineHeight:1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [user,setUser]=useState(""); const [pass,setPass]=useState(""); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const login = async () => {
    setLoading(true); setErr("");
    await new Promise(r=>setTimeout(r,400));
    const found = SYSTEM_USERS.find(u=>u.user===user.trim()&&u.pass===pass);
    if(found) { try{ await db.insert("audit_log",{ user_name:found.name,user_role:found.role,action:"inició sesión",entity:"Sistema",detail:"Acceso al portal",module:"Auth",device:"Web" }); }catch(e){} onLogin(found); }
    else { setErr("Usuario o contraseña incorrectos"); setLoading(false); }
  };
  return (
    <div style={{ minHeight:"100vh",background:C.bg3,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ width:"100%",maxWidth:380 }}>
        <div style={{ textAlign:"center",marginBottom:28 }}>
          <div style={{ fontFamily:"Georgia,'Times New Roman',serif",fontSize:34,fontWeight:700,color:C.text,letterSpacing:"-1px" }}>De Metal</div>
          <div style={{ fontSize:10,color:C.muted,letterSpacing:"0.16em",textTransform:"uppercase",marginTop:5 }}>Líderes en hierro forjado</div>
          <div style={{ width:40,height:2,background:C.accent,margin:"12px auto 0",borderRadius:1 }} />
        </div>
        <div style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:16,padding:28,display:"flex",flexDirection:"column",gap:14,boxShadow:"0 4px 24px rgba(0,0,0,.07)" }}>
          <div style={{ fontSize:14,fontWeight:600,color:C.text }}>Acceso al sistema</div>
          <div>
            <div style={{ fontSize:12,color:C.muted,marginBottom:5 }}>Usuario</div>
            <Inp value={user} onChange={e=>setUser(e.target.value)} placeholder="tu.usuario" />
          </div>
          <div>
            <div style={{ fontSize:12,color:C.muted,marginBottom:5 }}>Contraseña</div>
            <Inp value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="••••••••" />
          </div>
          {err&&<div style={{ background:C.redBg,border:`1px solid ${C.redBorder}`,borderRadius:8,padding:"8px 12px",fontSize:12,color:C.red }}>⚠ {err}</div>}
          <PrimaryBtn onClick={login} disabled={!user||!pass||loading} style={{ padding:"12px" }}>{loading?"Verificando…":"Ingresar →"}</PrimaryBtn>
          <div style={{ borderTop:`1px solid ${C.border}`,paddingTop:12 }}>
            <div style={{ fontSize:11,color:C.muted,marginBottom:8 }}>Accesos rápidos de prueba:</div>
            {SYSTEM_USERS.map(u=>{ const rp=ROLE_PERMS[u.role]; return(
              <button key={u.id} onClick={()=>{ setUser(u.user); setPass(u.pass); }} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"7px 10px",borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",marginBottom:4 }}>
                <div style={{ display:"flex",gap:8,alignItems:"center" }}><Avatar initials={u.avatar} size={24} color={u.color} /><span style={{ fontSize:12,color:C.text }}>{u.name}</span></div>
                <Badge label={u.role} bg={rp.bg} text={rp.color} border={rp.border} />
              </button>
            );})}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GLOBAL SEARCH ────────────────────────────────────────────────────────────
function GlobalSearch({ projects,employees,clients,suppliers,onProject,onClose }) {
  const [q,setQ]=useState(""); const ref=useRef();
  useEffect(()=>ref.current?.focus(),[]);
  const results = q.length<2?[]:([
    ...projects.filter(p=>[p.client,p.id,p.type,p.status].join(" ").toLowerCase().includes(q.toLowerCase())).map(p=>({ type:"proyecto",label:p.client,sub:`${p.id} · ${p.type} · ${p.status}`,item:p,emoji:"📁" })),
    ...employees.filter(e=>e.name?.toLowerCase().includes(q.toLowerCase())).map(e=>({ type:"empleado",label:e.name,sub:`${e.role} · ${e.area}`,emoji:"👷" })),
    ...(clients||[]).filter(c=>c.name?.toLowerCase().includes(q.toLowerCase())).map(c=>({ type:"cliente",label:c.name,sub:`${c.phone||""} · ${c.city||""}`,emoji:"🤝" })),
    ...(suppliers||[]).filter(s=>s.name?.toLowerCase().includes(q.toLowerCase())).map(s=>({ type:"proveedor",label:s.name,sub:`${s.contact||""} · ${s.city||""}`,emoji:"🏪" })),
  ]).slice(0,10);
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:900,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"60px 20px 20px" }}>
      <div style={{ width:"100%",maxWidth:540,background:C.bg,borderRadius:14,overflow:"hidden",border:`1px solid ${C.border}`,boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ display:"flex",gap:10,padding:"14px 16px",borderBottom:`1px solid ${C.border}`,alignItems:"center" }}>
          <span>🔍</span>
          <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar proyectos, clientes, empleados, proveedores…" style={{ flex:1,background:"transparent",border:"none",color:C.text,fontSize:14,outline:"none" }} />
          <button onClick={onClose} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18 }}>✕</button>
        </div>
        {q.length<2?<div style={{ padding:"20px",fontSize:13,color:C.muted,textAlign:"center" }}>Escribe al menos 2 caracteres para buscar</div>
        :results.length===0?<div style={{ padding:"20px",fontSize:13,color:C.muted,textAlign:"center" }}>Sin resultados para "{q}"</div>
        :results.map((r,i)=>(
          <div key={i} onClick={()=>{ if(r.type==="proyecto"&&onProject) onProject(r.item); onClose(); }}
            style={{ padding:"11px 16px",borderBottom:`1px solid ${C.border}`,cursor:"pointer",display:"flex",gap:10,alignItems:"center",background:C.bg }}
            onMouseEnter={e=>e.currentTarget.style.background=C.bg2} onMouseLeave={e=>e.currentTarget.style.background=C.bg}>
            <span style={{ fontSize:20 }}>{r.emoji}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13,fontWeight:500,color:C.text }}>{r.label}</div>
              <div style={{ fontSize:11,color:C.muted }}>{r.sub}</div>
            </div>
            <Badge label={r.type} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function NotifPanel({ projects,materials,onClose }) {
  const notifs = [
    ...projects.filter(p=>p.alert).map(p=>({ icon:"⚠️",msg:`${p.client} — entrega en riesgo`,color:C.red })),
    ...(materials||[]).filter(m=>["agotado","critico","bajo"].includes(m.status)).map(m=>({ icon:"📦",msg:`${m.name} — stock ${m.status}`,color:C.orange })),
  ];
  return (
    <div style={{ position:"absolute",top:50,right:0,width:300,background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.12)",zIndex:600,overflow:"hidden" }}>
      <div style={{ padding:"10px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontSize:13,fontWeight:600,color:C.text }}>Notificaciones</span>
        <button onClick={onClose} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer" }}>✕</button>
      </div>
      {notifs.length===0?<div style={{ padding:"16px",fontSize:12,color:C.muted,textAlign:"center" }}>Sin alertas activas ✓</div>
      :notifs.map((n,i)=>(
        <div key={i} style={{ padding:"9px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:8 }}>
          <span>{n.icon}</span><span style={{ fontSize:11,color:n.color,lineHeight:1.5 }}>{n.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ─── QUICK UPDATE ─────────────────────────────────────────────────────────────
function QuickUpdate({ project,currentUser,onClose,onSaved }) {
  const [pct,setPct]=useState(project.progress||0); const [area,setArea]=useState(project.phase||"Diseño"); const [note,setNote]=useState(""); const [issue,setIssue]=useState(""); const [saving,setSaving]=useState(false); const [saved,setSaved]=useState(false);
  const save=async()=>{
    setSaving(true);
    try {
      await db.insert("project_logs",{ project_id:project.id,user_name:currentUser.name,user_role:currentUser.role,prev_pct:project.progress||0,new_pct:pct,area,note,issue,device:"Web" });
      await db.update("projects",`id=eq.${project.id}`,{ progress:pct,phase:area,updated_at:new Date().toISOString() });
      await db.insert("audit_log",{ user_name:currentUser.name,user_role:currentUser.role,action:"actualizó avance",entity:`Proyecto ${project.id}`,detail:`${project.progress||0}% → ${pct}% · ${area}`,module:"Proyectos",device:"Web" });
      setSaved(true); setTimeout(()=>{ onSaved(); onClose(); },900);
    } catch(e){ alert("Error: "+e.message); setSaving(false); }
  };
  return (
    <Modal title={`Actualizar — ${project.client}`} onClose={onClose} maxWidth={480}>
      {saved?<div style={{ textAlign:"center",padding:"24px 0" }}><div style={{ fontSize:36 }}>✅</div><div style={{ fontWeight:500,marginTop:8,color:C.text }}>Guardado correctamente</div></div>
      :<>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
          {AREAS.map(a=><button key={a} onClick={()=>setArea(a)} style={{ padding:"5px 10px",borderRadius:7,border:`1px solid ${area===a?C.accent:C.border}`,background:area===a?`${C.accent}15`:"transparent",color:area===a?C.accent:C.muted,cursor:"pointer",fontSize:11 }}>{a}</button>)}
        </div>
        <div>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}><span style={{ fontSize:12,color:C.muted }}>Porcentaje de avance</span><span style={{ fontSize:20,fontWeight:600,color:C.accent }}>{pct}%</span></div>
          <input type="range" min={0} max={100} value={pct} onChange={e=>setPct(+e.target.value)} style={{ width:"100%",marginBottom:6 }} />
          <Bar pct={pct} h={8} />
        </div>
        <Inp value={note} onChange={e=>setNote(e.target.value)} placeholder="¿Qué se hizo? ¿Qué avanzó?" rows={2} />
        <Inp value={issue} onChange={e=>setIssue(e.target.value)} placeholder="⚠ Problema o material faltante (opcional)" />
        <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
          <GhostBtn onClick={onClose}>Cancelar</GhostBtn>
          <PrimaryBtn onClick={save} disabled={saving}>{saving?"Guardando…":"Guardar avance →"}</PrimaryBtn>
        </div>
      </>}
    </Modal>
  );
}

// ─── FLOW APPROVAL ────────────────────────────────────────────────────────────
function FlowApproval({ project,currentUser,onClose,onSaved }) {
  const [sig,setSig]=useState(""); const [saving,setSaving]=useState(false); const [done,setDone]=useState(false);
  const curIdx=FLOW.indexOf(project.status); const nextStatus=FLOW[curIdx+1];
  const required=FLOW_APPROVERS[nextStatus]; const canApprove=currentUser.role===required||currentUser.role==="Administrador";
  const approve=async()=>{
    if(!sig.trim()) return; setSaving(true);
    try {
      await db.update("projects",`id=eq.${project.id}`,{ status:nextStatus,updated_at:new Date().toISOString() });
      await db.insert("audit_log",{ user_name:currentUser.name,user_role:currentUser.role,action:"aprobó etapa",entity:`Proyecto ${project.id}`,detail:`${project.status} → ${nextStatus} · Firma: ${sig}`,module:"Proyectos",device:"Web" });
      setDone(true); setTimeout(()=>{ onSaved(); onClose(); },900);
    } catch(e){ alert("Error: "+e.message); setSaving(false); }
  };
  return (
    <Modal title="Avanzar etapa del proyecto" onClose={onClose} maxWidth={480}>
      {done?<div style={{ textAlign:"center",padding:"20px 0" }}><div style={{ fontSize:36 }}>✅</div><div style={{ fontWeight:500,marginTop:8,color:C.text }}>Etapa aprobada</div></div>
      :<>
        <div style={{ fontSize:12,color:C.muted }}>{project.client} · {project.id}</div>
        <div style={{ display:"flex",alignItems:"center",background:C.bg2,borderRadius:10,padding:12,overflowX:"auto",gap:0 }}>
          {FLOW.map((s,i)=>{ const cur=s===project.status; const past=i<curIdx; const next=s===nextStatus; return(
            <div key={s} style={{ display:"flex",alignItems:"center" }}>
              <div style={{ textAlign:"center",minWidth:74 }}>
                <div style={{ width:24,height:24,borderRadius:12,background:past?C.greenBg:cur?`${C.accent}20`:next?C.blueBg:C.bg3,border:`1.5px solid ${past?C.green:cur?C.accent:next?C.blue:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 4px",fontSize:11,color:past?C.green:cur?C.accent:next?C.blue:C.muted }}>{past?"✓":cur?"●":next?"→":"○"}</div>
                <div style={{ fontSize:9,color:cur?C.accent:past?C.green:C.muted }}>{s}</div>
              </div>
              {i<FLOW.length-1&&<div style={{ width:14,height:1,background:past?C.green:C.border,flexShrink:0 }} />}
            </div>
          );})}
        </div>
        {!nextStatus?<div style={{ fontSize:13,color:C.muted,textAlign:"center" }}>Proyecto en etapa final.</div>
        :!canApprove?<div style={{ background:C.redBg,border:`1px solid ${C.redBorder}`,borderRadius:10,padding:"12px 14px",fontSize:13,color:C.red }}>⚠ Solo un <b>{required}</b> puede aprobar este avance.</div>
        :<>
          <div style={{ background:C.bg2,borderRadius:10,padding:"10px 14px" }}>
            <div style={{ fontSize:13,fontWeight:500,color:C.text }}>{project.status} → {nextStatus}</div>
            <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>Requiere aprobación de: <b>{required}</b></div>
          </div>
          <div>
            <div style={{ fontSize:12,color:C.muted,marginBottom:6 }}>Firma digital — escribe tu nombre completo</div>
            <Inp value={sig} onChange={e=>setSig(e.target.value)} placeholder={`Firma: ${currentUser.name}`} />
          </div>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
            <GhostBtn onClick={onClose}>Cancelar</GhostBtn>
            <PrimaryBtn onClick={approve} disabled={!sig.trim()||saving}>{saving?"Registrando…":"Aprobar y avanzar →"}</PrimaryBtn>
          </div>
        </>}
      </>}
    </Modal>
  );
}

// ─── GENERIC CRUD TABLE ───────────────────────────────────────────────────────
// Used by Clients, Employees sections
function CrudTable({ title, icon, items, columns, onAdd, onEdit, onDelete, canDelete, emptyMsg }) {
  return (
    <div style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
      <div style={{ padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontSize:14,fontWeight:600,color:C.text }}>{icon} {title} <span style={{ fontWeight:400,fontSize:12,color:C.muted }}>({items.length})</span></span>
        <PrimaryBtn onClick={onAdd}>+ Agregar</PrimaryBtn>
      </div>
      {items.length===0?<div style={{ padding:"28px",fontSize:13,color:C.muted,textAlign:"center" }}>{emptyMsg||"Sin registros. Agrega el primero."}</div>
      :<div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:C.bg2 }}>
              {columns.map(c=><th key={c.key} style={{ padding:"9px 14px",textAlign:"left",fontSize:11,color:C.muted,fontWeight:500,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap" }}>{c.label}</th>)}
              <th style={{ padding:"9px 14px",fontSize:11,color:C.muted,fontWeight:500,borderBottom:`1px solid ${C.border}` }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item,i)=>(
              <tr key={item.id||i} style={{ borderBottom:`1px solid ${C.border}` }}
                onMouseEnter={e=>e.currentTarget.style.background=C.bg2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                {columns.map(c=><td key={c.key} style={{ padding:"10px 14px",fontSize:13,color:C.text }}>{c.render?c.render(item):item[c.key]||"—"}</td>)}
                <td style={{ padding:"10px 14px" }}>
                  <div style={{ display:"flex",gap:6 }}>
                    <button onClick={()=>onEdit(item)} style={{ padding:"4px 10px",borderRadius:6,border:`1px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:12 }}>✏ Editar</button>
                    {canDelete&&<button onClick={()=>onDelete(item)} style={{ padding:"4px 10px",borderRadius:6,border:`1px solid ${C.redBorder}`,background:C.redBg,color:C.red,cursor:"pointer",fontSize:12 }}>🗑</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  );
}

// ─── PROJECTS VIEW ────────────────────────────────────────────────────────────
function ProjectsView({ projects,currentUser,onSelectProject,onRefresh }) {
  const [view,setView]=useState("list"); const [modal,setModal]=useState(null); const [editItem,setEditItem]=useState(null); const [confirmDel,setConfirmDel]=useState(null);
  const rp=ROLE_PERMS[currentUser.role];
  const empty = { client:"",type:"",area:"",delivery:"",responsible:"",priority:"Alta",budget:"",status:"Cotización",phase:"Diseño" };
  const [form,setForm]=useState(empty); const [saving,setSaving]=useState(false);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const openAdd=()=>{ setForm(empty); setEditItem(null); setModal("form"); };
  const openEdit=p=>{ setForm({ client:p.client||"",type:p.type||"",area:p.area||"",delivery:p.delivery||"",responsible:p.responsible||"",priority:p.priority||"Alta",budget:p.budget||"",status:p.status||"Cotización",phase:p.phase||"Diseño" }); setEditItem(p); setModal("form"); };
  const save=async()=>{
    setSaving(true);
    try {
      if(editItem) {
        await db.update("projects",`id=eq.${editItem.id}`,{ ...form,budget:parseInt(form.budget)||0,updated_at:new Date().toISOString() });
        await db.insert("audit_log",{ user_name:currentUser.name,user_role:currentUser.role,action:"editó proyecto",entity:editItem.id,detail:`Cliente: ${form.client}`,module:"Proyectos",device:"Web" });
      } else {
        const id=`DM-${Date.now().toString().slice(-4)}`;
        await db.insert("projects",{ id,client:form.client,type:form.type,area:form.area,delivery:form.delivery||null,responsible:form.responsible,priority:form.priority,status:form.status,phase:form.phase,budget:parseInt(form.budget)||0,alert:false });
        await db.insert("audit_log",{ user_name:currentUser.name,user_role:currentUser.role,action:"creó proyecto",entity:id,detail:form.client,module:"Proyectos",device:"Web" });
      }
      setModal(null); onRefresh();
    } catch(e){ alert("Error: "+e.message); }
    setSaving(false);
  };
  const del=async()=>{
    try {
      await db.del("projects",`id=eq.${confirmDel.id}`);
      await db.insert("audit_log",{ user_name:currentUser.name,user_role:currentUser.role,action:"eliminó proyecto",entity:confirmDel.id,detail:confirmDel.client,module:"Proyectos",device:"Web" });
      setConfirmDel(null); onRefresh();
    } catch(e){ alert("Error: "+e.message); }
  };
  const KANBAN_COLS = FLOW.map(col=>({ col, items:projects.filter(p=>p.status===col) }));
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8 }}>
        <h2 style={{ margin:0,fontSize:17,fontWeight:600,color:C.text }}>Proyectos</h2>
        <div style={{ display:"flex",gap:8 }}>
          <div style={{ display:"flex",border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden" }}>
            <button onClick={()=>setView("list")} style={{ padding:"6px 14px",border:"none",background:view==="list"?`${C.accent}15`:C.bg,color:view==="list"?C.accent:C.muted,cursor:"pointer",fontSize:12 }}>≡ Lista</button>
            <button onClick={()=>setView("kanban")} style={{ padding:"6px 14px",border:"none",background:view==="kanban"?`${C.accent}15`:C.bg,color:view==="kanban"?C.accent:C.muted,cursor:"pointer",fontSize:12 }}>⊞ Kanban</button>
          </div>
          {rp.editar&&<PrimaryBtn onClick={openAdd}>+ Nuevo proyecto</PrimaryBtn>}
        </div>
      </div>

      {view==="kanban"?(
        <div style={{ display:"flex",gap:10,overflowX:"auto",paddingBottom:8 }}>
          {KANBAN_COLS.map(({ col,items })=>{ const sc=statusColor(col); return(
            <div key={col} style={{ minWidth:200,flex:"0 0 200px",display:"flex",flexDirection:"column",gap:8 }}>
              <div style={{ padding:"7px 12px",background:sc.bg,border:`1px solid ${sc.border}`,borderRadius:8,display:"flex",justifyContent:"space-between" }}>
                <span style={{ fontSize:12,fontWeight:600,color:sc.text }}>{col}</span>
                <span style={{ fontSize:11,color:sc.text }}>{items.length}</span>
              </div>
              {items.map(p=>(
                <div key={p.id} onClick={()=>onSelectProject(p)} style={{ background:C.bg,border:`1px solid ${p.alert?C.redBorder:C.border}`,borderRadius:10,padding:"11px",cursor:"pointer" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=p.alert?C.redBorder:C.border}>
                  <div style={{ fontSize:12,fontWeight:600,color:C.text,marginBottom:4 }}>{p.client}</div>
                  <div style={{ fontSize:10,color:C.muted,marginBottom:6 }}>{p.id} · {p.type}</div>
                  <Bar pct={p.progress||0} h={4} color={p.alert?C.red:C.accent} />
                  <div style={{ display:"flex",justifyContent:"space-between",marginTop:5 }}>
                    <span style={{ fontSize:10,color:C.muted }}>{p.progress||0}%</span>
                    <span style={{ fontSize:10,color:prioColor(p.priority),fontWeight:600 }}>{p.priority}</span>
                  </div>
                </div>
              ))}
              {items.length===0&&<div style={{ border:`1px dashed ${C.border}`,borderRadius:10,padding:"18px 10px",textAlign:"center",fontSize:11,color:C.muted }}>Sin proyectos</div>}
            </div>
          );})}
        </div>
      ):(
        projects.length===0?<div style={{ fontSize:13,color:C.muted,padding:"30px 0",textAlign:"center" }}>Sin proyectos. Crea el primero.</div>
        :projects.map(p=>{ const sc=statusColor(p.status); return(
          <div key={p.id} style={{ background:C.bg,border:`1px solid ${p.alert?C.redBorder:C.border}`,borderRadius:12,padding:"13px 16px",display:"flex",gap:12,alignItems:"center" }}>
            <div style={{ width:3,background:prioColor(p.priority),borderRadius:2,alignSelf:"stretch",flexShrink:0 }} />
            <div style={{ flex:1,minWidth:0,cursor:"pointer" }} onClick={()=>onSelectProject(p)}>
              <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:3 }}><span style={{ fontWeight:600,color:C.text }}>{p.client}</span>{p.alert&&<span style={{ fontSize:10,color:C.red }}>⚠</span>}</div>
              <div style={{ fontSize:11,color:C.muted,marginBottom:6 }}>{p.id} · {p.type} · {p.area}</div>
              <Bar pct={p.progress||0} color={p.alert?C.red:C.accent} />
            </div>
            <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0 }}>
              <Badge label={p.status} bg={sc.bg} text={sc.text} border={sc.border} />
              <span style={{ fontSize:11,color:C.muted }}>{p.responsible||"—"}</span>
              <div style={{ display:"flex",gap:5 }}>
                {rp.editar&&<button onClick={()=>openEdit(p)} style={{ fontSize:11,padding:"3px 8px",borderRadius:5,border:`1px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer" }}>✏</button>}
                {rp.eliminar&&<button onClick={()=>setConfirmDel(p)} style={{ fontSize:11,padding:"3px 8px",borderRadius:5,border:`1px solid ${C.redBorder}`,background:C.redBg,color:C.red,cursor:"pointer" }}>🗑</button>}
              </div>
            </div>
          </div>
        );}
      )}

      {modal==="form"&&(
        <Modal title={editItem?"Editar proyecto":"Nuevo proyecto"} onClose={()=>setModal(null)}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {[["client","Cliente *"],["type","Tipo de proyecto *"],["area","Ubicación"],["responsible","Responsable"]].map(([k,l])=>(
              <div key={k}><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>{l}</div><Inp value={form[k]} onChange={set(k)} placeholder={l} /></div>
            ))}
            <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Fecha de entrega</div><Inp value={form.delivery} onChange={set("delivery")} type="date" /></div>
            <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Presupuesto (MXN)</div><Inp value={form.budget} onChange={set("budget")} type="number" placeholder="0" /></div>
            <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Prioridad</div><Sel value={form.priority} onChange={set("priority")} options={["Alta","Media","Baja","Urgente"]} /></div>
            <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Estado</div><Sel value={form.status} onChange={set("status")} options={FLOW} /></div>
          </div>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end",marginTop:4 }}>
            <GhostBtn onClick={()=>setModal(null)}>Cancelar</GhostBtn>
            <PrimaryBtn onClick={save} disabled={!form.client||!form.type||saving}>{saving?"Guardando…":"Guardar →"}</PrimaryBtn>
          </div>
        </Modal>
      )}
      {confirmDel&&<ConfirmModal msg={`¿Eliminar el proyecto de ${confirmDel.client}? Esta acción no se puede deshacer.`} onConfirm={del} onCancel={()=>setConfirmDel(null)} />}
    </div>
  );
}

// ─── PROJECT DETAIL ───────────────────────────────────────────────────────────
function ProjectDetail({ project,onBack,onUpdate,onFlow,currentUser,logs,photos }) {
  const [tab,setTab]=useState("info"); const sc=statusColor(project.status);
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <div style={{ display:"flex",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
        <GhostBtn onClick={onBack}>← Volver</GhostBtn>
        <div style={{ flex:1,minWidth:200 }}>
          <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
            <span style={{ fontSize:16,fontWeight:600,color:C.text }}>{project.client}</span>
            <Badge label={project.status} bg={sc.bg} text={sc.text} border={sc.border} />
            {project.alert&&<Badge label="⚠ ALERTA" bg={C.redBg} text={C.red} border={C.redBorder} />}
          </div>
          <div style={{ fontSize:12,color:C.muted,marginTop:3 }}>{project.id} · {project.type}</div>
        </div>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
          <button onClick={()=>onUpdate(project)} style={{ padding:"7px 13px",borderRadius:8,border:`1px solid ${C.accent}`,background:`${C.accent}10`,color:C.accent,cursor:"pointer",fontSize:13 }}>📷 Actualizar avance</button>
          <button onClick={()=>onFlow(project)} style={{ padding:"7px 13px",borderRadius:8,border:`1px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:13 }}>→ Avanzar etapa</button>
        </div>
      </div>
      <div style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 18px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:10 }}><span style={{ fontSize:13,color:C.muted }}>Avance general</span><span style={{ fontSize:24,fontWeight:600,color:C.accent }}>{project.progress||0}%</span></div>
        <Bar pct={project.progress||0} h={12} color={project.alert?C.red:C.accent} />
        <div style={{ display:"flex",gap:0,marginTop:14,overflowX:"auto" }}>
          {FLOW.map((s,i)=>{ const cur=s===project.status; const past=FLOW.indexOf(s)<FLOW.indexOf(project.status); return(
            <div key={s} style={{ display:"flex",alignItems:"center" }}>
              <div style={{ textAlign:"center",minWidth:80 }}>
                <div style={{ width:24,height:24,borderRadius:12,background:past?C.greenBg:cur?`${C.accent}20`:C.bg3,border:`1.5px solid ${past?C.green:cur?C.accent:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 4px",fontSize:11,color:past?C.green:cur?C.accent:C.muted }}>{past?"✓":cur?"●":"○"}</div>
                <div style={{ fontSize:9,color:cur?C.accent:past?C.green:C.muted }}>{s}</div>
              </div>
              {i<FLOW.length-1&&<div style={{ width:16,height:1,background:past?C.green:C.border,flexShrink:0 }} />}
            </div>
          );})}
        </div>
      </div>
      <div style={{ display:"flex",gap:0,borderBottom:`1px solid ${C.border}` }}>
        {[["info","Información"],["historial",`Historial (${logs.length})`]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:"8px 16px",border:"none",background:"none",cursor:"pointer",fontSize:13,color:tab===id?C.accent:C.muted,fontWeight:tab===id?600:400,borderBottom:`2px solid ${tab===id?C.accent:"transparent"}` }}>{label}</button>
        ))}
      </div>
      {tab==="info"&&(
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          {[["Cliente",project.client],["Código",project.id],["Tipo",project.type||"—"],["Área",project.area||"—"],["Entrega",project.delivery||"—"],["Responsable",project.responsible||"—"],["Fase actual",project.phase||"—"],["Presupuesto",`$${(project.budget||0).toLocaleString()} MXN`]].map(([k,v])=>(
            <div key={k} style={{ background:C.bg2,borderRadius:8,padding:"10px 13px" }}><div style={{ fontSize:10,color:C.muted,marginBottom:3 }}>{k}</div><div style={{ fontSize:13,fontWeight:500,color:C.text }}>{v}</div></div>
          ))}
        </div>
      )}
      {tab==="historial"&&(
        <div>
          {logs.length===0?<div style={{ fontSize:13,color:C.muted,padding:"12px 0" }}>Sin cambios registrados aún.</div>
          :logs.map((l,i)=>(
            <div key={i} style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",marginBottom:8 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                <span style={{ fontSize:12,fontWeight:600,color:C.accent }}>{l.user_name} · {l.user_role}</span>
                <span style={{ fontSize:11,color:C.muted }}>{new Date(l.created_at).toLocaleString("es-MX")}</span>
              </div>
              <div style={{ fontSize:12,color:C.muted }}>Avance: <b style={{ color:C.text }}>{l.prev_pct}% → {l.new_pct}%</b> · {l.area}</div>
              {l.note&&<div style={{ fontSize:11,color:C.muted,marginTop:3 }}>"{l.note}"</div>}
              {l.issue&&<div style={{ fontSize:11,color:C.orange,marginTop:3 }}>⚠ {l.issue}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── EMPLOYEES VIEW ───────────────────────────────────────────────────────────
function EmployeesView({ employees,currentUser,onRefresh }) {
  const [modal,setModal]=useState(false); const [editItem,setEditItem]=useState(null); const [confirmDel,setConfirmDel]=useState(null); const [saving,setSaving]=useState(false);
  const rp=ROLE_PERMS[currentUser.role];
  const empty={ name:"",role:"",area:"",phone:"",email:"",load:"normal",efficiency:80,hours:0,overtime:0,attend:"presente" };
  const [form,setForm]=useState(empty);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const openAdd=()=>{ setForm(empty); setEditItem(null); setModal(true); };
  const openEdit=e=>{ setForm({ name:e.name||"",role:e.role||"",area:e.area||"",phone:e.phone||"",email:e.email||"",load:e.load||"normal",efficiency:e.efficiency||80,hours:e.hours||0,overtime:e.overtime||0,attend:e.attend||"presente" }); setEditItem(e); setModal(true); };
  const save=async()=>{
    setSaving(true);
    try {
      if(editItem){ await db.update("employees",`id=eq.${editItem.id}`,{ ...form,efficiency:+form.efficiency,hours:+form.hours,overtime:+form.overtime }); }
      else { await db.insert("employees",{ ...form,efficiency:+form.efficiency,hours:+form.hours,overtime:+form.overtime,avatar:form.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase() }); }
      await db.insert("audit_log",{ user_name:currentUser.name,user_role:currentUser.role,action:editItem?"editó empleado":"creó empleado",entity:form.name,detail:form.role,module:"Empleados",device:"Web" });
      setModal(false); onRefresh();
    } catch(e){ alert("Error: "+e.message); }
    setSaving(false);
  };
  const del=async()=>{
    try{ await db.del("employees",`id=eq.${confirmDel.id}`); setConfirmDel(null); onRefresh(); }
    catch(e){ alert("Error: "+e.message); }
  };
  const loadColors={ alta:C.orange,saturado:C.red,baja:C.blue,normal:C.green };
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <h2 style={{ margin:0,fontSize:17,fontWeight:600,color:C.text }}>Empleados</h2>
        {rp.editar&&<PrimaryBtn onClick={openAdd}>+ Agregar empleado</PrimaryBtn>}
      </div>
      {employees.length===0?<div style={{ fontSize:13,color:C.muted,padding:"24px",textAlign:"center",background:C.bg,borderRadius:12,border:`1px solid ${C.border}` }}>Sin empleados. Agrega el primero.</div>
      :<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12 }}>
        {employees.map(e=>{ const lc=loadColors[e.load]||C.green; return(
          <div key={e.id} style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"15px",display:"flex",flexDirection:"column",gap:10 }}>
            <div style={{ display:"flex",gap:10,alignItems:"center" }}>
              <Avatar initials={e.avatar||e.name?.slice(0,2)||"?"} size={42} color={lc} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600,fontSize:13,color:C.text }}>{e.name}</div>
                <div style={{ fontSize:11,color:C.muted }}>{e.role} · {e.area}</div>
              </div>
              <Badge label={e.load||"normal"} bg={`${lc}15`} text={lc} border={`${lc}40`} />
            </div>
            {e.phone&&<div style={{ fontSize:11,color:C.muted }}>📞 {e.phone}</div>}
            {e.email&&<div style={{ fontSize:11,color:C.muted }}>✉ {e.email}</div>}
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}><span style={{ fontSize:11,color:C.muted }}>Eficiencia</span><span style={{ fontSize:12,fontWeight:600,color:(+e.efficiency||80)>=90?C.green:C.accent }}>{e.efficiency||80}%</span></div>
              <Bar pct={e.efficiency||80} color={(+e.efficiency||80)>=90?C.green:C.accent} />
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontSize:11,color:C.muted }}>⏱ {e.hours||0}h · <span style={{ color:C.orange }}>+{e.overtime||0}h extra</span></span>
              <div style={{ display:"flex",gap:5 }}>
                {rp.editar&&<button onClick={()=>openEdit(e)} style={{ fontSize:11,padding:"3px 8px",borderRadius:5,border:`1px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer" }}>✏</button>}
                {rp.eliminar&&<button onClick={()=>setConfirmDel(e)} style={{ fontSize:11,padding:"3px 8px",borderRadius:5,border:`1px solid ${C.redBorder}`,background:C.redBg,color:C.red,cursor:"pointer" }}>🗑</button>}
              </div>
            </div>
          </div>
        );})}
      </div>}
      {modal&&(
        <Modal title={editItem?"Editar empleado":"Nuevo empleado"} onClose={()=>setModal(false)}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {[["name","Nombre completo *"],["role","Cargo / Puesto *"],["area","Área"],["phone","Teléfono"],["email","Correo electrónico"]].map(([k,l])=>(
              <div key={k}><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>{l}</div><Inp value={form[k]} onChange={set(k)} placeholder={l} type={k==="email"?"email":k==="phone"?"tel":"text"} /></div>
            ))}
            <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Carga de trabajo</div><Sel value={form.load} onChange={set("load")} options={["normal","alta","saturado","baja"]} /></div>
            <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Eficiencia (%)</div><Inp value={form.efficiency} onChange={set("efficiency")} type="number" /></div>
            <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Horas mes</div><Inp value={form.hours} onChange={set("hours")} type="number" /></div>
            <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Horas extras</div><Inp value={form.overtime} onChange={set("overtime")} type="number" /></div>
          </div>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
            <GhostBtn onClick={()=>setModal(false)}>Cancelar</GhostBtn>
            <PrimaryBtn onClick={save} disabled={!form.name||!form.role||saving}>{saving?"Guardando…":"Guardar →"}</PrimaryBtn>
          </div>
        </Modal>
      )}
      {confirmDel&&<ConfirmModal msg={`¿Eliminar a ${confirmDel.name}?`} onConfirm={del} onCancel={()=>setConfirmDel(null)} />}
    </div>
  );
}

// ─── CLIENTS VIEW ─────────────────────────────────────────────────────────────
function ClientsView({ currentUser }) {
  const [items,setItems]=useState([]); const [loading,setLoading]=useState(true); const [modal,setModal]=useState(false); const [editItem,setEditItem]=useState(null); const [confirmDel,setConfirmDel]=useState(null); const [saving,setSaving]=useState(false);
  const rp=ROLE_PERMS[currentUser.role];
  const empty={ name:"",phone:"",email:"",city:"",address:"",notes:"" };
  const [form,setForm]=useState(empty);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const load=async()=>{ setLoading(true); try{ const d=await db.get("clients","select=*"); setItems(d||[]); }catch(e){ setItems([]); } setLoading(false); };
  useEffect(()=>load(),[]);
  const openAdd=()=>{ setForm(empty); setEditItem(null); setModal(true); };
  const openEdit=c=>{ setForm({ name:c.name||"",phone:c.phone||"",email:c.email||"",city:c.city||"",address:c.address||"",notes:c.notes||"" }); setEditItem(c); setModal(true); };
  const save=async()=>{
    setSaving(true);
    try {
      if(editItem){ await db.update("clients",`id=eq.${editItem.id}`,form); }
      else { await db.insert("clients",form); }
      await db.insert("audit_log",{ user_name:currentUser.name,user_role:currentUser.role,action:editItem?"editó cliente":"creó cliente",entity:form.name,detail:form.city,module:"Clientes",device:"Web" });
      setModal(false); load();
    } catch(e){ alert("Error: "+e.message); }
    setSaving(false);
  };
  const del=async()=>{
    try{ await db.del("clients",`id=eq.${confirmDel.id}`); setConfirmDel(null); load(); }
    catch(e){ alert("Error: "+e.message); }
  };
  if(loading) return <div style={{ padding:"24px",fontSize:13,color:C.muted }}>Cargando clientes…</div>;
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <h2 style={{ margin:0,fontSize:17,fontWeight:600,color:C.text }}>Clientes</h2>
        {rp.editar&&<PrimaryBtn onClick={openAdd}>+ Agregar cliente</PrimaryBtn>}
      </div>
      {items.length===0?<div style={{ fontSize:13,color:C.muted,padding:"24px",textAlign:"center",background:C.bg,borderRadius:12,border:`1px solid ${C.border}` }}>Sin clientes registrados. Agrega el primero.</div>
      :<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12 }}>
        {items.map(c=>(
          <div key={c.id} style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"15px",display:"flex",flexDirection:"column",gap:8 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
              <div>
                <div style={{ fontWeight:600,fontSize:14,color:C.text }}>{c.name}</div>
                {c.city&&<div style={{ fontSize:11,color:C.muted }}>📍 {c.city}</div>}
              </div>
              <div style={{ display:"flex",gap:5 }}>
                {rp.editar&&<button onClick={()=>openEdit(c)} style={{ fontSize:11,padding:"3px 8px",borderRadius:5,border:`1px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer" }}>✏</button>}
                {rp.eliminar&&<button onClick={()=>setConfirmDel(c)} style={{ fontSize:11,padding:"3px 8px",borderRadius:5,border:`1px solid ${C.redBorder}`,background:C.redBg,color:C.red,cursor:"pointer" }}>🗑</button>}
              </div>
            </div>
            {c.phone&&<div style={{ fontSize:12,color:C.muted }}>📞 {c.phone}</div>}
            {c.email&&<div style={{ fontSize:12,color:C.muted }}>✉ {c.email}</div>}
            {c.address&&<div style={{ fontSize:11,color:C.muted }}>🏠 {c.address}</div>}
            {c.notes&&<div style={{ fontSize:11,color:C.muted,background:C.bg2,borderRadius:6,padding:"6px 8px" }}>{c.notes}</div>}
          </div>
        ))}
      </div>}
      {modal&&(
        <Modal title={editItem?"Editar cliente":"Nuevo cliente"} onClose={()=>setModal(false)}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {[["name","Nombre *"],["phone","Teléfono"],["email","Correo"],["city","Ciudad"]].map(([k,l])=>(
              <div key={k}><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>{l}</div><Inp value={form[k]} onChange={set(k)} placeholder={l} /></div>
            ))}
          </div>
          <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Dirección</div><Inp value={form.address} onChange={set("address")} placeholder="Dirección completa" /></div>
          <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Notas</div><Inp value={form.notes} onChange={set("notes")} placeholder="Notas adicionales" rows={2} /></div>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
            <GhostBtn onClick={()=>setModal(false)}>Cancelar</GhostBtn>
            <PrimaryBtn onClick={save} disabled={!form.name||saving}>{saving?"Guardando…":"Guardar →"}</PrimaryBtn>
          </div>
        </Modal>
      )}
      {confirmDel&&<ConfirmModal msg={`¿Eliminar al cliente ${confirmDel.name}?`} onConfirm={del} onCancel={()=>setConfirmDel(null)} />}
    </div>
  );
}

// ─── SUPPLIERS VIEW ───────────────────────────────────────────────────────────
function SuppliersView({ currentUser }) {
  const [items,setItems]=useState([]); const [materials,setMaterials]=useState([]); const [loading,setLoading]=useState(true); const [modal,setModal]=useState(false); const [editItem,setEditItem]=useState(null); const [confirmDel,setConfirmDel]=useState(null); const [detail,setDetail]=useState(null); const [saving,setSaving]=useState(false);
  const rp=ROLE_PERMS[currentUser.role];
  const empty={ name:"",contact:"",phone:"",email:"",city:"",address:"",category:"",notes:"",rating:5 };
  const [form,setForm]=useState(empty);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const load=async()=>{
    setLoading(true);
    try {
      const [sup,mat]=await Promise.all([db.get("suppliers","select=*"),db.get("materials","select=*")]);
      setItems(sup||[]); setMaterials(mat||[]);
    } catch(e){ setItems([]); setMaterials([]); }
    setLoading(false);
  };
  useEffect(()=>load(),[]);
  const openAdd=()=>{ setForm(empty); setEditItem(null); setModal(true); };
  const openEdit=s=>{ setForm({ name:s.name||"",contact:s.contact||"",phone:s.phone||"",email:s.email||"",city:s.city||"",address:s.address||"",category:s.category||"",notes:s.notes||"",rating:s.rating||5 }); setEditItem(s); setModal(true); };
  const save=async()=>{
    setSaving(true);
    try {
      if(editItem){ await db.update("suppliers",`id=eq.${editItem.id}`,{ ...form,rating:+form.rating }); }
      else { await db.insert("suppliers",{ ...form,rating:+form.rating }); }
      await db.insert("audit_log",{ user_name:currentUser.name,user_role:currentUser.role,action:editItem?"editó proveedor":"creó proveedor",entity:form.name,detail:form.city,module:"Proveedores",device:"Web" });
      setModal(false); load();
    } catch(e){ alert("Error: "+e.message); }
    setSaving(false);
  };
  const del=async()=>{
    try{ await db.del("suppliers",`id=eq.${confirmDel.id}`); setConfirmDel(null); load(); }
    catch(e){ alert("Error: "+e.message); }
  };
  const getSupMats=s=>materials.filter(m=>m.supplier===s.name);
  if(loading) return <div style={{ padding:"24px",fontSize:13,color:C.muted }}>Cargando proveedores…</div>;
  if(detail){
    const supMats=getSupMats(detail);
    return (
      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          <GhostBtn onClick={()=>setDetail(null)}>← Volver</GhostBtn>
          <div>
            <div style={{ fontSize:16,fontWeight:600,color:C.text }}>{detail.name}</div>
            <div style={{ fontSize:12,color:C.muted }}>{detail.category} · {detail.city}</div>
          </div>
          <div style={{ marginLeft:"auto",display:"flex",gap:6 }}>
            {rp.editar&&<button onClick={()=>{ openEdit(detail); setDetail(null); }} style={{ padding:"7px 13px",borderRadius:8,border:`1px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:13 }}>✏ Editar</button>}
            {rp.eliminar&&<DangerBtn onClick={()=>{ setConfirmDel(detail); setDetail(null); }}>🗑 Eliminar</DangerBtn>}
          </div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          {[["Contacto",detail.contact||"—"],["Teléfono",detail.phone||"—"],["Correo",detail.email||"—"],["Ciudad",detail.city||"—"],["Dirección",detail.address||"—"],["Categoría",detail.category||"—"]].map(([k,v])=>(
            <div key={k} style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 13px" }}>
              <div style={{ fontSize:10,color:C.muted,marginBottom:3 }}>{k}</div>
              <div style={{ fontSize:13,fontWeight:500,color:C.text }}>{v}</div>
            </div>
          ))}
        </div>
        {detail.notes&&<div style={{ background:C.bg2,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",fontSize:13,color:C.text }}><span style={{ fontWeight:600 }}>Notas: </span>{detail.notes}</div>}
        <div>
          <div style={{ fontSize:14,fontWeight:600,color:C.text,marginBottom:10 }}>📦 Materiales asociados ({supMats.length})</div>
          {supMats.length===0?<div style={{ fontSize:13,color:C.muted }}>Sin materiales asignados a este proveedor.</div>
          :supMats.map(m=>(
            <div key={m.id} style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13,fontWeight:500,color:C.text }}>{m.name}</div>
                <div style={{ fontSize:11,color:C.muted }}>{m.category} · Stock: {m.stock} {m.unit}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:14,fontWeight:600,color:C.accent }}>${m.cost}</div>
                <div style={{ fontSize:10,color:C.muted }}>/{m.unit}</div>
              </div>
            </div>
          ))}
        </div>
        {confirmDel&&<ConfirmModal msg={`¿Eliminar al proveedor ${confirmDel.name}?`} onConfirm={del} onCancel={()=>setConfirmDel(null)} />}
      </div>
    );
  }
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <h2 style={{ margin:0,fontSize:17,fontWeight:600,color:C.text }}>Proveedores / Ferreterías</h2>
        {rp.editar&&<PrimaryBtn onClick={openAdd}>+ Agregar proveedor</PrimaryBtn>}
      </div>
      {items.length===0?<div style={{ fontSize:13,color:C.muted,padding:"24px",textAlign:"center",background:C.bg,borderRadius:12,border:`1px solid ${C.border}` }}>Sin proveedores. Agrega el primero.</div>
      :<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12 }}>
        {items.map(s=>(
          <div key={s.id} style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:"15px",display:"flex",flexDirection:"column",gap:8,cursor:"pointer" }}
            onClick={()=>setDetail(s)} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
              <div>
                <div style={{ fontWeight:600,fontSize:14,color:C.text }}>{s.name}</div>
                {s.category&&<Badge label={s.category} />}
              </div>
              <div style={{ display:"flex",gap:5 }} onClick={e=>e.stopPropagation()}>
                {rp.editar&&<button onClick={()=>openEdit(s)} style={{ fontSize:11,padding:"3px 8px",borderRadius:5,border:`1px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer" }}>✏</button>}
                {rp.eliminar&&<button onClick={()=>setConfirmDel(s)} style={{ fontSize:11,padding:"3px 8px",borderRadius:5,border:`1px solid ${C.redBorder}`,background:C.redBg,color:C.red,cursor:"pointer" }}>🗑</button>}
              </div>
            </div>
            {s.contact&&<div style={{ fontSize:12,color:C.muted }}>👤 {s.contact}</div>}
            {s.phone&&<div style={{ fontSize:12,color:C.muted }}>📞 {s.phone}</div>}
            {s.email&&<div style={{ fontSize:12,color:C.muted }}>✉ {s.email}</div>}
            {s.city&&<div style={{ fontSize:12,color:C.muted }}>📍 {s.city}</div>}
            <div style={{ borderTop:`1px solid ${C.border}`,paddingTop:8,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span style={{ fontSize:11,color:C.muted }}>{getSupMats(s).length} materiales asignados</span>
              <span style={{ fontSize:11,color:C.accent }}>Ver perfil →</span>
            </div>
          </div>
        ))}
      </div>}
      {modal&&(
        <Modal title={editItem?"Editar proveedor":"Nuevo proveedor"} onClose={()=>setModal(false)}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {[["name","Nombre / Ferretería *"],["contact","Nombre del contacto"],["phone","Teléfono"],["email","Correo electrónico"],["city","Ciudad"],["category","Categoría / Especialidad"]].map(([k,l])=>(
              <div key={k}><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>{l}</div><Inp value={form[k]} onChange={set(k)} placeholder={l} /></div>
            ))}
          </div>
          <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Dirección</div><Inp value={form.address} onChange={set("address")} placeholder="Dirección completa" /></div>
          <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Notas / Historial</div><Inp value={form.notes} onChange={set("notes")} placeholder="Notas sobre este proveedor, historial de compras, etc." rows={3} /></div>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
            <GhostBtn onClick={()=>setModal(false)}>Cancelar</GhostBtn>
            <PrimaryBtn onClick={save} disabled={!form.name||saving}>{saving?"Guardando…":"Guardar →"}</PrimaryBtn>
          </div>
        </Modal>
      )}
      {confirmDel&&<ConfirmModal msg={`¿Eliminar al proveedor ${confirmDel.name}?`} onConfirm={del} onCancel={()=>setConfirmDel(null)} />}
    </div>
  );
}

// ─── MATERIALS VIEW ───────────────────────────────────────────────────────────
function MaterialsView({ currentUser }) {
  const [items,setItems]=useState([]); const [suppliers,setSuppliers]=useState([]); const [loading,setLoading]=useState(true); const [modal,setModal]=useState(false); const [editItem,setEditItem]=useState(null); const [confirmDel,setConfirmDel]=useState(null); const [catFilter,setCatFilter]=useState("Todos"); const [saving,setSaving]=useState(false);
  const rp=ROLE_PERMS[currentUser.role];
  const empty={ name:"",category:"Tubos",supplier:"",stock:0,min_stock:5,unit:"kg",cost:0,status:"ok",alert_msg:"" };
  const [form,setForm]=useState(empty);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const load=async()=>{
    setLoading(true);
    try {
      const [m,s]=await Promise.all([db.get("materials","select=*"),db.get("suppliers","select=*")]);
      setItems(m||[]); setSuppliers(s||[]);
    } catch(e){ setItems([]); }
    setLoading(false);
  };
  useEffect(()=>load(),[]);
  const openAdd=()=>{ setForm(empty); setEditItem(null); setModal(true); };
  const openEdit=m=>{ setForm({ name:m.name||"",category:m.category||"Tubos",supplier:m.supplier||"",stock:m.stock||0,min_stock:m.min_stock||5,unit:m.unit||"kg",cost:m.cost||0,status:m.status||"ok",alert_msg:m.alert_msg||"" }); setEditItem(m); setModal(true); };
  const save=async()=>{
    setSaving(true);
    try {
      const d={ ...form,stock:+form.stock,min_stock:+form.min_stock,cost:+form.cost };
      if(editItem){ await db.update("materials",`id=eq.${editItem.id}`,d); }
      else { await db.insert("materials",d); }
      await db.insert("audit_log",{ user_name:currentUser.name,user_role:currentUser.role,action:editItem?"editó material":"creó material",entity:form.name,detail:form.category,module:"Materiales",device:"Web" });
      setModal(false); load();
    } catch(e){ alert("Error: "+e.message); }
    setSaving(false);
  };
  const del=async()=>{
    try{ await db.del("materials",`id=eq.${confirmDel.id}`); setConfirmDel(null); load(); }
    catch(e){ alert("Error: "+e.message); }
  };
  const cats=["Todos",...MAT_CATS];
  const filtered=catFilter==="Todos"?items:items.filter(m=>m.category===catFilter);
  const stColors={ ok:{ bg:C.greenBg,text:C.green,border:C.greenBorder,label:"Disponible" },critico:{ bg:C.orangeBg,text:C.orange,border:C.orangeBorder,label:"Crítico" },agotado:{ bg:C.redBg,text:C.red,border:C.redBorder,label:"Agotado" },bajo:{ bg:C.yellowBg,text:C.yellow,border:C.yellowBorder,label:"Stock bajo" },pendiente:{ bg:C.purpleBg,text:C.purple,border:C.purpleBorder,label:"En camino" } };
  if(loading) return <div style={{ padding:"24px",fontSize:13,color:C.muted }}>Cargando materiales…</div>;
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8 }}>
        <h2 style={{ margin:0,fontSize:17,fontWeight:600,color:C.text }}>Materiales</h2>
        {rp.editar&&<PrimaryBtn onClick={openAdd}>+ Agregar material</PrimaryBtn>}
      </div>
      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:8 }}>
        <Metric label="Total" value={items.length} />
        <Metric label="Disponibles" value={items.filter(m=>m.status==="ok").length} color={C.green} />
        <Metric label="Críticos" value={items.filter(m=>["agotado","critico"].includes(m.status)).length} color={C.red} />
        <Metric label="Stock bajo" value={items.filter(m=>m.status==="bajo").length} color={C.yellow} />
      </div>
      {/* Category filter */}
      <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setCatFilter(c)} style={{ padding:"5px 12px",borderRadius:20,border:`1px solid ${catFilter===c?C.accent:C.border}`,background:catFilter===c?`${C.accent}12`:"transparent",color:catFilter===c?C.accent:C.muted,cursor:"pointer",fontSize:12,fontWeight:catFilter===c?600:400 }}>{c}</button>
        ))}
      </div>
      {/* Group by category */}
      {filtered.length===0?<div style={{ fontSize:13,color:C.muted,padding:"20px",textAlign:"center",background:C.bg,borderRadius:12,border:`1px solid ${C.border}` }}>Sin materiales en esta categoría.</div>
      :<div style={{ display:"flex",flexDirection:"column",gap:8 }}>
        {filtered.map(m=>{ const ms=stColors[m.status]||{ bg:C.bg2,text:C.muted,border:C.border,label:m.status||"—" }; return(
          <div key={m.id} style={{ background:C.bg,border:`1px solid ${m.status!=="ok"?ms.border:C.border}`,borderRadius:10,padding:"12px 16px",display:"flex",gap:12,alignItems:"center" }}>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap" }}>
                <span style={{ fontSize:13,fontWeight:600,color:C.text }}>{m.name}</span>
                <Badge label={ms.label} bg={ms.bg} text={ms.text} border={ms.border} />
                {m.category&&<Badge label={m.category} />}
              </div>
              <div style={{ fontSize:11,color:C.muted,marginBottom:5 }}>
                Stock: <b>{m.stock} {m.unit}</b> · Mín: {m.min_stock} · Proveedor: <b>{m.supplier||"—"}</b>
              </div>
              <Bar pct={Math.round((m.stock/Math.max(+m.stock+(m.min_stock||5)*2,1))*100)} color={m.status==="agotado"?C.red:m.status==="bajo"?C.yellow:C.green} h={5} />
              {m.alert_msg&&<div style={{ fontSize:11,color:C.red,marginTop:4 }}>🚨 {m.alert_msg}</div>}
            </div>
            <div style={{ textAlign:"right",flexShrink:0 }}>
              <div style={{ fontSize:16,fontWeight:600,color:C.accent }}>${m.cost}</div>
              <div style={{ fontSize:10,color:C.muted }}>/{m.unit}</div>
              <div style={{ display:"flex",gap:5,marginTop:6 }}>
                {rp.editar&&<button onClick={()=>openEdit(m)} style={{ fontSize:11,padding:"3px 8px",borderRadius:5,border:`1px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer" }}>✏</button>}
                {rp.eliminar&&<button onClick={()=>setConfirmDel(m)} style={{ fontSize:11,padding:"3px 8px",borderRadius:5,border:`1px solid ${C.redBorder}`,background:C.redBg,color:C.red,cursor:"pointer" }}>🗑</button>}
              </div>
            </div>
          </div>
        );})}
      </div>}
      {modal&&(
        <Modal title={editItem?"Editar material":"Nuevo material"} onClose={()=>setModal(false)}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            <div style={{ gridColumn:"1/-1" }}><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Nombre del material *</div><Inp value={form.name} onChange={set("name")} placeholder="Ej: Tubo cuadrado 2x2" /></div>
            <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Categoría</div><Sel value={form.category} onChange={set("category")} options={MAT_CATS} /></div>
            <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Proveedor / Ferretería</div>
              <select value={form.supplier} onChange={set("supplier")} style={{ width:"100%",borderRadius:8,border:`1px solid ${C.inputBorder}`,background:C.inputBg,color:C.inputText,padding:"9px 12px",fontSize:13,boxSizing:"border-box",outline:"none" }}>
                <option value="">Sin proveedor</option>
                {suppliers.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Stock actual</div><Inp value={form.stock} onChange={set("stock")} type="number" placeholder="0" /></div>
            <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Stock mínimo</div><Inp value={form.min_stock} onChange={set("min_stock")} type="number" placeholder="5" /></div>
            <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Unidad</div><Sel value={form.unit} onChange={set("unit")} options={["kg","m","pza","lt","rollo","lámina","caja","par","m²"]} /></div>
            <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Costo unitario</div><Inp value={form.cost} onChange={set("cost")} type="number" placeholder="0" /></div>
            <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Estado</div><Sel value={form.status} onChange={set("status")} options={["ok","bajo","critico","agotado","pendiente"]} /></div>
          </div>
          <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Alerta (opcional)</div><Inp value={form.alert_msg} onChange={set("alert_msg")} placeholder="Ej: Contactar proveedor antes del viernes" /></div>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
            <GhostBtn onClick={()=>setModal(false)}>Cancelar</GhostBtn>
            <PrimaryBtn onClick={save} disabled={!form.name||saving}>{saving?"Guardando…":"Guardar →"}</PrimaryBtn>
          </div>
        </Modal>
      )}
      {confirmDel&&<ConfirmModal msg={`¿Eliminar el material "${confirmDel.name}"?`} onConfirm={del} onCancel={()=>setConfirmDel(null)} />}
    </div>
  );
}

// ─── QUOTES VIEW ──────────────────────────────────────────────────────────────
function QuotesView({ currentUser,onConvertToProject }) {
  const [quotes,setQuotes]=useState([]); const [loading,setLoading]=useState(true); const [modal,setModal]=useState(false); const [editItem,setEditItem]=useState(null); const [confirmDel,setConfirmDel]=useState(null); const [saving,setSaving]=useState(false);
  const rp=ROLE_PERMS[currentUser.role];
  const empty={ client:"",type:"",area:"",notes:"",items:[{ desc:"",qty:1,unit:0 }] };
  const [form,setForm]=useState(empty);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const setItem=(i,k,v)=>setForm(f=>({...f,items:f.items.map((it,j)=>j===i?{...it,[k]:k==="qty"||k==="unit"?+v:v}:it)}));
  const load=async()=>{ setLoading(true); try{ const d=await db.get("quotes","select=*"); setQuotes(d||[]); }catch(e){ setQuotes([]); } setLoading(false); };
  useEffect(()=>load(),[]);
  const total=form.items.reduce((a,i)=>a+i.qty*i.unit,0);
  const save=async()=>{
    setSaving(true);
    try {
      if(editItem){ await db.update("quotes",`id=eq.${editItem.id}`,{ client:form.client,type:form.type,area:form.area,notes:form.notes,total,items:JSON.stringify(form.items) }); }
      else { const id=`COT-${String(quotes.length+1).padStart(3,"0")}`; await db.insert("quotes",{ id,client:form.client,type:form.type,area:form.area,notes:form.notes,total,status:"pendiente",approved:false,items:JSON.stringify(form.items) }); }
      setModal(false); load();
    } catch(e){ alert("Error: "+e.message); }
    setSaving(false);
  };
  const del=async()=>{
    try{ await db.del("quotes",`id=eq.${confirmDel.id}`); setConfirmDel(null); load(); }
    catch(e){ alert("Error: "+e.message); }
  };
  const approve=async q=>{ await db.update("quotes",`id=eq.${q.id}`,{ approved:true,status:"aprobada" }); load(); };
  const openEdit=q=>{ setForm({ client:q.client||"",type:q.type||"",area:q.area||"",notes:q.notes||"",items:q.items?JSON.parse(q.items):[{ desc:"",qty:1,unit:0 }] }); setEditItem(q); setModal(true); };
  if(loading) return <div style={{ padding:"24px",fontSize:13,color:C.muted }}>Cargando cotizaciones…</div>;
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <h2 style={{ margin:0,fontSize:17,fontWeight:600,color:C.text }}>Cotizaciones</h2>
        {rp.editar&&<PrimaryBtn onClick={()=>{ setForm(empty); setEditItem(null); setModal(true); }}>+ Nueva cotización</PrimaryBtn>}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8 }}>
        <Metric label="Total" value={quotes.length} />
        <Metric label="Pendientes" value={quotes.filter(q=>!q.approved).length} color={C.yellow} />
        <Metric label="Aprobadas" value={quotes.filter(q=>q.approved).length} color={C.green} />
        <Metric label="Valor total" value={`$${quotes.reduce((a,q)=>a+(q.total||0),0).toLocaleString()}`} color={C.accent} />
      </div>
      {quotes.length===0?<div style={{ fontSize:13,color:C.muted,padding:"24px",textAlign:"center",background:C.bg,borderRadius:12,border:`1px solid ${C.border}` }}>Sin cotizaciones. Crea la primera.</div>
      :quotes.map(q=>(
        <div key={q.id} style={{ background:C.bg,border:`1px solid ${q.approved?C.greenBorder:C.border}`,borderRadius:12,padding:"14px 18px" }}>
          <div style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:4 }}>
                <span style={{ fontWeight:600,fontSize:14,color:C.text }}>{q.client}</span>
                <Badge label={q.approved?"Aprobada":"Pendiente"} bg={q.approved?C.greenBg:C.yellowBg} text={q.approved?C.green:C.yellow} border={q.approved?C.greenBorder:C.yellowBorder} />
              </div>
              <div style={{ fontSize:11,color:C.muted }}>{q.id} · {q.type}</div>
              {q.notes&&<div style={{ fontSize:11,color:C.muted,marginTop:4 }}>{q.notes}</div>}
            </div>
            <div style={{ textAlign:"right",flexShrink:0 }}>
              <div style={{ fontSize:20,fontWeight:600,color:C.accent }}>${(q.total||0).toLocaleString()}</div>
              <div style={{ fontSize:10,color:C.muted }}>MXN</div>
              <div style={{ display:"flex",gap:5,marginTop:8,flexWrap:"wrap",justifyContent:"flex-end" }}>
                {rp.editar&&<button onClick={()=>openEdit(q)} style={{ fontSize:11,padding:"3px 8px",borderRadius:5,border:`1px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer" }}>✏</button>}
                {rp.eliminar&&<button onClick={()=>setConfirmDel(q)} style={{ fontSize:11,padding:"3px 8px",borderRadius:5,border:`1px solid ${C.redBorder}`,background:C.redBg,color:C.red,cursor:"pointer" }}>🗑</button>}
                {!q.approved&&<button onClick={()=>approve(q)} style={{ fontSize:11,padding:"4px 10px",borderRadius:5,border:`1px solid ${C.green}`,background:`${C.green}10`,color:C.green,cursor:"pointer" }}>✓ Aprobar</button>}
                <button onClick={()=>onConvertToProject(q)} style={{ fontSize:11,padding:"4px 10px",borderRadius:5,border:`1px solid ${C.accent}`,background:`${C.accent}10`,color:C.accent,cursor:"pointer" }}>→ Proyecto</button>
              </div>
            </div>
          </div>
        </div>
      ))}
      {modal&&(
        <Modal title={editItem?"Editar cotización":"Nueva cotización"} onClose={()=>setModal(false)}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {[["client","Cliente *"],["type","Tipo *"],["area","Ubicación"]].map(([k,l])=>(
              <div key={k}><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>{l}</div><Inp value={form[k]} onChange={set(k)} placeholder={l} /></div>
            ))}
          </div>
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
              <span style={{ fontSize:12,fontWeight:600,color:C.text }}>Partidas</span>
              <button onClick={()=>setForm(f=>({...f,items:[...f.items,{ desc:"",qty:1,unit:0 }]}))} style={{ fontSize:12,color:C.accent,background:"none",border:"none",cursor:"pointer" }}>+ Agregar línea</button>
            </div>
            {form.items.map((it,i)=>(
              <div key={i} style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:6,marginBottom:6 }}>
                <Inp value={it.desc} onChange={e=>setItem(i,"desc",e.target.value)} placeholder="Descripción" />
                <Inp value={it.qty} onChange={e=>setItem(i,"qty",e.target.value)} placeholder="Cant." type="number" />
                <Inp value={it.unit} onChange={e=>setItem(i,"unit",e.target.value)} placeholder="Precio" type="number" />
                <button onClick={()=>setForm(f=>({...f,items:f.items.filter((_,j)=>j!==i)}))} style={{ padding:"8px",border:`1px solid ${C.redBorder}`,borderRadius:7,background:C.redBg,color:C.red,cursor:"pointer",fontSize:12 }}>✕</button>
              </div>
            ))}
            <div style={{ textAlign:"right",fontSize:15,fontWeight:600,color:C.accent }}>Total: ${total.toLocaleString()} MXN</div>
          </div>
          <div><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>Notas</div><Inp value={form.notes} onChange={set("notes")} placeholder="Notas adicionales" rows={2} /></div>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
            <GhostBtn onClick={()=>setModal(false)}>Cancelar</GhostBtn>
            <PrimaryBtn onClick={save} disabled={!form.client||!form.type||saving}>{saving?"Guardando…":"Guardar →"}</PrimaryBtn>
          </div>
        </Modal>
      )}
      {confirmDel&&<ConfirmModal msg={`¿Eliminar la cotización de ${confirmDel.client}?`} onConfirm={del} onCancel={()=>setConfirmDel(null)} />}
    </div>
  );
}

// ─── METRICS VIEW ─────────────────────────────────────────────────────────────
function MetricsView({ projects }) {
  const total=projects.length,entregados=projects.filter(p=>p.status==="Entregado").length,atrasados=projects.filter(p=>p.alert).length;
  const avgProg=total?Math.round(projects.reduce((a,p)=>a+(p.progress||0),0)/total):0;
  const byStatus=FLOW.map(s=>({ s,count:projects.filter(p=>p.status===s).length }));
  const maxC=Math.max(...byStatus.map(b=>b.count),1);
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <h2 style={{ margin:0,fontSize:17,fontWeight:600,color:C.text }}>Métricas históricas</h2>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10 }}>
        <Metric label="Total proyectos" value={total} />
        <Metric label="Entregados" value={entregados} color={C.green} sub={`${total?Math.round(entregados/total*100):0}%`} />
        <Metric label="Con alerta" value={atrasados} color={C.red} />
        <Metric label="Avance promedio" value={`${avgProg}%`} color={C.accent} />
      </div>
      <div style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:16 }}>
        <div style={{ fontSize:13,fontWeight:600,color:C.text,marginBottom:14 }}>Distribución por etapa</div>
        <div style={{ display:"flex",gap:10,alignItems:"flex-end",height:110 }}>
          {byStatus.map(b=>{ const sc=statusColor(b.s); const h=Math.round((b.count/maxC)*85)+8; return(
            <div key={b.s} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
              <span style={{ fontSize:12,fontWeight:600,color:sc.text }}>{b.count}</span>
              <div style={{ width:"100%",background:sc.bg,border:`1px solid ${sc.border}`,borderRadius:"5px 5px 0 0",height:h }} />
              <span style={{ fontSize:9,color:C.muted,textAlign:"center",lineHeight:1.3 }}>{b.s}</span>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

// ─── AI ASSISTANT ─────────────────────────────────────────────────────────────
function AIAssistant({ projects,employees,materials,currentUser }) {
  const [messages,setMessages]=useState([{ role:"assistant",content:`Hola ${currentUser.name.split(" ")[0]}. Tengo acceso a ${projects.length} proyectos desde Supabase. ¿En qué te ayudo?` }]);
  const [input,setInput]=useState(""); const [loading,setLoading]=useState(false);
  const CTX=`Eres el asistente operativo interno de "De Metal", fábrica premium de barandales, portones, muebles metálicos en San Pedro Sula, Honduras. Slogan: "Líderes en hierro forjado". Responde siempre en español, sé directo y concreto. Máximo 180 palabras.
PROYECTOS: ${projects.map(p=>`${p.id}|${p.client}|${p.status}|${p.progress||0}%|${p.delivery||"sin fecha"}|${p.alert?"⚠ALERTA":""}`).join(" // ")}
EMPLEADOS: ${employees.map(e=>`${e.name}|${e.role}|efic:${e.efficiency||80}%`).join(" // ")}
MATERIALES CRÍTICOS: ${materials.filter(m=>m.status!=="ok").map(m=>`${m.name}|${m.status}|${m.stock}${m.unit}`).join(" // ")||"ninguno"}
USUARIO: ${currentUser.name} (${currentUser.role})`;
  const send=async(text)=>{
    const q=text||input.trim(); if(!q||loading) return; setInput("");
    const msgs=[...messages,{ role:"user",content:q }]; setMessages(msgs); setLoading(true);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{ method:"POST",headers:{ "Content-Type":"application/json" },body:JSON.stringify({ model:"claude-sonnet-4-20250514",max_tokens:600,system:CTX,messages:msgs.map(m=>({ role:m.role,content:m.content })) }) });
      const data=await res.json();
      setMessages(prev=>[...prev,{ role:"assistant",content:data.content?.[0]?.text||"Error en la respuesta." }]);
    } catch{ setMessages(prev=>[...prev,{ role:"assistant",content:"Error de conexión." }]); }
    setLoading(false);
  };
  const SUGGESTIONS=["¿Qué proyecto tiene mayor riesgo?","¿Qué debo priorizar hoy?","Resumen ejecutivo de producción","¿Qué materiales debo comprar?"];
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14,height:"calc(100vh - 120px)",maxHeight:660 }}>
      <div>
        <h2 style={{ margin:0,fontSize:17,fontWeight:600,color:C.text,display:"flex",gap:10,alignItems:"center" }}>🤖 Asistente IA <Badge label="● En línea" bg={C.greenBg} text={C.green} border={C.greenBorder} /></h2>
        <div style={{ fontSize:12,color:C.muted }}>Conectado a Supabase · datos en tiempo real</div>
      </div>
      <div style={{ flex:1,background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{ flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:12 }}>
          {messages.map((m,i)=>(
            <div key={i} style={{ display:"flex",gap:8,alignItems:"flex-start",flexDirection:m.role==="user"?"row-reverse":"row" }}>
              {m.role==="assistant"?<div style={{ width:30,height:30,borderRadius:8,background:`${C.accent}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0 }}>🤖</div>
              :<Avatar initials={currentUser.avatar} size={30} color={currentUser.color} />}
              <div style={{ maxWidth:"76%",background:m.role==="user"?`${C.accent}12`:C.bg2,border:`1px solid ${m.role==="user"?`${C.accent}30`:C.border}`,borderRadius:m.role==="user"?"12px 4px 12px 12px":"4px 12px 12px 12px",padding:"10px 14px",fontSize:13,lineHeight:1.6,color:C.text }}>{m.content}</div>
            </div>
          ))}
          {loading&&<div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <div style={{ width:30,height:30,borderRadius:8,background:`${C.accent}20`,display:"flex",alignItems:"center",justifyContent:"center" }}>🤖</div>
            <div style={{ background:C.bg2,borderRadius:"4px 12px 12px 12px",padding:"10px 14px",fontSize:13,color:C.muted }}>Analizando…</div>
          </div>}
        </div>
        {messages.length<=1&&<div style={{ padding:"0 14px 12px",display:"flex",gap:5,flexWrap:"wrap" }}>
          {SUGGESTIONS.map((s,i)=><button key={i} onClick={()=>send(s)} style={{ fontSize:11,padding:"5px 10px",borderRadius:8,border:`1px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer" }}>{s}</button>)}
        </div>}
        <div style={{ padding:"11px 14px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8 }}>
          <Inp value={input} onChange={e=>setInput(e.target.value)} placeholder="Pregunta sobre proyectos, materiales o producción…" style={{ flex:1 }} />
          <button onClick={()=>send()} disabled={!input.trim()||loading} style={{ padding:"9px 16px",borderRadius:8,border:"none",background:input.trim()&&!loading?C.accent:C.bg3,color:input.trim()&&!loading?"#fff":C.muted,cursor:input.trim()&&!loading?"pointer":"not-allowed",fontSize:13,fontWeight:500 }}>→</button>
        </div>
      </div>
    </div>
  );
}

// ─── AUDIT VIEW ───────────────────────────────────────────────────────────────
function AuditView({ auditLog }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
      <h2 style={{ margin:0,fontSize:17,fontWeight:600,color:C.text }}>Bitácora del sistema</h2>
      <Metric label="Acciones registradas" value={auditLog.length} color={C.accent} />
      {auditLog.length===0?<div style={{ fontSize:13,color:C.muted,padding:"20px",textAlign:"center",background:C.bg,borderRadius:12,border:`1px solid ${C.border}` }}>Sin actividad registrada aún.</div>
      :auditLog.map(l=>(
        <div key={l.id} style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 15px",display:"flex",gap:10,alignItems:"flex-start" }}>
          <span style={{ fontSize:16,marginTop:1 }}>{{ "actualizó avance":"📊","aprobó etapa":"✅","inició sesión":"🔐","creó proyecto":"✨","editó proyecto":"✏","eliminó proyecto":"🗑","creó empleado":"👷","editó empleado":"✏","creó cliente":"🤝","creó proveedor":"🏪","creó material":"📦" }[l.action]||"📋"}</span>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:12,fontWeight:600,color:C.text }}>{l.user_name} <span style={{ color:C.muted,fontWeight:400 }}>{l.action}</span> <span style={{ color:C.accent }}>{l.entity}</span></div>
            {l.detail&&<div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{l.detail}</div>}
            <div style={{ fontSize:10,color:C.muted,marginTop:3 }}>🕐 {new Date(l.created_at).toLocaleString("es-MX")} · {l.module}</div>
          </div>
          <Badge label={l.user_role} bg={ROLE_PERMS[l.user_role]?.bg||C.bg2} text={ROLE_PERMS[l.user_role]?.color||C.muted} border={ROLE_PERMS[l.user_role]?.border||C.border} />
        </div>
      ))}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ projects,employees,materials,auditLog,currentUser,onSelectProject,onNewProject,rp,isOnline,onRefresh }) {
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10 }}>
        <div>
          <h2 style={{ margin:0,fontSize:17,fontWeight:600,color:C.text }}>Bienvenido, {currentUser.name.split(" ")[0]}</h2>
          <div style={{ fontSize:12,color:C.muted }}>{new Date().toLocaleDateString("es-MX",{ weekday:"long",day:"numeric",month:"long",year:"numeric" })}</div>
        </div>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          <div style={{ width:7,height:7,borderRadius:4,background:isOnline?C.green:C.red }} />
          <span style={{ fontSize:11,color:C.muted }}>{isOnline?"Supabase activo":"Sin conexión"}</span>
          <button onClick={onRefresh} style={{ fontSize:11,padding:"4px 10px",borderRadius:6,border:`1px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer" }}>↻ Actualizar</button>
        </div>
      </div>
      {projects.filter(p=>p.alert).map(p=>(
        <div key={p.id} onClick={()=>onSelectProject(p)} style={{ background:C.redBg,border:`1px solid ${C.redBorder}`,borderRadius:9,padding:"9px 14px",cursor:"pointer",display:"flex",gap:10,alignItems:"center" }}>
          <span>⚠</span><span style={{ fontSize:12,color:C.redText }}><b>{p.id}</b> · {p.client} — entrega {p.delivery} · {p.phase}</span>
        </div>
      ))}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10 }}>
        <Metric label="Proyectos" value={projects.length} />
        <Metric label="Avance prom." value={`${projects.length?Math.round(projects.reduce((a,p)=>a+(p.progress||0),0)/projects.length):0}%`} color={C.accent} />
        <Metric label="Empleados" value={employees.length} color={C.green} />
        <Metric label="Mat. críticos" value={materials.filter(m=>["agotado","critico"].includes(m.status)).length} color={C.red} />
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"minmax(0,1fr) 280px",gap:14 }}>
        <div style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
          <div style={{ padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:14,fontWeight:600,color:C.text }}>Proyectos activos</span>
            {rp.editar&&<button onClick={onNewProject} style={{ fontSize:11,padding:"4px 10px",borderRadius:6,border:`1px solid ${C.accent}`,background:`${C.accent}10`,color:C.accent,cursor:"pointer" }}>+ Nuevo</button>}
          </div>
          {projects.length===0?<div style={{ padding:24,fontSize:13,color:C.muted,textAlign:"center" }}>Sin proyectos. Crea el primero.</div>
          :projects.map(p=>{ const sc=statusColor(p.status); return(
            <div key={p.id} onClick={()=>onSelectProject(p)} style={{ padding:"10px 16px",borderBottom:`1px solid ${C.border}`,cursor:"pointer",display:"flex",gap:10,alignItems:"center" }}
              onMouseEnter={e=>e.currentTarget.style.background=C.bg2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ width:3,background:prioColor(p.priority),borderRadius:2,alignSelf:"stretch",flexShrink:0 }} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:12,fontWeight:600,color:C.text,marginBottom:2 }}>{p.client} {p.alert&&<span style={{ color:C.red,fontSize:10 }}>⚠</span>}</div>
                <div style={{ fontSize:10,color:C.muted,marginBottom:4 }}>{p.id} · {p.type}</div>
                <Bar pct={p.progress||0} color={p.alert?C.red:C.accent} h={4} />
              </div>
              <Badge label={p.status} bg={sc.bg} text={sc.text} border={sc.border} />
            </div>
          );})}
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
          <div style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
            <div style={{ padding:"10px 14px",borderBottom:`1px solid ${C.border}`,fontSize:13,fontWeight:600,color:C.text }}>Actividad reciente</div>
            {auditLog.slice(0,5).map(l=>(
              <div key={l.id} style={{ padding:"8px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"flex-start" }}>
                <span>{{ "actualizó avance":"📊","aprobó etapa":"✅","inició sesión":"🔐","creó proyecto":"✨" }[l.action]||"📋"}</span>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:11,fontWeight:500,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{l.user_name}</div>
                  <div style={{ fontSize:10,color:C.muted }}>{l.action}</div>
                </div>
              </div>
            ))}
            {auditLog.length===0&&<div style={{ padding:"12px 14px",fontSize:12,color:C.muted }}>Sin actividad aún.</div>}
          </div>
          <div style={{ background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
            <div style={{ padding:"10px 14px",borderBottom:`1px solid ${C.border}`,fontSize:13,fontWeight:600,color:C.text }}>📦 Materiales críticos</div>
            {materials.filter(m=>m.status!=="ok").length===0?<div style={{ padding:"12px 14px",fontSize:12,color:C.green }}>✓ Sin materiales críticos</div>
            :materials.filter(m=>m.status!=="ok").slice(0,4).map(m=>{ const lv={ agotado:C.red,critico:C.orange,bajo:C.yellow }[m.status]||C.muted; return(
              <div key={m.id} style={{ padding:"7px 14px",borderBottom:`1px solid ${C.border}` }}>
                <div style={{ fontSize:12,fontWeight:500,color:C.text }}>{m.name}</div>
                <div style={{ fontSize:10,color:lv }}>{m.status} · {m.stock} {m.unit}</div>
              </div>
            );})}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser,setCurrentUser]=useState(null);
  const [nav,setNav]=useState("dashboard");
  const [selProject,setSelProject]=useState(null);
  const [updateProject,setUpdateProject]=useState(null);
  const [flowProject,setFlowProject]=useState(null);
  const [showSearch,setShowSearch]=useState(false);
  const [showNotifs,setShowNotifs]=useState(false);
  const [sidebar,setSidebar]=useState(true);
  const [projects,setProjects]=useState([]);
  const [employees,setEmployees]=useState([]);
  const [materials,setMaterials]=useState([]);
  const [clients,setClients]=useState([]);
  const [auditLog,setAuditLog]=useState([]);
  const [projLogs,setProjLogs]=useState([]);
  const [projPhotos,setProjPhotos]=useState([]);
  const [loading,setLoading]=useState(false);
  const [isOnline,setIsOnline]=useState(navigator.onLine);

  useEffect(()=>{ const on=()=>setIsOnline(true),off=()=>setIsOnline(false); window.addEventListener("online",on); window.addEventListener("offline",off); return()=>{ window.removeEventListener("online",on); window.removeEventListener("offline",off); }; },[]);
  useEffect(()=>{ const h=e=>{ if((e.metaKey||e.ctrlKey)&&e.key==="k"){ e.preventDefault(); setShowSearch(true); } }; window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h); },[]);

  const loadData=async()=>{
    setLoading(true);
    try {
      const [p,e,m,a,c]=await Promise.all([db.get("projects","select=*"),db.get("employees","select=*"),db.get("materials","select=*"),db.get("audit_log","select=*&limit=60"),db.get("clients","select=*")]);
      setProjects(p||[]); setEmployees(e||[]); setMaterials(m||[]); setAuditLog(a||[]); setClients(c||[]);
    } catch(ex){ console.error(ex); }
    setLoading(false);
  };
  const loadProjectDetails=async(pid)=>{
    try {
      const [logs,photos]=await Promise.all([db.get("project_logs",`select=*&project_id=eq.${pid}`),db.get("project_photos",`select=*&project_id=eq.${pid}`)]);
      setProjLogs(logs||[]); setProjPhotos(photos||[]);
    } catch{}
  };
  useEffect(()=>{ if(currentUser) loadData(); },[currentUser]);
  useEffect(()=>{ if(selProject) loadProjectDetails(selProject.id); },[selProject]);

  const handleLogin=u=>{ setCurrentUser(u); };
  const handleLogout=()=>{ setCurrentUser(null); setProjects([]); };
  const convertQuoteToProject=async(q)=>{
    const id=`DM-${Date.now().toString().slice(-4)}`;
    await db.insert("projects",{ id,client:q.client,type:q.type,area:q.area||"",delivery:"",responsible:"",priority:"Media",status:"Cotización",phase:"Diseño",budget:q.total||0,alert:false });
    loadData(); setNav("projects");
  };

  if(!currentUser) return <LoginScreen onLogin={handleLogin} />;

  const rp=ROLE_PERMS[currentUser.role]||ROLE_PERMS.Instalación;
  const notifCount=projects.filter(p=>p.alert).length+materials.filter(m=>["agotado","critico"].includes(m.status)).length;

  const navItems=[
    { id:"dashboard",emoji:"▦",label:"Dashboard" },
    { id:"projects",emoji:"📁",label:"Proyectos" },
    { id:"quotes",emoji:"📋",label:"Cotizaciones" },
    { id:"clients",emoji:"🤝",label:"Clientes" },
    { id:"employees",emoji:"👷",label:"Empleados" },
    { id:"materials",emoji:"📦",label:"Materiales" },
    { id:"suppliers",emoji:"🏪",label:"Proveedores" },
    { id:"metrics",emoji:"📈",label:"Métricas" },
    { id:"audit",emoji:"🔍",label:"Bitácora" },
    { id:"ai",emoji:"🤖",label:"Asistente IA" },
  ];

  const renderContent=()=>{
    if(loading) return <div style={{ display:"flex",alignItems:"center",justifyContent:"center",padding:60,color:C.muted,fontSize:14 }}>⏳ Cargando desde Supabase…</div>;
    if(nav==="dashboard") return <Dashboard projects={projects} employees={employees} materials={materials} auditLog={auditLog} currentUser={currentUser} rp={rp} isOnline={isOnline} onRefresh={loadData} onSelectProject={p=>{ setSelProject(p); setNav("projects"); }} onNewProject={()=>setNav("projects")} />;
    if(nav==="projects"){
      if(selProject) return <ProjectDetail project={selProject} onBack={()=>setSelProject(null)} onUpdate={setUpdateProject} onFlow={setFlowProject} currentUser={currentUser} logs={projLogs} photos={projPhotos} />;
      return <ProjectsView projects={projects} currentUser={currentUser} onSelectProject={p=>setSelProject(p)} onRefresh={loadData} />;
    }
    if(nav==="quotes") return <QuotesView currentUser={currentUser} onConvertToProject={convertQuoteToProject} />;
    if(nav==="clients") return <ClientsView currentUser={currentUser} />;
    if(nav==="employees") return <EmployeesView employees={employees} currentUser={currentUser} onRefresh={loadData} />;
    if(nav==="materials") return <MaterialsView currentUser={currentUser} />;
    if(nav==="suppliers") return <SuppliersView currentUser={currentUser} />;
    if(nav==="metrics") return <MetricsView projects={projects} />;
    if(nav==="audit") return <AuditView auditLog={auditLog} />;
    if(nav==="ai") return <AIAssistant projects={projects} employees={employees} materials={materials} currentUser={currentUser} />;
  };

  return (
    <div style={{ display:"flex",minHeight:"100vh",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",background:C.bg3,color:C.text }}>
      {/* Sidebar */}
      <div style={{ width:sidebar?210:56,background:C.bg,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0,transition:"width .2s",overflow:"hidden" }}>
        <div style={{ padding:"14px 12px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:sidebar?"flex-start":"center",minHeight:62 }}>
          {sidebar?<div>
            <div style={{ fontFamily:"Georgia,'Times New Roman',serif",fontSize:20,fontWeight:700,color:C.text,lineHeight:1 }}>De Metal</div>
            <div style={{ fontSize:9,color:C.muted,letterSpacing:"0.13em",textTransform:"uppercase",marginTop:3 }}>Líderes en hierro forjado</div>
          </div>:<span style={{ fontFamily:"Georgia,serif",fontSize:17,fontWeight:700,color:C.text }}>D</span>}
        </div>
        <nav style={{ flex:1,padding:"8px 6px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto" }}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>{ setNav(item.id); setSelProject(null); }}
              style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,border:"none",cursor:"pointer",background:nav===item.id?`${C.accent}12`:"transparent",color:nav===item.id?C.accent:C.muted,fontWeight:nav===item.id?600:400,fontSize:13,textAlign:"left",width:"100%",whiteSpace:"nowrap" }}>
              <span style={{ fontSize:14,flexShrink:0 }}>{item.emoji}</span>
              {sidebar&&<span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding:"8px",borderTop:`1px solid ${C.border}` }}>
          {sidebar?<div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <Avatar initials={currentUser.avatar} size={28} color={currentUser.color} />
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:11,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{currentUser.name.split(" ")[0]}</div>
              <div style={{ fontSize:10,color:C.muted }}>{currentUser.role}</div>
            </div>
            <button onClick={handleLogout} title="Cerrar sesión" style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14,padding:4 }}>⏻</button>
          </div>:<button onClick={handleLogout} style={{ width:"100%",background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16,padding:"4px 0" }}>⏻</button>}
        </div>
        <button onClick={()=>setSidebar(!sidebar)} style={{ margin:"4px 6px 8px",padding:"5px",border:`1px solid ${C.border}`,borderRadius:7,cursor:"pointer",background:"transparent",color:C.muted,fontSize:11 }}>{sidebar?"◀ Colapsar":"▶"}</button>
      </div>

      {/* Main */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",minWidth:0 }}>
        {/* Topbar */}
        <div style={{ background:C.bg,borderBottom:`1px solid ${C.border}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:12 }}>
          <span style={{ fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,color:C.text }}>De Metal</span>
          <span style={{ color:C.border,fontSize:18 }}>|</span>
          <span style={{ fontSize:13,color:C.muted }}>{selProject?selProject.client:navItems.find(n=>n.id===nav)?.label}</span>
          <div style={{ flex:1 }} />
          <button onClick={()=>setShowSearch(true)} style={{ display:"flex",gap:6,alignItems:"center",padding:"5px 12px",borderRadius:8,border:`1px solid ${C.border2}`,background:C.bg2,color:C.muted,cursor:"pointer",fontSize:12 }}>🔍 <span>Buscar</span> <span style={{ fontSize:10,opacity:.5 }}>⌘K</span></button>
          <div style={{ position:"relative" }}>
            <button onClick={()=>setShowNotifs(!showNotifs)} style={{ position:"relative",background:C.bg2,border:`1px solid ${C.border2}`,borderRadius:8,width:34,height:34,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center" }}>
              🔔
              {notifCount>0&&<div style={{ position:"absolute",top:-3,right:-3,width:16,height:16,borderRadius:8,background:C.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700 }}>{notifCount}</div>}
            </button>
            {showNotifs&&<NotifPanel projects={projects} materials={materials} onClose={()=>setShowNotifs(false)} />}
          </div>
          <Badge label={currentUser.role} bg={rp.bg} text={rp.color} border={rp.border} />
        </div>

        {/* Content */}
        <div style={{ flex:1,padding:22,overflowY:"auto" }}>
          {renderContent()}
        </div>
      </div>

      {/* Modals */}
      {showSearch&&<GlobalSearch projects={projects} employees={employees} clients={clients} suppliers={[]} onProject={p=>{ setSelProject(p); setNav("projects"); }} onClose={()=>setShowSearch(false)} />}
      {updateProject&&<QuickUpdate project={updateProject} currentUser={currentUser} onClose={()=>setUpdateProject(null)} onSaved={()=>{ loadData(); if(selProject) loadProjectDetails(selProject.id); }} />}
      {flowProject&&<FlowApproval project={flowProject} currentUser={currentUser} onClose={()=>setFlowProject(null)} onSaved={()=>{ loadData(); if(selProject) loadProjectDetails(selProject.id); }} />}
    </div>
  );
}
