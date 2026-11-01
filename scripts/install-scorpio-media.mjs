import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync,existsSync,statSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve,join } from 'node:path';

const project=resolve(process.cwd());
const pack=resolve(process.argv[2]||join(homedir(),'Downloads','mateshwari_scorpio_website_pack.zip'));
const media='public/media/mt-scorpio-arrival.mp4';
const poster='public/media/mt-scorpio-poster.webp';
const expected=[media,poster,'README_INSTALL.txt'];
const sha256=(file)=>createHash('sha256').update(readFileSync(file)).digest('hex');
const expectedVideoHash='dc45cddc9d27d94499a7e01e8598f161f9e80ec9efcc13d5fce187570aa24d31';
if(!existsSync(join(project,'package.json'))){
 console.error('Run this from the Yatish-Travelers project root.');process.exit(1);
}
if(existsSync(join(project,media))&&sha256(join(project,media))===expectedVideoHash){
 console.log('Scorpio-N approved preview film already installed; no changes needed.');
 process.exit(0);
}
if(!existsSync(pack)||!statSync(pack).isFile()){
 console.error('Scorpio film pack not found:',pack);
 console.error('Download mateshwari_scorpio_website_pack.zip to ~/Downloads, then run npm run scorpio:install');
 process.exit(1);
}
try{
 const listed=execFileSync('unzip',['-Z1',pack],{encoding:'utf8',maxBuffer:20000})
  .trim().split(/\r?\n/);
 if(listed.length!==expected.length||!expected.every(name=>listed.includes(name)))
  throw new Error('Unexpected pack contents. Do not extract unverified files.');
 if(sha256(pack)!=='ec9d4429ae26f831da74f2a74e5fcb18ccc090e32f8f855d24ff10192368205d')
  throw new Error('ZIP checksum mismatch; download the approved pack again.');
 execFileSync('unzip',['-o',pack,'-d',project],{stdio:'inherit'});
 if(!existsSync(join(project,poster))||sha256(join(project,media))!==expectedVideoHash)
  throw new Error('Scorpio media validation failed after extraction.');
 console.log('Scorpio-N clip installed. Restart the local server and select Mahindra Scorpio-N.');
}catch(err){
 console.error('Scorpio film installation failed:',err.message);process.exit(1);
}
