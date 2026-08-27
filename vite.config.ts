import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const deploymentBase = mode === 'github-pages' ? '/thedumptruck/' : '/'

  return {
  base: deploymentBase,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'assets/logo.png',
        'assets/dogs-accent.png',
        'assets/small-accents.png',
        'icons/apple-touch-icon.png',
      ],
      manifest: {
        id: deploymentBase,
        name: 'The Dump Truck',
        short_name: 'Dump Truck',
        description: 'A private photo and video organizer for arranging, shuffling, previewing, and exporting media.',
        start_url: deploymentBase,
        scope: deploymentBase,
        display: 'standalone',
        background_color: '#f8f6f0',
        theme_color: '#122442',
        orientation: 'any',
        icons: [
          {
            src: `${deploymentBase}icons/icon-192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${deploymentBase}icons/icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${deploymentBase}icons/icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  // Listen on the LAN as well as localhost so the app can be opened from
  // another device (for example, an iPad on the same Wi-Fi network).
  server: {
    host: '0.0.0.0',
  },
  preview: {
    host: '0.0.0.0',
  },
  }
})
