import React from 'react';
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
  if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.message||res.statusText); }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
};

const db = {
  get:    (table, query="")    => sb(`${table}?${query}&order=created_at.desc`),
  insert: (table, data)        => sb(table, { method:"POST", body:JSON.stringify(data) }),
  update: (table, match, data) => sb(`${table}?${match}`, { method:"PATCH", body:JSON.stringify(data) }),
  single: (table, query)       => sb(`${table}?${query}&limit=1`).then(r=>r[0]||null),
};

const C = {
  accent:"#B87333",
  red:"#ef4444", redBg:"#3b0000", redBorder:"#991b1b", redText:"#fca5a5",
  green:"#22c55e", greenBg:"#052e16", greenBorder:"#166534",
  blue:"#60a5fa", blueBg:"#0c1a2e", blueBorder:"#1d4ed8",
  orange:"#f97316", orangeBg:"#1c0a00", orangeBorder:"#9a3412",
  purple:"#a78bfa", purpleBg:"#1e1b4b", purpleBorder:"#6d28d9",
  yellow:"#eab308", yellowBg:"#1a1500", yellowBorder:"#854d0e",
  border:"var(--color-border-tertiary)", border2:"var(--color-border-secondary)",
  bg:"var(--color-background-primary)", bg2:"var(--color-background-secondary)", bg3:"var(--color-background-tertiary)",
  text:"var(--color-text-primary)", muted:"var(--color-text-secondary)",
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

const statusColor = s => ({
  "En producción":{ bg:C.greenBg,text:C.green,border:C.greenBorder },
  "Diseño":       { bg:C.blueBg,text:C.blue,border:C.blueBorder },
  "Instalación":  { bg:C.orangeBg,text:C.orange,border:C.orangeBorder },
  "Atrasado":     { bg:C.redBg,text:C.red,border:C.redBorder },
  "Cotización":   { bg:C.purpleBg,text:C.purple,border:C.purpleBorder },
  "Entregado":    { bg:"#022c22",text:"#2dd4bf",border:"#0d9488" },
}[s]||{ bg:C.bg2,text:C.muted,border:C.border });

const prioColor = p => ({ "Urgente":C.red,"Alta":C.orange,"Media":C.yellow,"Baja":C.green }[p]||C.muted);

const Bar = ({ pct, color=C.accent, h=6 }) => (
  <div style={{ background:C.border,borderRadius:99,height:h,overflow:"hidden" }}>
    <div style={{ width:`${Math.min(pct,100)}%`,background:color,height:"100%",borderRadius:99 }} />
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
const Spinner = () => <div style={{ display:"flex",alignItems:"center",justifyContent:"center",padding:40,color:C.muted,fontSize:13 }}>⏳ Cargando desde Supabase…</div>;

function LoginScreen({ onLogin }) {
  const [user,setUser]=useState(""); const [pass,setPass]=useState(""); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false); const [show,setShow]=useState(false);
  const login = async () => {
    setLoading(true); setErr("");
    await new Promise(r=>setTimeout(r,400));
    const found = SYSTEM_USERS.find(u=>u.user===user.trim()&&u.pass===pass);
    if(found) { try{ await db.insert("audit_log",{ user_name:found.name,user_role:found.role,action:"inició sesión",entity:"Sistema",detail:"Acceso desde portal",module:"Auth",device:"Web" }); }catch(e){} onLogin(found); }
    else { setErr("Usuario o contraseña incorrectos"); setLoading(false); }
  };
  return (
    <div style={{ minHeight:"100vh",background:"#0f0f0f",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ width:"100%",maxWidth:380 }}>
        <div style={{ textAlign:"center",marginBottom:32 }}>
          <div style={{ fontFamily:"Georgia,serif",fontSize:32,fontWeight:700,color:"#fff" }}>De Metal</div>
          <div style={{ fontSize:10,color:"#666",letterSpacing:"0.14em",textTransform:"uppercase",marginTop:4 }}>Líderes en hierro forjado</div>
          <div style={{ width:36,height:2,background:C.accent,margin:"12px auto 0",borderRadius:1 }} />
        </div>
        <div style={{ background:"#1a1a1a",border:"0.5px solid #2a2a2a",borderRadius:16,padding:28,display:"flex",flexDirection:"column",gap:16 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <div style={{ width:8,height:8,borderRadius:4,background:C.green }} />
            <span style={{ fontSize:11,color:C.green,fontWeight:500 }}>Conectado a Supabase</span>
          </div>
          <div><div style={{ fontSize:15,fontWeight:500,color:"#fff" }}>Acceso al sistema</div><div style={{ fontSize:12,color:"#666" }}>Portal operativo · De Metal</div></div>
          <div>
            <div style={{ fontSize:12,color:"#666",marginBottom:5 }}>Usuario</div>
            <input value={user} onChange={e=>setUser(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="tu.usuario" style={{ width:"100%",borderRadius:8,border:"0.5px solid #333",background:"#111",color:"#fff",padding:"10px 13px",fontSize:13,boxSizing:"border-box" }} />
          </div>
          <div>
            <div style={{ fontSize:12,color:"#666",marginBottom:5 }}>Contraseña</div>
            <div style={{ position:"relative" }}>
              <input value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} type={show?"text":"password"} placeholder="••••••••" style={{ width:"100%",borderRadius:8,border:`0.5px solid ${err?C.redBorder:"#333"}`,background:"#111",color:"#fff",padding:"10px 40px 10px 13px",fontSize:13,boxSizing:"border-box" }} />
              <button onClick={()=>setShow(!show)} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#666" }}>{show?"🙈":"👁"}</button>
            </div>
          </div>
          {err&&<div style={{ background:C.redBg,border:`0.5px solid ${C.redBorder}`,borderRadius:8,padding:"8px 12px",fontSize:12,color:C.red }}>⚠ {err}</div>}
          <button onClick={login} disabled={!user||!pass||loading} style={{ padding:"12px",borderRadius:8,border:"none",background:C.accent,color:"#fff",cursor:!user||!pass||loading?"not-allowed":"pointer",fontSize:14,fontWeight:500,opacity:!user||!pass||loading?.6:1 }}>{loading?"Verificando…":"Ingresar →"}</button>
          <div style={{ borderTop:"0.5px solid #222",paddingTop:14 }}>
            <div style={{ fontSize:11,color:"#555",marginBottom:8 }}>Accesos rápidos:</div>
            {SYSTEM_USERS.map(u=>{ const rp=ROLE_PERMS[u.role]; return(
              <button key={u.id} onClick={()=>{ setUser(u.user); setPass(u.pass); }} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"6px 10px",borderRadius:7,border:"0.5px solid #222",background:"transparent",cursor:"pointer",marginBottom:4 }}>
                <div style={{ display:"flex",gap:8,alignItems:"center" }}><Avatar initials={u.avatar} size={22} color={u.color} /><span style={{ fontSize:12,color:"#ccc" }}>{u.name}</span></div>
                <Badge label={u.role} bg={rp.bg} text={rp.color} border={rp.border} />
              </button>
            );})}
          </div>
        </div>
      </div>
    </div>
  );
}

function GlobalSearch({ projects, onSelect, onClose }) {
  const [q,setQ]=useState(""); const ref=useRef();
  useEffect(()=>ref.current?.focus(),[]);
  const results = q.length<2?[]:projects.filter(p=>[p.client,p.id,p.type,p.area,p.status].join(" ").toLowerCase().includes(q.toLowerCase())).slice(0,8);
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:500,display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:80,padding:"80px 20px 20px" }}>
      <div style={{ width:"100%",maxWidth:540,background:"#1a1a1a",borderRadius:14,overflow:"hidden",border:"0.5px solid #333" }}>
        <div style={{ display:"flex",gap:10,padding:"14px 16px",borderBottom:"0.5px solid #222",alignItems:"center" }}>
          <span>🔍</span>
          <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar proyectos, clientes, códigos…" style={{ flex:1,background:"none",border:"none",color:"#fff",fontSize:15,outline:"none" }} />
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:18 }}>✕</button>
        </div>
        {q.length<2?<div style={{ padding:"20px",fontSize:13,color:"#666",textAlign:"center" }}>Escribe para buscar</div>
        :results.length===0?<div style={{ padding:"20px",fontSize:13,color:"#666",textAlign:"center" }}>Sin resultados para "{q}"</div>
        :results.map((p,i)=>{ const sc=statusColor(p.status); return(
          <div key={i} onClick={()=>{ onSelect(p); onClose(); }} style={{ padding:"12px 16px",borderBottom:"0.5px solid #1a1a1a",cursor:"pointer",display:"flex",gap:12,alignItems:"center",background:"#1a1a1a" }}
            onMouseEnter={e=>e.currentTarget.style.background="#222"} onMouseLeave={e=>e.currentTarget.style.background="#1a1a1a"}>
            <span style={{ fontSize:20 }}>📁</span>
            <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:500,color:"#fff" }}>{p.client}</div><div style={{ fontSize:11,color:"#666" }}>{p.id} · {p.type} · {p.status}</div></div>
            <Badge label={p.status} bg={sc.bg} text={sc.text} border={sc.border} />
          </div>
        );})}
      </div>
    </div>
  );
}

