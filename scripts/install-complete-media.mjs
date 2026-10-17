import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve,join } from 'node:path';

// Local preview only. All input bytes came from user-provided/review media.
// Do not publish without licensing and full-image registration-plate review.
const root=resolve(process.cwd());
const archive=resolve(process.argv[2]||join(homedir(),'Downloads','mateshwari_complete_media_review.zip'));
const zipHash='a6d62ce2a034ef36cc32ef756dde80aebdca929ea6f95923b2cc65a529d457e6';
const expected={
 'public/media/mt-cinematic-drive.mp4':'2cce250c1be3eef77b34d14efd68169b934f15f3fda60a5d14c5cfd9133be7e4',
 'public/media/mt-hero-car-cutout.webp':'66e5aea0679566bc776e0c08779acf1aef9adb820f6637f651f1dfe5fe0da987',
 'public/media/mt-hero-sunset.webp':'121adcf9cd4f44883448b55393cc503deb2c997a044fd5f97390601b3d984fbd',
 'public/media/mt-mountain-sunset.webp':'8dc266b656d5809537b0d8d6da2d927344141dfd5a54917ee170995586bb4313',
 'public/media/mt-scorpio-arrival.mp4':'dc45cddc9d27d94499a7e01e8598f161f9e80ec9efcc13d5fce187570aa24d31',
 'public/media/mt-scorpio-poster.webp':'2b99c6ef360f390093cb78c9053d76f7ee1c3c1c0d925611968dee7e430e0a2b',
 'public/media/mt-side-car-cutout.webp':'93209963d31df0846b34bd10a4efeb68b83aa84c6618ad5b9cff2038d1879d82',
 'public/media/mt-thar-grey-front-safe.webp':'453ba8a1fc414b5035f29c6278eb57830909a9a76722699149d160be44c96de9',
 'public/media/mt-thar-grey-road.webp':'52fe060ac3b15932e2087e1dfc05cf6c1e1e4550c6e22a44ebb4b5c82d559e97',
 'public/media/mt-thar-red-front.webp':'fedf8c0c28124dad6057d10624790ca407497c6c8a8d26200a4ddb17de250b37',
 'public/media/mt-thar-red-rear.webp':'0722f2fc4f64b9b4d904239acbdf1892a3e9ae3d7aa00eca80f7323a1fcdf915',
 'public/media/mt-traveller-safe.webp':'7165b80247d7ddaabcfc33fc26f7fd05e46bda9cf3d5a0c2f7b016145d3d76ad',
 'public/media/mt-xuv700-driving.webp':'ab40ce92c23c5ae820bd509b75f49d79d0a08e9287cf6d3d027f6828e954b20a',
 'public/media/mt-xuv700-studio.webp':'5d0b00e1eb82ca75fd8cfbf7ea3e18d2641f6204aeac9942b574fb0b4fab3aaf',
};
const hash=(path)=>createHash('sha256').update(readFileSync(path)).digest('hex');
const allValid=()=>Object.entries(expected).every(([p,h])=>existsSync(join(root,p))&&hash(join(root,p))===h);
if(!existsSync(join(root,'package.json'))){console.error('Run from project root.');process.exit(1);}
if(allValid()){console.log('All fourteen preview media assets are already installed.');process.exit(0);}
if(!existsSync(archive)){
 console.error('Media pack missing:',archive);
 console.error('Download mateshwari_complete_media_review.zip into Downloads and rerun npm run media:install.');
 process.exit(1);
}
try{
 if(hash(archive)!==zipHash)throw new Error('ZIP checksum mismatch.');
 const files=execFileSync('unzip',['-Z1',archive],{encoding:'utf8'}).trim().split(/\r?\n/);
 const allowed=[...Object.keys(expected),'MEDIA_MANIFEST.json','README_INSTALL.txt'];
 if(files.length!==allowed.length||files.some(p=>!allowed.includes(p)))
  throw new Error('The archive has unexpected filenames.');
 const changed=Object.keys(expected).filter(p=>existsSync(join(root,p))&&hash(join(root,p))!==expected[p]);
 if(changed.length)throw new Error('Refusing to overwrite modified files: '+changed.join(', '));
 execFileSync('unzip',['-o',archive,'-d',root],{stdio:'inherit'});
 if(!allValid())throw new Error('Installed files failed SHA-256 verification.');
 console.log('Fourteen reviewed media files installed. Restart the full dev server.');
 console.log('Preview media is not cleared for production publication.');
}catch(e){console.error('Complete media installation failed:',e.message);process.exit(1);}
