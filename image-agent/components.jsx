/* Reusable visual primitives for the studio */

const cx = (...xs) => xs.filter(Boolean).join(' ');

// ---------- Tonal placeholder for generated images ----------
// Renders a soft, deterministic gradient with subtle stripes — looks like a real generation
// without us drawing fake imagery. Hue + lum drive the look; seed text sits as a watermark.
const ImagePh = ({ hue=70, lum=0.6, ratio='1:1', seed='', label, status='done', style }) => {
  const [w,h] = ratio.split(':').map(Number);
  const aspect = (w||1)/(h||1);
  const c1 = `oklch(${(lum+0.06).toFixed(3)} 0.08 ${hue})`;
  const c2 = `oklch(${(lum-0.18).toFixed(3)} 0.06 ${(hue+30)%360})`;
  const c3 = `oklch(${(lum-0.32).toFixed(3)} 0.04 ${(hue+60)%360})`;
  const stripeBg = `repeating-linear-gradient(120deg, transparent 0 14px, oklch(1 0 0 / 0.025) 14px 15px)`;
  return (
    <div className="ph" style={{
      aspectRatio: aspect,
      background: `radial-gradient(120% 90% at 28% 18%, ${c1} 0%, ${c2} 38%, ${c3} 90%), ${stripeBg}`,
      ...style,
    }}>
      {status==='loading' && (
        <div className="ph-loading">
          <div className="ph-shimmer" />
          <div className="ph-loading-label">generating · {seed}</div>
        </div>
      )}
      {status==='done' && seed && <div className="ph-seed">#{seed}</div>}
      {label && <div className="ph-label">{label}</div>}
    </div>
  );
};

// ---------- Provider badge ----------
const ProviderDot = ({ id, size=18 }) => {
  const map = {
    'openrouter': { bg:'oklch(0.30 0.04 30)', fg:'oklch(0.92 0.10 60)', t:'OR' },
    'gemini':     { bg:'oklch(0.30 0.06 240)', fg:'oklch(0.86 0.08 240)', t:'G' },
  };
  const m = map[id] || map['openrouter'];
  return (
    <span className="prov-dot" style={{ width:size, height:size, background:m.bg, color:m.fg, fontSize: size*0.5 }}>
      {m.t}
    </span>
  );
};

// ---------- Compact button ----------
const Btn = ({ children, variant='ghost', size='md', icon, onClick, active, title, style }) => (
  <button className={cx('btn', `btn-${variant}`, `btn-${size}`, active && 'is-active')} onClick={onClick} title={title} style={style}>
    {icon && <span className="btn-icon">{icon}</span>}
    {children && <span className="btn-label">{children}</span>}
  </button>
);

// ---------- Segmented control ----------
const Seg = ({ value, onChange, options, size='md' }) => (
  <div className={cx('seg', `seg-${size}`)}>
    {options.map(o => (
      <button key={o.value} className={cx('seg-opt', value===o.value && 'is-active')} onClick={()=>onChange(o.value)}>
        {o.icon && <span className="seg-icon">{o.icon}</span>}
        {o.label}
      </button>
    ))}
  </div>
);

// ---------- Field label ----------
const FLabel = ({ children, hint, action }) => (
  <div className="f-label">
    <span>{children}</span>
    {hint && <span className="f-hint">{hint}</span>}
    {action}
  </div>
);

// ---------- Sparkline ----------
const Spark = ({ data, w=120, h=28, stroke='var(--accent)', fill='var(--accent-soft)' }) => {
  const max = Math.max(...data);
  const step = w/(data.length-1);
  const pts = data.map((v,i)=> [i*step, h - (v/max)*h*0.85 - 2]);
  const d = pts.map((p,i)=> `${i===0?'M':'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const fillD = `${d} L${w} ${h} L0 ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={fillD} fill={fill} />
      <path d={d} stroke={stroke} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ---------- Big primary button (Generate) ----------
const PrimaryBtn = ({ children, onClick, kbd, busy, icon }) => (
  <button className="primary-btn" onClick={onClick} disabled={busy}>
    <span className="primary-btn-bg" />
    <span className="primary-btn-content">
      {icon && <span className="primary-btn-icon">{icon}</span>}
      <span>{busy ? 'Generating…' : children}</span>
      {kbd && !busy && <span className="kbd">{kbd}</span>}
    </span>
  </button>
);

// ---------- Tag chip ----------
const Tag = ({ children, tone='neutral' }) => (
  <span className={cx('tag', `tag-${tone}`)}>{children}</span>
);

// ---------- Tonal swatch (the project "scent") ----------
const ProjectSwatch = ({ hue, size=22, active }) => (
  <div className={cx('proj-sw', active && 'is-active')} style={{
    width:size, height:size,
    background: `radial-gradient(120% 120% at 30% 25%, oklch(0.78 0.12 ${hue}) 0%, oklch(0.45 0.10 ${(hue+30)%360}) 60%, oklch(0.28 0.07 ${(hue+60)%360}) 100%)`,
  }} />
);

// ---------- Styles ----------
const COMP_STYLES = `
.ph { position: relative; width: 100%; border-radius: 6px; overflow: hidden; isolation: isolate; }
.ph::after { content:''; position:absolute; inset:0; box-shadow: inset 0 0 0 1px oklch(1 0 0 / 0.04), inset 0 -40px 60px oklch(0 0 0 / 0.18); pointer-events: none; }
.ph-seed { position:absolute; left:8px; bottom:7px; font-family: var(--font-mono); font-size: 10px; color: oklch(1 0 0 / 0.55); letter-spacing: 0.02em; }
.ph-label { position:absolute; right:8px; top:7px; font-family: var(--font-mono); font-size: 10px; color: oklch(1 0 0 / 0.55); }
.ph-loading { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background: oklch(0.18 0.005 60 / 0.6); }
.ph-shimmer { position:absolute; inset:0; background: linear-gradient(110deg, transparent 30%, oklch(1 0 0 / 0.07) 50%, transparent 70%); background-size: 200% 100%; animation: shim 1.6s linear infinite; }
.ph-loading-label { position:relative; font-family: var(--font-mono); font-size: 11px; color: oklch(0.92 0.01 80); letter-spacing: 0.02em; }
@keyframes shim { from { background-position: 200% 0; } to { background-position: -100% 0; } }

.prov-dot { display:inline-flex; align-items:center; justify-content:center; border-radius: 999px; font-family: var(--font-mono); font-weight: 600; letter-spacing: -0.02em; flex: 0 0 auto; }

.btn { display:inline-flex; align-items:center; gap:6px; border-radius: var(--r-sm); border: 1px solid transparent; background: transparent; color: var(--fg-1); cursor: pointer; transition: 100ms; padding: 6px 10px; }
.btn:hover { color: var(--fg-0); background: var(--bg-2); }
.btn.is-active { color: var(--fg-0); background: var(--bg-3); border-color: var(--line); }
.btn-icon { display:inline-flex; }
.btn-sm { padding: 3px 7px; font-size: 12px; gap:4px; }
.btn-md { padding: 6px 10px; font-size: 13px; }
.btn-lg { padding: 9px 14px; font-size: 14px; }
.btn-line { border-color: var(--line-soft); }
.btn-line:hover { border-color: var(--line); }
.btn-solid { background: var(--bg-3); color: var(--fg-0); border-color: var(--line); }
.btn-tint { background: var(--tint-soft); color: var(--fg-0); border: 1px solid oklch(0.78 0.13 var(--tint-h) / 0.30); }
.btn-tint:hover { background: oklch(0.78 0.13 var(--tint-h) / 0.20); }

.seg { display:inline-flex; padding: 3px; background: var(--bg-1); border:1px solid var(--line-soft); border-radius: 8px; gap:2px; }
.seg-opt { padding: 5px 10px; border-radius: 5px; background: transparent; border: none; color: var(--fg-2); font-size: 12.5px; cursor: pointer; display:inline-flex; align-items:center; gap:5px; transition: 100ms; }
.seg-opt:hover { color: var(--fg-1); }
.seg-opt.is-active { background: var(--bg-3); color: var(--fg-0); box-shadow: 0 1px 0 oklch(1 0 0 / 0.04); }
.seg-sm .seg-opt { padding: 3px 8px; font-size: 11.5px; }

.f-label { display:flex; align-items:center; justify-content: space-between; font-size: 11px; font-weight: 500; color: var(--fg-2); text-transform: uppercase; letter-spacing: 0.06em; padding: 0 0 6px; }
.f-hint { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--fg-3); font-family: var(--font-mono); font-size: 11px; }

.tag { display:inline-flex; align-items:center; padding: 2px 7px; border-radius: 999px; font-size: 11px; font-family: var(--font-mono); letter-spacing: 0.02em; border: 1px solid var(--line-soft); color: var(--fg-1); background: var(--bg-2); }
.tag-tint { background: var(--tint-soft); color: oklch(0.92 0.06 var(--tint-h)); border-color: oklch(0.78 0.13 var(--tint-h) / 0.30); }
.tag-good { background: oklch(0.78 0.13 150 / 0.10); color: oklch(0.86 0.10 150); border-color: oklch(0.78 0.13 150 / 0.30); }
.tag-warn { background: oklch(0.78 0.14 50 / 0.10); color: oklch(0.86 0.10 50); border-color: oklch(0.78 0.14 50 / 0.30); }
.tag-err  { background: oklch(0.70 0.18 25 / 0.10); color: oklch(0.86 0.10 25); border-color: oklch(0.70 0.18 25 / 0.30); }

.primary-btn { position: relative; width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid oklch(0.78 0.13 var(--tint-h) / 0.4); background: var(--tint-soft); color: var(--fg-0); cursor: pointer; font-weight: 500; font-size: 14px; overflow: hidden; transition: 120ms; }
.primary-btn:hover { background: oklch(0.78 0.13 var(--tint-h) / 0.18); border-color: oklch(0.78 0.13 var(--tint-h) / 0.6); }
.primary-btn:active { transform: translateY(1px); }
.primary-btn:disabled { cursor: progress; }
.primary-btn-bg { position:absolute; inset: 0; background: linear-gradient(180deg, transparent, oklch(0.78 0.13 var(--tint-h) / 0.10)); pointer-events: none; }
.primary-btn-content { position:relative; display:inline-flex; align-items:center; justify-content:center; gap: 8px; width:100%; }
.kbd { font-family: var(--font-mono); font-size: 11px; padding: 1px 5px; border-radius: 4px; background: oklch(0 0 0 / 0.25); border: 1px solid oklch(1 0 0 / 0.08); color: var(--fg-1); }

.proj-sw { border-radius: 6px; flex: 0 0 auto; box-shadow: inset 0 0 0 1px oklch(1 0 0 / 0.06), inset 0 -6px 8px oklch(0 0 0 / 0.30); transition: 120ms; }
.proj-sw.is-active { box-shadow: inset 0 0 0 1px oklch(1 0 0 / 0.10), inset 0 -6px 8px oklch(0 0 0 / 0.30), 0 0 0 2px oklch(0.78 0.13 var(--tint-h) / 0.4); }
`;

window.cx = cx;
window.ImagePh = ImagePh;
window.ProviderDot = ProviderDot;
window.Btn = Btn;
window.Seg = Seg;
window.FLabel = FLabel;
window.Spark = Spark;
window.PrimaryBtn = PrimaryBtn;
window.Tag = Tag;
window.ProjectSwatch = ProjectSwatch;
window.COMP_STYLES = COMP_STYLES;
