var Earmark=(()=>{var Ae=Object.defineProperty;var jt=Object.getOwnPropertyDescriptor;var Ft=Object.getOwnPropertyNames;var Yt=Object.prototype.hasOwnProperty;var qt=(e,t)=>{for(var n in t)Ae(e,n,{get:t[n],enumerable:!0})},Ht=(e,t,n,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let r of Ft(t))!Yt.call(e,r)&&r!==n&&Ae(e,r,{get:()=>t[r],enumerable:!(o=jt(t,r))||o.enumerable});return e};var Bt=e=>Ht(Ae({},"__esModule",{value:!0}),e);var Nn={};qt(Nn,{DEFAULT_ENDPOINT:()=>wt,SOURCE_ATTR:()=>Me,annotationToMarkdown:()=>Le,batchToMarkdown:()=>ke,createEarmark:()=>kt,destroyEarmark:()=>Rn,detectFramework:()=>J,domPath:()=>ye,extractElement:()=>ce,extractRegion:()=>we,extractSelection:()=>ve,getEarmark:()=>Pn,inspectElement:()=>D,pageContext:()=>z,uniqueSelector:()=>N});var Qe=`
:host {
  all: initial;

  /* neutral ramp */
  --ea-bg: #ffffff;
  --ea-bg-elev: #f7f7f7;
  --ea-bg-sub: #ebebeb;
  --ea-fg: #171717;
  --ea-fg-dim: #5c5c5c;
  --ea-fg-soft: #a3a3a3;
  --ea-border: #ebebeb;
  --ea-border-strong: #d1d1d1;

  /* action */
  --ea-primary: #335cff;
  --ea-primary-hover: #2547d0;
  --ea-primary-alpha: rgba(71, 108, 255, 0.16);
  --ea-on-primary: #ffffff;

  /* marking ink */
  --ea-mark: #fa7319;
  --ea-mark-soft: rgba(255, 145, 71, 0.16);

  /* status */
  --ea-away: #f6b51e;
  --ea-success: #1fc16b;
  --ea-error: #fb3748;
  --ea-on-status: #171717;

  /* elevation \u2014 layered, closing on a 1px ring so a surface reads as a surface
     even against a page whose background we do not control */
  --ea-shadow:
    0 16px 32px -12px rgba(14, 18, 27, 0.10),
    0 6px 6px -3px rgba(14, 18, 27, 0.04),
    0 3px 3px -1.5px rgba(14, 18, 27, 0.04),
    0 1px 1px -0.5px rgba(14, 18, 27, 0.04),
    0 0 0 1px rgba(14, 18, 27, 0.06),
    0 -1px 1px -0.5px rgba(14, 18, 27, 0.06) inset;
  --ea-shadow-sm:
    0 3px 3px -1.5px rgba(14, 18, 27, 0.08),
    0 1px 1px -0.5px rgba(14, 18, 27, 0.08),
    0 0 0 1px rgba(14, 18, 27, 0.08);
  --ea-ring: 0 0 0 3px var(--ea-primary-alpha);

  /* shape */
  --ea-r-sm: 8px;
  --ea-r: 10px;
  --ea-r-lg: 16px;
  --ea-radius: var(--ea-r-lg);

  /* type \u2014 Inter when the machine has it, the system face otherwise. Nothing is
     fetched: a dev tool that waits on a font CDN is a dev tool that flashes. */
  --ea-font: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --ea-mono: "Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, monospace;

  font-family: var(--ea-font);
  color: var(--ea-fg);
  -webkit-font-smoothing: antialiased;
}

@media (prefers-color-scheme: dark) {
  :host {
    --ea-bg: #171717;
    --ea-bg-elev: #262626;
    --ea-bg-sub: #333333;
    --ea-fg: #ffffff;
    --ea-fg-dim: #a3a3a3;
    --ea-fg-soft: #7b7b7b;
    /* AlignUI's dark stroke is #262626; over an unknown page the overlay needs
       one step more definition than a page that owns its own background. */
    --ea-border: #292929;
    --ea-border-strong: #5c5c5c;
    --ea-primary: #4d82ff;
    --ea-primary-hover: #6895ff;
    --ea-mark: #ffa468;
    --ea-away: #ffd268;
    --ea-success: #3ee089;
    --ea-error: #ff6875;
    --ea-shadow:
      0 16px 32px -12px rgba(0, 0, 0, 0.64),
      0 6px 6px -3px rgba(0, 0, 0, 0.32),
      0 1px 1px -0.5px rgba(0, 0, 0, 0.32),
      0 0 0 1px #292929,
      0 -1px 1px -0.5px rgba(255, 255, 255, 0.04) inset;
    --ea-shadow-sm:
      0 3px 3px -1.5px rgba(0, 0, 0, 0.48),
      0 1px 1px -0.5px rgba(0, 0, 0, 0.32),
      0 0 0 1px rgba(255, 255, 255, 0.08);
  }
}

:host([data-theme="dark"]) {
  --ea-bg: #171717;
  --ea-bg-elev: #262626;
  --ea-bg-sub: #333333;
  --ea-fg: #ffffff;
  --ea-fg-dim: #a3a3a3;
  --ea-fg-soft: #7b7b7b;
  --ea-border: #292929;
  --ea-border-strong: #5c5c5c;
  --ea-primary: #4d82ff;
  --ea-primary-hover: #6895ff;
  --ea-mark: #ffa468;
  --ea-away: #ffd268;
  --ea-success: #3ee089;
  --ea-error: #ff6875;
  --ea-shadow:
    0 16px 32px -12px rgba(0, 0, 0, 0.64),
    0 6px 6px -3px rgba(0, 0, 0, 0.32),
    0 1px 1px -0.5px rgba(0, 0, 0, 0.32),
    0 0 0 1px #292929,
    0 -1px 1px -0.5px rgba(255, 255, 255, 0.04) inset;
  --ea-shadow-sm:
    0 3px 3px -1.5px rgba(0, 0, 0, 0.48),
    0 1px 1px -0.5px rgba(0, 0, 0, 0.32),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

:host([data-theme="light"]) {
  --ea-bg: #ffffff;
  --ea-bg-elev: #f7f7f7;
  --ea-bg-sub: #ebebeb;
  --ea-fg: #171717;
  --ea-fg-dim: #5c5c5c;
  --ea-fg-soft: #a3a3a3;
  --ea-border: #ebebeb;
  --ea-border-strong: #d1d1d1;
  --ea-primary: #335cff;
  --ea-primary-hover: #2547d0;
  --ea-mark: #fa7319;
  --ea-away: #f6b51e;
  --ea-success: #1fc16b;
  --ea-error: #fb3748;
}

* { box-sizing: border-box; }

.layer-fixed {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2147483000;
}

.layer-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 2147482999;
}

/* ---------- highlight ---------- */

.highlight {
  position: fixed;
  border: 2px solid var(--ea-mark);
  background: var(--ea-mark-soft);
  border-radius: 4px;
  pointer-events: none;
  transition: all 60ms linear;
  display: none;
}

.highlight[data-visible="true"] { display: block; }

.highlight-label {
  position: absolute;
  left: -2px;
  top: -25px;
  max-width: 420px;
  padding: 3px 8px;
  border-radius: var(--ea-r-sm) var(--ea-r-sm) var(--ea-r-sm) 0;
  background: var(--ea-mark);
  color: #ffffff;
  font: 500 11px/1.45 var(--ea-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.highlight[data-flip="true"] .highlight-label {
  top: auto;
  bottom: -25px;
  border-radius: 0 var(--ea-r-sm) var(--ea-r-sm) var(--ea-r-sm);
}

.marquee {
  position: fixed;
  border: 2px dashed var(--ea-mark);
  background: var(--ea-mark-soft);
  border-radius: 4px;
  pointer-events: none;
  display: none;
}

/* ---------- toolbar ---------- */

.toolbar {
  position: fixed;
  right: 16px;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 5px;
  background: var(--ea-bg);
  border-radius: 999px;
  box-shadow: var(--ea-shadow);
  pointer-events: auto;
  user-select: none;
}

.tool {
  all: unset;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  cursor: pointer;
  color: var(--ea-fg-dim);
  transition: background 120ms, color 120ms;
}

.tool:hover { background: var(--ea-bg-elev); color: var(--ea-fg); }
.tool:focus-visible { box-shadow: var(--ea-ring); }
.tool[aria-pressed="true"] {
  background: var(--ea-primary);
  color: var(--ea-on-primary);
}
.tool svg { width: 16px; height: 16px; display: block; }

.tool-divider {
  width: 1px;
  height: 20px;
  background: var(--ea-border);
  margin: 0 4px;
}

.count {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--ea-primary);
  color: var(--ea-on-primary);
  font: 500 11px/20px var(--ea-font);
  letter-spacing: 0;
  text-align: center;
}

.count[data-empty="true"] { display: none; }

.sync-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  margin: 0 6px 0 2px;
  background: var(--ea-fg-soft);
  flex: none;
}
.sync-dot[data-state="connected"] { background: var(--ea-success); }
.sync-dot[data-state="error"] { background: var(--ea-error); }
.sync-dot[data-state="offline"] { background: var(--ea-fg-soft); opacity: 0.4; }

/* ---------- pins ---------- */

.pin {
  position: absolute;
  width: 24px;
  height: 24px;
  margin: -12px 0 0 -12px;
  border-radius: 999px 999px 999px 2px;
  background: var(--ea-mark);
  color: #ffffff;
  font: 500 12px/24px var(--ea-font);
  letter-spacing: 0;
  text-align: center;
  box-shadow: var(--ea-shadow-sm);
  pointer-events: auto;
  cursor: pointer;
  transition: transform 120ms;
}

.pin:hover { transform: scale(1.15); }
.pin[data-status="acknowledged"] { background: var(--ea-primary); color: var(--ea-on-primary); }
.pin[data-status="needs-input"] { background: var(--ea-away); color: var(--ea-on-status); }
.pin[data-status="resolved"] { background: var(--ea-success); color: var(--ea-on-status); }
.pin[data-status="dismissed"] { background: var(--ea-fg-soft); opacity: 0.6; }

.pin-box {
  position: absolute;
  border: 1.5px dashed var(--ea-mark);
  border-radius: 4px;
  pointer-events: none;
  opacity: 0.55;
}

/* ---------- popover ---------- */

.popover {
  position: fixed;
  width: 320px;
  padding: 12px;
  background: var(--ea-bg);
  border-radius: var(--ea-r-lg);
  box-shadow: var(--ea-shadow);
  pointer-events: auto;
  display: none;
}

.popover[data-open="true"] { display: block; }

.popover-target {
  font: 400 11px/1.55 var(--ea-mono);
  color: var(--ea-fg-dim);
  margin-bottom: 8px;
  word-break: break-all;
}

.popover-target b { color: var(--ea-mark); font-weight: 500; }

.popover textarea {
  width: 100%;
  min-height: 68px;
  resize: vertical;
  padding: 8px 10px;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-r);
  background: var(--ea-bg);
  color: var(--ea-fg);
  font: 400 13px/1.5 var(--ea-font);
  letter-spacing: -0.006em;
  outline: none;
  transition: border-color 120ms, box-shadow 120ms;
}

.popover textarea::placeholder { color: var(--ea-fg-soft); }
.popover textarea:focus {
  border-color: var(--ea-primary);
  box-shadow: var(--ea-ring);
}

.popover-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
}

.hint {
  flex: 1;
  font: 400 11px/1.3 var(--ea-font);
  color: var(--ea-fg-soft);
}

.priority {
  all: unset;
  padding: 5px 8px;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-r-sm);
  background: var(--ea-bg);
  color: var(--ea-fg-dim);
  font: 500 11px/1.3 var(--ea-font);
  cursor: pointer;
  transition: background 120ms, color 120ms;
}
.priority:hover { background: var(--ea-bg-elev); color: var(--ea-fg); }
.priority:focus-visible { box-shadow: var(--ea-ring); }

.item-priority {
  padding: 2px 6px;
  border-radius: 999px;
  font: 500 9.5px/1.5 var(--ea-font);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  flex: none;
}
.item-priority[data-priority="high"] { background: var(--ea-error); color: #ffffff; }
.item-priority[data-priority="low"] { background: var(--ea-bg-sub); color: var(--ea-fg-dim); }

.btn {
  all: unset;
  padding: 6px 12px;
  border-radius: var(--ea-r);
  font: 500 12px/1.5 var(--ea-font);
  letter-spacing: -0.006em;
  cursor: pointer;
  border: 1px solid var(--ea-border);
  background: var(--ea-bg);
  color: var(--ea-fg);
  transition: background 120ms, border-color 120ms;
}
.btn:hover { background: var(--ea-bg-elev); border-color: var(--ea-border-strong); }
.btn:focus-visible { box-shadow: var(--ea-ring); }
.btn-primary {
  background: var(--ea-primary);
  border-color: var(--ea-primary);
  color: var(--ea-on-primary);
}
.btn-primary:hover {
  background: var(--ea-primary-hover);
  border-color: var(--ea-primary-hover);
}

/* ---------- panel ---------- */

.panel {
  position: fixed;
  right: 16px;
  bottom: 60px;
  width: 340px;
  max-height: min(70vh, 620px);
  display: none;
  flex-direction: column;
  background: var(--ea-bg);
  border-radius: var(--ea-r-lg);
  box-shadow: var(--ea-shadow);
  pointer-events: auto;
  overflow: hidden;
}

.panel[data-open="true"] { display: flex; }

.panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 12px;
  border-bottom: 1px solid var(--ea-border);
}

.panel-title {
  flex: 1;
  font: 500 11px/1.45 var(--ea-font);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ea-fg-soft);
}

.panel-list {
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.panel-empty {
  padding: 28px 16px;
  text-align: center;
  font: 400 12px/1.6 var(--ea-font);
  color: var(--ea-fg-soft);
}

.item {
  padding: 10px;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-r);
  background: var(--ea-bg);
  cursor: pointer;
  transition: border-color 120ms, background 120ms;
}

.item:hover { background: var(--ea-bg-elev); border-color: var(--ea-border-strong); }

.item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.item-index {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--ea-mark);
  color: #ffffff;
  font: 500 10px/18px var(--ea-font);
  text-align: center;
  flex: none;
}
.item[data-status="acknowledged"] .item-index { background: var(--ea-primary); color: var(--ea-on-primary); }
.item[data-status="needs-input"] .item-index { background: var(--ea-away); color: var(--ea-on-status); }
.item[data-status="resolved"] .item-index { background: var(--ea-success); color: var(--ea-on-status); }
.item[data-status="dismissed"] .item-index { background: var(--ea-fg-soft); }

.item-note {
  flex: 1;
  font: 500 13px/1.45 var(--ea-font);
  letter-spacing: -0.006em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-del {
  all: unset;
  cursor: pointer;
  color: var(--ea-fg-soft);
  font: 400 14px/1 var(--ea-font);
  padding: 0 2px;
  border-radius: 4px;
}
.item-del:hover { color: var(--ea-error); }
.item-del:focus-visible { box-shadow: var(--ea-ring); }

.item-meta {
  font: 400 10.5px/1.55 var(--ea-mono);
  color: var(--ea-fg-soft);
  word-break: break-all;
}

.item-thread {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--ea-border);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.reply {
  font: 400 11.5px/1.5 var(--ea-font);
  letter-spacing: -0.006em;
  color: var(--ea-fg-dim);
}
.reply b { color: var(--ea-primary); font-weight: 500; }
.reply[data-author="agent"] b { color: var(--ea-away); }

.reply-form { display: flex; gap: 5px; margin-top: 4px; }
.reply-form input {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-r-sm);
  background: var(--ea-bg);
  color: var(--ea-fg);
  font: 400 11.5px/1.45 var(--ea-font);
  outline: none;
  transition: border-color 120ms, box-shadow 120ms;
}
.reply-form input::placeholder { color: var(--ea-fg-soft); }
.reply-form input:focus {
  border-color: var(--ea-primary);
  box-shadow: var(--ea-ring);
}

.panel-foot {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid var(--ea-border);
}
.panel-foot .btn { flex: 1; text-align: center; }

.toast {
  position: fixed;
  right: 16px;
  bottom: 60px;
  padding: 8px 12px;
  background: var(--ea-fg);
  color: var(--ea-bg);
  border-radius: var(--ea-r);
  font: 500 12px/1.5 var(--ea-font);
  letter-spacing: -0.006em;
  box-shadow: var(--ea-shadow-sm);
  pointer-events: none;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 160ms, transform 160ms;
}
.toast[data-show="true"] { opacity: 1; transform: translateY(0); }

/* Touch and pen. A 32px control is comfortable with a cursor and a miss with a
   fingertip, so the controls grow and the panel stops assuming a desktop width. */
@media (pointer: coarse) {
  .toolbar {
    right: 12px;
    bottom: 12px;
    padding: 6px;
    gap: 4px;
  }

  .tool {
    width: 44px;
    height: 44px;
  }

  .tool svg { width: 20px; height: 20px; }

  .count {
    min-width: 24px;
    height: 24px;
    font-size: 12px;
    line-height: 24px;
  }

  .pin {
    width: 30px;
    height: 30px;
    margin: -15px 0 0 -15px;
    font-size: 14px;
    line-height: 30px;
  }

  .panel {
    right: 12px;
    left: 12px;
    bottom: 72px;
    width: auto;
    max-height: min(72vh, 620px);
  }

  .popover {
    width: min(340px, calc(100vw - 24px));
    padding: 14px;
  }

  .popover textarea { min-height: 84px; font-size: 16px; }

  /* 16px keeps iOS Safari from zooming the whole page when the field is focused. */
  .reply-form input { font-size: 16px; }

  .btn,
  .priority {
    padding: 9px 14px;
    font-size: 13px;
  }

  .item { padding: 12px; }
  .item-del { padding: 4px 8px; font-size: 18px; }
}
`,Ce=`
html[data-earmark-picking] * {
  cursor: crosshair !important;
}
html[data-earmark-picking="text"] * {
  cursor: text !important;
}
/* On a touchscreen the browser would scroll, zoom or long-press-select under the
   finger while picking. Text mode is exempt: native selection is the point there. */
html[data-earmark-picking="element"],
html[data-earmark-picking="region"] {
  touch-action: none;
}
html[data-earmark-picking="element"] *,
html[data-earmark-picking="region"] * {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
html[data-earmark-frozen] *,
html[data-earmark-frozen] *::before,
html[data-earmark-frozen] *::after {
  animation-play-state: paused !important;
  transition: none !important;
  scroll-behavior: auto !important;
}
`;function tt(e){let t=null,n=[],o=null,r=null,l=document.documentElement;function s(){let u=[];for(let p of Array.from(document.querySelectorAll("iframe")))if(!p.closest("#earmark-root"))try{let y=p.contentDocument;y&&y.documentElement&&u.push({el:p,doc:y})}catch{}return u}let i=[];function f(u){if(!u)return null;let p=u.ownerDocument;if(!p||p===document)return null;for(let y of s())if(y.doc===p)return y;return null}let b=u=>(typeof u.composedPath=="function"?u.composedPath():[]).some(y=>e.isOverlay(y))||e.isOverlay(u.target),h=u=>{let y=(u.target&&u.target.ownerDocument||document).elementFromPoint(u.clientX,u.clientY),A=0;for(;y&&y.tagName==="IFRAME"&&A<4;){A+=1;try{let M=y.contentDocument;if(!M)break;let te=y.getBoundingClientRect(),pe=M.elementFromPoint(u.clientX-te.left,u.clientY-te.top);if(!pe)break;y=pe}catch{break}}for(A=0;y&&y.shadowRoot&&A<8;){A+=1;let M=y.shadowRoot.elementFromPoint(u.clientX,u.clientY);if(!M||M===y)break;y=M}return!y||e.isOverlay(y)?null:y};function x(u){if(!t||b(u))return;if(t==="region"&&o){e.onRegionChange(et(o,{x:u.clientX,y:u.clientY}));return}if(t==="region")return;let p=h(u);p!==r&&(r=p,e.onHover(p))}function k(u){if(!(!t||b(u)||u.button!==0)){if(t==="region"){o={x:u.clientX,y:u.clientY},u.preventDefault(),u.stopPropagation();return}t==="element"&&(u.preventDefault(),u.stopPropagation())}}function v(u){if(t){if(t==="region"&&o){let p=et(o,{x:u.clientX,y:u.clientY});o=null,e.onRegionChange(null),u.preventDefault(),u.stopPropagation(),p.width>=8&&p.height>=8&&e.onPick({type:"region",rect:{x:p.x,y:p.y,width:p.width,height:p.height}},{x:u.clientX,y:u.clientY});return}if(t==="text"&&!b(u)){let p=window.getSelection();p&&!p.isCollapsed&&p.toString().trim()&&e.onPick({type:"text",selection:p},{x:u.clientX,y:u.clientY})}}}function E(u){if(!t||b(u)||(u.preventDefault(),u.stopPropagation(),u.stopImmediatePropagation(),t!=="element"))return;let p=h(u);if(!p)return;if(u.shiftKey){let A=n.indexOf(p);A>=0?n.splice(A,1):n.push(p),e.onPendingChange([...n]);return}let y=n.includes(p)?[...n]:[...n,p];n=[],e.onPendingChange([]),e.onPick({type:"elements",elements:y},{x:u.clientX,y:u.clientY})}function T(u){t&&u.key==="Escape"&&(u.preventDefault(),u.stopPropagation(),de(),e.onCancel())}function F(){t==="element"&&r&&e.onHover(r)}let R=(u,p)=>({clientX:p.clientX,clientY:p.clientY,target:u.target,shiftKey:!1,button:0,composedPath:()=>typeof u.composedPath=="function"?u.composedPath():[],preventDefault:()=>u.preventDefault(),stopPropagation:()=>u.stopPropagation(),stopImmediatePropagation:()=>u.stopImmediatePropagation?.()});function B(u){if(!t||u.touches.length!==1)return;let p=R(u,u.touches[0]);t==="element"&&x(p),k(p)}function X(u){if(!t||u.touches.length!==1)return;let p=R(u,u.touches[0]);t!=="text"&&u.cancelable&&u.preventDefault(),x(p)}function ue(u){if(!t)return;let p=u.changedTouches[0];if(!p)return;let y=R(u,p);v(y),t==="element"&&E(y)}let Y=[["mousemove",x],["mousedown",k],["mouseup",v],["click",E],["keydown",T],["touchstart",B],["touchmove",X],["touchend",ue]];function W(u){for(let[p,y]of Y){let A=p.startsWith("touch")?{capture:!0,passive:!1}:!0;u.addEventListener(p,y,A)}i.push(u)}function q(){for(let{doc:u}of s())i.includes(u)||W(u)}function U(){q()}function Q(){W(document),q(),window.addEventListener("scroll",F,!0),window.addEventListener("resize",F,!0),window.addEventListener("load",U,!0)}function ee(){for(let u of i){for(let[p,y]of Y)u.removeEventListener(p,y,!0);for(let[p,y]of Y)p.startsWith("touch")&&u.removeEventListener(p,y,{capture:!0})}i=[],window.removeEventListener("scroll",F,!0),window.removeEventListener("resize",F,!0),window.removeEventListener("load",U,!0)}function de(){n=[],o=null,r=null,e.onPendingChange([]),e.onRegionChange(null),e.onHover(null)}return Q(),{setMode(u){if(t!==u)if(t=u,de(),t){q(),l.setAttribute("data-earmark-picking",t);for(let{doc:p}of s())p.documentElement.setAttribute("data-earmark-picking",t)}else{l.removeAttribute("data-earmark-picking");for(let{doc:p}of s())p.documentElement.removeAttribute("data-earmark-picking")}},frameOf:f,sameOriginFrames:s,getMode:()=>t,clearPending:()=>{n=[],e.onPendingChange([])},destroy(){ee(),l.removeAttribute("data-earmark-picking")}}}function et(e,t){let n=Math.min(e.x,t.x),o=Math.min(e.y,t.y);return{x:n,y:o,width:Math.abs(e.x-t.x),height:Math.abs(e.y-t.y)}}function nt({endpoint:e,sessionId:t,onState:n,onEvent:o}){let r=e.replace(/\/$/,""),l=null,s="offline",i=1e3,f=null,b=!1;function h(v){s!==v&&(s=v,n(v))}async function x(v,E={}){let T=await fetch(r+v,{...E,headers:{"content-type":"application/json",...E.headers||{}}});if(!T.ok)throw new Error(`earmark: ${E.method||"GET"} ${v} \u2192 ${T.status}`);return T.status===204?null:T.json()}function k(){if(!(b||l)){h("connecting");try{l=new EventSource(`${r}/events?session=${encodeURIComponent(t)}`)}catch{h("error");return}l.onopen=()=>{i=1e3,h("connected")},l.onmessage=v=>{try{let E=JSON.parse(v.data);o(E)}catch{}},l.onerror=()=>{l?.close(),l=null,!b&&(h("error"),f=setTimeout(k,i),i=Math.min(i*2,3e4))}}}return{getState:()=>s,async connect(){try{return await x("/health"),k(),!0}catch{return h("offline"),f=setTimeout(()=>{b||this.connect()},i),i=Math.min(i*2,3e4),!1}},async list(){return x("/annotations")},async registerSession(v){return x("/session",{method:"POST",body:JSON.stringify({sessionId:t,page:v})})},async push(v,E){return x("/annotations",{method:"POST",body:JSON.stringify({sessionId:t,page:E,annotations:v})})},async patch(v,E){return x(`/annotations/${encodeURIComponent(v)}`,{method:"PATCH",body:JSON.stringify(E)})},async remove(v){return x(`/annotations/${encodeURIComponent(v)}`,{method:"DELETE"})},async reply(v,E,T="open"){return x(`/annotations/${encodeURIComponent(v)}/replies`,{method:"POST",body:JSON.stringify({author:"human",message:E,status:T})})},destroy(){b=!0,f&&clearTimeout(f),l?.close(),l=null,h("offline")}}}var Xt=["data-testid","data-test-id","data-test","data-cy","data-qa","data-pw"],Wt=["name","aria-label","aria-labelledby","placeholder","href","for","type","role","title","alt"],Ut=[/^(css|sc|emotion|jsx|svelte)-[a-z0-9]{4,}$/i,/^[\w-]+__[\w-]+___?[a-zA-Z0-9_-]{4,}$/,/^[\w-]+_[\w-]+__[a-zA-Z0-9]{4,}$/,/^_[a-zA-Z0-9]{6,}$/,/^[a-z]{1,3}[0-9a-f]{6,}$/i];function Kt(e){return!e||e.length>60?!0:Ut.some(t=>t.test(e))}function se(e){return Array.from(e.classList||[]).filter(n=>!Kt(n)).filter(n=>!n.startsWith("earmark-")).sort((n,o)=>o.length-n.length)}function be(e){return typeof CSS<"u"&&typeof CSS.escape=="function"?CSS.escape(e):String(e).replace(/([^\w-])/g,"\\$1")}function ae(e,t,n){try{let o=n.querySelectorAll(e);return o.length===1&&o[0]===t}catch{return!1}}function ie(e){for(let t of Xt){let n=e.getAttribute?.(t);if(n)return{attr:t,value:n,selector:`[${t}="${n.replace(/"/g,'\\"')}"]`}}return null}function Gt(e){let t=e.tagName.toLowerCase(),n=e.parentElement;if(e.id&&!/^\d/.test(e.id)&&!/[:.\s]/.test(e.id))return`${t}#${be(e.id)}`;let o=se(e).slice(0,2),r=t+o.map(s=>`.${be(s)}`).join("");if(!n)return r;if(Array.from(n.children).filter(s=>s.tagName!==e.tagName?!1:o.length?o.every(i=>s.classList.contains(i)):!0).length>1){let s=Array.from(n.children).filter(i=>i.tagName===e.tagName);r+=`:nth-of-type(${s.indexOf(e)+1})`}return r}function N(e,t={}){let{maxDepth:n=8}=t,o=t.root||e.getRootNode?.()||document;if(!e||e.nodeType!==1)return"";let r=ie(e);if(r&&ae(r.selector,e,o))return r.selector;if(e.id&&!/^\d/.test(e.id)){let b=`#${be(e.id)}`;if(ae(b,e,o))return b}let l=e.tagName.toLowerCase();for(let b of Wt){let h=e.getAttribute?.(b);if(!h||h.length>80)continue;let x=`${l}[${b}="${h.replace(/"/g,'\\"')}"]`;if(ae(x,e,o))return x}let s=[],i=e,f=0;for(;i&&i.nodeType===1&&f<n;){s.unshift(Gt(i));let b=s.join(" > ");if(ae(b,e,o))return b;let h=i.parentElement;if(h){let x=ie(h),k=x?x.selector:h.id&&!/^\d/.test(h.id)?`#${be(h.id)}`:null;if(k){let v=`${k} > ${s.join(" > ")}`;if(ae(v,e,o))return v}}i=h,f+=1}return Vt(e)}function Vt(e){let t=[],n=e;for(;n&&n.nodeType===1&&n!==document.documentElement;){let o=n.parentElement;if(!o)break;let r=Array.from(o.children).indexOf(n)+1;t.unshift(`${n.tagName.toLowerCase()}:nth-child(${r})`),n=o}return["html",...t].join(" > ")}function ye(e,t=6){let n=[],o=e;for(;o&&o.nodeType===1&&n.length<t;){let r=o.tagName.toLowerCase(),l=o.id?`#${o.id}`:"",s=l?"":se(o).slice(0,1).map(i=>`.${i}`).join("");n.unshift(r+l+s),o=o.parentElement}return n.join(" > ")}var Me="data-earmark-src",Jt="data-earmark-component",Te=new Set(["Fragment","Suspense","StrictMode","Profiler","ErrorBoundary","Provider","Consumer","ForwardRef","Memo","Router","Routes","Route","Outlet","AppRouter","Anonymous"]);function Zt(e){for(let t of Object.keys(e))if(t.startsWith("__reactFiber$")||t.startsWith("__reactInternalInstance$"))return e[t];return null}function it(e){if(!e||typeof e=="string")return null;if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="object"){if(e.displayName)return e.displayName;if(e.render)return e.render.displayName||e.render.name||null;if(e.type)return it(e.type)}return null}function Qt(e){if(!e||!e.fileName)return null;let t=e.fileName.replace(/^.*?\/(src|app|pages|components)\//,"$1/"),n=e.lineNumber??0,o=e.columnNumber??0;return o?`${t}:${n}:${o}`:`${t}:${n}`}function ot(e){let t=Zt(e);if(!t)return null;let n=[],o=null,r=t,l=0;for(;r&&l<60;){let s=it(r.type);s&&!Te.has(s)&&n[0]!==s&&n.unshift(s),o||(o=Qt(r._debugSource)),r=r.return,l+=1}return{components:n.slice(-8),source:o}}function rt(e){let t=e.__vueParentComponent;if(t){let o=[],r=0;for(;t&&r<60;){let s=t.type||{},i=s.__name||s.name||s.displayName;i&&!Te.has(i)&&o.unshift(i),!o.length&&s.__file&&o.unshift(en(s.__file)),t=t.parent,r+=1}let l=e.__vueParentComponent?.type?.__file||null;return{components:o.slice(-8),source:l}}let n=e.__vue__;if(n){let o=[],r=n,l=0;for(;r&&l<60;){let s=r.$options?.name||r.$options?._componentTag;s&&!Te.has(s)&&o.unshift(s),r=r.$parent,l+=1}return{components:o.slice(-8),source:n.$options?.__file||null}}return null}function en(e){return String(e).split("/").pop()?.replace(/\.\w+$/,"")||String(e)}function tn(e){if(!document.querySelector("[ng-version]"))return null;let t=[],n=e,o=0;for(;n&&o<20;){if(n.tagName&&n.tagName.includes("-")){let r=n.tagName.toLowerCase();t.includes(r)||t.unshift(r)}n=n.parentElement,o+=1}return t.length?{components:t.slice(-8),source:null}:null}function nn(e,t=5){let n=e,o=0;for(;n&&n.nodeType===1&&o<=t;){let r=n.getAttribute?.(Me);if(r)return{source:r,exact:o===0};n=n.parentElement,o+=1}return null}function at(e){let t=[],n=e;for(;n&&n.nodeType===1;){let o=n.getAttribute?.(Jt);o&&o!==t[0]&&t.unshift(o),n=n.parentElement}return t}function J(){if(typeof document>"u")return"unknown";if(document.querySelector("[ng-version]"))return"angular";if(window.__VUE__||document.querySelector("[data-v-app]"))return"vue";if(window.__svelte||document.querySelector('[class*="svelte-"]'))return"svelte";let e=document.body?.firstElementChild;return e&&Object.keys(e).some(t=>t.startsWith("__react"))||window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.size?"react":"unknown"}function D(e){let t=nn(e),n=[ot,rt,tn];for(let o of n){let r=null;try{r=o(e)}catch{r=null}if(r&&(r.components.length||r.source))return{framework:o===ot?"react":o===rt?"vue":"angular",components:r.components.length?r.components:at(e),source:t?.source||r.source||null,sourceExact:t?t.exact:!1}}return{framework:J(),components:at(e),source:t?.source||null,sourceExact:t?t.exact:!1}}var on=["display","position","flexDirection","justifyContent","alignItems","gap","gridTemplateColumns","padding","margin","border","borderRadius","color","backgroundColor","fontFamily","fontSize","fontWeight","lineHeight","letterSpacing","textAlign","opacity","overflow","zIndex","boxShadow","transform"],st=new Set(["none","normal","auto","rgba(0, 0, 0, 0)","0px","visible","static",""]),ct={flexDirection:"row",justifyContent:"normal",alignItems:"normal",gap:"normal",opacity:"1",fontWeight:"400",letterSpacing:"normal",textAlign:"start",boxShadow:"none"},rn={flexDirection:["flex","inline-flex"],justifyContent:["flex","inline-flex","grid","inline-grid"],alignItems:["flex","inline-flex","grid","inline-grid"],gap:["flex","inline-flex","grid","inline-grid"],gridTemplateColumns:["grid","inline-grid"]},an=["id","name","type","role","href","src","alt","title","placeholder","value","for","disabled","checked","aria-label","aria-describedby","aria-expanded","aria-hidden","contenteditable"],$=e=>Math.round(e*10)/10;function sn(e){let t=getComputedStyle(e),n=t.display,o={};for(let r of on){let l=rn[r];if(l&&!l.includes(n))continue;let s=t[r];if(s==null)continue;let i=String(s).trim();if(st.has(i)||i===ct[r])continue;let f=i.split(" ");f.length>1&&f.every(b=>b===f[0])&&(i=f[0]),r==="fontFamily"&&(i=i.split(",")[0].replace(/^["']|["']$/g,"")),!(st.has(i)||i===ct[r])&&(o[r]=i)}return o}function cn(e){let t={};for(let n of an){let o=e.getAttribute?.(n);o!=null&&o!==""&&(t[n]=Z(o,120))}for(let n of Array.from(e.attributes||[]))n.name.startsWith("data-")&&!n.name.startsWith("data-earmark")&&(t[n.name]=Z(n.value,120));return t}function Z(e,t){let n=String(e).replace(/\s+/g," ").trim();return n.length>t?`${n.slice(0,t-1)}\u2026`:n}function H(e,t=null){let n=e.getBoundingClientRect(),o=t?t.el.getBoundingClientRect():null,r=n.left+(o?o.left:0),l=n.top+(o?o.top:0);return{x:$(r),y:$(l),width:$(n.width),height:$(n.height),pageX:$(r+window.scrollX),pageY:$(l+window.scrollY)}}function ln(e,t=3){let n=[],o=e.parentElement;for(;o&&n.length<t&&o!==document.documentElement;){let r=D(o);n.push({tag:o.tagName.toLowerCase(),id:o.id||null,classes:se(o).slice(0,4),component:r.components.at(-1)||null,source:r.source}),o=o.parentElement}return n}function _e(e){let t=e.tagName.toLowerCase(),o=D(e).components.at(-1),r=ie(e);if(o)return`<${o}>`;if(r)return`${t}[${r.value}]`;let l=Z(e.textContent||"",28);if(l)return`${t} "${l}"`;let s=se(e)[0];return s?`${t}.${s}`:t}var un=[["three",()=>"THREE"in window],["chart.js",()=>"Chart"in window],["pixi",()=>"PIXI"in window],["d3",()=>"d3"in window],["fabric",()=>"fabric"in window],["konva",()=>"Konva"in window],["babylon",()=>"BABYLON"in window],["p5",()=>"p5"in window],["matter",()=>"Matter"in window],["phaser",()=>"Phaser"in window]];function dn(){for(let[e,t]of un)try{if(t())return e}catch{}return null}function pn(e){for(let t of["2d","webgl2","webgl","bitmaprenderer"])try{if(e.getContext(t))return t}catch{}return null}function lt(e,t,n){let o=e.getBoundingClientRect(),r=o.width?e.width/o.width:1,l=o.height?e.height/o.height:1,s=(f,b)=>({x:Math.round((f-o.left)*r),y:Math.round((b-o.top)*l)}),i={buffer:{width:e.width,height:e.height},css:{width:$(o.width),height:$(o.height)},scale:{x:$(r*100)/100,y:$(l*100)/100},devicePixelRatio:window.devicePixelRatio||1,context:pn(e),library:dn()};if(t&&(i.point=s(t.x,t.y)),n){let f=s(n.x,n.y);i.region={x:f.x,y:f.y,width:Math.round(n.width*r),height:Math.round(n.height*l)}}return i}function ce(e,t={}){let n=D(e),o=e.tagName==="CANVAS",r=t.frame||null;return{kind:"element",label:_e(e),tag:e.tagName.toLowerCase(),selector:N(e),testId:ie(e)?.value||null,domPath:ye(e),text:Z(e.textContent||"",200)||null,attributes:cn(e),classes:Array.from(e.classList||[]),rect:H(e,r),styles:sn(e),framework:n.framework,components:n.components,source:n.source,sourceExact:n.sourceExact,ancestors:ln(e),...o?{canvas:lt(e,t.point||null,null)}:{},...r?{frame:hn(r)}:{},...(()=>{let l=fn(e);return l?{shadow:l}:{}})()}}function fn(e){let t=[],n=e,o=null;for(;n;){let s=n.getRootNode?.();if(!s||!(s instanceof ShadowRoot))break;o=s.mode,t.unshift(N(s.host)),n=s.host}if(!t.length)return null;let r=N(e),l=t.map(s=>`querySelector('${s}').shadowRoot`).join(".");return{hosts:t,mode:o,expression:`document.${l}.querySelector('${r}')`}}function hn(e){let t=null;try{t=e.doc.location?.href||e.el.getAttribute("src")}catch{t=e.el.getAttribute("src")}return{selector:N(e.el),name:e.el.getAttribute("name")||e.el.getAttribute("id")||null,url:t,title:e.el.getAttribute("title")||null}}function ve(e){if(!e||e.rangeCount===0||e.isCollapsed)return null;let t=e.getRangeAt(0),n=t.commonAncestorContainer.nodeType===1?t.commonAncestorContainer:t.commonAncestorContainer.parentElement;if(!n)return null;let o=t.getBoundingClientRect();return{...ce(n),kind:"text",label:`text "${Z(e.toString(),28)}"`,selectedText:Z(e.toString(),500),rect:{x:$(o.left),y:$(o.top),width:$(o.width),height:$(o.height),pageX:$(o.left+window.scrollX),pageY:$(o.top+window.scrollY)}}}function we(e){let{x:t,y:n,width:o,height:r}=e,l=t+o,s=n+r,i=Array.from(document.body.querySelectorAll("*")),f=[];for(let h of i){if(h.closest("#earmark-root"))continue;let x=h.getBoundingClientRect();if(x.width===0||x.height===0)continue;let k=Math.min(l,x.right)-Math.max(t,x.left),v=Math.min(s,x.bottom)-Math.max(n,x.top);k<=0||v<=0||k*v/(x.width*x.height)<.6||f.push(h)}let b=f.filter(h=>!f.some(x=>x!==h&&x.contains(h)));return{kind:"region",label:`region ${Math.round(o)}\xD7${Math.round(r)}`,rect:{x:$(t),y:$(n),width:$(o),height:$(r),pageX:$(t+window.scrollX),pageY:$(n+window.scrollY)},framework:J(),elements:b.slice(0,12).map(h=>({label:_e(h),selector:N(h),source:D(h).source,rect:H(h)})),emptyRegion:b.length===0,...b.length===0?mn(e):{}}}function mn(e){let t={x:e.x+e.width/2,y:e.y+e.height/2},n=document.elementFromPoint(t.x,t.y);if(!n||n.closest?.("#earmark-root"))return{};let o={label:_e(n),tag:n.tagName.toLowerCase(),selector:N(n),source:D(n).source,rect:H(n)};return n.tagName==="CANVAS"&&(o.canvas=lt(n,t,e)),{container:o}}function z(){return{url:location.href,path:location.pathname,title:document.title,viewport:{width:window.innerWidth,height:window.innerHeight},devicePixelRatio:window.devicePixelRatio,scroll:{x:Math.round(window.scrollX),y:Math.round(window.scrollY)},colorScheme:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light",framework:J(),userAgent:navigator.userAgent}}function gn(e){return Object.entries(e||{}).map(([t,n])=>`${xn(t)}: ${n}`).join("; ")}var xn=e=>e.replace(/[A-Z]/g,t=>`-${t.toLowerCase()}`),bn=(e,t)=>{let n=String(e).replace(/\s+/g," ").trim();return n.length>t?`${n.slice(0,t-1)}\u2026`:n},ut=e=>e?`${Math.round(e.width)}\xD7${Math.round(e.height)} at (${Math.round(e.pageX??e.x)}, ${Math.round(e.pageY??e.y)})`:"";function yn(e){let t=[];if(e.kind==="region"){if(t.push(`- **Target:** screen region ${ut(e.rect)}`),e.emptyRegion){if(t.push("- **Contents:** no elements fully inside this region"),e.container){let s=e.container.source?` \u2014 \`${e.container.source}\``:"";t.push(`- **Drawn on:** ${e.container.label} \u2192 \`${e.container.selector}\`${s}`),t.push(...dt(e.container.canvas))}}else{t.push("- **Elements inside:**");for(let s of e.elements||[]){let i=s.source?` \u2014 \`${s.source}\``:"";t.push(`  - ${s.label} \u2192 \`${s.selector}\`${i}`)}}return t}let n=e.tag?`\`<${e.tag}>\` `:"";if(t.push(`- **Element:** ${n}${e.label}`),t.push(`- **Selector:** \`${e.selector}\``),e.shadow&&(t.push(`- **Inside shadow DOM:** ${e.shadow.hosts.map(s=>`\`${s}\``).join(" \u203A ")}`),t.push(`  - reach it with: \`${e.shadow.expression}\``),t.push("  - the selector above is unique inside that shadow root, not in the document")),e.frame){let s=e.frame.name?` (${e.frame.name})`:"";t.push(`- **Inside iframe:** \`${e.frame.selector}\`${s}`),e.frame.url&&t.push(`  - frame document: ${e.frame.url}`),t.push("  - the selector above resolves inside that frame, not the top page")}if(e.source){let s=e.sourceExact===!1?" _(nearest stamped ancestor)_":e.sourceExact&&e.sourceFrom==="html"?" _(resolved from the served HTML)_":"";t.push(`- **Source:** \`${e.source}\`${s}`)}if(e.cssRules?.length){t.push("- **CSS rules that style it:**");for(let s of e.cssRules){let i=s.line?`${s.file}:${s.line}`:s.file,f=s.condition?` \`@media ${s.condition}\``:"";t.push(`  - \`${s.selector}\` \u2192 \`${i}\`${f}`),s.declarations&&t.push(`    - ${bn(s.declarations,240)}`)}}e.components?.length&&t.push(`- **Component path:** ${e.components.join(" \u203A ")}`),e.kind==="text"&&e.selectedText?t.push(`- **Selected text:** "${e.selectedText}"`):e.text&&t.push(`- **Text:** "${e.text}"`),e.testId&&t.push(`- **Test id:** \`${e.testId}\``);let o=ut(e.rect);o&&t.push(`- **Box:** ${o}`),t.push(...dt(e.canvas));let r=gn(e.styles);r&&t.push(`- **Computed:** ${r}`);let l=Object.entries(e.attributes||{}).filter(([s])=>s!=="id").map(([s,i])=>`${s}="${i}"`).join(" ");if(l&&t.push(`- **Attributes:** ${l}`),e.ancestors?.length){let s=e.ancestors.map(i=>{let f=i.component?i.component:i.tag+(i.id?`#${i.id}`:i.classes?.length?`.${i.classes[0]}`:"");return i.source?`${f} (\`${i.source}\`)`:f}).join(" \u2190 ");t.push(`- **Ancestors:** ${s}`)}return e.source||t.push(`- **DOM path:** \`${e.domPath}\``),t}function dt(e){if(!e)return[];let t=["- **Canvas:**"];return t.push(`  - buffer ${e.buffer.width}\xD7${e.buffer.height}, CSS ${e.css.width}\xD7${e.css.height} (${e.scale.x}\xD7 / ${e.scale.y}\xD7 per CSS pixel, dpr ${e.devicePixelRatio})`),e.context&&t.push(`  - context: \`${e.context}\``),e.library&&t.push(`  - renderer: ${e.library}`),e.point&&t.push(`  - clicked at buffer pixel (${e.point.x}, ${e.point.y})`),e.region&&t.push(`  - region in buffer pixels: ${e.region.width}\xD7${e.region.height} at (${e.region.x}, ${e.region.y})`),t.push("  - nothing inside a canvas is in the DOM; these coordinates are the handle"),t}function Le(e,t=1){let o=[e.note?.trim()?`### ${t}. ${e.note.trim()}`:`### ${t}. ${e.target?.label??"Annotation"}`,""];e.id&&o.push(`- **Annotation id:** \`${e.id}\``),e.priority&&e.priority!=="normal"&&o.push(`- **Priority:** ${e.priority}`),e.status&&e.status!=="open"&&o.push(`- **Status:** ${e.status}`);let r=e.targets?.length?e.targets:[e.target];if(r.filter(Boolean).forEach((l,s)=>{r.length>1&&o.push(`- **Target ${s+1}:**`),o.push(...yn(l).map(i=>r.length>1?`  ${i}`:i))}),e.replies?.length){o.push("- **Thread:**");for(let l of e.replies)o.push(`  - _${l.author}_: ${l.message}`)}return o.push(""),o.join(`
`)}function ke(e,t,n={}){let{instructions:o=!0}=n,r=[];return r.push(`## UI feedback \u2014 ${e.length} annotation${e.length===1?"":"s"}`),r.push(""),t&&(r.push(`- **Page:** ${t.url}`),t.viewport&&r.push(`- **Viewport:** ${t.viewport.width}\xD7${t.viewport.height} @${t.devicePixelRatio}x, ${t.colorScheme} mode`),t.framework&&t.framework!=="unknown"&&r.push(`- **Framework:** ${t.framework}`),t.scroll&&(t.scroll.x||t.scroll.y)&&r.push(`- **Scroll:** ${t.scroll.x}, ${t.scroll.y}`),r.push("")),e.forEach((l,s)=>r.push(Le(l,s+1))),o&&(r.push("---"),r.push(""),r.push("Locate each element by its **Source** path when present; otherwise grep for the selector, test id, or quoted text. Coordinates are page coordinates in CSS pixels. Apply the change described in each heading."),r.push("")),r.join(`
`)}var vn=new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]),wn=new Set(["script","style","textarea","title"]),kn=new Set(["tbody","head","body"]),Sn=10,Oe=new Map,Re=new Map;function pt(){try{Se(location.href);for(let e of Array.from(document.querySelectorAll("iframe")))try{let t=le(e.contentDocument);t&&Se(t)}catch{}}catch{}}function ft(e){let t=[0];for(let n=0;n<e.length;n+=1)e[n]===`
`&&t.push(n+1);return n=>{let o=0,r=t.length-1;for(;o<r;){let l=o+r+1>>1;t[l]<=n?o=l:r=l-1}return{line:o+1,column:n-t[o]+1}}}function $n(e,t){let n=null;for(let o=t+1;o<e.length;o+=1){let r=e[o];if(n)r===n&&(n=null);else if(r==='"'||r==="'")n=r;else if(r===">")return o}return e.length}function En(e){let t={tag:"#document",offset:0,children:[]},n=[t],o=0;for(;o<e.length;){let r=e.indexOf("<",o);if(r===-1)break;if(e.startsWith("<!--",r)){let h=e.indexOf("-->",r);o=h===-1?e.length:h+3;continue}if(e.startsWith("<!",r)||e.startsWith("<?",r)){let h=e.indexOf(">",r);o=h===-1?e.length:h+1;continue}if(e.startsWith("</",r)){let h=e.indexOf(">",r),x=e.slice(r+2,h===-1?e.length:h).trim().toLowerCase();for(let k=n.length-1;k>0;k-=1)if(n[k].tag===x){n.length=k;break}o=h===-1?e.length:h+1;continue}let l=$n(e,r),s=e.slice(r+1,l),i=(s.match(/^[a-zA-Z][^\s/>]*/)||[""])[0].toLowerCase();if(!i){o=r+1;continue}let f={tag:i,offset:r,children:[]};if(n[n.length-1].children.push(f),!s.trimEnd().endsWith("/")&&!vn.has(i)){if(wn.has(i)){let h=e.toLowerCase().indexOf(`</${i}`,l);o=h===-1?e.length:h;continue}n.push(f)}o=l+1}return t}function An(e){let t=[],n=e,o=e.ownerDocument?.documentElement;for(;n&&n!==o;){let r=n.parentElement;if(!r)return null;t.unshift({index:Array.prototype.indexOf.call(r.children,n),tag:n.tagName.toLowerCase()}),n=r}return t}function Se(e){return Oe.has(e)||Oe.set(e,fetch(e,{credentials:"same-origin"}).then(t=>{let n=t.headers.get("content-type")||"";return!t.ok||!n.includes("html")?null:t.text()}).then(t=>t?{source:t,tree:En(t),at:ft(t)}:null).catch(()=>null)),Oe.get(e)}async function Cn(e){let t=An(e);if(!t)return null;let n=le(e.ownerDocument);if(!n)return null;let o=await Se(n);if(!o)return null;let r=o.tree.children.find(i=>i.tag==="html");if(!r)return null;for(let i of t){let f=r.children[i.index];if(f&&f.tag===i.tag){r=f;continue}if(!kn.has(i.tag))return null}let{line:l,column:s}=o.at(r.offset);return{source:Ne(n),line:l,column:s}}function le(e){try{return e?.location?.href||null}catch{return null}}function ht(e){return e.replace(/\/\*[\s\S]*?\*\//g,"").replace(/\s+/g," ").replace(/\s*([>+~,])\s*/g,"$1").trim()}function Pe(e,t=0){let n=ft(e),o=new Map,r=0,l=0;for(;r<e.length;){let s=e[r];if(s==="/"&&e[r+1]==="*"){let i=e.slice(l,r),f=e.indexOf("*/",r);r=f===-1?e.length:f+2,i.trim()||(l=r);continue}if(s==="{"){let i=e.slice(l,r),f=ht(i);if(f&&!f.startsWith("@")){let b=i.length-i.trimStart().length,{line:h}=n(l+b),x=o.get(f)||[];x.push(h+t),o.set(f,x)}r+=1,l=r;continue}if(s==="}"||s===";"){r+=1,l=r;continue}r+=1}return o}function Tn(e,t=document){let n=le(t)||"top",o=e.href||`inline:${n}#${e.ownerNode?.getAttribute?.("data-earmark-sheet")||Mn(e,t)}`;if(Re.has(o))return Re.get(o);let r;if(!e.href&&e.ownerNode?.textContent){let l=e.ownerNode.textContent;r=Se(le(t)||"").then(s=>{let i=0;if(s){let f=l.slice(0,200),b=f?s.source.indexOf(f):-1;b>=0&&(i=s.at(b).line-1)}return Pe(l,i)}).catch(()=>Pe(l))}else e.href?r=fetch(e.href,{credentials:"same-origin"}).then(l=>l.ok?l.text():null).then(l=>l?Pe(l):null).catch(()=>null):r=Promise.resolve(null);return Re.set(o,r),r}function Mn(e,t=document){return Array.prototype.indexOf.call(t.styleSheets,e)}function Ne(e){try{let t=new URL(e,location.href);if(t.origin!==location.origin)return e;let n=t.pathname.replace(/^\//,"");return!n||n.endsWith("/")?`${n}index.html`:n}catch{return e}}async function _n(e){let t=[],n=e.ownerDocument||document,o=le(n);for(let r of Array.from(n.styleSheets)){if(r.ownerNode?.id==="earmark-host-css")continue;let l;try{l=r.cssRules}catch{continue}if(!l)continue;let s=r.href?Ne(r.href):`${Ne(o||"")} (inline <style>)`,i=await Tn(r,n),f=new Map;mt(l,e,null,(b,h)=>{let x=ht(b.selectorText),k=null;if(i?.has(x)){let v=i.get(x),E=f.get(x)||0;k=v[Math.min(E,v.length-1)]??null,f.set(x,E+1)}t.push({file:s,line:k,selector:b.selectorText,condition:h,declarations:b.style?.cssText||""})})}return t.slice(-Sn)}function mt(e,t,n,o){for(let r of Array.from(e)){let l=r.selectorText;if(l)try{t.matches(l)&&o(r,n)}catch{}let s=r.cssRules;if(!s||s.length===0)continue;let i=r.conditionText||r.media?.mediaText,f=l?n:[n,i].filter(Boolean).join(" and ")||null;mt(s,t,f,o)}}async function gt(e){let[t,n]=await Promise.all([Cn(e).catch(()=>null),_n(e).catch(()=>[])]);return{html:t,css:n}}var xt="earmark-root",Ln="earmark-host-css",bt="earmark:annotations",yt="earmark:session",On={pick:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.5 18 2.2-7.3L20 11.5z"/></svg>',text:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6V4h16v2M12 4v16M9 20h6"/></svg>',region:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3"/></svg>',freeze:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11"/></svg>',list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>'};function m(e,t={},...n){let o=document.createElement(e);for(let[r,l]of Object.entries(t))r==="class"?o.className=l:r==="html"?o.innerHTML=l:r.startsWith("on")&&typeof l=="function"?o.addEventListener(r.slice(2).toLowerCase(),l):l!=null&&l!==!1&&o.setAttribute(r,l===!0?"":String(l));for(let r of n.flat())r==null||r===!1||o.append(r instanceof Node?r:document.createTextNode(String(r)));return o}var Ie=()=>(crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36)).replace(/-/g,"").slice(0,10);function vt(e){let{endpoint:t=null,hotkey:n="alt+a",theme:o="auto",persist:r=!0,onAnnotate:l=null}=e;if(document.getElementById(xt))throw new Error("earmark: an overlay is already mounted on this page");let s=(()=>{try{let a=sessionStorage.getItem(yt);if(a)return a;let c=Ie();return sessionStorage.setItem(yt,c),c}catch{return Ie()}})(),i=r?Dt():[],f=null,b=!1,h=!1,x=null,k=m("div",{id:xt});o!=="auto"&&k.setAttribute("data-theme",o);let v=k.attachShadow({mode:"open"});v.append(m("style",{html:Qe}));let E=m("style",{id:Ln,html:Ce});document.head.append(E);let T=m("div",{class:"layer-page"}),F=m("div",{class:"highlight-label"}),R=m("div",{class:"highlight"},F),B=m("div",{class:"marquee"}),X=m("div",{class:"toast"}),ue=m("div",{class:"sync-dot","data-state":"offline"}),Y=m("div",{class:"count","data-empty":"true"},"0"),W=ne("pick","Pick element  (click, shift-click to multi-select)"),q=ne("text","Select text"),U=ne("region","Drag a region"),Q=ne("freeze","Freeze animations and transitions"),ee=ne("list","Annotations"),de=m("div",{class:"toolbar"},ue,W,q,U,m("div",{class:"tool-divider"}),Q,m("div",{class:"tool-divider"}),ee,Y),u=m("textarea",{placeholder:"What should change here?",rows:"3",spellcheck:"false"}),p=m("div",{class:"popover-target"}),y=m("select",{class:"priority",title:"Priority"},m("option",{value:"normal"},"Normal"),m("option",{value:"high"},"High"),m("option",{value:"low"},"Low")),A=m("div",{class:"popover"},p,u,m("div",{class:"popover-actions"},y,m("span",{class:"hint"},"\u2318\u21B5 save"),m("button",{class:"btn",onclick:ze},"Cancel"),m("button",{class:"btn btn-primary",onclick:je},"Add"))),M=m("div",{class:"panel-list"}),te=m("div",{class:"panel"},m("div",{class:"panel-head"},m("div",{class:"panel-title"},"Annotations"),m("button",{class:"btn",onclick:()=>re(!1)},"Close")),M,m("div",{class:"panel-foot"},m("button",{class:"btn btn-primary",onclick:Ke},"Copy markdown"),m("button",{class:"btn",onclick:We},"Clear"))),pe=m("div",{class:"layer-fixed"},R,B,de,te,A,X);v.append(T,pe),document.body.append(k);function ne(a,c){return m("button",{class:"tool",title:c,"aria-pressed":"false",html:On[a]})}let _=t?nt({endpoint:t,sessionId:s,onState:a=>ue.setAttribute("data-state",a),onEvent:$t}):null;_&&_.connect().then(a=>{a&&St()});async function St(){if(_)try{await _.registerSession(z());let{annotations:a}=await _.list(),c=new Map(a.map(g=>[g.id,g])),d=i.filter(g=>!c.has(g.id));i=i.map(g=>{let w=c.get(g.id);return w?{...g,status:w.status,replies:w.replies||[]}:g}),P(),L(),d.length&&await _.push(d,z())}catch{}}function $t(a){let{type:c,data:d}=a;if(c==="annotation.updated"&&d?.id){let g=i.findIndex(w=>w.id===d.id);g>=0&&(i[g]={...i[g],...d},P(),L(),d.status==="acknowledged"&&O("Agent picked this up"),d.status==="needs-input"&&O("Agent asked a question"),d.status==="resolved"&&O("Agent resolved an annotation"));return}if(c==="annotation.deleted"&&d?.id){i=i.filter(g=>g.id!==d.id),P(),L();return}c==="annotations.cleared"&&(i=[],P(),L())}let I=tt({isOverlay:a=>a===k||a instanceof Node&&(k.contains(a)||a.getRootNode?.()===v),onHover:a=>{if(!a)return fe();let c=a.getBoundingClientRect();De(c,Et(a))},onPendingChange:a=>{At(a)},onRegionChange:a=>{if(!a){B.style.display="none";return}Object.assign(B.style,{display:"block",left:`${a.x}px`,top:`${a.y}px`,width:`${a.width}px`,height:`${a.height}px`})},onPick:(a,c)=>Ct(a,c),onCancel:()=>K(null)});function Et(a){let c=a.tagName.toLowerCase(),d=a.id?`#${a.id}`:"",g=Array.from(a.classList).filter(S=>!S.startsWith("earmark-")).slice(0,2).map(S=>`.${S}`).join(""),w=a.getBoundingClientRect();return`${c}${d}${g}  ${Math.round(w.width)}\xD7${Math.round(w.height)}`}function De(a,c){let d="top"in a?a.top:a.y,g="left"in a?a.left:a.x;Object.assign(R.style,{left:`${g}px`,top:`${d}px`,width:`${a.width}px`,height:`${a.height}px`}),R.setAttribute("data-visible","true"),R.setAttribute("data-flip",d<26?"true":"false"),F.textContent=c}function fe(){R.setAttribute("data-visible","false")}let $e=[];function At(a){$e.forEach(c=>c.remove()),$e=a.map(c=>{let d=H(c),g=m("div",{class:"pin-box"});return Object.assign(g.style,{left:`${d.pageX}px`,top:`${d.pageY}px`,width:`${d.width}px`,height:`${d.height}px`}),T.append(g),g})}function Ct(a,c){let d=[];if(a.type==="elements")d=a.elements.map(S=>ce(S,{point:c,frame:I.frameOf(S)}));else if(a.type==="text"){let S=ve(a.selection);if(!S)return;d=[S]}else a.type==="region"&&(d=[we(a.rect)]);if(!d.length)return;f={targets:d,point:c};let g=d.map(S=>S.label).join(", "),w=d.find(S=>S.source)?.source;p.innerHTML="",p.append(m("b",{},g)),w&&p.append(document.createTextNode(`  ${w}`)),u.value="",y.value="normal",A.setAttribute("data-open","true"),Tt(c),fe(),u.focus()}function Tt(a){let d=A.offsetHeight||150,g=Math.min(Math.max(8,a.x+12),window.innerWidth-320-8),w=Math.min(Math.max(8,a.y+12),window.innerHeight-d-8);A.style.left=`${g}px`,A.style.top=`${w}px`}function ze(){f=null,A.setAttribute("data-open","false"),I.clearPending()}async function je(){if(!f)return;let a={id:Ie(),note:u.value.trim(),status:"open",priority:y.value,createdAt:new Date().toISOString(),page:z(),targets:f.targets,replies:[]};i.push(a),f=null,A.setAttribute("data-open","false"),I.clearPending(),P(),L(),await Mt(a),P(),_?.push([a],a.page).catch(()=>{}),l?.(a)}async function Mt(a){await Promise.all(a.targets.map(async c=>{if(!c.selector||c.shadow)return;let d=ge(c);if(c.frame&&!d)return;let g=d?Xe(d.doc,c.selector):Be(c.selector);if(!g)return;let{html:w,css:S}=await gt(g);w&&!c.source&&(c.source=`${w.source}:${w.line}:${w.column}`,c.sourceExact=!0,c.sourceFrom="html"),S.length&&(c.cssRules=S)}))}u.addEventListener("keydown",a=>{a.key==="Enter"&&(a.metaKey||a.ctrlKey)&&(a.preventDefault(),je()),a.key==="Escape"&&(a.preventDefault(),ze()),a.stopPropagation()});function K(a){let d=I.getMode()===a?null:a;I.setMode(d),W.setAttribute("aria-pressed",String(d==="element")),q.setAttribute("aria-pressed",String(d==="text")),U.setAttribute("aria-pressed",String(d==="region")),d||(fe(),B.style.display="none")}W.addEventListener("click",()=>K("element")),q.addEventListener("click",()=>K("text")),U.addEventListener("click",()=>K("region")),ee.addEventListener("click",()=>re()),Q.addEventListener("click",()=>Fe(!h));let Ee=[],he=[],oe=null,me=[];function Fe(a){if(h=a,Q.setAttribute("aria-pressed",String(a)),!a){document.documentElement.removeAttribute("data-earmark-frozen");for(let c of me)c.documentElement.removeAttribute("data-earmark-frozen"),c.getElementById("earmark-host-css")?.remove();me=[],oe&&clearInterval(oe),oe=null;for(let c of Ee)try{c.play()}catch{}for(let c of he)c.play().catch(()=>{});Ee=[],he=[],O("Resumed");return}document.documentElement.setAttribute("data-earmark-frozen",""),Ye(),oe=setInterval(Ye,500),oe.unref?.(),O("Frozen \u2014 animations and media paused")}function Ye(){qe(document);for(let{doc:a}of I.sameOriginFrames()){if(!me.includes(a)){let c=a.createElement("style");c.id="earmark-host-css",c.textContent=Ce,a.head?.append(c),a.documentElement.setAttribute("data-earmark-frozen",""),me.push(a)}qe(a)}}function qe(a){if(typeof a.getAnimations=="function")for(let c of a.getAnimations()){let d=c.effect?.target;if(!(d&&(d===k||k.contains(d)||d.getRootNode?.()===v))&&c.playState==="running")try{c.pause(),Ee.push(c)}catch{}}for(let c of Array.from(a.querySelectorAll("video, audio"))){let d=c;d.paused||he.includes(d)||(d.pause(),he.push(d))}}function re(a){b=a??!b,te.setAttribute("data-open",String(b)),ee.setAttribute("aria-pressed",String(b)),b&&L()}function L(){Y.textContent=String(i.length),Y.setAttribute("data-empty",String(i.length===0)),He(),b&&Ot()}function _t(a){if(a.shadow){let c=Lt(a);return c?H(c,ge(a)):a.rect}if(a.selector)try{let c=ge(a),g=(c?c.doc:document).querySelector(a.selector);if(g)return H(g,c)}catch{}return a.rect}function Lt(a){try{let c=ge(a)?.doc||document;for(let d of a.shadow.hosts){let g=c.querySelector(d);if(!g?.shadowRoot)return null;c=g.shadowRoot}return c.querySelector(a.selector)}catch{return null}}function ge(a){if(!a?.frame)return null;let c=I.sameOriginFrames();for(let d of c)if(a.frame.selector)try{if(d.el===document.querySelector(a.frame.selector))return d}catch{}for(let d of c)try{if(a.frame.url&&d.doc.location?.href===a.frame.url)return d}catch{}return null}function He(){T.innerHTML="",$e=[],i.forEach((a,c)=>{a.targets.forEach((d,g)=>{let w=_t(d),S=m("div",{class:"pin-box"});if(Object.assign(S.style,{left:`${w.pageX}px`,top:`${w.pageY}px`,width:`${w.width}px`,height:`${w.height}px`}),T.append(S),g>0)return;let C=m("div",{class:"pin","data-status":a.status,title:a.note||d.label,onclick:()=>{re(!0),Rt(a.id)}},String(c+1));Object.assign(C.style,{left:`${w.pageX}px`,top:`${w.pageY}px`}),T.append(C)})})}function Ot(){if(M.innerHTML="",!i.length){M.append(m("div",{class:"panel-empty"},"No annotations yet. Click the arrow, then click anything on the page."));return}i.forEach((a,c)=>{let d=a.targets[0],g=d.source?d.source:d.selector||`${d.elements?.length??0} elements`,w=m("div",{class:"item","data-status":a.status,"data-id":a.id,onclick:()=>Pt(a)},m("div",{class:"item-head"},m("div",{class:"item-index"},String(c+1)),m("div",{class:"item-note"},a.note||d.label),a.priority&&a.priority!=="normal"?m("span",{class:"item-priority","data-priority":a.priority},a.priority):null,m("button",{class:"item-del",title:"Delete",onclick:S=>{S.stopPropagation(),Nt(a.id)}},"\xD7")),m("div",{class:"item-meta"},g));if(a.replies?.length){let S=m("div",{class:"item-thread"});for(let C of a.replies)S.append(m("div",{class:"reply","data-author":C.author},m("b",{},`${C.author}: `),C.message));if(a.status==="needs-input"){let C=m("input",{placeholder:"Answer the agent\u2026","data-reply-for":a.id});C.addEventListener("click",xe=>xe.stopPropagation()),C.addEventListener("keydown",xe=>{xe.stopPropagation(),!(xe.key!=="Enter"||!C.value.trim())&&(It(a.id,C.value.trim()),C.value="")}),C.addEventListener("focus",()=>x=a.id),C.addEventListener("blur",()=>{x===a.id&&(x=null)}),S.append(m("div",{class:"reply-form"},C))}w.append(S)}M.append(w)}),x&&M.querySelector(`input[data-reply-for="${x}"]`)?.focus()}function Rt(a){M.querySelector(`.item[data-id="${a}"]`)?.scrollIntoView({block:"nearest"})}function Pt(a){let c=a.targets[0],d=c.selector?Be(c.selector):null;if(d){d.scrollIntoView({block:"center",behavior:"smooth"});let g=d.getBoundingClientRect();De(g,a.note||c.label),setTimeout(fe,1400)}else window.scrollTo({top:Math.max(0,c.rect.pageY-150),behavior:"smooth"})}function Be(a){return Xe(document,a)}function Xe(a,c){try{return a.querySelector(c)}catch{return null}}function Nt(a){i=i.filter(c=>c.id!==a),P(),L(),_?.remove(a).catch(()=>{})}function We(){if(!i.length)return;let a=i.map(c=>c.id);i=[],P(),L(),a.forEach(c=>_?.remove(c).catch(()=>{}))}function It(a,c){let d=i.find(g=>g.id===a);d&&(d.replies=[...d.replies||[],{author:"human",message:c,at:new Date().toISOString()}],d.status="open",P(),L(),_?.reply(a,c,"open").catch(()=>{}))}function Ue(){return ke(i,z())}async function Ke(){if(!i.length)return O("Nothing to copy");let a=Ue();try{await navigator.clipboard.writeText(a),O(`Copied ${i.length} annotation${i.length===1?"":"s"}`)}catch{let c=m("textarea",{});c.value=a,document.body.append(c),c.select(),document.execCommand("copy"),c.remove(),O("Copied")}}function O(a){X.textContent=a,X.setAttribute("data-show","true"),clearTimeout(O._timer),O._timer=setTimeout(()=>X.setAttribute("data-show","false"),1800)}function P(){if(r)try{sessionStorage.setItem(bt,JSON.stringify(i))}catch{}}function Dt(){try{let a=sessionStorage.getItem(bt),c=a?JSON.parse(a):[];return Array.isArray(c)?c:[]}catch{return[]}}let G=n.toLowerCase().split("+"),zt=G.at(-1);function Ge(a){let c=G.includes("alt"),d=G.includes("meta")||G.includes("cmd"),g=G.includes("ctrl"),w=G.includes("shift");a.key.toLowerCase()===zt&&a.altKey===c&&a.metaKey===d&&a.ctrlKey===g&&a.shiftKey===w&&(a.preventDefault(),K("element"))}window.addEventListener("keydown",Ge);let Ve=()=>{i.length&&He()};window.addEventListener("resize",Ve);let Je=location.pathname+location.search,Ze=null;function V(){let a=location.pathname+location.search;a!==Je&&(Je=a,_?.registerSession(z()).catch(()=>{}))}if(_){window.addEventListener("popstate",V),window.addEventListener("hashchange",V);let a=history.pushState,c=history.replaceState;history.pushState=function(...g){let w=a.apply(this,g);return queueMicrotask(V),w},history.replaceState=function(...g){let w=c.apply(this,g);return queueMicrotask(V),w},Ze=()=>{history.pushState=a,history.replaceState=c}}return L(),pt(),{get annotations(){return i.map(a=>({...a}))},markdown:Ue,copy:Ke,clear:We,setMode:K,openPanel:()=>re(!0),closePanel:()=>re(!1),sessionId:s,destroy(){h&&Fe(!1),I.destroy(),_?.destroy(),Ze?.(),window.removeEventListener("keydown",Ge),window.removeEventListener("resize",Ve),window.removeEventListener("popstate",V),window.removeEventListener("hashchange",V),document.documentElement.removeAttribute("data-earmark-frozen"),E.remove(),k.remove()}}}var wt="http://127.0.0.1:7331",j=null;function kt(e={}){if(typeof window>"u"||typeof document>"u")throw new Error("earmark: createEarmark() must run in a browser");if(j)return j;let t=e.endpoint===!1?null:e.endpoint??wt,n=()=>(j=vt({...e,endpoint:t}),window.earmark=j,j);if(document.body)return n();let o={pending:!0};return document.addEventListener("DOMContentLoaded",n,{once:!0}),o}function Rn(){j?.destroy(),j=null,delete window.earmark}function Pn(){return j}if(typeof document<"u"){let e=document.currentScript||document.querySelector("script[data-earmark-auto]");e&&e.hasAttribute("data-earmark-auto")&&kt({endpoint:e.getAttribute("data-endpoint")??void 0,hotkey:e.getAttribute("data-hotkey")??void 0,theme:e.getAttribute("data-theme")??void 0})}return Bt(Nn);})();
Earmark.createEarmark({endpoint:"http://127.0.0.1:7331"})
