// 自动生成的文件，不要手动编辑
// 由 scripts/embed-client.ts 生成

export const EMBEDDED_CLIENT_JS = `"use strict";(()=>{var ra=Object.defineProperty;var v=(e,t)=>()=>(e&&(t=e(e=0)),t);var we=(e,t)=>{for(var n in t)ra(e,n,{get:t[n],enumerable:!0})};var To={};we(To,{defaultConfig:()=>xt,loadConfig:()=>Tt,saveConfig:()=>O,updateConfig:()=>aa});function Tt(){try{let e=localStorage.getItem(xo);if(!e)return{...xt};let t=JSON.parse(e);return{...xt,...t}}catch(e){return console.error("\\u52A0\\u8F7D\\u914D\\u7F6E\\u5931\\u8D25:",e),{...xt}}}function O(e){try{localStorage.setItem(xo,JSON.stringify(e))}catch(t){console.error("\\u4FDD\\u5B58\\u914D\\u7F6E\\u5931\\u8D25:",t)}}function aa(e){let n={...Tt(),...e};return O(n),n}var xo,xt,Ie=v(()=>{"use strict";xo="md-viewer:config",xt={sidebarTab:"focus",focusWindowKey:"8h",markdownTheme:"github",codeTheme:"github",mathInline:!0,workspacePollInterval:5e3,workspaces:[]}});function Mo(){try{localStorage.setItem(Eo,JSON.stringify(Array.from(ve.entries()).map(([e,t])=>[e,Array.from(t)])))}catch(e){console.error("\\u4FDD\\u5B58\\u5217\\u8868\\u5DEE\\u5F02\\u72B6\\u6001\\u5931\\u8D25:",e)}}function So(){ve.clear();try{let e=localStorage.getItem(Eo);if(!e)return;let t=JSON.parse(e);if(!Array.isArray(t))return;for(let n of t){if(!Array.isArray(n)||n.length!==2)continue;let o=n[0],i=n[1];typeof o!="string"||!Array.isArray(i)||ve.set(o,new Set(i.filter(a=>typeof a=="string"&&a.length>0)))}}catch(e){console.error("\\u6062\\u590D\\u5217\\u8868\\u5DEE\\u5F02\\u72B6\\u6001\\u5931\\u8D25:",e)}}function Ao(e){return ve.get(e)}function dn(e,t){ve.set(e,t),Mo()}function Lo(e){let t=ve.get(e);return ve.delete(e),Mo(),t}var Eo,ve,Fo=v(()=>{"use strict";Eo="md-viewer:workspaceKnownFiles",ve=new Map});function ke(e){Et.add(e)}function te(e){Et.delete(e)}function un(e){return Et.has(e)}function pn(e){let t=Array.from(Et.values());if(!e)return t;let n=\`\${e.replace(/\\/+\$/,"")}/\`;return t.filter(o=>o.startsWith(n))}var Et,mn=v(()=>{"use strict";Et=new Set});function fn(){try{let e=Array.from(se.entries()).map(([t,n])=>[t,Array.from(n.entries())]);localStorage.setItem(\$o,JSON.stringify(e))}catch(e){console.error("\\u4FDD\\u5B58\\u5DE5\\u4F5C\\u533A\\u76EE\\u5F55\\u5C55\\u5F00\\u72B6\\u6001\\u5931\\u8D25:",e)}}function Co(){se.clear();try{let e=localStorage.getItem(\$o);if(!e)return;let t=JSON.parse(e);if(!Array.isArray(t))return;for(let n of t){if(!Array.isArray(n)||n.length!==2)continue;let o=n[0],i=n[1];if(typeof o!="string"||!Array.isArray(i))continue;let a=new Map;for(let r of i){if(!Array.isArray(r)||r.length!==2)continue;let s=r[0],l=r[1];typeof s!="string"||typeof l!="boolean"||a.set(s,l)}a.size>0&&se.set(o,a)}}catch(e){console.error("\\u6062\\u590D\\u5DE5\\u4F5C\\u533A\\u76EE\\u5F55\\u5C55\\u5F00\\u72B6\\u6001\\u5931\\u8D25:",e)}}function Io(e){return se.get(e)}function Mt(e,t){if(t.size===0){se.delete(e),fn();return}se.set(e,new Map(t)),fn()}function Po(e){se.has(e)&&(se.delete(e),fn())}function St(e){let t=new Map,n=o=>{if(o.type==="directory"){typeof o.isExpanded=="boolean"&&t.set(o.path,o.isExpanded);for(let i of o.children||[])n(i)}};return n(e),t}var \$o,se,gn=v(()=>{"use strict";\$o="md-viewer:workspaceTreeExpandedState",se=new Map});function q(e){return le.has(e)}function hn(e){le.add(e)}function z(e){le.has(e)&&le.delete(e)}function tt(e){return et.has(e)}function yn(e){et.add(e)}function At(e){et.delete(e)}function bn(){le.clear(),et.clear(),So(),Co()}function wn(e,t){let n=new Set(t),o=Ao(e);if(!o){dn(e,n);return}for(let i of n)o.has(i)||le.add(i),te(i);for(let i of o)n.has(i)||(le.delete(i),ke(i));dn(e,n)}function vn(e){let t=Lo(e);if(t)for(let n of t)le.delete(n),et.delete(n)}var le,et,Bo=v(()=>{"use strict";Fo();mn();gn();le=new Set,et=new Set});var ce=v(()=>{"use strict";Bo();mn()});var xe={};we(xe,{addOrUpdateFile:()=>Tn,getFilteredFiles:()=>Sn,getSessionFile:()=>Pe,getSessionFiles:()=>kn,hasSessionFile:()=>\$t,markFileMissing:()=>sa,removeFile:()=>En,restoreState:()=>xn,saveState:()=>V,setSearchQuery:()=>de,state:()=>c,switchToFile:()=>Mn});function Pe(e){return c.sessionFiles.get(e)}function \$t(e){return c.sessionFiles.has(e)}function kn(){return Array.from(c.sessionFiles.values())}function V(){try{let e={files:Array.from(c.sessionFiles.entries()).map(([t,n])=>[t,{path:n.path,name:n.name,isRemote:n.isRemote||!1,isMissing:n.isMissing||!1,lastModified:n.lastModified,displayedModified:n.displayedModified,lastAccessed:n.lastAccessed||Date.now()}]),currentFile:c.currentFile};localStorage.setItem(Ft,JSON.stringify(e))}catch(e){if(e.name==="QuotaExceededError"||e.code===22){console.warn("localStorage \\u914D\\u989D\\u5DF2\\u6EE1\\uFF0C\\u6267\\u884C\\u6E05\\u7406..."),No();try{let t={files:Array.from(c.sessionFiles.entries()).map(([n,o])=>[n,{path:o.path,name:o.name,isRemote:o.isRemote||!1,isMissing:o.isMissing||!1,lastModified:o.lastModified,displayedModified:o.displayedModified,lastAccessed:o.lastAccessed||Date.now()}]),currentFile:c.currentFile};localStorage.setItem(Ft,JSON.stringify(t))}catch(t){console.error("\\u4FDD\\u5B58\\u72B6\\u6001\\u5931\\u8D25\\uFF08\\u91CD\\u8BD5\\u540E\\uFF09:",t)}}else console.error("\\u4FDD\\u5B58\\u72B6\\u6001\\u5931\\u8D25:",e)}}function No(){if(c.sessionFiles.size<=Lt)return;let e=Array.from(c.sessionFiles.entries()).sort((o,i)=>(i[1].lastAccessed||i[1].lastModified||0)-(o[1].lastAccessed||o[1].lastModified||0)),t=e.slice(0,Lt),n=e.slice(Lt);c.sessionFiles.clear(),t.forEach(([o,i])=>{c.sessionFiles.set(o,i)}),console.log(\`\\u5DF2\\u6E05\\u7406 \${n.length} \\u4E2A\\u65E7\\u6587\\u4EF6\`)}async function xn(e){try{bn();let t=localStorage.getItem(Ft);if(!t)return;let n=JSON.parse(t);if(!n.files||n.files.length===0)return;let o=[];for(let[i,a]of n.files){let r=await e(i,!0);if(r){let s=Math.max(r.lastModified,a.lastModified||0);c.sessionFiles.set(i,{path:r.path,name:r.filename,content:r.content,lastModified:s,displayedModified:r.lastModified,isRemote:r.isRemote||!1,isMissing:!1,lastAccessed:a.lastAccessed||r.lastModified}),o.push([i,a])}}if(o.length!==n.files.length){let i=c.sessionFiles.has(n.currentFile)?n.currentFile:null;localStorage.setItem(Ft,JSON.stringify({files:o,currentFile:i}))}if(n.currentFile&&c.sessionFiles.has(n.currentFile))c.currentFile=n.currentFile;else{let i=Array.from(c.sessionFiles.values())[0];c.currentFile=i?i.path:null}}catch(t){console.error("\\u6062\\u590D\\u72B6\\u6001\\u5931\\u8D25:",t)}}function Tn(e,t=!1){c.sessionFiles.size>=Lt&&!c.sessionFiles.has(e.path)&&No();let n=c.sessionFiles.get(e.path),o=!n,i=e.lastModified,a=n?Math.max(n.lastModified,e.lastModified):e.lastModified;c.sessionFiles.set(e.path,{path:e.path,name:e.filename,content:e.content,lastModified:a,displayedModified:i,isRemote:e.isRemote||!1,isMissing:!1,lastAccessed:Date.now()}),t&&(c.currentFile=e.path,z(e.path)),te(e.path),o&&(t||hn(e.path)),V()}function En(e){let n=Array.from(c.sessionFiles.keys()).indexOf(e);if(c.sessionFiles.delete(e),z(e),te(e),c.currentFile===e){let o=Array.from(c.sessionFiles.values());c.currentFile=o.length>0?o[Math.max(0,n-1)].path:null}V()}function Mn(e){c.currentFile=e;let t=c.sessionFiles.get(e);t&&(t.lastAccessed=Date.now()),z(e),te(e),V()}function sa(e,t=!1){let n=c.sessionFiles.get(e),o=Date.now(),i=e.split("/").pop()||n?.name||e;c.sessionFiles.set(e,{path:e,name:i,content:n?.content||\`# \\u6587\\u4EF6\\u5DF2\\u5220\\u9664

\\u8BE5\\u6587\\u4EF6\\u5DF2\\u4ECE\\u78C1\\u76D8\\u5220\\u9664\\uFF0C\\u4E14\\u5F53\\u524D\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\u5185\\u5BB9\\u3002\`,lastModified:n?.lastModified||o,displayedModified:n?.displayedModified||o,isRemote:n?.isRemote||!1,isMissing:!0}),t&&(c.currentFile=e,z(e)),ke(e),V()}function de(e){c.searchQuery=e}function Sn(){let e=c.searchQuery.toLowerCase().trim();return e?Array.from(c.sessionFiles.values()).filter(t=>t.name.toLowerCase().includes(e)||t.path.toLowerCase().includes(e)):Array.from(c.sessionFiles.values())}var c,Ft,Lt,j=v(()=>{"use strict";Ie();ce();c={sessionFiles:new Map,currentFile:null,searchQuery:"",config:Tt(),currentWorkspace:null,fileTree:new Map},Ft="md-viewer:openFiles",Lt=100});function x(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}function T(e){return x(e)}var Te=v(()=>{"use strict"});function J(e,t=!1){return e.isMissing?{badge:"D",color:"#ff3b30",type:"deleted"}:e.lastModified>e.displayedModified?{badge:"M",color:"#ff9500",type:"modified"}:t?{badge:"dot",color:"#007AFF",type:"new"}:{badge:null,color:null,type:"normal"}}var Ct=v(()=>{"use strict"});function It(e){let t=e.match(/\\.([^.]+)\$/);return t?t[1].toLowerCase():""}function la(e){let t=It(e);return t==="html"||t==="htm"}function An(e){return It(e)==="json"}function nt(e){return It(e)==="jsonl"}function ca(e){return It(e)==="pdf"}function Ee(e){return la(e)?{cls:"html",label:"<>"}:An(e)||nt(e)?{cls:"json",label:"{}"}:ca(e)?{cls:"pdf",label:"P"}:{cls:"md",label:"M"}}var ot=v(()=>{"use strict"});function it(e){return e&&(e.replace(/\\.(md|markdown|html?)\$/i,"")||e)}var Ln=v(()=>{"use strict"});var Cn={};we(Cn,{getPinnedFiles:()=>\$n,isPinned:()=>Fn,pinFile:()=>da,unpinFile:()=>ua});function Pt(){try{let e=localStorage.getItem(Ho);if(!e)return new Set;let t=JSON.parse(e);return Array.isArray(t)?new Set(t):new Set}catch{return new Set}}function jo(e){try{localStorage.setItem(Ho,JSON.stringify(Array.from(e)))}catch{}}function Fn(e){return Pt().has(e)}function da(e){let t=Pt();t.add(e),jo(t)}function ua(e){let t=Pt();t.delete(e),jo(t)}function \$n(){return Pt()}var Ho,rt=v(()=>{"use strict";Ho="md-viewer:pinned-files"});function Bt(e){let t=Array.from(e.values()),n={};return t.forEach(o=>{n[o.name]=(n[o.name]||0)+1}),t.map(o=>{if(n[o.name]===1)return{...o,displayName:o.name};let i=o.path.split("/").filter(Boolean),a=t.filter(s=>s.name===o.name&&s.path!==o.path),r="";for(let s=i.length-2;s>=0;s--){let l=i[s];if(a.every(d=>d.path.split("/").filter(Boolean)[s]!==l)){r=l;break}}return!r&&i.length>=2&&(r=i[i.length-2]),{...o,displayName:r?\`\${o.name} (\${r})\`:o.name}})}var Wo=v(()=>{"use strict"});function Be(e,t,n,o){if(t.length===0)return[];if(e==="close-all")return t.map(i=>i.path);if(!n)return[];if(e==="close-others")return t.filter(i=>i.path!==n).map(i=>i.path);if(e==="close-right"){let i=t.findIndex(a=>a.path===n);return i<0?[]:t.slice(i+1).map(a=>a.path)}return t.filter(i=>i.path!==n&&o(i.path)).map(i=>i.path)}var Do=v(()=>{"use strict"});function pa(){Ne||(Ne=document.createElement("div"),Ne.id="toast-container",Ne.className="toast-container",document.body.appendChild(Ne))}function He(e){let t=typeof e=="string"?{message:e,type:"info",duration:3e3}:{type:"info",duration:3e3,...e};pa();let n=document.createElement("div");n.className=\`toast toast-\${t.type}\`;let o={success:"\\u2713",error:"\\u2717",warning:"\\u26A0",info:"\\u2139"};return n.innerHTML=\`
    <span class="toast-icon">\${o[t.type]}</span>
    <span class="toast-message">\${t.message}</span>
  \`,Ne.appendChild(n),requestAnimationFrame(()=>{n.classList.add("toast-show")}),t.duration&&t.duration>0&&setTimeout(()=>{Ro(n)},t.duration),n.addEventListener("click",()=>{Ro(n)}),n}function Ro(e){e.classList.remove("toast-show"),e.classList.add("toast-hide"),setTimeout(()=>{e.remove()},300)}function U(e,t){return He({message:e,type:"success",duration:t})}function L(e,t){return He({message:e,type:"error",duration:t})}function Oo(e,t){return He({message:e,type:"warning",duration:t})}function In(e,t){return He({message:e,type:"info",duration:t})}var Ne,je=v(()=>{"use strict";Ne=null});var Nt={};we(Nt,{detectPathType:()=>Nn,getNearbyFiles:()=>Pn,getPathSuggestions:()=>Bn,loadFile:()=>We,openFile:()=>Hn,searchFiles:()=>at});async function We(e,t=!1){try{let o=await(await fetch(\`/api/file?path=\${encodeURIComponent(e)}\`)).json();return o.error?(t||L(o.error),null):o}catch(n){return t||L(\`\\u52A0\\u8F7D\\u5931\\u8D25: \${n.message}\`),null}}async function at(e,t={}){let n=new URLSearchParams({query:e});t.limit&&Number.isFinite(t.limit)&&n.set("limit",String(t.limit));for(let i of t.roots||[])i.trim()&&n.append("root",i.trim());return(await fetch(\`/api/files?\${n.toString()}\`)).json()}async function Pn(e){return(await fetch(\`/api/nearby?path=\${encodeURIComponent(e)}\`)).json()}async function Bn(e,t={}){let n=t.kind||"file",o=t.markdownOnly!==!1,i=new URLSearchParams({input:e,kind:n,markdownOnly:o?"true":"false"});return(await fetch(\`/api/path-suggestions?\${i.toString()}\`)).json()}async function Nn(e){return(await fetch("/api/detect-path",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e})})).json()}async function Hn(e,t=!0){await fetch("/api/open",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,focus:t})})}var Me=v(()=>{"use strict";je()});function Ht(e,t){let n=[],o=-1,i=0,a=null,r=document.createElement("div");r.className="path-autocomplete-panel",r.style.display="none",document.body.appendChild(r);let s=()=>r.style.display!=="none",l=()=>{i+=1,a!==null&&(window.clearTimeout(a),a=null),r.style.display="none",n=[],o=-1},d=()=>{let h=e.getBoundingClientRect();r.style.left=\`\${Math.round(h.left+window.scrollX)}px\`,r.style.top=\`\${Math.round(h.bottom+window.scrollY+4)}px\`,r.style.width=\`\${Math.round(h.width)}px\`},u=()=>{if(n.length===0){l();return}r.innerHTML=n.map((h,y)=>{let b=y===o?"path-autocomplete-item active":"path-autocomplete-item",k=h.type==="directory"?"\\u{1F4C1}":"\\u{1F4C4}";return\`
          <div class="\${b}" data-index="\${y}">
            <span class="path-autocomplete-icon">\${k}</span>
            <span class="path-autocomplete-text">\${ma(h.display)}</span>
          </div>
        \`}).join(""),d(),r.style.display="block"},f=h=>{let y=n[h];if(!y)return;let b=y.type==="directory",k=b&&!y.path.endsWith("/")?\`\${y.path}/\`:y.path;e.value=k,e.dispatchEvent(new Event("input",{bubbles:!0})),e.focus(),e.setSelectionRange(e.value.length,e.value.length),l(),b&&m()},p=async()=>{let h=e.value.trim();if(!h){l();return}if(document.body.classList.contains("quick-action-confirm-visible")){l();return}if(t.shouldActivate&&!t.shouldActivate(h)){l();return}let y=++i;try{let b=await Bn(h,{kind:t.kind,markdownOnly:t.markdownOnly});if(y!==i)return;n=b.suggestions||[],o=n.length>0?0:-1,u()}catch{l()}},m=()=>{a!==null&&window.clearTimeout(a),a=window.setTimeout(p,100)};r.addEventListener("mousedown",h=>{h.preventDefault();let y=h.target.closest(".path-autocomplete-item");if(!y)return;let b=Number(y.dataset.index);Number.isNaN(b)||f(b)}),e.addEventListener("focus",m),e.addEventListener("input",m),e.addEventListener("path-autocomplete-hide",l),e.addEventListener("keydown",h=>{let y=h.key;if(s()){if(y==="ArrowDown"){h.preventDefault(),n.length>0&&(o=(o+1)%n.length,u());return}if(y==="ArrowUp"){h.preventDefault(),n.length>0&&(o=(o-1+n.length)%n.length,u());return}if(y==="Tab"){o>=0&&(h.preventDefault(),f(o));return}if(y==="Enter"){if(h.metaKey||h.ctrlKey)return;if(h.preventDefault(),o>=0){f(o);return}l();return}y==="Escape"&&(h.preventDefault(),l())}}),e.addEventListener("blur",()=>{window.setTimeout(l,120)}),window.addEventListener("resize",()=>{s()&&d()}),window.addEventListener("scroll",()=>{s()&&d()},!0)}function ma(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}var jn=v(()=>{"use strict";Me()});function zo(e,t){if(e.type==="file")return t.has(e.path)?null:e;let n=[];for(let o of e.children||[]){let i=zo(o,t);i&&n.push(i)}return n.length===0&&(e.children||[]).length>0?null:{...e,children:n}}function fa(e){let t=e.split("/").filter(Boolean);return t[t.length-1]||"workspace"}function Vo(e){let t=it(e)||e;return\`<span class="tree-name-full">\${x(t)}</span>\`}function Jo(e,t){if(e){if(e.type==="file"){t.add(e.path);return}(e.children||[]).forEach(n=>Jo(n,t))}}function Uo(e){if(e.type==="file")return 1;let t=0;for(let n of e.children||[])t+=Uo(n);return e.fileCount=t,t}function ga(e,t){let n=e.path.replace(/\\/+\$/,""),o={name:e.name,path:n,type:"directory",isExpanded:!0,children:[]},i=new Map([[n,o]]),a=Array.from(new Set(t)).sort((r,s)=>r.localeCompare(s,"zh-CN"));for(let r of a){if(!r.startsWith(\`\${n}/\`))continue;let l=r.slice(n.length+1).split("/").filter(Boolean);if(l.length===0)continue;let d=n,u=o;for(let f=0;f<l.length;f+=1){let p=l[f],m=f===l.length-1;if(d=\`\${d}/\${p}\`,m)(u.children||[]).some(y=>y.path===d)||u.children.push({name:p,path:d,type:"file"});else{let h=i.get(d);h||(h={name:p,path:d,type:"directory",isExpanded:!0,children:[]},i.set(d,h),u.children.push(h)),u=h}}}return Uo(o),o}function ha(e,t){if(!t)return c.fileTree.get(e.id);let n=e.path.replace(/\\/+\$/,""),o=\`\${n}/\`,i=Array.from(Oe).filter(a=>a===n||a.startsWith(o));if(i.length!==0)return ga(e,i)}function ya(){return c.config.workspaces.map(e=>e.path.trim()).filter(Boolean)}function _o(){ue="",Le="",pe=!1,Re=!1,Oe=new Set}async function ba(e,t,n,o){try{let a=await at(e,{roots:t,limit:200});if(o!==jt)return;ue=e,Le=n,Oe=new Set((a.files||[]).map(r=>r.path).filter(Boolean)),pe=!1,Re=!0}catch(a){if(o!==jt)return;console.error("\\u5DE5\\u4F5C\\u533A\\u641C\\u7D22\\u5931\\u8D25:",a),ue=e,Le=n,Oe=new Set,pe=!1,Re=!0}let{renderSidebar:i}=await Promise.resolve().then(()=>(I(),B));i()}function wa(e){let t=e.trim();if(!t){_o();return}if(t.startsWith("/")||t.startsWith("~/")||t.startsWith("~\\\\")){_o();return}let n=ya(),o=n.join(\`
\`);if(n.length===0){ue=t,Le=o,Oe=new Set,pe=!1,Re=!0;return}Re&&!pe&&ue===t&&Le===o||pe&&ue===t&&Le===o||(jt+=1,ue=t,Le=o,pe=!0,Re=!1,Oe=new Set,ba(t,n,o,jt))}function Qo(){let e=document.getElementById(ct),t=document.getElementById(Ko);if(!t)return;let n=e?.value.trim()||"";t.textContent=n||"\\u8DEF\\u5F84\\u9884\\u89C8\\uFF1A\\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u540E\\u8FD9\\u91CC\\u4F1A\\u663E\\u793A\\u5B8C\\u6574\\u8DEF\\u5F84"}function va(){let e=document.getElementById(Wn);if(e)return e;let t=document.createElement("div");t.id=Wn,t.className="sync-dialog-overlay add-workspace-overlay",t.innerHTML=\`
    <div class="sync-dialog add-workspace-dialog">
      <div class="sync-dialog-header">
        <div class="sync-dialog-title">\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A</div>
        <button class="sync-dialog-close" onclick="closeAddWorkspaceDialog()">\\xD7</button>
      </div>
      <div class="sync-dialog-body">
        <div class="sync-dialog-field">
          <label class="sync-dialog-label">\\u{1F4C1} \\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84</label>
          <textarea
            id="\${ct}"
            class="sync-dialog-input workspace-path-input"
            rows="3"
            placeholder="/Users/huanghao/workspace/md-viewer"
          ></textarea>
          <div class="workspace-path-hint">\\u652F\\u6301\\u7C98\\u8D34\\u957F\\u8DEF\\u5F84\\u3002\\u6309 Ctrl/Cmd + Enter \\u5FEB\\u901F\\u786E\\u8BA4\\u3002</div>
          <div id="\${Ko}" class="workspace-path-preview">\\u8DEF\\u5F84\\u9884\\u89C8\\uFF1A\\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u540E\\u8FD9\\u91CC\\u4F1A\\u663E\\u793A\\u5B8C\\u6574\\u8DEF\\u5F84</div>
        </div>
      </div>
      <div class="sync-dialog-footer add-workspace-footer">
        <button class="sync-dialog-btn" onclick="closeAddWorkspaceDialog()">\\u53D6\\u6D88</button>
        <button class="sync-dialog-btn sync-dialog-btn-primary" onclick="confirmAddWorkspaceDialog()">\\u6DFB\\u52A0</button>
      </div>
    </div>
  \`,document.body.appendChild(t),t.addEventListener("click",o=>{o.target===t&&Wt()});let n=t.querySelector(\`#\${ct}\`);return n&&(Ht(n,{kind:"directory",markdownOnly:!1}),n.addEventListener("input",Qo),n.addEventListener("keydown",o=>{(o.metaKey||o.ctrlKey)&&o.key==="Enter"&&(o.preventDefault(),window.confirmAddWorkspaceDialog()),o.key==="Escape"&&(o.preventDefault(),Wt())})),t}function ka(){va().classList.add("show");let t=document.getElementById(ct);t&&(t.value="",Qo(),t.focus())}function Wt(){let e=document.getElementById(Wn);e&&e.classList.remove("show")}async function xa(){try{let e=document.getElementById(ct),t=e?.value.trim()||"";if(!t){Oo("\\u8BF7\\u8F93\\u5165\\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84"),e?.focus();return}let n=fa(t),{addWorkspace:o}=await Promise.resolve().then(()=>(dt(),ti)),i=o(n,t),{renderSidebar:a}=await Promise.resolve().then(()=>(I(),B));a(),Wt(),U(\`\\u5DF2\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A: \${i.name}\`,2e3)}catch(e){console.error("\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",e),L(\`\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25: \${e?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)}}function Go(){if(c.config.sidebarTab==="focus")return ei();let e=c.searchQuery.trim().toLowerCase();return wa(e),\`\${Ta(e)}\`}function Ta(e){let t=c.config.workspaces,n=t.map((o,i)=>Ma(o,i,t.length,e)).filter(Boolean).join("");return\`
    <div class="workspace-section">
      \${t.length===0?Ea():""}
      \${t.length>0&&!n?'<div class="empty-workspace"><p>\\u672A\\u627E\\u5230\\u5339\\u914D\\u5185\\u5BB9</p></div>':""}
      \${n}
    </div>
  \`}function Ea(){return\`
    <div class="empty-workspace">
      <p>\\u6682\\u65E0\\u5DE5\\u4F5C\\u533A</p>
      <p style="font-size: 12px; color: #57606a; margin-top: 8px;">
        \\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u76EE\\u5F55\\u8DEF\\u5F84\\u540E\\u56DE\\u8F66\\u6DFB\\u52A0
      </p>
    </div>
  \`}function Ma(e,t,n,o){let i=c.currentWorkspace===e.id,a=o?ha(e,o):c.fileTree.get(e.id),r=a;if(a){let y=qe(a,e.path);y.size>0&&(r=zo(a,y)??void 0)}let s=o?!0:e.isExpanded,l=s?"\\u25BC":"\\u25B6",d=t>0,u=t<n-1,f=!o||e.name.toLowerCase().includes(o)||e.path.toLowerCase().includes(o),p=!!r&&!!r.children&&r.children.length>0,m=s?Aa(e.id,e.path,r,o):"";return o&&!f&&!p&&!!!m?"":\`
    <div class="workspace-item">
      <div class="workspace-header \${i?"active":""}" onclick="handleWorkspaceToggle('\${T(e.id)}')">
        <span class="workspace-toggle">\${l}</span>
        <span class="workspace-icon">\\u{1F4C1}</span>
        <span class="workspace-name">\${x(e.name)}</span>
        \${st===e.id?\`
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
      \${s?Sa(e.id,r,o):""}
      \${m}
    </div>
  \`}function Sa(e,t,n){return n&&pe&&ue===n?\`
      <div class="file-tree loading">
        <div class="tree-loading">\\u641C\\u7D22\\u4E2D...</div>
      </div>
    \`:lt.has(e)?\`
      <div class="file-tree loading">
        <div class="tree-loading">\\u52A0\\u8F7D\\u4E2D...</div>
      </div>
    \`:De.has(e)?\`
      <div class="file-tree empty">
        <div class="tree-empty" onclick="retryWorkspaceScan('\${T(e)}')" style="cursor: pointer;">\\u52A0\\u8F7D\\u5931\\u8D25\\uFF0C\\u70B9\\u51FB\\u91CD\\u8BD5</div>
      </div>
    \`:t?!t.children||t.children.length===0?\`
      <div class="file-tree empty">
        <div class="tree-empty">\${n?"\\u672A\\u627E\\u5230\\u5339\\u914D\\u6587\\u4EF6":"\\u6B64\\u76EE\\u5F55\\u4E0B\\u6CA1\\u6709 Markdown/HTML \\u6587\\u4EF6"}</div>
      </div>
    \`:\`
    <div class="file-tree">
      \${t.children.map(o=>Xo(e,o,1)).join("")}
    </div>
  \`:\`
      <div class="file-tree empty">
        <div class="tree-empty">\${n?"\\u672A\\u627E\\u5230\\u5339\\u914D\\u6587\\u4EF6":"\\u76EE\\u5F55\\u6682\\u4E0D\\u53EF\\u7528"}</div>
      </div>
    \`}function Xo(e,t,n){let o=4+n*8,i=c.currentFile===t.path;if(t.type==="file"){let l=Pe(t.path),d=q(t.path),u=!!l?.isMissing||un(t.path),f=Ee(t.path),p=tt(t.path),m="&nbsp;";if(l){let k=J(l,d);k.badge==="dot"?m='<span class="new-dot"></span>':k.badge&&(m=\`<span class="status-badge status-\${k.type}" style="color: \${k.color}">\${k.badge}</span>\`)}else u?m='<span class="status-badge status-deleted" style="color: #cf222e">D</span>':p?m='<span class="status-badge status-modified" style="color: #ff9500">M</span>':d&&(m='<span class="new-dot"></span>');let h=["tree-item","file-node",u?"missing":"",i?"current":""].filter(Boolean).join(" "),y=Fn(t.path),b=\`<button
  class="tree-pin-btn\${y?" active":""}"
  title="\${y?"\\u53D6\\u6D88\\u56FA\\u5B9A\\u5230\\u7126\\u70B9\\u89C6\\u56FE":"\\u56FA\\u5B9A\\u5230\\u7126\\u70B9\\u89C6\\u56FE"}"
  onclick="event.stopPropagation();\${y?"handleUnpinFile":"handlePinFile"}('\${T(t.path)}')"
>\\u{1F4CC}</button>\`;return\`
      <div class="tree-node">
        <div class="\${h}"
             onclick="handleFileClick('\${T(t.path)}')">
          <span class="tree-indent" style="width: \${o}px"></span>
          <span class="tree-toggle"></span>
          <span class="file-type-icon \${f.cls}">\${x(f.label)}</span>
          <span class="tree-status-inline">\${m}</span>
          <span class="tree-name" title="\${T(t.name)}">\${Vo(t.name)}</span>
          \${b}
        </div>
      </div>
    \`}let a=t.isExpanded!==!1,r=a?"\\u25BC":"\\u25B6",s=t.children&&t.children.length>0;return\`
    <div class="tree-node">
      <div class="tree-item directory-node">
        <span class="tree-indent" style="width: \${o}px"></span>
        <span class="tree-toggle" onclick="\${s?\`event.stopPropagation();handleNodeClick('\${T(e)}', '\${T(t.path)}')\`:""}">\${s?r:""}</span>
        <span class="tree-name" onclick="\${s?\`event.stopPropagation();handleNodeClick('\${T(e)}', '\${T(t.path)}')\`:""}">\${x(t.name)}</span>
        \${t.fileCount?\`<span class="tree-count">\${t.fileCount}</span>\`:""}
      </div>
      \${a&&s?\`
        <div class="file-tree">
          \${t.children.map(l=>Xo(e,l,n+1)).join("")}
        </div>
      \`:""}
    </div>
  \`}function Aa(e,t,n,o){let i=new Set;Jo(n,i);let a=\`\${t}/\`,r=kn().filter(u=>!u.isMissing||!u.path.startsWith(a)||i.has(u.path)?!1:o?u.name.toLowerCase().includes(o)||u.path.toLowerCase().includes(o):!0),s=new Set(r.map(u=>u.path)),l=pn(t).filter(u=>!s.has(u)).filter(u=>!i.has(u)).filter(u=>{if(!o)return!0;let f=u.toLowerCase(),p=(u.split("/").pop()||"").toLowerCase();return f.includes(o)||p.includes(o)});return r.length===0&&l.length===0?"":\`
    <div class="tree-missing-section">
      <div class="tree-missing-title">\\u5DF2\\u5220\\u9664</div>
      \${[...r.map(u=>({path:u.path,name:u.path.split("/").pop()||u.name,isCurrent:c.currentFile===u.path,hasRetry:!0,hasClose:!0})),...l.map(u=>({path:u,name:u.split("/").pop()||u,isCurrent:c.currentFile===u,hasRetry:!1,hasClose:!1}))].map(u=>{let f=Ee(u.path);return\`
          <div class="tree-item file-node missing \${u.isCurrent?"current":""}" onclick="handleFileClick('\${T(u.path)}')">
            <span class="tree-indent" style="width: 12px"></span>
            <span class="tree-toggle"></span>
            <span class="file-type-icon \${f.cls}">\${x(f.label)}</span>
            <span class="tree-status-inline"><span class="status-badge status-deleted">D</span></span>
            <span class="tree-name" title="\${T(u.name)}">\${Vo(u.name)}</span>
            \${u.hasRetry?\`<button class="tree-inline-action" title="\\u91CD\\u8BD5\\u52A0\\u8F7D" onclick="event.stopPropagation(); handleRetryMissingFile('\${T(u.path)}')">\\u21BB</button>\`:""}
            \${u.hasClose?\`<button class="tree-inline-action danger" title="\\u5173\\u95ED\\u6587\\u4EF6" onclick="event.stopPropagation(); handleCloseFile('\${T(u.path)}')">\\xD7</button>\`:""}
          </div>
        \`}).join("")}
    </div>
  \`}function Yo(){qo||(qo=!0,document.addEventListener("click",async e=>{if(!st)return;let t=e.target;if(!t||t.closest(".workspace-remove-actions")||t.closest(".workspace-remove"))return;st=null;let{renderSidebar:n}=await Promise.resolve().then(()=>(I(),B));n()})),window.handleWorkspaceToggle=async e=>{let t=c.config.workspaces.find(o=>o.id===e);if(!t)return;if(c.currentWorkspace=e,c.searchQuery.trim()){let{renderSidebar:o}=await Promise.resolve().then(()=>(I(),B));o();return}if(On(e),t.isExpanded&&!c.fileTree.has(e)){lt.add(e),De.delete(e);let{renderSidebar:o}=await Promise.resolve().then(()=>(I(),B));o();let i=await Q(e);lt.delete(e),i?De.delete(e):(De.add(e),L(\`\\u5DE5\\u4F5C\\u533A\\u626B\\u63CF\\u5931\\u8D25\\uFF1A\${t.name}\`))}let{renderSidebar:n}=await Promise.resolve().then(()=>(I(),B));n()},window.retryWorkspaceScan=async e=>{lt.add(e),De.delete(e);let{renderSidebar:t}=await Promise.resolve().then(()=>(I(),B));t();let n=await Q(e);lt.delete(e),n||(De.add(e),L("\\u91CD\\u8BD5\\u5931\\u8D25\\uFF0C\\u8BF7\\u68C0\\u67E5\\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84\\u662F\\u5426\\u53EF\\u8BBF\\u95EE")),t()},window.handleAskRemoveWorkspace=async e=>{st=e;let{renderSidebar:t}=await Promise.resolve().then(()=>(I(),B));t()},window.handleConfirmRemoveWorkspace=async e=>{let t=c.config.workspaces.find(o=>o.id===e);if(!t)return;Rn(e),st=null;let{renderSidebar:n}=await Promise.resolve().then(()=>(I(),B));n(),U(\`\\u5DF2\\u79FB\\u9664\\u5DE5\\u4F5C\\u533A: \${t.name}\`,2e3)},window.handleNodeClick=async(e,t)=>{qn(e,t);let{renderSidebar:n}=await Promise.resolve().then(()=>(I(),B));n()},window.handleFileClick=async e=>{At(e),z(e);let{loadFile:t}=await Promise.resolve().then(()=>(Me(),Nt));if(\$t(e))window.switchFile?.(e);else{let n=await t(e,!0);if(!n){let{markFileMissing:a}=await Promise.resolve().then(()=>(j(),xe));a(e,!0),(await Promise.resolve().then(()=>(Ae(),Se))).renderAll(),L("\\u6587\\u4EF6\\u5DF2\\u5220\\u9664\\uFF0C\\u5DF2\\u6807\\u8BB0\\u4E3A D\\uFF08\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\uFF09");return}let{addOrUpdateFile:o}=await Promise.resolve().then(()=>(j(),xe));o(n,!0),(await Promise.resolve().then(()=>(Ae(),Se))).renderAll()}},window.handleCloseFile=async e=>{let{removeFile:t}=await Promise.resolve().then(()=>(j(),xe));t(e),(await Promise.resolve().then(()=>(Ae(),Se))).renderAll()},window.handleRetryMissingFile=async e=>{let{loadFile:t}=await Promise.resolve().then(()=>(Me(),Nt)),{addOrUpdateFile:n}=await Promise.resolve().then(()=>(j(),xe)),o=await t(e);if(!o)return;n(o,c.currentFile===e),(await Promise.resolve().then(()=>(Ae(),Se))).renderAll(),U("\\u6587\\u4EF6\\u5DF2\\u91CD\\u65B0\\u52A0\\u8F7D",2e3)},window.showAddWorkspaceDialog=ka,window.closeAddWorkspaceDialog=Wt,window.confirmAddWorkspaceDialog=xa,window.handleMoveWorkspaceUp=async e=>{Dt(e,-1);let{renderSidebar:t}=await Promise.resolve().then(()=>(I(),B));t()},window.handleMoveWorkspaceDown=async e=>{Dt(e,1);let{renderSidebar:t}=await Promise.resolve().then(()=>(I(),B));t()},window.handleFocusFileClick=async e=>{At(e),z(e);let{loadFile:t}=await Promise.resolve().then(()=>(Me(),Nt));if(\$t(e))window.switchFile?.(e);else{let n=await t(e,!0);if(!n){let{markFileMissing:a}=await Promise.resolve().then(()=>(j(),xe));a(e,!0),(await Promise.resolve().then(()=>(Ae(),Se))).renderAll(),L("\\u6587\\u4EF6\\u5DF2\\u5220\\u9664\\uFF0C\\u5DF2\\u6807\\u8BB0\\u4E3A D\\uFF08\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\uFF09");return}let{addOrUpdateFile:o}=await Promise.resolve().then(()=>(j(),xe));o(n,!0),(await Promise.resolve().then(()=>(Ae(),Se))).renderAll()}},window.handleUnpinFile=async e=>{let{unpinFile:t}=await Promise.resolve().then(()=>(rt(),Cn));t(e);let{renderSidebar:n}=await Promise.resolve().then(()=>(I(),B));n()},window.handlePinFile=async e=>{let{pinFile:t}=await Promise.resolve().then(()=>(rt(),Cn));t(e);let{renderSidebar:n}=await Promise.resolve().then(()=>(I(),B));n()},window.handleFocusWorkspaceToggle=e=>{},window.setFocusWindowKey=e=>{c.config.focusWindowKey=e,Promise.resolve().then(()=>(Ie(),To)).then(({saveConfig:t})=>t(c.config)),Promise.resolve().then(()=>(I(),B)).then(({renderSidebar:t})=>t())}}var Wn,ct,Ko,st,qo,lt,De,ue,Le,pe,Re,Oe,jt,Zo=v(()=>{"use strict";j();Dn();ce();Me();Te();Ct();ot();Ln();je();jn();dt();ce();rt();Rt();Wn="addWorkspaceDialogOverlay",ct="addWorkspacePathInput",Ko="addWorkspacePathPreview",st=null,qo=!1,lt=new Set,De=new Set,ue="",Le="",pe=!1,Re=!1,Oe=new Set,jt=0});function ni(e){let t=[0];for(let n of e){let o=n.nodeValue?.length??0;t.push(t[t.length-1]+o)}return{nodes:e,cumulative:t,totalLength:t[t.length-1]}}function oi(e,t){if(e.nodes.length===0)return null;if(t>=e.totalLength){let i=e.nodes[e.nodes.length-1];return{node:i,offset:i.nodeValue?.length??0}}let n=0,o=e.nodes.length-1;for(;n<o;){let i=n+o+1>>1;e.cumulative[i]<=t?n=i:o=i-1}return{node:e.nodes[n],offset:t-e.cumulative[n]}}function ii(e){let t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),n=[],o;for(;o=t.nextNode();)o.nodeValue&&o.nodeValue.length>0&&n.push(o);return n}var ri=v(()=>{"use strict"});async function ut(e){let t=await e.json().catch(()=>null);if(!e.ok)throw new Error(t?.error||\`HTTP \${e.status}\`);return t}async function ai(e){let t=await fetch(\`/api/annotations?path=\${encodeURIComponent(e)}\`),n=await ut(t);return Array.isArray(n?.annotations)?n.annotations:[]}async function si(e,t){let n=await fetch("/api/annotations/item",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,annotation:t})}),o=await ut(n);if(o?.success!==!0||!o?.annotation)throw new Error(o?.error||"\\u4FDD\\u5B58\\u8BC4\\u8BBA\\u5931\\u8D25");return o.annotation}async function li(e,t,n,o){let i=await fetch("/api/annotations/reply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,...t,text:n,author:o})}),a=await ut(i);if(a?.success!==!0||!a?.annotation)throw new Error(a?.error||"\\u56DE\\u590D\\u8BC4\\u8BBA\\u5931\\u8D25");return a.annotation}async function ci(e,t){let n=await fetch("/api/annotations/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,...t})}),o=await ut(n);if(o?.success!==!0)throw new Error(o?.error||"\\u5220\\u9664\\u8BC4\\u8BBA\\u5931\\u8D25")}async function di(e,t,n){let o=await fetch("/api/annotations/status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,...t,status:n})}),i=await ut(o);if(i?.success!==!0||!i?.annotation)throw new Error(i?.error||"\\u66F4\\u65B0\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25");return i.annotation}var ui=v(()=>{"use strict"});function La(e,t){if(!t)return[];let n=[],o=e.indexOf(t);for(;o>=0;)n.push(o),o=e.indexOf(t,o+1);return n}function Fa(e,t,n,o){let i=0,a=Math.max(0,o.start||0),r=Math.abs(n-a);if(i+=Math.max(0,1e3-Math.min(1e3,r)),o.quotePrefix&&e.slice(Math.max(0,n-o.quotePrefix.length),n)===o.quotePrefix&&(i+=500),o.quoteSuffix){let s=n+t.length;e.slice(s,s+o.quoteSuffix.length)===o.quoteSuffix&&(i+=500)}return i}function pi(e,t){if(!e||!t.quote||t.length<=0)return{start:t.start||0,length:Math.max(1,t.length||t.quote?.length||1),confidence:0,status:"unanchored"};let n=Math.max(0,t.start||0),o=n+Math.max(1,t.length||t.quote.length);if(o<=e.length&&e.slice(n,o)===t.quote)return{start:n,length:t.length,confidence:1,status:"anchored"};let i=La(e,t.quote);if(i.length===0)return{start:n,length:Math.max(1,t.length||t.quote.length),confidence:0,status:"unanchored"};if(i.length===1)return{start:i[0],length:t.quote.length,confidence:.8,status:"anchored"};let a=i[0],r=Number.NEGATIVE_INFINITY;for(let s of i){let l=Fa(e,t.quote,s,t);l>r&&(r=l,a=s)}return{start:a,length:t.quote.length,confidence:.6,status:"anchored"}}var mi=v(()=>{"use strict"});function Ia(){try{return typeof localStorage>"u"?"default":localStorage.getItem("md-viewer:annotation-density")==="simple"?"simple":"default"}catch{return"default"}}function _n(e){return e.reduce((n,o)=>typeof o.serial!="number"||!Number.isFinite(o.serial)?n:Math.max(n,o.serial),0)+1}function Pa(e){let t=Number.isFinite(e.createdAt)?e.createdAt:Date.now(),o=(Array.isArray(e.thread)?e.thread:[]).map((i,a)=>{if(!i||typeof i!="object")return null;let r=String(i.note||"").trim();if(!r)return null;let l=String(i.type||(a===0?"comment":"reply"))==="reply"?"reply":"comment",d=Number(i.createdAt),u=Number.isFinite(d)?Math.floor(d):t+a;return{id:String(i.id||"").trim()||\`\${l}-\${u}-\${Math.random().toString(16).slice(2,8)}\`,type:l,note:r,createdAt:u}}).filter(i=>!!i).sort((i,a)=>i.createdAt-a.createdAt);if(o.length===0){let i=String(e.note||"").trim();return i?[{id:\`c-\${e.id||t}\`,type:"comment",note:i,createdAt:t}]:[]}o[0].type="comment";for(let i=1;i<o.length;i+=1)o[i].type="reply";return o}function Ti(e){let t=Pa(e),n=JSON.stringify(e.thread||[]),o=JSON.stringify(t);return e.thread=t,e.note=t[0]?.note||e.note||"",n!==o}function Ba(e){let t=!1;for(let n of e)Ti(n)&&(t=!0);return t}function Na(e){let t=!1,n=e.map((i,a)=>({ann:i,index:a}));n.sort((i,a)=>{let r=Number.isFinite(i.ann.createdAt)?i.ann.createdAt:0,s=Number.isFinite(a.ann.createdAt)?a.ann.createdAt:0;return r!==s?r-s:i.index-a.index});let o=1;for(let{ann:i}of n){if(typeof i.serial=="number"&&Number.isFinite(i.serial)&&i.serial>0){o=Math.max(o,i.serial+1);continue}i.serial=o,o+=1,t=!0}return t}function Ei(e){let t=g.annotations.findIndex(n=>n.id===e.id);if(t>=0){g.annotations[t]=e;return}g.annotations.push(e)}function zn(e,t,n="\\u8BC4\\u8BBA\\u4FDD\\u5B58\\u5931\\u8D25"){si(e,t).then(o=>{g.currentFilePath===e&&(Ei(o),N(e),W())}).catch(o=>{L(\`\${n}: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)})}function Mi(e,t,n="\\u8BC4\\u8BBA\\u4FDD\\u5B58\\u5931\\u8D25"){for(let o of t)zn(e,o,n)}function Si(e){if(g.currentFilePath=e,e?(g.annotations=[],Ha(e)):g.annotations=[],g.pinnedAnnotationId=null,g.activeAnnotationId=null,g.pendingAnnotation=null,g.pendingAnnotationFilePath=null,pt(),ze(!0),he(!0),e){let n=Fi()[e]===!0;_e(!n)}else _e(!0)}async function Ha(e){try{let t=await ai(e);if(!Array.isArray(t)||g.currentFilePath!==e)return;g.annotations=t;let n=Ba(g.annotations),o=Na(g.annotations);(n||o)&&Mi(e,g.annotations),N(e),W()}catch(t){if(g.currentFilePath!==e)return;L(\`\\u8BC4\\u8BBA\\u52A0\\u8F7D\\u5931\\u8D25: \${t?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)}}function E(){return{sidebar:document.getElementById("annotationSidebar"),sidebarResizer:document.getElementById("annotationSidebarResizer"),reader:document.getElementById("reader"),content:document.getElementById("content"),composer:document.getElementById("annotationComposer"),composerHeader:document.getElementById("annotationComposerHeader"),composerNote:document.getElementById("composerNote"),quickAdd:document.getElementById("annotationQuickAdd"),popover:document.getElementById("annotationPopover"),popoverTitle:document.getElementById("popoverTitle"),popoverNote:document.getElementById("popoverNote"),popoverResolveBtn:document.getElementById("popoverResolveBtn"),popoverPrevBtn:document.getElementById("popoverPrevBtn"),popoverNextBtn:document.getElementById("popoverNextBtn"),annotationList:document.getElementById("annotationList"),annotationCount:document.getElementById("annotationCount"),filterMenu:document.getElementById("annotationFilterMenu"),filterToggle:document.getElementById("annotationFilterToggle"),densityToggle:document.getElementById("annotationDensityToggle"),closeToggle:document.getElementById("annotationSidebarClose"),floatingOpenBtn:document.getElementById("annotationFloatingOpenBtn")}}function Kn(e){let t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),n=[],o;for(;o=t.nextNode();)o.nodeValue&&o.nodeValue.length>0&&n.push(o);return n}function fi(e,t,n){let o=Kn(e),i=0;for(let a of o){if(a===t)return i+n;i+=a.nodeValue?.length||0}return-1}function Ot(e,t,n){if(n)return oi(n,t);let o=Kn(e),i=0;for(let r of o){let s=r.nodeValue?.length||0,l=i+s;if(t<=l)return{node:r,offset:Math.max(0,t-i)};i=l}if(o.length===0)return null;let a=o[o.length-1];return{node:a,offset:a.nodeValue?.length||0}}function qt(e,t,n){return Math.max(t,Math.min(n,e))}function Vn(e,t,n){let a=qt(t,8,window.innerWidth-360-8),r=qt(n,8,window.innerHeight-220-8);e.style.left=\`\${a}px\`,e.style.top=\`\${r}px\`}function Ai(e){return Kn(e).map(t=>t.nodeValue||"").join("")}function fe(e){return e.status==="resolved"}function Jn(e){return e.status==="unanchored"?"orphan":(e.confidence||0)>=.95?"exact":"reanchored"}function ja(e,t){let n=e.status==="unanchored"||Jn(e)==="orphan";return t==="all"?!0:t==="open"?!fe(e)&&!n:t==="resolved"?fe(e)&&!n:t==="orphan"?n:!0}function Li(){return g.currentFilePath}function _(){let e=g.currentFilePath,t=document.getElementById("content")?.getAttribute("data-current-file")||null;return e?t?t===e?e:null:e:null}function _t(e,t){if(!e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return!1;let n=e.key.toLowerCase(),{value:o,selectionStart:i,selectionEnd:a}=t;if(i===null||a===null)return!1;let r=d=>{t.selectionStart=d,t.selectionEnd=d},s=d=>{let u=o.lastIndexOf(\`
\`,d-1);return u===-1?0:u+1},l=d=>{let u=o.indexOf(\`
\`,d);return u===-1?o.length:u};switch(n){case"a":return r(s(i)),!0;case"e":return r(l(i)),!0;case"b":return r(Math.max(0,i-1)),!0;case"f":return r(Math.min(o.length,i+1)),!0;case"n":{let d=l(i);return r(d===o.length?d:Math.min(o.length,d+1+(i-s(i)))),!0}case"p":{let d=s(i);if(d===0)return r(0),!0;let u=s(d-1),f=d-1-u;return r(u+Math.min(i-d,f)),!0}case"d":return i<o.length&&(t.value=o.slice(0,i)+o.slice(i+1),r(i),t.dispatchEvent(new Event("input"))),!0;case"k":{let d=l(i),u=i===d&&d<o.length?d+1:d;return t.value=o.slice(0,i)+o.slice(u),r(i),t.dispatchEvent(new Event("input")),!0}case"u":{let d=s(i);return t.value=o.slice(0,d)+o.slice(i),r(d),t.dispatchEvent(new Event("input")),!0}case"w":{let d=i;for(;d>0&&/\\s/.test(o[d-1]);)d--;for(;d>0&&!/\\s/.test(o[d-1]);)d--;return t.value=o.slice(0,d)+o.slice(i),r(d),t.dispatchEvent(new Event("input")),!0}case"h":return i>0&&(t.value=o.slice(0,i-1)+o.slice(i),r(i-1),t.dispatchEvent(new Event("input"))),!0;default:return!1}}function me(e){return e==="up"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4l4 4H4z"/></svg>':e==="down"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12l-4-4h8z"/></svg>':e==="check"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.4 11.2L3.5 8.3l1.1-1.1 1.8 1.8 5-5 1.1 1.1z"/></svg>':e==="trash"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2h4l1 1h3v1H2V3h3l1-1zm-1 4h1v7H5V6zm3 0h1v7H8V6zm3 0h1v7h-1V6z"/></svg>':e==="comment"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h12v9H8l-3 3v-3H2z"/></svg>':e==="list"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h10v1H3zm0 4h10v1H3zm0 4h10v1H3z"/></svg>':e==="filter"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12L9.5 8v4.5l-3-1.5V8z"/></svg>':e==="edit"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.5 2.5a1.5 1.5 0 012.1 2.1L5 13.2l-3 .8.8-3 8.7-8.5z"/></svg>':e==="reopen"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 1.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zM6 5.5l4 2.5-4 2.5V5.5z"/></svg>':'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 4.2L8 8l3.8-3.8 1 1L9 9l3.8 3.8-1 1L8 10l-3.8 3.8-1-1L7 9 3.2 5.2z"/></svg>'}function Vt(){return[...g.annotations].filter(e=>ja(e,g.filter)).sort((e,t)=>e.start-t.start)}function Wa(){let e=E();if(e.filterMenu?.querySelectorAll(".annotation-filter-item[data-filter]").forEach(t=>{let n=t;n.classList.toggle("is-active",n.getAttribute("data-filter")===g.filter)}),e.densityToggle&&(e.densityToggle.classList.toggle("is-simple",g.density==="simple"),e.densityToggle.title=g.density==="simple"?"\\u5207\\u6362\\u5230\\u9ED8\\u8BA4\\u5217\\u8868":"\\u5207\\u6362\\u5230\\u6781\\u7B80\\u5217\\u8868"),e.filterToggle){let t={all:"\\u7B5B\\u9009\\uFF1A\\u5168\\u90E8",open:"\\u7B5B\\u9009\\uFF1A\\u672A\\u89E3\\u51B3",resolved:"\\u7B5B\\u9009\\uFF1A\\u5DF2\\u89E3\\u51B3",orphan:"\\u7B5B\\u9009\\uFF1A\\u5B9A\\u4F4D\\u5931\\u8D25"};e.filterToggle.title=t[g.filter]}}function Da(){let e=E();e.annotationCount&&(e.annotationCount.textContent=String(Vt().length))}function _e(e){let t=E();t.sidebar&&(t.sidebar.classList.toggle("collapsed",e),document.body.classList.toggle("annotation-sidebar-collapsed",e),e&&(t.filterMenu?.classList.add("hidden"),ze(!0),he(!0)))}function Fi(){try{let e=localStorage.getItem(xi);if(!e)return{};let t=JSON.parse(e);return t&&typeof t=="object"?t:{}}catch{return{}}}function Ra(e){localStorage.setItem(xi,JSON.stringify(e))}function \$i(e){if(!g.currentFilePath)return;let t=Fi();t[g.currentFilePath]=e,Ra(t)}function Oa(e){return Math.max(\$a,Math.min(Ca,Math.round(e)))}function Ci(e){let t=Oa(e);document.documentElement.style.setProperty("--annotation-sidebar-width",\`\${t}px\`),localStorage.setItem(vi,String(t))}function qa(){let e=Number(localStorage.getItem(vi)),t=Number.isFinite(e)&&e>0?e:ki;Ci(t)}function ge(){let e=E();if(!e.sidebar)return;let t=document.getElementById("tabs"),n=Math.max(0,Math.round(t?.getBoundingClientRect().bottom||84)),o=Math.max(0,window.innerHeight-n);e.sidebar.style.top=\`\${n}px\`,e.sidebar.style.height=\`\${o}px\`,e.sidebarResizer&&(e.sidebarResizer.style.top=\`\${n}px\`,e.sidebarResizer.style.height=\`\${o}px\`),e.floatingOpenBtn&&(e.floatingOpenBtn.style.top=\`\${n+6}px\`)}function gi(){_e(!1),\$i(!0),ge(),Gn()}function hi(){_e(!0),\$i(!1)}function _a(){let e=E().sidebar;e&&_e(!e.classList.contains("collapsed"))}function Ii(){let e=E();return e.filterMenu&&!e.filterMenu.classList.contains("hidden")?(e.filterMenu.classList.add("hidden"),!0):e.quickAdd&&!e.quickAdd.classList.contains("hidden")?(ze(!0),!0):e.composer&&!e.composer.classList.contains("hidden")?(pt(),!0):e.popover&&!e.popover.classList.contains("hidden")?(g.pinnedAnnotationId=null,he(!0),!0):!1}function za(e,t){return e==="resolved"?"resolved":t}function Ka(e,t,n){let o=E();if(!o.quickAdd)return;o.composer&&!o.composer.classList.contains("hidden")&&pt(),g.pendingAnnotation={...n,note:"",createdAt:Date.now()},g.pendingAnnotationFilePath=o.content?.getAttribute("data-current-file")||g.currentFilePath;let i=30,a=30,r=qt(e,8,window.innerWidth-i-8),s=qt(t,8,window.innerHeight-a-8);o.quickAdd.style.left=\`\${r}px\`,o.quickAdd.style.top=\`\${s}px\`,o.quickAdd.classList.remove("hidden")}function ze(e=!1){let t=E();t.quickAdd&&(t.quickAdd.classList.add("hidden"),e&&(Un(),g.pendingAnnotation=null,g.pendingAnnotationFilePath=null))}function Pi(e,t){let n=E();if(!g.pendingAnnotation||!n.composer||!n.composerNote)return;Ua(),n.composerNote.value="",Hi(n.composerNote);let o=typeof e=="number"?e:n.quickAdd?Number.parseFloat(n.quickAdd.style.left||"0"):0,i=typeof t=="number"?t:n.quickAdd?Number.parseFloat(n.quickAdd.style.top||"0"):0;Vn(n.composer,o,i+34),n.composer.classList.remove("hidden"),ze(!1),n.composerNote.focus()}function Va(){let e=E();e.composer&&e.composer.classList.add("hidden")}function Ja(){let e=E();if(!e.composer||!g.pendingAnnotation)return;let n=document.getElementById("reader")?.querySelector(".annotation-mark-temp");if(n){let o=n.getBoundingClientRect();Vn(e.composer,o.right+6,o.top-8)}e.composer.classList.remove("hidden"),e.composerNote?.focus()}function pt(){let e=E();e.composer&&(Un(),g.pendingAnnotation=null,g.pendingAnnotationFilePath=null,e.composerNote&&(e.composerNote.value=""),e.composer.classList.add("hidden"))}function Un(){let e=document.getElementById("reader");if(!e)return;let t=Array.from(e.querySelectorAll(".annotation-mark-temp"));for(let n of t){let o=n.parentNode;for(;n.firstChild;)o?.insertBefore(n.firstChild,n);o?.removeChild(n)}}function Ua(){let e=E();if(!e.reader||!g.pendingAnnotation)return;Un();let t=g.pendingAnnotation,n=Ot(e.reader,t.start),o=Ot(e.reader,t.start+t.length);if(!(!n||!o)&&!(n.node===o.node&&n.offset===o.offset)){if(n.node===o.node){let i=document.createRange();i.setStart(n.node,n.offset),i.setEnd(o.node,o.offset);let a=document.createElement("span");a.className="annotation-mark-temp";try{i.surroundContents(a)}catch{}return}try{let i=[],a=document.createTreeWalker(e.reader,NodeFilter.SHOW_TEXT,null,!1),r;for(;r=a.nextNode();){let s=document.createRange();s.selectNode(r);let l=document.createRange();l.setStart(n.node,n.offset),l.setEnd(o.node,o.offset);let d=l.compareBoundaryPoints(Range.END_TO_START,s),u=l.compareBoundaryPoints(Range.START_TO_END,s);if(d>0||u<0)continue;let f=r===n.node?n.offset:0,p=r===o.node?o.offset:r.nodeValue?.length||0;f<p&&i.push({node:r,start:f,end:p})}for(let s=i.length-1;s>=0;s--){let{node:l,start:d,end:u}=i[s],f=document.createRange();f.setStart(l,d),f.setEnd(l,u);let p=document.createElement("span");p.className="annotation-mark-temp",f.surroundContents(p)}}catch{}}}function Qn(e){return Ti(e),e.thread||[]}function Bi(e,t=!1){let n=Qn(e),o=n[0],i=n.slice(1);return t?\`
      <div class="annotation-note simple">\${x(o?.note||e.note||"\\uFF08\\u65E0\\u8BC4\\u8BBA\\u5185\\u5BB9\\uFF09")}</div>
      \${i.length>0?\`<div class="annotation-reply-count">\\u56DE\\u590D \${i.length}</div>\`:""}
    \`:n.map(r=>\`
      <div class="annotation-thread-line \${r.type==="reply"?"is-reply":""}" data-thread-item-id="\${r.id}" data-annotation-id="\${e.id}">
        <span class="annotation-thread-text">\${x(r.note)}</span>
        <button class="annotation-thread-edit-btn" data-edit-thread-item="\${r.id}" data-annotation-id="\${e.id}" title="\\u7F16\\u8F91">\${me("edit")}</button>
      </div>\`).join("")||'<div class="annotation-thread-line">\\uFF08\\u65E0\\u8BC4\\u8BBA\\u5185\\u5BB9\\uFF09</div>'}function Ni(e,t,n){let o=g.annotations.find(s=>s.id===e);if(!o)return;let i=n.trim();if(!i)return;let a=Qn(o),r=Date.now();a.push({id:\`r-\${r}-\${Math.random().toString(16).slice(2,8)}\`,type:"reply",note:i,createdAt:r}),o.thread=a,o.note=a[0]?.note||o.note,li(t,{id:e},i,"me").then(s=>{g.currentFilePath===t&&(Ei(s),N(t),W())}).catch(s=>{L(\`\\u56DE\\u590D\\u8BC4\\u8BBA\\u5931\\u8D25: \${s?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)})}function zt(e,t,n){let o=document.querySelector(\`.annotation-thread-line[data-thread-item-id="\${t}"][data-annotation-id="\${e}"]\`);if(!o)return;let i=g.annotations.find(p=>p.id===e);if(!i)return;let a=Qn(i),r=a.find(p=>p.id===t);if(!r)return;let s=o.innerHTML;o.classList.add("is-editing"),o.innerHTML=\`<textarea class="annotation-thread-edit-input" placeholder="Cmd+Enter \\u4FDD\\u5B58\\uFF0CEsc \\u53D6\\u6D88">\${x(r.note)}</textarea>\`;let l=o.querySelector("textarea");l.style.height=\`\${Math.max(l.scrollHeight,34)}px\`,l.focus(),l.setSelectionRange(l.value.length,l.value.length);let d=!1,u=()=>{d||(d=!0,o.classList.remove("is-editing"),o.innerHTML=s,o.querySelector("[data-edit-thread-item]")?.addEventListener("click",p=>{p.stopPropagation(),zt(e,t,n)}))},f=()=>{if(d)return;d=!0;let p=l.value.trim();if(!p||p===r.note){o.classList.remove("is-editing"),o.innerHTML=s,o.querySelector("[data-edit-thread-item]")?.addEventListener("click",m=>{m.stopPropagation(),zt(e,t,n)});return}if(r.note=p,a[0]?.id===t&&(i.note=p),i.thread=a,zn(n,i,"\\u7F16\\u8F91\\u8BC4\\u8BBA\\u5931\\u8D25"),N(n),g.pinnedAnnotationId===e){let h=document.querySelector(\`[data-annotation-id="\${e}"]\`)?.getBoundingClientRect();mt(i,h?h.right+8:120,h?h.top+8:120)}};l.addEventListener("keydown",p=>{if(_t(p,l)){p.preventDefault();return}p.key==="Escape"?(p.preventDefault(),u()):p.key==="Enter"&&(p.metaKey||p.ctrlKey)&&(p.preventDefault(),f())}),l.addEventListener("input",()=>{l.style.height="auto",l.style.height=\`\${Math.min(200,Math.max(l.scrollHeight,34))}px\`}),l.addEventListener("blur",p=>{let m=p.relatedTarget,h=o.closest(".annotation-item");m&&h&&h.contains(m)||setTimeout(()=>{d||u()},150)})}function Fe(e){e.style.height="auto";let t=160,n=Math.min(t,Math.max(e.scrollHeight,34));e.style.height=\`\${n}px\`,e.style.overflowY=e.scrollHeight>t?"auto":"hidden"}function Hi(e){e.style.height="auto";let t=200,n=Math.min(t,Math.max(e.scrollHeight,34));e.style.height=\`\${n}px\`,e.style.overflowY=e.scrollHeight>t?"auto":"hidden"}function mt(e,t,n){let o=E();if(!o.popover||!o.popoverTitle||!o.popoverNote)return;let i=e.quote.substring(0,22);o.popoverTitle.textContent=\`#\${e.serial||0} | \${i}\${e.quote.length>22?"...":""}\`;let a=Bi(e,!1);if(o.popoverNote.innerHTML=\`
    <div class="annotation-thread">\${a}</div>
    <div class="annotation-reply-entry" data-popover-reply-entry="\${e.id}" role="button" tabindex="0">
      <textarea rows="1" data-popover-reply-input="\${e.id}" placeholder="\\u8F93\\u5165\\u56DE\\u590D\\u5185\\u5BB9\\uFF08Cmd+Enter \\u63D0\\u4EA4\\uFF09"></textarea>
    </div>
  \`,o.popoverResolveBtn){let r=fe(e);o.popoverResolveBtn.title=r?"\\u91CD\\u65B0\\u6253\\u5F00":"\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3",o.popoverResolveBtn.setAttribute("aria-label",r?"\\u91CD\\u65B0\\u6253\\u5F00":"\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3"),o.popoverResolveBtn.innerHTML=me(r?"reopen":"check"),o.popoverResolveBtn.classList.toggle("is-resolved",r)}o.popover.style.left=\`\${Math.round(t)}px\`,o.popover.style.top=\`\${Math.round(n)}px\`,o.popover.classList.remove("hidden")}function yi(){let e=g.pinnedAnnotationId;if(!e)return;let t=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(!t)return;let n=g.annotations.find(i=>i.id===e);if(!n)return;let o=t.getBoundingClientRect();mt(n,o.right+8,o.top+8)}function he(e=!1){let t=E();t.popover&&(!e&&g.pinnedAnnotationId||(t.popover.classList.add("hidden"),e&&(g.pinnedAnnotationId=null)))}function bi(e){let t=E();if(!g.pendingAnnotation||!t.composerNote)return;let n=g.pendingAnnotationFilePath;if(!n||n!==e)return;let o=t.composerNote.value.trim();if(!o)return;let i=Date.now(),a={...g.pendingAnnotation,serial:_n(g.annotations),note:o,thread:[{id:\`c-\${i}-\${Math.random().toString(16).slice(2,8)}\`,type:"comment",note:o,createdAt:i}]};g.annotations.push(a),zn(e,a,"\\u521B\\u5EFA\\u8BC4\\u8BBA\\u5931\\u8D25"),pt(),W(),N(e)}function ji(e,t){let n=g.annotations.slice();g.annotations=g.annotations.filter(o=>o.id!==e),g.pinnedAnnotationId===e&&(g.pinnedAnnotationId=null,he(!0)),g.activeAnnotationId===e&&(g.activeAnnotationId=null),W(),N(t),ci(t,{id:e}).catch(o=>{g.annotations=n,L(\`\\u5220\\u9664\\u8BC4\\u8BBA\\u5931\\u8D25: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600),W(),N(t)})}function Qa(e){let t=E();if(!t.content)return;let n=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(n){let o=t.content.getBoundingClientRect(),i=n.getBoundingClientRect(),r=t.content.scrollTop+(i.top-o.top),l=Math.max(0,r-56);t.content.scrollTo({top:l,behavior:"smooth"})}}function Wi(e,t){g.activeAnnotationId=e,W(),e&&(Qa(e),g.pinnedAnnotationId=e,requestAnimationFrame(()=>{let n=g.annotations.find(a=>a.id===e),o=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(!n||!o)return;let i=o.getBoundingClientRect();mt(n,i.right+8,i.top+8)})),N(t)}function Kt(e,t,n){let o=Vt(),i=o.findIndex(r=>r.id===e);if(i<0)return;let a=o[i+t];a&&Wi(a.id,n)}function Ga(e){let t=document.getElementById("content"),n=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(!t||!n)return null;let o=t.getBoundingClientRect(),i=n.getBoundingClientRect();return t.scrollTop+(i.top-o.top)}function Gn(){if(g.density!=="default")return;let e=document.getElementById("content"),t=document.getElementById("annotationList");!e||!t||(t.scrollTop=e.scrollTop)}function Di(e,t){let n=g.annotations.find(a=>a.id===e);if(!n)return;let o=n.status;n.status==="resolved"?n.status=(n.confidence||0)<=0?"unanchored":"anchored":n.status="resolved";let i=n.status||"anchored";he(!0),W(),N(t),di(t,{id:e},i).catch(a=>{n.status=o,L(\`\\u66F4\\u65B0\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25: \${a?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600),W(),N(t)})}function wi(e,t){e.classList.add("annotation-mark"),e.dataset.annotationId=t.id,e.classList.add(\`status-\${Jn(t)}\`),fe(t)&&e.classList.add("is-resolved")}function Xa(e,t){let n=E();if(!n.reader||typeof e.start!="number"||typeof e.length!="number"||e.length<=0)return;let o=Ot(n.reader,e.start,t),i=Ot(n.reader,e.start+e.length,t);if(!(!o||!i)&&!(o.node===i.node&&o.offset===i.offset)){if(o.node===i.node){let a=document.createRange();a.setStart(o.node,o.offset),a.setEnd(i.node,i.offset);let r=document.createElement("span");wi(r,e);try{a.surroundContents(r)}catch{}return}try{let a=[],r=document.createTreeWalker(n.reader,NodeFilter.SHOW_TEXT,null,!1),s;for(;s=r.nextNode();){let l=document.createRange();l.selectNode(s);let d=document.createRange();d.setStart(o.node,o.offset),d.setEnd(i.node,i.offset);let u=d.compareBoundaryPoints(Range.END_TO_START,l),f=d.compareBoundaryPoints(Range.START_TO_END,l);if(u>0||f<0)continue;let p=s===o.node?o.offset:0,m=s===i.node?i.offset:s.nodeValue?.length||0;p<m&&a.push({node:s,start:p,end:m})}for(let l=a.length-1;l>=0;l--){let{node:d,start:u,end:f}=a[l],p=document.createRange();p.setStart(d,u),p.setEnd(d,f);let m=document.createElement("span");wi(m,e),p.surroundContents(m)}}catch{}}}function Ya(){let e=E();e.reader&&e.reader.querySelectorAll(".annotation-mark").forEach(t=>{let n=t.getAttribute("data-annotation-id"),o=g.annotations.find(i=>i.id===n);o&&(t.classList.toggle("is-active",!!n&&n===g.activeAnnotationId),t.addEventListener("click",i=>{if(i.stopPropagation(),g.pinnedAnnotationId===n){g.pinnedAnnotationId=null,he(!0);return}g.activeAnnotationId=n,g.pinnedAnnotationId=n;let a=t.getBoundingClientRect();mt(o,a.right+8,a.top+8);let r=_();N(r||null)}))})}function Za(){let e=E();if(!e.reader)return;let t=Array.from(e.reader.querySelectorAll(".annotation-mark"));for(let n of t){let o=n.parentNode;for(;n.firstChild;)o?.insertBefore(n.firstChild,n);o?.removeChild(n)}}function W(){let e=E();Za();let t=e.reader?ni(ii(e.reader)):void 0;if(e.reader){let o=t?t.nodes.map(r=>r.nodeValue||"").join(""):Ai(e.reader),i=!1,a=[];for(let r of g.annotations){let s=pi(o,r),l=!1,d=s.status;r.start!==s.start&&(r.start=s.start,i=!0,l=!0),r.length!==s.length&&(r.length=s.length,i=!0,l=!0);let u=za(r.status,d);(r.status||"anchored")!==u&&(r.status=u,i=!0,l=!0),r.confidence!==s.confidence&&(r.confidence=s.confidence,i=!0,l=!0),l&&a.push({...r,thread:r.thread?[...r.thread]:r.thread})}if(i){let r=_();r&&Mi(r,a,"\\u540C\\u6B65\\u8BC4\\u8BBA\\u951A\\u70B9\\u5931\\u8D25")}}let n=[...Vt()].sort((o,i)=>i.start-o.start);for(let o of n)Xa(o,t);Ya()}function es(e,t){let n=e.querySelector(".annotation-canvas");if(!n)return;let o=Array.from(n.querySelectorAll(".annotation-item.positioned"));if(o.length===0)return;let i=o.map(u=>u.offsetHeight),a=6,r=0,s=[];for(let u=0;u<o.length;u++){let f=Number(o[u].getAttribute("data-anchor-top")||"0"),p=Number.isFinite(f)?Math.max(0,f):0,m=Math.max(p,r>0?r+a:p);s.push(m),r=m+i[u]}for(let u=0;u<o.length;u++)o[u].style.top=\`\${Math.round(s[u])}px\`;let l=Math.max(0,t),d=Math.ceil(r+24);n.style.height=\`\${Math.max(l,d)}px\`}function N(e){let t=E();if(!t.annotationList)return;Da(),Wa();let n=new Map;if(t.annotationList.querySelectorAll("[data-reply-input]").forEach(a=>{let r=a.getAttribute("data-reply-input");r&&a.value.trim()&&n.set(r,a.value)}),!e||g.annotations.length===0){t.annotationList.innerHTML='<div class="annotation-empty">\\u65E0\\u8BC4\\u8BBA\\uFF08\\u9009\\u4E2D\\u6587\\u672C\\u5373\\u53EF\\u6DFB\\u52A0\\uFF09</div>';return}let o=Vt();if(o.length===0){t.annotationList.innerHTML='<div class="annotation-empty">\\u5F53\\u524D\\u7B5B\\u9009\\u4E0B\\u65E0\\u8BC4\\u8BBA</div>';return}let i=(a,r,s=!1,l=0)=>\`
    <div class="annotation-item \${g.activeAnnotationId===a.id?"is-active":""} status-\${Jn(a)}\${fe(a)?" is-resolved":""}\${s?" positioned":""}" data-annotation-id="\${a.id}"\${s?\` data-anchor-top="\${Math.max(0,Math.round(l))}" style="top:\${Math.max(0,Math.round(l))}px"\`:""}>
      <div class="annotation-row-top">
        <div class="annotation-row-title">#\${a.serial||r+1} | \${x(a.quote.substring(0,28))}\${a.quote.length>28?"...":""}</div>
        <div class="annotation-row-actions">
          <button class="annotation-icon-action" data-action="prev" data-id="\${a.id}" title="\\u4E0A\\u4E00\\u6761">\${me("up")}</button>
          <button class="annotation-icon-action" data-action="next" data-id="\${a.id}" title="\\u4E0B\\u4E00\\u6761">\${me("down")}</button>
          <button class="annotation-icon-action resolve\${fe(a)?" is-resolved":""}" data-action="resolve" data-id="\${a.id}" title="\${fe(a)?"\\u91CD\\u65B0\\u6253\\u5F00":"\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3"}">\${fe(a)?me("reopen"):me("check")}</button>
          <button class="annotation-icon-action danger" data-action="delete" data-id="\${a.id}" title="\\u5220\\u9664">\${me("trash")}</button>
        </div>
      </div>
      <div class="annotation-thread">\${Bi(a,g.density==="simple")}</div>
      \${g.density==="simple"?"":\`
        <div class="annotation-reply-entry" data-reply-entry="\${a.id}" role="button" tabindex="0">
          <textarea rows="1" data-reply-input="\${a.id}" placeholder="\\u8F93\\u5165\\u56DE\\u590D\\u5185\\u5BB9\\uFF08Cmd+Enter \\u63D0\\u4EA4\\uFF09"></textarea>
        </div>
      \`}
    </div>
  \`;if(g.density==="default"){let a=o.map(u=>Ga(u.id)),r=0,s=o.map((u,f)=>{let p=a[f]??f*88;return r=Math.max(r,p),i(u,f,!0,p)}).join(""),l=document.getElementById("content"),d=Math.max(l?.scrollHeight||0,r+180);t.annotationList.classList.add("default-mode"),t.annotationList.innerHTML=\`<div class="annotation-canvas" style="height:\${d}px">\${s}</div>\`,es(t.annotationList,l?.scrollHeight||0),Gn()}else t.annotationList.classList.remove("default-mode"),t.annotationList.innerHTML=o.map((a,r)=>i(a,r)).join("");t.annotationList.querySelectorAll(".annotation-icon-action").forEach(a=>{a.addEventListener("click",r=>{r.stopPropagation();let s=r.currentTarget,l=s.getAttribute("data-action"),d=s.getAttribute("data-id");!d||!e||(l==="prev"?Kt(d,-1,e):l==="next"?Kt(d,1,e):l==="resolve"?Di(d,e):l==="delete"&&ji(d,e))})}),t.annotationList.querySelectorAll("[data-edit-thread-item]").forEach(a=>{a.addEventListener("click",r=>{r.stopPropagation();let s=a.getAttribute("data-edit-thread-item"),l=a.getAttribute("data-annotation-id");!s||!l||!e||zt(l,s,e)})}),t.annotationList.querySelectorAll("[data-reply-entry]").forEach(a=>{a.addEventListener("click",r=>{r.stopPropagation();let s=a.getAttribute("data-reply-entry");if(!s)return;let l=t.annotationList?.querySelector(\`[data-reply-input="\${s}"]\`);l&&(Fe(l),l.focus())}),a.addEventListener("keydown",r=>{if(r.target instanceof HTMLTextAreaElement||r.key!=="Enter"&&r.key!==" ")return;r.preventDefault(),r.stopPropagation();let l=a.getAttribute("data-reply-entry");if(!l)return;let d=t.annotationList?.querySelector(\`[data-reply-input="\${l}"]\`);d&&(Fe(d),d.focus())})}),n.size>0&&t.annotationList.querySelectorAll("[data-reply-input]").forEach(a=>{let r=a.getAttribute("data-reply-input");r&&n.has(r)&&(a.value=n.get(r))}),requestAnimationFrame(()=>{t.annotationList?.querySelectorAll("[data-reply-input]").forEach(a=>{Fe(a)})}),t.annotationList.querySelectorAll("[data-reply-input]").forEach(a=>{let r=a;r.addEventListener("input",()=>Fe(r)),r.addEventListener("click",s=>s.stopPropagation()),a.addEventListener("keydown",s=>{if(_t(s,s.currentTarget)){s.preventDefault();return}if(s.key!=="Enter"||!(s.metaKey||s.ctrlKey))return;s.preventDefault();let l=s.currentTarget,d=l.getAttribute("data-reply-input");!d||!e||(Ni(d,e,l.value),l.value="",N(e))})}),t.annotationList.querySelectorAll(".annotation-item").forEach(a=>{a.addEventListener("click",()=>{let r=a.getAttribute("data-annotation-id");!r||!e||Wi(r,e)})})}function Ri(e){let t=E(),n=t.content?.getAttribute("data-current-file");if(!e||!n||e!==n||!t.reader)return;let o=window.getSelection();if(!o||o.rangeCount===0||o.isCollapsed)return;let i=o.getRangeAt(0);if(!t.reader.contains(i.commonAncestorContainer))return;let a=o.toString().trim();if(!a)return;let r=fi(t.reader,i.startContainer,i.startOffset),s=fi(t.reader,i.endContainer,i.endOffset);if(r<0||s<=r)return;let l=Ai(t.reader),d=32,u=32,f=l.slice(Math.max(0,r-d),r),p=l.slice(s,Math.min(l.length,s+u)),m=i.getBoundingClientRect();Ka(m.right+6,m.top-8,{id:\`ann-\${Date.now()}-\${Math.random().toString(16).slice(2,8)}\`,start:r,length:s-r,quote:a,quotePrefix:f,quoteSuffix:p,status:"anchored",confidence:1})}function Oi(){qa(),_e(!0),document.getElementById("composerSaveBtn")?.addEventListener("click",()=>{let e=_();e&&bi(e)}),document.getElementById("composerCancelBtn")?.addEventListener("click",pt),E().composerNote?.addEventListener("keydown",e=>{if(_t(e,e.currentTarget)){e.preventDefault();return}if(e.key!=="Enter"||!(e.metaKey||e.ctrlKey))return;e.preventDefault();let t=_();t&&bi(t)}),E().composerNote?.addEventListener("input",e=>{let t=e.currentTarget;Hi(t)}),E().quickAdd?.addEventListener("click",e=>{e.stopPropagation(),Pi()}),document.getElementById("popoverCloseBtn")?.addEventListener("click",()=>{g.pinnedAnnotationId=null,he(!0)}),document.getElementById("popoverDeleteBtn")?.addEventListener("click",()=>{let e=_(),t=g.pinnedAnnotationId;t&&e&&ji(t,e)}),document.getElementById("popoverResolveBtn")?.addEventListener("click",()=>{let e=_(),t=g.pinnedAnnotationId;t&&e&&Di(t,e)}),document.getElementById("popoverPrevBtn")?.addEventListener("click",()=>{let e=_(),t=g.pinnedAnnotationId;t&&e&&Kt(t,-1,e)}),document.getElementById("popoverNextBtn")?.addEventListener("click",()=>{let e=_(),t=g.pinnedAnnotationId;t&&e&&Kt(t,1,e)}),document.getElementById("annotationPopover")?.addEventListener("click",e=>{let t=e.target,n=_();if(!n)return;let o=t.closest("[data-edit-thread-item]");if(o){e.stopPropagation();let r=o.getAttribute("data-edit-thread-item"),s=o.getAttribute("data-annotation-id");r&&s&&zt(s,r,n);return}let i=t.closest("[data-popover-reply-entry]");if(i){e.stopPropagation();let r=i.getAttribute("data-popover-reply-entry");if(!r)return;let s=document.querySelector(\`[data-popover-reply-input="\${r}"]\`);if(!s)return;Fe(s),s.focus();return}t.closest("[data-popover-reply-input]")&&e.stopPropagation()}),document.getElementById("annotationPopover")?.addEventListener("keydown",e=>{let t=e.target;if(t instanceof HTMLTextAreaElement)return;let n=t.closest("[data-popover-reply-entry]");if(!n||e.key!=="Enter"&&e.key!==" ")return;e.preventDefault(),e.stopPropagation();let o=n.getAttribute("data-popover-reply-entry");if(!o)return;let i=document.querySelector(\`[data-popover-reply-input="\${o}"]\`);i&&(Fe(i),i.focus())}),document.getElementById("annotationPopover")?.addEventListener("keydown",e=>{let t=e.target;if(!(t instanceof HTMLTextAreaElement))return;if(_t(e,t)){e.preventDefault();return}if(e.key!=="Enter"||!(e.metaKey||e.ctrlKey))return;let n=t.getAttribute("data-popover-reply-input"),o=_();if(!n||!o)return;e.preventDefault(),Ni(n,o,t.value),t.value="";let i=g.annotations.find(s=>s.id===n),r=document.querySelector(\`[data-annotation-id="\${n}"]\`)?.getBoundingClientRect();i&&mt(i,r?r.right+8:120,r?r.top+8:120),N(o)}),document.getElementById("annotationPopover")?.addEventListener("input",e=>{let t=e.target;t instanceof HTMLTextAreaElement&&t.hasAttribute("data-popover-reply-input")&&Fe(t)}),E().filterMenu?.querySelectorAll(".annotation-filter-item[data-filter]").forEach(e=>{e.addEventListener("click",()=>{let t=e.getAttribute("data-filter");if(!t)return;g.filter=t,E().filterMenu?.classList.add("hidden");let n=_();W(),N(n||null)})}),E().filterToggle?.addEventListener("click",e=>{e.stopPropagation();let t=E().filterMenu;t&&t.classList.toggle("hidden")}),E().densityToggle?.addEventListener("click",()=>{g.density=g.density==="default"?"simple":"default",localStorage.setItem("md-viewer:annotation-density",g.density);let e=_();N(e||null)}),E().closeToggle?.addEventListener("click",()=>{hi()}),E().floatingOpenBtn?.addEventListener("click",()=>{gi()}),E().sidebarResizer?.addEventListener("mousedown",e=>{if(E().sidebar?.classList.contains("collapsed"))return;e.preventDefault();let t=document.documentElement,n=Number(getComputedStyle(t).getPropertyValue("--annotation-sidebar-width").replace("px",""))||ki,o=e.clientX;document.body.classList.add("annotation-sidebar-resizing");let i=r=>{let s=o-r.clientX;Ci(n+s),ge()},a=()=>{document.body.classList.remove("annotation-sidebar-resizing"),window.removeEventListener("mousemove",i),window.removeEventListener("mouseup",a)};window.addEventListener("mousemove",i),window.addEventListener("mouseup",a)}),document.getElementById("content")?.addEventListener("scroll",()=>{ze(!1),Gn(),yi()}),window.addEventListener("resize",()=>{ge(),yi()}),window.openAnnotationSidebar=gi,window.closeAnnotationSidebar=hi,window.toggleAnnotationSidebar=_a,document.addEventListener("mousedown",e=>{let t=e.target,n=E();if(t.closest(".annotation-mark-temp")){Ja();return}n.composer&&!n.composer.classList.contains("hidden")&&!n.composer.contains(t)&&!(n.quickAdd&&n.quickAdd.contains(t))&&Va(),n.popover&&!n.popover.contains(t)&&!t.closest(".annotation-mark")&&(g.pinnedAnnotationId=null,he(!0)),n.filterMenu&&!n.filterMenu.classList.contains("hidden")&&!n.filterMenu.contains(t)&&!t.closest("#annotationFilterToggle")&&n.filterMenu.classList.add("hidden"),n.quickAdd&&!n.quickAdd.classList.contains("hidden")&&!n.quickAdd.contains(t)&&!t.closest("#annotationComposer")&&ze(!0)}),E().composerHeader?.addEventListener("mousedown",e=>{if(e.target.closest(".annotation-row-actions"))return;let t=E().composer;if(!t)return;let n=t.getBoundingClientRect(),o=e.clientX,i=e.clientY,a=n.left,r=n.top;e.preventDefault();let s=d=>{let u=a+(d.clientX-o),f=r+(d.clientY-i);Vn(t,u,f)},l=()=>{window.removeEventListener("mousemove",s),window.removeEventListener("mouseup",l)};window.addEventListener("mousemove",s),window.addEventListener("mouseup",l)})}function qi(e,t){g.pendingAnnotation=e,g.pendingAnnotationFilePath=t,Pi()}var vi,ki,\$a,Ca,g,xi,Jt=v(()=>{"use strict";ri();Te();ui();je();mi();vi="md-viewer:annotation-sidebar-width",ki=320,\$a=260,Ca=540;g={annotations:[],pendingAnnotation:null,pendingAnnotationFilePath:null,pinnedAnnotationId:null,activeAnnotationId:null,currentFilePath:null,filter:"open",density:Ia()},xi="md-viewer:annotation-panel-open-by-file"});var B={};we(B,{renderCurrentPath:()=>Zn,renderFiles:()=>eo,renderSearchBox:()=>Qi,renderSidebar:()=>\$,renderTabs:()=>ye,setSidebarTab:()=>Ui});function Ji(e){c.currentFile&&(_i||requestAnimationFrame(()=>{let t=e.querySelector(".file-item.current, .tree-item.current");if(!t)return;let n=t.offsetTop-e.clientHeight*.4,o=Math.max(0,e.scrollHeight-e.clientHeight),i=Math.max(0,Math.min(n,o));e.scrollTo({top:i,behavior:"auto"}),_i=!0}))}function Ui(e){c.config.sidebarTab=e,O(c.config),\$()}function ts(e){if(!e)return;let t=Ke.indexOf(e);t>=0&&Ke.splice(t,1),Ke.unshift(e),Ke.length>300&&(Ke.length=300)}function Vi(e){let t=Ke.indexOf(e);return t>=0?t:Number.MAX_SAFE_INTEGER}function ns(){K=!K,ye()}function os(){K&&(K=!1,ye())}function is(e){Gt=(e||"").trimStart(),K||(K=!0),ye()}function rs(e){ft=e==="name"?"name":"recent",ye()}function as(){zi||(zi=!0,document.addEventListener("click",e=>{!K||e.target?.closest(".tab-manager-wrap")||os()}))}function ss(){if(Ki)return;Ki=!0;let e=document.getElementById("tabs");e&&e.addEventListener("scroll",t=>{let n=t.target;n.classList.contains("tabs-scroll")?Yt=n.scrollLeft:n.classList.contains("tab-manager-list")&&(Xt=n.scrollTop)},{passive:!0,capture:!0})}function ls(e){let t=Bt(c.sessionFiles),n=Be(e,t,c.currentFile,i=>{let a=t.find(s=>s.path===i);if(!a)return!1;let r=J(a,q(a.path));return r.type==="normal"||r.type==="new"}),o=window.removeFile;if(!o||n.length===0){ye();return}n.forEach(i=>o(i))}function Yn(){if(c.config.sidebarTab==="focus"||c.config.sidebarTab==="full"){\$();return}eo()}function cs(e){let t=e.trim();return t?!!(/^https?:\\/\\//i.test(t)||t.startsWith("/")||t.startsWith("~/")||t.startsWith("./")||t.startsWith("../")||t.includes("/")||t.includes("\\\\")||/\\.[a-zA-Z0-9]{1,10}\$/.test(t)):!1}function Qi(){let e=document.getElementById("searchBox");if(!e)return;let t=e.querySelector("#searchInput"),n=e.querySelector("#searchClear"),o=c.config.sidebarTab,i=o==="list"?"\\u641C\\u7D22\\u5DF2\\u6253\\u5F00\\u7684\\u6587\\u4EF6":o==="focus"?"\\u641C\\u7D22\\u7126\\u70B9\\u6587\\u4EF6":"\\u641C\\u7D22\\u6216\\u8F93\\u5165\\u8DEF\\u5F84\\uFF08Enter\\u8865\\u5168\\uFF0CCmd/Ctrl+Enter\\u6DFB\\u52A0\\uFF09";if(!t||!n){if(e.innerHTML=\`
      <div class="search-wrapper">
        <span class="search-icon">\\u{1F50D}</span>
        <input
          type="text"
          class="search-input"
          placeholder="\${i}"
          id="searchInput"
        />
        <button class="search-clear" id="searchClear">\\xD7</button>
      </div>
    \`,t=e.querySelector("#searchInput"),n=e.querySelector("#searchClear"),!t||!n)return;Ht(t,{kind:"file",markdownOnly:!1,shouldActivate:cs}),t.addEventListener("input",a=>{window.dismissQuickActionConfirm?.();let r=a.target.value;Ut=0,Qt="",de(r),n&&(n.style.display=r?"block":"none"),Yn(),c.currentFile&&(An(c.currentFile)||nt(c.currentFile))&&window.renderContent?.()}),t.addEventListener("keydown",a=>{if(a.key==="Enter"&&(a.metaKey||a.ctrlKey)){a.preventDefault(),t.dispatchEvent(new Event("path-autocomplete-hide")),window.handleUnifiedInputSubmit?.(t.value);return}if(!a.defaultPrevented&&(a.key==="Enter"&&(a.preventDefault(),t.dispatchEvent(new Event("path-autocomplete-hide")),window.handleUnifiedInputSubmit?.(t.value)),a.key==="Escape")){window.dismissQuickActionConfirm?.();let r=Date.now(),s=t.value;if(r-Ut<900&&Qt===s&&s){de(""),t.value="",n&&(n.style.display="none"),Yn(),Ut=0,Qt="",a.preventDefault();return}Ut=r,Qt=s}}),n.addEventListener("click",()=>{de(""),t&&(t.value=""),n.style.display="none",Yn(),t?.focus()})}document.activeElement!==t&&t.value!==c.searchQuery&&(t.value=c.searchQuery),n.style.display=c.searchQuery?"block":"none",t.placeholder=i}function Zn(){let e=document.getElementById("currentPath");e&&(e.innerHTML="",e.style.display="none")}function ds(){let e=document.getElementById("modeSwitchRow");if(!e)return;let t=c.config.sidebarTab,n=[{key:"focus",label:"\\u7126\\u70B9"},{key:"full",label:"\\u5168\\u91CF"},{key:"list",label:"\\u5217\\u8868"}];e.innerHTML=\`
    <div class="view-tabs">
      \${n.map(o=>\`
        <button class="view-tab\${t===o.key?" active":""}"
                onclick="setSidebarTab('\${o.key}')">\${o.label}</button>
      \`).join("")}
    </div>
  \`}function eo(){let e=document.getElementById("fileList");if(!e)return;if(c.sessionFiles.size===0){e.innerHTML='<div class="empty-tip">\\u70B9\\u51FB\\u4E0A\\u65B9\\u6DFB\\u52A0 Markdown/HTML \\u6587\\u4EF6</div>';return}let t=Sn();if(t.length===0){e.innerHTML='<div class="empty-tip">\\u672A\\u627E\\u5230\\u5339\\u914D\\u7684\\u6587\\u4EF6</div>';return}let n=new Map(t.map(i=>[i.path,i])),o=Bt(n);e.innerHTML=o.map(i=>{let a=i.path===c.currentFile,r=i.isMissing||!1,s=Ee(i.path),l=["file-item",a?"current":"",r?"deleted":""].filter(Boolean).join(" "),d=i.displayName||i.name,u=c.searchQuery.toLowerCase().trim();if(u){let m=d.toLowerCase().indexOf(u);if(m!==-1){let h=d.substring(0,m),y=d.substring(m,m+u.length),b=d.substring(m+u.length);d=\`\${h}<mark class="search-highlight">\${y}</mark>\${b}\`}}let f=J(i,q(i.path)),p="&nbsp;";return f.badge==="dot"?p='<span class="new-dot"></span>':f.badge&&(p=\`<span class="status-badge status-\${f.type}" style="color: \${f.color}">\${f.badge}</span>\`),\`
      <div class="\${l}"
           onclick="window.switchFile('\${T(i.path)}')">
        <span class="file-type-icon \${s.cls}">\${x(s.label)}</span>
        <span class="name">\${d}</span>
        <span class="file-item-status">\${p}</span>
        <span class="close" onclick="event.stopPropagation();window.removeFile('\${T(i.path)}')">\\xD7</span>
      </div>
    \`}).join(""),Ji(e)}function \$(){let e=c.config.sidebarTab,t=document.querySelector(".sidebar");if(t&&t.classList.toggle("workspace-mode",e==="focus"||e==="full"),Qi(),ds(),e==="list"){Zn(),eo(),ye();return}if(Zn(),!t)return;let n=document.getElementById("fileList");n||(n=document.createElement("div"),n.id="fileList",n.className="file-list",t.appendChild(n)),n.innerHTML=Go(),Yo(),Ji(n),ye()}function ye(){let e=Array.from(c.sessionFiles.values()),t=document.getElementById("tabs");if(!t)return;as(),ss();let n=t.querySelector(".tab-manager-list");n&&(Xt=n.scrollTop);let o=t.querySelector(".tabs-scroll");if(o&&(Yt=o.scrollLeft),e.length===0){t.innerHTML="",t.style.display="none",K=!1,Xn="";return}let i=Bt(c.sessionFiles),a=i.map(p=>{let m=J(p,q(p.path));return[p.path,p.displayName||p.name,p.isMissing?"1":"0",p.path===c.currentFile?"1":"0",m.type,m.badge||""].join("|")}).join("||"),r=[c.currentFile||"",K?"1":"0",ft,Gt,a].join("###");if(r===Xn)return;Xn=r,ts(c.currentFile),t.style.display="flex";let s=i.map(p=>{let m=p.path===c.currentFile,h=p.isMissing||!1,y=["tab"];return m&&y.push("active"),h&&y.push("deleted"),\`
        <div class="\${y.join(" ")}"
             onclick="window.switchFile('\${T(p.path)}')">
          <span class="tab-name">\${x(p.displayName)}</span>
          <span class="tab-close" onclick="event.stopPropagation();window.removeFile('\${T(p.path)}')">\\xD7</span>
        </div>
      \`}).join(""),l=Gt.toLowerCase().trim(),d=i.filter(p=>{let m=p.displayName||p.name;return l?m.toLowerCase().includes(l)||p.path.toLowerCase().includes(l):!0}).sort((p,m)=>{let h=p.displayName||p.name,y=m.displayName||m.name;if(ft==="name")return h.localeCompare(y,"zh-CN");let b=Vi(p.path)-Vi(m.path);return b!==0?b:h.localeCompare(y,"zh-CN")}),u=d.length===0?'<div class="tab-manager-empty">\\u6CA1\\u6709\\u5339\\u914D\\u7684\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6</div>':d.map(p=>{let m=p.displayName||p.name,h=p.path===c.currentFile,y=J(p,q(p.path)),b=y.badge?\`<span class="tab-manager-status status-\${y.type}">\${x(y.badge)}</span>\`:"";return\`
          <div class="tab-manager-item \${h?"active":""}" onclick="window.switchFile('\${T(p.path)}')">
            <span class="tab-manager-name" title="\${T(p.path)}">\${x(m)}</span>
            <span class="tab-manager-actions">
              \${b}
              <button class="tab-manager-close" type="button" title="\\u5173\\u95ED" onclick="event.stopPropagation();window.removeFile('\${T(p.path)}')">\\xD7</button>
            </span>
          </div>
        \`}).join(""),f={others:Be("close-others",i,c.currentFile,()=>!1).length,right:Be("close-right",i,c.currentFile,()=>!1).length,unmodified:Be("close-unmodified",i,c.currentFile,p=>{let m=i.find(y=>y.path===p);if(!m)return!1;let h=J(m,q(m.path));return h.type==="normal"||h.type==="new"}).length,all:Be("close-all",i,c.currentFile,()=>!1).length};t.innerHTML=\`
    <div class="tabs-scroll">\${s}</div>
    <div class="tab-manager-wrap">
      <button class="tab-manager-toggle \${K?"active":""}" type="button" onclick="event.stopPropagation();window.toggleTabManager()">\\u2261 Tabs (\${i.length})</button>
      <div class="tab-manager-panel \${K?"show":""}" onclick="event.stopPropagation()">
        <div class="tab-manager-row tab-manager-actions-row">
          <button class="tab-manager-action" type="button" data-action="close-others" onclick="window.applyTabBatchAction('close-others')">\\u5173\\u95ED\\u5176\\u4ED6 (\${f.others})</button>
          <button class="tab-manager-action" type="button" data-action="close-right" onclick="window.applyTabBatchAction('close-right')">\\u5173\\u95ED\\u53F3\\u4FA7 (\${f.right})</button>
          <button class="tab-manager-action" type="button" data-action="close-unmodified" onclick="window.applyTabBatchAction('close-unmodified')">\\u5173\\u95ED\\u672A\\u4FEE\\u6539 (\${f.unmodified})</button>
          <button class="tab-manager-action danger" type="button" data-action="close-all" onclick="window.applyTabBatchAction('close-all')">\\u5173\\u95ED\\u5168\\u90E8 (\${f.all})</button>
        </div>
        <div class="tab-manager-row">
          <input class="tab-manager-search" placeholder="\\u641C\\u7D22\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6" value="\${T(Gt)}" oninput="window.setTabManagerQuery(this.value)">
        </div>
        <div class="tab-manager-row">
          <button class="tab-manager-sort \${ft==="recent"?"active":""}" type="button" onclick="window.setTabManagerSort('recent')">\\u6700\\u8FD1\\u4F7F\\u7528</button>
          <button class="tab-manager-sort \${ft==="name"?"active":""}" type="button" onclick="window.setTabManagerSort('name')">\\u6309\\u540D\\u79F0</button>
        </div>
        <div class="tab-manager-list">\${u}</div>
      </div>
    </div>
  \`,requestAnimationFrame(()=>{let p=t.querySelector(".tab-manager-list");p&&Xt>0&&(p.scrollTop=Xt);let m=t.querySelector(".tabs-scroll");m&&Yt>0&&(m.scrollLeft=Yt),ge()})}var Ut,Qt,_i,K,Gt,ft,zi,Xt,Yt,Ki,Xn,Ke,I=v(()=>{"use strict";j();ce();Ie();Te();Wo();Ct();ot();Do();Zo();Jt();jn();Ut=0,Qt="",_i=!1,K=!1,Gt="",ft="recent",zi=!1,Xt=0,Yt=0,Ki=!1,Xn="",Ke=[];typeof window<"u"&&(window.setSidebarTab=Ui,window.toggleTabManager=ns,window.setTabManagerQuery=is,window.setTabManagerSort=rs,window.applyTabBatchAction=ls)});function Xi(e){let t=e.replace(/[.+^\${}()|[\\]\\\\]/g,"\\\\\$&");return t=t.replace(/\\*\\*/g,"\\xA7GLOBSTAR\\xA7"),t=t.replace(/\\*/g,"[^/]*"),t=t.replace(/\\?/g,"[^/]"),t=t.replace(/§GLOBSTAR§\\//g,"(?:.+/)?"),t=t.replace(/§GLOBSTAR§/g,".*"),e.endsWith("/")?new RegExp(\`(^|/)\${t}\`):new RegExp(\`(^|/)\${t}(/|\$)\`)}function Yi(e){if(e.type==="file")return[e];let t=[];for(let n of e.children||[])t.push(...Yi(n));return t}function us(e,t,n,o){if(!t)return[];let i=Date.now()-n,a=qe(t,e);return Yi(t).filter(s=>a.has(s.path)?!1:!!(o.has(s.path)||typeof s.lastModified=="number"&&s.lastModified>=i)).sort((s,l)=>{let d=o.has(s.path),u=o.has(l.path);return d!==u?d?-1:1:(l.lastModified||0)-(s.lastModified||0)})}function ps(e){let t=Date.now()-e,n=Math.floor(t/6e4);if(n<60)return\`\${n}m\`;let o=Math.floor(t/36e5);return o<24?\`\${o}h\`:\`\${Math.floor(t/864e5)}d\`}function ms(e,t){if(!t)return x(e);let n=e.toLowerCase().indexOf(t.toLowerCase());return n===-1?x(e):x(e.slice(0,n))+\`<mark class="search-highlight">\${x(e.slice(n,n+t.length))}</mark>\`+x(e.slice(n+t.length))}function fs(e,t,n){let o=c.currentFile===e.path,i=t.has(e.path),a=c.sessionFiles.get(e.path),r="normal";a?r=J(a,q(e.path)).type:tt(e.path)?r="modified":q(e.path)&&(r="new");let s=Ee(e.path),l=it(e.name)||e.name,d=e.lastModified?ps(e.lastModified):"",u=r==="modified"?'<span class="focus-file-dot modified"></span>':r==="new"?'<span class="focus-file-dot new-file"></span>':"",f=i?\`<button class="tree-pin-btn active" title="\\u53D6\\u6D88\\u56FA\\u5B9A" onclick="event.stopPropagation();handleUnpinFile('\${T(e.path)}')" data-path="\${T(e.path)}">\\u{1F4CC}</button>\`:\`<button class="tree-pin-btn" title="\\u56FA\\u5B9A\\u5230\\u7126\\u70B9\\u89C6\\u56FE" onclick="event.stopPropagation();handlePinFile('\${T(e.path)}')">\\u{1F4CC}</button>\`;return\`
    <div class="tree-item file-node focus-file-item\${o?" current":""}"
         data-path="\${T(e.path)}"
         onclick="handleFocusFileClick('\${T(e.path)}')">
      <span class="tree-indent" style="width:8px"></span>
      <span class="file-type-icon \${s.cls}">\${x(s.label)}</span>
      <span class="tree-name"><span class="tree-name-full">\${ms(l,n)}</span></span>
      \${u}
      \${d?\`<span class="focus-file-time">\${x(d)}</span>\`:""}
      \${f}
    </div>
  \`}function gs(){let e=c.config.focusWindowKey||"8h";return\`
    <div class="focus-filter-bar">
      <span class="focus-filter-label">\\u6700\\u8FD1</span>
      <div class="focus-time-pills">\${[{key:"8h",label:"8h"},{key:"2d",label:"2d"},{key:"1w",label:"1w"},{key:"1m",label:"1m"}].map(o=>\`<button class="focus-time-pill\${e===o.key?" active":""}"
             onclick="setFocusWindowKey('\${o.key}')">\${o.label}</button>\`).join("")}</div>
    </div>
  \`}function hs(e,t,n,o,i){let a=t.length>0,r=o?'<span class="focus-ws-badge empty">\\u2026</span>':a?\`<span class="focus-ws-badge">\${t.length}</span>\`:'<span class="focus-ws-badge empty">0</span>',s=a?t.map(l=>fs(l,n,i)).join(""):"";return\`
    <div class="focus-ws-group\${a?" has-files":""}">
      <div class="focus-ws-header" onclick="handleFocusWorkspaceToggle('\${T(e.id)}')">
        <span class="focus-ws-arrow\${a?" open":""}">\\u25B6</span>
        <span class="focus-ws-name">\${x(e.name)}</span>
        \${r}
      </div>
      \${a?\`<div class="focus-ws-files">\${s}</div>\`:""}
    </div>
  \`}function ei(){let e=c.config.workspaces;if(e.length===0)return'<div class="focus-empty">\\u6682\\u65E0\\u5DE5\\u4F5C\\u533A</div>';let t=Gi[c.config.focusWindowKey||"8h"]??Gi["8h"],n=\$n(),o=c.searchQuery.trim().toLowerCase(),i=e.map(a=>{let r=c.fileTree.get(a.id),s=!r;!r&&!to.has(a.id)&&(to.add(a.id),Q(a.id).then(d=>{to.delete(a.id),d&&Promise.resolve().then(()=>(I(),B)).then(({renderSidebar:u})=>u())}));let l=us(a.path,r,t,n);return o&&(l=l.filter(d=>(it(d.name)||d.name).toLowerCase().includes(o)||d.path.toLowerCase().includes(o))),hs(a,l,n,s,o)}).join("");return\`<div class="focus-view">\${gs()}\${i}</div>\`}var to,Gi,Dn=v(()=>{"use strict";j();Rt();Te();Ct();ot();Ln();rt();dt();ce();to=new Set,Gi={"8h":8*3600*1e3,"2d":2*86400*1e3,"1w":7*86400*1e3,"1m":30*86400*1e3}});function qe(e,t){let n=new Set;return Zi(e,t,[],n),n}function Zi(e,t,n,o){if(e.type==="file"){for(let{base:r,pattern:s}of n){let l=e.path.startsWith(r+"/")?e.path.slice(r.length+1):e.path;if(Xi(s).test(l)){o.add(e.path);return}}return}let i=(e.ignorePatterns||[]).map(r=>({base:e.path,pattern:r})),a=[...n,...i];for(let r of e.children||[])Zi(r,e.path,a,o)}var Rt=v(()=>{"use strict";Dn()});function er(e,t){let n=tr(e);n.size!==0&&Zt(t,n)}function tr(e,t=new Map){if(e.type!=="directory")return t;typeof e.isExpanded=="boolean"&&t.set(e.path,e.isExpanded);for(let n of e.children||[])tr(n,t);return t}function Zt(e,t){if(e.type==="directory"){let n=t.get(e.path);typeof n=="boolean"&&(e.isExpanded=n)}for(let n of e.children||[])Zt(n,t)}var nr=v(()=>{"use strict"});var ti={};we(ti,{addWorkspace:()=>en,getCurrentWorkspace:()=>ks,hydrateExpandedWorkspaces:()=>tn,inferWorkspaceFromPath:()=>xs,moveWorkspaceByOffset:()=>Dt,removeWorkspace:()=>Rn,revealFileInWorkspace:()=>no,scanWorkspace:()=>Q,switchWorkspace:()=>vs,toggleNodeExpanded:()=>qn,toggleWorkspaceExpanded:()=>On});function ys(){return\`ws-\${Date.now()}-\${Math.random().toString(36).substr(2,9)}\`}function Ve(e){return e.trim().replace(/\\/+\$/,"")}function bs(e){let t=Ve(e),n=null;for(let o of c.config.workspaces){let i=Ve(o.path);(t===i||t.startsWith(\`\${i}/\`))&&(!n||i.length>Ve(n.path).length)&&(n=o)}return n}function ws(e,t,n){let o=c.fileTree.get(e);if(!o)return;let i=Ve(t),a=Ve(n);if(!(a===i||a.startsWith(\`\${i}/\`)))return;let s=(a===i?"":a.slice(i.length+1)).split("/").filter(Boolean);if(s.length<=1)return;let l=!1,d=i;for(let u=0;u<s.length-1;u+=1){d=\`\${d}/\${s[u]}\`;let f=oo(o,d);f&&f.type==="directory"&&f.isExpanded===!1&&(f.isExpanded=!0,l=!0)}l&&Mt(e,St(o))}function en(e,t){let n=Ve(t),o=c.config.workspaces.find(a=>a.path===n);if(o)return c.currentWorkspace=o.id,c.fileTree.delete(o.id),o;let i={id:ys(),name:e,path:n,isExpanded:!1};return c.config.workspaces.push(i),O(c.config),c.currentWorkspace=i.id,i}function Rn(e){let t=c.config.workspaces.findIndex(n=>n.id===e);t!==-1&&(c.config.workspaces.splice(t,1),O(c.config),c.fileTree.delete(e),vn(e),Po(e),c.currentWorkspace===e&&(c.currentWorkspace=c.config.workspaces.length>0?c.config.workspaces[0].id:null))}function vs(e){c.config.workspaces.find(n=>n.id===e)&&(c.currentWorkspace=e)}function Dt(e,t){let n=c.config.workspaces,o=n.findIndex(r=>r.id===e);if(o===-1)return;let i=o+t;if(i<0||i>=n.length)return;let[a]=n.splice(o,1);n.splice(i,0,a),O(c.config)}function On(e){let t=c.config.workspaces.find(n=>n.id===e);t&&(t.isExpanded=!t.isExpanded,O(c.config))}function ks(){return c.currentWorkspace&&c.config.workspaces.find(e=>e.id===c.currentWorkspace)||null}async function xs(e){try{let t=await fetch("/api/infer-workspace",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filePath:e})});if(!t.ok)return null;let n=await t.json();if(!n.workspacePath)return null;let o=c.config.workspaces.find(a=>a.path===n.workspacePath);if(o)return o;let i=n.workspaceName||n.workspacePath.split("/").pop()||"workspace";return en(i,n.workspacePath)}catch(t){return console.error("\\u63A8\\u65AD\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",t),null}}async function Q(e){let t=c.config.workspaces.find(n=>n.id===e);if(!t)return null;try{let n=new AbortController,o=window.setTimeout(()=>n.abort(),15e3),i=await fetch("/api/scan-workspace",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:t.path}),signal:n.signal});if(window.clearTimeout(o),!i.ok)return console.error("\\u626B\\u63CF\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",await i.text()),null;let a=await i.json(),r=c.fileTree.get(e),s=Io(e),l=!r&&(!s||s.size===0);r?er(r,a):s&&s.size>0?Zt(a,s):(ir(a),Es(a,2)),c.fileTree.set(e,a),Mt(e,St(a));let d=qe(a,t.path),u=or(a).filter(f=>!d.has(f));return wn(e,u),a}catch(n){return console.error("\\u626B\\u63CF\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",n),null}}function or(e){if(!e)return[];if(e.type==="file")return[e.path];let t=[];for(let n of e.children||[])t.push(...or(n));return t}function ir(e){if(e.type==="directory")for(let t of e.children||[])t.type==="directory"&&(t.isExpanded=!1,ir(t))}function rr(e,t=[]){if(e.type==="file")t.push(e);else for(let n of e.children||[])rr(n,t);return t}function Ts(e,t){function n(o){if(o.type==="file")return o.path===t;for(let i of o.children||[])if(n(i))return o.isExpanded=!0,!0;return!1}n(e)}function Es(e,t){let n=rr(e);n.sort((a,r)=>(r.lastModified||0)-(a.lastModified||0));let o=n.slice(0,t),i=new Set;for(let a of o){let r=a.path.substring(0,a.path.lastIndexOf("/"));i.has(r)||(i.add(r),Ts(e,a.path))}}async function tn(){let e=c.config.workspaces.filter(t=>t.isExpanded);for(let t of e)await Q(t.id);!c.currentWorkspace&&c.config.workspaces.length>0&&(c.currentWorkspace=c.config.workspaces[0].id)}async function no(e){let t=bs(e);t&&(c.currentWorkspace=t.id,t.isExpanded||(t.isExpanded=!0,O(c.config)),c.fileTree.has(t.id)||await Q(t.id),ws(t.id,t.path,e))}function qn(e,t){let n=c.fileTree.get(e);if(!n)return;let o=oo(n,t);if(o&&o.type==="directory"){let i=o.isExpanded!==!1;o.isExpanded=!i,Mt(e,St(n))}}function oo(e,t){if(e.path===t)return e;if(e.children)for(let n of e.children){let o=oo(n,t);if(o)return o}return null}var dt=v(()=>{"use strict";j();ce();Rt();Ie();nr();gn()});function ar(e,t){let n=e.split(\`
\`),o=t.split(\`
\`),i=n.length,a=o.length;if(i===0&&a===0)return[];let r=i+a,s=new Array(2*r+1).fill(0),l=[];e:for(let y=0;y<=r;y++){l.push([...s]);for(let b=-y;b<=y;b+=2){let k=b+r,w;b===-y||b!==y&&s[k-1]<s[k+1]?w=s[k+1]:w=s[k-1]+1;let S=w-b;for(;w<i&&S<a&&n[w]===o[S];)w++,S++;if(s[k]=w,w>=i&&S>=a)break e}}let d=[],u=i,f=a;for(let y=l.length-1;y>=0&&(u>0||f>0);y--){let b=l[y],k=u-f,w=k+r,S;k===-y||k!==y&&b[w-1]<b[w+1]?S=k+1:S=k-1;let C=b[S+r],P=C-S;for(;u>C+1&&f>P+1;)d.unshift({type:"equal",x:u-1,y:f-1}),u--,f--;y>0&&(u===C+1&&f===P+1&&C>=0&&P>=0&&n[C]===o[P]?d.unshift({type:"equal",x:C,y:P}):u>C?d.unshift({type:"delete",x:C,y:-1}):d.unshift({type:"insert",x:-1,y:P})),u=C,f=P}let p=[],m=1,h=1;for(let y of d)y.type==="equal"?p.push({type:"equal",content:n[y.x],oldLineNo:m++,newLineNo:h++}):y.type==="delete"?p.push({type:"delete",content:n[y.x],oldLineNo:m++}):p.push({type:"insert",content:o[y.y],newLineNo:h++});return p}var sr=v(()=>{"use strict"});function nn(e){let n=Date.now()-e,o=Math.floor(n/1e3),i=Math.floor(o/60),a=Math.floor(i/60),r=Math.floor(a/24);return r>0?\`\${r}\\u5929\\u524D\`:a>0?\`\${a}\\u5C0F\\u65F6\\u524D\`:i>0?\`\${i}\\u5206\\u949F\\u524D\`:"\\u521A\\u521A"}var lr=v(()=>{"use strict"});var Je,cr,gt=v(()=>{"use strict";Je=\`/*light */
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

\`,cr=\`pre code.hljs {
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
  
}\`});var io,dr=v(()=>{"use strict";gt();io=Je});var ur,pr=v(()=>{"use strict";gt();ur=Je+\`

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
\`});var mr,fr=v(()=>{"use strict";gt();mr=Je+\`

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
\`});var ro,gr=v(()=>{"use strict";gt();ro=cr});var hr,yr=v(()=>{"use strict";hr=\`
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
\`});var br,wr=v(()=>{"use strict";br=\`
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
\`});function vr(e){return ao.find(t=>t.key===e)?.css??io}function kr(e){return so.find(t=>t.key===e)?.css??ro}var ao,so,lo=v(()=>{"use strict";dr();pr();fr();gr();yr();wr();ao=[{key:"github",label:"GitHub",css:io},{key:"notion",label:"Notion",css:ur},{key:"bear",label:"Bear / iA Writer",css:mr}],so=[{key:"github",label:"GitHub Light",css:ro},{key:"github-dark",label:"GitHub Dark",css:hr},{key:"atom-one-dark",label:"Atom One Dark",css:br}]});function Tr(){on=c.config.markdownTheme||"github",co=c.config.codeTheme||"github",uo=c.config.mathInline!==!1,document.getElementById("settingsDialogOverlay")||Ms(),Ss();let t=document.getElementById("settingsDialogOverlay");t&&t.classList.add("show")}function Ms(){let e=document.createElement("div");e.id="settingsDialogOverlay",e.className="sync-dialog-overlay",e.innerHTML=\`
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
  \`,document.body.appendChild(e),e.addEventListener("click",t=>{t.target===e&&ht()})}function Ss(){let e=document.getElementById("settingsDialogBody");if(!e)return;let t=Ls();e.innerHTML=\`
    <div class="settings-section">
      <div class="settings-section-title">\\u4E3B\\u9898</div>
      <div class="settings-section-desc">\\u5207\\u6362 Markdown \\u6B63\\u6587\\u6837\\u5F0F\\u548C\\u4EE3\\u7801\\u9AD8\\u4EAE\\u914D\\u8272\\u3002</div>
      <div class="settings-kv-grid">
        <div>\\u6B63\\u6587\\u6837\\u5F0F</div>
        <div>
          <select id="markdownThemeSelect" style="font-size:12px;padding:2px 6px;border:1px solid #ddd;border-radius:3px">
            \${ao.map(r=>\`<option value="\${r.key}"\${c.config.markdownTheme===r.key?" selected":""}>\${r.label}</option>\`).join("")}
          </select>
        </div>
        <div>\\u4EE3\\u7801\\u9AD8\\u4EAE</div>
        <div>
          <select id="codeThemeSelect" style="font-size:12px;padding:2px 6px;border:1px solid #ddd;border-radius:3px">
            \${so.map(r=>\`<option value="\${r.key}"\${c.config.codeTheme===r.key?" selected":""}>\${r.label}</option>\`).join("")}
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
            \${[2e3,5e3,1e4,3e4].map(r=>\`<option value="\${r}"\${(c.config.workspacePollInterval??5e3)===r?" selected":""}>\${r/1e3}s</option>\`).join("")}
          </select>
        </div>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">\\u5BA2\\u6237\\u7AEF\\u72B6\\u6001</div>
      <div class="settings-section-desc">\\u7528\\u4E8E\\u6392\\u67E5\\u672C\\u5730\\u7F13\\u5B58\\u662F\\u5426\\u810F\\u6570\\u636E\\uFF0C\\u53EF\\u76F4\\u63A5\\u6E05\\u7406\\u3002</div>
      <div class="settings-kv-grid">
        <div>\\u5F53\\u524D\\u6587\\u4EF6</div><div>\${xr(t.currentFile||"\\u65E0")}</div>
        <div>\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6\\u6570</div><div>\${t.openFilesCount}</div>
        <div>\\u5DE5\\u4F5C\\u533A\\u6570</div><div>\${t.workspaceCount}</div>
        <div>\\u8BC4\\u8BBA\\u76F8\\u5173\\u672C\\u5730\\u952E\\u6570</div><div>\${t.commentStateKeyCount}</div>
        <div>md-viewer \\u672C\\u5730\\u952E\\u6570</div><div>\${t.mdvKeyCount}</div>
        <div>localStorage \\u603B\\u952E\\u6570</div><div>\${t.localStorageKeyCount}</div>
      </div>
      <div class="settings-key-list">
        \${t.mdvKeys.map(r=>\`<span class="settings-key-chip">\${xr(r)}</span>\`).join("")}
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
  \`,document.getElementById("clearClientStateBtn")?.addEventListener("click",()=>{Fs()}),document.getElementById("clearAllCommentsBtn")?.addEventListener("click",()=>{\$s()});let i=document.getElementById("markdownThemeSelect"),a=document.getElementById("codeThemeSelect");i?.addEventListener("change",()=>{c.config.markdownTheme=i.value,window.applyTheme?.()}),a?.addEventListener("change",()=>{c.config.codeTheme=a.value,window.applyTheme?.()})}function ht(){on&&(c.config.markdownTheme=on,c.config.codeTheme=co,c.config.mathInline=uo,window.applyTheme?.());let e=document.getElementById("settingsDialogOverlay");e&&e.classList.remove("show")}function As(){let e=document.getElementById("markdownThemeSelect"),t=document.getElementById("codeThemeSelect"),n=document.getElementById("mathInlineCheckbox"),o=document.getElementById("pollIntervalSelect");e&&(c.config.markdownTheme=e.value),t&&(c.config.codeTheme=t.value),n&&(c.config.mathInline=n.checked),o&&(c.config.workspacePollInterval=parseInt(o.value,10)),O(c.config),\$(),on="",co="",uo=!0,ht()}function Ls(){let e=[];for(let o=0;o<localStorage.length;o+=1){let i=localStorage.key(o);i&&e.push(i)}e.sort();let t=e.filter(o=>o.startsWith("md-viewer:")),n=t.filter(o=>o==="md-viewer:annotation-panel-open-by-file"||o==="md-viewer:annotation-density"||o==="md-viewer:annotation-sidebar-width"||o.startsWith("md-viewer:annotations:")).length;return{currentFile:c.currentFile,openFilesCount:c.sessionFiles.size,workspaceCount:c.config.workspaces.length,commentStateKeyCount:n,mdvKeyCount:t.length,localStorageKeyCount:e.length,mdvKeys:t}}function Fs(){let e=[];for(let t=0;t<localStorage.length;t+=1){let n=localStorage.key(t);n&&n.startsWith("md-viewer:")&&e.push(n)}for(let t of e)localStorage.removeItem(t);U(\`\\u5DF2\\u6E05\\u7406\\u5BA2\\u6237\\u7AEF\\u72B6\\u6001\\uFF08\${e.length} \\u9879\\uFF09\`,1800),window.setTimeout(()=>window.location.reload(),250)}async function \$s(){try{let e=await fetch("/api/annotations/clear",{method:"POST"}),t=await e.json();if(!e.ok||t?.success!==!0)throw new Error(t?.error||\`HTTP \${e.status}\`);let n=[];for(let o=0;o<localStorage.length;o+=1){let i=localStorage.key(o);i&&(i.startsWith("md-viewer:annotations:")&&n.push(i),i==="md-viewer:annotation-panel-open-by-file"&&n.push(i),i==="md-viewer:annotation-density"&&n.push(i),i==="md-viewer:annotation-sidebar-width"&&n.push(i))}for(let o of n)localStorage.removeItem(o);U(\`\\u5DF2\\u6E05\\u7A7A\\u8BC4\\u8BBA\\u72B6\\u6001\\uFF08\\u670D\\u52A1\\u7AEF \${t?.deleted||0} \\u6761\\uFF0C\\u672C\\u5730 \${n.length} \\u9879\\uFF09\`,1800),window.setTimeout(()=>window.location.reload(),250)}catch(e){L(\`\\u6E05\\u7A7A\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25: \${e?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)}}function xr(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}var on,co,uo,Er=v(()=>{"use strict";j();Ie();I();je();lo();on="",co="",uo=!0;typeof window<"u"&&(window.closeSettingsDialog=ht,window.saveSettings=As)});function Cs(e,t=60){let n=JSON.stringify(e);return n.length<=t?x(n):x(n.slice(0,t))+"\\u2026"}function po(e,t,n,o){let i=e!==null&&typeof e=="object",a=n<1;if(!i){let k=t!==null?\`<span class="json-key">\${Ue(x(JSON.stringify(t)),o)}</span><span class="json-colon">:</span>\`:"",w=Is(e,o);return\`
      <li>
        <div class="json-node">
          <span class="json-toggle"></span>
          \${k}
          \${w}
        </div>
      </li>\`}let r=Array.isArray(e),s=r?e.map((k,w)=>({k:String(w),v:k})):Object.entries(e).map(([k,w])=>({k,v:w})),l=s.length,d=r?"[":"{",u=r?"]":"}",f=!a,p=f?"\\u25B6":"\\u25BC",m=f?"json-children collapsed":"json-children",h=t!==null?\`<span class="json-key">\${Ue(x(JSON.stringify(t)),o)}</span><span class="json-colon">:</span>\`:"",y=f?\`<span class="json-preview">\${Cs(e)}</span>\`:"",b=s.map(({k,v:w})=>po(w,r?null:k,n+1,o)).join("");return\`
    <li>
      <div class="json-node json-node-expandable" data-expanded="\${!f}">
        <span class="json-toggle">\${p}</span>
        \${h}
        <span class="json-bracket">\${d}</span>
        <span class="json-count">\${l} \${r?"items":"keys"}</span>
        \${y}
        <span class="json-bracket json-close-bracket" style="display:\${f?"none":"inline"}">\${u}</span>
      </div>
      <ul class="\${m}">
        \${b}
        <li><div class="json-node"><span class="json-toggle"></span><span class="json-bracket">\${u}</span></div></li>
      </ul>
    </li>\`}function Is(e,t){return e===null?\`<span class="json-null">\${Ue("null",t)}</span>\`:typeof e=="boolean"?\`<span class="json-boolean">\${Ue(String(e),t)}</span>\`:typeof e=="number"?\`<span class="json-number">\${Ue(String(e),t)}</span>\`:\`<span class="json-string">\${Ue(x(JSON.stringify(e)),t)}</span>\`}function Ue(e,t){if(!t)return e;let n=t.toLowerCase(),o=e.toLowerCase(),i="",a=0;for(;a<e.length;){let r=o.indexOf(n,a);if(r===-1){i+=e.slice(a);break}i+=e.slice(a,r),i+=\`<mark class="json-match">\${e.slice(r,r+n.length)}</mark>\`,a=r+n.length}return i}function Ps(e,t){if(!t)return!1;let n=t.toLowerCase(),o=!1;function i(r){let s=r.querySelector(":scope > .json-node"),l=r.querySelector(":scope > .json-children");if(!l)return(s?.textContent?.toLowerCase()||"").includes(n);let d=Array.from(l.querySelectorAll(":scope > li")),u=!1;for(let f of d)i(f)&&(u=!0);if(u){if(o=!0,s){s.setAttribute("data-expanded","true");let f=s.querySelector(".json-toggle");f&&(f.textContent="\\u25BC");let p=s.querySelector(".json-close-bracket");p&&(p.style.display="inline");let m=s.querySelector(".json-preview");m&&(m.style.display="none")}l.classList.remove("collapsed")}return u}let a=Array.from(e.querySelectorAll(":scope > ul > li"));for(let r of a)i(r);return o}function Bs(e){e.addEventListener("click",t=>{let o=t.target.closest(".json-node-expandable");if(!o)return;let a=o.parentElement.querySelector(":scope > .json-children");if(!a)return;let r=o.getAttribute("data-expanded")==="true",s=o.querySelector(".json-toggle"),l=o.querySelector(".json-close-bracket"),d=o.querySelector(".json-preview");if(r)if(o.setAttribute("data-expanded","false"),s&&(s.textContent="\\u25B6"),a.classList.add("collapsed"),l&&(l.style.display="none"),d)d.style.display="";else{let u=document.createElement("span");u.className="json-preview",u.textContent="\\u2026",o.appendChild(u)}else o.setAttribute("data-expanded","true"),s&&(s.textContent="\\u25BC"),a.classList.remove("collapsed"),l&&(l.style.display="inline"),d&&(d.style.display="none")})}function Mr(e,t,n,o=""){if(nt(n)?Hs(e,t,o):Ns(e,t,o),Bs(e),o&&!Ps(e,o)){let r=document.createElement("div");r.className="json-no-results",r.textContent="\\u65E0\\u5339\\u914D\\u7ED3\\u679C",e.appendChild(r)}}function Ns(e,t,n){let o;try{o=JSON.parse(t)}catch(a){e.innerHTML=\`
      <div class="json-viewer">
        <div class="json-error">
          JSON \\u89E3\\u6790\\u5931\\u8D25\\uFF1A\${x(String(a))}
          <pre>\${x(t.slice(0,500))}</pre>
        </div>
      </div>\`;return}let i=document.createElement("div");i.className="json-viewer",i.innerHTML=\`<ul>\${po(o,null,0,n)}</ul>\`,e.appendChild(i)}function Hs(e,t,n){let o=t.split(\`
\`),i=document.createElement("div");i.className="json-viewer";let a=0;for(let r of o){let s=r.trim();if(!s)continue;a++;let l=document.createElement("div");l.className="json-line-header",l.textContent=\`Line \${a}\`,i.appendChild(l);let d;try{d=JSON.parse(s)}catch(f){let p=document.createElement("div");p.className="json-error",p.innerHTML=\`\\u89E3\\u6790\\u5931\\u8D25\\uFF1A\${x(String(f))}<pre>\${x(s.slice(0,200))}</pre>\`,i.appendChild(p);continue}let u=document.createElement("ul");u.innerHTML=po(d,null,0,n),i.appendChild(u)}e.appendChild(i)}var Sr=v(()=>{"use strict";Te();ot()});function js(){return window.pdfjsLib?Promise.resolve(window.pdfjsLib):new Promise(e=>{window.addEventListener("pdfjslib-ready",()=>e(window.pdfjsLib),{once:!0})})}async function Lr(e){let{container:t,filePath:n,scale:o=Ws}=e,i=document.createElement("div");i.className="pdf-viewer-container",t.appendChild(i);let a=await js(),r=\`/api/pdf-asset?path=\${encodeURIComponent(n)}\`,s=await a.getDocument(r).promise,l=s.numPages,d=window.devicePixelRatio||1,u=[],f=new Map,p=new Set,m=new Set,y=(await s.getPage(1)).getViewport({scale:o}),b=y.width,k=y.height;for(let M=1;M<=l;M++){let A=document.createElement("div");A.className="pdf-page-wrapper pdf-page-placeholder",A.dataset.page=String(M),A.style.position="relative",A.style.width=\`\${b}px\`,A.style.height=\`\${k}px\`,A.style.marginBottom="16px",A.style.background="white",i.appendChild(A),u.push(A)}async function w(M){if(p.has(M)||m.has(M))return;m.add(M);let A=u[M-1],H=await s.getPage(M),F=H.getViewport({scale:o});A.style.width=\`\${F.width}px\`,A.style.height=\`\${F.height}px\`;let ae=document.createElement("canvas");ae.width=Math.floor(F.width*d),ae.height=Math.floor(F.height*d),ae.style.width=\`\${F.width}px\`,ae.style.height=\`\${F.height}px\`;let wt=ae.getContext("2d");wt.scale(d,d);let vt=performance.now();await H.render({canvasContext:wt,viewport:F}).promise,A.appendChild(ae);let ee=document.createElement("div");ee.className="pdf-text-layer",ee.style.cssText=\`
      position: absolute; top: 0; left: 0;
      width: \${F.width}px; height: \${F.height}px;
      overflow: hidden; opacity: 0.2; line-height: 1;
      pointer-events: auto; user-select: text;
    \`,A.appendChild(ee);let cn=await H.getTextContent();await new a.TextLayer({textContentSource:cn,container:ee,viewport:F}).render(),window.__pdfDebug&&console.log(\`[pdf] page \${M}: \${(performance.now()-vt).toFixed(0)}ms\`);let ko=Os(M,cn.items,F,o);f.set(M,ko),e.onParagraphClick&&ee.addEventListener("click",Ye=>{if(window.getSelection()?.toString())return;let Ze=Ye.offsetY/o,kt=qs(ko,Ze);kt&&e.onParagraphClick(kt)}),e.onTextSelected&&ee.addEventListener("mouseup",()=>{let Ye=window.getSelection();if(!Ye||Ye.isCollapsed)return;let Ze=Ye.toString().trim();if(!Ze)return;let{prefix:kt,suffix:ia}=_s(cn.items,Ze);e.onTextSelected(M,Ze,kt,ia)}),A.classList.remove("pdf-page-placeholder"),p.add(M),m.delete(M)}let S=new IntersectionObserver(M=>{for(let A of M)if(A.isIntersecting){let H=parseInt(A.target.dataset.page||"0",10);H&&w(H)}},{root:t,rootMargin:\`\${Rs}px 0px\`,threshold:0});for(let M of u)S.observe(M);function C(M){let A=u[M-1];A&&A.scrollIntoView({behavior:"smooth",block:"start"})}function P(M,A){Y();let H=u[M-1];if(!H)return;if(!p.has(M)){w(M).then(()=>P(M,A));return}let F=H.querySelector(".pdf-text-layer");if(!F)return;let ae=Array.from(F.querySelectorAll("span")),wt=A.toLowerCase().replace(/\\s+/g," ").trim();for(let vt of ae){let ee=(vt.textContent||"").toLowerCase().replace(/\\s+/g," ").trim();ee&&wt.includes(ee)&&vt.classList.add("pdf-highlight")}}function Y(){i.querySelectorAll(".pdf-highlight").forEach(M=>{M.classList.remove("pdf-highlight")})}function be(M){return f.get(M)??[]}function Z(){S.disconnect(),i.remove(),p.clear(),m.clear(),f.clear()}function D(){return p.size}function R(){return l}return{el:i,destroy:Z,scrollToPage:C,highlightQuote:P,clearHighlights:Y,getTextBlocks:be,getRenderedCount:D,getTotalPages:R}}function Os(e,t,n,o){if(!t.length)return[];let i=[...t].filter(s=>s.str.trim()).sort((s,l)=>{let d=n.height/o-s.transform[5],u=n.height/o-l.transform[5];return d-u||s.transform[4]-l.transform[4]}),a=[],r=[i[0]];for(let s=1;s<i.length;s++){let l=i[s-1],d=i[s],u=n.height/o-l.transform[5],f=n.height/o-d.transform[5],p=l.height||12;Math.abs(f-u)<p*Ds?r.push(d):(a.push(Ar(e,r,n,o)),r=[d])}return a.push(Ar(e,r,n,o)),a}function Ar(e,t,n,o){let i=Math.min(...t.map(l=>l.transform[4])),a=n.height/o-Math.max(...t.map(l=>l.transform[5])),r=Math.max(...t.map(l=>l.transform[4]+l.width))-i,s=Math.max(...t.map(l=>l.height||12));return{pageNum:e,items:t,text:t.map(l=>l.str).join(" "),x:i,y:a,width:r,height:s}}function qs(e,t){return e.find(n=>t>=n.y-2&&t<=n.y+n.height+4)??null}function _s(e,t){let n=e.map(i=>i.str).join(" "),o=n.toLowerCase().indexOf(t.toLowerCase());return o===-1?{prefix:"",suffix:""}:{prefix:n.slice(Math.max(0,o-50),o).trim(),suffix:n.slice(o+t.length,o+t.length+50).trim()}}var Ws,Ds,Rs,Fr=v(()=>{"use strict";Ws=1.5,Ds=1.5,Rs=2500});function \$r(e){function t(o,i,a,r){let s=e.getAnnotations(),l=_n(s),d={id:crypto.randomUUID(),serial:l,start:0,length:0,quote:i,quotePrefix:a,quoteSuffix:r,note:"",createdAt:Date.now(),status:"anchored",page:o,fileType:"pdf"};document.dispatchEvent(new CustomEvent("pdf:show-composer",{detail:{annotation:d,filePath:e.filePath}}))}function n(o){e.viewer.clearHighlights();for(let i of o){let a=i;a.fileType==="pdf"&&typeof a.page=="number"&&a.quote&&e.viewer.highlightQuote(a.page,a.quote)}}return{handleTextSelected:t,renderHighlights:n}}var Cr=v(()=>{"use strict";Jt()});function Ir(e){return\`\${e.pageNum}:\${e.y.toFixed(0)}\`}function zs(e,t,n,o){let i=Ir(t),a=Qe.get(i);if(a){a.remove(),Qe.delete(i);return}let r=document.createElement("div");r.className="pdf-translation-overlay",r.style.cssText=\`
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
  \`,r.title="Click to dismiss",r.textContent=n,r.addEventListener("click",()=>{r.remove(),Qe.delete(i)}),e.appendChild(r),Qe.set(i,r)}async function Pr(e,t,n,o){let i=Ir(t),a=Qe.get(i);if(a){a.remove(),Qe.delete(i);return}let r=document.createElement("div");r.className="pdf-translation-overlay pdf-translation-loading",r.style.cssText=\`
    position: absolute;
    left: \${t.x*o}px;
    top: \${(t.y+t.height)*o+4}px;
    background: rgba(240,240,240,0.9);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    color: #888;
    z-index: 100;
  \`,r.textContent="\\u7FFB\\u8BD1\\u4E2D\\u2026",e.appendChild(r);try{let s=await n.translate(t.text,"en","zh");r.remove(),zs(e,t,s,o)}catch{r.remove();let l=document.createElement("div");l.className="pdf-translation-overlay",l.style.cssText=r.style.cssText,l.style.color="#c00",l.textContent="\\u7FFB\\u8BD1\\u5931\\u8D25",e.appendChild(l),setTimeout(()=>l.remove(),2e3)}}var rn,Qe,Br=v(()=>{"use strict";rn=class{async translate(t,n,o){let i=\`\${n}|\${o}\`,a=\`https://api.mymemory.translated.net/get?q=\${encodeURIComponent(t)}&langpair=\${encodeURIComponent(i)}\`,r=await fetch(a);if(!r.ok)throw new Error(\`MyMemory error: \${r.status}\`);let s=await r.json();if(s.responseStatus!==200)throw new Error(s.responseDetails||"Translation failed");return s.responseData.translatedText}},Qe=new Map});var Se={};we(Se,{renderAll:()=>Zs});function Wr(){let e=vr(c.config.markdownTheme||"github"),t=kr(c.config.codeTheme||"github"),n=document.getElementById("theme-md-css"),o=document.getElementById("theme-hl-css");n&&(n.textContent=e),o&&(o.textContent=t)}function Or(e){let t=oe.get(e);t&&(t.idleTimer&&clearTimeout(t.idleTimer),t.viewer.destroy(),oe.delete(e))}function Js(e){let t=oe.get(e);t&&(t.idleTimer&&clearTimeout(t.idleTimer),t.idleTimer=setTimeout(()=>Or(e),Rr))}function Us(e){let t=oe.get(e);t&&(t.idleTimer&&(clearTimeout(t.idleTimer),t.idleTimer=null),t.lastActiveAt=Date.now())}function \$e(e=!1){let t=c.currentFile&&!Jr(c.currentFile)?c.currentFile:null,n=Li();(e||t!==n)&&Si(t),W(),N(t)}async function qr(e,t=!1){let n=c.currentFile,o=t;Tn(e,o),o&&(c.config.sidebarTab==="focus"||c.config.sidebarTab==="full")&&await no(e.path),o&&e.path,\$(),X(),\$e(o&&n!==e.path),o&&n!==e.path&&_r()}function _r(){let e=document.getElementById("content");e&&e.scrollTo({top:0,behavior:"auto"})}function Qs(){return Math.max(Dr,Math.min(Ks,window.innerWidth-360))}function yo(e){return Math.min(Qs(),Math.max(Dr,Math.round(e)))}function yt(e){let t=yo(e);document.documentElement.style.setProperty("--sidebar-width",\`\${t}px\`)}function Gs(){let e=Number(localStorage.getItem(go)),t=Number.isFinite(e)&&e>0?e:ho;yt(t)}function Xs(){let e=document.getElementById("sidebarResizer");if(!e)return;let t=!1,n=i=>{if(!t)return;let a=yo(i.clientX);yt(a)},o=i=>{if(!t)return;t=!1;let a=yo(i.clientX);yt(a),localStorage.setItem(go,String(a)),document.body.classList.remove("sidebar-resizing"),window.removeEventListener("mousemove",n),window.removeEventListener("mouseup",o)};e.addEventListener("mousedown",i=>{window.innerWidth<=900||(t=!0,document.body.classList.add("sidebar-resizing"),window.addEventListener("mousemove",n),window.addEventListener("mouseup",o),i.preventDefault())}),e.addEventListener("dblclick",()=>{yt(ho),localStorage.setItem(go,String(ho))}),window.addEventListener("resize",()=>{let i=Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sidebar-width"),10);Number.isFinite(i)&&yt(i)})}async function Ys(){c.currentFile&&await Vr(c.currentFile,{silent:!0,highlight:!1})}async function zr(e){await Vr(e,{silent:!1,highlight:!0})&&c.currentFile===e&&U("\\u6587\\u4EF6\\u5DF2\\u5237\\u65B0",2e3)}function Kr(){let e=document.getElementById("content");e&&(e.style.animation="flash 700ms ease-out",setTimeout(()=>{e.style.animation=""},700))}async function Vr(e,t={}){let n=c.sessionFiles.get(e);if(!n||n.isMissing)return!1;let o=(mo.get(e)||0)+1;mo.set(e,o);let i=await We(e,t.silent!==!1);if(!i||mo.get(e)!==o)return!1;let a=c.sessionFiles.get(e)||c.sessionFiles.get(i.path);if(!a)return!1;if(a.content=i.content,a.pendingContent=void 0,i.lastModified>=(a.lastModified||0)&&(a.lastModified=i.lastModified),a.displayedModified=i.lastModified,a.isMissing=!1,V(),c.currentFile===e||c.currentFile===i.path){if(re){re=!1;let r=document.getElementById("diffButton");r&&r.classList.remove("active")}X(),requestAnimationFrame(()=>{\$e(!1),t.highlight&&Kr()})}return \$(),await ie(),!0}function Zs(){\$(),X(),\$e(!1)}function el(e,t){let n=\`\${e}/\${t}\`,o=n.startsWith("/"),i=n.split("/"),a=[];for(let r of i)if(!(!r||r===".")){if(r===".."){a.length>0&&a.pop();continue}a.push(r)}return\`\${o?"/":""}\${a.join("/")}\`}function tl(e,t){let n=e.trim();if(!n||n.startsWith("http://")||n.startsWith("https://")||n.startsWith("data:")||n.startsWith("blob:")||n.startsWith("/api/")||Qr(t))return null;let o=n.indexOf("?"),i=n.indexOf("#"),a=[o,i].filter(u=>u>=0).sort((u,f)=>u-f)[0]??-1,r=a>=0?n.slice(0,a):n,s=a>=0?n.slice(a):"",l=t.slice(0,t.lastIndexOf("/")),d=r.startsWith("/")?r:el(l,r);return\`/api/file-asset?path=\${encodeURIComponent(d)}\${s}\`}function nl(e,t){let n=e.querySelector(".markdown-body");n&&n.querySelectorAll("img[src], video[src], source[src]").forEach(o=>{let i=o.getAttribute("src");if(!i)return;let a=tl(i,t);a&&o.setAttribute("src",a)})}function ol(e){let t=window.renderMathInElement;if(!t)return;let n=c.config.mathInline!==!1,o=[{left:"\$\$",right:"\$\$",display:!0},{left:"\\\\[",right:"\\\\]",display:!0},{left:"\\\\(",right:"\\\\)",display:!1},...n?[{left:"\$",right:"\$",display:!1}]:[]];t(e,{delimiters:o,throwOnError:!1,ignoredTags:["script","noscript","style","textarea","pre","code"]})}async function il(e){let t=window.mermaid;if(!t)return;let n=Array.from(e.querySelectorAll(".markdown-body pre > code.language-mermaid, .markdown-body pre > code.lang-mermaid, .markdown-body pre > code.language-flowchart, .markdown-body pre > code.lang-flowchart"));if(n.length===0)return;Nr||(t.initialize({startOnLoad:!1,theme:"neutral",securityLevel:"loose"}),Nr=!0);let o=a=>{let r=a.textContent||"\\u590D\\u5236";a.textContent="\\u2713",a.classList.add("copied"),window.setTimeout(()=>{a.textContent=r,a.classList.remove("copied")},900)},i=(a,r)=>{let s=document.createElement("div");s.className="mermaid-source-panel",s.style.display=r?"block":"none";let l=document.createElement("div");l.className="mermaid-source-head";let d=document.createElement("span");d.textContent="Mermaid \\u6E90\\u7801";let u=document.createElement("button");u.className="mermaid-source-copy",u.textContent="\\u590D\\u5236",u.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(a),o(u)}catch{}}),l.appendChild(d),l.appendChild(u);let f=document.createElement("pre"),p=document.createElement("code");p.className="language-mermaid",p.textContent=a,f.appendChild(p),s.appendChild(l),s.appendChild(f);let m=document.createElement("button");return m.className="mermaid-source-toggle",m.textContent=r?"\\u9690\\u85CF\\u6E90\\u7801":"\\u6E90\\u7801",m.addEventListener("click",()=>{let h=s.style.display!=="none";s.style.display=h?"none":"block",m.textContent=h?"\\u6E90\\u7801":"\\u9690\\u85CF\\u6E90\\u7801"}),{panel:s,toggleButton:m}};for(let a=0;a<n.length;a+=1){let r=n[a],s=r.closest("pre");if(!s)continue;let l=(r.textContent||"").trim();if(!l)continue;let d=r.classList.contains("language-flowchart")||r.classList.contains("lang-flowchart"),u=l.split(\`
\`).find(p=>p.trim().length>0)?.trim().toLowerCase()||"",f=d&&!u.startsWith("flowchart")&&!u.startsWith("graph")?\`flowchart TD
\${l}\`:l;if(f)try{let p=\`mdv-mermaid-\${Date.now()}-\${a}\`,{svg:m,bindFunctions:h}=await t.render(p,f),y=document.createElement("div");y.className="mermaid-block";let b=document.createElement("div");b.className="mermaid-actions";let{panel:k,toggleButton:w}=i(f,!1);b.appendChild(w);let S=document.createElement("div");S.className="mermaid",S.setAttribute("data-mdv-mermaid","1"),S.innerHTML=m,y.appendChild(b),y.appendChild(S),y.appendChild(k),s.replaceWith(y),typeof h=="function"&&h(S)}catch(p){let m=document.createElement("div");m.className="mermaid-fallback-block";let h=document.createElement("div");h.className="mermaid-actions";let{panel:y,toggleButton:b}=i(f,!0);h.appendChild(b);let k=document.createElement("div");k.className="mermaid-fallback-notice",k.textContent="Mermaid \\u8BED\\u6CD5\\u9519\\u8BEF\\uFF0C\\u5DF2\\u56DE\\u9000\\u4E3A\\u539F\\u6587\\u663E\\u793A",m.appendChild(h),m.appendChild(k),m.appendChild(y),s.replaceWith(m),console.error("Mermaid \\u6E32\\u67D3\\u5931\\u8D25\\uFF0C\\u5DF2\\u56DE\\u9000\\u539F\\u6587:",p)}}}function X(){let e=document.getElementById("content");if(!e)return;for(let[a,r]of oe.entries())r.viewer.el.parentNode&&r.viewer.el.remove(),a!==c.currentFile&&Js(a);if(Ge=null,e.removeAttribute("data-pdf"),!c.currentFile){e.removeAttribute("data-current-file"),e.innerHTML=\`
      <div class="empty-state">
        <h2>\\u6B22\\u8FCE\\u4F7F\\u7528 MD Viewer</h2>
        <p>\\u5728\\u5DE6\\u4FA7\\u6DFB\\u52A0 Markdown/HTML \\u6587\\u4EF6\\u5F00\\u59CB\\u9605\\u8BFB</p>
      </div>
    \`;return}let t=c.sessionFiles.get(c.currentFile);if(!t)return;if(Jr(t.path)){e.setAttribute("data-current-file",t.path),e.innerHTML=\`<iframe class="html-preview-frame" srcdoc="\${t.content.replace(/"/g,"&quot;").replace(/'/g,"&#39;")}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"></iframe>\`;let a=document.getElementById("fileMeta");a&&(a.textContent=nn(t.lastModified)),an(),ie();return}if(sl(t.path)){e.setAttribute("data-current-file",t.path),e.innerHTML="";let r=document.getElementById("searchInput")?.value?.trim()??"";Mr(e,t.content,t.path,r);let s=document.getElementById("fileMeta");s&&(s.textContent=nn(t.lastModified)),an(),ie();return}if(Ur(t.path)){let a=t.path,r=1.5;Us(a),e.setAttribute("data-pdf","1");let s=oe.get(a);if(s){Ge=s.viewer,e.innerHTML="",e.appendChild(s.viewer.el),e.setAttribute("data-current-file",a),an(),ie();return}e.innerHTML="";let l=null;Lr({container:e,filePath:a,scale:r,onTextSelected:(d,u,f,p)=>{l?.handleTextSelected(d,u,f,p)},onParagraphClick:d=>{let u=d.pageNum?oe.get(a)?.viewer.el.querySelector(\`.pdf-page-wrapper[data-page="\${d.pageNum}"]\`):null;u&&Pr(u,d,Vs,r)}}).then(d=>{Ge=d,oe.set(a,{viewer:d,lastActiveAt:Date.now(),idleTimer:null}),l=\$r({filePath:a,viewer:d,getAnnotations:()=>window.__annotationState?.annotations??[],onAnnotationCreated:()=>{}}),document.addEventListener("annotations:loaded",()=>{let u=window.__annotationState?.annotations??[];l?.renderHighlights(u)},{once:!1})});return}let n=window.marked.parse(t.content),o=t.isMissing?\`
      <div class="content-file-status deleted">
        \\u8BE5\\u6587\\u4EF6\\u5DF2\\u4ECE\\u78C1\\u76D8\\u5220\\u9664\\uFF0C\\u5F53\\u524D\\u5185\\u5BB9\\u4E3A\\u672C\\u5730\\u7F13\\u5B58\\u5FEB\\u7167\\u3002
      </div>
    \`:"";e.innerHTML=\`\${o}<div class="markdown-body" id="reader">\${n}</div>\`,e.setAttribute("data-current-file",t.path),nl(e,t.path),il(e),ol(e),W();let i=document.getElementById("fileMeta");i&&(i.textContent=nn(t.lastModified)),an(),ie()}function an(){let e=document.getElementById("breadcrumb");if(!e||!c.currentFile){e&&(e.innerHTML="");return}let t=c.sessionFiles.get(c.currentFile);if(!t)return;let n=t.path.split("/").filter(Boolean),o=n[n.length-1]||"",i=n.map((a,r)=>{let s=r===n.length-1,l="/"+n.slice(0,r+1).join("/");return s?\`<span class="breadcrumb-item active">\${x(a)}</span>\`:\`
      <span class="breadcrumb-item" title="\${T(l)}">
        \${x(a)}
      </span>
      <span class="breadcrumb-separator">/</span>
    \`}).join("");e.innerHTML=\`
    \${i}
    <button class="copy-filename-button" onclick="copyFilePath('\${T(t.path)}', event)" title="\\u590D\\u5236\\u76F8\\u5BF9\\u8DEF\\u5F84 / \\u2325+\\u70B9\\u51FB\\u590D\\u5236\\u7EDD\\u5BF9\\u8DEF\\u5F84">
      <span class="copy-icon"></span>
      <span class="check-icon">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
        </svg>
      </span>
      <span class="copy-tooltip">\\u590D\\u5236\\u76F8\\u5BF9\\u8DEF\\u5F84</span>
    </button>
  \`}async function rl(e){if(e.stopPropagation(),!c.currentFile)return;let t=e.target,n=document.querySelector(".nearby-menu");if(n){n.remove();return}try{let o=await Pn(c.currentFile);if(!o.files||o.files.length===0){In("\\u9644\\u8FD1\\u6CA1\\u6709\\u5176\\u4ED6 Markdown \\u6587\\u4EF6",3e3);return}let i=document.createElement("div");i.className="nearby-menu",i.innerHTML=\`
      <div class="nearby-menu-header">\\u9644\\u8FD1\\u7684\\u6587\\u4EF6</div>
      \${o.files.map(s=>\`
        <div class="nearby-menu-item" onclick="window.addFileByPath('\${T(s.path)}', true)">
          \\u{1F4C4} \${x(s.name)}
        </div>
      \`).join("")}
    \`;let a=t.getBoundingClientRect();i.style.position="fixed",i.style.left=a.left+"px",i.style.top=a.bottom+5+"px",document.body.appendChild(i);let r=()=>{i.remove(),document.removeEventListener("click",r)};setTimeout(()=>document.addEventListener("click",r),0)}catch(o){L("\\u83B7\\u53D6\\u9644\\u8FD1\\u6587\\u4EF6\\u5931\\u8D25: "+o.message)}}function al(e){let t=e.split("/").filter(Boolean);return t[t.length-1]||"workspace"}function Jr(e){let t=e.toLowerCase();return t.endsWith(".html")||t.endsWith(".htm")}function sl(e){let t=e.toLowerCase();return t.endsWith(".json")||t.endsWith(".jsonl")}function Ur(e){return e.toLowerCase().endsWith(".pdf")}function Qr(e){return/^https?:\\/\\//i.test(e)}async function ll(e){if(z(e),\$(),Qr(e)){window.open(e,"_blank","noopener,noreferrer");return}try{let n=await(await fetch("/api/open-local-file",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e})})).json();n?.error&&L(\`\\u6253\\u5F00 HTML \\u5931\\u8D25: \${n.error}\`)}catch(t){L(\`\\u6253\\u5F00 HTML \\u5931\\u8D25: \${t?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)}}function cl(e){let t=e.trim();return t?!!(/^https?:\\/\\//i.test(t)||t.startsWith("/")||t.startsWith("~/")||t.startsWith("./")||t.startsWith("../")||t.includes("/")||t.includes("\\\\")||/\\.[a-zA-Z0-9]{1,10}\$/.test(t)):!1}function bt(){G=null;let e=document.getElementById("quickActionConfirm"),t=document.getElementById("quickActionConfirmText"),n=document.getElementById("quickActionConfirmActions");e&&(e.style.display="none",e.className="add-file-confirm"),t&&(t.textContent=""),n&&(n.innerHTML=""),document.body.classList.remove("quick-action-confirm-visible")}function Gr(){let e=document.getElementById("quickActionConfirm");return!!e&&e.style.display!=="none"}function sn(e,t,n={}){document.getElementById("searchInput")?.dispatchEvent(new Event("path-autocomplete-hide"));let i=document.getElementById("quickActionConfirm"),a=document.getElementById("quickActionConfirmText"),r=document.getElementById("quickActionConfirmActions");if(!(!i||!a||!r)){if(a.textContent=e,r.innerHTML="",i.className=\`add-file-confirm state-\${t}\`,i.style.display="flex",document.body.classList.add("quick-action-confirm-visible"),n.primaryLabel&&n.onPrimary){let s=document.createElement("button");s.className="add-file-confirm-button primary",s.textContent=n.primaryLabel,s.onclick=async()=>{await n.onPrimary(),bt()},r.appendChild(s)}if(n.allowCancel!==!1){let s=document.createElement("button");s.className="add-file-confirm-button",s.textContent="\\u53D6\\u6D88",s.onclick=()=>bt(),r.appendChild(s)}}}async function Hr(){if(!G)return;if(G.kind==="add-other-file"){await Ce(G.path,!0);return}let e=en(al(G.path),G.path);\$(),U(\`\\u5DF2\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A: \${e.name}\`,2e3),de(""),\$()}async function Ce(e,t=!0){if(!e.trim())return;let n=await We(e);n&&(await qr(n,t),await Hn(e,t),de(""),\$())}async function Xr(e){let t=e.trim();if(!t)return;let n=await Nn(t),o=n.path||t;if(n.kind==="md_file"||n.kind==="html_file"||n.kind==="pdf_file"){bt(),await Ce(o,!0);return}if(n.kind==="other_file"){G={kind:"add-other-file",path:o,ext:n.ext||null},sn(\`\\u68C0\\u6D4B\\u5230\\u975E Markdown \\u6587\\u4EF6\${n.ext?\`: \${n.ext}\`:""}\`,"warning",{primaryLabel:"\\u7EE7\\u7EED\\u6DFB\\u52A0\\u6587\\u4EF6",onPrimary:Hr});return}if(n.kind==="directory"){G={kind:"add-workspace",path:o},sn("\\u68C0\\u6D4B\\u5230\\u76EE\\u5F55\\uFF0C\\u662F\\u5426\\u4F5C\\u4E3A\\u5DE5\\u4F5C\\u533A\\u6DFB\\u52A0\\uFF1F","directory",{primaryLabel:"\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A",onPrimary:Hr});return}if(n.kind==="not_found"){G=null,sn("\\u8DEF\\u5F84\\u4E0D\\u5B58\\u5728\\uFF0C\\u8BF7\\u68C0\\u67E5\\u540E\\u91CD\\u8BD5","error",{allowCancel:!0});return}G=null,sn(n.error||"\\u65E0\\u6CD5\\u8BC6\\u522B\\u8F93\\u5165\\u8DEF\\u5F84","error",{allowCancel:!0})}async function dl(e){if(re){re=!1;let n=document.getElementById("diffButton");n&&n.classList.remove("active")}let t=c.currentFile;Mn(e),\$(),X(),\$e(!0),t!==e&&_r(),await ie()}function Yr(e){Ur(e)&&Or(e),En(e),\$(),X(),\$e(!0)}async function ul(e){let t=document.getElementById("searchInput"),n=(typeof e=="string"?e:t?.value||"").trim();if(n)try{let o=c.config.workspaces.map(a=>a.path).filter(Boolean),i=await at(n,{roots:o,limit:50});i.files&&i.files.length>0?await Ce(i.files[0].path):In("\\u6CA1\\u6709\\u627E\\u5230\\u5339\\u914D\\u7684\\u6587\\u4EF6",3e3)}catch(o){L("\\u641C\\u7D22\\u5931\\u8D25: "+o.message)}}function pl(){document.body.addEventListener("dragover",e=>{e.preventDefault()}),document.body.addEventListener("drop",async e=>{e.preventDefault();let t=Array.from(e.dataTransfer?.files||[]);for(let n of t){let o=n.name.toLowerCase();(o.endsWith(".md")||o.endsWith(".markdown")||o.endsWith(".html")||o.endsWith(".htm"))&&await Ce(n.path)}})}function ml(){document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(Ii()){e.preventDefault();return}if(document.getElementById("settingsDialogOverlay")?.classList.contains("show")){e.preventDefault(),ht();return}let n=document.getElementById("addWorkspaceDialogOverlay");if(n?.classList.contains("show")){e.preventDefault(),n.classList.remove("show");return}}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){let t=document.activeElement?.tagName?.toLowerCase();if(t==="textarea"||t==="input")return;e.preventDefault();let n=document.getElementById("searchInput");n&&(n.focus(),n.select());return}if((e.metaKey||e.ctrlKey)&&e.key==="w"&&(e.preventDefault(),c.currentFile&&Yr(c.currentFile)),re&&!e.metaKey&&!e.ctrlKey&&!e.altKey){let t=e.target?.tagName?.toLowerCase();if(t!=="input"&&t!=="textarea"){if(e.key==="n"){e.preventDefault(),bo(1);return}if(e.key==="p"){e.preventDefault(),bo(-1);return}}}})}function fl(){let e=new URLSearchParams(window.location.search),t=e.get("file"),n=e.get("focus")!=="false";t&&(Ce(t,n),window.history.replaceState({},"",window.location.pathname))}async function gl(e){let t=c.sessionFiles.get(e);if(!t)return null;if(t.pendingContent!==void 0)return t.pendingContent;let n=await We(e,!0);return n?(t.pendingContent=n.content,n.content):null}function hl(e,t){ne=-1;let n=document.getElementById("content");if(!n)return;let o=ar(e,t);if(!o.some(m=>m.type!=="equal")){n.innerHTML=\`
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
    \`;return}let a=[],r=0;for(;r<o.length;){let m=o[r];m.type==="equal"?(a.push({left:m,right:m}),r++):m.type==="delete"?r+1<o.length&&o[r+1].type==="insert"?(a.push({left:m,right:o[r+1]}),r+=2):(a.push({left:m}),r++):(a.push({right:m}),r++)}let s=[],l=-1;for(let m=0;m<a.length;m++){let h=a[m],y=!(h.left&&h.right&&h.left.type==="equal");y&&l===-1?l=m:!y&&l!==-1&&(s.push({startRowIndex:l,endRowIndex:m-1}),l=-1)}l!==-1&&s.push({startRowIndex:l,endRowIndex:a.length-1});let d=s.length,u=new Map;s.forEach((m,h)=>u.set(m.startRowIndex,h));let f=m=>m.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),p=a.map(({left:m,right:h},y)=>{if(m&&h&&m.type==="equal")return\`<tr class="diff-row-equal">
        <td class="diff-line-no">\${m.oldLineNo}</td>
        <td>\${f(m.content)}</td>
        <td class="diff-line-no">\${h.newLineNo}</td>
        <td>\${f(h.content)}</td>
      </tr>\`;let b=u.get(y),k=b!==void 0?\` data-block-index="\${b}"\`:"",w=b!==void 0?\`<span class="diff-block-index" data-block-span="\${b}">\${b+1}/\${d}</span>\`:"",S=m?\`<td class="diff-line-no">\${m.oldLineNo??""}\${w}</td>\`:'<td class="diff-line-no diff-cell-empty"></td>',C=m?\`<td class="diff-row-delete-cell">\${f(m.content)}</td>\`:'<td class="diff-cell-empty"></td>',P=h?\`<td class="diff-line-no">\${h.newLineNo??""}</td>\`:'<td class="diff-line-no diff-cell-empty"></td>',Y=h?\`<td class="diff-row-insert-cell">\${f(h.content)}</td>\`:'<td class="diff-cell-empty"></td>';return\`<tr class="\${m&&h?"diff-row-mixed":m?"diff-row-delete":"diff-row-insert"}"\${k}>\${S}\${C}\${P}\${Y}</tr>\`}).join("");n.innerHTML=\`
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
  \`}async function yl(){if(!c.currentFile)return;let e=c.sessionFiles.get(c.currentFile);if(!e)return;if(re){Zr();return}let t=await gl(c.currentFile);if(t===null)return;re=!0;let n=document.getElementById("diffButton");n&&n.classList.add("active"),hl(e.content,t)}function Zr(){re=!1,ne=-1;let e=document.getElementById("diffButton");e&&e.classList.remove("active"),X()}function bo(e){let t=document.querySelector(".diff-view-scroll");if(!t)return;let o=t.querySelectorAll("[data-block-index]").length;if(o===0)return;let i=ne===-1?e===1?0:o-1:Math.max(0,Math.min(o-1,ne+e));if(i===ne)return;if(ne>=0){let u=t.querySelector(\`[data-block-span="\${ne}"]\`);u&&(u.style.display="none")}let a=t.querySelector(\`[data-block-span="\${i}"]\`);a&&(a.style.display="inline");let r=t.querySelector(\`[data-block-index="\${i}"]\`);r&&r.scrollIntoView({behavior:"instant",block:"center"}),ne=i;let s=document.getElementById("diffNavCount");s&&(s.textContent=\`\${i+1} / \${o} \\u5904\\u5DEE\\u5F02\`);let l=document.getElementById("diffNavPrev"),d=document.getElementById("diffNavNext");l&&(l.disabled=i===0),d&&(d.disabled=i===o-1)}async function bl(){if(!c.currentFile)return;let e=c.sessionFiles.get(c.currentFile);!e||e.pendingContent===void 0||(e.content=e.pendingContent,e.pendingContent=void 0,e.displayedModified=e.lastModified,V(),re=!1,ne=-1,X(),\$e(!1),Kr(),\$(),await ie())}async function ie(){let e=document.getElementById("diffButton"),t=document.getElementById("refreshButton");if(!c.currentFile){e&&(e.style.display="none"),t&&(t.style.display="none");return}let n=c.sessionFiles.get(c.currentFile);if(!n)return;if(n.isMissing){e&&(e.style.display="none"),t&&(t.style.display="none");return}let o=n.lastModified>n.displayedModified;e&&(e.style.display=o&&!n.isRemote?"flex":"none"),t&&(t.style.display=o?"flex":"none")}async function wl(){c.currentFile&&await zr(c.currentFile)}function vl(e){return e?.target?e.target.closest(".copy-filename-button, .sync-dialog-copy-btn, .sync-dialog-btn"):null}function kl(e,t){if(!e)return;if(e.classList.contains("copy-filename-button")){e.classList.add("success");let o=e.querySelector(".copy-tooltip"),i=o?.textContent;o&&(o.textContent=t||"\\u5DF2\\u590D\\u5236"),setTimeout(()=>{e.classList.remove("success"),o&&i&&(o.textContent=i)},1e3);return}let n=e.textContent;e.textContent="\\u2713 \\u5DF2\\u590D\\u5236",setTimeout(()=>{n!=null&&(e.textContent=n)},1e3)}function wo(e,t,n){navigator.clipboard.writeText(e).then(()=>{kl(vl(t),n)}).catch(()=>{L("\\u590D\\u5236\\u5931\\u8D25")})}function xl(e,t){wo(e,t)}function ea(e,t){if(t instanceof MouseEvent&&t.altKey){wo(e,t,"\\u5DF2\\u590D\\u5236\\u7EDD\\u5BF9\\u8DEF\\u5F84");return}let o=c.config.workspaces,i=e;for(let a of o){let r=a.path.replace(/\\/+\$/,"");if(e===r||e.startsWith(r+"/")){i=e.slice(r.length+1);break}}wo(i,t,"\\u5DF2\\u590D\\u5236\\u76F8\\u5BF9\\u8DEF\\u5F84")}function Tl(e,t){ea(e,t)}function El(){let e=localStorage.getItem("fontScale");e&&(Xe=parseFloat(e)),ta()}function ta(){document.documentElement.style.setProperty("--font-scale",Xe.toString()),na(),localStorage.setItem("fontScale",Xe.toString())}function na(){let e=document.getElementById("fontScaleText");if(e){let o=Math.round(Xe*100);e.textContent=\`\${o}%\`}let t=document.querySelectorAll(".font-scale-option");t.forEach(o=>{o.classList.remove("active")});let n=Math.round(Xe*100);t.forEach(o=>{o.textContent?.trim()===\`\${n}%\`&&o.classList.add("active")})}function Ml(e){Xe=e,ta(),vo()}function Al(){return Array.from(oe.entries()).map(([e,t])=>{let n=t.viewer.getRenderedCount(),o=t.viewer.getTotalPages(),i=n*Sl,a=t.idleTimer?(Rr-(Date.now()-t.lastActiveAt))/1e3:null,r=a!==null?Math.max(0,Math.round(a/60)):null;return{path:e.split("/").pop()||e,rendered:n,total:o,memMB:i,idleMins:r}})}function jr(){let e=document.getElementById("pdfMemContent");if(!e)return;let t=Al();if(t.length===0){e.innerHTML='<div class="pdf-mem-row pdf-mem-empty">\\u6682\\u65E0 PDF \\u6570\\u636E</div>';return}let n=t.reduce((o,i)=>o+i.memMB,0);e.innerHTML=t.map(o=>\`
    <div class="pdf-mem-row">
      <span class="pdf-mem-name" title="\${o.path}">\${o.path}</span>
      <span class="pdf-mem-pages">\${o.rendered}/\${o.total} \\u9875</span>
      <span class="pdf-mem-mb">~\${o.memMB}MB</span>
      \${o.idleMins!==null?\`<span class="pdf-mem-idle">\${o.idleMins}min \\u540E\\u56DE\\u6536</span>\`:""}
    </div>
  \`).join("")+\`<div class="pdf-mem-total">\\u5408\\u8BA1 ~\${n}MB</div>\`}function Ll(){let e=document.getElementById("pdfMemPanel");if(!e)return;e.style.display!=="none"?(e.style.display="none",ln&&(clearInterval(ln),ln=null)):(e.style.display="block",jr(),ln=setInterval(jr,2e3))}function Fl(){let e=document.getElementById("fontScaleMenu");if(!e)return;e.style.display!=="none"?vo():(e.style.display="block",na())}function vo(){let e=document.getElementById("fontScaleMenu");e&&(e.style.display="none")}function oa(e=!1){let t=new EventSource("/api/events");e&&tn(),t.addEventListener("file-changed",async n=>{let o=JSON.parse(n.data),i=Pe(o.path);i?(i.lastModified=o.lastModified,i.isMissing&&(i.isMissing=!1,te(o.path)),V()):yn(o.path),\$(),await ie()}),t.addEventListener("file-deleted",async n=>{let o=JSON.parse(n.data),i=Pe(o.path);i?(i.isMissing=!0,V()):ke(o.path),\$(),c.currentFile===o.path&&(X(),ie(),L("\\u6587\\u4EF6\\u5DF2\\u4E0D\\u5B58\\u5728"))}),t.addEventListener("file-opened",async n=>{let o=JSON.parse(n.data);await qr(o,o.focus!==!1)}),t.addEventListener("state-request",async n=>{let i=JSON.parse(n.data).requestId;if(!i)return;let a=Array.from(c.sessionFiles.values()).map(r=>({path:r.path,name:r.name}));try{await fetch("/api/session-state",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({requestId:i,currentFile:c.currentFile,openFiles:a})})}catch(r){console.error("\\u54CD\\u5E94\\u72B6\\u6001\\u8BF7\\u6C42\\u5931\\u8D25:",r)}}),t.onerror=()=>{console.error("SSE \\u8FDE\\u63A5\\u65AD\\u5F00\\uFF0C\\u5C1D\\u8BD5\\u91CD\\u8FDE..."),t.close(),setTimeout(()=>oa(!0),3e3)}}function \$l(){window.setInterval(async()=>{if(fo||c.config.sidebarTab==="list")return;let e=c.config.sidebarTab==="focus"?c.config.workspaces:c.config.workspaces.filter(t=>t.isExpanded);if(e.length!==0){fo=!0;try{for(let t of e)await Q(t.id);\$()}finally{fo=!1}}},c.config.workspacePollInterval??5e3)}function Cl(){let e=document.createElement("div");e.id="findBar",e.innerHTML=\`
    <input id="findBarInput" type="text" placeholder="\\u67E5\\u627E..." autocomplete="off" spellcheck="false" />
    <span id="findBarCount"></span>
    <button id="findBarPrev" title="\\u4E0A\\u4E00\\u4E2A (\\u21E7\\u2318G)">&#8593;</button>
    <button id="findBarNext" title="\\u4E0B\\u4E00\\u4E2A (\\u2318G)">&#8595;</button>
    <button id="findBarClose" title="\\u5173\\u95ED (Esc)">&#10005;</button>
  \`,document.body.appendChild(e);let t=document.getElementById("findBarInput"),n=document.getElementById("findBarCount"),o=document.getElementById("findBarPrev"),i=document.getElementById("findBarNext"),a=document.getElementById("findBarClose"),r=[],s=-1,l=null;function d(){l&&l.querySelectorAll("mark.find-highlight").forEach(w=>{let S=w.parentNode;S&&(S.replaceChild(document.createTextNode(w.textContent||""),w),S.normalize())}),r=[],s=-1,n.textContent=""}function u(w){return w.replace(/[.*+?^\${}()|[\\]\\\\]/g,"\\\\\$&")}function f(w){if(d(),!w)return;let S=document.getElementById("content");if(!S)return;l=S;let C=new RegExp(u(w),"gi"),P=document.createTreeWalker(S,NodeFilter.SHOW_TEXT,{acceptNode(Z){let D=Z.parentElement;if(!D)return NodeFilter.FILTER_REJECT;let R=D.tagName.toLowerCase();return R==="script"||R==="style"||R==="mark"?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),Y=[],be;for(;be=P.nextNode();)Y.push(be);for(let Z of Y){let D=Z.textContent||"",R,M=[],A=0;for(C.lastIndex=0;(R=C.exec(D))!==null;){R.index>A&&M.push(D.slice(A,R.index));let F=document.createElement("mark");F.className="find-highlight",F.textContent=R[0],M.push(F),r.push(document.createRange()),A=R.index+R[0].length}if(M.length===0)continue;A<D.length&&M.push(D.slice(A));let H=document.createDocumentFragment();M.forEach(F=>{typeof F=="string"?H.appendChild(document.createTextNode(F)):H.appendChild(F)}),Z.parentNode.replaceChild(H,Z)}r=[],S.querySelectorAll("mark.find-highlight").forEach(Z=>{let D=document.createRange();D.selectNode(Z),r.push(D)}),r.length>0&&(s=0,p(0)),m()}function p(w){let S=document.getElementById("content");if(!S)return;let C=S.querySelectorAll("mark.find-highlight");C.forEach((Y,be)=>{Y.classList.toggle("find-highlight-current",be===w)});let P=C[w];P&&P.scrollIntoView({block:"center",behavior:"smooth"})}function m(){r.length===0?(n.textContent=t.value?"\\u65E0\\u7ED3\\u679C":"",n.className=t.value?"no-result":""):(n.textContent=\`\${s+1} / \${r.length}\`,n.className="")}function h(){r.length!==0&&(s=(s+1)%r.length,p(s),m())}function y(){r.length!==0&&(s=(s-1+r.length)%r.length,p(s),m())}function b(){e.classList.add("visible"),t.focus(),t.select(),t.value&&f(t.value)}function k(){e.classList.remove("visible"),d()}window.__showFindBar=b,t.addEventListener("input",()=>f(t.value)),t.addEventListener("keydown",w=>{w.key==="Enter"?(w.shiftKey?y():h(),w.preventDefault()):w.key==="Escape"&&(k(),w.preventDefault())}),o.addEventListener("click",y),i.addEventListener("click",h),a.addEventListener("click",k)}var go,ho,Dr,Ks,mo,re,fo,Nr,Ge,Vs,Rr,oe,G,ne,Xe,Sl,ln,Ae=v(()=>{j();ce();dt();Me();Te();sr();lr();I();je();Er();Sr();lo();Jt();Fr();Cr();Br();go="md-viewer:sidebar-width",ho=260,Dr=220,Ks=680,mo=new Map,re=!1,fo=!1,Nr=!1,Ge=null,Vs=new rn,Rr=600*1e3,oe=new Map;G=null;ne=-1;Xe=1;Sl=27,ln=null;document.addEventListener("click",e=>{let t=document.getElementById("fontScaleMenu"),n=document.getElementById("fontScaleButton");if(!t||!n)return;let o=e.target;!t.contains(o)&&!n.contains(o)&&vo()});window.addFile=()=>{let e=document.getElementById("searchInput");e&&Xr(e.value).catch(t=>{L(\`\\u6DFB\\u52A0\\u5931\\u8D25: \${t?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)})};window.handleUnifiedInputSubmit=e=>{let t=document.getElementById("searchInput"),n=(typeof e=="string"?e:t?.value||"").trim();if(n){if(!cl(n)){ul(n).catch(o=>{L(\`\\u641C\\u7D22\\u5931\\u8D25: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)});return}Xr(n).catch(o=>{L(\`\\u6DFB\\u52A0\\u5931\\u8D25: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)})}};window.dismissQuickActionConfirm=()=>{Gr()&&bt()};window.switchFile=dl;window.removeFile=Yr;window.showNearbyMenu=rl;window.addFileByPath=Ce;window.refreshFile=zr;window.handleRefreshButtonClick=wl;window.handleDiffButtonClick=yl;window.closeDiffView=Zr;window.navigateDiffBlock=bo;window.acceptDiffUpdate=bl;window.copySingleText=xl;window.copyFileName=Tl;window.copyFilePath=ea;window.showToast=He;window.showSettingsDialog=Tr;window.toggleFontScaleMenu=Fl;window.togglePdfMemPanel=Ll;window.setFontScale=Ml;window.openExternalFile=ll;window.renderContent=X;window.applyTheme=Wr;(async()=>(Gs(),El(),Oi(),window.__setPendingAnnotation=qi,ge(),window.addEventListener("resize",()=>{ge()}),await xn(We),Wr(),await tn(),\$l(),\$(),X(),\$e(!0),pl(),Xs(),document.addEventListener("click",e=>{if(!Gr())return;let t=e.target;t&&(t.closest(".sidebar-header")||t.closest("#quickActionConfirm")||bt())}),fl(),ml(),document.addEventListener("mouseup",()=>{setTimeout(()=>{let e=document.getElementById("content")?.getAttribute("data-current-file")||null;Ri(e)},0)}),document.addEventListener("click",e=>{let t=e.target.closest("a[href]");if(!t)return;let n=t.getAttribute("href")||"";if(!n.startsWith("pdf://"))return;e.preventDefault();let o=n.slice(6),i=o.indexOf("#"),a=i>=0?o.slice(0,i):o,r=i>=0?o.slice(i+1):"",s=new URLSearchParams(r),l=parseInt(s.get("page")||"1",10),d=s.get("quote")||"";Ce(a).then(()=>{setTimeout(()=>{Ge&&(Ge.scrollToPage(l),d&&Ge.highlightQuote(l,decodeURIComponent(d)))},500)})}),document.addEventListener("pdf:show-composer",e=>{let{annotation:t,filePath:n}=e.detail;window.__setPendingAnnotation&&window.__setPendingAnnotation(t,n)}),await Ys(),oa(),Cl()))()});Ae();})();
//# sourceMappingURL=client.js.map
`;