function PhotoUploader({ onPhoto }) {
  const ref=useRef(); const [prev,setPrev]=useState(null);
  const handle=e=>{ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>{ setPrev(ev.target.result); onPhoto(ev.target.result); }; r.readAsDataURL(f); };
  return (
    <div>
      <input ref={ref} type="file" accept="image/*" capture="environment" onChange={handle} style={{ display:"none" }} />
      {prev?<div style={{ position:"relative",borderRadius:10,overflow:"hidden" }}><img src={prev} alt="p" style={{ width:"100%",height:140,objectFit:"cover" }} /><button onClick={()=>{ setPrev(null); onPhoto(null); }} style={{ position:"absolute",top:6,right:6,background:"rgba(0,0,0,.7)",border:"none",borderRadius:20,width:24,height:24,color:"#fff",cursor:"pointer" }}>✕</button></div>
      :<div onClick={()=>ref.current.click()} style={{ border:"1.5px dashed #333",borderRadius:10,padding:"16px",textAlign:"center",cursor:"pointer",background:"#111" }}><div style={{ fontSize:24,marginBottom:4 }}>📷</div><div style={{ fontSize:12,fontWeight:500,color:"#ccc" }}>Tomar o seleccionar foto</div><div style={{ fontSize:10,color:"#555",marginTop:2 }}>Se guarda en Supabase</div></div>}
    </div>
  );
}

