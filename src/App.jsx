import { useState, useEffect, useCallback, useRef } from 'react'

// ── COLOURS ──────────────────────────────────────────────────
const C = {
  cream:'#FAF7F2', blush:'#E8C4B0', rose:'#C17A5E',
  deep:'#3D2B1F',  mid:'#7A5C4E',  light:'#F0E8E0',
  white:'#fff',    card:'#FFFCF8',
  green:'#4A8C5C', purple:'#7B5EA7', amber:'#B8860B',
}

// ── ROUTINE DATA ─────────────────────────────────────────────
const AM = [
  { id:'a1', emoji:'🧴', name:'Senka Perfect Whip (blue)',         tip:'Wet face, massage 30 sec, rinse with lukewarm water.' },
  { id:'a2', emoji:'🍊', name:'Melano CC Vitamin C Lotion',        tip:'Pour on palm, pat gently into skin. Do not rub.' },
  { id:'a3', emoji:'💧', name:'Niacinamide 10% + Zinc',            tip:'Few drops across face and neck. Wait 1 min before next.' },
  { id:'a4', emoji:'✨', name:'Matrixyl 10% + HA Peptide',         tip:'Few drops on top. Pat gently, do not rub.' },
  { id:'a5', emoji:'☀️', name:'LOreal Revitalift SPF30 Cream',  tip:'Last step every morning. Apply to face and neck. Do not skip.' },
]
const PM_NORMAL = [
  { id:'p1', emoji:'🧴', name:'Senka Perfect Whip (blue)',   tip:'Remove the day. Massage gently, rinse well.' },
  { id:'p2', emoji:'✨', name:'Matrixyl 10% + HA Peptide',   tip:'Few drops on clean dry skin. Pat gently.' },
  { id:'p3', emoji:'💧', name:'Niacinamide 10% + Zinc',      tip:'After peptide absorbs. Few drops full face.' },
  { id:'p4', emoji:'👁️', name:'Caffeine Solution 5%',        tip:'Dab gently around eye area only. Do not rub.' },
  { id:'p5', emoji:'🌿', name:'SANA Soy Milk Eye Cream',     tip:'Tiny amount around eyes. Pat with ring finger.' },
]
const PM_RETINOL = [
  { id:'p1', emoji:'🧴', name:'Senka Perfect Whip (blue)',              tip:'Remove the day. Massage gently, rinse well. Wait 20 min before retinol.' },
  { id:'p6', emoji:'🔮', name:'The Ordinary Retinol 0.5% in Squalane', tip:'Apply to completely dry skin only. Few drops, spread thinly across face avoiding eye area. Start once a week, build to twice.' },
  { id:'p5', emoji:'🌿', name:'SANA Soy Milk Eye Cream',                tip:'Apply around eyes BEFORE retinol to protect the eye area, or after if skin tolerates it.' },
]
const PM_EXFOLIANT = [
  { id:'p1', emoji:'🧴', name:'Senka Perfect Whip (blue)',      tip:'Remove the day. Massage gently, rinse well. Pat completely dry — wait 5 min before lactic acid.' },
  { id:'p7', emoji:'🍋', name:'The Ordinary Lactic Acid 10%',  tip:'Apply to completely dry skin. Spread thinly across face avoiding eyes. Leave 10 minutes then rinse off. Do not leave on longer.' },
  { id:'p2', emoji:'✨', name:'Matrixyl 10% + HA Peptide',      tip:'After rinsing lactic acid and patting dry. Few drops, pat gently.' },
  { id:'p3', emoji:'💧', name:'Niacinamide 10% + Zinc',         tip:'Few drops full face after peptide absorbs.' },
  { id:'p4', emoji:'👁️', name:'Caffeine Solution 5%',           tip:'Dab gently around eye area only.' },
  { id:'p5', emoji:'🌿', name:'SANA Soy Milk Eye Cream',        tip:'Tiny amount around eyes. Pat with ring finger.' },
]

function getDayType(dow) { if(dow===6) return 'exfoliant'; if(dow===2||dow===4) return 'retinol'; return 'normal' }
function getPM(dow) { const t=getDayType(dow); return t==='retinol'?PM_RETINOL:t==='exfoliant'?PM_EXFOLIANT:PM_NORMAL }

