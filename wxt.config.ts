import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: '.',
  publicDir: 'public',
  outDir: '.output',
  modules: [],
  manifest: {
    name: 'WebMCP Safety Check',
    description: 'Inspect WebMCP and MCP tool declarations locally before an agent can call them.',
    version: '1.0.1',
    permissions: [],
    host_permissions: [],
    icons: {
      16: 'icon-16.png',
      32: 'icon-32.png',
      48: 'icon-48.png',
      128: 'icon-128.png'
    },
    action: {
      default_title: 'Inspect WebMCP safety declarations',
      default_icon: {
        16: 'icon-16.png',
        32: 'icon-32.png'
      }
    }
  },
  vite: () => ({
    build: { target: 'es2022' }
  })
});
