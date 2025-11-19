
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';
  import { visualizer } from 'rollup-plugin-visualizer';

  export default defineConfig({
    plugins: [
      react(),
      visualizer({
        filename: './build/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        // Path alias for cleaner imports
        '@': path.resolve(__dirname, './src'),

        // Figma asset aliases
        'figma:asset/f05dee67f2743d5c7b8183a074546e987c63f567.png': path.resolve(__dirname, './src/assets/f05dee67f2743d5c7b8183a074546e987c63f567.png'),
        'figma:asset/e9db79d0f3507f2a61e25dfa2f8f638bbcaf8b9d.png': path.resolve(__dirname, './src/assets/e9db79d0f3507f2a61e25dfa2f8f638bbcaf8b9d.png'),
        'figma:asset/e859f2896aa57670db9ed9933eb059d29ffaf7c7.png': path.resolve(__dirname, './src/assets/e859f2896aa57670db9ed9933eb059d29ffaf7c7.png'),
        'figma:asset/e0079245ea67343450871e33ff689154160aa2bb.png': path.resolve(__dirname, './src/assets/e0079245ea67343450871e33ff689154160aa2bb.png'),
        'figma:asset/d1c10d8dbfc2ae5783543c9f0b76cd2635713297.png': path.resolve(__dirname, './src/assets/d1c10d8dbfc2ae5783543c9f0b76cd2635713297.png'),
        'figma:asset/bf4ffd108c2e836b466874e959531fdf5c9bd8b1.png': path.resolve(__dirname, './src/assets/bf4ffd108c2e836b466874e959531fdf5c9bd8b1.png'),
        'figma:asset/9c06d369cd4b66fb5b16a4209259f1271ce88ec7.png': path.resolve(__dirname, './src/assets/9c06d369cd4b66fb5b16a4209259f1271ce88ec7.png'),
        'figma:asset/88076181b402df2ffcba98c51345afaaa2165468.png': path.resolve(__dirname, './src/assets/88076181b402df2ffcba98c51345afaaa2165468.png'),
        'figma:asset/6b82043ca68632e4603c63153aae4828cae95e1b.png': path.resolve(__dirname, './src/assets/6b82043ca68632e4603c63153aae4828cae95e1b.png'),
        'figma:asset/68b289cb927cef11d11501fd420bb560ad25c667.png': path.resolve(__dirname, './src/assets/68b289cb927cef11d11501fd420bb560ad25c667.png'),
        'figma:asset/146d0c4e38c1dc2f05fd32c9740151e0eaaee326.png': path.resolve(__dirname, './src/assets/146d0c4e38c1dc2f05fd32c9740151e0eaaee326.png'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',

      // Rollup optimization for better code splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better caching
            'vendor-react': ['react', 'react-dom'],
            'vendor-ui': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-select',
              '@radix-ui/react-popover',
              '@radix-ui/react-dropdown-menu',
            ],
            'vendor-charts': ['recharts'],
            'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],
          },
        },
      },

      // Minification with Terser for production
      minify: 'terser',
      terserOptions: {
        compress: {
          // Remove console.* and debugger in production
          drop_console: true,
          drop_debugger: true,
          // Remove unused code
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
        },
      },

      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      open: true,
      allowedHosts: ['crmpoc.star-bit.io'],
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8700',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  });