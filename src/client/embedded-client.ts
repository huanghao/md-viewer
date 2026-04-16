// 自动生成的文件，不要手动编辑
// 由 scripts/embed-client.ts 生成

export const EMBEDDED_CLIENT_JS = `"use strict";(()=>{var da=Object.defineProperty;var v=(e,t)=>()=>(e&&(t=e(e=0)),t);var ke=(e,t)=>{for(var n in t)da(e,n,{get:t[n],enumerable:!0})};var Ao={};ke(Ao,{defaultConfig:()=>Et,loadConfig:()=>Mt,saveConfig:()=>O,updateConfig:()=>ua});function Mt(){try{let e=localStorage.getItem(So);if(!e)return{...Et};let t=JSON.parse(e);return{...Et,...t}}catch(e){return console.error("\\u52A0\\u8F7D\\u914D\\u7F6E\\u5931\\u8D25:",e),{...Et}}}function O(e){try{localStorage.setItem(So,JSON.stringify(e))}catch(t){console.error("\\u4FDD\\u5B58\\u914D\\u7F6E\\u5931\\u8D25:",t)}}function ua(e){let n={...Mt(),...e};return O(n),n}var So,Et,je=v(()=>{"use strict";So="md-viewer:config",Et={sidebarTab:"focus",focusWindowKey:"8h",markdownTheme:"github",codeTheme:"github",mathInline:!0,workspacePollInterval:5e3,workspaces:[]}});function Fo(){try{localStorage.setItem(Lo,JSON.stringify(Array.from(xe.entries()).map(([e,t])=>[e,Array.from(t)])))}catch(e){console.error("\\u4FDD\\u5B58\\u5217\\u8868\\u5DEE\\u5F02\\u72B6\\u6001\\u5931\\u8D25:",e)}}function Co(){xe.clear();try{let e=localStorage.getItem(Lo);if(!e)return;let t=JSON.parse(e);if(!Array.isArray(t))return;for(let n of t){if(!Array.isArray(n)||n.length!==2)continue;let o=n[0],r=n[1];typeof o!="string"||!Array.isArray(r)||xe.set(o,new Set(r.filter(a=>typeof a=="string"&&a.length>0)))}}catch(e){console.error("\\u6062\\u590D\\u5217\\u8868\\u5DEE\\u5F02\\u72B6\\u6001\\u5931\\u8D25:",e)}}function \$o(e){return xe.get(e)}function pn(e,t){xe.set(e,t),Fo()}function Io(e){let t=xe.get(e);return xe.delete(e),Fo(),t}var Lo,xe,Po=v(()=>{"use strict";Lo="md-viewer:workspaceKnownFiles",xe=new Map});function Te(e){St.add(e)}function te(e){St.delete(e)}function mn(e){return St.has(e)}function fn(e){let t=Array.from(St.values());if(!e)return t;let n=\`\${e.replace(/\\/+\$/,"")}/\`;return t.filter(o=>o.startsWith(n))}var St,gn=v(()=>{"use strict";St=new Set});function hn(){try{let e=Array.from(le.entries()).map(([t,n])=>[t,Array.from(n.entries())]);localStorage.setItem(Bo,JSON.stringify(e))}catch(e){console.error("\\u4FDD\\u5B58\\u5DE5\\u4F5C\\u533A\\u76EE\\u5F55\\u5C55\\u5F00\\u72B6\\u6001\\u5931\\u8D25:",e)}}function No(){le.clear();try{let e=localStorage.getItem(Bo);if(!e)return;let t=JSON.parse(e);if(!Array.isArray(t))return;for(let n of t){if(!Array.isArray(n)||n.length!==2)continue;let o=n[0],r=n[1];if(typeof o!="string"||!Array.isArray(r))continue;let a=new Map;for(let i of r){if(!Array.isArray(i)||i.length!==2)continue;let s=i[0],l=i[1];typeof s!="string"||typeof l!="boolean"||a.set(s,l)}a.size>0&&le.set(o,a)}}catch(e){console.error("\\u6062\\u590D\\u5DE5\\u4F5C\\u533A\\u76EE\\u5F55\\u5C55\\u5F00\\u72B6\\u6001\\u5931\\u8D25:",e)}}function Ho(e){return le.get(e)}function At(e,t){if(t.size===0){le.delete(e),hn();return}le.set(e,new Map(t)),hn()}function jo(e){le.has(e)&&(le.delete(e),hn())}function Lt(e){let t=new Map,n=o=>{if(o.type==="directory"){typeof o.isExpanded=="boolean"&&t.set(o.path,o.isExpanded);for(let r of o.children||[])n(r)}};return n(e),t}var Bo,le,yn=v(()=>{"use strict";Bo="md-viewer:workspaceTreeExpandedState",le=new Map});function q(e){return ce.has(e)}function bn(e){ce.add(e)}function z(e){ce.has(e)&&ce.delete(e)}function rt(e){return ot.has(e)}function wn(e){ot.add(e)}function Ft(e){ot.delete(e)}function vn(){ce.clear(),ot.clear(),Co(),No()}function kn(e,t){let n=new Set(t),o=\$o(e);if(!o){pn(e,n);return}for(let r of n)o.has(r)||ce.add(r),te(r);for(let r of o)n.has(r)||(ce.delete(r),Te(r));pn(e,n)}function xn(e){let t=Io(e);if(t)for(let n of t)ce.delete(n),ot.delete(n)}var ce,ot,Wo=v(()=>{"use strict";Po();gn();yn();ce=new Set,ot=new Set});var de=v(()=>{"use strict";Wo();gn()});var Ee={};ke(Ee,{addOrUpdateFile:()=>Mn,adjustAnnotationCount:()=>ne,getFilteredFiles:()=>Fn,getSessionFile:()=>We,getSessionFiles:()=>Tn,hasSessionFile:()=>It,markFileMissing:()=>pa,removeFile:()=>Sn,restoreState:()=>En,saveState:()=>J,setAnnotationCounts:()=>Ln,setSearchQuery:()=>ue,state:()=>c,switchToFile:()=>An});function We(e){return c.sessionFiles.get(e)}function It(e){return c.sessionFiles.has(e)}function Tn(){return Array.from(c.sessionFiles.values())}function J(){try{let e={files:Array.from(c.sessionFiles.entries()).map(([t,n])=>[t,{path:n.path,name:n.name,isRemote:n.isRemote||!1,isMissing:n.isMissing||!1,lastModified:n.lastModified,displayedModified:n.displayedModified,lastAccessed:n.lastAccessed||Date.now()}]),currentFile:c.currentFile};localStorage.setItem(\$t,JSON.stringify(e))}catch(e){if(e.name==="QuotaExceededError"||e.code===22){console.warn("localStorage \\u914D\\u989D\\u5DF2\\u6EE1\\uFF0C\\u6267\\u884C\\u6E05\\u7406..."),Do();try{let t={files:Array.from(c.sessionFiles.entries()).map(([n,o])=>[n,{path:o.path,name:o.name,isRemote:o.isRemote||!1,isMissing:o.isMissing||!1,lastModified:o.lastModified,displayedModified:o.displayedModified,lastAccessed:o.lastAccessed||Date.now()}]),currentFile:c.currentFile};localStorage.setItem(\$t,JSON.stringify(t))}catch(t){console.error("\\u4FDD\\u5B58\\u72B6\\u6001\\u5931\\u8D25\\uFF08\\u91CD\\u8BD5\\u540E\\uFF09:",t)}}else console.error("\\u4FDD\\u5B58\\u72B6\\u6001\\u5931\\u8D25:",e)}}function Do(){if(c.sessionFiles.size<=Ct)return;let e=Array.from(c.sessionFiles.entries()).sort((o,r)=>(r[1].lastAccessed||r[1].lastModified||0)-(o[1].lastAccessed||o[1].lastModified||0)),t=e.slice(0,Ct),n=e.slice(Ct);c.sessionFiles.clear(),t.forEach(([o,r])=>{c.sessionFiles.set(o,r)}),console.log(\`\\u5DF2\\u6E05\\u7406 \${n.length} \\u4E2A\\u65E7\\u6587\\u4EF6\`)}async function En(e){try{vn();let t=localStorage.getItem(\$t);if(!t)return;let n=JSON.parse(t);if(!n.files||n.files.length===0)return;let o=[];for(let[r,a]of n.files){let i=await e(r,!0);if(i){let s=Math.max(i.lastModified,a.lastModified||0);c.sessionFiles.set(r,{path:i.path,name:i.filename,content:i.content,lastModified:s,displayedModified:i.lastModified,isRemote:i.isRemote||!1,isMissing:!1,lastAccessed:a.lastAccessed||i.lastModified}),o.push([r,a])}}if(o.length!==n.files.length){let r=c.sessionFiles.has(n.currentFile)?n.currentFile:null;localStorage.setItem(\$t,JSON.stringify({files:o,currentFile:r}))}if(n.currentFile&&c.sessionFiles.has(n.currentFile))c.currentFile=n.currentFile;else{let r=Array.from(c.sessionFiles.values())[0];c.currentFile=r?r.path:null}}catch(t){console.error("\\u6062\\u590D\\u72B6\\u6001\\u5931\\u8D25:",t)}}function Mn(e,t=!1){c.sessionFiles.size>=Ct&&!c.sessionFiles.has(e.path)&&Do();let n=c.sessionFiles.get(e.path),o=!n,r=e.lastModified,a=n?Math.max(n.lastModified,e.lastModified):e.lastModified;c.sessionFiles.set(e.path,{path:e.path,name:e.filename,content:e.content,lastModified:a,displayedModified:r,isRemote:e.isRemote||!1,isMissing:!1,lastAccessed:Date.now()}),t&&(c.currentFile=e.path,z(e.path)),te(e.path),o&&(t||bn(e.path)),J()}function Sn(e){let n=Array.from(c.sessionFiles.keys()).indexOf(e);if(c.sessionFiles.delete(e),z(e),te(e),c.currentFile===e){let o=Array.from(c.sessionFiles.values());c.currentFile=o.length>0?o[Math.max(0,n-1)].path:null}J()}function An(e){c.currentFile=e;let t=c.sessionFiles.get(e);t&&(t.lastAccessed=Date.now()),z(e),te(e),J()}function pa(e,t=!1){let n=c.sessionFiles.get(e),o=Date.now(),r=e.split("/").pop()||n?.name||e;c.sessionFiles.set(e,{path:e,name:r,content:n?.content||\`# \\u6587\\u4EF6\\u5DF2\\u5220\\u9664

\\u8BE5\\u6587\\u4EF6\\u5DF2\\u4ECE\\u78C1\\u76D8\\u5220\\u9664\\uFF0C\\u4E14\\u5F53\\u524D\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\u5185\\u5BB9\\u3002\`,lastModified:n?.lastModified||o,displayedModified:n?.displayedModified||o,isRemote:n?.isRemote||!1,isMissing:!0}),t&&(c.currentFile=e,z(e)),Te(e),J()}function ue(e){c.searchQuery=e}function Ln(e){c.annotationCounts=e}function ne(e,t){let o=(c.annotationCounts.get(e)??0)+t;o<=0?c.annotationCounts.delete(e):c.annotationCounts.set(e,o)}function Fn(){let e=c.searchQuery.toLowerCase().trim();return e?Array.from(c.sessionFiles.values()).filter(t=>t.name.toLowerCase().includes(e)||t.path.toLowerCase().includes(e)):Array.from(c.sessionFiles.values())}var c,\$t,Ct,H=v(()=>{"use strict";je();de();c={sessionFiles:new Map,currentFile:null,searchQuery:"",config:Mt(),currentWorkspace:null,fileTree:new Map,annotationCounts:new Map},\$t="md-viewer:openFiles",Ct=100});function x(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}function T(e){return x(e)}var Me=v(()=>{"use strict"});function U(e,t=!1){return e.isMissing?{badge:"D",color:"#ff3b30",type:"deleted"}:e.lastModified>e.displayedModified?{badge:"M",color:"#ff9500",type:"modified"}:t?{badge:"dot",color:"#007AFF",type:"new"}:{badge:null,color:null,type:"normal"}}var Pt=v(()=>{"use strict"});function Bt(e){let t=e.match(/\\.([^.]+)\$/);return t?t[1].toLowerCase():""}function ma(e){let t=Bt(e);return t==="html"||t==="htm"}function Cn(e){return Bt(e)==="json"}function it(e){return Bt(e)==="jsonl"}function fa(e){return Bt(e)==="pdf"}function Se(e){return ma(e)?{cls:"html",label:"<>"}:Cn(e)||it(e)?{cls:"json",label:"{}"}:fa(e)?{cls:"pdf",label:"P"}:{cls:"md",label:"M"}}var at=v(()=>{"use strict"});function st(e){return e&&(e.replace(/\\.(md|markdown|html?)\$/i,"")||e)}var \$n=v(()=>{"use strict"});var Bn={};ke(Bn,{getPinnedFiles:()=>Pn,isPinned:()=>In,pinFile:()=>ga,unpinFile:()=>ha});function Nt(){try{let e=localStorage.getItem(Ro);if(!e)return new Set;let t=JSON.parse(e);return Array.isArray(t)?new Set(t):new Set}catch{return new Set}}function Oo(e){try{localStorage.setItem(Ro,JSON.stringify(Array.from(e)))}catch{}}function In(e){return Nt().has(e)}function ga(e){let t=Nt();t.add(e),Oo(t)}function ha(e){let t=Nt();t.delete(e),Oo(t)}function Pn(){return Nt()}var Ro,lt=v(()=>{"use strict";Ro="md-viewer:pinned-files"});function Ht(e){let t=Array.from(e.values()),n={};return t.forEach(o=>{n[o.name]=(n[o.name]||0)+1}),t.map(o=>{if(n[o.name]===1)return{...o,displayName:o.name};let r=o.path.split("/").filter(Boolean),a=t.filter(s=>s.name===o.name&&s.path!==o.path),i="";for(let s=r.length-2;s>=0;s--){let l=r[s];if(a.every(d=>d.path.split("/").filter(Boolean)[s]!==l)){i=l;break}}return!i&&r.length>=2&&(i=r[r.length-2]),{...o,displayName:i?\`\${o.name} (\${i})\`:o.name}})}var qo=v(()=>{"use strict"});function De(e,t,n,o){if(t.length===0)return[];if(e==="close-all")return t.map(r=>r.path);if(!n)return[];if(e==="close-others")return t.filter(r=>r.path!==n).map(r=>r.path);if(e==="close-right"){let r=t.findIndex(a=>a.path===n);return r<0?[]:t.slice(r+1).map(a=>a.path)}return t.filter(r=>r.path!==n&&o(r.path)).map(r=>r.path)}var _o=v(()=>{"use strict"});function ya(){Re||(Re=document.createElement("div"),Re.id="toast-container",Re.className="toast-container",document.body.appendChild(Re))}function Oe(e){let t=typeof e=="string"?{message:e,type:"info",duration:3e3}:{type:"info",duration:3e3,...e};ya();let n=document.createElement("div");n.className=\`toast toast-\${t.type}\`;let o={success:"\\u2713",error:"\\u2717",warning:"\\u26A0",info:"\\u2139"};return n.innerHTML=\`
    <span class="toast-icon">\${o[t.type]}</span>
    <span class="toast-message">\${t.message}</span>
  \`,Re.appendChild(n),requestAnimationFrame(()=>{n.classList.add("toast-show")}),t.duration&&t.duration>0&&setTimeout(()=>{zo(n)},t.duration),n.addEventListener("click",()=>{zo(n)}),n}function zo(e){e.classList.remove("toast-show"),e.classList.add("toast-hide"),setTimeout(()=>{e.remove()},300)}function Q(e,t){return Oe({message:e,type:"success",duration:t})}function L(e,t){return Oe({message:e,type:"error",duration:t})}function Ko(e,t){return Oe({message:e,type:"warning",duration:t})}function Nn(e,t){return Oe({message:e,type:"info",duration:t})}var Re,qe=v(()=>{"use strict";Re=null});var jt={};ke(jt,{detectPathType:()=>Wn,getNearbyFiles:()=>Hn,getPathSuggestions:()=>jn,loadFile:()=>_e,openFile:()=>Dn,searchFiles:()=>ct});async function _e(e,t=!1){try{let o=await(await fetch(\`/api/file?path=\${encodeURIComponent(e)}\`)).json();return o.error?(t||L(o.error),null):o}catch(n){return t||L(\`\\u52A0\\u8F7D\\u5931\\u8D25: \${n.message}\`),null}}async function ct(e,t={}){let n=new URLSearchParams({query:e});t.limit&&Number.isFinite(t.limit)&&n.set("limit",String(t.limit));for(let r of t.roots||[])r.trim()&&n.append("root",r.trim());return(await fetch(\`/api/files?\${n.toString()}\`)).json()}async function Hn(e){return(await fetch(\`/api/nearby?path=\${encodeURIComponent(e)}\`)).json()}async function jn(e,t={}){let n=t.kind||"file",o=t.markdownOnly!==!1,r=new URLSearchParams({input:e,kind:n,markdownOnly:o?"true":"false"});return(await fetch(\`/api/path-suggestions?\${r.toString()}\`)).json()}async function Wn(e){return(await fetch("/api/detect-path",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e})})).json()}async function Dn(e,t=!0){await fetch("/api/open",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,focus:t})})}var Ae=v(()=>{"use strict";qe()});function Wt(e,t){let n=[],o=-1,r=0,a=null,i=document.createElement("div");i.className="path-autocomplete-panel",i.style.display="none",document.body.appendChild(i);let s=()=>i.style.display!=="none",l=()=>{r+=1,a!==null&&(window.clearTimeout(a),a=null),i.style.display="none",n=[],o=-1},d=()=>{let g=e.getBoundingClientRect();i.style.left=\`\${Math.round(g.left+window.scrollX)}px\`,i.style.top=\`\${Math.round(g.bottom+window.scrollY+4)}px\`,i.style.width=\`\${Math.round(g.width)}px\`},u=()=>{if(n.length===0){l();return}i.innerHTML=n.map((g,y)=>{let b=y===o?"path-autocomplete-item active":"path-autocomplete-item",k=g.type==="directory"?"\\u{1F4C1}":"\\u{1F4C4}";return\`
          <div class="\${b}" data-index="\${y}">
            <span class="path-autocomplete-icon">\${k}</span>
            <span class="path-autocomplete-text">\${ba(g.display)}</span>
          </div>
        \`}).join(""),d(),i.style.display="block"},f=g=>{let y=n[g];if(!y)return;let b=y.type==="directory",k=b&&!y.path.endsWith("/")?\`\${y.path}/\`:y.path;e.value=k,e.dispatchEvent(new Event("input",{bubbles:!0})),e.focus(),e.setSelectionRange(e.value.length,e.value.length),l(),b&&m()},p=async()=>{let g=e.value.trim();if(!g){l();return}if(document.body.classList.contains("quick-action-confirm-visible")){l();return}if(t.shouldActivate&&!t.shouldActivate(g)){l();return}let y=++r;try{let b=await jn(g,{kind:t.kind,markdownOnly:t.markdownOnly});if(y!==r)return;n=b.suggestions||[],o=n.length>0?0:-1,u()}catch{l()}},m=()=>{a!==null&&window.clearTimeout(a),a=window.setTimeout(p,100)};i.addEventListener("mousedown",g=>{g.preventDefault();let y=g.target.closest(".path-autocomplete-item");if(!y)return;let b=Number(y.dataset.index);Number.isNaN(b)||f(b)}),e.addEventListener("focus",m),e.addEventListener("input",m),e.addEventListener("path-autocomplete-hide",l),e.addEventListener("keydown",g=>{let y=g.key;if(s()){if(y==="ArrowDown"){g.preventDefault(),n.length>0&&(o=(o+1)%n.length,u());return}if(y==="ArrowUp"){g.preventDefault(),n.length>0&&(o=(o-1+n.length)%n.length,u());return}if(y==="Tab"){o>=0&&(g.preventDefault(),f(o));return}if(y==="Enter"){if(g.metaKey||g.ctrlKey)return;if(g.preventDefault(),o>=0){f(o);return}l();return}y==="Escape"&&(g.preventDefault(),l())}}),e.addEventListener("blur",()=>{window.setTimeout(l,120)}),window.addEventListener("resize",()=>{s()&&d()}),window.addEventListener("scroll",()=>{s()&&d()},!0)}function ba(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}var Rn=v(()=>{"use strict";Ae()});function Uo(e,t){if(e.type==="file")return t.has(e.path)?null:e;let n=[];for(let o of e.children||[]){let r=Uo(o,t);r&&n.push(r)}return n.length===0&&(e.children||[]).length>0?null:{...e,children:n}}function wa(e){let t=e.split("/").filter(Boolean);return t[t.length-1]||"workspace"}function Go(e){let t=st(e)||e;return\`<span class="tree-name-full">\${x(t)}</span>\`}function Xo(e,t){if(e){if(e.type==="file"){t.add(e.path);return}(e.children||[]).forEach(n=>Xo(n,t))}}function Yo(e){if(e.type==="file")return 1;let t=0;for(let n of e.children||[])t+=Yo(n);return e.fileCount=t,t}function va(e,t){let n=e.path.replace(/\\/+\$/,""),o={name:e.name,path:n,type:"directory",isExpanded:!0,children:[]},r=new Map([[n,o]]),a=Array.from(new Set(t)).sort((i,s)=>i.localeCompare(s,"zh-CN"));for(let i of a){if(!i.startsWith(\`\${n}/\`))continue;let l=i.slice(n.length+1).split("/").filter(Boolean);if(l.length===0)continue;let d=n,u=o;for(let f=0;f<l.length;f+=1){let p=l[f],m=f===l.length-1;if(d=\`\${d}/\${p}\`,m)(u.children||[]).some(y=>y.path===d)||u.children.push({name:p,path:d,type:"file"});else{let g=r.get(d);g||(g={name:p,path:d,type:"directory",isExpanded:!0,children:[]},r.set(d,g),u.children.push(g)),u=g}}}return Yo(o),o}function ka(e,t){if(!t)return c.fileTree.get(e.id);let n=e.path.replace(/\\/+\$/,""),o=\`\${n}/\`,r=Array.from(Ve).filter(a=>a===n||a.startsWith(o));if(r.length!==0)return va(e,r)}function xa(){return c.config.workspaces.map(e=>e.path.trim()).filter(Boolean)}function Jo(){pe="",Ce="",me=!1,Ke=!1,Ve=new Set}async function Ta(e,t,n,o){try{let a=await ct(e,{roots:t,limit:200});if(o!==Dt)return;pe=e,Ce=n,Ve=new Set((a.files||[]).map(i=>i.path).filter(Boolean)),me=!1,Ke=!0}catch(a){if(o!==Dt)return;console.error("\\u5DE5\\u4F5C\\u533A\\u641C\\u7D22\\u5931\\u8D25:",a),pe=e,Ce=n,Ve=new Set,me=!1,Ke=!0}let{renderSidebar:r}=await Promise.resolve().then(()=>(F(),C));r()}function Ea(e){let t=e.trim();if(!t){Jo();return}if(t.startsWith("/")||t.startsWith("~/")||t.startsWith("~\\\\")){Jo();return}let n=xa(),o=n.join(\`
\`);if(n.length===0){pe=t,Ce=o,Ve=new Set,me=!1,Ke=!0;return}Ke&&!me&&pe===t&&Ce===o||me&&pe===t&&Ce===o||(Dt+=1,pe=t,Ce=o,me=!0,Ke=!1,Ve=new Set,Ta(t,n,o,Dt))}function Zo(){let e=document.getElementById(pt),t=document.getElementById(Qo);if(!t)return;let n=e?.value.trim()||"";t.textContent=n||"\\u8DEF\\u5F84\\u9884\\u89C8\\uFF1A\\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u540E\\u8FD9\\u91CC\\u4F1A\\u663E\\u793A\\u5B8C\\u6574\\u8DEF\\u5F84"}function Ma(){let e=document.getElementById(On);if(e)return e;let t=document.createElement("div");t.id=On,t.className="sync-dialog-overlay add-workspace-overlay",t.innerHTML=\`
    <div class="sync-dialog add-workspace-dialog">
      <div class="sync-dialog-header">
        <div class="sync-dialog-title">\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A</div>
        <button class="sync-dialog-close" onclick="closeAddWorkspaceDialog()">\\xD7</button>
      </div>
      <div class="sync-dialog-body">
        <div class="sync-dialog-field">
          <label class="sync-dialog-label">\\u{1F4C1} \\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84</label>
          <textarea
            id="\${pt}"
            class="sync-dialog-input workspace-path-input"
            rows="3"
            placeholder="/Users/huanghao/workspace/md-viewer"
          ></textarea>
          <div class="workspace-path-hint">\\u652F\\u6301\\u7C98\\u8D34\\u957F\\u8DEF\\u5F84\\u3002\\u6309 Ctrl/Cmd + Enter \\u5FEB\\u901F\\u786E\\u8BA4\\u3002</div>
          <div id="\${Qo}" class="workspace-path-preview">\\u8DEF\\u5F84\\u9884\\u89C8\\uFF1A\\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u540E\\u8FD9\\u91CC\\u4F1A\\u663E\\u793A\\u5B8C\\u6574\\u8DEF\\u5F84</div>
        </div>
      </div>
      <div class="sync-dialog-footer add-workspace-footer">
        <button class="sync-dialog-btn" onclick="closeAddWorkspaceDialog()">\\u53D6\\u6D88</button>
        <button class="sync-dialog-btn sync-dialog-btn-primary" onclick="confirmAddWorkspaceDialog()">\\u6DFB\\u52A0</button>
      </div>
    </div>
  \`,document.body.appendChild(t),t.addEventListener("click",o=>{o.target===t&&Rt()});let n=t.querySelector(\`#\${pt}\`);return n&&(Wt(n,{kind:"directory",markdownOnly:!1}),n.addEventListener("input",Zo),n.addEventListener("keydown",o=>{(o.metaKey||o.ctrlKey)&&o.key==="Enter"&&(o.preventDefault(),window.confirmAddWorkspaceDialog()),o.key==="Escape"&&(o.preventDefault(),Rt())})),t}function Sa(){Ma().classList.add("show");let t=document.getElementById(pt);t&&(t.value="",Zo(),t.focus())}function Rt(){let e=document.getElementById(On);e&&e.classList.remove("show")}async function Aa(){try{let e=document.getElementById(pt),t=e?.value.trim()||"";if(!t){Ko("\\u8BF7\\u8F93\\u5165\\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84"),e?.focus();return}let n=wa(t),{addWorkspace:o}=await Promise.resolve().then(()=>(mt(),ir)),r=o(n,t),{renderSidebar:a}=await Promise.resolve().then(()=>(F(),C));a(),Rt(),Q(\`\\u5DF2\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A: \${r.name}\`,2e3)}catch(e){console.error("\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",e),L(\`\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25: \${e?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)}}function er(){if(c.config.sidebarTab==="focus")return rr();let e=c.searchQuery.trim().toLowerCase();return Ea(e),\`\${La(e)}\`}function La(e){let t=c.config.workspaces,n=t.map((o,r)=>Ca(o,r,t.length,e)).filter(Boolean).join("");return\`
    <div class="workspace-section">
      \${t.length===0?Fa():""}
      \${t.length>0&&!n?'<div class="empty-workspace"><p>\\u672A\\u627E\\u5230\\u5339\\u914D\\u5185\\u5BB9</p></div>':""}
      \${n}
    </div>
  \`}function Fa(){return\`
    <div class="empty-workspace">
      <p>\\u6682\\u65E0\\u5DE5\\u4F5C\\u533A</p>
      <p style="font-size: 12px; color: #57606a; margin-top: 8px;">
        \\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u76EE\\u5F55\\u8DEF\\u5F84\\u540E\\u56DE\\u8F66\\u6DFB\\u52A0
      </p>
    </div>
  \`}function Ca(e,t,n,o){let r=c.currentWorkspace===e.id,a=o?ka(e,o):c.fileTree.get(e.id),i=a;if(a){let y=Je(a,e.path);y.size>0&&(i=Uo(a,y)??void 0)}let s=o?!0:e.isExpanded,l=s?"\\u25BC":"\\u25B6",d=t>0,u=t<n-1,f=!o||e.name.toLowerCase().includes(o)||e.path.toLowerCase().includes(o),p=!!i&&!!i.children&&i.children.length>0,m=s?Ia(e.id,e.path,i,o):"";return o&&!f&&!p&&!!!m?"":\`
    <div class="workspace-item">
      <div class="workspace-header \${r?"active":""}" onclick="handleWorkspaceToggle('\${T(e.id)}')">
        <span class="workspace-toggle">\${l}</span>
        <span class="workspace-icon">\\u{1F4C1}</span>
        <span class="workspace-name">\${x(e.name)}</span>
        \${dt===e.id?\`
          <div class="workspace-remove-actions" onclick="event.stopPropagation()">
            \${d?\`
            <button
              class="workspace-order-btn"
              title="\\u4E0A\\u79FB"
              onclick="handleMoveWorkspaceUp('\${T(e.id)}')"
            >\\u2191</button>
            \`:""}
            \${u?\`
            <button
              class="workspace-order-btn"
              title="\\u4E0B\\u79FB"
              onclick="handleMoveWorkspaceDown('\${T(e.id)}')"
            >\\u2193</button>
            \`:""}
            <button
              class="workspace-remove-confirm"
              title="\\u786E\\u8BA4\\u79FB\\u9664"
              onclick="handleConfirmRemoveWorkspace('\${T(e.id)}')"
            >\\u5220</button>
          </div>
        \`:\`
          <div class="workspace-remove-actions" onclick="event.stopPropagation()">
            \${d?\`
            <button
              class="workspace-order-btn"
              title="\\u4E0A\\u79FB"
              onclick="handleMoveWorkspaceUp('\${T(e.id)}')"
            >\\u2191</button>
            \`:""}
            \${u?\`
            <button
              class="workspace-order-btn"
              title="\\u4E0B\\u79FB"
              onclick="handleMoveWorkspaceDown('\${T(e.id)}')"
            >\\u2193</button>
            \`:""}
          <button
            class="workspace-remove"
            title="\\u79FB\\u9664\\u5DE5\\u4F5C\\u533A"
            onclick="event.stopPropagation();handleAskRemoveWorkspace('\${T(e.id)}')"
          >
            \\xD7
          </button>
          </div>
        \`}
      </div>
      \${s?\$a(e.id,i,o):""}
      \${m}
    </div>
  \`}function \$a(e,t,n){return n&&me&&pe===n?\`
      <div class="file-tree loading">
        <div class="tree-loading">\\u641C\\u7D22\\u4E2D...</div>
      </div>
    \`:ut.has(e)?\`
      <div class="file-tree loading">
        <div class="tree-loading">\\u52A0\\u8F7D\\u4E2D...</div>
      </div>
    \`:ze.has(e)?\`
      <div class="file-tree empty">
        <div class="tree-empty" onclick="retryWorkspaceScan('\${T(e)}')" style="cursor: pointer;">\\u52A0\\u8F7D\\u5931\\u8D25\\uFF0C\\u70B9\\u51FB\\u91CD\\u8BD5</div>
      </div>
    \`:t?!t.children||t.children.length===0?\`
      <div class="file-tree empty">
        <div class="tree-empty">\${n?"\\u672A\\u627E\\u5230\\u5339\\u914D\\u6587\\u4EF6":"\\u6B64\\u76EE\\u5F55\\u4E0B\\u6CA1\\u6709 Markdown/HTML \\u6587\\u4EF6"}</div>
      </div>
    \`:\`
    <div class="file-tree">
      \${t.children.map(o=>tr(e,o,1)).join("")}
    </div>
  \`:\`
      <div class="file-tree empty">
        <div class="tree-empty">\${n?"\\u672A\\u627E\\u5230\\u5339\\u914D\\u6587\\u4EF6":"\\u76EE\\u5F55\\u6682\\u4E0D\\u53EF\\u7528"}</div>
      </div>
    \`}function tr(e,t,n){let o=4+n*8,r=c.currentFile===t.path;if(t.type==="file"){let l=We(t.path),d=q(t.path),u=!!l?.isMissing||mn(t.path),f=Se(t.path),p=rt(t.path),m="&nbsp;";if(l){let E=U(l,d);E.badge==="dot"?m='<span class="new-dot"></span>':E.badge&&(m=\`<span class="status-badge status-\${E.type}" style="color: \${E.color}">\${E.badge}</span>\`)}else u?m='<span class="status-badge status-deleted" style="color: #cf222e">D</span>':p?m='<span class="status-badge status-modified" style="color: #ff9500">M</span>':d&&(m='<span class="new-dot"></span>');let g=["tree-item","file-node",u?"missing":"",r?"current":""].filter(Boolean).join(" "),y=c.annotationCounts.get(t.path)??0,b=y>0?\`<span class="annotation-count-badge">\${y}</span>\`:"",k=In(t.path),w=\`<button
  class="tree-pin-btn\${k?" active":""}"
  title="\${k?"\\u53D6\\u6D88\\u56FA\\u5B9A\\u5230\\u7126\\u70B9\\u89C6\\u56FE":"\\u56FA\\u5B9A\\u5230\\u7126\\u70B9\\u89C6\\u56FE"}"
  onclick="event.stopPropagation();\${k?"handleUnpinFile":"handlePinFile"}('\${T(t.path)}')"
>\\u{1F4CC}</button>\`;return\`
      <div class="tree-node">
        <div class="\${g}"
             onclick="handleFileClick('\${T(t.path)}')">
          <span class="tree-indent" style="width: \${o}px"></span>
          <span class="tree-toggle"></span>
          <span class="file-type-icon \${f.cls}">\${x(f.label)}</span>
          <span class="tree-status-inline">\${m}</span>
          <span class="tree-name" title="\${T(t.name)}">\${Go(t.name)}</span>
          \${b}
          \${w}
        </div>
      </div>
    \`}let a=t.isExpanded!==!1,i=a?"\\u25BC":"\\u25B6",s=t.children&&t.children.length>0;return\`
    <div class="tree-node">
      <div class="tree-item directory-node">
        <span class="tree-indent" style="width: \${o}px"></span>
        <span class="tree-toggle" onclick="\${s?\`event.stopPropagation();handleNodeClick('\${T(e)}', '\${T(t.path)}')\`:""}">\${s?i:""}</span>
        <span class="tree-name" onclick="\${s?\`event.stopPropagation();handleNodeClick('\${T(e)}', '\${T(t.path)}')\`:""}">\${x(t.name)}</span>
        \${t.fileCount?\`<span class="tree-count">\${t.fileCount}</span>\`:""}
      </div>
      \${a&&s?\`
        <div class="file-tree">
          \${t.children.map(l=>tr(e,l,n+1)).join("")}
        </div>
      \`:""}
    </div>
  \`}function Ia(e,t,n,o){let r=new Set;Xo(n,r);let a=\`\${t}/\`,i=Tn().filter(u=>!u.isMissing||!u.path.startsWith(a)||r.has(u.path)?!1:o?u.name.toLowerCase().includes(o)||u.path.toLowerCase().includes(o):!0),s=new Set(i.map(u=>u.path)),l=fn(t).filter(u=>!s.has(u)).filter(u=>!r.has(u)).filter(u=>{if(!o)return!0;let f=u.toLowerCase(),p=(u.split("/").pop()||"").toLowerCase();return f.includes(o)||p.includes(o)});return i.length===0&&l.length===0?"":\`
    <div class="tree-missing-section">
      <div class="tree-missing-title">\\u5DF2\\u5220\\u9664</div>
      \${[...i.map(u=>({path:u.path,name:u.path.split("/").pop()||u.name,isCurrent:c.currentFile===u.path,hasRetry:!0,hasClose:!0})),...l.map(u=>({path:u,name:u.split("/").pop()||u,isCurrent:c.currentFile===u,hasRetry:!1,hasClose:!1}))].map(u=>{let f=Se(u.path);return\`
          <div class="tree-item file-node missing \${u.isCurrent?"current":""}" onclick="handleFileClick('\${T(u.path)}')">
            <span class="tree-indent" style="width: 12px"></span>
            <span class="tree-toggle"></span>
            <span class="file-type-icon \${f.cls}">\${x(f.label)}</span>
            <span class="tree-status-inline"><span class="status-badge status-deleted">D</span></span>
            <span class="tree-name" title="\${T(u.name)}">\${Go(u.name)}</span>
            \${u.hasRetry?\`<button class="tree-inline-action" title="\\u91CD\\u8BD5\\u52A0\\u8F7D" onclick="event.stopPropagation(); handleRetryMissingFile('\${T(u.path)}')">\\u21BB</button>\`:""}
            \${u.hasClose?\`<button class="tree-inline-action danger" title="\\u5173\\u95ED\\u6587\\u4EF6" onclick="event.stopPropagation(); handleCloseFile('\${T(u.path)}')">\\xD7</button>\`:""}
          </div>
        \`}).join("")}
    </div>
  \`}function nr(){Vo||(Vo=!0,document.addEventListener("click",async e=>{if(!dt)return;let t=e.target;if(!t||t.closest(".workspace-remove-actions")||t.closest(".workspace-remove"))return;dt=null;let{renderSidebar:n}=await Promise.resolve().then(()=>(F(),C));n()})),window.handleWorkspaceToggle=async e=>{let t=c.config.workspaces.find(o=>o.id===e);if(!t)return;if(c.currentWorkspace=e,c.searchQuery.trim()){let{renderSidebar:o}=await Promise.resolve().then(()=>(F(),C));o();return}if(zn(e),t.isExpanded&&!c.fileTree.has(e)){ut.add(e),ze.delete(e);let{renderSidebar:o}=await Promise.resolve().then(()=>(F(),C));o();let r=await G(e);ut.delete(e),r?ze.delete(e):(ze.add(e),L(\`\\u5DE5\\u4F5C\\u533A\\u626B\\u63CF\\u5931\\u8D25\\uFF1A\${t.name}\`))}let{renderSidebar:n}=await Promise.resolve().then(()=>(F(),C));n()},window.retryWorkspaceScan=async e=>{ut.add(e),ze.delete(e);let{renderSidebar:t}=await Promise.resolve().then(()=>(F(),C));t();let n=await G(e);ut.delete(e),n||(ze.add(e),L("\\u91CD\\u8BD5\\u5931\\u8D25\\uFF0C\\u8BF7\\u68C0\\u67E5\\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84\\u662F\\u5426\\u53EF\\u8BBF\\u95EE")),t()},window.handleAskRemoveWorkspace=async e=>{dt=e;let{renderSidebar:t}=await Promise.resolve().then(()=>(F(),C));t()},window.handleConfirmRemoveWorkspace=async e=>{let t=c.config.workspaces.find(o=>o.id===e);if(!t)return;_n(e),dt=null;let{renderSidebar:n}=await Promise.resolve().then(()=>(F(),C));n(),Q(\`\\u5DF2\\u79FB\\u9664\\u5DE5\\u4F5C\\u533A: \${t.name}\`,2e3)},window.handleNodeClick=async(e,t)=>{Kn(e,t);let{renderSidebar:n}=await Promise.resolve().then(()=>(F(),C));n()},window.handleFileClick=async e=>{Ft(e),z(e);let{loadFile:t}=await Promise.resolve().then(()=>(Ae(),jt));if(It(e))window.switchFile?.(e);else{let n=await t(e,!0);if(!n){let{markFileMissing:a}=await Promise.resolve().then(()=>(H(),Ee));a(e,!0),(await Promise.resolve().then(()=>(Fe(),Le))).renderAll(),L("\\u6587\\u4EF6\\u5DF2\\u5220\\u9664\\uFF0C\\u5DF2\\u6807\\u8BB0\\u4E3A D\\uFF08\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\uFF09");return}let{addOrUpdateFile:o}=await Promise.resolve().then(()=>(H(),Ee));o(n,!0),(await Promise.resolve().then(()=>(Fe(),Le))).renderAll()}},window.handleCloseFile=async e=>{let{removeFile:t}=await Promise.resolve().then(()=>(H(),Ee));t(e),(await Promise.resolve().then(()=>(Fe(),Le))).renderAll()},window.handleRetryMissingFile=async e=>{let{loadFile:t}=await Promise.resolve().then(()=>(Ae(),jt)),{addOrUpdateFile:n}=await Promise.resolve().then(()=>(H(),Ee)),o=await t(e);if(!o)return;n(o,c.currentFile===e),(await Promise.resolve().then(()=>(Fe(),Le))).renderAll(),Q("\\u6587\\u4EF6\\u5DF2\\u91CD\\u65B0\\u52A0\\u8F7D",2e3)},window.showAddWorkspaceDialog=Sa,window.closeAddWorkspaceDialog=Rt,window.confirmAddWorkspaceDialog=Aa,window.handleMoveWorkspaceUp=async e=>{Ot(e,-1);let{renderSidebar:t}=await Promise.resolve().then(()=>(F(),C));t()},window.handleMoveWorkspaceDown=async e=>{Ot(e,1);let{renderSidebar:t}=await Promise.resolve().then(()=>(F(),C));t()},window.handleFocusFileClick=async e=>{Ft(e),z(e);let{loadFile:t}=await Promise.resolve().then(()=>(Ae(),jt));if(It(e))window.switchFile?.(e);else{let n=await t(e,!0);if(!n){let{markFileMissing:a}=await Promise.resolve().then(()=>(H(),Ee));a(e,!0),(await Promise.resolve().then(()=>(Fe(),Le))).renderAll(),L("\\u6587\\u4EF6\\u5DF2\\u5220\\u9664\\uFF0C\\u5DF2\\u6807\\u8BB0\\u4E3A D\\uFF08\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\uFF09");return}let{addOrUpdateFile:o}=await Promise.resolve().then(()=>(H(),Ee));o(n,!0),(await Promise.resolve().then(()=>(Fe(),Le))).renderAll()}},window.handleUnpinFile=async e=>{let{unpinFile:t}=await Promise.resolve().then(()=>(lt(),Bn));t(e);let{renderSidebar:n}=await Promise.resolve().then(()=>(F(),C));n()},window.handlePinFile=async e=>{let{pinFile:t}=await Promise.resolve().then(()=>(lt(),Bn));t(e);let{renderSidebar:n}=await Promise.resolve().then(()=>(F(),C));n()},window.handleFocusWorkspaceToggle=e=>{},window.setFocusWindowKey=e=>{c.config.focusWindowKey=e,Promise.resolve().then(()=>(je(),Ao)).then(({saveConfig:t})=>t(c.config)),Promise.resolve().then(()=>(F(),C)).then(({renderSidebar:t})=>t())}}var On,pt,Qo,dt,Vo,ut,ze,pe,Ce,me,Ke,Ve,Dt,or=v(()=>{"use strict";H();qn();de();Ae();Me();Pt();at();\$n();qe();Rn();mt();de();lt();qt();On="addWorkspaceDialogOverlay",pt="addWorkspacePathInput",Qo="addWorkspacePathPreview",dt=null,Vo=!1,ut=new Set,ze=new Set,pe="",Ce="",me=!1,Ke=!1,Ve=new Set,Dt=0});function ar(e){let t=[0];for(let n of e){let o=n.nodeValue?.length??0;t.push(t[t.length-1]+o)}return{nodes:e,cumulative:t,totalLength:t[t.length-1]}}function sr(e,t){if(e.nodes.length===0)return null;if(t>=e.totalLength){let r=e.nodes[e.nodes.length-1];return{node:r,offset:r.nodeValue?.length??0}}let n=0,o=e.nodes.length-1;for(;n<o;){let r=n+o+1>>1;e.cumulative[r]<=t?n=r:o=r-1}return{node:e.nodes[n],offset:t-e.cumulative[n]}}function lr(e){let t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),n=[],o;for(;o=t.nextNode();)o.nodeValue&&o.nodeValue.length>0&&n.push(o);return n}var cr=v(()=>{"use strict"});async function ft(e){let t=await e.json().catch(()=>null);if(!e.ok)throw new Error(t?.error||\`HTTP \${e.status}\`);return t}async function dr(e){let t=await fetch(\`/api/annotations?path=\${encodeURIComponent(e)}\`),n=await ft(t);return Array.isArray(n?.annotations)?n.annotations:[]}async function ur(e,t){let n=await fetch("/api/annotations/item",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,annotation:t})}),o=await ft(n);if(o?.success!==!0||!o?.annotation)throw new Error(o?.error||"\\u4FDD\\u5B58\\u8BC4\\u8BBA\\u5931\\u8D25");return o.annotation}async function pr(e,t,n,o){let r=await fetch("/api/annotations/reply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,...t,text:n,author:o})}),a=await ft(r);if(a?.success!==!0||!a?.annotation)throw new Error(a?.error||"\\u56DE\\u590D\\u8BC4\\u8BBA\\u5931\\u8D25");return a.annotation}async function mr(e,t){let n=await fetch("/api/annotations/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,...t})}),o=await ft(n);if(o?.success!==!0)throw new Error(o?.error||"\\u5220\\u9664\\u8BC4\\u8BBA\\u5931\\u8D25")}async function fr(e,t,n){let o=await fetch("/api/annotations/status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,...t,status:n})}),r=await ft(o);if(r?.success!==!0||!r?.annotation)throw new Error(r?.error||"\\u66F4\\u65B0\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25");return r.annotation}async function gr(){try{let e=await fetch("/api/annotations/summaries"),t=await e.json().catch(()=>null);return!e.ok||!t?.summaries?new Map:new Map(Object.entries(t.summaries).map(([n,o])=>[n,Number(o)]))}catch{return new Map}}var Vn=v(()=>{"use strict"});function Pa(e,t){if(!t)return[];let n=[],o=e.indexOf(t);for(;o>=0;)n.push(o),o=e.indexOf(t,o+1);return n}function Ba(e,t,n,o){let r=0,a=Math.max(0,o.start||0),i=Math.abs(n-a);if(r+=Math.max(0,1e3-Math.min(1e3,i)),o.quotePrefix&&e.slice(Math.max(0,n-o.quotePrefix.length),n)===o.quotePrefix&&(r+=500),o.quoteSuffix){let s=n+t.length;e.slice(s,s+o.quoteSuffix.length)===o.quoteSuffix&&(r+=500)}return r}function hr(e,t){if(!e||!t.quote||t.length<=0)return{start:t.start||0,length:Math.max(1,t.length||t.quote?.length||1),confidence:0,status:"unanchored"};let n=Math.max(0,t.start||0),o=n+Math.max(1,t.length||t.quote.length);if(o<=e.length&&e.slice(n,o)===t.quote)return{start:n,length:t.length,confidence:1,status:"anchored"};let r=Pa(e,t.quote);if(r.length===0)return{start:n,length:Math.max(1,t.length||t.quote.length),confidence:0,status:"unanchored"};if(r.length===1)return{start:r[0],length:t.quote.length,confidence:.8,status:"anchored"};let a=r[0],i=Number.NEGATIVE_INFINITY;for(let s of r){let l=Ba(e,t.quote,s,t);l>i&&(i=l,a=s)}return{start:a,length:t.quote.length,confidence:.6,status:"anchored"}}var yr=v(()=>{"use strict"});function ja(){try{return typeof localStorage>"u"?"default":localStorage.getItem("md-viewer:annotation-density")==="simple"?"simple":"default"}catch{return"default"}}function Jn(e){return e.reduce((n,o)=>typeof o.serial!="number"||!Number.isFinite(o.serial)?n:Math.max(n,o.serial),0)+1}function Wa(e){let t=Number.isFinite(e.createdAt)?e.createdAt:Date.now(),o=(Array.isArray(e.thread)?e.thread:[]).map((r,a)=>{if(!r||typeof r!="object")return null;let i=String(r.note||"").trim();if(!i)return null;let l=String(r.type||(a===0?"comment":"reply"))==="reply"?"reply":"comment",d=Number(r.createdAt),u=Number.isFinite(d)?Math.floor(d):t+a;return{id:String(r.id||"").trim()||\`\${l}-\${u}-\${Math.random().toString(16).slice(2,8)}\`,type:l,note:i,createdAt:u}}).filter(r=>!!r).sort((r,a)=>r.createdAt-a.createdAt);if(o.length===0){let r=String(e.note||"").trim();return r?[{id:\`c-\${e.id||t}\`,type:"comment",note:r,createdAt:t}]:[]}o[0].type="comment";for(let r=1;r<o.length;r+=1)o[r].type="reply";return o}function Ar(e){let t=Wa(e),n=JSON.stringify(e.thread||[]),o=JSON.stringify(t);return e.thread=t,e.note=t[0]?.note||e.note||"",n!==o}function Da(e){let t=!1;for(let n of e)Ar(n)&&(t=!0);return t}function Ra(e){let t=!1,n=e.map((r,a)=>({ann:r,index:a}));n.sort((r,a)=>{let i=Number.isFinite(r.ann.createdAt)?r.ann.createdAt:0,s=Number.isFinite(a.ann.createdAt)?a.ann.createdAt:0;return i!==s?i-s:r.index-a.index});let o=1;for(let{ann:r}of n){if(typeof r.serial=="number"&&Number.isFinite(r.serial)&&r.serial>0){o=Math.max(o,r.serial+1);continue}r.serial=o,o+=1,t=!0}return t}function Lr(e){let t=h.annotations.findIndex(n=>n.id===e.id);if(t>=0){h.annotations[t]=e;return}h.annotations.push(e)}function Un(e,t,n="\\u8BC4\\u8BBA\\u4FDD\\u5B58\\u5931\\u8D25"){ur(e,t).then(o=>{h.currentFilePath===e&&(Lr(o),N(e),W())}).catch(o=>{L(\`\${n}: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)})}function Fr(e,t,n="\\u8BC4\\u8BBA\\u4FDD\\u5B58\\u5931\\u8D25"){for(let o of t)Un(e,o,n)}function Cr(e){if(h.currentFilePath=e,e?(h.annotations=[],Oa(e)):h.annotations=[],h.pinnedAnnotationId=null,h.activeAnnotationId=null,h.pendingAnnotation=null,h.pendingAnnotationFilePath=null,gt(),Qe(!0),ye(!0),e){let n=Pr()[e]===!0;Ue(!n)}else Ue(!0)}async function Oa(e){try{let t=await dr(e);if(!Array.isArray(t)||h.currentFilePath!==e)return;h.annotations=t;let n=Da(h.annotations),o=Ra(h.annotations);(n||o)&&Fr(e,h.annotations),N(e),W()}catch(t){if(h.currentFilePath!==e)return;L(\`\\u8BC4\\u8BBA\\u52A0\\u8F7D\\u5931\\u8D25: \${t?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)}}function S(){return{sidebar:document.getElementById("annotationSidebar"),sidebarResizer:document.getElementById("annotationSidebarResizer"),reader:document.getElementById("reader"),content:document.getElementById("content"),composer:document.getElementById("annotationComposer"),composerHeader:document.getElementById("annotationComposerHeader"),composerNote:document.getElementById("composerNote"),quickAdd:document.getElementById("annotationQuickAdd"),popover:document.getElementById("annotationPopover"),popoverTitle:document.getElementById("popoverTitle"),popoverNote:document.getElementById("popoverNote"),popoverResolveBtn:document.getElementById("popoverResolveBtn"),popoverPrevBtn:document.getElementById("popoverPrevBtn"),popoverNextBtn:document.getElementById("popoverNextBtn"),annotationList:document.getElementById("annotationList"),annotationCount:document.getElementById("annotationCount"),filterMenu:document.getElementById("annotationFilterMenu"),filterToggle:document.getElementById("annotationFilterToggle"),densityToggle:document.getElementById("annotationDensityToggle"),closeToggle:document.getElementById("annotationSidebarClose"),floatingOpenBtn:document.getElementById("annotationFloatingOpenBtn")}}function Qn(e){let t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),n=[],o;for(;o=t.nextNode();)o.nodeValue&&o.nodeValue.length>0&&n.push(o);return n}function br(e,t,n){let o=Qn(e),r=0;for(let a of o){if(a===t)return r+n;r+=a.nodeValue?.length||0}return-1}function _t(e,t,n){if(n)return sr(n,t);let o=Qn(e),r=0;for(let i of o){let s=i.nodeValue?.length||0,l=r+s;if(t<=l)return{node:i,offset:Math.max(0,t-r)};r=l}if(o.length===0)return null;let a=o[o.length-1];return{node:a,offset:a.nodeValue?.length||0}}function zt(e,t,n){return Math.max(t,Math.min(n,e))}function Gn(e,t,n){let a=zt(t,8,window.innerWidth-360-8),i=zt(n,8,window.innerHeight-220-8);e.style.left=\`\${a}px\`,e.style.top=\`\${i}px\`}function \$r(e){return Qn(e).map(t=>t.nodeValue||"").join("")}function ge(e){return e.status==="resolved"}function Xn(e){return e.status==="unanchored"?"orphan":(e.confidence||0)>=.95?"exact":"reanchored"}function qa(e,t){let n=e.status==="unanchored"||Xn(e)==="orphan";return t==="all"?!0:t==="open"?!ge(e)&&!n:t==="resolved"?ge(e)&&!n:t==="orphan"?n:!0}function Ir(){return h.currentFilePath}function _(){let e=h.currentFilePath,t=document.getElementById("content")?.getAttribute("data-current-file")||null;return e?t?t===e?e:null:e:null}function Kt(e,t){if(!e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return!1;let n=e.key.toLowerCase(),{value:o,selectionStart:r,selectionEnd:a}=t;if(r===null||a===null)return!1;let i=d=>{t.selectionStart=d,t.selectionEnd=d},s=d=>{let u=o.lastIndexOf(\`
\`,d-1);return u===-1?0:u+1},l=d=>{let u=o.indexOf(\`
\`,d);return u===-1?o.length:u};switch(n){case"a":return i(s(r)),!0;case"e":return i(l(r)),!0;case"b":return i(Math.max(0,r-1)),!0;case"f":return i(Math.min(o.length,r+1)),!0;case"n":{let d=l(r);return i(d===o.length?d:Math.min(o.length,d+1+(r-s(r)))),!0}case"p":{let d=s(r);if(d===0)return i(0),!0;let u=s(d-1),f=d-1-u;return i(u+Math.min(r-d,f)),!0}case"d":return r<o.length&&(t.value=o.slice(0,r)+o.slice(r+1),i(r),t.dispatchEvent(new Event("input"))),!0;case"k":{let d=l(r),u=r===d&&d<o.length?d+1:d;return t.value=o.slice(0,r)+o.slice(u),i(r),t.dispatchEvent(new Event("input")),!0}case"u":{let d=s(r);return t.value=o.slice(0,d)+o.slice(r),i(d),t.dispatchEvent(new Event("input")),!0}case"w":{let d=r;for(;d>0&&/\\s/.test(o[d-1]);)d--;for(;d>0&&!/\\s/.test(o[d-1]);)d--;return t.value=o.slice(0,d)+o.slice(r),i(d),t.dispatchEvent(new Event("input")),!0}case"h":return r>0&&(t.value=o.slice(0,r-1)+o.slice(r),i(r-1),t.dispatchEvent(new Event("input"))),!0;default:return!1}}function fe(e){return e==="up"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4l4 4H4z"/></svg>':e==="down"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12l-4-4h8z"/></svg>':e==="check"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.4 11.2L3.5 8.3l1.1-1.1 1.8 1.8 5-5 1.1 1.1z"/></svg>':e==="trash"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2h4l1 1h3v1H2V3h3l1-1zm-1 4h1v7H5V6zm3 0h1v7H8V6zm3 0h1v7h-1V6z"/></svg>':e==="comment"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h12v9H8l-3 3v-3H2z"/></svg>':e==="list"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h10v1H3zm0 4h10v1H3zm0 4h10v1H3z"/></svg>':e==="filter"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12L9.5 8v4.5l-3-1.5V8z"/></svg>':e==="edit"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.5 2.5a1.5 1.5 0 012.1 2.1L5 13.2l-3 .8.8-3 8.7-8.5z"/></svg>':e==="reopen"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 1.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zM6 5.5l4 2.5-4 2.5V5.5z"/></svg>':'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 4.2L8 8l3.8-3.8 1 1L9 9l3.8 3.8-1 1L8 10l-3.8 3.8-1-1L7 9 3.2 5.2z"/></svg>'}function Ut(){return[...h.annotations].filter(e=>qa(e,h.filter)).sort((e,t)=>e.start-t.start)}function _a(){let e=S();if(e.filterMenu?.querySelectorAll(".annotation-filter-item[data-filter]").forEach(t=>{let n=t;n.classList.toggle("is-active",n.getAttribute("data-filter")===h.filter)}),e.densityToggle&&(e.densityToggle.classList.toggle("is-simple",h.density==="simple"),e.densityToggle.title=h.density==="simple"?"\\u5207\\u6362\\u5230\\u9ED8\\u8BA4\\u5217\\u8868":"\\u5207\\u6362\\u5230\\u6781\\u7B80\\u5217\\u8868"),e.filterToggle){let t={all:"\\u7B5B\\u9009\\uFF1A\\u5168\\u90E8",open:"\\u7B5B\\u9009\\uFF1A\\u672A\\u89E3\\u51B3",resolved:"\\u7B5B\\u9009\\uFF1A\\u5DF2\\u89E3\\u51B3",orphan:"\\u7B5B\\u9009\\uFF1A\\u5B9A\\u4F4D\\u5931\\u8D25"};e.filterToggle.title=t[h.filter]}}function za(){let e=S();e.annotationCount&&(e.annotationCount.textContent=String(Ut().length))}function Ue(e){let t=S();t.sidebar&&(t.sidebar.classList.toggle("collapsed",e),document.body.classList.toggle("annotation-sidebar-collapsed",e),e&&(t.filterMenu?.classList.add("hidden"),Qe(!0),ye(!0)))}function Pr(){try{let e=localStorage.getItem(Sr);if(!e)return{};let t=JSON.parse(e);return t&&typeof t=="object"?t:{}}catch{return{}}}function Ka(e){localStorage.setItem(Sr,JSON.stringify(e))}function Br(e){if(!h.currentFilePath)return;let t=Pr();t[h.currentFilePath]=e,Ka(t)}function Va(e){return Math.max(Na,Math.min(Ha,Math.round(e)))}function Nr(e){let t=Va(e);document.documentElement.style.setProperty("--annotation-sidebar-width",\`\${t}px\`),localStorage.setItem(Er,String(t))}function Ja(){let e=Number(localStorage.getItem(Er)),t=Number.isFinite(e)&&e>0?e:Mr;Nr(t)}function he(){let e=S();if(!e.sidebar)return;let t=document.getElementById("tabs"),n=Math.max(0,Math.round(t?.getBoundingClientRect().bottom||84)),o=Math.max(0,window.innerHeight-n);e.sidebar.style.top=\`\${n}px\`,e.sidebar.style.height=\`\${o}px\`,e.sidebarResizer&&(e.sidebarResizer.style.top=\`\${n}px\`,e.sidebarResizer.style.height=\`\${o}px\`),e.floatingOpenBtn&&(e.floatingOpenBtn.style.top=\`\${n+6}px\`)}function wr(){Ue(!1),Br(!0),he(),eo()}function vr(){Ue(!0),Br(!1)}function Ua(){let e=S().sidebar;e&&Ue(!e.classList.contains("collapsed"))}function Hr(){let e=S();return e.filterMenu&&!e.filterMenu.classList.contains("hidden")?(e.filterMenu.classList.add("hidden"),!0):e.quickAdd&&!e.quickAdd.classList.contains("hidden")?(Qe(!0),!0):e.composer&&!e.composer.classList.contains("hidden")?(gt(),!0):e.popover&&!e.popover.classList.contains("hidden")?(h.pinnedAnnotationId=null,ye(!0),!0):!1}function Qa(e,t){return e==="resolved"?"resolved":t}function Ga(e,t,n){let o=S();if(!o.quickAdd)return;o.composer&&!o.composer.classList.contains("hidden")&&gt(),h.pendingAnnotation={...n,note:"",createdAt:Date.now()},h.pendingAnnotationFilePath=o.content?.getAttribute("data-current-file")||h.currentFilePath;let r=30,a=30,i=zt(e,8,window.innerWidth-r-8),s=zt(t,8,window.innerHeight-a-8);o.quickAdd.style.left=\`\${i}px\`,o.quickAdd.style.top=\`\${s}px\`,o.quickAdd.classList.remove("hidden")}function Qe(e=!1){let t=S();t.quickAdd&&(t.quickAdd.classList.add("hidden"),e&&(Yn(),h.pendingAnnotation=null,h.pendingAnnotationFilePath=null))}function jr(e,t){let n=S();if(!h.pendingAnnotation||!n.composer||!n.composerNote)return;Za(),n.composerNote.value="",Rr(n.composerNote);let o=typeof e=="number"?e:n.quickAdd?Number.parseFloat(n.quickAdd.style.left||"0"):0,r=typeof t=="number"?t:n.quickAdd?Number.parseFloat(n.quickAdd.style.top||"0"):0;Gn(n.composer,o,r+34),n.composer.classList.remove("hidden"),Qe(!1),n.composerNote.focus()}function Xa(){let e=S();e.composer&&e.composer.classList.add("hidden")}function Ya(){let e=S();if(!e.composer||!h.pendingAnnotation)return;let n=document.getElementById("reader")?.querySelector(".annotation-mark-temp");if(n){let o=n.getBoundingClientRect();Gn(e.composer,o.right+6,o.top-8)}e.composer.classList.remove("hidden"),e.composerNote?.focus()}function gt(){let e=S();e.composer&&(Yn(),h.pendingAnnotation=null,h.pendingAnnotationFilePath=null,e.composerNote&&(e.composerNote.value=""),e.composer.classList.add("hidden"))}function Yn(){document.querySelectorAll(".pdf-selection-mark").forEach(n=>n.classList.remove("pdf-selection-mark"));let e=document.getElementById("reader");if(!e)return;let t=Array.from(e.querySelectorAll(".annotation-mark-temp"));for(let n of t){let o=n.parentNode;for(;n.firstChild;)o?.insertBefore(n.firstChild,n);o?.removeChild(n)}}function Za(){let e=S();if(!e.reader||!h.pendingAnnotation)return;Yn();let t=h.pendingAnnotation,n=_t(e.reader,t.start),o=_t(e.reader,t.start+t.length);if(!(!n||!o)&&!(n.node===o.node&&n.offset===o.offset)){if(n.node===o.node){let r=document.createRange();r.setStart(n.node,n.offset),r.setEnd(o.node,o.offset);let a=document.createElement("span");a.className="annotation-mark-temp";try{r.surroundContents(a)}catch{}return}try{let r=[],a=document.createTreeWalker(e.reader,NodeFilter.SHOW_TEXT,null,!1),i;for(;i=a.nextNode();){let s=document.createRange();s.selectNode(i);let l=document.createRange();l.setStart(n.node,n.offset),l.setEnd(o.node,o.offset);let d=l.compareBoundaryPoints(Range.END_TO_START,s),u=l.compareBoundaryPoints(Range.START_TO_END,s);if(d>0||u<0)continue;let f=i===n.node?n.offset:0,p=i===o.node?o.offset:i.nodeValue?.length||0;f<p&&r.push({node:i,start:f,end:p})}for(let s=r.length-1;s>=0;s--){let{node:l,start:d,end:u}=r[s],f=document.createRange();f.setStart(l,d),f.setEnd(l,u);let p=document.createElement("span");p.className="annotation-mark-temp",f.surroundContents(p)}}catch{}}}function Zn(e){return Ar(e),e.thread||[]}function Wr(e,t=!1){let n=Zn(e),o=n[0],r=n.slice(1);return t?\`
      <div class="annotation-note simple">\${x(o?.note||e.note||"\\uFF08\\u65E0\\u8BC4\\u8BBA\\u5185\\u5BB9\\uFF09")}</div>
      \${r.length>0?\`<div class="annotation-reply-count">\\u56DE\\u590D \${r.length}</div>\`:""}
    \`:n.map(i=>\`
      <div class="annotation-thread-line \${i.type==="reply"?"is-reply":""}" data-thread-item-id="\${i.id}" data-annotation-id="\${e.id}">
        <span class="annotation-thread-text">\${x(i.note)}</span>
        <button class="annotation-thread-edit-btn" data-edit-thread-item="\${i.id}" data-annotation-id="\${e.id}" title="\\u7F16\\u8F91">\${fe("edit")}</button>
      </div>\`).join("")||'<div class="annotation-thread-line">\\uFF08\\u65E0\\u8BC4\\u8BBA\\u5185\\u5BB9\\uFF09</div>'}function Dr(e,t,n){let o=h.annotations.find(s=>s.id===e);if(!o)return;let r=n.trim();if(!r)return;let a=Zn(o),i=Date.now();a.push({id:\`r-\${i}-\${Math.random().toString(16).slice(2,8)}\`,type:"reply",note:r,createdAt:i}),o.thread=a,o.note=a[0]?.note||o.note,pr(t,{id:e},r,"me").then(s=>{h.currentFilePath===t&&(Lr(s),N(t),W())}).catch(s=>{L(\`\\u56DE\\u590D\\u8BC4\\u8BBA\\u5931\\u8D25: \${s?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)})}function Vt(e,t,n){let o=document.querySelector(\`.annotation-thread-line[data-thread-item-id="\${t}"][data-annotation-id="\${e}"]\`);if(!o)return;let r=h.annotations.find(p=>p.id===e);if(!r)return;let a=Zn(r),i=a.find(p=>p.id===t);if(!i)return;let s=o.innerHTML;o.classList.add("is-editing"),o.innerHTML=\`<textarea class="annotation-thread-edit-input" placeholder="Cmd+Enter \\u4FDD\\u5B58\\uFF0CEsc \\u53D6\\u6D88">\${x(i.note)}</textarea>\`;let l=o.querySelector("textarea");l.style.height=\`\${Math.max(l.scrollHeight,34)}px\`,l.focus(),l.setSelectionRange(l.value.length,l.value.length);let d=!1,u=()=>{d||(d=!0,o.classList.remove("is-editing"),o.innerHTML=s,o.querySelector("[data-edit-thread-item]")?.addEventListener("click",p=>{p.stopPropagation(),Vt(e,t,n)}))},f=()=>{if(d)return;d=!0;let p=l.value.trim();if(!p||p===i.note){o.classList.remove("is-editing"),o.innerHTML=s,o.querySelector("[data-edit-thread-item]")?.addEventListener("click",m=>{m.stopPropagation(),Vt(e,t,n)});return}if(i.note=p,a[0]?.id===t&&(r.note=p),r.thread=a,Un(n,r,"\\u7F16\\u8F91\\u8BC4\\u8BBA\\u5931\\u8D25"),N(n),h.pinnedAnnotationId===e){let g=document.querySelector(\`[data-annotation-id="\${e}"]\`)?.getBoundingClientRect();ht(r,g?g.right+8:120,g?g.top+8:120)}};l.addEventListener("keydown",p=>{if(Kt(p,l)){p.preventDefault();return}p.key==="Escape"?(p.preventDefault(),u()):p.key==="Enter"&&(p.metaKey||p.ctrlKey)&&(p.preventDefault(),f())}),l.addEventListener("input",()=>{l.style.height="auto",l.style.height=\`\${Math.min(200,Math.max(l.scrollHeight,34))}px\`}),l.addEventListener("blur",p=>{let m=p.relatedTarget,g=o.closest(".annotation-item");m&&g&&g.contains(m)||setTimeout(()=>{d||u()},150)})}function \$e(e){e.style.height="auto";let t=160,n=Math.min(t,Math.max(e.scrollHeight,34));e.style.height=\`\${n}px\`,e.style.overflowY=e.scrollHeight>t?"auto":"hidden"}function Rr(e){e.style.height="auto";let t=200,n=Math.min(t,Math.max(e.scrollHeight,34));e.style.height=\`\${n}px\`,e.style.overflowY=e.scrollHeight>t?"auto":"hidden"}function ht(e,t,n){let o=S();if(!o.popover||!o.popoverTitle||!o.popoverNote)return;let r=e.quote.substring(0,22);o.popoverTitle.textContent=\`#\${e.serial||0} | \${r}\${e.quote.length>22?"...":""}\`;let a=Wr(e,!1);if(o.popoverNote.innerHTML=\`
    <div class="annotation-thread">\${a}</div>
    <div class="annotation-reply-entry" data-popover-reply-entry="\${e.id}" role="button" tabindex="0">
      <textarea rows="1" data-popover-reply-input="\${e.id}" placeholder="\\u8F93\\u5165\\u56DE\\u590D\\u5185\\u5BB9\\uFF08Cmd+Enter \\u63D0\\u4EA4\\uFF09"></textarea>
    </div>
  \`,o.popoverResolveBtn){let i=ge(e);o.popoverResolveBtn.title=i?"\\u91CD\\u65B0\\u6253\\u5F00":"\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3",o.popoverResolveBtn.setAttribute("aria-label",i?"\\u91CD\\u65B0\\u6253\\u5F00":"\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3"),o.popoverResolveBtn.innerHTML=fe(i?"reopen":"check"),o.popoverResolveBtn.classList.toggle("is-resolved",i)}o.popover.style.left=\`\${Math.round(t)}px\`,o.popover.style.top=\`\${Math.round(n)}px\`,o.popover.classList.remove("hidden")}function kr(){let e=h.pinnedAnnotationId;if(!e)return;let t=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(!t)return;let n=h.annotations.find(r=>r.id===e);if(!n)return;let o=t.getBoundingClientRect();ht(n,o.right+8,o.top+8)}function ye(e=!1){let t=S();t.popover&&(!e&&h.pinnedAnnotationId||(t.popover.classList.add("hidden"),e&&(h.pinnedAnnotationId=null)))}function xr(e){let t=S();if(!h.pendingAnnotation||!t.composerNote)return;let n=h.pendingAnnotationFilePath;if(!n||n!==e)return;let o=t.composerNote.value.trim();if(!o)return;let r=Date.now(),a={...h.pendingAnnotation,serial:Jn(h.annotations),note:o,thread:[{id:\`c-\${r}-\${Math.random().toString(16).slice(2,8)}\`,type:"comment",note:o,createdAt:r}]};h.annotations.push(a),Un(e,a,"\\u521B\\u5EFA\\u8BC4\\u8BBA\\u5931\\u8D25"),ne(e,1),Promise.resolve().then(()=>(F(),C)).then(({renderSidebar:i})=>i()),gt(),W(),N(e),document.dispatchEvent(new CustomEvent("annotation:created",{detail:{annotation:a,filePath:e}}))}function Or(e,t){let n=h.annotations.slice();h.annotations=h.annotations.filter(r=>r.id!==e),h.pinnedAnnotationId===e&&(h.pinnedAnnotationId=null,ye(!0)),h.activeAnnotationId===e&&(h.activeAnnotationId=null),W(),N(t);let o=n.find(r=>r.id===e);o&&o.status!=="resolved"&&(ne(t,-1),Promise.resolve().then(()=>(F(),C)).then(({renderSidebar:r})=>r())),mr(t,{id:e}).catch(r=>{h.annotations=n,o&&o.status!=="resolved"&&(ne(t,1),Promise.resolve().then(()=>(F(),C)).then(({renderSidebar:a})=>a())),L(\`\\u5220\\u9664\\u8BC4\\u8BBA\\u5931\\u8D25: \${r?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600),W(),N(t)})}function es(e){let t=S();if(!t.content)return;let n=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(n){let o=t.content.getBoundingClientRect(),r=n.getBoundingClientRect(),i=t.content.scrollTop+(r.top-o.top),l=Math.max(0,i-56);t.content.scrollTo({top:l,behavior:"smooth"})}}function qr(e,t){h.activeAnnotationId=e,W(),e&&(es(e),h.pinnedAnnotationId=e,requestAnimationFrame(()=>{let n=h.annotations.find(a=>a.id===e),o=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(!n||!o)return;let r=o.getBoundingClientRect();ht(n,r.right+8,r.top+8)})),N(t)}function Jt(e,t,n){let o=Ut(),r=o.findIndex(i=>i.id===e);if(r<0)return;let a=o[r+t];a&&qr(a.id,n)}function ts(e){let t=document.getElementById("content"),n=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(!t||!n)return null;let o=t.getBoundingClientRect(),r=n.getBoundingClientRect();return t.scrollTop+(r.top-o.top)}function eo(){if(h.density!=="default")return;let e=document.getElementById("content"),t=document.getElementById("annotationList");!e||!t||(t.scrollTop=e.scrollTop)}function _r(e,t){let n=h.annotations.find(a=>a.id===e);if(!n)return;let o=n.status;n.status==="resolved"?n.status=(n.confidence||0)<=0?"unanchored":"anchored":n.status="resolved";let r=n.status||"anchored";ye(!0),W(),N(t),r==="resolved"?ne(t,-1):o==="resolved"&&ne(t,1),Promise.resolve().then(()=>(F(),C)).then(({renderSidebar:a})=>a()),fr(t,{id:e},r).catch(a=>{n.status=o,r==="resolved"?ne(t,1):o==="resolved"&&ne(t,-1),L(\`\\u66F4\\u65B0\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25: \${a?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600),W(),N(t),Promise.resolve().then(()=>(F(),C)).then(({renderSidebar:i})=>i())})}function Tr(e,t){e.classList.add("annotation-mark"),e.dataset.annotationId=t.id,e.classList.add(\`status-\${Xn(t)}\`),ge(t)&&e.classList.add("is-resolved")}function ns(e,t){let n=S();if(!n.reader||typeof e.start!="number"||typeof e.length!="number"||e.length<=0)return;let o=_t(n.reader,e.start,t),r=_t(n.reader,e.start+e.length,t);if(!(!o||!r)&&!(o.node===r.node&&o.offset===r.offset)){if(o.node===r.node){let a=document.createRange();a.setStart(o.node,o.offset),a.setEnd(r.node,r.offset);let i=document.createElement("span");Tr(i,e);try{a.surroundContents(i)}catch{}return}try{let a=[],i=document.createTreeWalker(n.reader,NodeFilter.SHOW_TEXT,null,!1),s;for(;s=i.nextNode();){let l=document.createRange();l.selectNode(s);let d=document.createRange();d.setStart(o.node,o.offset),d.setEnd(r.node,r.offset);let u=d.compareBoundaryPoints(Range.END_TO_START,l),f=d.compareBoundaryPoints(Range.START_TO_END,l);if(u>0||f<0)continue;let p=s===o.node?o.offset:0,m=s===r.node?r.offset:s.nodeValue?.length||0;p<m&&a.push({node:s,start:p,end:m})}for(let l=a.length-1;l>=0;l--){let{node:d,start:u,end:f}=a[l],p=document.createRange();p.setStart(d,u),p.setEnd(d,f);let m=document.createElement("span");Tr(m,e),p.surroundContents(m)}}catch{}}}function os(){let e=S();e.reader&&e.reader.querySelectorAll(".annotation-mark").forEach(t=>{let n=t.getAttribute("data-annotation-id"),o=h.annotations.find(r=>r.id===n);o&&(t.classList.toggle("is-active",!!n&&n===h.activeAnnotationId),t.addEventListener("click",r=>{if(r.stopPropagation(),h.pinnedAnnotationId===n){h.pinnedAnnotationId=null,ye(!0);return}h.activeAnnotationId=n,h.pinnedAnnotationId=n;let a=t.getBoundingClientRect();ht(o,a.right+8,a.top+8);let i=_();N(i||null)}))})}function rs(){let e=S();if(!e.reader)return;let t=Array.from(e.reader.querySelectorAll(".annotation-mark"));for(let n of t){let o=n.parentNode;for(;n.firstChild;)o?.insertBefore(n.firstChild,n);o?.removeChild(n)}}function W(){let e=S();rs();let t=e.reader?ar(lr(e.reader)):void 0;if(e.reader){let o=t?t.nodes.map(i=>i.nodeValue||"").join(""):\$r(e.reader),r=!1,a=[];for(let i of h.annotations){let s=hr(o,i),l=!1,d=s.status;i.start!==s.start&&(i.start=s.start,r=!0,l=!0),i.length!==s.length&&(i.length=s.length,r=!0,l=!0);let u=Qa(i.status,d);(i.status||"anchored")!==u&&(i.status=u,r=!0,l=!0),i.confidence!==s.confidence&&(i.confidence=s.confidence,r=!0,l=!0),l&&a.push({...i,thread:i.thread?[...i.thread]:i.thread})}if(r){let i=_();i&&Fr(i,a,"\\u540C\\u6B65\\u8BC4\\u8BBA\\u951A\\u70B9\\u5931\\u8D25")}}let n=[...Ut()].sort((o,r)=>r.start-o.start);for(let o of n)ns(o,t);os()}function is(e,t){let n=e.querySelector(".annotation-canvas");if(!n)return;let o=Array.from(n.querySelectorAll(".annotation-item.positioned"));if(o.length===0)return;let r=o.map(u=>u.offsetHeight),a=6,i=0,s=[];for(let u=0;u<o.length;u++){let f=Number(o[u].getAttribute("data-anchor-top")||"0"),p=Number.isFinite(f)?Math.max(0,f):0,m=Math.max(p,i>0?i+a:p);s.push(m),i=m+r[u]}for(let u=0;u<o.length;u++)o[u].style.top=\`\${Math.round(s[u])}px\`;let l=Math.max(0,t),d=Math.ceil(i+24);n.style.height=\`\${Math.max(l,d)}px\`}function N(e){let t=S();if(!t.annotationList)return;za(),_a();let n=new Map;if(t.annotationList.querySelectorAll("[data-reply-input]").forEach(a=>{let i=a.getAttribute("data-reply-input");i&&a.value.trim()&&n.set(i,a.value)}),!e||h.annotations.length===0){t.annotationList.innerHTML='<div class="annotation-empty">\\u65E0\\u8BC4\\u8BBA\\uFF08\\u9009\\u4E2D\\u6587\\u672C\\u5373\\u53EF\\u6DFB\\u52A0\\uFF09</div>';return}let o=Ut();if(o.length===0){t.annotationList.innerHTML='<div class="annotation-empty">\\u5F53\\u524D\\u7B5B\\u9009\\u4E0B\\u65E0\\u8BC4\\u8BBA</div>';return}let r=(a,i,s=!1,l=0)=>\`
    <div class="annotation-item \${h.activeAnnotationId===a.id?"is-active":""} status-\${Xn(a)}\${ge(a)?" is-resolved":""}\${s?" positioned":""}" data-annotation-id="\${a.id}"\${s?\` data-anchor-top="\${Math.max(0,Math.round(l))}" style="top:\${Math.max(0,Math.round(l))}px"\`:""}>
      <div class="annotation-row-top">
        <div class="annotation-row-title">#\${a.serial||i+1} | \${x(a.quote.substring(0,28))}\${a.quote.length>28?"...":""}</div>
        <div class="annotation-row-actions">
          <button class="annotation-icon-action" data-action="prev" data-id="\${a.id}" title="\\u4E0A\\u4E00\\u6761">\${fe("up")}</button>
          <button class="annotation-icon-action" data-action="next" data-id="\${a.id}" title="\\u4E0B\\u4E00\\u6761">\${fe("down")}</button>
          <button class="annotation-icon-action resolve\${ge(a)?" is-resolved":""}" data-action="resolve" data-id="\${a.id}" title="\${ge(a)?"\\u91CD\\u65B0\\u6253\\u5F00":"\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3"}">\${ge(a)?fe("reopen"):fe("check")}</button>
          <button class="annotation-icon-action danger" data-action="delete" data-id="\${a.id}" title="\\u5220\\u9664">\${fe("trash")}</button>
        </div>
      </div>
      <div class="annotation-thread">\${Wr(a,h.density==="simple")}</div>
      \${h.density==="simple"?"":\`
        <div class="annotation-reply-entry" data-reply-entry="\${a.id}" role="button" tabindex="0">
          <textarea rows="1" data-reply-input="\${a.id}" placeholder="\\u8F93\\u5165\\u56DE\\u590D\\u5185\\u5BB9\\uFF08Cmd+Enter \\u63D0\\u4EA4\\uFF09"></textarea>
        </div>
      \`}
    </div>
  \`;if(h.density==="default"){let a=o.map(u=>ts(u.id)),i=0,s=o.map((u,f)=>{let p=a[f]??f*88;return i=Math.max(i,p),r(u,f,!0,p)}).join(""),l=document.getElementById("content"),d=Math.max(l?.scrollHeight||0,i+180);t.annotationList.classList.add("default-mode"),t.annotationList.innerHTML=\`<div class="annotation-canvas" style="height:\${d}px">\${s}</div>\`,is(t.annotationList,l?.scrollHeight||0),eo()}else t.annotationList.classList.remove("default-mode"),t.annotationList.innerHTML=o.map((a,i)=>r(a,i)).join("");t.annotationList.querySelectorAll(".annotation-icon-action").forEach(a=>{a.addEventListener("click",i=>{i.stopPropagation();let s=i.currentTarget,l=s.getAttribute("data-action"),d=s.getAttribute("data-id");!d||!e||(l==="prev"?Jt(d,-1,e):l==="next"?Jt(d,1,e):l==="resolve"?_r(d,e):l==="delete"&&Or(d,e))})}),t.annotationList.querySelectorAll("[data-edit-thread-item]").forEach(a=>{a.addEventListener("click",i=>{i.stopPropagation();let s=a.getAttribute("data-edit-thread-item"),l=a.getAttribute("data-annotation-id");!s||!l||!e||Vt(l,s,e)})}),t.annotationList.querySelectorAll("[data-reply-entry]").forEach(a=>{a.addEventListener("click",i=>{i.stopPropagation();let s=a.getAttribute("data-reply-entry");if(!s)return;let l=t.annotationList?.querySelector(\`[data-reply-input="\${s}"]\`);l&&(\$e(l),l.focus())}),a.addEventListener("keydown",i=>{if(i.target instanceof HTMLTextAreaElement||i.key!=="Enter"&&i.key!==" ")return;i.preventDefault(),i.stopPropagation();let l=a.getAttribute("data-reply-entry");if(!l)return;let d=t.annotationList?.querySelector(\`[data-reply-input="\${l}"]\`);d&&(\$e(d),d.focus())})}),n.size>0&&t.annotationList.querySelectorAll("[data-reply-input]").forEach(a=>{let i=a.getAttribute("data-reply-input");i&&n.has(i)&&(a.value=n.get(i))}),requestAnimationFrame(()=>{t.annotationList?.querySelectorAll("[data-reply-input]").forEach(a=>{\$e(a)})}),t.annotationList.querySelectorAll("[data-reply-input]").forEach(a=>{let i=a;i.addEventListener("input",()=>\$e(i)),i.addEventListener("click",s=>s.stopPropagation()),a.addEventListener("keydown",s=>{if(Kt(s,s.currentTarget)){s.preventDefault();return}if(s.key!=="Enter"||!(s.metaKey||s.ctrlKey))return;s.preventDefault();let l=s.currentTarget,d=l.getAttribute("data-reply-input");!d||!e||(Dr(d,e,l.value),l.value="",N(e))})}),t.annotationList.querySelectorAll(".annotation-item").forEach(a=>{a.addEventListener("click",()=>{let i=a.getAttribute("data-annotation-id");!i||!e||qr(i,e)})})}function zr(e){let t=S(),n=t.content?.getAttribute("data-current-file");if(!e||!n||e!==n||!t.reader)return;let o=window.getSelection();if(!o||o.rangeCount===0||o.isCollapsed)return;let r=o.getRangeAt(0);if(!t.reader.contains(r.commonAncestorContainer))return;let a=o.toString().trim();if(!a)return;let i=br(t.reader,r.startContainer,r.startOffset),s=br(t.reader,r.endContainer,r.endOffset);if(i<0||s<=i)return;let l=\$r(t.reader),d=32,u=32,f=l.slice(Math.max(0,i-d),i),p=l.slice(s,Math.min(l.length,s+u)),m=r.getBoundingClientRect();Ga(m.right+6,m.top-8,{id:\`ann-\${Date.now()}-\${Math.random().toString(16).slice(2,8)}\`,start:i,length:s-i,quote:a,quotePrefix:f,quoteSuffix:p,status:"anchored",confidence:1})}function Kr(){Ja(),Ue(!0),document.getElementById("composerSaveBtn")?.addEventListener("click",()=>{let e=_();e&&xr(e)}),document.getElementById("composerCancelBtn")?.addEventListener("click",gt),S().composerNote?.addEventListener("keydown",e=>{if(Kt(e,e.currentTarget)){e.preventDefault();return}if(e.key!=="Enter"||!(e.metaKey||e.ctrlKey))return;e.preventDefault();let t=_();t&&xr(t)}),S().composerNote?.addEventListener("input",e=>{let t=e.currentTarget;Rr(t)}),S().quickAdd?.addEventListener("click",e=>{e.stopPropagation(),jr()}),document.getElementById("popoverCloseBtn")?.addEventListener("click",()=>{h.pinnedAnnotationId=null,ye(!0)}),document.getElementById("popoverDeleteBtn")?.addEventListener("click",()=>{let e=_(),t=h.pinnedAnnotationId;t&&e&&Or(t,e)}),document.getElementById("popoverResolveBtn")?.addEventListener("click",()=>{let e=_(),t=h.pinnedAnnotationId;t&&e&&_r(t,e)}),document.getElementById("popoverPrevBtn")?.addEventListener("click",()=>{let e=_(),t=h.pinnedAnnotationId;t&&e&&Jt(t,-1,e)}),document.getElementById("popoverNextBtn")?.addEventListener("click",()=>{let e=_(),t=h.pinnedAnnotationId;t&&e&&Jt(t,1,e)}),document.getElementById("annotationPopover")?.addEventListener("click",e=>{let t=e.target,n=_();if(!n)return;let o=t.closest("[data-edit-thread-item]");if(o){e.stopPropagation();let i=o.getAttribute("data-edit-thread-item"),s=o.getAttribute("data-annotation-id");i&&s&&Vt(s,i,n);return}let r=t.closest("[data-popover-reply-entry]");if(r){e.stopPropagation();let i=r.getAttribute("data-popover-reply-entry");if(!i)return;let s=document.querySelector(\`[data-popover-reply-input="\${i}"]\`);if(!s)return;\$e(s),s.focus();return}t.closest("[data-popover-reply-input]")&&e.stopPropagation()}),document.getElementById("annotationPopover")?.addEventListener("keydown",e=>{let t=e.target;if(t instanceof HTMLTextAreaElement)return;let n=t.closest("[data-popover-reply-entry]");if(!n||e.key!=="Enter"&&e.key!==" ")return;e.preventDefault(),e.stopPropagation();let o=n.getAttribute("data-popover-reply-entry");if(!o)return;let r=document.querySelector(\`[data-popover-reply-input="\${o}"]\`);r&&(\$e(r),r.focus())}),document.getElementById("annotationPopover")?.addEventListener("keydown",e=>{let t=e.target;if(!(t instanceof HTMLTextAreaElement))return;if(Kt(e,t)){e.preventDefault();return}if(e.key!=="Enter"||!(e.metaKey||e.ctrlKey))return;let n=t.getAttribute("data-popover-reply-input"),o=_();if(!n||!o)return;e.preventDefault(),Dr(n,o,t.value),t.value="";let r=h.annotations.find(s=>s.id===n),i=document.querySelector(\`[data-annotation-id="\${n}"]\`)?.getBoundingClientRect();r&&ht(r,i?i.right+8:120,i?i.top+8:120),N(o)}),document.getElementById("annotationPopover")?.addEventListener("input",e=>{let t=e.target;t instanceof HTMLTextAreaElement&&t.hasAttribute("data-popover-reply-input")&&\$e(t)}),S().filterMenu?.querySelectorAll(".annotation-filter-item[data-filter]").forEach(e=>{e.addEventListener("click",()=>{let t=e.getAttribute("data-filter");if(!t)return;h.filter=t,S().filterMenu?.classList.add("hidden");let n=_();W(),N(n||null)})}),S().filterToggle?.addEventListener("click",e=>{e.stopPropagation();let t=S().filterMenu;t&&t.classList.toggle("hidden")}),S().densityToggle?.addEventListener("click",()=>{h.density=h.density==="default"?"simple":"default",localStorage.setItem("md-viewer:annotation-density",h.density);let e=_();N(e||null)}),S().closeToggle?.addEventListener("click",()=>{vr()}),S().floatingOpenBtn?.addEventListener("click",()=>{wr()}),S().sidebarResizer?.addEventListener("mousedown",e=>{if(S().sidebar?.classList.contains("collapsed"))return;e.preventDefault();let t=document.documentElement,n=Number(getComputedStyle(t).getPropertyValue("--annotation-sidebar-width").replace("px",""))||Mr,o=e.clientX;document.body.classList.add("annotation-sidebar-resizing");let r=i=>{let s=o-i.clientX;Nr(n+s),he()},a=()=>{document.body.classList.remove("annotation-sidebar-resizing"),window.removeEventListener("mousemove",r),window.removeEventListener("mouseup",a)};window.addEventListener("mousemove",r),window.addEventListener("mouseup",a)}),document.getElementById("content")?.addEventListener("scroll",()=>{Qe(!1),eo(),kr()}),window.addEventListener("resize",()=>{he(),kr()}),window.openAnnotationSidebar=wr,window.closeAnnotationSidebar=vr,window.toggleAnnotationSidebar=Ua,document.addEventListener("mousedown",e=>{let t=e.target,n=S();if(t.closest(".annotation-mark-temp")){Ya();return}n.composer&&!n.composer.classList.contains("hidden")&&!n.composer.contains(t)&&!(n.quickAdd&&n.quickAdd.contains(t))&&Xa(),n.popover&&!n.popover.contains(t)&&!t.closest(".annotation-mark")&&(h.pinnedAnnotationId=null,ye(!0)),n.filterMenu&&!n.filterMenu.classList.contains("hidden")&&!n.filterMenu.contains(t)&&!t.closest("#annotationFilterToggle")&&n.filterMenu.classList.add("hidden"),n.quickAdd&&!n.quickAdd.classList.contains("hidden")&&!n.quickAdd.contains(t)&&!t.closest("#annotationComposer")&&Qe(!0)}),S().composerHeader?.addEventListener("mousedown",e=>{if(e.target.closest(".annotation-row-actions"))return;let t=S().composer;if(!t)return;let n=t.getBoundingClientRect(),o=e.clientX,r=e.clientY,a=n.left,i=n.top;e.preventDefault();let s=d=>{let u=a+(d.clientX-o),f=i+(d.clientY-r);Gn(t,u,f)},l=()=>{window.removeEventListener("mousemove",s),window.removeEventListener("mouseup",l)};window.addEventListener("mousemove",s),window.addEventListener("mouseup",l)})}function Vr(e,t,n,o){h.pendingAnnotation=e,h.pendingAnnotationFilePath=t,jr(n,o)}var Er,Mr,Na,Ha,h,Sr,Qt=v(()=>{"use strict";cr();Me();Vn();qe();yr();H();Er="md-viewer:annotation-sidebar-width",Mr=320,Na=260,Ha=540;h={annotations:[],pendingAnnotation:null,pendingAnnotationFilePath:null,pinnedAnnotationId:null,activeAnnotationId:null,currentFilePath:null,filter:"open",density:ja()},Sr="md-viewer:annotation-panel-open-by-file"});var C={};ke(C,{renderCurrentPath:()=>oo,renderFiles:()=>ro,renderSearchBox:()=>Zr,renderSidebar:()=>\$,renderTabs:()=>be,setSidebarTab:()=>Yr});function Xr(e){c.currentFile&&(Jr||requestAnimationFrame(()=>{let t=e.querySelector(".file-item.current, .tree-item.current");if(!t)return;let n=t.offsetTop-e.clientHeight*.4,o=Math.max(0,e.scrollHeight-e.clientHeight),r=Math.max(0,Math.min(n,o));e.scrollTo({top:r,behavior:"auto"}),Jr=!0}))}function Yr(e){c.config.sidebarTab=e,O(c.config),\$()}function as(e){if(!e)return;let t=Ge.indexOf(e);t>=0&&Ge.splice(t,1),Ge.unshift(e),Ge.length>300&&(Ge.length=300)}function Gr(e){let t=Ge.indexOf(e);return t>=0?t:Number.MAX_SAFE_INTEGER}function ss(){K=!K,be()}function ls(){K&&(K=!1,be())}function cs(e){Yt=(e||"").trimStart(),K||(K=!0),be()}function ds(e){yt=e==="name"?"name":"recent",be()}function us(){Ur||(Ur=!0,document.addEventListener("click",e=>{!K||e.target?.closest(".tab-manager-wrap")||ls()}))}function ps(){if(Qr)return;Qr=!0;let e=document.getElementById("tabs");e&&e.addEventListener("scroll",t=>{let n=t.target;n.classList.contains("tabs-scroll")?en=n.scrollLeft:n.classList.contains("tab-manager-list")&&(Zt=n.scrollTop)},{passive:!0,capture:!0})}function ms(e){let t=Ht(c.sessionFiles),n=De(e,t,c.currentFile,r=>{let a=t.find(s=>s.path===r);if(!a)return!1;let i=U(a,q(a.path));return i.type==="normal"||i.type==="new"}),o=window.removeFile;if(!o||n.length===0){be();return}n.forEach(r=>o(r))}function no(){if(c.config.sidebarTab==="focus"||c.config.sidebarTab==="full"){\$();return}ro()}function fs(e){let t=e.trim();return t?!!(/^https?:\\/\\//i.test(t)||t.startsWith("/")||t.startsWith("~/")||t.startsWith("./")||t.startsWith("../")||t.includes("/")||t.includes("\\\\")||/\\.[a-zA-Z0-9]{1,10}\$/.test(t)):!1}function Zr(){let e=document.getElementById("searchBox");if(!e)return;let t=e.querySelector("#searchInput"),n=e.querySelector("#searchClear"),o=c.config.sidebarTab,r=o==="list"?"\\u641C\\u7D22\\u5DF2\\u6253\\u5F00\\u7684\\u6587\\u4EF6":o==="focus"?"\\u641C\\u7D22\\u7126\\u70B9\\u6587\\u4EF6":"\\u641C\\u7D22\\u6216\\u8F93\\u5165\\u8DEF\\u5F84\\uFF08Enter\\u8865\\u5168\\uFF0CCmd/Ctrl+Enter\\u6DFB\\u52A0\\uFF09";if(!t||!n){if(e.innerHTML=\`
      <div class="search-wrapper">
        <span class="search-icon">\\u{1F50D}</span>
        <input
          type="text"
          class="search-input"
          placeholder="\${r}"
          id="searchInput"
        />
        <button class="search-clear" id="searchClear">\\xD7</button>
      </div>
    \`,t=e.querySelector("#searchInput"),n=e.querySelector("#searchClear"),!t||!n)return;Wt(t,{kind:"file",markdownOnly:!1,shouldActivate:fs}),t.addEventListener("input",a=>{window.dismissQuickActionConfirm?.();let i=a.target.value;Gt=0,Xt="",ue(i),n&&(n.style.display=i?"block":"none"),no(),c.currentFile&&(Cn(c.currentFile)||it(c.currentFile))&&window.renderContent?.()}),t.addEventListener("keydown",a=>{if(a.key==="Enter"&&(a.metaKey||a.ctrlKey)){a.preventDefault(),t.dispatchEvent(new Event("path-autocomplete-hide")),window.handleUnifiedInputSubmit?.(t.value);return}if(!a.defaultPrevented&&(a.key==="Enter"&&(a.preventDefault(),t.dispatchEvent(new Event("path-autocomplete-hide")),window.handleUnifiedInputSubmit?.(t.value)),a.key==="Escape")){window.dismissQuickActionConfirm?.();let i=Date.now(),s=t.value;if(i-Gt<900&&Xt===s&&s){ue(""),t.value="",n&&(n.style.display="none"),no(),Gt=0,Xt="",a.preventDefault();return}Gt=i,Xt=s}}),n.addEventListener("click",()=>{ue(""),t&&(t.value=""),n.style.display="none",no(),t?.focus()})}document.activeElement!==t&&t.value!==c.searchQuery&&(t.value=c.searchQuery),n.style.display=c.searchQuery?"block":"none",t.placeholder=r}function oo(){let e=document.getElementById("currentPath");e&&(e.innerHTML="",e.style.display="none")}function gs(){let e=document.getElementById("modeSwitchRow");if(!e)return;let t=c.config.sidebarTab,n=[{key:"focus",label:"\\u7126\\u70B9"},{key:"full",label:"\\u5168\\u91CF"},{key:"list",label:"\\u5217\\u8868"}];e.innerHTML=\`
    <div class="view-tabs">
      \${n.map(o=>\`
        <button class="view-tab\${t===o.key?" active":""}"
                onclick="setSidebarTab('\${o.key}')">\${o.label}</button>
      \`).join("")}
    </div>
  \`}function ro(){let e=document.getElementById("fileList");if(!e)return;if(c.sessionFiles.size===0){e.innerHTML='<div class="empty-tip">\\u70B9\\u51FB\\u4E0A\\u65B9\\u6DFB\\u52A0 Markdown/HTML \\u6587\\u4EF6</div>';return}let t=Fn();if(t.length===0){e.innerHTML='<div class="empty-tip">\\u672A\\u627E\\u5230\\u5339\\u914D\\u7684\\u6587\\u4EF6</div>';return}let n=new Map(t.map(r=>[r.path,r])),o=Ht(n);e.innerHTML=o.map(r=>{let a=r.path===c.currentFile,i=r.isMissing||!1,s=Se(r.path),l=["file-item",a?"current":"",i?"deleted":""].filter(Boolean).join(" "),d=r.displayName||r.name,u=c.searchQuery.toLowerCase().trim();if(u){let m=d.toLowerCase().indexOf(u);if(m!==-1){let g=d.substring(0,m),y=d.substring(m,m+u.length),b=d.substring(m+u.length);d=\`\${g}<mark class="search-highlight">\${y}</mark>\${b}\`}}let f=U(r,q(r.path)),p="&nbsp;";return f.badge==="dot"?p='<span class="new-dot"></span>':f.badge&&(p=\`<span class="status-badge status-\${f.type}" style="color: \${f.color}">\${f.badge}</span>\`),\`
      <div class="\${l}"
           onclick="window.switchFile('\${T(r.path)}')">
        <span class="file-type-icon \${s.cls}">\${x(s.label)}</span>
        <span class="name">\${d}</span>
        <span class="file-item-status">\${p}</span>
        <span class="close" onclick="event.stopPropagation();window.removeFile('\${T(r.path)}')">\\xD7</span>
      </div>
    \`}).join(""),Xr(e)}function \$(){let e=c.config.sidebarTab,t=document.querySelector(".sidebar");if(t&&t.classList.toggle("workspace-mode",e==="focus"||e==="full"),Zr(),gs(),e==="list"){oo(),ro(),be();return}if(oo(),!t)return;let n=document.getElementById("fileList");n||(n=document.createElement("div"),n.id="fileList",n.className="file-list",t.appendChild(n)),n.innerHTML=er(),nr(),Xr(n),be()}function be(){let e=Array.from(c.sessionFiles.values()),t=document.getElementById("tabs");if(!t)return;us(),ps();let n=t.querySelector(".tab-manager-list");n&&(Zt=n.scrollTop);let o=t.querySelector(".tabs-scroll");if(o&&(en=o.scrollLeft),e.length===0){t.innerHTML="",t.style.display="none",K=!1,to="";return}let r=Ht(c.sessionFiles),a=r.map(p=>{let m=U(p,q(p.path));return[p.path,p.displayName||p.name,p.isMissing?"1":"0",p.path===c.currentFile?"1":"0",m.type,m.badge||""].join("|")}).join("||"),i=[c.currentFile||"",K?"1":"0",yt,Yt,a].join("###");if(i===to)return;to=i,as(c.currentFile),t.style.display="flex";let s=r.map(p=>{let m=p.path===c.currentFile,g=p.isMissing||!1,y=["tab"];return m&&y.push("active"),g&&y.push("deleted"),\`
        <div class="\${y.join(" ")}"
             onclick="window.switchFile('\${T(p.path)}')">
          <span class="tab-name">\${x(p.displayName)}</span>
          <span class="tab-close" onclick="event.stopPropagation();window.removeFile('\${T(p.path)}')">\\xD7</span>
        </div>
      \`}).join(""),l=Yt.toLowerCase().trim(),d=r.filter(p=>{let m=p.displayName||p.name;return l?m.toLowerCase().includes(l)||p.path.toLowerCase().includes(l):!0}).sort((p,m)=>{let g=p.displayName||p.name,y=m.displayName||m.name;if(yt==="name")return g.localeCompare(y,"zh-CN");let b=Gr(p.path)-Gr(m.path);return b!==0?b:g.localeCompare(y,"zh-CN")}),u=d.length===0?'<div class="tab-manager-empty">\\u6CA1\\u6709\\u5339\\u914D\\u7684\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6</div>':d.map(p=>{let m=p.displayName||p.name,g=p.path===c.currentFile,y=U(p,q(p.path)),b=y.badge?\`<span class="tab-manager-status status-\${y.type}">\${x(y.badge)}</span>\`:"";return\`
          <div class="tab-manager-item \${g?"active":""}" onclick="window.switchFile('\${T(p.path)}')">
            <span class="tab-manager-name" title="\${T(p.path)}">\${x(m)}</span>
            <span class="tab-manager-actions">
              \${b}
              <button class="tab-manager-close" type="button" title="\\u5173\\u95ED" onclick="event.stopPropagation();window.removeFile('\${T(p.path)}')">\\xD7</button>
            </span>
          </div>
        \`}).join(""),f={others:De("close-others",r,c.currentFile,()=>!1).length,right:De("close-right",r,c.currentFile,()=>!1).length,unmodified:De("close-unmodified",r,c.currentFile,p=>{let m=r.find(y=>y.path===p);if(!m)return!1;let g=U(m,q(m.path));return g.type==="normal"||g.type==="new"}).length,all:De("close-all",r,c.currentFile,()=>!1).length};t.innerHTML=\`
    <div class="tabs-scroll">\${s}</div>
    <div class="tab-manager-wrap">
      <button class="tab-manager-toggle \${K?"active":""}" type="button" onclick="event.stopPropagation();window.toggleTabManager()">\\u2261 Tabs (\${r.length})</button>
      <div class="tab-manager-panel \${K?"show":""}" onclick="event.stopPropagation()">
        <div class="tab-manager-row tab-manager-actions-row">
          <button class="tab-manager-action" type="button" data-action="close-others" onclick="window.applyTabBatchAction('close-others')">\\u5173\\u95ED\\u5176\\u4ED6 (\${f.others})</button>
          <button class="tab-manager-action" type="button" data-action="close-right" onclick="window.applyTabBatchAction('close-right')">\\u5173\\u95ED\\u53F3\\u4FA7 (\${f.right})</button>
          <button class="tab-manager-action" type="button" data-action="close-unmodified" onclick="window.applyTabBatchAction('close-unmodified')">\\u5173\\u95ED\\u672A\\u4FEE\\u6539 (\${f.unmodified})</button>
          <button class="tab-manager-action danger" type="button" data-action="close-all" onclick="window.applyTabBatchAction('close-all')">\\u5173\\u95ED\\u5168\\u90E8 (\${f.all})</button>
        </div>
        <div class="tab-manager-row">
          <input class="tab-manager-search" placeholder="\\u641C\\u7D22\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6" value="\${T(Yt)}" oninput="window.setTabManagerQuery(this.value)">
        </div>
        <div class="tab-manager-row">
          <button class="tab-manager-sort \${yt==="recent"?"active":""}" type="button" onclick="window.setTabManagerSort('recent')">\\u6700\\u8FD1\\u4F7F\\u7528</button>
          <button class="tab-manager-sort \${yt==="name"?"active":""}" type="button" onclick="window.setTabManagerSort('name')">\\u6309\\u540D\\u79F0</button>
        </div>
        <div class="tab-manager-list">\${u}</div>
      </div>
    </div>
  \`,requestAnimationFrame(()=>{let p=t.querySelector(".tab-manager-list");p&&Zt>0&&(p.scrollTop=Zt);let m=t.querySelector(".tabs-scroll");m&&en>0&&(m.scrollLeft=en),he()})}var Gt,Xt,Jr,K,Yt,yt,Ur,Zt,en,Qr,to,Ge,F=v(()=>{"use strict";H();de();je();Me();qo();Pt();at();_o();or();Qt();Rn();Gt=0,Xt="",Jr=!1,K=!1,Yt="",yt="recent",Ur=!1,Zt=0,en=0,Qr=!1,to="",Ge=[];typeof window<"u"&&(window.setSidebarTab=Yr,window.toggleTabManager=ss,window.setTabManagerQuery=cs,window.setTabManagerSort=ds,window.applyTabBatchAction=ms)});function ti(e){let t=e.replace(/[.+^\${}()|[\\]\\\\]/g,"\\\\\$&");return t=t.replace(/\\*\\*/g,"\\xA7GLOBSTAR\\xA7"),t=t.replace(/\\*/g,"[^/]*"),t=t.replace(/\\?/g,"[^/]"),t=t.replace(/§GLOBSTAR§\\//g,"(?:.+/)?"),t=t.replace(/§GLOBSTAR§/g,".*"),e.endsWith("/")?new RegExp(\`(^|/)\${t}\`):new RegExp(\`(^|/)\${t}(/|\$)\`)}function ni(e){if(e.type==="file")return[e];let t=[];for(let n of e.children||[])t.push(...ni(n));return t}function hs(e,t,n,o){if(!t)return[];let r=Date.now()-n,a=Je(t,e);return ni(t).filter(s=>a.has(s.path)?!1:!!(o.has(s.path)||typeof s.lastModified=="number"&&s.lastModified>=r)).sort((s,l)=>{let d=o.has(s.path),u=o.has(l.path);return d!==u?d?-1:1:(l.lastModified||0)-(s.lastModified||0)})}function ys(e){let t=Date.now()-e,n=Math.floor(t/6e4);if(n<60)return\`\${n}m\`;let o=Math.floor(t/36e5);return o<24?\`\${o}h\`:\`\${Math.floor(t/864e5)}d\`}function bs(e,t){if(!t)return x(e);let n=e.toLowerCase().indexOf(t.toLowerCase());return n===-1?x(e):x(e.slice(0,n))+\`<mark class="search-highlight">\${x(e.slice(n,n+t.length))}</mark>\`+x(e.slice(n+t.length))}function ws(e,t,n){let o=c.currentFile===e.path,r=t.has(e.path),a=c.sessionFiles.get(e.path),i="normal";a?i=U(a,q(e.path)).type:rt(e.path)?i="modified":q(e.path)&&(i="new");let s=Se(e.path),l=st(e.name)||e.name,d=e.lastModified?ys(e.lastModified):"",u=i==="modified"?'<span class="focus-file-dot modified"></span>':i==="new"?'<span class="focus-file-dot new-file"></span>':"",f=r?\`<button class="tree-pin-btn active" title="\\u53D6\\u6D88\\u56FA\\u5B9A" onclick="event.stopPropagation();handleUnpinFile('\${T(e.path)}')" data-path="\${T(e.path)}">\\u{1F4CC}</button>\`:\`<button class="tree-pin-btn" title="\\u56FA\\u5B9A\\u5230\\u7126\\u70B9\\u89C6\\u56FE" onclick="event.stopPropagation();handlePinFile('\${T(e.path)}')">\\u{1F4CC}</button>\`;return\`
    <div class="tree-item file-node focus-file-item\${o?" current":""}"
         data-path="\${T(e.path)}"
         onclick="handleFocusFileClick('\${T(e.path)}')">
      <span class="tree-indent" style="width:8px"></span>
      <span class="file-type-icon \${s.cls}">\${x(s.label)}</span>
      <span class="tree-name"><span class="tree-name-full">\${bs(l,n)}</span></span>
      \${u}
      \${d?\`<span class="focus-file-time">\${x(d)}</span>\`:""}
      \${f}
    </div>
  \`}function vs(){let e=c.config.focusWindowKey||"8h";return\`
    <div class="focus-filter-bar">
      <span class="focus-filter-label">\\u6700\\u8FD1</span>
      <div class="focus-time-pills">\${[{key:"8h",label:"8h"},{key:"2d",label:"2d"},{key:"1w",label:"1w"},{key:"1m",label:"1m"}].map(o=>\`<button class="focus-time-pill\${e===o.key?" active":""}"
             onclick="setFocusWindowKey('\${o.key}')">\${o.label}</button>\`).join("")}</div>
    </div>
  \`}function ks(e,t,n,o,r){let a=t.length>0,i=o?'<span class="focus-ws-badge empty">\\u2026</span>':a?\`<span class="focus-ws-badge">\${t.length}</span>\`:'<span class="focus-ws-badge empty">0</span>',s=a?t.map(l=>ws(l,n,r)).join(""):"";return\`
    <div class="focus-ws-group\${a?" has-files":""}">
      <div class="focus-ws-header" onclick="handleFocusWorkspaceToggle('\${T(e.id)}')">
        <span class="focus-ws-arrow\${a?" open":""}">\\u25B6</span>
        <span class="focus-ws-name">\${x(e.name)}</span>
        \${i}
      </div>
      \${a?\`<div class="focus-ws-files">\${s}</div>\`:""}
    </div>
  \`}function rr(){let e=c.config.workspaces;if(e.length===0)return'<div class="focus-empty">\\u6682\\u65E0\\u5DE5\\u4F5C\\u533A</div>';let t=ei[c.config.focusWindowKey||"8h"]??ei["8h"],n=Pn(),o=c.searchQuery.trim().toLowerCase(),r=e.map(a=>{let i=c.fileTree.get(a.id),s=!i;!i&&!io.has(a.id)&&(io.add(a.id),G(a.id).then(d=>{io.delete(a.id),d&&Promise.resolve().then(()=>(F(),C)).then(({renderSidebar:u})=>u())}));let l=hs(a.path,i,t,n);return o&&(l=l.filter(d=>(st(d.name)||d.name).toLowerCase().includes(o)||d.path.toLowerCase().includes(o))),ks(a,l,n,s,o)}).join("");return\`<div class="focus-view">\${vs()}\${r}</div>\`}var io,ei,qn=v(()=>{"use strict";H();qt();Me();Pt();at();\$n();lt();mt();de();io=new Set,ei={"8h":8*3600*1e3,"2d":2*86400*1e3,"1w":7*86400*1e3,"1m":30*86400*1e3}});function Je(e,t){let n=new Set;return oi(e,t,[],n),n}function oi(e,t,n,o){if(e.type==="file"){for(let{base:i,pattern:s}of n){let l=e.path.startsWith(i+"/")?e.path.slice(i.length+1):e.path;if(ti(s).test(l)){o.add(e.path);return}}return}let r=(e.ignorePatterns||[]).map(i=>({base:e.path,pattern:i})),a=[...n,...r];for(let i of e.children||[])oi(i,e.path,a,o)}var qt=v(()=>{"use strict";qn()});function ri(e,t){let n=ii(e);n.size!==0&&tn(t,n)}function ii(e,t=new Map){if(e.type!=="directory")return t;typeof e.isExpanded=="boolean"&&t.set(e.path,e.isExpanded);for(let n of e.children||[])ii(n,t);return t}function tn(e,t){if(e.type==="directory"){let n=t.get(e.path);typeof n=="boolean"&&(e.isExpanded=n)}for(let n of e.children||[])tn(n,t)}var ai=v(()=>{"use strict"});var ir={};ke(ir,{addWorkspace:()=>nn,getCurrentWorkspace:()=>Ss,hydrateExpandedWorkspaces:()=>on,inferWorkspaceFromPath:()=>As,moveWorkspaceByOffset:()=>Ot,removeWorkspace:()=>_n,revealFileInWorkspace:()=>ao,scanWorkspace:()=>G,switchWorkspace:()=>Ms,toggleNodeExpanded:()=>Kn,toggleWorkspaceExpanded:()=>zn});function xs(){return\`ws-\${Date.now()}-\${Math.random().toString(36).substr(2,9)}\`}function Xe(e){return e.trim().replace(/\\/+\$/,"")}function Ts(e){let t=Xe(e),n=null;for(let o of c.config.workspaces){let r=Xe(o.path);(t===r||t.startsWith(\`\${r}/\`))&&(!n||r.length>Xe(n.path).length)&&(n=o)}return n}function Es(e,t,n){let o=c.fileTree.get(e);if(!o)return;let r=Xe(t),a=Xe(n);if(!(a===r||a.startsWith(\`\${r}/\`)))return;let s=(a===r?"":a.slice(r.length+1)).split("/").filter(Boolean);if(s.length<=1)return;let l=!1,d=r;for(let u=0;u<s.length-1;u+=1){d=\`\${d}/\${s[u]}\`;let f=so(o,d);f&&f.type==="directory"&&f.isExpanded===!1&&(f.isExpanded=!0,l=!0)}l&&At(e,Lt(o))}function nn(e,t){let n=Xe(t),o=c.config.workspaces.find(a=>a.path===n);if(o)return c.currentWorkspace=o.id,c.fileTree.delete(o.id),o;let r={id:xs(),name:e,path:n,isExpanded:!1};return c.config.workspaces.push(r),O(c.config),c.currentWorkspace=r.id,r}function _n(e){let t=c.config.workspaces.findIndex(n=>n.id===e);t!==-1&&(c.config.workspaces.splice(t,1),O(c.config),c.fileTree.delete(e),xn(e),jo(e),c.currentWorkspace===e&&(c.currentWorkspace=c.config.workspaces.length>0?c.config.workspaces[0].id:null))}function Ms(e){c.config.workspaces.find(n=>n.id===e)&&(c.currentWorkspace=e)}function Ot(e,t){let n=c.config.workspaces,o=n.findIndex(i=>i.id===e);if(o===-1)return;let r=o+t;if(r<0||r>=n.length)return;let[a]=n.splice(o,1);n.splice(r,0,a),O(c.config)}function zn(e){let t=c.config.workspaces.find(n=>n.id===e);t&&(t.isExpanded=!t.isExpanded,O(c.config))}function Ss(){return c.currentWorkspace&&c.config.workspaces.find(e=>e.id===c.currentWorkspace)||null}async function As(e){try{let t=await fetch("/api/infer-workspace",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filePath:e})});if(!t.ok)return null;let n=await t.json();if(!n.workspacePath)return null;let o=c.config.workspaces.find(a=>a.path===n.workspacePath);if(o)return o;let r=n.workspaceName||n.workspacePath.split("/").pop()||"workspace";return nn(r,n.workspacePath)}catch(t){return console.error("\\u63A8\\u65AD\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",t),null}}async function G(e){let t=c.config.workspaces.find(n=>n.id===e);if(!t)return null;try{let n=new AbortController,o=window.setTimeout(()=>n.abort(),15e3),r=await fetch("/api/scan-workspace",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:t.path}),signal:n.signal});if(window.clearTimeout(o),!r.ok)return console.error("\\u626B\\u63CF\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",await r.text()),null;let a=await r.json(),i=c.fileTree.get(e),s=Ho(e),l=!i&&(!s||s.size===0);i?ri(i,a):s&&s.size>0?tn(a,s):(li(a),Fs(a,2)),c.fileTree.set(e,a),At(e,Lt(a));let d=Je(a,t.path),u=si(a).filter(f=>!d.has(f));return kn(e,u),a}catch(n){return console.error("\\u626B\\u63CF\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",n),null}}function si(e){if(!e)return[];if(e.type==="file")return[e.path];let t=[];for(let n of e.children||[])t.push(...si(n));return t}function li(e){if(e.type==="directory")for(let t of e.children||[])t.type==="directory"&&(t.isExpanded=!1,li(t))}function ci(e,t=[]){if(e.type==="file")t.push(e);else for(let n of e.children||[])ci(n,t);return t}function Ls(e,t){function n(o){if(o.type==="file")return o.path===t;for(let r of o.children||[])if(n(r))return o.isExpanded=!0,!0;return!1}n(e)}function Fs(e,t){let n=ci(e);n.sort((a,i)=>(i.lastModified||0)-(a.lastModified||0));let o=n.slice(0,t),r=new Set;for(let a of o){let i=a.path.substring(0,a.path.lastIndexOf("/"));r.has(i)||(r.add(i),Ls(e,a.path))}}async function on(){let e=c.config.workspaces.filter(t=>t.isExpanded);for(let t of e)await G(t.id);!c.currentWorkspace&&c.config.workspaces.length>0&&(c.currentWorkspace=c.config.workspaces[0].id)}async function ao(e){let t=Ts(e);t&&(c.currentWorkspace=t.id,t.isExpanded||(t.isExpanded=!0,O(c.config)),c.fileTree.has(t.id)||await G(t.id),Es(t.id,t.path,e))}function Kn(e,t){let n=c.fileTree.get(e);if(!n)return;let o=so(n,t);if(o&&o.type==="directory"){let r=o.isExpanded!==!1;o.isExpanded=!r,At(e,Lt(n))}}function so(e,t){if(e.path===t)return e;if(e.children)for(let n of e.children){let o=so(n,t);if(o)return o}return null}var mt=v(()=>{"use strict";H();de();qt();je();ai();yn()});function di(e,t){let n=e.split(\`
\`),o=t.split(\`
\`),r=n.length,a=o.length;if(r===0&&a===0)return[];let i=r+a,s=new Array(2*i+1).fill(0),l=[];e:for(let y=0;y<=i;y++){l.push([...s]);for(let b=-y;b<=y;b+=2){let k=b+i,w;b===-y||b!==y&&s[k-1]<s[k+1]?w=s[k+1]:w=s[k-1]+1;let E=w-b;for(;w<r&&E<a&&n[w]===o[E];)w++,E++;if(s[k]=w,w>=r&&E>=a)break e}}let d=[],u=r,f=a;for(let y=l.length-1;y>=0&&(u>0||f>0);y--){let b=l[y],k=u-f,w=k+i,E;k===-y||k!==y&&b[w-1]<b[w+1]?E=k+1:E=k-1;let I=b[E+i],P=I-E;for(;u>I+1&&f>P+1;)d.unshift({type:"equal",x:u-1,y:f-1}),u--,f--;y>0&&(u===I+1&&f===P+1&&I>=0&&P>=0&&n[I]===o[P]?d.unshift({type:"equal",x:I,y:P}):u>I?d.unshift({type:"delete",x:I,y:-1}):d.unshift({type:"insert",x:-1,y:P})),u=I,f=P}let p=[],m=1,g=1;for(let y of d)y.type==="equal"?p.push({type:"equal",content:n[y.x],oldLineNo:m++,newLineNo:g++}):y.type==="delete"?p.push({type:"delete",content:n[y.x],oldLineNo:m++}):p.push({type:"insert",content:o[y.y],newLineNo:g++});return p}var ui=v(()=>{"use strict"});function rn(e){let n=Date.now()-e,o=Math.floor(n/1e3),r=Math.floor(o/60),a=Math.floor(r/60),i=Math.floor(a/24);return i>0?\`\${i}\\u5929\\u524D\`:a>0?\`\${a}\\u5C0F\\u65F6\\u524D\`:r>0?\`\${r}\\u5206\\u949F\\u524D\`:"\\u521A\\u521A"}var pi=v(()=>{"use strict"});var Ye,mi,bt=v(()=>{"use strict";Ye=\`/*light */
.markdown-body {
  color-scheme: light;
  /** CSS default easing. Use for hover state changes and micro-interactions. */
  /** Accelerating motion. Use for elements exiting the viewport (moving off-screen). */
  /** Smooth acceleration and deceleration. Use for elements moving or morphing within the viewport. */
  /** Decelerating motion. Use for elements entering the viewport or appearing on screen. */
  /** Constant motion with no acceleration. Use for continuous animations like progress bars or loaders. */
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  margin: 0;
  font-weight: 400;
  color: #1f2328;
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  font-size: 16px;
  line-height: 1.5;
  word-wrap: break-word;
}

.markdown-body a {
  text-decoration: underline;
  text-underline-offset: .2rem;
}

.markdown-body .octicon {
  display: inline-block;
  fill: currentColor;
  vertical-align: text-bottom;
}

.markdown-body h1:hover .anchor .octicon-link:before,
.markdown-body h2:hover .anchor .octicon-link:before,
.markdown-body h3:hover .anchor .octicon-link:before,
.markdown-body h4:hover .anchor .octicon-link:before,
.markdown-body h5:hover .anchor .octicon-link:before,
.markdown-body h6:hover .anchor .octicon-link:before {
  width: 16px;
  height: 16px;
  content: ' ';
  display: inline-block;
  background-color: currentColor;
  -webkit-mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>");
  mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>");
}

.markdown-body details,
.markdown-body figcaption,
.markdown-body figure {
  display: block;
}

.markdown-body summary {
  display: list-item;
}

.markdown-body [hidden] {
  display: none !important;
}

.markdown-body a {
  background-color: rgba(0,0,0,0);
  color: #0969da;
  text-decoration: none;
}

.markdown-body abbr[title] {
  border-bottom: none;
  -webkit-text-decoration: underline dotted;
  text-decoration: underline dotted;
}

.markdown-body b,
.markdown-body strong {
  font-weight: 600;
}

.markdown-body dfn {
  font-style: italic;
}

.markdown-body h1 {
  margin: .67em 0;
  font-weight: 600;
  padding-bottom: .3em;
  font-size: 2em;
  border-bottom: 1px solid #d1d9e0b3;
}

.markdown-body mark {
  background-color: #fff8c5;
  color: #1f2328;
}

.markdown-body small {
  font-size: 90%;
}

.markdown-body sub,
.markdown-body sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}

.markdown-body sub {
  bottom: -0.25em;
}

.markdown-body sup {
  top: -0.5em;
}

.markdown-body img {
  border-style: none;
  max-width: 100%;
  box-sizing: content-box;
}

.markdown-body code,
.markdown-body kbd,
.markdown-body pre,
.markdown-body samp {
  font-family: monospace;
  font-size: 1em;
}

.markdown-body figure {
  margin: 1em 2.5rem;
}

.markdown-body hr {
  box-sizing: content-box;
  overflow: hidden;
  background: rgba(0,0,0,0);
  border-bottom: 1px solid #d1d9e0b3;
  height: .25em;
  padding: 0;
  margin: 1.5rem 0;
  background-color: #d1d9e0;
  border: 0;
}

.markdown-body input {
  font: inherit;
  margin: 0;
  overflow: visible;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

.markdown-body [type=button],
.markdown-body [type=reset],
.markdown-body [type=submit] {
  -webkit-appearance: button;
  appearance: button;
}

.markdown-body [type=checkbox],
.markdown-body [type=radio] {
  box-sizing: border-box;
  padding: 0;
}

.markdown-body [type=number]::-webkit-inner-spin-button,
.markdown-body [type=number]::-webkit-outer-spin-button {
  height: auto;
}

.markdown-body [type=search]::-webkit-search-cancel-button,
.markdown-body [type=search]::-webkit-search-decoration {
  -webkit-appearance: none;
  appearance: none;
}

.markdown-body ::-webkit-input-placeholder {
  color: inherit;
  opacity: .54;
}

.markdown-body ::-webkit-file-upload-button {
  -webkit-appearance: button;
  appearance: button;
  font: inherit;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.markdown-body ::placeholder {
  color: #59636e;
  opacity: 1;
}

.markdown-body hr::before {
  display: table;
  content: "";
}

.markdown-body hr::after {
  display: table;
  clear: both;
  content: "";
}

.markdown-body table {
  border-spacing: 0;
  border-collapse: collapse;
  display: block;
  width: max-content;
  max-width: 100%;
  overflow: auto;
  font-variant: tabular-nums;
}

.markdown-body td,
.markdown-body th {
  padding: 0;
}

.markdown-body details summary {
  cursor: pointer;
}

.markdown-body a:focus,
.markdown-body [role=button]:focus,
.markdown-body input[type=radio]:focus,
.markdown-body input[type=checkbox]:focus {
  outline: 2px solid var(--borderColor-accent-emphasis);
  outline-offset: -2px;
  box-shadow: none;
}

.markdown-body a:focus:not(:focus-visible),
.markdown-body [role=button]:focus:not(:focus-visible),
.markdown-body input[type=radio]:focus:not(:focus-visible),
.markdown-body input[type=checkbox]:focus:not(:focus-visible) {
  outline: solid 1px rgba(0,0,0,0);
}

.markdown-body a:focus-visible,
.markdown-body [role=button]:focus-visible,
.markdown-body input[type=radio]:focus-visible,
.markdown-body input[type=checkbox]:focus-visible {
  outline: 2px solid var(--borderColor-accent-emphasis);
  outline-offset: -2px;
  box-shadow: none;
}

.markdown-body a:not([class]):focus,
.markdown-body a:not([class]):focus-visible,
.markdown-body input[type=radio]:focus,
.markdown-body input[type=radio]:focus-visible,
.markdown-body input[type=checkbox]:focus,
.markdown-body input[type=checkbox]:focus-visible {
  outline-offset: 0;
}

.markdown-body kbd {
  display: inline-block;
  padding: 0.25rem;
  font: 11px ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  line-height: 10px;
  color: #1f2328;
  vertical-align: middle;
  background-color: #f6f8fa;
  border: solid 1px var(--borderColor-muted);
  border-bottom-color: var(--borderColor-muted);
  border-radius: 6px;
  box-shadow: inset 0 -1px 0 var(--borderColor-muted);
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h2 {
  font-weight: 600;
  padding-bottom: .3em;
  font-size: 1.5em;
  border-bottom: 1px solid #d1d9e0b3;
}

.markdown-body h3 {
  font-weight: 600;
  font-size: 1.25em;
}

.markdown-body h4 {
  font-weight: 600;
  font-size: 1em;
}

.markdown-body h5 {
  font-weight: 600;
  font-size: .875em;
}

.markdown-body h6 {
  font-weight: 600;
  font-size: .85em;
  color: #59636e;
}

.markdown-body p {
  margin-top: 0;
  margin-bottom: 10px;
}

.markdown-body blockquote {
  margin: 0;
  padding: 0 1em;
  color: #59636e;
  border-left: .25em solid #d1d9e0;
}

.markdown-body ul,
.markdown-body ol {
  margin-top: 0;
  margin-bottom: 0;
  padding-left: 2em;
}

.markdown-body ol ol,
.markdown-body ul ol {
  list-style-type: lower-roman;
}

.markdown-body ul ul ol,
.markdown-body ul ol ol,
.markdown-body ol ul ol,
.markdown-body ol ol ol {
  list-style-type: lower-alpha;
}

.markdown-body dd {
  margin-left: 0;
}

.markdown-body tt,
.markdown-body code,
.markdown-body samp {
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  font-size: 12px;
}

.markdown-body pre {
  margin-top: 0;
  margin-bottom: 0;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  font-size: 12px;
  word-wrap: normal;
}

.markdown-body .octicon {
  display: inline-block;
  overflow: visible !important;
  vertical-align: text-bottom;
  fill: currentColor;
}

.markdown-body input::-webkit-outer-spin-button,
.markdown-body input::-webkit-inner-spin-button {
  margin: 0;
  appearance: none;
}

.markdown-body .mr-2 {
  margin-right: 0.5rem !important;
}

.markdown-body::before {
  display: table;
  content: "";
}

.markdown-body::after {
  display: table;
  clear: both;
  content: "";
}

.markdown-body>*:first-child {
  margin-top: 0 !important;
}

.markdown-body>*:last-child {
  margin-bottom: 0 !important;
}

.markdown-body a:not([href]) {
  color: inherit;
  text-decoration: none;
}

.markdown-body .absent {
  color: #d1242f;
}

.markdown-body .anchor {
  float: left;
  padding-right: 0.25rem;
  margin-left: -20px;
  line-height: 1;
}

.markdown-body .anchor:focus {
  outline: none;
}

.markdown-body p,
.markdown-body blockquote,
.markdown-body ul,
.markdown-body ol,
.markdown-body dl,
.markdown-body table,
.markdown-body pre,
.markdown-body details {
  margin-top: 0;
  margin-bottom: 1rem;
}

.markdown-body blockquote>:first-child {
  margin-top: 0;
}

.markdown-body blockquote>:last-child {
  margin-bottom: 0;
}

.markdown-body h1 .octicon-link,
.markdown-body h2 .octicon-link,
.markdown-body h3 .octicon-link,
.markdown-body h4 .octicon-link,
.markdown-body h5 .octicon-link,
.markdown-body h6 .octicon-link {
  color: #1f2328;
  vertical-align: middle;
  visibility: hidden;
}

.markdown-body h1:hover .anchor,
.markdown-body h2:hover .anchor,
.markdown-body h3:hover .anchor,
.markdown-body h4:hover .anchor,
.markdown-body h5:hover .anchor,
.markdown-body h6:hover .anchor {
  text-decoration: none;
}

.markdown-body h1:hover .anchor .octicon-link,
.markdown-body h2:hover .anchor .octicon-link,
.markdown-body h3:hover .anchor .octicon-link,
.markdown-body h4:hover .anchor .octicon-link,
.markdown-body h5:hover .anchor .octicon-link,
.markdown-body h6:hover .anchor .octicon-link {
  visibility: visible;
}

.markdown-body h1 tt,
.markdown-body h1 code,
.markdown-body h2 tt,
.markdown-body h2 code,
.markdown-body h3 tt,
.markdown-body h3 code,
.markdown-body h4 tt,
.markdown-body h4 code,
.markdown-body h5 tt,
.markdown-body h5 code,
.markdown-body h6 tt,
.markdown-body h6 code {
  padding: 0 .2em;
  font-size: inherit;
}

.markdown-body summary h1,
.markdown-body summary h2,
.markdown-body summary h3,
.markdown-body summary h4,
.markdown-body summary h5,
.markdown-body summary h6 {
  display: inline-block;
}

.markdown-body summary h1 .anchor,
.markdown-body summary h2 .anchor,
.markdown-body summary h3 .anchor,
.markdown-body summary h4 .anchor,
.markdown-body summary h5 .anchor,
.markdown-body summary h6 .anchor {
  margin-left: -40px;
}

.markdown-body summary h1,
.markdown-body summary h2 {
  padding-bottom: 0;
  border-bottom: 0;
}

.markdown-body ul.no-list,
.markdown-body ol.no-list {
  padding: 0;
  list-style-type: none;
}

.markdown-body ol[type="a s"] {
  list-style-type: lower-alpha;
}

.markdown-body ol[type="A s"] {
  list-style-type: upper-alpha;
}

.markdown-body ol[type="i s"] {
  list-style-type: lower-roman;
}

.markdown-body ol[type="I s"] {
  list-style-type: upper-roman;
}

.markdown-body ol[type="1"] {
  list-style-type: decimal;
}

.markdown-body div>ol:not([type]) {
  list-style-type: decimal;
}

.markdown-body ul ul,
.markdown-body ul ol,
.markdown-body ol ol,
.markdown-body ol ul {
  margin-top: 0;
  margin-bottom: 0;
}

.markdown-body li>p {
  margin-top: 1rem;
}

.markdown-body li+li {
  margin-top: .25em;
}

.markdown-body dl {
  padding: 0;
}

.markdown-body dl dt {
  padding: 0;
  margin-top: 1rem;
  font-size: 1em;
  font-style: italic;
  font-weight: 600;
}

.markdown-body dl dd {
  padding: 0 1rem;
  margin-bottom: 1rem;
}

.markdown-body table th {
  font-weight: 600;
}

.markdown-body table th,
.markdown-body table td {
  padding: 6px 13px;
  border: 1px solid #d1d9e0;
}

.markdown-body table td>:last-child {
  margin-bottom: 0;
}

.markdown-body table tr {
  background-color: #ffffff;
  border-top: 1px solid #d1d9e0b3;
}

.markdown-body table tr:nth-child(2n) {
  background-color: #f6f8fa;
}

.markdown-body table img {
  background-color: rgba(0,0,0,0);
}

.markdown-body img[align=right] {
  padding-left: 20px;
}

.markdown-body img[align=left] {
  padding-right: 20px;
}

.markdown-body .emoji {
  max-width: none;
  vertical-align: text-top;
  background-color: rgba(0,0,0,0);
}

.markdown-body span.frame {
  display: block;
  overflow: hidden;
}

.markdown-body span.frame>span {
  display: block;
  float: left;
  width: auto;
  padding: 7px;
  margin: 13px 0 0;
  overflow: hidden;
  border: 1px solid #d1d9e0;
}

.markdown-body span.frame span img {
  display: block;
  float: left;
}

.markdown-body span.frame span span {
  display: block;
  padding: 5px 0 0;
  clear: both;
  color: #1f2328;
}

.markdown-body span.align-center {
  display: block;
  overflow: hidden;
  clear: both;
}

.markdown-body span.align-center>span {
  display: block;
  margin: 13px auto 0;
  overflow: hidden;
  text-align: center;
}

.markdown-body span.align-center span img {
  margin: 0 auto;
  text-align: center;
}

.markdown-body span.align-right {
  display: block;
  overflow: hidden;
  clear: both;
}

.markdown-body span.align-right>span {
  display: block;
  margin: 13px 0 0;
  overflow: hidden;
  text-align: right;
}

.markdown-body span.align-right span img {
  margin: 0;
  text-align: right;
}

.markdown-body span.float-left {
  display: block;
  float: left;
  margin-right: 13px;
  overflow: hidden;
}

.markdown-body span.float-left span {
  margin: 13px 0 0;
}

.markdown-body span.float-right {
  display: block;
  float: right;
  margin-left: 13px;
  overflow: hidden;
}

.markdown-body span.float-right>span {
  display: block;
  margin: 13px auto 0;
  overflow: hidden;
  text-align: right;
}

.markdown-body code,
.markdown-body tt {
  padding: .2em .4em;
  margin: 0;
  font-size: 85%;
  white-space: break-spaces;
  background-color: #818b981f;
  border-radius: 6px;
}

.markdown-body code br,
.markdown-body tt br {
  display: none;
}

.markdown-body del code {
  text-decoration: inherit;
}

.markdown-body samp {
  font-size: 85%;
}

.markdown-body pre code {
  font-size: 100%;
}

.markdown-body pre>code {
  padding: 0;
  margin: 0;
  word-break: normal;
  white-space: pre;
  background: rgba(0,0,0,0);
  border: 0;
}

.markdown-body .highlight {
  margin-bottom: 1rem;
}

.markdown-body .highlight pre {
  margin-bottom: 0;
  word-break: normal;
}

.markdown-body .highlight pre,
.markdown-body pre {
  padding: 1rem;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  color: #1f2328;
  background-color: #f6f8fa;
  border-radius: 6px;
}

.markdown-body pre code,
.markdown-body pre tt {
  display: inline;
  padding: 0;
  margin: 0;
  overflow: visible;
  line-height: inherit;
  word-wrap: normal;
  background-color: rgba(0,0,0,0);
  border: 0;
}

.markdown-body .csv-data td,
.markdown-body .csv-data th {
  padding: 5px;
  overflow: hidden;
  font-size: 12px;
  line-height: 1;
  text-align: left;
  white-space: nowrap;
}

.markdown-body .csv-data .blob-num {
  padding: 10px 0.5rem 9px;
  text-align: right;
  background: #ffffff;
  border: 0;
}

.markdown-body .csv-data tr {
  border-top: 0;
}

.markdown-body .csv-data th {
  font-weight: 600;
  background: #f6f8fa;
  border-top: 0;
}

.markdown-body [data-footnote-ref]::before {
  content: "[";
}

.markdown-body [data-footnote-ref]::after {
  content: "]";
}

.markdown-body .footnotes {
  font-size: 12px;
  color: #59636e;
  border-top: 1px solid #d1d9e0;
}

.markdown-body .footnotes ol {
  padding-left: 1rem;
}

.markdown-body .footnotes ol ul {
  display: inline-block;
  padding-left: 1rem;
  margin-top: 1rem;
}

.markdown-body .footnotes li {
  position: relative;
}

.markdown-body .footnotes li:target::before {
  position: absolute;
  top: calc(0.5rem*-1);
  right: calc(0.5rem*-1);
  bottom: calc(0.5rem*-1);
  left: calc(1.5rem*-1);
  pointer-events: none;
  content: "";
  border: 2px solid #0969da;
  border-radius: 6px;
}

.markdown-body .footnotes li:target {
  color: #1f2328;
}

.markdown-body .footnotes .data-footnote-backref g-emoji {
  font-family: monospace;
}

.markdown-body .pl-c {
  color: #59636e;
}

.markdown-body .pl-c1,
.markdown-body .pl-s .pl-v {
  color: #0550ae;
}

.markdown-body .pl-e,
.markdown-body .pl-en {
  color: #6639ba;
}

.markdown-body .pl-smi,
.markdown-body .pl-s .pl-s1 {
  color: #1f2328;
}

.markdown-body .pl-ent {
  color: #0550ae;
}

.markdown-body .pl-k {
  color: #cf222e;
}

.markdown-body .pl-s,
.markdown-body .pl-pds,
.markdown-body .pl-s .pl-pse .pl-s1,
.markdown-body .pl-sr,
.markdown-body .pl-sr .pl-cce,
.markdown-body .pl-sr .pl-sre,
.markdown-body .pl-sr .pl-sra {
  color: #0a3069;
}

.markdown-body .pl-v,
.markdown-body .pl-smw {
  color: #953800;
}

.markdown-body .pl-bu {
  color: #82071e;
}

.markdown-body .pl-ii {
  color: var(--fgColor-danger);
  background-color: var(--bgColor-danger-muted);
}

.markdown-body .pl-c2 {
  color: #f6f8fa;
  background-color: #cf222e;
}

.markdown-body .pl-sr .pl-cce {
  font-weight: bold;
  color: #116329;
}

.markdown-body .pl-ml {
  color: #3b2300;
}

.markdown-body .pl-mh,
.markdown-body .pl-mh .pl-en,
.markdown-body .pl-ms {
  font-weight: bold;
  color: #0550ae;
}

.markdown-body .pl-mi {
  font-style: italic;
  color: #1f2328;
}

.markdown-body .pl-mb {
  font-weight: bold;
  color: #1f2328;
}

.markdown-body .pl-md {
  color: #82071e;
  background-color: #ffebe9;
}

.markdown-body .pl-mi1 {
  color: #116329;
  background-color: #dafbe1;
}

.markdown-body .pl-mc {
  color: #953800;
  background-color: #ffd8b5;
}

.markdown-body .pl-mi2 {
  color: #d1d9e0;
  background-color: #0550ae;
}

.markdown-body .pl-mdr {
  font-weight: bold;
  color: #8250df;
}

.markdown-body .pl-ba {
  color: #59636e;
}

.markdown-body .pl-sg {
  color: #818b98;
}

.markdown-body .pl-corl {
  text-decoration: underline;
  color: #0a3069;
}

.markdown-body [role=button]:focus:not(:focus-visible),
.markdown-body [role=tabpanel][tabindex="0"]:focus:not(:focus-visible),
.markdown-body button:focus:not(:focus-visible),
.markdown-body summary:focus:not(:focus-visible),
.markdown-body a:focus:not(:focus-visible) {
  outline: none;
  box-shadow: none;
}

.markdown-body [tabindex="0"]:focus:not(:focus-visible),
.markdown-body details-dialog:focus:not(:focus-visible) {
  outline: none;
}

.markdown-body g-emoji {
  display: inline-block;
  min-width: 1ch;
  font-family: "Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
  font-size: 1em;
  font-style: normal !important;
  font-weight: 400;
  line-height: 1;
  vertical-align: -0.075em;
}

.markdown-body g-emoji img {
  width: 1em;
  height: 1em;
}

.markdown-body a:has(>p,>div,>pre,>blockquote) {
  display: block;
}

.markdown-body a:has(>p,>div,>pre,>blockquote):not(:has(.snippet-clipboard-content,>pre)) {
  width: fit-content;
}

.markdown-body a:has(>p,>div,>pre,>blockquote):has(.snippet-clipboard-content,>pre):focus-visible {
  outline: 2px solid var(--borderColor-accent-emphasis);
  outline-offset: 2px;
}

.markdown-body .task-list-item {
  list-style-type: none;
}

.markdown-body .task-list-item label {
  font-weight: 400;
}

.markdown-body .task-list-item.enabled label {
  cursor: pointer;
}

.markdown-body .task-list-item+.task-list-item {
  margin-top: 0.25rem;
}

.markdown-body .task-list-item .handle {
  display: none;
}

.markdown-body .task-list-item-checkbox {
  margin: 0 .2em .25em -1.4em;
  vertical-align: middle;
}

.markdown-body ul:dir(rtl) .task-list-item-checkbox {
  margin: 0 -1.6em .25em .2em;
}

.markdown-body ol:dir(rtl) .task-list-item-checkbox {
  margin: 0 -1.6em .25em .2em;
}

.markdown-body .contains-task-list:hover .task-list-item-convert-container,
.markdown-body .contains-task-list:focus-within .task-list-item-convert-container {
  display: block;
  width: auto;
  height: 24px;
  overflow: visible;
  clip-path: none;
}

.markdown-body ::-webkit-calendar-picker-indicator {
  filter: invert(50%);
}

.markdown-body .markdown-alert {
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  color: inherit;
  border-left: .25em solid #d1d9e0;
}

.markdown-body .markdown-alert>:first-child {
  margin-top: 0;
}

.markdown-body .markdown-alert>:last-child {
  margin-bottom: 0;
}

.markdown-body .markdown-alert .markdown-alert-title {
  display: flex;
  font-weight: 500;
  align-items: center;
  line-height: 1;
}

.markdown-body .markdown-alert.markdown-alert-note {
  border-left-color: #0969da;
}

.markdown-body .markdown-alert.markdown-alert-note .markdown-alert-title {
  color: #0969da;
}

.markdown-body .markdown-alert.markdown-alert-important {
  border-left-color: #8250df;
}

.markdown-body .markdown-alert.markdown-alert-important .markdown-alert-title {
  color: #8250df;
}

.markdown-body .markdown-alert.markdown-alert-warning {
  border-left-color: #9a6700;
}

.markdown-body .markdown-alert.markdown-alert-warning .markdown-alert-title {
  color: #9a6700;
}

.markdown-body .markdown-alert.markdown-alert-tip {
  border-left-color: #1a7f37;
}

.markdown-body .markdown-alert.markdown-alert-tip .markdown-alert-title {
  color: #1a7f37;
}

.markdown-body .markdown-alert.markdown-alert-caution {
  border-left-color: #cf222e;
}

.markdown-body .markdown-alert.markdown-alert-caution .markdown-alert-title {
  color: #d1242f;
}

.markdown-body>*:first-child>.heading-element:first-child {
  margin-top: 0 !important;
}

.markdown-body .highlight pre:has(+.zeroclipboard-container) {
  min-height: 52px;
}

\`,mi=\`pre code.hljs {
  display: block;
  overflow-x: auto;
  padding: 1em
}
code.hljs {
  padding: 3px 5px
}
/*!
  Theme: GitHub
  Description: Light theme as seen on github.com
  Author: github.com
  Maintainer: @Hirse
  Updated: 2021-05-15

  Outdated base version: https://github.com/primer/github-syntax-light
  Current colors taken from GitHub's CSS
*/
.hljs {
  color: #24292e;
  background: #ffffff
}
.hljs-doctag,
.hljs-keyword,
.hljs-meta .hljs-keyword,
.hljs-template-tag,
.hljs-template-variable,
.hljs-type,
.hljs-variable.language_ {
  /* prettylights-syntax-keyword */
  color: #d73a49
}
.hljs-title,
.hljs-title.class_,
.hljs-title.class_.inherited__,
.hljs-title.function_ {
  /* prettylights-syntax-entity */
  color: #6f42c1
}
.hljs-attr,
.hljs-attribute,
.hljs-literal,
.hljs-meta,
.hljs-number,
.hljs-operator,
.hljs-variable,
.hljs-selector-attr,
.hljs-selector-class,
.hljs-selector-id {
  /* prettylights-syntax-constant */
  color: #005cc5
}
.hljs-regexp,
.hljs-string,
.hljs-meta .hljs-string {
  /* prettylights-syntax-string */
  color: #032f62
}
.hljs-built_in,
.hljs-symbol {
  /* prettylights-syntax-variable */
  color: #e36209
}
.hljs-comment,
.hljs-code,
.hljs-formula {
  /* prettylights-syntax-comment */
  color: #6a737d
}
.hljs-name,
.hljs-quote,
.hljs-selector-tag,
.hljs-selector-pseudo {
  /* prettylights-syntax-entity-tag */
  color: #22863a
}
.hljs-subst {
  /* prettylights-syntax-storage-modifier-import */
  color: #24292e
}
.hljs-section {
  /* prettylights-syntax-markup-heading */
  color: #005cc5;
  font-weight: bold
}
.hljs-bullet {
  /* prettylights-syntax-markup-list */
  color: #735c0f
}
.hljs-emphasis {
  /* prettylights-syntax-markup-italic */
  color: #24292e;
  font-style: italic
}
.hljs-strong {
  /* prettylights-syntax-markup-bold */
  color: #24292e;
  font-weight: bold
}
.hljs-addition {
  /* prettylights-syntax-markup-inserted */
  color: #22863a;
  background-color: #f0fff4
}
.hljs-deletion {
  /* prettylights-syntax-markup-deleted */
  color: #b31d28;
  background-color: #ffeef0
}
.hljs-char.escape_,
.hljs-link,
.hljs-params,
.hljs-property,
.hljs-punctuation,
.hljs-tag {
  /* purposely ignored */
  
}\`});var lo,fi=v(()=>{"use strict";bt();lo=Ye});var gi,hi=v(()=>{"use strict";bt();gi=Ye+\`

/* ===== Notion theme overrides ===== */
.markdown-body {
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.75;
  color: #37352f;
  background-color: #fff;
}
.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  font-weight: 700;
  letter-spacing: -0.3px;
  color: #37352f;
  border-bottom: none;
}
.markdown-body h1 { font-size: 1.875em; margin-top: 1.4em; }
.markdown-body h2 { font-size: 1.5em; margin-top: 1.4em; }
.markdown-body h3 { font-size: 1.25em; }
.markdown-body p { color: #37352f; margin-bottom: 1em; }
.markdown-body a { color: #0f6cbd; text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  background: rgba(135,131,120,0.15);
  border-radius: 3px;
  padding: 0.2em 0.4em;
  color: #eb5757;
  border: none;
}
.markdown-body pre {
  background: #f7f6f3;
  border-radius: 4px;
  border: none;
}
.markdown-body pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  border: none;
}
.markdown-body blockquote {
  border-left: 3px solid #37352f;
  color: #6b6b6b;
}
.markdown-body hr {
  border-top-color: rgba(55,53,47,0.16);
}
.markdown-body table th {
  background: rgba(55,53,47,0.05);
}
.markdown-body table th, .markdown-body table td {
  border-color: rgba(55,53,47,0.2);
}
\`});var yi,bi=v(()=>{"use strict";bt();yi=Ye+\`

/* ===== Bear / iA Writer theme overrides ===== */
.markdown-body {
  font-family: "Georgia", "Times New Roman", "Palatino Linotype", serif;
  font-size: 17px;
  line-height: 1.8;
  color: #2c2c2c;
  background-color: #faf9f7;
}
.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-weight: 700;
  color: #1a1a1a;
  border-bottom-color: #d4cfc8;
}
.markdown-body h1 { font-size: 1.8em; margin-top: 1.6em; }
.markdown-body h2 { font-size: 1.4em; margin-top: 1.6em; }
.markdown-body h3 { font-size: 1.2em; }
.markdown-body p { margin-bottom: 1.1em; }
.markdown-body a { color: #c7254e; text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body em { font-style: italic; color: #444; }
.markdown-body code {
  font-family: "SFMono-Regular", Consolas, monospace;
  background: #f0ede8;
  border-radius: 3px;
  padding: 0.2em 0.4em;
  color: #c7254e;
  border: none;
}
.markdown-body pre {
  background: #f0ede8;
  border-radius: 5px;
  border: none;
}
.markdown-body pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  border: none;
}
.markdown-body blockquote {
  border-left-color: #c9c4bc;
  color: #777;
  font-style: italic;
}
.markdown-body hr {
  border-top-color: #d4cfc8;
}
.markdown-body table {
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.9em;
}
.markdown-body table th, .markdown-body table td {
  border-color: #d4cfc8;
}
.markdown-body table th {
  background: #f0ede8;
}
\`});var co,wi=v(()=>{"use strict";bt();co=mi});var vi,ki=v(()=>{"use strict";vi=\`
pre code.hljs { display: block; overflow-x: auto; padding: 1em; }
code.hljs { padding: 3px 5px; }
.hljs { color: #e6edf3; background: #0d1117; }
.hljs-doctag, .hljs-keyword, .hljs-meta .hljs-keyword,
.hljs-template-tag, .hljs-template-variable, .hljs-type, .hljs-variable.language_ { color: #ff7b72; }
.hljs-title, .hljs-title.class_, .hljs-title.class_.inherited__,
.hljs-title.function_ { color: #d2a8ff; }
.hljs-attr, .hljs-attribute, .hljs-literal, .hljs-meta,
.hljs-number, .hljs-operator, .hljs-selector-attr,
.hljs-selector-class, .hljs-selector-id, .hljs-variable { color: #79c0ff; }
.hljs-meta .hljs-string, .hljs-regexp, .hljs-string { color: #a5d6ff; }
.hljs-built_in, .hljs-symbol { color: #ffa657; }
.hljs-code, .hljs-comment, .hljs-formula { color: #8b949e; }
.hljs-name, .hljs-quote, .hljs-selector-pseudo, .hljs-selector-tag { color: #7ee787; }
.hljs-subst { color: #e6edf3; }
.hljs-section { color: #1f6feb; font-weight: bold; }
.hljs-bullet { color: #f2cc60; }
.hljs-emphasis { color: #e6edf3; font-style: italic; }
.hljs-strong { color: #e6edf3; font-weight: bold; }
.hljs-addition { color: #aff5b4; background-color: #033a16; }
.hljs-deletion { color: #ffdcd7; background-color: #67060c; }
\`});var xi,Ti=v(()=>{"use strict";xi=\`
pre code.hljs { display: block; overflow-x: auto; padding: 1em; }
code.hljs { padding: 3px 5px; }
.hljs { color: #abb2bf; background: #282c34; }
.hljs-comment, .hljs-quote { color: #5c6370; font-style: italic; }
.hljs-doctag, .hljs-keyword, .hljs-formula { color: #c678dd; }
.hljs-section, .hljs-name, .hljs-selector-tag,
.hljs-deletion, .hljs-subst { color: #e06c75; }
.hljs-literal { color: #56b6c2; }
.hljs-string, .hljs-regexp, .hljs-addition,
.hljs-attribute, .hljs-meta .hljs-string { color: #98c379; }
.hljs-attr, .hljs-variable, .hljs-template-variable,
.hljs-type, .hljs-selector-class, .hljs-selector-attr,
.hljs-selector-pseudo, .hljs-number { color: #d19a66; }
.hljs-symbol, .hljs-bullet, .hljs-link,
.hljs-meta, .hljs-selector-id, .hljs-title { color: #61aeee; }
.hljs-built_in, .hljs-title.class_, .hljs-class .hljs-title { color: #e6c07b; }
.hljs-emphasis { font-style: italic; }
.hljs-strong { font-weight: bold; }
.hljs-link { text-decoration: underline; }
\`});function Ei(e){return uo.find(t=>t.key===e)?.css??lo}function Mi(e){return po.find(t=>t.key===e)?.css??co}var uo,po,mo=v(()=>{"use strict";fi();hi();bi();wi();ki();Ti();uo=[{key:"github",label:"GitHub",css:lo},{key:"notion",label:"Notion",css:gi},{key:"bear",label:"Bear / iA Writer",css:yi}],po=[{key:"github",label:"GitHub Light",css:co},{key:"github-dark",label:"GitHub Dark",css:vi},{key:"atom-one-dark",label:"Atom One Dark",css:xi}]});function Ai(){an=c.config.markdownTheme||"github",fo=c.config.codeTheme||"github",go=c.config.mathInline!==!1,document.getElementById("settingsDialogOverlay")||Cs(),\$s();let t=document.getElementById("settingsDialogOverlay");t&&t.classList.add("show")}function Cs(){let e=document.createElement("div");e.id="settingsDialogOverlay",e.className="sync-dialog-overlay",e.innerHTML=\`
    <div class="sync-dialog">
      <div class="sync-dialog-header">
        <div class="sync-dialog-title">\\u8BBE\\u7F6E</div>
        <button class="sync-dialog-close" onclick="closeSettingsDialog()">\\xD7</button>
      </div>
      <div class="sync-dialog-body" id="settingsDialogBody">
        <!-- \\u52A8\\u6001\\u5185\\u5BB9 -->
      </div>
      <div class="sync-dialog-footer">
        <button class="sync-dialog-button" onclick="closeSettingsDialog()">\\u53D6\\u6D88</button>
        <button class="sync-dialog-button primary" onclick="saveSettings()">\\u4FDD\\u5B58</button>
      </div>
    </div>
  \`,document.body.appendChild(e),e.addEventListener("click",t=>{t.target===e&&wt()})}function \$s(){let e=document.getElementById("settingsDialogBody");if(!e)return;let t=Ps();e.innerHTML=\`
    <div class="settings-section">
      <div class="settings-section-title">\\u4E3B\\u9898</div>
      <div class="settings-section-desc">\\u5207\\u6362 Markdown \\u6B63\\u6587\\u6837\\u5F0F\\u548C\\u4EE3\\u7801\\u9AD8\\u4EAE\\u914D\\u8272\\u3002</div>
      <div class="settings-kv-grid">
        <div>\\u6B63\\u6587\\u6837\\u5F0F</div>
        <div>
          <select id="markdownThemeSelect" style="font-size:12px;padding:2px 6px;border:1px solid #ddd;border-radius:3px">
            \${uo.map(i=>\`<option value="\${i.key}"\${c.config.markdownTheme===i.key?" selected":""}>\${i.label}</option>\`).join("")}
          </select>
        </div>
        <div>\\u4EE3\\u7801\\u9AD8\\u4EAE</div>
        <div>
          <select id="codeThemeSelect" style="font-size:12px;padding:2px 6px;border:1px solid #ddd;border-radius:3px">
            \${po.map(i=>\`<option value="\${i.key}"\${c.config.codeTheme===i.key?" selected":""}>\${i.label}</option>\`).join("")}
          </select>
        </div>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">\\u6570\\u5B66\\u516C\\u5F0F</div>
      <div class="settings-section-desc">\\u4F7F\\u7528 KaTeX \\u6E32\\u67D3 LaTeX \\u516C\\u5F0F\\u3002<code style="font-size:11px">\$\$...\$\$</code> \\u5757\\u7EA7\\u516C\\u5F0F\\u59CB\\u7EC8\\u542F\\u7528\\u3002</div>
      <div class="settings-kv-grid">
        <div>\\u884C\\u5185\\u516C\\u5F0F <code style="font-size:11px">\$...\$</code></div>
        <div>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
            <input type="checkbox" id="mathInlineCheckbox"\${c.config.mathInline!==!1?" checked":""}>
            <span style="font-size:12px">\\u542F\\u7528\\uFF08\\u5173\\u95ED\\u53EF\\u907F\\u514D <code>\$</code> \\u8D27\\u5E01\\u7B26\\u53F7\\u8BEF\\u89E6\\u53D1\\uFF09</span>
          </label>
        </div>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">\\u5DE5\\u4F5C\\u533A</div>
      <div class="settings-section-desc">\\u5DE5\\u4F5C\\u533A\\u6587\\u4EF6\\u6811\\u7684\\u8F6E\\u8BE2\\u95F4\\u9694\\uFF0C\\u7528\\u4E8E\\u611F\\u77E5\\u65B0\\u589E/\\u5220\\u9664\\u6587\\u4EF6\\u3002\\u6587\\u4EF6\\u5185\\u5BB9\\u53D8\\u5316\\u7531 SSE \\u5B9E\\u65F6\\u63A8\\u9001\\uFF0C\\u4E0D\\u53D7\\u6B64\\u8BBE\\u7F6E\\u5F71\\u54CD\\u3002\\u4FEE\\u6539\\u540E\\u5237\\u65B0\\u9875\\u9762\\u751F\\u6548\\u3002</div>
      <div class="settings-kv-grid">
        <div>\\u8F6E\\u8BE2\\u95F4\\u9694\\uFF08\\u6BEB\\u79D2\\uFF09</div>
        <div>
          <select id="pollIntervalSelect" style="font-size:12px;padding:2px 6px;border:1px solid #ddd;border-radius:3px">
            \${[2e3,5e3,1e4,3e4].map(i=>\`<option value="\${i}"\${(c.config.workspacePollInterval??5e3)===i?" selected":""}>\${i/1e3}s</option>\`).join("")}
          </select>
        </div>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">\\u5BA2\\u6237\\u7AEF\\u72B6\\u6001</div>
      <div class="settings-section-desc">\\u7528\\u4E8E\\u6392\\u67E5\\u672C\\u5730\\u7F13\\u5B58\\u662F\\u5426\\u810F\\u6570\\u636E\\uFF0C\\u53EF\\u76F4\\u63A5\\u6E05\\u7406\\u3002</div>
      <div class="settings-kv-grid">
        <div>\\u5F53\\u524D\\u6587\\u4EF6</div><div>\${Si(t.currentFile||"\\u65E0")}</div>
        <div>\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6\\u6570</div><div>\${t.openFilesCount}</div>
        <div>\\u5DE5\\u4F5C\\u533A\\u6570</div><div>\${t.workspaceCount}</div>
        <div>\\u8BC4\\u8BBA\\u76F8\\u5173\\u672C\\u5730\\u952E\\u6570</div><div>\${t.commentStateKeyCount}</div>
        <div>md-viewer \\u672C\\u5730\\u952E\\u6570</div><div>\${t.mdvKeyCount}</div>
        <div>localStorage \\u603B\\u952E\\u6570</div><div>\${t.localStorageKeyCount}</div>
      </div>
      <div class="settings-key-list">
        \${t.mdvKeys.map(i=>\`<span class="settings-key-chip">\${Si(i)}</span>\`).join("")}
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">\\u6570\\u636E\\u6E05\\u7406</div>
      <div class="settings-section-desc">\\u8BC4\\u8BBA\\u72B6\\u6001\\u6E05\\u7406\\u4F1A\\u540C\\u65F6\\u5220\\u9664\\u670D\\u52A1\\u7AEF SQLite \\u8BC4\\u8BBA\\u6570\\u636E\\u548C\\u5BA2\\u6237\\u7AEF\\u8BC4\\u8BBA\\u76F8\\u5173\\u72B6\\u6001\\uFF0C\\u968F\\u540E\\u81EA\\u52A8\\u5237\\u65B0\\u9875\\u9762\\u3002</div>
      <div class="settings-actions-row">
        <button class="sync-dialog-button" id="clearAllCommentsBtn">\\u6E05\\u7A7A\\u8BC4\\u8BBA\\u72B6\\u6001</button>
        <button class="sync-dialog-button" id="clearClientStateBtn">\\u6E05\\u7406\\u5BA2\\u6237\\u7AEF\\u72B6\\u6001</button>
      </div>
    </div>
  \`,document.getElementById("clearClientStateBtn")?.addEventListener("click",()=>{Bs()}),document.getElementById("clearAllCommentsBtn")?.addEventListener("click",()=>{Ns()});let r=document.getElementById("markdownThemeSelect"),a=document.getElementById("codeThemeSelect");r?.addEventListener("change",()=>{c.config.markdownTheme=r.value,window.applyTheme?.()}),a?.addEventListener("change",()=>{c.config.codeTheme=a.value,window.applyTheme?.()})}function wt(){an&&(c.config.markdownTheme=an,c.config.codeTheme=fo,c.config.mathInline=go,window.applyTheme?.());let e=document.getElementById("settingsDialogOverlay");e&&e.classList.remove("show")}function Is(){let e=document.getElementById("markdownThemeSelect"),t=document.getElementById("codeThemeSelect"),n=document.getElementById("mathInlineCheckbox"),o=document.getElementById("pollIntervalSelect");e&&(c.config.markdownTheme=e.value),t&&(c.config.codeTheme=t.value),n&&(c.config.mathInline=n.checked),o&&(c.config.workspacePollInterval=parseInt(o.value,10)),O(c.config),\$(),an="",fo="",go=!0,wt()}function Ps(){let e=[];for(let o=0;o<localStorage.length;o+=1){let r=localStorage.key(o);r&&e.push(r)}e.sort();let t=e.filter(o=>o.startsWith("md-viewer:")),n=t.filter(o=>o==="md-viewer:annotation-panel-open-by-file"||o==="md-viewer:annotation-density"||o==="md-viewer:annotation-sidebar-width"||o.startsWith("md-viewer:annotations:")).length;return{currentFile:c.currentFile,openFilesCount:c.sessionFiles.size,workspaceCount:c.config.workspaces.length,commentStateKeyCount:n,mdvKeyCount:t.length,localStorageKeyCount:e.length,mdvKeys:t}}function Bs(){let e=[];for(let t=0;t<localStorage.length;t+=1){let n=localStorage.key(t);n&&n.startsWith("md-viewer:")&&e.push(n)}for(let t of e)localStorage.removeItem(t);Q(\`\\u5DF2\\u6E05\\u7406\\u5BA2\\u6237\\u7AEF\\u72B6\\u6001\\uFF08\${e.length} \\u9879\\uFF09\`,1800),window.setTimeout(()=>window.location.reload(),250)}async function Ns(){try{let e=await fetch("/api/annotations/clear",{method:"POST"}),t=await e.json();if(!e.ok||t?.success!==!0)throw new Error(t?.error||\`HTTP \${e.status}\`);let n=[];for(let o=0;o<localStorage.length;o+=1){let r=localStorage.key(o);r&&(r.startsWith("md-viewer:annotations:")&&n.push(r),r==="md-viewer:annotation-panel-open-by-file"&&n.push(r),r==="md-viewer:annotation-density"&&n.push(r),r==="md-viewer:annotation-sidebar-width"&&n.push(r))}for(let o of n)localStorage.removeItem(o);Q(\`\\u5DF2\\u6E05\\u7A7A\\u8BC4\\u8BBA\\u72B6\\u6001\\uFF08\\u670D\\u52A1\\u7AEF \${t?.deleted||0} \\u6761\\uFF0C\\u672C\\u5730 \${n.length} \\u9879\\uFF09\`,1800),window.setTimeout(()=>window.location.reload(),250)}catch(e){L(\`\\u6E05\\u7A7A\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25: \${e?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)}}function Si(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}var an,fo,go,Li=v(()=>{"use strict";H();je();F();qe();mo();an="",fo="",go=!0;typeof window<"u"&&(window.closeSettingsDialog=wt,window.saveSettings=Is)});function Hs(e,t=60){let n=JSON.stringify(e);return n.length<=t?x(n):x(n.slice(0,t))+"\\u2026"}function ho(e,t,n,o){let r=e!==null&&typeof e=="object",a=n<1;if(!r){let k=t!==null?\`<span class="json-key">\${Ze(x(JSON.stringify(t)),o)}</span><span class="json-colon">:</span>\`:"",w=js(e,o);return\`
      <li>
        <div class="json-node">
          <span class="json-toggle"></span>
          \${k}
          \${w}
        </div>
      </li>\`}let i=Array.isArray(e),s=i?e.map((k,w)=>({k:String(w),v:k})):Object.entries(e).map(([k,w])=>({k,v:w})),l=s.length,d=i?"[":"{",u=i?"]":"}",f=!a,p=f?"\\u25B6":"\\u25BC",m=f?"json-children collapsed":"json-children",g=t!==null?\`<span class="json-key">\${Ze(x(JSON.stringify(t)),o)}</span><span class="json-colon">:</span>\`:"",y=f?\`<span class="json-preview">\${Hs(e)}</span>\`:"",b=s.map(({k,v:w})=>ho(w,i?null:k,n+1,o)).join("");return\`
    <li>
      <div class="json-node json-node-expandable" data-expanded="\${!f}">
        <span class="json-toggle">\${p}</span>
        \${g}
        <span class="json-bracket">\${d}</span>
        <span class="json-count">\${l} \${i?"items":"keys"}</span>
        \${y}
        <span class="json-bracket json-close-bracket" style="display:\${f?"none":"inline"}">\${u}</span>
      </div>
      <ul class="\${m}">
        \${b}
        <li><div class="json-node"><span class="json-toggle"></span><span class="json-bracket">\${u}</span></div></li>
      </ul>
    </li>\`}function js(e,t){return e===null?\`<span class="json-null">\${Ze("null",t)}</span>\`:typeof e=="boolean"?\`<span class="json-boolean">\${Ze(String(e),t)}</span>\`:typeof e=="number"?\`<span class="json-number">\${Ze(String(e),t)}</span>\`:\`<span class="json-string">\${Ze(x(JSON.stringify(e)),t)}</span>\`}function Ze(e,t){if(!t)return e;let n=t.toLowerCase(),o=e.toLowerCase(),r="",a=0;for(;a<e.length;){let i=o.indexOf(n,a);if(i===-1){r+=e.slice(a);break}r+=e.slice(a,i),r+=\`<mark class="json-match">\${e.slice(i,i+n.length)}</mark>\`,a=i+n.length}return r}function Ws(e,t){if(!t)return!1;let n=t.toLowerCase(),o=!1;function r(i){let s=i.querySelector(":scope > .json-node"),l=i.querySelector(":scope > .json-children");if(!l)return(s?.textContent?.toLowerCase()||"").includes(n);let d=Array.from(l.querySelectorAll(":scope > li")),u=!1;for(let f of d)r(f)&&(u=!0);if(u){if(o=!0,s){s.setAttribute("data-expanded","true");let f=s.querySelector(".json-toggle");f&&(f.textContent="\\u25BC");let p=s.querySelector(".json-close-bracket");p&&(p.style.display="inline");let m=s.querySelector(".json-preview");m&&(m.style.display="none")}l.classList.remove("collapsed")}return u}let a=Array.from(e.querySelectorAll(":scope > ul > li"));for(let i of a)r(i);return o}function Ds(e){e.addEventListener("click",t=>{let o=t.target.closest(".json-node-expandable");if(!o)return;let a=o.parentElement.querySelector(":scope > .json-children");if(!a)return;let i=o.getAttribute("data-expanded")==="true",s=o.querySelector(".json-toggle"),l=o.querySelector(".json-close-bracket"),d=o.querySelector(".json-preview");if(i)if(o.setAttribute("data-expanded","false"),s&&(s.textContent="\\u25B6"),a.classList.add("collapsed"),l&&(l.style.display="none"),d)d.style.display="";else{let u=document.createElement("span");u.className="json-preview",u.textContent="\\u2026",o.appendChild(u)}else o.setAttribute("data-expanded","true"),s&&(s.textContent="\\u25BC"),a.classList.remove("collapsed"),l&&(l.style.display="inline"),d&&(d.style.display="none")})}function Fi(e,t,n,o=""){if(it(n)?Os(e,t,o):Rs(e,t,o),Ds(e),o&&!Ws(e,o)){let i=document.createElement("div");i.className="json-no-results",i.textContent="\\u65E0\\u5339\\u914D\\u7ED3\\u679C",e.appendChild(i)}}function Rs(e,t,n){let o;try{o=JSON.parse(t)}catch(a){e.innerHTML=\`
      <div class="json-viewer">
        <div class="json-error">
          JSON \\u89E3\\u6790\\u5931\\u8D25\\uFF1A\${x(String(a))}
          <pre>\${x(t.slice(0,500))}</pre>
        </div>
      </div>\`;return}let r=document.createElement("div");r.className="json-viewer",r.innerHTML=\`<ul>\${ho(o,null,0,n)}</ul>\`,e.appendChild(r)}function Os(e,t,n){let o=t.split(\`
\`),r=document.createElement("div");r.className="json-viewer";let a=0;for(let i of o){let s=i.trim();if(!s)continue;a++;let l=document.createElement("div");l.className="json-line-header",l.textContent=\`Line \${a}\`,r.appendChild(l);let d;try{d=JSON.parse(s)}catch(f){let p=document.createElement("div");p.className="json-error",p.innerHTML=\`\\u89E3\\u6790\\u5931\\u8D25\\uFF1A\${x(String(f))}<pre>\${x(s.slice(0,200))}</pre>\`,r.appendChild(p);continue}let u=document.createElement("ul");u.innerHTML=ho(d,null,0,n),r.appendChild(u)}e.appendChild(r)}var Ci=v(()=>{"use strict";Me();at()});function qs(){return window.pdfjsLib?Promise.resolve(window.pdfjsLib):new Promise(e=>{window.addEventListener("pdfjslib-ready",()=>e(window.pdfjsLib),{once:!0})})}async function Ii(e){let{container:t,filePath:n,scale:o=_s}=e,r=document.createElement("div");r.className="pdf-viewer-container",t.appendChild(r);let a=await qs(),i=\`/api/pdf-asset?path=\${encodeURIComponent(n)}\`,s=await a.getDocument(i).promise,l=s.numPages,d=window.devicePixelRatio||1,u=[],f=new Map,p=new Set,m=new Set,y=(await s.getPage(1)).getViewport({scale:o}),b=y.width,k=y.height;for(let M=1;M<=l;M++){let A=document.createElement("div");A.className="pdf-page-wrapper pdf-page-placeholder",A.dataset.page=String(M),A.style.position="relative",A.style.width=\`\${b}px\`,A.style.height=\`\${k}px\`,A.style.marginBottom="16px",A.style.background="white",r.appendChild(A),u.push(A)}async function w(M){if(p.has(M)||m.has(M))return;m.add(M);let A=u[M-1],B=await s.getPage(M),j=B.getViewport({scale:o});A.style.width=\`\${j.width}px\`,A.style.height=\`\${j.height}px\`;let se=document.createElement("canvas");se.width=Math.floor(j.width*d),se.height=Math.floor(j.height*d),se.style.width=\`\${j.width}px\`,se.style.height=\`\${j.height}px\`;let xt=se.getContext("2d");xt.scale(d,d);let Be=performance.now();await B.render({canvasContext:xt,viewport:j}).promise,A.appendChild(se);let V=document.createElement("div");V.className="pdf-text-layer textLayer",V.style.cssText=\`
      width: \${j.width}px; height: \${j.height}px;
      pointer-events: auto; user-select: text;
    \`,A.appendChild(V);let un=await B.getTextContent();await new a.TextLayer({textContentSource:un,container:V,viewport:j}).render(),window.__pdfDebug&&console.log(\`[pdf] page \${M}: \${(performance.now()-Be).toFixed(0)}ms\`);let Mo=Vs(M,un.items,j,o);f.set(M,Mo),e.onParagraphClick&&V.addEventListener("click",Tt=>{if(window.getSelection()?.toString())return;let Ne=Tt.offsetY/o,He=Js(Mo,Ne);He&&e.onParagraphClick(He)}),e.onTextSelected&&V.addEventListener("mouseup",Tt=>{let Ne=window.getSelection();if(!Ne||Ne.isCollapsed)return;let He=Ne.toString().trim();if(!He)return;Qs(Ne,V);let{prefix:la,suffix:ca}=Us(un.items,He);e.onTextSelected(M,He,la,ca,Tt.clientX,Tt.clientY)}),A.classList.remove("pdf-page-placeholder"),p.add(M),m.delete(M)}let E=new IntersectionObserver(M=>{for(let A of M)if(A.isIntersecting){let B=parseInt(A.target.dataset.page||"0",10);B&&w(B)}},{root:t,rootMargin:\`\${Ks}px 0px\`,threshold:0});for(let M of u)E.observe(M);function I(M){let A=u[M-1];A&&A.scrollIntoView({behavior:"smooth",block:"start"})}function P(M,A){Z();let B=u[M-1];if(!B)return;if(!p.has(M)){w(M).then(()=>P(M,A));return}let j=B.querySelector(".pdf-text-layer");if(!j)return;let se=Array.from(j.querySelectorAll("span")).filter(Be=>Be.querySelector("span")===null),xt=A.toLowerCase().replace(/\\s+/g," ").trim();for(let Be of se){let V=(Be.textContent||"").toLowerCase().replace(/\\s+/g," ").trim();V&&xt.includes(V)&&Be.classList.add("pdf-highlight")}}function Z(){r.querySelectorAll(".pdf-highlight").forEach(M=>{M.classList.remove("pdf-highlight")})}function we(){r.querySelectorAll(".pdf-selection-mark").forEach(M=>{M.classList.remove("pdf-selection-mark")})}function ee(M){return f.get(M)??[]}function D(){E.disconnect(),r.remove(),p.clear(),m.clear(),f.clear()}function R(){return p.size}function ve(){return l}return{el:r,destroy:D,scrollToPage:I,highlightQuote:P,clearHighlights:Z,clearSelectionMark:we,getTextBlocks:ee,getRenderedCount:R,getTotalPages:ve}}function Vs(e,t,n,o){if(!t.length)return[];let r=[...t].filter(s=>s.str.trim()).sort((s,l)=>{let d=n.height/o-s.transform[5],u=n.height/o-l.transform[5];return d-u||s.transform[4]-l.transform[4]}),a=[],i=[r[0]];for(let s=1;s<r.length;s++){let l=r[s-1],d=r[s],u=n.height/o-l.transform[5],f=n.height/o-d.transform[5],p=l.height||12;Math.abs(f-u)<p*zs?i.push(d):(a.push(\$i(e,i,n,o)),i=[d])}return a.push(\$i(e,i,n,o)),a}function \$i(e,t,n,o){let r=Math.min(...t.map(l=>l.transform[4])),a=n.height/o-Math.max(...t.map(l=>l.transform[5])),i=Math.max(...t.map(l=>l.transform[4]+l.width))-r,s=Math.max(...t.map(l=>l.height||12));return{pageNum:e,items:t,text:t.map(l=>l.str).join(" "),x:r,y:a,width:i,height:s}}function Js(e,t){return e.find(n=>t>=n.y-2&&t<=n.y+n.height+4)??null}function Us(e,t){let n=e.map(r=>r.str).join(" "),o=n.toLowerCase().indexOf(t.toLowerCase());return o===-1?{prefix:"",suffix:""}:{prefix:n.slice(Math.max(0,o-50),o).trim(),suffix:n.slice(o+t.length,o+t.length+50).trim()}}function Qs(e,t){if(e.rangeCount===0)return;let n=e.getRangeAt(0);if(n.collapsed)return;let o=document.createTreeWalker(t,NodeFilter.SHOW_TEXT,null),r;for(;r=o.nextNode();){let a=r.parentElement;if(!a||a.querySelector("span"))continue;let i=document.createRange();i.selectNode(r),i.compareBoundaryPoints(Range.START_TO_END,n)>0&&i.compareBoundaryPoints(Range.END_TO_START,n)<0&&a.classList.add("pdf-selection-mark")}}var _s,zs,Ks,Pi=v(()=>{"use strict";_s=1.5,zs=1.5,Ks=2500});function Bi(e){function t(o,r,a,i,s,l){let d=e.getAnnotations(),u=Jn(d),f={id:crypto.randomUUID(),serial:u,start:0,length:0,quote:r,quotePrefix:a,quoteSuffix:i,note:"",createdAt:Date.now(),status:"anchored",page:o,fileType:"pdf"};document.dispatchEvent(new CustomEvent("pdf:show-composer",{detail:{annotation:f,filePath:e.filePath,clientX:s,clientY:l}}))}function n(o){e.viewer.clearHighlights();for(let r of o){let a=r;a.fileType==="pdf"&&typeof a.page=="number"&&a.quote&&e.viewer.highlightQuote(a.page,a.quote)}}return{handleTextSelected:t,renderHighlights:n}}var Ni=v(()=>{"use strict";Qt()});function Hi(e){return\`\${e.pageNum}:\${e.y.toFixed(0)}\`}function Gs(e,t,n,o){let r=Hi(t),a=et.get(r);if(a){a.remove(),et.delete(r);return}let i=document.createElement("div");i.className="pdf-translation-overlay",i.style.cssText=\`
    position: absolute;
    left: \${t.x*o}px;
    top: \${(t.y+t.height)*o+4}px;
    width: \${Math.max(t.width*o,200)}px;
    background: rgba(255, 253, 230, 0.97);
    border: 1px solid #e0d080;
    border-radius: 4px;
    padding: 6px 10px;
    font-size: 13px;
    line-height: 1.5;
    color: #444;
    z-index: 100;
    pointer-events: auto;
    cursor: pointer;
  \`,i.title="Click to dismiss",i.textContent=n,i.addEventListener("click",()=>{i.remove(),et.delete(r)}),e.appendChild(i),et.set(r,i)}async function ji(e,t,n,o){let r=Hi(t),a=et.get(r);if(a){a.remove(),et.delete(r);return}let i=document.createElement("div");i.className="pdf-translation-overlay pdf-translation-loading",i.style.cssText=\`
    position: absolute;
    left: \${t.x*o}px;
    top: \${(t.y+t.height)*o+4}px;
    background: rgba(240,240,240,0.9);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    color: #888;
    z-index: 100;
  \`,i.textContent="\\u7FFB\\u8BD1\\u4E2D\\u2026",e.appendChild(i);try{let s=await n.translate(t.text,"en","zh");i.remove(),Gs(e,t,s,o)}catch{i.remove();let l=document.createElement("div");l.className="pdf-translation-overlay",l.style.cssText=i.style.cssText,l.style.color="#c00",l.textContent="\\u7FFB\\u8BD1\\u5931\\u8D25",e.appendChild(l),setTimeout(()=>l.remove(),2e3)}}var sn,et,Wi=v(()=>{"use strict";sn=class{async translate(t,n,o){let r=\`\${n}|\${o}\`,a=\`https://api.mymemory.translated.net/get?q=\${encodeURIComponent(t)}&langpair=\${encodeURIComponent(r)}\`,i=await fetch(a);if(!i.ok)throw new Error(\`MyMemory error: \${i.status}\`);let s=await i.json();if(s.responseStatus!==200)throw new Error(s.responseDetails||"Translation failed");return s.responseData.translatedText}},et=new Map});var Le={};ke(Le,{renderAll:()=>il});function qi(){let e=Ei(c.config.markdownTheme||"github"),t=Mi(c.config.codeTheme||"github"),n=document.getElementById("theme-md-css"),o=document.getElementById("theme-hl-css");n&&(n.textContent=e),o&&(o.textContent=t)}function Ki(e){let t=re.get(e);t&&(t.idleTimer&&clearTimeout(t.idleTimer),t.viewer.destroy(),re.delete(e))}function Zs(e){let t=re.get(e);t&&(t.idleTimer&&clearTimeout(t.idleTimer),t.idleTimer=setTimeout(()=>Ki(e),zi))}function el(e){let t=re.get(e);t&&(t.idleTimer&&(clearTimeout(t.idleTimer),t.idleTimer=null),t.lastActiveAt=Date.now())}function Ie(e=!1){let t=c.currentFile&&!Xi(c.currentFile)?c.currentFile:null,n=Ir();(e||t!==n)&&Cr(t),W(),N(t)}async function Vi(e,t=!1){let n=c.currentFile,o=t;Mn(e,o),o&&(c.config.sidebarTab==="focus"||c.config.sidebarTab==="full")&&await ao(e.path),o&&e.path,\$(),Y(),Ie(o&&n!==e.path),o&&n!==e.path&&Ji()}function Ji(){let e=document.getElementById("content");e&&e.scrollTo({top:0,behavior:"auto"})}function tl(){return Math.max(_i,Math.min(Xs,window.innerWidth-360))}function ko(e){return Math.min(tl(),Math.max(_i,Math.round(e)))}function vt(e){let t=ko(e);document.documentElement.style.setProperty("--sidebar-width",\`\${t}px\`)}function nl(){let e=Number(localStorage.getItem(wo)),t=Number.isFinite(e)&&e>0?e:vo;vt(t)}function ol(){let e=document.getElementById("sidebarResizer");if(!e)return;let t=!1,n=r=>{if(!t)return;let a=ko(r.clientX);vt(a)},o=r=>{if(!t)return;t=!1;let a=ko(r.clientX);vt(a),localStorage.setItem(wo,String(a)),document.body.classList.remove("sidebar-resizing"),window.removeEventListener("mousemove",n),window.removeEventListener("mouseup",o)};e.addEventListener("mousedown",r=>{window.innerWidth<=900||(t=!0,document.body.classList.add("sidebar-resizing"),window.addEventListener("mousemove",n),window.addEventListener("mouseup",o),r.preventDefault())}),e.addEventListener("dblclick",()=>{vt(vo),localStorage.setItem(wo,String(vo))}),window.addEventListener("resize",()=>{let r=Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sidebar-width"),10);Number.isFinite(r)&&vt(r)})}async function rl(){c.currentFile&&await Gi(c.currentFile,{silent:!0,highlight:!1})}async function Ui(e){await Gi(e,{silent:!1,highlight:!0})&&c.currentFile===e&&Q("\\u6587\\u4EF6\\u5DF2\\u5237\\u65B0",2e3)}function Qi(){let e=document.getElementById("content");e&&(e.style.animation="flash 700ms ease-out",setTimeout(()=>{e.style.animation=""},700))}async function Gi(e,t={}){let n=c.sessionFiles.get(e);if(!n||n.isMissing)return!1;let o=(yo.get(e)||0)+1;yo.set(e,o);let r=await _e(e,t.silent!==!1);if(!r||yo.get(e)!==o)return!1;let a=c.sessionFiles.get(e)||c.sessionFiles.get(r.path);if(!a)return!1;if(a.content=r.content,a.pendingContent=void 0,r.lastModified>=(a.lastModified||0)&&(a.lastModified=r.lastModified),a.displayedModified=r.lastModified,a.isMissing=!1,J(),c.currentFile===e||c.currentFile===r.path){if(ae){ae=!1;let i=document.getElementById("diffButton");i&&i.classList.remove("active")}Y(),requestAnimationFrame(()=>{Ie(!1),t.highlight&&Qi()})}return \$(),await ie(),!0}function il(){\$(),Y(),Ie(!1)}function al(e,t){let n=\`\${e}/\${t}\`,o=n.startsWith("/"),r=n.split("/"),a=[];for(let i of r)if(!(!i||i===".")){if(i===".."){a.length>0&&a.pop();continue}a.push(i)}return\`\${o?"/":""}\${a.join("/")}\`}function sl(e,t){let n=e.trim();if(!n||n.startsWith("http://")||n.startsWith("https://")||n.startsWith("data:")||n.startsWith("blob:")||n.startsWith("/api/")||Zi(t))return null;let o=n.indexOf("?"),r=n.indexOf("#"),a=[o,r].filter(u=>u>=0).sort((u,f)=>u-f)[0]??-1,i=a>=0?n.slice(0,a):n,s=a>=0?n.slice(a):"",l=t.slice(0,t.lastIndexOf("/")),d=i.startsWith("/")?i:al(l,i);return\`/api/file-asset?path=\${encodeURIComponent(d)}\${s}\`}function ll(e,t){let n=e.querySelector(".markdown-body");n&&n.querySelectorAll("img[src], video[src], source[src]").forEach(o=>{let r=o.getAttribute("src");if(!r)return;let a=sl(r,t);a&&o.setAttribute("src",a)})}function cl(e){let t=window.renderMathInElement;if(!t)return;let n=c.config.mathInline!==!1,o=[{left:"\$\$",right:"\$\$",display:!0},{left:"\\\\[",right:"\\\\]",display:!0},{left:"\\\\(",right:"\\\\)",display:!1},...n?[{left:"\$",right:"\$",display:!1}]:[]];t(e,{delimiters:o,throwOnError:!1,ignoredTags:["script","noscript","style","textarea","pre","code"]})}async function dl(e){let t=window.mermaid;if(!t)return;let n=Array.from(e.querySelectorAll(".markdown-body pre > code.language-mermaid, .markdown-body pre > code.lang-mermaid, .markdown-body pre > code.language-flowchart, .markdown-body pre > code.lang-flowchart"));if(n.length===0)return;Di||(t.initialize({startOnLoad:!1,theme:"neutral",securityLevel:"loose"}),Di=!0);let o=a=>{let i=a.textContent||"\\u590D\\u5236";a.textContent="\\u2713",a.classList.add("copied"),window.setTimeout(()=>{a.textContent=i,a.classList.remove("copied")},900)},r=(a,i)=>{let s=document.createElement("div");s.className="mermaid-source-panel",s.style.display=i?"block":"none";let l=document.createElement("div");l.className="mermaid-source-head";let d=document.createElement("span");d.textContent="Mermaid \\u6E90\\u7801";let u=document.createElement("button");u.className="mermaid-source-copy",u.textContent="\\u590D\\u5236",u.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(a),o(u)}catch{}}),l.appendChild(d),l.appendChild(u);let f=document.createElement("pre"),p=document.createElement("code");p.className="language-mermaid",p.textContent=a,f.appendChild(p),s.appendChild(l),s.appendChild(f);let m=document.createElement("button");return m.className="mermaid-source-toggle",m.textContent=i?"\\u9690\\u85CF\\u6E90\\u7801":"\\u6E90\\u7801",m.addEventListener("click",()=>{let g=s.style.display!=="none";s.style.display=g?"none":"block",m.textContent=g?"\\u6E90\\u7801":"\\u9690\\u85CF\\u6E90\\u7801"}),{panel:s,toggleButton:m}};for(let a=0;a<n.length;a+=1){let i=n[a],s=i.closest("pre");if(!s)continue;let l=(i.textContent||"").trim();if(!l)continue;let d=i.classList.contains("language-flowchart")||i.classList.contains("lang-flowchart"),u=l.split(\`
\`).find(p=>p.trim().length>0)?.trim().toLowerCase()||"",f=d&&!u.startsWith("flowchart")&&!u.startsWith("graph")?\`flowchart TD
\${l}\`:l;if(f)try{let p=\`mdv-mermaid-\${Date.now()}-\${a}\`,{svg:m,bindFunctions:g}=await t.render(p,f),y=document.createElement("div");y.className="mermaid-block";let b=document.createElement("div");b.className="mermaid-actions";let{panel:k,toggleButton:w}=r(f,!1);b.appendChild(w);let E=document.createElement("div");E.className="mermaid",E.setAttribute("data-mdv-mermaid","1"),E.innerHTML=m,y.appendChild(b),y.appendChild(E),y.appendChild(k),s.replaceWith(y),typeof g=="function"&&g(E)}catch(p){let m=document.createElement("div");m.className="mermaid-fallback-block";let g=document.createElement("div");g.className="mermaid-actions";let{panel:y,toggleButton:b}=r(f,!0);g.appendChild(b);let k=document.createElement("div");k.className="mermaid-fallback-notice",k.textContent="Mermaid \\u8BED\\u6CD5\\u9519\\u8BEF\\uFF0C\\u5DF2\\u56DE\\u9000\\u4E3A\\u539F\\u6587\\u663E\\u793A",m.appendChild(g),m.appendChild(k),m.appendChild(y),s.replaceWith(m),console.error("Mermaid \\u6E32\\u67D3\\u5931\\u8D25\\uFF0C\\u5DF2\\u56DE\\u9000\\u539F\\u6587:",p)}}}function Y(){let e=document.getElementById("content");if(!e)return;for(let[a,i]of re.entries())i.viewer.el.parentNode&&i.viewer.el.remove(),a!==c.currentFile&&Zs(a);if(tt=null,e.removeAttribute("data-pdf"),!c.currentFile){e.removeAttribute("data-current-file"),e.innerHTML=\`
      <div class="empty-state">
        <h2>\\u6B22\\u8FCE\\u4F7F\\u7528 MD Viewer</h2>
        <p>\\u5728\\u5DE6\\u4FA7\\u6DFB\\u52A0 Markdown/HTML \\u6587\\u4EF6\\u5F00\\u59CB\\u9605\\u8BFB</p>
      </div>
    \`;return}let t=c.sessionFiles.get(c.currentFile);if(!t)return;if(Xi(t.path)){e.setAttribute("data-current-file",t.path),e.innerHTML=\`<iframe class="html-preview-frame" srcdoc="\${t.content.replace(/"/g,"&quot;").replace(/'/g,"&#39;")}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"></iframe>\`;let a=document.getElementById("fileMeta");a&&(a.textContent=rn(t.lastModified)),ln(),ie();return}if(ml(t.path)){e.setAttribute("data-current-file",t.path),e.innerHTML="";let i=document.getElementById("searchInput")?.value?.trim()??"";Fi(e,t.content,t.path,i);let s=document.getElementById("fileMeta");s&&(s.textContent=rn(t.lastModified)),ln(),ie();return}if(Yi(t.path)){let a=t.path,i=1.5;el(a),e.setAttribute("data-pdf","1");let s=re.get(a);if(s){tt=s.viewer,e.innerHTML="",e.appendChild(s.viewer.el),e.setAttribute("data-current-file",a),ln(),ie();return}e.innerHTML="";let l=null;Ii({container:e,filePath:a,scale:i,onTextSelected:(d,u,f,p,m,g)=>{l?.handleTextSelected(d,u,f,p,m,g)},onParagraphClick:d=>{let u=d.pageNum?re.get(a)?.viewer.el.querySelector(\`.pdf-page-wrapper[data-page="\${d.pageNum}"]\`):null;u&&ji(u,d,Ys,i)}}).then(d=>{tt=d,re.set(a,{viewer:d,lastActiveAt:Date.now(),idleTimer:null}),l=Bi({filePath:a,viewer:d,getAnnotations:()=>window.__annotationState?.annotations??[],onAnnotationCreated:u=>{let f=window.__annotationState?.annotations??[];l?.renderHighlights(f)}}),document.addEventListener("annotations:loaded",()=>{let u=window.__annotationState?.annotations??[];l?.renderHighlights(u)},{once:!1}),document.addEventListener("annotation:created",()=>{let u=window.__annotationState?.annotations??[];l?.renderHighlights(u)})});return}let n=window.marked.parse(t.content),o=t.isMissing?\`
      <div class="content-file-status deleted">
        \\u8BE5\\u6587\\u4EF6\\u5DF2\\u4ECE\\u78C1\\u76D8\\u5220\\u9664\\uFF0C\\u5F53\\u524D\\u5185\\u5BB9\\u4E3A\\u672C\\u5730\\u7F13\\u5B58\\u5FEB\\u7167\\u3002
      </div>
    \`:"";e.innerHTML=\`\${o}<div class="markdown-body" id="reader">\${n}</div>\`,e.setAttribute("data-current-file",t.path),ll(e,t.path),dl(e),cl(e),W();let r=document.getElementById("fileMeta");r&&(r.textContent=rn(t.lastModified)),ln(),ie()}function ln(){let e=document.getElementById("breadcrumb");if(!e||!c.currentFile){e&&(e.innerHTML="");return}let t=c.sessionFiles.get(c.currentFile);if(!t)return;let n=t.path.split("/").filter(Boolean),o=n[n.length-1]||"",r=n.map((a,i)=>{let s=i===n.length-1,l="/"+n.slice(0,i+1).join("/");return s?\`<span class="breadcrumb-item active">\${x(a)}</span>\`:\`
      <span class="breadcrumb-item" title="\${T(l)}">
        \${x(a)}
      </span>
      <span class="breadcrumb-separator">/</span>
    \`}).join("");e.innerHTML=\`
    \${r}
    <button class="copy-filename-button" onclick="copyFilePath('\${T(t.path)}', event)" title="\\u590D\\u5236\\u76F8\\u5BF9\\u8DEF\\u5F84 / \\u2325+\\u70B9\\u51FB\\u590D\\u5236\\u7EDD\\u5BF9\\u8DEF\\u5F84">
      <span class="copy-icon"></span>
      <span class="check-icon">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
        </svg>
      </span>
      <span class="copy-tooltip">\\u590D\\u5236\\u76F8\\u5BF9\\u8DEF\\u5F84</span>
    </button>
  \`}async function ul(e){if(e.stopPropagation(),!c.currentFile)return;let t=e.target,n=document.querySelector(".nearby-menu");if(n){n.remove();return}try{let o=await Hn(c.currentFile);if(!o.files||o.files.length===0){Nn("\\u9644\\u8FD1\\u6CA1\\u6709\\u5176\\u4ED6 Markdown \\u6587\\u4EF6",3e3);return}let r=document.createElement("div");r.className="nearby-menu",r.innerHTML=\`
      <div class="nearby-menu-header">\\u9644\\u8FD1\\u7684\\u6587\\u4EF6</div>
      \${o.files.map(s=>\`
        <div class="nearby-menu-item" onclick="window.addFileByPath('\${T(s.path)}', true)">
          \\u{1F4C4} \${x(s.name)}
        </div>
      \`).join("")}
    \`;let a=t.getBoundingClientRect();r.style.position="fixed",r.style.left=a.left+"px",r.style.top=a.bottom+5+"px",document.body.appendChild(r);let i=()=>{r.remove(),document.removeEventListener("click",i)};setTimeout(()=>document.addEventListener("click",i),0)}catch(o){L("\\u83B7\\u53D6\\u9644\\u8FD1\\u6587\\u4EF6\\u5931\\u8D25: "+o.message)}}function pl(e){let t=e.split("/").filter(Boolean);return t[t.length-1]||"workspace"}function Xi(e){let t=e.toLowerCase();return t.endsWith(".html")||t.endsWith(".htm")}function ml(e){let t=e.toLowerCase();return t.endsWith(".json")||t.endsWith(".jsonl")}function Yi(e){return e.toLowerCase().endsWith(".pdf")}function Zi(e){return/^https?:\\/\\//i.test(e)}async function fl(e){if(z(e),\$(),Zi(e)){window.open(e,"_blank","noopener,noreferrer");return}try{let n=await(await fetch("/api/open-local-file",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e})})).json();n?.error&&L(\`\\u6253\\u5F00 HTML \\u5931\\u8D25: \${n.error}\`)}catch(t){L(\`\\u6253\\u5F00 HTML \\u5931\\u8D25: \${t?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)}}function gl(e){let t=e.trim();return t?!!(/^https?:\\/\\//i.test(t)||t.startsWith("/")||t.startsWith("~/")||t.startsWith("./")||t.startsWith("../")||t.includes("/")||t.includes("\\\\")||/\\.[a-zA-Z0-9]{1,10}\$/.test(t)):!1}function kt(){X=null;let e=document.getElementById("quickActionConfirm"),t=document.getElementById("quickActionConfirmText"),n=document.getElementById("quickActionConfirmActions");e&&(e.style.display="none",e.className="add-file-confirm"),t&&(t.textContent=""),n&&(n.innerHTML=""),document.body.classList.remove("quick-action-confirm-visible")}function ea(){let e=document.getElementById("quickActionConfirm");return!!e&&e.style.display!=="none"}function cn(e,t,n={}){document.getElementById("searchInput")?.dispatchEvent(new Event("path-autocomplete-hide"));let r=document.getElementById("quickActionConfirm"),a=document.getElementById("quickActionConfirmText"),i=document.getElementById("quickActionConfirmActions");if(!(!r||!a||!i)){if(a.textContent=e,i.innerHTML="",r.className=\`add-file-confirm state-\${t}\`,r.style.display="flex",document.body.classList.add("quick-action-confirm-visible"),n.primaryLabel&&n.onPrimary){let s=document.createElement("button");s.className="add-file-confirm-button primary",s.textContent=n.primaryLabel,s.onclick=async()=>{await n.onPrimary(),kt()},i.appendChild(s)}if(n.allowCancel!==!1){let s=document.createElement("button");s.className="add-file-confirm-button",s.textContent="\\u53D6\\u6D88",s.onclick=()=>kt(),i.appendChild(s)}}}async function Ri(){if(!X)return;if(X.kind==="add-other-file"){await Pe(X.path,!0);return}let e=nn(pl(X.path),X.path);\$(),Q(\`\\u5DF2\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A: \${e.name}\`,2e3),ue(""),\$()}async function Pe(e,t=!0){if(!e.trim())return;let n=await _e(e);n&&(await Vi(n,t),await Dn(e,t),ue(""),\$())}async function ta(e){let t=e.trim();if(!t)return;let n=await Wn(t),o=n.path||t;if(n.kind==="md_file"||n.kind==="html_file"||n.kind==="pdf_file"){kt(),await Pe(o,!0);return}if(n.kind==="other_file"){X={kind:"add-other-file",path:o,ext:n.ext||null},cn(\`\\u68C0\\u6D4B\\u5230\\u975E Markdown \\u6587\\u4EF6\${n.ext?\`: \${n.ext}\`:""}\`,"warning",{primaryLabel:"\\u7EE7\\u7EED\\u6DFB\\u52A0\\u6587\\u4EF6",onPrimary:Ri});return}if(n.kind==="directory"){X={kind:"add-workspace",path:o},cn("\\u68C0\\u6D4B\\u5230\\u76EE\\u5F55\\uFF0C\\u662F\\u5426\\u4F5C\\u4E3A\\u5DE5\\u4F5C\\u533A\\u6DFB\\u52A0\\uFF1F","directory",{primaryLabel:"\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A",onPrimary:Ri});return}if(n.kind==="not_found"){X=null,cn("\\u8DEF\\u5F84\\u4E0D\\u5B58\\u5728\\uFF0C\\u8BF7\\u68C0\\u67E5\\u540E\\u91CD\\u8BD5","error",{allowCancel:!0});return}X=null,cn(n.error||"\\u65E0\\u6CD5\\u8BC6\\u522B\\u8F93\\u5165\\u8DEF\\u5F84","error",{allowCancel:!0})}async function hl(e){if(ae){ae=!1;let n=document.getElementById("diffButton");n&&n.classList.remove("active")}let t=c.currentFile;An(e),\$(),Y(),Ie(!0),t!==e&&Ji(),await ie()}function na(e){Yi(e)&&Ki(e),Sn(e),\$(),Y(),Ie(!0)}async function yl(e){let t=document.getElementById("searchInput"),n=(typeof e=="string"?e:t?.value||"").trim();if(n)try{let o=c.config.workspaces.map(a=>a.path).filter(Boolean),r=await ct(n,{roots:o,limit:50});r.files&&r.files.length>0?await Pe(r.files[0].path):Nn("\\u6CA1\\u6709\\u627E\\u5230\\u5339\\u914D\\u7684\\u6587\\u4EF6",3e3)}catch(o){L("\\u641C\\u7D22\\u5931\\u8D25: "+o.message)}}function bl(){document.body.addEventListener("dragover",e=>{e.preventDefault()}),document.body.addEventListener("drop",async e=>{e.preventDefault();let t=Array.from(e.dataTransfer?.files||[]);for(let n of t){let o=n.name.toLowerCase();(o.endsWith(".md")||o.endsWith(".markdown")||o.endsWith(".html")||o.endsWith(".htm"))&&await Pe(n.path)}})}function wl(){document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(Hr()){e.preventDefault();return}if(document.getElementById("settingsDialogOverlay")?.classList.contains("show")){e.preventDefault(),wt();return}let n=document.getElementById("addWorkspaceDialogOverlay");if(n?.classList.contains("show")){e.preventDefault(),n.classList.remove("show");return}}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){let t=document.activeElement?.tagName?.toLowerCase();if(t==="textarea"||t==="input")return;e.preventDefault();let n=document.getElementById("searchInput");n&&(n.focus(),n.select());return}if((e.metaKey||e.ctrlKey)&&e.key==="w"&&(e.preventDefault(),c.currentFile&&na(c.currentFile)),ae&&!e.metaKey&&!e.ctrlKey&&!e.altKey){let t=e.target?.tagName?.toLowerCase();if(t!=="input"&&t!=="textarea"){if(e.key==="n"){e.preventDefault(),xo(1);return}if(e.key==="p"){e.preventDefault(),xo(-1);return}}}})}function vl(){let e=new URLSearchParams(window.location.search),t=e.get("file"),n=e.get("focus")!=="false";t&&(Pe(t,n),window.history.replaceState({},"",window.location.pathname))}async function kl(e){let t=c.sessionFiles.get(e);if(!t)return null;if(t.pendingContent!==void 0)return t.pendingContent;let n=await _e(e,!0);return n?(t.pendingContent=n.content,n.content):null}function xl(e,t){oe=-1;let n=document.getElementById("content");if(!n)return;let o=di(e,t);if(!o.some(m=>m.type!=="equal")){n.innerHTML=\`
      <div class="diff-view-container">
        <div class="diff-header">
          <div class="diff-header-titles">
            <div class="diff-header-old">\\u2190 \\u5F53\\u524D\\u7248\\u672C</div>
            <div class="diff-header-new">\\u78C1\\u76D8\\u6700\\u65B0\\u7248\\u672C \\u2192</div>
          </div>
          <div class="diff-actions">
            <button class="diff-close-btn" onclick="window.closeDiffView()">\\u5173\\u95ED</button>
          </div>
        </div>
        <div class="diff-no-changes">\\u6587\\u4EF6\\u5185\\u5BB9\\u4E0E\\u78C1\\u76D8\\u4E00\\u81F4\\uFF0C\\u65E0\\u5DEE\\u5F02</div>
      </div>
    \`;return}let a=[],i=0;for(;i<o.length;){let m=o[i];m.type==="equal"?(a.push({left:m,right:m}),i++):m.type==="delete"?i+1<o.length&&o[i+1].type==="insert"?(a.push({left:m,right:o[i+1]}),i+=2):(a.push({left:m}),i++):(a.push({right:m}),i++)}let s=[],l=-1;for(let m=0;m<a.length;m++){let g=a[m],y=!(g.left&&g.right&&g.left.type==="equal");y&&l===-1?l=m:!y&&l!==-1&&(s.push({startRowIndex:l,endRowIndex:m-1}),l=-1)}l!==-1&&s.push({startRowIndex:l,endRowIndex:a.length-1});let d=s.length,u=new Map;s.forEach((m,g)=>u.set(m.startRowIndex,g));let f=m=>m.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),p=a.map(({left:m,right:g},y)=>{if(m&&g&&m.type==="equal")return\`<tr class="diff-row-equal">
        <td class="diff-line-no">\${m.oldLineNo}</td>
        <td>\${f(m.content)}</td>
        <td class="diff-line-no">\${g.newLineNo}</td>
        <td>\${f(g.content)}</td>
      </tr>\`;let b=u.get(y),k=b!==void 0?\` data-block-index="\${b}"\`:"",w=b!==void 0?\`<span class="diff-block-index" data-block-span="\${b}">\${b+1}/\${d}</span>\`:"",E=m?\`<td class="diff-line-no">\${m.oldLineNo??""}\${w}</td>\`:'<td class="diff-line-no diff-cell-empty"></td>',I=m?\`<td class="diff-row-delete-cell">\${f(m.content)}</td>\`:'<td class="diff-cell-empty"></td>',P=g?\`<td class="diff-line-no">\${g.newLineNo??""}</td>\`:'<td class="diff-line-no diff-cell-empty"></td>',Z=g?\`<td class="diff-row-insert-cell">\${f(g.content)}</td>\`:'<td class="diff-cell-empty"></td>';return\`<tr class="\${m&&g?"diff-row-mixed":m?"diff-row-delete":"diff-row-insert"}"\${k}>\${E}\${I}\${P}\${Z}</tr>\`}).join("");n.innerHTML=\`
    <div class="diff-view-container">
      <div class="diff-header">
        <div class="diff-header-titles">
          <div class="diff-header-old">\\u2190 \\u5F53\\u524D\\u7248\\u672C</div>
          <div class="diff-header-new">\\u78C1\\u76D8\\u6700\\u65B0\\u7248\\u672C \\u2192</div>
        </div>
        <div class="diff-actions">
          <button class="diff-accept-btn" onclick="window.acceptDiffUpdate()">\\u91C7\\u7528</button>
          <button class="diff-close-btn" onclick="window.closeDiffView()">\\u5173\\u95ED</button>
        </div>
      </div>
      <div class="diff-nav-bar">
        <span class="diff-nav-count" id="diffNavCount">\\u5171 \${d} \\u5904\\u5DEE\\u5F02</span>
        <button class="diff-nav-btn" id="diffNavPrev" onclick="window.navigateDiffBlock(-1)" disabled>\\u2191 \\u4E0A\\u4E00\\u5904</button>
        <button class="diff-nav-btn primary" id="diffNavNext" onclick="window.navigateDiffBlock(1)">\\u2193 \\u4E0B\\u4E00\\u5904</button>
      </div>
      <div class="diff-view-scroll">
        <div class="diff-view">
          <table class="diff-table">
            <colgroup>
              <col style="width:40px">
              <col style="width:calc(50% - 40px)">
              <col style="width:40px">
              <col style="width:calc(50% - 40px)">
            </colgroup>
            <tbody>\${p}</tbody>
          </table>
        </div>
      </div>
    </div>
  \`}async function Tl(){if(!c.currentFile)return;let e=c.sessionFiles.get(c.currentFile);if(!e)return;if(ae){oa();return}let t=await kl(c.currentFile);if(t===null)return;ae=!0;let n=document.getElementById("diffButton");n&&n.classList.add("active"),xl(e.content,t)}function oa(){ae=!1,oe=-1;let e=document.getElementById("diffButton");e&&e.classList.remove("active"),Y()}function xo(e){let t=document.querySelector(".diff-view-scroll");if(!t)return;let o=t.querySelectorAll("[data-block-index]").length;if(o===0)return;let r=oe===-1?e===1?0:o-1:Math.max(0,Math.min(o-1,oe+e));if(r===oe)return;if(oe>=0){let u=t.querySelector(\`[data-block-span="\${oe}"]\`);u&&(u.style.display="none")}let a=t.querySelector(\`[data-block-span="\${r}"]\`);a&&(a.style.display="inline");let i=t.querySelector(\`[data-block-index="\${r}"]\`);i&&i.scrollIntoView({behavior:"instant",block:"center"}),oe=r;let s=document.getElementById("diffNavCount");s&&(s.textContent=\`\${r+1} / \${o} \\u5904\\u5DEE\\u5F02\`);let l=document.getElementById("diffNavPrev"),d=document.getElementById("diffNavNext");l&&(l.disabled=r===0),d&&(d.disabled=r===o-1)}async function El(){if(!c.currentFile)return;let e=c.sessionFiles.get(c.currentFile);!e||e.pendingContent===void 0||(e.content=e.pendingContent,e.pendingContent=void 0,e.displayedModified=e.lastModified,J(),ae=!1,oe=-1,Y(),Ie(!1),Qi(),\$(),await ie())}async function ie(){let e=document.getElementById("diffButton"),t=document.getElementById("refreshButton");if(!c.currentFile){e&&(e.style.display="none"),t&&(t.style.display="none");return}let n=c.sessionFiles.get(c.currentFile);if(!n)return;if(n.isMissing){e&&(e.style.display="none"),t&&(t.style.display="none");return}let o=n.lastModified>n.displayedModified;e&&(e.style.display=o&&!n.isRemote?"flex":"none"),t&&(t.style.display=o?"flex":"none")}async function Ml(){c.currentFile&&await Ui(c.currentFile)}function Sl(e){return e?.target?e.target.closest(".copy-filename-button, .sync-dialog-copy-btn, .sync-dialog-btn"):null}function Al(e,t){if(!e)return;if(e.classList.contains("copy-filename-button")){e.classList.add("success");let o=e.querySelector(".copy-tooltip"),r=o?.textContent;o&&(o.textContent=t||"\\u5DF2\\u590D\\u5236"),setTimeout(()=>{e.classList.remove("success"),o&&r&&(o.textContent=r)},1e3);return}let n=e.textContent;e.textContent="\\u2713 \\u5DF2\\u590D\\u5236",setTimeout(()=>{n!=null&&(e.textContent=n)},1e3)}function To(e,t,n){navigator.clipboard.writeText(e).then(()=>{Al(Sl(t),n)}).catch(()=>{L("\\u590D\\u5236\\u5931\\u8D25")})}function Ll(e,t){To(e,t)}function ra(e,t){if(t instanceof MouseEvent&&t.altKey){To(e,t,"\\u5DF2\\u590D\\u5236\\u7EDD\\u5BF9\\u8DEF\\u5F84");return}let o=c.config.workspaces,r=e;for(let a of o){let i=a.path.replace(/\\/+\$/,"");if(e===i||e.startsWith(i+"/")){r=e.slice(i.length+1);break}}To(r,t,"\\u5DF2\\u590D\\u5236\\u76F8\\u5BF9\\u8DEF\\u5F84")}function Fl(e,t){ra(e,t)}function Cl(){let e=localStorage.getItem("fontScale");e&&(nt=parseFloat(e)),ia()}function ia(){document.documentElement.style.setProperty("--font-scale",nt.toString()),aa(),localStorage.setItem("fontScale",nt.toString())}function aa(){let e=document.getElementById("fontScaleText");if(e){let o=Math.round(nt*100);e.textContent=\`\${o}%\`}let t=document.querySelectorAll(".font-scale-option");t.forEach(o=>{o.classList.remove("active")});let n=Math.round(nt*100);t.forEach(o=>{o.textContent?.trim()===\`\${n}%\`&&o.classList.add("active")})}function \$l(e){nt=e,ia(),Eo()}function Pl(){return Array.from(re.entries()).map(([e,t])=>{let n=t.viewer.getRenderedCount(),o=t.viewer.getTotalPages(),r=n*Il,a=t.idleTimer?(zi-(Date.now()-t.lastActiveAt))/1e3:null,i=a!==null?Math.max(0,Math.round(a/60)):null;return{path:e.split("/").pop()||e,rendered:n,total:o,memMB:r,idleMins:i}})}function Oi(){let e=document.getElementById("pdfMemContent");if(!e)return;let t=Pl();if(t.length===0){e.innerHTML='<div class="pdf-mem-row pdf-mem-empty">\\u6682\\u65E0 PDF \\u6570\\u636E</div>';return}let n=t.reduce((o,r)=>o+r.memMB,0);e.innerHTML=t.map(o=>\`
    <div class="pdf-mem-row">
      <span class="pdf-mem-name" title="\${o.path}">\${o.path}</span>
      <span class="pdf-mem-pages">\${o.rendered}/\${o.total} \\u9875</span>
      <span class="pdf-mem-mb">~\${o.memMB}MB</span>
      \${o.idleMins!==null?\`<span class="pdf-mem-idle">\${o.idleMins}min \\u540E\\u56DE\\u6536</span>\`:""}
    </div>
  \`).join("")+\`<div class="pdf-mem-total">\\u5408\\u8BA1 ~\${n}MB</div>\`}function Bl(){let e=document.getElementById("pdfMemPanel");if(!e)return;e.style.display!=="none"?(e.style.display="none",dn&&(clearInterval(dn),dn=null)):(e.style.display="block",Oi(),dn=setInterval(Oi,2e3))}function Nl(){let e=document.getElementById("fontScaleMenu");if(!e)return;e.style.display!=="none"?Eo():(e.style.display="block",aa())}function Eo(){let e=document.getElementById("fontScaleMenu");e&&(e.style.display="none")}function sa(e=!1){let t=new EventSource("/api/events");e&&on(),t.addEventListener("file-changed",async n=>{let o=JSON.parse(n.data),r=We(o.path);r?(r.lastModified=o.lastModified,r.isMissing&&(r.isMissing=!1,te(o.path)),J()):wn(o.path),\$(),await ie()}),t.addEventListener("file-deleted",async n=>{let o=JSON.parse(n.data),r=We(o.path);r?(r.isMissing=!0,J()):Te(o.path),\$(),c.currentFile===o.path&&(Y(),ie(),L("\\u6587\\u4EF6\\u5DF2\\u4E0D\\u5B58\\u5728"))}),t.addEventListener("file-opened",async n=>{let o=JSON.parse(n.data);await Vi(o,o.focus!==!1)}),t.addEventListener("state-request",async n=>{let r=JSON.parse(n.data).requestId;if(!r)return;let a=Array.from(c.sessionFiles.values()).map(i=>({path:i.path,name:i.name}));try{await fetch("/api/session-state",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({requestId:r,currentFile:c.currentFile,openFiles:a})})}catch(i){console.error("\\u54CD\\u5E94\\u72B6\\u6001\\u8BF7\\u6C42\\u5931\\u8D25:",i)}}),t.onerror=()=>{console.error("SSE \\u8FDE\\u63A5\\u65AD\\u5F00\\uFF0C\\u5C1D\\u8BD5\\u91CD\\u8FDE..."),t.close(),setTimeout(()=>sa(!0),3e3)}}function Hl(){window.setInterval(async()=>{if(bo||c.config.sidebarTab==="list")return;let e=c.config.sidebarTab==="focus"?c.config.workspaces:c.config.workspaces.filter(t=>t.isExpanded);if(e.length!==0){bo=!0;try{for(let t of e)await G(t.id);\$()}finally{bo=!1}}},c.config.workspacePollInterval??5e3)}function jl(){let e=document.createElement("div");e.id="findBar",e.innerHTML=\`
    <input id="findBarInput" type="text" placeholder="\\u67E5\\u627E..." autocomplete="off" spellcheck="false" />
    <span id="findBarCount"></span>
    <button id="findBarPrev" title="\\u4E0A\\u4E00\\u4E2A (\\u21E7\\u2318G)">&#8593;</button>
    <button id="findBarNext" title="\\u4E0B\\u4E00\\u4E2A (\\u2318G)">&#8595;</button>
    <button id="findBarClose" title="\\u5173\\u95ED (Esc)">&#10005;</button>
  \`,document.body.appendChild(e);let t=document.getElementById("findBarInput"),n=document.getElementById("findBarCount"),o=document.getElementById("findBarPrev"),r=document.getElementById("findBarNext"),a=document.getElementById("findBarClose"),i=[],s=-1,l=null;function d(){l&&l.querySelectorAll("mark.find-highlight").forEach(w=>{let E=w.parentNode;E&&(E.replaceChild(document.createTextNode(w.textContent||""),w),E.normalize())}),i=[],s=-1,n.textContent=""}function u(w){return w.replace(/[.*+?^\${}()|[\\]\\\\]/g,"\\\\\$&")}function f(w){if(d(),!w)return;let E=document.getElementById("content");if(!E)return;l=E;let I=new RegExp(u(w),"gi"),P=document.createTreeWalker(E,NodeFilter.SHOW_TEXT,{acceptNode(ee){let D=ee.parentElement;if(!D)return NodeFilter.FILTER_REJECT;let R=D.tagName.toLowerCase();return R==="script"||R==="style"||R==="mark"?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),Z=[],we;for(;we=P.nextNode();)Z.push(we);for(let ee of Z){let D=ee.textContent||"",R,ve=[],M=0;for(I.lastIndex=0;(R=I.exec(D))!==null;){R.index>M&&ve.push(D.slice(M,R.index));let B=document.createElement("mark");B.className="find-highlight",B.textContent=R[0],ve.push(B),i.push(document.createRange()),M=R.index+R[0].length}if(ve.length===0)continue;M<D.length&&ve.push(D.slice(M));let A=document.createDocumentFragment();ve.forEach(B=>{typeof B=="string"?A.appendChild(document.createTextNode(B)):A.appendChild(B)}),ee.parentNode.replaceChild(A,ee)}i=[],E.querySelectorAll("mark.find-highlight").forEach(ee=>{let D=document.createRange();D.selectNode(ee),i.push(D)}),i.length>0&&(s=0,p(0)),m()}function p(w){let E=document.getElementById("content");if(!E)return;let I=E.querySelectorAll("mark.find-highlight");I.forEach((Z,we)=>{Z.classList.toggle("find-highlight-current",we===w)});let P=I[w];P&&P.scrollIntoView({block:"center",behavior:"smooth"})}function m(){i.length===0?(n.textContent=t.value?"\\u65E0\\u7ED3\\u679C":"",n.className=t.value?"no-result":""):(n.textContent=\`\${s+1} / \${i.length}\`,n.className="")}function g(){i.length!==0&&(s=(s+1)%i.length,p(s),m())}function y(){i.length!==0&&(s=(s-1+i.length)%i.length,p(s),m())}function b(){e.classList.add("visible"),t.focus(),t.select(),t.value&&f(t.value)}function k(){e.classList.remove("visible"),d()}window.__showFindBar=b,t.addEventListener("input",()=>f(t.value)),t.addEventListener("keydown",w=>{w.key==="Enter"?(w.shiftKey?y():g(),w.preventDefault()):w.key==="Escape"&&(k(),w.preventDefault())}),o.addEventListener("click",y),r.addEventListener("click",g),a.addEventListener("click",k)}var wo,vo,_i,Xs,yo,ae,bo,Di,tt,Ys,zi,re,X,oe,nt,Il,dn,Fe=v(()=>{H();de();mt();Ae();Me();ui();pi();F();qe();Li();Ci();mo();Vn();H();Qt();Pi();Ni();Wi();wo="md-viewer:sidebar-width",vo=260,_i=220,Xs=680,yo=new Map,ae=!1,bo=!1,Di=!1,tt=null,Ys=new sn,zi=600*1e3,re=new Map;X=null;oe=-1;nt=1;Il=27,dn=null;document.addEventListener("click",e=>{let t=document.getElementById("fontScaleMenu"),n=document.getElementById("fontScaleButton");if(!t||!n)return;let o=e.target;!t.contains(o)&&!n.contains(o)&&Eo()});window.addFile=()=>{let e=document.getElementById("searchInput");e&&ta(e.value).catch(t=>{L(\`\\u6DFB\\u52A0\\u5931\\u8D25: \${t?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)})};window.handleUnifiedInputSubmit=e=>{let t=document.getElementById("searchInput"),n=(typeof e=="string"?e:t?.value||"").trim();if(n){if(!gl(n)){yl(n).catch(o=>{L(\`\\u641C\\u7D22\\u5931\\u8D25: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)});return}ta(n).catch(o=>{L(\`\\u6DFB\\u52A0\\u5931\\u8D25: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)})}};window.dismissQuickActionConfirm=()=>{ea()&&kt()};window.switchFile=hl;window.removeFile=na;window.showNearbyMenu=ul;window.addFileByPath=Pe;window.refreshFile=Ui;window.handleRefreshButtonClick=Ml;window.handleDiffButtonClick=Tl;window.closeDiffView=oa;window.navigateDiffBlock=xo;window.acceptDiffUpdate=El;window.copySingleText=Ll;window.copyFileName=Fl;window.copyFilePath=ra;window.showToast=Oe;window.showSettingsDialog=Ai;window.toggleFontScaleMenu=Nl;window.togglePdfMemPanel=Bl;window.setFontScale=\$l;window.openExternalFile=fl;window.renderContent=Y;window.applyTheme=qi;(async()=>(nl(),Cl(),Kr(),window.__setPendingAnnotation=Vr,he(),window.addEventListener("resize",()=>{he()}),await En(_e),qi(),await on(),Hl(),\$(),gr().then(e=>{Ln(e),\$()}).catch(()=>{}),Y(),Ie(!0),bl(),ol(),document.addEventListener("click",e=>{if(!ea())return;let t=e.target;t&&(t.closest(".sidebar-header")||t.closest("#quickActionConfirm")||kt())}),vl(),wl(),document.addEventListener("mouseup",()=>{setTimeout(()=>{let e=document.getElementById("content")?.getAttribute("data-current-file")||null;zr(e)},0)}),document.addEventListener("click",e=>{let t=e.target.closest("a[href]");if(!t)return;let n=t.getAttribute("href")||"";if(!n.startsWith("pdf://"))return;e.preventDefault();let o=n.slice(6),r=o.indexOf("#"),a=r>=0?o.slice(0,r):o,i=r>=0?o.slice(r+1):"",s=new URLSearchParams(i),l=parseInt(s.get("page")||"1",10),d=s.get("quote")||"";Pe(a).then(()=>{setTimeout(()=>{tt&&(tt.scrollToPage(l),d&&tt.highlightQuote(l,decodeURIComponent(d)))},500)})}),document.addEventListener("pdf:show-composer",e=>{let{annotation:t,filePath:n,clientX:o,clientY:r}=e.detail;window.__setPendingAnnotation&&window.__setPendingAnnotation(t,n,o,r)}),await rl(),sa(),jl()))()});Fe();})();
//# sourceMappingURL=client.js.map
`;
