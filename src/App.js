
import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://bhirrdalujsevlwxoiji.supabase.co";
const SUPABASE_KEY = "sb_publishable_ian5YhEbz5fd4b0MQQuIBA_g9c46fqb";

const sb = async (path, opts = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": opts.prefer || "return=representation",
      ...opts.headers,
    },
    ...opts,
  });
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

const db = {
  get: (t, q="") => sb(`${t}?${q}&order=created_at.desc`),
  insert: (t, d) => sb(t, { method:"POST", body:JSON.stringify(d) }),
  update: (t, m, d) => sb(`${t}?${m}`, { method:"PATCH", body:JSON.stringify(d) }),
};

const C = {
  accent:"#B87333",
  red:"#ef4444", redBg:"#3b0000", redBorder:"#991b1b", redText:"#fca5a5",
  green:"#22c55e", greenBg:"#052e16", greenBorder:"#166534",
  blue:"#60a5fa", blueBg:"#0c1a2e", blueBorder:"#1d4ed8",
  orange:"#f97316", orangeBg:"#1c0a00", orangeBorder:"#9a3412",
  purple:"#a78bfa", purpleBg:"#1e1b4b", purpleBorder:"#6d28d9",
  yellow:"#eab308", yellowBg:"#1a1500", yellowBorder:"#854d0e",
  teal:"#2dd4bf", tealBg:"#022c22", tealBorder:"#0d9488",
  border:"#e5e7eb", border2:"#d1d5db",
  bg:"#ffffff", bg2:"#f9fafb", bg3:"#f3f4f6",
  text:"#111827", muted:"#6b7280",
};

const FLOW = ["Cotización","Diseño","En producción","Instalación","Entregado"];
const FLOW_APPROVERS = { "Diseño":"Supervisor","En producción":"Supervisor","Instalación":"Administrador","Entregado":"Administrador" };

const SYSTEM_USERS = [
  { id:"U01", name:"Roberto Aguilar", role:"Administrador", avatar:"RA", color:C.purple, user:"admin", pass:"demetal2024" },
  { id:"U02", name:"Carlos Martínez", role:"Supervisor", avatar:"CM", color:C.accent, user:"carlos", pass:"supervisor123" },
  { id:"U03", name:"Ana Pérez", role:"Producción", avatar:"AP", color:C.green, user:"ana", pass:"prod2024" },
  { id:"U04", name:"Luis Rodríguez", role:"Instalación", avatar:"LR", color:C.orange, user:"luis", pass:"install24" },
];

const ROLE_PERMS = {
  "Administrador":{ ver:true,editar:true,eliminar:true,aprobar:true,exportar:true,color:C.purple,bg:C.purpleBg,border:C.purpleBorder },
  "Supervisor":   { ver:true,editar:true,eliminar:false,aprobar:true,exportar:true,color:C.accent,bg:`${C.accent}22`,border:`${C.accent}44` },
  "Producción":   { ver:true,editar:true,eliminar:false,aprobar:false,exportar:false,color:C.green,bg:C.greenBg,border:C.greenBorder },
  "Instalación":  { ver:true,editar:true,eliminar:false,aprobar:false,exportar:false,color:C.orange,bg:C.orangeBg,border:C.orangeBorder },
};

const AREAS = ["Diseño","Corte","Soldadura","Pintura","Instalación","Calidad","Ensamblaje","Tapicería","Carpintería"];

const statusColor = s => ({
  "En producción":{ bg:C.greenBg,text:C.green,border:C.greenBorder },
  "Diseño":{ bg:C.blueBg,text:C.blue,border:C.blueBorder },
  "Instalación":{ bg:C.orangeBg,text:C.orange,border:C.orangeBorder },
  "Atrasado":{ bg:C.redBg,text:C.red,border:C.redBorder },
  "Cotización":{ bg:C.purpleBg,text:C.purple,border:C.purpleBorder },
  "Entregado":{ bg:C.tealBg,text:C.teal,border:C.tealBorder },
}[s]||{ bg:C.bg2,text:C.muted,border:C.border });

const prioColor = p => ({ "Urgente":C.red,"Alta":C.orange,"Media":C.yellow,"Baja":C.green }[p]||C.muted);
const loadColor = l => ({ alta:C.orange,saturado:C.red,baja:C.blue,normal:C.green }[l]||C.muted);
const attendLabel = a => ({ presente:"Presente",atrasado:"Atrasado",instalación:"Instalación",vacaciones:"Vacaciones",ausente:"Ausente" }[a]||a);

const Bar = ({ pct, color=C.accent, h=6 }) => (
  <div style={{ background:C.border,borderRadius:99,height:h,overflow:"hidden" }}>
    <div style={{ width:`${Math.min(pct||0,100)}%`,background:color,height:"100%",borderRadius:99,transition:"width .4s" }} />
  </div>
);

const Badge = ({ label, bg=C.bg2, text=C.muted, border=C.border }) => (
  <span style={{ fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:500,background:bg,color:text,border:`0.5px solid ${border}`,whiteSpace:"nowrap" }}>{label}</span>
);

const Metric = ({ label, value, sub, color }) => (
  <div style={{ background:C.bg2,borderRadius:10,padding:"12px 14px" }}>
    <div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:22,fontWeight:500,color:color||C.text,lineHeight:1 }}>{value}</div>
    {sub&&<div style={{ fontSize:11,color:C.muted,marginTop:3 }}>{sub}</div>}
  </div>
);