const TYPE = {
  normal:   { label:'Full Routine Day',    icon:'🌿', color:C.green,   bg:'#E8F4EB' },
  retinol:  { label:'Retinol Night',        icon:'🔮', color:C.purple,  bg:'#EDE8F5' },
  exfoliant:{ label:'Lactic Acid Saturday', icon:'🍋', color:'#8B6020', bg:'#FDF3E7' },
}
const WARN = {
  retinol:  { color:C.purple,  bg:'#EDE8F5', text:'Retinol night! Cleanse, wait 20 min, apply The Ordinary Retinol 0.5% to dry skin, finish with eye cream. No Vitamin C or other actives tonight.' },
  exfoliant:{ color:'#8B6020', bg:'#FDF3E7', text:'Lactic acid night! Cleanse, pat completely dry, apply lactic acid for exactly 10 min then rinse off. Then apply your normal serums. Start with this once a week only.' },
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const RATINGS = [{v:1,e:'😔',l:'Poor'},{v:2,e:'😐',l:'Okay'},{v:3,e:'🙂',l:'Good'},{v:4,e:'😊',l:'Great'}]

// ── HELPERS ──────────────────────────────────────────────────
function todayStr() { return fmtD(new Date()) }
function fmtD(dt)   { return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0') }
function parseD(s)  { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d) }
function dispD(s)   { return parseD(s).toLocaleDateString('en-IE',{day:'numeric',month:'short',year:'numeric'}) }
function shortD(s)  { return parseD(s).toLocaleDateString('en-IE',{day:'numeric',month:'short'}) }

function useStorage(key, def) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def } catch { return def }
  })
  const set = useCallback(v => {
    const nv = typeof v === 'function' ? v(val) : v
    setVal(nv)
    try { localStorage.setItem(key, JSON.stringify(nv)) } catch {}
  }, [key, val])
  return [val, set]
}

// ── SHARED UI ────────────────────────────────────────────────
function Toast({ msg }) {
  return msg ? (
    <div style={{position:'fixed',bottom:80,left:'50%',transform:'translateX(-50%)',background:C.deep,color:C.cream,padding:'9px 20px',borderRadius:99,fontSize:12,zIndex:999,whiteSpace:'nowrap',boxShadow:'0 4px 16px rgba(0,0,0,0.25)'}}>
      {msg}
    </div>
  ) : null
}

function Card({ children, style={} }) {
  return <div style={{background:C.card,borderRadius:14,padding:16,marginBottom:12,border:`1px solid ${C.light}`,...style}}>{children}</div>
}

function ProgBar({ done, total }) {
  const pct = total ? Math.round(done/total*100) : 0
  return (
    <div style={{height:4,background:C.light,borderRadius:99,overflow:'hidden',marginTop:10}}>
      <div style={{height:'100%',width:pct+'%',background:`linear-gradient(90deg,${C.blush},${C.rose})`,borderRadius:99,transition:'width 0.3s'}}/>
    </div>
  )
}

function Step({ s, num, checked, onToggle }) {
  return (
    <div style={{display:'flex',alignItems:'flex-start',gap:10,padding:'11px 0',borderBottom:`1px solid ${C.light}`,opacity:s.future?0.4:1}}>
      <button
        onClick={s.future ? undefined : onToggle}
        disabled={!!s.future}
        style={{width:28,height:28,borderRadius:'50%',border:'none',background:checked?C.rose:C.light,color:checked?'white':C.mid,fontSize:12,fontWeight:700,flexShrink:0,cursor:s.future?'default':'pointer',marginTop:1,fontFamily:'inherit',transition:'all 0.15s'}}>
        {checked ? '✓' : num}
      </button>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:600}}>
          {s.name}
          {s.future && <span style={{fontSize:9,background:'#eee',color:'#999',padding:'1px 7px',borderRadius:99,marginLeft:6,verticalAlign:'middle'}}>not yet</span>}
        </div>
        <div style={{fontSize:12,color:C.mid,marginTop:3,lineHeight:1.5}}>{s.tip}</div>
      </div>
      <div style={{fontSize:22,flexShrink:0}}>{s.emoji}</div>
    </div>
  )
}