function QuickUpdate({ project, currentUser, onClose, onSaved }) {
  const [pct,setPct]=useState(project.progress||0); const [area,setArea]=useState(project.phase||"Diseño"); const [note,setNote]=useState(""); const [photo,setPhoto]=useState(null); const [issue,setIssue]=useState(""); const [saving,setSaving]=useState(false); const [saved,setSaved]=useState(false);
  const AREAS=["Diseño","Corte","Soldadura","Pintura","Instalación","Calidad","Ensamblaje"];
  const device=navigator.userAgent.includes("iPhone")?"iPhone":navigator.userAgent.includes("Android")?"Android":"Computadora";
  const save=async()=>{
    setSaving(true);
    try {
      await db.insert("project_logs",{ project_id:project.id,user_name:currentUser.name,user_role:currentUser.role,prev_pct:project.progress,new_pct:pct,area,note,issue,device });
      if(photo) await db.insert("project_photos",{ project_id:project.id,storage_url:photo,area,note,pct,issue,user_name:currentUser.name });
      await db.update("projects",`id=eq.${project.id}`,{ progress:pct,phase:area,updated_at:new Date().toISOString() });
      await db.insert("audit_log",{ user_name:currentUser.name,user_role:currentUser.role,action:"actualizó avance",entity:`Proyecto ${project.id}`,detail:`${project.progress}% → ${pct}% · ${area}`,module:"Proyectos",device });
      setSaved(true); setTimeout(()=>{ onSaved(); onClose(); },1000);
    } catch(e){ alert("Error: "+e.message); setSaving(false); }
  };
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center" }}>
      <div style={{ background:"#1a1a1a",borderRadius:"16px 16px 0 0",width:"100%",maxWidth:520,padding:22,display:"flex",flexDirection:"column",gap:13,maxHeight:"90vh",overflowY:"auto" }}>
        {saved?<div style={{ textAlign:"center",padding:"20px 0" }}><div style={{ fontSize:34 }}>✅</div><div style={{ fontWeight:500,marginTop:8,color:"#fff" }}>Guardado en Supabase</div><div style={{ fontSize:12,color:"#666",marginTop:4 }}>Visible para todo el equipo</div></div>
        :<>
          <div style={{ display:"flex",justifyContent:"space-between" }}><div><div style={{ fontWeight:500,color:"#fff" }}>Actualizar avance</div><div style={{ fontSize:11,color:"#666" }}>{project.id} · {project.client}</div></div><button onClick={onClose} style={{ background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#666" }}>✕</button></div>
          <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>{AREAS.map(a=><button key={a} onClick={()=>setArea(a)} style={{ padding:"4px 9px",borderRadius:6,border:`0.5px solid ${area===a?C.accent:"#333"}`,background:area===a?`${C.accent}22`:"transparent",color:area===a?C.accent:"#666",cursor:"pointer",fontSize:11 }}>{a}</button>)}</div>
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}><span style={{ fontSize:12,color:"#666" }}>Avance</span><span style={{ fontSize:17,fontWeight:500,color:C.accent }}>{pct}%</span></div>
            <input type="range" min={0} max={100} step={1} value={pct} onChange={e=>setPct(+e.target.value)} style={{ width:"100%" }} />
            <Bar pct={pct} h={7} />
          </div>
          <PhotoUploader onPhoto={setPhoto} />
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="¿Qué se hizo?" rows={2} style={{ borderRadius:8,border:"0.5px solid #333",background:"#111",color:"#fff",padding:"8px 12px",fontSize:13,resize:"none",width:"100%",boxSizing:"border-box" }} />
          <input value={issue} onChange={e=>setIssue(e.target.value)} placeholder="⚠ Problema o material faltante (opcional)" style={{ borderRadius:8,border:"0.5px solid #333",background:"#111",color:"#fff",padding:"8px 12px",fontSize:13,width:"100%",boxSizing:"border-box" }} />
          <div style={{ background:"#111",borderRadius:8,padding:"7px 12px",fontSize:11,color:"#555",display:"flex",gap:12 }}><span>👤 {currentUser.name}</span><span>💻 {device}</span></div>
          <button onClick={save} disabled={saving} style={{ padding:"11px",borderRadius:8,border:"none",background:C.accent,color:"#fff",cursor:saving?"not-allowed":"pointer",fontSize:14,fontWeight:500,opacity:saving?.6:1 }}>{saving?"Guardando…":"Guardar avance →"}</button>
        </>}
      </div>
    </div>
  );
}

