import { type Component } from "solid-js";

export const WarningIllustration: Component = () => (
  <svg viewBox="0 0 200 120" class="tour-svg-warning">
    <defs>
      <linearGradient id="warnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ef4444" />
        <stop offset="100%" stop-color="#991b1b" />
      </linearGradient>
      <linearGradient id="glowGradred" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f87171" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#ef4444" stop-opacity="0.1" />
      </linearGradient>
    </defs>
    <circle
      cx="100"
      cy="60"
      r="45"
      fill="url(#glowGradred)"
      filter="blur(10px)"
    />
    <path
      d="M100,20 L135,80 L65,80 Z"
      fill="url(#warnGrad)"
      stroke="#f87171"
      stroke-width="2.5"
      stroke-linejoin="round"
    />
    <path
      d="M100,42 L100,62 M100,70 L100,72"
      stroke="#ffffff"
      stroke-width="4"
      stroke-linecap="round"
    />
  </svg>
);

export default WarningIllustration;
