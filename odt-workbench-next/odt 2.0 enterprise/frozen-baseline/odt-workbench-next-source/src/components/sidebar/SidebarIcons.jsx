export function OdtLogo() {
  return (
    <div className="odt-logo" aria-label="ODT Workbench">
      <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#c74634" />
        <text
          x="32"
          y="30"
          textAnchor="middle"
          fontSize="18"
          fontWeight="900"
          fill="white"
          fontFamily="Arial, sans-serif"
          letterSpacing="-0.5"
        >
          ODT
        </text>
        <path d="M20 43h24" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
        <circle cx="20" cy="43" r="3.5" fill="white" />
        <circle cx="32" cy="43" r="3.5" fill="white" />
        <circle cx="44" cy="43" r="3.5" fill="white" />
      </svg>
    </div>
  );
}

export function HumanGateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 19 6v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3Z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path d="M8.5 16c.8-2 2-3 3.5-3s2.7 1 3.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.35-5.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const SidebarIcons = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  intake: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2" />
      <path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  planner: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="m8 15 2 2 4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  standards: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 19 6v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3Z" stroke="currentColor" strokeWidth="2" />
      <path d="m8.5 12 2.2 2.2L15.8 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  team: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="17" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M10.2 9.4 7.6 14.4M13.8 9.4l2.6 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  review: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="m7.8 10.7 1.8 1.8 3.8-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  pr: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2" />
      <path d="m8 15 2 2 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  artifacts: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M7 13h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  guide: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-4l-4 4v-4H7a3 3 0 0 1-3-3V6Z" stroke="currentColor" strokeWidth="2" />
      <path d="M15.5 6.5 16 8l1.5.5L16 9l-.5 1.5L15 9l-1.5-.5L15 8l.5-1.5Z" fill="currentColor" />
      <path d="M9 10h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  runs: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 6h4a4 4 0 0 1 4 4M8 18h4a4 4 0 0 0 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  monitoring: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 13h4l2-6 4 12 2-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a8 8 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 5H9l-.4 3a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 .1 2l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.4 3h6l.4-3a8 8 0 0 0 1.7-1l2.4 1 2-3.5-2.2-1.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
};
