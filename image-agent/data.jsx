// Mock data. All copy realistic for a private single-user studio.

const PROVIDERS = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'OR',
    status: 'connected',
    models: [
      { id: 'or/flux-1.1-pro',    name: 'FLUX 1.1 Pro',     family: 'Black Forest Labs', tag: 'Quality',  cost: 0.040 },
      { id: 'or/flux-schnell',    name: 'FLUX schnell',     family: 'Black Forest Labs', tag: 'Fast',     cost: 0.003 },
      { id: 'or/sdxl-lightning',  name: 'SDXL Lightning',   family: 'Stability',          tag: 'Fast',     cost: 0.004 },
      { id: 'or/playground-v3',   name: 'Playground v3',    family: 'Playground',         tag: 'Stylised', cost: 0.012 },
      { id: 'or/recraft-v3',      name: 'Recraft v3',       family: 'Recraft',            tag: 'Vector',   cost: 0.020 },
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    badge: 'GM',
    status: 'connected',
    models: [
      { id: 'gem/imagen-4',         name: 'Imagen 4',          family: 'Google',  tag: 'Quality', cost: 0.040 },
      { id: 'gem/imagen-4-fast',    name: 'Imagen 4 Fast',     family: 'Google',  tag: 'Fast',    cost: 0.020 },
      { id: 'gem/nano-banana',      name: 'Nano Banana',       family: 'Google',  tag: 'Edit',    cost: 0.030 },
    ],
  },
];

const PROJECTS = [
  {
    id: 'p_brand',
    name: 'Halo / brand visuals',
    sub: 'Hero illustrations · 16:9',
    accent: 70,   // hue
    runs: 184,
    pinned: true,
    style: 'Editorial illustration, soft gradients, rim light',
    template: 'A {subject}, photographed in low key studio light, 35mm, depth of field, monochrome with single warm accent.',
    refImage: true,
    model: 'or/flux-1.1-pro',
    ratio: '16:9',
    seed: 'locked',
  },
  {
    id: 'p_blog',
    name: 'Blog / weekly notes',
    sub: 'Square covers · loose',
    accent: 200,
    runs: 412,
    pinned: true,
    style: 'Risograph print, 2 spot colors, grain, generous negative space',
    template: 'Riso print of {subject}. Two-color, halftone, off-white paper, scanned imperfections.',
    refImage: false,
    model: 'gem/imagen-4-fast',
    ratio: '1:1',
    seed: 'random',
  },
  {
    id: 'p_avatar',
    name: 'D&D / portraits',
    sub: 'Character sheets · 3:4',
    accent: 320,
    runs: 56,
    pinned: false,
    style: 'Oil portrait, dramatic chiaroscuro, painterly brushwork',
    template: 'A {subject}, oil painting in the style of a 17th century court portrait. Dark earthy palette.',
    refImage: true,
    model: 'or/flux-1.1-pro',
    ratio: '3:4',
    seed: 'random',
  },
  {
    id: 'p_product',
    name: 'Product / mock shoots',
    sub: 'Catalogue · 4:5',
    accent: 140,
    runs: 28,
    pinned: false,
    style: 'Studio still life, marble surface, soft daylight',
    template: '{subject} on a polished travertine pedestal, soft window light from the left, shadow cast right.',
    refImage: true,
    model: 'gem/imagen-4',
    ratio: '4:5',
    seed: 'random',
  },
  {
    id: 'p_loose',
    name: 'Scratch / experiments',
    sub: 'No theme · anything',
    accent: 50,
    runs: 1207,
    pinned: false,
    style: '—',
    template: '',
    refImage: false,
    model: 'or/flux-schnell',
    ratio: '1:1',
    seed: 'random',
  },
];

