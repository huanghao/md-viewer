// 自动生成的文件，不要手动编辑
// 由 scripts/embed-client.ts 生成

export const EMBEDDED_CLIENT_JS = `"use strict";(()=>{var Ar=Object.defineProperty;var b=(e,t)=>()=>(e&&(t=e(e=0)),t);var de=(e,t)=>{for(var n in t)Ar(e,n,{get:t[n],enumerable:!0})};var ro={};de(ro,{defaultConfig:()=>dt,loadConfig:()=>ut,saveConfig:()=>H,updateConfig:()=>Lr});function ut(){try{let e=localStorage.getItem(io);if(!e)return{...dt};let t=JSON.parse(e);return{...dt,...t}}catch(e){return console.error("\\u52A0\\u8F7D\\u914D\\u7F6E\\u5931\\u8D25:",e),{...dt}}}function H(e){try{localStorage.setItem(io,JSON.stringify(e))}catch(t){console.error("\\u4FDD\\u5B58\\u914D\\u7F6E\\u5931\\u8D25:",t)}}function Lr(e){let n={...ut(),...e};return H(n),n}var io,dt,xe=b(()=>{"use strict";io="md-viewer:config",dt={sidebarTab:"focus",focusWindowKey:"8h",markdownTheme:"github",codeTheme:"github",mathInline:!0,workspacePollInterval:5e3,workspaces:[]}});function ao(){try{localStorage.setItem(so,JSON.stringify(Array.from(ue.entries()).map(([e,t])=>[e,Array.from(t)])))}catch(e){console.error("\\u4FDD\\u5B58\\u5217\\u8868\\u5DEE\\u5F02\\u72B6\\u6001\\u5931\\u8D25:",e)}}function lo(){ue.clear();try{let e=localStorage.getItem(so);if(!e)return;let t=JSON.parse(e);if(!Array.isArray(t))return;for(let n of t){if(!Array.isArray(n)||n.length!==2)continue;let o=n[0],i=n[1];typeof o!="string"||!Array.isArray(i)||ue.set(o,new Set(i.filter(s=>typeof s=="string"&&s.length>0)))}}catch(e){console.error("\\u6062\\u590D\\u5217\\u8868\\u5DEE\\u5F02\\u72B6\\u6001\\u5931\\u8D25:",e)}}function co(e){return ue.get(e)}function Jt(e,t){ue.set(e,t),ao()}function uo(e){let t=ue.get(e);return ue.delete(e),ao(),t}var so,ue,po=b(()=>{"use strict";so="md-viewer:workspaceKnownFiles",ue=new Map});function pe(e){pt.add(e)}function V(e){pt.delete(e)}function Ut(e){return pt.has(e)}function Vt(e){let t=Array.from(pt.values());if(!e)return t;let n=\`\${e.replace(/\\/+\$/,"")}/\`;return t.filter(o=>o.startsWith(n))}var pt,Gt=b(()=>{"use strict";pt=new Set});function Qt(){try{let e=Array.from(G.entries()).map(([t,n])=>[t,Array.from(n.entries())]);localStorage.setItem(mo,JSON.stringify(e))}catch(e){console.error("\\u4FDD\\u5B58\\u5DE5\\u4F5C\\u533A\\u76EE\\u5F55\\u5C55\\u5F00\\u72B6\\u6001\\u5931\\u8D25:",e)}}function fo(){G.clear();try{let e=localStorage.getItem(mo);if(!e)return;let t=JSON.parse(e);if(!Array.isArray(t))return;for(let n of t){if(!Array.isArray(n)||n.length!==2)continue;let o=n[0],i=n[1];if(typeof o!="string"||!Array.isArray(i))continue;let s=new Map;for(let r of i){if(!Array.isArray(r)||r.length!==2)continue;let a=r[0],c=r[1];typeof a!="string"||typeof c!="boolean"||s.set(a,c)}s.size>0&&G.set(o,s)}}catch(e){console.error("\\u6062\\u590D\\u5DE5\\u4F5C\\u533A\\u76EE\\u5F55\\u5C55\\u5F00\\u72B6\\u6001\\u5931\\u8D25:",e)}}function go(e){return G.get(e)}function mt(e,t){if(t.size===0){G.delete(e),Qt();return}G.set(e,new Map(t)),Qt()}function ho(e){G.has(e)&&(G.delete(e),Qt())}function ft(e){let t=new Map,n=o=>{if(o.type==="directory"){typeof o.isExpanded=="boolean"&&t.set(o.path,o.isExpanded);for(let i of o.children||[])n(i)}};return n(e),t}var mo,G,Xt=b(()=>{"use strict";mo="md-viewer:workspaceTreeExpandedState",G=new Map});function W(e){return Q.has(e)}function Yt(e){Q.add(e)}function P(e){Q.has(e)&&Q.delete(e)}function _e(e){return ze.has(e)}function Zt(e){ze.add(e)}function gt(e){ze.delete(e)}function en(){Q.clear(),ze.clear(),lo(),fo()}function tn(e,t){let n=new Set(t),o=co(e);if(!o){Jt(e,n);return}for(let i of n)o.has(i)||Q.add(i),V(i);for(let i of o)n.has(i)||(Q.delete(i),pe(i));Jt(e,n)}function nn(e){let t=uo(e);if(t)for(let n of t)Q.delete(n),ze.delete(n)}var Q,ze,yo=b(()=>{"use strict";po();Gt();Xt();Q=new Set,ze=new Set});var X=b(()=>{"use strict";yo();Gt()});var me={};de(me,{addOrUpdateFile:()=>sn,getFilteredFiles:()=>cn,getSessionFile:()=>Ee,getSessionFiles:()=>on,hasSessionFile:()=>bt,markFileMissing:()=>Fr,removeFile:()=>an,restoreState:()=>rn,saveState:()=>q,setSearchQuery:()=>Y,state:()=>l,switchToFile:()=>ln});function Ee(e){return l.sessionFiles.get(e)}function bt(e){return l.sessionFiles.has(e)}function on(){return Array.from(l.sessionFiles.values())}function q(){try{let e={files:Array.from(l.sessionFiles.entries()).map(([t,n])=>[t,{path:n.path,name:n.name,isRemote:n.isRemote||!1,isMissing:n.isMissing||!1,lastModified:n.lastModified,displayedModified:n.displayedModified,lastAccessed:n.lastAccessed||Date.now()}]),currentFile:l.currentFile};localStorage.setItem(yt,JSON.stringify(e))}catch(e){if(e.name==="QuotaExceededError"||e.code===22){console.warn("localStorage \\u914D\\u989D\\u5DF2\\u6EE1\\uFF0C\\u6267\\u884C\\u6E05\\u7406..."),bo();try{let t={files:Array.from(l.sessionFiles.entries()).map(([n,o])=>[n,{path:o.path,name:o.name,isRemote:o.isRemote||!1,isMissing:o.isMissing||!1,lastModified:o.lastModified,displayedModified:o.displayedModified,lastAccessed:o.lastAccessed||Date.now()}]),currentFile:l.currentFile};localStorage.setItem(yt,JSON.stringify(t))}catch(t){console.error("\\u4FDD\\u5B58\\u72B6\\u6001\\u5931\\u8D25\\uFF08\\u91CD\\u8BD5\\u540E\\uFF09:",t)}}else console.error("\\u4FDD\\u5B58\\u72B6\\u6001\\u5931\\u8D25:",e)}}function bo(){if(l.sessionFiles.size<=ht)return;let e=Array.from(l.sessionFiles.entries()).sort((o,i)=>(i[1].lastAccessed||i[1].lastModified||0)-(o[1].lastAccessed||o[1].lastModified||0)),t=e.slice(0,ht),n=e.slice(ht);l.sessionFiles.clear(),t.forEach(([o,i])=>{l.sessionFiles.set(o,i)}),console.log(\`\\u5DF2\\u6E05\\u7406 \${n.length} \\u4E2A\\u65E7\\u6587\\u4EF6\`)}async function rn(e){try{en();let t=localStorage.getItem(yt);if(!t)return;let n=JSON.parse(t);if(!n.files||n.files.length===0)return;let o=[];for(let[i,s]of n.files){let r=await e(i,!0);if(r){let a=Math.max(r.lastModified,s.lastModified||0);l.sessionFiles.set(i,{path:r.path,name:r.filename,content:r.content,lastModified:a,displayedModified:r.lastModified,isRemote:r.isRemote||!1,isMissing:!1,lastAccessed:s.lastAccessed||r.lastModified}),o.push([i,s])}}if(o.length!==n.files.length){let i=l.sessionFiles.has(n.currentFile)?n.currentFile:null;localStorage.setItem(yt,JSON.stringify({files:o,currentFile:i}))}if(n.currentFile&&l.sessionFiles.has(n.currentFile))l.currentFile=n.currentFile;else{let i=Array.from(l.sessionFiles.values())[0];l.currentFile=i?i.path:null}}catch(t){console.error("\\u6062\\u590D\\u72B6\\u6001\\u5931\\u8D25:",t)}}function sn(e,t=!1){l.sessionFiles.size>=ht&&!l.sessionFiles.has(e.path)&&bo();let n=l.sessionFiles.get(e.path),o=!n,i=e.lastModified,s=n?Math.max(n.lastModified,e.lastModified):e.lastModified;l.sessionFiles.set(e.path,{path:e.path,name:e.filename,content:e.content,lastModified:s,displayedModified:i,isRemote:e.isRemote||!1,isMissing:!1,lastAccessed:Date.now()}),t&&(l.currentFile=e.path,P(e.path)),V(e.path),o&&(t||Yt(e.path)),q()}function an(e){let n=Array.from(l.sessionFiles.keys()).indexOf(e);if(l.sessionFiles.delete(e),P(e),V(e),l.currentFile===e){let o=Array.from(l.sessionFiles.values());l.currentFile=o.length>0?o[Math.max(0,n-1)].path:null}q()}function ln(e){l.currentFile=e;let t=l.sessionFiles.get(e);t&&(t.lastAccessed=Date.now()),P(e),V(e),q()}function Fr(e,t=!1){let n=l.sessionFiles.get(e),o=Date.now(),i=e.split("/").pop()||n?.name||e;l.sessionFiles.set(e,{path:e,name:i,content:n?.content||\`# \\u6587\\u4EF6\\u5DF2\\u5220\\u9664

\\u8BE5\\u6587\\u4EF6\\u5DF2\\u4ECE\\u78C1\\u76D8\\u5220\\u9664\\uFF0C\\u4E14\\u5F53\\u524D\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\u5185\\u5BB9\\u3002\`,lastModified:n?.lastModified||o,displayedModified:n?.displayedModified||o,isRemote:n?.isRemote||!1,isMissing:!0}),t&&(l.currentFile=e,P(e)),pe(e),q()}function Y(e){l.searchQuery=e}function cn(){let e=l.searchQuery.toLowerCase().trim();return e?Array.from(l.sessionFiles.values()).filter(t=>t.name.toLowerCase().includes(e)||t.path.toLowerCase().includes(e)):Array.from(l.sessionFiles.values())}var l,yt,ht,I=b(()=>{"use strict";xe();X();l={sessionFiles:new Map,currentFile:null,searchQuery:"",config:ut(),currentWorkspace:null,fileTree:new Map},yt="md-viewer:openFiles",ht=100});function w(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}function v(e){return w(e)}var fe=b(()=>{"use strict"});function z(e,t=!1){return e.isMissing?{badge:"D",color:"#ff3b30",type:"deleted"}:e.lastModified>e.displayedModified?{badge:"M",color:"#ff9500",type:"modified"}:t?{badge:"dot",color:"#007AFF",type:"new"}:{badge:null,color:null,type:"normal"}}var wt=b(()=>{"use strict"});function dn(e){let t=e.match(/\\.([^.]+)\$/);return t?t[1].toLowerCase():""}function \$r(e){let t=dn(e);return t==="html"||t==="htm"}function un(e){return dn(e)==="json"}function Ke(e){return dn(e)==="jsonl"}function ge(e){return \$r(e)?{cls:"html",label:"<>"}:un(e)||Ke(e)?{cls:"json",label:"{}"}:{cls:"md",label:"M"}}var Je=b(()=>{"use strict"});function Ue(e){return e&&(e.replace(/\\.(md|markdown|html?)\$/i,"")||e)}var pn=b(()=>{"use strict"});var gn={};de(gn,{getPinnedFiles:()=>fn,isPinned:()=>mn,pinFile:()=>Cr,unpinFile:()=>Ir});function vt(){try{let e=localStorage.getItem(wo);if(!e)return new Set;let t=JSON.parse(e);return Array.isArray(t)?new Set(t):new Set}catch{return new Set}}function vo(e){try{localStorage.setItem(wo,JSON.stringify(Array.from(e)))}catch{}}function mn(e){return vt().has(e)}function Cr(e){let t=vt();t.add(e),vo(t)}function Ir(e){let t=vt();t.delete(e),vo(t)}function fn(){return vt()}var wo,Ve=b(()=>{"use strict";wo="md-viewer:pinned-files"});function kt(e){let t=Array.from(e.values()),n={};return t.forEach(o=>{n[o.name]=(n[o.name]||0)+1}),t.map(o=>{if(n[o.name]===1)return{...o,displayName:o.name};let i=o.path.split("/").filter(Boolean),s=t.filter(a=>a.name===o.name&&a.path!==o.path),r="";for(let a=i.length-2;a>=0;a--){let c=i[a];if(s.every(d=>d.path.split("/").filter(Boolean)[a]!==c)){r=c;break}}return!r&&i.length>=2&&(r=i[i.length-2]),{...o,displayName:r?\`\${o.name} (\${r})\`:o.name}})}var ko=b(()=>{"use strict"});function Te(e,t,n,o){if(t.length===0)return[];if(e==="close-all")return t.map(i=>i.path);if(!n)return[];if(e==="close-others")return t.filter(i=>i.path!==n).map(i=>i.path);if(e==="close-right"){let i=t.findIndex(s=>s.path===n);return i<0?[]:t.slice(i+1).map(s=>s.path)}return t.filter(i=>i.path!==n&&o(i.path)).map(i=>i.path)}var xo=b(()=>{"use strict"});function Nr(){Se||(Se=document.createElement("div"),Se.id="toast-container",Se.className="toast-container",document.body.appendChild(Se))}function Me(e){let t=typeof e=="string"?{message:e,type:"info",duration:3e3}:{type:"info",duration:3e3,...e};Nr();let n=document.createElement("div");n.className=\`toast toast-\${t.type}\`;let o={success:"\\u2713",error:"\\u2717",warning:"\\u26A0",info:"\\u2139"};return n.innerHTML=\`
    <span class="toast-icon">\${o[t.type]}</span>
    <span class="toast-message">\${t.message}</span>
  \`,Se.appendChild(n),requestAnimationFrame(()=>{n.classList.add("toast-show")}),t.duration&&t.duration>0&&setTimeout(()=>{Eo(n)},t.duration),n.addEventListener("click",()=>{Eo(n)}),n}function Eo(e){e.classList.remove("toast-show"),e.classList.add("toast-hide"),setTimeout(()=>{e.remove()},300)}function _(e,t){return Me({message:e,type:"success",duration:t})}function M(e,t){return Me({message:e,type:"error",duration:t})}function To(e,t){return Me({message:e,type:"warning",duration:t})}function hn(e,t){return Me({message:e,type:"info",duration:t})}var Se,Ae=b(()=>{"use strict";Se=null});var xt={};de(xt,{detectPathType:()=>wn,getNearbyFiles:()=>yn,getPathSuggestions:()=>bn,loadFile:()=>Le,openFile:()=>vn,searchFiles:()=>Ge});async function Le(e,t=!1){try{let o=await(await fetch(\`/api/file?path=\${encodeURIComponent(e)}\`)).json();return o.error?(t||M(o.error),null):o}catch(n){return t||M(\`\\u52A0\\u8F7D\\u5931\\u8D25: \${n.message}\`),null}}async function Ge(e,t={}){let n=new URLSearchParams({query:e});t.limit&&Number.isFinite(t.limit)&&n.set("limit",String(t.limit));for(let i of t.roots||[])i.trim()&&n.append("root",i.trim());return(await fetch(\`/api/files?\${n.toString()}\`)).json()}async function yn(e){return(await fetch(\`/api/nearby?path=\${encodeURIComponent(e)}\`)).json()}async function bn(e,t={}){let n=t.kind||"file",o=t.markdownOnly!==!1,i=new URLSearchParams({input:e,kind:n,markdownOnly:o?"true":"false"});return(await fetch(\`/api/path-suggestions?\${i.toString()}\`)).json()}async function wn(e){return(await fetch("/api/detect-path",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e})})).json()}async function vn(e,t=!0){await fetch("/api/open",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,focus:t})})}var he=b(()=>{"use strict";Ae()});function Et(e,t){let n=[],o=-1,i=0,s=null,r=document.createElement("div");r.className="path-autocomplete-panel",r.style.display="none",document.body.appendChild(r);let a=()=>r.style.display!=="none",c=()=>{i+=1,s!==null&&(window.clearTimeout(s),s=null),r.style.display="none",n=[],o=-1},d=()=>{let y=e.getBoundingClientRect();r.style.left=\`\${Math.round(y.left+window.scrollX)}px\`,r.style.top=\`\${Math.round(y.bottom+window.scrollY+4)}px\`,r.style.width=\`\${Math.round(y.width)}px\`},u=()=>{if(n.length===0){c();return}r.innerHTML=n.map((y,h)=>{let k=h===o?"path-autocomplete-item active":"path-autocomplete-item",E=y.type==="directory"?"\\u{1F4C1}":"\\u{1F4C4}";return\`
          <div class="\${k}" data-index="\${h}">
            <span class="path-autocomplete-icon">\${E}</span>
            <span class="path-autocomplete-text">\${Br(y.display)}</span>
          </div>
        \`}).join(""),d(),r.style.display="block"},m=y=>{let h=n[y];if(!h)return;let k=h.type==="directory",E=k&&!h.path.endsWith("/")?\`\${h.path}/\`:h.path;e.value=E,e.dispatchEvent(new Event("input",{bubbles:!0})),e.focus(),e.setSelectionRange(e.value.length,e.value.length),c(),k&&g()},p=async()=>{let y=e.value.trim();if(!y){c();return}if(document.body.classList.contains("quick-action-confirm-visible")){c();return}if(t.shouldActivate&&!t.shouldActivate(y)){c();return}let h=++i;try{let k=await bn(y,{kind:t.kind,markdownOnly:t.markdownOnly});if(h!==i)return;n=k.suggestions||[],o=n.length>0?0:-1,u()}catch{c()}},g=()=>{s!==null&&window.clearTimeout(s),s=window.setTimeout(p,100)};r.addEventListener("mousedown",y=>{y.preventDefault();let h=y.target.closest(".path-autocomplete-item");if(!h)return;let k=Number(h.dataset.index);Number.isNaN(k)||m(k)}),e.addEventListener("focus",g),e.addEventListener("input",g),e.addEventListener("path-autocomplete-hide",c),e.addEventListener("keydown",y=>{let h=y.key;if(a()){if(h==="ArrowDown"){y.preventDefault(),n.length>0&&(o=(o+1)%n.length,u());return}if(h==="ArrowUp"){y.preventDefault(),n.length>0&&(o=(o-1+n.length)%n.length,u());return}if(h==="Tab"){o>=0&&(y.preventDefault(),m(o));return}if(h==="Enter"){if(y.metaKey||y.ctrlKey)return;if(y.preventDefault(),o>=0){m(o);return}c();return}h==="Escape"&&(y.preventDefault(),c())}}),e.addEventListener("blur",()=>{window.setTimeout(c,120)}),window.addEventListener("resize",()=>{a()&&d()}),window.addEventListener("scroll",()=>{a()&&d()},!0)}function Br(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}var kn=b(()=>{"use strict";he()});function Ao(e,t){if(e.type==="file")return t.has(e.path)?null:e;let n=[];for(let o of e.children||[]){let i=Ao(o,t);i&&n.push(i)}return n.length===0&&(e.children||[]).length>0?null:{...e,children:n}}function Hr(e){let t=e.split("/").filter(Boolean);return t[t.length-1]||"workspace"}function Fo(e){let t=Ue(e)||e;return\`<span class="tree-name-full">\${w(t)}</span>\`}function \$o(e,t){if(e){if(e.type==="file"){t.add(e.path);return}(e.children||[]).forEach(n=>\$o(n,t))}}function Co(e){if(e.type==="file")return 1;let t=0;for(let n of e.children||[])t+=Co(n);return e.fileCount=t,t}function Wr(e,t){let n=e.path.replace(/\\/+\$/,""),o={name:e.name,path:n,type:"directory",isExpanded:!0,children:[]},i=new Map([[n,o]]),s=Array.from(new Set(t)).sort((r,a)=>r.localeCompare(a,"zh-CN"));for(let r of s){if(!r.startsWith(\`\${n}/\`))continue;let c=r.slice(n.length+1).split("/").filter(Boolean);if(c.length===0)continue;let d=n,u=o;for(let m=0;m<c.length;m+=1){let p=c[m],g=m===c.length-1;if(d=\`\${d}/\${p}\`,g)(u.children||[]).some(h=>h.path===d)||u.children.push({name:p,path:d,type:"file"});else{let y=i.get(d);y||(y={name:p,path:d,type:"directory",isExpanded:!0,children:[]},i.set(d,y),u.children.push(y)),u=y}}}return Co(o),o}function jr(e,t){if(!t)return l.fileTree.get(e.id);let n=e.path.replace(/\\/+\$/,""),o=\`\${n}/\`,i=Array.from(Ce).filter(s=>s===n||s.startsWith(o));if(i.length!==0)return Wr(e,i)}function Pr(){return l.config.workspaces.map(e=>e.path.trim()).filter(Boolean)}function Mo(){Z="",we="",ee=!1,\$e=!1,Ce=new Set}async function Dr(e,t,n,o){try{let s=await Ge(e,{roots:t,limit:200});if(o!==Tt)return;Z=e,we=n,Ce=new Set((s.files||[]).map(r=>r.path).filter(Boolean)),ee=!1,\$e=!0}catch(s){if(o!==Tt)return;console.error("\\u5DE5\\u4F5C\\u533A\\u641C\\u7D22\\u5931\\u8D25:",s),Z=e,we=n,Ce=new Set,ee=!1,\$e=!0}let{renderSidebar:i}=await Promise.resolve().then(()=>(L(),F));i()}function Rr(e){let t=e.trim();if(!t){Mo();return}if(t.startsWith("/")||t.startsWith("~/")||t.startsWith("~\\\\")){Mo();return}let n=Pr(),o=n.join(\`
\`);if(n.length===0){Z=t,we=o,Ce=new Set,ee=!1,\$e=!0;return}\$e&&!ee&&Z===t&&we===o||ee&&Z===t&&we===o||(Tt+=1,Z=t,we=o,ee=!0,\$e=!1,Ce=new Set,Dr(t,n,o,Tt))}function Io(){let e=document.getElementById(Ye),t=document.getElementById(Lo);if(!t)return;let n=e?.value.trim()||"";t.textContent=n||"\\u8DEF\\u5F84\\u9884\\u89C8\\uFF1A\\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u540E\\u8FD9\\u91CC\\u4F1A\\u663E\\u793A\\u5B8C\\u6574\\u8DEF\\u5F84"}function Or(){let e=document.getElementById(xn);if(e)return e;let t=document.createElement("div");t.id=xn,t.className="sync-dialog-overlay add-workspace-overlay",t.innerHTML=\`
    <div class="sync-dialog add-workspace-dialog">
      <div class="sync-dialog-header">
        <div class="sync-dialog-title">\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A</div>
        <button class="sync-dialog-close" onclick="closeAddWorkspaceDialog()">\\xD7</button>
      </div>
      <div class="sync-dialog-body">
        <div class="sync-dialog-field">
          <label class="sync-dialog-label">\\u{1F4C1} \\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84</label>
          <textarea
            id="\${Ye}"
            class="sync-dialog-input workspace-path-input"
            rows="3"
            placeholder="/Users/huanghao/workspace/md-viewer"
          ></textarea>
          <div class="workspace-path-hint">\\u652F\\u6301\\u7C98\\u8D34\\u957F\\u8DEF\\u5F84\\u3002\\u6309 Ctrl/Cmd + Enter \\u5FEB\\u901F\\u786E\\u8BA4\\u3002</div>
          <div id="\${Lo}" class="workspace-path-preview">\\u8DEF\\u5F84\\u9884\\u89C8\\uFF1A\\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u540E\\u8FD9\\u91CC\\u4F1A\\u663E\\u793A\\u5B8C\\u6574\\u8DEF\\u5F84</div>
        </div>
      </div>
      <div class="sync-dialog-footer add-workspace-footer">
        <button class="sync-dialog-btn" onclick="closeAddWorkspaceDialog()">\\u53D6\\u6D88</button>
        <button class="sync-dialog-btn sync-dialog-btn-primary" onclick="confirmAddWorkspaceDialog()">\\u6DFB\\u52A0</button>
      </div>
    </div>
  \`,document.body.appendChild(t),t.addEventListener("click",o=>{o.target===t&&St()});let n=t.querySelector(\`#\${Ye}\`);return n&&(Et(n,{kind:"directory",markdownOnly:!1}),n.addEventListener("input",Io),n.addEventListener("keydown",o=>{(o.metaKey||o.ctrlKey)&&o.key==="Enter"&&(o.preventDefault(),window.confirmAddWorkspaceDialog()),o.key==="Escape"&&(o.preventDefault(),St())})),t}function qr(){Or().classList.add("show");let t=document.getElementById(Ye);t&&(t.value="",Io(),t.focus())}function St(){let e=document.getElementById(xn);e&&e.classList.remove("show")}async function zr(){try{let e=document.getElementById(Ye),t=e?.value.trim()||"";if(!t){To("\\u8BF7\\u8F93\\u5165\\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84"),e?.focus();return}let n=Hr(t),{addWorkspace:o}=await Promise.resolve().then(()=>(Ze(),Po)),i=o(n,t),{renderSidebar:s}=await Promise.resolve().then(()=>(L(),F));s(),St(),_(\`\\u5DF2\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A: \${i.name}\`,2e3)}catch(e){console.error("\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",e),M(\`\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25: \${e?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)}}function No(){if(l.config.sidebarTab==="focus")return jo();let e=l.searchQuery.trim().toLowerCase();return Rr(e),\`\${_r(e)}\`}function _r(e){let t=l.config.workspaces,n=t.map((o,i)=>Jr(o,i,t.length,e)).filter(Boolean).join("");return\`
    <div class="workspace-section">
      \${t.length===0?Kr():""}
      \${t.length>0&&!n?'<div class="empty-workspace"><p>\\u672A\\u627E\\u5230\\u5339\\u914D\\u5185\\u5BB9</p></div>':""}
      \${n}
    </div>
  \`}function Kr(){return\`
    <div class="empty-workspace">
      <p>\\u6682\\u65E0\\u5DE5\\u4F5C\\u533A</p>
      <p style="font-size: 12px; color: #57606a; margin-top: 8px;">
        \\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u76EE\\u5F55\\u8DEF\\u5F84\\u540E\\u56DE\\u8F66\\u6DFB\\u52A0
      </p>
    </div>
  \`}function Jr(e,t,n,o){let i=l.currentWorkspace===e.id,s=o?jr(e,o):l.fileTree.get(e.id),r=s;if(s){let h=Ie(s,e.path);h.size>0&&(r=Ao(s,h)??void 0)}let a=o?!0:e.isExpanded,c=a?"\\u25BC":"\\u25B6",d=t>0,u=t<n-1,m=!o||e.name.toLowerCase().includes(o)||e.path.toLowerCase().includes(o),p=!!r&&!!r.children&&r.children.length>0,g=a?Vr(e.id,e.path,r,o):"";return o&&!m&&!p&&!!!g?"":\`
    <div class="workspace-item">
      <div class="workspace-header \${i?"active":""}" onclick="handleWorkspaceToggle('\${v(e.id)}')">
        <span class="workspace-toggle">\${c}</span>
        <span class="workspace-icon">\\u{1F4C1}</span>
        <span class="workspace-name">\${w(e.name)}</span>
        \${Qe===e.id?\`
          <div class="workspace-remove-actions" onclick="event.stopPropagation()">
            \${d?\`
            <button
              class="workspace-order-btn"
              title="\\u4E0A\\u79FB"
              onclick="handleMoveWorkspaceUp('\${v(e.id)}')"
            >\\u2191</button>
            \`:""}
            \${u?\`
            <button
              class="workspace-order-btn"
              title="\\u4E0B\\u79FB"
              onclick="handleMoveWorkspaceDown('\${v(e.id)}')"
            >\\u2193</button>
            \`:""}
            <button
              class="workspace-remove-confirm"
              title="\\u786E\\u8BA4\\u79FB\\u9664"
              onclick="handleConfirmRemoveWorkspace('\${v(e.id)}')"
            >\\u5220</button>
          </div>
        \`:\`
          <div class="workspace-remove-actions" onclick="event.stopPropagation()">
            \${d?\`
            <button
              class="workspace-order-btn"
              title="\\u4E0A\\u79FB"
              onclick="handleMoveWorkspaceUp('\${v(e.id)}')"
            >\\u2191</button>
            \`:""}
            \${u?\`
            <button
              class="workspace-order-btn"
              title="\\u4E0B\\u79FB"
              onclick="handleMoveWorkspaceDown('\${v(e.id)}')"
            >\\u2193</button>
            \`:""}
          <button
            class="workspace-remove"
            title="\\u79FB\\u9664\\u5DE5\\u4F5C\\u533A"
            onclick="event.stopPropagation();handleAskRemoveWorkspace('\${v(e.id)}')"
          >
            \\xD7
          </button>
          </div>
        \`}
      </div>
      \${a?Ur(e.id,r,o):""}
      \${g}
    </div>
  \`}function Ur(e,t,n){return n&&ee&&Z===n?\`
      <div class="file-tree loading">
        <div class="tree-loading">\\u641C\\u7D22\\u4E2D...</div>
      </div>
    \`:Xe.has(e)?\`
      <div class="file-tree loading">
        <div class="tree-loading">\\u52A0\\u8F7D\\u4E2D...</div>
      </div>
    \`:Fe.has(e)?\`
      <div class="file-tree empty">
        <div class="tree-empty" onclick="retryWorkspaceScan('\${v(e)}')" style="cursor: pointer;">\\u52A0\\u8F7D\\u5931\\u8D25\\uFF0C\\u70B9\\u51FB\\u91CD\\u8BD5</div>
      </div>
    \`:t?!t.children||t.children.length===0?\`
      <div class="file-tree empty">
        <div class="tree-empty">\${n?"\\u672A\\u627E\\u5230\\u5339\\u914D\\u6587\\u4EF6":"\\u6B64\\u76EE\\u5F55\\u4E0B\\u6CA1\\u6709 Markdown/HTML \\u6587\\u4EF6"}</div>
      </div>
    \`:\`
    <div class="file-tree">
      \${t.children.map(o=>Bo(e,o,1)).join("")}
    </div>
  \`:\`
      <div class="file-tree empty">
        <div class="tree-empty">\${n?"\\u672A\\u627E\\u5230\\u5339\\u914D\\u6587\\u4EF6":"\\u76EE\\u5F55\\u6682\\u4E0D\\u53EF\\u7528"}</div>
      </div>
    \`}function Bo(e,t,n){let o=4+n*8,i=l.currentFile===t.path;if(t.type==="file"){let c=Ee(t.path),d=W(t.path),u=!!c?.isMissing||Ut(t.path),m=ge(t.path),p=_e(t.path),g="&nbsp;";if(c){let E=z(c,d);E.badge==="dot"?g='<span class="new-dot"></span>':E.badge&&(g=\`<span class="status-badge status-\${E.type}" style="color: \${E.color}">\${E.badge}</span>\`)}else u?g='<span class="status-badge status-deleted" style="color: #cf222e">D</span>':p?g='<span class="status-badge status-modified" style="color: #ff9500">M</span>':d&&(g='<span class="new-dot"></span>');let y=["tree-item","file-node",u?"missing":"",i?"current":""].filter(Boolean).join(" "),h=mn(t.path),k=\`<button
  class="tree-pin-btn\${h?" active":""}"
  title="\${h?"\\u53D6\\u6D88\\u56FA\\u5B9A\\u5230\\u7126\\u70B9\\u89C6\\u56FE":"\\u56FA\\u5B9A\\u5230\\u7126\\u70B9\\u89C6\\u56FE"}"
  onclick="event.stopPropagation();\${h?"handleUnpinFile":"handlePinFile"}('\${v(t.path)}')"
>\\u{1F4CC}</button>\`;return\`
      <div class="tree-node">
        <div class="\${y}"
             onclick="handleFileClick('\${v(t.path)}')">
          <span class="tree-indent" style="width: \${o}px"></span>
          <span class="tree-toggle"></span>
          <span class="file-type-icon \${m.cls}">\${w(m.label)}</span>
          <span class="tree-status-inline">\${g}</span>
          <span class="tree-name" title="\${v(t.name)}">\${Fo(t.name)}</span>
          \${k}
        </div>
      </div>
    \`}let s=t.isExpanded!==!1,r=s?"\\u25BC":"\\u25B6",a=t.children&&t.children.length>0;return\`
    <div class="tree-node">
      <div class="tree-item directory-node">
        <span class="tree-indent" style="width: \${o}px"></span>
        <span class="tree-toggle" onclick="\${a?\`event.stopPropagation();handleNodeClick('\${v(e)}', '\${v(t.path)}')\`:""}">\${a?r:""}</span>
        <span class="tree-name" onclick="\${a?\`event.stopPropagation();handleNodeClick('\${v(e)}', '\${v(t.path)}')\`:""}">\${w(t.name)}</span>
        \${t.fileCount?\`<span class="tree-count">\${t.fileCount}</span>\`:""}
      </div>
      \${s&&a?\`
        <div class="file-tree">
          \${t.children.map(c=>Bo(e,c,n+1)).join("")}
        </div>
      \`:""}
    </div>
  \`}function Vr(e,t,n,o){let i=new Set;\$o(n,i);let s=\`\${t}/\`,r=on().filter(u=>!u.isMissing||!u.path.startsWith(s)||i.has(u.path)?!1:o?u.name.toLowerCase().includes(o)||u.path.toLowerCase().includes(o):!0),a=new Set(r.map(u=>u.path)),c=Vt(t).filter(u=>!a.has(u)).filter(u=>!i.has(u)).filter(u=>{if(!o)return!0;let m=u.toLowerCase(),p=(u.split("/").pop()||"").toLowerCase();return m.includes(o)||p.includes(o)});return r.length===0&&c.length===0?"":\`
    <div class="tree-missing-section">
      <div class="tree-missing-title">\\u5DF2\\u5220\\u9664</div>
      \${[...r.map(u=>({path:u.path,name:u.path.split("/").pop()||u.name,isCurrent:l.currentFile===u.path,hasRetry:!0,hasClose:!0})),...c.map(u=>({path:u,name:u.split("/").pop()||u,isCurrent:l.currentFile===u,hasRetry:!1,hasClose:!1}))].map(u=>{let m=ge(u.path);return\`
          <div class="tree-item file-node missing \${u.isCurrent?"current":""}" onclick="handleFileClick('\${v(u.path)}')">
            <span class="tree-indent" style="width: 12px"></span>
            <span class="tree-toggle"></span>
            <span class="file-type-icon \${m.cls}">\${w(m.label)}</span>
            <span class="tree-status-inline"><span class="status-badge status-deleted">D</span></span>
            <span class="tree-name" title="\${v(u.name)}">\${Fo(u.name)}</span>
            \${u.hasRetry?\`<button class="tree-inline-action" title="\\u91CD\\u8BD5\\u52A0\\u8F7D" onclick="event.stopPropagation(); handleRetryMissingFile('\${v(u.path)}')">\\u21BB</button>\`:""}
            \${u.hasClose?\`<button class="tree-inline-action danger" title="\\u5173\\u95ED\\u6587\\u4EF6" onclick="event.stopPropagation(); handleCloseFile('\${v(u.path)}')">\\xD7</button>\`:""}
          </div>
        \`}).join("")}
    </div>
  \`}function Ho(){So||(So=!0,document.addEventListener("click",async e=>{if(!Qe)return;let t=e.target;if(!t||t.closest(".workspace-remove-actions")||t.closest(".workspace-remove"))return;Qe=null;let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n()})),window.handleWorkspaceToggle=async e=>{let t=l.config.workspaces.find(o=>o.id===e);if(!t)return;if(l.currentWorkspace=e,l.searchQuery.trim()){let{renderSidebar:o}=await Promise.resolve().then(()=>(L(),F));o();return}if(Sn(e),t.isExpanded&&!l.fileTree.has(e)){Xe.add(e),Fe.delete(e);let{renderSidebar:o}=await Promise.resolve().then(()=>(L(),F));o();let i=await K(e);Xe.delete(e),i?Fe.delete(e):(Fe.add(e),M(\`\\u5DE5\\u4F5C\\u533A\\u626B\\u63CF\\u5931\\u8D25\\uFF1A\${t.name}\`))}let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n()},window.retryWorkspaceScan=async e=>{Xe.add(e),Fe.delete(e);let{renderSidebar:t}=await Promise.resolve().then(()=>(L(),F));t();let n=await K(e);Xe.delete(e),n||(Fe.add(e),M("\\u91CD\\u8BD5\\u5931\\u8D25\\uFF0C\\u8BF7\\u68C0\\u67E5\\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84\\u662F\\u5426\\u53EF\\u8BBF\\u95EE")),t()},window.handleAskRemoveWorkspace=async e=>{Qe=e;let{renderSidebar:t}=await Promise.resolve().then(()=>(L(),F));t()},window.handleConfirmRemoveWorkspace=async e=>{let t=l.config.workspaces.find(o=>o.id===e);if(!t)return;Tn(e),Qe=null;let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n(),_(\`\\u5DF2\\u79FB\\u9664\\u5DE5\\u4F5C\\u533A: \${t.name}\`,2e3)},window.handleNodeClick=async(e,t)=>{Mn(e,t);let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n()},window.handleFileClick=async e=>{gt(e),P(e);let{loadFile:t}=await Promise.resolve().then(()=>(he(),xt));if(bt(e))window.switchFile?.(e);else{let n=await t(e,!0);if(!n){let{markFileMissing:s}=await Promise.resolve().then(()=>(I(),me));s(e,!0),(await Promise.resolve().then(()=>(be(),ye))).renderAll(),M("\\u6587\\u4EF6\\u5DF2\\u5220\\u9664\\uFF0C\\u5DF2\\u6807\\u8BB0\\u4E3A D\\uFF08\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\uFF09");return}let{addOrUpdateFile:o}=await Promise.resolve().then(()=>(I(),me));o(n,!0),(await Promise.resolve().then(()=>(be(),ye))).renderAll()}},window.handleCloseFile=async e=>{let{removeFile:t}=await Promise.resolve().then(()=>(I(),me));t(e),(await Promise.resolve().then(()=>(be(),ye))).renderAll()},window.handleRetryMissingFile=async e=>{let{loadFile:t}=await Promise.resolve().then(()=>(he(),xt)),{addOrUpdateFile:n}=await Promise.resolve().then(()=>(I(),me)),o=await t(e);if(!o)return;n(o,l.currentFile===e),(await Promise.resolve().then(()=>(be(),ye))).renderAll(),_("\\u6587\\u4EF6\\u5DF2\\u91CD\\u65B0\\u52A0\\u8F7D",2e3)},window.showAddWorkspaceDialog=qr,window.closeAddWorkspaceDialog=St,window.confirmAddWorkspaceDialog=zr,window.handleMoveWorkspaceUp=async e=>{Mt(e,-1);let{renderSidebar:t}=await Promise.resolve().then(()=>(L(),F));t()},window.handleMoveWorkspaceDown=async e=>{Mt(e,1);let{renderSidebar:t}=await Promise.resolve().then(()=>(L(),F));t()},window.handleFocusFileClick=async e=>{gt(e),P(e);let{loadFile:t}=await Promise.resolve().then(()=>(he(),xt));if(bt(e))window.switchFile?.(e);else{let n=await t(e,!0);if(!n){let{markFileMissing:s}=await Promise.resolve().then(()=>(I(),me));s(e,!0),(await Promise.resolve().then(()=>(be(),ye))).renderAll(),M("\\u6587\\u4EF6\\u5DF2\\u5220\\u9664\\uFF0C\\u5DF2\\u6807\\u8BB0\\u4E3A D\\uFF08\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\uFF09");return}let{addOrUpdateFile:o}=await Promise.resolve().then(()=>(I(),me));o(n,!0),(await Promise.resolve().then(()=>(be(),ye))).renderAll()}},window.handleUnpinFile=async e=>{let{unpinFile:t}=await Promise.resolve().then(()=>(Ve(),gn));t(e);let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n()},window.handlePinFile=async e=>{let{pinFile:t}=await Promise.resolve().then(()=>(Ve(),gn));t(e);let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n()},window.handleFocusWorkspaceToggle=e=>{},window.setFocusWindowKey=e=>{l.config.focusWindowKey=e,Promise.resolve().then(()=>(xe(),ro)).then(({saveConfig:t})=>t(l.config)),Promise.resolve().then(()=>(L(),F)).then(({renderSidebar:t})=>t())}}var xn,Ye,Lo,Qe,So,Xe,Fe,Z,we,ee,\$e,Ce,Tt,Wo=b(()=>{"use strict";I();En();X();he();fe();wt();Je();pn();Ae();kn();Ze();X();Ve();At();xn="addWorkspaceDialogOverlay",Ye="addWorkspacePathInput",Lo="addWorkspacePathPreview",Qe=null,So=!1,Xe=new Set,Fe=new Set,Z="",we="",ee=!1,\$e=!1,Ce=new Set,Tt=0});function Do(e){let t=[0];for(let n of e){let o=n.nodeValue?.length??0;t.push(t[t.length-1]+o)}return{nodes:e,cumulative:t,totalLength:t[t.length-1]}}function Ro(e,t){if(e.nodes.length===0)return null;if(t>=e.totalLength){let i=e.nodes[e.nodes.length-1];return{node:i,offset:i.nodeValue?.length??0}}let n=0,o=e.nodes.length-1;for(;n<o;){let i=n+o+1>>1;e.cumulative[i]<=t?n=i:o=i-1}return{node:e.nodes[n],offset:t-e.cumulative[n]}}function Oo(e){let t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),n=[],o;for(;o=t.nextNode();)o.nodeValue&&o.nodeValue.length>0&&n.push(o);return n}var qo=b(()=>{"use strict"});async function et(e){let t=await e.json().catch(()=>null);if(!e.ok)throw new Error(t?.error||\`HTTP \${e.status}\`);return t}async function zo(e){let t=await fetch(\`/api/annotations?path=\${encodeURIComponent(e)}\`),n=await et(t);return Array.isArray(n?.annotations)?n.annotations:[]}async function _o(e,t){let n=await fetch("/api/annotations/item",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,annotation:t})}),o=await et(n);if(o?.success!==!0||!o?.annotation)throw new Error(o?.error||"\\u4FDD\\u5B58\\u8BC4\\u8BBA\\u5931\\u8D25");return o.annotation}async function Ko(e,t,n,o){let i=await fetch("/api/annotations/reply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,...t,text:n,author:o})}),s=await et(i);if(s?.success!==!0||!s?.annotation)throw new Error(s?.error||"\\u56DE\\u590D\\u8BC4\\u8BBA\\u5931\\u8D25");return s.annotation}async function Jo(e,t){let n=await fetch("/api/annotations/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,...t})}),o=await et(n);if(o?.success!==!0)throw new Error(o?.error||"\\u5220\\u9664\\u8BC4\\u8BBA\\u5931\\u8D25")}async function Uo(e,t,n){let o=await fetch("/api/annotations/status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,...t,status:n})}),i=await et(o);if(i?.success!==!0||!i?.annotation)throw new Error(i?.error||"\\u66F4\\u65B0\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25");return i.annotation}var Vo=b(()=>{"use strict"});function Gr(e,t){if(!t)return[];let n=[],o=e.indexOf(t);for(;o>=0;)n.push(o),o=e.indexOf(t,o+1);return n}function Qr(e,t,n,o){let i=0,s=Math.max(0,o.start||0),r=Math.abs(n-s);if(i+=Math.max(0,1e3-Math.min(1e3,r)),o.quotePrefix&&e.slice(Math.max(0,n-o.quotePrefix.length),n)===o.quotePrefix&&(i+=500),o.quoteSuffix){let a=n+t.length;e.slice(a,a+o.quoteSuffix.length)===o.quoteSuffix&&(i+=500)}return i}function Go(e,t){if(!e||!t.quote||t.length<=0)return{start:t.start||0,length:Math.max(1,t.length||t.quote?.length||1),confidence:0,status:"unanchored"};let n=Math.max(0,t.start||0),o=n+Math.max(1,t.length||t.quote.length);if(o<=e.length&&e.slice(n,o)===t.quote)return{start:n,length:t.length,confidence:1,status:"anchored"};let i=Gr(e,t.quote);if(i.length===0)return{start:n,length:Math.max(1,t.length||t.quote.length),confidence:0,status:"unanchored"};if(i.length===1)return{start:i[0],length:t.quote.length,confidence:.8,status:"anchored"};let s=i[0],r=Number.NEGATIVE_INFINITY;for(let a of i){let c=Qr(e,t.quote,a,t);c>r&&(r=c,s=a)}return{start:s,length:t.quote.length,confidence:.6,status:"anchored"}}var Qo=b(()=>{"use strict"});function Zr(){try{return typeof localStorage>"u"?"default":localStorage.getItem("md-viewer:annotation-density")==="simple"?"simple":"default"}catch{return"default"}}function es(e){return e.reduce((n,o)=>typeof o.serial!="number"||!Number.isFinite(o.serial)?n:Math.max(n,o.serial),0)+1}function ts(e){let t=Number.isFinite(e.createdAt)?e.createdAt:Date.now(),o=(Array.isArray(e.thread)?e.thread:[]).map((i,s)=>{if(!i||typeof i!="object")return null;let r=String(i.note||"").trim();if(!r)return null;let c=String(i.type||(s===0?"comment":"reply"))==="reply"?"reply":"comment",d=Number(i.createdAt),u=Number.isFinite(d)?Math.floor(d):t+s;return{id:String(i.id||"").trim()||\`\${c}-\${u}-\${Math.random().toString(16).slice(2,8)}\`,type:c,note:r,createdAt:u}}).filter(i=>!!i).sort((i,s)=>i.createdAt-s.createdAt);if(o.length===0){let i=String(e.note||"").trim();return i?[{id:\`c-\${e.id||t}\`,type:"comment",note:i,createdAt:t}]:[]}o[0].type="comment";for(let i=1;i<o.length;i+=1)o[i].type="reply";return o}function si(e){let t=ts(e),n=JSON.stringify(e.thread||[]),o=JSON.stringify(t);return e.thread=t,e.note=t[0]?.note||e.note||"",n!==o}function ns(e){let t=!1;for(let n of e)si(n)&&(t=!0);return t}function os(e){let t=!1,n=e.map((i,s)=>({ann:i,index:s}));n.sort((i,s)=>{let r=Number.isFinite(i.ann.createdAt)?i.ann.createdAt:0,a=Number.isFinite(s.ann.createdAt)?s.ann.createdAt:0;return r!==a?r-a:i.index-s.index});let o=1;for(let{ann:i}of n){if(typeof i.serial=="number"&&Number.isFinite(i.serial)&&i.serial>0){o=Math.max(o,i.serial+1);continue}i.serial=o,o+=1,t=!0}return t}function ai(e){let t=f.annotations.findIndex(n=>n.id===e.id);if(t>=0){f.annotations[t]=e;return}f.annotations.push(e)}function An(e,t,n="\\u8BC4\\u8BBA\\u4FDD\\u5B58\\u5931\\u8D25"){_o(e,t).then(o=>{f.currentFilePath===e&&(ai(o),\$(e),N())}).catch(o=>{M(\`\${n}: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)})}function li(e,t,n="\\u8BC4\\u8BBA\\u4FDD\\u5B58\\u5931\\u8D25"){for(let o of t)An(e,o,n)}function ci(e){if(f.currentFilePath=e,e?(f.annotations=[],is(e)):f.annotations=[],f.pinnedAnnotationId=null,f.activeAnnotationId=null,f.pendingAnnotation=null,f.pendingAnnotationFilePath=null,tt(),Be(!0),ie(!0),e){let n=pi()[e]===!0;Ne(!n)}else Ne(!0)}async function is(e){try{let t=await zo(e);if(!Array.isArray(t)||f.currentFilePath!==e)return;f.annotations=t;let n=ns(f.annotations),o=os(f.annotations);(n||o)&&li(e,f.annotations),\$(e),N()}catch(t){if(f.currentFilePath!==e)return;M(\`\\u8BC4\\u8BBA\\u52A0\\u8F7D\\u5931\\u8D25: \${t?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)}}function T(){return{sidebar:document.getElementById("annotationSidebar"),sidebarResizer:document.getElementById("annotationSidebarResizer"),reader:document.getElementById("reader"),content:document.getElementById("content"),composer:document.getElementById("annotationComposer"),composerHeader:document.getElementById("annotationComposerHeader"),composerNote:document.getElementById("composerNote"),quickAdd:document.getElementById("annotationQuickAdd"),popover:document.getElementById("annotationPopover"),popoverTitle:document.getElementById("popoverTitle"),popoverNote:document.getElementById("popoverNote"),popoverResolveBtn:document.getElementById("popoverResolveBtn"),popoverPrevBtn:document.getElementById("popoverPrevBtn"),popoverNextBtn:document.getElementById("popoverNextBtn"),annotationList:document.getElementById("annotationList"),annotationCount:document.getElementById("annotationCount"),filterMenu:document.getElementById("annotationFilterMenu"),filterToggle:document.getElementById("annotationFilterToggle"),densityToggle:document.getElementById("annotationDensityToggle"),closeToggle:document.getElementById("annotationSidebarClose"),floatingOpenBtn:document.getElementById("annotationFloatingOpenBtn")}}function Ln(e){let t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),n=[],o;for(;o=t.nextNode();)o.nodeValue&&o.nodeValue.length>0&&n.push(o);return n}function Xo(e,t,n){let o=Ln(e),i=0;for(let s of o){if(s===t)return i+n;i+=s.nodeValue?.length||0}return-1}function Lt(e,t,n){if(n)return Ro(n,t);let o=Ln(e),i=0;for(let r of o){let a=r.nodeValue?.length||0,c=i+a;if(t<=c)return{node:r,offset:Math.max(0,t-i)};i=c}if(o.length===0)return null;let s=o[o.length-1];return{node:s,offset:s.nodeValue?.length||0}}function Ft(e,t,n){return Math.max(t,Math.min(n,e))}function Fn(e,t,n){let s=Ft(t,8,window.innerWidth-360-8),r=Ft(n,8,window.innerHeight-220-8);e.style.left=\`\${s}px\`,e.style.top=\`\${r}px\`}function di(e){return Ln(e).map(t=>t.nodeValue||"").join("")}function ne(e){return e.status==="resolved"}function \$n(e){return e.status==="unanchored"?"orphan":(e.confidence||0)>=.95?"exact":"reanchored"}function rs(e,t){let n=e.status==="unanchored"||\$n(e)==="orphan";return t==="all"?!0:t==="open"?!ne(e)&&!n:t==="resolved"?ne(e)&&!n:t==="orphan"?n:!0}function ui(){return f.currentFilePath}function j(){let e=f.currentFilePath,t=document.getElementById("content")?.getAttribute("data-current-file")||null;return e?t?t===e?e:null:e:null}function \$t(e,t){if(!e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return!1;let n=e.key.toLowerCase(),{value:o,selectionStart:i,selectionEnd:s}=t;if(i===null||s===null)return!1;let r=d=>{t.selectionStart=d,t.selectionEnd=d},a=d=>{let u=o.lastIndexOf(\`
\`,d-1);return u===-1?0:u+1},c=d=>{let u=o.indexOf(\`
\`,d);return u===-1?o.length:u};switch(n){case"a":return r(a(i)),!0;case"e":return r(c(i)),!0;case"b":return r(Math.max(0,i-1)),!0;case"f":return r(Math.min(o.length,i+1)),!0;case"n":{let d=c(i);return r(d===o.length?d:Math.min(o.length,d+1+(i-a(i)))),!0}case"p":{let d=a(i);if(d===0)return r(0),!0;let u=a(d-1),m=d-1-u;return r(u+Math.min(i-d,m)),!0}case"d":return i<o.length&&(t.value=o.slice(0,i)+o.slice(i+1),r(i),t.dispatchEvent(new Event("input"))),!0;case"k":{let d=c(i),u=i===d&&d<o.length?d+1:d;return t.value=o.slice(0,i)+o.slice(u),r(i),t.dispatchEvent(new Event("input")),!0}case"u":{let d=a(i);return t.value=o.slice(0,d)+o.slice(i),r(d),t.dispatchEvent(new Event("input")),!0}case"w":{let d=i;for(;d>0&&/\\s/.test(o[d-1]);)d--;for(;d>0&&!/\\s/.test(o[d-1]);)d--;return t.value=o.slice(0,d)+o.slice(i),r(d),t.dispatchEvent(new Event("input")),!0}case"h":return i>0&&(t.value=o.slice(0,i-1)+o.slice(i),r(i-1),t.dispatchEvent(new Event("input"))),!0;default:return!1}}function te(e){return e==="up"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4l4 4H4z"/></svg>':e==="down"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12l-4-4h8z"/></svg>':e==="check"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.4 11.2L3.5 8.3l1.1-1.1 1.8 1.8 5-5 1.1 1.1z"/></svg>':e==="trash"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2h4l1 1h3v1H2V3h3l1-1zm-1 4h1v7H5V6zm3 0h1v7H8V6zm3 0h1v7h-1V6z"/></svg>':e==="comment"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h12v9H8l-3 3v-3H2z"/></svg>':e==="list"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h10v1H3zm0 4h10v1H3zm0 4h10v1H3z"/></svg>':e==="filter"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12L9.5 8v4.5l-3-1.5V8z"/></svg>':e==="edit"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.5 2.5a1.5 1.5 0 012.1 2.1L5 13.2l-3 .8.8-3 8.7-8.5z"/></svg>':e==="reopen"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 1.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zM6 5.5l4 2.5-4 2.5V5.5z"/></svg>':'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 4.2L8 8l3.8-3.8 1 1L9 9l3.8 3.8-1 1L8 10l-3.8 3.8-1-1L7 9 3.2 5.2z"/></svg>'}function Nt(){return[...f.annotations].filter(e=>rs(e,f.filter)).sort((e,t)=>e.start-t.start)}function ss(){let e=T();if(e.filterMenu?.querySelectorAll(".annotation-filter-item[data-filter]").forEach(t=>{let n=t;n.classList.toggle("is-active",n.getAttribute("data-filter")===f.filter)}),e.densityToggle&&(e.densityToggle.classList.toggle("is-simple",f.density==="simple"),e.densityToggle.title=f.density==="simple"?"\\u5207\\u6362\\u5230\\u9ED8\\u8BA4\\u5217\\u8868":"\\u5207\\u6362\\u5230\\u6781\\u7B80\\u5217\\u8868"),e.filterToggle){let t={all:"\\u7B5B\\u9009\\uFF1A\\u5168\\u90E8",open:"\\u7B5B\\u9009\\uFF1A\\u672A\\u89E3\\u51B3",resolved:"\\u7B5B\\u9009\\uFF1A\\u5DF2\\u89E3\\u51B3",orphan:"\\u7B5B\\u9009\\uFF1A\\u5B9A\\u4F4D\\u5931\\u8D25"};e.filterToggle.title=t[f.filter]}}function as(){let e=T();e.annotationCount&&(e.annotationCount.textContent=String(Nt().length))}function Ne(e){let t=T();t.sidebar&&(t.sidebar.classList.toggle("collapsed",e),document.body.classList.toggle("annotation-sidebar-collapsed",e),e&&(t.filterMenu?.classList.add("hidden"),Be(!0),ie(!0)))}function pi(){try{let e=localStorage.getItem(ri);if(!e)return{};let t=JSON.parse(e);return t&&typeof t=="object"?t:{}}catch{return{}}}function ls(e){localStorage.setItem(ri,JSON.stringify(e))}function mi(e){if(!f.currentFilePath)return;let t=pi();t[f.currentFilePath]=e,ls(t)}function cs(e){return Math.max(Xr,Math.min(Yr,Math.round(e)))}function fi(e){let t=cs(e);document.documentElement.style.setProperty("--annotation-sidebar-width",\`\${t}px\`),localStorage.setItem(oi,String(t))}function ds(){let e=Number(localStorage.getItem(oi)),t=Number.isFinite(e)&&e>0?e:ii;fi(t)}function oe(){let e=T();if(!e.sidebar)return;let t=document.getElementById("tabs"),n=Math.max(0,Math.round(t?.getBoundingClientRect().bottom||84)),o=Math.max(0,window.innerHeight-n);e.sidebar.style.top=\`\${n}px\`,e.sidebar.style.height=\`\${o}px\`,e.sidebarResizer&&(e.sidebarResizer.style.top=\`\${n}px\`,e.sidebarResizer.style.height=\`\${o}px\`),e.floatingOpenBtn&&(e.floatingOpenBtn.style.top=\`\${n+6}px\`)}function Yo(){Ne(!1),mi(!0),oe(),Nn()}function Zo(){Ne(!0),mi(!1)}function us(){let e=T().sidebar;e&&Ne(!e.classList.contains("collapsed"))}function gi(){let e=T();return e.filterMenu&&!e.filterMenu.classList.contains("hidden")?(e.filterMenu.classList.add("hidden"),!0):e.quickAdd&&!e.quickAdd.classList.contains("hidden")?(Be(!0),!0):e.composer&&!e.composer.classList.contains("hidden")?(tt(),!0):e.popover&&!e.popover.classList.contains("hidden")?(f.pinnedAnnotationId=null,ie(!0),!0):!1}function ps(e,t){return e==="resolved"?"resolved":t}function ms(e,t,n){let o=T();if(!o.quickAdd)return;o.composer&&!o.composer.classList.contains("hidden")&&tt(),f.pendingAnnotation={...n,note:"",createdAt:Date.now()},f.pendingAnnotationFilePath=o.content?.getAttribute("data-current-file")||f.currentFilePath;let i=30,s=30,r=Ft(e,8,window.innerWidth-i-8),a=Ft(t,8,window.innerHeight-s-8);o.quickAdd.style.left=\`\${r}px\`,o.quickAdd.style.top=\`\${a}px\`,o.quickAdd.classList.remove("hidden")}function Be(e=!1){let t=T();t.quickAdd&&(t.quickAdd.classList.add("hidden"),e&&(Cn(),f.pendingAnnotation=null,f.pendingAnnotationFilePath=null))}function fs(e,t){let n=T();if(!f.pendingAnnotation||!n.composer||!n.composerNote)return;ys(),n.composerNote.value="",bi(n.composerNote);let o=typeof e=="number"?e:n.quickAdd?Number.parseFloat(n.quickAdd.style.left||"0"):0,i=typeof t=="number"?t:n.quickAdd?Number.parseFloat(n.quickAdd.style.top||"0"):0;Fn(n.composer,o,i+34),n.composer.classList.remove("hidden"),Be(!1),n.composerNote.focus()}function gs(){let e=T();e.composer&&e.composer.classList.add("hidden")}function hs(){let e=T();if(!e.composer||!f.pendingAnnotation)return;let n=document.getElementById("reader")?.querySelector(".annotation-mark-temp");if(n){let o=n.getBoundingClientRect();Fn(e.composer,o.right+6,o.top-8)}e.composer.classList.remove("hidden"),e.composerNote?.focus()}function tt(){let e=T();e.composer&&(Cn(),f.pendingAnnotation=null,f.pendingAnnotationFilePath=null,e.composerNote&&(e.composerNote.value=""),e.composer.classList.add("hidden"))}function Cn(){let e=document.getElementById("reader");if(!e)return;let t=Array.from(e.querySelectorAll(".annotation-mark-temp"));for(let n of t){let o=n.parentNode;for(;n.firstChild;)o?.insertBefore(n.firstChild,n);o?.removeChild(n)}}function ys(){let e=T();if(!e.reader||!f.pendingAnnotation)return;Cn();let t=f.pendingAnnotation,n=Lt(e.reader,t.start),o=Lt(e.reader,t.start+t.length);if(!(!n||!o)&&!(n.node===o.node&&n.offset===o.offset)){if(n.node===o.node){let i=document.createRange();i.setStart(n.node,n.offset),i.setEnd(o.node,o.offset);let s=document.createElement("span");s.className="annotation-mark-temp";try{i.surroundContents(s)}catch{}return}try{let i=[],s=document.createTreeWalker(e.reader,NodeFilter.SHOW_TEXT,null,!1),r;for(;r=s.nextNode();){let a=document.createRange();a.selectNode(r);let c=document.createRange();c.setStart(n.node,n.offset),c.setEnd(o.node,o.offset);let d=c.compareBoundaryPoints(Range.END_TO_START,a),u=c.compareBoundaryPoints(Range.START_TO_END,a);if(d>0||u<0)continue;let m=r===n.node?n.offset:0,p=r===o.node?o.offset:r.nodeValue?.length||0;m<p&&i.push({node:r,start:m,end:p})}for(let a=i.length-1;a>=0;a--){let{node:c,start:d,end:u}=i[a],m=document.createRange();m.setStart(c,d),m.setEnd(c,u);let p=document.createElement("span");p.className="annotation-mark-temp",m.surroundContents(p)}}catch{}}}function In(e){return si(e),e.thread||[]}function hi(e,t=!1){let n=In(e),o=n[0],i=n.slice(1);return t?\`
      <div class="annotation-note simple">\${w(o?.note||e.note||"\\uFF08\\u65E0\\u8BC4\\u8BBA\\u5185\\u5BB9\\uFF09")}</div>
      \${i.length>0?\`<div class="annotation-reply-count">\\u56DE\\u590D \${i.length}</div>\`:""}
    \`:n.map(r=>\`
      <div class="annotation-thread-line \${r.type==="reply"?"is-reply":""}" data-thread-item-id="\${r.id}" data-annotation-id="\${e.id}">
        <span class="annotation-thread-text">\${w(r.note)}</span>
        <button class="annotation-thread-edit-btn" data-edit-thread-item="\${r.id}" data-annotation-id="\${e.id}" title="\\u7F16\\u8F91">\${te("edit")}</button>
      </div>\`).join("")||'<div class="annotation-thread-line">\\uFF08\\u65E0\\u8BC4\\u8BBA\\u5185\\u5BB9\\uFF09</div>'}function yi(e,t,n){let o=f.annotations.find(a=>a.id===e);if(!o)return;let i=n.trim();if(!i)return;let s=In(o),r=Date.now();s.push({id:\`r-\${r}-\${Math.random().toString(16).slice(2,8)}\`,type:"reply",note:i,createdAt:r}),o.thread=s,o.note=s[0]?.note||o.note,Ko(t,{id:e},i,"me").then(a=>{f.currentFilePath===t&&(ai(a),\$(t),N())}).catch(a=>{M(\`\\u56DE\\u590D\\u8BC4\\u8BBA\\u5931\\u8D25: \${a?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)})}function Ct(e,t,n){let o=document.querySelector(\`.annotation-thread-line[data-thread-item-id="\${t}"][data-annotation-id="\${e}"]\`);if(!o)return;let i=f.annotations.find(p=>p.id===e);if(!i)return;let s=In(i),r=s.find(p=>p.id===t);if(!r)return;let a=o.innerHTML;o.classList.add("is-editing"),o.innerHTML=\`<textarea class="annotation-thread-edit-input" placeholder="Cmd+Enter \\u4FDD\\u5B58\\uFF0CEsc \\u53D6\\u6D88">\${w(r.note)}</textarea>\`;let c=o.querySelector("textarea");c.style.height=\`\${Math.max(c.scrollHeight,34)}px\`,c.focus(),c.setSelectionRange(c.value.length,c.value.length);let d=!1,u=()=>{d||(d=!0,o.classList.remove("is-editing"),o.innerHTML=a,o.querySelector("[data-edit-thread-item]")?.addEventListener("click",p=>{p.stopPropagation(),Ct(e,t,n)}))},m=()=>{if(d)return;d=!0;let p=c.value.trim();if(!p||p===r.note){o.classList.remove("is-editing"),o.innerHTML=a,o.querySelector("[data-edit-thread-item]")?.addEventListener("click",g=>{g.stopPropagation(),Ct(e,t,n)});return}if(r.note=p,s[0]?.id===t&&(i.note=p),i.thread=s,An(n,i,"\\u7F16\\u8F91\\u8BC4\\u8BBA\\u5931\\u8D25"),\$(n),f.pinnedAnnotationId===e){let y=document.querySelector(\`[data-annotation-id="\${e}"]\`)?.getBoundingClientRect();nt(i,y?y.right+8:120,y?y.top+8:120)}};c.addEventListener("keydown",p=>{if(\$t(p,c)){p.preventDefault();return}p.key==="Escape"?(p.preventDefault(),u()):p.key==="Enter"&&(p.metaKey||p.ctrlKey)&&(p.preventDefault(),m())}),c.addEventListener("input",()=>{c.style.height="auto",c.style.height=\`\${Math.min(200,Math.max(c.scrollHeight,34))}px\`}),c.addEventListener("blur",p=>{let g=p.relatedTarget,y=o.closest(".annotation-item");g&&y&&y.contains(g)||setTimeout(()=>{d||u()},150)})}function ve(e){e.style.height="auto";let t=160,n=Math.min(t,Math.max(e.scrollHeight,34));e.style.height=\`\${n}px\`,e.style.overflowY=e.scrollHeight>t?"auto":"hidden"}function bi(e){e.style.height="auto";let t=200,n=Math.min(t,Math.max(e.scrollHeight,34));e.style.height=\`\${n}px\`,e.style.overflowY=e.scrollHeight>t?"auto":"hidden"}function nt(e,t,n){let o=T();if(!o.popover||!o.popoverTitle||!o.popoverNote)return;let i=e.quote.substring(0,22);o.popoverTitle.textContent=\`#\${e.serial||0} | \${i}\${e.quote.length>22?"...":""}\`;let s=hi(e,!1);if(o.popoverNote.innerHTML=\`
    <div class="annotation-thread">\${s}</div>
    <div class="annotation-reply-entry" data-popover-reply-entry="\${e.id}" role="button" tabindex="0">
      <textarea rows="1" data-popover-reply-input="\${e.id}" placeholder="\\u8F93\\u5165\\u56DE\\u590D\\u5185\\u5BB9\\uFF08Cmd+Enter \\u63D0\\u4EA4\\uFF09"></textarea>
    </div>
  \`,o.popoverResolveBtn){let r=ne(e);o.popoverResolveBtn.title=r?"\\u91CD\\u65B0\\u6253\\u5F00":"\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3",o.popoverResolveBtn.setAttribute("aria-label",r?"\\u91CD\\u65B0\\u6253\\u5F00":"\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3"),o.popoverResolveBtn.innerHTML=te(r?"reopen":"check"),o.popoverResolveBtn.classList.toggle("is-resolved",r)}o.popover.style.left=\`\${Math.round(t)}px\`,o.popover.style.top=\`\${Math.round(n)}px\`,o.popover.classList.remove("hidden")}function ei(){let e=f.pinnedAnnotationId;if(!e)return;let t=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(!t)return;let n=f.annotations.find(i=>i.id===e);if(!n)return;let o=t.getBoundingClientRect();nt(n,o.right+8,o.top+8)}function ie(e=!1){let t=T();t.popover&&(!e&&f.pinnedAnnotationId||(t.popover.classList.add("hidden"),e&&(f.pinnedAnnotationId=null)))}function ti(e){let t=T();if(!f.pendingAnnotation||!t.composerNote)return;let n=f.pendingAnnotationFilePath;if(!n||n!==e)return;let o=t.composerNote.value.trim();if(!o)return;let i=Date.now(),s={...f.pendingAnnotation,serial:es(f.annotations),note:o,thread:[{id:\`c-\${i}-\${Math.random().toString(16).slice(2,8)}\`,type:"comment",note:o,createdAt:i}]};f.annotations.push(s),An(e,s,"\\u521B\\u5EFA\\u8BC4\\u8BBA\\u5931\\u8D25"),tt(),N(),\$(e)}function wi(e,t){let n=f.annotations.slice();f.annotations=f.annotations.filter(o=>o.id!==e),f.pinnedAnnotationId===e&&(f.pinnedAnnotationId=null,ie(!0)),f.activeAnnotationId===e&&(f.activeAnnotationId=null),N(),\$(t),Jo(t,{id:e}).catch(o=>{f.annotations=n,M(\`\\u5220\\u9664\\u8BC4\\u8BBA\\u5931\\u8D25: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600),N(),\$(t)})}function bs(e){let t=T();if(!t.content)return;let n=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(n){let o=t.content.getBoundingClientRect(),i=n.getBoundingClientRect(),r=t.content.scrollTop+(i.top-o.top),c=Math.max(0,r-56);t.content.scrollTo({top:c,behavior:"smooth"})}}function vi(e,t){f.activeAnnotationId=e,N(),e&&(bs(e),f.pinnedAnnotationId=e,requestAnimationFrame(()=>{let n=f.annotations.find(s=>s.id===e),o=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(!n||!o)return;let i=o.getBoundingClientRect();nt(n,i.right+8,i.top+8)})),\$(t)}function It(e,t,n){let o=Nt(),i=o.findIndex(r=>r.id===e);if(i<0)return;let s=o[i+t];s&&vi(s.id,n)}function ws(e){let t=document.getElementById("content"),n=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(!t||!n)return null;let o=t.getBoundingClientRect(),i=n.getBoundingClientRect();return t.scrollTop+(i.top-o.top)}function Nn(){if(f.density!=="default")return;let e=document.getElementById("content"),t=document.getElementById("annotationList");!e||!t||(t.scrollTop=e.scrollTop)}function ki(e,t){let n=f.annotations.find(s=>s.id===e);if(!n)return;let o=n.status;n.status==="resolved"?n.status=(n.confidence||0)<=0?"unanchored":"anchored":n.status="resolved";let i=n.status||"anchored";ie(!0),N(),\$(t),Uo(t,{id:e},i).catch(s=>{n.status=o,M(\`\\u66F4\\u65B0\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25: \${s?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600),N(),\$(t)})}function ni(e,t){e.classList.add("annotation-mark"),e.dataset.annotationId=t.id,e.classList.add(\`status-\${\$n(t)}\`),ne(t)&&e.classList.add("is-resolved")}function vs(e,t){let n=T();if(!n.reader||typeof e.start!="number"||typeof e.length!="number"||e.length<=0)return;let o=Lt(n.reader,e.start,t),i=Lt(n.reader,e.start+e.length,t);if(!(!o||!i)&&!(o.node===i.node&&o.offset===i.offset)){if(o.node===i.node){let s=document.createRange();s.setStart(o.node,o.offset),s.setEnd(i.node,i.offset);let r=document.createElement("span");ni(r,e);try{s.surroundContents(r)}catch{}return}try{let s=[],r=document.createTreeWalker(n.reader,NodeFilter.SHOW_TEXT,null,!1),a;for(;a=r.nextNode();){let c=document.createRange();c.selectNode(a);let d=document.createRange();d.setStart(o.node,o.offset),d.setEnd(i.node,i.offset);let u=d.compareBoundaryPoints(Range.END_TO_START,c),m=d.compareBoundaryPoints(Range.START_TO_END,c);if(u>0||m<0)continue;let p=a===o.node?o.offset:0,g=a===i.node?i.offset:a.nodeValue?.length||0;p<g&&s.push({node:a,start:p,end:g})}for(let c=s.length-1;c>=0;c--){let{node:d,start:u,end:m}=s[c],p=document.createRange();p.setStart(d,u),p.setEnd(d,m);let g=document.createElement("span");ni(g,e),p.surroundContents(g)}}catch{}}}function ks(){let e=T();e.reader&&e.reader.querySelectorAll(".annotation-mark").forEach(t=>{let n=t.getAttribute("data-annotation-id"),o=f.annotations.find(i=>i.id===n);o&&(t.classList.toggle("is-active",!!n&&n===f.activeAnnotationId),t.addEventListener("click",i=>{if(i.stopPropagation(),f.pinnedAnnotationId===n){f.pinnedAnnotationId=null,ie(!0);return}f.activeAnnotationId=n,f.pinnedAnnotationId=n;let s=t.getBoundingClientRect();nt(o,s.right+8,s.top+8);let r=j();\$(r||null)}))})}function xs(){let e=T();if(!e.reader)return;let t=Array.from(e.reader.querySelectorAll(".annotation-mark"));for(let n of t){let o=n.parentNode;for(;n.firstChild;)o?.insertBefore(n.firstChild,n);o?.removeChild(n)}}function N(){let e=T();xs();let t=e.reader?Do(Oo(e.reader)):void 0;if(e.reader){let o=t?t.nodes.map(r=>r.nodeValue||"").join(""):di(e.reader),i=!1,s=[];for(let r of f.annotations){let a=Go(o,r),c=!1,d=a.status;r.start!==a.start&&(r.start=a.start,i=!0,c=!0),r.length!==a.length&&(r.length=a.length,i=!0,c=!0);let u=ps(r.status,d);(r.status||"anchored")!==u&&(r.status=u,i=!0,c=!0),r.confidence!==a.confidence&&(r.confidence=a.confidence,i=!0,c=!0),c&&s.push({...r,thread:r.thread?[...r.thread]:r.thread})}if(i){let r=j();r&&li(r,s,"\\u540C\\u6B65\\u8BC4\\u8BBA\\u951A\\u70B9\\u5931\\u8D25")}}let n=[...Nt()].sort((o,i)=>i.start-o.start);for(let o of n)vs(o,t);ks()}function Es(e,t){let n=e.querySelector(".annotation-canvas");if(!n)return;let o=Array.from(n.querySelectorAll(".annotation-item.positioned"));if(o.length===0)return;let i=o.map(u=>u.offsetHeight),s=6,r=0,a=[];for(let u=0;u<o.length;u++){let m=Number(o[u].getAttribute("data-anchor-top")||"0"),p=Number.isFinite(m)?Math.max(0,m):0,g=Math.max(p,r>0?r+s:p);a.push(g),r=g+i[u]}for(let u=0;u<o.length;u++)o[u].style.top=\`\${Math.round(a[u])}px\`;let c=Math.max(0,t),d=Math.ceil(r+24);n.style.height=\`\${Math.max(c,d)}px\`}function \$(e){let t=T();if(!t.annotationList)return;as(),ss();let n=new Map;if(t.annotationList.querySelectorAll("[data-reply-input]").forEach(s=>{let r=s.getAttribute("data-reply-input");r&&s.value.trim()&&n.set(r,s.value)}),!e||f.annotations.length===0){t.annotationList.innerHTML='<div class="annotation-empty">\\u65E0\\u8BC4\\u8BBA\\uFF08\\u9009\\u4E2D\\u6587\\u672C\\u5373\\u53EF\\u6DFB\\u52A0\\uFF09</div>';return}let o=Nt();if(o.length===0){t.annotationList.innerHTML='<div class="annotation-empty">\\u5F53\\u524D\\u7B5B\\u9009\\u4E0B\\u65E0\\u8BC4\\u8BBA</div>';return}let i=(s,r,a=!1,c=0)=>\`
    <div class="annotation-item \${f.activeAnnotationId===s.id?"is-active":""} status-\${\$n(s)}\${ne(s)?" is-resolved":""}\${a?" positioned":""}" data-annotation-id="\${s.id}"\${a?\` data-anchor-top="\${Math.max(0,Math.round(c))}" style="top:\${Math.max(0,Math.round(c))}px"\`:""}>
      <div class="annotation-row-top">
        <div class="annotation-row-title">#\${s.serial||r+1} | \${w(s.quote.substring(0,28))}\${s.quote.length>28?"...":""}</div>
        <div class="annotation-row-actions">
          <button class="annotation-icon-action" data-action="prev" data-id="\${s.id}" title="\\u4E0A\\u4E00\\u6761">\${te("up")}</button>
          <button class="annotation-icon-action" data-action="next" data-id="\${s.id}" title="\\u4E0B\\u4E00\\u6761">\${te("down")}</button>
          <button class="annotation-icon-action resolve\${ne(s)?" is-resolved":""}" data-action="resolve" data-id="\${s.id}" title="\${ne(s)?"\\u91CD\\u65B0\\u6253\\u5F00":"\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3"}">\${ne(s)?te("reopen"):te("check")}</button>
          <button class="annotation-icon-action danger" data-action="delete" data-id="\${s.id}" title="\\u5220\\u9664">\${te("trash")}</button>
        </div>
      </div>
      <div class="annotation-thread">\${hi(s,f.density==="simple")}</div>
      \${f.density==="simple"?"":\`
        <div class="annotation-reply-entry" data-reply-entry="\${s.id}" role="button" tabindex="0">
          <textarea rows="1" data-reply-input="\${s.id}" placeholder="\\u8F93\\u5165\\u56DE\\u590D\\u5185\\u5BB9\\uFF08Cmd+Enter \\u63D0\\u4EA4\\uFF09"></textarea>
        </div>
      \`}
    </div>
  \`;if(f.density==="default"){let s=o.map(u=>ws(u.id)),r=0,a=o.map((u,m)=>{let p=s[m]??m*88;return r=Math.max(r,p),i(u,m,!0,p)}).join(""),c=document.getElementById("content"),d=Math.max(c?.scrollHeight||0,r+180);t.annotationList.classList.add("default-mode"),t.annotationList.innerHTML=\`<div class="annotation-canvas" style="height:\${d}px">\${a}</div>\`,Es(t.annotationList,c?.scrollHeight||0),Nn()}else t.annotationList.classList.remove("default-mode"),t.annotationList.innerHTML=o.map((s,r)=>i(s,r)).join("");t.annotationList.querySelectorAll(".annotation-icon-action").forEach(s=>{s.addEventListener("click",r=>{r.stopPropagation();let a=r.currentTarget,c=a.getAttribute("data-action"),d=a.getAttribute("data-id");!d||!e||(c==="prev"?It(d,-1,e):c==="next"?It(d,1,e):c==="resolve"?ki(d,e):c==="delete"&&wi(d,e))})}),t.annotationList.querySelectorAll("[data-edit-thread-item]").forEach(s=>{s.addEventListener("click",r=>{r.stopPropagation();let a=s.getAttribute("data-edit-thread-item"),c=s.getAttribute("data-annotation-id");!a||!c||!e||Ct(c,a,e)})}),t.annotationList.querySelectorAll("[data-reply-entry]").forEach(s=>{s.addEventListener("click",r=>{r.stopPropagation();let a=s.getAttribute("data-reply-entry");if(!a)return;let c=t.annotationList?.querySelector(\`[data-reply-input="\${a}"]\`);c&&(ve(c),c.focus())}),s.addEventListener("keydown",r=>{if(r.target instanceof HTMLTextAreaElement||r.key!=="Enter"&&r.key!==" ")return;r.preventDefault(),r.stopPropagation();let c=s.getAttribute("data-reply-entry");if(!c)return;let d=t.annotationList?.querySelector(\`[data-reply-input="\${c}"]\`);d&&(ve(d),d.focus())})}),n.size>0&&t.annotationList.querySelectorAll("[data-reply-input]").forEach(s=>{let r=s.getAttribute("data-reply-input");r&&n.has(r)&&(s.value=n.get(r))}),requestAnimationFrame(()=>{t.annotationList?.querySelectorAll("[data-reply-input]").forEach(s=>{ve(s)})}),t.annotationList.querySelectorAll("[data-reply-input]").forEach(s=>{let r=s;r.addEventListener("input",()=>ve(r)),r.addEventListener("click",a=>a.stopPropagation()),s.addEventListener("keydown",a=>{if(\$t(a,a.currentTarget)){a.preventDefault();return}if(a.key!=="Enter"||!(a.metaKey||a.ctrlKey))return;a.preventDefault();let c=a.currentTarget,d=c.getAttribute("data-reply-input");!d||!e||(yi(d,e,c.value),c.value="",\$(e))})}),t.annotationList.querySelectorAll(".annotation-item").forEach(s=>{s.addEventListener("click",()=>{let r=s.getAttribute("data-annotation-id");!r||!e||vi(r,e)})})}function xi(e){let t=T(),n=t.content?.getAttribute("data-current-file");if(!e||!n||e!==n||!t.reader)return;let o=window.getSelection();if(!o||o.rangeCount===0||o.isCollapsed)return;let i=o.getRangeAt(0);if(!t.reader.contains(i.commonAncestorContainer))return;let s=o.toString().trim();if(!s)return;let r=Xo(t.reader,i.startContainer,i.startOffset),a=Xo(t.reader,i.endContainer,i.endOffset);if(r<0||a<=r)return;let c=di(t.reader),d=32,u=32,m=c.slice(Math.max(0,r-d),r),p=c.slice(a,Math.min(c.length,a+u)),g=i.getBoundingClientRect();ms(g.right+6,g.top-8,{id:\`ann-\${Date.now()}-\${Math.random().toString(16).slice(2,8)}\`,start:r,length:a-r,quote:s,quotePrefix:m,quoteSuffix:p,status:"anchored",confidence:1})}function Ei(){ds(),Ne(!0),document.getElementById("composerSaveBtn")?.addEventListener("click",()=>{let e=j();e&&ti(e)}),document.getElementById("composerCancelBtn")?.addEventListener("click",tt),T().composerNote?.addEventListener("keydown",e=>{if(\$t(e,e.currentTarget)){e.preventDefault();return}if(e.key!=="Enter"||!(e.metaKey||e.ctrlKey))return;e.preventDefault();let t=j();t&&ti(t)}),T().composerNote?.addEventListener("input",e=>{let t=e.currentTarget;bi(t)}),T().quickAdd?.addEventListener("click",e=>{e.stopPropagation(),fs()}),document.getElementById("popoverCloseBtn")?.addEventListener("click",()=>{f.pinnedAnnotationId=null,ie(!0)}),document.getElementById("popoverDeleteBtn")?.addEventListener("click",()=>{let e=j(),t=f.pinnedAnnotationId;t&&e&&wi(t,e)}),document.getElementById("popoverResolveBtn")?.addEventListener("click",()=>{let e=j(),t=f.pinnedAnnotationId;t&&e&&ki(t,e)}),document.getElementById("popoverPrevBtn")?.addEventListener("click",()=>{let e=j(),t=f.pinnedAnnotationId;t&&e&&It(t,-1,e)}),document.getElementById("popoverNextBtn")?.addEventListener("click",()=>{let e=j(),t=f.pinnedAnnotationId;t&&e&&It(t,1,e)}),document.getElementById("annotationPopover")?.addEventListener("click",e=>{let t=e.target,n=j();if(!n)return;let o=t.closest("[data-edit-thread-item]");if(o){e.stopPropagation();let r=o.getAttribute("data-edit-thread-item"),a=o.getAttribute("data-annotation-id");r&&a&&Ct(a,r,n);return}let i=t.closest("[data-popover-reply-entry]");if(i){e.stopPropagation();let r=i.getAttribute("data-popover-reply-entry");if(!r)return;let a=document.querySelector(\`[data-popover-reply-input="\${r}"]\`);if(!a)return;ve(a),a.focus();return}t.closest("[data-popover-reply-input]")&&e.stopPropagation()}),document.getElementById("annotationPopover")?.addEventListener("keydown",e=>{let t=e.target;if(t instanceof HTMLTextAreaElement)return;let n=t.closest("[data-popover-reply-entry]");if(!n||e.key!=="Enter"&&e.key!==" ")return;e.preventDefault(),e.stopPropagation();let o=n.getAttribute("data-popover-reply-entry");if(!o)return;let i=document.querySelector(\`[data-popover-reply-input="\${o}"]\`);i&&(ve(i),i.focus())}),document.getElementById("annotationPopover")?.addEventListener("keydown",e=>{let t=e.target;if(!(t instanceof HTMLTextAreaElement))return;if(\$t(e,t)){e.preventDefault();return}if(e.key!=="Enter"||!(e.metaKey||e.ctrlKey))return;let n=t.getAttribute("data-popover-reply-input"),o=j();if(!n||!o)return;e.preventDefault(),yi(n,o,t.value),t.value="";let i=f.annotations.find(a=>a.id===n),r=document.querySelector(\`[data-annotation-id="\${n}"]\`)?.getBoundingClientRect();i&&nt(i,r?r.right+8:120,r?r.top+8:120),\$(o)}),document.getElementById("annotationPopover")?.addEventListener("input",e=>{let t=e.target;t instanceof HTMLTextAreaElement&&t.hasAttribute("data-popover-reply-input")&&ve(t)}),T().filterMenu?.querySelectorAll(".annotation-filter-item[data-filter]").forEach(e=>{e.addEventListener("click",()=>{let t=e.getAttribute("data-filter");if(!t)return;f.filter=t,T().filterMenu?.classList.add("hidden");let n=j();N(),\$(n||null)})}),T().filterToggle?.addEventListener("click",e=>{e.stopPropagation();let t=T().filterMenu;t&&t.classList.toggle("hidden")}),T().densityToggle?.addEventListener("click",()=>{f.density=f.density==="default"?"simple":"default",localStorage.setItem("md-viewer:annotation-density",f.density);let e=j();\$(e||null)}),T().closeToggle?.addEventListener("click",()=>{Zo()}),T().floatingOpenBtn?.addEventListener("click",()=>{Yo()}),T().sidebarResizer?.addEventListener("mousedown",e=>{if(T().sidebar?.classList.contains("collapsed"))return;e.preventDefault();let t=document.documentElement,n=Number(getComputedStyle(t).getPropertyValue("--annotation-sidebar-width").replace("px",""))||ii,o=e.clientX;document.body.classList.add("annotation-sidebar-resizing");let i=r=>{let a=o-r.clientX;fi(n+a),oe()},s=()=>{document.body.classList.remove("annotation-sidebar-resizing"),window.removeEventListener("mousemove",i),window.removeEventListener("mouseup",s)};window.addEventListener("mousemove",i),window.addEventListener("mouseup",s)}),document.getElementById("content")?.addEventListener("scroll",()=>{Be(!1),Nn(),ei()}),window.addEventListener("resize",()=>{oe(),ei()}),window.openAnnotationSidebar=Yo,window.closeAnnotationSidebar=Zo,window.toggleAnnotationSidebar=us,document.addEventListener("mousedown",e=>{let t=e.target,n=T();if(t.closest(".annotation-mark-temp")){hs();return}n.composer&&!n.composer.classList.contains("hidden")&&!n.composer.contains(t)&&!(n.quickAdd&&n.quickAdd.contains(t))&&gs(),n.popover&&!n.popover.contains(t)&&!t.closest(".annotation-mark")&&(f.pinnedAnnotationId=null,ie(!0)),n.filterMenu&&!n.filterMenu.classList.contains("hidden")&&!n.filterMenu.contains(t)&&!t.closest("#annotationFilterToggle")&&n.filterMenu.classList.add("hidden"),n.quickAdd&&!n.quickAdd.classList.contains("hidden")&&!n.quickAdd.contains(t)&&!t.closest("#annotationComposer")&&Be(!0)}),T().composerHeader?.addEventListener("mousedown",e=>{if(e.target.closest(".annotation-row-actions"))return;let t=T().composer;if(!t)return;let n=t.getBoundingClientRect(),o=e.clientX,i=e.clientY,s=n.left,r=n.top;e.preventDefault();let a=d=>{let u=s+(d.clientX-o),m=r+(d.clientY-i);Fn(t,u,m)},c=()=>{window.removeEventListener("mousemove",a),window.removeEventListener("mouseup",c)};window.addEventListener("mousemove",a),window.addEventListener("mouseup",c)})}var oi,ii,Xr,Yr,f,ri,Bn=b(()=>{"use strict";qo();fe();Vo();Ae();Qo();oi="md-viewer:annotation-sidebar-width",ii=320,Xr=260,Yr=540;f={annotations:[],pendingAnnotation:null,pendingAnnotationFilePath:null,pinnedAnnotationId:null,activeAnnotationId:null,currentFilePath:null,filter:"open",density:Zr()},ri="md-viewer:annotation-panel-open-by-file"});var F={};de(F,{renderCurrentPath:()=>jn,renderFiles:()=>Pn,renderSearchBox:()=>\$i,renderSidebar:()=>A,renderTabs:()=>re,setSidebarTab:()=>Fi});function Li(e){l.currentFile&&(Ti||requestAnimationFrame(()=>{let t=e.querySelector(".file-item.current, .tree-item.current");if(!t)return;let n=t.offsetTop-e.clientHeight*.4,o=Math.max(0,e.scrollHeight-e.clientHeight),i=Math.max(0,Math.min(n,o));e.scrollTo({top:i,behavior:"auto"}),Ti=!0}))}function Fi(e){l.config.sidebarTab=e,H(l.config),A()}function Ts(e){if(!e)return;let t=He.indexOf(e);t>=0&&He.splice(t,1),He.unshift(e),He.length>300&&(He.length=300)}function Ai(e){let t=He.indexOf(e);return t>=0?t:Number.MAX_SAFE_INTEGER}function Ss(){D=!D,re()}function Ms(){D&&(D=!1,re())}function As(e){Wt=(e||"").trimStart(),D||(D=!0),re()}function Ls(e){ot=e==="name"?"name":"recent",re()}function Fs(){Si||(Si=!0,document.addEventListener("click",e=>{!D||e.target?.closest(".tab-manager-wrap")||Ms()}))}function \$s(){if(Mi)return;Mi=!0;let e=document.getElementById("tabs");e&&e.addEventListener("scroll",t=>{let n=t.target;n.classList.contains("tabs-scroll")?Pt=n.scrollLeft:n.classList.contains("tab-manager-list")&&(jt=n.scrollTop)},{passive:!0,capture:!0})}function Cs(e){let t=kt(l.sessionFiles),n=Te(e,t,l.currentFile,i=>{let s=t.find(a=>a.path===i);if(!s)return!1;let r=z(s,W(s.path));return r.type==="normal"||r.type==="new"}),o=window.removeFile;if(!o||n.length===0){re();return}n.forEach(i=>o(i))}function Wn(){if(l.config.sidebarTab==="focus"||l.config.sidebarTab==="full"){A();return}Pn()}function Is(e){let t=e.trim();return t?!!(/^https?:\\/\\//i.test(t)||t.startsWith("/")||t.startsWith("~/")||t.startsWith("./")||t.startsWith("../")||t.includes("/")||t.includes("\\\\")||/\\.[a-zA-Z0-9]{1,10}\$/.test(t)):!1}function \$i(){let e=document.getElementById("searchBox");if(!e)return;let t=e.querySelector("#searchInput"),n=e.querySelector("#searchClear"),o=l.config.sidebarTab,i=o==="list"?"\\u641C\\u7D22\\u5DF2\\u6253\\u5F00\\u7684\\u6587\\u4EF6":o==="focus"?"\\u641C\\u7D22\\u7126\\u70B9\\u6587\\u4EF6":"\\u641C\\u7D22\\u6216\\u8F93\\u5165\\u8DEF\\u5F84\\uFF08Enter\\u8865\\u5168\\uFF0CCmd/Ctrl+Enter\\u6DFB\\u52A0\\uFF09";if(!t||!n){if(e.innerHTML=\`
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
    \`,t=e.querySelector("#searchInput"),n=e.querySelector("#searchClear"),!t||!n)return;Et(t,{kind:"file",markdownOnly:!1,shouldActivate:Is}),t.addEventListener("input",s=>{window.dismissQuickActionConfirm?.();let r=s.target.value;Bt=0,Ht="",Y(r),n&&(n.style.display=r?"block":"none"),Wn(),l.currentFile&&(un(l.currentFile)||Ke(l.currentFile))&&window.renderContent?.()}),t.addEventListener("keydown",s=>{if(s.key==="Enter"&&(s.metaKey||s.ctrlKey)){s.preventDefault(),t.dispatchEvent(new Event("path-autocomplete-hide")),window.handleUnifiedInputSubmit?.(t.value);return}if(!s.defaultPrevented&&(s.key==="Enter"&&(s.preventDefault(),t.dispatchEvent(new Event("path-autocomplete-hide")),window.handleUnifiedInputSubmit?.(t.value)),s.key==="Escape")){window.dismissQuickActionConfirm?.();let r=Date.now(),a=t.value;if(r-Bt<900&&Ht===a&&a){Y(""),t.value="",n&&(n.style.display="none"),Wn(),Bt=0,Ht="",s.preventDefault();return}Bt=r,Ht=a}}),n.addEventListener("click",()=>{Y(""),t&&(t.value=""),n.style.display="none",Wn(),t?.focus()})}document.activeElement!==t&&t.value!==l.searchQuery&&(t.value=l.searchQuery),n.style.display=l.searchQuery?"block":"none",t.placeholder=i}function jn(){let e=document.getElementById("currentPath");e&&(e.innerHTML="",e.style.display="none")}function Ns(){let e=document.getElementById("modeSwitchRow");if(!e)return;let t=l.config.sidebarTab,n=[{key:"focus",label:"\\u7126\\u70B9"},{key:"full",label:"\\u5168\\u91CF"},{key:"list",label:"\\u5217\\u8868"}];e.innerHTML=\`
    <div class="view-tabs">
      \${n.map(o=>\`
        <button class="view-tab\${t===o.key?" active":""}"
                onclick="setSidebarTab('\${o.key}')">\${o.label}</button>
      \`).join("")}
    </div>
  \`}function Pn(){let e=document.getElementById("fileList");if(!e)return;if(l.sessionFiles.size===0){e.innerHTML='<div class="empty-tip">\\u70B9\\u51FB\\u4E0A\\u65B9\\u6DFB\\u52A0 Markdown/HTML \\u6587\\u4EF6</div>';return}let t=cn();if(t.length===0){e.innerHTML='<div class="empty-tip">\\u672A\\u627E\\u5230\\u5339\\u914D\\u7684\\u6587\\u4EF6</div>';return}let n=new Map(t.map(i=>[i.path,i])),o=kt(n);e.innerHTML=o.map(i=>{let s=i.path===l.currentFile,r=i.isMissing||!1,a=ge(i.path),c=["file-item",s?"current":"",r?"deleted":""].filter(Boolean).join(" "),d=i.displayName||i.name,u=l.searchQuery.toLowerCase().trim();if(u){let g=d.toLowerCase().indexOf(u);if(g!==-1){let y=d.substring(0,g),h=d.substring(g,g+u.length),k=d.substring(g+u.length);d=\`\${y}<mark class="search-highlight">\${h}</mark>\${k}\`}}let m=z(i,W(i.path)),p="&nbsp;";return m.badge==="dot"?p='<span class="new-dot"></span>':m.badge&&(p=\`<span class="status-badge status-\${m.type}" style="color: \${m.color}">\${m.badge}</span>\`),\`
      <div class="\${c}"
           onclick="window.switchFile('\${v(i.path)}')">
        <span class="file-type-icon \${a.cls}">\${w(a.label)}</span>
        <span class="name">\${d}</span>
        <span class="file-item-status">\${p}</span>
        <span class="close" onclick="event.stopPropagation();window.removeFile('\${v(i.path)}')">\\xD7</span>
      </div>
    \`}).join(""),Li(e)}function A(){let e=l.config.sidebarTab,t=document.querySelector(".sidebar");if(t&&t.classList.toggle("workspace-mode",e==="focus"||e==="full"),\$i(),Ns(),e==="list"){jn(),Pn(),re();return}if(jn(),!t)return;let n=document.getElementById("fileList");n||(n=document.createElement("div"),n.id="fileList",n.className="file-list",t.appendChild(n)),n.innerHTML=No(),Ho(),Li(n),re()}function re(){let e=Array.from(l.sessionFiles.values()),t=document.getElementById("tabs");if(!t)return;Fs(),\$s();let n=t.querySelector(".tab-manager-list");n&&(jt=n.scrollTop);let o=t.querySelector(".tabs-scroll");if(o&&(Pt=o.scrollLeft),e.length===0){t.innerHTML="",t.style.display="none",D=!1,Hn="";return}let i=kt(l.sessionFiles),s=i.map(p=>{let g=z(p,W(p.path));return[p.path,p.displayName||p.name,p.isMissing?"1":"0",p.path===l.currentFile?"1":"0",g.type,g.badge||""].join("|")}).join("||"),r=[l.currentFile||"",D?"1":"0",ot,Wt,s].join("###");if(r===Hn)return;Hn=r,Ts(l.currentFile),t.style.display="flex";let a=i.map(p=>{let g=p.path===l.currentFile,y=p.isMissing||!1,h=["tab"];return g&&h.push("active"),y&&h.push("deleted"),\`
        <div class="\${h.join(" ")}"
             onclick="window.switchFile('\${v(p.path)}')">
          <span class="tab-name">\${w(p.displayName)}</span>
          <span class="tab-close" onclick="event.stopPropagation();window.removeFile('\${v(p.path)}')">\\xD7</span>
        </div>
      \`}).join(""),c=Wt.toLowerCase().trim(),d=i.filter(p=>{let g=p.displayName||p.name;return c?g.toLowerCase().includes(c)||p.path.toLowerCase().includes(c):!0}).sort((p,g)=>{let y=p.displayName||p.name,h=g.displayName||g.name;if(ot==="name")return y.localeCompare(h,"zh-CN");let k=Ai(p.path)-Ai(g.path);return k!==0?k:y.localeCompare(h,"zh-CN")}),u=d.length===0?'<div class="tab-manager-empty">\\u6CA1\\u6709\\u5339\\u914D\\u7684\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6</div>':d.map(p=>{let g=p.displayName||p.name,y=p.path===l.currentFile,h=z(p,W(p.path)),k=h.badge?\`<span class="tab-manager-status status-\${h.type}">\${w(h.badge)}</span>\`:"";return\`
          <div class="tab-manager-item \${y?"active":""}" onclick="window.switchFile('\${v(p.path)}')">
            <span class="tab-manager-name" title="\${v(p.path)}">\${w(g)}</span>
            <span class="tab-manager-actions">
              \${k}
              <button class="tab-manager-close" type="button" title="\\u5173\\u95ED" onclick="event.stopPropagation();window.removeFile('\${v(p.path)}')">\\xD7</button>
            </span>
          </div>
        \`}).join(""),m={others:Te("close-others",i,l.currentFile,()=>!1).length,right:Te("close-right",i,l.currentFile,()=>!1).length,unmodified:Te("close-unmodified",i,l.currentFile,p=>{let g=i.find(h=>h.path===p);if(!g)return!1;let y=z(g,W(g.path));return y.type==="normal"||y.type==="new"}).length,all:Te("close-all",i,l.currentFile,()=>!1).length};t.innerHTML=\`
    <div class="tabs-scroll">\${a}</div>
    <div class="tab-manager-wrap">
      <button class="tab-manager-toggle \${D?"active":""}" type="button" onclick="event.stopPropagation();window.toggleTabManager()">\\u2261 Tabs (\${i.length})</button>
      <div class="tab-manager-panel \${D?"show":""}" onclick="event.stopPropagation()">
        <div class="tab-manager-row tab-manager-actions-row">
          <button class="tab-manager-action" type="button" data-action="close-others" onclick="window.applyTabBatchAction('close-others')">\\u5173\\u95ED\\u5176\\u4ED6 (\${m.others})</button>
          <button class="tab-manager-action" type="button" data-action="close-right" onclick="window.applyTabBatchAction('close-right')">\\u5173\\u95ED\\u53F3\\u4FA7 (\${m.right})</button>
          <button class="tab-manager-action" type="button" data-action="close-unmodified" onclick="window.applyTabBatchAction('close-unmodified')">\\u5173\\u95ED\\u672A\\u4FEE\\u6539 (\${m.unmodified})</button>
          <button class="tab-manager-action danger" type="button" data-action="close-all" onclick="window.applyTabBatchAction('close-all')">\\u5173\\u95ED\\u5168\\u90E8 (\${m.all})</button>
        </div>
        <div class="tab-manager-row">
          <input class="tab-manager-search" placeholder="\\u641C\\u7D22\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6" value="\${v(Wt)}" oninput="window.setTabManagerQuery(this.value)">
        </div>
        <div class="tab-manager-row">
          <button class="tab-manager-sort \${ot==="recent"?"active":""}" type="button" onclick="window.setTabManagerSort('recent')">\\u6700\\u8FD1\\u4F7F\\u7528</button>
          <button class="tab-manager-sort \${ot==="name"?"active":""}" type="button" onclick="window.setTabManagerSort('name')">\\u6309\\u540D\\u79F0</button>
        </div>
        <div class="tab-manager-list">\${u}</div>
      </div>
    </div>
  \`,requestAnimationFrame(()=>{let p=t.querySelector(".tab-manager-list");p&&jt>0&&(p.scrollTop=jt);let g=t.querySelector(".tabs-scroll");g&&Pt>0&&(g.scrollLeft=Pt),oe()})}var Bt,Ht,Ti,D,Wt,ot,Si,jt,Pt,Mi,Hn,He,L=b(()=>{"use strict";I();X();xe();fe();ko();wt();Je();xo();Wo();Bn();kn();Bt=0,Ht="",Ti=!1,D=!1,Wt="",ot="recent",Si=!1,jt=0,Pt=0,Mi=!1,Hn="",He=[];typeof window<"u"&&(window.setSidebarTab=Fi,window.toggleTabManager=Ss,window.setTabManagerQuery=As,window.setTabManagerSort=Ls,window.applyTabBatchAction=Cs)});function Ii(e){let t=e.replace(/[.+^\${}()|[\\]\\\\]/g,"\\\\\$&");return t=t.replace(/\\*\\*/g,"\\xA7GLOBSTAR\\xA7"),t=t.replace(/\\*/g,"[^/]*"),t=t.replace(/\\?/g,"[^/]"),t=t.replace(/§GLOBSTAR§\\//g,"(?:.+/)?"),t=t.replace(/§GLOBSTAR§/g,".*"),e.endsWith("/")?new RegExp(\`(^|/)\${t}\`):new RegExp(\`(^|/)\${t}(/|\$)\`)}function Ni(e){if(e.type==="file")return[e];let t=[];for(let n of e.children||[])t.push(...Ni(n));return t}function Bs(e,t,n,o){if(!t)return[];let i=Date.now()-n,s=Ie(t,e);return Ni(t).filter(a=>s.has(a.path)?!1:!!(o.has(a.path)||typeof a.lastModified=="number"&&a.lastModified>=i)).sort((a,c)=>{let d=o.has(a.path),u=o.has(c.path);return d!==u?d?-1:1:(c.lastModified||0)-(a.lastModified||0)})}function Hs(e){let t=Date.now()-e,n=Math.floor(t/6e4);if(n<60)return\`\${n}m\`;let o=Math.floor(t/36e5);return o<24?\`\${o}h\`:\`\${Math.floor(t/864e5)}d\`}function Ws(e,t){if(!t)return w(e);let n=e.toLowerCase().indexOf(t.toLowerCase());return n===-1?w(e):w(e.slice(0,n))+\`<mark class="search-highlight">\${w(e.slice(n,n+t.length))}</mark>\`+w(e.slice(n+t.length))}function js(e,t,n){let o=l.currentFile===e.path,i=t.has(e.path),s=l.sessionFiles.get(e.path),r="normal";s?r=z(s,W(e.path)).type:_e(e.path)?r="modified":W(e.path)&&(r="new");let a=ge(e.path),c=Ue(e.name)||e.name,d=e.lastModified?Hs(e.lastModified):"",u=r==="modified"?'<span class="focus-file-dot modified"></span>':r==="new"?'<span class="focus-file-dot new-file"></span>':"",m=i?\`<button class="tree-pin-btn active" title="\\u53D6\\u6D88\\u56FA\\u5B9A" onclick="event.stopPropagation();handleUnpinFile('\${v(e.path)}')" data-path="\${v(e.path)}">\\u{1F4CC}</button>\`:\`<button class="tree-pin-btn" title="\\u56FA\\u5B9A\\u5230\\u7126\\u70B9\\u89C6\\u56FE" onclick="event.stopPropagation();handlePinFile('\${v(e.path)}')">\\u{1F4CC}</button>\`;return\`
    <div class="tree-item file-node focus-file-item\${o?" current":""}"
         data-path="\${v(e.path)}"
         onclick="handleFocusFileClick('\${v(e.path)}')">
      <span class="tree-indent" style="width:8px"></span>
      <span class="file-type-icon \${a.cls}">\${w(a.label)}</span>
      <span class="tree-name"><span class="tree-name-full">\${Ws(c,n)}</span></span>
      \${u}
      \${d?\`<span class="focus-file-time">\${w(d)}</span>\`:""}
      \${m}
    </div>
  \`}function Ps(){let e=l.config.focusWindowKey||"8h";return\`
    <div class="focus-filter-bar">
      <span class="focus-filter-label">\\u6700\\u8FD1</span>
      <div class="focus-time-pills">\${[{key:"8h",label:"8h"},{key:"2d",label:"2d"},{key:"1w",label:"1w"},{key:"1m",label:"1m"}].map(o=>\`<button class="focus-time-pill\${e===o.key?" active":""}"
             onclick="setFocusWindowKey('\${o.key}')">\${o.label}</button>\`).join("")}</div>
    </div>
  \`}function Ds(e,t,n,o,i){let s=t.length>0,r=o?'<span class="focus-ws-badge empty">\\u2026</span>':s?\`<span class="focus-ws-badge">\${t.length}</span>\`:'<span class="focus-ws-badge empty">0</span>',a=s?t.map(c=>js(c,n,i)).join(""):"";return\`
    <div class="focus-ws-group\${s?" has-files":""}">
      <div class="focus-ws-header" onclick="handleFocusWorkspaceToggle('\${v(e.id)}')">
        <span class="focus-ws-arrow\${s?" open":""}">\\u25B6</span>
        <span class="focus-ws-name">\${w(e.name)}</span>
        \${r}
      </div>
      \${s?\`<div class="focus-ws-files">\${a}</div>\`:""}
    </div>
  \`}function jo(){let e=l.config.workspaces;if(e.length===0)return'<div class="focus-empty">\\u6682\\u65E0\\u5DE5\\u4F5C\\u533A</div>';let t=Ci[l.config.focusWindowKey||"8h"]??Ci["8h"],n=fn(),o=l.searchQuery.trim().toLowerCase(),i=e.map(s=>{let r=l.fileTree.get(s.id),a=!r;!r&&!Dn.has(s.id)&&(Dn.add(s.id),K(s.id).then(d=>{Dn.delete(s.id),d&&Promise.resolve().then(()=>(L(),F)).then(({renderSidebar:u})=>u())}));let c=Bs(s.path,r,t,n);return o&&(c=c.filter(d=>(Ue(d.name)||d.name).toLowerCase().includes(o)||d.path.toLowerCase().includes(o))),Ds(s,c,n,a,o)}).join("");return\`<div class="focus-view">\${Ps()}\${i}</div>\`}var Dn,Ci,En=b(()=>{"use strict";I();At();fe();wt();Je();pn();Ve();Ze();X();Dn=new Set,Ci={"8h":8*3600*1e3,"2d":2*86400*1e3,"1w":7*86400*1e3,"1m":30*86400*1e3}});function Ie(e,t){let n=new Set;return Bi(e,t,[],n),n}function Bi(e,t,n,o){if(e.type==="file"){for(let{base:r,pattern:a}of n){let c=e.path.startsWith(r+"/")?e.path.slice(r.length+1):e.path;if(Ii(a).test(c)){o.add(e.path);return}}return}let i=(e.ignorePatterns||[]).map(r=>({base:e.path,pattern:r})),s=[...n,...i];for(let r of e.children||[])Bi(r,e.path,s,o)}var At=b(()=>{"use strict";En()});function Hi(e,t){let n=Wi(e);n.size!==0&&Dt(t,n)}function Wi(e,t=new Map){if(e.type!=="directory")return t;typeof e.isExpanded=="boolean"&&t.set(e.path,e.isExpanded);for(let n of e.children||[])Wi(n,t);return t}function Dt(e,t){if(e.type==="directory"){let n=t.get(e.path);typeof n=="boolean"&&(e.isExpanded=n)}for(let n of e.children||[])Dt(n,t)}var ji=b(()=>{"use strict"});var Po={};de(Po,{addWorkspace:()=>Rt,getCurrentWorkspace:()=>_s,hydrateExpandedWorkspaces:()=>Ot,inferWorkspaceFromPath:()=>Ks,moveWorkspaceByOffset:()=>Mt,removeWorkspace:()=>Tn,revealFileInWorkspace:()=>Rn,scanWorkspace:()=>K,switchWorkspace:()=>zs,toggleNodeExpanded:()=>Mn,toggleWorkspaceExpanded:()=>Sn});function Rs(){return\`ws-\${Date.now()}-\${Math.random().toString(36).substr(2,9)}\`}function We(e){return e.trim().replace(/\\/+\$/,"")}function Os(e){let t=We(e),n=null;for(let o of l.config.workspaces){let i=We(o.path);(t===i||t.startsWith(\`\${i}/\`))&&(!n||i.length>We(n.path).length)&&(n=o)}return n}function qs(e,t,n){let o=l.fileTree.get(e);if(!o)return;let i=We(t),s=We(n);if(!(s===i||s.startsWith(\`\${i}/\`)))return;let a=(s===i?"":s.slice(i.length+1)).split("/").filter(Boolean);if(a.length<=1)return;let c=!1,d=i;for(let u=0;u<a.length-1;u+=1){d=\`\${d}/\${a[u]}\`;let m=On(o,d);m&&m.type==="directory"&&m.isExpanded===!1&&(m.isExpanded=!0,c=!0)}c&&mt(e,ft(o))}function Rt(e,t){let n=We(t),o=l.config.workspaces.find(s=>s.path===n);if(o)return l.currentWorkspace=o.id,l.fileTree.delete(o.id),o;let i={id:Rs(),name:e,path:n,isExpanded:!1};return l.config.workspaces.push(i),H(l.config),l.currentWorkspace=i.id,i}function Tn(e){let t=l.config.workspaces.findIndex(n=>n.id===e);t!==-1&&(l.config.workspaces.splice(t,1),H(l.config),l.fileTree.delete(e),nn(e),ho(e),l.currentWorkspace===e&&(l.currentWorkspace=l.config.workspaces.length>0?l.config.workspaces[0].id:null))}function zs(e){l.config.workspaces.find(n=>n.id===e)&&(l.currentWorkspace=e)}function Mt(e,t){let n=l.config.workspaces,o=n.findIndex(r=>r.id===e);if(o===-1)return;let i=o+t;if(i<0||i>=n.length)return;let[s]=n.splice(o,1);n.splice(i,0,s),H(l.config)}function Sn(e){let t=l.config.workspaces.find(n=>n.id===e);t&&(t.isExpanded=!t.isExpanded,H(l.config))}function _s(){return l.currentWorkspace&&l.config.workspaces.find(e=>e.id===l.currentWorkspace)||null}async function Ks(e){try{let t=await fetch("/api/infer-workspace",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filePath:e})});if(!t.ok)return null;let n=await t.json();if(!n.workspacePath)return null;let o=l.config.workspaces.find(s=>s.path===n.workspacePath);if(o)return o;let i=n.workspaceName||n.workspacePath.split("/").pop()||"workspace";return Rt(i,n.workspacePath)}catch(t){return console.error("\\u63A8\\u65AD\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",t),null}}async function K(e){let t=l.config.workspaces.find(n=>n.id===e);if(!t)return null;try{let n=new AbortController,o=window.setTimeout(()=>n.abort(),15e3),i=await fetch("/api/scan-workspace",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:t.path}),signal:n.signal});if(window.clearTimeout(o),!i.ok)return console.error("\\u626B\\u63CF\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",await i.text()),null;let s=await i.json(),r=l.fileTree.get(e),a=go(e),c=!r&&(!a||a.size===0);r?Hi(r,s):a&&a.size>0?Dt(s,a):(Di(s),Us(s,2)),l.fileTree.set(e,s),mt(e,ft(s));let d=Ie(s,t.path),u=Pi(s).filter(m=>!d.has(m));return tn(e,u),s}catch(n){return console.error("\\u626B\\u63CF\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",n),null}}function Pi(e){if(!e)return[];if(e.type==="file")return[e.path];let t=[];for(let n of e.children||[])t.push(...Pi(n));return t}function Di(e){if(e.type==="directory")for(let t of e.children||[])t.type==="directory"&&(t.isExpanded=!1,Di(t))}function Ri(e,t=[]){if(e.type==="file")t.push(e);else for(let n of e.children||[])Ri(n,t);return t}function Js(e,t){function n(o){if(o.type==="file")return o.path===t;for(let i of o.children||[])if(n(i))return o.isExpanded=!0,!0;return!1}n(e)}function Us(e,t){let n=Ri(e);n.sort((s,r)=>(r.lastModified||0)-(s.lastModified||0));let o=n.slice(0,t),i=new Set;for(let s of o){let r=s.path.substring(0,s.path.lastIndexOf("/"));i.has(r)||(i.add(r),Js(e,s.path))}}async function Ot(){let e=l.config.workspaces.filter(t=>t.isExpanded);for(let t of e)await K(t.id);!l.currentWorkspace&&l.config.workspaces.length>0&&(l.currentWorkspace=l.config.workspaces[0].id)}async function Rn(e){let t=Os(e);t&&(l.currentWorkspace=t.id,t.isExpanded||(t.isExpanded=!0,H(l.config)),l.fileTree.has(t.id)||await K(t.id),qs(t.id,t.path,e))}function Mn(e,t){let n=l.fileTree.get(e);if(!n)return;let o=On(n,t);if(o&&o.type==="directory"){let i=o.isExpanded!==!1;o.isExpanded=!i,mt(e,ft(n))}}function On(e,t){if(e.path===t)return e;if(e.children)for(let n of e.children){let o=On(n,t);if(o)return o}return null}var Ze=b(()=>{"use strict";I();X();At();xe();ji();Xt()});function Oi(e,t){let n=e.split(\`
\`),o=t.split(\`
\`),i=n.length,s=o.length;if(i===0&&s===0)return[];let r=i+s,a=new Array(2*r+1).fill(0),c=[];e:for(let h=0;h<=r;h++){c.push([...a]);for(let k=-h;k<=h;k+=2){let E=k+r,x;k===-h||k!==h&&a[E-1]<a[E+1]?x=a[E+1]:x=a[E-1]+1;let S=x-k;for(;x<i&&S<s&&n[x]===o[S];)x++,S++;if(a[E]=x,x>=i&&S>=s)break e}}let d=[],u=i,m=s;for(let h=c.length-1;h>=0&&(u>0||m>0);h--){let k=c[h],E=u-m,x=E+r,S;E===-h||E!==h&&k[x-1]<k[x+1]?S=E+1:S=E-1;let C=k[S+r],B=C-S;for(;u>C+1&&m>B+1;)d.unshift({type:"equal",x:u-1,y:m-1}),u--,m--;h>0&&(u===C+1&&m===B+1&&C>=0&&B>=0&&n[C]===o[B]?d.unshift({type:"equal",x:C,y:B}):u>C?d.unshift({type:"delete",x:C,y:-1}):d.unshift({type:"insert",x:-1,y:B})),u=C,m=B}let p=[],g=1,y=1;for(let h of d)h.type==="equal"?p.push({type:"equal",content:n[h.x],oldLineNo:g++,newLineNo:y++}):h.type==="delete"?p.push({type:"delete",content:n[h.x],oldLineNo:g++}):p.push({type:"insert",content:o[h.y],newLineNo:y++});return p}var qi=b(()=>{"use strict"});function qt(e){let n=Date.now()-e,o=Math.floor(n/1e3),i=Math.floor(o/60),s=Math.floor(i/60),r=Math.floor(s/24);return r>0?\`\${r}\\u5929\\u524D\`:s>0?\`\${s}\\u5C0F\\u65F6\\u524D\`:i>0?\`\${i}\\u5206\\u949F\\u524D\`:"\\u521A\\u521A"}var zi=b(()=>{"use strict"});var je,_i,it=b(()=>{"use strict";je=\`/*light */
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

\`,_i=\`pre code.hljs {
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
  
}\`});var qn,Ki=b(()=>{"use strict";it();qn=je});var Ji,Ui=b(()=>{"use strict";it();Ji=je+\`

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
\`});var Vi,Gi=b(()=>{"use strict";it();Vi=je+\`

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
\`});var zn,Qi=b(()=>{"use strict";it();zn=_i});var Xi,Yi=b(()=>{"use strict";Xi=\`
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
\`});var Zi,er=b(()=>{"use strict";Zi=\`
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
\`});function tr(e){return _n.find(t=>t.key===e)?.css??qn}function nr(e){return Kn.find(t=>t.key===e)?.css??zn}var _n,Kn,Jn=b(()=>{"use strict";Ki();Ui();Gi();Qi();Yi();er();_n=[{key:"github",label:"GitHub",css:qn},{key:"notion",label:"Notion",css:Ji},{key:"bear",label:"Bear / iA Writer",css:Vi}],Kn=[{key:"github",label:"GitHub Light",css:zn},{key:"github-dark",label:"GitHub Dark",css:Xi},{key:"atom-one-dark",label:"Atom One Dark",css:Zi}]});function ir(){zt=l.config.markdownTheme||"github",Un=l.config.codeTheme||"github",Vn=l.config.mathInline!==!1,document.getElementById("settingsDialogOverlay")||Vs(),Gs();let t=document.getElementById("settingsDialogOverlay");t&&t.classList.add("show")}function Vs(){let e=document.createElement("div");e.id="settingsDialogOverlay",e.className="sync-dialog-overlay",e.innerHTML=\`
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
  \`,document.body.appendChild(e),e.addEventListener("click",t=>{t.target===e&&rt()})}function Gs(){let e=document.getElementById("settingsDialogBody");if(!e)return;let t=Xs();e.innerHTML=\`
    <div class="settings-section">
      <div class="settings-section-title">\\u4E3B\\u9898</div>
      <div class="settings-section-desc">\\u5207\\u6362 Markdown \\u6B63\\u6587\\u6837\\u5F0F\\u548C\\u4EE3\\u7801\\u9AD8\\u4EAE\\u914D\\u8272\\u3002</div>
      <div class="settings-kv-grid">
        <div>\\u6B63\\u6587\\u6837\\u5F0F</div>
        <div>
          <select id="markdownThemeSelect" style="font-size:12px;padding:2px 6px;border:1px solid #ddd;border-radius:3px">
            \${_n.map(r=>\`<option value="\${r.key}"\${l.config.markdownTheme===r.key?" selected":""}>\${r.label}</option>\`).join("")}
          </select>
        </div>
        <div>\\u4EE3\\u7801\\u9AD8\\u4EAE</div>
        <div>
          <select id="codeThemeSelect" style="font-size:12px;padding:2px 6px;border:1px solid #ddd;border-radius:3px">
            \${Kn.map(r=>\`<option value="\${r.key}"\${l.config.codeTheme===r.key?" selected":""}>\${r.label}</option>\`).join("")}
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
            <input type="checkbox" id="mathInlineCheckbox"\${l.config.mathInline!==!1?" checked":""}>
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
            \${[2e3,5e3,1e4,3e4].map(r=>\`<option value="\${r}"\${(l.config.workspacePollInterval??5e3)===r?" selected":""}>\${r/1e3}s</option>\`).join("")}
          </select>
        </div>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">\\u5BA2\\u6237\\u7AEF\\u72B6\\u6001</div>
      <div class="settings-section-desc">\\u7528\\u4E8E\\u6392\\u67E5\\u672C\\u5730\\u7F13\\u5B58\\u662F\\u5426\\u810F\\u6570\\u636E\\uFF0C\\u53EF\\u76F4\\u63A5\\u6E05\\u7406\\u3002</div>
      <div class="settings-kv-grid">
        <div>\\u5F53\\u524D\\u6587\\u4EF6</div><div>\${or(t.currentFile||"\\u65E0")}</div>
        <div>\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6\\u6570</div><div>\${t.openFilesCount}</div>
        <div>\\u5DE5\\u4F5C\\u533A\\u6570</div><div>\${t.workspaceCount}</div>
        <div>\\u8BC4\\u8BBA\\u76F8\\u5173\\u672C\\u5730\\u952E\\u6570</div><div>\${t.commentStateKeyCount}</div>
        <div>md-viewer \\u672C\\u5730\\u952E\\u6570</div><div>\${t.mdvKeyCount}</div>
        <div>localStorage \\u603B\\u952E\\u6570</div><div>\${t.localStorageKeyCount}</div>
      </div>
      <div class="settings-key-list">
        \${t.mdvKeys.map(r=>\`<span class="settings-key-chip">\${or(r)}</span>\`).join("")}
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
  \`,document.getElementById("clearClientStateBtn")?.addEventListener("click",()=>{Ys()}),document.getElementById("clearAllCommentsBtn")?.addEventListener("click",()=>{Zs()});let i=document.getElementById("markdownThemeSelect"),s=document.getElementById("codeThemeSelect");i?.addEventListener("change",()=>{l.config.markdownTheme=i.value,window.applyTheme?.()}),s?.addEventListener("change",()=>{l.config.codeTheme=s.value,window.applyTheme?.()})}function rt(){zt&&(l.config.markdownTheme=zt,l.config.codeTheme=Un,l.config.mathInline=Vn,window.applyTheme?.());let e=document.getElementById("settingsDialogOverlay");e&&e.classList.remove("show")}function Qs(){let e=document.getElementById("markdownThemeSelect"),t=document.getElementById("codeThemeSelect"),n=document.getElementById("mathInlineCheckbox"),o=document.getElementById("pollIntervalSelect");e&&(l.config.markdownTheme=e.value),t&&(l.config.codeTheme=t.value),n&&(l.config.mathInline=n.checked),o&&(l.config.workspacePollInterval=parseInt(o.value,10)),H(l.config),A(),zt="",Un="",Vn=!0,rt()}function Xs(){let e=[];for(let o=0;o<localStorage.length;o+=1){let i=localStorage.key(o);i&&e.push(i)}e.sort();let t=e.filter(o=>o.startsWith("md-viewer:")),n=t.filter(o=>o==="md-viewer:annotation-panel-open-by-file"||o==="md-viewer:annotation-density"||o==="md-viewer:annotation-sidebar-width"||o.startsWith("md-viewer:annotations:")).length;return{currentFile:l.currentFile,openFilesCount:l.sessionFiles.size,workspaceCount:l.config.workspaces.length,commentStateKeyCount:n,mdvKeyCount:t.length,localStorageKeyCount:e.length,mdvKeys:t}}function Ys(){let e=[];for(let t=0;t<localStorage.length;t+=1){let n=localStorage.key(t);n&&n.startsWith("md-viewer:")&&e.push(n)}for(let t of e)localStorage.removeItem(t);_(\`\\u5DF2\\u6E05\\u7406\\u5BA2\\u6237\\u7AEF\\u72B6\\u6001\\uFF08\${e.length} \\u9879\\uFF09\`,1800),window.setTimeout(()=>window.location.reload(),250)}async function Zs(){try{let e=await fetch("/api/annotations/clear",{method:"POST"}),t=await e.json();if(!e.ok||t?.success!==!0)throw new Error(t?.error||\`HTTP \${e.status}\`);let n=[];for(let o=0;o<localStorage.length;o+=1){let i=localStorage.key(o);i&&(i.startsWith("md-viewer:annotations:")&&n.push(i),i==="md-viewer:annotation-panel-open-by-file"&&n.push(i),i==="md-viewer:annotation-density"&&n.push(i),i==="md-viewer:annotation-sidebar-width"&&n.push(i))}for(let o of n)localStorage.removeItem(o);_(\`\\u5DF2\\u6E05\\u7A7A\\u8BC4\\u8BBA\\u72B6\\u6001\\uFF08\\u670D\\u52A1\\u7AEF \${t?.deleted||0} \\u6761\\uFF0C\\u672C\\u5730 \${n.length} \\u9879\\uFF09\`,1800),window.setTimeout(()=>window.location.reload(),250)}catch(e){M(\`\\u6E05\\u7A7A\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25: \${e?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)}}function or(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}var zt,Un,Vn,rr=b(()=>{"use strict";I();xe();L();Ae();Jn();zt="",Un="",Vn=!0;typeof window<"u"&&(window.closeSettingsDialog=rt,window.saveSettings=Qs)});function ea(e,t=60){let n=JSON.stringify(e);return n.length<=t?w(n):w(n.slice(0,t))+"\\u2026"}function Gn(e,t,n,o){let i=e!==null&&typeof e=="object",s=n<1;if(!i){let E=t!==null?\`<span class="json-key">\${Pe(w(JSON.stringify(t)),o)}</span><span class="json-colon">:</span>\`:"",x=ta(e,o);return\`
      <li>
        <div class="json-node">
          <span class="json-toggle"></span>
          \${E}
          \${x}
        </div>
      </li>\`}let r=Array.isArray(e),a=r?e.map((E,x)=>({k:String(x),v:E})):Object.entries(e).map(([E,x])=>({k:E,v:x})),c=a.length,d=r?"[":"{",u=r?"]":"}",m=!s,p=m?"\\u25B6":"\\u25BC",g=m?"json-children collapsed":"json-children",y=t!==null?\`<span class="json-key">\${Pe(w(JSON.stringify(t)),o)}</span><span class="json-colon">:</span>\`:"",h=m?\`<span class="json-preview">\${ea(e)}</span>\`:"",k=a.map(({k:E,v:x})=>Gn(x,r?null:E,n+1,o)).join("");return\`
    <li>
      <div class="json-node json-node-expandable" data-expanded="\${!m}">
        <span class="json-toggle">\${p}</span>
        \${y}
        <span class="json-bracket">\${d}</span>
        <span class="json-count">\${c} \${r?"items":"keys"}</span>
        \${h}
        <span class="json-bracket json-close-bracket" style="display:\${m?"none":"inline"}">\${u}</span>
      </div>
      <ul class="\${g}">
        \${k}
        <li><div class="json-node"><span class="json-toggle"></span><span class="json-bracket">\${u}</span></div></li>
      </ul>
    </li>\`}function ta(e,t){return e===null?\`<span class="json-null">\${Pe("null",t)}</span>\`:typeof e=="boolean"?\`<span class="json-boolean">\${Pe(String(e),t)}</span>\`:typeof e=="number"?\`<span class="json-number">\${Pe(String(e),t)}</span>\`:\`<span class="json-string">\${Pe(w(JSON.stringify(e)),t)}</span>\`}function Pe(e,t){if(!t)return e;let n=t.toLowerCase(),o=e.toLowerCase(),i="",s=0;for(;s<e.length;){let r=o.indexOf(n,s);if(r===-1){i+=e.slice(s);break}i+=e.slice(s,r),i+=\`<mark class="json-match">\${e.slice(r,r+n.length)}</mark>\`,s=r+n.length}return i}function na(e,t){if(!t)return!1;let n=t.toLowerCase(),o=!1;function i(r){let a=r.querySelector(":scope > .json-node"),c=r.querySelector(":scope > .json-children");if(!c)return(a?.textContent?.toLowerCase()||"").includes(n);let d=Array.from(c.querySelectorAll(":scope > li")),u=!1;for(let m of d)i(m)&&(u=!0);if(u){if(o=!0,a){a.setAttribute("data-expanded","true");let m=a.querySelector(".json-toggle");m&&(m.textContent="\\u25BC");let p=a.querySelector(".json-close-bracket");p&&(p.style.display="inline");let g=a.querySelector(".json-preview");g&&(g.style.display="none")}c.classList.remove("collapsed")}return u}let s=Array.from(e.querySelectorAll(":scope > ul > li"));for(let r of s)i(r);return o}function oa(e){e.addEventListener("click",t=>{let o=t.target.closest(".json-node-expandable");if(!o)return;let s=o.parentElement.querySelector(":scope > .json-children");if(!s)return;let r=o.getAttribute("data-expanded")==="true",a=o.querySelector(".json-toggle"),c=o.querySelector(".json-close-bracket"),d=o.querySelector(".json-preview");if(r)if(o.setAttribute("data-expanded","false"),a&&(a.textContent="\\u25B6"),s.classList.add("collapsed"),c&&(c.style.display="none"),d)d.style.display="";else{let u=document.createElement("span");u.className="json-preview",u.textContent="\\u2026",o.appendChild(u)}else o.setAttribute("data-expanded","true"),a&&(a.textContent="\\u25BC"),s.classList.remove("collapsed"),c&&(c.style.display="inline"),d&&(d.style.display="none")})}function sr(e,t,n,o=""){if(Ke(n)?ra(e,t,o):ia(e,t,o),oa(e),o&&!na(e,o)){let r=document.createElement("div");r.className="json-no-results",r.textContent="\\u65E0\\u5339\\u914D\\u7ED3\\u679C",e.appendChild(r)}}function ia(e,t,n){let o;try{o=JSON.parse(t)}catch(s){e.innerHTML=\`
      <div class="json-viewer">
        <div class="json-error">
          JSON \\u89E3\\u6790\\u5931\\u8D25\\uFF1A\${w(String(s))}
          <pre>\${w(t.slice(0,500))}</pre>
        </div>
      </div>\`;return}let i=document.createElement("div");i.className="json-viewer",i.innerHTML=\`<ul>\${Gn(o,null,0,n)}</ul>\`,e.appendChild(i)}function ra(e,t,n){let o=t.split(\`
\`),i=document.createElement("div");i.className="json-viewer";let s=0;for(let r of o){let a=r.trim();if(!a)continue;s++;let c=document.createElement("div");c.className="json-line-header",c.textContent=\`Line \${s}\`,i.appendChild(c);let d;try{d=JSON.parse(a)}catch(m){let p=document.createElement("div");p.className="json-error",p.innerHTML=\`\\u89E3\\u6790\\u5931\\u8D25\\uFF1A\${w(String(m))}<pre>\${w(a.slice(0,200))}</pre>\`,i.appendChild(p);continue}let u=document.createElement("ul");u.innerHTML=Gn(d,null,0,n),i.appendChild(u)}e.appendChild(i)}var ar=b(()=>{"use strict";fe();Je()});var ye={};de(ye,{renderAll:()=>ua});function dr(){let e=tr(l.config.markdownTheme||"github"),t=nr(l.config.codeTheme||"github"),n=document.getElementById("theme-md-css"),o=document.getElementById("theme-hl-css");n&&(n.textContent=e),o&&(o.textContent=t)}function ke(e=!1){let t=l.currentFile&&!yr(l.currentFile)?l.currentFile:null,n=ui();(e||t!==n)&&ci(t),N(),\$(t)}async function pr(e,t=!1){let n=l.currentFile,o=t;sn(e,o),o&&(l.config.sidebarTab==="focus"||l.config.sidebarTab==="full")&&await Rn(e.path),o&&e.path,A(),U(),ke(o&&n!==e.path),o&&n!==e.path&&mr()}function mr(){let e=document.getElementById("content");e&&e.scrollTo({top:0,behavior:"auto"})}function aa(){return Math.max(ur,Math.min(sa,window.innerWidth-360))}function to(e){return Math.min(aa(),Math.max(ur,Math.round(e)))}function st(e){let t=to(e);document.documentElement.style.setProperty("--sidebar-width",\`\${t}px\`)}function la(){let e=Number(localStorage.getItem(Zn)),t=Number.isFinite(e)&&e>0?e:eo;st(t)}function ca(){let e=document.getElementById("sidebarResizer");if(!e)return;let t=!1,n=i=>{if(!t)return;let s=to(i.clientX);st(s)},o=i=>{if(!t)return;t=!1;let s=to(i.clientX);st(s),localStorage.setItem(Zn,String(s)),document.body.classList.remove("sidebar-resizing"),window.removeEventListener("mousemove",n),window.removeEventListener("mouseup",o)};e.addEventListener("mousedown",i=>{window.innerWidth<=900||(t=!0,document.body.classList.add("sidebar-resizing"),window.addEventListener("mousemove",n),window.addEventListener("mouseup",o),i.preventDefault())}),e.addEventListener("dblclick",()=>{st(eo),localStorage.setItem(Zn,String(eo))}),window.addEventListener("resize",()=>{let i=Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sidebar-width"),10);Number.isFinite(i)&&st(i)})}async function da(){l.currentFile&&await hr(l.currentFile,{silent:!0,highlight:!1})}async function fr(e){await hr(e,{silent:!1,highlight:!0})&&l.currentFile===e&&_("\\u6587\\u4EF6\\u5DF2\\u5237\\u65B0",2e3)}function gr(){let e=document.getElementById("content");e&&(e.style.animation="flash 700ms ease-out",setTimeout(()=>{e.style.animation=""},700))}async function hr(e,t={}){let n=l.sessionFiles.get(e);if(!n||n.isMissing)return!1;let o=(Qn.get(e)||0)+1;Qn.set(e,o);let i=await Le(e,t.silent!==!1);if(!i||Qn.get(e)!==o)return!1;let s=l.sessionFiles.get(e)||l.sessionFiles.get(i.path);if(!s)return!1;if(s.content=i.content,s.pendingContent=void 0,i.lastModified>=(s.lastModified||0)&&(s.lastModified=i.lastModified),s.displayedModified=i.lastModified,s.isMissing=!1,q(),l.currentFile===e||l.currentFile===i.path){if(ae){ae=!1;let r=document.getElementById("diffButton");r&&r.classList.remove("active")}U(),requestAnimationFrame(()=>{ke(!1),t.highlight&&gr()})}return A(),await se(),!0}function ua(){A(),U(),ke(!1)}function pa(e,t){let n=\`\${e}/\${t}\`,o=n.startsWith("/"),i=n.split("/"),s=[];for(let r of i)if(!(!r||r===".")){if(r===".."){s.length>0&&s.pop();continue}s.push(r)}return\`\${o?"/":""}\${s.join("/")}\`}function ma(e,t){let n=e.trim();if(!n||n.startsWith("http://")||n.startsWith("https://")||n.startsWith("data:")||n.startsWith("blob:")||n.startsWith("/api/")||br(t))return null;let o=n.indexOf("?"),i=n.indexOf("#"),s=[o,i].filter(u=>u>=0).sort((u,m)=>u-m)[0]??-1,r=s>=0?n.slice(0,s):n,a=s>=0?n.slice(s):"",c=t.slice(0,t.lastIndexOf("/")),d=r.startsWith("/")?r:pa(c,r);return\`/api/file-asset?path=\${encodeURIComponent(d)}\${a}\`}function fa(e,t){let n=e.querySelector(".markdown-body");n&&n.querySelectorAll("img[src], video[src], source[src]").forEach(o=>{let i=o.getAttribute("src");if(!i)return;let s=ma(i,t);s&&o.setAttribute("src",s)})}function ga(e){let t=window.renderMathInElement;if(!t)return;let n=l.config.mathInline!==!1,o=[{left:"\$\$",right:"\$\$",display:!0},{left:"\\\\[",right:"\\\\]",display:!0},{left:"\\\\(",right:"\\\\)",display:!1},...n?[{left:"\$",right:"\$",display:!1}]:[]];t(e,{delimiters:o,throwOnError:!1,ignoredTags:["script","noscript","style","textarea","pre","code"]})}async function ha(e){let t=window.mermaid;if(!t)return;let n=Array.from(e.querySelectorAll(".markdown-body pre > code.language-mermaid, .markdown-body pre > code.lang-mermaid, .markdown-body pre > code.language-flowchart, .markdown-body pre > code.lang-flowchart"));if(n.length===0)return;lr||(t.initialize({startOnLoad:!1,theme:"neutral",securityLevel:"loose"}),lr=!0);let o=s=>{let r=s.textContent||"\\u590D\\u5236";s.textContent="\\u2713",s.classList.add("copied"),window.setTimeout(()=>{s.textContent=r,s.classList.remove("copied")},900)},i=(s,r)=>{let a=document.createElement("div");a.className="mermaid-source-panel",a.style.display=r?"block":"none";let c=document.createElement("div");c.className="mermaid-source-head";let d=document.createElement("span");d.textContent="Mermaid \\u6E90\\u7801";let u=document.createElement("button");u.className="mermaid-source-copy",u.textContent="\\u590D\\u5236",u.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(s),o(u)}catch{}}),c.appendChild(d),c.appendChild(u);let m=document.createElement("pre"),p=document.createElement("code");p.className="language-mermaid",p.textContent=s,m.appendChild(p),a.appendChild(c),a.appendChild(m);let g=document.createElement("button");return g.className="mermaid-source-toggle",g.textContent=r?"\\u9690\\u85CF\\u6E90\\u7801":"\\u6E90\\u7801",g.addEventListener("click",()=>{let y=a.style.display!=="none";a.style.display=y?"none":"block",g.textContent=y?"\\u6E90\\u7801":"\\u9690\\u85CF\\u6E90\\u7801"}),{panel:a,toggleButton:g}};for(let s=0;s<n.length;s+=1){let r=n[s],a=r.closest("pre");if(!a)continue;let c=(r.textContent||"").trim();if(!c)continue;let d=r.classList.contains("language-flowchart")||r.classList.contains("lang-flowchart"),u=c.split(\`
\`).find(p=>p.trim().length>0)?.trim().toLowerCase()||"",m=d&&!u.startsWith("flowchart")&&!u.startsWith("graph")?\`flowchart TD
\${c}\`:c;if(m)try{let p=\`mdv-mermaid-\${Date.now()}-\${s}\`,{svg:g,bindFunctions:y}=await t.render(p,m),h=document.createElement("div");h.className="mermaid-block";let k=document.createElement("div");k.className="mermaid-actions";let{panel:E,toggleButton:x}=i(m,!1);k.appendChild(x);let S=document.createElement("div");S.className="mermaid",S.setAttribute("data-mdv-mermaid","1"),S.innerHTML=g,h.appendChild(k),h.appendChild(S),h.appendChild(E),a.replaceWith(h),typeof y=="function"&&y(S)}catch(p){let g=document.createElement("div");g.className="mermaid-fallback-block";let y=document.createElement("div");y.className="mermaid-actions";let{panel:h,toggleButton:k}=i(m,!0);y.appendChild(k);let E=document.createElement("div");E.className="mermaid-fallback-notice",E.textContent="Mermaid \\u8BED\\u6CD5\\u9519\\u8BEF\\uFF0C\\u5DF2\\u56DE\\u9000\\u4E3A\\u539F\\u6587\\u663E\\u793A",g.appendChild(y),g.appendChild(E),g.appendChild(h),a.replaceWith(g),console.error("Mermaid \\u6E32\\u67D3\\u5931\\u8D25\\uFF0C\\u5DF2\\u56DE\\u9000\\u539F\\u6587:",p)}}}function U(){let e=document.getElementById("content");if(!e)return;if(!l.currentFile){e.removeAttribute("data-current-file"),e.innerHTML=\`
      <div class="empty-state">
        <h2>\\u6B22\\u8FCE\\u4F7F\\u7528 MD Viewer</h2>
        <p>\\u5728\\u5DE6\\u4FA7\\u6DFB\\u52A0 Markdown/HTML \\u6587\\u4EF6\\u5F00\\u59CB\\u9605\\u8BFB</p>
      </div>
    \`;return}let t=l.sessionFiles.get(l.currentFile);if(!t)return;if(yr(t.path)){e.setAttribute("data-current-file",t.path),e.innerHTML=\`<iframe class="html-preview-frame" srcdoc="\${t.content.replace(/"/g,"&quot;").replace(/'/g,"&#39;")}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"></iframe>\`;let s=document.getElementById("fileMeta");s&&(s.textContent=qt(t.lastModified)),Yn(),se();return}if(wa(t.path)){e.setAttribute("data-current-file",t.path),e.innerHTML="";let r=document.getElementById("searchInput")?.value?.trim()??"";sr(e,t.content,t.path,r);let a=document.getElementById("fileMeta");a&&(a.textContent=qt(t.lastModified)),Yn(),se();return}let n=window.marked.parse(t.content),o=t.isMissing?\`
      <div class="content-file-status deleted">
        \\u8BE5\\u6587\\u4EF6\\u5DF2\\u4ECE\\u78C1\\u76D8\\u5220\\u9664\\uFF0C\\u5F53\\u524D\\u5185\\u5BB9\\u4E3A\\u672C\\u5730\\u7F13\\u5B58\\u5FEB\\u7167\\u3002
      </div>
    \`:"";e.innerHTML=\`\${o}<div class="markdown-body" id="reader">\${n}</div>\`,e.setAttribute("data-current-file",t.path),fa(e,t.path),ha(e),ga(e),N();let i=document.getElementById("fileMeta");i&&(i.textContent=qt(t.lastModified)),Yn(),se()}function Yn(){let e=document.getElementById("breadcrumb");if(!e||!l.currentFile){e&&(e.innerHTML="");return}let t=l.sessionFiles.get(l.currentFile);if(!t)return;let n=t.path.split("/").filter(Boolean),o=n[n.length-1]||"",i=n.map((s,r)=>{let a=r===n.length-1,c="/"+n.slice(0,r+1).join("/");return a?\`<span class="breadcrumb-item active">\${w(s)}</span>\`:\`
      <span class="breadcrumb-item" title="\${v(c)}">
        \${w(s)}
      </span>
      <span class="breadcrumb-separator">/</span>
    \`}).join("");e.innerHTML=\`
    \${i}
    <button class="copy-filename-button" onclick="copyFilePath('\${v(t.path)}', event)" title="\\u590D\\u5236\\u76F8\\u5BF9\\u8DEF\\u5F84 / \\u2325+\\u70B9\\u51FB\\u590D\\u5236\\u7EDD\\u5BF9\\u8DEF\\u5F84">
      <span class="copy-icon"></span>
      <span class="check-icon">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
        </svg>
      </span>
      <span class="copy-tooltip">\\u590D\\u5236\\u76F8\\u5BF9\\u8DEF\\u5F84</span>
    </button>
  \`}async function ya(e){if(e.stopPropagation(),!l.currentFile)return;let t=e.target,n=document.querySelector(".nearby-menu");if(n){n.remove();return}try{let o=await yn(l.currentFile);if(!o.files||o.files.length===0){hn("\\u9644\\u8FD1\\u6CA1\\u6709\\u5176\\u4ED6 Markdown \\u6587\\u4EF6",3e3);return}let i=document.createElement("div");i.className="nearby-menu",i.innerHTML=\`
      <div class="nearby-menu-header">\\u9644\\u8FD1\\u7684\\u6587\\u4EF6</div>
      \${o.files.map(a=>\`
        <div class="nearby-menu-item" onclick="window.addFileByPath('\${v(a.path)}', true)">
          \\u{1F4C4} \${w(a.name)}
        </div>
      \`).join("")}
    \`;let s=t.getBoundingClientRect();i.style.position="fixed",i.style.left=s.left+"px",i.style.top=s.bottom+5+"px",document.body.appendChild(i);let r=()=>{i.remove(),document.removeEventListener("click",r)};setTimeout(()=>document.addEventListener("click",r),0)}catch(o){M("\\u83B7\\u53D6\\u9644\\u8FD1\\u6587\\u4EF6\\u5931\\u8D25: "+o.message)}}function ba(e){let t=e.split("/").filter(Boolean);return t[t.length-1]||"workspace"}function yr(e){let t=e.toLowerCase();return t.endsWith(".html")||t.endsWith(".htm")}function wa(e){let t=e.toLowerCase();return t.endsWith(".json")||t.endsWith(".jsonl")}function br(e){return/^https?:\\/\\//i.test(e)}async function va(e){if(P(e),A(),br(e)){window.open(e,"_blank","noopener,noreferrer");return}try{let n=await(await fetch("/api/open-local-file",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e})})).json();n?.error&&M(\`\\u6253\\u5F00 HTML \\u5931\\u8D25: \${n.error}\`)}catch(t){M(\`\\u6253\\u5F00 HTML \\u5931\\u8D25: \${t?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)}}function ka(e){let t=e.trim();return t?!!(/^https?:\\/\\//i.test(t)||t.startsWith("/")||t.startsWith("~/")||t.startsWith("./")||t.startsWith("../")||t.includes("/")||t.includes("\\\\")||/\\.[a-zA-Z0-9]{1,10}\$/.test(t)):!1}function at(){J=null;let e=document.getElementById("quickActionConfirm"),t=document.getElementById("quickActionConfirmText"),n=document.getElementById("quickActionConfirmActions");e&&(e.style.display="none",e.className="add-file-confirm"),t&&(t.textContent=""),n&&(n.innerHTML=""),document.body.classList.remove("quick-action-confirm-visible")}function wr(){let e=document.getElementById("quickActionConfirm");return!!e&&e.style.display!=="none"}function _t(e,t,n={}){document.getElementById("searchInput")?.dispatchEvent(new Event("path-autocomplete-hide"));let i=document.getElementById("quickActionConfirm"),s=document.getElementById("quickActionConfirmText"),r=document.getElementById("quickActionConfirmActions");if(!(!i||!s||!r)){if(s.textContent=e,r.innerHTML="",i.className=\`add-file-confirm state-\${t}\`,i.style.display="flex",document.body.classList.add("quick-action-confirm-visible"),n.primaryLabel&&n.onPrimary){let a=document.createElement("button");a.className="add-file-confirm-button primary",a.textContent=n.primaryLabel,a.onclick=async()=>{await n.onPrimary(),at()},r.appendChild(a)}if(n.allowCancel!==!1){let a=document.createElement("button");a.className="add-file-confirm-button",a.textContent="\\u53D6\\u6D88",a.onclick=()=>at(),r.appendChild(a)}}}async function cr(){if(!J)return;if(J.kind==="add-other-file"){await Re(J.path,!0);return}let e=Rt(ba(J.path),J.path);A(),_(\`\\u5DF2\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A: \${e.name}\`,2e3),Y(""),A()}async function Re(e,t=!0){if(!e.trim())return;let n=await Le(e);n&&(await pr(n,t),await vn(e,t),Y(""),A())}async function vr(e){let t=e.trim();if(!t)return;let n=await wn(t),o=n.path||t;if(n.kind==="md_file"||n.kind==="html_file"){at(),await Re(o,!0);return}if(n.kind==="other_file"){J={kind:"add-other-file",path:o,ext:n.ext||null},_t(\`\\u68C0\\u6D4B\\u5230\\u975E Markdown \\u6587\\u4EF6\${n.ext?\`: \${n.ext}\`:""}\`,"warning",{primaryLabel:"\\u7EE7\\u7EED\\u6DFB\\u52A0\\u6587\\u4EF6",onPrimary:cr});return}if(n.kind==="directory"){J={kind:"add-workspace",path:o},_t("\\u68C0\\u6D4B\\u5230\\u76EE\\u5F55\\uFF0C\\u662F\\u5426\\u4F5C\\u4E3A\\u5DE5\\u4F5C\\u533A\\u6DFB\\u52A0\\uFF1F","directory",{primaryLabel:"\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A",onPrimary:cr});return}if(n.kind==="not_found"){J=null,_t("\\u8DEF\\u5F84\\u4E0D\\u5B58\\u5728\\uFF0C\\u8BF7\\u68C0\\u67E5\\u540E\\u91CD\\u8BD5","error",{allowCancel:!0});return}J=null,_t(n.error||"\\u65E0\\u6CD5\\u8BC6\\u522B\\u8F93\\u5165\\u8DEF\\u5F84","error",{allowCancel:!0})}async function xa(e){if(ae){ae=!1;let n=document.getElementById("diffButton");n&&n.classList.remove("active")}let t=l.currentFile;ln(e),A(),U(),ke(!0),t!==e&&mr(),await se()}function kr(e){an(e),A(),U(),ke(!0)}async function Ea(e){let t=document.getElementById("searchInput"),n=(typeof e=="string"?e:t?.value||"").trim();if(n)try{let o=l.config.workspaces.map(s=>s.path).filter(Boolean),i=await Ge(n,{roots:o,limit:50});i.files&&i.files.length>0?await Re(i.files[0].path):hn("\\u6CA1\\u6709\\u627E\\u5230\\u5339\\u914D\\u7684\\u6587\\u4EF6",3e3)}catch(o){M("\\u641C\\u7D22\\u5931\\u8D25: "+o.message)}}function Ta(){document.body.addEventListener("dragover",e=>{e.preventDefault()}),document.body.addEventListener("drop",async e=>{e.preventDefault();let t=Array.from(e.dataTransfer?.files||[]);for(let n of t){let o=n.name.toLowerCase();(o.endsWith(".md")||o.endsWith(".markdown")||o.endsWith(".html")||o.endsWith(".htm"))&&await Re(n.path)}})}function Sa(){document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(gi()){e.preventDefault();return}if(document.getElementById("settingsDialogOverlay")?.classList.contains("show")){e.preventDefault(),rt();return}let n=document.getElementById("addWorkspaceDialogOverlay");if(n?.classList.contains("show")){e.preventDefault(),n.classList.remove("show");return}}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){let t=document.activeElement?.tagName?.toLowerCase();if(t==="textarea"||t==="input")return;e.preventDefault();let n=document.getElementById("searchInput");n&&(n.focus(),n.select());return}(e.metaKey||e.ctrlKey)&&e.key==="w"&&(e.preventDefault(),l.currentFile&&kr(l.currentFile))})}function Ma(){let e=new URLSearchParams(window.location.search),t=e.get("file"),n=e.get("focus")!=="false";t&&(Re(t,n),window.history.replaceState({},"",window.location.pathname))}async function Aa(e){let t=l.sessionFiles.get(e);if(!t)return null;if(t.pendingContent!==void 0)return t.pendingContent;let n=await Le(e,!0);return n?(t.pendingContent=n.content,n.content):null}function La(e,t){let n=document.getElementById("content");if(!n)return;let o=Oi(e,t);if(!o.some(d=>d.type!=="equal")){n.innerHTML=\`
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
    \`;return}let s=[],r=0;for(;r<o.length;){let d=o[r];d.type==="equal"?(s.push({left:d,right:d}),r++):d.type==="delete"?r+1<o.length&&o[r+1].type==="insert"?(s.push({left:d,right:o[r+1]}),r+=2):(s.push({left:d}),r++):(s.push({right:d}),r++)}let a=d=>d.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),c=s.map(({left:d,right:u})=>{if(d&&u&&d.type==="equal")return\`<tr class="diff-row-equal">
        <td class="diff-line-no">\${d.oldLineNo}</td>
        <td>\${a(d.content)}</td>
        <td class="diff-line-no">\${u.newLineNo}</td>
        <td>\${a(u.content)}</td>
      </tr>\`;let m=d?\`<td class="diff-line-no">\${d.oldLineNo??""}</td>\`:'<td class="diff-line-no diff-cell-empty"></td>',p=d?\`<td class="diff-row-delete-cell">\${a(d.content)}</td>\`:'<td class="diff-cell-empty"></td>',g=u?\`<td class="diff-line-no">\${u.newLineNo??""}</td>\`:'<td class="diff-line-no diff-cell-empty"></td>',y=u?\`<td class="diff-row-insert-cell">\${a(u.content)}</td>\`:'<td class="diff-cell-empty"></td>';return\`<tr class="\${d&&u?"diff-row-mixed":d?"diff-row-delete":"diff-row-insert"}">\${m}\${p}\${g}\${y}</tr>\`}).join("");n.innerHTML=\`
    <div class="diff-view-container">
      <div class="diff-header">
        <div class="diff-header-titles">
          <div class="diff-header-old">\\u2190 \\u5F53\\u524D\\u7248\\u672C</div>
          <div class="diff-header-new">\\u78C1\\u76D8\\u6700\\u65B0\\u7248\\u672C \\u2192</div>
        </div>
        <div class="diff-actions">
          <button class="diff-accept-btn" onclick="window.acceptDiffUpdate()">\\u63A5\\u53D7\\u66F4\\u65B0</button>
          <button class="diff-close-btn" onclick="window.closeDiffView()">\\u5173\\u95ED</button>
        </div>
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
            <tbody>\${c}</tbody>
          </table>
        </div>
      </div>
    </div>
  \`}async function Fa(){if(!l.currentFile)return;let e=l.sessionFiles.get(l.currentFile);if(!e)return;if(ae){xr();return}let t=await Aa(l.currentFile);if(t===null)return;ae=!0;let n=document.getElementById("diffButton");n&&n.classList.add("active"),La(e.content,t)}function xr(){ae=!1;let e=document.getElementById("diffButton");e&&e.classList.remove("active"),U()}async function \$a(){if(!l.currentFile)return;let e=l.sessionFiles.get(l.currentFile);!e||e.pendingContent===void 0||(e.content=e.pendingContent,e.pendingContent=void 0,e.displayedModified=e.lastModified,q(),ae=!1,U(),ke(!1),gr(),A(),await se())}async function se(){let e=document.getElementById("diffButton"),t=document.getElementById("refreshButton");if(!l.currentFile){e&&(e.style.display="none"),t&&(t.style.display="none");return}let n=l.sessionFiles.get(l.currentFile);if(!n)return;if(n.isMissing){e&&(e.style.display="none"),t&&(t.style.display="none");return}let o=n.lastModified>n.displayedModified;e&&(e.style.display=o&&!n.isRemote?"flex":"none"),t&&(t.style.display=o?"flex":"none")}async function Ca(){l.currentFile&&await fr(l.currentFile)}function Ia(e){return e?.target?e.target.closest(".copy-filename-button, .sync-dialog-copy-btn, .sync-dialog-btn"):null}function Na(e,t){if(!e)return;if(e.classList.contains("copy-filename-button")){e.classList.add("success");let o=e.querySelector(".copy-tooltip"),i=o?.textContent;o&&(o.textContent=t||"\\u5DF2\\u590D\\u5236"),setTimeout(()=>{e.classList.remove("success"),o&&i&&(o.textContent=i)},1e3);return}let n=e.textContent;e.textContent="\\u2713 \\u5DF2\\u590D\\u5236",setTimeout(()=>{n!=null&&(e.textContent=n)},1e3)}function no(e,t,n){navigator.clipboard.writeText(e).then(()=>{Na(Ia(t),n)}).catch(()=>{M("\\u590D\\u5236\\u5931\\u8D25")})}function Ba(e,t){no(e,t)}function Er(e,t){if(t instanceof MouseEvent&&t.altKey){no(e,t,"\\u5DF2\\u590D\\u5236\\u7EDD\\u5BF9\\u8DEF\\u5F84");return}let o=l.config.workspaces,i=e;for(let s of o){let r=s.path.replace(/\\/+\$/,"");if(e===r||e.startsWith(r+"/")){i=e.slice(r.length+1);break}}no(i,t,"\\u5DF2\\u590D\\u5236\\u76F8\\u5BF9\\u8DEF\\u5F84")}function Ha(e,t){Er(e,t)}function Wa(){let e=localStorage.getItem("fontScale");e&&(De=parseFloat(e)),Tr()}function Tr(){document.documentElement.style.setProperty("--font-scale",De.toString()),Sr(),localStorage.setItem("fontScale",De.toString())}function Sr(){let e=document.getElementById("fontScaleText");if(e){let o=Math.round(De*100);e.textContent=\`\${o}%\`}let t=document.querySelectorAll(".font-scale-option");t.forEach(o=>{o.classList.remove("active")});let n=Math.round(De*100);t.forEach(o=>{o.textContent?.trim()===\`\${n}%\`&&o.classList.add("active")})}function ja(e){De=e,Tr(),oo()}function Pa(){let e=document.getElementById("fontScaleMenu");if(!e)return;e.style.display!=="none"?oo():(e.style.display="block",Sr())}function oo(){let e=document.getElementById("fontScaleMenu");e&&(e.style.display="none")}function Mr(e=!1){let t=new EventSource("/api/events");e&&Ot(),t.addEventListener("file-changed",async n=>{let o=JSON.parse(n.data),i=Ee(o.path);i?(i.lastModified=o.lastModified,i.isMissing&&(i.isMissing=!1,V(o.path)),q()):Zt(o.path),A(),await se()}),t.addEventListener("file-deleted",async n=>{let o=JSON.parse(n.data),i=Ee(o.path);i?(i.isMissing=!0,q()):pe(o.path),A(),l.currentFile===o.path&&(U(),se(),M("\\u6587\\u4EF6\\u5DF2\\u4E0D\\u5B58\\u5728"))}),t.addEventListener("file-opened",async n=>{let o=JSON.parse(n.data);await pr(o,o.focus!==!1)}),t.addEventListener("state-request",async n=>{let i=JSON.parse(n.data).requestId;if(!i)return;let s=Array.from(l.sessionFiles.values()).map(r=>({path:r.path,name:r.name}));try{await fetch("/api/session-state",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({requestId:i,currentFile:l.currentFile,openFiles:s})})}catch(r){console.error("\\u54CD\\u5E94\\u72B6\\u6001\\u8BF7\\u6C42\\u5931\\u8D25:",r)}}),t.onerror=()=>{console.error("SSE \\u8FDE\\u63A5\\u65AD\\u5F00\\uFF0C\\u5C1D\\u8BD5\\u91CD\\u8FDE..."),t.close(),setTimeout(()=>Mr(!0),3e3)}}function Da(){window.setInterval(async()=>{if(Xn||l.config.sidebarTab==="list")return;let e=l.config.sidebarTab==="focus"?l.config.workspaces:l.config.workspaces.filter(t=>t.isExpanded);if(e.length!==0){Xn=!0;try{for(let t of e)await K(t.id);A()}finally{Xn=!1}}},l.config.workspacePollInterval??5e3)}function Ra(){let e=document.createElement("div");e.id="findBar",e.innerHTML=\`
    <input id="findBarInput" type="text" placeholder="\\u67E5\\u627E..." autocomplete="off" spellcheck="false" />
    <span id="findBarCount"></span>
    <button id="findBarPrev" title="\\u4E0A\\u4E00\\u4E2A (\\u21E7\\u2318G)">&#8593;</button>
    <button id="findBarNext" title="\\u4E0B\\u4E00\\u4E2A (\\u2318G)">&#8595;</button>
    <button id="findBarClose" title="\\u5173\\u95ED (Esc)">&#10005;</button>
  \`,document.body.appendChild(e);let t=document.getElementById("findBarInput"),n=document.getElementById("findBarCount"),o=document.getElementById("findBarPrev"),i=document.getElementById("findBarNext"),s=document.getElementById("findBarClose"),r=[],a=-1,c=null;function d(){c&&c.querySelectorAll("mark.find-highlight").forEach(x=>{let S=x.parentNode;S&&(S.replaceChild(document.createTextNode(x.textContent||""),x),S.normalize())}),r=[],a=-1,n.textContent=""}function u(x){return x.replace(/[.*+?^\${}()|[\\]\\\\]/g,"\\\\\$&")}function m(x){if(d(),!x)return;let S=document.getElementById("content");if(!S)return;c=S;let C=new RegExp(u(x),"gi"),B=document.createTreeWalker(S,NodeFilter.SHOW_TEXT,{acceptNode(le){let R=le.parentElement;if(!R)return NodeFilter.FILTER_REJECT;let O=R.tagName.toLowerCase();return O==="script"||O==="style"||O==="mark"?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),lt=[],ct;for(;ct=B.nextNode();)lt.push(ct);for(let le of lt){let R=le.textContent||"",O,Oe=[],qe=0;for(C.lastIndex=0;(O=C.exec(R))!==null;){O.index>qe&&Oe.push(R.slice(qe,O.index));let ce=document.createElement("mark");ce.className="find-highlight",ce.textContent=O[0],Oe.push(ce),r.push(document.createRange()),qe=O.index+O[0].length}if(Oe.length===0)continue;qe<R.length&&Oe.push(R.slice(qe));let Kt=document.createDocumentFragment();Oe.forEach(ce=>{typeof ce=="string"?Kt.appendChild(document.createTextNode(ce)):Kt.appendChild(ce)}),le.parentNode.replaceChild(Kt,le)}r=[],S.querySelectorAll("mark.find-highlight").forEach(le=>{let R=document.createRange();R.selectNode(le),r.push(R)}),r.length>0&&(a=0,p(0)),g()}function p(x){let S=document.getElementById("content");if(!S)return;let C=S.querySelectorAll("mark.find-highlight");C.forEach((lt,ct)=>{lt.classList.toggle("find-highlight-current",ct===x)});let B=C[x];B&&B.scrollIntoView({block:"center",behavior:"smooth"})}function g(){r.length===0?(n.textContent=t.value?"\\u65E0\\u7ED3\\u679C":"",n.className=t.value?"no-result":""):(n.textContent=\`\${a+1} / \${r.length}\`,n.className="")}function y(){r.length!==0&&(a=(a+1)%r.length,p(a),g())}function h(){r.length!==0&&(a=(a-1+r.length)%r.length,p(a),g())}function k(){e.classList.add("visible"),t.focus(),t.select(),t.value&&m(t.value)}function E(){e.classList.remove("visible"),d()}window.__showFindBar=k,t.addEventListener("input",()=>m(t.value)),t.addEventListener("keydown",x=>{x.key==="Enter"?(x.shiftKey?h():y(),x.preventDefault()):x.key==="Escape"&&(E(),x.preventDefault())}),o.addEventListener("click",h),i.addEventListener("click",y),s.addEventListener("click",E)}var Zn,eo,ur,sa,Qn,ae,Xn,lr,J,De,be=b(()=>{I();X();Ze();he();fe();qi();zi();L();Ae();rr();ar();Jn();Bn();Zn="md-viewer:sidebar-width",eo=260,ur=220,sa=680,Qn=new Map,ae=!1,Xn=!1,lr=!1;J=null;De=1;document.addEventListener("click",e=>{let t=document.getElementById("fontScaleMenu"),n=document.getElementById("fontScaleButton");if(!t||!n)return;let o=e.target;!t.contains(o)&&!n.contains(o)&&oo()});window.addFile=()=>{let e=document.getElementById("searchInput");e&&vr(e.value).catch(t=>{M(\`\\u6DFB\\u52A0\\u5931\\u8D25: \${t?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)})};window.handleUnifiedInputSubmit=e=>{let t=document.getElementById("searchInput"),n=(typeof e=="string"?e:t?.value||"").trim();if(n){if(!ka(n)){Ea(n).catch(o=>{M(\`\\u641C\\u7D22\\u5931\\u8D25: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)});return}vr(n).catch(o=>{M(\`\\u6DFB\\u52A0\\u5931\\u8D25: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)})}};window.dismissQuickActionConfirm=()=>{wr()&&at()};window.switchFile=xa;window.removeFile=kr;window.showNearbyMenu=ya;window.addFileByPath=Re;window.refreshFile=fr;window.handleRefreshButtonClick=Ca;window.handleDiffButtonClick=Fa;window.closeDiffView=xr;window.acceptDiffUpdate=\$a;window.copySingleText=Ba;window.copyFileName=Ha;window.copyFilePath=Er;window.showToast=Me;window.showSettingsDialog=ir;window.toggleFontScaleMenu=Pa;window.setFontScale=ja;window.openExternalFile=va;window.renderContent=U;window.applyTheme=dr;(async()=>(la(),Wa(),Ei(),oe(),window.addEventListener("resize",()=>{oe()}),await rn(Le),dr(),await Ot(),Da(),A(),U(),ke(!0),Ta(),ca(),document.addEventListener("click",e=>{if(!wr())return;let t=e.target;t&&(t.closest(".sidebar-header")||t.closest("#quickActionConfirm")||at())}),Ma(),Sa(),document.addEventListener("mouseup",()=>{setTimeout(()=>{let e=document.getElementById("content")?.getAttribute("data-current-file")||null;xi(e)},0)}),await da(),Mr(),Ra()))()});be();})();
//# sourceMappingURL=client.js.map
`;
