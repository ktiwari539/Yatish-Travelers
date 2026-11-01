import {defineConfig} from 'vite';
export default defineConfig({root:'web',build:{outDir:'../dist',emptyOutDir:true},server:{allowedHosts:['terminal.local'],proxy:{'/api/poc':'http://127.0.0.1:8890'}}});
