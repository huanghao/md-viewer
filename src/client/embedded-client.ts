// 自动生成的文件，不要手动编辑
// 由 scripts/embed-client.ts 生成

export const EMBEDDED_CLIENT_JS = `"use strict";(()=>{var wr=Object.defineProperty;var x=(e,t)=>()=>(e&&(t=e(e=0)),t);var le=(e,t)=>{for(var n in t)wr(e,n,{get:t[n],enumerable:!0})};var Zn={};le(Zn,{defaultConfig:()=>at,loadConfig:()=>st,saveConfig:()=>H,updateConfig:()=>vr});function st(){try{let e=localStorage.getItem(Yn);if(!e)return{...at};let t=JSON.parse(e);return{...at,...t}}catch(e){return console.error("\\u52A0\\u8F7D\\u914D\\u7F6E\\u5931\\u8D25:",e),{...at}}}function H(e){try{localStorage.setItem(Yn,JSON.stringify(e))}catch(t){console.error("\\u4FDD\\u5B58\\u914D\\u7F6E\\u5931\\u8D25:",t)}}function vr(e){let n={...st(),...e};return H(n),n}var Yn,at,xe=x(()=>{"use strict";Yn="md-viewer:config",at={sidebarTab:"focus",focusWindowKey:"8h",markdownTheme:"github",codeTheme:"github",workspaces:[]}});function to(){try{localStorage.setItem(eo,JSON.stringify(Array.from(ce.entries()).map(([e,t])=>[e,Array.from(t)])))}catch(e){console.error("\\u4FDD\\u5B58\\u5217\\u8868\\u5DEE\\u5F02\\u72B6\\u6001\\u5931\\u8D25:",e)}}function no(){ce.clear();try{let e=localStorage.getItem(eo);if(!e)return;let t=JSON.parse(e);if(!Array.isArray(t))return;for(let n of t){if(!Array.isArray(n)||n.length!==2)continue;let o=n[0],i=n[1];typeof o!="string"||!Array.isArray(i)||ce.set(o,new Set(i.filter(r=>typeof r=="string"&&r.length>0)))}}catch(e){console.error("\\u6062\\u590D\\u5217\\u8868\\u5DEE\\u5F02\\u72B6\\u6001\\u5931\\u8D25:",e)}}function oo(e){return ce.get(e)}function Dt(e,t){ce.set(e,t),to()}function io(e){let t=ce.get(e);return ce.delete(e),to(),t}var eo,ce,ro=x(()=>{"use strict";eo="md-viewer:workspaceKnownFiles",ce=new Map});function de(e){lt.add(e)}function ue(e){lt.delete(e)}function Rt(e){return lt.has(e)}function Ot(e){let t=Array.from(lt.values());if(!e)return t;let n=\`\${e.replace(/\\/+\$/,"")}/\`;return t.filter(o=>o.startsWith(n))}var lt,qt=x(()=>{"use strict";lt=new Set});function zt(){try{let e=Array.from(G.entries()).map(([t,n])=>[t,Array.from(n.entries())]);localStorage.setItem(ao,JSON.stringify(e))}catch(e){console.error("\\u4FDD\\u5B58\\u5DE5\\u4F5C\\u533A\\u76EE\\u5F55\\u5C55\\u5F00\\u72B6\\u6001\\u5931\\u8D25:",e)}}function so(){G.clear();try{let e=localStorage.getItem(ao);if(!e)return;let t=JSON.parse(e);if(!Array.isArray(t))return;for(let n of t){if(!Array.isArray(n)||n.length!==2)continue;let o=n[0],i=n[1];if(typeof o!="string"||!Array.isArray(i))continue;let r=new Map;for(let a of i){if(!Array.isArray(a)||a.length!==2)continue;let s=a[0],c=a[1];typeof s!="string"||typeof c!="boolean"||r.set(s,c)}r.size>0&&G.set(o,r)}}catch(e){console.error("\\u6062\\u590D\\u5DE5\\u4F5C\\u533A\\u76EE\\u5F55\\u5C55\\u5F00\\u72B6\\u6001\\u5931\\u8D25:",e)}}function lo(e){return G.get(e)}function ct(e,t){if(t.size===0){G.delete(e),zt();return}G.set(e,new Map(t)),zt()}function co(e){G.has(e)&&(G.delete(e),zt())}function dt(e){let t=new Map,n=o=>{if(o.type==="directory"){typeof o.isExpanded=="boolean"&&t.set(o.path,o.isExpanded);for(let i of o.children||[])n(i)}};return n(e),t}var ao,G,_t=x(()=>{"use strict";ao="md-viewer:workspaceTreeExpandedState",G=new Map});function U(e){return Q.has(e)}function Kt(e){Q.add(e)}function W(e){Q.has(e)&&Q.delete(e)}function Jt(e){return Oe.has(e)}function Ut(e){Oe.add(e)}function ut(e){Oe.delete(e)}function Vt(){Q.clear(),Oe.clear(),no(),so()}function Gt(e,t){let n=new Set(t),o=oo(e);if(!o){Dt(e,n);return}for(let i of n)o.has(i)||Q.add(i),ue(i);for(let i of o)n.has(i)||(Q.delete(i),de(i));Dt(e,n)}function Qt(e){let t=io(e);if(t)for(let n of t)Q.delete(n),Oe.delete(n)}var Q,Oe,uo=x(()=>{"use strict";ro();qt();_t();Q=new Set,Oe=new Set});var pe=x(()=>{"use strict";uo();qt()});var V={};le(V,{addOrUpdateFile:()=>Zt,getFilteredFiles:()=>nn,getSessionFile:()=>Ee,getSessionFiles:()=>Xt,hasSessionFile:()=>ft,markFileMissing:()=>kr,removeFile:()=>en,restoreState:()=>Yt,saveState:()=>O,setSearchQuery:()=>X,state:()=>l,switchToFile:()=>tn});function Ee(e){return l.sessionFiles.get(e)}function ft(e){return l.sessionFiles.has(e)}function Xt(){return Array.from(l.sessionFiles.values())}function O(){try{let e={files:Array.from(l.sessionFiles.entries()).map(([t,n])=>[t,{path:n.path,name:n.name,isRemote:n.isRemote||!1,isMissing:n.isMissing||!1,displayedModified:n.displayedModified,lastAccessed:n.lastAccessed||Date.now()}]),currentFile:l.currentFile};localStorage.setItem(mt,JSON.stringify(e))}catch(e){if(e.name==="QuotaExceededError"||e.code===22){console.warn("localStorage \\u914D\\u989D\\u5DF2\\u6EE1\\uFF0C\\u6267\\u884C\\u6E05\\u7406..."),po();try{let t={files:Array.from(l.sessionFiles.entries()).map(([n,o])=>[n,{path:o.path,name:o.name,isRemote:o.isRemote||!1,isMissing:o.isMissing||!1,displayedModified:o.displayedModified,lastAccessed:o.lastAccessed||Date.now()}]),currentFile:l.currentFile};localStorage.setItem(mt,JSON.stringify(t))}catch(t){console.error("\\u4FDD\\u5B58\\u72B6\\u6001\\u5931\\u8D25\\uFF08\\u91CD\\u8BD5\\u540E\\uFF09:",t)}}else console.error("\\u4FDD\\u5B58\\u72B6\\u6001\\u5931\\u8D25:",e)}}function po(){if(l.sessionFiles.size<=pt)return;let e=Array.from(l.sessionFiles.entries()).sort((o,i)=>(i[1].lastAccessed||i[1].lastModified||0)-(o[1].lastAccessed||o[1].lastModified||0)),t=e.slice(0,pt),n=e.slice(pt);l.sessionFiles.clear(),t.forEach(([o,i])=>{l.sessionFiles.set(o,i)}),console.log(\`\\u5DF2\\u6E05\\u7406 \${n.length} \\u4E2A\\u65E7\\u6587\\u4EF6\`)}async function Yt(e){try{Vt();let t=localStorage.getItem(mt);if(!t)return;let n=JSON.parse(t);if(!n.files||n.files.length===0)return;let o=[];for(let[i,r]of n.files){let a=await e(i,!0);if(a){let s=r.displayedModified||a.lastModified;l.sessionFiles.set(i,{path:a.path,name:a.filename,content:a.content,lastModified:a.lastModified,displayedModified:s,isRemote:a.isRemote||!1,isMissing:!1,lastAccessed:r.lastAccessed||a.lastModified}),o.push([i,r])}}if(o.length!==n.files.length){let i=l.sessionFiles.has(n.currentFile)?n.currentFile:null;localStorage.setItem(mt,JSON.stringify({files:o,currentFile:i}))}if(n.currentFile&&l.sessionFiles.has(n.currentFile))l.currentFile=n.currentFile;else{let i=Array.from(l.sessionFiles.values())[0];l.currentFile=i?i.path:null}}catch(t){console.error("\\u6062\\u590D\\u72B6\\u6001\\u5931\\u8D25:",t)}}function Zt(e,t=!1){l.sessionFiles.size>=pt&&!l.sessionFiles.has(e.path)&&po();let o=!l.sessionFiles.get(e.path);l.sessionFiles.set(e.path,{path:e.path,name:e.filename,content:e.content,lastModified:e.lastModified,displayedModified:e.lastModified,isRemote:e.isRemote||!1,isMissing:!1,lastAccessed:Date.now()}),t&&(l.currentFile=e.path,W(e.path)),ue(e.path),o&&(t||Kt(e.path)),O()}function en(e){let n=Array.from(l.sessionFiles.keys()).indexOf(e);if(l.sessionFiles.delete(e),W(e),ue(e),l.currentFile===e){let o=Array.from(l.sessionFiles.values());l.currentFile=o.length>0?o[Math.max(0,n-1)].path:null}O()}function tn(e){l.currentFile=e;let t=l.sessionFiles.get(e);t&&(t.lastAccessed=Date.now()),W(e),ue(e),O()}function kr(e,t=!1){let n=l.sessionFiles.get(e),o=Date.now(),i=e.split("/").pop()||n?.name||e;l.sessionFiles.set(e,{path:e,name:i,content:n?.content||\`# \\u6587\\u4EF6\\u5DF2\\u5220\\u9664

\\u8BE5\\u6587\\u4EF6\\u5DF2\\u4ECE\\u78C1\\u76D8\\u5220\\u9664\\uFF0C\\u4E14\\u5F53\\u524D\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\u5185\\u5BB9\\u3002\`,lastModified:n?.lastModified||o,displayedModified:n?.displayedModified||o,isRemote:n?.isRemote||!1,isMissing:!0}),t&&(l.currentFile=e,W(e)),de(e),O()}function X(e){l.searchQuery=e}function nn(){let e=l.searchQuery.toLowerCase().trim();return e?Array.from(l.sessionFiles.values()).filter(t=>t.name.toLowerCase().includes(e)||t.path.toLowerCase().includes(e)):Array.from(l.sessionFiles.values())}var l,mt,pt,N=x(()=>{"use strict";xe();pe();l={sessionFiles:new Map,currentFile:null,searchQuery:"",config:st(),currentWorkspace:null,fileTree:new Map},mt="md-viewer:openFiles",pt=100});function mo(e,t){let n=fo(e);n.size!==0&&gt(t,n)}function fo(e,t=new Map){if(e.type!=="directory")return t;typeof e.isExpanded=="boolean"&&t.set(e.path,e.isExpanded);for(let n of e.children||[])fo(n,t);return t}function gt(e,t){if(e.type==="directory"){let n=t.get(e.path);typeof n=="boolean"&&(e.isExpanded=n)}for(let n of e.children||[])gt(n,t)}var go=x(()=>{"use strict"});var wo={};le(wo,{addWorkspace:()=>ht,getCurrentWorkspace:()=>Mr,hydrateExpandedWorkspaces:()=>an,inferWorkspaceFromPath:()=>Ar,moveWorkspaceByOffset:()=>yt,removeWorkspace:()=>on,revealFileInWorkspace:()=>sn,scanWorkspace:()=>q,switchWorkspace:()=>Sr,toggleNodeExpanded:()=>ln,toggleWorkspaceExpanded:()=>rn});function xr(){return\`ws-\${Date.now()}-\${Math.random().toString(36).substr(2,9)}\`}function Te(e){return e.trim().replace(/\\/+\$/,"")}function Er(e){let t=Te(e),n=null;for(let o of l.config.workspaces){let i=Te(o.path);(t===i||t.startsWith(\`\${i}/\`))&&(!n||i.length>Te(n.path).length)&&(n=o)}return n}function Tr(e,t,n){let o=l.fileTree.get(e);if(!o)return;let i=Te(t),r=Te(n);if(!(r===i||r.startsWith(\`\${i}/\`)))return;let s=(r===i?"":r.slice(i.length+1)).split("/").filter(Boolean);if(s.length<=1)return;let c=!1,d=i;for(let u=0;u<s.length-1;u+=1){d=\`\${d}/\${s[u]}\`;let m=cn(o,d);m&&m.type==="directory"&&m.isExpanded===!1&&(m.isExpanded=!0,c=!0)}c&&ct(e,dt(o))}function ht(e,t){let n=Te(t),o=l.config.workspaces.find(r=>r.path===n);if(o)return l.currentWorkspace=o.id,l.fileTree.delete(o.id),o;let i={id:xr(),name:e,path:n,isExpanded:!1};return l.config.workspaces.push(i),H(l.config),l.currentWorkspace=i.id,i}function on(e){let t=l.config.workspaces.findIndex(n=>n.id===e);t!==-1&&(l.config.workspaces.splice(t,1),H(l.config),l.fileTree.delete(e),Qt(e),co(e),l.currentWorkspace===e&&(l.currentWorkspace=l.config.workspaces.length>0?l.config.workspaces[0].id:null))}function Sr(e){l.config.workspaces.find(n=>n.id===e)&&(l.currentWorkspace=e)}function yt(e,t){let n=l.config.workspaces,o=n.findIndex(a=>a.id===e);if(o===-1)return;let i=o+t;if(i<0||i>=n.length)return;let[r]=n.splice(o,1);n.splice(i,0,r),H(l.config)}function rn(e){let t=l.config.workspaces.find(n=>n.id===e);t&&(t.isExpanded=!t.isExpanded,H(l.config))}function Mr(){return l.currentWorkspace&&l.config.workspaces.find(e=>e.id===l.currentWorkspace)||null}async function Ar(e){try{let t=await fetch("/api/infer-workspace",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filePath:e})});if(!t.ok)return null;let n=await t.json();if(!n.workspacePath)return null;let o=l.config.workspaces.find(r=>r.path===n.workspacePath);if(o)return o;let i=n.workspaceName||n.workspacePath.split("/").pop()||"workspace";return ht(i,n.workspacePath)}catch(t){return console.error("\\u63A8\\u65AD\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",t),null}}async function q(e){let t=l.config.workspaces.find(n=>n.id===e);if(!t)return null;try{let n=new AbortController,o=window.setTimeout(()=>n.abort(),15e3),i=await fetch("/api/scan-workspace",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:t.path}),signal:n.signal});if(window.clearTimeout(o),!i.ok)return console.error("\\u626B\\u63CF\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",await i.text()),null;let r=await i.json(),a=l.fileTree.get(e),s=lo(e),c=!a&&(!s||s.size===0);return a?mo(a,r):s&&s.size>0?gt(r,s):(yo(r),Fr(r,2)),l.fileTree.set(e,r),ct(e,dt(r)),Gt(e,ho(r)),r}catch(n){return console.error("\\u626B\\u63CF\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",n),null}}function ho(e){if(!e)return[];if(e.type==="file")return[e.path];let t=[];for(let n of e.children||[])t.push(...ho(n));return t}function yo(e){if(e.type==="directory")for(let t of e.children||[])t.type==="directory"&&(t.isExpanded=!1,yo(t))}function bo(e,t=[]){if(e.type==="file")t.push(e);else for(let n of e.children||[])bo(n,t);return t}function Lr(e,t){function n(o){if(o.type==="file")return o.path===t;for(let i of o.children||[])if(n(i))return o.isExpanded=!0,!0;return!1}n(e)}function Fr(e,t){let n=bo(e);n.sort((r,a)=>(a.lastModified||0)-(r.lastModified||0));let o=n.slice(0,t),i=new Set;for(let r of o){let a=r.path.substring(0,r.path.lastIndexOf("/"));i.has(a)||(i.add(a),Lr(e,r.path))}}async function an(){let e=l.config.workspaces.filter(t=>t.isExpanded);for(let t of e)await q(t.id);!l.currentWorkspace&&l.config.workspaces.length>0&&(l.currentWorkspace=l.config.workspaces[0].id)}async function sn(e){let t=Er(e);t&&(l.currentWorkspace=t.id,t.isExpanded||(t.isExpanded=!0,H(l.config)),l.fileTree.has(t.id)||await q(t.id),Tr(t.id,t.path,e))}function ln(e,t){let n=l.fileTree.get(e);if(!n)return;let o=cn(n,t);if(o&&o.type==="directory"){let i=o.isExpanded!==!1;o.isExpanded=!i,ct(e,dt(n))}}function cn(e,t){if(e.path===t)return e;if(e.children)for(let n of e.children){let o=cn(n,t);if(o)return o}return null}var qe=x(()=>{"use strict";N();pe();xe();go();_t()});function \$r(){Se||(Se=document.createElement("div"),Se.id="toast-container",Se.className="toast-container",document.body.appendChild(Se))}function Me(e){let t=typeof e=="string"?{message:e,type:"info",duration:3e3}:{type:"info",duration:3e3,...e};\$r();let n=document.createElement("div");n.className=\`toast toast-\${t.type}\`;let o={success:"\\u2713",error:"\\u2717",warning:"\\u26A0",info:"\\u2139"};return n.innerHTML=\`
    <span class="toast-icon">\${o[t.type]}</span>
    <span class="toast-message">\${t.message}</span>
  \`,Se.appendChild(n),requestAnimationFrame(()=>{n.classList.add("toast-show")}),t.duration&&t.duration>0&&setTimeout(()=>{vo(n)},t.duration),n.addEventListener("click",()=>{vo(n)}),n}function vo(e){e.classList.remove("toast-show"),e.classList.add("toast-hide"),setTimeout(()=>{e.remove()},300)}function z(e,t){return Me({message:e,type:"success",duration:t})}function M(e,t){return Me({message:e,type:"error",duration:t})}function ko(e,t){return Me({message:e,type:"warning",duration:t})}function dn(e,t){return Me({message:e,type:"info",duration:t})}var Se,Ae=x(()=>{"use strict";Se=null});var bt={};le(bt,{detectPathType:()=>mn,getNearbyFiles:()=>un,getPathSuggestions:()=>pn,loadFile:()=>Le,openFile:()=>fn,searchFiles:()=>ze});async function Le(e,t=!1){try{let o=await(await fetch(\`/api/file?path=\${encodeURIComponent(e)}\`)).json();return o.error?(t||M(o.error),null):o}catch(n){return t||M(\`\\u52A0\\u8F7D\\u5931\\u8D25: \${n.message}\`),null}}async function ze(e,t={}){let n=new URLSearchParams({query:e});t.limit&&Number.isFinite(t.limit)&&n.set("limit",String(t.limit));for(let i of t.roots||[])i.trim()&&n.append("root",i.trim());return(await fetch(\`/api/files?\${n.toString()}\`)).json()}async function un(e){return(await fetch(\`/api/nearby?path=\${encodeURIComponent(e)}\`)).json()}async function pn(e,t={}){let n=t.kind||"file",o=t.markdownOnly!==!1,i=new URLSearchParams({input:e,kind:n,markdownOnly:o?"true":"false"});return(await fetch(\`/api/path-suggestions?\${i.toString()}\`)).json()}async function mn(e){return(await fetch("/api/detect-path",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e})})).json()}async function fn(e,t=!0){await fetch("/api/open",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,focus:t})})}var me=x(()=>{"use strict";Ae()});function b(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}function w(e){return b(e)}var fe=x(()=>{"use strict"});function xo(e,t){let n=e.split(\`
\`),o=t.split(\`
\`),i=n.length,r=o.length;if(i===0&&r===0)return[];let a=i+r,s=new Array(2*a+1).fill(0),c=[];e:for(let h=0;h<=a;h++){c.push([...s]);for(let v=-h;v<=h;v+=2){let E=v+a,k;v===-h||v!==h&&s[E-1]<s[E+1]?k=s[E+1]:k=s[E-1]+1;let S=k-v;for(;k<i&&S<r&&n[k]===o[S];)k++,S++;if(s[E]=k,k>=i&&S>=r)break e}}let d=[],u=i,m=r;for(let h=c.length-1;h>=0&&(u>0||m>0);h--){let v=c[h],E=u-m,k=E+a,S;E===-h||E!==h&&v[k-1]<v[k+1]?S=E+1:S=E-1;let C=v[S+a],I=C-S;for(;u>C+1&&m>I+1;)d.unshift({type:"equal",x:u-1,y:m-1}),u--,m--;h>0&&(u===C+1&&m===I+1&&C>=0&&I>=0&&n[C]===o[I]?d.unshift({type:"equal",x:C,y:I}):u>C?d.unshift({type:"delete",x:C,y:-1}):d.unshift({type:"insert",x:-1,y:I})),u=C,m=I}let p=[],g=1,y=1;for(let h of d)h.type==="equal"?p.push({type:"equal",content:n[h.x],oldLineNo:g++,newLineNo:y++}):h.type==="delete"?p.push({type:"delete",content:n[h.x],oldLineNo:g++}):p.push({type:"insert",content:o[h.y],newLineNo:y++});return p}var Eo=x(()=>{"use strict"});function wt(e){let n=Date.now()-e,o=Math.floor(n/1e3),i=Math.floor(o/60),r=Math.floor(i/60),a=Math.floor(r/24);return a>0?\`\${a}\\u5929\\u524D\`:r>0?\`\${r}\\u5C0F\\u65F6\\u524D\`:i>0?\`\${i}\\u5206\\u949F\\u524D\`:"\\u521A\\u521A"}var To=x(()=>{"use strict"});function vt(e){let t=Array.from(e.values()),n={};return t.forEach(o=>{n[o.name]=(n[o.name]||0)+1}),t.map(o=>{if(n[o.name]===1)return{...o,displayName:o.name};let i=o.path.split("/").filter(Boolean),r=t.filter(s=>s.name===o.name&&s.path!==o.path),a="";for(let s=i.length-2;s>=0;s--){let c=i[s];if(r.every(d=>d.path.split("/").filter(Boolean)[s]!==c)){a=c;break}}return!a&&i.length>=2&&(a=i[i.length-2]),{...o,displayName:a?\`\${o.name} (\${a})\`:o.name}})}var So=x(()=>{"use strict"});function _(e,t=!1){return e.isMissing?{badge:"D",color:"#ff3b30",type:"deleted"}:e.lastModified>e.displayedModified?{badge:"M",color:"#ff9500",type:"modified"}:t?{badge:"dot",color:"#007AFF",type:"new"}:{badge:null,color:null,type:"normal"}}var kt=x(()=>{"use strict"});function gn(e){let t=e.match(/\\.([^.]+)\$/);return t?t[1].toLowerCase():""}function Cr(e){let t=gn(e);return t==="html"||t==="htm"}function hn(e){return gn(e)==="json"}function _e(e){return gn(e)==="jsonl"}function ge(e){return Cr(e)?{cls:"html",label:"<>"}:hn(e)||_e(e)?{cls:"json",label:"{}"}:{cls:"md",label:"M"}}var Ke=x(()=>{"use strict"});function Fe(e,t,n,o){if(t.length===0)return[];if(e==="close-all")return t.map(i=>i.path);if(!n)return[];if(e==="close-others")return t.filter(i=>i.path!==n).map(i=>i.path);if(e==="close-right"){let i=t.findIndex(r=>r.path===n);return i<0?[]:t.slice(i+1).map(r=>r.path)}return t.filter(i=>i.path!==n&&o(i.path)).map(i=>i.path)}var Mo=x(()=>{"use strict"});function Je(e){return e&&(e.replace(/\\.(md|markdown|html?)\$/i,"")||e)}var yn=x(()=>{"use strict"});var vn={};le(vn,{getPinnedFiles:()=>wn,isPinned:()=>bn,pinFile:()=>Nr,unpinFile:()=>Br});function xt(){try{let e=localStorage.getItem(Ao);if(!e)return new Set;let t=JSON.parse(e);return Array.isArray(t)?new Set(t):new Set}catch{return new Set}}function Lo(e){try{localStorage.setItem(Ao,JSON.stringify(Array.from(e)))}catch{}}function bn(e){return xt().has(e)}function Nr(e){let t=xt();t.add(e),Lo(t)}function Br(e){let t=xt();t.delete(e),Lo(t)}function wn(){return xt()}var Ao,Ue=x(()=>{"use strict";Ao="md-viewer:pinned-files"});function Ir(e){let t=e.replace(/[.+^\${}()|[\\]\\\\]/g,"\\\\\$&");return t=t.replace(/\\*\\*/g,"\\xA7GLOBSTAR\\xA7"),t=t.replace(/\\*/g,"[^/]*"),t=t.replace(/\\?/g,"[^/]"),t=t.replace(/§GLOBSTAR§/g,".*"),e.endsWith("/")?new RegExp(\`(^|/)\${t}\`):new RegExp(\`(^|/)\${t}(/|\$)\`)}function Hr(e,t,n){if(!n.length)return!1;let o=e.startsWith(t+"/")?e.slice(t.length+1):e;return n.some(i=>Ir(i).test(o))}function \$o(e){if(e.type==="file")return[e];let t=[];for(let n of e.children||[])t.push(...\$o(n));return t}function jr(e,t,n,o){if(!t)return[];let i=Date.now()-n,r=t.ignorePatterns||[];return \$o(t).filter(s=>r.length&&Hr(s.path,e,r)?!1:!!(o.has(s.path)||typeof s.lastModified=="number"&&s.lastModified>=i)).sort((s,c)=>{let d=o.has(s.path),u=o.has(c.path);return d!==u?d?-1:1:(c.lastModified||0)-(s.lastModified||0)})}function Wr(e){let t=Date.now()-e,n=Math.floor(t/6e4);if(n<60)return\`\${n}m\`;let o=Math.floor(t/36e5);return o<24?\`\${o}h\`:\`\${Math.floor(t/864e5)}d\`}function Pr(e,t){if(!t)return b(e);let n=e.toLowerCase().indexOf(t.toLowerCase());return n===-1?b(e):b(e.slice(0,n))+\`<mark class="search-highlight">\${b(e.slice(n,n+t.length))}</mark>\`+b(e.slice(n+t.length))}function Dr(e,t,n){let o=l.currentFile===e.path,i=t.has(e.path),r=l.sessionFiles.get(e.path),a=r?_(r).type:"normal",s=ge(e.path),c=Je(e.name)||e.name,d=e.lastModified?Wr(e.lastModified):"",u=a==="modified"?'<span class="focus-file-dot modified"></span>':a==="new"?'<span class="focus-file-dot new-file"></span>':"",m=i?\`<button class="tree-pin-btn active" title="\\u53D6\\u6D88\\u56FA\\u5B9A" onclick="event.stopPropagation();handleUnpinFile('\${w(e.path)}')" data-path="\${w(e.path)}">\\u{1F4CC}</button>\`:\`<button class="tree-pin-btn" title="\\u56FA\\u5B9A\\u5230\\u7126\\u70B9\\u89C6\\u56FE" onclick="event.stopPropagation();handlePinFile('\${w(e.path)}')">\\u{1F4CC}</button>\`;return\`
    <div class="tree-item file-node focus-file-item\${o?" current":""}"
         data-path="\${w(e.path)}"
         onclick="handleFocusFileClick('\${w(e.path)}')">
      <span class="tree-indent" style="width:8px"></span>
      <span class="file-type-icon \${s.cls}">\${b(s.label)}</span>
      <span class="tree-name"><span class="tree-name-full">\${Pr(c,n)}</span></span>
      \${u}
      \${d?\`<span class="focus-file-time">\${b(d)}</span>\`:""}
      \${m}
    </div>
  \`}function Rr(){let e=l.config.focusWindowKey||"8h";return\`
    <div class="focus-filter-bar">
      <span class="focus-filter-label">\\u6700\\u8FD1</span>
      <div class="focus-time-pills">\${[{key:"8h",label:"8h"},{key:"2d",label:"2d"},{key:"1w",label:"1w"},{key:"1m",label:"1m"}].map(o=>\`<button class="focus-time-pill\${e===o.key?" active":""}"
             onclick="setFocusWindowKey('\${o.key}')">\${o.label}</button>\`).join("")}</div>
    </div>
  \`}function Or(e,t,n,o,i){let r=t.length>0,a=o?'<span class="focus-ws-badge empty">\\u2026</span>':r?\`<span class="focus-ws-badge">\${t.length}</span>\`:'<span class="focus-ws-badge empty">0</span>',s=r?t.map(c=>Dr(c,n,i)).join(""):"";return\`
    <div class="focus-ws-group\${r?" has-files":""}">
      <div class="focus-ws-header" onclick="handleFocusWorkspaceToggle('\${w(e.id)}')">
        <span class="focus-ws-arrow\${r?" open":""}">\\u25B6</span>
        <span class="focus-ws-name">\${b(e.name)}</span>
        \${a}
      </div>
      \${r?\`<div class="focus-ws-files">\${s}</div>\`:""}
    </div>
  \`}function Co(){let e=l.config.workspaces;if(e.length===0)return'<div class="focus-empty">\\u6682\\u65E0\\u5DE5\\u4F5C\\u533A</div>';let t=Fo[l.config.focusWindowKey||"8h"]??Fo["8h"],n=wn(),o=l.searchQuery.trim().toLowerCase(),i=e.map(r=>{let a=l.fileTree.get(r.id),s=!a;!a&&!kn.has(r.id)&&(kn.add(r.id),q(r.id).then(d=>{kn.delete(r.id),d&&Promise.resolve().then(()=>(L(),F)).then(({renderSidebar:u})=>u())}));let c=jr(r.path,a,t,n);return o&&(c=c.filter(d=>(Je(d.name)||d.name).toLowerCase().includes(o)||d.path.toLowerCase().includes(o))),Or(r,c,n,s,o)}).join("");return\`<div class="focus-view">\${Rr()}\${i}</div>\`}var kn,Fo,No=x(()=>{"use strict";N();fe();kt();Ke();yn();Ue();qe();kn=new Set,Fo={"8h":8*3600*1e3,"2d":2*86400*1e3,"1w":7*86400*1e3,"1m":30*86400*1e3}});function Et(e,t){let n=[],o=-1,i=0,r=null,a=document.createElement("div");a.className="path-autocomplete-panel",a.style.display="none",document.body.appendChild(a);let s=()=>a.style.display!=="none",c=()=>{i+=1,r!==null&&(window.clearTimeout(r),r=null),a.style.display="none",n=[],o=-1},d=()=>{let y=e.getBoundingClientRect();a.style.left=\`\${Math.round(y.left+window.scrollX)}px\`,a.style.top=\`\${Math.round(y.bottom+window.scrollY+4)}px\`,a.style.width=\`\${Math.round(y.width)}px\`},u=()=>{if(n.length===0){c();return}a.innerHTML=n.map((y,h)=>{let v=h===o?"path-autocomplete-item active":"path-autocomplete-item",E=y.type==="directory"?"\\u{1F4C1}":"\\u{1F4C4}";return\`
          <div class="\${v}" data-index="\${h}">
            <span class="path-autocomplete-icon">\${E}</span>
            <span class="path-autocomplete-text">\${qr(y.display)}</span>
          </div>
        \`}).join(""),d(),a.style.display="block"},m=y=>{let h=n[y];if(!h)return;let v=h.type==="directory",E=v&&!h.path.endsWith("/")?\`\${h.path}/\`:h.path;e.value=E,e.dispatchEvent(new Event("input",{bubbles:!0})),e.focus(),e.setSelectionRange(e.value.length,e.value.length),c(),v&&g()},p=async()=>{let y=e.value.trim();if(!y){c();return}if(document.body.classList.contains("quick-action-confirm-visible")){c();return}if(t.shouldActivate&&!t.shouldActivate(y)){c();return}let h=++i;try{let v=await pn(y,{kind:t.kind,markdownOnly:t.markdownOnly});if(h!==i)return;n=v.suggestions||[],o=n.length>0?0:-1,u()}catch{c()}},g=()=>{r!==null&&window.clearTimeout(r),r=window.setTimeout(p,100)};a.addEventListener("mousedown",y=>{y.preventDefault();let h=y.target.closest(".path-autocomplete-item");if(!h)return;let v=Number(h.dataset.index);Number.isNaN(v)||m(v)}),e.addEventListener("focus",g),e.addEventListener("input",g),e.addEventListener("path-autocomplete-hide",c),e.addEventListener("keydown",y=>{let h=y.key;if(s()){if(h==="ArrowDown"){y.preventDefault(),n.length>0&&(o=(o+1)%n.length,u());return}if(h==="ArrowUp"){y.preventDefault(),n.length>0&&(o=(o-1+n.length)%n.length,u());return}if(h==="Tab"){o>=0&&(y.preventDefault(),m(o));return}if(h==="Enter"){if(y.metaKey||y.ctrlKey)return;if(y.preventDefault(),o>=0){m(o);return}c();return}h==="Escape"&&(y.preventDefault(),c())}}),e.addEventListener("blur",()=>{window.setTimeout(c,120)}),window.addEventListener("resize",()=>{s()&&d()}),window.addEventListener("scroll",()=>{s()&&d()},!0)}function qr(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}var xn=x(()=>{"use strict";me()});function zr(e){let t=e.split("/").filter(Boolean);return t[t.length-1]||"workspace"}function jo(e){let t=Je(e)||e;return\`<span class="tree-name-full">\${b(t)}</span>\`}function Wo(e,t){if(e){if(e.type==="file"){t.add(e.path);return}(e.children||[]).forEach(n=>Wo(n,t))}}function Po(e){if(e.type==="file")return 1;let t=0;for(let n of e.children||[])t+=Po(n);return e.fileCount=t,t}function _r(e,t){let n=e.path.replace(/\\/+\$/,""),o={name:e.name,path:n,type:"directory",isExpanded:!0,children:[]},i=new Map([[n,o]]),r=Array.from(new Set(t)).sort((a,s)=>a.localeCompare(s,"zh-CN"));for(let a of r){if(!a.startsWith(\`\${n}/\`))continue;let c=a.slice(n.length+1).split("/").filter(Boolean);if(c.length===0)continue;let d=n,u=o;for(let m=0;m<c.length;m+=1){let p=c[m],g=m===c.length-1;if(d=\`\${d}/\${p}\`,g)(u.children||[]).some(h=>h.path===d)||u.children.push({name:p,path:d,type:"file"});else{let y=i.get(d);y||(y={name:p,path:d,type:"directory",isExpanded:!0,children:[]},i.set(d,y),u.children.push(y)),u=y}}}return Po(o),o}function Kr(e,t){if(!t)return l.fileTree.get(e.id);let n=e.path.replace(/\\/+\$/,""),o=\`\${n}/\`,i=Array.from(Ne).filter(r=>r===n||r.startsWith(o));if(i.length!==0)return _r(e,i)}function Jr(){return l.config.workspaces.map(e=>e.path.trim()).filter(Boolean)}function Io(){Y="",be="",Z=!1,Ce=!1,Ne=new Set}async function Ur(e,t,n,o){try{let r=await ze(e,{roots:t,limit:200});if(o!==Tt)return;Y=e,be=n,Ne=new Set((r.files||[]).map(a=>a.path).filter(Boolean)),Z=!1,Ce=!0}catch(r){if(o!==Tt)return;console.error("\\u5DE5\\u4F5C\\u533A\\u641C\\u7D22\\u5931\\u8D25:",r),Y=e,be=n,Ne=new Set,Z=!1,Ce=!0}let{renderSidebar:i}=await Promise.resolve().then(()=>(L(),F));i()}function Vr(e){let t=e.trim();if(!t){Io();return}if(t.startsWith("/")||t.startsWith("~/")||t.startsWith("~\\\\")){Io();return}let n=Jr(),o=n.join(\`
\`);if(n.length===0){Y=t,be=o,Ne=new Set,Z=!1,Ce=!0;return}Ce&&!Z&&Y===t&&be===o||Z&&Y===t&&be===o||(Tt+=1,Y=t,be=o,Z=!0,Ce=!1,Ne=new Set,Ur(t,n,o,Tt))}function Do(){let e=document.getElementById(Qe),t=document.getElementById(Ho);if(!t)return;let n=e?.value.trim()||"";t.textContent=n||"\\u8DEF\\u5F84\\u9884\\u89C8\\uFF1A\\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u540E\\u8FD9\\u91CC\\u4F1A\\u663E\\u793A\\u5B8C\\u6574\\u8DEF\\u5F84"}function Gr(){let e=document.getElementById(En);if(e)return e;let t=document.createElement("div");t.id=En,t.className="sync-dialog-overlay add-workspace-overlay",t.innerHTML=\`
    <div class="sync-dialog add-workspace-dialog">
      <div class="sync-dialog-header">
        <div class="sync-dialog-title">\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A</div>
        <button class="sync-dialog-close" onclick="closeAddWorkspaceDialog()">\\xD7</button>
      </div>
      <div class="sync-dialog-body">
        <div class="sync-dialog-field">
          <label class="sync-dialog-label">\\u{1F4C1} \\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84</label>
          <textarea
            id="\${Qe}"
            class="sync-dialog-input workspace-path-input"
            rows="3"
            placeholder="/Users/huanghao/workspace/md-viewer"
          ></textarea>
          <div class="workspace-path-hint">\\u652F\\u6301\\u7C98\\u8D34\\u957F\\u8DEF\\u5F84\\u3002\\u6309 Ctrl/Cmd + Enter \\u5FEB\\u901F\\u786E\\u8BA4\\u3002</div>
          <div id="\${Ho}" class="workspace-path-preview">\\u8DEF\\u5F84\\u9884\\u89C8\\uFF1A\\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u540E\\u8FD9\\u91CC\\u4F1A\\u663E\\u793A\\u5B8C\\u6574\\u8DEF\\u5F84</div>
        </div>
      </div>
      <div class="sync-dialog-footer add-workspace-footer">
        <button class="sync-dialog-btn" onclick="closeAddWorkspaceDialog()">\\u53D6\\u6D88</button>
        <button class="sync-dialog-btn sync-dialog-btn-primary" onclick="confirmAddWorkspaceDialog()">\\u6DFB\\u52A0</button>
      </div>
    </div>
  \`,document.body.appendChild(t),t.addEventListener("click",o=>{o.target===t&&St()});let n=t.querySelector(\`#\${Qe}\`);return n&&(Et(n,{kind:"directory",markdownOnly:!1}),n.addEventListener("input",Do),n.addEventListener("keydown",o=>{(o.metaKey||o.ctrlKey)&&o.key==="Enter"&&(o.preventDefault(),window.confirmAddWorkspaceDialog()),o.key==="Escape"&&(o.preventDefault(),St())})),t}function Qr(){Gr().classList.add("show");let t=document.getElementById(Qe);t&&(t.value="",Do(),t.focus())}function St(){let e=document.getElementById(En);e&&e.classList.remove("show")}async function Xr(){try{let e=document.getElementById(Qe),t=e?.value.trim()||"";if(!t){ko("\\u8BF7\\u8F93\\u5165\\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84"),e?.focus();return}let n=zr(t),{addWorkspace:o}=await Promise.resolve().then(()=>(qe(),wo)),i=o(n,t),{renderSidebar:r}=await Promise.resolve().then(()=>(L(),F));r(),St(),z(\`\\u5DF2\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A: \${i.name}\`,2e3)}catch(e){console.error("\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25:",e),M(\`\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A\\u5931\\u8D25: \${e?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)}}function Ro(){if(l.config.sidebarTab==="focus")return Co();let e=l.searchQuery.trim().toLowerCase();return Vr(e),\`\${Yr(e)}\`}function Yr(e){let t=l.config.workspaces,n=t.map((o,i)=>ea(o,i,t.length,e)).filter(Boolean).join("");return\`
    <div class="workspace-section">
      \${t.length===0?Zr():""}
      \${t.length>0&&!n?'<div class="empty-workspace"><p>\\u672A\\u627E\\u5230\\u5339\\u914D\\u5185\\u5BB9</p></div>':""}
      \${n}
    </div>
  \`}function Zr(){return\`
    <div class="empty-workspace">
      <p>\\u6682\\u65E0\\u5DE5\\u4F5C\\u533A</p>
      <p style="font-size: 12px; color: #57606a; margin-top: 8px;">
        \\u5728\\u4E0A\\u65B9\\u8F93\\u5165\\u76EE\\u5F55\\u8DEF\\u5F84\\u540E\\u56DE\\u8F66\\u6DFB\\u52A0
      </p>
    </div>
  \`}function ea(e,t,n,o){let i=l.currentWorkspace===e.id,r=o?Kr(e,o):l.fileTree.get(e.id),a=o?!0:e.isExpanded,s=a?"\\u25BC":"\\u25B6",c=t>0,d=t<n-1,u=!o||e.name.toLowerCase().includes(o)||e.path.toLowerCase().includes(o),m=!!r&&!!r.children&&r.children.length>0,p=a?na(e.id,e.path,r,o):"";return o&&!u&&!m&&!!!p?"":\`
    <div class="workspace-item">
      <div class="workspace-header \${i?"active":""}" onclick="handleWorkspaceToggle('\${w(e.id)}')">
        <span class="workspace-toggle">\${s}</span>
        <span class="workspace-icon">\\u{1F4C1}</span>
        <span class="workspace-name">\${b(e.name)}</span>
        \${Ve===e.id?\`
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
      \${a?ta(e.id,r,o):""}
      \${p}
    </div>
  \`}function ta(e,t,n){return n&&Z&&Y===n?\`
      <div class="file-tree loading">
        <div class="tree-loading">\\u641C\\u7D22\\u4E2D...</div>
      </div>
    \`:Ge.has(e)?\`
      <div class="file-tree loading">
        <div class="tree-loading">\\u52A0\\u8F7D\\u4E2D...</div>
      </div>
    \`:\$e.has(e)?\`
      <div class="file-tree empty">
        <div class="tree-empty" onclick="retryWorkspaceScan('\${w(e)}')" style="cursor: pointer;">\\u52A0\\u8F7D\\u5931\\u8D25\\uFF0C\\u70B9\\u51FB\\u91CD\\u8BD5</div>
      </div>
    \`:t?!t.children||t.children.length===0?\`
      <div class="file-tree empty">
        <div class="tree-empty">\${n?"\\u672A\\u627E\\u5230\\u5339\\u914D\\u6587\\u4EF6":"\\u6B64\\u76EE\\u5F55\\u4E0B\\u6CA1\\u6709 Markdown/HTML \\u6587\\u4EF6"}</div>
      </div>
    \`:\`
    <div class="file-tree">
      \${t.children.map(o=>Oo(e,o,1)).join("")}
    </div>
  \`:\`
      <div class="file-tree empty">
        <div class="tree-empty">\${n?"\\u672A\\u627E\\u5230\\u5339\\u914D\\u6587\\u4EF6":"\\u76EE\\u5F55\\u6682\\u4E0D\\u53EF\\u7528"}</div>
      </div>
    \`}function Oo(e,t,n){let o=4+n*8,i=l.currentFile===t.path;if(t.type==="file"){let c=Ee(t.path),d=U(t.path),u=!!c?.isMissing||Rt(t.path),m=ge(t.path),p=Jt(t.path),g="&nbsp;";if(c){let E=_(c,d);E.badge==="dot"?g='<span class="new-dot"></span>':E.badge&&(g=\`<span class="status-badge status-\${E.type}" style="color: \${E.color}">\${E.badge}</span>\`)}else u?g='<span class="status-badge status-deleted" style="color: #cf222e">D</span>':p?g='<span class="status-badge status-modified" style="color: #ff9500">M</span>':d&&(g='<span class="new-dot"></span>');let y=["tree-item","file-node",u?"missing":"",i?"current":""].filter(Boolean).join(" "),h=bn(t.path),v=\`<button
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
          <span class="tree-name" title="\${w(t.name)}">\${jo(t.name)}</span>
          \${v}
        </div>
      </div>
    \`}let r=t.isExpanded!==!1,a=r?"\\u25BC":"\\u25B6",s=t.children&&t.children.length>0;return\`
    <div class="tree-node">
      <div class="tree-item directory-node">
        <span class="tree-indent" style="width: \${o}px"></span>
        <span class="tree-toggle" onclick="\${s?\`event.stopPropagation();handleNodeClick('\${w(e)}', '\${w(t.path)}')\`:""}">\${s?a:""}</span>
        <span class="tree-name" onclick="\${s?\`event.stopPropagation();handleNodeClick('\${w(e)}', '\${w(t.path)}')\`:""}">\${b(t.name)}</span>
        \${t.fileCount?\`<span class="tree-count">\${t.fileCount}</span>\`:""}
      </div>
      \${r&&s?\`
        <div class="file-tree">
          \${t.children.map(c=>Oo(e,c,n+1)).join("")}
        </div>
      \`:""}
    </div>
  \`}function na(e,t,n,o){let i=new Set;Wo(n,i);let r=\`\${t}/\`,a=Xt().filter(u=>!u.isMissing||!u.path.startsWith(r)||i.has(u.path)?!1:o?u.name.toLowerCase().includes(o)||u.path.toLowerCase().includes(o):!0),s=new Set(a.map(u=>u.path)),c=Ot(t).filter(u=>!s.has(u)).filter(u=>!i.has(u)).filter(u=>{if(!o)return!0;let m=u.toLowerCase(),p=(u.split("/").pop()||"").toLowerCase();return m.includes(o)||p.includes(o)});return a.length===0&&c.length===0?"":\`
    <div class="tree-missing-section">
      <div class="tree-missing-title">\\u5DF2\\u5220\\u9664</div>
      \${[...a.map(u=>({path:u.path,name:u.path.split("/").pop()||u.name,isCurrent:l.currentFile===u.path,hasRetry:!0,hasClose:!0})),...c.map(u=>({path:u,name:u.split("/").pop()||u,isCurrent:l.currentFile===u,hasRetry:!1,hasClose:!1}))].map(u=>{let m=ge(u.path);return\`
          <div class="tree-item file-node missing \${u.isCurrent?"current":""}" onclick="handleFileClick('\${w(u.path)}')">
            <span class="tree-indent" style="width: 12px"></span>
            <span class="tree-toggle"></span>
            <span class="file-type-icon \${m.cls}">\${b(m.label)}</span>
            <span class="tree-status-inline"><span class="status-badge status-deleted">D</span></span>
            <span class="tree-name" title="\${w(u.name)}">\${jo(u.name)}</span>
            \${u.hasRetry?\`<button class="tree-inline-action" title="\\u91CD\\u8BD5\\u52A0\\u8F7D" onclick="event.stopPropagation(); handleRetryMissingFile('\${w(u.path)}')">\\u21BB</button>\`:""}
            \${u.hasClose?\`<button class="tree-inline-action danger" title="\\u5173\\u95ED\\u6587\\u4EF6" onclick="event.stopPropagation(); handleCloseFile('\${w(u.path)}')">\\xD7</button>\`:""}
          </div>
        \`}).join("")}
    </div>
  \`}function qo(){Bo||(Bo=!0,document.addEventListener("click",async e=>{if(!Ve)return;let t=e.target;if(!t||t.closest(".workspace-remove-actions")||t.closest(".workspace-remove"))return;Ve=null;let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n()})),window.handleWorkspaceToggle=async e=>{let t=l.config.workspaces.find(o=>o.id===e);if(!t)return;if(l.currentWorkspace=e,l.searchQuery.trim()){let{renderSidebar:o}=await Promise.resolve().then(()=>(L(),F));o();return}if(rn(e),t.isExpanded&&!l.fileTree.has(e)){Ge.add(e),\$e.delete(e);let{renderSidebar:o}=await Promise.resolve().then(()=>(L(),F));o();let i=await q(e);Ge.delete(e),i?\$e.delete(e):(\$e.add(e),M(\`\\u5DE5\\u4F5C\\u533A\\u626B\\u63CF\\u5931\\u8D25\\uFF1A\${t.name}\`))}let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n()},window.retryWorkspaceScan=async e=>{Ge.add(e),\$e.delete(e);let{renderSidebar:t}=await Promise.resolve().then(()=>(L(),F));t();let n=await q(e);Ge.delete(e),n||(\$e.add(e),M("\\u91CD\\u8BD5\\u5931\\u8D25\\uFF0C\\u8BF7\\u68C0\\u67E5\\u5DE5\\u4F5C\\u533A\\u8DEF\\u5F84\\u662F\\u5426\\u53EF\\u8BBF\\u95EE")),t()},window.handleAskRemoveWorkspace=async e=>{Ve=e;let{renderSidebar:t}=await Promise.resolve().then(()=>(L(),F));t()},window.handleConfirmRemoveWorkspace=async e=>{let t=l.config.workspaces.find(o=>o.id===e);if(!t)return;on(e),Ve=null;let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n(),z(\`\\u5DF2\\u79FB\\u9664\\u5DE5\\u4F5C\\u533A: \${t.name}\`,2e3)},window.handleNodeClick=async(e,t)=>{ln(e,t);let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n()},window.handleFileClick=async e=>{ut(e),W(e);let{switchToFile:t}=await Promise.resolve().then(()=>(N(),V)),{loadFile:n}=await Promise.resolve().then(()=>(me(),bt));if(ft(e))t(e);else{let i=await n(e,!0);if(!i){let{markFileMissing:a}=await Promise.resolve().then(()=>(N(),V));a(e,!0),(await Promise.resolve().then(()=>(ye(),he))).renderAll(),M("\\u6587\\u4EF6\\u5DF2\\u5220\\u9664\\uFF0C\\u5DF2\\u6807\\u8BB0\\u4E3A D\\uFF08\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\uFF09");return}let{addOrUpdateFile:r}=await Promise.resolve().then(()=>(N(),V));r(i,!0)}(await Promise.resolve().then(()=>(ye(),he))).renderAll()},window.handleCloseFile=async e=>{let{removeFile:t}=await Promise.resolve().then(()=>(N(),V));t(e),(await Promise.resolve().then(()=>(ye(),he))).renderAll()},window.handleRetryMissingFile=async e=>{let{loadFile:t}=await Promise.resolve().then(()=>(me(),bt)),{addOrUpdateFile:n}=await Promise.resolve().then(()=>(N(),V)),o=await t(e);if(!o)return;n(o,l.currentFile===e),(await Promise.resolve().then(()=>(ye(),he))).renderAll(),z("\\u6587\\u4EF6\\u5DF2\\u91CD\\u65B0\\u52A0\\u8F7D",2e3)},window.showAddWorkspaceDialog=Qr,window.closeAddWorkspaceDialog=St,window.confirmAddWorkspaceDialog=Xr,window.handleMoveWorkspaceUp=async e=>{yt(e,-1);let{renderSidebar:t}=await Promise.resolve().then(()=>(L(),F));t()},window.handleMoveWorkspaceDown=async e=>{yt(e,1);let{renderSidebar:t}=await Promise.resolve().then(()=>(L(),F));t()},window.handleFocusFileClick=async e=>{ut(e),W(e);let{switchToFile:t}=await Promise.resolve().then(()=>(N(),V)),{loadFile:n}=await Promise.resolve().then(()=>(me(),bt));if(ft(e))t(e);else{let i=await n(e,!0);if(!i){let{markFileMissing:a}=await Promise.resolve().then(()=>(N(),V));a(e,!0),(await Promise.resolve().then(()=>(ye(),he))).renderAll(),M("\\u6587\\u4EF6\\u5DF2\\u5220\\u9664\\uFF0C\\u5DF2\\u6807\\u8BB0\\u4E3A D\\uFF08\\u65E0\\u672C\\u5730\\u7F13\\u5B58\\uFF09");return}let{addOrUpdateFile:r}=await Promise.resolve().then(()=>(N(),V));r(i,!0)}(await Promise.resolve().then(()=>(ye(),he))).renderAll()},window.handleUnpinFile=async e=>{let{unpinFile:t}=await Promise.resolve().then(()=>(Ue(),vn));t(e);let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n()},window.handlePinFile=async e=>{let{pinFile:t}=await Promise.resolve().then(()=>(Ue(),vn));t(e);let{renderSidebar:n}=await Promise.resolve().then(()=>(L(),F));n()},window.handleFocusWorkspaceToggle=e=>{},window.setFocusWindowKey=e=>{l.config.focusWindowKey=e,Promise.resolve().then(()=>(xe(),Zn)).then(({saveConfig:t})=>t(l.config)),Promise.resolve().then(()=>(L(),F)).then(({renderSidebar:t})=>t())}}var En,Qe,Ho,Ve,Bo,Ge,\$e,Y,be,Z,Ce,Ne,Tt,zo=x(()=>{"use strict";N();No();pe();me();fe();kt();Ke();yn();Ae();xn();qe();pe();Ue();En="addWorkspaceDialogOverlay",Qe="addWorkspacePathInput",Ho="addWorkspacePathPreview",Ve=null,Bo=!1,Ge=new Set,\$e=new Set,Y="",be="",Z=!1,Ce=!1,Ne=new Set,Tt=0});function _o(e){let t=[0];for(let n of e){let o=n.nodeValue?.length??0;t.push(t[t.length-1]+o)}return{nodes:e,cumulative:t,totalLength:t[t.length-1]}}function Ko(e,t){if(e.nodes.length===0)return null;if(t>=e.totalLength){let i=e.nodes[e.nodes.length-1];return{node:i,offset:i.nodeValue?.length??0}}let n=0,o=e.nodes.length-1;for(;n<o;){let i=n+o+1>>1;e.cumulative[i]<=t?n=i:o=i-1}return{node:e.nodes[n],offset:t-e.cumulative[n]}}function Jo(e){let t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),n=[],o;for(;o=t.nextNode();)o.nodeValue&&o.nodeValue.length>0&&n.push(o);return n}var Uo=x(()=>{"use strict"});async function Xe(e){let t=await e.json().catch(()=>null);if(!e.ok)throw new Error(t?.error||\`HTTP \${e.status}\`);return t}async function Vo(e){let t=await fetch(\`/api/annotations?path=\${encodeURIComponent(e)}\`),n=await Xe(t);return Array.isArray(n?.annotations)?n.annotations:[]}async function Go(e,t){let n=await fetch("/api/annotations/item",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,annotation:t})}),o=await Xe(n);if(o?.success!==!0||!o?.annotation)throw new Error(o?.error||"\\u4FDD\\u5B58\\u8BC4\\u8BBA\\u5931\\u8D25");return o.annotation}async function Qo(e,t,n,o){let i=await fetch("/api/annotations/reply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,...t,text:n,author:o})}),r=await Xe(i);if(r?.success!==!0||!r?.annotation)throw new Error(r?.error||"\\u56DE\\u590D\\u8BC4\\u8BBA\\u5931\\u8D25");return r.annotation}async function Xo(e,t){let n=await fetch("/api/annotations/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,...t})}),o=await Xe(n);if(o?.success!==!0)throw new Error(o?.error||"\\u5220\\u9664\\u8BC4\\u8BBA\\u5931\\u8D25")}async function Yo(e,t,n){let o=await fetch("/api/annotations/status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e,...t,status:n})}),i=await Xe(o);if(i?.success!==!0||!i?.annotation)throw new Error(i?.error||"\\u66F4\\u65B0\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25");return i.annotation}var Zo=x(()=>{"use strict"});function oa(e,t){if(!t)return[];let n=[],o=e.indexOf(t);for(;o>=0;)n.push(o),o=e.indexOf(t,o+1);return n}function ia(e,t,n,o){let i=0,r=Math.max(0,o.start||0),a=Math.abs(n-r);if(i+=Math.max(0,1e3-Math.min(1e3,a)),o.quotePrefix&&e.slice(Math.max(0,n-o.quotePrefix.length),n)===o.quotePrefix&&(i+=500),o.quoteSuffix){let s=n+t.length;e.slice(s,s+o.quoteSuffix.length)===o.quoteSuffix&&(i+=500)}return i}function ei(e,t){if(!e||!t.quote||t.length<=0)return{start:t.start||0,length:Math.max(1,t.length||t.quote?.length||1),confidence:0,status:"unanchored"};let n=Math.max(0,t.start||0),o=n+Math.max(1,t.length||t.quote.length);if(o<=e.length&&e.slice(n,o)===t.quote)return{start:n,length:t.length,confidence:1,status:"anchored"};let i=oa(e,t.quote);if(i.length===0)return{start:n,length:Math.max(1,t.length||t.quote.length),confidence:0,status:"unanchored"};if(i.length===1)return{start:i[0],length:t.quote.length,confidence:.8,status:"anchored"};let r=i[0],a=Number.NEGATIVE_INFINITY;for(let s of i){let c=ia(e,t.quote,s,t);c>a&&(a=c,r=s)}return{start:r,length:t.quote.length,confidence:.6,status:"anchored"}}var ti=x(()=>{"use strict"});function sa(){try{return typeof localStorage>"u"?"default":localStorage.getItem("md-viewer:annotation-density")==="simple"?"simple":"default"}catch{return"default"}}function la(e){return e.reduce((n,o)=>typeof o.serial!="number"||!Number.isFinite(o.serial)?n:Math.max(n,o.serial),0)+1}function ca(e){let t=Number.isFinite(e.createdAt)?e.createdAt:Date.now(),o=(Array.isArray(e.thread)?e.thread:[]).map((i,r)=>{if(!i||typeof i!="object")return null;let a=String(i.note||"").trim();if(!a)return null;let c=String(i.type||(r===0?"comment":"reply"))==="reply"?"reply":"comment",d=Number(i.createdAt),u=Number.isFinite(d)?Math.floor(d):t+r;return{id:String(i.id||"").trim()||\`\${c}-\${u}-\${Math.random().toString(16).slice(2,8)}\`,type:c,note:a,createdAt:u}}).filter(i=>!!i).sort((i,r)=>i.createdAt-r.createdAt);if(o.length===0){let i=String(e.note||"").trim();return i?[{id:\`c-\${e.id||t}\`,type:"comment",note:i,createdAt:t}]:[]}o[0].type="comment";for(let i=1;i<o.length;i+=1)o[i].type="reply";return o}function ui(e){let t=ca(e),n=JSON.stringify(e.thread||[]),o=JSON.stringify(t);return e.thread=t,e.note=t[0]?.note||e.note||"",n!==o}function da(e){let t=!1;for(let n of e)ui(n)&&(t=!0);return t}function ua(e){let t=!1,n=e.map((i,r)=>({ann:i,index:r}));n.sort((i,r)=>{let a=Number.isFinite(i.ann.createdAt)?i.ann.createdAt:0,s=Number.isFinite(r.ann.createdAt)?r.ann.createdAt:0;return a!==s?a-s:i.index-r.index});let o=1;for(let{ann:i}of n){if(typeof i.serial=="number"&&Number.isFinite(i.serial)&&i.serial>0){o=Math.max(o,i.serial+1);continue}i.serial=o,o+=1,t=!0}return t}function pi(e){let t=f.annotations.findIndex(n=>n.id===e.id);if(t>=0){f.annotations[t]=e;return}f.annotations.push(e)}function Tn(e,t,n="\\u8BC4\\u8BBA\\u4FDD\\u5B58\\u5931\\u8D25"){Go(e,t).then(o=>{f.currentFilePath===e&&(pi(o),\$(e),B())}).catch(o=>{M(\`\${n}: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)})}function mi(e,t,n="\\u8BC4\\u8BBA\\u4FDD\\u5B58\\u5931\\u8D25"){for(let o of t)Tn(e,o,n)}function fi(e){if(f.currentFilePath=e,e?(f.annotations=[],pa(e)):f.annotations=[],f.pinnedAnnotationId=null,f.activeAnnotationId=null,f.pendingAnnotation=null,f.pendingAnnotationFilePath=null,Ye(),Ie(!0),oe(!0),e){let n=yi()[e]===!0;Be(!n)}else Be(!0)}async function pa(e){try{let t=await Vo(e);if(!Array.isArray(t)||f.currentFilePath!==e)return;f.annotations=t;let n=da(f.annotations),o=ua(f.annotations);(n||o)&&mi(e,f.annotations),\$(e),B()}catch(t){if(f.currentFilePath!==e)return;M(\`\\u8BC4\\u8BBA\\u52A0\\u8F7D\\u5931\\u8D25: \${t?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)}}function T(){return{sidebar:document.getElementById("annotationSidebar"),sidebarResizer:document.getElementById("annotationSidebarResizer"),reader:document.getElementById("reader"),content:document.getElementById("content"),composer:document.getElementById("annotationComposer"),composerHeader:document.getElementById("annotationComposerHeader"),composerNote:document.getElementById("composerNote"),quickAdd:document.getElementById("annotationQuickAdd"),popover:document.getElementById("annotationPopover"),popoverTitle:document.getElementById("popoverTitle"),popoverNote:document.getElementById("popoverNote"),popoverResolveBtn:document.getElementById("popoverResolveBtn"),popoverPrevBtn:document.getElementById("popoverPrevBtn"),popoverNextBtn:document.getElementById("popoverNextBtn"),annotationList:document.getElementById("annotationList"),annotationCount:document.getElementById("annotationCount"),filterMenu:document.getElementById("annotationFilterMenu"),filterToggle:document.getElementById("annotationFilterToggle"),densityToggle:document.getElementById("annotationDensityToggle"),closeToggle:document.getElementById("annotationSidebarClose"),floatingOpenBtn:document.getElementById("annotationFloatingOpenBtn")}}function Sn(e){let t=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),n=[],o;for(;o=t.nextNode();)o.nodeValue&&o.nodeValue.length>0&&n.push(o);return n}function ni(e,t,n){let o=Sn(e),i=0;for(let r of o){if(r===t)return i+n;i+=r.nodeValue?.length||0}return-1}function Mt(e,t,n){if(n)return Ko(n,t);let o=Sn(e),i=0;for(let a of o){let s=a.nodeValue?.length||0,c=i+s;if(t<=c)return{node:a,offset:Math.max(0,t-i)};i=c}if(o.length===0)return null;let r=o[o.length-1];return{node:r,offset:r.nodeValue?.length||0}}function At(e,t,n){return Math.max(t,Math.min(n,e))}function Mn(e,t,n){let r=At(t,8,window.innerWidth-360-8),a=At(n,8,window.innerHeight-220-8);e.style.left=\`\${r}px\`,e.style.top=\`\${a}px\`}function gi(e){return Sn(e).map(t=>t.nodeValue||"").join("")}function te(e){return e.status==="resolved"}function An(e){return e.status==="unanchored"?"orphan":(e.confidence||0)>=.95?"exact":"reanchored"}function ma(e,t){let n=e.status==="unanchored"||An(e)==="orphan";return t==="all"?!0:t==="open"?!te(e)&&!n:t==="resolved"?te(e)&&!n:t==="orphan"?n:!0}function hi(){return f.currentFilePath}function j(){let e=f.currentFilePath,t=document.getElementById("content")?.getAttribute("data-current-file")||null;return e?t?t===e?e:null:e:null}function Lt(e,t){if(!e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return!1;let n=e.key.toLowerCase(),{value:o,selectionStart:i,selectionEnd:r}=t;if(i===null||r===null)return!1;let a=d=>{t.selectionStart=d,t.selectionEnd=d},s=d=>{let u=o.lastIndexOf(\`
\`,d-1);return u===-1?0:u+1},c=d=>{let u=o.indexOf(\`
\`,d);return u===-1?o.length:u};switch(n){case"a":return a(s(i)),!0;case"e":return a(c(i)),!0;case"b":return a(Math.max(0,i-1)),!0;case"f":return a(Math.min(o.length,i+1)),!0;case"n":{let d=c(i);return a(d===o.length?d:Math.min(o.length,d+1+(i-s(i)))),!0}case"p":{let d=s(i);if(d===0)return a(0),!0;let u=s(d-1),m=d-1-u;return a(u+Math.min(i-d,m)),!0}case"d":return i<o.length&&(t.value=o.slice(0,i)+o.slice(i+1),a(i),t.dispatchEvent(new Event("input"))),!0;case"k":{let d=c(i),u=i===d&&d<o.length?d+1:d;return t.value=o.slice(0,i)+o.slice(u),a(i),t.dispatchEvent(new Event("input")),!0}case"u":{let d=s(i);return t.value=o.slice(0,d)+o.slice(i),a(d),t.dispatchEvent(new Event("input")),!0}case"w":{let d=i;for(;d>0&&/\\s/.test(o[d-1]);)d--;for(;d>0&&!/\\s/.test(o[d-1]);)d--;return t.value=o.slice(0,d)+o.slice(i),a(d),t.dispatchEvent(new Event("input")),!0}case"h":return i>0&&(t.value=o.slice(0,i-1)+o.slice(i),a(i-1),t.dispatchEvent(new Event("input"))),!0;default:return!1}}function ee(e){return e==="up"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4l4 4H4z"/></svg>':e==="down"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12l-4-4h8z"/></svg>':e==="check"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.4 11.2L3.5 8.3l1.1-1.1 1.8 1.8 5-5 1.1 1.1z"/></svg>':e==="trash"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2h4l1 1h3v1H2V3h3l1-1zm-1 4h1v7H5V6zm3 0h1v7H8V6zm3 0h1v7h-1V6z"/></svg>':e==="comment"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h12v9H8l-3 3v-3H2z"/></svg>':e==="list"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h10v1H3zm0 4h10v1H3zm0 4h10v1H3z"/></svg>':e==="filter"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12L9.5 8v4.5l-3-1.5V8z"/></svg>':e==="edit"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.5 2.5a1.5 1.5 0 012.1 2.1L5 13.2l-3 .8.8-3 8.7-8.5z"/></svg>':e==="reopen"?'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 1.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zM6 5.5l4 2.5-4 2.5V5.5z"/></svg>':'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 4.2L8 8l3.8-3.8 1 1L9 9l3.8 3.8-1 1L8 10l-3.8 3.8-1-1L7 9 3.2 5.2z"/></svg>'}function Ct(){return[...f.annotations].filter(e=>ma(e,f.filter)).sort((e,t)=>e.start-t.start)}function fa(){let e=T();if(e.filterMenu?.querySelectorAll(".annotation-filter-item[data-filter]").forEach(t=>{let n=t;n.classList.toggle("is-active",n.getAttribute("data-filter")===f.filter)}),e.densityToggle&&(e.densityToggle.classList.toggle("is-simple",f.density==="simple"),e.densityToggle.title=f.density==="simple"?"\\u5207\\u6362\\u5230\\u9ED8\\u8BA4\\u5217\\u8868":"\\u5207\\u6362\\u5230\\u6781\\u7B80\\u5217\\u8868"),e.filterToggle){let t={all:"\\u7B5B\\u9009\\uFF1A\\u5168\\u90E8",open:"\\u7B5B\\u9009\\uFF1A\\u672A\\u89E3\\u51B3",resolved:"\\u7B5B\\u9009\\uFF1A\\u5DF2\\u89E3\\u51B3",orphan:"\\u7B5B\\u9009\\uFF1A\\u5B9A\\u4F4D\\u5931\\u8D25"};e.filterToggle.title=t[f.filter]}}function ga(){let e=T();e.annotationCount&&(e.annotationCount.textContent=String(Ct().length))}function Be(e){let t=T();t.sidebar&&(t.sidebar.classList.toggle("collapsed",e),document.body.classList.toggle("annotation-sidebar-collapsed",e),e&&(t.filterMenu?.classList.add("hidden"),Ie(!0),oe(!0)))}function yi(){try{let e=localStorage.getItem(di);if(!e)return{};let t=JSON.parse(e);return t&&typeof t=="object"?t:{}}catch{return{}}}function ha(e){localStorage.setItem(di,JSON.stringify(e))}function bi(e){if(!f.currentFilePath)return;let t=yi();t[f.currentFilePath]=e,ha(t)}function ya(e){return Math.max(ra,Math.min(aa,Math.round(e)))}function wi(e){let t=ya(e);document.documentElement.style.setProperty("--annotation-sidebar-width",\`\${t}px\`),localStorage.setItem(li,String(t))}function ba(){let e=Number(localStorage.getItem(li)),t=Number.isFinite(e)&&e>0?e:ci;wi(t)}function ne(){let e=T();if(!e.sidebar)return;let t=document.getElementById("tabs"),n=Math.max(0,Math.round(t?.getBoundingClientRect().bottom||84)),o=Math.max(0,window.innerHeight-n);e.sidebar.style.top=\`\${n}px\`,e.sidebar.style.height=\`\${o}px\`,e.sidebarResizer&&(e.sidebarResizer.style.top=\`\${n}px\`,e.sidebarResizer.style.height=\`\${o}px\`),e.floatingOpenBtn&&(e.floatingOpenBtn.style.top=\`\${n+6}px\`)}function oi(){Be(!1),bi(!0),ne(),\$n()}function ii(){Be(!0),bi(!1)}function wa(){let e=T().sidebar;e&&Be(!e.classList.contains("collapsed"))}function vi(){let e=T();return e.filterMenu&&!e.filterMenu.classList.contains("hidden")?(e.filterMenu.classList.add("hidden"),!0):e.quickAdd&&!e.quickAdd.classList.contains("hidden")?(Ie(!0),!0):e.composer&&!e.composer.classList.contains("hidden")?(Ye(),!0):e.popover&&!e.popover.classList.contains("hidden")?(f.pinnedAnnotationId=null,oe(!0),!0):!1}function va(e,t){return e==="resolved"?"resolved":t}function ka(e,t,n){let o=T();if(!o.quickAdd)return;o.composer&&!o.composer.classList.contains("hidden")&&Ye(),f.pendingAnnotation={...n,note:"",createdAt:Date.now()},f.pendingAnnotationFilePath=o.content?.getAttribute("data-current-file")||f.currentFilePath;let i=30,r=30,a=At(e,8,window.innerWidth-i-8),s=At(t,8,window.innerHeight-r-8);o.quickAdd.style.left=\`\${a}px\`,o.quickAdd.style.top=\`\${s}px\`,o.quickAdd.classList.remove("hidden")}function Ie(e=!1){let t=T();t.quickAdd&&(t.quickAdd.classList.add("hidden"),e&&(Ln(),f.pendingAnnotation=null,f.pendingAnnotationFilePath=null))}function xa(e,t){let n=T();if(!f.pendingAnnotation||!n.composer||!n.composerNote)return;Sa(),n.composerNote.value="",Ei(n.composerNote);let o=typeof e=="number"?e:n.quickAdd?Number.parseFloat(n.quickAdd.style.left||"0"):0,i=typeof t=="number"?t:n.quickAdd?Number.parseFloat(n.quickAdd.style.top||"0"):0;Mn(n.composer,o,i+34),n.composer.classList.remove("hidden"),Ie(!1),n.composerNote.focus()}function Ea(){let e=T();e.composer&&e.composer.classList.add("hidden")}function Ta(){let e=T();if(!e.composer||!f.pendingAnnotation)return;let n=document.getElementById("reader")?.querySelector(".annotation-mark-temp");if(n){let o=n.getBoundingClientRect();Mn(e.composer,o.right+6,o.top-8)}e.composer.classList.remove("hidden"),e.composerNote?.focus()}function Ye(){let e=T();e.composer&&(Ln(),f.pendingAnnotation=null,f.pendingAnnotationFilePath=null,e.composerNote&&(e.composerNote.value=""),e.composer.classList.add("hidden"))}function Ln(){let e=document.getElementById("reader");if(!e)return;let t=Array.from(e.querySelectorAll(".annotation-mark-temp"));for(let n of t){let o=n.parentNode;for(;n.firstChild;)o?.insertBefore(n.firstChild,n);o?.removeChild(n)}}function Sa(){let e=T();if(!e.reader||!f.pendingAnnotation)return;Ln();let t=f.pendingAnnotation,n=Mt(e.reader,t.start),o=Mt(e.reader,t.start+t.length);if(!(!n||!o)&&!(n.node===o.node&&n.offset===o.offset)){if(n.node===o.node){let i=document.createRange();i.setStart(n.node,n.offset),i.setEnd(o.node,o.offset);let r=document.createElement("span");r.className="annotation-mark-temp";try{i.surroundContents(r)}catch{}return}try{let i=[],r=document.createTreeWalker(e.reader,NodeFilter.SHOW_TEXT,null,!1),a;for(;a=r.nextNode();){let s=document.createRange();s.selectNode(a);let c=document.createRange();c.setStart(n.node,n.offset),c.setEnd(o.node,o.offset);let d=c.compareBoundaryPoints(Range.END_TO_START,s),u=c.compareBoundaryPoints(Range.START_TO_END,s);if(d>0||u<0)continue;let m=a===n.node?n.offset:0,p=a===o.node?o.offset:a.nodeValue?.length||0;m<p&&i.push({node:a,start:m,end:p})}for(let s=i.length-1;s>=0;s--){let{node:c,start:d,end:u}=i[s],m=document.createRange();m.setStart(c,d),m.setEnd(c,u);let p=document.createElement("span");p.className="annotation-mark-temp",m.surroundContents(p)}}catch{}}}function Fn(e){return ui(e),e.thread||[]}function ki(e,t=!1){let n=Fn(e),o=n[0],i=n.slice(1);return t?\`
      <div class="annotation-note simple">\${b(o?.note||e.note||"\\uFF08\\u65E0\\u8BC4\\u8BBA\\u5185\\u5BB9\\uFF09")}</div>
      \${i.length>0?\`<div class="annotation-reply-count">\\u56DE\\u590D \${i.length}</div>\`:""}
    \`:n.map(a=>\`
      <div class="annotation-thread-line \${a.type==="reply"?"is-reply":""}" data-thread-item-id="\${a.id}" data-annotation-id="\${e.id}">
        <span class="annotation-thread-text">\${b(a.note)}</span>
        <button class="annotation-thread-edit-btn" data-edit-thread-item="\${a.id}" data-annotation-id="\${e.id}" title="\\u7F16\\u8F91">\${ee("edit")}</button>
      </div>\`).join("")||'<div class="annotation-thread-line">\\uFF08\\u65E0\\u8BC4\\u8BBA\\u5185\\u5BB9\\uFF09</div>'}function xi(e,t,n){let o=f.annotations.find(s=>s.id===e);if(!o)return;let i=n.trim();if(!i)return;let r=Fn(o),a=Date.now();r.push({id:\`r-\${a}-\${Math.random().toString(16).slice(2,8)}\`,type:"reply",note:i,createdAt:a}),o.thread=r,o.note=r[0]?.note||o.note,Qo(t,{id:e},i,"me").then(s=>{f.currentFilePath===t&&(pi(s),\$(t),B())}).catch(s=>{M(\`\\u56DE\\u590D\\u8BC4\\u8BBA\\u5931\\u8D25: \${s?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)})}function Ft(e,t,n){let o=document.querySelector(\`.annotation-thread-line[data-thread-item-id="\${t}"][data-annotation-id="\${e}"]\`);if(!o)return;let i=f.annotations.find(p=>p.id===e);if(!i)return;let r=Fn(i),a=r.find(p=>p.id===t);if(!a)return;let s=o.innerHTML;o.classList.add("is-editing"),o.innerHTML=\`<textarea class="annotation-thread-edit-input">\${b(a.note)}</textarea>\`;let c=o.querySelector("textarea");c.style.height=\`\${Math.max(c.scrollHeight,34)}px\`,c.focus(),c.setSelectionRange(c.value.length,c.value.length);let d=!1,u=()=>{d||(d=!0,o.classList.remove("is-editing"),o.innerHTML=s,o.querySelector("[data-edit-thread-item]")?.addEventListener("click",p=>{p.stopPropagation(),Ft(e,t,n)}))},m=()=>{if(d)return;d=!0;let p=c.value.trim();if(!p||p===a.note){o.classList.remove("is-editing"),o.innerHTML=s,o.querySelector("[data-edit-thread-item]")?.addEventListener("click",g=>{g.stopPropagation(),Ft(e,t,n)});return}if(a.note=p,r[0]?.id===t&&(i.note=p),i.thread=r,Tn(n,i,"\\u7F16\\u8F91\\u8BC4\\u8BBA\\u5931\\u8D25"),\$(n),f.pinnedAnnotationId===e){let y=document.querySelector(\`[data-annotation-id="\${e}"]\`)?.getBoundingClientRect();Ze(i,y?y.right+8:120,y?y.top+8:120)}};c.addEventListener("keydown",p=>{if(Lt(p,c)){p.preventDefault();return}p.key==="Escape"?(p.preventDefault(),u()):p.key==="Enter"&&!p.shiftKey&&(p.preventDefault(),m())}),c.addEventListener("input",()=>{c.style.height="auto",c.style.height=\`\${Math.min(200,Math.max(c.scrollHeight,34))}px\`}),c.addEventListener("blur",p=>{let g=p.relatedTarget,y=o.closest(".annotation-item");g&&y&&y.contains(g)||setTimeout(()=>{d||u()},150)})}function we(e){e.style.height="auto";let t=160,n=Math.min(t,Math.max(e.scrollHeight,34));e.style.height=\`\${n}px\`,e.style.overflowY=e.scrollHeight>t?"auto":"hidden"}function Ei(e){e.style.height="auto";let t=200,n=Math.min(t,Math.max(e.scrollHeight,34));e.style.height=\`\${n}px\`,e.style.overflowY=e.scrollHeight>t?"auto":"hidden"}function Ze(e,t,n){let o=T();if(!o.popover||!o.popoverTitle||!o.popoverNote)return;let i=e.quote.substring(0,22);o.popoverTitle.textContent=\`#\${e.serial||0} | \${i}\${e.quote.length>22?"...":""}\`;let r=ki(e,!1);if(o.popoverNote.innerHTML=\`
    <div class="annotation-thread">\${r}</div>
    <div class="annotation-reply-entry" data-popover-reply-entry="\${e.id}" role="button" tabindex="0">
      <textarea rows="1" data-popover-reply-input="\${e.id}" placeholder="\\u8F93\\u5165\\u56DE\\u590D\\u5185\\u5BB9\\uFF08Cmd+Enter \\u63D0\\u4EA4\\uFF09"></textarea>
    </div>
  \`,o.popoverResolveBtn){let a=te(e);o.popoverResolveBtn.title=a?"\\u91CD\\u65B0\\u6253\\u5F00":"\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3",o.popoverResolveBtn.setAttribute("aria-label",a?"\\u91CD\\u65B0\\u6253\\u5F00":"\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3"),o.popoverResolveBtn.innerHTML=ee(a?"reopen":"check"),o.popoverResolveBtn.classList.toggle("is-resolved",a)}o.popover.style.left=\`\${Math.round(t)}px\`,o.popover.style.top=\`\${Math.round(n)}px\`,o.popover.classList.remove("hidden")}function ri(){let e=f.pinnedAnnotationId;if(!e)return;let t=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(!t)return;let n=f.annotations.find(i=>i.id===e);if(!n)return;let o=t.getBoundingClientRect();Ze(n,o.right+8,o.top+8)}function oe(e=!1){let t=T();t.popover&&(!e&&f.pinnedAnnotationId||(t.popover.classList.add("hidden"),e&&(f.pinnedAnnotationId=null)))}function ai(e){let t=T();if(!f.pendingAnnotation||!t.composerNote)return;let n=f.pendingAnnotationFilePath;if(!n||n!==e)return;let o=t.composerNote.value.trim();if(!o)return;let i=Date.now(),r={...f.pendingAnnotation,serial:la(f.annotations),note:o,thread:[{id:\`c-\${i}-\${Math.random().toString(16).slice(2,8)}\`,type:"comment",note:o,createdAt:i}]};f.annotations.push(r),Tn(e,r,"\\u521B\\u5EFA\\u8BC4\\u8BBA\\u5931\\u8D25"),Ye(),B(),\$(e)}function Ti(e,t){let n=f.annotations.slice();f.annotations=f.annotations.filter(o=>o.id!==e),f.pinnedAnnotationId===e&&(f.pinnedAnnotationId=null,oe(!0)),f.activeAnnotationId===e&&(f.activeAnnotationId=null),B(),\$(t),Xo(t,{id:e}).catch(o=>{f.annotations=n,M(\`\\u5220\\u9664\\u8BC4\\u8BBA\\u5931\\u8D25: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600),B(),\$(t)})}function Ma(e){let t=T();if(!t.content)return;let n=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(n){let o=t.content.getBoundingClientRect(),i=n.getBoundingClientRect(),a=t.content.scrollTop+(i.top-o.top),c=Math.max(0,a-56);t.content.scrollTo({top:c,behavior:"smooth"})}}function Si(e,t){f.activeAnnotationId=e,B(),e&&(Ma(e),f.pinnedAnnotationId=e,requestAnimationFrame(()=>{let n=f.annotations.find(r=>r.id===e),o=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(!n||!o)return;let i=o.getBoundingClientRect();Ze(n,i.right+8,i.top+8)})),\$(t)}function \$t(e,t,n){let o=Ct(),i=o.findIndex(a=>a.id===e);if(i<0)return;let r=o[i+t];r&&Si(r.id,n)}function Aa(e){let t=document.getElementById("content"),n=document.querySelector(\`[data-annotation-id="\${e}"]\`);if(!t||!n)return null;let o=t.getBoundingClientRect(),i=n.getBoundingClientRect();return t.scrollTop+(i.top-o.top)}function \$n(){if(f.density!=="default")return;let e=document.getElementById("content"),t=document.getElementById("annotationList");!e||!t||(t.scrollTop=e.scrollTop)}function Mi(e,t){let n=f.annotations.find(r=>r.id===e);if(!n)return;let o=n.status;n.status==="resolved"?n.status=(n.confidence||0)<=0?"unanchored":"anchored":n.status="resolved";let i=n.status||"anchored";oe(!0),B(),\$(t),Yo(t,{id:e},i).catch(r=>{n.status=o,M(\`\\u66F4\\u65B0\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25: \${r?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600),B(),\$(t)})}function si(e,t){e.classList.add("annotation-mark"),e.dataset.annotationId=t.id,e.classList.add(\`status-\${An(t)}\`),te(t)&&e.classList.add("is-resolved")}function La(e,t){let n=T();if(!n.reader||typeof e.start!="number"||typeof e.length!="number"||e.length<=0)return;let o=Mt(n.reader,e.start,t),i=Mt(n.reader,e.start+e.length,t);if(!(!o||!i)&&!(o.node===i.node&&o.offset===i.offset)){if(o.node===i.node){let r=document.createRange();r.setStart(o.node,o.offset),r.setEnd(i.node,i.offset);let a=document.createElement("span");si(a,e);try{r.surroundContents(a)}catch{}return}try{let r=[],a=document.createTreeWalker(n.reader,NodeFilter.SHOW_TEXT,null,!1),s;for(;s=a.nextNode();){let c=document.createRange();c.selectNode(s);let d=document.createRange();d.setStart(o.node,o.offset),d.setEnd(i.node,i.offset);let u=d.compareBoundaryPoints(Range.END_TO_START,c),m=d.compareBoundaryPoints(Range.START_TO_END,c);if(u>0||m<0)continue;let p=s===o.node?o.offset:0,g=s===i.node?i.offset:s.nodeValue?.length||0;p<g&&r.push({node:s,start:p,end:g})}for(let c=r.length-1;c>=0;c--){let{node:d,start:u,end:m}=r[c],p=document.createRange();p.setStart(d,u),p.setEnd(d,m);let g=document.createElement("span");si(g,e),p.surroundContents(g)}}catch{}}}function Fa(){let e=T();e.reader&&e.reader.querySelectorAll(".annotation-mark").forEach(t=>{let n=t.getAttribute("data-annotation-id"),o=f.annotations.find(i=>i.id===n);o&&(t.classList.toggle("is-active",!!n&&n===f.activeAnnotationId),t.addEventListener("click",i=>{if(i.stopPropagation(),f.pinnedAnnotationId===n){f.pinnedAnnotationId=null,oe(!0);return}f.activeAnnotationId=n,f.pinnedAnnotationId=n;let r=t.getBoundingClientRect();Ze(o,r.right+8,r.top+8);let a=j();\$(a||null)}))})}function \$a(){let e=T();if(!e.reader)return;let t=Array.from(e.reader.querySelectorAll(".annotation-mark"));for(let n of t){let o=n.parentNode;for(;n.firstChild;)o?.insertBefore(n.firstChild,n);o?.removeChild(n)}}function B(){let e=T();\$a();let t=e.reader?_o(Jo(e.reader)):void 0;if(e.reader){let o=t?t.nodes.map(a=>a.nodeValue||"").join(""):gi(e.reader),i=!1,r=[];for(let a of f.annotations){let s=ei(o,a),c=!1,d=s.status;a.start!==s.start&&(a.start=s.start,i=!0,c=!0),a.length!==s.length&&(a.length=s.length,i=!0,c=!0);let u=va(a.status,d);(a.status||"anchored")!==u&&(a.status=u,i=!0,c=!0),a.confidence!==s.confidence&&(a.confidence=s.confidence,i=!0,c=!0),c&&r.push({...a,thread:a.thread?[...a.thread]:a.thread})}if(i){let a=j();a&&mi(a,r,"\\u540C\\u6B65\\u8BC4\\u8BBA\\u951A\\u70B9\\u5931\\u8D25")}}let n=[...Ct()].sort((o,i)=>i.start-o.start);for(let o of n)La(o,t);Fa()}function Ca(e,t){let n=e.querySelector(".annotation-canvas");if(!n)return;let o=Array.from(n.querySelectorAll(".annotation-item.positioned"));if(o.length===0)return;let i=o.map(u=>u.offsetHeight),r=6,a=0,s=[];for(let u=0;u<o.length;u++){let m=Number(o[u].getAttribute("data-anchor-top")||"0"),p=Number.isFinite(m)?Math.max(0,m):0,g=Math.max(p,a>0?a+r:p);s.push(g),a=g+i[u]}for(let u=0;u<o.length;u++)o[u].style.top=\`\${Math.round(s[u])}px\`;let c=Math.max(0,t),d=Math.ceil(a+24);n.style.height=\`\${Math.max(c,d)}px\`}function \$(e){let t=T();if(!t.annotationList)return;ga(),fa();let n=new Map;if(t.annotationList.querySelectorAll("[data-reply-input]").forEach(r=>{let a=r.getAttribute("data-reply-input");a&&r.value.trim()&&n.set(a,r.value)}),!e||f.annotations.length===0){t.annotationList.innerHTML='<div class="annotation-empty">\\u65E0\\u8BC4\\u8BBA\\uFF08\\u9009\\u4E2D\\u6587\\u672C\\u5373\\u53EF\\u6DFB\\u52A0\\uFF09</div>';return}let o=Ct();if(o.length===0){t.annotationList.innerHTML='<div class="annotation-empty">\\u5F53\\u524D\\u7B5B\\u9009\\u4E0B\\u65E0\\u8BC4\\u8BBA</div>';return}let i=(r,a,s=!1,c=0)=>\`
    <div class="annotation-item \${f.activeAnnotationId===r.id?"is-active":""} status-\${An(r)}\${te(r)?" is-resolved":""}\${s?" positioned":""}" data-annotation-id="\${r.id}"\${s?\` data-anchor-top="\${Math.max(0,Math.round(c))}" style="top:\${Math.max(0,Math.round(c))}px"\`:""}>
      <div class="annotation-row-top">
        <div class="annotation-row-title">#\${r.serial||a+1} | \${b(r.quote.substring(0,28))}\${r.quote.length>28?"...":""}</div>
        <div class="annotation-row-actions">
          <button class="annotation-icon-action" data-action="prev" data-id="\${r.id}" title="\\u4E0A\\u4E00\\u6761">\${ee("up")}</button>
          <button class="annotation-icon-action" data-action="next" data-id="\${r.id}" title="\\u4E0B\\u4E00\\u6761">\${ee("down")}</button>
          <button class="annotation-icon-action resolve\${te(r)?" is-resolved":""}" data-action="resolve" data-id="\${r.id}" title="\${te(r)?"\\u91CD\\u65B0\\u6253\\u5F00":"\\u6807\\u8BB0\\u5DF2\\u89E3\\u51B3"}">\${te(r)?ee("reopen"):ee("check")}</button>
          <button class="annotation-icon-action danger" data-action="delete" data-id="\${r.id}" title="\\u5220\\u9664">\${ee("trash")}</button>
        </div>
      </div>
      <div class="annotation-thread">\${ki(r,f.density==="simple")}</div>
      \${f.density==="simple"?"":\`
        <div class="annotation-reply-entry" data-reply-entry="\${r.id}" role="button" tabindex="0">
          <textarea rows="1" data-reply-input="\${r.id}" placeholder="\\u8F93\\u5165\\u56DE\\u590D\\u5185\\u5BB9\\uFF08Cmd+Enter \\u63D0\\u4EA4\\uFF09"></textarea>
        </div>
      \`}
    </div>
  \`;if(f.density==="default"){let r=o.map(u=>Aa(u.id)),a=0,s=o.map((u,m)=>{let p=r[m]??m*88;return a=Math.max(a,p),i(u,m,!0,p)}).join(""),c=document.getElementById("content"),d=Math.max(c?.scrollHeight||0,a+180);t.annotationList.classList.add("default-mode"),t.annotationList.innerHTML=\`<div class="annotation-canvas" style="height:\${d}px">\${s}</div>\`,Ca(t.annotationList,c?.scrollHeight||0),\$n()}else t.annotationList.classList.remove("default-mode"),t.annotationList.innerHTML=o.map((r,a)=>i(r,a)).join("");t.annotationList.querySelectorAll(".annotation-icon-action").forEach(r=>{r.addEventListener("click",a=>{a.stopPropagation();let s=a.currentTarget,c=s.getAttribute("data-action"),d=s.getAttribute("data-id");!d||!e||(c==="prev"?\$t(d,-1,e):c==="next"?\$t(d,1,e):c==="resolve"?Mi(d,e):c==="delete"&&Ti(d,e))})}),t.annotationList.querySelectorAll("[data-edit-thread-item]").forEach(r=>{r.addEventListener("click",a=>{a.stopPropagation();let s=r.getAttribute("data-edit-thread-item"),c=r.getAttribute("data-annotation-id");!s||!c||!e||Ft(c,s,e)})}),t.annotationList.querySelectorAll("[data-reply-entry]").forEach(r=>{r.addEventListener("click",a=>{a.stopPropagation();let s=r.getAttribute("data-reply-entry");if(!s)return;let c=t.annotationList?.querySelector(\`[data-reply-input="\${s}"]\`);c&&(we(c),c.focus())}),r.addEventListener("keydown",a=>{if(a.target instanceof HTMLTextAreaElement||a.key!=="Enter"&&a.key!==" ")return;a.preventDefault(),a.stopPropagation();let c=r.getAttribute("data-reply-entry");if(!c)return;let d=t.annotationList?.querySelector(\`[data-reply-input="\${c}"]\`);d&&(we(d),d.focus())})}),n.size>0&&t.annotationList.querySelectorAll("[data-reply-input]").forEach(r=>{let a=r.getAttribute("data-reply-input");a&&n.has(a)&&(r.value=n.get(a))}),requestAnimationFrame(()=>{t.annotationList?.querySelectorAll("[data-reply-input]").forEach(r=>{we(r)})}),t.annotationList.querySelectorAll("[data-reply-input]").forEach(r=>{let a=r;a.addEventListener("input",()=>we(a)),a.addEventListener("click",s=>s.stopPropagation()),r.addEventListener("keydown",s=>{if(Lt(s,s.currentTarget)){s.preventDefault();return}if(s.key!=="Enter"||!(s.metaKey||s.ctrlKey))return;s.preventDefault();let c=s.currentTarget,d=c.getAttribute("data-reply-input");!d||!e||(xi(d,e,c.value),c.value="",\$(e))})}),t.annotationList.querySelectorAll(".annotation-item").forEach(r=>{r.addEventListener("click",()=>{let a=r.getAttribute("data-annotation-id");!a||!e||Si(a,e)})})}function Ai(e){let t=T(),n=t.content?.getAttribute("data-current-file");if(!e||!n||e!==n||!t.reader)return;let o=window.getSelection();if(!o||o.rangeCount===0||o.isCollapsed)return;let i=o.getRangeAt(0);if(!t.reader.contains(i.commonAncestorContainer))return;let r=o.toString().trim();if(!r)return;let a=ni(t.reader,i.startContainer,i.startOffset),s=ni(t.reader,i.endContainer,i.endOffset);if(a<0||s<=a)return;let c=gi(t.reader),d=32,u=32,m=c.slice(Math.max(0,a-d),a),p=c.slice(s,Math.min(c.length,s+u)),g=i.getBoundingClientRect();ka(g.right+6,g.top-8,{id:\`ann-\${Date.now()}-\${Math.random().toString(16).slice(2,8)}\`,start:a,length:s-a,quote:r,quotePrefix:m,quoteSuffix:p,status:"anchored",confidence:1})}function Li(){ba(),Be(!0),document.getElementById("composerSaveBtn")?.addEventListener("click",()=>{let e=j();e&&ai(e)}),document.getElementById("composerCancelBtn")?.addEventListener("click",Ye),T().composerNote?.addEventListener("keydown",e=>{if(Lt(e,e.currentTarget)){e.preventDefault();return}if(e.key!=="Enter"||!(e.metaKey||e.ctrlKey))return;e.preventDefault();let t=j();t&&ai(t)}),T().composerNote?.addEventListener("input",e=>{let t=e.currentTarget;Ei(t)}),T().quickAdd?.addEventListener("click",e=>{e.stopPropagation(),xa()}),document.getElementById("popoverCloseBtn")?.addEventListener("click",()=>{f.pinnedAnnotationId=null,oe(!0)}),document.getElementById("popoverDeleteBtn")?.addEventListener("click",()=>{let e=j(),t=f.pinnedAnnotationId;t&&e&&Ti(t,e)}),document.getElementById("popoverResolveBtn")?.addEventListener("click",()=>{let e=j(),t=f.pinnedAnnotationId;t&&e&&Mi(t,e)}),document.getElementById("popoverPrevBtn")?.addEventListener("click",()=>{let e=j(),t=f.pinnedAnnotationId;t&&e&&\$t(t,-1,e)}),document.getElementById("popoverNextBtn")?.addEventListener("click",()=>{let e=j(),t=f.pinnedAnnotationId;t&&e&&\$t(t,1,e)}),document.getElementById("annotationPopover")?.addEventListener("click",e=>{let t=e.target,n=j();if(!n)return;let o=t.closest("[data-edit-thread-item]");if(o){e.stopPropagation();let a=o.getAttribute("data-edit-thread-item"),s=o.getAttribute("data-annotation-id");a&&s&&Ft(s,a,n);return}let i=t.closest("[data-popover-reply-entry]");if(i){e.stopPropagation();let a=i.getAttribute("data-popover-reply-entry");if(!a)return;let s=document.querySelector(\`[data-popover-reply-input="\${a}"]\`);if(!s)return;we(s),s.focus();return}t.closest("[data-popover-reply-input]")&&e.stopPropagation()}),document.getElementById("annotationPopover")?.addEventListener("keydown",e=>{let t=e.target;if(t instanceof HTMLTextAreaElement)return;let n=t.closest("[data-popover-reply-entry]");if(!n||e.key!=="Enter"&&e.key!==" ")return;e.preventDefault(),e.stopPropagation();let o=n.getAttribute("data-popover-reply-entry");if(!o)return;let i=document.querySelector(\`[data-popover-reply-input="\${o}"]\`);i&&(we(i),i.focus())}),document.getElementById("annotationPopover")?.addEventListener("keydown",e=>{let t=e.target;if(!(t instanceof HTMLTextAreaElement))return;if(Lt(e,t)){e.preventDefault();return}if(e.key!=="Enter"||!(e.metaKey||e.ctrlKey))return;let n=t.getAttribute("data-popover-reply-input"),o=j();if(!n||!o)return;e.preventDefault(),xi(n,o,t.value),t.value="";let i=f.annotations.find(s=>s.id===n),a=document.querySelector(\`[data-annotation-id="\${n}"]\`)?.getBoundingClientRect();i&&Ze(i,a?a.right+8:120,a?a.top+8:120),\$(o)}),document.getElementById("annotationPopover")?.addEventListener("input",e=>{let t=e.target;t instanceof HTMLTextAreaElement&&t.hasAttribute("data-popover-reply-input")&&we(t)}),T().filterMenu?.querySelectorAll(".annotation-filter-item[data-filter]").forEach(e=>{e.addEventListener("click",()=>{let t=e.getAttribute("data-filter");if(!t)return;f.filter=t,T().filterMenu?.classList.add("hidden");let n=j();B(),\$(n||null)})}),T().filterToggle?.addEventListener("click",e=>{e.stopPropagation();let t=T().filterMenu;t&&t.classList.toggle("hidden")}),T().densityToggle?.addEventListener("click",()=>{f.density=f.density==="default"?"simple":"default",localStorage.setItem("md-viewer:annotation-density",f.density);let e=j();\$(e||null)}),T().closeToggle?.addEventListener("click",()=>{ii()}),T().floatingOpenBtn?.addEventListener("click",()=>{oi()}),T().sidebarResizer?.addEventListener("mousedown",e=>{if(T().sidebar?.classList.contains("collapsed"))return;e.preventDefault();let t=document.documentElement,n=Number(getComputedStyle(t).getPropertyValue("--annotation-sidebar-width").replace("px",""))||ci,o=e.clientX;document.body.classList.add("annotation-sidebar-resizing");let i=a=>{let s=o-a.clientX;wi(n+s),ne()},r=()=>{document.body.classList.remove("annotation-sidebar-resizing"),window.removeEventListener("mousemove",i),window.removeEventListener("mouseup",r)};window.addEventListener("mousemove",i),window.addEventListener("mouseup",r)}),document.getElementById("content")?.addEventListener("scroll",()=>{Ie(!1),\$n(),ri()}),window.addEventListener("resize",()=>{ne(),ri()}),window.openAnnotationSidebar=oi,window.closeAnnotationSidebar=ii,window.toggleAnnotationSidebar=wa,document.addEventListener("mousedown",e=>{let t=e.target,n=T();if(t.closest(".annotation-mark-temp")){Ta();return}n.composer&&!n.composer.classList.contains("hidden")&&!n.composer.contains(t)&&!(n.quickAdd&&n.quickAdd.contains(t))&&Ea(),n.popover&&!n.popover.contains(t)&&!t.closest(".annotation-mark")&&(f.pinnedAnnotationId=null,oe(!0)),n.filterMenu&&!n.filterMenu.classList.contains("hidden")&&!n.filterMenu.contains(t)&&!t.closest("#annotationFilterToggle")&&n.filterMenu.classList.add("hidden"),n.quickAdd&&!n.quickAdd.classList.contains("hidden")&&!n.quickAdd.contains(t)&&!t.closest("#annotationComposer")&&Ie(!0)}),T().composerHeader?.addEventListener("mousedown",e=>{if(e.target.closest(".annotation-row-actions"))return;let t=T().composer;if(!t)return;let n=t.getBoundingClientRect(),o=e.clientX,i=e.clientY,r=n.left,a=n.top;e.preventDefault();let s=d=>{let u=r+(d.clientX-o),m=a+(d.clientY-i);Mn(t,u,m)},c=()=>{window.removeEventListener("mousemove",s),window.removeEventListener("mouseup",c)};window.addEventListener("mousemove",s),window.addEventListener("mouseup",c)})}var li,ci,ra,aa,f,di,Cn=x(()=>{"use strict";Uo();fe();Zo();Ae();ti();li="md-viewer:annotation-sidebar-width",ci=320,ra=260,aa=540;f={annotations:[],pendingAnnotation:null,pendingAnnotationFilePath:null,pinnedAnnotationId:null,activeAnnotationId:null,currentFilePath:null,filter:"open",density:sa()},di="md-viewer:annotation-panel-open-by-file"});var F={};le(F,{renderCurrentPath:()=>In,renderFiles:()=>Hn,renderSearchBox:()=>Hi,renderSidebar:()=>A,renderTabs:()=>ie,setSidebarTab:()=>Ii});function Bi(e){l.currentFile&&(Fi||requestAnimationFrame(()=>{let t=e.querySelector(".file-item.current, .tree-item.current");if(!t)return;let n=t.offsetTop-e.clientHeight*.4,o=Math.max(0,e.scrollHeight-e.clientHeight),i=Math.max(0,Math.min(n,o));e.scrollTo({top:i,behavior:"auto"}),Fi=!0}))}function Ii(e){l.config.sidebarTab=e,H(l.config),A()}function Na(e){if(!e)return;let t=He.indexOf(e);t>=0&&He.splice(t,1),He.unshift(e),He.length>300&&(He.length=300)}function Ni(e){let t=He.indexOf(e);return t>=0?t:Number.MAX_SAFE_INTEGER}function Ba(){P=!P,ie()}function Ia(){P&&(P=!1,ie())}function Ha(e){It=(e||"").trimStart(),P||(P=!0),ie()}function ja(e){et=e==="name"?"name":"recent",ie()}function Wa(){\$i||(\$i=!0,document.addEventListener("click",e=>{!P||e.target?.closest(".tab-manager-wrap")||Ia()}))}function Pa(){if(Ci)return;Ci=!0;let e=document.getElementById("tabs");e&&e.addEventListener("scroll",t=>{let n=t.target;n.classList.contains("tabs-scroll")?jt=n.scrollLeft:n.classList.contains("tab-manager-list")&&(Ht=n.scrollTop)},{passive:!0,capture:!0})}function Da(e){let t=vt(l.sessionFiles),n=Fe(e,t,l.currentFile,i=>{let r=t.find(s=>s.path===i);if(!r)return!1;let a=_(r,U(r.path));return a.type==="normal"||a.type==="new"}),o=window.removeFile;if(!o||n.length===0){ie();return}n.forEach(i=>o(i))}function Bn(){if(l.config.sidebarTab==="focus"||l.config.sidebarTab==="full"){A();return}Hn()}function Ra(e){let t=e.trim();return t?!!(/^https?:\\/\\//i.test(t)||t.startsWith("/")||t.startsWith("~/")||t.startsWith("./")||t.startsWith("../")||t.includes("/")||t.includes("\\\\")||/\\.[a-zA-Z0-9]{1,10}\$/.test(t)):!1}function Hi(){let e=document.getElementById("searchBox");if(!e)return;let t=e.querySelector("#searchInput"),n=e.querySelector("#searchClear"),o=l.config.sidebarTab,i=o==="list"?"\\u641C\\u7D22\\u5DF2\\u6253\\u5F00\\u7684\\u6587\\u4EF6":o==="focus"?"\\u641C\\u7D22\\u7126\\u70B9\\u6587\\u4EF6":"\\u641C\\u7D22\\u6216\\u8F93\\u5165\\u8DEF\\u5F84\\uFF08Enter\\u8865\\u5168\\uFF0CCmd/Ctrl+Enter\\u6DFB\\u52A0\\uFF09";if(!t||!n){if(e.innerHTML=\`
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
    \`,t=e.querySelector("#searchInput"),n=e.querySelector("#searchClear"),!t||!n)return;Et(t,{kind:"file",markdownOnly:!1,shouldActivate:Ra}),t.addEventListener("input",r=>{window.dismissQuickActionConfirm?.();let a=r.target.value;Nt=0,Bt="",X(a),n&&(n.style.display=a?"block":"none"),Bn(),l.currentFile&&(hn(l.currentFile)||_e(l.currentFile))&&window.renderContent?.()}),t.addEventListener("keydown",r=>{if(r.key==="Enter"&&(r.metaKey||r.ctrlKey)){r.preventDefault(),t.dispatchEvent(new Event("path-autocomplete-hide")),window.handleUnifiedInputSubmit?.(t.value);return}if(!r.defaultPrevented&&(r.key==="Enter"&&(r.preventDefault(),t.dispatchEvent(new Event("path-autocomplete-hide")),window.handleUnifiedInputSubmit?.(t.value)),r.key==="Escape")){window.dismissQuickActionConfirm?.();let a=Date.now(),s=t.value;if(a-Nt<900&&Bt===s&&s){X(""),t.value="",n&&(n.style.display="none"),Bn(),Nt=0,Bt="",r.preventDefault();return}Nt=a,Bt=s}}),n.addEventListener("click",()=>{X(""),t&&(t.value=""),n.style.display="none",Bn(),t?.focus()})}document.activeElement!==t&&t.value!==l.searchQuery&&(t.value=l.searchQuery),n.style.display=l.searchQuery?"block":"none",t.placeholder=i}function In(){let e=document.getElementById("currentPath");e&&(e.innerHTML="",e.style.display="none")}function Oa(){let e=document.getElementById("modeSwitchRow");if(!e)return;let t=l.config.sidebarTab,n=[{key:"focus",label:"\\u7126\\u70B9"},{key:"full",label:"\\u5168\\u91CF"},{key:"list",label:"\\u5217\\u8868"}];e.innerHTML=\`
    <div class="view-tabs">
      \${n.map(o=>\`
        <button class="view-tab\${t===o.key?" active":""}"
                onclick="setSidebarTab('\${o.key}')">\${o.label}</button>
      \`).join("")}
    </div>
  \`}function Hn(){let e=document.getElementById("fileList");if(!e)return;if(l.sessionFiles.size===0){e.innerHTML='<div class="empty-tip">\\u70B9\\u51FB\\u4E0A\\u65B9\\u6DFB\\u52A0 Markdown/HTML \\u6587\\u4EF6</div>';return}let t=nn();if(t.length===0){e.innerHTML='<div class="empty-tip">\\u672A\\u627E\\u5230\\u5339\\u914D\\u7684\\u6587\\u4EF6</div>';return}let n=new Map(t.map(i=>[i.path,i])),o=vt(n);e.innerHTML=o.map(i=>{let r=i.path===l.currentFile,a=i.isMissing||!1,s=ge(i.path),c=["file-item",r?"current":"",a?"deleted":""].filter(Boolean).join(" "),d=i.displayName||i.name,u=l.searchQuery.toLowerCase().trim();if(u){let g=d.toLowerCase().indexOf(u);if(g!==-1){let y=d.substring(0,g),h=d.substring(g,g+u.length),v=d.substring(g+u.length);d=\`\${y}<mark class="search-highlight">\${h}</mark>\${v}\`}}let m=_(i,U(i.path)),p="&nbsp;";return m.badge==="dot"?p='<span class="new-dot"></span>':m.badge&&(p=\`<span class="status-badge status-\${m.type}" style="color: \${m.color}">\${m.badge}</span>\`),\`
      <div class="\${c}"
           onclick="window.switchFile('\${w(i.path)}')">
        <span class="file-type-icon \${s.cls}">\${b(s.label)}</span>
        <span class="name">\${d}</span>
        <span class="file-item-status">\${p}</span>
        <span class="close" onclick="event.stopPropagation();window.removeFile('\${w(i.path)}')">\\xD7</span>
      </div>
    \`}).join(""),Bi(e)}function A(){let e=l.config.sidebarTab,t=document.querySelector(".sidebar");if(t&&t.classList.toggle("workspace-mode",e==="focus"||e==="full"),Hi(),Oa(),e==="list"){In(),Hn(),ie();return}if(In(),!t)return;let n=document.getElementById("fileList");n||(n=document.createElement("div"),n.id="fileList",n.className="file-list",t.appendChild(n)),n.innerHTML=Ro(),qo(),Bi(n),ie()}function ie(){let e=Array.from(l.sessionFiles.values()),t=document.getElementById("tabs");if(!t)return;Wa(),Pa();let n=t.querySelector(".tab-manager-list");n&&(Ht=n.scrollTop);let o=t.querySelector(".tabs-scroll");if(o&&(jt=o.scrollLeft),e.length===0){t.innerHTML="",t.style.display="none",P=!1,Nn="";return}let i=vt(l.sessionFiles),r=i.map(p=>{let g=_(p,U(p.path));return[p.path,p.displayName||p.name,p.isMissing?"1":"0",p.path===l.currentFile?"1":"0",g.type,g.badge||""].join("|")}).join("||"),a=[l.currentFile||"",P?"1":"0",et,It,r].join("###");if(a===Nn)return;Nn=a,Na(l.currentFile),t.style.display="flex";let s=i.map(p=>{let g=p.path===l.currentFile,y=p.isMissing||!1,h=["tab"];return g&&h.push("active"),y&&h.push("deleted"),\`
        <div class="\${h.join(" ")}"
             onclick="window.switchFile('\${w(p.path)}')">
          <span class="tab-name">\${b(p.displayName)}</span>
          <span class="tab-close" onclick="event.stopPropagation();window.removeFile('\${w(p.path)}')">\\xD7</span>
        </div>
      \`}).join(""),c=It.toLowerCase().trim(),d=i.filter(p=>{let g=p.displayName||p.name;return c?g.toLowerCase().includes(c)||p.path.toLowerCase().includes(c):!0}).sort((p,g)=>{let y=p.displayName||p.name,h=g.displayName||g.name;if(et==="name")return y.localeCompare(h,"zh-CN");let v=Ni(p.path)-Ni(g.path);return v!==0?v:y.localeCompare(h,"zh-CN")}),u=d.length===0?'<div class="tab-manager-empty">\\u6CA1\\u6709\\u5339\\u914D\\u7684\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6</div>':d.map(p=>{let g=p.displayName||p.name,y=p.path===l.currentFile,h=_(p,U(p.path)),v=h.badge?\`<span class="tab-manager-status status-\${h.type}">\${b(h.badge)}</span>\`:"";return\`
          <div class="tab-manager-item \${y?"active":""}" onclick="window.switchFile('\${w(p.path)}')">
            <span class="tab-manager-name" title="\${w(p.path)}">\${b(g)}</span>
            <span class="tab-manager-actions">
              \${v}
              <button class="tab-manager-close" type="button" title="\\u5173\\u95ED" onclick="event.stopPropagation();window.removeFile('\${w(p.path)}')">\\xD7</button>
            </span>
          </div>
        \`}).join(""),m={others:Fe("close-others",i,l.currentFile,()=>!1).length,right:Fe("close-right",i,l.currentFile,()=>!1).length,unmodified:Fe("close-unmodified",i,l.currentFile,p=>{let g=i.find(h=>h.path===p);if(!g)return!1;let y=_(g,U(g.path));return y.type==="normal"||y.type==="new"}).length,all:Fe("close-all",i,l.currentFile,()=>!1).length};t.innerHTML=\`
    <div class="tabs-scroll">\${s}</div>
    <div class="tab-manager-wrap">
      <button class="tab-manager-toggle \${P?"active":""}" type="button" onclick="event.stopPropagation();window.toggleTabManager()">\\u2261 Tabs (\${i.length})</button>
      <div class="tab-manager-panel \${P?"show":""}" onclick="event.stopPropagation()">
        <div class="tab-manager-row tab-manager-actions-row">
          <button class="tab-manager-action" type="button" data-action="close-others" onclick="window.applyTabBatchAction('close-others')">\\u5173\\u95ED\\u5176\\u4ED6 (\${m.others})</button>
          <button class="tab-manager-action" type="button" data-action="close-right" onclick="window.applyTabBatchAction('close-right')">\\u5173\\u95ED\\u53F3\\u4FA7 (\${m.right})</button>
          <button class="tab-manager-action" type="button" data-action="close-unmodified" onclick="window.applyTabBatchAction('close-unmodified')">\\u5173\\u95ED\\u672A\\u4FEE\\u6539 (\${m.unmodified})</button>
          <button class="tab-manager-action danger" type="button" data-action="close-all" onclick="window.applyTabBatchAction('close-all')">\\u5173\\u95ED\\u5168\\u90E8 (\${m.all})</button>
        </div>
        <div class="tab-manager-row">
          <input class="tab-manager-search" placeholder="\\u641C\\u7D22\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6" value="\${w(It)}" oninput="window.setTabManagerQuery(this.value)">
        </div>
        <div class="tab-manager-row">
          <button class="tab-manager-sort \${et==="recent"?"active":""}" type="button" onclick="window.setTabManagerSort('recent')">\\u6700\\u8FD1\\u4F7F\\u7528</button>
          <button class="tab-manager-sort \${et==="name"?"active":""}" type="button" onclick="window.setTabManagerSort('name')">\\u6309\\u540D\\u79F0</button>
        </div>
        <div class="tab-manager-list">\${u}</div>
      </div>
    </div>
  \`,requestAnimationFrame(()=>{let p=t.querySelector(".tab-manager-list");p&&Ht>0&&(p.scrollTop=Ht);let g=t.querySelector(".tabs-scroll");g&&jt>0&&(g.scrollLeft=jt),ne()})}var Nt,Bt,Fi,P,It,et,\$i,Ht,jt,Ci,Nn,He,L=x(()=>{"use strict";N();pe();xe();fe();So();kt();Ke();Mo();zo();Cn();xn();Nt=0,Bt="",Fi=!1,P=!1,It="",et="recent",\$i=!1,Ht=0,jt=0,Ci=!1,Nn="",He=[];typeof window<"u"&&(window.setSidebarTab=Ii,window.toggleTabManager=Ba,window.setTabManagerQuery=Ha,window.setTabManagerSort=ja,window.applyTabBatchAction=Da)});var ji,Wi,jn=x(()=>{"use strict";ji=\`/*light */
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

\`,Wi=\`pre code.hljs {
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
  
}\`});var Wn,Pi=x(()=>{"use strict";jn();Wn=ji});var Di,Ri=x(()=>{"use strict";Di=\`
.markdown-body {
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.75;
  color: #37352f;
  background-color: #fff;
  word-wrap: break-word;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
}
.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  font-weight: 700;
  letter-spacing: -0.3px;
  margin-top: 1.4em;
  margin-bottom: 0.5em;
  color: #37352f;
}
.markdown-body h1 { font-size: 1.875em; }
.markdown-body h2 { font-size: 1.5em; }
.markdown-body h3 { font-size: 1.25em; }
.markdown-body p { margin-top: 0; margin-bottom: 1em; color: #37352f; }
.markdown-body a { color: #0f6cbd; text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body strong { font-weight: 600; }
.markdown-body em { font-style: italic; }
.markdown-body code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.875em;
  background: rgba(135,131,120,0.15);
  border-radius: 3px;
  padding: 0.2em 0.4em;
  color: #eb5757;
}
.markdown-body pre {
  background: #f7f6f3;
  border-radius: 4px;
  padding: 1em;
  overflow: auto;
  margin: 1em 0;
}
.markdown-body pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: 0.875em;
}
.markdown-body blockquote {
  border-left: 3px solid #37352f;
  padding-left: 1em;
  margin: 1em 0;
  color: #6b6b6b;
}
.markdown-body ul, .markdown-body ol {
  padding-left: 1.5em;
  margin: 0.5em 0 1em;
}
.markdown-body li { margin: 0.25em 0; }
.markdown-body hr {
  border: none;
  border-top: 1px solid rgba(55,53,47,0.16);
  margin: 2em 0;
}
.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}
.markdown-body th, .markdown-body td {
  border: 1px solid rgba(55,53,47,0.2);
  padding: 0.5em 0.75em;
  text-align: left;
}
.markdown-body th { background: rgba(55,53,47,0.05); font-weight: 600; }
.markdown-body img { max-width: 100%; border-radius: 4px; }
\`});var Oi,qi=x(()=>{"use strict";Oi=\`
.markdown-body {
  font-family: "Georgia", "Times New Roman", "Palatino Linotype", serif;
  font-size: 17px;
  line-height: 1.8;
  color: #2c2c2c;
  background-color: #faf9f7;
  word-wrap: break-word;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
}
.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-weight: 700;
  margin-top: 1.6em;
  margin-bottom: 0.6em;
  color: #1a1a1a;
}
.markdown-body h1 { font-size: 1.8em; }
.markdown-body h2 { font-size: 1.4em; }
.markdown-body h3 { font-size: 1.2em; }
.markdown-body p { margin-top: 0; margin-bottom: 1.1em; }
.markdown-body a { color: #c7254e; text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body strong { font-weight: 700; }
.markdown-body em { font-style: italic; color: #444; }
.markdown-body code {
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 0.85em;
  background: #f0ede8;
  border-radius: 3px;
  padding: 0.2em 0.4em;
  color: #c7254e;
}
.markdown-body pre {
  background: #f0ede8;
  border-radius: 5px;
  padding: 1em;
  overflow: auto;
  margin: 1.2em 0;
}
.markdown-body pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: 0.875em;
}
.markdown-body blockquote {
  border-left: 3px solid #c9c4bc;
  padding-left: 1em;
  margin: 1em 0;
  color: #777;
  font-style: italic;
}
.markdown-body ul, .markdown-body ol {
  padding-left: 1.5em;
  margin: 0.5em 0 1em;
}
.markdown-body li { margin: 0.3em 0; }
.markdown-body hr {
  border: none;
  border-top: 1px solid #d4cfc8;
  margin: 2em 0;
}
.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.9em;
}
.markdown-body th, .markdown-body td {
  border: 1px solid #d4cfc8;
  padding: 0.5em 0.75em;
  text-align: left;
}
.markdown-body th { background: #f0ede8; font-weight: 600; }
.markdown-body img { max-width: 100%; }
\`});var Pn,zi=x(()=>{"use strict";jn();Pn=Wi});var _i,Ki=x(()=>{"use strict";_i=\`
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
\`});var Ji,Ui=x(()=>{"use strict";Ji=\`
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
\`});function Vi(e){return Dn.find(t=>t.key===e)?.css??Wn}function Gi(e){return Rn.find(t=>t.key===e)?.css??Pn}var Dn,Rn,On=x(()=>{"use strict";Pi();Ri();qi();zi();Ki();Ui();Dn=[{key:"github",label:"GitHub",css:Wn},{key:"notion",label:"Notion",css:Di},{key:"bear",label:"Bear / iA Writer",css:Oi}],Rn=[{key:"github",label:"GitHub Light",css:Pn},{key:"github-dark",label:"GitHub Dark",css:_i},{key:"atom-one-dark",label:"Atom One Dark",css:Ji}]});function Xi(){document.getElementById("settingsDialogOverlay")||qa(),za();let t=document.getElementById("settingsDialogOverlay");t&&t.classList.add("show")}function qa(){let e=document.createElement("div");e.id="settingsDialogOverlay",e.className="sync-dialog-overlay",e.innerHTML=\`
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
  \`,document.body.appendChild(e),e.addEventListener("click",t=>{t.target===e&&tt()})}function za(){let e=document.getElementById("settingsDialogBody");if(!e)return;let t=Ka();e.innerHTML=\`
    <div class="settings-section">
      <div class="settings-section-title">\\u4E3B\\u9898</div>
      <div class="settings-section-desc">\\u5207\\u6362 Markdown \\u6B63\\u6587\\u6837\\u5F0F\\u548C\\u4EE3\\u7801\\u9AD8\\u4EAE\\u914D\\u8272\\u3002</div>
      <div class="settings-kv-grid">
        <div>\\u6B63\\u6587\\u6837\\u5F0F</div>
        <div>
          <select id="markdownThemeSelect" style="font-size:12px;padding:2px 6px;border:1px solid #ddd;border-radius:3px">
            \${Dn.map(a=>\`<option value="\${a.key}"\${l.config.markdownTheme===a.key?" selected":""}>\${a.label}</option>\`).join("")}
          </select>
        </div>
        <div>\\u4EE3\\u7801\\u9AD8\\u4EAE</div>
        <div>
          <select id="codeThemeSelect" style="font-size:12px;padding:2px 6px;border:1px solid #ddd;border-radius:3px">
            \${Rn.map(a=>\`<option value="\${a.key}"\${l.config.codeTheme===a.key?" selected":""}>\${a.label}</option>\`).join("")}
          </select>
        </div>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">\\u5BA2\\u6237\\u7AEF\\u72B6\\u6001</div>
      <div class="settings-section-desc">\\u7528\\u4E8E\\u6392\\u67E5\\u672C\\u5730\\u7F13\\u5B58\\u662F\\u5426\\u810F\\u6570\\u636E\\uFF0C\\u53EF\\u76F4\\u63A5\\u6E05\\u7406\\u3002</div>
      <div class="settings-kv-grid">
        <div>\\u5F53\\u524D\\u6587\\u4EF6</div><div>\${Qi(t.currentFile||"\\u65E0")}</div>
        <div>\\u5DF2\\u6253\\u5F00\\u6587\\u4EF6\\u6570</div><div>\${t.openFilesCount}</div>
        <div>\\u5DE5\\u4F5C\\u533A\\u6570</div><div>\${t.workspaceCount}</div>
        <div>\\u8BC4\\u8BBA\\u76F8\\u5173\\u672C\\u5730\\u952E\\u6570</div><div>\${t.commentStateKeyCount}</div>
        <div>md-viewer \\u672C\\u5730\\u952E\\u6570</div><div>\${t.mdvKeyCount}</div>
        <div>localStorage \\u603B\\u952E\\u6570</div><div>\${t.localStorageKeyCount}</div>
      </div>
      <div class="settings-key-list">
        \${t.mdvKeys.map(a=>\`<span class="settings-key-chip">\${Qi(a)}</span>\`).join("")}
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
  \`,document.getElementById("clearClientStateBtn")?.addEventListener("click",()=>{Ja()}),document.getElementById("clearAllCommentsBtn")?.addEventListener("click",()=>{Ua()});let i=document.getElementById("markdownThemeSelect"),r=document.getElementById("codeThemeSelect");i?.addEventListener("change",()=>{l.config.markdownTheme=i.value,window.applyTheme?.()}),r?.addEventListener("change",()=>{l.config.codeTheme=r.value,window.applyTheme?.()})}function tt(){let e=document.getElementById("settingsDialogOverlay");e&&e.classList.remove("show")}function _a(){let e=document.getElementById("markdownThemeSelect"),t=document.getElementById("codeThemeSelect");e&&(l.config.markdownTheme=e.value),t&&(l.config.codeTheme=t.value),H(l.config),A(),tt()}function Ka(){let e=[];for(let o=0;o<localStorage.length;o+=1){let i=localStorage.key(o);i&&e.push(i)}e.sort();let t=e.filter(o=>o.startsWith("md-viewer:")),n=t.filter(o=>o==="md-viewer:annotation-panel-open-by-file"||o==="md-viewer:annotation-density"||o==="md-viewer:annotation-sidebar-width"||o.startsWith("md-viewer:annotations:")).length;return{currentFile:l.currentFile,openFilesCount:l.sessionFiles.size,workspaceCount:l.config.workspaces.length,commentStateKeyCount:n,mdvKeyCount:t.length,localStorageKeyCount:e.length,mdvKeys:t}}function Ja(){let e=[];for(let t=0;t<localStorage.length;t+=1){let n=localStorage.key(t);n&&n.startsWith("md-viewer:")&&e.push(n)}for(let t of e)localStorage.removeItem(t);z(\`\\u5DF2\\u6E05\\u7406\\u5BA2\\u6237\\u7AEF\\u72B6\\u6001\\uFF08\${e.length} \\u9879\\uFF09\`,1800),window.setTimeout(()=>window.location.reload(),250)}async function Ua(){try{let e=await fetch("/api/annotations/clear",{method:"POST"}),t=await e.json();if(!e.ok||t?.success!==!0)throw new Error(t?.error||\`HTTP \${e.status}\`);let n=[];for(let o=0;o<localStorage.length;o+=1){let i=localStorage.key(o);i&&(i.startsWith("md-viewer:annotations:")&&n.push(i),i==="md-viewer:annotation-panel-open-by-file"&&n.push(i),i==="md-viewer:annotation-density"&&n.push(i),i==="md-viewer:annotation-sidebar-width"&&n.push(i))}for(let o of n)localStorage.removeItem(o);z(\`\\u5DF2\\u6E05\\u7A7A\\u8BC4\\u8BBA\\u72B6\\u6001\\uFF08\\u670D\\u52A1\\u7AEF \${t?.deleted||0} \\u6761\\uFF0C\\u672C\\u5730 \${n.length} \\u9879\\uFF09\`,1800),window.setTimeout(()=>window.location.reload(),250)}catch(e){M(\`\\u6E05\\u7A7A\\u8BC4\\u8BBA\\u72B6\\u6001\\u5931\\u8D25: \${e?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`,2600)}}function Qi(e){return String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}var Yi=x(()=>{"use strict";N();xe();L();Ae();On();typeof window<"u"&&(window.closeSettingsDialog=tt,window.saveSettings=_a)});function Va(e,t=60){let n=JSON.stringify(e);return n.length<=t?b(n):b(n.slice(0,t))+"\\u2026"}function qn(e,t,n,o){let i=e!==null&&typeof e=="object",r=n<1;if(!i){let E=t!==null?\`<span class="json-key">\${je(b(JSON.stringify(t)),o)}</span><span class="json-colon">:</span>\`:"",k=Ga(e,o);return\`
      <li>
        <div class="json-node">
          <span class="json-toggle"></span>
          \${E}
          \${k}
        </div>
      </li>\`}let a=Array.isArray(e),s=a?e.map((E,k)=>({k:String(k),v:E})):Object.entries(e).map(([E,k])=>({k:E,v:k})),c=s.length,d=a?"[":"{",u=a?"]":"}",m=!r,p=m?"\\u25B6":"\\u25BC",g=m?"json-children collapsed":"json-children",y=t!==null?\`<span class="json-key">\${je(b(JSON.stringify(t)),o)}</span><span class="json-colon">:</span>\`:"",h=m?\`<span class="json-preview">\${Va(e)}</span>\`:"",v=s.map(({k:E,v:k})=>qn(k,a?null:E,n+1,o)).join("");return\`
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
    </li>\`}function Ga(e,t){return e===null?\`<span class="json-null">\${je("null",t)}</span>\`:typeof e=="boolean"?\`<span class="json-boolean">\${je(String(e),t)}</span>\`:typeof e=="number"?\`<span class="json-number">\${je(String(e),t)}</span>\`:\`<span class="json-string">\${je(b(JSON.stringify(e)),t)}</span>\`}function je(e,t){if(!t)return e;let n=t.toLowerCase(),o=e.toLowerCase(),i="",r=0;for(;r<e.length;){let a=o.indexOf(n,r);if(a===-1){i+=e.slice(r);break}i+=e.slice(r,a),i+=\`<mark class="json-match">\${e.slice(a,a+n.length)}</mark>\`,r=a+n.length}return i}function Qa(e,t){if(!t)return!1;let n=t.toLowerCase(),o=!1;function i(a){let s=a.querySelector(":scope > .json-node"),c=a.querySelector(":scope > .json-children");if(!c)return(s?.textContent?.toLowerCase()||"").includes(n);let d=Array.from(c.querySelectorAll(":scope > li")),u=!1;for(let m of d)i(m)&&(u=!0);if(u){if(o=!0,s){s.setAttribute("data-expanded","true");let m=s.querySelector(".json-toggle");m&&(m.textContent="\\u25BC");let p=s.querySelector(".json-close-bracket");p&&(p.style.display="inline");let g=s.querySelector(".json-preview");g&&(g.style.display="none")}c.classList.remove("collapsed")}return u}let r=Array.from(e.querySelectorAll(":scope > ul > li"));for(let a of r)i(a);return o}function Xa(e){e.addEventListener("click",t=>{let o=t.target.closest(".json-node-expandable");if(!o)return;let r=o.parentElement.querySelector(":scope > .json-children");if(!r)return;let a=o.getAttribute("data-expanded")==="true",s=o.querySelector(".json-toggle"),c=o.querySelector(".json-close-bracket"),d=o.querySelector(".json-preview");if(a)if(o.setAttribute("data-expanded","false"),s&&(s.textContent="\\u25B6"),r.classList.add("collapsed"),c&&(c.style.display="none"),d)d.style.display="";else{let u=document.createElement("span");u.className="json-preview",u.textContent="\\u2026",o.appendChild(u)}else o.setAttribute("data-expanded","true"),s&&(s.textContent="\\u25BC"),r.classList.remove("collapsed"),c&&(c.style.display="inline"),d&&(d.style.display="none")})}function Zi(e,t,n,o=""){if(_e(n)?Za(e,t,o):Ya(e,t,o),Xa(e),o&&!Qa(e,o)){let a=document.createElement("div");a.className="json-no-results",a.textContent="\\u65E0\\u5339\\u914D\\u7ED3\\u679C",e.appendChild(a)}}function Ya(e,t,n){let o;try{o=JSON.parse(t)}catch(r){e.innerHTML=\`
      <div class="json-viewer">
        <div class="json-error">
          JSON \\u89E3\\u6790\\u5931\\u8D25\\uFF1A\${b(String(r))}
          <pre>\${b(t.slice(0,500))}</pre>
        </div>
      </div>\`;return}let i=document.createElement("div");i.className="json-viewer",i.innerHTML=\`<ul>\${qn(o,null,0,n)}</ul>\`,e.appendChild(i)}function Za(e,t,n){let o=t.split(\`
\`),i=document.createElement("div");i.className="json-viewer";let r=0;for(let a of o){let s=a.trim();if(!s)continue;r++;let c=document.createElement("div");c.className="json-line-header",c.textContent=\`Line \${r}\`,i.appendChild(c);let d;try{d=JSON.parse(s)}catch(m){let p=document.createElement("div");p.className="json-error",p.innerHTML=\`\\u89E3\\u6790\\u5931\\u8D25\\uFF1A\${b(String(m))}<pre>\${b(s.slice(0,200))}</pre>\`,i.appendChild(p);continue}let u=document.createElement("ul");u.innerHTML=qn(d,null,0,n),i.appendChild(u)}e.appendChild(i)}var er=x(()=>{"use strict";fe();Ke()});var he={};le(he,{renderAll:()=>rs});function or(){let e=Vi(l.config.markdownTheme||"github"),t=Gi(l.config.codeTheme||"github"),n=document.getElementById("theme-md-css"),o=document.getElementById("theme-hl-css");n&&(n.textContent=e),o&&(o.textContent=t)}function ke(e=!1){let t=l.currentFile&&!cr(l.currentFile)?l.currentFile:null,n=hi();(e||t!==n)&&fi(t),B(),\$(t)}async function rr(e,t=!1){let n=l.currentFile,o=t;Zt(e,o),o&&(l.config.sidebarTab==="focus"||l.config.sidebarTab==="full")&&await sn(e.path),o&&e.path,A(),J(),ke(o&&n!==e.path),o&&n!==e.path&&ar()}function ar(){let e=document.getElementById("content");e&&e.scrollTo({top:0,behavior:"auto"})}function ts(){return Math.max(ir,Math.min(es,window.innerWidth-360))}function Vn(e){return Math.min(ts(),Math.max(ir,Math.round(e)))}function nt(e){let t=Vn(e);document.documentElement.style.setProperty("--sidebar-width",\`\${t}px\`)}function ns(){let e=Number(localStorage.getItem(Jn)),t=Number.isFinite(e)&&e>0?e:Un;nt(t)}function os(){let e=document.getElementById("sidebarResizer");if(!e)return;let t=!1,n=i=>{if(!t)return;let r=Vn(i.clientX);nt(r)},o=i=>{if(!t)return;t=!1;let r=Vn(i.clientX);nt(r),localStorage.setItem(Jn,String(r)),document.body.classList.remove("sidebar-resizing"),window.removeEventListener("mousemove",n),window.removeEventListener("mouseup",o)};e.addEventListener("mousedown",i=>{window.innerWidth<=900||(t=!0,document.body.classList.add("sidebar-resizing"),window.addEventListener("mousemove",n),window.addEventListener("mouseup",o),i.preventDefault())}),e.addEventListener("dblclick",()=>{nt(Un),localStorage.setItem(Jn,String(Un))}),window.addEventListener("resize",()=>{let i=Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--sidebar-width"),10);Number.isFinite(i)&&nt(i)})}async function is(){l.currentFile&&await Qn(l.currentFile,{silent:!0,highlight:!1})}async function sr(e){await Qn(e,{silent:!1,highlight:!0})&&l.currentFile===e&&z("\\u6587\\u4EF6\\u5DF2\\u5237\\u65B0",2e3)}function lr(){let e=document.getElementById("content");e&&(e.style.animation="flash 700ms ease-out",setTimeout(()=>{e.style.animation=""},700))}async function Qn(e,t={}){let n=l.sessionFiles.get(e);if(!n||n.isMissing)return!1;let o=(zn.get(e)||0)+1;zn.set(e,o);let i=await Le(e,t.silent!==!1);if(!i||zn.get(e)!==o)return!1;let r=l.sessionFiles.get(e)||l.sessionFiles.get(i.path);if(!r)return!1;if(r.content=i.content,r.pendingContent=void 0,i.lastModified>=(r.lastModified||0)&&(r.lastModified=i.lastModified),r.displayedModified=i.lastModified,r.isMissing=!1,O(),l.currentFile===e||l.currentFile===i.path){if(re){re=!1;let a=document.getElementById("diffButton");a&&a.classList.remove("active")}J(),ke(!1),t.highlight&&lr()}return A(),await ve(),!0}function rs(){A(),J(),ke(!1)}function as(e,t){let n=\`\${e}/\${t}\`,o=n.startsWith("/"),i=n.split("/"),r=[];for(let a of i)if(!(!a||a===".")){if(a===".."){r.length>0&&r.pop();continue}r.push(a)}return\`\${o?"/":""}\${r.join("/")}\`}function ss(e,t){let n=e.trim();if(!n||n.startsWith("http://")||n.startsWith("https://")||n.startsWith("data:")||n.startsWith("blob:")||n.startsWith("/api/")||dr(t))return null;let o=n.indexOf("?"),i=n.indexOf("#"),r=[o,i].filter(u=>u>=0).sort((u,m)=>u-m)[0]??-1,a=r>=0?n.slice(0,r):n,s=r>=0?n.slice(r):"",c=t.slice(0,t.lastIndexOf("/")),d=a.startsWith("/")?a:as(c,a);return\`/api/file-asset?path=\${encodeURIComponent(d)}\${s}\`}function ls(e,t){let n=e.querySelector(".markdown-body");n&&n.querySelectorAll("img[src], video[src], source[src]").forEach(o=>{let i=o.getAttribute("src");if(!i)return;let r=ss(i,t);r&&o.setAttribute("src",r)})}async function cs(e){let t=window.mermaid;if(!t)return;let n=Array.from(e.querySelectorAll(".markdown-body pre > code.language-mermaid, .markdown-body pre > code.lang-mermaid, .markdown-body pre > code.language-flowchart, .markdown-body pre > code.lang-flowchart"));if(n.length===0)return;tr||(t.initialize({startOnLoad:!1,theme:"neutral",securityLevel:"loose"}),tr=!0);let o=r=>{let a=r.textContent||"\\u590D\\u5236";r.textContent="\\u2713",r.classList.add("copied"),window.setTimeout(()=>{r.textContent=a,r.classList.remove("copied")},900)},i=(r,a)=>{let s=document.createElement("div");s.className="mermaid-source-panel",s.style.display=a?"block":"none";let c=document.createElement("div");c.className="mermaid-source-head";let d=document.createElement("span");d.textContent="Mermaid \\u6E90\\u7801";let u=document.createElement("button");u.className="mermaid-source-copy",u.textContent="\\u590D\\u5236",u.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(r),o(u)}catch{}}),c.appendChild(d),c.appendChild(u);let m=document.createElement("pre"),p=document.createElement("code");p.className="language-mermaid",p.textContent=r,m.appendChild(p),s.appendChild(c),s.appendChild(m);let g=document.createElement("button");return g.className="mermaid-source-toggle",g.textContent=a?"\\u9690\\u85CF\\u6E90\\u7801":"\\u6E90\\u7801",g.addEventListener("click",()=>{let y=s.style.display!=="none";s.style.display=y?"none":"block",g.textContent=y?"\\u6E90\\u7801":"\\u9690\\u85CF\\u6E90\\u7801"}),{panel:s,toggleButton:g}};for(let r=0;r<n.length;r+=1){let a=n[r],s=a.closest("pre");if(!s)continue;let c=(a.textContent||"").trim();if(!c)continue;let d=a.classList.contains("language-flowchart")||a.classList.contains("lang-flowchart"),u=c.split(\`
\`).find(p=>p.trim().length>0)?.trim().toLowerCase()||"",m=d&&!u.startsWith("flowchart")&&!u.startsWith("graph")?\`flowchart TD
\${c}\`:c;if(m)try{let p=\`mdv-mermaid-\${Date.now()}-\${r}\`,{svg:g,bindFunctions:y}=await t.render(p,m),h=document.createElement("div");h.className="mermaid-block";let v=document.createElement("div");v.className="mermaid-actions";let{panel:E,toggleButton:k}=i(m,!1);v.appendChild(k);let S=document.createElement("div");S.className="mermaid",S.setAttribute("data-mdv-mermaid","1"),S.innerHTML=g,h.appendChild(v),h.appendChild(S),h.appendChild(E),s.replaceWith(h),typeof y=="function"&&y(S)}catch(p){let g=document.createElement("div");g.className="mermaid-fallback-block";let y=document.createElement("div");y.className="mermaid-actions";let{panel:h,toggleButton:v}=i(m,!0);y.appendChild(v);let E=document.createElement("div");E.className="mermaid-fallback-notice",E.textContent="Mermaid \\u8BED\\u6CD5\\u9519\\u8BEF\\uFF0C\\u5DF2\\u56DE\\u9000\\u4E3A\\u539F\\u6587\\u663E\\u793A",g.appendChild(y),g.appendChild(E),g.appendChild(h),s.replaceWith(g),console.error("Mermaid \\u6E32\\u67D3\\u5931\\u8D25\\uFF0C\\u5DF2\\u56DE\\u9000\\u539F\\u6587:",p)}}}function J(){let e=document.getElementById("content");if(!e)return;if(!l.currentFile){e.removeAttribute("data-current-file"),e.innerHTML=\`
      <div class="empty-state">
        <h2>\\u6B22\\u8FCE\\u4F7F\\u7528 MD Viewer</h2>
        <p>\\u5728\\u5DE6\\u4FA7\\u6DFB\\u52A0 Markdown/HTML \\u6587\\u4EF6\\u5F00\\u59CB\\u9605\\u8BFB</p>
      </div>
    \`;return}let t=l.sessionFiles.get(l.currentFile);if(!t)return;if(cr(t.path)){e.setAttribute("data-current-file",t.path),e.innerHTML=\`<iframe class="html-preview-frame" srcdoc="\${t.content.replace(/"/g,"&quot;").replace(/'/g,"&#39;")}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"></iframe>\`;let r=document.getElementById("fileMeta");r&&(r.textContent=wt(t.lastModified)),Kn(),ve();return}if(ps(t.path)){e.setAttribute("data-current-file",t.path),e.innerHTML="";let a=document.getElementById("searchInput")?.value?.trim()??"";Zi(e,t.content,t.path,a);let s=document.getElementById("fileMeta");s&&(s.textContent=wt(t.lastModified)),Kn(),ve();return}let n=window.marked.parse(t.content),o=t.isMissing?\`
      <div class="content-file-status deleted">
        \\u8BE5\\u6587\\u4EF6\\u5DF2\\u4ECE\\u78C1\\u76D8\\u5220\\u9664\\uFF0C\\u5F53\\u524D\\u5185\\u5BB9\\u4E3A\\u672C\\u5730\\u7F13\\u5B58\\u5FEB\\u7167\\u3002
      </div>
    \`:"";e.innerHTML=\`\${o}<div class="markdown-body" id="reader">\${n}</div>\`,e.setAttribute("data-current-file",t.path),ls(e,t.path),cs(e),B();let i=document.getElementById("fileMeta");i&&(i.textContent=wt(t.lastModified)),Kn(),ve()}function Kn(){let e=document.getElementById("breadcrumb");if(!e||!l.currentFile){e&&(e.innerHTML="");return}let t=l.sessionFiles.get(l.currentFile);if(!t)return;let n=t.path.split("/").filter(Boolean),o=n[n.length-1]||"",i=n.map((r,a)=>{let s=a===n.length-1,c="/"+n.slice(0,a+1).join("/");return s?\`<span class="breadcrumb-item active">\${b(r)}</span>\`:\`
      <span class="breadcrumb-item" title="\${w(c)}">
        \${b(r)}
      </span>
      <span class="breadcrumb-separator">/</span>
    \`}).join("");e.innerHTML=\`
    \${i}
    <button class="copy-filename-button" onclick="copyFilePath('\${w(t.path)}', event)" title="\\u590D\\u5236\\u76F8\\u5BF9\\u8DEF\\u5F84 / \\u2325+\\u70B9\\u51FB\\u590D\\u5236\\u7EDD\\u5BF9\\u8DEF\\u5F84">
      <span class="copy-icon"></span>
      <span class="check-icon">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
        </svg>
      </span>
      <span class="copy-tooltip">\\u590D\\u5236\\u76F8\\u5BF9\\u8DEF\\u5F84</span>
    </button>
  \`}async function ds(e){if(e.stopPropagation(),!l.currentFile)return;let t=e.target,n=document.querySelector(".nearby-menu");if(n){n.remove();return}try{let o=await un(l.currentFile);if(!o.files||o.files.length===0){dn("\\u9644\\u8FD1\\u6CA1\\u6709\\u5176\\u4ED6 Markdown \\u6587\\u4EF6",3e3);return}let i=document.createElement("div");i.className="nearby-menu",i.innerHTML=\`
      <div class="nearby-menu-header">\\u9644\\u8FD1\\u7684\\u6587\\u4EF6</div>
      \${o.files.map(s=>\`
        <div class="nearby-menu-item" onclick="window.addFileByPath('\${w(s.path)}', true)">
          \\u{1F4C4} \${b(s.name)}
        </div>
      \`).join("")}
    \`;let r=t.getBoundingClientRect();i.style.position="fixed",i.style.left=r.left+"px",i.style.top=r.bottom+5+"px",document.body.appendChild(i);let a=()=>{i.remove(),document.removeEventListener("click",a)};setTimeout(()=>document.addEventListener("click",a),0)}catch(o){M("\\u83B7\\u53D6\\u9644\\u8FD1\\u6587\\u4EF6\\u5931\\u8D25: "+o.message)}}function us(e){let t=e.split("/").filter(Boolean);return t[t.length-1]||"workspace"}function cr(e){let t=e.toLowerCase();return t.endsWith(".html")||t.endsWith(".htm")}function ps(e){let t=e.toLowerCase();return t.endsWith(".json")||t.endsWith(".jsonl")}function dr(e){return/^https?:\\/\\//i.test(e)}async function ms(e){if(W(e),A(),dr(e)){window.open(e,"_blank","noopener,noreferrer");return}try{let n=await(await fetch("/api/open-local-file",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:e})})).json();n?.error&&M(\`\\u6253\\u5F00 HTML \\u5931\\u8D25: \${n.error}\`)}catch(t){M(\`\\u6253\\u5F00 HTML \\u5931\\u8D25: \${t?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)}}function fs(e){let t=e.trim();return t?!!(/^https?:\\/\\//i.test(t)||t.startsWith("/")||t.startsWith("~/")||t.startsWith("./")||t.startsWith("../")||t.includes("/")||t.includes("\\\\")||/\\.[a-zA-Z0-9]{1,10}\$/.test(t)):!1}function ot(){K=null;let e=document.getElementById("quickActionConfirm"),t=document.getElementById("quickActionConfirmText"),n=document.getElementById("quickActionConfirmActions");e&&(e.style.display="none",e.className="add-file-confirm"),t&&(t.textContent=""),n&&(n.innerHTML=""),document.body.classList.remove("quick-action-confirm-visible")}function ur(){let e=document.getElementById("quickActionConfirm");return!!e&&e.style.display!=="none"}function Wt(e,t,n={}){document.getElementById("searchInput")?.dispatchEvent(new Event("path-autocomplete-hide"));let i=document.getElementById("quickActionConfirm"),r=document.getElementById("quickActionConfirmText"),a=document.getElementById("quickActionConfirmActions");if(!(!i||!r||!a)){if(r.textContent=e,a.innerHTML="",i.className=\`add-file-confirm state-\${t}\`,i.style.display="flex",document.body.classList.add("quick-action-confirm-visible"),n.primaryLabel&&n.onPrimary){let s=document.createElement("button");s.className="add-file-confirm-button primary",s.textContent=n.primaryLabel,s.onclick=async()=>{await n.onPrimary(),ot()},a.appendChild(s)}if(n.allowCancel!==!1){let s=document.createElement("button");s.className="add-file-confirm-button",s.textContent="\\u53D6\\u6D88",s.onclick=()=>ot(),a.appendChild(s)}}}async function nr(){if(!K)return;if(K.kind==="add-other-file"){await Pe(K.path,!0);return}let e=ht(us(K.path),K.path);A(),z(\`\\u5DF2\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A: \${e.name}\`,2e3),X(""),A()}async function Pe(e,t=!0){if(!e.trim())return;let n=await Le(e);n&&(await rr(n,t),await fn(e,t),X(""),A())}async function pr(e){let t=e.trim();if(!t)return;let n=await mn(t),o=n.path||t;if(n.kind==="md_file"||n.kind==="html_file"){ot(),await Pe(o,!0);return}if(n.kind==="other_file"){K={kind:"add-other-file",path:o,ext:n.ext||null},Wt(\`\\u68C0\\u6D4B\\u5230\\u975E Markdown \\u6587\\u4EF6\${n.ext?\`: \${n.ext}\`:""}\`,"warning",{primaryLabel:"\\u7EE7\\u7EED\\u6DFB\\u52A0\\u6587\\u4EF6",onPrimary:nr});return}if(n.kind==="directory"){K={kind:"add-workspace",path:o},Wt("\\u68C0\\u6D4B\\u5230\\u76EE\\u5F55\\uFF0C\\u662F\\u5426\\u4F5C\\u4E3A\\u5DE5\\u4F5C\\u533A\\u6DFB\\u52A0\\uFF1F","directory",{primaryLabel:"\\u6DFB\\u52A0\\u5DE5\\u4F5C\\u533A",onPrimary:nr});return}if(n.kind==="not_found"){K=null,Wt("\\u8DEF\\u5F84\\u4E0D\\u5B58\\u5728\\uFF0C\\u8BF7\\u68C0\\u67E5\\u540E\\u91CD\\u8BD5","error",{allowCancel:!0});return}K=null,Wt(n.error||"\\u65E0\\u6CD5\\u8BC6\\u522B\\u8F93\\u5165\\u8DEF\\u5F84","error",{allowCancel:!0})}function gs(e){if(re){re=!1;let o=document.getElementById("diffButton");o&&o.classList.remove("active")}let t=l.currentFile;tn(e),A(),J(),ke(!0),t!==e&&ar();let n=l.sessionFiles.get(e);n&&!n.isMissing&&n.lastModified>n.displayedModified&&Qn(e,{silent:!0,highlight:!1})}function mr(e){en(e),A(),J(),ke(!0)}async function hs(e){let t=document.getElementById("searchInput"),n=(typeof e=="string"?e:t?.value||"").trim();if(n)try{let o=l.config.workspaces.map(r=>r.path).filter(Boolean),i=await ze(n,{roots:o,limit:50});i.files&&i.files.length>0?await Pe(i.files[0].path):dn("\\u6CA1\\u6709\\u627E\\u5230\\u5339\\u914D\\u7684\\u6587\\u4EF6",3e3)}catch(o){M("\\u641C\\u7D22\\u5931\\u8D25: "+o.message)}}function ys(){document.body.addEventListener("dragover",e=>{e.preventDefault()}),document.body.addEventListener("drop",async e=>{e.preventDefault();let t=Array.from(e.dataTransfer?.files||[]);for(let n of t){let o=n.name.toLowerCase();(o.endsWith(".md")||o.endsWith(".markdown")||o.endsWith(".html")||o.endsWith(".htm"))&&await Pe(n.path)}})}function bs(){document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(vi()){e.preventDefault();return}if(document.getElementById("settingsDialogOverlay")?.classList.contains("show")){e.preventDefault(),tt();return}let n=document.getElementById("addWorkspaceDialogOverlay");if(n?.classList.contains("show")){e.preventDefault(),n.classList.remove("show");return}}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){let t=document.activeElement?.tagName?.toLowerCase();if(t==="textarea"||t==="input")return;e.preventDefault();let n=document.getElementById("searchInput");n&&(n.focus(),n.select());return}(e.metaKey||e.ctrlKey)&&e.key==="w"&&(e.preventDefault(),l.currentFile&&mr(l.currentFile))})}function ws(){let e=new URLSearchParams(window.location.search),t=e.get("file"),n=e.get("focus")!=="false";t&&(Pe(t,n),window.history.replaceState({},"",window.location.pathname))}async function vs(e){let t=l.sessionFiles.get(e);if(!t)return null;if(t.pendingContent!==void 0)return t.pendingContent;let n=await Le(e,!0);return n?(t.pendingContent=n.content,n.content):null}function ks(e,t){let n=document.getElementById("content");if(!n)return;let o=xo(e,t);if(!o.some(d=>d.type!=="equal")){n.innerHTML=\`
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
    \`;return}let r=[],a=0;for(;a<o.length;){let d=o[a];d.type==="equal"?(r.push({left:d,right:d}),a++):d.type==="delete"?a+1<o.length&&o[a+1].type==="insert"?(r.push({left:d,right:o[a+1]}),a+=2):(r.push({left:d}),a++):(r.push({right:d}),a++)}let s=d=>d.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),c=r.map(({left:d,right:u})=>{if(d&&u&&d.type==="equal")return\`<tr class="diff-row-equal">
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
  \`}async function xs(){if(!l.currentFile)return;let e=l.sessionFiles.get(l.currentFile);if(!e)return;if(re){fr();return}let t=await vs(l.currentFile);if(t===null)return;re=!0;let n=document.getElementById("diffButton");n&&n.classList.add("active"),ks(e.content,t)}function fr(){re=!1;let e=document.getElementById("diffButton");e&&e.classList.remove("active"),J()}async function Es(){if(!l.currentFile)return;let e=l.sessionFiles.get(l.currentFile);!e||e.pendingContent===void 0||(e.content=e.pendingContent,e.pendingContent=void 0,e.displayedModified=e.lastModified,O(),re=!1,J(),ke(!1),lr(),A(),await ve())}async function ve(){let e=document.getElementById("diffButton"),t=document.getElementById("refreshButton");if(!l.currentFile){e&&(e.style.display="none"),t&&(t.style.display="none");return}let n=l.sessionFiles.get(l.currentFile);if(!n)return;if(n.isMissing){e&&(e.style.display="none"),t&&(t.style.display="none");return}let o=n.lastModified>n.displayedModified;e&&(e.style.display=o&&!n.isRemote?"flex":"none"),t&&(t.style.display=o?"flex":"none")}async function Ts(){l.currentFile&&await sr(l.currentFile)}function Ss(e){return e?.target?e.target.closest(".copy-filename-button, .sync-dialog-copy-btn, .sync-dialog-btn"):null}function Ms(e,t){if(!e)return;if(e.classList.contains("copy-filename-button")){e.classList.add("success");let o=e.querySelector(".copy-tooltip"),i=o?.textContent;o&&(o.textContent=t||"\\u5DF2\\u590D\\u5236"),setTimeout(()=>{e.classList.remove("success"),o&&i&&(o.textContent=i)},1e3);return}let n=e.textContent;e.textContent="\\u2713 \\u5DF2\\u590D\\u5236",setTimeout(()=>{n!=null&&(e.textContent=n)},1e3)}function Gn(e,t,n){navigator.clipboard.writeText(e).then(()=>{Ms(Ss(t),n)}).catch(()=>{M("\\u590D\\u5236\\u5931\\u8D25")})}function As(e,t){Gn(e,t)}function gr(e,t){if(t instanceof MouseEvent&&t.altKey){Gn(e,t,"\\u5DF2\\u590D\\u5236\\u7EDD\\u5BF9\\u8DEF\\u5F84");return}let o=l.config.workspaces,i=e;for(let r of o){let a=r.path.replace(/\\/+\$/,"");if(e===a||e.startsWith(a+"/")){i=e.slice(a.length+1);break}}Gn(i,t,"\\u5DF2\\u590D\\u5236\\u76F8\\u5BF9\\u8DEF\\u5F84")}function Ls(e,t){gr(e,t)}function Fs(){let e=localStorage.getItem("fontScale");e&&(We=parseFloat(e)),hr()}function hr(){document.documentElement.style.setProperty("--font-scale",We.toString()),yr(),localStorage.setItem("fontScale",We.toString())}function yr(){let e=document.getElementById("fontScaleText");if(e){let o=Math.round(We*100);e.textContent=\`\${o}%\`}let t=document.querySelectorAll(".font-scale-option");t.forEach(o=>{o.classList.remove("active")});let n=Math.round(We*100);t.forEach(o=>{o.textContent?.trim()===\`\${n}%\`&&o.classList.add("active")})}function \$s(e){We=e,hr(),Xn()}function Cs(){let e=document.getElementById("fontScaleMenu");if(!e)return;e.style.display!=="none"?Xn():(e.style.display="block",yr())}function Xn(){let e=document.getElementById("fontScaleMenu");e&&(e.style.display="none")}function br(){let e=new EventSource("/api/events");e.addEventListener("file-changed",async t=>{let n=JSON.parse(t.data),o=Ee(n.path);o?(o.lastModified=n.lastModified,O()):Ut(n.path),A(),await ve()}),e.addEventListener("file-deleted",async t=>{let n=JSON.parse(t.data),o=Ee(n.path);o?(o.isMissing=!0,O()):de(n.path),A(),l.currentFile===n.path&&(J(),ve(),M("\\u6587\\u4EF6\\u5DF2\\u4E0D\\u5B58\\u5728"))}),e.addEventListener("file-opened",async t=>{let n=JSON.parse(t.data);await rr(n,n.focus!==!1)}),e.addEventListener("state-request",async t=>{let o=JSON.parse(t.data).requestId;if(!o)return;let i=Array.from(l.sessionFiles.values()).map(r=>({path:r.path,name:r.name}));try{await fetch("/api/session-state",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({requestId:o,currentFile:l.currentFile,openFiles:i})})}catch(r){console.error("\\u54CD\\u5E94\\u72B6\\u6001\\u8BF7\\u6C42\\u5931\\u8D25:",r)}}),e.onerror=()=>{console.error("SSE \\u8FDE\\u63A5\\u65AD\\u5F00\\uFF0C\\u5C1D\\u8BD5\\u91CD\\u8FDE..."),e.close(),setTimeout(br,3e3)}}function Ns(){window.setInterval(async()=>{if(_n||l.config.sidebarTab==="list")return;let e=l.config.sidebarTab==="focus"?l.config.workspaces:l.config.workspaces.filter(t=>t.isExpanded);if(e.length!==0){_n=!0;try{for(let t of e)await q(t.id);A()}finally{_n=!1}}},1500)}function Bs(){let e=document.createElement("div");e.id="findBar",e.innerHTML=\`
    <input id="findBarInput" type="text" placeholder="\\u67E5\\u627E..." autocomplete="off" spellcheck="false" />
    <span id="findBarCount"></span>
    <button id="findBarPrev" title="\\u4E0A\\u4E00\\u4E2A (\\u21E7\\u2318G)">&#8593;</button>
    <button id="findBarNext" title="\\u4E0B\\u4E00\\u4E2A (\\u2318G)">&#8595;</button>
    <button id="findBarClose" title="\\u5173\\u95ED (Esc)">&#10005;</button>
  \`,document.body.appendChild(e);let t=document.getElementById("findBarInput"),n=document.getElementById("findBarCount"),o=document.getElementById("findBarPrev"),i=document.getElementById("findBarNext"),r=document.getElementById("findBarClose"),a=[],s=-1,c=null;function d(){c&&c.querySelectorAll("mark.find-highlight").forEach(k=>{let S=k.parentNode;S&&(S.replaceChild(document.createTextNode(k.textContent||""),k),S.normalize())}),a=[],s=-1,n.textContent=""}function u(k){return k.replace(/[.*+?^\${}()|[\\]\\\\]/g,"\\\\\$&")}function m(k){if(d(),!k)return;let S=document.getElementById("content");if(!S)return;c=S;let C=new RegExp(u(k),"gi"),I=document.createTreeWalker(S,NodeFilter.SHOW_TEXT,{acceptNode(ae){let D=ae.parentElement;if(!D)return NodeFilter.FILTER_REJECT;let R=D.tagName.toLowerCase();return R==="script"||R==="style"||R==="mark"?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}}),it=[],rt;for(;rt=I.nextNode();)it.push(rt);for(let ae of it){let D=ae.textContent||"",R,De=[],Re=0;for(C.lastIndex=0;(R=C.exec(D))!==null;){R.index>Re&&De.push(D.slice(Re,R.index));let se=document.createElement("mark");se.className="find-highlight",se.textContent=R[0],De.push(se),a.push(document.createRange()),Re=R.index+R[0].length}if(De.length===0)continue;Re<D.length&&De.push(D.slice(Re));let Pt=document.createDocumentFragment();De.forEach(se=>{typeof se=="string"?Pt.appendChild(document.createTextNode(se)):Pt.appendChild(se)}),ae.parentNode.replaceChild(Pt,ae)}a=[],S.querySelectorAll("mark.find-highlight").forEach(ae=>{let D=document.createRange();D.selectNode(ae),a.push(D)}),a.length>0&&(s=0,p(0)),g()}function p(k){let S=document.getElementById("content");if(!S)return;let C=S.querySelectorAll("mark.find-highlight");C.forEach((it,rt)=>{it.classList.toggle("find-highlight-current",rt===k)});let I=C[k];I&&I.scrollIntoView({block:"center",behavior:"smooth"})}function g(){a.length===0?(n.textContent=t.value?"\\u65E0\\u7ED3\\u679C":"",n.className=t.value?"no-result":""):(n.textContent=\`\${s+1} / \${a.length}\`,n.className="")}function y(){a.length!==0&&(s=(s+1)%a.length,p(s),g())}function h(){a.length!==0&&(s=(s-1+a.length)%a.length,p(s),g())}function v(){e.classList.add("visible"),t.focus(),t.select(),t.value&&m(t.value)}function E(){e.classList.remove("visible"),d()}window.__showFindBar=v,t.addEventListener("input",()=>m(t.value)),t.addEventListener("keydown",k=>{k.key==="Enter"?(k.shiftKey?h():y(),k.preventDefault()):k.key==="Escape"&&(E(),k.preventDefault())}),o.addEventListener("click",h),i.addEventListener("click",y),r.addEventListener("click",E)}var Jn,Un,ir,es,zn,re,_n,tr,K,We,ye=x(()=>{N();pe();qe();me();fe();Eo();To();L();Ae();Yi();er();On();Cn();Jn="md-viewer:sidebar-width",Un=260,ir=220,es=680,zn=new Map,re=!1,_n=!1,tr=!1;K=null;We=1;document.addEventListener("click",e=>{let t=document.getElementById("fontScaleMenu"),n=document.getElementById("fontScaleButton");if(!t||!n)return;let o=e.target;!t.contains(o)&&!n.contains(o)&&Xn()});window.addFile=()=>{let e=document.getElementById("searchInput");e&&pr(e.value).catch(t=>{M(\`\\u6DFB\\u52A0\\u5931\\u8D25: \${t?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)})};window.handleUnifiedInputSubmit=e=>{let t=document.getElementById("searchInput"),n=(typeof e=="string"?e:t?.value||"").trim();if(n){if(!fs(n)){hs(n).catch(o=>{M(\`\\u641C\\u7D22\\u5931\\u8D25: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)});return}pr(n).catch(o=>{M(\`\\u6DFB\\u52A0\\u5931\\u8D25: \${o?.message||"\\u672A\\u77E5\\u9519\\u8BEF"}\`)})}};window.dismissQuickActionConfirm=()=>{ur()&&ot()};window.switchFile=gs;window.removeFile=mr;window.showNearbyMenu=ds;window.addFileByPath=Pe;window.refreshFile=sr;window.handleRefreshButtonClick=Ts;window.handleDiffButtonClick=xs;window.closeDiffView=fr;window.acceptDiffUpdate=Es;window.copySingleText=As;window.copyFileName=Ls;window.copyFilePath=gr;window.showToast=Me;window.showSettingsDialog=Xi;window.toggleFontScaleMenu=Cs;window.setFontScale=\$s;window.openExternalFile=ms;window.renderContent=J;window.applyTheme=or;(async()=>(ns(),Fs(),Li(),ne(),window.addEventListener("resize",()=>{ne()}),await Yt(Le),or(),await an(),Ns(),A(),J(),ke(!0),ys(),os(),document.addEventListener("click",e=>{if(!ur())return;let t=e.target;t&&(t.closest(".sidebar-header")||t.closest("#quickActionConfirm")||ot())}),ws(),bs(),document.addEventListener("mouseup",()=>{setTimeout(()=>{let e=document.getElementById("content")?.getAttribute("data-current-file")||null;Ai(e)},0)}),await is(),br(),Bs()))()});ye();})();
//# sourceMappingURL=client.js.map
`;
