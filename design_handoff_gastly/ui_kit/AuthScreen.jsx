// ─── Gastly UI Kit — AuthScreen ──────────────────────────────────────────────
const { useState: useStateAuth, useEffect: useEffectAuth } = React;
const { C: CA, FONT: FA } = window;

const NUMKEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

function AuthScreen({ onAuth }) {
  const [step, setStep]     = useStateAuth('email');
  const [email, setEmail]   = useStateAuth('');
  const [pin, setPin]       = useStateAuth('');
  const [loading, setLoading] = useStateAuth(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  useEffectAuth(() => {
    if (pin.length !== 6) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onAuth(); }, 900);
  }, [pin]);

  function pressKey(k) {
    if (loading) return;
    if (k === '⌫') { setPin(p => p.slice(0,-1)); return; }
    if (k === '' || pin.length >= 6) return;
    setPin(p => p + k);
  }

  if (step === 'email') return (
    <div style={{ minHeight:'100%', padding:'64px 24px 32px', background:CA.bg, display:'flex', flexDirection:'column', fontFamily:FA }}>
      <div style={{ textAlign:'center', marginBottom:48 }}>
        <h1 style={{ fontSize:40, fontWeight:800, color:CA.primary, letterSpacing:-1.5, margin:'0 0 8px' }}>gastly</h1>
        <p style={{ color:CA.textSec, fontSize:14, margin:0 }}>La forma más rápida de trackear gastos</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <label style={{ fontSize:13, fontWeight:600, color:CA.textSec }}>Email</label>
          <input
            type="email" placeholder="tu@email.com" value={email}
            onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>{ if (e.key==='Enter'&&valid) setStep('pin'); }}
            autoFocus
            style={{ border:`1.5px solid ${CA.border}`, borderRadius:10, padding:'13px 14px', fontSize:16, color:CA.text, background:CA.surface, fontFamily:FA, width:'100%', outline:'none' }}
          />
        </div>
        <button onClick={()=>setStep('pin')} disabled={!valid}
          style={{ background:CA.primary, color:'white', border:'none', borderRadius:12, padding:15, fontSize:16, fontWeight:700, cursor:'pointer', opacity:valid?1:0.4, fontFamily:FA }}>
          Entrar
        </button>
        <button onClick={()=>setStep('pin')} disabled={!valid}
          style={{ background:CA.surface, color:CA.text, border:`1.5px solid ${CA.border}`, borderRadius:12, padding:15, fontSize:16, fontWeight:700, cursor:'pointer', opacity:valid?1:0.4, fontFamily:FA }}>
          Crear cuenta
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100%', padding:'48px 24px 32px', background:CA.bg, display:'flex', flexDirection:'column', alignItems:'center', fontFamily:FA }}>
      <button onClick={()=>{setStep('email');setPin('');}}
        style={{ background:'none', border:'none', color:CA.textSec, fontSize:14, fontWeight:600, padding:0, cursor:'pointer', alignSelf:'flex-start', marginBottom:32, fontFamily:FA }}>
        ← volver
      </button>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:20, fontWeight:700, color:CA.text, margin:'0 0 4px' }}>Ingresá tu PIN</p>
        <p style={{ fontSize:13, color:CA.textSec, margin:0 }}>{email}</p>
      </div>
      <div style={{ display:'flex', gap:14, justifyContent:'center', margin:'28px 0 12px' }}>
        {Array.from({length:6}).map((_,i) => (
          <span key={i} style={{ width:14, height:14, borderRadius:'50%', border:`2px solid ${i<pin.length?CA.primary:CA.border}`, background:i<pin.length?CA.primary:'none', transition:'0.15s', transform:i<pin.length?'scale(1.1)':'none', display:'block' }} />
        ))}
      </div>
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'48px 0' }}>
          <div style={{ width:28, height:28, border:`3px solid ${CA.border}`, borderTopColor:CA.primary, borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, width:'100%', maxWidth:280, marginTop:16 }}>
          {NUMKEYS.map((k,i) => (
            <button key={i} onClick={()=>pressKey(k)}
              style={{ aspectRatio:'1', borderRadius:'50%', border:'none', background:k===''?'none':CA.surface, fontSize:k==='⌫'?18:22, fontWeight:600, color:k==='⌫'?CA.textSec:CA.text, boxShadow:k===''?'none':'0 1px 4px rgba(0,0,0,0.08)', cursor:k===''?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FA, pointerEvents:k===''?'none':'auto' }}>
              {k}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AuthScreen });