function FlowApproval({ project, currentUser, onClose, onSaved }) {
  const [sig,setSig]=useState(""); const [saving,setSaving]=useState(false); const [done,setDone]=useState(false);
  const curIdx=FLOW.indexOf(project.status); const nextStatus=FLOW[curIdx+1];
  const required=FLOW_APPROVERS[nextStatus]; const canApprove=currentUser.role===required||currentUser.role==="Administrador";
  const approve=async()=>{
    if(!sig.trim()) return; setSaving(true);
    try {
      await db.insert("project_approvals",{ project_id:project.id,from_status:project.status,to_status:nextStatus,user_name:currentUser.name,user_role:currentUser.role,signature:sig });
      await db.update("projects",`id=eq.${project.id}`,{ status:nextStatus,updated_at:new Date().toISOString() });
      await db.insert("audit_log",{ user_name:currentUser.name,user_role:currentUser.role,action:"aprobó etapa",entity:`Proyecto ${project.id}`,detail:`${project.status} → ${nextStatus}`,module:"Proyectos",device:"Portal" });
      setDone(true); setSaving(false); setTimeout(()=>{ onSaved(); onClose(); },1000);
    } catch(e){ alert("Error: "+e.message); setSaving(false); }
  };
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:"#1a1a1a",borderRadius:14,width:"100%",maxWidth:440,padding:24,display:"flex",flexDirection:"column",gap:16 }}>
        {done?<div style={{ textAlign:"center",padding:"16px 0" }}><div style={{ fontSize:36 }}>✅</div><div style={{ fontWeight:500,marginTop:8,color:"#fff" }}>Aprobación guardada</div></div>
        :<>
          <div style={{ display:"flex",justifyContent:"space-between" }}><div style={{ fontWeight:500,fontSize:15,color:"#fff" }}>Avanzar etapa</div><button onClick={onClose} style={{ background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#666" }}>✕</button></div>
          <div style={{ display:"flex",alignItems:"center",background:"#111",borderRadius:10,padding:12,overflowX:"auto",gap:0 }}>
            {FLOW.map((s,i)=>{ const cur=s===project.status; const past=i<curIdx; const next=s===nextStatus; return(
              <div key={s} style={{ display:"flex",alignItems:"center" }}>
                <div style={{ textAlign:"center",minWidth:70 }}>
                  <div style={{ width:22,height:22,borderRadius:11,background:past?C.greenBg:cur?`${C.accent}33`:next?`${C.blue}22`:"#222",border:`1.5px solid ${past?C.green:cur?C.accent:next?C.blue:"#333"}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 3px",fontSize:10,color:past?C.green:cur?C.accent:next?C.blue:"#555" }}>{past?"✓":cur?"●":next?"→":"○"}</div>
                  <div style={{ fontSize:9,color:cur?C.accent:past?C.green:"#555" }}>{s}</div>
                </div>
                {i<FLOW.length-1&&<div style={{ width:12,height:1,background:past?C.green:"#333",flexShrink:0 }} />}
              </div>
            );})}
          </div>
          {!nextStatus?<div style={{ fontSize:13,color:"#666",textAlign:"center" }}>Proyecto en etapa final.</div>
          :!canApprove?<div style={{ background:C.redBg,border:`0.5px solid ${C.redBorder}`,borderRadius:10,padding:"12px 14px",fontSize:13,color:C.red }}>⚠ Solo un <b>{required}</b> puede aprobar esto.</div>
          :<>
            <div style={{ background:"#111",borderRadius:10,padding:"11px 14px" }}><div style={{ fontSize:12,fontWeight:500,color:"#fff" }}>{project.status} → {nextStatus}</div><div style={{ fontSize:11,color:"#666" }}>Requiere: {required}</div></div>
            <div>
              <div style={{ fontSize:12,color:"#666",marginBottom:6 }}>Firma digital — escribe tu nombre completo</div>
              <input value={sig} onChange={e=>setSig(e.target.value)} placeholder={currentUser.name} style={{ width:"100%",borderRadius:8,border:`0.5px solid ${sig?C.accent:"#333"}`,background:"#111",color:"#fff",padding:"9px 12px",fontSize:13,boxSizing:"border-box",fontStyle:"italic" }} />
            </div>
            <button onClick={approve} disabled={!sig.trim()||saving} style={{ padding:"11px",borderRadius:8,border:"none",background:C.accent,color:"#fff",cursor:!sig.trim()||saving?"not-allowed":"pointer",fontSize:14,fontWeight:500,opacity:!sig.trim()||saving?.6:1 }}>{saving?"Guardando…":"Aprobar y avanzar →"}</button>
          </>}
        </>}
      </div>
    </div>
  );
}

function KanbanView({ projects, onProject }) {
  return (
    <div style={{ display:"flex",gap:10,overflowX:"auto",paddingBottom:8 }}>
      {FLOW.map(col=>{ const sc=statusColor(col); const colP=projects.filter(p=>p.status===col); return(
        <div key={col} style={{ minWidth:185,flex:"0 0 185px",display:"flex",flexDirection:"column",gap:8 }}>
          <div style={{ padding:"7px 11px",background:sc.bg,border:`0.5px solid ${sc.border}`,borderRadius:8,display:"flex",justifyContent:"space-between" }}>
            <span style={{ fontSize:12,fontWeight:500,color:sc.text }}>{col}</span>
            <span style={{ fontSize:11,color:sc.text,opacity:.7 }}>{colP.length}</span>
          </div>
          {colP.map(p=>(
            <div key={p.id} onClick={()=>onProject(p)} style={{ background:"#1a1a1a",border:`0.5px solid ${p.alert?C.redBorder:"#2a2a2a"}`,borderRadius:10,padding:"11px",cursor:"pointer" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=p.alert?C.redBorder:"#2a2a2a"}>
              <div style={{ fontSize:12,fontWeight:500,marginBottom:3,color:"#fff" }}>{p.client?.split(" ").slice(-1)[0]} {p.alert&&<span style={{ color:C.red,fontSize:10 }}>⚠</span>}</div>
              <div style={{ fontSize:10,color:"#555",marginBottom:7 }}>{p.id}</div>
              <Bar pct={p.progress||0} color={p.alert?C.red:C.accent} h={4} />
              <div style={{ fontSize:10,color:"#555",marginTop:5 }}>{p.progress||0}%</div>
            </div>
          ))}
          {colP.length===0&&<div style={{ border:"1px dashed #222",borderRadius:10,padding:"20px 11px",textAlign:"center",fontSize:11,color:"#444" }}>Vacío</div>}
        </div>
      );})}
    </div>
  );
}

function AIAssistant({ projects, currentUser }) {
  const [messages,setMessages]=useState([{ role:"assistant",content:`Hola ${currentUser.name.split(" ")[0]}. Tengo acceso a ${projects.length} proyectos desde Supabase. ¿En qué te ayudo?` }]);
  const [input,setInput]=useState(""); const [loading,setLoading]=useState(false);
  const SUGGESTIONS=["¿Qué proyecto tiene mayor riesgo?","¿Qué debo priorizar hoy?","Resumen ejecutivo de producción","¿Qué áreas están retrasadas?"];
  const CTX=`Asistente operativo de "De Metal", fábrica premium en SPS Honduras. PROYECTOS: ${projects.map(p=>`${p.id}|${p.client}|${p.status}|${p.progress}%|${p.delivery||"sin fecha"}|${p.alert?"⚠ALERTA":""}`).join(" / ")}. Usuario: ${currentUser.name} (${currentUser.role}). Responde en español, directo, max 160 palabras.`;
  const send=async(text)=>{ const q=text||input.trim(); if(!q||loading) return; setInput(""); const msgs=[...messages,{ role:"user",content:q }]; setMessages(msgs); setLoading(true);
    try { const res=await fetch("https://api.anthropic.com/v1/messages",{ method:"POST",headers:{ "Content-Type":"application/json" },body:JSON.stringify({ model:"claude-sonnet-4-20250514",max_tokens:500,system:CTX,messages:msgs.map(m=>({ role:m.role,content:m.content })) }) }); const data=await res.json(); setMessages(prev=>[...prev,{ role:"assistant",content:data.content?.[0]?.text||"Error." }]); } catch{ setMessages(prev=>[...prev,{ role:"assistant",content:"Error de conexión." }]); } setLoading(false); };
  const fmt=t=>t.split("\n").map((l,i)=><div key={i} style={{ marginBottom:l?2:5 }} dangerouslySetInnerHTML={{ __html:l.replace(/\*\*(.*?)\*\*/g,"<b>$1</b>")||"&nbsp;" }} />);
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14,height:"calc(100vh - 100px)",maxHeight:660 }}>
      <div><h2 style={{ margin:0,fontSize:17,fontWeight:500 }}>🤖 Asistente IA <span style={{ fontSize:11,padding:"2px 8px",borderRadius:99,background:C.greenBg,color:C.green,border:`0.5px solid ${C.greenBorder}`,fontWeight:400,marginLeft:6 }}>● En línea</span></h2></div>
      <div style={{ flex:1,background:"#1a1a1a",border:"0.5px solid #2a2a2a",borderRadius:12,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        <div style={{ flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10 }}>
          {messages.map((m,i)=>(
            <div key={i} style={{ display:"flex",gap:8,alignItems:"flex-start",flexDirection:m.role==="user"?"row-reverse":"row" }}>
              {m.role==="assistant"?<div style={{ width:28,height:28,borderRadius:8,background:`${C.accent}22`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0 }}>🤖</div>:<Avatar initials={currentUser.avatar} size={28} color={currentUser.color} />}
              <div style={{ maxWidth:"78%",background:m.role==="user"?`${C.accent}22`:"#222",border:`0.5px solid ${m.role==="user"?`${C.accent}44`:"#333"}`,borderRadius:m.role==="user"?"12px 4px 12px 12px":"4px 12px 12px 12px",padding:"9px 13px",fontSize:13,lineHeight:1.6,color:"#e5e5e5" }}>{fmt(m.content)}</div>
            </div>
          ))}
          {loading&&<div style={{ display:"flex",gap:8 }}><div style={{ width:28,height:28,borderRadius:8,background:`${C.accent}22`,display:"flex",alignItems:"center",justifyContent:"center" }}>🤖</div><div style={{ background:"#222",borderRadius:"4px 12px 12px 12px",padding:"10px 14px",display:"flex",gap:4 }}>{[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:3,background:C.accent,animation:`pulse 1.2s ${i*.2}s infinite` }} />)}</div></div>}
        </div>
        {messages.length<=1&&<div style={{ padding:"0 14px 10px",display:"flex",gap:5,flexWrap:"wrap" }}>{SUGGESTIONS.map((s,i)=><button key={i} onClick={()=>send(s)} style={{ fontSize:11,padding:"5px 10px",borderRadius:7,border:"0.5px solid #333",background:"transparent",color:"#666",cursor:"pointer" }}>{s}</button>)}</div>}
        <div style={{ padding:"10px 14px",borderTop:"0.5px solid #222",display:"flex",gap:8 }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Pregunta sobre tus proyectos…" style={{ flex:1,borderRadius:8,border:"0.5px solid #333",background:"#111",color:"#fff",padding:"8px 12px",fontSize:13 }} />
          <button onClick={()=>send()} disabled={!input.trim()||loading} style={{ padding:"8px 14px",borderRadius:8,border:"none",background:input.trim()&&!loading?C.accent:"#222",color:input.trim()&&!loading?"#fff":"#555",cursor:input.trim()&&!loading?"pointer":"not-allowed",fontSize:13 }}>{loading?"…":"→"}</button>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

export default function App() {
  const [currentUser,setCurrentUser]=useState(null);
  const [nav,setNav]=useState("dashboard");
  const [view,setView]=useState("list");
  const [selProject,setSelProject]=useState(null);
  const [updateProject,setUpdateProject]=useState(null);
  const [flowProject,setFlowProject]=useState(null);
  const [showSearch,setShowSearch]=useState(false);
  const [sidebar,setSidebar]=useState(true);
  const [projects,setProjects]=useState([]);
  const [employees,setEmployees]=useState([]);
  const [materials,setMaterials]=useState([]);
  const [auditLog,setAuditLog]=useState([]);
  const [loading,setLoading]=useState(false);
  const [isOnline,setIsOnline]=useState(navigator.onLine);

  useEffect(()=>{ const on=()=>setIsOnline(true); const off=()=>setIsOnline(false); window.addEventListener("online",on); window.addEventListener("offline",off); return()=>{ window.removeEventListener("online",on); window.removeEventListener("offline",off); }; },[]);
  useEffect(()=>{ const h=e=>{ if((e.metaKey||e.ctrlKey)&&e.key==="k"){ e.preventDefault(); setShowSearch(true); } }; window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h); },[]);
  useEffect(()=>{ try{ const s=localStorage.getItem("dm_session"); if(s){ const u=JSON.parse(s); const found=SYSTEM_USERS.find(x=>x.id===u.id); if(found) setCurrentUser(found); } }catch(e){} },[]);

  const loadData=async()=>{ setLoading(true); try{ const [p,e,m,a]=await Promise.all([db.get("projects","select=*"),db.get("employees","select=*"),db.get("materials","select=*"),db.get("audit_log","select=*&limit=50")]); setProjects(p||[]); setEmployees(e||[]); setMaterials(m||[]); setAuditLog(a||[]); }catch(e){ console.error(e); } setLoading(false); };

  useEffect(()=>{ if(currentUser) loadData(); },[currentUser]);

  const handleLogin=u=>{ setCurrentUser(u); try{ localStorage.setItem("dm_session",JSON.stringify({ id:u.id })); }catch(e){} };
  const handleLogout=()=>{ setCurrentUser(null); try{ localStorage.removeItem("dm_session"); }catch(e){} setProjects([]); };

  if(!currentUser) return <LoginScreen onLogin={handleLogin} />;

  const rp=ROLE_PERMS[currentUser.role]||ROLE_PERMS["Instalación"];
  const navItems=[
    { id:"dashboard",emoji:"▦",label:"Dashboard" },
    { id:"projects",emoji:"📁",label:"Proyectos" },
    { id:"employees",emoji:"👷",label:"Empleados" },
    { id:"materials",emoji:"📦",label:"Materiales" },
    { id:"audit",emoji:"🔍",label:"Bitácora" },
    { id:"ai",emoji:"🤖",label:"Asistente IA" },
  ];

  const renderContent=()=>{
    if(loading) return <Spinner />;

    if(nav==="dashboard") return (
      <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div><h2 style={{ margin:0,fontSize:17,fontWeight:500 }}>Bienvenido, {currentUser.name.split(" ")[0]}</h2><div style={{ fontSize:12,color:C.muted }}>{new Date().toLocaleDateString("es-MX",{ weekday:"long",day:"numeric",month:"long" })}</div></div>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <div style={{ width:6,height:6,borderRadius:3,background:isOnline?C.green:C.red }} />
            <span style={{ fontSize:11,color:C.muted }}>{isOnline?"Supabase activo":"Sin conexión"}</span>
            <button onClick={loadData} style={{ fontSize:11,padding:"4px 10px",borderRadius:6,border:`0.5px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer" }}>↻</button>
          </div>
        </div>
        {projects.filter(p=>p.alert).map(p=>(
          <div key={p.id} onClick={()=>{ setSelProject(p); setNav("projects"); }} style={{ background:C.redBg,border:`0.5px solid ${C.redBorder}`,borderRadius:9,padding:"9px 14px",cursor:"pointer" }}>
            <span style={{ fontSize:12,color:C.redText }}>⚠ <b>{p.id}</b> · {p.client} — entrega {p.delivery}</span>
          </div>
        ))}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10 }}>
          <Metric label="Proyectos" value={projects.length} />
          <Metric label="Avance prom." value={`${projects.length?Math.round(projects.reduce((a,p)=>a+(p.progress||0),0)/projects.length):0}%`} color={C.accent} />
          <Metric label="Empleados" value={employees.length} color={C.green} />
          <Metric label="Mat. críticos" value={materials.filter(m=>["agotado","critico","bajo"].includes(m.status)).length} color={C.red} />
        </div>
        <div style={{ background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:12,overflow:"hidden" }}>
          <div style={{ padding:"11px 15px",borderBottom:`0.5px solid ${C.border}`,fontSize:13,fontWeight:500 }}>Proyectos activos</div>
          {projects.length===0?<div style={{ padding:20,fontSize:13,color:C.muted,textAlign:"center" }}>Base de datos conectada. Sin proyectos aún.</div>
          :projects.map(p=>{ const sc=statusColor(p.status); return(
            <div key={p.id} onClick={()=>{ setSelProject(p); setNav("projects"); }} style={{ padding:"10px 15px",borderBottom:`0.5px solid ${C.border}`,cursor:"pointer",display:"flex",gap:10,alignItems:"center" }}
              onMouseEnter={e=>e.currentTarget.style.background=C.bg2} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ width:3,background:prioColor(p.priority),borderRadius:2,alignSelf:"stretch",flexShrink:0 }} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:12,fontWeight:500,marginBottom:3 }}>{p.client} {p.alert&&<span style={{ color:C.red,fontSize:10 }}>●</span>}</div>
                <Bar pct={p.progress||0} color={p.alert?C.red:C.accent} h={5} />
              </div>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
                <Badge label={p.status} bg={sc.bg} text={sc.text} border={sc.border} />
                <div style={{ display:"flex",gap:4 }}>
                  {rp.editar&&<button onClick={ev=>{ev.stopPropagation();setUpdateProject(p);}} style={{ fontSize:10,padding:"2px 7px",borderRadius:5,border:`0.5px solid ${C.accent}`,background:"transparent",color:C.accent,cursor:"pointer" }}>📷</button>}
                  <button onClick={ev=>{ev.stopPropagation();setFlowProject(p);}} style={{ fontSize:10,padding:"2px 7px",borderRadius:5,border:`0.5px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer" }}>→</button>
                </div>
              </div>
            </div>
          );})}
        </div>
      </div>
    );

    if(nav==="projects") {
      if(selProject) return (
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <div style={{ display:"flex",gap:10,alignItems:"center",flexWrap:"wrap" }}>
            <Btn onClick={()=>setSelProject(null)}>← Volver</Btn>
            <div style={{ flex:1 }}><div style={{ fontSize:16,fontWeight:500 }}>{selProject.client}</div><div style={{ fontSize:12,color:C.muted }}>{selProject.id} · {selProject.type}</div></div>
            {rp.editar&&<Btn onClick={()=>setUpdateProject(selProject)}>📷 Actualizar</Btn>}
            <Btn onClick={()=>setFlowProject(selProject)}>→ Avanzar etapa</Btn>
          </div>
          <div style={{ background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:12,padding:"14px 18px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}><span style={{ fontSize:13,color:C.muted }}>Avance</span><span style={{ fontSize:20,fontWeight:500,color:C.accent }}>{selProject.progress||0}%</span></div>
            <Bar pct={selProject.progress||0} h={12} color={selProject.alert?C.red:C.accent} />
            <div style={{ display:"flex",gap:0,marginTop:12,overflowX:"auto" }}>
              {FLOW.map((s,i)=>{ const cur=s===selProject.status; const past=FLOW.indexOf(s)<FLOW.indexOf(selProject.status); return(
                <div key={s} style={{ display:"flex",alignItems:"center" }}>
                  <div style={{ textAlign:"center",minWidth:75 }}>
                    <div style={{ width:22,height:22,borderRadius:11,background:past?C.greenBg:cur?`${C.accent}33`:C.bg2,border:`1.5px solid ${past?C.green:cur?C.accent:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 3px",fontSize:10,color:past?C.green:cur?C.accent:C.muted }}>{past?"✓":cur?"●":"○"}</div>
                    <div style={{ fontSize:9,color:cur?C.accent:past?C.green:C.muted }}>{s}</div>
                  </div>
                  {i<FLOW.length-1&&<div style={{ width:12,height:1,background:past?C.green:C.border,flexShrink:0 }} />}
                </div>
              );})}
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {[["Cliente",selProject.client],["Código",selProject.id],["Tipo",selProject.type],["Área",selProject.area],["Entrega",selProject.delivery||"—"],["Responsable",selProject.responsible||"—"],["Fase",selProject.phase||"—"],["Presupuesto",`$${(selProject.budget||0).toLocaleString()} MXN`]].map(([k,v])=>(
              <div key={k} style={{ background:C.bg2,borderRadius:8,padding:"9px 12px" }}><div style={{ fontSize:10,color:C.muted,marginBottom:3 }}>{k}</div><div style={{ fontSize:13,fontWeight:500 }}>{v}</div></div>
            ))}
          </div>
        </div>
      );
      return (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <h2 style={{ margin:0,fontSize:17,fontWeight:500 }}>Proyectos</h2>
            <div style={{ display:"flex",border:`0.5px solid ${C.border}`,borderRadius:8,overflow:"hidden" }}>
              <button onClick={()=>setView("list")} style={{ padding:"5px 11px",border:"none",background:view==="list"?`${C.accent}22`:"transparent",color:view==="list"?C.accent:C.muted,cursor:"pointer",fontSize:12 }}>≡ Lista</button>
              <button onClick={()=>setView("kanban")} style={{ padding:"5px 11px",border:"none",background:view==="kanban"?`${C.accent}22`:"transparent",color:view==="kanban"?C.accent:C.muted,cursor:"pointer",fontSize:12 }}>⊞ Kanban</button>
            </div>
          </div>
          {view==="kanban"?<KanbanView projects={projects} onProject={setSelProject} />
          :projects.map(p=>{ const sc=statusColor(p.status); return(
            <div key={p.id} onClick={()=>setSelProject(p)} style={{ background:C.bg,border:`0.5px solid ${p.alert?C.redBorder:C.border}`,borderRadius:12,padding:"13px 17px",cursor:"pointer",display:"flex",gap:13,alignItems:"center" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=p.alert?C.redBorder:C.border}>
              <div style={{ width:3,background:prioColor(p.priority),borderRadius:2,alignSelf:"stretch",flexShrink:0 }} />
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:3 }}><span style={{ fontWeight:500 }}>{p.client}</span>{p.alert&&<span style={{ fontSize:10,color:C.red }}>⚠</span>}</div>
                <div style={{ fontSize:11,color:C.muted,marginBottom:6 }}>{p.id} · {p.type}</div>
                <Bar pct={p.progress||0} color={p.alert?C.red:C.accent} />
              </div>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5 }}>
                <Badge label={p.status} bg={sc.bg} text={sc.text} border={sc.border} />
                <div style={{ display:"flex",gap:4 }}>
                  {rp.editar&&<button onClick={e=>{e.stopPropagation();setUpdateProject(p);}} style={{ fontSize:10,padding:"2px 7px",borderRadius:5,border:`0.5px solid ${C.accent}`,background:"transparent",color:C.accent,cursor:"pointer" }}>📷</button>}
                  <button onClick={e=>{e.stopPropagation();setFlowProject(p);}} style={{ fontSize:10,padding:"2px 7px",borderRadius:5,border:`0.5px solid ${C.border2}`,background:"transparent",color:C.muted,cursor:"pointer" }}>→ Etapa</button>
                </div>
              </div>
            </div>
          );})}
        </div>
      );
    }

    if(nav==="employees") return (
      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        <h2 style={{ margin:0,fontSize:17,fontWeight:500 }}>Empleados</h2>
        {employees.length===0?<div style={{ fontSize:13,color:C.muted }}>Sin empleados en base de datos.</div>
        :<div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12 }}>
          {employees.map(e=>{ const lc={ alta:C.orange,saturado:C.red,baja:C.blue,normal:C.green }[e.load]||C.accent; return(
            <div key={e.id} style={{ background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:12,padding:"14px",display:"flex",flexDirection:"column",gap:10 }}>
              <div style={{ display:"flex",gap:10,alignItems:"center" }}><Avatar initials={e.avatar||e.name?.slice(0,2)} size={40} color={lc} /><div><div style={{ fontWeight:500,fontSize:13 }}>{e.name}</div><div style={{ fontSize:11,color:C.muted }}>{e.role} · {e.area}</div></div></div>
              <div><div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}><span style={{ fontSize:11,color:C.muted }}>Eficiencia</span><span style={{ fontSize:12,fontWeight:500,color:(e.efficiency||80)>=90?C.green:C.accent }}>{e.efficiency||80}%</span></div><Bar pct={e.efficiency||80} color={(e.efficiency||80)>=90?C.green:C.accent} /></div>
            </div>
          );})}
        </div>}
      </div>
    );

    if(nav==="materials") return (
      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        <h2 style={{ margin:0,fontSize:17,fontWeight:500 }}>Materiales</h2>
        {materials.filter(m=>m.alert_msg).map(m=><div key={m.id} style={{ background:C.redBg,border:`0.5px solid ${C.redBorder}`,borderRadius:9,padding:"9px 14px",fontSize:12,color:C.redText }}>🚨 {m.alert_msg}</div>)}
        {materials.map(m=>{ const ms={ ok:{ bg:C.greenBg,text:C.green,border:C.greenBorder,label:"Disponible" },critico:{ bg:C.orangeBg,text:C.orange,border:C.orangeBorder,label:"Crítico" },agotado:{ bg:C.redBg,text:C.red,border:C.redBorder,label:"Agotado" },bajo:{ bg:C.yellowBg,text:C.yellow,border:C.yellowBorder,label:"Stock bajo" },pendiente:{ bg:C.purpleBg,text:C.purple,border:C.purpleBorder,label:"En camino" } }[m.status]||{ bg:C.bg2,text:C.muted,border:C.border,label:m.status||"—" }; return(
          <div key={m.id} style={{ background:C.bg,border:`0.5px solid ${m.status!=="ok"?ms.border:C.border}`,borderRadius:10,padding:"11px 14px",display:"flex",gap:12,alignItems:"center" }}>
            <div style={{ flex:1 }}><div style={{ display:"flex",gap:8,alignItems:"center",marginBottom:4 }}><span style={{ fontSize:13,fontWeight:500 }}>{m.name}</span><Badge label={ms.label} bg={ms.bg} text={ms.text} border={ms.border} /></div><div style={{ fontSize:11,color:C.muted }}>{m.stock} {m.unit} · {m.supplier}</div></div>
            <div style={{ fontSize:13,fontWeight:500 }}>${m.cost}/{m.unit}</div>
          </div>
        );})}
      </div>
    );

    if(nav==="audit") return (
      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        <h2 style={{ margin:0,fontSize:17,fontWeight:500 }}>Bitácora</h2>
        <Metric label="Acciones registradas en Supabase" value={auditLog.length} color={C.accent} />
        {auditLog.length===0?<div style={{ fontSize:13,color:C.muted,padding:"20px 0" }}>Sin actividad aún. Las acciones aparecerán aquí conforme el equipo use el sistema.</div>
        :auditLog.map(l=>(
          <div key={l.id} style={{ background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:10,padding:"11px 15px",display:"flex",gap:10 }}>
            <span style={{ fontSize:16 }}>{{ "actualizó avance":"📊","aprobó etapa":"✅","inició sesión":"🔐" }[l.action]||"📋"}</span>
            <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:500 }}>{l.user_name} <span style={{ color:C.muted,fontWeight:400 }}>{l.action}</span> {l.entity}</div>{l.detail&&<div style={{ fontSize:11,color:C.muted,marginTop:2 }}>{l.detail}</div>}<div style={{ fontSize:10,color:C.muted,marginTop:3 }}>🕐 {new Date(l.created_at).toLocaleString("es-MX")} · {l.module}</div></div>
          </div>
        ))}
      </div>
    );

    if(nav==="ai") return <AIAssistant projects={projects} currentUser={currentUser} />;
  };

  return (
    <div style={{ display:"flex",minHeight:"100vh",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",background:"#0f0f0f",fontSize:14,color:"#e5e5e5" }}>
      <div style={{ width:sidebar?205:54,background:"#111",borderRight:"0.5px solid #222",display:"flex",flexDirection:"column",flexShrink:0,transition:"width .2s" }}>
        <div style={{ padding:"12px 11px",borderBottom:"0.5px solid #222",display:"flex",alignItems:"center",justifyContent:sidebar?"flex-start":"center",minHeight:62 }}>
          {sidebar?<div><span style={{ fontFamily:"Georgia,serif",fontSize:19,fontWeight:700,color:"#fff" }}>De Metal</span><div style={{ fontSize:9,color:"#555",letterSpacing:"0.12em",textTransform:"uppercase",marginTop:2 }}>Líderes en hierro forjado</div></div>
          :<span style={{ fontFamily:"Georgia,serif",fontSize:16,fontWeight:700,color:"#fff" }}>D</span>}
        </div>
        <nav style={{ flex:1,padding:"10px 6px",display:"flex",flexDirection:"column",gap:2 }}>
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>{ setNav(item.id); setSelProject(null); }}
              style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 9px",borderRadius:8,border:"none",cursor:"pointer",background:nav===item.id?`${C.accent}22`:"transparent",color:nav===item.id?C.accent:"#666",fontWeight:nav===item.id?500:400,fontSize:13,textAlign:"left",width:"100%" }}>
              <span style={{ fontSize:13,flexShrink:0 }}>{item.emoji}</span>
              {sidebar&&<span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding:"8px",borderTop:"0.5px solid #222" }}>
          {sidebar?<div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <Avatar initials={currentUser.avatar} size={26} color={currentUser.color} />
            <div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:11,fontWeight:500,color:"#fff" }}>{currentUser.name.split(" ")[0]}</div><div style={{ fontSize:10,color:"#555" }}>{currentUser.role}</div></div>
            <button onClick={handleLogout} style={{ background:"none",border:"none",cursor:"pointer",color:"#555",fontSize:13 }}>⏻</button>
          </div>:<button onClick={handleLogout} style={{ width:"100%",background:"none",border:"none",cursor:"pointer",color:"#555",fontSize:14 }}>⏻</button>}
        </div>
        <button onClick={()=>setSidebar(!sidebar)} style={{ margin:"4px 6px 10px",padding:"5px",border:"0.5px solid #222",borderRadius:7,cursor:"pointer",background:"transparent",color:"#555",fontSize:10 }}>{sidebar?"◀":"▶"}</button>
      </div>
      <div style={{ flex:1,display:"flex",flexDirection:"column",minWidth:0 }}>
        <div style={{ background:"#111",borderBottom:"0.5px solid #222",padding:"10px 20px",display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ fontFamily:"Georgia,serif",fontSize:13,fontWeight:700,color:"#fff" }}>De Metal</span>
          <span style={{ color:"#333" }}>|</span>
          <span style={{ fontSize:13,color:"#666" }}>{selProject?selProject.client:navItems.find(n=>n.id===nav)?.label}</span>
          <div style={{ flex:1 }} />
          <button onClick={()=>setShowSearch(true)} style={{ display:"flex",gap:6,alignItems:"center",padding:"5px 12px",borderRadius:8,border:"0.5px solid #333",background:"#1a1a1a",color:"#666",cursor:"pointer",fontSize:12 }}>🔍 Buscar <span style={{ fontSize:10,opacity:.5 }}>⌘K</span></button>
          <div style={{ display:"flex",gap:5,alignItems:"center" }}>
            <div style={{ width:6,height:6,borderRadius:3,background:isOnline?C.green:C.red }} />
            <span style={{ fontSize:10,color:"#555" }}>{isOnline?"Supabase":"Offline"}</span>
          </div>
          <Badge label={currentUser.role} bg={rp.bg} text={rp.color} border={rp.border} />
        </div>
        <div style={{ flex:1,padding:20,overflowY:"auto" }}>
          {renderContent()}
        </div>
      </div>
      {showSearch&&<GlobalSearch projects={projects} onSelect={p=>{ setSelProject(p); setNav("projects"); }} onClose={()=>setShowSearch(false)} />}
      {updateProject&&<QuickUpdate project={updateProject} currentUser={currentUser} onClose={()=>setUpdateProject(null)} onSaved={loadData} />}
      {flowProject&&<FlowApproval project={flowProject} currentUser={currentUser} onClose={()=>setFlowProject(null)} onSaved={loadData} />}
    </div>
  );
}