// 21 mock generations for the gallery; each has prompt, model, ratio, status, color seed
const HIST = [
  // current session (project p_brand)
  { id:'g_001', project:'p_brand', prompt:'a quiet figure walking through a corridor of pale arches, dawn light', model:'or/flux-1.1-pro',     ratio:'16:9', seed:'4429183', cost:0.040, time:'just now',   pinned:true, hue:70, lum:0.62 },
  { id:'g_002', project:'p_brand', prompt:'a quiet figure walking through a corridor of pale arches, dawn light', model:'or/flux-1.1-pro',     ratio:'16:9', seed:'9921004', cost:0.040, time:'just now',   pinned:false, hue:35, lum:0.55 },
  { id:'g_003', project:'p_brand', prompt:'a quiet figure walking through a corridor of pale arches, dawn light', model:'or/flux-1.1-pro',     ratio:'16:9', seed:'1102992', cost:0.040, time:'just now',   pinned:false, hue:50, lum:0.48 },
  { id:'g_004', project:'p_brand', prompt:'a quiet figure walking through a corridor of pale arches, dawn light', model:'or/flux-1.1-pro',     ratio:'16:9', seed:'7732120', cost:0.040, time:'just now',   pinned:false, hue:80, lum:0.66 },
  // earlier today
  { id:'g_010', project:'p_brand', prompt:'an empty stage lit by a single key light, deep shadow',                model:'or/flux-1.1-pro',     ratio:'16:9', seed:'9012740', cost:0.040, time:'14:22',     pinned:true, hue:25, lum:0.32 },
  { id:'g_011', project:'p_brand', prompt:'an empty stage lit by a single key light, deep shadow',                model:'or/flux-1.1-pro',     ratio:'16:9', seed:'9012741', cost:0.040, time:'14:22',     pinned:false, hue:30, lum:0.28 },
  { id:'g_012', project:'p_brand', prompt:'a folded sheet draped over a chair, golden hour',                      model:'or/flux-schnell',     ratio:'16:9', seed:'5520129', cost:0.003, time:'13:48',     pinned:false, hue:60, lum:0.72 },
  { id:'g_013', project:'p_brand', prompt:'a folded sheet draped over a chair, golden hour',                      model:'or/flux-schnell',     ratio:'16:9', seed:'5520130', cost:0.003, time:'13:48',     pinned:false, hue:55, lum:0.78 },
  // yesterday — blog
  { id:'g_020', project:'p_blog',  prompt:'two friends arguing on a hilltop, riso',                               model:'gem/imagen-4-fast',   ratio:'1:1',  seed:'r-21',    cost:0.020, time:'yesterday', pinned:false, hue:200, lum:0.70 },
  { id:'g_021', project:'p_blog',  prompt:'a desk overflowing with paper, riso, two color',                       model:'gem/imagen-4-fast',   ratio:'1:1',  seed:'r-22',    cost:0.020, time:'yesterday', pinned:true,  hue:220, lum:0.65 },
  { id:'g_022', project:'p_blog',  prompt:'a slow walk past closed shop fronts at night',                         model:'gem/imagen-4-fast',   ratio:'1:1',  seed:'r-23',    cost:0.020, time:'yesterday', pinned:false, hue:240, lum:0.42 },
  { id:'g_023', project:'p_blog',  prompt:'a stack of books toppling off a shelf',                                model:'gem/imagen-4-fast',   ratio:'1:1',  seed:'r-24',    cost:0.020, time:'yesterday', pinned:false, hue:180, lum:0.55 },
  // older
  { id:'g_030', project:'p_avatar',prompt:'court portrait, pale ranger with white hair, scarred jaw',             model:'or/flux-1.1-pro',     ratio:'3:4',  seed:'8810022', cost:0.040, time:'Mon',       pinned:true,  hue:320, lum:0.40 },
  { id:'g_031', project:'p_avatar',prompt:'court portrait, sea-witch with kelp crown',                            model:'or/flux-1.1-pro',     ratio:'3:4',  seed:'8810099', cost:0.040, time:'Mon',       pinned:false, hue:300, lum:0.35 },
  { id:'g_040', project:'p_product',prompt:'small ceramic vase, terracotta, soft window light',                   model:'gem/imagen-4',        ratio:'4:5',  seed:'2210045', cost:0.040, time:'Sun',       pinned:false, hue:140, lum:0.78 },
  { id:'g_041', project:'p_product',prompt:'pair of leather gloves on a marble shelf',                            model:'gem/imagen-4',        ratio:'4:5',  seed:'2210046', cost:0.040, time:'Sun',       pinned:false, hue:120, lum:0.62 },
];

// usage entries — last 14 days
const USAGE_DAYS = (() => {
  const out = [];
  const baseLabels = ['28','29','30','01','02','03','04','05','06','07','08','09','10','11'];
  const counts = [3, 11, 8, 22, 5, 14, 19, 26, 12, 4, 17, 31, 28, 14];
  const cost   = [0.10, 0.42, 0.31, 0.88, 0.18, 0.61, 0.74, 1.04, 0.42, 0.14, 0.66, 1.18, 1.08, 0.56];
  baseLabels.forEach((l,i)=> out.push({ d:l, runs: counts[i], cost: cost[i] }));
  return out;
})();

const USAGE_RECENT = [
  { id: 'r_991', t:'14:22:08', project:'p_brand', model:'or/flux-1.1-pro',     prompt:'an empty stage lit by a single key light, deep shadow', tokens:412,  cost:0.040, ms:7820, ok:true },
  { id: 'r_990', t:'14:18:44', project:'p_brand', model:'or/flux-1.1-pro',     prompt:'an empty stage lit by a single key light, deep shadow', tokens:401,  cost:0.040, ms:7440, ok:true },
  { id: 'r_989', t:'13:48:21', project:'p_brand', model:'or/flux-schnell',     prompt:'a folded sheet draped over a chair, golden hour',       tokens:298,  cost:0.003, ms:1820, ok:true },
  { id: 'r_988', t:'12:11:10', project:'p_loose', model:'or/flux-schnell',     prompt:'tests, ignore — color study (cyan / coral)',            tokens:122,  cost:0.003, ms:1340, ok:true },
  { id: 'r_987', t:'11:42:55', project:'p_blog',  model:'gem/imagen-4-fast',   prompt:'two friends arguing on a hilltop, riso',                tokens:380,  cost:0.020, ms:3940, ok:true },
  { id: 'r_986', t:'10:08:31', project:'p_blog',  model:'gem/imagen-4-fast',   prompt:'a desk overflowing with paper, riso, two color',        tokens:402,  cost:0.020, ms:4280, ok:true },
  { id: 'r_985', t:'09:14:02', project:'p_avatar',model:'or/flux-1.1-pro',     prompt:'character sheet — sea witch, kelp crown',               tokens:512,  cost:0.040, ms:8210, ok:false, err:'safety filter' },
];

const RATIOS = [
  { id:'1:1',   w:1, h:1,  label:'Square' },
  { id:'4:5',   w:4, h:5,  label:'Portrait' },
  { id:'3:4',   w:3, h:4,  label:'Classic' },
  { id:'16:9',  w:16,h:9,  label:'Landscape' },
  { id:'9:16',  w:9, h:16, label:'Mobile' },
  { id:'21:9',  w:21,h:9,  label:'Ultra' },
];

window.PROVIDERS = PROVIDERS;
window.PROJECTS = PROJECTS;
window.HIST = HIST;
window.USAGE_DAYS = USAGE_DAYS;
window.USAGE_RECENT = USAGE_RECENT;
window.RATIOS = RATIOS;
