const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'test-results/production-audit');
(async()=>{
 const results=[];
 for(const file of fs.readdirSync(path.join(root,'dist/pages')).filter(f=>f.endsWith('.html'))){
  try{
   const response=await fetch('https://validator.w3.org/nu/?out=json',{method:'POST',headers:{'Content-Type':'text/html; charset=utf-8'},body:fs.readFileSync(path.join(root,'dist/pages',file)),signal:AbortSignal.timeout(25000)});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const result=await response.json();results.push({file,...result});
   console.log(file,'errors:',result.messages.filter(m=>m.type==='error').length,'warnings:',result.messages.filter(m=>m.subType==='warning').length);
  }catch(e){results.push({file,failure:e.message});console.log(file,e.message);}
  fs.writeFileSync(path.join(out,'validator.json'),JSON.stringify(results,null,2));
 }
})();
