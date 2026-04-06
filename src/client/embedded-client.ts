// 自动生成的文件，不要手动编辑
// 由 scripts/embed-client.ts 生成

export const EMBEDDED_CLIENT_JS = `"use strict";(()=>{var ki=Object.defineProperty;var x=(e,t)=>()=>(e&&(t=e(e=0)),t);var le=(e,t)=>{for(var n in t)ki(e,n,{get:t[n],enumerable:!0})};var no={};le(no,{defaultConfig:()=>lt,loadConfig:()=>ct,saveConfig:()=>H,updateConfig:()=>xi});function ct(){try{let e=localStorage.getItem(to);if(!e)return{...lt};let t=JSON.parse(e);return{...lt,...t}}catch(e){return console.error("\\u52A0\\u8F7D\\u914D\\u7F6E\\u5931\\u8D25:",e),{...lt}}}function H(e){try{localStorage.setItem(to,JSON.stringify(e))}catch(t){console.error("\\u4FDD\\u5B58\\u914D\\u7F6E\\u5931\\u8D25:",t)}}function xi(e){let n={...ct(),...e};return H(n),n}var to,lt,xe=x(()=>{"use strict";to="md-viewer:config",lt={sidebarTab:"focus",focusWindowKey:"8h",markdownTheme:"github",codeTheme:"github",workspaces:[]}});function ro(){try{localStorage.setItem(oo,JSON.stringify(Array.from(ce.entries()).map(([e,t])=>[e,Array.from(t)])))}catch(e){console.error("\\u4FDD\\u5B58\\u5217\\u8868\\u5DEE\\u5F02\\u72B6\\u6001\\u5931\\u8D25:",e)}}function io(){ce.clear();try{let e=localStorage.getItem(oo);if(!e)return;let t=JSON.parse(e);if(!Array.isArray(t))return;for(let n of t){if(!Array.isArray(n)||n.length!==2)continue;let o=n[0],r=n[1];typeof o!="string"||!Array.isArray(r)||ce.set(o,new Set(r.filter(i=>typeof i=="string"&&i.length>0)))}}catch(e){console.error("\\u6062\\u590D\\u5217\\u8868\\u5DEE\\u5F02\\u72B6\\u6001\\u5931\\u8D25:",e)}}function ao(e){return ce.get(e)}function qt(e,t){ce.set(e,t),ro()}function so(e){let t=ce.get(e);return ce.delete(e),ro(),t}var oo,ce,lo=x(()=>{"use strict";oo="md-viewer:workspaceKnownFiles",ce=new Map});function de(e){dt.add(e)}function ue(e){dt.delete(e)}function zt(e){return dt.has(e)}function _t(e){let t=Array.from(dt.values());if(!e)return t;let n=\`\${e.replace(/\\/+\$/,"")}/\`;return t.filter(o=>o.startsWith(n))}var dt,Kt=x(()=>{"use strict";dt=new Set});function Jt(){try{let e=Array.from(G.entries()).map(([t,n])=>[t,Array.from(n.entries())]);localStorage.setItem(co,JSON.stringify(e))}catch(e){console.error("\\u4FDD\\u5B58\\u5DE5\\u4F5C\\u533A\\u76EE\\u5F55\\u5C55\\u5F00\\u72B6\\u6001\\u5931\\u8D25:",e)}}function uo(){G.clear();try{let e=localStorage.getItem(co);if(!e)return;let t=JSON.parse(e);if(!Array.isArray(t))return;for(let n of t){if(!Array.isArray(n)||n.length!==2)continue;let o=n[0],r=n[1];if(typeof o!="string"||!Array.isArray(r))continue;let i=new Map;for(let a of r){if(!Array.isArray(a)||a.length!==2)continue;let s=a[0],c=a[1];typeof s!="string"||typeof c!="boolean"||i.set(s,c)}i.size>0&&G.set(o,i)}}catch(e){console.error("\\u6062\\u590D\\u5DE5\\u4F5C\\u533A\\u76EE\\u5F55\\u5C55\\u5F00\\u72B6\\u6001\\u5931\\u8D25:",e)}}function po(e){return G.get(e)}function ut(e,t){if(t.size===0){G.delete(e),Jt();return}G.set(e,new Map(t)),Jt()}function mo(e){G.has(e)&&(G.delete(e),Jt())}function pt(e){let t=new Map,n=o=>{if(o.type==="directory"){typeof o.isExpanded=="boolean"&&t.set(o.path,o.isExpanded);for(let r of o.children||[])n(r)}};return n(e),t}var co,G,Ut=x(()=>{"use strict";co="md-viewer:workspaceTreeExpandedState",G=new Map});function U(e){return Q.has(e)}function Vt(e){Q.add(e)}function j(e){Q.has(e)&&Q.delete(e)}function Gt(e){return qe.has(e)}function Qt(e){qe.add(e)}function mt(e){qe.delete(e)}function Xt(){Q.clear(),qe.clear(),io(),uo()}function Yt(e,t){let n=new Set(t),o=ao(e);if(!o){qt(e,n);return}for(let r of n)o.has(r)||Q.add(r),ue(r);for(let r of o)n.has(r)||(Q.delete(r),de(r));qt(e,n)}function Zt(e){let t=so(e);if(t)for(let n of t)Q.delete(n),qe.delete(n)}var Q,qe,fo=x(()=>{"use strict";lo();Kt();Ut();Q=new Set,qe=new Set});var pe=x(()=>{"use strict";fo();Kt()});var V={};le(V,{addOrUpdateFile:()=>nn,getFilteredFiles:()=>an,getSessionFile:()=>Ee,getSessionFiles:()=>en,hasSessionFile:()=>ht,markFileMissing:()=>Ei,removeFile:()=>on,restoreState:()=>tn,saveState:()=>O,setSearchQuery:()=>X,state:()=>l,switchToFile:()=>rn});function Ee(e){return l.sessionFiles.get(e)}function ht(e){return l.sessionFiles.has(e)}function en(){return Array.from(l.sessionFiles.values())}function O(){try{let e={files:Array.from(l.sessionFiles.entries()).map(([t,n])=>[t,{path:n.path,name:n.name,isRemote:n.isRemote||!1,isMissing:n.isMissing||!1,displayedModified:n.displayedModified,lastAccessed:n.lastAccessed||Date.now()}]),currentFile:l.currentFile};localStorage.setItem(gt,JSON.stringify(e))}catch(e){if(e.name==="QuotaExceededError"||e.code===22){console.warn("localStorage \\u914D\\u989D\\u5DF2\\u6EE1\\uFF0C\\u6267\\u884C\\u6E05\\u7406..."),go();try{let t={files:Array.from(l.sessionFiles.entries()).map(([n,o])=>[n,{path:o.path,name:o.name,isRemote:o.isRemote||!1,isMissing:o.isMissing||!1,displayedModified:o.displayedModified,lastAccessed:o.lastAccessed||Date.now()}]),currentFile:l.currentFile};localStorage.setItem(gt,JSON.stringify(t))}catch(t){console.error("\\u4FDD\\u5B58\\u72B6\\u6001\\u5931\\u8D25\\uFF08\\u91CD\\u8BD5\\u540E\\uFF09:",t)}}else console.error("\\u4FDD\\u5B58\\u72B6\\u6001\\u5931\\u8D25:",e)}}function go(){if(l.sessionFiles.size<=ft)return;let e=Array.from(l.sessionFiles.entries()).sort((o,r)=>(r[1].lastAccessed||r[1].lastModified||0)-(o[1].lastAccessed||o[1].lastModified||0)),t=e.slice(0,ft),n=e.slice(ft);l.sessionFiles.clear(),t.forEach(([o,r])=>{l.sessionFiles.set(o,r)}),console.log(\`\\u5DF2\\u6E05\\u7406 \${n.length} \\u4E2A\\u65E7\\u6587\\u4EF6\`)}async function tn(e){try{Xt();let t=localStorage.getItem(gt);if(!t)return;let n=JSON.parse(t);if(!n.files||n.files.length===0)return;let o=[];for(let[r,i]of n.files){let a=await e(r,!0);if(a){let s=i.displayedModified||a.lastModified;l.sessionFiles.set(r,{path:a.path,name:a.filename,content:a.content,lastModified:a.lastModified,displayedModified:s,isRemote:a.isRemote||!1,isMissing:!1,lastAccessed:i.lastAccessed||a.lastModified}),o.push([r,i])}}if(o.length!==n.files.length){let r=l.sessionFiles.has(n.currentFile)?n.currentFile:null;localStorage.setItem(gt,JSON.stringify({files:o,currentFile:r}))}if(n.currentFile&&l.sessionFiles.has(n.currentFile))l.currentFile=n.currentFile;else{let r=Array.from(l.sessionFiles.values())[0];l.currentFile=r?r.path:null}}catch(t){console.error("\\u6062\\u590D\\u72B6\\u6001\\u5931\\u8D25:",t)}}function nn(e,t=!1){l.sessionFiles.size>=ft&&!l.sessionFiles.has(e.path)&&go();let o=!l.sessionFiles.get(e.path);l.sessionFiles.set(e.path,{path:e.path,name:e.filename,content:e.content,lastModified:e.lastModified,displayedModified:e.lastModified,isRemote:e.isRemote||!1,isMissing:!1,lastAccessed:Date.now()}),t&&(l.currentFile=e.path,j(e.path)),ue(e.path),o&&(t||Vt(e.path)),O()}function on(e){let n=Array.from(l.sessionFiles.keys()).indexOf(e);if(l.sessionFiles.delete(e),j(e),ue(e),l.currentFile===e){let o=Array.from(l.sessionFiles.values());l.currentFile=o.length>0?o[Math.max(0,n-1)].path:null}O()}function rn(e){l.currentFile=e;let t=l.sessionFiles.get(e);t&&(t.lastAccessed=Date.now()),j(e),ue(e),O()}function Ei(e,t=!1){let n=l.sessionFiles.get(e),o=Date.now(),r=e.split("/").pop()||n?.name||e;l.sessionFiles.set(e,{path:e,name:r,content:n?.content||\`# \\u6587\\u4EF6\\u5DF2\\u5220\\u9664

\\u8BE5\\u6587\\u4EF6\\u5DF2\\u4ECE\\u78C1\\u76D8\\u5220\\u9664\\uFF0C\\u4E14\\u5F53\\u524D\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\u5185\\u5BB9\\u3002\`,lastModified:n?.lastModified||o,displayedModified:n?.displayedModified||o,isRemote:n?.isRemote||!1,isMissing:!0}),t&&(l.currentFile=e,j(e)),de(e),O()}function X(e){l.searchQuery=e}function an(){let e=l.searchQuery.toLowerCase().trim();return e?Array.from(l.sessionFiles.values()).filter(t=>t.name.toLowerCase().includes(e)||t.path.toLowerCase().includes(e)):Array.from(l.sessionFiles.values())}var l,gt,ft,N=x(()=>{"use strict";xe();pe();l={sessionFiles:new Map,currentFile:null,searchQuery:"",config:ct(),currentWorkspace:null,fileTree:new Map},gt="md-viewer:openFiles",ft=100});function ho(e,t){let n=yo(e);n.size!==0&&yt(t,n)}function yo(e,t=new Map){if(e.type!=="directory")return t;typeof e.isExpanded=="boolean"&&t.set(e.path,e.isExpanded);for(let n of e.children||[])yo(n,t);return t}function yt(e,t){if(e.type==="directory"){let n=t.get(e.path);typeof n=="boolean"&&(e.isExpanded=n)}for(let n of e.children||[])yt(n,t)}var bo=x(()=>{"use strict"});var xo={};le(xo,{addWorkspace:()=>bt,getCurrentWorkspace:()=>Li,hydrateExpandedWorkspaces:()=>cn,inferWorkspaceFromPath:()=>Fi,moveWorkspaceByOffset:()=>wt,removeWorkspace:()=>sn,revealFileInWorkspace:()=>dn,scanWorkspace:()=>q,switchWorkspace:()=>Ai,toggleNodeExpanded:()=>un,toggleWorkspaceExpanded:()=>ln});function Ti(){return\`ws-\${Date.now()}-\${Math.random().toString(36).substr(2,9)}\`}function Te(e){return e.trim().replace(/\\/+\$/,"")}function Si(e){let t=Te(e),n=null;for(let o of l.config.workspaces){let r=Te(o.path);(t===r||t.startsWith(\`\${r}/\`))&&(!n||r.length>Te(n.path).length)&&(n=o)}return n}function Mi(e,t,n){let o=l.fileTree.get(e);if(!o)return;let r=Te(t),i=Te(n);if(!(i===r||i.startsWith(\`\${r}/\`)))return;let s=(i===r?"":i.slice(r.length+1)).split("/").filter(Boolean);if(s.length<=1)return;let c=!1,d=r;for(let u=0;u<s.length-1;u+=1){d=\`\${d}/\${s[u]}\`;let m=pn(o,d);m&&m.type==="directory"&&m.isExpanded===!1&&(m.isExpanded=!0,c=!0)}c&&ut(e,pt(o))}function bt(e,t){let n=Te(t),o=l.config.workspaces.find(i=>i.path===n);if(o)return l.currentWorkspace=o.id,l.fileTree.delete(o.id),o;let r={id:Ti(),name:e,path:n,isExpanded:!1};return l.config.workspaces.push(r),H(l.config),l.currentWorkspace=r.id,r}function sn(e){let t=l.config.workspaces.findIndex(n=>n.id===e);t!==-1&&(l.config.workspaces.splice(t,1),H(l.config),l.fileTree.delete(e),Zt(e),mo(e),l.currentWorkspace===e&&(l.currentWorkspace=l.config.workspaces.length>0?l.config.workspaces[0].id:null))}function Ai(e){l.config.workspaces.find(n=>n.id===e)&&(l.currentWorkspace=e)}function wt(e,t){let n=l.config.workspaces,o=n.findIndex(a=>a.id===e);if(o===-1)return;let r=o+t;if(r<0||r>=n.length)return;let[i]=n.splice(o,1);n.splice(r,0,i),H(l.config)}function ln(e){let t=l.config.workspaces.find(n=>n.id===e);t&&(t.isExpanded=!t.isExpanded,H(l.config))}function Li(){return l.currentWorkspace&&l.config.workspaces.find(e=>e.id===l.currentWorkspace)||null}async function Fi(e){try{let t=await fetch("/api/infer-workspace",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filePath:e})});if(!t.ok)return null;let n=await t.json();if(!n.workspacePath)return null;let o=l.config.workspaces.find(i=>i.path===n.workspacePath);if(o)return o;let r=n.workspaceName||n.workspacePath.split("/").pop()||"workspace";return bt(r,n.workspacePath)}catch(t){return console.error("\\u63A8\\u65AD\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",t),null}}async function q(e){let t=l.config.workspaces.find(n=>n.id===e);if(!t)return null;try{let n=new AbortController,o=window.setTimeout(()=>n.abort(),15e3),r=await fetch("/api/scan-workspace",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:t.path}),signal:n.signal});if(window.clearTimeout(o),!r.ok)return console.error("\\u626B\\u63CF\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",await r.text()),null;let i=await r.json(),a=l.fileTree.get(e),s=po(e),c=!a&&(!s||s.size===0);return a?ho(a,i):s&&s.size>0?yt(i,s):(vo(i),\$i(i,2)),l.fileTree.set(e,i),ut(e,pt(i)),Yt(e,wo(i)),i}catch(n){return console.error("\\u626B\\u63CF\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",n),null}}function wo(e){if(!e)return[];if(e.type==="file")return[e.path];let t=[];for(let n of e.children||[])t.push(...wo(n));return t}function vo(e){if(e.type==="directory")for(let t of e.children||[])t.type==="directory"&&(t.isExpanded=!1,vo(t))}function ko(e,t=[]){if(e.type==="file")t.push(e);else for(let n of e.children||[])ko(n,t);return t}function Ci(e,t){function n(o){if(o.type==="file")return o.path===t;for(let r of o.children||[])if(n(r))return o.isExpanded=!0,!0;return!1}n(e)}function \$i(e,t){let n=ko(e);n.sort((i,a)=>(a.lastModified||0)-(i.lastModified||0));let o=n.slice(0,t),r=new Set;for(let i of o){let a=i.path.substring(0,i.path.lastIndexOf("/"));r.has(a)||(r.add(a),Ci(e,i.path))}}async function cn(){let e=l.config.workspaces.filter(t=>t.isExpanded);for(let t of e)await q(t.id);!l.currentWorkspace&&l.config.workspaces.length>0&&(l.currentWorkspace=l.config.workspaces[0].id)}async function dn(e){let t=Si(e);t&&(l.currentWorkspace=t.id,t.isExpanded||(t.isExpanded=!0,H(l.config)),l.fileTree.has(t.id)||await q(t.id),Mi(t.id,t.path,e))}function un(e,t){let n=l.fileTree.get(e);if(!n)return;let o=pn(n,t);if(o&&o.type==="directory"){let r=o.isExpanded!==!1;o.isExpanded=!r,ut(e,pt(n))}}function pn(e,t){if(e.path===t)return e;if(e.children)for(let n of e.children){let o=pn(n,t);if(o)return o}return null}var ze=x(()=>{"use strict";N();pe();xe();bo();Ut()});function Ni(){Se||(Se=document.createElement("div"),Se.id="toast-container",Se.className="toast-container",document.body.appendChild(Se))}function Me(e){let t=typeof e=="string"?{message:e,type:"info",duration:3e3}:{type:"info",duration:3e3,...e};Ni();let n=document.createElement("div");n.className=\`toast toast-\${t.type}\`;let o={success:"\\u2713",error:"\\u2717",warning:"\\u26A0",info:"\\u2139"};return n.innerHTML=\`
    <span class="toast-icon">\${o[t.type]}</span>
    <span class="toast-message">\${t.message}</span>
  \`,Se.appendChild(n),requestAnimationFrame(()=>{n.classList.add("toast-show")}),t.duration&&t.duration>0&&setTimeout(()=>{Eo(n)},t.duration),n.addEventListener("click",()=>{Eo(n)}),n}function Eo(e){e.classList.remove("toast-show"),e.classList.add("toast-hide"),setTimeout(()=>{e.remove()},300)}function z(e,t){return Me({message:e,type:"success",duration:t})}function M(e,t){return Me({message:e,type:"error",duration:t})}function To(e,t){return Me({message:e,type:"warning",duration:t})}function mn(e,t){return Me({message:e,type:"info",duration:t})}var Se,Ae=x(()=>{"use strict";Se=null});var vt={};le(vt,{detectPathType:()=>hn,getNearbyFiles:()=>fn,getPathSuggestions:()=>gn,loadFile:()=>Le,openFile:()=>yn,searchFiles:()=>_e});async function Le(e,t=!1){try{let o=await(await fetch(\`/api/file?path=\${encodeURIComponent(e)}\`)).json();return o.error?(t||M(o.error),null):o}catch(n){return t||M(\`\\u52A0\\u8F7D\\u5931\\u8D25: \${n.message}\`),null}}async function _e(e,t={}){let n=new URLSearchParams({query:e});t.limit&&Number.isFinite(t.limit)&&n.set("limit",String(t.limit));for(let r of t.roots||[])r.trim()&&n.append("root",r.trim());return(await fetch(\`/api/files?\${n.toString()}\`)).json()}async function fn(e){return(await fetch(\`/api/nearby?path=\${encodeURIComponent(e)}\`)).json()}async function gn(e,t={}){let n=t.kind||"file",o=t.markdownOnly!==!1,r=new URLSearchParams({input:e,kind:n,markdownOnly:o?"true":"false"});return(await fetch(\`/api/path-suggestions?\${r.toString()}\`)).json()}async function hn(e){return(await fetch("/api/detect-path",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e})})).json()}async function yn(e,t=!0){await fetch("/api/open",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,focus:t})})}var me=x(()=>{"use strict";Ae()});function b(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}function w(e){return b(e)}var fe=x(()=>{"use strict"});function So(e,t){let n=e.split(\`
\`),o=t.split(\`
\`),r=n.length,i=o.length;if(r===0&&i===0)return[];let a=r+i,s=new Array(2*a+1).fill(0),c=[];e:for(let h=0;h<=a;h++){c.push([...s]);for(let v=-h;v<=h;v+=2){let E=v+a,k;v===-h||v!==h&&s[E-1]<s[E+1]?k=s[E+1]:k=s[E-1]+1;let S=k-v;for(;k<r&&S<i&&n[k]===o[S];)k++,S++;if(s[E]=k,k>=r&&S>=i)break e}}let d=[],u=r,m=i;for(let h=c.length-1;h>=0&&(u>0||m>0);h--){let v=c[h],E=u-m,k=E+a,S;E===-h||E!==h&&v[k-1]<v[k+1]?S=E+1:S=E-1;let \$=v[S+a],I=\$-S;for(;u>\$+1&&m>I+1;)d.unshift({type:"equal",x:u-1,y:m-1}),u--,m--;h>0&&(u===\$+1&&m===I+1&&\$>=0&&I>=0&&n[\$]===o[I]?d.unshift({type:"equal",x:\$,y:I}):u>\$?d.unshift({type:"delete",x:\$,y:-1}):d.unshift({type:"insert",x:-1,y:I})),u=\$,m=I}let p=[],g=1,y=1;for(let h of d)h.type==="equal"?p.push({type:"equal",content:n[h.x],oldLineNo:g++,newLineNo:y++}):h.type==="delete"?p.push({type:"delete",content:n[h.x],oldLineNo:g++}):p.push({type:"insert",content:o[h.y],newLineNo:y++});return p}var Mo=x(()=>{"use strict"});function kt(e){let n=Date.now()-e,o=Math.floor(n/1e3),r=Math.floor(o/60),i=Math.floor(r/60),a=Math.floor(i/24);return a>0?\`\${a}\\u5929\\u524D\`:i>0?\`\${i}\\u5C0F\\u65F6\\u524D\`:r>0?\`\${r}\\u5206\\u949F\\u524D\`:"\\u521A\\u521A"}var Ao=x(()=>{"use strict"});function xt(e){let t=Array.from(e.values()),n={};return t.forEach(o=>{n[o.name]=(n[o.name]||0)+1}),t.map(o=>{if(n[o.name]===1)return{...o,displayName:o.name};let r=o.path.split("/").filter(Boolean),i=t.filter(s=>s.name===o.name&&s.path!==o.path),a="";for(let s=r.length-2;s>=0;s--){let c=r[s];if(i.every(d=>d.path.split("/").filter(Boolean)[s]!==c)){a=c;break}}return!a&&r.length>=2&&(a=r[r.length-2]),{...o,displayName:a?\`\${o.name} (\${a})\`:o.name}})}var Lo=x(()=>{"use strict"});function _(e,t=!1){return e.isMissing?{badge:"D",color:"#ff3b30",type:"deleted"}:e.lastModified>e.displayedModified?{badge:"M",color:"#ff9500",type:"modified"}:t?{badge:"dot",color:"#007AFF",type:"new"}:{badge:null,color:null,type:"normal"}}var Et=x(()=>{"use strict"});function bn(e){let t=e.match(/\\.([^.]+)\$/);return t?t[1].toLowerCase():""}function Bi(e){let t=bn(e);return t==="html"||t==="htm"}function wn(e){return bn(e)==="json"}function Ke(e){return bn(e)==="jsonl"}function ge(e){return Bi(e)?{cls:"html",label:"<>"}:wn(e)||Ke(e)?{cls:"json",label:"{}"}:{cls:"md",label:"M"}}var Je=x(()=>{"use strict"});function Fe(e,t,n,o){if(t.length===0)return[];if(e==="close-all")return t.map(r=>r.path);if(!n)return[];if(e==="close-others")return t.filter(r=>r.path!==n).map(r=>r.path);if(e==="close-right"){let r=t.findIndex(i=>i.path===n);return r<0?[]:t.slice(r+1).map(i=>i.path)}return t.filter(r=>r.path!==n&&o(r.path)).map(r=>r.path)}var Fo=x(()=>{"use strict"});function Ue(e){return e&&(e.replace(/\\.(md|markdown|html?)\$/i,"")||e)}var vn=x(()=>{"use strict"});var En={};le(En,{getPinnedFiles:()=>xn,isPinned:()=>kn,pinFile:()=>Ii,unpinFile:()=>Hi});function Tt(){try{let e=localStorage.getItem(Co);if(!e)return new Set;let t=JSON.parse(e);return Array.isArray(t)?new Set(t):new Set}catch{return new Set}}function \$o(e){try{localStorage.setItem(Co,JSON.stringify(Array.from(e)))}catch{}}function kn(e){return Tt().has(e)}function Ii(e){let t=Tt();t.add(e),\$o(t)}function Hi(e){let t=Tt();t.delete(e),\$o(t)}function xn(){return Tt()}var Co,Ve=x(()=>{"use strict";Co="md-viewer:pinned-files"});function Wi(e){let t=e.replace(/[.+^\${}()|[\\]\\\\]/g,"\\\\\$&");return t=t.replace(/\\*\\*/g,"\\xA7GLOBSTAR\\xA7"),t=t.replace(/\\*/g,"[^/]*"),t=t.replace(/\\?/g,"[^/]"),t=t.replace(/§GLOBSTAR§/g,".*"),e.endsWith("/")?new RegExp(\`(^|/)\${t}\`):new RegExp(\`(^|/)\${t}(/|\$)\`)}function ji(e,t,n){if(!n.length)return!1;let o=e.startsWith(t+"/")?e.slice(t.length+1):e;return n.some(r=>Wi(r).test(o))}function Bo(e){if(e.type==="file")return[e];let t=[];for(let n of e.children||[])t.push(...Bo(n));return t}function Pi(e,t,n,o){if(!t)return[];let r=Date.now()-n,i=t.ignorePatterns||[];return Bo(t).filter(s=>i.length&&ji(s.path,e,i)?!1:!!(o.has(s.path)||typeof s.lastModified=="number"&&s.lastModified>=r)).sort((s,c)=>{let d=o.has(s.path),u=o.has(c.path);return d!==u?d?-1:1:(c.lastModified||0)-(s.lastModified||0)})}function Di(e){let t=Date.now()-e,n=Math.floor(t/6e4);if(n<60)return\`\${n}m\`;let o=Math.floor(t/36e5);return o<24?\`\${o}h\`:\`\${Math.floor(t/864e5)}d\`}function Ri(e,t){if(!t)return b(e);let n=e.toLowerCase().indexOf(t.toLowerCase());return n===-1?b(e):b(e.slice(0,n))+\`<mark class="search-highlight">\${b(e.slice(n,n+t.length))}</mark>\`+b(e.slice(n+t.length))}function Oi(e,t,n){let o=l.currentFile===e.path,r=t.has(e.path),i=l.sessionFiles.get(e.path),a=i?_(i).type:"normal",s=ge(e.path),c=Ue(e.name)||e.name,d=e.lastModified?Di(e.lastModified):"",u=a==="modified"?'<span class="focus-file-dot modified"></span>':a==="new"?'<span class="focus-file-dot new-file"></span>':"",m=r?\`<button class="tree-pin-btn active" title="\\u53D6\\u6D88\\u56FA\\u5B9A" onclick="event.stopPropagation();handleUnpinFile('\${w(e.path)}')" data-path="\${w(e.path)}">\\u{1F4CC}</button>\`:\`<button class="tree-pin-btn" title="\\u56FA\\u5B9A\\u5230\\u7126\\u70B9\\u89C6\\u56FE" onclick="event.stopPropagation();handlePinFile('\${w(e.path)}')">\\u{1F4CC}</button>\`;return\`
    <div class="tree-item file-node focus-file-item\${o?" current":""}"
         data-path="\${w(e.path)}"
         onclick="handleFocusFileClick('\${w(e.path)}')">
      <span class="tree-indent" style="width:8px"></span>
      <span class="file-type-icon \${s.cls}">\${b(s.label)}</span>
      <span class="tree-name"><span class="tree-name-full">\${Ri(c,n)}</span></span>
      \${u}
      \${d?\`<span class="focus-file-time">\${b(d)}</span>\`:""}
      \${m}
    </div>
  \`}function qi(){let e=l.config.focusWindowKey||"8h";return\`
    <div class="focus-filter-bar">
      <span class="focus-filter-label">\\u6700\\u8FD1</span>
      <div class="focus-time-pills">\${[{key:"8h",label:"8h"},{key:"2d",label:"2d"},{key:"1w",label:"1w"},{key:"1m",label:"1m"}].map(o=>\`<button class="focus-time-pill\${e===o.key?" active":""}"
             onclick="setFocusWindowKey('\${o.key}')">\${o.label}</button>\`).join("")}</div>
    </div>
  \`}function zi(e,t,n,o,r){let i=t.length>0,a=o?'<span class="focus-ws-badge empty">\\u2026</span>':i?\`<span class="focus-ws-badge">\${t.length}</span>\`:'<span class="focus-ws-badge empty">0</span>',s=i?t.map(c=>Oi(c,n,r)).join(""):"";return\`
    <div class="focus-ws-group\${i?" has-files":""}">
      <div class="focus-ws-header" onclick="handleFocusWorkspaceToggle('\${w(e.id)}')">
        <span class="focus-ws-arrow\${i?" open":""}">\\u25B6</span>
        <span class="focus-ws-name">\${b(e.name)}</span>
        \${a}
      </div>
      \${i?\`<div class="focus-ws-files">\${s}</div>\`:""}
    </div>
  \`}function Io(){let e=l.config.workspaces;if(e.length===0)return'<div class="focus-empty">\\u6682\\u65E0\\u5DE5\\u4F5C\\u533A</div>';let t=No[l.config.focusWindowKey||"8h"]??No["8h"],n=xn(),o=l.searchQuery.trim().toLowerCase(),r=e.map(i=>{let a=l.fileTree.get(i.id),s=!a;!a&&!Tn.has(i.id)&&(Tn.add(i.id),q(i.id).then(d=>{Tn.delete(i.id),d&&Promise.resolve().then(()=>(L(),F)).then(({renderSidebar:u})=>u())}));let c=Pi(i.path,a,t,n);return o&&(c=c.filter(d=>(Ue(d.name)||d.name).toLowerCase().includes(o)||d.path.toLowerCase().includes(o))),zi(i,c,n,s,o)}).join("");return\`<div class="focus-view">\${qi()}\${r}</div>\`}var Tn,No,Ho=x(()=>{"use strict";N();fe();Et();Je();vn();Ve();ze();Tn=new Set,No={"8h":8*3600*1e3,"2d":2*86400*1e3,"1w":7*86400*1e3,"1m":30*86400*1e3}});function St(e,t){let n=[],o=-1,r=0,i=null,a=document.createElement("div");a.className="path-autocomplete-panel",a.style.display="none",document.body.appendChild(a);let s=()=>a.style.display!=="none",c=()=>{r+=1,i!==null&&(window.clearTimeout(i),i=null),a.style.display="none",n=[],o=-1},d=()=>{let y=e.getBoundingClientRect();a.style.left=\`\${Math.round(y.left+window.scrollX)}px\`,a.style.top=\`\${Math.round(y.bottom+window.scrollY+4)}px\`,a.style.width=\`\${Math.round(y.width)}px\`},u=()=>{if(n.length===0){c();return}a.innerHTML=n.map((y,h)=>{let v=h===o?"path-autocomplete-item active":"path-autocomplete-item",E=y.type==="directory"?"\\u{1F4C1}":"\\u{1F4C4}";return\`
          <div class="\${v}" data-index="\${h}">
            <span class="path-autocomplete-icon">\${E}</span>
            <span class="path-autocomplete-text">\${_i(y.display)}</span>
          </div>
        \`}).join(""),d(),a.style.display="block"},m=y=>{let h=n[y];if(!h)return;let v=h.type==="directory",E=v&&!h.path.endsWith("/")?\`\${h.path}/\`:h.path;e.value=E,e.dispatchEvent(new Event("input",{bubbles:!0})),e.focus(),e.setSelectionRange(e.value.length,e.value.length),c(),v&&g()},p=async()=>{let y=e.value.trim();if(!y){c();return}if(document.body.classList.contains("quick-action-confirm-visible")){c();return}if(t.shouldActivate&&!t.shouldActivate(y)){c();return}let h=++r;try{let v=await gn(y,{kind:t.kind,markdownOnly:t.markdownOnly});if(h!==r)return;n=v.suggestions||[],o=n.length>0?0:-1,u()}catch{c()}},g=()=>{i!==null&&window.clearTimeout(i),i=window.setTimeout(p,100)};a.addEventListener("mousedown",y=>{y.preventDefault();let h=y.target.closest(".path-autocomplete-item");if(!h)return;let v=Number(h.dataset.index);Number.isNaN(v)||m(v)}),e.addEventListener("focus",g),e.addEventListener("input",g),e.addEventListener("path-autocomplete-hide",c),e.addEventListener("keydown",y=>{let h=y.key;if(s()){if(h==="ArrowDown"){y.preventDefault(),n.length>0&&(o=(o+1)%n.length,u());return}if(h==="ArrowUp"){y.preventDefault(),n.length>0&&(o=(o-1+n.length)%n.length,u());return}if(h==="Tab"){o>=0&&(y.preventDefault(),m(o));return}if(h==="Enter"){if(y.metaKey||y.ctrlKey)return;if(y.preventDefault(),o>=0){m(o);return}c();return}h==="Escape"&&(y.preventDefault(),c())}}),e.addEventListener("blur",()=>{window.setTimeout(c,120)}),window.addEventListener("resize",()=>{s()&&d()}),window.addEventListener("scroll",()=>{s()&&d()},!0)}function _i(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}var Sn=x(()=>{"use strict";me()});function Ki(e){let t=e.split("/").filter(Boolean);return t[t.length-1]||"workspace"}function Do(e){let t=Ue(e)||e;return\`<span class="tree-name-full">\${b(t)}</span>\`}function Ro(e,t){if(e){if(e.type==="file"){t.add(e.path);return}(e.children||[]).forEach(n=>Ro(n,t))}}function Oo(e){if(e.type==="file")return 1;let t=0;for(let n of e.children||[])t+=Oo(n);return e.fileCount=t,t}function Ji(e,t){let n=e.path.replace(/\\/+\$/,""),o={name:e.name,path:n,type:"directory",isExpanded:!0,children:[]},r=new Map([[n,o]]),i=Array.from(new Set(t)).sort((a,s)=>a.localeCompare(s,"zh-CN"));for(let a of i){if(!a.startsWith(\`\${n}/\`))continue;let c=a.slice(n.length+1).split("/").filter(Boolean);if(c.length===0)continue;let d=n,u=o;for(let m=0;m<c.length;m+=1){let p=c[m],g=m===c.length-1;if(d=\`\${d}/\${p}\`,g)(u.children||[]).some(h=>h.path===d)||u.children.push({name:p,path:d,type:"file"});else{let y=r.get(d);y||(y={name:p,path:d,type:"directory",isExpanded:!0,children:[]},r.set(d,y),u.children.push(y)),u=y}}}return Oo(o),o}function Ui(e,t){if(!t)return l.fileTree.get(e.id);let n=e.path.replace(/\\/+\$/,""),o=\`\${n}/\`,r=Array.from(Ne).filter(i=>i===n||i.startsWith(o));if(r.length!==0)return Ji(e,r)}function Vi(){return l.config.workspaces.map(e=>e.path.trim()).filter(Boolean)}function jo(){Y="",be="",Z=!1,\$e=!1,Ne=new Set}async function Gi(e,t,n,o){try{let i=await _e(e,{roots:t,limit:200});if(o!==Mt)return;Y=e,be=n,Ne=new Set((i.files||[]).map(a=>a.path).filter(Boolean)),Z=!1,\$e=!0}catch(i){if(o!==Mt)return;console.error("\\u5DE5\\u4F5C\\u533A\\u641C\\u7D22\\u5931\\u8D25:",i),Y=e,be=n,Ne=new Set,Z=!1,\$e=!0}let{renderSidebar:r}=await Promise.resolve().then(()=>(L(),F));r()}function Qi(e){let t=e.trim();if(!t){jo();return}if(t.startsWith("/")||t.startsWith("~/")||t.startsWith("~\\\\")){jo();return}let n=Vi(),o=n.join(\`
\`);if(n.length===0){Y=t,be=o,Ne=new Set,Z=!1,\$e=!0;return}\$e&&!Z&&Y===t&&be===o||Z&&Y===t&&be===o||(Mt+=1,Y=t,be=o,Z=!0,\$e=!1,Ne=new Set,Gi(t,n,o,Mt))}function qo(){let e=document.getElementById(Xe),t=document.getElementById(Po);if(!t)return;let n=e?.value.trim()||"";t.textContent=n||"\\u8DEF\\u5F84\\u9884\\u89C8\\uFF1A\\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u540E\\u8FD9\\u91CC\\u4F1A\\u663E\\u793A\\u5B8C\\u6574\\u8DEF\\u5F84"}function Xi(){let e=document.getElementById(Mn);if(e)return e;let t=document.createElement("div");t.id=Mn,t.className="sync-dialog-overlay add-workspace-overlay",t.innerHTML=\`
    <div class="sync-dialog add-workspace-dialog">
      <div class="sync-dialog-header">
        <div class="sync-dialog-title">\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A</div>
        <button class="sync-dialog-close" onclick="closeAddWorkspaceDialog()">\\xD7</button>
      </div>
      <div class="sync-dialog-body">
        <div class="sync-dialog-field">
          <label class="sync-dialog-label">\\u{1F4C1} \\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84</label>
          <textarea
            id="\${Xe}"
            class="sync-dialog-input workspace-path-input"
            rows="3"
            placeholder="/Users/huanghao/workspace/md-viewer"
          ></textarea>
          <div class="workspace-path-hint">\\u652F\\u6301\\u7C98\\u8D34\\u957F\\u8DEF\\u5F84\\u3002\\u6309 Ctrl/Cmd + Enter \\u5FEB\\u901F\\u786E\\u8BA4\\u3002</div>
          <div id="\${Po}" class="workspace-path-preview">\\u8DEF\\u5F84\\u9884\\u89C8\\uFF1A\\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u540E\\u8FD9\\u91CC\\u4F1A\\u663E\\u793A\\u5B8C\\u6574\\u8DEF\\u5F84</div>
        </div>
      </div>
      <div class="sync-dialog-footer add-workspace-footer">
        <button class="sync-dialog-btn" onclick="closeAddWorkspaceDialog()">\\u53D6\\u6D88</button>
        <button class="sync-dialog-btn sync-dialog-btn-primary" onclick="confirmAddWorkspaceDialog()">\\u6DFB\\u52A0</button>
      </div>
    </div>
  \`,document.body.appendChild(t),t.addEventListener("click",o=>{o.target===t&&At()});let n=t.querySelector(\`#\${Xe}\`);return n&&(St(n,{kind:"directory",markdownOnly:!1}),n.addEventListener("input",qo),n.addEventListener("keydown",o=>{(o.metaKey||o.ctrlKey)&&o.key==="Enter"&&(o.preventDefault(),window.confirmAddWorkspaceDialog()),o.key==="Escape"&&(o.preventDefault(),At())})),t}function Yi(){Xi().classList.add("show");let t=document.getElementById(Xe);t&&(t.value="",qo(),t.focus())}function At(){let e=document.getElementById(Mn);e&&e.classList.remove("show")}async function Zi(){try{let e=document.getElementById(Xe),t=e?.value.trim()||"";if(!t){To("\\u8BF7\\u8F93\\u5165\\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84"),e?.focus();return}let n=Ki(t),{addWorkspace:o}=await Promise.resolve().then(()=>(ze(),xo)),r=o(n,t),{renderSidebar:i}=await Promise.resolve().then(()=>(L(),F));i(),At(),z(\`\\u5DF2\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A: \${r.name}\`,2e3)}catch(e){console.error("\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",e),M(\`\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25: \${e?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)}}function zo(){if(l.config.sidebarTab==="focus")return Io();let e=l.searchQuery.trim().toLowerCase();return Qi(e),\`\${ea(e)}\`}function ea(e){let t=l.config.workspaces,n=t.map((o,r)=>na(o,r,t.length,e)).filter(Boolean).join("");return\`
    <div class="workspace-section">
      \${t.length===0?ta():""}
      \${t.length>0&&!n?'<div class="empty-workspace"><p>\\u672A\\u627E\\u5230\\u5339\\u914D\\u5185\\u5BB9</p></div>':""}
      \${n}
    </div>
  \`}function ta(){return\`
    <div class="empty-workspace">
      <p>\\u6682\\u65E0\\u5DE5\\u4F5C\\u533A</p>
      <p style="font-size: 12px; color: #57606a; margin-top: 8px;">
        \\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u76EE\\u5F55\\u8DEF\\u5F84\\u540E\\u56DE\\u8F66\\u6DFB\\u52A0
      </p>
    </div>
  \`}function na(e,t,n,o){let r=l.currentWorkspace===e.id,i=o?Ui(e,o):l.fileTree.get(e.id),a=o?!0:e.isExpanded,s=a?"\\u25BC":"\\u25B6",c=t>0,d=t<n-1,u=!o||e.name.toLowerCase().includes(o)||e.path.toLowerCase().includes(o),m=!!i&&!!i.children&&i.children.length>0,p=a?ra(e.id,e.path,i,o):"";return o&&!u&&!m&&!!!p?"":\`
    <div class="workspace-item">
      <div class="workspace-header \${r?"active":""}" onclick="handleWorkspaceToggle('\${w(e.id)}')">
        <span class="workspace-toggle">\${s}</span>
        <span class="workspace-icon">\\u{1F4C1}</span>
        <span class="workspace-name">\${b(e.name)}</span>
        \${Ge===e.id?\`
          <div class="workspace-remove-actions" onclick="event.stopPropagation()">
            \${c?\`
            <button
              class="workspace-order-btn"
              title="\\u4E0A\\u79FB"
              onclick="handleMoveWorkspaceUp('\${w(e.id)}')"
            >\\u2191</button>
            \`:""}
            \${d?\`
            <button
              class="workspace-order-btn"
              title="\\u4E0B\\u79FB"
              onclick="handleMoveWorkspaceDown('\${w(e.id)}')"
            >\\u2193</button>
            \`:""}
            <button
              class="workspace-remove-confirm"
              title="\\u786E\\u8BA4\\u79FB\\u9664"
              onclick="handleConfirmRemoveWorkspace('\${w(e.id)}')"
            >\\u5220</button>
          </div>
        \`:\`
          <div class="workspace-remove-actions" onclick="event.stopPropagation()">
            \${c?\`
            <button
              class="workspace-order-btn"
              title="\\u4E0A\\u79FB"
              onclick="handleMoveWorkspaceUp('\${w(e.id)}')"
            >\\u2191</button>
            \`:""}
            \${d?\`
            <button
              class="workspace-order-btn"
              title="\\u4E0B\\u79FB"
              onclick="handleMoveWorkspaceDown('\${w(e.id)}')"
            >\\u2193</button>
            \`:""}
          <button
            class="workspace-remove"
            title="\\u79FB\\u9664\\u5DE5\\u4F5C\\u533A"
            onclick="event.stopPropagation();handleAskRemoveWorkspace('\${w(e.id)}')"
          >
            \\xD7
          </button>
          </div>
        \`}
      </div>
      \${a?oa(e.id,i,o):""}
      \${p}
    </div>
  \`}function oa(e,t,n){return n&&Z&&Y===n?\`
      <div class="file-tree loading">
        <div class="tree-loading">\\u641C\\u7D22\\u4E2D...</div>
      </div>
    \`:Qe.has(e)?\`
      <div class="file-tree loading">
        <div class="tree-loading">\\u52A0\\u8F7D\\u4E2D...</div>
      </div>
    \`:Ce.has(e)?\`
      <div class="file-tree empty">
        <div class="tree-empty" onclick="retryWorkspaceScan('\${w(e)}')" style="cursor: pointer;">\\u52A0\\u8F7D\\u5931\\u8D25\\uFF0C\\u70B9\\u51FB\\u91CD\\u8BD5</div>
      </div>
    \`:t?!t.children||t.children.length===0?\`
      <div class="file-tree empty">
        <div class="tree-empty">\${n?"\\u672A\\u627E\\u5230\\u5339\\u914D\\u6587\\u4EF6":"\\u6B64\\u76EE\\u5F55\\u4E0B\\u6CA1\\u6709 Markdown/HTML \\u6587\\u4EF6"}</div>
      </div>
    \`:\`
    <div class="file-tree">
      \${t.children.map(o=>_o(e,o,1)).join("")}
    </div>
  \`:\`
      <div class="file-tree empty">
        <div class="tree-empty">\${n?"\\u672A\\u627E\\u5230\\u5339\\u914D\\u6587\\u4EF6":"\\u76EE\\u5F55\\u6682\\u4E0D\\u53EF\\u7528"}</div>
      </div>
    \`}function _o(e,t,n){let o=4+n*8,r=l.currentFile===t.path;if(t.type==="file"){let c=Ee(t.path),d=U(t.path),u=!!c?.isMissing||zt(t.path),m=ge(t.path),p=Gt(t.path),g="&nbsp;";if(c){let E=_(c,d);E.badge==="dot"?g='<span class="new-dot"></span>':E.badge&&(g=\`<span class="status-badge status-\${E.type}" style="color: \${E.color}">\${E.badge}</span>\`)}else u?g='<span class="status-badge status-deleted" style="color: #cf222e">D</span>':p?g='<span class="status-badge status-modified" style="color: #ff9500">M</span>':d&&(g='<span class="new-dot"></span>');let y=["tree-item","file-node",u?"missing":"",r?"current":""].filter(Boolean).join(" "),h=kn(t.path),v=\`<button
  class="tree-pin-btn\${h?" active":""}"
  title="\${h?"\\u53D6\\u6D88\\u56FA\\u5B9A\\u5230\\u7126\\u70B9\\u89C6\\u56FE":"\\u56FA\\u5B9A\\u5230\\u7126\\u70B9\\u89C6\\u56FE"}"
  onclick="event.stopPropagation();\${h?"handleUnpinFile":"handlePinFile"}('\${w(t.path)}')"
>\\u{1F4CC}</button>\`;return\`
      <div class="tree-node">
        <div class="\${y}"
             onclick="handleFileClick('\${w(t.path)}')">
          <span class="tree-indent" style="width: \${o}px"></span>
          <span class="tree-toggle"></span>
          <span class="file-type-icon \${m.cls}">\${b(m.label)}</span>
          <span class="tree-status-inline">\${g}</span>
          <span class="tree-name" title="\${w(t.name)}">\${Do(t.name)}</span>
          \${v}
        </div>
      </div>
    \`}let i=t.isExpanded!==!1,a=i?"\\u25BC":"\\u25B6",s=t.children&&t.children.length>0;return\`
    <div class="tree-node">
      <div class="tree-item directory-node">
        <span class="tree-indent" style="width: \${o}px"></span>
        <span class="tree-toggle" onclick="\${s?\`event.stopPropagation();handleNodeClick('\${w(e)}', '\${w(t.path)}')\`:""}">\${s?a:""}</span>
        <span class="tree-name" onclick="\${s?\`event.stopPropagation();handleNodeClick('\${w(e)}', '\${w(t.path)}')\`:""}">\${b(t.name)}</span>
        \${t.fileCount?\`<span class="tree-count">\${t.fileCount}</span>\`:""}
      </div>
      \${i&&s?\`
        <div class="file-tree">
          \${t.children.map(c=>_o(e,c,n+1)).join("")}
        </div>
      \`:""}
    </div>
  \`}function ra(e,t,n,o){let r=new Set;Ro(n,r);let i=\`\${t}/\`,a=en().filter(u=>!u.isMissing||!u.path.startsWith(i)||r.has(u.path)?!1:o?u.name.toLowerCase().includes(o)||u.path.toLowerCase().includes(o):!0),s=new Set(a.map(u=>u.path)),c=_t(t).filter(u=>!s.has(u)).filter(u=>!r.has(u)).filter(u=>{if(!o)return!0;let m=u.toLowerCase(),p=(u.split("/").pop()||"").toLowerCase();return m.includes(o)||p.includes(o)});return a.length===0&&c.length===0?"":\`
    <div class="tree-missing-section">
      <div class="tree-missing-title">\\u5DF2\\u5220\\u9664</div>
      \${[...a.map(u=>({path:u.path,name:u.path.split("/").pop()||u.name,isCurrent:l.currentFile===u.path,hasRetry:!0,hasClose:!0})),...c.map(u=>({path:u,name:u.split("/").pop()||u,isCurrent:l.currentFile===u,hasRetry:!1,hasClose:!1}))].map(u=>{let m=ge(u.path);return\`
          <div class="tree-item file-node missing \${u.isCurrent?"current":""}" onclick="handleFileClick('\${w(u.path)}')">
            <span class="tree-indent" style="width: 12px"></span>
            <span class="tree-toggle"></span>
            <span class="file-type-icon \${m.cls}">\${b(m.label)}</span>
            <span class="tree-status-inline"><span class="status-badge status-deleted">D</span></span>
            <span class="tree-name" title="\${w(u.name)}">\${Do(u.name)}</span>
            \${u.hasRetry?\`<button class="tree-inline-action" title="\\u91CD\\u8BD5\\u52A0\\u8F7D" onclick="event.stopPropagation(); handleRetryMissingFile('\${w(u.path)}')">\\u21BB</button>\`:""}
            \${u.hasClose?\`<button class="tree-inline-action danger" title="\\u5173\\u95ED\\u6587\\u4EF6" onclick="event.stopPropagation(); handleCloseFile('\${w(u.path)}')">\\xD7</button>\`:""}
          </div>
        \`}).join("")}
    </div>
  \`}function Ko(){Wo||(Wo=!0,document.addEventListener("click",async e=>{if(!Ge)return;let t=e.target;if(!t||t.closest(".workspace-remove-actions")||t.closest(".workspace-remove"))return;Ge=null;let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n()})),window.handleWorkspaceToggle=async e=>{let t=l.config.workspaces.find(o=>o.id===e);if(!t)return;if(l.currentWorkspace=e,l.searchQuery.trim()){let{renderSidebar:o}=await Promise.resolve().then(()=>(L(),F));o();return}if(ln(e),t.isExpanded&&!l.fileTree.has(e)){Qe.add(e),Ce.delete(e);let{renderSidebar:o}=await Promise.resolve().then(()=>(L(),F));o();let r=await q(e);Qe.delete(e),r?Ce.delete(e):(Ce.add(e),M(\`\\u5DE5\\u4F5C\\u533A\\u626B\\u63CF\\u5931\\u8D25\\uFF1A\${t.name}\`))}let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n()},window.retryWorkspaceScan=async e=>{Qe.add(e),Ce.delete(e);let{renderSidebar:t}=await Promise.resolve().then(()=>(L(),F));t();let n=await q(e);Qe.delete(e),n||(Ce.add(e),M("\\u91CD\\u8BD5\\u5931\\u8D25\\uFF0C\\u8BF7\\u68C0\\u67E5\\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84\\u662F\\u5426\\u53EF\\u8BBF\\u95EE")),t()},window.handleAskRemoveWorkspace=async e=>{Ge=e;let{renderSidebar:t}=await Promise.resolve().then(()=>(L(),F));t()},window.handleConfirmRemoveWorkspace=async e=>{let t=l.config.workspaces.find(o=>o.id===e);if(!t)return;sn(e),Ge=null;let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n(),z(\`\\u5DF2\\u79FB\\u9664\\u5DE5\\u4F5C\\u533A: \${t.name}\`,2e3)},window.handleNodeClick=async(e,t)=>{un(e,t);let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n()},window.handleFileClick=async e=>{mt(e),j(e);let{switchToFile:t}=await Promise.resolve().then(()=>(N(),V)),{loadFile:n}=await Promise.resolve().then(()=>(me(),vt));if(ht(e))t(e);else{let r=await n(e,!0);if(!r){let{markFileMissing:a}=await Promise.resolve().then(()=>(N(),V));a(e,!0),(await Promise.resolve().then(()=>(ye(),he))).renderAll(),M("\\u6587\\u4EF6\\u5DF2\\u5220\\u9664\\uFF0C\\u5DF2\\u6807\\u8BB0\\u4E3A D\\uFF08\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\uFF09");return}let{addOrUpdateFile:i}=await Promise.resolve().then(()=>(N(),V));i(r,!0)}(await Promise.resolve().then(()=>(ye(),he))).renderAll()},window.handleCloseFile=async e=>{let{removeFile:t}=await Promise.resolve().then(()=>(N(),V));t(e),(await Promise.resolve().then(()=>(ye(),he))).renderAll()},window.handleRetryMissingFile=async e=>{let{loadFile:t}=await Promise.resolve().then(()=>(me(),vt)),{addOrUpdateFile:n}=await Promise.resolve().then(()=>(N(),V)),o=await t(e);if(!o)return;n(o,l.currentFile===e),(await Promise.resolve().then(()=>(ye(),he))).renderAll(),z("\\u6587\\u4EF6\\u5DF2\\u91CD\\u65B0\\u52A0\\u8F7D",2e3)},window.showAddWorkspaceDialog=Yi,window.closeAddWorkspaceDialog=At,window.confirmAddWorkspaceDialog=Zi,window.handleMoveWorkspaceUp=async e=>{wt(e,-1);let{renderSidebar:t}=await Promise.resolve().then(()=>(L(),F));t()},window.handleMoveWorkspaceDown=async e=>{wt(e,1);let{renderSidebar:t}=await Promise.resolve().then(()=>(L(),F));t()},window.handleFocusFileClick=async e=>{mt(e),j(e);let{switchToFile:t}=await Promise.resolve().then(()=>(N(),V)),{loadFile:n}=await Promise.resolve().then(()=>(me(),vt));if(ht(e))t(e);else{let r=await n(e,!0);if(!r){let{markFileMissing:a}=await Promise.resolve().then(()=>(N(),V));a(e,!0),(await Promise.resolve().then(()=>(ye(),he))).renderAll(),M("\\u6587\\u4EF6\\u5DF2\\u5220\\u9664\\uFF0C\\u5DF2\\u6807\\u8BB0\\u4E3A D\\uFF08\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\uFF09");return}let{addOrUpdateFile:i}=await Promise.resolve().then(()=>(N(),V));i(r,!0)}(await Promise.resolve().then(()=>(ye(),he))).renderAll()},window.handleUnpinFile=async e=>{let{unpinFile:t}=await Promise.resolve().then(()=>(Ve(),En));t(e);let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n()},window.handlePinFile=async e=>{let{pinFile:t}=await Promise.resolve().then(()=>(Ve(),En));t(e);let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n()},window.handleFocusWorkspaceToggle=e=>{},window.setFocusWindowKey=e=>{l.config.focusWindowKey=e,Promise.resolve().then(()=>(xe(),no)).then(({saveConfig:t})=>t(l.config)),Promise.resolve().then(()=>(L(),F)).then(({renderSidebar:t})=>t())}}var Mn,Xe,Po,Ge,Wo,Qe,Ce,Y,be,Z,\$e,Ne,Mt,Jo=x(()=>{"use strict";N();Ho();pe();me();fe();Et();Je();vn();Ae();Sn();ze();pe();Ve();Mn="addWorkspaceDialogOverlay",Xe="addWorkspacePathInput",Po="addWorkspacePathPreview",Ge=null,Wo=!1,Qe=new Set,Ce=new Set,Y="",be="",Z=!1,\$e=!1,Ne=new Set,Mt=0});function Uo(e){let t=[0];for(let n of e){let o=n.nodeValue?.length??0;t.push(t[t.length-1]+o)}return{nodes:e,cumulative:t,totalLength:t[t.length-1]}}function Vo(e,t){if(e.nodes.length===0)return null;if(t>=e.totalLength){let r=e.nodes[e.nodes.length-1];return{node:r,offset:r.nodeValue?.length??0}}let n=0,o=e.nodes.length-1;for(;n<o;){let r=n+o+1>>1;e.cumulative[r]<=t?n=r:o=r-1}return{node:e.nodes[n],offset:t-e.cumulative[n]}}function Go(e){let t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),n=[],o;for(;o=t.nextNode();)o.nodeValue&&o.nodeValue.length>0&&n.push(o);return n}var Qo=x(()=>{"use strict"});async function Ye(e){let t=await e.json().catch(()=>null);if(!e.ok)throw new Error(t?.error||\`HTTP \${e.status}\`);return t}async function Xo(e){let t=await fetch(\`/api/annotations?path=\${encodeURIComponent(e)}\`),n=await Ye(t);return Array.isArray(n?.annotations)?n.annotations:[]}async function Yo(e,t){let n=await fetch("/api/annotations/item",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,annotation:t})}),o=await Ye(n);if(o?.success!==!0||!o?.annotation)throw new Error(o?.error||"\\u4FDD\\u5B58\\u8BC4\\u8BBA\\u5931\\u8D25");return o.annotation}async function Zo(e,t,n,o){let r=await fetch("/api/annotations/reply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,...t,text:n,author:o})}),i=await Ye(r);if(i?.success!==!0||!i?.annotation)throw new Error(i?.error||"\\u56DE\\u590D\\u8BC4\\u8BBA\\u5931\\u8D25");return i.annotation}async function er(e,t){let n=await fetch("/api/annotations/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,...t})}),o=await Ye(n);if(o?.success!==!0)throw new Error(o?.error||"\\u5220\\u9664\\u8BC4\\u8BBA\\u5931\\u8D25")}async function tr(e,t,n){let o=await fetch("/api/annotations/status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,...t,status:n})}),r=await Ye(o);if(r?.success!==!0||!r?.annotation)throw new Error(r?.error||"\\u66F4\\u65B0\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25");return r.annotation}var nr=x(()=>{"use strict"});function ia(e,t){if(!t)return[];let n=[],o=e.indexOf(t);for(;o>=0;)n.push(o),o=e.indexOf(t,o+1);return n}function aa(e,t,n,o){let r=0,i=Math.max(0,o.start||0),a=Math.abs(n-i);if(r+=Math.max(0,1e3-Math.min(1e3,a)),o.quotePrefix&&e.slice(Math.max(0,n-o.quotePrefix.length),n)===o.quotePrefix&&(r+=500),o.quoteSuffix){let s=n+t.length;e.slice(s,s+o.quoteSuffix.length)===o.quoteSuffix&&(r+=500)}return r}function or(e,t){if(!e||!t.quote||t.length<=0)return{start:t.start||0,length:Math.max(1,t.length||t.quote?.length||1),confidence:0,status:"unanchored"};let n=Math.max(0,t.start||0),o=n+Math.max(1,t.length||t.quote.length);if(o<=e.length&&e.slice(n,o)===t.quote)return{start:n,length:t.length,confidence:1,status:"anchored"};let r=ia(e,t.quote);if(r.length===0)return{start:n,length:Math.max(1,t.length||t.quote.length),confidence:0,status:"unanchored"};if(r.length===1)return{start:r[0],length:t.quote.length,confidence:.8,status:"anchored"};let i=r[0],a=Number.NEGATIVE_INFINITY;for(let s of r){let c=aa(e,t.quote,s,t);c>a&&(a=c,i=s)}return{start:i,length:t.quote.length,confidence:.6,status:"anchored"}}var rr=x(()=>{"use strict"});function ca(){try{return typeof localStorage>"u"?"default":localStorage.getItem("md-viewer:annotation-density")==="simple"?"simple":"default"}catch{return"default"}}function da(e){return e.reduce((n,o)=>typeof o.serial!="number"||!Number.isFinite(o.serial)?n:Math.max(n,o.serial),0)+1}function ua(e){let t=Number.isFinite(e.createdAt)?e.createdAt:Date.now(),o=(Array.isArray(e.thread)?e.thread:[]).map((r,i)=>{if(!r||typeof r!="object")return null;let a=String(r.note||"").trim();if(!a)return null;let c=String(r.type||(i===0?"comment":"reply"))==="reply"?"reply":"comment",d=Number(r.createdAt),u=Number.isFinite(d)?Math.floor(d):t+i;return{id:String(r.id||"").trim()||\`\${c}-\${u}-\${Math.random().toString(16).slice(2,8)}\`,type:c,note:a,createdAt:u}}).filter(r=>!!r).sort((r,i)=>r.createdAt-i.createdAt);if(o.length===0){let r=String(e.note||"").trim();return r?[{id:\`c-\${e.id||t}\`,type:"comment",note:r,createdAt:t}]:[]}o[0].type="comment";for(let r=1;r<o.length;r+=1)o[r].type="reply";return o}function fr(e){let t=ua(e),n=JSON.stringify(e.thread||[]),o=JSON.stringify(t);return e.thread=t,e.note=t[0]?.note||e.note||"",n!==o}function pa(e){let t=!1;for(let n of e)fr(n)&&(t=!0);return t}function ma(e){let t=!1,n=e.map((r,i)=>({ann:r,index:i}));n.sort((r,i)=>{let a=Number.isFinite(r.ann.createdAt)?r.ann.createdAt:0,s=Number.isFinite(i.ann.createdAt)?i.ann.createdAt:0;return a!==s?a-s:r.index-i.index});let o=1;for(let{ann:r}of n){if(typeof r.serial=="number"&&Number.isFinite(r.serial)&&r.serial>0){o=Math.max(o,r.serial+1);continue}r.serial=o,o+=1,t=!0}return t}function gr(e){let t=f.annotations.findIndex(n=>n.id===e.id);if(t>=0){f.annotations[t]=e;return}f.annotations.push(e)}function An(e,t,n="\\u8BC4\\u8BBA\\u4FDD\\u5B58\\u5931\\u8D25"){Yo(e,t).then(o=>{f.currentFilePath===e&&(gr(o),C(e),B())}).catch(o=>{M(\`\${n}: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)})}function hr(e,t,n="\\u8BC4\\u8BBA\\u4FDD\\u5B58\\u5931\\u8D25"){for(let o of t)An(e,o,n)}function yr(e){if(f.currentFilePath=e,e?(f.annotations=[],fa(e)):f.annotations=[],f.pinnedAnnotationId=null,f.activeAnnotationId=null,f.pendingAnnotation=null,f.pendingAnnotationFilePath=null,Ze(),Ie(!0),oe(!0),e){let n=vr()[e]===!0;Be(!n)}else Be(!0)}async function fa(e){try{let t=await Xo(e);if(!Array.isArray(t)||f.currentFilePath!==e)return;f.annotations=t;let n=pa(f.annotations),o=ma(f.annotations);(n||o)&&hr(e,f.annotations),C(e),B()}catch(t){if(f.currentFilePath!==e)return;M(\`\\u8BC4\\u8BBA\\u52A0\\u8F7D\\u5931\\u8D25: \${t?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)}}function T(){return{sidebar:document.getElementById("annotationSidebar"),sidebarResizer:document.getElementById("annotationSidebarResizer"),reader:document.getElementById("reader"),content:document.getElementById("content"),composer:document.getElementById("annotationComposer"),composerHeader:document.getElementById("annotationComposerHeader"),composerNote:document.getElementById("composerNote"),quickAdd:document.getElementById("annotationQuickAdd"),popover:document.getElementById("annotationPopover"),popoverTitle:document.getElementById("popoverTitle"),popoverNote:document.getElementById("popoverNote"),popoverResolveBtn:document.getElementById("popoverResolveBtn"),popoverPrevBtn:document.getElementById("popoverPrevBtn"),popoverNextBtn:document.getElementById("popoverNextBtn"),annotationList:document.getElementById("annotationList"),annotationCount:document.getElementById("annotationCount"),filterMenu:document.getElementById("annotationFilterMenu"),filterToggle:document.getElementById("annotationFilterToggle"),densityToggle:document.getElementById("annotationDensityToggle"),closeToggle:document.getElementById("annotationSidebarClose"),floatingOpenBtn:document.getElementById("annotationFloatingOpenBtn")}}function Ln(e){let t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),n=[],o;for(;o=t.nextNode();)o.nodeValue&&o.nodeValue.length>0&&n.push(o);return n}function ir(e,t,n){let o=Ln(e),r=0;for(let i of o){if(i===t)return r+n;r+=i.nodeValue?.length||0}return-1}function Lt(e,t,n){if(n)return Vo(n,t);let o=Ln(e),r=0;for(let a of o){let s=a.nodeValue?.length||0,c=r+s;if(t<=c)return{node:a,offset:Math.max(0,t-r)};r=c}if(o.length===0)return null;let i=o[o.length-1];return{node:i,offset:i.nodeValue?.length||0}}function Ft(e,t,n){return Math.max(t,Math.min(n,e))}function Fn(e,t,n){let i=Ft(t,8,window.innerWidth-360-8),a=Ft(n,8,window.innerHeight-220-8);e.style.left=\`\${i}px\`,e.style.top=\`\${a}px\`}function br(e){return Ln(e).map(t=>t.nodeValue||"").join("")}function te(e){return e.status==="resolved"}function Cn(e){return e.status==="unanchored"?"orphan":(e.confidence||0)>=.95?"exact":"reanchored"}function ga(e,t){let n=e.status==="unanchored"||Cn(e)==="orphan";return t==="all"?!0:t==="open"?!te(e)&&!n:t==="resolved"?te(e)&&!n:t==="orphan"?n:!0}function wr(){return f.currentFilePath}function W(){let e=f.currentFilePath,t=document.getElementById("content")?.getAttribute("data-current-file")||null;return e?t?t===e?e:null:e:null}function Ct(e,t){if(!e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return!1;let n=e.key.toLowerCase(),{value:o,selectionStart:r,selectionEnd:i}=t;if(r===null||i===null)return!1;let a=d=>{t.selectionStart=d,t.selectionEnd=d},s=d=>{let u=o.lastIndexOf(\`
\`,d-1);return u===-1?0:u+1},c=d=>{let u=o.indexOf(\`
\`,d);return u===-1?o.length:u};switch(n){case"a":return a(s(r)),!0;case"e":return a(c(r)),!0;case"b":return a(Math.max(0,r-1)),!0;case"f":return a(Math.min(o.length,r+1)),!0;case"n":{let d=c(r);return a(d===o.length?d:Math.min(o.length,d+1+(r-s(r)))),!0}case"p":{let d=s(r);if(d===0)return a(0),!0;let u=s(d-1),m=d-1-u;return a(u+Math.min(r-d,m)),!0}case"d":return r<o.length&&(t.value=o.slice(0,r)+o.slice(r+1),a(r),t.dispatchEvent(new Event("input"))),!0;case"k":{let d=c(r),u=r===d&&d<o.length?d+1:d;return t.value=o.slice(0,r)+o.slice(u),a(r),t.dispatchEvent(new Event("input")),!0}case"u":{let d=s(r);return t.value=o.slice(0,d)+o.slice(r),a(d),t.dispatchEvent(new Event("input")),!0}case"w":{let d=r;for(;d>0&&/\\s/.test(o[d-1]);)d--;for(;d>0&&!/\\s/.test(o[d-1]);)d--;return t.value=o.slice(0,d)+o.slice(r),a(d),t.dispatchEvent(new Event("input")),!0}case"h":return r>0&&(t.value=o.slice(0,r-1)+o.slice(r),a(r-1),t.dispatchEvent(new Event("input"))),!0;default:return!1}}function ee(e){return e==="up"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4l4 4H4z"/></svg>':e==="down"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12l-4-4h8z"/></svg>':e==="check"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.4 11.2L3.5 8.3l1.1-1.1 1.8 1.8 5-5 1.1 1.1z"/></svg>':e==="trash"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2h4l1 1h3v1H2V3h3l1-1zm-1 4h1v7H5V6zm3 0h1v7H8V6zm3 0h1v7h-1V6z"/></svg>':e==="comment"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h12v9H8l-3 3v-3H2z"/></svg>':e==="list"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h10v1H3zm0 4h10v1H3zm0 4h10v1H3z"/></svg>':e==="filter"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12L9.5 8v4.5l-3-1.5V8z"/></svg>':e==="edit"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.5 2.5a1.5 1.5 0 012.1 2.1L5 13.2l-3 .8.8-3 8.7-8.5z"/></svg>':e==="reopen"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 1.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zM6 5.5l4 2.5-4 2.5V5.5z"/></svg>':'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 4.2L8 8l3.8-3.8 1 1L9 9l3.8 3.8-1 1L8 10l-3.8 3.8-1-1L7 9 3.2 5.2z"/></svg>'}function Bt(){return[...f.annotations].filter(e=>ga(e,f.filter)).sort((e,t)=>e.start-t.start)}function ha(){let e=T();if(e.filterMenu?.querySelectorAll(".annotation-filter-item[data-filter]").forEach(t=>{let n=t;n.classList.toggle("is-active",n.getAttribute("data-filter")===f.filter)}),e.densityToggle&&(e.densityToggle.classList.toggle("is-simple",f.density==="simple"),e.densityToggle.title=f.density==="simple"?"\\u5207\\u6362\\u5230\\u9ED8\\u8BA4\\u5217\\u8868":"\\u5207\\u6362\\u5230\\u6781\\u7B80\\u5217\\u8868"),e.filterToggle){let t={all:"\\u7B5B\\u9009\\uFF1A\\u5168\\u90E8",open:"\\u7B5B\\u9009\\uFF1A\\u672A\\u89E3\\u51B3",resolved:"\\u7B5B\\u9009\\uFF1A\\u5DF2\\u89E3\\u51B3",orphan:"\\u7B5B\\u9009\\uFF1A\\u5B9A\\u4F4D\\u5931\\u8D25"};e.filterToggle.title=t[f.filter]}}function ya(){let e=T();e.annotationCount&&(e.annotationCount.textContent=String(Bt().length))}function Be(e){let t=T();t.sidebar&&(t.sidebar.classList.toggle("collapsed",e),document.body.classList.toggle("annotation-sidebar-collapsed",e),e&&(t.filterMenu?.classList.add("hidden"),Ie(!0),oe(!0)))}function vr(){try{let e=localStorage.getItem(mr);if(!e)return{};let t=JSON.parse(e);return t&&typeof t=="object"?t:{}}catch{return{}}}function ba(e){localStorage.setItem(mr,JSON.stringify(e))}function kr(e){if(!f.currentFilePath)return;let t=vr();t[f.currentFilePath]=e,ba(t)}function wa(e){return Math.max(sa,Math.min(la,Math.round(e)))}function xr(e){let t=wa(e);document.documentElement.style.setProperty("--annotation-sidebar-width",\`\${t}px\`),localStorage.setItem(ur,String(t))}function va(){let e=Number(localStorage.getItem(ur)),t=Number.isFinite(e)&&e>0?e:pr;xr(t)}function ne(){let e=T();if(!e.sidebar)return;let t=document.getElementById("tabs"),n=Math.max(0,Math.round(t?.getBoundingClientRect().bottom||84)),o=Math.max(0,window.innerHeight-n);e.sidebar.style.top=\`\${n}px\`,e.sidebar.style.height=\`\${o}px\`,e.sidebarResizer&&(e.sidebarResizer.style.top=\`\${n}px\`,e.sidebarResizer.style.height=\`\${o}px\`),e.floatingOpenBtn&&(e.floatingOpenBtn.style.top=\`\${n+6}px\`)}function ar(){Be(!1),kr(!0),ne(),Bn()}function sr(){Be(!0),kr(!1)}function ka(){let e=T().sidebar;e&&Be(!e.classList.contains("collapsed"))}function Er(){let e=T();return e.filterMenu&&!e.filterMenu.classList.contains("hidden")?(e.filterMenu.classList.add("hidden"),!0):e.quickAdd&&!e.quickAdd.classList.contains("hidden")?(Ie(!0),!0):e.composer&&!e.composer.classList.contains("hidden")?(Ze(),!0):e.popover&&!e.popover.classList.contains("hidden")?(f.pinnedAnnotationId=null,oe(!0),!0):!1}function xa(e,t){return e==="resolved"?"resolved":t}function Ea(e,t,n){let o=T();if(!o.quickAdd)return;o.composer&&!o.composer.classList.contains("hidden")&&Ze(),f.pendingAnnotation={...n,note:"",createdAt:Date.now()},f.pendingAnnotationFilePath=o.content?.getAttribute("data-current-file")||f.currentFilePath;let r=30,i=30,a=Ft(e,8,window.innerWidth-r-8),s=Ft(t,8,window.innerHeight-i-8);o.quickAdd.style.left=\`\${a}px\`,o.quickAdd.style.top=\`\${s}px\`,o.quickAdd.classList.remove("hidden")}function Ie(e=!1){let t=T();t.quickAdd&&(t.quickAdd.classList.add("hidden"),e&&(\$n(),f.pendingAnnotation=null,f.pendingAnnotationFilePath=null))}function Ta(e,t){let n=T();if(!f.pendingAnnotation||!n.composer||!n.composerNote)return;Aa(),n.composerNote.value="",Mr(n.composerNote);let o=typeof e=="number"?e:n.quickAdd?Number.parseFloat(n.quickAdd.style.left||"0"):0,r=typeof t=="number"?t:n.quickAdd?Number.parseFloat(n.quickAdd.style.top||"0"):0;Fn(n.composer,o,r+34),n.composer.classList.remove("hidden"),Ie(!1),n.composerNote.focus()}function Sa(){let e=T();e.composer&&e.composer.classList.add("hidden")}function Ma(){let e=T();if(!e.composer||!f.pendingAnnotation)return;let n=document.getElementById("reader")?.querySelector(".annotation-mark-temp");if(n){let o=n.getBoundingClientRect();Fn(e.composer,o.right+6,o.top-8)}e.composer.classList.remove("hidden"),e.composerNote?.focus()}function Ze(){let e=T();e.composer&&(\$n(),f.pendingAnnotation=null,f.pendingAnnotationFilePath=null,e.composerNote&&(e.composerNote.value=""),e.composer.classList.add("hidden"))}function \$n(){let e=document.getElementById("reader");if(!e)return;let t=Array.from(e.querySelectorAll(".annotation-mark-temp"));for(let n of t){let o=n.parentNode;for(;n.firstChild;)o?.insertBefore(n.firstChild,n);o?.removeChild(n)}}function Aa(){let e=T();if(!e.reader||!f.pendingAnnotation)return;\$n();let t=f.pendingAnnotation,n=Lt(e.reader,t.start),o=Lt(e.reader,t.start+t.length);if(!(!n||!o)&&!(n.node===o.node&&n.offset===o.offset)){if(n.node===o.node){let r=document.createRange();r.setStart(n.node,n.offset),r.setEnd(o.node,o.offset);let i=document.createElement("span");i.className="annotation-mark-temp";try{r.surroundContents(i)}catch{}return}try{let r=[],i=document.createTreeWalker(e.reader,NodeFilter.SHOW_TEXT,null,!1),a;for(;a=i.nextNode();){let s=document.createRange();s.selectNode(a);let c=document.createRange();c.setStart(n.node,n.offset),c.setEnd(o.node,o.offset);let d=c.compareBoundaryPoints(Range.END_TO_START,s),u=c.compareBoundaryPoints(Range.START_TO_END,s);if(d>0||u<0)continue;let m=a===n.node?n.offset:0,p=a===o.node?o.offset:a.nodeValue?.length||0;m<p&&r.push({node:a,start:m,end:p})}for(let s=r.length-1;s>=0;s--){let{node:c,start:d,end:u}=r[s],m=document.createRange();m.setStart(c,d),m.setEnd(c,u);let p=document.createElement("span");p.className="annotation-mark-temp",m.surroundContents(p)}}catch{}}}function Nn(e){return fr(e),e.thread||[]}function Tr(e,t=!1){let n=Nn(e),o=n[0],r=n.slice(1);return t?\`
      <div class="annotation-note simple">\${b(o?.note||e.note||"\\uFF08\\u65E0\\u8BC4\\u8BBA\\u5185\\u5BB9\\uFF09")}</div>
      \${r.length>0?\`<div class="annotation-reply-count">\\u56DE\\u590D \${r.length}</div>\`:""}
    \`:n.map(a=>\`
      <div class="annotation-thread-line \${a.type==="reply"?"is-reply":""}" data-thread-item-id="\${a.id}" data-annotation-id="\${e.id}">
        <span class="annotation-thread-text">\${b(a.note)}</span>
        <button class="annotation-thread-edit-btn" data-edit-thread-item="\${a.id}" data-annotation-id="\${e.id}" title="\\u7F16\\u8F91">\${ee("edit")}</button>
      </div>\`).join("")||'<div class="annotation-thread-line">\\uFF08\\u65E0\\u8BC4\\u8BBA\\u5185\\u5BB9\\uFF09</div>'}function Sr(e,t,n){let o=f.annotations.find(s=>s.id===e);if(!o)return;let r=n.trim();if(!r)return;let i=Nn(o),a=Date.now();i.push({id:\`r-\${a}-\${Math.random().toString(16).slice(2,8)}\`,type:"reply",note:r,createdAt:a}),o.thread=i,o.note=i[0]?.note||o.note,Zo(t,{id:e},r,"me").then(s=>{f.currentFilePath===t&&(gr(s),C(t),B())}).catch(s=>{M(\`\\u56DE\\u590D\\u8BC4\\u8BBA\\u5931\\u8D25: \${s?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)})}function \$t(e,t,n){let o=document.querySelector(\`.annotation-thread-line[data-thread-item-id="\${t}"][data-annotation-id="\${e}"]\`);if(!o)return;let r=f.annotations.find(p=>p.id===e);if(!r)return;let i=Nn(r),a=i.find(p=>p.id===t);if(!a)return;let s=o.innerHTML;o.classList.add("is-editing"),o.innerHTML=\`<textarea class="annotation-thread-edit-input">\${b(a.note)}</textarea>\`;let c=o.querySelector("textarea");c.style.height=\`\${Math.max(c.scrollHeight,34)}px\`,c.focus(),c.setSelectionRange(c.value.length,c.value.length);let d=!1,u=()=>{d||(d=!0,o.classList.remove("is-editing"),o.innerHTML=s,o.querySelector("[data-edit-thread-item]")?.addEventListener("click",p=>{p.stopPropagation(),\$t(e,t,n)}))},m=()=>{if(d)return;d=!0;let p=c.value.trim();if(!p||p===a.note){o.classList.remove("is-editing"),o.innerHTML=s,o.querySelector("[data-edit-thread-item]")?.addEventListener("click",g=>{g.stopPropagation(),\$t(e,t,n)});return}if(a.note=p,i[0]?.id===t&&(r.note=p),r.thread=i,An(n,r,"\\u7F16\\u8F91\\u8BC4\\u8BBA\\u5931\\u8D25"),C(n),f.pinnedAnnotationId===e){let y=document.querySelector(\`[data-annotation-id="\${e}"]\`)?.getBoundingClientRect();et(r,y?y.right+8:120,y?y.top+8:120)}};c.addEventListener("keydown",p=>{if(Ct(p,c)){p.preventDefault();return}p.key==="Escape"?(p.preventDefault(),u()):p.key==="Enter"&&!p.shiftKey&&(p.preventDefault(),m())}),c.addEventListener("input",()=>{c.style.height="auto",c.style.height=\`\${Math.min(200,Math.max(c.scrollHeight,34))}px\`}),c.addEventListener("blur",p=>{let g=p.relatedTarget,y=o.closest(".annotation-item");g&&y&&y.contains(g)||setTimeout(()=>{d||u()},150)})}function we(e){e.style.height="auto";let t=160,n=Math.min(t,Math.max(e.scrollHeight,34));e.style.height=\`\${n}px\`,e.style.overflowY=e.scrollHeight>t?"auto":"hidden"}function Mr(e){e.style.height="auto";let t=200,n=Math.min(t,Math.max(e.scrollHeight,34));e.style.height=\`\${n}px\`,e.style.overflowY=e.scrollHeight>t?"auto":"hidden"}function et(e,t,n){let o=T();if(!o.popover||!o.popoverTitle||!o.popoverNote)return;let r=e.quote.substring(0,22);o.popoverTitle.textContent=\`#\${e.serial||0} | \${r}\${e.quote.length>22?"...":""}\`;let i=Tr(e,!1);if(o.popoverNote.innerHTML=\`
    <div class="annotation-thread">\${i}</div>
    <div class="annotation-reply-entry" data-popover-reply-entry="\${e.id}" role="button" tabindex="0">
      <textarea rows="1" data-popover-reply-input="\${e.id}" placeholder="\\u8F93\\u5165\\u56DE\\u590D\\u5185\\u5BB9\\uFF08Cmd+Enter \\u63D0\\u4EA4\\uFF09"></textarea>
    </div>
  \`,o.popoverResolveBtn){let a=te(e);o.popoverResolveBtn.title=a?"\\u91CD\\u65B0\\u6253\\u5F00":"\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3",o.popoverResolveBtn.setAttribute("aria-label",a?"\\u91CD\\u65B0\\u6253\\u5F00":"\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3"),o.popoverResolveBtn.innerHTML=ee(a?"reopen":"check"),o.popoverResolveBtn.classList.toggle("is-resolved",a)}o.popover.style.left=\`\${Math.round(t)}px\`,o.popover.style.top=\`\${Math.round(n)}px\`,o.popover.classList.remove("hidden")}function lr(){let e=f.pinnedAnnotationId;if(!e)return;let t=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(!t)return;let n=f.annotations.find(r=>r.id===e);if(!n)return;let o=t.getBoundingClientRect();et(n,o.right+8,o.top+8)}function oe(e=!1){let t=T();t.popover&&(!e&&f.pinnedAnnotationId||(t.popover.classList.add("hidden"),e&&(f.pinnedAnnotationId=null)))}function cr(e){let t=T();if(!f.pendingAnnotation||!t.composerNote)return;let n=f.pendingAnnotationFilePath;if(!n||n!==e)return;let o=t.composerNote.value.trim();if(!o)return;let r=Date.now(),i={...f.pendingAnnotation,serial:da(f.annotations),note:o,thread:[{id:\`c-\${r}-\${Math.random().toString(16).slice(2,8)}\`,type:"comment",note:o,createdAt:r}]};f.annotations.push(i),An(e,i,"\\u521B\\u5EFA\\u8BC4\\u8BBA\\u5931\\u8D25"),Ze(),B(),C(e)}function Ar(e,t){let n=f.annotations.slice();f.annotations=f.annotations.filter(o=>o.id!==e),f.pinnedAnnotationId===e&&(f.pinnedAnnotationId=null,oe(!0)),f.activeAnnotationId===e&&(f.activeAnnotationId=null),B(),C(t),er(t,{id:e}).catch(o=>{f.annotations=n,M(\`\\u5220\\u9664\\u8BC4\\u8BBA\\u5931\\u8D25: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600),B(),C(t)})}function La(e){let t=T();if(!t.content)return;let n=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(n){let o=t.content.getBoundingClientRect(),r=n.getBoundingClientRect(),a=t.content.scrollTop+(r.top-o.top),c=Math.max(0,a-56);t.content.scrollTo({top:c,behavior:"smooth"})}}function Lr(e,t){f.activeAnnotationId=e,B(),e&&(La(e),f.pinnedAnnotationId=e,requestAnimationFrame(()=>{let n=f.annotations.find(i=>i.id===e),o=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(!n||!o)return;let r=o.getBoundingClientRect();et(n,r.right+8,r.top+8)})),C(t)}function Nt(e,t,n){let o=Bt(),r=o.findIndex(a=>a.id===e);if(r<0)return;let i=o[r+t];i&&Lr(i.id,n)}function Fa(e){let t=document.getElementById("content"),n=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(!t||!n)return null;let o=t.getBoundingClientRect(),r=n.getBoundingClientRect();return t.scrollTop+(r.top-o.top)}function Bn(){if(f.density!=="default")return;let e=document.getElementById("content"),t=document.getElementById("annotationList");!e||!t||(t.scrollTop=e.scrollTop)}function Fr(e,t){let n=f.annotations.find(i=>i.id===e);if(!n)return;let o=n.status;n.status==="resolved"?n.status=(n.confidence||0)<=0?"unanchored":"anchored":n.status="resolved";let r=n.status||"anchored";oe(!0),B(),C(t),tr(t,{id:e},r).catch(i=>{n.status=o,M(\`\\u66F4\\u65B0\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25: \${i?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600),B(),C(t)})}function dr(e,t){e.classList.add("annotation-mark"),e.dataset.annotationId=t.id,e.classList.add(\`status-\${Cn(t)}\`),te(t)&&e.classList.add("is-resolved")}function Ca(e,t){let n=T();if(!n.reader||typeof e.start!="number"||typeof e.length!="number"||e.length<=0)return;let o=Lt(n.reader,e.start,t),r=Lt(n.reader,e.start+e.length,t);if(!(!o||!r)&&!(o.node===r.node&&o.offset===r.offset)){if(o.node===r.node){let i=document.createRange();i.setStart(o.node,o.offset),i.setEnd(r.node,r.offset);let a=document.createElement("span");dr(a,e);try{i.surroundContents(a)}catch{}return}try{let i=[],a=document.createTreeWalker(n.reader,NodeFilter.SHOW_TEXT,null,!1),s;for(;s=a.nextNode();){let c=document.createRange();c.selectNode(s);let d=document.createRange();d.setStart(o.node,o.offset),d.setEnd(r.node,r.offset);let u=d.compareBoundaryPoints(Range.END_TO_START,c),m=d.compareBoundaryPoints(Range.START_TO_END,c);if(u>0||m<0)continue;let p=s===o.node?o.offset:0,g=s===r.node?r.offset:s.nodeValue?.length||0;p<g&&i.push({node:s,start:p,end:g})}for(let c=i.length-1;c>=0;c--){let{node:d,start:u,end:m}=i[c],p=document.createRange();p.setStart(d,u),p.setEnd(d,m);let g=document.createElement("span");dr(g,e),p.surroundContents(g)}}catch{}}}function \$a(){let e=T();e.reader&&e.reader.querySelectorAll(".annotation-mark").forEach(t=>{let n=t.getAttribute("data-annotation-id"),o=f.annotations.find(r=>r.id===n);o&&(t.classList.toggle("is-active",!!n&&n===f.activeAnnotationId),t.addEventListener("click",r=>{if(r.stopPropagation(),f.pinnedAnnotationId===n){f.pinnedAnnotationId=null,oe(!0);return}f.activeAnnotationId=n,f.pinnedAnnotationId=n;let i=t.getBoundingClientRect();et(o,i.right+8,i.top+8);let a=W();C(a||null)}))})}function Na(){let e=T();if(!e.reader)return;let t=Array.from(e.reader.querySelectorAll(".annotation-mark"));for(let n of t){let o=n.parentNode;for(;n.firstChild;)o?.insertBefore(n.firstChild,n);o?.removeChild(n)}}function B(){let e=T();Na();let t=e.reader?Uo(Go(e.reader)):void 0;if(e.reader){let o=t?t.nodes.map(a=>a.nodeValue||"").join(""):br(e.reader),r=!1,i=[];for(let a of f.annotations){let s=or(o,a),c=!1,d=s.status;a.start!==s.start&&(a.start=s.start,r=!0,c=!0),a.length!==s.length&&(a.length=s.length,r=!0,c=!0);let u=xa(a.status,d);(a.status||"anchored")!==u&&(a.status=u,r=!0,c=!0),a.confidence!==s.confidence&&(a.confidence=s.confidence,r=!0,c=!0),c&&i.push({...a,thread:a.thread?[...a.thread]:a.thread})}if(r){let a=W();a&&hr(a,i,"\\u540C\\u6B65\\u8BC4\\u8BBA\\u951A\\u70B9\\u5931\\u8D25")}}let n=[...Bt()].sort((o,r)=>r.start-o.start);for(let o of n)Ca(o,t);\$a()}function Ba(e,t){let n=e.querySelector(".annotation-canvas");if(!n)return;let o=Array.from(n.querySelectorAll(".annotation-item.positioned"));if(o.length===0)return;let r=o.map(u=>u.offsetHeight),i=6,a=0,s=[];for(let u=0;u<o.length;u++){let m=Number(o[u].getAttribute("data-anchor-top")||"0"),p=Number.isFinite(m)?Math.max(0,m):0,g=Math.max(p,a>0?a+i:p);s.push(g),a=g+r[u]}for(let u=0;u<o.length;u++)o[u].style.top=\`\${Math.round(s[u])}px\`;let c=Math.max(0,t),d=Math.ceil(a+24);n.style.height=\`\${Math.max(c,d)}px\`}function C(e){let t=T();if(!t.annotationList)return;ya(),ha();let n=new Map;if(t.annotationList.querySelectorAll("[data-reply-input]").forEach(i=>{let a=i.getAttribute("data-reply-input");a&&i.value.trim()&&n.set(a,i.value)}),!e||f.annotations.length===0){t.annotationList.innerHTML='<div class="annotation-empty">\\u65E0\\u8BC4\\u8BBA\\uFF08\\u9009\\u4E2D\\u6587\\u672C\\u5373\\u53EF\\u6DFB\\u52A0\\uFF09</div>';return}let o=Bt();if(o.length===0){t.annotationList.innerHTML='<div class="annotation-empty">\\u5F53\\u524D\\u7B5B\\u9009\\u4E0B\\u65E0\\u8BC4\\u8BBA</div>';return}let r=(i,a,s=!1,c=0)=>\`
    <div class="annotation-item \${f.activeAnnotationId===i.id?"is-active":""} status-\${Cn(i)}\${te(i)?" is-resolved":""}\${s?" positioned":""}" data-annotation-id="\${i.id}"\${s?\` data-anchor-top="\${Math.max(0,Math.round(c))}" style="top:\${Math.max(0,Math.round(c))}px"\`:""}>
      <div class="annotation-row-top">
        <div class="annotation-row-title">#\${i.serial||a+1} | \${b(i.quote.substring(0,28))}\${i.quote.length>28?"...":""}</div>
        <div class="annotation-row-actions">
          <button class="annotation-icon-action" data-action="prev" data-id="\${i.id}" title="\\u4E0A\\u4E00\\u6761">\${ee("up")}</button>
          <button class="annotation-icon-action" data-action="next" data-id="\${i.id}" title="\\u4E0B\\u4E00\\u6761">\${ee("down")}</button>
          <button class="annotation-icon-action resolve\${te(i)?" is-resolved":""}" data-action="resolve" data-id="\${i.id}" title="\${te(i)?"\\u91CD\\u65B0\\u6253\\u5F00":"\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3"}">\${te(i)?ee("reopen"):ee("check")}</button>
          <button class="annotation-icon-action danger" data-action="delete" data-id="\${i.id}" title="\\u5220\\u9664">\${ee("trash")}</button>
        </div>
      </div>
      <div class="annotation-thread">\${Tr(i,f.density==="simple")}</div>
      \${f.density==="simple"?"":\`
        <div class="annotation-reply-entry" data-reply-entry="\${i.id}" role="button" tabindex="0">
          <textarea rows="1" data-reply-input="\${i.id}" placeholder="\\u8F93\\u5165\\u56DE\\u590D\\u5185\\u5BB9\\uFF08Cmd+Enter \\u63D0\\u4EA4\\uFF09"></textarea>
        </div>
      \`}
    </div>
  \`;if(f.density==="default"){let i=o.map(u=>Fa(u.id)),a=0,s=o.map((u,m)=>{let p=i[m]??m*88;return a=Math.max(a,p),r(u,m,!0,p)}).join(""),c=document.getElementById("content"),d=Math.max(c?.scrollHeight||0,a+180);t.annotationList.classList.add("default-mode"),t.annotationList.innerHTML=\`<div class="annotation-canvas" style="height:\${d}px">\${s}</div>\`,Ba(t.annotationList,c?.scrollHeight||0),Bn()}else t.annotationList.classList.remove("default-mode"),t.annotationList.innerHTML=o.map((i,a)=>r(i,a)).join("");t.annotationList.querySelectorAll(".annotation-icon-action").forEach(i=>{i.addEventListener("click",a=>{a.stopPropagation();let s=a.currentTarget,c=s.getAttribute("data-action"),d=s.getAttribute("data-id");!d||!e||(c==="prev"?Nt(d,-1,e):c==="next"?Nt(d,1,e):c==="resolve"?Fr(d,e):c==="delete"&&Ar(d,e))})}),t.annotationList.querySelectorAll("[data-edit-thread-item]").forEach(i=>{i.addEventListener("click",a=>{a.stopPropagation();let s=i.getAttribute("data-edit-thread-item"),c=i.getAttribute("data-annotation-id");!s||!c||!e||\$t(c,s,e)})}),t.annotationList.querySelectorAll("[data-reply-entry]").forEach(i=>{i.addEventListener("click",a=>{a.stopPropagation();let s=i.getAttribute("data-reply-entry");if(!s)return;let c=t.annotationList?.querySelector(\`[data-reply-input="\${s}"]\`);c&&(we(c),c.focus())}),i.addEventListener("keydown",a=>{if(a.target instanceof HTMLTextAreaElement||a.key!=="Enter"&&a.key!==" ")return;a.preventDefault(),a.stopPropagation();let c=i.getAttribute("data-reply-entry");if(!c)return;let d=t.annotationList?.querySelector(\`[data-reply-input="\${c}"]\`);d&&(we(d),d.focus())})}),n.size>0&&t.annotationList.querySelectorAll("[data-reply-input]").forEach(i=>{let a=i.getAttribute("data-reply-input");a&&n.has(a)&&(i.value=n.get(a))}),requestAnimationFrame(()=>{t.annotationList?.querySelectorAll("[data-reply-input]").forEach(i=>{we(i)})}),t.annotationList.querySelectorAll("[data-reply-input]").forEach(i=>{let a=i;a.addEventListener("input",()=>we(a)),a.addEventListener("click",s=>s.stopPropagation()),i.addEventListener("keydown",s=>{if(Ct(s,s.currentTarget)){s.preventDefault();return}if(s.key!=="Enter"||!(s.metaKey||s.ctrlKey))return;s.preventDefault();let c=s.currentTarget,d=c.getAttribute("data-reply-input");!d||!e||(Sr(d,e,c.value),c.value="",C(e))})}),t.annotationList.querySelectorAll(".annotation-item").forEach(i=>{i.addEventListener("click",()=>{let a=i.getAttribute("data-annotation-id");!a||!e||Lr(a,e)})})}function Cr(e){let t=T(),n=t.content?.getAttribute("data-current-file");if(!e||!n||e!==n||!t.reader)return;let o=window.getSelection();if(!o||o.rangeCount===0||o.isCollapsed)return;let r=o.getRangeAt(0);if(!t.reader.contains(r.commonAncestorContainer))return;let i=o.toString().trim();if(!i)return;let a=ir(t.reader,r.startContainer,r.startOffset),s=ir(t.reader,r.endContainer,r.endOffset);if(a<0||s<=a)return;let c=br(t.reader),d=32,u=32,m=c.slice(Math.max(0,a-d),a),p=c.slice(s,Math.min(c.length,s+u)),g=r.getBoundingClientRect();Ea(g.right+6,g.top-8,{id:\`ann-\${Date.now()}-\${Math.random().toString(16).slice(2,8)}\`,start:a,length:s-a,quote:i,quotePrefix:m,quoteSuffix:p,status:"anchored",confidence:1})}function \$r(){va(),Be(!0),document.getElementById("composerSaveBtn")?.addEventListener("click",()=>{let e=W();e&&cr(e)}),document.getElementById("composerCancelBtn")?.addEventListener("click",Ze),T().composerNote?.addEventListener("keydown",e=>{if(Ct(e,e.currentTarget)){e.preventDefault();return}if(e.key!=="Enter"||!(e.metaKey||e.ctrlKey))return;e.preventDefault();let t=W();t&&cr(t)}),T().composerNote?.addEventListener("input",e=>{let t=e.currentTarget;Mr(t)}),T().quickAdd?.addEventListener("click",e=>{e.stopPropagation(),Ta()}),document.getElementById("popoverCloseBtn")?.addEventListener("click",()=>{f.pinnedAnnotationId=null,oe(!0)}),document.getElementById("popoverDeleteBtn")?.addEventListener("click",()=>{let e=W(),t=f.pinnedAnnotationId;t&&e&&Ar(t,e)}),document.getElementById("popoverResolveBtn")?.addEventListener("click",()=>{let e=W(),t=f.pinnedAnnotationId;t&&e&&Fr(t,e)}),document.getElementById("popoverPrevBtn")?.addEventListener("click",()=>{let e=W(),t=f.pinnedAnnotationId;t&&e&&Nt(t,-1,e)}),document.getElementById("popoverNextBtn")?.addEventListener("click",()=>{let e=W(),t=f.pinnedAnnotationId;t&&e&&Nt(t,1,e)}),document.getElementById("annotationPopover")?.addEventListener("click",e=>{let t=e.target,n=W();if(!n)return;let o=t.closest("[data-edit-thread-item]");if(o){e.stopPropagation();let a=o.getAttribute("data-edit-thread-item"),s=o.getAttribute("data-annotation-id");a&&s&&\$t(s,a,n);return}let r=t.closest("[data-popover-reply-entry]");if(r){e.stopPropagation();let a=r.getAttribute("data-popover-reply-entry");if(!a)return;let s=document.querySelector(\`[data-popover-reply-input="\${a}"]\`);if(!s)return;we(s),s.focus();return}t.closest("[data-popover-reply-input]")&&e.stopPropagation()}),document.getElementById("annotationPopover")?.addEventListener("keydown",e=>{let t=e.target;if(t instanceof HTMLTextAreaElement)return;let n=t.closest("[data-popover-reply-entry]");if(!n||e.key!=="Enter"&&e.key!==" ")return;e.preventDefault(),e.stopPropagation();let o=n.getAttribute("data-popover-reply-entry");if(!o)return;let r=document.querySelector(\`[data-popover-reply-input="\${o}"]\`);r&&(we(r),r.focus())}),document.getElementById("annotationPopover")?.addEventListener("keydown",e=>{let t=e.target;if(!(t instanceof HTMLTextAreaElement))return;if(Ct(e,t)){e.preventDefault();return}if(e.key!=="Enter"||!(e.metaKey||e.ctrlKey))return;let n=t.getAttribute("data-popover-reply-input"),o=W();if(!n||!o)return;e.preventDefault(),Sr(n,o,t.value),t.value="";let r=f.annotations.find(s=>s.id===n),a=document.querySelector(\`[data-annotation-id="\${n}"]\`)?.getBoundingClientRect();r&&et(r,a?a.right+8:120,a?a.top+8:120),C(o)}),document.getElementById("annotationPopover")?.addEventListener("input",e=>{let t=e.target;t instanceof HTMLTextAreaElement&&t.hasAttribute("data-popover-reply-input")&&we(t)}),T().filterMenu?.querySelectorAll(".annotation-filter-item[data-filter]").forEach(e=>{e.addEventListener("click",()=>{let t=e.getAttribute("data-filter");if(!t)return;f.filter=t,T().filterMenu?.classList.add("hidden");let n=W();B(),C(n||null)})}),T().filterToggle?.addEventListener("click",e=>{e.stopPropagation();let t=T().filterMenu;t&&t.classList.toggle("hidden")}),T().densityToggle?.addEventListener("click",()=>{f.density=f.density==="default"?"simple":"default",localStorage.setItem("md-viewer:annotation-density",f.density);let e=W();C(e||null)}),T().closeToggle?.addEventListener("click",()=>{sr()}),T().floatingOpenBtn?.addEventListener("click",()=>{ar()}),T().sidebarResizer?.addEventListener("mousedown",e=>{if(T().sidebar?.classList.contains("collapsed"))return;e.preventDefault();let t=document.documentElement,n=Number(getComputedStyle(t).getPropertyValue("--annotation-sidebar-width").replace("px",""))||pr,o=e.clientX;document.body.classList.add("annotation-sidebar-resizing");let r=a=>{let s=o-a.clientX;xr(n+s),ne()},i=()=>{document.body.classList.remove("annotation-sidebar-resizing"),window.removeEventListener("mousemove",r),window.removeEventListener("mouseup",i)};window.addEventListener("mousemove",r),window.addEventListener("mouseup",i)}),document.getElementById("content")?.addEventListener("scroll",()=>{Ie(!1),Bn(),lr()}),window.addEventListener("resize",()=>{ne(),lr()}),window.openAnnotationSidebar=ar,window.closeAnnotationSidebar=sr,window.toggleAnnotationSidebar=ka,document.addEventListener("mousedown",e=>{let t=e.target,n=T();if(t.closest(".annotation-mark-temp")){Ma();return}n.composer&&!n.composer.classList.contains("hidden")&&!n.composer.contains(t)&&!(n.quickAdd&&n.quickAdd.contains(t))&&Sa(),n.popover&&!n.popover.contains(t)&&!t.closest(".annotation-mark")&&(f.pinnedAnnotationId=null,oe(!0)),n.filterMenu&&!n.filterMenu.classList.contains("hidden")&&!n.filterMenu.contains(t)&&!t.closest("#annotationFilterToggle")&&n.filterMenu.classList.add("hidden"),n.quickAdd&&!n.quickAdd.classList.contains("hidden")&&!n.quickAdd.contains(t)&&!t.closest("#annotationComposer")&&Ie(!0)}),T().composerHeader?.addEventListener("mousedown",e=>{if(e.target.closest(".annotation-row-actions"))return;let t=T().composer;if(!t)return;let n=t.getBoundingClientRect(),o=e.clientX,r=e.clientY,i=n.left,a=n.top;e.preventDefault();let s=d=>{let u=i+(d.clientX-o),m=a+(d.clientY-r);Fn(t,u,m)},c=()=>{window.removeEventListener("mousemove",s),window.removeEventListener("mouseup",c)};window.addEventListener("mousemove",s),window.addEventListener("mouseup",c)})}var ur,pr,sa,la,f,mr,In=x(()=>{"use strict";Qo();fe();nr();Ae();rr();ur="md-viewer:annotation-sidebar-width",pr=320,sa=260,la=540;f={annotations:[],pendingAnnotation:null,pendingAnnotationFilePath:null,pinnedAnnotationId:null,activeAnnotationId:null,currentFilePath:null,filter:"open",density:ca()},mr="md-viewer:annotation-panel-open-by-file"});var F={};le(F,{renderCurrentPath:()=>jn,renderFiles:()=>Pn,renderSearchBox:()=>Pr,renderSidebar:()=>A,renderTabs:()=>re,setSidebarTab:()=>jr});function Wr(e){l.currentFile&&(Nr||requestAnimationFrame(()=>{let t=e.querySelector(".file-item.current, .tree-item.current");if(!t)return;let n=t.offsetTop-e.clientHeight*.4,o=Math.max(0,e.scrollHeight-e.clientHeight),r=Math.max(0,Math.min(n,o));e.scrollTo({top:r,behavior:"auto"}),Nr=!0}))}function jr(e){l.config.sidebarTab=e,H(l.config),A()}function Ia(e){if(!e)return;let t=He.indexOf(e);t>=0&&He.splice(t,1),He.unshift(e),He.length>300&&(He.length=300)}function Hr(e){let t=He.indexOf(e);return t>=0?t:Number.MAX_SAFE_INTEGER}function Ha(){P=!P,re()}function Wa(){P&&(P=!1,re())}function ja(e){Wt=(e||"").trimStart(),P||(P=!0),re()}function Pa(e){tt=e==="name"?"name":"recent",re()}function Da(){Br||(Br=!0,document.addEventListener("click",e=>{!P||e.target?.closest(".tab-manager-wrap")||Wa()}))}function Ra(){if(Ir)return;Ir=!0;let e=document.getElementById("tabs");e&&e.addEventListener("scroll",t=>{let n=t.target;n.classList.contains("tabs-scroll")?Pt=n.scrollLeft:n.classList.contains("tab-manager-list")&&(jt=n.scrollTop)},{passive:!0,capture:!0})}function Oa(e){let t=xt(l.sessionFiles),n=Fe(e,t,l.currentFile,r=>{let i=t.find(s=>s.path===r);if(!i)return!1;let a=_(i,U(i.path));return a.type==="normal"||a.type==="new"}),o=window.removeFile;if(!o||n.length===0){re();return}n.forEach(r=>o(r))}function Wn(){if(l.config.sidebarTab==="focus"||l.config.sidebarTab==="full"){A();return}Pn()}function qa(e){let t=e.trim();return t?!!(/^https?:\\/\\//i.test(t)||t.startsWith("/")||t.startsWith("~/")||t.startsWith("./")||t.startsWith("../")||t.includes("/")||t.includes("\\\\")||/\\.[a-zA-Z0-9]{1,10}\$/.test(t)):!1}function Pr(){let e=document.getElementById("searchBox");if(!e)return;let t=e.querySelector("#searchInput"),n=e.querySelector("#searchClear"),o=l.config.sidebarTab,r=o==="list"?"\\u641C\\u7D22\\u5DF2\\u6253\\u5F00\\u7684\\u6587\\u4EF6":o==="focus"?"\\u641C\\u7D22\\u7126\\u70B9\\u6587\\u4EF6":"\\u641C\\u7D22\\u6216\\u8F93\\u5165\\u8DEF\\u5F84\\uFF08Enter\\u8865\\u5168\\uFF0CCmd/Ctrl+Enter\\u6DFB\\u52A0\\uFF09";if(!t||!n){if(e.innerHTML=\`
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
    \`,t=e.querySelector("#searchInput"),n=e.querySelector("#searchClear"),!t||!n)return;St(t,{kind:"file",markdownOnly:!1,shouldActivate:qa}),t.addEventListener("input",i=>{window.dismissQuickActionConfirm?.();let a=i.target.value;It=0,Ht="",X(a),n&&(n.style.display=a?"block":"none"),Wn(),l.currentFile&&(wn(l.currentFile)||Ke(l.currentFile))&&window.renderContent?.()}),t.addEventListener("keydown",i=>{if(i.key==="Enter"&&(i.metaKey||i.ctrlKey)){i.preventDefault(),t.dispatchEvent(new Event("path-autocomplete-hide")),window.handleUnifiedInputSubmit?.(t.value);return}if(!i.defaultPrevented&&(i.key==="Enter"&&(i.preventDefault(),t.dispatchEvent(new Event("path-autocomplete-hide")),window.handleUnifiedInputSubmit?.(t.value)),i.key==="Escape")){window.dismissQuickActionConfirm?.();let a=Date.now(),s=t.value;if(a-It<900&&Ht===s&&s){X(""),t.value="",n&&(n.style.display="none"),Wn(),It=0,Ht="",i.preventDefault();return}It=a,Ht=s}}),n.addEventListener("click",()=>{X(""),t&&(t.value=""),n.style.display="none",Wn(),t?.focus()})}document.activeElement!==t&&t.value!==l.searchQuery&&(t.value=l.searchQuery),n.style.display=l.searchQuery?"block":"none",t.placeholder=r}function jn(){let e=document.getElementById("currentPath");e&&(e.innerHTML="",e.style.display="none")}function za(){let e=document.getElementById("modeSwitchRow");if(!e)return;let t=l.config.sidebarTab,n=[{key:"focus",label:"\\u7126\\u70B9"},{key:"full",label:"\\u5168\\u91CF"},{key:"list",label:"\\u5217\\u8868"}];e.innerHTML=\`
    <div class="view-tabs">
      \${n.map(o=>\`
        <button class="view-tab\${t===o.key?" active":""}"
                onclick="setSidebarTab('\${o.key}')">\${o.label}</button>
      \`).join("")}
    </div>
  \`}function Pn(){let e=document.getElementById("fileList");if(!e)return;if(l.sessionFiles.size===0){e.innerHTML='<div class="empty-tip">\\u70B9\\u51FB\\u4E0A\\u65B9\\u6DFB\\u52A0 Markdown/HTML \\u6587\\u4EF6</div>';return}let t=an();if(t.length===0){e.innerHTML='<div class="empty-tip">\\u672A\\u627E\\u5230\\u5339\\u914D\\u7684\\u6587\\u4EF6</div>';return}let n=new Map(t.map(r=>[r.path,r])),o=xt(n);e.innerHTML=o.map(r=>{let i=r.path===l.currentFile,a=r.isMissing||!1,s=ge(r.path),c=["file-item",i?"current":"",a?"deleted":""].filter(Boolean).join(" "),d=r.displayName||r.name,u=l.searchQuery.toLowerCase().trim();if(u){let g=d.toLowerCase().indexOf(u);if(g!==-1){let y=d.substring(0,g),h=d.substring(g,g+u.length),v=d.substring(g+u.length);d=\`\${y}<mark class="search-highlight">\${h}</mark>\${v}\`}}let m=_(r,U(r.path)),p="&nbsp;";return m.badge==="dot"?p='<span class="new-dot"></span>':m.badge&&(p=\`<span class="status-badge status-\${m.type}" style="color: \${m.color}">\${m.badge}</span>\`),\`
      <div class="\${c}"
           onclick="window.switchFile('\${w(r.path)}')">
        <span class="file-type-icon \${s.cls}">\${b(s.label)}</span>
        <span class="name">\${d}</span>
        <span class="file-item-status">\${p}</span>
        <span class="close" onclick="event.stopPropagation();window.removeFile('\${w(r.path)}')">\\xD7</span>
      </div>
    \`}).join(""),Wr(e)}function A(){let e=l.config.sidebarTab,t=document.querySelector(".sidebar");if(t&&t.classList.toggle("workspace-mode",e==="focus"||e==="full"),Pr(),za(),e==="list"){jn(),Pn(),re();return}if(jn(),!t)return;let n=document.getElementById("fileList");n||(n=document.createElement("div"),n.id="fileList",n.className="file-list",t.appendChild(n)),n.innerHTML=zo(),Ko(),Wr(n),re()}function re(){let e=Array.from(l.sessionFiles.values()),t=document.getElementById("tabs");if(!t)return;Da(),Ra();let n=t.querySelector(".tab-manager-list");n&&(jt=n.scrollTop);let o=t.querySelector(".tabs-scroll");if(o&&(Pt=o.scrollLeft),e.length===0){t.innerHTML="",t.style.display="none",P=!1,Hn="";return}let r=xt(l.sessionFiles),i=r.map(p=>{let g=_(p,U(p.path));return[p.path,p.displayName||p.name,p.isMissing?"1":"0",p.path===l.currentFile?"1":"0",g.type,g.badge||""].join("|")}).join("||"),a=[l.currentFile||"",P?"1":"0",tt,Wt,i].join("###");if(a===Hn)return;Hn=a,Ia(l.currentFile),t.style.display="flex";let s=r.map(p=>{let g=p.path===l.currentFile,y=p.isMissing||!1,h=["tab"];return g&&h.push("active"),y&&h.push("deleted"),\`
        <div class="\${h.join(" ")}"
             onclick="window.switchFile('\${w(p.path)}')">
          <span class="tab-name">\${b(p.displayName)}</span>
          <span class="tab-close" onclick="event.stopPropagation();window.removeFile('\${w(p.path)}')">\\xD7</span>
        </div>
      \`}).join(""),c=Wt.toLowerCase().trim(),d=r.filter(p=>{let g=p.displayName||p.name;return c?g.toLowerCase().includes(c)||p.path.toLowerCase().includes(c):!0}).sort((p,g)=>{let y=p.displayName||p.name,h=g.displayName||g.name;if(tt==="name")return y.localeCompare(h,"zh-CN");let v=Hr(p.path)-Hr(g.path);return v!==0?v:y.localeCompare(h,"zh-CN")}),u=d.length===0?'<div class="tab-manager-empty">\\u6CA1\\u6709\\u5339\\u914D\\u7684\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6</div>':d.map(p=>{let g=p.displayName||p.name,y=p.path===l.currentFile,h=_(p,U(p.path)),v=h.badge?\`<span class="tab-manager-status status-\${h.type}">\${b(h.badge)}</span>\`:"";return\`
          <div class="tab-manager-item \${y?"active":""}" onclick="window.switchFile('\${w(p.path)}')">
            <span class="tab-manager-name" title="\${w(p.path)}">\${b(g)}</span>
            <span class="tab-manager-actions">
              \${v}
              <button class="tab-manager-close" type="button" title="\\u5173\\u95ED" onclick="event.stopPropagation();window.removeFile('\${w(p.path)}')">\\xD7</button>
            </span>
          </div>
        \`}).join(""),m={others:Fe("close-others",r,l.currentFile,()=>!1).length,right:Fe("close-right",r,l.currentFile,()=>!1).length,unmodified:Fe("close-unmodified",r,l.currentFile,p=>{let g=r.find(h=>h.path===p);if(!g)return!1;let y=_(g,U(g.path));return y.type==="normal"||y.type==="new"}).length,all:Fe("close-all",r,l.currentFile,()=>!1).length};t.innerHTML=\`
    <div class="tabs-scroll">\${s}</div>
    <div class="tab-manager-wrap">
      <button class="tab-manager-toggle \${P?"active":""}" type="button" onclick="event.stopPropagation();window.toggleTabManager()">\\u2261 Tabs (\${r.length})</button>
      <div class="tab-manager-panel \${P?"show":""}" onclick="event.stopPropagation()">
        <div class="tab-manager-row tab-manager-actions-row">
          <button class="tab-manager-action" type="button" data-action="close-others" onclick="window.applyTabBatchAction('close-others')">\\u5173\\u95ED\\u5176\\u4ED6 (\${m.others})</button>
          <button class="tab-manager-action" type="button" data-action="close-right" onclick="window.applyTabBatchAction('close-right')">\\u5173\\u95ED\\u53F3\\u4FA7 (\${m.right})</button>
          <button class="tab-manager-action" type="button" data-action="close-unmodified" onclick="window.applyTabBatchAction('close-unmodified')">\\u5173\\u95ED\\u672A\\u4FEE\\u6539 (\${m.unmodified})</button>
          <button class="tab-manager-action danger" type="button" data-action="close-all" onclick="window.applyTabBatchAction('close-all')">\\u5173\\u95ED\\u5168\\u90E8 (\${m.all})</button>
        </div>
        <div class="tab-manager-row">
          <input class="tab-manager-search" placeholder="\\u641C\\u7D22\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6" value="\${w(Wt)}" oninput="window.setTabManagerQuery(this.value)">
        </div>
        <div class="tab-manager-row">
          <button class="tab-manager-sort \${tt==="recent"?"active":""}" type="button" onclick="window.setTabManagerSort('recent')">\\u6700\\u8FD1\\u4F7F\\u7528</button>
          <button class="tab-manager-sort \${tt==="name"?"active":""}" type="button" onclick="window.setTabManagerSort('name')">\\u6309\\u540D\\u79F0</button>
        </div>
        <div class="tab-manager-list">\${u}</div>
      </div>
    </div>
  \`,requestAnimationFrame(()=>{let p=t.querySelector(".tab-manager-list");p&&jt>0&&(p.scrollTop=jt);let g=t.querySelector(".tabs-scroll");g&&Pt>0&&(g.scrollLeft=Pt),ne()})}var It,Ht,Nr,P,Wt,tt,Br,jt,Pt,Ir,Hn,He,L=x(()=>{"use strict";N();pe();xe();fe();Lo();Et();Je();Fo();Jo();In();Sn();It=0,Ht="",Nr=!1,P=!1,Wt="",tt="recent",Br=!1,jt=0,Pt=0,Ir=!1,Hn="",He=[];typeof window<"u"&&(window.setSidebarTab=jr,window.toggleTabManager=Ha,window.setTabManagerQuery=ja,window.setTabManagerSort=Pa,window.applyTabBatchAction=Oa)});var We,Dr,nt=x(()=>{"use strict";We=\`/*light */
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

\`,Dr=\`pre code.hljs {
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
  
}\`});var Dn,Rr=x(()=>{"use strict";nt();Dn=We});var Or,qr=x(()=>{"use strict";nt();Or=We+\`

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
\`});var zr,_r=x(()=>{"use strict";nt();zr=We+\`

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
\`});var Rn,Kr=x(()=>{"use strict";nt();Rn=Dr});var Jr,Ur=x(()=>{"use strict";Jr=\`
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
\`});var Vr,Gr=x(()=>{"use strict";Vr=\`
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
\`});function Qr(e){return On.find(t=>t.key===e)?.css??Dn}function Xr(e){return qn.find(t=>t.key===e)?.css??Rn}var On,qn,zn=x(()=>{"use strict";Rr();qr();_r();Kr();Ur();Gr();On=[{key:"github",label:"GitHub",css:Dn},{key:"notion",label:"Notion",css:Or},{key:"bear",label:"Bear / iA Writer",css:zr}],qn=[{key:"github",label:"GitHub Light",css:Rn},{key:"github-dark",label:"GitHub Dark",css:Jr},{key:"atom-one-dark",label:"Atom One Dark",css:Vr}]});function Zr(){Dt=l.config.markdownTheme||"github",_n=l.config.codeTheme||"github",document.getElementById("settingsDialogOverlay")||_a(),Ka();let t=document.getElementById("settingsDialogOverlay");t&&t.classList.add("show")}function _a(){let e=document.createElement("div");e.id="settingsDialogOverlay",e.className="sync-dialog-overlay",e.innerHTML=\`
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
  \`,document.body.appendChild(e),e.addEventListener("click",t=>{t.target===e&&ot()})}function Ka(){let e=document.getElementById("settingsDialogBody");if(!e)return;let t=Ua();e.innerHTML=\`
    <div class="settings-section">
      <div class="settings-section-title">\\u4E3B\\u9898</div>
      <div class="settings-section-desc">\\u5207\\u6362 Markdown \\u6B63\\u6587\\u6837\\u5F0F\\u548C\\u4EE3\\u7801\\u9AD8\\u4EAE\\u914D\\u8272\\u3002</div>
      <div class="settings-kv-grid">
        <div>\\u6B63\\u6587\\u6837\\u5F0F</div>
        <div>
          <select id="markdownThemeSelect" style="font-size:12px;padding:2px 6px;border:1px solid #ddd;border-radius:3px">
            \${On.map(a=>\`<option value="\${a.key}"\${l.config.markdownTheme===a.key?" selected":""}>\${a.label}</option>\`).join("")}
          </select>
        </div>
        <div>\\u4EE3\\u7801\\u9AD8\\u4EAE</div>
        <div>
          <select id="codeThemeSelect" style="font-size:12px;padding:2px 6px;border:1px solid #ddd;border-radius:3px">
            \${qn.map(a=>\`<option value="\${a.key}"\${l.config.codeTheme===a.key?" selected":""}>\${a.label}</option>\`).join("")}
          </select>
        </div>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">\\u5BA2\\u6237\\u7AEF\\u72B6\\u6001</div>
      <div class="settings-section-desc">\\u7528\\u4E8E\\u6392\\u67E5\\u672C\\u5730\\u7F13\\u5B58\\u662F\\u5426\\u810F\\u6570\\u636E\\uFF0C\\u53EF\\u76F4\\u63A5\\u6E05\\u7406\\u3002</div>
      <div class="settings-kv-grid">
        <div>\\u5F53\\u524D\\u6587\\u4EF6</div><div>\${Yr(t.currentFile||"\\u65E0")}</div>
        <div>\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6\\u6570</div><div>\${t.openFilesCount}</div>
        <div>\\u5DE5\\u4F5C\\u533A\\u6570</div><div>\${t.workspaceCount}</div>
        <div>\\u8BC4\\u8BBA\\u76F8\\u5173\\u672C\\u5730\\u952E\\u6570</div><div>\${t.commentStateKeyCount}</div>
        <div>md-viewer \\u672C\\u5730\\u952E\\u6570</div><div>\${t.mdvKeyCount}</div>
        <div>localStorage \\u603B\\u952E\\u6570</div><div>\${t.localStorageKeyCount}</div>
      </div>
      <div class="settings-key-list">
        \${t.mdvKeys.map(a=>\`<span class="settings-key-chip">\${Yr(a)}</span>\`).join("")}
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
  \`,document.getElementById("clearClientStateBtn")?.addEventListener("click",()=>{Va()}),document.getElementById("clearAllCommentsBtn")?.addEventListener("click",()=>{Ga()});let r=document.getElementById("markdownThemeSelect"),i=document.getElementById("codeThemeSelect");r?.addEventListener("change",()=>{l.config.markdownTheme=r.value,window.applyTheme?.()}),i?.addEventListener("change",()=>{l.config.codeTheme=i.value,window.applyTheme?.()})}function ot(){Dt&&(l.config.markdownTheme=Dt,l.config.codeTheme=_n,window.applyTheme?.());let e=document.getElementById("settingsDialogOverlay");e&&e.classList.remove("show")}function Ja(){let e=document.getElementById("markdownThemeSelect"),t=document.getElementById("codeThemeSelect");e&&(l.config.markdownTheme=e.value),t&&(l.config.codeTheme=t.value),H(l.config),A(),Dt="",_n="",ot()}function Ua(){let e=[];for(let o=0;o<localStorage.length;o+=1){let r=localStorage.key(o);r&&e.push(r)}e.sort();let t=e.filter(o=>o.startsWith("md-viewer:")),n=t.filter(o=>o==="md-viewer:annotation-panel-open-by-file"||o==="md-viewer:annotation-density"||o==="md-viewer:annotation-sidebar-width"||o.startsWith("md-viewer:annotations:")).length;return{currentFile:l.currentFile,openFilesCount:l.sessionFiles.size,workspaceCount:l.config.workspaces.length,commentStateKeyCount:n,mdvKeyCount:t.length,localStorageKeyCount:e.length,mdvKeys:t}}function Va(){let e=[];for(let t=0;t<localStorage.length;t+=1){let n=localStorage.key(t);n&&n.startsWith("md-viewer:")&&e.push(n)}for(let t of e)localStorage.removeItem(t);z(\`\\u5DF2\\u6E05\\u7406\\u5BA2\\u6237\\u7AEF\\u72B6\\u6001\\uFF08\${e.length} \\u9879\\uFF09\`,1800),window.setTimeout(()=>window.location.reload(),250)}async function Ga(){try{let e=await fetch("/api/annotations/clear",{method:"POST"}),t=await e.json();if(!e.ok||t?.success!==!0)throw new Error(t?.error||\`HTTP \${e.status}\`);let n=[];for(let o=0;o<localStorage.length;o+=1){let r=localStorage.key(o);r&&(r.startsWith("md-viewer:annotations:")&&n.push(r),r==="md-viewer:annotation-panel-open-by-file"&&n.push(r),r==="md-viewer:annotation-density"&&n.push(r),r==="md-viewer:annotation-sidebar-width"&&n.push(r))}for(let o of n)localStorage.removeItem(o);z(\`\\u5DF2\\u6E05\\u7A7A\\u8BC4\\u8BBA\\u72B6\\u6001\\uFF08\\u670D\\u52A1\\u7AEF \${t?.deleted||0} \\u6761\\uFF0C\\u672C\\u5730 \${n.length} \\u9879\\uFF09\`,1800),window.setTimeout(()=>window.location.reload(),250)}catch(e){M(\`\\u6E05\\u7A7A\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25: \${e?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)}}function Yr(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}var Dt,_n,ei=x(()=>{"use strict";N();xe();L();Ae();zn();Dt="",_n="";typeof window<"u"&&(window.closeSettingsDialog=ot,window.saveSettings=Ja)});function Qa(e,t=60){let n=JSON.stringify(e);return n.length<=t?b(n):b(n.slice(0,t))+"\\u2026"}function Kn(e,t,n,o){let r=e!==null&&typeof e=="object",i=n<1;if(!r){let E=t!==null?\`<span class="json-key">\${je(b(JSON.stringify(t)),o)}</span><span class="json-colon">:</span>\`:"",k=Xa(e,o);return\`
      <li>
        <div class="json-node">
          <span class="json-toggle"></span>
          \${E}
          \${k}
        </div>
      </li>\`}let a=Array.isArray(e),s=a?e.map((E,k)=>({k:String(k),v:E})):Object.entries(e).map(([E,k])=>({k:E,v:k})),c=s.length,d=a?"[":"{",u=a?"]":"}",m=!i,p=m?"\\u25B6":"\\u25BC",g=m?"json-children collapsed":"json-children",y=t!==null?\`<span class="json-key">\${je(b(JSON.stringify(t)),o)}</span><span class="json-colon">:</span>\`:"",h=m?\`<span class="json-preview">\${Qa(e)}</span>\`:"",v=s.map(({k:E,v:k})=>Kn(k,a?null:E,n+1,o)).join("");return\`
    <li>
      <div class="json-node json-node-expandable" data-expanded="\${!m}">
        <span class="json-toggle">\${p}</span>
        \${y}
        <span class="json-bracket">\${d}</span>
        <span class="json-count">\${c} \${a?"items":"keys"}</span>
        \${h}
        <span class="json-bracket json-close-bracket" style="display:\${m?"none":"inline"}">\${u}</span>
      </div>
      <ul class="\${g}">
        \${v}
        <li><div class="json-node"><span class="json-toggle"></span><span class="json-bracket">\${u}</span></div></li>
      </ul>
    </li>\`}function Xa(e,t){return e===null?\`<span class="json-null">\${je("null",t)}</span>\`:typeof e=="boolean"?\`<span class="json-boolean">\${je(String(e),t)}</span>\`:typeof e=="number"?\`<span class="json-number">\${je(String(e),t)}</span>\`:\`<span class="json-string">\${je(b(JSON.stringify(e)),t)}</span>\`}function je(e,t){if(!t)return e;let n=t.toLowerCase(),o=e.toLowerCase(),r="",i=0;for(;i<e.length;){let a=o.indexOf(n,i);if(a===-1){r+=e.slice(i);break}r+=e.slice(i,a),r+=\`<mark class="json-match">\${e.slice(a,a+n.length)}</mark>\`,i=a+n.length}return r}function Ya(e,t){if(!t)return!1;let n=t.toLowerCase(),o=!1;function r(a){let s=a.querySelector(":scope > .json-node"),c=a.querySelector(":scope > .json-children");if(!c)return(s?.textContent?.toLowerCase()||"").includes(n);let d=Array.from(c.querySelectorAll(":scope > li")),u=!1;for(let m of d)r(m)&&(u=!0);if(u){if(o=!0,s){s.setAttribute("data-expanded","true");let m=s.querySelector(".json-toggle");m&&(m.textContent="\\u25BC");let p=s.querySelector(".json-close-bracket");p&&(p.style.display="inline");let g=s.querySelector(".json-preview");g&&(g.style.display="none")}c.classList.remove("collapsed")}return u}let i=Array.from(e.querySelectorAll(":scope > ul > li"));for(let a of i)r(a);return o}function Za(e){e.addEventListener("click",t=>{let o=t.target.closest(".json-node-expandable");if(!o)return;let i=o.parentElement.querySelector(":scope > .json-children");if(!i)return;let a=o.getAttribute("data-expanded")==="true",s=o.querySelector(".json-toggle"),c=o.querySelector(".json-close-bracket"),d=o.querySelector(".json-preview");if(a)if(o.setAttribute("data-expanded","false"),s&&(s.textContent="\\u25B6"),i.classList.add("collapsed"),c&&(c.style.display="none"),d)d.style.display="";else{let u=document.createElement("span");u.className="json-preview",u.textContent="\\u2026",o.appendChild(u)}else o.setAttribute("data-expanded","true"),s&&(s.textContent="\\u25BC"),i.classList.remove("collapsed"),c&&(c.style.display="inline"),d&&(d.style.display="none")})}function ti(e,t,n,o=""){if(Ke(n)?ts(e,t,o):es(e,t,o),Za(e),o&&!Ya(e,o)){let a=document.createElement("div");a.className="json-no-results",a.textContent="\\u65E0\\u5339\\u914D\\u7ED3\\u679C",e.appendChild(a)}}function es(e,t,n){let o;try{o=JSON.parse(t)}catch(i){e.innerHTML=\`
      <div class="json-viewer">
        <div class="json-error">
          JSON \\u89E3\\u6790\\u5931\\u8D25\\uFF1A\${b(String(i))}
          <pre>\${b(t.slice(0,500))}</pre>
        </div>
      </div>\`;return}let r=document.createElement("div");r.className="json-viewer",r.innerHTML=\`<ul>\${Kn(o,null,0,n)}</ul>\`,e.appendChild(r)}function ts(e,t,n){let o=t.split(\`
\`),r=document.createElement("div");r.className="json-viewer";let i=0;for(let a of o){let s=a.trim();if(!s)continue;i++;let c=document.createElement("div");c.className="json-line-header",c.textContent=\`Line \${i}\`,r.appendChild(c);let d;try{d=JSON.parse(s)}catch(m){let p=document.createElement("div");p.className="json-error",p.innerHTML=\`\\u89E3\\u6790\\u5931\\u8D25\\uFF1A\${b(String(m))}<pre>\${b(s.slice(0,200))}</pre>\`,r.appendChild(p);continue}let u=document.createElement("ul");u.innerHTML=Kn(d,null,0,n),r.appendChild(u)}e.appendChild(r)}var ni=x(()=>{"use strict";fe();Je()});var he={};le(he,{renderAll:()=>ss});function ii(){let e=Qr(l.config.markdownTheme||"github"),t=Xr(l.config.codeTheme||"github"),n=document.getElementById("theme-md-css"),o=document.getElementById("theme-hl-css");n&&(n.textContent=e),o&&(o.textContent=t)}function ke(e=!1){let t=l.currentFile&&!ui(l.currentFile)?l.currentFile:null,n=wr();(e||t!==n)&&yr(t),B(),C(t)}async function si(e,t=!1){let n=l.currentFile,o=t;nn(e,o),o&&(l.config.sidebarTab==="focus"||l.config.sidebarTab==="full")&&await dn(e.path),o&&e.path,A(),J(),ke(o&&n!==e.path),o&&n!==e.path&&li()}function li(){let e=document.getElementById("content");e&&e.scrollTo({top:0,behavior:"auto"})}function os(){return Math.max(ai,Math.min(ns,window.innerWidth-360))}function Xn(e){return Math.min(os(),Math.max(ai,Math.round(e)))}function rt(e){let t=Xn(e);document.documentElement.style.setProperty("--sidebar-width",\`\${t}px\`)}function rs(){let e=Number(localStorage.getItem(Gn)),t=Number.isFinite(e)&&e>0?e:Qn;rt(t)}function is(){let e=document.getElementById("sidebarResizer");if(!e)return;let t=!1,n=r=>{if(!t)return;let i=Xn(r.clientX);rt(i)},o=r=>{if(!t)return;t=!1;let i=Xn(r.clientX);rt(i),localStorage.setItem(Gn,String(i)),document.body.classList.remove("sidebar-resizing"),window.removeEventListener("mousemove",n),window.removeEventListener("mouseup",o)};e.addEventListener("mousedown",r=>{window.innerWidth<=900||(t=!0,document.body.classList.add("sidebar-resizing"),window.addEventListener("mousemove",n),window.addEventListener("mouseup",o),r.preventDefault())}),e.addEventListener("dblclick",()=>{rt(Qn),localStorage.setItem(Gn,String(Qn))}),window.addEventListener("resize",()=>{let r=Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sidebar-width"),10);Number.isFinite(r)&&rt(r)})}async function as(){l.currentFile&&await Zn(l.currentFile,{silent:!0,highlight:!1})}async function ci(e){await Zn(e,{silent:!1,highlight:!0})&&l.currentFile===e&&z("\\u6587\\u4EF6\\u5DF2\\u5237\\u65B0",2e3)}function di(){let e=document.getElementById("content");e&&(e.style.animation="flash 700ms ease-out",setTimeout(()=>{e.style.animation=""},700))}async function Zn(e,t={}){let n=l.sessionFiles.get(e);if(!n||n.isMissing)return!1;let o=(Jn.get(e)||0)+1;Jn.set(e,o);let r=await Le(e,t.silent!==!1);if(!r||Jn.get(e)!==o)return!1;let i=l.sessionFiles.get(e)||l.sessionFiles.get(r.path);if(!i)return!1;if(i.content=r.content,i.pendingContent=void 0,r.lastModified>=(i.lastModified||0)&&(i.lastModified=r.lastModified),i.displayedModified=r.lastModified,i.isMissing=!1,O(),l.currentFile===e||l.currentFile===r.path){if(ie){ie=!1;let a=document.getElementById("diffButton");a&&a.classList.remove("active")}J(),ke(!1),t.highlight&&di()}return A(),await ve(),!0}function ss(){A(),J(),ke(!1)}function ls(e,t){let n=\`\${e}/\${t}\`,o=n.startsWith("/"),r=n.split("/"),i=[];for(let a of r)if(!(!a||a===".")){if(a===".."){i.length>0&&i.pop();continue}i.push(a)}return\`\${o?"/":""}\${i.join("/")}\`}function cs(e,t){let n=e.trim();if(!n||n.startsWith("http://")||n.startsWith("https://")||n.startsWith("data:")||n.startsWith("blob:")||n.startsWith("/api/")||pi(t))return null;let o=n.indexOf("?"),r=n.indexOf("#"),i=[o,r].filter(u=>u>=0).sort((u,m)=>u-m)[0]??-1,a=i>=0?n.slice(0,i):n,s=i>=0?n.slice(i):"",c=t.slice(0,t.lastIndexOf("/")),d=a.startsWith("/")?a:ls(c,a);return\`/api/file-asset?path=\${encodeURIComponent(d)}\${s}\`}function ds(e,t){let n=e.querySelector(".markdown-body");n&&n.querySelectorAll("img[src], video[src], source[src]").forEach(o=>{let r=o.getAttribute("src");if(!r)return;let i=cs(r,t);i&&o.setAttribute("src",i)})}async function us(e){let t=window.mermaid;if(!t)return;let n=Array.from(e.querySelectorAll(".markdown-body pre > code.language-mermaid, .markdown-body pre > code.lang-mermaid, .markdown-body pre > code.language-flowchart, .markdown-body pre > code.lang-flowchart"));if(n.length===0)return;oi||(t.initialize({startOnLoad:!1,theme:"neutral",securityLevel:"loose"}),oi=!0);let o=i=>{let a=i.textContent||"\\u590D\\u5236";i.textContent="\\u2713",i.classList.add("copied"),window.setTimeout(()=>{i.textContent=a,i.classList.remove("copied")},900)},r=(i,a)=>{let s=document.createElement("div");s.className="mermaid-source-panel",s.style.display=a?"block":"none";let c=document.createElement("div");c.className="mermaid-source-head";let d=document.createElement("span");d.textContent="Mermaid \\u6E90\\u7801";let u=document.createElement("button");u.className="mermaid-source-copy",u.textContent="\\u590D\\u5236",u.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(i),o(u)}catch{}}),c.appendChild(d),c.appendChild(u);let m=document.createElement("pre"),p=document.createElement("code");p.className="language-mermaid",p.textContent=i,m.appendChild(p),s.appendChild(c),s.appendChild(m);let g=document.createElement("button");return g.className="mermaid-source-toggle",g.textContent=a?"\\u9690\\u85CF\\u6E90\\u7801":"\\u6E90\\u7801",g.addEventListener("click",()=>{let y=s.style.display!=="none";s.style.display=y?"none":"block",g.textContent=y?"\\u6E90\\u7801":"\\u9690\\u85CF\\u6E90\\u7801"}),{panel:s,toggleButton:g}};for(let i=0;i<n.length;i+=1){let a=n[i],s=a.closest("pre");if(!s)continue;let c=(a.textContent||"").trim();if(!c)continue;let d=a.classList.contains("language-flowchart")||a.classList.contains("lang-flowchart"),u=c.split(\`
\`).find(p=>p.trim().length>0)?.trim().toLowerCase()||"",m=d&&!u.startsWith("flowchart")&&!u.startsWith("graph")?\`flowchart TD
\${c}\`:c;if(m)try{let p=\`mdv-mermaid-\${Date.now()}-\${i}\`,{svg:g,bindFunctions:y}=await t.render(p,m),h=document.createElement("div");h.className="mermaid-block";let v=document.createElement("div");v.className="mermaid-actions";let{panel:E,toggleButton:k}=r(m,!1);v.appendChild(k);let S=document.createElement("div");S.className="mermaid",S.setAttribute("data-mdv-mermaid","1"),S.innerHTML=g,h.appendChild(v),h.appendChild(S),h.appendChild(E),s.replaceWith(h),typeof y=="function"&&y(S)}catch(p){let g=document.createElement("div");g.className="mermaid-fallback-block";let y=document.createElement("div");y.className="mermaid-actions";let{panel:h,toggleButton:v}=r(m,!0);y.appendChild(v);let E=document.createElement("div");E.className="mermaid-fallback-notice",E.textContent="Mermaid \\u8BED\\u6CD5\\u9519\\u8BEF\\uFF0C\\u5DF2\\u56DE\\u9000\\u4E3A\\u539F\\u6587\\u663E\\u793A",g.appendChild(y),g.appendChild(E),g.appendChild(h),s.replaceWith(g),console.error("Mermaid \\u6E32\\u67D3\\u5931\\u8D25\\uFF0C\\u5DF2\\u56DE\\u9000\\u539F\\u6587:",p)}}}function J(){let e=document.getElementById("content");if(!e)return;if(!l.currentFile){e.removeAttribute("data-current-file"),e.innerHTML=\`
      <div class="empty-state">
        <h2>\\u6B22\\u8FCE\\u4F7F\\u7528 MD Viewer</h2>
        <p>\\u5728\\u5DE6\\u4FA7\\u6DFB\\u52A0 Markdown/HTML \\u6587\\u4EF6\\u5F00\\u59CB\\u9605\\u8BFB</p>
      </div>
    \`;return}let t=l.sessionFiles.get(l.currentFile);if(!t)return;if(ui(t.path)){e.setAttribute("data-current-file",t.path),e.innerHTML=\`<iframe class="html-preview-frame" srcdoc="\${t.content.replace(/"/g,"&quot;").replace(/'/g,"&#39;")}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"></iframe>\`;let i=document.getElementById("fileMeta");i&&(i.textContent=kt(t.lastModified)),Vn(),ve();return}if(fs(t.path)){e.setAttribute("data-current-file",t.path),e.innerHTML="";let a=document.getElementById("searchInput")?.value?.trim()??"";ti(e,t.content,t.path,a);let s=document.getElementById("fileMeta");s&&(s.textContent=kt(t.lastModified)),Vn(),ve();return}let n=window.marked.parse(t.content),o=t.isMissing?\`
      <div class="content-file-status deleted">
        \\u8BE5\\u6587\\u4EF6\\u5DF2\\u4ECE\\u78C1\\u76D8\\u5220\\u9664\\uFF0C\\u5F53\\u524D\\u5185\\u5BB9\\u4E3A\\u672C\\u5730\\u7F13\\u5B58\\u5FEB\\u7167\\u3002
      </div>
    \`:"";e.innerHTML=\`\${o}<div class="markdown-body" id="reader">\${n}</div>\`,e.setAttribute("data-current-file",t.path),ds(e,t.path),us(e),B();let r=document.getElementById("fileMeta");r&&(r.textContent=kt(t.lastModified)),Vn(),ve()}function Vn(){let e=document.getElementById("breadcrumb");if(!e||!l.currentFile){e&&(e.innerHTML="");return}let t=l.sessionFiles.get(l.currentFile);if(!t)return;let n=t.path.split("/").filter(Boolean),o=n[n.length-1]||"",r=n.map((i,a)=>{let s=a===n.length-1,c="/"+n.slice(0,a+1).join("/");return s?\`<span class="breadcrumb-item active">\${b(i)}</span>\`:\`
      <span class="breadcrumb-item" title="\${w(c)}">
        \${b(i)}
      </span>
      <span class="breadcrumb-separator">/</span>
    \`}).join("");e.innerHTML=\`
    \${r}
    <button class="copy-filename-button" onclick="copyFilePath('\${w(t.path)}', event)" title="\\u590D\\u5236\\u76F8\\u5BF9\\u8DEF\\u5F84 / \\u2325+\\u70B9\\u51FB\\u590D\\u5236\\u7EDD\\u5BF9\\u8DEF\\u5F84">
      <span class="copy-icon"></span>
      <span class="check-icon">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
        </svg>
      </span>
      <span class="copy-tooltip">\\u590D\\u5236\\u76F8\\u5BF9\\u8DEF\\u5F84</span>
    </button>
  \`}async function ps(e){if(e.stopPropagation(),!l.currentFile)return;let t=e.target,n=document.querySelector(".nearby-menu");if(n){n.remove();return}try{let o=await fn(l.currentFile);if(!o.files||o.files.length===0){mn("\\u9644\\u8FD1\\u6CA1\\u6709\\u5176\\u4ED6 Markdown \\u6587\\u4EF6",3e3);return}let r=document.createElement("div");r.className="nearby-menu",r.innerHTML=\`
      <div class="nearby-menu-header">\\u9644\\u8FD1\\u7684\\u6587\\u4EF6</div>
      \${o.files.map(s=>\`
        <div class="nearby-menu-item" onclick="window.addFileByPath('\${w(s.path)}', true)">
          \\u{1F4C4} \${b(s.name)}
        </div>
      \`).join("")}
    \`;let i=t.getBoundingClientRect();r.style.position="fixed",r.style.left=i.left+"px",r.style.top=i.bottom+5+"px",document.body.appendChild(r);let a=()=>{r.remove(),document.removeEventListener("click",a)};setTimeout(()=>document.addEventListener("click",a),0)}catch(o){M("\\u83B7\\u53D6\\u9644\\u8FD1\\u6587\\u4EF6\\u5931\\u8D25: "+o.message)}}function ms(e){let t=e.split("/").filter(Boolean);return t[t.length-1]||"workspace"}function ui(e){let t=e.toLowerCase();return t.endsWith(".html")||t.endsWith(".htm")}function fs(e){let t=e.toLowerCase();return t.endsWith(".json")||t.endsWith(".jsonl")}function pi(e){return/^https?:\\/\\//i.test(e)}async function gs(e){if(j(e),A(),pi(e)){window.open(e,"_blank","noopener,noreferrer");return}try{let n=await(await fetch("/api/open-local-file",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e})})).json();n?.error&&M(\`\\u6253\\u5F00 HTML \\u5931\\u8D25: \${n.error}\`)}catch(t){M(\`\\u6253\\u5F00 HTML \\u5931\\u8D25: \${t?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)}}function hs(e){let t=e.trim();return t?!!(/^https?:\\/\\//i.test(t)||t.startsWith("/")||t.startsWith("~/")||t.startsWith("./")||t.startsWith("../")||t.includes("/")||t.includes("\\\\")||/\\.[a-zA-Z0-9]{1,10}\$/.test(t)):!1}function it(){K=null;let e=document.getElementById("quickActionConfirm"),t=document.getElementById("quickActionConfirmText"),n=document.getElementById("quickActionConfirmActions");e&&(e.style.display="none",e.className="add-file-confirm"),t&&(t.textContent=""),n&&(n.innerHTML=""),document.body.classList.remove("quick-action-confirm-visible")}function mi(){let e=document.getElementById("quickActionConfirm");return!!e&&e.style.display!=="none"}function Rt(e,t,n={}){document.getElementById("searchInput")?.dispatchEvent(new Event("path-autocomplete-hide"));let r=document.getElementById("quickActionConfirm"),i=document.getElementById("quickActionConfirmText"),a=document.getElementById("quickActionConfirmActions");if(!(!r||!i||!a)){if(i.textContent=e,a.innerHTML="",r.className=\`add-file-confirm state-\${t}\`,r.style.display="flex",document.body.classList.add("quick-action-confirm-visible"),n.primaryLabel&&n.onPrimary){let s=document.createElement("button");s.className="add-file-confirm-button primary",s.textContent=n.primaryLabel,s.onclick=async()=>{await n.onPrimary(),it()},a.appendChild(s)}if(n.allowCancel!==!1){let s=document.createElement("button");s.className="add-file-confirm-button",s.textContent="\\u53D6\\u6D88",s.onclick=()=>it(),a.appendChild(s)}}}async function ri(){if(!K)return;if(K.kind==="add-other-file"){await De(K.path,!0);return}let e=bt(ms(K.path),K.path);A(),z(\`\\u5DF2\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A: \${e.name}\`,2e3),X(""),A()}async function De(e,t=!0){if(!e.trim())return;let n=await Le(e);n&&(await si(n,t),await yn(e,t),X(""),A())}async function fi(e){let t=e.trim();if(!t)return;let n=await hn(t),o=n.path||t;if(n.kind==="md_file"||n.kind==="html_file"){it(),await De(o,!0);return}if(n.kind==="other_file"){K={kind:"add-other-file",path:o,ext:n.ext||null},Rt(\`\\u68C0\\u6D4B\\u5230\\u975E Markdown \\u6587\\u4EF6\${n.ext?\`: \${n.ext}\`:""}\`,"warning",{primaryLabel:"\\u7EE7\\u7EED\\u6DFB\\u52A0\\u6587\\u4EF6",onPrimary:ri});return}if(n.kind==="directory"){K={kind:"add-workspace",path:o},Rt("\\u68C0\\u6D4B\\u5230\\u76EE\\u5F55\\uFF0C\\u662F\\u5426\\u4F5C\\u4E3A\\u5DE5\\u4F5C\\u533A\\u6DFB\\u52A0\\uFF1F","directory",{primaryLabel:"\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A",onPrimary:ri});return}if(n.kind==="not_found"){K=null,Rt("\\u8DEF\\u5F84\\u4E0D\\u5B58\\u5728\\uFF0C\\u8BF7\\u68C0\\u67E5\\u540E\\u91CD\\u8BD5","error",{allowCancel:!0});return}K=null,Rt(n.error||"\\u65E0\\u6CD5\\u8BC6\\u522B\\u8F93\\u5165\\u8DEF\\u5F84","error",{allowCancel:!0})}function ys(e){if(ie){ie=!1;let o=document.getElementById("diffButton");o&&o.classList.remove("active")}let t=l.currentFile;rn(e),A(),J(),ke(!0),t!==e&&li();let n=l.sessionFiles.get(e);n&&!n.isMissing&&n.lastModified>n.displayedModified&&Zn(e,{silent:!0,highlight:!1})}function gi(e){on(e),A(),J(),ke(!0)}async function bs(e){let t=document.getElementById("searchInput"),n=(typeof e=="string"?e:t?.value||"").trim();if(n)try{let o=l.config.workspaces.map(i=>i.path).filter(Boolean),r=await _e(n,{roots:o,limit:50});r.files&&r.files.length>0?await De(r.files[0].path):mn("\\u6CA1\\u6709\\u627E\\u5230\\u5339\\u914D\\u7684\\u6587\\u4EF6",3e3)}catch(o){M("\\u641C\\u7D22\\u5931\\u8D25: "+o.message)}}function ws(){document.body.addEventListener("dragover",e=>{e.preventDefault()}),document.body.addEventListener("drop",async e=>{e.preventDefault();let t=Array.from(e.dataTransfer?.files||[]);for(let n of t){let o=n.name.toLowerCase();(o.endsWith(".md")||o.endsWith(".markdown")||o.endsWith(".html")||o.endsWith(".htm"))&&await De(n.path)}})}function vs(){document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(Er()){e.preventDefault();return}if(document.getElementById("settingsDialogOverlay")?.classList.contains("show")){e.preventDefault(),ot();return}let n=document.getElementById("addWorkspaceDialogOverlay");if(n?.classList.contains("show")){e.preventDefault(),n.classList.remove("show");return}}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){let t=document.activeElement?.tagName?.toLowerCase();if(t==="textarea"||t==="input")return;e.preventDefault();let n=document.getElementById("searchInput");n&&(n.focus(),n.select());return}(e.metaKey||e.ctrlKey)&&e.key==="w"&&(e.preventDefault(),l.currentFile&&gi(l.currentFile))})}function ks(){let e=new URLSearchParams(window.location.search),t=e.get("file"),n=e.get("focus")!=="false";t&&(De(t,n),window.history.replaceState({},"",window.location.pathname))}async function xs(e){let t=l.sessionFiles.get(e);if(!t)return null;if(t.pendingContent!==void 0)return t.pendingContent;let n=await Le(e,!0);return n?(t.pendingContent=n.content,n.content):null}function Es(e,t){let n=document.getElementById("content");if(!n)return;let o=So(e,t);if(!o.some(d=>d.type!=="equal")){n.innerHTML=\`
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
    \`;return}let i=[],a=0;for(;a<o.length;){let d=o[a];d.type==="equal"?(i.push({left:d,right:d}),a++):d.type==="delete"?a+1<o.length&&o[a+1].type==="insert"?(i.push({left:d,right:o[a+1]}),a+=2):(i.push({left:d}),a++):(i.push({right:d}),a++)}let s=d=>d.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),c=i.map(({left:d,right:u})=>{if(d&&u&&d.type==="equal")return\`<tr class="diff-row-equal">
        <td class="diff-line-no">\${d.oldLineNo}</td>
        <td>\${s(d.content)}</td>
        <td class="diff-line-no">\${u.newLineNo}</td>
        <td>\${s(u.content)}</td>
      </tr>\`;let m=d?\`<td class="diff-line-no">\${d.oldLineNo??""}</td>\`:'<td class="diff-line-no diff-cell-empty"></td>',p=d?\`<td class="diff-row-delete-cell">\${s(d.content)}</td>\`:'<td class="diff-cell-empty"></td>',g=u?\`<td class="diff-line-no">\${u.newLineNo??""}</td>\`:'<td class="diff-line-no diff-cell-empty"></td>',y=u?\`<td class="diff-row-insert-cell">\${s(u.content)}</td>\`:'<td class="diff-cell-empty"></td>';return\`<tr class="\${d&&u?"diff-row-mixed":d?"diff-row-delete":"diff-row-insert"}">\${m}\${p}\${g}\${y}</tr>\`}).join("");n.innerHTML=\`
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
  \`}async function Ts(){if(!l.currentFile)return;let e=l.sessionFiles.get(l.currentFile);if(!e)return;if(ie){hi();return}let t=await xs(l.currentFile);if(t===null)return;ie=!0;let n=document.getElementById("diffButton");n&&n.classList.add("active"),Es(e.content,t)}function hi(){ie=!1;let e=document.getElementById("diffButton");e&&e.classList.remove("active"),J()}async function Ss(){if(!l.currentFile)return;let e=l.sessionFiles.get(l.currentFile);!e||e.pendingContent===void 0||(e.content=e.pendingContent,e.pendingContent=void 0,e.displayedModified=e.lastModified,O(),ie=!1,J(),ke(!1),di(),A(),await ve())}async function ve(){let e=document.getElementById("diffButton"),t=document.getElementById("refreshButton");if(!l.currentFile){e&&(e.style.display="none"),t&&(t.style.display="none");return}let n=l.sessionFiles.get(l.currentFile);if(!n)return;if(n.isMissing){e&&(e.style.display="none"),t&&(t.style.display="none");return}let o=n.lastModified>n.displayedModified;e&&(e.style.display=o&&!n.isRemote?"flex":"none"),t&&(t.style.display=o?"flex":"none")}async function Ms(){l.currentFile&&await ci(l.currentFile)}function As(e){return e?.target?e.target.closest(".copy-filename-button, .sync-dialog-copy-btn, .sync-dialog-btn"):null}function Ls(e,t){if(!e)return;if(e.classList.contains("copy-filename-button")){e.classList.add("success");let o=e.querySelector(".copy-tooltip"),r=o?.textContent;o&&(o.textContent=t||"\\u5DF2\\u590D\\u5236"),setTimeout(()=>{e.classList.remove("success"),o&&r&&(o.textContent=r)},1e3);return}let n=e.textContent;e.textContent="\\u2713 \\u5DF2\\u590D\\u5236",setTimeout(()=>{n!=null&&(e.textContent=n)},1e3)}function Yn(e,t,n){navigator.clipboard.writeText(e).then(()=>{Ls(As(t),n)}).catch(()=>{M("\\u590D\\u5236\\u5931\\u8D25")})}function Fs(e,t){Yn(e,t)}function yi(e,t){if(t instanceof MouseEvent&&t.altKey){Yn(e,t,"\\u5DF2\\u590D\\u5236\\u7EDD\\u5BF9\\u8DEF\\u5F84");return}let o=l.config.workspaces,r=e;for(let i of o){let a=i.path.replace(/\\/+\$/,"");if(e===a||e.startsWith(a+"/")){r=e.slice(a.length+1);break}}Yn(r,t,"\\u5DF2\\u590D\\u5236\\u76F8\\u5BF9\\u8DEF\\u5F84")}function Cs(e,t){yi(e,t)}function \$s(){let e=localStorage.getItem("fontScale");e&&(Pe=parseFloat(e)),bi()}function bi(){document.documentElement.style.setProperty("--font-scale",Pe.toString()),wi(),localStorage.setItem("fontScale",Pe.toString())}function wi(){let e=document.getElementById("fontScaleText");if(e){let o=Math.round(Pe*100);e.textContent=\`\${o}%\`}let t=document.querySelectorAll(".font-scale-option");t.forEach(o=>{o.classList.remove("active")});let n=Math.round(Pe*100);t.forEach(o=>{o.textContent?.trim()===\`\${n}%\`&&o.classList.add("active")})}function Ns(e){Pe=e,bi(),eo()}function Bs(){let e=document.getElementById("fontScaleMenu");if(!e)return;e.style.display!=="none"?eo():(e.style.display="block",wi())}function eo(){let e=document.getElementById("fontScaleMenu");e&&(e.style.display="none")}function vi(){let e=new EventSource("/api/events");e.addEventListener("file-changed",async t=>{let n=JSON.parse(t.data),o=Ee(n.path);o?(o.lastModified=n.lastModified,O()):Qt(n.path),A(),await ve()}),e.addEventListener("file-deleted",async t=>{let n=JSON.parse(t.data),o=Ee(n.path);o?(o.isMissing=!0,O()):de(n.path),A(),l.currentFile===n.path&&(J(),ve(),M("\\u6587\\u4EF6\\u5DF2\\u4E0D\\u5B58\\u5728"))}),e.addEventListener("file-opened",async t=>{let n=JSON.parse(t.data);await si(n,n.focus!==!1)}),e.addEventListener("state-request",async t=>{let o=JSON.parse(t.data).requestId;if(!o)return;let r=Array.from(l.sessionFiles.values()).map(i=>({path:i.path,name:i.name}));try{await fetch("/api/session-state",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({requestId:o,currentFile:l.currentFile,openFiles:r})})}catch(i){console.error("\\u54CD\\u5E94\\u72B6\\u6001\\u8BF7\\u6C42\\u5931\\u8D25:",i)}}),e.onerror=()=>{console.error("SSE \\u8FDE\\u63A5\\u65AD\\u5F00\\uFF0C\\u5C1D\\u8BD5\\u91CD\\u8FDE..."),e.close(),setTimeout(vi,3e3)}}function Is(){window.setInterval(async()=>{if(Un||l.config.sidebarTab==="list")return;let e=l.config.sidebarTab==="focus"?l.config.workspaces:l.config.workspaces.filter(t=>t.isExpanded);if(e.length!==0){Un=!0;try{for(let t of e)await q(t.id);A()}finally{Un=!1}}},1500)}function Hs(){let e=document.createElement("div");e.id="findBar",e.innerHTML=\`
    <input id="findBarInput" type="text" placeholder="\\u67E5\\u627E..." autocomplete="off" spellcheck="false" />
    <span id="findBarCount"></span>
    <button id="findBarPrev" title="\\u4E0A\\u4E00\\u4E2A (\\u21E7\\u2318G)">&#8593;</button>
    <button id="findBarNext" title="\\u4E0B\\u4E00\\u4E2A (\\u2318G)">&#8595;</button>
    <button id="findBarClose" title="\\u5173\\u95ED (Esc)">&#10005;</button>
  \`,document.body.appendChild(e);let t=document.getElementById("findBarInput"),n=document.getElementById("findBarCount"),o=document.getElementById("findBarPrev"),r=document.getElementById("findBarNext"),i=document.getElementById("findBarClose"),a=[],s=-1,c=null;function d(){c&&c.querySelectorAll("mark.find-highlight").forEach(k=>{let S=k.parentNode;S&&(S.replaceChild(document.createTextNode(k.textContent||""),k),S.normalize())}),a=[],s=-1,n.textContent=""}function u(k){return k.replace(/[.*+?^\${}()|[\\]\\\\]/g,"\\\\\$&")}function m(k){if(d(),!k)return;let S=document.getElementById("content");if(!S)return;c=S;let \$=new RegExp(u(k),"gi"),I=document.createTreeWalker(S,NodeFilter.SHOW_TEXT,{acceptNode(ae){let D=ae.parentElement;if(!D)return NodeFilter.FILTER_REJECT;let R=D.tagName.toLowerCase();return R==="script"||R==="style"||R==="mark"?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),at=[],st;for(;st=I.nextNode();)at.push(st);for(let ae of at){let D=ae.textContent||"",R,Re=[],Oe=0;for(\$.lastIndex=0;(R=\$.exec(D))!==null;){R.index>Oe&&Re.push(D.slice(Oe,R.index));let se=document.createElement("mark");se.className="find-highlight",se.textContent=R[0],Re.push(se),a.push(document.createRange()),Oe=R.index+R[0].length}if(Re.length===0)continue;Oe<D.length&&Re.push(D.slice(Oe));let Ot=document.createDocumentFragment();Re.forEach(se=>{typeof se=="string"?Ot.appendChild(document.createTextNode(se)):Ot.appendChild(se)}),ae.parentNode.replaceChild(Ot,ae)}a=[],S.querySelectorAll("mark.find-highlight").forEach(ae=>{let D=document.createRange();D.selectNode(ae),a.push(D)}),a.length>0&&(s=0,p(0)),g()}function p(k){let S=document.getElementById("content");if(!S)return;let \$=S.querySelectorAll("mark.find-highlight");\$.forEach((at,st)=>{at.classList.toggle("find-highlight-current",st===k)});let I=\$[k];I&&I.scrollIntoView({block:"center",behavior:"smooth"})}function g(){a.length===0?(n.textContent=t.value?"\\u65E0\\u7ED3\\u679C":"",n.className=t.value?"no-result":""):(n.textContent=\`\${s+1} / \${a.length}\`,n.className="")}function y(){a.length!==0&&(s=(s+1)%a.length,p(s),g())}function h(){a.length!==0&&(s=(s-1+a.length)%a.length,p(s),g())}function v(){e.classList.add("visible"),t.focus(),t.select(),t.value&&m(t.value)}function E(){e.classList.remove("visible"),d()}window.__showFindBar=v,t.addEventListener("input",()=>m(t.value)),t.addEventListener("keydown",k=>{k.key==="Enter"?(k.shiftKey?h():y(),k.preventDefault()):k.key==="Escape"&&(E(),k.preventDefault())}),o.addEventListener("click",h),r.addEventListener("click",y),i.addEventListener("click",E)}var Gn,Qn,ai,ns,Jn,ie,Un,oi,K,Pe,ye=x(()=>{N();pe();ze();me();fe();Mo();Ao();L();Ae();ei();ni();zn();In();Gn="md-viewer:sidebar-width",Qn=260,ai=220,ns=680,Jn=new Map,ie=!1,Un=!1,oi=!1;K=null;Pe=1;document.addEventListener("click",e=>{let t=document.getElementById("fontScaleMenu"),n=document.getElementById("fontScaleButton");if(!t||!n)return;let o=e.target;!t.contains(o)&&!n.contains(o)&&eo()});window.addFile=()=>{let e=document.getElementById("searchInput");e&&fi(e.value).catch(t=>{M(\`\\u6DFB\\u52A0\\u5931\\u8D25: \${t?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)})};window.handleUnifiedInputSubmit=e=>{let t=document.getElementById("searchInput"),n=(typeof e=="string"?e:t?.value||"").trim();if(n){if(!hs(n)){bs(n).catch(o=>{M(\`\\u641C\\u7D22\\u5931\\u8D25: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)});return}fi(n).catch(o=>{M(\`\\u6DFB\\u52A0\\u5931\\u8D25: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)})}};window.dismissQuickActionConfirm=()=>{mi()&&it()};window.switchFile=ys;window.removeFile=gi;window.showNearbyMenu=ps;window.addFileByPath=De;window.refreshFile=ci;window.handleRefreshButtonClick=Ms;window.handleDiffButtonClick=Ts;window.closeDiffView=hi;window.acceptDiffUpdate=Ss;window.copySingleText=Fs;window.copyFileName=Cs;window.copyFilePath=yi;window.showToast=Me;window.showSettingsDialog=Zr;window.toggleFontScaleMenu=Bs;window.setFontScale=Ns;window.openExternalFile=gs;window.renderContent=J;window.applyTheme=ii;(async()=>(rs(),\$s(),\$r(),ne(),window.addEventListener("resize",()=>{ne()}),await tn(Le),ii(),await cn(),Is(),A(),J(),ke(!0),ws(),is(),document.addEventListener("click",e=>{if(!mi())return;let t=e.target;t&&(t.closest(".sidebar-header")||t.closest("#quickActionConfirm")||it())}),ks(),vs(),document.addEventListener("mouseup",()=>{setTimeout(()=>{let e=document.getElementById("content")?.getAttribute("data-current-file")||null;Cr(e)},0)}),await as(),vi(),Hs()))()});ye();})();
//# sourceMappingURL=client.js.map
`;
