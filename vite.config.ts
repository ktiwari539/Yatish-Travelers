import { defineConfig, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { createReadStream, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const localStudioReview={
 name:'local-studio-review-photo-only',
 configureServer(server:ViteDevServer){
  const allowed=new Set(['mt-studio-ertiga-review.jpg','mt-studio-tuv-front-review.jpg','mt-studio-carens-review.jpg']);
  server.middlewares.use('/studio-review/',(req,res)=>{
   const name=decodeURIComponent((req.url||'').split('?')[0].replace(/^[/]+/,''));
   const file=resolve('.data/studio-review',name);
   if(process.env.VITE_STUDIO_REVIEW_READY!=='1'||!allowed.has(name)||!existsSync(file)){
    res.statusCode=404;res.end('Review photo not installed');return;
   }
   res.setHeader('Content-Type','image/jpeg');
   res.setHeader('Cache-Control','private, no-store');
   createReadStream(file).on('error',()=>{if(!res.headersSent){res.statusCode=500;res.end();}}).pipe(res);
  });
 }
};

export default defineConfig({
  plugins: [react(),localStudioReview],
  server: { proxy: { '/api': 'http://127.0.0.1:8787' } },
  build: {
    target: 'es2022',
  },
});
