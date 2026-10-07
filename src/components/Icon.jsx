const paths = {
  arrow: <><path d="M4 12h16M14 6l6 6-6 6" /></>,
  down: <><path d="M12 4v16M6 14l6 6 6-6" /></>,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  play: <path d="m9 5 11 7-11 7Z" />,
  pause: <><path d="M8 5v14M16 5v14" /></>,
  next: <><path d="m5 5 10 7L5 19Z" /><path d="M19 5v14" /></>,
  previous: <><path d="m19 5-10 7 10 7Z" /><path d="M5 5v14" /></>,
  volume: <><path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" /></>,
  music: <><path d="M9 18V5l11-2v13M9 8l11-2" /><ellipse cx="6" cy="18" rx="3" ry="3" /><ellipse cx="17" cy="16" rx="3" ry="3" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>,
  photo: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m3 17 5-5 4 4 4-6 5 7" /></>,
  expand: <><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5" /></>,
  spotify: <><circle cx="12" cy="12" r="9" /><path d="M6.5 9c4-1.5 8-1 11 1M7 12c3-1 6.5-.7 9.5 1M8 15c2.5-.7 5-.4 7.5.8" /></>,
  back: <path d="m15 5-7 7 7 7" />,
  forward: <path d="m9 5 7 7-7 7" />,
  external: <><path d="M14 3h7v7M21 3l-9 9M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" /></>,
};
export default function Icon({ name, size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.clock}</svg>;
}
