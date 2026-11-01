import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const root=resolve(process.cwd());
const archive=resolve(process.argv[2]||join(homedir(),'Downloads','mateshwari_fleet_photography_safe_pack.zip'));
const zipHash='ea09331069edb95fe65ee0ae17fbdf5ad1220ba81dca047de2911bab9166d927';
const photos={
 'public/media/mt-xuv700-driving.webp':'ab40ce92c23c5ae820bd509b75f49d79d0a08e9287cf6d3d027f6828e954b20a',
 'public/media/mt-xuv700-studio.webp':'5d0b00e1eb82ca75fd8cfbf7ea3e18d2641f6204aeac9942b574fb0b4fab3aaf',
 'public/media/mt-thar-red-front.webp':'fedf8c0c28124dad6057d10624790ca407497c6c8a8d26200a4ddb17de250b37',
 'public/media/mt-thar-red-rear.webp':'0722f2fc4f64b9b4d904239acbdf1892a3e9ae3d7aa00eca80f7323a1fcdf915',
 'public/media/mt-thar-grey-road.webp':'52fe060ac3b15932e2087e1dfc05cf6c1e1e4550c6e22a44ebb4b5c82d559e97',
 'public/media/mt-thar-grey-front-safe.webp':'453ba8a1fc414b5035f29c6278eb57830909a9a76722699149d160be44c96de9',
 'public/media/mt-traveller-safe.webp':'7165b80247d7ddaabcfc33fc26f7fd05e46bda9cf3d5a0c2f7b016145d3d76ad',
};
const sha256=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const assetNames=Object.keys(photos);
const allAlreadyValid=assetNames.every(p=>existsSync(join(root,p))&&sha256(join(root,p))===photos[p]);
if(!existsSync(join(root,'package.json'))){console.error('Run this command from the project root.');process.exit(1);}
if(allAlreadyValid){console.log('Seven verified fleet photos already installed; no changes needed.');process.exit(0);}
if(!existsSync(archive)||!statSync(archive).isFile()){
 console.error('Fleet media pack not found:',archive);
 console.error('Download mateshwari_fleet_photography_safe_pack.zip into ~/Downloads, then run npm run fleet:install.');
 process.exit(1);
}
try{
 if(sha256(archive)!==zipHash)throw new Error('Archive checksum does not match the reviewed assets.');
 const allow=[...assetNames,'MEDIA_MANIFEST.json','README_INSTALL.txt'];
 const zipFiles=execFileSync('unzip',['-Z1',archive],{encoding:'utf8'}).trim().split(/\r?\n/);
 if(zipFiles.length!==allow.length||zipFiles.some(p=>!allow.includes(p)))
  throw new Error('Unexpected file in media pack.');
 for(const path of assetNames){
  const destination=join(root,path);
  if(existsSync(destination)&&sha256(destination)!==photos[path])
   throw new Error('Existing customized media would be overwritten: '+path);
 }
 execFileSync('unzip',['-o',archive,'-d',root],{stdio:'inherit'});
 for(const [path,hash] of Object.entries(photos)){
  if(!existsSync(join(root,path))||sha256(join(root,path))!==hash)
   throw new Error('Installed media failed verification: '+path);
 }
 console.log('Installed all seven model-specific reference photos.');
 console.log('Restart npm run dev:full, then refresh the fleet page.');
 console.log('Usage rights are not verified; review before publication.');
}catch(error){console.error('Photo pack installation failed:',error.message);process.exit(1);}
