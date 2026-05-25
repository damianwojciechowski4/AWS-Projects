/* Larger composite screens & panels for the studio */

// ---------- Top app bar ----------
const TopBar = ({ activeProject, providerId, modelId, onProvider, onModel, route, onRoute }) => {
  const project = PROJECTS.find(p=>p.id===activeProject);
  const prov = PROVIDERS.find(p=>p.id===providerId);
  const model = prov?.models.find(m=>m.id===modelId);
  return (
    <header className="topbar">
      <div className="topbar-left">
        <nav className="top-nav">
          {[
            { id:'studio',   label:'Studio',   icon:<I.sparkle size={14}/> },
            { id:'projects', label:'Projects', icon:<I.folder size={14}/> },
            { id:'history',  label:'History',  icon:<I.history size={14}/> },
            { id:'usage',    label:'Usage',    icon:<I.chart size={14}/> },
          ].map(t => (
            <button key={t.id} className={cx('top-nav-btn', route===t.id && 'is-active')} onClick={()=>onRoute(t.id)}>
              {t.icon}<span>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="topbar-right">
        <div className="provider-pick">
          {PROVIDERS.map(p => (
            <button key={p.id} className={cx('provider-pick-btn', providerId===p.id && 'is-active')} onClick={()=>onProvider(p.id)}>
              <ProviderDot id={p.id} size={16} />
              <span>{p.name}</span>
              <span className={cx('dot-status', p.status)}/>
            </button>
          ))}
        </div>

        <div className="divider-v" />

        <button className="model-pick">
          <span className="model-pick-name">{model?.name || '—'}</span>
          <span className="model-pick-cost">${model?.cost.toFixed(3)}/img</span>
          <I.chev size={12} />
        </button>

        <div className="divider-v" />

        <button className="user-chip" title="szymon@private">
          <span className="user-avatar">S</span>
        </button>
      </div>
    </header>
  );
};

// ---------- Left rail (projects) ----------
const LeftRail = ({ activeProject, onProject, onNew, route }) => {
  const pinned = PROJECTS.filter(p=>p.pinned);
  const rest = PROJECTS.filter(p=>!p.pinned);
  return (
    <aside className="rail">
      <div className="rail-section">
        <div className="rail-search">
          <I.search size={13}/>
          <input placeholder="Search projects, prompts…" />
          <span className="kbd">⌘K</span>
        </div>
      </div>

      <div className="rail-section">
        <button className="rail-new" onClick={onNew}>
          <I.plus size={14}/><span>New project</span>
        </button>
      </div>

      <div className="rail-section">
        <div className="rail-heading">
          <span>Pinned</span>
          <span className="rail-heading-count">{pinned.length}</span>
        </div>
        {pinned.map(p => <ProjectRow key={p.id} project={p} active={activeProject===p.id} onClick={()=>onProject(p.id)} />)}
      </div>

      <div className="rail-section">
        <div className="rail-heading">
          <span>All projects</span>
          <span className="rail-heading-count">{PROJECTS.length}</span>
        </div>
        {rest.map(p => <ProjectRow key={p.id} project={p} active={activeProject===p.id} onClick={()=>onProject(p.id)} />)}
      </div>

      <div className="rail-foot">
        <div className="rail-foot-row">
          <span className="rail-foot-label">Today</span>
          <span className="rail-foot-val"><span className="dot-status connected"/> 14 runs · $0.56</span>
        </div>
        <div className="rail-foot-row">
          <span className="rail-foot-label">Month</span>
          <span className="rail-foot-val">231 runs · $8.42</span>
        </div>
      </div>
    </aside>
  );
};

const ProjectRow = ({ project, active, onClick }) => (
  <button className={cx('proj-row', active && 'is-active')} onClick={onClick} style={{ '--row-h': project.accent }}>
    <ProjectSwatch hue={project.accent} active={active} />
    <span className="proj-row-text">
      <span className="proj-row-name">{project.name}</span>
      <span className="proj-row-sub">{project.sub}</span>
    </span>
    <span className="proj-row-runs">{project.runs}</span>
  </button>
);

// ---------- Right inspector (simplified: provider, ratio, seed, project summary) ----------
const Inspector = ({ project, providerId, onProvider, ratio, onRatio, seed, onSeed, lockSeed, onLockSeed }) => {
  return (
    <aside className="inspector">
      <div className="inspector-tabs">
        <button className="inspector-tab is-active">Settings</button>
        <button className="inspector-tab">Reference</button>
      </div>

      <div className="inspector-body">
        {/* Provider */}
        <div className="ins-section">
          <FLabel>Provider</FLabel>
          <div className="ins-providers">
            {PROVIDERS.map(p => (
              <button key={p.id} className={cx('ins-prov', providerId===p.id && 'is-active')} onClick={()=>onProvider(p.id)}>
                <ProviderDot id={p.id} size={20} />
                <div className="ins-prov-text">
                  <div className="ins-prov-name">{p.name}</div>
                  <div className="ins-prov-meta"><span className="dot-status connected"/> connected</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Aspect */}
        <div className="ins-section">
          <FLabel hint={ratio}>Aspect ratio</FLabel>
          <div className="ratio-grid">
            {RATIOS.map(r => (
              <button key={r.id} className={cx('ratio', ratio===r.id && 'is-active')} onClick={()=>onRatio(r.id)}>
                <div className="ratio-shape" style={{ aspectRatio: `${r.w}/${r.h}` }} />
                <div className="ratio-label">{r.id}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Seed */}
        <div className="ins-section">
          <FLabel hint={lockSeed?'locked':'random'} action={
            <button className="micro-btn" onClick={()=>onLockSeed(!lockSeed)} title={lockSeed?'Unlock seed':'Lock seed'}>
              {lockSeed ? <I.pin size={11}/> : <I.pinO size={11}/>}
            </button>
          }>Seed</FLabel>
          <div className="seed-row">
            <input className="seed-input" value={seed} onChange={e=>onSeed(e.target.value)} disabled={!lockSeed} />
            <button className="micro-btn" onClick={()=>onSeed(String(Math.floor(Math.random()*9999999)))} title="Re-roll"><I.dice size={13}/></button>
          </div>
        </div>

        {/* Project summary — read-only; theme lives on the project */}
        <div className="ins-section ins-section-tinted">
          <div className="ins-theme-head">
            <FLabel>Project</FLabel>
            <button className="micro-btn-text"><I.settings size={11}/> Edit</button>
          </div>
          <div className="ins-theme-name">
            <ProjectSwatch hue={project.accent} size={18}/>
            <span>{project.name}</span>
          </div>
          <div className="ins-theme">
            <div className="ins-theme-row">
              <span className="ins-theme-key">Theme</span>
              <span className="ins-theme-val">{project.style || <em>none</em>}</span>
            </div>
            <div className="ins-theme-row">
              <span className="ins-theme-key">Default model</span>
              <span className="ins-theme-val">{(PROVIDERS.flatMap(x=>x.models).find(m=>m.id===project.model))?.name || '—'}</span>
            </div>
            <div className="ins-theme-row">
              <span className="ins-theme-key">Reference</span>
              <span className="ins-theme-val">{project.refImage ? '1 pinned image' : 'none'}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

// ---------- Studio canvas (main work area) ----------
const StudioCanvas = ({ project, ratio, count, mode, isGenerating, onGenerate, prompt, onPrompt, history }) => {
  const generations = history.filter(h => h.project === project.id);
  const sessions = groupSessions(generations);

  return (
    <main className="canvas">
      <div className="canvas-head">
        <div className="canvas-head-left">
          <div className="canvas-crumbs">
            <span className="crumb-muted">Projects</span>
            <I.chevR size={11} />
            <ProjectSwatch hue={project.accent} size={14}/>
            <span className="crumb">{project.name}</span>
          </div>
          <h1 className="canvas-title">{project.name}</h1>
          <div className="canvas-sub">
            <span className="canvas-sub-item">{project.style || 'No theme'}</span>
            <span className="canvas-sub-dot" />
            <span className="canvas-sub-item">{project.runs} runs</span>
            <span className="canvas-sub-dot" />
            <span className="canvas-sub-item">${(project.runs * 0.020).toFixed(2)} spent</span>
          </div>
        </div>

        <div className="canvas-head-right">
          <Btn icon={<I.layers size={13}/>} variant="line" size="sm">Theme</Btn>
          <Btn icon={<I.settings size={13}/>} variant="line" size="sm">Edit project</Btn>
        </div>
      </div>

      <div className="canvas-body">
        {sessions.map((s,i)=> (
          <SessionGroup key={i} session={s} loading={i===0 && isGenerating} count={count} ratio={ratio}/>
        ))}
        {sessions.length === 0 && <EmptyState project={project}/>}
      </div>

      <PromptDock
        project={project}
        ratio={ratio}
        count={count}
        mode={mode}
        prompt={prompt}
        onPrompt={onPrompt}
        onGenerate={onGenerate}
        busy={isGenerating}
      />
    </main>
  );
};

// Group consecutive same-prompt entries together
const groupSessions = (gens) => {
  const out = [];
  let last = null;
  gens.forEach(g => {
    if (last && last.prompt === g.prompt && last.model === g.model) {
      last.items.push(g);
    } else {
      last = { prompt: g.prompt, model: g.model, ratio: g.ratio, time: g.time, items: [g] };
      out.push(last);
    }
  });
  return out;
};

const SessionGroup = ({ session, loading, count, ratio }) => {
  const model = PROVIDERS.flatMap(p=>p.models).find(m=>m.id===session.model);
  return (
    <div className="session">
      <div className="session-head">
        <div className="session-head-left">
          <span className="session-time">{session.time}</span>
          <span className="session-prompt">{session.prompt}</span>
        </div>
        <div className="session-head-right">
          <Tag>{model?.name || session.model}</Tag>
          <Tag>{session.ratio}</Tag>
          <button className="micro-btn" title="Re-run"><I.refresh size={12}/></button>
          <button className="micro-btn" title="Copy prompt"><I.copy size={12}/></button>
        </div>
      </div>
      <div className="session-grid" style={{ '--cols': session.items.length }}>
        {session.items.map(g => (
          <GenCard key={g.id} g={g}/>
        ))}
        {loading && Array.from({length: count}).map((_,i)=>(
          <div className="gen-card is-loading" key={'l'+i}>
            <ImagePh hue={70} lum={0.5} ratio={ratio} status="loading" seed={`pending`} />
          </div>
        ))}
      </div>
    </div>
  );
};

const GenCard = ({ g }) => (
  <div className={cx('gen-card', g.pinned && 'is-pinned')}>
    <ImagePh hue={g.hue} lum={g.lum} ratio={g.ratio} seed={g.seed} />
    <div className="gen-card-overlay">
      <div className="gen-card-actions">
        <button className="micro-btn" title="Pin">{g.pinned ? <I.pin size={12}/> : <I.pinO size={12}/>}</button>
        <button className="micro-btn" title="Variations"><I.sparkle size={12}/></button>
        <button className="micro-btn" title="Download"><I.download size={12}/></button>
        <button className="micro-btn" title="Expand"><I.expand size={12}/></button>
      </div>
      <div className="gen-card-meta">
        <span className="mono">${g.cost.toFixed(3)}</span>
        <span className="mono">{g.seed}</span>
      </div>
    </div>
  </div>
);

const EmptyState = ({ project }) => (
  <div className="empty">
    <div className="empty-mark"><I.sparkle size={20}/></div>
    <div className="empty-title">Start a generation</div>
    <div className="empty-sub">Type a prompt below. The project's theme is applied automatically.</div>
  </div>
);

// ---------- Prompt dock (bottom) ----------
const PromptDock = ({ project, ratio, count, mode, prompt, onPrompt, onGenerate, busy }) => {
  const onKey = e => { if ((e.metaKey||e.ctrlKey) && e.key==='Enter') onGenerate(); };
  return (
    <div className="prompt-dock">
      <div className="prompt-dock-frame">
        <div className="prompt-dock-top">
          <div className="prompt-context">
            <ProjectSwatch hue={project.accent} size={16}/>
            <span className="prompt-context-name">{project.name}</span>
            <span className="prompt-context-arrow"><I.chevR size={10}/></span>
            <span className="prompt-context-style">{project.style || 'no theme'}</span>
          </div>
          <div className="prompt-context-right">
            <button className="prompt-ref"><I.image size={13}/> 1 reference</button>
          </div>
        </div>
        <div className="prompt-dock-mid">
          <textarea
            className="prompt-input"
            placeholder={`Describe what to generate. Theme will be applied automatically.`}
            value={prompt}
            onChange={e=>onPrompt(e.target.value)}
            onKeyDown={onKey}
            rows={2}
          />
        </div>
        <div className="prompt-dock-bot">
          <div className="prompt-dock-bot-left">
            <button className="dock-chip"><I.upload size={12}/> Add image</button>
          </div>
          <div className="prompt-dock-bot-right">
            <div style={{ width: 180 }}>
              <PrimaryBtn onClick={onGenerate} busy={busy} icon={<I.sparkle size={14}/>} kbd="⌘↵">Generate</PrimaryBtn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Projects screen (full grid) ----------
const ProjectsScreen = ({ onOpen }) => (
  <div className="screen">
    <div className="screen-head">
      <div>
        <h1 className="screen-title">Projects</h1>
        <div className="screen-sub">Themes are reusable contexts. Each one carries a style, a template, optional reference images and a default model.</div>
      </div>
      <Btn variant="tint" size="lg" icon={<I.plus size={14}/>}>New project</Btn>
    </div>

    <div className="proj-grid">
      {PROJECTS.map(p => (
        <button key={p.id} className="proj-card" onClick={()=>onOpen(p.id)} style={{ '--row-h': p.accent }}>
          <div className="proj-card-cover">
            <ImagePh hue={p.accent} lum={0.55} ratio="3:2" />
            <div className="proj-card-cover-fade"/>
            <div className="proj-card-cover-marks">
              <ProjectSwatch hue={p.accent} size={28}/>
            </div>
          </div>
          <div className="proj-card-body">
            <div className="proj-card-row">
              <h3 className="proj-card-name">{p.name}</h3>
              {p.pinned && <I.pin size={12} style={{ color: 'var(--accent)'}}/>}
            </div>
            <div className="proj-card-style">{p.style}</div>
            <div className="proj-card-meta">
              <Tag>{p.ratio}</Tag>
              <Tag>{(PROVIDERS.flatMap(x=>x.models).find(m=>m.id===p.model))?.name || '—'}</Tag>
              <span className="proj-card-runs">{p.runs} runs</span>
            </div>
          </div>
        </button>
      ))}

      <button className="proj-card proj-card-new">
        <div className="proj-card-new-mark"><I.plus size={18}/></div>
        <div className="proj-card-new-label">New project</div>
        <div className="proj-card-new-sub">Theme, template, references, default model.</div>
      </button>
    </div>
  </div>
);

// ---------- History screen ----------
const HistoryScreen = () => (
  <div className="screen">
    <div className="screen-head">
      <div>
        <h1 className="screen-title">History</h1>
        <div className="screen-sub">Every generation, across every project. Stored in S3, indexed in DynamoDB.</div>
      </div>
      <div style={{display:'flex', gap:8}}>
        <Seg value="all" onChange={()=>{}} options={[{value:'all', label:'All'}, {value:'pin', label:'Pinned'}, {value:'fail', label:'Failed'}]}/>
      </div>
    </div>

    <div className="hist-grid">
      {HIST.map(g => (
        <div key={g.id} className="hist-cell">
          <ImagePh hue={g.hue} lum={g.lum} ratio="1:1" seed={g.seed}/>
          <div className="hist-cell-meta">
            <span className="hist-cell-prompt">{g.prompt}</span>
            <span className="hist-cell-row">
              <span className="hist-cell-time">{g.time}</span>
              <span className="hist-cell-cost">${g.cost.toFixed(3)}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ---------- Usage screen ----------
const UsageScreen = () => {
  const total14d = USAGE_DAYS.reduce((s,d)=>s+d.runs, 0);
  const cost14d  = USAGE_DAYS.reduce((s,d)=>s+d.cost, 0);
  const ok = USAGE_RECENT.filter(r=>r.ok).length;
  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <h1 className="screen-title">Usage</h1>
          <div className="screen-sub">Tokens & cost per run, written to DynamoDB at the end of every Lambda invocation.</div>
        </div>
        <Seg value="14d" onChange={()=>{}} options={[{value:'24h', label:'24h'}, {value:'14d', label:'14 days'}, {value:'90d', label:'90 days'}]} />
      </div>

      <div className="stats-row">
        <StatCard label="Generations · 14d"   value={total14d}            sub="+ 12% vs prior" tone="tint"/>
        <StatCard label="Spend · 14d"         value={`$${cost14d.toFixed(2)}`} sub="$0.62/day avg" tone="neutral"/>
        <StatCard label="Avg latency"         value="4.2 s"               sub="OpenRouter median"/>
        <StatCard label="Success rate"        value={`${Math.round((ok/USAGE_RECENT.length)*100)}%`} sub={`${USAGE_RECENT.length-ok} failed`} tone="good"/>
      </div>

      <div className="usage-grid">
        <div className="usage-card">
          <div className="usage-card-head">
            <h3>Runs per day</h3>
            <div className="usage-card-sub">{USAGE_DAYS.length} days</div>
          </div>
          <BarChart data={USAGE_DAYS}/>
        </div>
        <div className="usage-card">
          <div className="usage-card-head">
            <h3>By provider</h3>
            <div className="usage-card-sub">14 days</div>
          </div>
          <ProviderSplit/>
        </div>
      </div>

      <div className="usage-card usage-card-full">
        <div className="usage-card-head">
          <h3>Recent runs</h3>
          <div className="usage-card-sub">From CloudWatch · last 24 hours</div>
        </div>
        <table className="usage-table">
          <thead>
            <tr><th>Time</th><th>Project</th><th>Model</th><th>Prompt</th><th>Tokens</th><th>Cost</th><th>Latency</th><th>Status</th></tr>
          </thead>
          <tbody>
            {USAGE_RECENT.map(r => {
              const proj = PROJECTS.find(p=>p.id===r.project);
              const model = PROVIDERS.flatMap(p=>p.models).find(m=>m.id===r.model);
              return (
                <tr key={r.id}>
                  <td className="mono">{r.t}</td>
                  <td><span className="cell-proj"><ProjectSwatch hue={proj?.accent || 60} size={12}/>{proj?.name || '—'}</span></td>
                  <td>{model?.name}</td>
                  <td className="cell-prompt">{r.prompt}</td>
                  <td className="mono">{r.tokens}</td>
                  <td className="mono">${r.cost.toFixed(3)}</td>
                  <td className="mono">{(r.ms/1000).toFixed(2)}s</td>
                  <td>{r.ok ? <Tag tone="good">ok</Tag> : <Tag tone="err">{r.err}</Tag>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, tone }) => (
  <div className={cx('stat-card', tone && `stat-card-${tone}`)}>
    <div className="stat-card-label">{label}</div>
    <div className="stat-card-value">{value}</div>
    <div className="stat-card-sub">{sub}</div>
  </div>
);

const BarChart = ({ data }) => {
  const max = Math.max(...data.map(d=>d.runs));
  return (
    <div className="bars">
      {data.map((d,i)=>(
        <div key={i} className="bars-col">
          <div className="bars-bar" style={{ height: `${(d.runs/max)*100}%` }} />
          <div className="bars-label">{d.d}</div>
        </div>
      ))}
    </div>
  );
};

const ProviderSplit = () => {
  const splits = [
    { id:'openrouter', pct: 64, runs: 142, cost: 4.84, hue: 70 },
    { id:'gemini',     pct: 36, runs:  79, cost: 3.58, hue: 240 },
  ];
  return (
    <div className="prov-split">
      <div className="prov-split-bar">
        {splits.map(s=>(
          <div key={s.id} className="prov-split-seg" style={{ width: `${s.pct}%`, background: `oklch(0.62 0.10 ${s.hue})` }}/>
        ))}
      </div>
      <div className="prov-split-list">
        {splits.map(s=>{
          const p = PROVIDERS.find(x=>x.id===s.id);
          return (
            <div key={s.id} className="prov-split-row">
              <span className="prov-split-row-l"><ProviderDot id={s.id} size={16}/>{p.name}</span>
              <span className="prov-split-row-r"><span className="mono">{s.runs} runs</span><span className="mono">${s.cost.toFixed(2)}</span><span className="mono">{s.pct}%</span></span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

window.TopBar = TopBar;
window.LeftRail = LeftRail;
window.Inspector = Inspector;
window.StudioCanvas = StudioCanvas;
window.ProjectsScreen = ProjectsScreen;
window.HistoryScreen = HistoryScreen;
window.UsageScreen = UsageScreen;
