import { type Component } from "solid-js";

export const SecurityIllustration: Component = () => (
  <svg viewBox="0 0 200 150" class="tour-svg">
    <defs>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3b82f6" />
        <stop offset="100%" stop-color="#1d4ed8" />
      </linearGradient>
      <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.1" />
      </linearGradient>
    </defs>
    <circle cx="100" cy="75" r="55" fill="url(#glowGrad)" filter="blur(10px)" />
    <path
      d="M100,30 L145,45 C145,85 120,115 100,125 C80,115 55,85 55,45 Z"
      fill="url(#shieldGrad)"
      stroke="#60a5fa"
      stroke-width="2"
    />
    <path
      d="M85,75 L95,85 L120,60"
      fill="none"
      stroke="#ffffff"
      stroke-width="4"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <g class="floating-icon">
      <rect
        x="25"
        y="25"
        width="24"
        height="24"
        rx="6"
        fill="#1d293d"
        stroke="#3b82f6"
        stroke-width="1.5"
      />
      <text x="37" y="42" font-size="12" text-anchor="middle">🔑</text>
    </g>
    <g class="floating-icon-delayed">
      <rect
        x="150"
        y="85"
        width="24"
        height="24"
        rx="6"
        fill="#1d293d"
        stroke="#10b981"
        stroke-width="1.5"
      />
      <text x="162" y="102" font-size="12" text-anchor="middle">💳</text>
    </g>
    <g class="floating-icon-delayed-2">
      <rect
        x="150"
        y="25"
        width="24"
        height="24"
        rx="6"
        fill="#1d293d"
        stroke="#a855f7"
        stroke-width="1.5"
      />
      <text x="162" y="42" font-size="12" text-anchor="middle">📝</text>
    </g>
  </svg>
);

export default SecurityIllustration;