// ── GUIDE TAB ────────────────────────────────────────────────
function GuideTab({ logs, setLogs }) {
  const now = new Date()
  const [calY, setCalY] = useState(now.getFullYear())
  const [calM, setCalM] = useState(now.getMonth())
  const [sel, setSel]   = useState(todayStr())
  const [rating, setRating] = useState(0)
  const [note, setNote]     = useState('')
  const [toast, setToast]   = useState('')

  const showToast = m => { setToast(m); setTimeout(() => setToast(''), 2000) }

  useEffect(() => {
    const l = logs[sel] || {}
    setRating(l.rating || 0)
    setNote(l.note || '')
  }, [sel, logs])

  function changeMonth(d) {
    let m = calM+d, y = calY
    if(m>11){m=0;y++;} if(m<0){m=11;y--;}
    setCalM(m); setCalY(y)
  }

  function toggleStep(session, id) {
    setLogs(prev => {
      const n = {...prev, [sel]: {...(prev[sel]||{})}}
      n[sel][session] = {...(n[sel][session]||{})}
      n[sel][session][id] = !n[sel][session][id]
      return n
    })
  }

  function saveLog() {
    setLogs(prev => ({...prev, [sel]: {...(prev[sel]||{}), rating, note, dayType: getDayType(parseD(sel).getDay())}}))
    showToast('Saved ✓')
  }

  // Calendar cells
  const first   = new Date(calY, calM, 1).getDay()
  const dim     = new Date(calY, calM+1, 0).getDate()
  const prevDim = new Date(calY, calM, 0).getDate()
  const today   = todayStr()
  const cells   = []
  for(let i=first-1;i>=0;i--) cells.push({day:prevDim-i, ds:fmtD(new Date(calY,calM-1,prevDim-i)), other:true})
  for(let d=1;d<=dim;d++)     cells.push({day:d, ds:fmtD(new Date(calY,calM,d)), other:false})
  const rem = (first+dim)%7===0 ? 0 : 7-(first+dim)%7
  for(let d=1;d<=rem;d++)     cells.push({day:d, ds:fmtD(new Date(calY,calM+1,d)), other:true})

  function dotColor(ds) {
    const l = logs[ds]; if(!l) return null
    const dow = parseD(ds).getDay()
    const pmA = getPM(dow).filter(s=>!s.future)
    const amDone = AM.filter(s=>l.am?.[s.id]).length
    const pmDone = pmA.filter(s=>l.pm?.[s.id]).length
    return amDone===AM.length && pmDone===pmA.length ? C.green : C.amber
  }

  const dt      = parseD(sel)
  const dow     = dt.getDay()
  const dayType = getDayType(dow)
  const info    = TYPE[dayType]
  const warn    = WARN[dayType]
  const log     = logs[sel] || {}
  const pmSteps = getPM(dow)
  const pmActive= pmSteps.filter(s=>!s.future)
  const amDone  = AM.filter(s=>log.am?.[s.id]).length
  const pmDone  = pmActive.filter(s=>log.pm?.[s.id]).length

  return (
    <div>
      {/* Calendar */}
      <div style={{background:C.white,padding:'14px 14px 10px',borderBottom:`1px solid ${C.light}`}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <button onClick={()=>changeMonth(-1)} style={{background:C.light,border:'none',borderRadius:8,width:34,height:34,fontSize:22,cursor:'pointer',color:C.deep,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
          <span style={{fontSize:17,fontWeight:700}}>{MONTHS[calM]} {calY}</span>
          <button onClick={()=>changeMonth(1)}  style={{background:C.light,border:'none',borderRadius:8,width:34,height:34,fontSize:22,cursor:'pointer',color:C.deep,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,marginBottom:4}}>
          {DAYS.map(d=><div key={d} style={{textAlign:'center',fontSize:10,color:C.mid,fontWeight:600,padding:'3px 0'}}>{d}</div>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
          {cells.map((c,i) => {
            const dot  = dotColor(c.ds)
            const isSel= c.ds===sel
            const isTod= c.ds===today
            return (
              <button key={i} onClick={()=>setSel(c.ds)} style={{aspectRatio:'1',borderRadius:9,border:`2px solid ${isSel?C.rose:isTod?C.rose:'transparent'}`,background:isSel?C.rose:'none',color:isSel?'white':c.other?'#ccc':isTod?C.rose:C.deep,fontSize:13,fontWeight:isTod||isSel?700:500,cursor:'pointer',position:'relative',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {c.day}
                {dot && <span style={{position:'absolute',bottom:2,left:'50%',transform:'translateX(-50%)',width:4,height:4,borderRadius:'50%',background:isSel?'rgba(255,255,255,0.8)':dot}}/>}
              </button>
            )
          })}
        </div>
        <div style={{display:'flex',gap:16,marginTop:10,justifyContent:'center'}}>
          <span style={{fontSize:10,color:C.mid,display:'flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:'50%',background:C.green,display:'inline-block'}}/> All done</span>
          <span style={{fontSize:10,color:C.mid,display:'flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:'50%',background:C.amber,display:'inline-block'}}/> Partial</span>
        </div>
      </div>

      {/* Day Panel */}
      <div style={{padding:16}}>
        <div style={{fontSize:19,fontWeight:700,marginBottom:8}}>{dt.toLocaleDateString('en-IE',{weekday:'long',day:'numeric',month:'long'})}</div>
        <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 14px',borderRadius:99,fontSize:11,fontWeight:600,background:info.bg,color:info.color,marginBottom:12}}>{info.icon} {info.label}</span>
        {warn && <div style={{background:warn.bg,borderLeft:`3px solid ${warn.color}`,borderRadius:10,padding:'10px 12px',marginBottom:12,fontSize:12,color:warn.color,lineHeight:1.5}}>{warn.text}</div>}

        <Card>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{fontSize:14,fontWeight:700}}>🌅 Morning</span>
            <span style={{fontSize:12,color:C.mid}}>{amDone}/{AM.length} done</span>
          </div>
          {AM.map((s,i)=><Step key={s.id} s={s} num={i+1} checked={!!log.am?.[s.id]} onToggle={()=>toggleStep('am',s.id)}/>)}
          <ProgBar done={amDone} total={AM.length}/>
        </Card>

        <Card>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{fontSize:14,fontWeight:700}}>🌙 Evening</span>
            <span style={{fontSize:12,color:C.mid}}>{pmDone}/{pmActive.length} done</span>
          </div>
          {pmSteps.map((s,i)=><Step key={s.id} s={s} num={i+1} checked={!!log.pm?.[s.id]} onToggle={()=>toggleStep('pm',s.id)}/>)}
          <ProgBar done={pmDone} total={pmActive.length}/>
        </Card>

        <Card>
          <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>How did your skin feel today?</div>
          <div style={{display:'flex',gap:6}}>
            {RATINGS.map(r=>(
              <button key={r.v} onClick={()=>setRating(r.v)} style={{flex:1,padding:'10px 4px',border:`2px solid ${rating===r.v?C.rose:C.light}`,borderRadius:10,background:rating===r.v?C.light:C.white,fontSize:12,color:rating===r.v?C.deep:C.mid,cursor:'pointer',fontFamily:'inherit',fontWeight:rating===r.v?700:400,transition:'all 0.15s'}}>
                <span style={{fontSize:20,display:'block',marginBottom:2}}>{r.e}</span>{r.l}
              </button>
            ))}
          </div>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder='Any notes about your skin today...' rows={2}
            style={{width:'100%',border:`1px solid ${C.light}`,borderRadius:10,padding:'10px 12px',fontFamily:'inherit',fontSize:13,color:C.deep,background:C.white,marginTop:10,resize:'none',outline:'none'}}/>
          <button onClick={saveLog} style={{background:C.rose,color:'white',border:'none',borderRadius:12,padding:14,fontFamily:'inherit',fontSize:14,fontWeight:700,cursor:'pointer',width:'100%',marginTop:10}}>
            Save Day
          </button>
        </Card>
      </div>
      <Toast msg={toast}/>
    </div>
  )
}

// ── LOG TAB ──────────────────────────────────────────────────
function LogTab({ logs }) {
  const now = new Date()
  const [wOff, setWOff] = useState(0)
  const start = new Date(now); start.setDate(now.getDate()-now.getDay()+wOff*7)
  const days  = Array.from({length:7},(_,i)=>{ const d=new Date(start); d.setDate(start.getDate()+i); return fmtD(d) })
  const end   = new Date(start); end.setDate(start.getDate()+6)
  const fmt   = d => d.toLocaleDateString('en-IE',{day:'numeric',month:'short'})
  const entries = days.filter(d=>logs[d]&&(logs[d].rating||logs[d].note||logs[d].am||logs[d].pm)).reverse()
  const EMOJIS = {1:'😔',2:'😐',3:'🙂',4:'😊'}
  const LABELS = {1:'Poor',2:'Okay',3:'Good',4:'Great'}

  return (
    <div style={{padding:16}}>
      <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Weekly Log</div>
      <div style={{fontSize:13,color:C.mid,marginBottom:14}}>Your skin journal</div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <button onClick={()=>setWOff(w=>w-1)} style={{background:C.light,border:'none',borderRadius:8,width:34,height:34,fontSize:22,cursor:'pointer',color:C.deep}}>‹</button>
        <span style={{fontSize:13,fontWeight:600}}>{wOff===0?'This Week':`${fmt(start)} – ${fmt(end)}`}</span>
        <button onClick={()=>setWOff(w=>w+1)} style={{background:C.light,border:'none',borderRadius:8,width:34,height:34,fontSize:22,cursor:'pointer',color:C.deep}}>›</button>
      </div>
      {entries.length===0 ? (
        <Card><div style={{textAlign:'center',padding:'20px 0',color:C.mid}}><div style={{fontSize:32,marginBottom:8}}>📋</div><p style={{fontSize:13}}>No logs this week yet</p></div></Card>
      ) : entries.map(ds => {
        const l=logs[ds]||{}; const dow=parseD(ds).getDay()
        const pmA=getPM(dow).filter(s=>!s.future)
        const amDone=AM.filter(s=>l.am?.[s.id]).length
        const pmDone=pmA.filter(s=>l.pm?.[s.id]).length
        const info=TYPE[getDayType(dow)]
        return (
          <Card key={ds}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <div>
                <div style={{fontSize:14,fontWeight:700}}>{parseD(ds).toLocaleDateString('en-IE',{weekday:'long',day:'numeric',month:'short'})}</div>
                <span style={{fontSize:10,background:info.bg,color:info.color,padding:'2px 8px',borderRadius:99,fontWeight:600,display:'inline-block',marginTop:4}}>{info.icon} {info.label}</span>
              </div>
              {l.rating && <div style={{fontSize:26}}>{EMOJIS[l.rating]}</div>}
            </div>
            {l.rating && <div style={{fontSize:12,color:C.mid,marginBottom:4}}>Skin felt: <strong style={{color:C.deep}}>{LABELS[l.rating]}</strong></div>}
            <div style={{fontSize:12,color:C.mid}}>🌅 {amDone}/{AM.length} morning &nbsp;·&nbsp; 🌙 {pmDone}/{pmA.length} evening</div>
            {l.note && <div style={{fontSize:12,color:C.deep,background:C.light,borderRadius:8,padding:'8px 10px',marginTop:8,fontStyle:'italic'}}>"{l.note}"</div>}
          </Card>
        )
      })}
    </div>
  )
}

// ── PROGRESS TAB ─────────────────────────────────────────────
function ProgressTab({ logs }) {
  const logArr    = Object.entries(logs)
  const daysLogged= logArr.filter(([,l])=>l.rating||l.note).length
  let streak=0; const d=new Date()
  while(true){ const k=fmtD(d); if(logs[k]&&(logs[k].rating||logs[k].note)){streak++;d.setDate(d.getDate()-1);}else break; }
  const recent = logArr.filter(([,l])=>l.rating).sort(([a],[b])=>a.localeCompare(b)).slice(-14)
  const notes  = logArr.filter(([,l])=>l.note).sort(([a],[b])=>b.localeCompare(a)).slice(0,5)
  const allProds = [...AM,...PM_NORMAL,
    {id:'f1',emoji:'🔮',name:'The Ordinary Retinol 0.5%',tip:'Tue & Thu evenings — once a week to start, build to twice. Apply last on dry skin.'},
    {id:'f2',emoji:'🍋',name:'The Ordinary Lactic Acid 10%',tip:'Saturday evenings only — dry skin, exactly 10 min, rinse off, then serums as normal.'},
    {id:'f9',emoji:'🖤',name:'Jonetz 100 Sheet Mask',tip:'Use any evening for an extra hydration boost instead of lactic acid or serums.'},
    {id:'fa',emoji:'🔬',name:'Rosvanee Retinol 2.5%',tip:'Put aside until skin is fully tolerant of 0.5% retinol — at least 6 months of consistent use first.'},
    {id:'fb',emoji:'☀️',name:'LOreal Revitalift SPF30',tip:'Every morning without fail — last step after all serums.'},
    {id:'f4',emoji:'🧪',name:'Rosvanee Retinol 2.5%',tip:'Put aside for now — too strong until your skin builds tolerance over 3-6 months'},
  ]

  return (
    <div style={{padding:16}}>
      <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>My Progress</div>
      <div style={{
