import { FlaskConical, GitPullRequest, ReceiptText, ShieldCheck } from "lucide-react";
import type { Verdict } from "../api";
import { VerdictChip } from "../components/VerdictChip";

// Real checks this project ran, shown as the product at work beside the sign-in form.
const CHECKS: { name: string; claim: string; verdict: Verdict }[] = [
  { name: "receipts-demo-sympy #30", claim: "airyaiprime rewrite is numerically wrong", verdict: "PROVEN" },
  { name: "receipts-demo-sympy #29", claim: "refine misses even powers of Abs", verdict: "UNPROVEN" },
  { name: "pydata/xarray 4629", claim: "merge override shares attrs", verdict: "PROVEN" },
  { name: "psf/requests 1142", claim: "GET always sends Content-Length", verdict: "REFUTED" },
  { name: "receipts-demo-sympy #31", claim: "Docs: Linux mpmath install", verdict: "NO_CHECKABLE_CLAIM" },
];

/** A lobed "clay" blob: radius swings with sin(lobes * angle), drawn as a fine polygon. */
function blobPath(cx: number, cy: number, r: number, lobes: number, depth: number, turn = 0): string {
  const steps = 120;
  const points = Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    const rr = r * (1 + depth * Math.sin(lobes * a + turn));
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  });
  return `M${points.join("L")}Z`;
}

const SPECKS = [
  [118, 92], [164, 150], [92, 188], [210, 110], [150, 232], [236, 196], [70, 128], [190, 262],
];

function Blob({ className, id, light, dark, lobes, depth, turn }: {
  className: string; id: string; light: string; dark: string; lobes: number; depth: number; turn: number;
}) {
  return (
    <svg className={className} viewBox="0 0 320 320">
      <defs>
        <radialGradient id={id} cx="34%" cy="30%" r="78%">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </radialGradient>
      </defs>
      <path d={blobPath(160, 160, 118, lobes, depth, turn)} fill={`url(#${id})`} stroke={`url(#${id})`}
            strokeWidth="18" strokeLinejoin="round" />
      <ellipse cx="118" cy="104" rx="46" ry="26" fill="#fff" opacity="0.22" transform="rotate(-28 118 104)" />
      {SPECKS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill="#fff" opacity="0.75" />
      ))}
    </svg>
  );
}

/** The right half of the sign-in page: decoration only, so screen readers skip it. */
export function AuthShowcase() {
  return (
    <div className="showcase" aria-hidden="true">
      <Blob className="showcase__blob showcase__blob--a" id="blob-a" light="#FFD98A" dark="#D9860F" lobes={6} depth={0.16} turn={0.4} />
      <Blob className="showcase__blob showcase__blob--b" id="blob-b" light="#FFF1D2" dark="#F0B54A" lobes={5} depth={0.12} turn={1.2} />

      <div className="showcase__card showcase__card--1">
        <span className="showcase__icon showcase__icon--ok">
          <ShieldCheck size={18} />
        </span>
        <span>
          <strong>PR #30 is Proven</strong>
          <small>Fails before, passes after, 3 of 3</small>
        </span>
      </div>
      <div className="showcase__card showcase__card--2">
        <span className="showcase__icon">
          <FlaskConical size={18} />
        </span>
        <span>
          <strong>Blind test accepted</strong>
          <small>Written from issue #12 alone</small>
        </span>
      </div>
      <div className="showcase__card showcase__card--3">
        <span className="showcase__icon">
          <GitPullRequest size={18} />
        </span>
        <span>
          <strong>PR #29 fixed part of it</strong>
          <small>Abs(z)**4 still comes out wrong</small>
        </span>
      </div>

      <div className="showcase__table">
        <div className="showcase__table-head">
          <ReceiptText size={18} />
          <strong>Recent checks</strong>
          <small>Latest first</small>
        </div>
        <table>
          <thead>
            <tr>
              <th>Check</th>
              <th>Claim</th>
              <th>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {CHECKS.map((c) => (
              <tr key={c.name}>
                <td className="showcase__mono">{c.name}</td>
                <td>{c.claim}</td>
                <td>
                  <VerdictChip verdict={c.verdict} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
