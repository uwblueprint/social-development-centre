/**
 * A white goose peeking into an empty mailbox (flag down), for the Outbox's empty state.
 * Flat colour on a soft SDC-green circle; every colour is a token so it follows dark mode.
 * The mailbox is in three-quarter view: an arched open face, the long side behind it, and the door
 * hinged at the bottom of the face.
 */
export function GooseIllustration({ width = 168 }: { width?: number }) {
  const height = Math.round((width * 140) / 200);
  const neck = "M56 96 C64 78 70 62 84 56";
  return (
    <svg width={width} height={height} viewBox="0 0 200 140" fill="none" aria-hidden="true">
      <circle cx="104" cy="76" r="62" fill="var(--sdc-50)" />
      <path d="M30 128 H174" stroke="var(--sdc-100)" strokeWidth="3" strokeLinecap="round" />

      {/* Mailbox: post, long side, flag (down), arched open face, door */}
      <rect x="128" y="72" width="10" height="56" rx="2" fill="var(--taupe-500)" />
      <path d="M104 74 V52 Q104 38 118 38 H146 Q162 38 162 52 V74 Z" fill="var(--sdc-700)" />
      <rect x="148" y="48" width="3.5" height="20" rx="1" fill="var(--taupe-500)" />
      <rect x="148" y="61" width="16" height="7" rx="1.5" fill="var(--intake-doodle-red)" />
      <path d="M92 74 V53 Q92 38 104 38 Q116 38 116 53 V74 Z" fill="var(--sdc-800)" />
      <path d="M96 74 V54 Q96 42 104 42 Q112 42 112 54 V74 Z" fill="var(--sdc-950)" />
      <path d="M92 74 H116 V88 Q116 92 112 92 H96 Q92 92 92 88 Z" fill="var(--sdc-900)" />
      <rect x="101" y="83" width="6" height="2.5" rx="1.2" fill="var(--sdc-950)" opacity=".6" />

      {/* Goose: tail, neck under the body and head, body, seam cover, wing, head, beak, eye, legs */}
      <path d="M20 92 L10 84 L18 98 Z" fill="var(--color-bg)" />
      <path d={neck} stroke="var(--color-bg)" strokeWidth="10" strokeLinecap="round" />
      <ellipse cx="44" cy="100" rx="28" ry="17" fill="var(--color-bg)" />
      <path d="M56 96 C59 90 61 86 63 83" stroke="var(--color-bg)" strokeWidth="10" strokeLinecap="round" />
      <path d="M32 96 Q46 86 58 98 Q46 106 32 96 Z" fill="var(--taupe-200)" />
      <circle cx="86" cy="55" r="8.5" fill="var(--color-bg)" />
      <path d="M93 52 L102 55.5 L93 59 Z" fill="var(--intake-doodle-orange)" />
      <circle cx="87.5" cy="52.5" r="1.6" fill="var(--taupe-900)" />
      {[38, 50].map((x) => (
        <g key={x}>
          <path d={`M${x} 115 V125`} stroke="var(--intake-doodle-orange)" strokeWidth="2.5" strokeLinecap="round" />
          <path d={`M${x - 2} 125 l6 2 l-6 1 Z`} fill="var(--intake-doodle-orange)" />
        </g>
      ))}

      {/* A little "?" and an echo rising out of the empty box */}
      <text x="64" y="40" fontSize="16" fontWeight="600" fill="var(--sdc-800)">
        ?
      </text>
      <path d="M120 28 q4 -4 8 0" stroke="var(--sdc-800)" strokeWidth="1.6" strokeLinecap="round" opacity=".6" />
      <path d="M130 22 q4 -4 8 0" stroke="var(--sdc-800)" strokeWidth="1.6" strokeLinecap="round" opacity=".4" />
    </svg>
  );
}
