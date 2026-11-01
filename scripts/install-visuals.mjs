import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';

const root=resolve(process.cwd());
const archive=resolve(process.argv[2] || join(homedir(),'Downloads','mateshwari_cinematic_ertiga_pack.zip'));
const expected=[
 'public/media/mt-cinematic-drive.mp4',
 'public/media/mt-hero-car-cutout.webp',
 'public/media/mt-hero-sunset.webp',
 'public/media/mt-mountain-sunset.webp',
 'public/media/mt-side-car-cutout.webp',
];
if(!existsSync(join(root,'package.json'))){
 console.error('Run this inside the Yatish-Travelers project root.');process.exit(1);
}
if(!existsSync(archive)||!statSync(archive).isFile()){
 console.error('Visual pack not found:',archive);
 console.error('Download mateshwari_cinematic_ertiga_pack.zip to your Downloads folder, then retry npm run visuals:install.');
 process.exit(1);
}
try{
 const listed=execFileSync('unzip',['-Z1',archive],{encoding:'utf8',maxBuffer:20480}).trim().split(/\r?\n/);
 // Strict filename allow-list: do not extract arbitrary files from untrusted archives.
 if(listed.length!==expected.length+1||!listed.includes('README_INSTALL.txt')||!expected.every(p=>listed.includes(p)))
  throw new Error('Pack contents are not the expected five cinematic assets and README.');
 execFileSync('unzip',['-o',archive,'-d',root],{stdio:'inherit'});
 for(const file of expected){
  const path=join(root,file);
  if(!existsSync(path)||statSync(path).size<1000)throw new Error('Asset was not installed: '+file);
 }
 console.log('Cinematic vehicle image and motion pack installed. Restart npm run dev:full.');
}catch(error){
 console.error('Visual asset installation failed:',error.message);process.exit(1);
}
