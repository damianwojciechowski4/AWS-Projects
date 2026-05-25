/* Main app, routes, and screen-level styles */

const { useState, useEffect, useMemo } = React;

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentHue": 70,
  "density": "comfortable",
  "showInspector": false,
  "tintWorkspace": true
}/*EDITMODE-END*/;

const App = () => {
  const [t, setTweak] = window.useTweaks(DEFAULTS);

  const [route, setRoute]       = useState('studio');
  const [activeProject, setAP]  = useState('p_brand');
  const [providerId, setProv]   = useState('openrouter');
  const [modelId, setModel]     = useState('or/flux-1.1-pro');
  const [ratio, setRatio]       = useState('16:9');
  const [count, setCount]       = useState(1);
  const [mode, setMode]         = useState('quality');
  const [seed, setSeed]         = useState('4429183');
  const [lockSeed, setLockSeed] = useState(false);
  const [prompt, setPrompt]     = useState('');
  const [busy, setBusy]         = useState(false);
  const [history, setHistory]   = useState([]);

  const project = PROJECTS.find(p=>p.id===activeProject);

  // Apply project tint when active
  useEffect(()=>{
    if (t.tintWorkspace) {
      document.documentElement.style.setProperty('--tint-h', String(project.accent));
    } else {
      document.documentElement.style.setProperty('--tint-h', '70');
    }
  }, [activeProject, t.tintWorkspace, project]);

  const handleProvider = id => {
    setProv(id);
    const m = PROVIDERS.find(p=>p.id===id).models[0];
    setModel(m.id);
  };

  const handleGenerate = () => {
    if (busy) return;
    setBusy(true);
    setTimeout(()=>{
      const newGens = Array.from({length: count}).map((_,i)=>({
        id: 'g_' + Date.now() + '_' + i,
        project: activeProject,
        prompt,
        model: modelId,
        ratio,
        seed: String(Math.floor(Math.random()*9999999)),
        cost: PROVIDERS.flatMap(p=>p.models).find(m=>m.id===modelId)?.cost || 0.020,
        time: 'just now',
        pinned: false,
        hue: project.accent + (i*15 - 22),
        lum: 0.42 + i*0.08,
      }));
      setHistory(h => [...newGens, ...h]);
      setBusy(false);
    }, 1800);
  };

  return (
    <div className={cx('app', `density-${t.density}`)}>
      <TopBar
        activeProject={activeProject}
        providerId={providerId}
        modelId={modelId}
        onProvider={handleProvider}
        onModel={setModel}
        route={route}
        onRoute={setRoute}
      />

      <div className="app-body">
        {(route === 'studio') && (
          <>
            <LeftRail activeProject={activeProject} onProject={setAP} onNew={()=>{}} route={route}/>
            <StudioCanvas
              project={project}
              ratio={ratio}
              count={count}
              mode={mode}
              isGenerating={busy}
              onGenerate={handleGenerate}
              prompt={prompt}
              onPrompt={setPrompt}
              history={history}
            />
            {t.showInspector && (
              <Inspector
                project={project}
                providerId={providerId}
                onProvider={handleProvider}
                ratio={ratio}
                onRatio={setRatio}
                seed={seed}
                onSeed={setSeed}
                lockSeed={lockSeed}
                onLockSeed={setLockSeed}
              />
            )}
          </>
        )}

        {route === 'projects' && <ProjectsScreen onOpen={(id)=>{ setAP(id); setRoute('studio'); }} />}
        {route === 'history'  && <HistoryScreen/>}
        {route === 'usage'    && <UsageScreen/>}
      </div>

      <window.TweaksPanel title="Tweaks">
        <window.TweakSection title="Workspace">
          <window.TweakRadio tweakKey="density" label="Density" options={[
            { value:'compact', label:'Compact' },
            { value:'comfortable', label:'Comfortable' },
          ]}/>
          <window.TweakToggle tweakKey="tintWorkspace" label="Tint by project" />
          <window.TweakToggle tweakKey="showInspector" label="Show inspector" />
        </window.TweakSection>
      </window.TweaksPanel>

      <style>{COMP_STYLES}</style>
      <style>{APP_STYLES}</style>
    </div>
  );
};

