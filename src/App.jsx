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
  { id:'a1', emoji:'🧴', name:'Senka Perfect Whip (blue)',   tip:'Wet face, massage 30 sec, rinse with lukewarm water.' },
  { id:'a2', emoji:'🍊', name:'Melano CC Vitamin C Lotion',  tip:'Pour on palm, pat gently into skin. Do not rub.' },
  { id:'a3', emoji:'💧', name:'Niacinamide 10% + Zinc',      tip:'Few drops across face and neck. Wait 1 min before next.' },
  { id:'a4', emoji:'✨', name:'Matrixyl 10% + HA Peptide',   tip:'Few drops on top. Pat gently, do not rub.' },
]
const PM_NORMAL = [
  { id:'p1', emoji:'🧴', name:'Senka Perfect Whip (blue)',   tip:'Remove the day. Massage gently, rinse well.' },
  { id:'p2', emoji:'✨', name:'Matrixyl 10% + HA Peptide',   tip:'Few drops on clean dry skin. Pat gently.' },
  { id:'p3', emoji:'💧', name:'Niacinamide 10% + Zinc',      tip:'After peptide absorbs. Few drops full face.' },
  { id:'p4', emoji:'👁️', name:'Caffeine Solution 5%',        tip:'Dab gently around eye area only. Do not rub.' },
  { id:'p5', emoji:'🌿', name:'SANA Soy Milk Eye Cream',     tip:'Tiny amount around eyes. Pat with ring finger.' },
]
const PM_RETINOL = [
  { id:'p1', emoji:'🧴', name:'Senka Perfect Whip (blue)',     tip:'Remove the day. Massage gently, rinse well.' },
  { id:'p6', emoji:'🔮', name:'Retinol Face Mask (gold pack)', tip:'Apply mask sheet to face. Leave 15-20 min then remove. Pat in the remaining essence — do not rinse off. No other serums tonight.' },
  { id:'p5', emoji:'🌿', name:'SANA Soy Milk Eye Cream',       tip:'Tiny amount around eyes after mask. Pat with ring finger.' },
]
const PM_EXFOLIANT = [
  { id:'p1', emoji:'🧴', name:'Senka Perfect Whip (blue)',         tip:'Remove the day. Massage gently, rinse well.' },
  { id:'p9', emoji:'🖤', name:'Jonetz 100 Sheet Mask',             tip:'Apply to clean face. Leave 15-20 min then remove. Pat in remaining essence gently. Then continue with serums below.' },
  { id:'p2', emoji:'✨', name:'Matrixyl 10% + HA Peptide',         tip:'After mask essence absorbed. Few drops, pat gently.' },
  { id:'p3', emoji:'💧', name:'Niacinamide 10% + Zinc',            tip:'Few drops full face after peptide.' },
  { id:'p4', emoji:'👁️', name:'Caffeine Solution 5%',              tip:'Dab gently around eye area only.' },
  { id:'p5', emoji:'🌿', name:'SANA Soy Milk Eye Cream',           tip:'Tiny amount around eyes. Pat with ring finger.' },
  { id:'p7', emoji:'🍋', name:'Lactic Acid 10% — buy when ready', tip:'Future: will replace Jonetz mask on Saturdays. Apply to dry skin, leave 10 min, rinse. Skip serums that night.', future:true },
]

function getDayType(dow) { if(dow===6) return 'exfoliant'; if(dow===2||dow===4) return 'retinol'; return 'normal' }
function getPM(dow) { const t=getDayType(dow); return t==='retinol'?PM_RETINOL:t==='exfoliant'?PM_EXFOLIANT:PM_NORMAL }

