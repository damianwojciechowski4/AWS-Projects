// Lightweight stroke icons. All 1.6 stroke, currentColor.
const Icon = ({ d, size = 16, fill = 'none', sw = 1.6, style, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} {...rest}>
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const I = {
  plus:    (p)=> <Icon {...p} d="M12 5v14M5 12h14" />,
  search:  (p)=> <Icon {...p} d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM21 21l-4.35-4.35" />,
  sparkle: (p)=> <Icon {...p} d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3zM18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" />,
  image:   (p)=> <Icon {...p} d={<g><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="1.6" /><path d="M21 16l-5-5-9 9" /></g>} />,
  folder:  (p)=> <Icon {...p} d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />,
  history: (p)=> <Icon {...p} d={<g><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></g>} />,
  settings:(p)=> <Icon {...p} d={<g><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></g>} />,
  chart:   (p)=> <Icon {...p} d={<g><path d="M3 3v18h18"/><path d="M7 14l3-3 4 4 5-7"/></g>} />,
  user:    (p)=> <Icon {...p} d={<g><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></g>} />,
  chev:    (p)=> <Icon {...p} d="M6 9l6 6 6-6" />,
  chevR:   (p)=> <Icon {...p} d="M9 6l6 6-6 6" />,
  chevL:   (p)=> <Icon {...p} d="M15 6l-9 6 9 6" />,
  arrUp:   (p)=> <Icon {...p} d="M12 19V5M5 12l7-7 7 7" />,
  close:   (p)=> <Icon {...p} d="M6 6l12 12M18 6L6 18" />,
  check:   (p)=> <Icon {...p} d="M5 12l5 5 9-11" />,
  copy:    (p)=> <Icon {...p} d={<g><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></g>} />,
  download:(p)=> <Icon {...p} d="M12 4v12m-5-5l5 5 5-5M4 20h16" />,
  trash:   (p)=> <Icon {...p} d={<g><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13"/><path d="M9 7V4h6v3"/></g>} />,
  pin:     (p)=> <Icon {...p} d="M12 2l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 9l6-1 3-6z" fill="currentColor" />,
  pinO:    (p)=> <Icon {...p} d="M12 2l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 9l6-1 3-6z" />,
  upload:  (p)=> <Icon {...p} d={<g><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 20h16"/></g>} />,
  dice:    (p)=> <Icon {...p} d={<g><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/></g>} />,
  wand:    (p)=> <Icon {...p} d={<g><path d="M15 4l1 1.5L17.5 7 16 8.5 15 10l-1-1.5L12.5 7 14 5.5z"/><path d="M3 21l11-11"/></g>} />,
  layers:  (p)=> <Icon {...p} d={<g><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 18l9 5 9-5"/></g>} />,
  bolt:    (p)=> <Icon {...p} d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  brain:   (p)=> <Icon {...p} d={<g><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3V4z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3V4z"/></g>} />,
  ratio:   (p)=> <Icon {...p} d={<g><rect x="3" y="6" width="18" height="12" rx="1.5"/></g>} />,
  refresh: (p)=> <Icon {...p} d={<g><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></g>} />,
  expand:  (p)=> <Icon {...p} d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  diamond: (p)=> <Icon {...p} d="M12 2l10 10-10 10L2 12 12 2z" />,
  send:    (p)=> <Icon {...p} d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  dot:     (p)=> <Icon {...p} d={<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />} />,
  link:    (p)=> <Icon {...p} d={<g><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></g>} />,
};

window.I = I;