const APP_STYLES = `
.app { display:flex; flex-direction:column; height:100vh; min-height: 0; background: var(--bg-0); }
.app-body { flex:1; display:flex; min-height: 0; }

/* tint on workspace background */
.app::before { content:''; position:fixed; inset: 0; pointer-events:none; background: radial-gradient(80% 50% at 50% 0%, oklch(0.78 0.13 var(--tint-h) / 0.05), transparent 70%); z-index: 0; }

/* density */
.density-compact { font-size: 13px; }
.density-compact .ins-section { padding: 10px 14px; }
.density-compact .proj-row { padding: 6px 8px; }

/* ============ TOP BAR ============ */
.topbar { display:flex; align-items:center; justify-content: space-between; padding: 0 12px; height: 48px; background: var(--bg-1); border-bottom: 1px solid var(--line-soft); position: relative; z-index: 5; flex: 0 0 auto; }
.topbar-left, .topbar-right { display:flex; align-items:center; gap: 12px; }
.brand { display:flex; align-items:center; gap: 8px; padding-right: 12px; border-right: 1px solid var(--line-soft); height: 28px; }
.brand-mark { width: 22px; height: 22px; border-radius: 6px; background: linear-gradient(135deg, oklch(0.78 0.14 70), oklch(0.45 0.12 30)); display:flex; align-items:center; justify-content:center; box-shadow: inset 0 0 0 1px oklch(1 0 0 / 0.06), 0 4px 10px oklch(0.40 0.10 50 / 0.4); }
.brand-mark-inner { width: 8px; height: 8px; background: oklch(0.18 0.005 60); border-radius: 2px; transform: rotate(45deg); }
.brand-name { font-family: var(--font-serif); font-size: 17px; letter-spacing: -0.01em; }
.brand-tag { font-family: var(--font-mono); font-size: 10px; color: var(--fg-3); padding: 2px 5px; border-radius: 3px; border: 1px solid var(--line-soft); }
.top-nav { display:flex; gap: 2px; }
.top-nav-btn { display:flex; align-items:center; gap: 6px; padding: 5px 10px; border-radius: 6px; background: transparent; border: none; color: var(--fg-2); cursor: pointer; font-size: 13px; }
.top-nav-btn:hover { color: var(--fg-0); background: var(--bg-2); }
.top-nav-btn.is-active { color: var(--fg-0); background: var(--bg-2); }

.provider-pick { display:inline-flex; padding: 3px; background: var(--bg-0); border:1px solid var(--line-soft); border-radius: 8px; gap:2px; }
.provider-pick-btn { display:inline-flex; align-items:center; gap:6px; padding: 4px 8px 4px 4px; border-radius: 5px; background: transparent; border: none; color: var(--fg-2); font-size: 12.5px; cursor: pointer; }
.provider-pick-btn:hover { color: var(--fg-1); }
.provider-pick-btn.is-active { background: var(--bg-2); color: var(--fg-0); }
.dot-status { width: 6px; height: 6px; border-radius: 50%; background: var(--fg-3); }
.dot-status.connected { background: oklch(0.78 0.14 150); box-shadow: 0 0 6px oklch(0.78 0.14 150 / 0.7); }

.model-pick { display:inline-flex; align-items:center; gap: 8px; padding: 5px 10px; border-radius: 6px; background: var(--bg-0); border: 1px solid var(--line-soft); color: var(--fg-1); font-size: 12.5px; cursor: pointer; }
.model-pick:hover { border-color: var(--line); color: var(--fg-0); }
.model-pick-name { font-weight: 500; color: var(--fg-0); }
.model-pick-cost { font-family: var(--font-mono); font-size: 11px; color: var(--fg-3); }
.divider-v { width:1px; height: 22px; background: var(--line-soft); }

.user-chip { display:inline-flex; align-items:center; padding: 0; border-radius: 50%; background: transparent; border: none; cursor: pointer; }
.user-avatar { width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, oklch(0.45 0.06 280), oklch(0.55 0.08 200)); display:inline-flex; align-items:center; justify-content:center; font-size: 11px; font-weight: 600; color: oklch(0.95 0 0); box-shadow: inset 0 0 0 1px oklch(1 0 0 / 0.10); }

/* ============ LEFT RAIL ============ */
.rail { width: var(--col-rail); flex: 0 0 var(--col-rail); background: var(--bg-1); border-right: 1px solid var(--line-soft); display:flex; flex-direction:column; min-height: 0; position: relative; z-index: 1; }
.rail-section { padding: 10px 10px 0; }
.rail-section + .rail-section { padding-top: 14px; }
.rail-section:has(.rail-foot) { margin-top: auto; padding-bottom: 10px; }
.rail-search { display:flex; align-items:center; gap: 8px; padding: 6px 8px; background: var(--bg-0); border: 1px solid var(--line-soft); border-radius: 7px; color: var(--fg-2); }
.rail-search input { flex:1; background: transparent; border: none; outline: none; font-size: 12.5px; color: var(--fg-0); min-width: 0; }
.rail-search input::placeholder { color: var(--fg-3); }
.rail-new { display:flex; align-items:center; gap: 8px; width: 100%; padding: 7px 10px; border-radius: 7px; background: var(--tint-soft); border: 1px dashed oklch(0.78 0.13 var(--tint-h) / 0.4); color: var(--fg-0); font-size: 13px; cursor: pointer; transition: 120ms; }
.rail-new:hover { background: oklch(0.78 0.13 var(--tint-h) / 0.18); }
.rail-heading { display:flex; justify-content:space-between; align-items:center; padding: 0 6px 6px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--fg-3); font-weight: 500; }
.rail-heading-count { font-family: var(--font-mono); }

.proj-row { display:flex; align-items:center; gap: 10px; width: 100%; padding: 7px 8px; background: transparent; border: 1px solid transparent; border-radius: 7px; cursor: pointer; text-align: left; transition: 100ms; }
.proj-row:hover { background: var(--bg-2); }
.proj-row.is-active { background: var(--bg-2); border-color: var(--line-soft); box-shadow: inset 3px 0 0 oklch(0.78 0.13 var(--row-h)); }
.proj-row-text { flex:1; min-width: 0; display:flex; flex-direction:column; gap: 1px; }
.proj-row-name { font-size: 13px; color: var(--fg-0); white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.proj-row-sub { font-size: 11px; color: var(--fg-3); white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.proj-row-runs { font-family: var(--font-mono); font-size: 10.5px; color: var(--fg-3); }

.rail-foot { padding: 10px 14px 0; margin-top: auto; border-top: 1px solid var(--line-soft); }
.rail-foot-row { display:flex; justify-content:space-between; align-items:center; padding: 5px 0; font-size: 11.5px; }
.rail-foot-label { color: var(--fg-3); text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em; }
.rail-foot-val { font-family: var(--font-mono); color: var(--fg-1); display:flex; align-items:center; gap:6px; }

/* ============ CANVAS ============ */
.canvas { flex: 1; min-width: 0; display:flex; flex-direction:column; min-height: 0; position: relative; z-index: 1; background: var(--bg-0); }
.canvas-head { display:flex; justify-content:space-between; align-items: flex-end; padding: 22px 28px 18px; border-bottom: 1px solid var(--line-soft); }
.canvas-crumbs { display:flex; align-items:center; gap: 6px; font-size: 12px; color: var(--fg-2); margin-bottom: 8px; }
.crumb-muted { color: var(--fg-3); }
.crumb { color: var(--fg-1); }
.canvas-title { font-family: var(--font-serif); font-size: 28px; line-height: 1; letter-spacing: -0.01em; margin: 0 0 8px; font-weight: 400; }
.canvas-sub { display:flex; align-items:center; gap: 10px; font-size: 12.5px; color: var(--fg-2); }
.canvas-sub-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--fg-3); }
.canvas-head-right { display:flex; gap: 6px; }

.canvas-body { flex:1; overflow-y: auto; padding: 22px 28px 200px; display:flex; flex-direction: column; gap: 36px; }

.session { display:flex; flex-direction:column; gap: 12px; }
.session-head { display:flex; justify-content:space-between; align-items:center; gap: 16px; }
.session-head-left { display:flex; align-items:center; gap: 12px; min-width: 0; flex: 1; }
.session-time { font-family: var(--font-mono); font-size: 11px; color: var(--fg-3); flex: 0 0 auto; }
.session-prompt { font-size: 13.5px; color: var(--fg-0); white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.session-head-right { display:flex; align-items:center; gap: 6px; flex: 0 0 auto; }
.session-grid { display:grid; grid-template-columns: repeat(var(--cols), 1fr); gap: 10px; }

.gen-card { position: relative; border-radius: 8px; overflow: hidden; cursor: zoom-in; }
.gen-card .ph { border-radius: 8px; }
.gen-card.is-pinned::before { content:''; position:absolute; top:8px; left:8px; width:7px; height:7px; border-radius:50%; background: var(--accent); box-shadow: 0 0 8px var(--accent); z-index: 3; }
.gen-card-overlay { position:absolute; inset: 0; padding: 10px; display:flex; flex-direction:column; justify-content: space-between; opacity: 0; transition: 150ms; background: linear-gradient(180deg, oklch(0 0 0 / 0.30), transparent 30%, transparent 70%, oklch(0 0 0 / 0.50)); }
.gen-card:hover .gen-card-overlay { opacity: 1; }
.gen-card-actions { display:flex; gap: 4px; align-self: flex-end; }
.gen-card-meta { display:flex; justify-content: space-between; font-family: var(--font-mono); font-size: 10.5px; color: oklch(1 0 0 / 0.80); }

.micro-btn { display:inline-flex; align-items:center; justify-content:center; width: 22px; height: 22px; border-radius: 5px; background: oklch(0 0 0 / 0.30); backdrop-filter: blur(6px); border: 1px solid oklch(1 0 0 / 0.08); color: oklch(1 0 0 / 0.80); cursor:pointer; padding: 0; }
.micro-btn:hover { background: oklch(0 0 0 / 0.50); color: oklch(1 0 0); }

.empty { display:flex; flex-direction:column; align-items:center; padding: 60px 0; text-align: center; gap: 8px; color: var(--fg-2); }
.empty-mark { width:44px; height:44px; border-radius: 12px; background: var(--bg-2); display:flex; align-items:center; justify-content:center; color: var(--accent); }
.empty-title { font-family: var(--font-serif); font-size: 20px; color: var(--fg-0); }
.empty-sub { font-size: 13px; max-width: 360px; }
.empty-starters { display:flex; flex-wrap: wrap; gap: 6px; justify-content:center; max-width: 540px; margin-top: 8px; }
.empty-starter { padding: 5px 10px; border-radius: 999px; background: var(--bg-1); border: 1px solid var(--line-soft); color: var(--fg-1); font-size: 12px; cursor: pointer; }
.empty-starter:hover { background: var(--bg-2); border-color: var(--line); }

/* ============ PROMPT DOCK ============ */
.prompt-dock { position: absolute; left: 28px; right: 28px; bottom: 22px; z-index: 2; }
.prompt-dock-frame { background: oklch(0.20 0.006 60 / 0.85); backdrop-filter: blur(12px); border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 18px 40px oklch(0 0 0 / 0.4), 0 2px 6px oklch(0 0 0 / 0.3); padding: 12px 14px; display:flex; flex-direction:column; gap: 8px; }
.prompt-dock-top { display:flex; justify-content: space-between; align-items: center; }
.prompt-context { display:flex; align-items:center; gap: 8px; font-size: 12px; }
.prompt-context-name { color: var(--fg-0); }
.prompt-context-arrow { color: var(--fg-3); display:inline-flex; }
.prompt-context-style { color: var(--fg-2); font-style: italic; }
.prompt-context-right { display:flex; gap: 6px; }
.prompt-ref { display:inline-flex; align-items:center; gap: 5px; font-size: 11.5px; padding: 4px 8px; background: var(--bg-2); border: 1px solid var(--line-soft); border-radius: 999px; color: var(--fg-1); cursor: pointer; }
.prompt-ref:hover { background: var(--bg-3); }

.prompt-input { width: 100%; min-height: 44px; max-height: 180px; resize: none; background: transparent; border: none; outline: none; font-size: 14.5px; color: var(--fg-0); line-height: 1.5; padding: 4px 0; font-family: var(--font-sans); }
.prompt-input::placeholder { color: var(--fg-3); }

.prompt-dock-bot { display:flex; justify-content:space-between; align-items:center; gap: 12px; }
.prompt-dock-bot-left { display:flex; gap: 6px; }
.prompt-dock-bot-right { display:flex; align-items:center; gap: 10px; }
.dock-chip { display:inline-flex; align-items:center; gap: 5px; padding: 5px 9px; border-radius: 6px; background: var(--bg-2); border: 1px solid var(--line-soft); color: var(--fg-1); font-size: 12px; cursor: pointer; }
.dock-chip:hover { border-color: var(--line); color: var(--fg-0); }
.prompt-stat { font-family: var(--font-mono); font-size: 11px; color: var(--fg-3); padding: 2px 6px; background: var(--bg-2); border-radius: 4px; border: 1px solid var(--line-soft); }

/* ============ INSPECTOR ============ */
.inspector { width: var(--col-inspector); flex: 0 0 var(--col-inspector); border-left: 1px solid var(--line-soft); background: var(--bg-1); display:flex; flex-direction:column; min-height: 0; }
.inspector-tabs { display:flex; border-bottom: 1px solid var(--line-soft); padding: 0 8px; gap: 2px; }
.inspector-tab { padding: 12px 12px 11px; background: transparent; border: none; color: var(--fg-2); font-size: 12.5px; cursor: pointer; border-bottom: 1px solid transparent; margin-bottom: -1px; }
.inspector-tab:hover { color: var(--fg-0); }
.inspector-tab.is-active { color: var(--fg-0); border-bottom-color: var(--accent); }

.inspector-body { flex:1; overflow-y: auto; }
.ins-section { padding: 14px 16px; border-bottom: 1px solid var(--line-soft); }
.ins-section:last-child { border-bottom: none; }
.ins-section-tinted { background: linear-gradient(180deg, oklch(0.78 0.13 var(--tint-h) / 0.06), transparent); border-top: 1px solid oklch(0.78 0.13 var(--tint-h) / 0.20); }

.ins-providers { display:flex; flex-direction: column; gap: 4px; }
.ins-prov { display:flex; align-items:center; gap: 10px; padding: 8px; border: 1px solid var(--line-soft); border-radius: 7px; background: var(--bg-2); cursor: pointer; text-align: left; }
.ins-prov:hover { border-color: var(--line); }
.ins-prov.is-active { border-color: oklch(0.78 0.13 var(--tint-h) / 0.4); background: var(--tint-soft); }
.ins-prov-text { flex:1; min-width: 0; }
.ins-prov-name { font-size: 13px; color: var(--fg-0); }
.ins-prov-meta { font-size: 11px; color: var(--fg-3); display:flex; align-items:center; gap: 6px; }

.ins-models { display:flex; flex-direction: column; gap: 2px; }
.ins-model { display:flex; align-items:center; justify-content: space-between; padding: 7px 10px; background: transparent; border: 1px solid transparent; border-radius: 6px; cursor: pointer; text-align: left; }
.ins-model:hover { background: var(--bg-2); }
.ins-model.is-active { background: var(--bg-2); border-color: var(--line); }
.ins-model-name { font-size: 13px; color: var(--fg-0); }
.ins-model-meta { display:flex; align-items:center; gap: 8px; }
.ins-model-cost { font-family: var(--font-mono); font-size: 11px; color: var(--fg-2); }

.ratio-grid { display:grid; grid-template-columns: repeat(6, 1fr); gap: 5px; }
.ratio { display:flex; flex-direction:column; align-items:center; justify-content: flex-end; gap: 5px; padding: 8px 4px 6px; border-radius: 6px; background: var(--bg-2); border: 1px solid var(--line-soft); cursor: pointer; height: 64px; }
.ratio:hover { border-color: var(--line); }
.ratio.is-active { border-color: oklch(0.78 0.13 var(--tint-h) / 0.5); background: var(--tint-soft); }
.ratio-shape { width: 60%; max-width: 28px; max-height: 28px; background: var(--fg-3); border-radius: 2px; }
.ratio.is-active .ratio-shape { background: oklch(0.78 0.13 var(--tint-h)); }
.ratio-label { font-family: var(--font-mono); font-size: 10px; color: var(--fg-2); }
.ratio.is-active .ratio-label { color: var(--fg-0); }

.ins-mode-hint { margin-top: 8px; font-size: 11.5px; color: var(--fg-3); line-height: 1.4; }

.seed-row { display:flex; gap: 6px; }
.seed-input { flex:1; padding: 6px 9px; background: var(--bg-2); border: 1px solid var(--line-soft); border-radius: 6px; color: var(--fg-0); font-family: var(--font-mono); font-size: 12px; outline: none; }
.seed-input:disabled { opacity: 0.5; }
.seed-input:focus { border-color: var(--line); }
.ins-section .micro-btn { background: var(--bg-2); border-color: var(--line-soft); color: var(--fg-1); width: 26px; height: 26px; }
.ins-section .micro-btn:hover { background: var(--bg-3); color: var(--fg-0); }

.ins-theme { display:flex; flex-direction: column; gap: 8px; font-size: 12px; }
.ins-theme-row { display:grid; grid-template-columns: 80px 1fr; gap: 10px; }
.ins-theme-key { color: var(--fg-3); text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em; padding-top: 1px; }
.ins-theme-val { color: var(--fg-1); line-height: 1.45; }
.ins-theme-val.mono { font-family: var(--font-mono); font-size: 11px; color: var(--fg-2); }
.ins-theme-val em { color: var(--fg-3); font-style: italic; }
.ins-theme-head { display:flex; justify-content:space-between; align-items: center; }
.ins-theme-name { display:flex; align-items:center; gap: 8px; padding: 6px 0 12px; font-family: var(--font-serif); font-size: 16px; color: var(--fg-0); }
.micro-btn-text { display:inline-flex; align-items:center; gap:4px; background: transparent; border: none; color: var(--fg-2); font-size: 11px; cursor: pointer; padding: 0 0 6px; }
.micro-btn-text:hover { color: var(--fg-0); }

/* ============ FULL SCREENS ============ */
.screen { flex: 1; min-width: 0; overflow-y: auto; padding: 32px 48px 60px; max-width: 1280px; margin: 0 auto; width: 100%; }
.screen-head { display:flex; justify-content:space-between; align-items: flex-end; gap: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--line-soft); margin-bottom: 24px; }
.screen-title { font-family: var(--font-serif); font-size: 34px; font-weight: 400; letter-spacing: -0.01em; margin: 0 0 6px; }
.screen-sub { font-size: 13.5px; color: var(--fg-2); max-width: 600px; line-height: 1.5; }

/* Projects screen grid */
.proj-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.proj-card { display:flex; flex-direction:column; background: var(--bg-1); border: 1px solid var(--line-soft); border-radius: 12px; overflow: hidden; cursor: pointer; text-align: left; padding: 0; transition: 120ms; }
.proj-card:hover { border-color: var(--line); transform: translateY(-1px); }
.proj-card-cover { position: relative; }
.proj-card-cover-fade { position:absolute; inset: 0; background: linear-gradient(180deg, transparent 50%, oklch(0.20 0.006 60) 100%); }
.proj-card-cover-marks { position:absolute; left:12px; bottom:12px; }
.proj-card-body { padding: 14px; display:flex; flex-direction:column; gap: 8px; }
.proj-card-row { display:flex; justify-content:space-between; align-items:center; gap: 8px; }
.proj-card-name { font-family: var(--font-serif); font-size: 18px; margin: 0; font-weight: 400; }
.proj-card-style { font-size: 12.5px; color: var(--fg-2); line-height: 1.45; min-height: 36px; }
.proj-card-meta { display:flex; align-items:center; gap: 6px; padding-top: 8px; border-top: 1px solid var(--line-soft); }
.proj-card-runs { margin-left: auto; font-family: var(--font-mono); font-size: 11px; color: var(--fg-3); }
.proj-card-new { display:flex; flex-direction:column; align-items:center; justify-content:center; gap: 8px; min-height: 280px; border-style: dashed; background: transparent; padding: 24px; }
.proj-card-new:hover { background: var(--bg-1); }
.proj-card-new-mark { width: 44px; height: 44px; border-radius: 12px; background: var(--tint-soft); display:flex; align-items:center; justify-content:center; color: oklch(0.86 0.10 var(--tint-h)); }
.proj-card-new-label { font-family: var(--font-serif); font-size: 18px; }
.proj-card-new-sub { font-size: 12px; color: var(--fg-3); text-align: center; max-width: 200px; }

/* History screen */
.hist-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.hist-cell { background: var(--bg-1); border: 1px solid var(--line-soft); border-radius: 10px; overflow: hidden; }
.hist-cell-meta { padding: 10px 12px; display:flex; flex-direction:column; gap: 5px; }
.hist-cell-prompt { font-size: 12.5px; color: var(--fg-1); display:-webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; min-height: 35px; }
.hist-cell-row { display:flex; justify-content:space-between; font-family: var(--font-mono); font-size: 11px; color: var(--fg-3); }

/* Usage screen */
.stats-row { display:grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
.stat-card { background: var(--bg-1); border: 1px solid var(--line-soft); border-radius: 10px; padding: 14px 16px; }
.stat-card-tint { background: linear-gradient(180deg, oklch(0.78 0.13 var(--tint-h) / 0.10), var(--bg-1)); border-color: oklch(0.78 0.13 var(--tint-h) / 0.30); }
.stat-card-good { background: linear-gradient(180deg, oklch(0.78 0.13 150 / 0.06), var(--bg-1)); }
.stat-card-label { font-size: 11px; color: var(--fg-3); text-transform: uppercase; letter-spacing: 0.06em; }
.stat-card-value { font-family: var(--font-serif); font-size: 32px; font-weight: 400; line-height: 1.1; margin: 6px 0 4px; }
.stat-card-sub { font-size: 11.5px; color: var(--fg-2); font-family: var(--font-mono); }

.usage-grid { display:grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 18px; }
.usage-card { background: var(--bg-1); border: 1px solid var(--line-soft); border-radius: 10px; padding: 16px 18px; }
.usage-card-full { padding: 0; overflow: hidden; }
.usage-card-full .usage-card-head { padding: 16px 18px; border-bottom: 1px solid var(--line-soft); }
.usage-card-head { display:flex; justify-content:space-between; align-items: baseline; margin-bottom: 14px; }
.usage-card-head h3 { margin: 0; font-family: var(--font-serif); font-size: 16px; font-weight: 400; }
.usage-card-sub { font-size: 11px; color: var(--fg-3); font-family: var(--font-mono); }

.bars { display:grid; grid-template-columns: repeat(14, 1fr); gap: 6px; align-items: end; height: 140px; }
.bars-col { display:flex; flex-direction:column; align-items: stretch; gap: 6px; height: 100%; }
.bars-bar { background: linear-gradient(180deg, oklch(0.78 0.13 var(--tint-h)), oklch(0.50 0.10 var(--tint-h))); border-radius: 3px; min-height: 2px; flex: 1; align-self: end; width: 100%; transition: 200ms; }
.bars-col:hover .bars-bar { filter: brightness(1.2); }
.bars-label { font-family: var(--font-mono); font-size: 10px; color: var(--fg-3); text-align: center; }

.prov-split { display:flex; flex-direction:column; gap: 14px; }
.prov-split-bar { display:flex; height: 8px; border-radius: 999px; overflow: hidden; gap: 2px; }
.prov-split-seg { height: 100%; border-radius: 4px; }
.prov-split-list { display:flex; flex-direction:column; gap: 8px; }
.prov-split-row { display:flex; justify-content:space-between; align-items:center; font-size: 12px; }
.prov-split-row-l { display:flex; align-items:center; gap: 8px; color: var(--fg-1); }
.prov-split-row-r { display:flex; gap: 12px; color: var(--fg-2); }

.usage-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.usage-table th { text-align: left; padding: 10px 14px; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--fg-3); border-bottom: 1px solid var(--line-soft); }
.usage-table td { padding: 10px 14px; border-bottom: 1px solid var(--line-soft); color: var(--fg-1); }
.usage-table tr:hover td { background: var(--bg-2); }
.usage-table .mono { font-family: var(--font-mono); }
.cell-proj { display:inline-flex; align-items:center; gap: 6px; }
.cell-prompt { color: var(--fg-2); max-width: 280px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
`;

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
