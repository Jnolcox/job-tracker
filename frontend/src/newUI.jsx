import { useState, useMemo } from "react";

// ─── Seed Data ────────────────────────────────────────────────────────────────
const STAGES = ["Applied", "Phone Screen", "Technical", "Onsite", "Offer", "Rejected", "Withdrawn"];

const STAGE_COLOR = {
  Applied:       "#4E9AF1",
  "Phone Screen":"#A78BFA",
  Technical:     "#F59E0B",
  Onsite:        "#34D399",
  Offer:         "#10B981",
  Rejected:      "#F87171",
  Withdrawn:     "#6B7280",
};

const COMPANIES = [
  { id:1,  company:"Wealthfront",  role:"Staff Software Engineer",         stage:"Technical",     appliedAt:"2025-03-10T09:15:00", lastUpdate:"2025-03-18T14:00:00", notes:"Referral from Maya" },
  { id:2,  company:"Gusto",        role:"Senior Software Engineer",        stage:"Phone Screen",  appliedAt:"2025-03-12T14:32:00", lastUpdate:"2025-03-14T10:00:00", notes:"Cold apply via LinkedIn" },
  { id:3,  company:"Ro",           role:"Staff Engineer – FinTech",        stage:"Onsite",        appliedAt:"2025-03-05T11:00:00", lastUpdate:"2025-03-20T16:30:00", notes:"Loop interview scheduled" },
  { id:4,  company:"CLEAR",        role:"Senior Software Engineer",        stage:"Applied",       appliedAt:"2025-03-22T08:45:00", lastUpdate:"2025-03-22T08:45:00", notes:"" },
  { id:5,  company:"BlinkRX",      role:"Lead Software Engineer",         stage:"Rejected",      appliedAt:"2025-02-28T16:00:00", lastUpdate:"2025-03-15T12:00:00", notes:"No feedback provided" },
  { id:6,  company:"Stripe",       role:"Senior Engineer – Platform",      stage:"Applied",       appliedAt:"2025-03-20T10:20:00", lastUpdate:"2025-03-20T10:20:00", notes:"" },
  { id:7,  company:"Plaid",        role:"Staff Software Engineer",         stage:"Phone Screen",  appliedAt:"2025-03-14T13:00:00", lastUpdate:"2025-03-16T09:00:00", notes:"Recruiter reached out" },
  { id:8,  company:"Chime",        role:"Senior Full-Stack Engineer",      stage:"Technical",     appliedAt:"2025-03-08T09:30:00", lastUpdate:"2025-03-17T15:00:00", notes:"Take-home assigned" },
  { id:9,  company:"Brex",         role:"Senior Software Engineer",        stage:"Applied",       appliedAt:"2025-03-21T07:55:00", lastUpdate:"2025-03-21T07:55:00", notes:"" },
  { id:10, company:"Robinhood",    role:"Staff Engineer – Infrastructure", stage:"Withdrawn",     appliedAt:"2025-03-01T15:10:00", lastUpdate:"2025-03-10T11:00:00", notes:"Accepted better opportunity" },
  { id:11, company:"Mercury",      role:"Senior Software Engineer",        stage:"Offer",         appliedAt:"2025-02-20T10:00:00", lastUpdate:"2025-03-22T09:00:00", notes:"Offer: $210k + equity" },
  { id:12, company:"Affirm",       role:"Staff Engineer – Payments",       stage:"Rejected",      appliedAt:"2025-03-03T14:00:00", lastUpdate:"2025-03-18T16:00:00", notes:"Post-onsite rejection" },
  { id:13, company:"Coinbase",     role:"Senior Software Engineer",        stage:"Applied",       appliedAt:"2025-03-19T08:00:00", lastUpdate:"2025-03-19T08:00:00", notes:"" },
  { id:14, company:"Ramp",         role:"Staff Software Engineer",         stage:"Phone Screen",  appliedAt:"2025-03-15T11:30:00", lastUpdate:"2025-03-18T13:00:00", notes:"" },
  { id:15, company:"Navan",        role:"Senior Engineer",                 stage:"Technical",     appliedAt:"2025-03-11T16:45:00", lastUpdate:"2025-03-19T10:00:00", notes:"System design round" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / 86400000);
const today = new Date("2025-03-23T12:00:00");

function timeInStage(app) {
  return daysBetween(app.lastUpdate, today.toISOString());
}
function totalDaysActive(app) {
  if (app.stage === "Rejected" || app.stage === "Withdrawn" || app.stage === "Offer") {
    return daysBetween(app.appliedAt, app.lastUpdate);
  }
  return daysBetween(app.appliedAt, today.toISOString());
}

// ─── Heatmap helpers ──────────────────────────────────────────────────────────
const HOURS = Array.from({length:24},(_,i)=>i);
const DAYS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function buildHeatmap(apps) {
  const grid = {};
  DAYS.forEach(d => { grid[d] = {}; HOURS.forEach(h => { grid[d][h] = 0; }); });
  apps.forEach(a => {
    const dt = new Date(a.appliedAt);
    const d  = DAYS[dt.getDay()];
    const h  = dt.getHours();
    grid[d][h]++;
  });
  return grid;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background:"#0E1117",
      border:`1px solid ${accent}33`,
      borderRadius:12,
      padding:"20px 24px",
      display:"flex",
      flexDirection:"column",
      gap:4,
      position:"relative",
      overflow:"hidden",
    }}>
      <div style={{
        position:"absolute",top:0,left:0,right:0,height:2,
        background:`linear-gradient(90deg,${accent},transparent)`,
      }}/>
      <span style={{color:"#6B7280",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{label}</span>
      <span style={{color:"#F9FAFB",fontSize:32,fontWeight:700,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:"0.04em"}}>{value}</span>
      {sub && <span style={{color:accent,fontSize:12,fontFamily:"'DM Mono',monospace"}}>{sub}</span>}
    </div>
  );
}

