import { type Component } from "solid-js";

export const PasskeyIllustration: Component = () => (
  <svg viewBox="0 0 200 150" class="tour-svg">
    <defs>
      <linearGradient id="passkeyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#14b8a6" />
        <stop offset="100%" stop-color="#0f766e" />
      </linearGradient>
      <linearGradient id="glowGradteal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#14b8a6" stop-opacity="0.1" />
      </linearGradient>
    </defs>
    <circle
      cx="100"
      cy="75"
      r="55"
      fill="url(#glowGradteal)"
      filter="blur(10px)"
    />
    <rect
      x="65"
      y="35"
      width="70"
      height="80"
      rx="12"
      fill="url(#passkeyGrad)"
      stroke="#2dd4bf"
      stroke-width="2"
    />
    <circle cx="100" cy="65" r="14" fill="#ffffff" opacity="0.9" />
    <path
      d="M80,98 C80,86 90,83 100,83 C110,83 120,86 120,98 Z"
      fill="#ffffff"
      opacity="0.9"
    />
    <g class="passkey-fingerprint-group">
      <circle
        cx="16"
        cy="16"
        r="16"
        fill="#1d293d"
        stroke="#2dd4bf"
        stroke-width="1.5"
      />
      <path
        d="M10,16 C10,12 13,9 16,9 C19,9 22,12 22,16 M12.5,16 C12.5,14 14,12 16,12 C18,12 19.5,14 19.5,16 M14.5,16 C14.5,15 15,14.5 16,14.5 C17,14.5 17.5,15 17.5,16"
        fill="none"
        stroke="#2dd4bf"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <path
        d="M16,19 C16,21 14.5,22.5 14.5,23 M16,16 L16,20"
        fill="none"
        stroke="#2dd4bf"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </g>
  </svg>
);

export default PasskeyIllustration;
