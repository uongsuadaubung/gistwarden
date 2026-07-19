import { type Component } from "solid-js";

export const TotpIllustration: Component = () => (
  <svg viewBox="0 0 200 150" class="tour-svg">
    <defs>
      <linearGradient id="totpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>
      <linearGradient id="glowGradamber" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.1" />
      </linearGradient>
    </defs>
    <circle
      cx="100"
      cy="75"
      r="55"
      fill="url(#glowGradamber)"
      filter="blur(10px)"
    />
    <circle
      cx="100"
      cy="75"
      r="45"
      fill="none"
      stroke="#fbbf24"
      stroke-width="1.5"
      stroke-dasharray="6,6"
    />
    <circle
      cx="100"
      cy="75"
      r="34"
      fill="url(#totpGrad)"
      stroke="#fbbf24"
      stroke-width="1.5"
    />
    <path
      d="M92,62 A15,15 0 0,1 112,66 L117,60 M108,88 A15,15 0 0,1 88,84 L83,90"
      fill="none"
      stroke="#ffffff"
      stroke-width="2.5"
      stroke-linecap="round"
    />
    <rect
      x="70"
      y="112"
      width="60"
      height="20"
      rx="4"
      fill="#1d293d"
      stroke="#fbbf24"
      stroke-width="1"
    />
    <text
      x="100"
      y="126"
      fill="#fbbf24"
      font-size="9"
      font-family="monospace"
      font-weight="bold"
      text-anchor="middle"
    >
      5 8 2 0 1 4
    </text>
  </svg>
);

export default TotpIllustration;
