// Brand illustrations: soft "clay" shapes lit from the top left, in the Receipts palette
// (paper white, ink, honey; green and red only where a run passed or failed).

const INK = "#2A2926";
const MUTED = "#D8D2C8";
const OK = "#2F8A55";
const BAD = "#C7443A";
const HONEY_DARK = "#C57A0E";
const MONO = "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace";

function HoneyGradient({ id }: { id: string }) {
  return (
    <radialGradient id={id} cx="32%" cy="28%" r="80%">
      <stop offset="0" stopColor="#FFD98A" />
      <stop offset="0.55" stopColor="#F2A32B" />
      <stop offset="1" stopColor="#C57A0E" />
    </radialGradient>
  );
}

function SoftShadow({ id, y = 12, blur = 12, opacity = 0.16 }: { id: string; y?: number; blur?: number; opacity?: number }) {
  return (
    <filter id={id} x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy={y} stdDeviation={blur} floodColor="#6B4208" floodOpacity={opacity} />
    </filter>
  );
}

/** A run result tile: green check (passed) or red cross (failed). */
function Tile({ x, y, ok, size = 18 }: { x: number; y: number; ok: boolean; size?: number }) {
  const s = size / 18;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect width="18" height="18" rx="5" fill={ok ? OK : BAD} />
      {ok ? (
        <polyline points="4.5,9.5 7.8,12.6 13.6,6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M5.5 5.5 L12.5 12.5 M12.5 5.5 L5.5 12.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      )}
    </g>
  );
}

/** Torn top edge for a receipt `width` wide: teeth 10 px high, 20 px apart, drawn left to right. */
function tornTop(width: number): string {
  return " l10 -10 l10 10".repeat(width / 20);
}

/** Hero: a receipt printing out of a pull request, stamped Proven, under a magnifier. */
export function HeroPrinter() {
  return (
    <svg viewBox="0 0 560 500" className="illustration" role="img" aria-label="A receipt printing out of a pull request, stamped Proven">
      <defs>
        <radialGradient id="hp-bg" cx="55%" cy="35%" r="75%">
          <stop offset="0" stopColor="#FFF8EC" />
          <stop offset="1" stopColor="#FBE7C4" />
        </radialGradient>
        <linearGradient id="hp-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F3EFE8" />
        </linearGradient>
        <linearGradient id="hp-ink" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A3834" />
          <stop offset="1" stopColor="#161513" />
        </linearGradient>
        <radialGradient id="hp-lens" cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.12" />
        </radialGradient>
        <HoneyGradient id="hp-honey" />
        <SoftShadow id="hp-shadow" />
      </defs>

      <rect x="16" y="24" width="528" height="452" rx="48" fill="url(#hp-bg)" />
      <ellipse cx="330" cy="440" rx="160" ry="12" fill="#6B4208" opacity="0.1" />

      {/* the pull request */}
      <g transform="rotate(-8 155 150)" filter="url(#hp-shadow)">
        <rect x="60" y="84" width="190" height="130" rx="20" fill="#fff" />
        <path d="M94 124 V170" stroke={MUTED} strokeWidth="6" strokeLinecap="round" />
        <path d="M94 132 C94 152 132 142 134 158" fill="none" stroke="url(#hp-honey)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="94" cy="118" r="10" fill={INK} />
        <circle cx="94" cy="178" r="10" fill={INK} />
        <circle cx="136" cy="162" r="10" fill="url(#hp-honey)" />
        <rect x="160" y="110" width="66" height="10" rx="5" fill={MUTED} />
        <rect x="160" y="132" width="46" height="10" rx="5" fill="#EAE5DC" />
        <rect x="160" y="166" width="58" height="10" rx="5" fill="#EAE5DC" />
      </g>

      {/* the receipt */}
      <path d={`M230 318 V84${tornTop(200)} V318 Z`} fill="url(#hp-paper)" filter="url(#hp-shadow)" />
      <text x="330" y="114" textAnchor="middle" fontFamily={MONO} fontSize="13" fontWeight="600" letterSpacing="3" fill={INK}>
        RECEIPT
      </text>
      <line x1="250" y1="128" x2="410" y2="128" stroke={MUTED} strokeWidth="2" strokeDasharray="4 5" />
      <rect x="250" y="146" width="54" height="9" rx="4.5" fill={MUTED} />
      <Tile x={344} y={141} ok={false} />
      <Tile x={366} y={141} ok={false} />
      <Tile x={388} y={141} ok={false} />
      <rect x="250" y="178" width="40" height="9" rx="4.5" fill={MUTED} />
      <Tile x={344} y={173} ok />
      <Tile x={366} y={173} ok />
      <Tile x={388} y={173} ok />
      <rect x="250" y="210" width="62" height="9" rx="4.5" fill={MUTED} />
      <rect x="344" y="210" width="62" height="9" rx="4.5" fill="#EAE5DC" />
      <line x1="250" y1="234" x2="410" y2="234" stroke={MUTED} strokeWidth="2" strokeDasharray="4 5" />
      <g transform="rotate(-9 330 266)">
        <rect x="272" y="246" width="116" height="40" rx="10" fill="none" stroke={HONEY_DARK} strokeWidth="3" />
        <text x="330" y="273" textAnchor="middle" fontFamily={MONO} fontSize="18" fontWeight="700" letterSpacing="2" fill={HONEY_DARK}>
          PROVEN
        </text>
      </g>

      {/* the printer */}
      <g filter="url(#hp-shadow)">
        <rect x="190" y="298" width="280" height="122" rx="30" fill="url(#hp-ink)" />
      </g>
      <rect x="202" y="304" width="256" height="26" rx="16" fill="#fff" opacity="0.06" />
      <rect x="220" y="290" width="220" height="14" rx="7" fill="#0C0B0A" />
      <rect x="214" y="382" width="74" height="9" rx="4.5" fill="#46433E" />
      <rect x="214" y="398" width="46" height="9" rx="4.5" fill="#46433E" />
      <circle cx="438" cy="340" r="8" fill="url(#hp-honey)" />

      {/* the magnifier, over one passing run */}
      <line x1="172" y1="374" x2="218" y2="420" stroke="url(#hp-honey)" strokeWidth="22" strokeLinecap="round" filter="url(#hp-shadow)" />
      <Tile x={104} y={306} ok size={48} />
      <circle cx="128" cy="330" r="58" fill="url(#hp-lens)" stroke="url(#hp-honey)" strokeWidth="16" />
      <path d="M92 314 a42 42 0 0 1 30 -28" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity="0.85" />

      {/* clay bits */}
      <circle cx="478" cy="118" r="17" fill="url(#hp-honey)" />
      <rect x="470" y="182" width="44" height="16" rx="8" fill={INK} />
      <circle cx="84" cy="258" r="9" fill="url(#hp-honey)" />
    </svg>
  );
}

/** How it works: the test is written from the issue alone. */
export function StepIssue() {
  return (
    <svg viewBox="0 0 280 200" className="illustration" role="img" aria-label="An issue and the test written from it">
      <defs>
        <HoneyGradient id="si-honey" />
        <SoftShadow id="si-shadow" y={8} blur={9} opacity={0.14} />
      </defs>
      <g filter="url(#si-shadow)">
        <rect x="20" y="26" width="176" height="124" rx="18" fill="#fff" />
      </g>
      <circle cx="44" cy="52" r="8" fill={OK} />
      <rect x="60" y="47" width="96" height="10" rx="5" fill={INK} />
      <rect x="38" y="78" width="136" height="8" rx="4" fill="#E6E1D8" />
      <rect x="38" y="96" width="112" height="8" rx="4" fill="#E6E1D8" />
      <rect x="38" y="114" width="124" height="8" rx="4" fill="#E6E1D8" />
      <g filter="url(#si-shadow)">
        <rect x="120" y="86" width="142" height="98" rx="16" fill={INK} />
      </g>
      <text x="138" y="112" fontFamily={MONO} fontSize="12" fill="#F2A32B">
        def test_
      </text>
      <rect x="138" y="124" width="98" height="8" rx="4" fill="#57534D" />
      <rect x="152" y="142" width="80" height="8" rx="4" fill="#57534D" />
      <rect x="152" y="160" width="58" height="8" rx="4" fill="#57534D" />
      <g transform="translate(206 66) rotate(-38)">
        <rect x="-12" y="-8" width="14" height="16" rx="3" fill="#E9A7A0" />
        <rect x="0" y="-8" width="66" height="16" rx="3" fill="url(#si-honey)" />
        <path d="M66 -8 L84 0 L66 8 Z" fill="#EBDDC2" />
        <path d="M78 -2.7 L84 0 L78 2.7 Z" fill={INK} />
      </g>
    </svg>
  );
}

/** How it works: three runs before, three with the pull request, each in its own sandbox. */
export function StepSandbox() {
  return (
    <svg viewBox="0 0 280 200" className="illustration" role="img" aria-label="Three failing runs before the change and three passing runs after it">
      <defs>
        <HoneyGradient id="ss-honey" />
        <SoftShadow id="ss-shadow" y={6} blur={8} opacity={0.12} />
      </defs>
      {[40, 112].map((y, row) => (
        <g key={y}>
          <g filter="url(#ss-shadow)">
            <rect x="22" y={y} width="236" height="56" rx="18" fill="#fff" />
          </g>
          <rect x="42" y={y + 23} width={row ? 30 : 48} height="10" rx="5" fill={MUTED} />
          {[150, 180, 210].map((x) => (
            <Tile key={x} x={x} y={y + 16} ok={row === 1} size={24} />
          ))}
        </g>
      ))}
      <circle cx="246" cy="36" r="17" fill={INK} />
      <rect x="238" y="35" width="16" height="12" rx="3" fill="url(#ss-honey)" />
      <path d="M241 35 v-4 a5 5 0 0 1 10 0 v4" fill="none" stroke="url(#ss-honey)" strokeWidth="2.6" />
    </svg>
  );
}

/** How it works: the receipt, and the check it leaves on the pull request. */
export function StepReceipt() {
  return (
    <svg viewBox="0 0 280 200" className="illustration" role="img" aria-label="A receipt stamped Proven and a passing check">
      <defs>
        <SoftShadow id="sr-shadow" y={8} blur={9} opacity={0.14} />
      </defs>
      <g filter="url(#sr-shadow)">
        <path d={`M70 20 H190 V176${" l-10 10 l-10 -10".repeat(6)} Z`} fill="#fff" />
      </g>
      <rect x="90" y="40" width="80" height="10" rx="5" fill={INK} />
      <rect x="90" y="66" width="52" height="8" rx="4" fill={MUTED} />
      <rect x="90" y="84" width="70" height="8" rx="4" fill={MUTED} />
      <rect x="90" y="102" width="44" height="8" rx="4" fill={MUTED} />
      <g transform="rotate(-9 130 142)">
        <rect x="92" y="126" width="76" height="30" rx="8" fill="none" stroke={HONEY_DARK} strokeWidth="2.6" />
        <text x="130" y="146" textAnchor="middle" fontFamily={MONO} fontSize="13" fontWeight="700" letterSpacing="1.5" fill={HONEY_DARK}>
          PROVEN
        </text>
      </g>
      <g filter="url(#sr-shadow)">
        <circle cx="222" cy="72" r="24" fill={OK} />
      </g>
      <polyline points="211,72 219,80 234,63" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Trust: a shield with a lock. */
export function ShieldLock() {
  return (
    <svg viewBox="0 0 280 260" className="illustration" role="img" aria-label="A shield with a lock">
      <defs>
        <HoneyGradient id="sl-honey" />
        <SoftShadow id="sl-shadow" y={14} blur={14} opacity={0.18} />
        <radialGradient id="sl-bg" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#FFF8EC" />
          <stop offset="1" stopColor="#FBE7C4" />
        </radialGradient>
      </defs>
      <circle cx="140" cy="130" r="118" fill="url(#sl-bg)" />
      <g filter="url(#sl-shadow)">
        <path d="M140 30 L218 60 V124 C218 176 186 210 140 230 C94 210 62 176 62 124 V60 Z" fill="url(#sl-honey)" />
      </g>
      <path d="M140 44 L204 69 V124 C204 150 194 172 176 188" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.45" />
      <path d="M122 120 V104 a18 18 0 0 1 36 0 V120" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
      <rect x="108" y="116" width="64" height="52" rx="12" fill="#fff" />
      <circle cx="140" cy="137" r="7" fill={HONEY_DARK} />
      <rect x="137" y="139" width="6" height="15" rx="3" fill={HONEY_DARK} />
      <circle cx="232" cy="60" r="12" fill={INK} />
      <circle cx="46" cy="190" r="9" fill="url(#sl-honey)" />
    </svg>
  );
}