function StageFunnel({ apps }) {
  const counts = STAGES.reduce((acc,s) => { acc[s]=0; return acc; }, {});
  apps.forEach(a => { if(counts[a.stage]!==undefined) counts[a.stage]++; });
  const max = Math.max(...Object.values(counts), 1);
  return (
    <div style={{background:"#0E1117",border:"1px solid #1F2937",borderRadius:12,padding:"20px 24px"}}>
      <h3 style={{color:"#9CA3AF",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:16}}>Pipeline Funnel</h3>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {STAGES.map(s => (
          <div key={s} style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{width:80,color:"#9CA3AF",fontSize:11,fontFamily:"'DM Mono',monospace",textAlign:"right",flexShrink:0}}>{s}</span>
            <div style={{flex:1,height:20,background:"#1F2937",borderRadius:4,overflow:"hidden"}}>
              <div style={{
                width:`${(counts[s]/max)*100}%`,
                height:"100%",
                background:STAGE_COLOR[s],
                borderRadius:4,
                transition:"width 0.6s cubic-bezier(.4,0,.2,1)",
                minWidth:counts[s]>0?2:0,
              }}/>
            </div>
            <span style={{width:18,color:STAGE_COLOR[s],fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{counts[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimeInStageChart({ apps }) {
  const active = apps.filter(a => !["Rejected","Withdrawn","Offer"].includes(a.stage));
  const sorted = [...active].sort((a,b) => timeInStage(b) - timeInStage(a)).slice(0,8);
  const max = Math.max(...sorted.map(a => timeInStage(a)), 1);
  return (
    <div style={{background:"#0E1117",border:"1px solid #1F2937",borderRadius:12,padding:"20px 24px"}}>
      <h3 style={{color:"#9CA3AF",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:16}}>Time in Current Stage (days)</h3>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {sorted.map(a => {
          const days = timeInStage(a);
          const pct  = (days/max)*100;
          const color = days > 7 ? "#F87171" : days > 3 ? "#F59E0B" : "#34D399";
          return (
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{width:90,color:"#D1D5DB",fontSize:11,fontFamily:"'DM Mono',monospace",textAlign:"right",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0}}>{a.company}</span>
              <div style={{flex:1,height:18,background:"#1F2937",borderRadius:4,overflow:"hidden"}}>
                <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:4,transition:"width 0.6s"}}/>
              </div>
              <span style={{width:22,color,fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:700}}>{days}d</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MaxTimePerStageChart({ apps }) {
  // For each stage, find the application that spent the MOST total days active while in that stage.
  // For terminal stages (Rejected/Withdrawn/Offer) we use totalDaysActive; for active we use timeInStage.
  // Strategy: for each app, attribute its total active days to its current stage.
  const stageMax = {};
  const stageCompany = {};
  STAGES.forEach(s => { stageMax[s] = 0; stageCompany[s] = null; });

  apps.forEach(a => {
    const days = totalDaysActive(a);
    if (days > (stageMax[a.stage] || 0)) {
      stageMax[a.stage] = days;
      stageCompany[a.stage] = a.company;
    }
  });

  const presentStages = STAGES.filter(s => stageMax[s] > 0);
  const maxVal = Math.max(...presentStages.map(s => stageMax[s]), 1);

  return (
    <div style={{background:"#0E1117",border:"1px solid #1F2937",borderRadius:12,padding:"20px 24px"}}>
      <h3 style={{color:"#9CA3AF",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:4}}>
        Max Days in Stage
      </h3>
      <p style={{color:"#4B5563",fontSize:10,fontFamily:"'DM Mono',monospace",marginBottom:16}}>
        Longest total days spent per pipeline stage (top applicant shown)
      </p>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {presentStages.map(s => {
          const days = stageMax[s];
          const pct  = (days / maxVal) * 100;
          const color = STAGE_COLOR[s];
          return (
            <div key={s} style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{width:84,color:"#9CA3AF",fontSize:11,fontFamily:"'DM Mono',monospace",textAlign:"right",flexShrink:0}}>{s}</span>
              <div style={{flex:1,height:20,background:"#1F2937",borderRadius:4,overflow:"hidden",position:"relative"}}>
                <div style={{
                  width:`${pct}%`,height:"100%",
                  background:`linear-gradient(90deg,${color}99,${color})`,
                  borderRadius:4,transition:"width 0.7s cubic-bezier(.4,0,.2,1)",
                }}/>
                {stageCompany[s] && (
                  <span style={{
                    position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",
                    color:"#ffffff88",fontSize:9,fontFamily:"'DM Mono',monospace",
                    whiteSpace:"nowrap",overflow:"hidden",maxWidth:"80%",
                  }}>{stageCompany[s]}</span>
                )}
              </div>
              <span style={{width:28,color,fontSize:12,fontFamily:"'DM Mono',monospace",fontWeight:700,textAlign:"right"}}>{days}d</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityHeatmap({ apps }) {
  const grid = buildHeatmap(apps);
  const allVals = DAYS.flatMap(d => HOURS.map(h => grid[d][h]));
  const maxVal = Math.max(...allVals, 1);

  const cellColor = (v) => {
    if (v === 0) return "#111827";
    const t = v / maxVal;
    // deep blue → cyan
    const r = Math.round(17  + (80-17)*t);
    const g = Math.round(24  + (240-24)*t);
    const b = Math.round(39  + (255-39)*t);
    return `rgb(${r},${g},${b})`;
  };

  const displayHours = [6,9,12,15,18,21];

  return (
    <div style={{background:"#0E1117",border:"1px solid #1F2937",borderRadius:12,padding:"20px 24px",overflowX:"auto"}}>
      <h3 style={{color:"#9CA3AF",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:16}}>Application Heatmap — Hour of Day × Day of Week</h3>
      <div style={{display:"flex",gap:0}}>
        {/* Y labels */}
        <div style={{display:"flex",flexDirection:"column",justifyContent:"space-around",paddingTop:24,paddingBottom:4,marginRight:6}}>
          {DAYS.map(d=>(
            <span key={d} style={{color:"#6B7280",fontSize:10,fontFamily:"'DM Mono',monospace",width:26,textAlign:"right"}}>{d}</span>
          ))}
        </div>
        <div style={{flex:1,minWidth:0}}>
          {/* X labels */}
          <div style={{display:"grid",gridTemplateColumns:`repeat(24,1fr)`,marginBottom:4,paddingLeft:1}}>
            {HOURS.map(h=>(
              <span key={h} style={{
                color: displayHours.includes(h)?"#6B7280":"transparent",
                fontSize:9,fontFamily:"'DM Mono',monospace",textAlign:"center",
              }}>{h}</span>
            ))}
          </div>
          {/* Grid */}
          {DAYS.map(d=>(
            <div key={d} style={{display:"grid",gridTemplateColumns:`repeat(24,1fr)`,gap:2,marginBottom:2}}>
              {HOURS.map(h=>{
                const v = grid[d][h];
                return (
                  <div key={h} title={`${d} ${h}:00 — ${v} app${v!==1?"s":""}`} style={{
                    aspectRatio:"1",
                    background:cellColor(v),
                    borderRadius:2,
                    cursor:"default",
                  }}/>
                );
              })}
            </div>
          ))}
          {/* Legend */}
          <div style={{display:"flex",alignItems:"center",gap:4,marginTop:10,justifyContent:"flex-end"}}>
            <span style={{color:"#6B7280",fontSize:10,fontFamily:"'DM Mono',monospace"}}>0</span>
            {[0,0.25,0.5,0.75,1].map(t=>(
              <div key={t} style={{width:14,height:14,borderRadius:2,background:cellColor(t)}}/>
            ))}
            <span style={{color:"#6B7280",fontSize:10,fontFamily:"'DM Mono',monospace"}}>{maxVal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DayOfWeekBar({ apps }) {
  const counts = DAYS.reduce((a,d)=>{a[d]=0;return a;},{});
  apps.forEach(a => { const d = DAYS[new Date(a.appliedAt).getDay()]; counts[d]++; });
  const max = Math.max(...Object.values(counts),1);
  return (
    <div style={{background:"#0E1117",border:"1px solid #1F2937",borderRadius:12,padding:"20px 24px"}}>
      <h3 style={{color:"#9CA3AF",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:16}}>Applications by Day of Week</h3>
      <div style={{display:"flex",gap:8,alignItems:"flex-end",height:80}}>
        {DAYS.map(d=>{
          const v = counts[d];
          const h = Math.max((v/max)*64,v>0?4:0);
          return (
            <div key={d} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <span style={{color:"#A78BFA",fontSize:10,fontFamily:"'DM Mono',monospace"}}>{v||""}</span>
              <div style={{width:"100%",height:h,background:"linear-gradient(to top,#7C3AED,#A78BFA)",borderRadius:"3px 3px 0 0",transition:"height 0.6s"}}/>
              <span style={{color:"#6B7280",fontSize:10,fontFamily:"'DM Mono',monospace"}}>{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HourBar({ apps }) {
  const counts = HOURS.reduce((a,h)=>{a[h]=0;return a;},{});
  apps.forEach(a => { const h = new Date(a.appliedAt).getHours(); counts[h]++; });
  const max = Math.max(...Object.values(counts),1);
  const AM_PM = h => h===0?"12a":h<12?`${h}a`:h===12?"12p":`${h-12}p`;
  const labeled = [0,6,9,12,15,18,21,23];
  return (
    <div style={{background:"#0E1117",border:"1px solid #1F2937",borderRadius:12,padding:"20px 24px"}}>
      <h3 style={{color:"#9CA3AF",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:16}}>Applications by Hour</h3>
      <div style={{display:"flex",gap:2,alignItems:"flex-end",height:72}}>
        {HOURS.map(h=>{
          const v = counts[h];
          const ht = Math.max((v/max)*56,v>0?3:0);
          return (
            <div key={h} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <div style={{width:"100%",height:ht,background:"linear-gradient(to top,#0EA5E9,#38BDF8)",borderRadius:"2px 2px 0 0",transition:"height 0.6s"}}/>
              <span style={{color: labeled.includes(h)?"#6B7280":"transparent",fontSize:8,fontFamily:"'DM Mono',monospace",transform:"rotate(-45deg)",transformOrigin:"top left",display:"block",width:16,marginTop:2}}>{AM_PM(h)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Stage badge
function Badge({ stage }) {
  return (
    <span style={{
      background:`${STAGE_COLOR[stage]}22`,
      color:STAGE_COLOR[stage],
      border:`1px solid ${STAGE_COLOR[stage]}55`,
      borderRadius:6,
      padding:"2px 8px",
      fontSize:11,
      fontFamily:"'DM Mono',monospace",
      whiteSpace:"nowrap",
    }}>{stage}</span>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ app, onClose, onSave }) {
  const [form, setForm] = useState({...app});
  if (!app) return null;
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",
      display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#0E1117",border:"1px solid #374151",borderRadius:16,
        padding:32,width:480,display:"flex",flexDirection:"column",gap:16,
      }}>
        <h2 style={{color:"#F9FAFB",fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:"0.04em",margin:0}}>
          {app.id ? "Edit Application" : "New Application"}
        </h2>
        {[
          ["Company",  "company", "text"],
          ["Role",     "role",    "text"],
          ["Applied",  "appliedAt","datetime-local"],
          ["Last Update","lastUpdate","datetime-local"],
        ].map(([label,key,type])=>(
          <label key={key} style={{display:"flex",flexDirection:"column",gap:6}}>
            <span style={{color:"#6B7280",fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:"0.1em"}}>{label.toUpperCase()}</span>
            <input
              type={type}
              value={type==="datetime-local" ? form[key]?.slice(0,16) : form[key]}
              onChange={e=>set(key, type==="datetime-local"?e.target.value+":00":e.target.value)}
              style={{
                background:"#111827",border:"1px solid #374151",borderRadius:8,
                padding:"8px 12px",color:"#F9FAFB",fontFamily:"'DM Mono',monospace",fontSize:13,
                outline:"none",
              }}
            />
          </label>
        ))}
        <label style={{display:"flex",flexDirection:"column",gap:6}}>
          <span style={{color:"#6B7280",fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:"0.1em"}}>STAGE</span>
          <select value={form.stage} onChange={e=>set("stage",e.target.value)} style={{
            background:"#111827",border:"1px solid #374151",borderRadius:8,
            padding:"8px 12px",color:"#F9FAFB",fontFamily:"'DM Mono',monospace",fontSize:13,
          }}>
            {STAGES.map(s=><option key={s}>{s}</option>)}
          </select>
        </label>
        <label style={{display:"flex",flexDirection:"column",gap:6}}>
          <span style={{color:"#6B7280",fontSize:11,fontFamily:"'DM Mono',monospace",letterSpacing:"0.1em"}}>NOTES</span>
          <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={2} style={{
            background:"#111827",border:"1px solid #374151",borderRadius:8,
            padding:"8px 12px",color:"#F9FAFB",fontFamily:"'DM Mono',monospace",fontSize:13,resize:"vertical",
          }}/>
        </label>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"8px 20px",borderRadius:8,border:"1px solid #374151",background:"transparent",color:"#9CA3AF",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12}}>Cancel</button>
          <button onClick={()=>onSave(form)} style={{padding:"8px 20px",borderRadius:8,border:"none",background:"#4E9AF1",color:"#fff",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700}}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
const TH = ({children, onClick, sorted}) => (
  <th onClick={onClick} style={{
    padding:"10px 14px",textAlign:"left",color:"#6B7280",
    fontSize:10,letterSpacing:"0.12em",fontFamily:"'DM Mono',monospace",
    borderBottom:"1px solid #1F2937",cursor:onClick?"pointer":"default",
    userSelect:"none",whiteSpace:"nowrap",
    background:"#070B10",
  }}>
    {children}{sorted?" ↓":""}
  </th>
);

function AppTable({ apps, onEdit, onDelete }) {
  const [sortKey, setSortKey] = useState("appliedAt");
  const [filter,  setFilter]  = useState("All");
  const [search,  setSearch]  = useState("");

  const sorted = useMemo(()=>{
    let rows = [...apps];
    if(filter !== "All") rows = rows.filter(a=>a.stage===filter);
    if(search) rows = rows.filter(a=>
      a.company.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase())
    );
    rows.sort((a,b)=>{
      if(sortKey==="appliedAt"||sortKey==="lastUpdate") return new Date(b[sortKey])-new Date(a[sortKey]);
      if(sortKey==="days") return totalDaysActive(b)-totalDaysActive(a);
      if(sortKey==="stageTime") return timeInStage(b)-timeInStage(a);
      return String(a[sortKey]).localeCompare(String(b[sortKey]));
    });
    return rows;
  },[apps,sortKey,filter,search]);

  return (
    <div style={{background:"#0E1117",border:"1px solid #1F2937",borderRadius:12,overflow:"hidden"}}>
      {/* toolbar */}
      <div style={{padding:"16px 20px",display:"flex",gap:12,alignItems:"center",borderBottom:"1px solid #1F2937",flexWrap:"wrap"}}>
        <input
          placeholder="Search company / role…"
          value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{
            background:"#111827",border:"1px solid #374151",borderRadius:8,
            padding:"6px 12px",color:"#F9FAFB",fontFamily:"'DM Mono',monospace",fontSize:12,
            outline:"none",width:220,
          }}
        />
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {["All",...STAGES].map(s=>(
            <button key={s} onClick={()=>setFilter(s)} style={{
              padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",
              fontSize:10,fontFamily:"'DM Mono',monospace",fontWeight:600,
              background: filter===s ? (STAGE_COLOR[s]||"#374151") : "#1F2937",
              color: filter===s?"#fff":"#9CA3AF",
              transition:"background 0.2s",
            }}>{s}</button>
          ))}
        </div>
        <button onClick={()=>onEdit({id:null,company:"",role:"",stage:"Applied",appliedAt:new Date().toISOString(),lastUpdate:new Date().toISOString(),notes:""})}
          style={{marginLeft:"auto",padding:"6px 14px",borderRadius:8,border:"none",background:"#4E9AF1",color:"#fff",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:700}}>
          + Add
        </button>
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr>
              <TH onClick={()=>setSortKey("company")} sorted={sortKey==="company"}>Company</TH>
              <TH onClick={()=>setSortKey("role")}    sorted={sortKey==="role"}>Role</TH>
              <TH onClick={()=>setSortKey("stage")}   sorted={sortKey==="stage"}>Stage</TH>
              <TH onClick={()=>setSortKey("appliedAt")} sorted={sortKey==="appliedAt"}>Applied</TH>
              <TH onClick={()=>setSortKey("lastUpdate")} sorted={sortKey==="lastUpdate"}>Last Update</TH>
              <TH onClick={()=>setSortKey("days")} sorted={sortKey==="days"}>Total Days</TH>
              <TH onClick={()=>setSortKey("stageTime")} sorted={sortKey==="stageTime"}>Stage Age</TH>
              <TH>Notes</TH>
              <TH>Actions</TH>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a,i)=>(
              <tr key={a.id} style={{
                background: i%2===0?"#080C12":"#0A0F16",
                transition:"background 0.15s",
              }}
              onMouseEnter={e=>e.currentTarget.style.background="#111827"}
              onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#080C12":"#0A0F16"}
              >
                <td style={{padding:"10px 14px",color:"#F9FAFB",fontFamily:"'DM Mono',monospace",fontSize:12,fontWeight:600}}>{a.company}</td>
                <td style={{padding:"10px 14px",color:"#9CA3AF",fontFamily:"'DM Mono',monospace",fontSize:11,maxWidth:200,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.role}</td>
                <td style={{padding:"10px 14px"}}><Badge stage={a.stage}/></td>
                <td style={{padding:"10px 14px",color:"#6B7280",fontFamily:"'DM Mono',monospace",fontSize:11}}>{new Date(a.appliedAt).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td>
                <td style={{padding:"10px 14px",color:"#6B7280",fontFamily:"'DM Mono',monospace",fontSize:11}}>{new Date(a.lastUpdate).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td>
                <td style={{padding:"10px 14px",color:"#D1D5DB",fontFamily:"'DM Mono',monospace",fontSize:12,textAlign:"center"}}>{totalDaysActive(a)}d</td>
                <td style={{padding:"10px 14px",fontFamily:"'DM Mono',monospace",fontSize:12,textAlign:"center",
                  color: timeInStage(a)>7?"#F87171":timeInStage(a)>3?"#F59E0B":"#34D399"
                }}>{timeInStage(a)}d</td>
                <td style={{padding:"10px 14px",color:"#6B7280",fontFamily:"'DM Mono',monospace",fontSize:10,maxWidth:160,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.notes||"—"}</td>
                <td style={{padding:"10px 14px"}}>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>onEdit(a)} style={{padding:"3px 8px",borderRadius:5,border:"1px solid #374151",background:"transparent",color:"#9CA3AF",cursor:"pointer",fontSize:10,fontFamily:"'DM Mono',monospace"}}>Edit</button>
                    <button onClick={()=>onDelete(a.id)} style={{padding:"3px 8px",borderRadius:5,border:"1px solid #991B1B",background:"transparent",color:"#F87171",cursor:"pointer",fontSize:10,fontFamily:"'DM Mono',monospace"}}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length===0 && (
              <tr><td colSpan={9} style={{padding:40,textAlign:"center",color:"#374151",fontFamily:"'DM Mono',monospace",fontSize:13}}>No applications match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{padding:"10px 20px",color:"#4B5563",fontSize:10,fontFamily:"'DM Mono',monospace",borderTop:"1px solid #1F2937"}}>
        {sorted.length} of {apps.length} applications
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [apps,    setApps]    = useState(COMPANIES);
  const [editing, setEditing] = useState(null);

  const handleSave = (form) => {
    if (form.id) {
      setApps(prev => prev.map(a => a.id===form.id ? form : a));
    } else {
      setApps(prev => [...prev, {...form, id: Date.now()}]);
    }
    setEditing(null);
  };
  const handleDelete = (id) => setApps(prev => prev.filter(a=>a.id!==id));

  // ── Derived metrics ──
  const activeApps    = apps.filter(a=>!["Rejected","Withdrawn"].includes(a.stage));
  const offers        = apps.filter(a=>a.stage==="Offer").length;
  const rejected      = apps.filter(a=>a.stage==="Rejected").length;
  const responseRate  = Math.round((apps.filter(a=>a.stage!=="Applied").length/apps.length)*100);
  const avgDays       = Math.round(apps.reduce((s,a)=>s+totalDaysActive(a),0)/apps.length);
  const inInterview   = apps.filter(a=>a.stage==="Technical"||a.stage==="Onsite").length;
  const offerRate     = Math.round((offers / apps.length) * 100);
  const maxStageDays  = Math.max(...apps.map(a=>timeInStage(a)));
  const stalestApp    = apps.find(a=>timeInStage(a)===maxStageDays);
  const weeklyPace    = (() => {
    const dates = apps.map(a=>new Date(a.appliedAt));
    const minD = new Date(Math.min(...dates)), maxD = new Date(Math.max(...dates));
    const weeks = Math.max((maxD - minD) / (7*86400000), 1);
    return (apps.length / weeks).toFixed(1);
  })();
  const phoneScreenRate = Math.round(
    (apps.filter(a=>["Phone Screen","Technical","Onsite","Offer"].includes(a.stage)).length / apps.length) * 100
  );

  return (
    <>
      {/* Font imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        html,body { background:#070B10; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:#0E1117; }
        ::-webkit-scrollbar-thumb { background:#374151; border-radius:3px; }
      `}</style>

      <div style={{
        minHeight:"100vh",
        background:"#070B10",
        backgroundImage:"radial-gradient(ellipse 80% 40% at 50% -10%, rgba(78,154,241,0.08) 0%, transparent 60%)",
        fontFamily:"'DM Mono',monospace",
        padding:"32px 28px",
        maxWidth:1400,
        margin:"0 auto",
      }}>

        {/* Header */}
        <div style={{marginBottom:32,display:"flex",alignItems:"baseline",gap:16,justifyContent:"space-between",flexWrap:"wrap"}}>
          <div>
            <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:42,letterSpacing:"0.06em",
              background:"linear-gradient(135deg,#4E9AF1,#A78BFA)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
              lineHeight:1,
            }}>Job Tracker</h1>
            <p style={{color:"#4B5563",fontSize:11,letterSpacing:"0.1em",marginTop:4}}>
              SEARCH COHORT · Q1 2025 · {apps.length} APPLICATIONS
            </p>
          </div>
          <span style={{color:"#374151",fontSize:10,fontFamily:"'DM Mono',monospace",letterSpacing:"0.08em"}}>
            AS OF {today.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}).toUpperCase()}
          </span>
        </div>

        {/* Stat Cards — 5 × 2 grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
          {/* Row 1 */}
          <StatCard label="Total Applied"    value={apps.length}         sub={`${activeApps.length} still active`}           accent="#4E9AF1" />
          <StatCard label="Response Rate"    value={`${responseRate}%`}  sub="moved past Applied"                            accent="#A78BFA" />
          <StatCard label="Offers"           value={offers}              sub={offers ? "🎉 negotiate hard" : "keep pushing"}  accent="#10B981" />
          <StatCard label="Avg Days Active"  value={`${avgDays}d`}       sub="per application"                               accent="#F59E0B" />
          <StatCard label="In Interviews"    value={inInterview}         sub={`${apps.filter(a=>a.stage==="Onsite").length} at onsite`} accent="#34D399" />
          {/* Row 2 */}
          <StatCard label="Offer Rate"       value={`${offerRate}%`}     sub={`${offers} of ${apps.length} apps`}            accent="#10B981" />
          <StatCard label="Phone Screen %"   value={`${phoneScreenRate}%`} sub="recruiter conversion"                        accent="#38BDF8" />
          <StatCard label="Rejected"         value={rejected}            sub={`${Math.round((rejected/apps.length)*100)}% rejection rate`} accent="#F87171" />
          <StatCard label="Weekly Pace"      value={weeklyPace}          sub="apps / week"                                   accent="#FB923C" />
          <StatCard label="Stalest App"      value={`${maxStageDays}d`}  sub={stalestApp ? stalestApp.company : "—"}         accent="#E879F9" />
        </div>

        {/* Charts row 1 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
          <StageFunnel         apps={apps} />
          <TimeInStageChart    apps={apps} />
          <MaxTimePerStageChart apps={apps} />
        </div>

        {/* Charts row 2 */}
        <div style={{marginBottom:12}}>
          <ActivityHeatmap apps={apps} />
        </div>

        {/* Charts row 3 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
          <DayOfWeekBar apps={apps} />
          <HourBar      apps={apps} />
        </div>

        {/* Divider */}
        <div style={{borderTop:"1px solid #1F2937",marginBottom:20,position:"relative"}}>
          <span style={{
            position:"absolute",top:-9,left:20,
            background:"#070B10",padding:"0 10px",
            color:"#374151",fontSize:10,letterSpacing:"0.12em",
          }}>APPLICATIONS TABLE</span>
        </div>

        {/* Table */}
        <AppTable apps={apps} onEdit={setEditing} onDelete={handleDelete} />
      </div>

      {editing && <Modal app={editing} onClose={()=>setEditing(null)} onSave={handleSave} />}
    </>
  );
}