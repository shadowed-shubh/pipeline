/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        card:          '#1C1C1C',
        'card-hover':  '#252525',
        primary:       '#3D7BF5',
        'primary-dark':'#2563EB',
        'primary-pale':'rgba(61,123,245,0.12)',
        'primary-muted':'rgba(61,123,245,0.20)',
        subtitle:      '#888888',
        'gray-border': '#2A2A2A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      animation: {
        'pulse-ring': 'pulseRing 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'dot-1': 'dotPulse 1.4s ease-in-out infinite',
        'dot-2': 'dotPulse 1.4s ease-in-out 0.2s infinite',
        'dot-3': 'dotPulse 1.4s ease-in-out 0.4s infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        pulseRing: {
          '0%,100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%':     { transform: 'scale(1.18)', opacity: '0.2' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-10px)' },
        },
        dotPulse: {
          '0%,80%,100%': { transform: 'scale(0)', opacity: '0' },
          '40%':          { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        slideIn: {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
