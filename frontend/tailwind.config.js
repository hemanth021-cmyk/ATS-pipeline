/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-container-low": "#eef1f4",
        "secondary-container": "#c0d1ff",
        "surface-container-highest": "#d9dde1",
        "secondary-fixed": "#c0d1ff",
        "surface-container": "#e5e8ec",
        "outline-variant": "#abadb0",
        "background": "#f5f7fa",
        "surface-container-high": "#dfe3e7",
        "inverse-primary": "#54e0fd",
        "error-dim": "#9f0519",
        "on-tertiary-fixed": "#380014",
        "tertiary-dim": "#a00047",
        "on-error": "#ffefee",
        "secondary-fixed-dim": "#acc3ff",
        "on-secondary-fixed-variant": "#004baf",
        "inverse-on-surface": "#9a9da0",
        "surface-variant": "#d9dde1",
        "tertiary-container": "#ff8fa9",
        "secondary-dim": "#004aad",
        "error-container": "#fb5151",
        "on-surface": "#2c2f32",
        "surface": "#f5f7fa",
        "surface-dim": "#d0d5d9",
        "on-surface-variant": "#595c5e",
        "on-tertiary": "#ffeff0",
        "on-secondary-fixed": "#003076",
        "on-primary-fixed": "#003842",
        "on-secondary": "#f0f2ff",
        "on-primary-fixed-variant": "#005765",
        "inverse-surface": "#0b0f11",
        "tertiary-fixed": "#ff8fa9",
        "primary-fixed": "#54e0fd",
        "on-primary-container": "#004d5a",
        "on-tertiary-fixed-variant": "#770033",
        "on-background": "#2c2f32",
        "secondary": "#0055c4",
        "surface-tint": "#006575",
        "on-tertiary-container": "#66002b",
        "tertiary-fixed-dim": "#ff769b",
        "primary": "#006575",
        "surface-bright": "#f5f7fa",
        "on-primary": "#dcf7ff",
        "error": "#b31b25",
        "primary-fixed-dim": "#40d2ee",
        "primary-dim": "#005866",
        "on-error-container": "#570008",
        "tertiary": "#b60051",
        "surface-container-lowest": "#ffffff",
        "on-secondary-container": "#00429c",
        "primary-container": "#54e0fd",
        "outline": "#74777a"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      fontFamily: {
        headline: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"]
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out forwards',
      },
    }
  },
  plugins: []
};