const TYPE = {
  normal:   { label:'Full Routine Day',    icon:'🌿', color:C.green,   bg:'#E8F4EB' },
  retinol:  { label:'Retinol Mask Night',  icon:'🔮', color:C.purple,  bg:'#EDE8F5' },
  exfoliant:{ label:'Sheet Mask Saturday', icon:'🖤', color:'#2A2A2A', bg:'#EFEFEF' },
}
const WARN = {
  retinol:  { color:C.purple,  bg:'#EDE8F5', text:'Retinol mask night! Cleanse, apply gold retinol mask 15-20 min, pat in the remaining essence, finish with eye cream. No other serums tonight.' },
  exfoliant:{ color:'#2A2A2A', bg:'#EFEFEF', text:'Sheet mask Saturday! Apply Jonetz mask after cleansing, pat in essence, then follow with your normal serums. Lactic acid will replace this when you buy it.' },
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

// ── PHOTOS TAB ───────────────────────────────────────────────
function PhotosTab({ photos, setPhotos }) {
  const [note, setNote]       = useState('')
  const [preview, setPreview] = useState(null)
  const [pending, setPending] = useState(null)
  const [toast, setToast]     = useState('')
  const galleryRef = useRef()
  const cameraRef  = useRef()

  const showToast = m => { setToast(m); setTimeout(()=>setToast(''), 2200) }

  function handleFile(e) {
    const f = e.target.files?.[0]; if(!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        // Compress and resize to max 800px wide, quality 0.7
        const canvas = document.createElement('canvas')
        const maxW = 800
        const scale = img.width > maxW ? maxW / img.width : 1
        canvas.width  = img.width  * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const compressed = canvas.toDataURL('image/jpeg', 0.7)
        setPending(compressed)
        setPreview(compressed)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(f)
    e.target.value = ''
  }

  function savePhoto() {
    if(!pending) { showToast('Please choose a photo first'); return }
    const newPhotos = [{data:pending, date:todayStr(), note}, ...photos]
    try {
      localStorage.setItem('skinPhotos', JSON.stringify(newPhotos))
      setPhotos(newPhotos)
      setPending(null); setPreview(null); setNote('')
      showToast('Photo saved!')
    } catch(err) {
      showToast('Storage full! Delete some old photos first')
    }
  }

  function deletePhoto(i) {
    if(!window.confirm('Delete this photo?')) return
    setPhotos(p => p.filter((_,j)=>j!==i))
    showToast('Deleted')
  }

  return (
    <div style={{padding:16}}>
      <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Progress Photos</div>
      <div style={{fontSize:13,color:C.mid,marginBottom:16}}>Weekly photos to track your skin journey</div>

      <Card>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
          <button onClick={()=>galleryRef.current?.click()} style={{background:C.light,border:`2px dashed ${C.blush}`,borderRadius:12,padding:'16px 8px',cursor:'pointer',fontFamily:'inherit',color:C.deep,fontSize:13,fontWeight:600,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
            <span style={{fontSize:28}}>🖼️</span>From Gallery
          </button>
          <button onClick={()=>cameraRef.current?.click()} style={{background:C.light,border:`2px dashed ${C.blush}`,borderRadius:12,padding:'16px 8px',cursor:'pointer',fontFamily:'inherit',color:C.deep,fontSize:13,fontWeight:600,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
            <span style={{fontSize:28}}>📷</span>Take Photo
          </button>
        </div>
        <input ref={galleryRef} type='file' accept='image/*' onChange={handleFile} style={{display:'none'}}/>
        <input ref={cameraRef}  type='file' accept='image/*' capture='environment' onChange={handleFile} style={{display:'none'}}/>

        {preview && (
          <div style={{marginBottom:12,borderRadius:10,overflow:'hidden',position:'relative'}}>
            <img src={preview} alt='Preview' style={{width:'100%',maxHeight:200,objectFit:'cover',display:'block'}}/>
            <button onClick={()=>{setPreview(null);setPending(null)}} style={{position:'absolute',top:8,right:8,width:28,height:28,borderRadius:'50%',background:'rgba(0,0,0,0.55)',border:'none',color:'white',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
          </div>
        )}

        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder='Add a note e.g. Week 1, before starting...' rows={2}
          style={{width:'100%',border:`1px solid ${C.light}`,borderRadius:10,padding:'10px 12px',fontFamily:'inherit',fontSize:13,color:C.deep,background:C.white,resize:'none',outline:'none',marginBottom:10}}/>
        <button onClick={savePhoto} style={{background:C.rose,color:'white',border:'none',borderRadius:12,padding:14,fontFamily:'inherit',fontSize:14,fontWeight:700,cursor:'pointer',width:'100%'}}>
          Save Photo
        </button>
      </Card>

      {photos.length===0 ? (
        <div style={{textAlign:'center',padding:'30px 20px',color:C.mid}}>
          <div style={{fontSize:42,marginBottom:10}}>🖼️</div>
          <p style={{fontSize:13}}>No photos yet.<br/>Upload your first weekly photo above!</p>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {photos.map((p,i)=>(
            <div key={i} style={{borderRadius:12,overflow:'hidden',aspectRatio:'1',position:'relative',background:C.light}}>
              <img src={p.data} alt='' style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
              <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(61,43,31,0.8))',color:'white',fontSize:10,padding:'14px 8px 7px'}}>
                {dispD(p.date)}
                {p.note && <span style={{fontSize:9,color:'rgba(255,255,255,0.8)',display:'block',marginTop:1}}>{p.note}</span>}
              </div>
              <button onClick={()=>deletePhoto(i)} style={{position:'absolute',top:6,right:6,width:24,height:24,borderRadius:'50%',background:'rgba(61,43,31,0.65)',border:'none',color:'white',fontSize:14,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
            </div>
          ))}
        </div>
      )}
      <Toast msg={toast}/>
    </div>
  )
}

// ── COMPARE TAB ──────────────────────────────────────────────
function CompareTab({ photos }) {
  const [picks, setPicks]   = useState({before:null, after:null})
  const [picking, setPicking]= useState(null)

  function choose(p) { setPicks(prev=>({...prev, [picking]:p})); setPicking(null) }

  const Slot = ({slot}) => {
    const p = picks[slot]
    return (
      <div onClick={()=>setPicking(slot)} style={{borderRadius:12,overflow:'hidden',aspectRatio:'1',background:C.light,border:`1px solid ${C.light}`,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',color:C.mid,fontSize:12,textAlign:'center',padding:10,cursor:'pointer',position:'relative'}}>
        {p ? (
          <>
            <img src={p.data} alt='' style={{width:'100%',height:'100%',objectFit:'cover',position:'absolute',top:0,left:0}}/>
            <span style={{position:'absolute',top:6,left:6,background:'rgba(61,43,31,0.7)',color:'white',fontSize:10,padding:'2px 9px',borderRadius:99}}>
              {slot==='before'?'Before':'After'} · {shortD(p.date)}
            </span>
          </>
        ) : (
          <>
            <div style={{fontSize:26,marginBottom:6}}>{slot==='before'?'📷':'✨'}</div>
            <span>Tap to pick<br/><strong>{slot}</strong> photo</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{padding:16}}>
      <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Before &amp; After</div>
      <div style={{fontSize:13,color:C.mid,marginBottom:16}}>Compare two photos to see your progress</div>

      <Card>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <Slot slot='before'/><Slot slot='after'/>
        </div>
        <p style={{fontSize:11,color:C.mid,marginTop:10,textAlign:'center'}}>Tap a slot then pick from your photos</p>
      </Card>

      {picking && (
        <Card>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>Choose {picking} photo</div>
          {photos.length===0 ? (
            <p style={{fontSize:13,color:C.mid}}>No photos yet. Upload some in the Photos tab first.</p>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {photos.map((p,i)=>(
                <div key={i} onClick={()=>choose(p)} style={{borderRadius:12,overflow:'hidden',aspectRatio:'1',position:'relative',background:C.light,cursor:'pointer'}}>
                  <img src={p.data} alt='' style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                  <div style={{position:'absolute',bottom:0,left:0,right:0,background:'linear-gradient(transparent,rgba(61,43,31,0.8))',color:'white',fontSize:10,padding:'10px 8px 5px'}}>{shortD(p.date)}</div>
                </div>
              ))}
            </div>
          )}
          <button onClick={()=>setPicking(null)} style={{background:C.light,color:C.deep,border:'none',borderRadius:10,padding:'10px',fontFamily:'inherit',fontSize:13,fontWeight:600,cursor:'pointer',width:'100%',marginTop:10}}>Cancel</button>
        </Card>
      )}
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
function ProgressTab({ logs, photos }) {
  const logArr    = Object.entries(logs)
  const daysLogged= logArr.filter(([,l])=>l.rating||l.note).length
  let streak=0; const d=new Date()
  while(true){ const k=fmtD(d); if(logs[k]&&(logs[k].rating||logs[k].note)){streak++;d.setDate(d.getDate()-1);}else break; }
  const recent = logArr.filter(([,l])=>l.rating).sort(([a],[b])=>a.localeCompare(b)).slice(-14)
  const notes  = logArr.filter(([,l])=>l.note).sort(([a],[b])=>b.localeCompare(a)).slice(0,5)
  const allProds = [...AM,...PM_NORMAL,
    {id:'f1',emoji:'🔮',name:'Retinol Face Mask (gold pack)',tip:'Tue & Thu nights — 15-20 min, pat in essence, skip other serums'},
    {id:'f2',emoji:'🖤',name:'Jonetz 100 Sheet Mask',tip:'Saturday nights — 15-20 min, pat in essence, then continue with serums'},
    {id:'f3',emoji:'🍋',name:'Lactic Acid 10%',tip:'Buy when ready — will replace sheet mask on Saturdays'},
  ]

  return (
    <div style={{padding:16}}>
      <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>My Progress</div>
      <div style={{fontSize:13,color:C.mid,marginBottom:16}}>Your skin journey overview</div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
        {[{n:daysLogged,l:'Days logged',e:'📅'},{n:streak,l:'Day streak',e:'🔥'},{n:photos.length,l:'Photos',e:'📸'}].map(s=>(
          <Card key={s.l} style={{marginBottom:0,textAlign:'center',padding:'14px 8px'}}>
            <div style={{fontSize:24,marginBottom:4}}>{s.e}</div>
            <div style={{fontSize:28,fontWeight:700,color:C.rose,lineHeight:1}}>{s.n}</div>
            <div style={{fontSize:10,color:C.mid,marginTop:4}}>{s.l}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Skin Feeling Over Time</div>
        {recent.length===0 ? (
          <div style={{textAlign:'center',padding:'12px 0',color:C.mid,fontSize:12}}>Rate your skin daily to see trends here</div>
        ) : (
          <>
            <div style={{display:'flex',alignItems:'flex-end',gap:4,height:72}}>
              {recent.map(([ds,l])=>(
                <div key={ds} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                  <div style={{width:'100%',background:C.rose,borderRadius:'3px 3px 0 0',height:(l.rating/4*60)+'px',opacity:0.8}}/>
                  <span style={{fontSize:8,color:C.mid,transform:'rotate(-45deg)',whiteSpace:'nowrap',marginTop:2}}>{shortD(ds).split(' ')[0]}</span>
                </div>
              ))}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:C.mid,marginTop:20}}><span>Poor</span><span>Great</span></div>
          </>
        )}
      </Card>

      <Card>
        <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>Recent Notes</div>
        {notes.length===0 ? <div style={{fontSize:12,color:C.mid}}>No notes yet</div>
        : notes.map(([ds,l])=>(
          <div key={ds} style={{padding:'8px 0',borderBottom:`1px solid ${C.light}`}}>
            <div style={{fontSize:11,color:C.rose,fontWeight:700,marginBottom:3}}>{dispD(ds)}</div>
            <div style={{fontSize:12,color:C.mid,fontStyle:'italic'}}>"{l.note}"</div>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Weekly Schedule</div>
        {[
          {days:'Mon, Wed, Fri, Sun', icon:'🌿', label:'Full routine',               color:C.green,  bg:'#E8F4EB'},
          {days:'Tue, Thu',  icon:'🔮', label:'Retinol face mask night',   color:C.purple, bg:'#EDE8F5'},
          {days:'Saturday', icon:'🖤', label:'Sheet mask + normal serums',  color:'#333',   bg:'#F0F0F0'},
        ].map(r=>(
          <div key={r.days} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:`1px solid ${C.light}`}}>
            <span style={{fontSize:22}}>{r.icon}</span>
            <div>
              <div style={{fontSize:13,fontWeight:600}}>{r.days}</div>
              <span style={{fontSize:10,background:r.bg,color:r.color,padding:'2px 8px',borderRadius:99,fontWeight:600}}>{r.label}</span>
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>All Products</div>
        {allProds.map(p=>(
          <div key={p.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:`1px solid ${C.light}`}}>
            <span style={{fontSize:20}}>{p.emoji}</span>
            <div>
              <div style={{fontSize:13,fontWeight:600}}>{p.name}</div>
              <div style={{fontSize:11,color:C.mid}}>{p.tip}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── APP ──────────────────────────────────────────────────────
export default function App() {
  const [tab,  setTab]   = useState('guide')
  const [logs, setLogs]  = useStorage('skinLogs',  {})
  const [photos,setPhotos]= useStorage('skinPhotos',[])

  const tabs = [
    {id:'guide',   icon:'📅', label:'Guide'},
    {id:'photos',  icon:'📸', label:'Photos'},
    {id:'compare', icon:'🔍', label:'Compare'},
    {id:'log',     icon:'📋', label:'Log'},
    {id:'progress',icon:'📊', label:'Progress'},
  ]

  return (
    <div style={{background:C.cream,minHeight:'100vh',paddingBottom:68,fontFamily:"'DM Sans',sans-serif",maxWidth:500,margin:'0 auto'}}>
      {/* Header */}
      <div style={{background:C.deep,color:C.cream,padding:'16px 20px 12px',position:'sticky',top:0,zIndex:100}}>
        <h1 style={{fontSize:20,fontWeight:700}}>✨ Skin Tracker</h1>
        <p style={{fontSize:11,color:C.blush,marginTop:2}}>
          {tab==='guide' ? 'Tap a day · follow the numbered steps' : 'Your skincare journey'}
        </p>
      </div>

      {tab==='guide'    && <GuideTab    logs={logs}   setLogs={setLogs}/>}
      {tab==='photos'   && <PhotosTab   photos={photos} setPhotos={setPhotos}/>}
      {tab==='compare'  && <CompareTab  photos={photos}/>}
      {tab==='log'      && <LogTab      logs={logs}/>}
      {tab==='progress' && <ProgressTab logs={logs} photos={photos}/>}

      {/* Bottom nav */}
      <nav style={{position:'fixed',bottom:0,left:0,right:0,background:C.white,borderTop:`1px solid ${C.light}`,display:'flex',zIndex:100,maxWidth:500,margin:'0 auto'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'10px 2px 8px',border:'none',background:'none',fontFamily:'inherit',fontSize:9,fontWeight:600,color:tab===t.id?C.rose:C.mid,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,borderTop:`2px solid ${tab===t.id?C.rose:'transparent'}`,transition:'color 0.15s'}}>
            <span style={{fontSize:20}}>{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