const Avatar = ({ initials, size=34, color=C.accent }) => (
  <div style={{ width:size,height:size,borderRadius:size/2,background:`${color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.33,fontWeight:500,color,flexShrink:0 }}>{initials}</div>
);

const Btn = ({ children, onClick, variant="ghost", style={}, disabled=false }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding:"7px 14px",borderRadius:8,border:variant==="primary"?"none":`0.5px solid ${C.border2}`,background:variant==="primary"?C.accent:"transparent",color:variant==="primary"?"#fff":C.muted,cursor:disabled?"not-allowed":"pointer",fontSize:13,fontWeight:variant==="primary"?500:400,opacity:disabled?.5:1,...style }}>{children}</button>
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [user,setUser]=useState(""); const [pass,setPass]=useState(""); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false); const [show,setShow]=useState(false);
  const login = async () => {
    setLoading(true); setErr("");
    await new Promise(r=>setTimeout(r,400));
    const found = SYSTEM_USERS.find(u=>u.user===user.trim()&&u.pass===pass);
    if(found) { try{ await db.insert("audit_log",{ user_name:found.name,user_role:found.role,action:"inició sesión",entity:"Sistema",detail:"Acceso al portal",module:"Auth",device:navigator.userAgent.includes("iPhone")?"iPhone":navigator.userAgent.includes("Android")?"Android":"Computadora" }); }catch(e){} onLogin(found); }
    else { setErr("Usuario o contraseña incorrectos"); setLoading(false); }
  };
  return (
    <div style={{ minHeight:"100vh",background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ width:"100%",maxWidth:380 }}>
        <div style={{ textAlign:"center",marginBottom:32 }}>
          <div style={{ fontFamily:"Georgia,'Times New Roman',serif",fontSize:34,fontWeight:700,color:"#fff",letterSpacing:"-1px" }}>De Metal</div>
          <div style={{ fontSize:10,color:"#444",letterSpacing:"0.16em",textTransform:"uppercase",marginTop:6 }}>Líderes en hierro forjado</div>
          <div style={{ width:40,height:2,background:C.accent,margin:"14px auto 0",borderRadius:1 }} />
        </div>
        <div style={{ background:"#ffffff",border:"0.5px solid #e5e7eb",borderRadius:16,padding:28,display:"flex",flexDirection:"column",gap:16 }}>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <div style={{ width:7,height:7,borderRadius:4,background:C.green }} />
            <span style={{ fontSize:11,color:C.green }}>Base de datos conectada · Supabase</span>
          </div>
          <div><div style={{ fontSize:15,fontWeight:500,color:C.text }}>Acceso al sistema</div><div style={{ fontSize:12,color:C.muted,marginTop:2 }}>Portal operativo · De Metal</div></div>
          <div>
            <div style={{ fontSize:12,color:C.muted,marginBottom:5 }}>Usuario</div>
            <input value={user} onChange={e=>setUser(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="tu.usuario" style={{ width:"100%",borderRadius:8,border:`0.5px solid ${C.border2}`,background:"#111",color:C.text,padding:"10px 13px",fontSize:13,boxSizing:"border-box",outline:"none" }} />
          </div>
          <div>
            <div style={{ fontSize:12,color:C.muted,marginBottom:5 }}>Contraseña</div>
            <div style={{ position:"relative" }}>
              <input value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} type={show?"text":"password"} placeholder="••••••••" style={{ width:"100%",borderRadius:8,border:`0.5px solid ${err?C.redBorder:C.border2}`,background:"#111",color:C.text,padding:"10px 40px 10px 13px",fontSize:13,boxSizing:"border-box",outline:"none" }} />
              <button onClick={()=>setShow(!show)} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14 }}>{show?"🙈":"👁"}</button>
            </div>
          </div>
          {err&&<div style={{ background:C.redBg,border:`0.5px solid ${C.redBorder}`,borderRadius:8,padding:"8px 12px",fontSize:12,color:C.red }}>⚠ {err}</div>}
          <button onClick={login} disabled={!user||!pass||loading} style={{ padding:"12px",borderRadius:8,border:"none",background:C.accent,color:"#fff",cursor:(!user||!pass||loading)?"not-allowed":"pointer",fontSize:14,fontWeight:500,opacity:(!user||!pass||loading)?.6:1 }}>{loading?"Verificando…":"Ingresar al sistema →"}</button>
          <div style={{ borderTop:`0.5px solid ${C.border}`,paddingTop:14 }}>
            <div style={{ fontSize:11,color:C.muted,marginBottom:8 }}>Accesos rápidos:</div>
            {SYSTEM_USERS.map(u=>{ const rp=ROLE_PERMS[u.role]; return(
              <button key={u.id} onClick={()=>{ setUser(u.user); setPass(u.pass); }} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"7px 10px",borderRadius:7,border:`0.5px solid ${C.border}`,background:"transparent",cursor:"pointer",marginBottom:4 }}>
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

// ─── SEARCH ───────────────────────────────────────────────────────────────────
function GlobalSearch({ projects, employees, onProject, onClose }) {
  const [q,setQ]=useState(""); const ref=useRef();
  useEffect(()=>ref.current?.focus(),[]);
  const results = q.length<2?[]:[ ...projects.filter(p=>[p.client,p.id,p.type,p.area,p.status,p.responsible].join(" ").toLowerCase().includes(q.toLowerCase())).map(p=>({ type:"proyecto",label:p.client,sub:`${p.id} · ${p.type} · ${p.status}`,item:p,emoji:"📁" })), ...employees.filter(e=>e.name?.toLowerCase().includes(q.toLowerCase())).map(e=>({ type:"empleado",label:e.name,sub:`${e.role} · ${e.area}`,item:e,emoji:"👷" })) ].slice(0,8);
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:500,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"80px 20px 20px" }}>
      <div style={{ width:"100%",maxWidth:540,background:C.bg2,borderRadius:14,overflow:"hidden",border:`0.5px solid ${C.border}` }}>
        <div style={{ display:"flex",gap:10,padding:"14px 16px",borderBottom:`0.5px solid ${C.border}`,alignItems:"center" }}>
          <span>🔍</span>
          <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar proyectos, clientes, empleados…" style={{ flex:1,background:"none",border:"none",color:C.text,fontSize:15,outline:"none" }} />
          <button onClick={onClose} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18 }}>✕</button>
        </div>
        {q.length<2?<div style={{ padding:"20px",fontSize:13,color:C.muted,textAlign:"center" }}>Escribe para buscar en todo el sistema</div>
        :results.length===0?<div style={{ padding:"20px",fontSize:13,color:C.muted,textAlign:"center" }}>Sin resultados para "{q}"</div>
        :results.map((r,i)=>{ const sc=r.type==="proyecto"?statusColor(r.item.status):{bg:C.bg2,text:C.muted,border:C.border}; return(
          <div key={i} onClick={()=>{ if(r.type==="proyecto") onProject(r.item); onClose(); }} style={{ padding:"12px 16px",borderBottom:`0.5px solid ${C.border}`,cursor:"pointer",display:"flex",gap:12,alignItems:"center" }}
            onMouseEnter={e=>e.currentTarget.style.background="#222"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{ fontSize:20 }}>{r.emoji}</span>
            <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:500,color:C.text }}>{r.label}</div><div style={{ fontSize:11,color:C.muted }}>{r.sub}</div></div>
            {r.type==="proyecto"&&<Badge label={r.item.status} bg={sc.bg} text={sc.text} border={sc.border} />}
          </div>
        );})}
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function NotifPanel({ projects, materials, employees, onClose }) {
  const notifs = [
    ...projects.filter(p=>p.alert).map(p=>({ icon:"⚠️",msg:`${p.client} — entrega ${p.delivery} en riesgo`,color:C.red })),
    ...projects.filter(p=>p.status==="Atrasado").map(p=>({ icon:"🔴",msg:`${p.id} · ${p.client} está atrasado`,color:C.red })),
    ...(materials||[]).filter(m=>["agotado","critico","bajo"].includes(m.status)).map(m=>({ icon:"📦",msg:`${m.name} — ${m.status}`,color:C.orange })),
    ...(employees||[]).filter(e=>e.overtime>10).map(e=>({ icon:"⚡",msg:`${e.name} — ${e.overtime}h extras esta semana`,color:C.yellow })),
  ];
  return (
    <div style={{ position:"absolute",top:48,right:0,width:300,background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:12,boxShadow:"0 8px 32px rgba(0,0,0,.4)",zIndex:300,overflow:"hidden" }}>
      <div style={{ padding:"10px 14px",borderBottom:`0.5px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span style={{ fontSize:13,fontWeight:500,color:C.text }}>Notificaciones</span>
        <button onClick={onClose} style={{ background:"none",border:"none",color:C.muted,cursor:"pointer" }}>✕</button>
      </div>
      {notifs.length===0?<div style={{ padding:"16px",fontSize:12,color:C.muted,textAlign:"center" }}>Sin alertas activas ✓</div>
      :notifs.map((n,i)=>(
        <div key={i} style={{ padding:"9px 14px",borderBottom:`0.5px solid ${C.border}`,display:"flex",gap:8 }}>
          <span>{n.icon}</span>
          <span style={{ fontSize:11,color:n.color,lineHeight:1.5 }}>{n.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ─── PHOTO UPLOADER ───────────────────────────────────────────────────────────
function PhotoUploader({ onPhoto }) {
  const ref=useRef(); const [prev,setPrev]=useState(null);
  const handle=e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>{ setPrev(ev.target.result); onPhoto(ev.target.result); }; r.readAsDataURL(f); };
  return (
    <div>
      <input ref={ref} type="file" accept="image/*" capture="environment" onChange={handle} style={{ display:"none" }} />
      {prev?<div style={{ position:"relative",borderRadius:10,overflow:"hidden" }}><img src={prev} alt="p" style={{ width:"100%",height:140,objectFit:"cover" }} /><button onClick={()=>{ setPrev(null); onPhoto(null); }} style={{ position:"absolute",top:6,right:6,background:"rgba(0,0,0,.7)",border:"none",borderRadius:20,width:24,height:24,color:"#fff",cursor:"pointer" }}>✕</button></div>
      :<div onClick={()=>ref.current.click()} style={{ border:`1.5px dashed ${C.border2}`,borderRadius:10,padding:"16px",textAlign:"center",cursor:"pointer",background:"#111" }} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border2}><div style={{ fontSize:26,marginBottom:5 }}>📷</div><div style={{ fontSize:13,fontWeight:500,color:C.text }}>Subir fotografía del avance</div><div style={{ fontSize:11,color:C.muted,marginTop:2 }}>Toca para tomar foto o seleccionar</div></div>}
    </div>
  );
}

// ─── QUICK UPDATE ─────────────────────────────────────────────────────────────
function QuickUpdate({ project, currentUser, onClose, onSaved }) {
  const [pct,setPct]=useState(project.progress||0); const [area,setArea]=useState(project.phase||"Diseño"); const [note,setNote]=useState(""); const [photo,setPhoto]=useState(null); const [issue,setIssue]=useState(""); const [saving,setSaving]=useState(false); const [saved,setSaved]=useState(false);
  const device=navigator.userAgent.includes("iPhone")?"iPhone":navigator.userAgent.includes("Android")?"Android":"Computadora";
  const save=async()=>{
    setSaving(true);
    try {
      await db.insert("project_logs",{ project_id:project.id,user_name:currentUser.name,user_role:currentUser.role,prev_pct:project.progress||0,new_pct:pct,area,note,issue,device });
      if(photo) await db.insert("project_photos",{ project_id:project.id,storage_url:photo,area,note,pct,issue:issue||null,user_name:currentUser.name });
      await db.update("projects",`id=eq.${project.id}`,{ progress:pct,phase:area,updated_at:new Date().toISOString() });
      await db.insert("audit_log",{ user_name:currentUser.name,user_role:currentUser.role,action:"actualizó avance",entity:`Proyecto ${project.id}`,detail:`${project.progress||0}% → ${pct}% · ${area}${issue?` · ⚠ ${issue}`:""}`,module:"Proyectos",device });
      setSaved(true); setTimeout(()=>{ onSaved(); onClose(); },1100);
    } catch(e){ alert("Error al guardar: "+e.message); setSaving(false); }
  };
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
      <div style={{ background:C.bg2,borderRadius:"16px 16px 0 0",width:"100%",maxWidth:520,padding:22,display:"flex",flexDirection:"column",gap:13,maxHeight:"92vh",overflowY:"auto" }}>
        {saved?<div style={{ textAlign:"center",padding:"24px 0" }}><div style={{ fontSize:36 }}>✅</div><div style={{ fontWeight:500,marginTop:8,color:C.text,fontSize:15 }}>Guardado en Supabase</div><div style={{ fontSize:12,color:C.muted,marginTop:4 }}>Visible para todo el equipo en tiempo real</div></div>
        :<>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}><div><div style={{ fontWeight:500,color:C.text,fontSize:14 }}>Actualizar avance</div><div style={{ fontSize:11,color:C.muted }}>{project.id} · {project.client}</div></div><button onClick={onClose} style={{ background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.muted }}>✕</button></div>
          <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>{AREAS.map(a=><button key={a} onClick={()=>setArea(a)} style={{ padding:"5px 10px",borderRadius:7,border:`0.5px solid ${area===a?C.accent:C.border}`,background:area===a?`${C.accent}22`:"transparent",color:area===a?C.accent:C.muted,cursor:"pointer",fontSize:11 }}>{a}</button>)}</div>
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}><span style={{ fontSize:12,color:C.muted }}>Porcentaje de avance</span><span style={{ fontSize:18,fontWeight:500,color:C.accent }}>{pct}%</span></div>
            <input type="range" min={0} max={100} step={1} value={pct} onChange={e=>setPct(+e.target.value)} style={{ width:"100%" }} />
            <Bar pct={pct} h={8} />
          </div>
          <PhotoUploader onPhoto={setPhoto} />
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="¿Qué se hizo? ¿Qué avanzó?" rows={2} style={{ borderRadius:8,border:`0.5px solid ${C.border2}`,background:"#111",color:C.text,padding:"8px 12px",fontSize:13,resize:"none",width:"100%",boxSizing:"border-box",outline:"none" }} />
          <input value={issue} onChange={e=>setIssue(e.target.value)} placeholder="⚠ Problema o material faltante (opcional)" style={{ borderRadius:8,border:`0.5px solid ${C.border2}`,background:"#111",color:C.text,padding:"8px 12px",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none" }} />
          <div style={{ background:"#111",borderRadius:8,padding:"7px 12px",fontSize:11,color:C.muted,display:"flex",gap:14,flexWrap:"wrap" }}><span>👤 {currentUser.name}</span><span>🎯 {currentUser.role}</span><span>💻 {device}</span></div>
          <button onClick={save} disabled={saving} style={{ padding:"12px",borderRadius:8,border:"none",background:C.accent,color:"#fff",cursor:saving?"not-allowed":"pointer",fontSize:14,fontWeight:500,opacity:saving?.6:1 }}>{saving?"Guardando en base de datos…":"Guardar avance con registro →"}</button>
        </>}
      </div>
    </div>
  );
}

// ─── FLOW APPROVAL ────────────────────────────────────────────────────────────
function FlowApproval({ project, currentUser, onClose, onSaved }) {
  const [sig,setSig]=useState(""); const [saving,setSaving]=useState(false); const [done,setDone]=useState(false);
  const curIdx=FLOW.indexOf(project.status); const nextStatus=FLOW[curIdx+1];
  const required=FLOW_APPROVERS[nextStatus]; const canApprove=currentUser.role===required||currentUser.role==="Administrador";
  const approve=async()=>{
    if(!sig.trim()) return; setSaving(true);
    try {
      await db.insert("project_approvals",{ project_id:project.id,from_status:project.status,to_status:nextStatus,user_name:currentUser.name,user_role:currentUser.role,signature:sig });
      await db.update("projects",`id=eq.${project.id}`,{ status:nextStatus,updated_at:new Date().toISOString() });
      await db.insert("audit_log",{ user_name:currentUser.name,user_role:currentUser.role,action:"aprobó etapa",entity:`Proyecto ${project.id}`,detail:`${project.status} → ${nextStatus} · Firma: ${sig}`,module:"Proyectos",device:"Portal" });
      setDone(true); setSaving(false); setTimeout(()=>{ onSaved(); onClose(); },1100);
    } catch(e){ alert("Error: "+e.message); setSaving(false); }
  };
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:C.bg2,borderRadius:14,width:"100%",maxWidth:460,padding:24,display:"flex",flexDirection:"column",gap:16 }}>
        {done?<div style={{ textAlign:"center",padding:"20px 0" }}><div style={{ fontSize:36 }}>✅</div><div style={{ fontWeight:500,marginTop:8,color:C.text }}>Aprobación guardada</div></div>
        :<>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}><div style={{ fontWeight:500,fontSize:15,color:C.text }}>Avanzar etapa del proyecto</div><button onClick={onClose} style={{ background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.muted }}>✕</button></div>
          <div style={{ fontSize:12,color:C.muted }}>{project.client} · {project.id}</div>
          <div style={{ display:"flex",alignItems:"center",background:"#111",borderRadius:10,padding:12,overflowX:"auto",gap:0 }}>
            {FLOW.map((s,i)=>{ const cur=s===project.status; const past=i<curIdx; const next=s===nextStatus; return(
              <div key={s} style={{ display:"flex",alignItems:"center" }}>
                <div style={{ textAlign:"center",minWidth:74 }}>
                  <div style={{ width:24,height:24,borderRadius:12,background:past?C.greenBg:cur?`${C.accent}33`:next?`${C.blue}22`:"#1a1a1a",border:`1.5px solid ${past?C.green:cur?C.accent:next?C.blue:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 4px",fontSize:11,color:past?C.green:cur?C.accent:next?C.blue:C.muted }}>{past?"✓":cur?"●":next?"→":"○"}</div>
                  <div style={{ fontSize:9,color:cur?C.accent:past?C.green:C.muted,fontWeight:cur?500:400 }}>{s}</div>
                </div>
                {i<FLOW.length-1&&<div style={{ width:14,height:1,background:past?C.green:C.border,flexShrink:0 }} />}
              </div>
            );})}
          </div>
          {!nextStatus?<div style={{ fontSize:13,color:C.muted,textAlign:"center",padding:"10px 0" }}>Este proyecto ya está en la etapa final.</div>
          :!canApprove?<div style={{ background:C.redBg,border:`0.5px solid ${C.redBorder}`,borderRadius:10,padding:"12px 14px",fontSize:13,color:C.red }}>⚠ Solo un <b>{required}</b> puede aprobar este avance. Tu rol es {currentUser.role}.</div>
          :<>
            <div style={{ background:"#111",borderRadius:10,padding:"11px 14px" }}><div style={{ fontSize:13,fontWeight:500,color:C.text }}>{project.status} → {nextStatus}</div><div style={{ fontSize:11,color:C.muted,marginTop:2 }}>Aprobación requerida por: <b style={{ color:C.text }}>{required}</b></div></div>
            <div>
              <div style={{ fontSize:12,color:C.muted,marginBottom:6 }}>Firma digital — escribe tu nombre completo para confirmar</div>
              <input value={sig} onChange={e=>setSig(e.target.value)} placeholder={`Firma: ${currentUser.name}`} style={{ width:"100%",borderRadius:8,border:`0.5px solid ${sig?C.accent:C.border2}`,background:"#111",color:C.text,padding:"10px 12px",fontSize:13,boxSizing:"border-box",fontStyle:"italic",outline:"none" }} />
            </div>
            <button onClick={approve} disabled={!sig.trim()||saving} style={{ padding:"12px",borderRadius:8,border:"none",background:C.accent,color:"#fff",cursor:(!sig.trim()||saving)?"not-allowed":"pointer",fontSize:14,fontWeight:500,opacity:(!sig.trim()||saving)?.6:1 }}>{saving?"Registrando aprobación…":"Aprobar y avanzar etapa →"}</button>
          </>}
        </>}
      </div>
    </div>
  );
}

// ─── NEW PROJECT MODAL ────────────────────────────────────────────────────────
function NewProjectModal({ onClose, onSaved, currentUser }) {
  const [form,setForm]=useState({ client:"",type:"",area:"",delivery:"",responsible:"",priority:"Alta",budget:"",status:"Cotización",phase:"Diseño" });
  const [saving,setSaving]=useState(false);
  const set=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  const create=async()=>{
    if(!form.client||!form.type) return;
    setSaving(true);
    try {
      const id=`DM-${Date.now().toString().slice(-4)}`;
      const token=`tok-${id.toLowerCase()}`;
      await db.insert("projects",{ id,client:form.client,type:form.type,area:form.area,delivery:form.delivery||null,responsible:form.responsible,priority:form.priority,status:form.status,phase:form.phase,budget:parseInt(form.budget)||0,alert:false,client_token:token });
      await db.insert("audit_log",{ user_name:currentUser.name,user_role:currentUser.role,action:"creó proyecto",entity:id,detail:`${form.client} · ${form.type} · $${parseInt(form.budget||0).toLocaleString()}`,module:"Proyectos",device:"Portal" });
      onSaved(); onClose();
    } catch(e){ alert("Error: "+e.message); setSaving(false); }
  };
  const inp=(k,label,type="text",opts=null)=>(
    <div>
      <div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>{label}</div>
      {opts?<select value={form[k]} onChange={set(k)} style={{ width:"100%",borderRadius:8,border:`0.5px solid ${C.border2}`,background:"#111",color:C.text,padding:"8px 11px",fontSize:13,outline:"none" }}>{opts.map(o=><option key={o}>{o}</option>)}</select>
      :<input value={form[k]} onChange={set(k)} type={type} style={{ width:"100%",borderRadius:8,border:`0.5px solid ${C.border2}`,background:"#111",color:C.text,padding:"8px 11px",fontSize:13,boxSizing:"border-box",outline:"none" }} />}
    </div>
  );
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:C.bg2,borderRadius:14,width:"100%",maxWidth:500,padding:24,display:"flex",flexDirection:"column",gap:14,maxHeight:"92vh",overflowY:"auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}><div style={{ fontWeight:500,fontSize:15,color:C.text }}>Nuevo proyecto</div><button onClick={onClose} style={{ background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.muted }}>✕</button></div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          {inp("client","Cliente *")}
          {inp("type","Tipo de proyecto *")}
          {inp("area","Ubicación / Dirección")}
          {inp("delivery","Fecha de entrega","date")}
          {inp("responsible","Responsable")}
          {inp("budget","Presupuesto (MXN)","number")}
          {inp("priority","Prioridad","text",["Alta","Media","Baja","Urgente"])}
          {inp("status","Estado inicial","text",["Cotización","Diseño","En producción"])}
        </div>
        <div style={{ display:"flex",gap:8,justifyContent:"flex-end",marginTop:4 }}>
          <Btn onClick={onClose}>Cancelar</Btn>
          <button onClick={create} disabled={!form.client||!form.type||saving} style={{ padding:"9px 20px",borderRadius:8,border:"none",background:C.accent,color:"#fff",cursor:(!form.client||!form.type||saving)?"not-allowed":"pointer",fontSize:13,fontWeight:500,opacity:(!form.client||!form.type||saving)?.6:1 }}>{saving?"Guardando…":"Crear proyecto →"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── KANBAN ───────────────────────────────────────────────────────────────────
function KanbanView({ projects, onProject }) {
  return (
    <div style={{ display:"flex",gap:10,overflowX:"auto",paddingBottom:10 }}>
      {FLOW.map(col=>{ const sc=statusColor(col); const colP=projects.filter(p=>p.status===col); return(
        <div key={col} style={{ minWidth:195,flex:"0 0 195px",display:"flex",flexDirection:"column",gap:8 }}>
          <div style={{ padding:"8px 12px",background:sc.bg,border:`0.5px solid ${sc.border}`,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ fontSize:12,fontWeight:500,color:sc.text }}>{col}</span>
            <span style={{ fontSize:11,color:sc.text,opacity:.7 }}>{colP.length}</span>
          </div>
          {colP.map(p=>(
            <div key={p.id} onClick={()=>onProject(p)} style={{ background:C.bg2,border:`0.5px solid ${p.alert?C.redBorder:C.border}`,borderRadius:10,padding:"12px",cursor:"pointer",display:"flex",flexDirection:"column",gap:8 }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=p.alert?C.redBorder:C.border}>
              <div style={{ fontSize:12,fontWeight:500,color:C.text }}>{p.client} {p.alert&&<span style={{ color:C.red,fontSize:10 }}>⚠</span>}</div>
              <div style={{ fontSize:10,color:C.muted }}>{p.id} · {p.type}</div>
              <Bar pct={p.progress||0} color={p.alert?C.red:C.accent} h={4} />
              <div style={{ display:"flex",justifyContent:"space-between" }}>
                <span style={{ fontSize:10,color:C.muted }}>{p.progress||0}%</span>
                <span style={{ fontSize:10,color:prioColor(p.priority),fontWeight:500 }}>{p.priority}</span>
              </div>
            </div>
          ))}
          {colP.length===0&&<div style={{ border:`1px dashed ${C.border}`,borderRadius:10,padding:"22px 12px",textAlign:"center",fontSize:11,color:C.muted }}>Sin proyectos</div>}
        </div>
      );})}
    </div>
  );
}

// ─── METRICS ─────────────────────────────────────────────────────────────────
function MetricsView({ projects }) {
  const total=projects.length; const entregados=projects.filter(p=>p.status==="Entregado").length; const atrasados=projects.filter(p=>p.alert).length;
  const totalBudget=projects.reduce((a,p)=>a+(p.budget||0),0);
  const avgProgress=total?Math.round(projects.reduce((a,p)=>a+(p.progress||0),0)/total):0;
  const byStatus=FLOW.map(s=>({ s,count:projects.filter(p=>p.status===s).length }));
  const maxC=Math.max(...byStatus.map(b=>b.count),1);
  const byResp=[...new Set(projects.map(p=>p.responsible).filter(Boolean))].map(r=>{ const rp=projects.filter(p=>p.responsible===r); return { name:r,count:rp.length,avg:Math.round(rp.reduce((a,p)=>a+(p.progress||0),0)/rp.length) }; });
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div><h2 style={{ margin:0,fontSize:17,fontWeight:500,color:C.text }}>Métricas históricas</h2><div style={{ fontSize:12,color:C.muted }}>Análisis de rendimiento operativo</div></div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10 }}>
        <Metric label="Total proyectos" value={total} />
        <Metric label="Entregados" value={entregados} color={C.green} sub={`${total?Math.round(entregados/total*100):0}% tasa`} />
        <Metric label="Con alerta" value={atrasados} color={C.red} />
        <Metric label="Avance promedio" value={`${avgProgress}%`} color={C.accent} />
        <Metric label="Presupuesto total" value={`$${(totalBudget/1000).toFixed(0)}K`} color={C.purple} sub="MXN" />
      </div>
      <div style={{ background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:12,padding:16 }}>
        <div style={{ fontSize:13,fontWeight:500,color:C.text,marginBottom:14 }}>Distribución por etapa</div>
        <div style={{ display:"flex",gap:10,alignItems:"flex-end",height:110 }}>
          {byStatus.map(b=>{ const sc=statusColor(b.s); const h=Math.round((b.count/maxC)*85)+8; return(
            <div key={b.s} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5 }}>
              <span style={{ fontSize:12,fontWeight:500,color:sc.text }}>{b.count}</span>
              <div style={{ width:"100%",background:sc.bg,border:`0.5px solid ${sc.border}`,borderRadius:"5px 5px 0 0",height:h }} />
              <span style={{ fontSize:9,color:C.muted,textAlign:"center",lineHeight:1.3 }}>{b.s}</span>
            </div>
          );})}
        </div>
      </div>
      <div style={{ background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
        <div style={{ padding:"11px 15px",borderBottom:`0.5px solid ${C.border}`,fontSize:13,fontWeight:500,color:C.text }}>Eficiencia por responsable</div>
        {byResp.length===0?<div style={{ padding:16,fontSize:12,color:C.muted }}>Sin datos aún.</div>
        :byResp.map(r=>(
          <div key={r.name} style={{ padding:"11px 15px",borderBottom:`0.5px solid ${C.border}` }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
              <span style={{ fontSize:13,fontWeight:500,color:C.text }}>{r.name}</span>
              <span style={{ fontSize:12,color:r.avg>=70?C.green:C.orange,fontWeight:500 }}>{r.avg}% prom · {r.count} proyectos</span>
            </div>
            <Bar pct={r.avg} color={r.avg>=70?C.green:C.orange} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── QUOTES ──────────────────────────────────────────────────────────────────
function QuotesView({ onConvertToProject, currentUser }) {
  const [quotes,setQuotes]=useState([]); const [loading,setLoading]=useState(true); const [modal,setModal]=useState(false);
  const [newQ,setNewQ]=useState({ client:"",type:"",area:"",notes:"",items:[{ desc:"",qty:1,unit:0 }] });
  const load=async()=>{ try{ const q=await db.get("quotes","select=*"); setQuotes(q||[]); }catch(e){} setLoading(false); };
  useEffect(()=>{ load(); },[]);
  const total=newQ.items.reduce((a,i)=>a+i.qty*i.unit,0);
  const addItem=()=>setNewQ(q=>({...q,items:[...q.items,{ desc:"",qty:1,unit:0 }]}));
  const setItem=(i,k,v)=>setNewQ(q=>({...q,items:q.items.map((it,j)=>j===i?{...it,[k]:k==="qty"||k==="unit"?+v:v}:it)}));
  const create=async()=>{
    const id=`COT-${String(quotes.length+1).padStart(3,"0")}`;
    await db.insert("quotes",{ id,client:newQ.client,type:newQ.type,area:newQ.area,notes:newQ.notes,total,status:"pendiente",approved:false,items:JSON.stringify(newQ.items) });
    setModal(false); load();
  };
  const approve=async(q)=>{ await db.update("quotes",`id=eq.${q.id}`,{ approved:true,status:"aprobada" }); load(); };
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div><h2 style={{ margin:0,fontSize:17,fontWeight:500,color:C.text }}>Cotizaciones</h2><div style={{ fontSize:12,color:C.muted }}>Ciclo completo: cotización → aprobación → proyecto</div></div>
        <button onClick={()=>setModal(true)} style={{ padding:"8px 16px",borderRadius:8,border:"none",background:C.accent,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:500 }}>+ Nueva cotización</button>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10 }}>
        <Metric label="Total" value={quotes.length} />
        <Metric label="Pendientes" value={quotes.filter(q=>!q.approved).length} color={C.yellow} />
        <Metric label="Aprobadas" value={quotes.filter(q=>q.approved).length} color={C.green} />
        <Metric label="Valor total" value={`$${quotes.reduce((a,q)=>a+(q.total||0),0).toLocaleString()}`} color={C.accent} />
      </div>
      {loading?<div style={{ fontSize:13,color:C.muted }}>Cargando…</div>
      :quotes.length===0?<div style={{ fontSize:13,color:C.muted,padding:"20px 0",textAlign:"center" }}>Sin cotizaciones aún. Crea la primera.</div>
      :quotes.map(q=>(
        <div key={q.id} style={{ background:C.bg2,border:`0.5px solid ${q.approved?C.greenBorder:C.border}`,borderRadius:12,padding:"14px 18px" }}>
          <div style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:4 }}><span style={{ fontWeight:500,fontSize:14,color:C.text }}>{q.client}</span><Badge label={q.approved?"Aprobada":"Pendiente"} bg={q.approved?C.greenBg:C.yellowBg} text={q.approved?C.green:C.yellow} border={q.approved?C.greenBorder:C.yellowBorder} /></div>
              <div style={{ fontSize:11,color:C.muted,marginBottom:6 }}>{q.id} · {q.type} · {q.date}</div>
              {q.notes&&<div style={{ fontSize:11,color:C.muted }}>{q.notes}</div>}
            </div>
            <div style={{ textAlign:"right",flexShrink:0 }}>
              <div style={{ fontSize:20,fontWeight:500,color:C.accent }}>${(q.total||0).toLocaleString()}</div>
              <div style={{ fontSize:10,color:C.muted }}>MXN</div>
              <div style={{ display:"flex",gap:5,marginTop:8,justifyContent:"flex-end",flexWrap:"wrap" }}>
                {!q.approved&&<button onClick={()=>approve(q)} style={{ fontSize:11,padding:"4px 10px",borderRadius:6,border:`0.5px solid ${C.green}`,background:`${C.green}11`,color:C.green,cursor:"pointer" }}>✓ Aprobar</button>}
                <button onClick={()=>onConvertToProject(q)} style={{ fontSize:11,padding:"4px 10px",borderRadius:6,border:`0.5px solid ${C.accent}`,background:`${C.accent}11`,color:C.accent,cursor:"pointer" }}>→ Crear proyecto</button>
              </div>
            </div>
          </div>
        </div>
      ))}
      {modal&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div style={{ background:C.bg2,borderRadius:14,width:"100%",maxWidth:500,padding:24,display:"flex",flexDirection:"column",gap:14,maxHeight:"92vh",overflowY:"auto" }}>
            <div style={{ display:"flex",justifyContent:"space-between" }}><div style={{ fontWeight:500,fontSize:15,color:C.text }}>Nueva cotización</div><button onClick={()=>setModal(false)} style={{ background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.muted }}>✕</button></div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
              {[["client","Cliente *"],["type","Tipo *"],["area","Ubicación"]].map(([k,l])=>(
                <div key={k}><div style={{ fontSize:11,color:C.muted,marginBottom:4 }}>{l}</div><input value={newQ[k]} onChange={e=>setNewQ(q=>({...q,[k]:e.target.value}))} style={{ width:"100%",borderRadius:8,border:`0.5px solid ${C.border2}`,background:"#111",color:C.text,padding:"8px 11px",fontSize:13,boxSizing:"border-box",outline:"none" }} /></div>
              ))}
            </div>
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}><span style={{ fontSize:12,color:C.muted }}>Partidas</span><button onClick={addItem} style={{ fontSize:11,color:C.accent,background:"none",border:"none",cursor:"pointer" }}>+ Agregar línea</button></div>
              {newQ.items.map((it,i)=>(
                <div key={i} style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:6,marginBottom:6 }}>
                  <input value={it.desc} onChange={e=>setItem(i,"desc",e.target.value)} placeholder="Descripción" style={{ borderRadius:7,border:`0.5px solid ${C.border2}`,background:"#111",color:C.text,padding:"7px 10px",fontSize:12,boxSizing:"border-box",outline:"none" }} />
                  <input type="number" value={it.qty} onChange={e=>setItem(i,"qty",e.target.value)} placeholder="Cant." style={{ borderRadius:7,border:`0.5px solid ${C.border2}`,background:"#111",color:C.text,padding:"7px 10px",fontSize:12,boxSizing:"border-box",outline:"none" }} />
                  <input type="number" value={it.unit} onChange={e=>setItem(i,"unit",e.target.value)} placeholder="Precio" style={{ borderRadius:7,border:`0.5px solid ${C.border2}`,background:"#111",color:C.text,padding:"7px 10px",fontSize:12,boxSizing:"border-box",outline:"none" }} />
                </div>
              ))}
              <div style={{ textAlign:"right",fontSize:14,fontWeight:500,color:C.accent,marginTop:4 }}>Total: ${total.toLocaleString()} MXN</div>
            </div>
            <textarea value={newQ.notes} onChange={e=>setNewQ(q=>({...q,notes:e.target.value}))} placeholder="Notas adicionales" rows={2} style={{ borderRadius:8,border:`0.5px solid ${C.border2}`,background:"#111",color:C.text,padding:"8px 12px",fontSize:13,resize:"none",boxSizing:"border-box",width:"100%",outline:"none" }} />
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              <Btn onClick={()=>setModal(false)}>Cancelar</Btn>
              <button onClick={create} disabled={!newQ.client||!newQ.type} style={{ padding:"9px 20px",borderRadius:8,border:"none",background:C.accent,color:"#fff",cursor:(!newQ.client||!newQ.type)?"not-allowed":"pointer",fontSize:13,fontWeight:500,opacity:(!newQ.client||!newQ.type)?.6:1 }}>Guardar cotización →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI ASSISTANT ─────────────────────────────────────────────────────────────
function AIAssistant({ projects, employees, materials, currentUser }) {
  const [messages,setMessages]=useState([{ role:"assistant",content:`Hola ${currentUser.name.split(" ")[0]}. Tengo acceso a ${projects.length} proyectos reales desde Supabase. ¿En qué te ayudo?` }]);
  const [input,setInput]=useState(""); const [loading,setLoading]=useState(false);
  const SUGGESTIONS=["¿Qué proyecto tiene mayor riesgo esta semana?","¿Qué debo priorizar hoy?","Genera un resumen ejecutivo de producción","¿Qué áreas están causando retrasos?","¿Qué materiales debo comprar urgente?"];
  const CTX=`Eres el asistente operativo interno de "De Metal", fábrica premium de barandales, portones, muebles metálicos y estructuras decorativas en San Pedro Sula, Honduras. Slogan: "Líderes en hierro forjado".

DATOS REALES DEL SISTEMA:
PROYECTOS (${projects.length}): ${projects.map(p=>`${p.id}|${p.client}|${p.status}|${p.progress||0}%|entrega:${p.delivery||"sin fecha"}|resp:${p.responsible||"—"}|${p.alert?"⚠ALERTA URGENTE":""}`).join(" // ")}
EMPLEADOS (${employees.length}): ${employees.map(e=>`${e.name}|${e.role}|${e.area}|efic:${e.efficiency||80}%|carga:${e.load}`).join(" // ")}
MATERIALES CRÍTICOS: ${materials.filter(m=>m.status!=="ok").map(m=>`${m.name}|${m.status}|stock:${m.stock}${m.unit}`).join(" // ")||"ninguno"}
USUARIO ACTIVO: ${currentUser.name} (${currentUser.role})

Responde siempre en español. Sé directo, concreto y operativo. Usa los datos reales del sistema. Máximo 180 palabras por respuesta.`;

  const send=async(text)=>{ const q=text||input.trim(); if(!q||loading) return; setInput(""); const msgs=[...messages,{ role:"user",content:q }]; setMessages(msgs); setLoading(true);
    try { const res=await fetch("https://api.anthropic.com/v1/messages",{ method:"POST",headers:{ "Content-Type":"application/json" },body:JSON.stringify({ model:"claude-sonnet-4-20250514",max_tokens:600,system:CTX,messages:msgs.map(m=>({ role:m.role,content:m.content })) }) }); const data=await res.json(); setMessages(prev=>[...prev,{ role:"assistant",content:data.content?.[0]?.text||"Error en la respuesta." }]); } catch{ setMessages(prev=>[...prev,{ role:"assistant",content:"Error de conexión. Intenta de nuevo." }]); } setLoading(false); };

  const fmt=t=>t.split("\n").map((l,i)=><div key={i} style={{ marginBottom:l?2:5,color:C.text }} dangerouslySetInnerHTML={{ __html:l.replace(/\*\*(.*?)\*\*/g,"<b>$1</b>")||"&nbsp;" }} />);

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14,height:"calc(100vh - 100px)",maxHeight:680 }}>
      <div>
        <h2 style={{ margin:0,fontSize:17,fontWeight:500,color:C.text,display:"flex",gap:10,alignItems:"center" }}>
          🤖 Asistente IA <Badge label="● En línea" bg={C.greenBg} text={C.green} border={C.greenBorder} />
        </h2>
        <div style={{ fontSize:12,color:C.muted,marginTop:3 }}>Conectado a Supabase · {projects.length} proyectos · {employees.length} empleados · datos en tiempo real</div>
      </div>
      <div style={{ flex:1,background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:12,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{ flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:12 }}>
          {messages.map((m,i)=>(
            <div key={i} style={{ display:"flex",gap:8,alignItems:"flex-start",flexDirection:m.role==="user"?"row-reverse":"row" }}>
              {m.role==="assistant"?<div style={{ width:30,height:30,borderRadius:8,background:`${C.accent}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0 }}>🤖</div>
              :<Avatar initials={currentUser.avatar} size={30} color={currentUser.color} />}
              <div style={{ maxWidth:"76%",background:m.role==="user"?`${C.accent}22`:C.bg3,border:`0.5px solid ${m.role==="user"?`${C.accent}44`:C.border}`,borderRadius:m.role==="user"?"12px 4px 12px 12px":"4px 12px 12px 12px",padding:"10px 14px",fontSize:13,lineHeight:1.6 }}>{fmt(m.content)}</div>
            </div>
          ))}
          {loading&&<div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <div style={{ width:30,height:30,borderRadius:8,background:`${C.accent}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15 }}>🤖</div>
            <div style={{ background:C.bg3,border:`0.5px solid ${C.border}`,borderRadius:"4px 12px 12px 12px",padding:"10px 14px",display:"flex",gap:5 }}>{[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:3,background:C.accent,animation:`pulse 1.2s ${i*.2}s infinite` }} />)}</div>
          </div>}
        </div>
        {messages.length<=1&&(
          <div style={{ padding:"0 14px 12px",display:"flex",gap:5,flexWrap:"wrap" }}>
            {SUGGESTIONS.map((s,i)=><button key={i} onClick={()=>send(s)} style={{ fontSize:11,padding:"5px 10px",borderRadius:8,border:`0.5px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer",textAlign:"left" }}>{s}</button>)}
          </div>
        )}
        <div style={{ padding:"11px 14px",borderTop:`0.5px solid ${C.border}`,display:"flex",gap:8 }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Pregunta sobre proyectos, empleados, materiales o producción…" style={{ flex:1,borderRadius:8,border:`0.5px solid ${C.border2}`,background:"#111",color:C.text,padding:"9px 13px",fontSize:13,outline:"none" }} />
          <button onClick={()=>send()} disabled={!input.trim()||loading} style={{ padding:"9px 16px",borderRadius:8,border:"none",background:input.trim()&&!loading?C.accent:"#222",color:input.trim()&&!loading?"#fff":C.muted,cursor:input.trim()&&!loading?"pointer":"not-allowed",fontSize:13,fontWeight:500 }}>{loading?"…":"→"}</button>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

// ─── PROJECT DETAIL ───────────────────────────────────────────────────────────
function ProjectDetail({ project, onBack, onUpdate, onFlow, currentUser, logs, photos }) {
  const [tab,setTab]=useState("info"); const sc=statusColor(project.status); const rp=ROLE_PERMS[currentUser.role]||ROLE_PERMS["Instalación"];
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
      <div style={{ display:"flex",gap:10,alignItems:"flex-start",flexWrap:"wrap" }}>
        <Btn onClick={onBack}>← Volver</Btn>
        <div style={{ flex:1,minWidth:200 }}>
          <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
            <span style={{ fontSize:16,fontWeight:500,color:C.text }}>{project.client}</span>
            <Badge label={project.status} bg={sc.bg} text={sc.text} border={sc.border} />
            {project.alert&&<Badge label="⚠ ALERTA" bg={C.redBg} text={C.red} border={C.redBorder} />}
          </div>
          <div style={{ fontSize:12,color:C.muted,marginTop:3 }}>{project.id} · {project.type}</div>
        </div>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
          {rp.editar&&<button onClick={()=>onUpdate(project)} style={{ padding:"7px 13px",borderRadius:8,border:`0.5px solid ${C.accent}`,background:`${C.accent}11`,color:C.accent,cursor:"pointer",fontSize:13 }}>📷 Actualizar</button>}
          <button onClick={()=>onFlow(project)} style={{ padding:"7px 13px",borderRadius:8,border:`0.5px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer",fontSize:13 }}>→ Avanzar etapa</button>
        </div>
      </div>

      <div style={{ background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:12,padding:"14px 18px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:10 }}><span style={{ fontSize:13,color:C.muted }}>Avance general</span><span style={{ fontSize:22,fontWeight:500,color:C.accent }}>{project.progress||0}%</span></div>
        <Bar pct={project.progress||0} h={12} color={project.alert?C.red:C.accent} />
        <div style={{ display:"flex",gap:0,marginTop:14,overflowX:"auto" }}>
          {FLOW.map((s,i)=>{ const cur=s===project.status; const past=FLOW.indexOf(s)<FLOW.indexOf(project.status); return(
            <div key={s} style={{ display:"flex",alignItems:"center" }}>
              <div style={{ textAlign:"center",minWidth:80 }}>
                <div style={{ width:24,height:24,borderRadius:12,background:past?C.greenBg:cur?`${C.accent}33`:C.bg3,border:`1.5px solid ${past?C.green:cur?C.accent:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 4px",fontSize:11,color:past?C.green:cur?C.accent:C.muted }}>{past?"✓":cur?"●":"○"}</div>
                <div style={{ fontSize:9,color:cur?C.accent:past?C.green:C.muted,fontWeight:cur?500:400 }}>{s}</div>
              </div>
              {i<FLOW.length-1&&<div style={{ width:16,height:1,background:past?C.green:C.border,flexShrink:0 }} />}
            </div>
          );})}
        </div>
      </div>

      <div style={{ display:"flex",gap:0,borderBottom:`0.5px solid ${C.border}` }}>
        {[["info","Info"],["fotos",`Fotos (${photos.length})`],["historial",`Historial (${logs.length})`]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:"8px 16px",border:"none",background:"none",cursor:"pointer",fontSize:13,color:tab===id?C.accent:C.muted,fontWeight:tab===id?500:400,borderBottom:`2px solid ${tab===id?C.accent:"transparent"}` }}>{label}</button>
        ))}
      </div>

      {tab==="info"&&(
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          {[["Cliente",project.client],["Código",project.id],["Tipo",project.type||"—"],["Área",project.area||"—"],["Entrega",project.delivery||"—"],["Responsable",project.responsible||"—"],["Fase actual",project.phase||"—"],["Presupuesto",`$${(project.budget||0).toLocaleString()} MXN`]].map(([k,v])=>(
            <div key={k} style={{ background:C.bg2,borderRadius:8,padding:"10px 13px" }}><div style={{ fontSize:10,color:C.muted,marginBottom:3 }}>{k}</div><div style={{ fontSize:13,fontWeight:500,color:C.text }}>{v}</div></div>
          ))}
        </div>
      )}

      {tab==="fotos"&&(
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {photos.length===0?<div style={{ border:`1px dashed ${C.border2}`,borderRadius:12,padding:"32px",textAlign:"center",color:C.muted }}><div style={{ fontSize:32,marginBottom:8 }}>📷</div><div>Sin fotos aún. Usa "Actualizar" para subir la primera.</div></div>
          :photos.map((ph,i)=>(
            <div key={i} style={{ background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
              <img src={ph.storage_url} alt={`avance ${i+1}`} style={{ width:"100%",maxHeight:220,objectFit:"cover",display:"block" }} />
              <div style={{ padding:"10px 14px" }}>
                <div style={{ fontSize:12,fontWeight:500,color:C.text }}>{ph.area} — {ph.note||"Sin comentario"}</div>
                <div style={{ fontSize:11,color:C.muted,marginTop:2 }}>📷 {ph.user_name} · {ph.pct}% avance · {new Date(ph.created_at).toLocaleDateString("es-MX")}</div>
                {ph.issue&&<div style={{ fontSize:11,color:C.orange,marginTop:3 }}>⚠ {ph.issue}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="historial"&&(
        <div style={{ position:"relative",paddingLeft:20 }}>
          <div style={{ position:"absolute",left:8,top:0,bottom:0,width:1,background:C.border }} />
          {logs.length===0?<div style={{ fontSize:13,color:C.muted,padding:"12px 0" }}>Sin cambios registrados aún.</div>
          :logs.map((l,i)=>(
            <div key={i} style={{ position:"relative",marginBottom:12 }}>
              <div style={{ position:"absolute",left:-17,top:8,width:10,height:10,borderRadius:5,background:C.accent,border:`2px solid ${C.bg3}` }} />
              <div style={{ background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                  <span style={{ fontSize:12,fontWeight:500,color:C.accent }}>{l.user_name} · {l.user_role}</span>
                  <span style={{ fontSize:11,color:C.muted }}>{new Date(l.created_at).toLocaleString("es-MX")}</span>
                </div>
                <div style={{ fontSize:12,color:C.muted }}>Avance: <b style={{ color:C.text }}>{l.prev_pct}% → {l.new_pct}%</b> · {l.area}</div>
                {l.note&&<div style={{ fontSize:11,color:C.muted,marginTop:3 }}>"{l.note}"</div>}
                {l.issue&&<div style={{ fontSize:11,color:C.orange,marginTop:3 }}>⚠ {l.issue}</div>}
                <div style={{ fontSize:10,color:C.muted,marginTop:3 }}>💻 {l.device}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser,setCurrentUser]=useState(null);
  const [nav,setNav]=useState("dashboard");
  const [view,setView]=useState("list");
  const [selProject,setSelProject]=useState(null);
  const [updateProject,setUpdateProject]=useState(null);
  const [flowProject,setFlowProject]=useState(null);
  const [newProjectModal,setNewProjectModal]=useState(false);
  const [showSearch,setShowSearch]=useState(false);
  const [showNotifs,setShowNotifs]=useState(false);
  const [sidebar,setSidebar]=useState(true);
  const [projects,setProjects]=useState([]);
  const [employees,setEmployees]=useState([]);
  const [materials,setMaterials]=useState([]);
  const [auditLog,setAuditLog]=useState([]);
  const [projLogs,setProjLogs]=useState([]);
  const [projPhotos,setProjPhotos]=useState([]);
  const [loading,setLoading]=useState(false);
  const [isOnline,setIsOnline]=useState(navigator.onLine);

  useEffect(()=>{ const on=()=>setIsOnline(true); const off=()=>setIsOnline(false); window.addEventListener("online",on); window.addEventListener("offline",off); return()=>{ window.removeEventListener("online",on); window.removeEventListener("offline",off); }; },[]);
  useEffect(()=>{ const h=e=>{ if((e.metaKey||e.ctrlKey)&&e.key==="k"){ e.preventDefault(); setShowSearch(true); } }; window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h); },[]);
  useEffect(()=>{ try{ const s=localStorage.getItem("dm_session"); if(s){ const u=JSON.parse(s); const found=SYSTEM_USERS.find(x=>x.id===u.id); if(found) setCurrentUser(found); } }catch(e){} },[]);

  const loadData=async()=>{
    setLoading(true);
    try {
      const [p,e,m,a]=await Promise.all([db.get("projects","select=*"),db.get("employees","select=*"),db.get("materials","select=*"),db.get("audit_log","select=*&limit=50")]);
      setProjects(p||[]); setEmployees(e||[]); setMaterials(m||[]); setAuditLog(a||[]);
    } catch(e){ console.error("DB Error:",e.message); }
    setLoading(false);
  };

  const loadProjectDetails=async(projectId)=>{
    try {
      const [logs,photos]=await Promise.all([db.get("project_logs",`select=*&project_id=eq.${projectId}`),db.get("project_photos",`select=*&project_id=eq.${projectId}`)]);
      setProjLogs(logs||[]); setProjPhotos(photos||[]);
    } catch(e){}
  };

  useEffect(()=>{ if(currentUser) loadData(); },[currentUser]);
  useEffect(()=>{ if(selProject) loadProjectDetails(selProject.id); },[selProject]);

  const handleLogin=u=>{ setCurrentUser(u); try{ localStorage.setItem("dm_session",JSON.stringify({ id:u.id })); }catch(e){} };
  const handleLogout=()=>{ setCurrentUser(null); try{ localStorage.removeItem("dm_session"); }catch(e){} setProjects([]); };

  const convertQuoteToProject=async(q)=>{
    const id=`DM-${Date.now().toString().slice(-4)}`;
    await db.insert("projects",{ id,client:q.client,type:q.type,area:q.area||"",delivery:"",responsible:"",priority:"Media",status:"Cotización",phase:"Diseño",budget:q.total||0,alert:false,client_token:`tok-${id.toLowerCase()}` });
    loadData(); setNav("projects");
  };

  if(!currentUser) return <LoginScreen onLogin={handleLogin} />;

  const rp=ROLE_PERMS[currentUser.role]||ROLE_PERMS["Instalación"];
  const notifCount=projects.filter(p=>p.alert).length+materials.filter(m=>["agotado","critico"].includes(m.status)).length;

  const navItems=[
    { id:"dashboard",emoji:"▦",label:"Dashboard" },
    { id:"projects",emoji:"📁",label:"Proyectos" },
    { id:"quotes",emoji:"📋",label:"Cotizaciones" },
    { id:"employees",emoji:"👷",label:"Empleados" },
    { id:"materials",emoji:"📦",label:"Materiales" },
    { id:"metrics",emoji:"📈",label:"Métricas" },
    { id:"audit",emoji:"🔍",label:"Bitácora" },
    { id:"ai",emoji:"🤖",label:"Asistente IA" },
  ];

  const renderContent=()=>{
    if(loading) return <div style={{ display:"flex",alignItems:"center",justifyContent:"center",padding:60,color:C.muted,fontSize:14 }}>⏳ Cargando desde Supabase…</div>;

    if(nav==="dashboard") return (
      <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10 }}>
          <div><h2 style={{ margin:0,fontSize:17,fontWeight:500,color:C.text }}>Bienvenido, {currentUser.name.split(" ")[0]}</h2><div style={{ fontSize:12,color:C.muted }}>{new Date().toLocaleDateString("es-MX",{ weekday:"long",day:"numeric",month:"long",year:"numeric" })}</div></div>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <div style={{ width:7,height:7,borderRadius:4,background:isOnline?C.green:C.red }} />
            <span style={{ fontSize:11,color:C.muted }}>{isOnline?"Supabase activo":"Sin conexión"}</span>
            <button onClick={loadData} style={{ fontSize:11,padding:"4px 10px",borderRadius:6,border:`0.5px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer" }}>↻ Actualizar</button>
          </div>
        </div>
        {projects.filter(p=>p.alert).map(p=>(
          <div key={p.id} onClick={()=>{ setSelProject(p); setNav("projects"); }} style={{ background:C.redBg,border:`0.5px solid ${C.redBorder}`,borderRadius:9,padding:"9px 14px",cursor:"pointer",display:"flex",gap:10,alignItems:"center" }}>
            <span style={{ fontSize:13 }}>⚠</span>
            <span style={{ fontSize:12,color:C.redText }}><b>{p.id}</b> · {p.client} — entrega {p.delivery} · {p.phase}</span>
          </div>
        ))}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10 }}>
          <Metric label="Proyectos" value={projects.length} />
          <Metric label="Avance prom." value={`${projects.length?Math.round(projects.reduce((a,p)=>a+(p.progress||0),0)/projects.length):0}%`} color={C.accent} />
          <Metric label="Empleados" value={employees.length} color={C.green} />
          <Metric label="Mat. críticos" value={materials.filter(m=>["agotado","critico","bajo"].includes(m.status)).length} color={C.red} />
          <Metric label="Cotizaciones" value={projects.length} color={C.purple} sub="activas" />
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 300px",gap:16 }}>
          <div style={{ background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
            <div style={{ padding:"11px 15px",borderBottom:`0.5px solid ${C.border}`,fontSize:13,fontWeight:500,color:C.text,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span>Proyectos activos</span>
              {rp.editar&&<button onClick={()=>setNewProjectModal(true)} style={{ fontSize:11,padding:"4px 10px",borderRadius:6,border:`0.5px solid ${C.accent}`,background:`${C.accent}11`,color:C.accent,cursor:"pointer" }}>+ Nuevo</button>}
            </div>
            {projects.length===0?<div style={{ padding:24,fontSize:13,color:C.muted,textAlign:"center" }}>Sin proyectos aún. Crea el primero.</div>
            :projects.map(p=>{ const sc=statusColor(p.status); return(
              <div key={p.id} onClick={()=>{ setSelProject(p); setNav("projects"); }} style={{ padding:"11px 15px",borderBottom:`0.5px solid ${C.border}`,cursor:"pointer",display:"flex",gap:10,alignItems:"center" }}
                onMouseEnter={e=>e.currentTarget.style.background="#1f1f1f"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{ width:3,background:prioColor(p.priority),borderRadius:2,alignSelf:"stretch",flexShrink:0 }} />
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:12,fontWeight:500,color:C.text,marginBottom:3 }}>{p.client} {p.alert&&<span style={{ color:C.red,fontSize:10 }}>● ALERTA</span>}</div>
                  <div style={{ fontSize:10,color:C.muted,marginBottom:5 }}>{p.id} · {p.type}</div>
                  <Bar pct={p.progress||0} color={p.alert?C.red:C.accent} h={5} />
                </div>
                <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0 }}>
                  <Badge label={p.status} bg={sc.bg} text={sc.text} border={sc.border} />
                  <div style={{ display:"flex",gap:4 }}>
                    {rp.editar&&<button onClick={ev=>{ev.stopPropagation();setUpdateProject(p);}} style={{ fontSize:10,padding:"2px 7px",borderRadius:5,border:`0.5px solid ${C.accent}`,background:"transparent",color:C.accent,cursor:"pointer" }}>📷</button>}
                    <button onClick={ev=>{ev.stopPropagation();setFlowProject(p);}} style={{ fontSize:10,padding:"2px 7px",borderRadius:5,border:`0.5px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer" }}>→</button>
                  </div>
                </div>
              </div>
            );})}
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <div style={{ background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
              <div style={{ padding:"10px 14px",borderBottom:`0.5px solid ${C.border}`,fontSize:13,fontWeight:500,color:C.text }}>Actividad reciente</div>
              {auditLog.slice(0,6).map(l=>(
                <div key={l.id} style={{ padding:"8px 14px",borderBottom:`0.5px solid ${C.border}`,display:"flex",gap:8,alignItems:"flex-start" }}>
                  <span style={{ fontSize:14 }}>{{ "actualizó avance":"📊","aprobó etapa":"✅","inició sesión":"🔐","creó proyecto":"✨" }[l.action]||"📋"}</span>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:11,fontWeight:500,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{l.user_name} <span style={{ color:C.muted,fontWeight:400 }}>{l.action}</span></div>
                    <div style={{ fontSize:10,color:C.muted }}>{new Date(l.created_at).toLocaleTimeString("es-MX",{ hour:"2-digit",minute:"2-digit" })}</div>
                  </div>
                </div>
              ))}
              {auditLog.length===0&&<div style={{ padding:"12px 14px",fontSize:12,color:C.muted }}>Sin actividad registrada aún.</div>}
            </div>
            <div style={{ background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
              <div style={{ padding:"10px 14px",borderBottom:`0.5px solid ${C.border}`,fontSize:13,fontWeight:500,color:C.text }}>📦 Materiales críticos</div>
              {materials.filter(m=>m.status!=="ok").length===0?<div style={{ padding:"12px 14px",fontSize:12,color:C.green }}>✓ Sin materiales críticos</div>
              :materials.filter(m=>m.status!=="ok").map(m=>{ const ms={ agotado:{ text:C.red,label:"Agotado" },critico:{ text:C.orange,label:"Crítico" },bajo:{ text:C.yellow,label:"Bajo" },pendiente:{ text:C.purple,label:"En camino" } }[m.status]||{ text:C.muted,label:m.status }; return(
                <div key={m.id} style={{ padding:"8px 14px",borderBottom:`0.5px solid ${C.border}` }}>
                  <div style={{ fontSize:12,fontWeight:500,color:C.text }}>{m.name}</div>
                  <div style={{ fontSize:10,color:ms.text }}>{ms.label} · {m.stock} {m.unit}</div>
                </div>
              );})}
            </div>
          </div>
        </div>
      </div>
    );

    if(nav==="projects") {
      if(selProject) return <ProjectDetail project={selProject} onBack={()=>setSelProject(null)} onUpdate={setUpdateProject} onFlow={setFlowProject} currentUser={currentUser} logs={projLogs} photos={projPhotos} />;
      return (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8 }}>
            <h2 style={{ margin:0,fontSize:17,fontWeight:500,color:C.text }}>Proyectos</h2>
            <div style={{ display:"flex",gap:8 }}>
              <div style={{ display:"flex",border:`0.5px solid ${C.border}`,borderRadius:8,overflow:"hidden" }}>
                <button onClick={()=>setView("list")} style={{ padding:"6px 12px",border:"none",background:view==="list"?`${C.accent}22`:"transparent",color:view==="list"?C.accent:C.muted,cursor:"pointer",fontSize:12 }}>≡ Lista</button>
                <button onClick={()=>setView("kanban")} style={{ padding:"6px 12px",border:"none",background:view==="kanban"?`${C.accent}22`:"transparent",color:view==="kanban"?C.accent:C.muted,cursor:"pointer",fontSize:12 }}>⊞ Kanban</button>
              </div>
              {rp.editar&&<button onClick={()=>setNewProjectModal(true)} style={{ padding:"7px 14px",borderRadius:8,border:"none",background:C.accent,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:500 }}>+ Nuevo proyecto</button>}
            </div>
          </div>
          {view==="kanban"?<KanbanView projects={projects} onProject={p=>{ setSelProject(p); }} />
          :projects.length===0?<div style={{ fontSize:13,color:C.muted,padding:"30px 0",textAlign:"center" }}>Sin proyectos. Crea el primero con el botón de arriba.</div>
          :projects.map(p=>{ const sc=statusColor(p.status); return(
            <div key={p.id} onClick={()=>setSelProject(p)} style={{ background:C.bg2,border:`0.5px solid ${p.alert?C.redBorder:C.border}`,borderRadius:12,padding:"13px 17px",cursor:"pointer",display:"flex",gap:13,alignItems:"center" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=p.alert?C.redBorder:C.border}>
              <div style={{ width:3,background:prioColor(p.priority),borderRadius:2,alignSelf:"stretch",flexShrink:0 }} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:3 }}><span style={{ fontWeight:500,color:C.text }}>{p.client}</span>{p.alert&&<span style={{ fontSize:10,color:C.red }}>⚠ ALERTA</span>}</div>
                <div style={{ fontSize:11,color:C.muted,marginBottom:6 }}>{p.id} · {p.type} · {p.area}</div>
                <Bar pct={p.progress||0} color={p.alert?C.red:C.accent} />
              </div>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0 }}>
                <Badge label={p.status} bg={sc.bg} text={sc.text} border={sc.border} />
                <span style={{ fontSize:11,color:C.muted }}>{p.responsible||"—"} · {p.delivery||"Sin fecha"}</span>
                <div style={{ display:"flex",gap:4 }}>
                  {rp.editar&&<button onClick={e=>{e.stopPropagation();setUpdateProject(p);}} style={{ fontSize:10,padding:"3px 8px",borderRadius:5,border:`0.5px solid ${C.accent}`,background:"transparent",color:C.accent,cursor:"pointer" }}>📷</button>}
                  <button onClick={e=>{e.stopPropagation();setFlowProject(p);}} style={{ fontSize:10,padding:"3px 8px",borderRadius:5,border:`0.5px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer" }}>→ Etapa</button>
                </div>
              </div>
            </div>
          );})}
        </div>
      );
    }

    if(nav==="quotes") return <QuotesView onConvertToProject={convertQuoteToProject} currentUser={currentUser} />;
    if(nav==="metrics") return <MetricsView projects={projects} />;

    if(nav==="employees") return (
      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        <h2 style={{ margin:0,fontSize:17,fontWeight:500,color:C.text }}>Empleados</h2>
        {employees.length===0?<div style={{ fontSize:13,color:C.muted,padding:"20px 0",textAlign:"center" }}>Sin empleados en base de datos.</div>
        :<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12 }}>
          {employees.map(e=>{ const lc=loadColor(e.load); return(
            <div key={e.id} style={{ background:C.bg2,border:`0.5px solid ${e.load==="saturado"?C.redBorder:C.border}`,borderRadius:12,padding:"15px",display:"flex",flexDirection:"column",gap:10 }}>
              <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                <Avatar initials={e.avatar||e.name?.slice(0,2)||"?"} size={42} color={lc} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:500,fontSize:13,color:C.text }}>{e.name}</div>
                  <div style={{ fontSize:11,color:C.muted }}>{e.role} · {e.area}</div>
                </div>
                <Badge label={e.load||"normal"} bg={`${lc}22`} text={lc} border={`${lc}44`} />
              </div>
              <div>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}><span style={{ fontSize:11,color:C.muted }}>Eficiencia</span><span style={{ fontSize:12,fontWeight:500,color:(e.efficiency||80)>=90?C.green:C.accent }}>{e.efficiency||80}%</span></div>
                <Bar pct={e.efficiency||80} color={(e.efficiency||80)>=90?C.green:C.accent} />
              </div>
              <div style={{ display:"flex",gap:8,fontSize:11,color:C.muted }}>
                <span>⏱ {e.hours||0}h mes</span>
                {(e.overtime||0)>0&&<span style={{ color:C.orange }}>⚡ +{e.overtime}h extra</span>}
              </div>
              <div style={{ fontSize:11,color:attendLabel(e.attend)==="Presente"?C.green:attendLabel(e.attend)==="Atrasado"?C.yellow:C.muted }}>● {attendLabel(e.attend)} {e.entry_time&&e.attend!=="vacaciones"?`· Entrada: ${e.entry_time}`:""}</div>
            </div>
          );})}
        </div>}
      </div>
    );

    if(nav==="materials") return (
      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        <h2 style={{ margin:0,fontSize:17,fontWeight:500,color:C.text }}>Control de materiales</h2>
        {materials.filter(m=>m.alert_msg).map(m=><div key={m.id} style={{ background:C.redBg,border:`0.5px solid ${C.redBorder}`,borderRadius:9,padding:"9px 14px",fontSize:12,color:C.redText }}>🚨 {m.alert_msg}</div>)}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10 }}>
          <Metric label="Total" value={materials.length} />
          <Metric label="Disponibles" value={materials.filter(m=>m.status==="ok").length} color={C.green} />
          <Metric label="Críticos" value={materials.filter(m=>["agotado","critico"].includes(m.status)).length} color={C.red} />
          <Metric label="Stock bajo" value={materials.filter(m=>m.status==="bajo").length} color={C.yellow} />
        </div>
        {materials.length===0?<div style={{ fontSize:13,color:C.muted }}>Sin materiales registrados.</div>
        :materials.map(m=>{ const ms={ ok:{ bg:C.greenBg,text:C.green,border:C.greenBorder,label:"Disponible" },critico:{ bg:C.orangeBg,text:C.orange,border:C.orangeBorder,label:"Crítico" },agotado:{ bg:C.redBg,text:C.red,border:C.redBorder,label:"Agotado" },bajo:{ bg:C.yellowBg,text:C.yellow,border:C.yellowBorder,label:"Stock bajo" },pendiente:{ bg:C.purpleBg,text:C.purple,border:C.purpleBorder,label:"En camino" } }[m.status]||{ bg:C.bg2,text:C.muted,border:C.border,label:m.status||"—" }; return(
          <div key={m.id} style={{ background:C.bg2,border:`0.5px solid ${m.status!=="ok"?ms.border:C.border}`,borderRadius:10,padding:"12px 15px",display:"flex",gap:12,alignItems:"center" }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:5 }}><span style={{ fontSize:13,fontWeight:500,color:C.text }}>{m.name}</span><Badge label={ms.label} bg={ms.bg} text={ms.text} border={ms.border} /></div>
              <div style={{ fontSize:11,color:C.muted }}>{m.stock} {m.unit} disponibles · Mín: {m.min_stock} · {m.supplier}</div>
              <div style={{ marginTop:6 }}><Bar pct={Math.round((m.stock/Math.max(m.stock+m.reserved,1))*100)} color={m.status==="agotado"?C.red:m.status==="bajo"?C.yellow:C.green} h={5} /></div>
            </div>
            <div style={{ textAlign:"right",flexShrink:0 }}>
              <div style={{ fontSize:14,fontWeight:500,color:C.accent }}>${m.cost}</div>
              <div style={{ fontSize:10,color:C.muted }}>/{m.unit}</div>
            </div>
          </div>
        );})}
      </div>
    );

    if(nav==="audit") return (
      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        <h2 style={{ margin:0,fontSize:17,fontWeight:500,color:C.text }}>Bitácora del sistema</h2>
        <Metric label="Acciones registradas en Supabase" value={auditLog.length} color={C.accent} />
        {auditLog.length===0?<div style={{ fontSize:13,color:C.muted,padding:"20px 0",textAlign:"center" }}>Sin actividad registrada aún. Las acciones aparecerán aquí conforme el equipo use el sistema.</div>
        :auditLog.map(l=>(
          <div key={l.id} style={{ background:C.bg2,border:`0.5px solid ${C.border}`,borderRadius:10,padding:"11px 15px",display:"flex",gap:10,alignItems:"flex-start" }}>
            <span style={{ fontSize:16,marginTop:1 }}>{{ "actualizó avance":"📊","aprobó etapa":"✅","inició sesión":"🔐","creó proyecto":"✨","creó cotización":"📋" }[l.action]||"📋"}</span>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:12,fontWeight:500,color:C.text }}>{l.user_name} <span style={{ color:C.muted,fontWeight:400 }}>{l.action}</span> <span style={{ color:C.accent }}>{l.entity}</span></div>
              {l.detail&&<div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{l.detail}</div>}
              <div style={{ fontSize:10,color:C.muted,marginTop:3 }}>🕐 {new Date(l.created_at).toLocaleString("es-MX")} · {l.module} · {l.device}</div>
            </div>
            <Badge label={l.user_role} bg={ROLE_PERMS[l.user_role]?.bg||C.bg2} text={ROLE_PERMS[l.user_role]?.color||C.muted} border={ROLE_PERMS[l.user_role]?.border||C.border} />
          </div>
        ))}
      </div>
    );

    if(nav==="ai") return <AIAssistant projects={projects} employees={employees} materials={materials} currentUser={currentUser} />;
  };

  return (
    <div style={{ display:"flex",minHeight:"100vh",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",background:"#f3f4f6",fontSize:14,color:"#111827" }}>
      {/* Sidebar */}
      <div style={{ width:sidebar?210:56,background:C.bg2,borderRight:`0.5px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0,transition:"width .2s",overflow:"hidden" }}>
        <div style={{ padding:"14px 12px",borderBottom:`0.5px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:sidebar?"flex-start":"center",minHeight:66 }}>
          {sidebar?<div>
            <div style={{ fontFamily:"Georgia,'Times New Roman',serif",fontSize:20,fontWeight:700,color:C.text,lineHeight:1 }}>De Metal</div>
            <div style={{ fontSize:9,color:C.muted,letterSpacing:"0.13em",textTransform:"uppercase",marginTop:3 }}>Líderes en hierro forjado</div>
          </div>:<span style={{ fontFamily:"Georgia,serif",fontSize:17,fontWeight:700,color:C.text }}>D</span>}
        </div>
        <nav style={{ flex:1,padding:"10px 6px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto" }}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>{ setNav(item.id); setSelProject(null); }}
              style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,border:"none",cursor:"pointer",background:nav===item.id?`${C.accent}22`:"transparent",color:nav===item.id?C.accent:C.muted,fontWeight:nav===item.id?500:400,fontSize:13,textAlign:"left",width:"100%",whiteSpace:"nowrap" }}>
              <span style={{ fontSize:14,flexShrink:0 }}>{item.emoji}</span>
              {sidebar&&<span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding:"8px",borderTop:`0.5px solid ${C.border}` }}>
          {sidebar?<div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <Avatar initials={currentUser.avatar} size={28} color={currentUser.color} />
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:11,fontWeight:500,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{currentUser.name.split(" ")[0]}</div>
              <div style={{ fontSize:10,color:C.muted }}>{currentUser.role}</div>
            </div>
            <button onClick={handleLogout} title="Cerrar sesión" style={{ background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14,padding:4 }}>⏻</button>
          </div>
          :<button onClick={handleLogout} style={{ width:"100%",background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16,padding:"4px 0" }}>⏻</button>}
        </div>
        <button onClick={()=>setSidebar(!sidebar)} style={{ margin:"4px 6px 10px",padding:"6px",border:`0.5px solid ${C.border}`,borderRadius:7,cursor:"pointer",background:"transparent",color:C.muted,fontSize:11 }}>{sidebar?"◀ Colapsar":"▶"}</button>
      </div>

      {/* Main */}
      <div style={{ flex:1,display:"flex",flexDirection:"column",minWidth:0 }}>
        {/* Topbar */}
        <div style={{ background:C.bg2,borderBottom:`0.5px solid ${C.border}`,padding:"11px 20px",display:"flex",alignItems:"center",gap:12 }}>
          <span style={{ fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,color:C.text }}>De Metal</span>
          <span style={{ color:C.border,fontSize:18 }}>|</span>
          <span style={{ fontSize:13,color:C.muted }}>{selProject?selProject.client:navItems.find(n=>n.id===nav)?.label}</span>
          <div style={{ flex:1 }} />
          <button onClick={()=>setShowSearch(true)} style={{ display:"flex",gap:6,alignItems:"center",padding:"5px 12px",borderRadius:8,border:`0.5px solid ${C.border2}`,background:"#111",color:C.muted,cursor:"pointer",fontSize:12 }}>🔍 <span>Buscar</span> <span style={{ fontSize:10,opacity:.4 }}>⌘K</span></button>
          <div style={{ position:"relative" }}>
            <button onClick={()=>setShowNotifs(!showNotifs)} style={{ position:"relative",background:"#111",border:`0.5px solid ${C.border2}`,borderRadius:8,width:34,height:34,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>
              🔔
              {notifCount>0&&<div style={{ position:"absolute",top:-3,right:-3,width:16,height:16,borderRadius:8,background:C.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700 }}>{notifCount}</div>}
            </button>
            {showNotifs&&<NotifPanel projects={projects} materials={materials} employees={employees} onClose={()=>setShowNotifs(false)} />}
          </div>
          <div style={{ display:"flex",gap:6,alignItems:"center" }}>
            <div style={{ width:6,height:6,borderRadius:3,background:isOnline?C.green:C.red }} />
            <Badge label={currentUser.role} bg={rp.bg} text={rp.color} border={rp.border} />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1,padding:22,overflowY:"auto" }}>
          {renderContent()}
        </div>
      </div>

      {/* Modals */}
      {showSearch&&<GlobalSearch projects={projects} employees={employees} onProject={p=>{ setSelProject(p); setNav("projects"); }} onClose={()=>setShowSearch(false)} />}
      {updateProject&&<QuickUpdate project={updateProject} currentUser={currentUser} onClose={()=>setUpdateProject(null)} onSaved={()=>{ loadData(); if(selProject) loadProjectDetails(selProject.id); }} />}
      {flowProject&&<FlowApproval project={flowProject} currentUser={currentUser} onClose={()=>setFlowProject(null)} onSaved={()=>{ loadData(); if(selProject) loadProjectDetails(selProject.id); }} />}
      {newProjectModal&&<NewProjectModal onClose={()=>setNewProjectModal(false)} onSaved={loadData} currentUser={currentUser} />}
    </div>
  );
}
