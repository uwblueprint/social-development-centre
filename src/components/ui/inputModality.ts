/**
 * Active vs focused for text fields. A click or tap into an input is "active": a quiet 1px border, no ring.
 * Arriving by keyboard (Tab, Shift+Tab, arrow keys outside a text field) is "focused": the kit focus ring.
 * Browsers match :focus-visible for text inputs even on a click, so CSS alone can't tell them apart.
 *
 * This script sets `data-input-modality="keyboard" | "pointer"` on <html>. tokens.ts turns it into
 * --focus-ring-text (the ring, or nothing), which every kit text control uses. It is inlined in the
 * root layout's <head> so it runs on every page before hydration. No React, no per-use code.
 *
 * Typing or moving the caret inside a text field never counts as keyboard arrival (the ring must not
 * appear mid-edit); only Tab does there. A script that moves focus keeps whichever modality came last.
 */
export const inputModalityScript = `(function(){
var d=document,r=d.documentElement;
function set(m){if(r.getAttribute("data-input-modality")!==m)r.setAttribute("data-input-modality",m)}
function textEntry(t){
if(!t||!t.closest)return false;
if(t.isContentEditable||t.tagName==="TEXTAREA")return true;
if(t.tagName!=="INPUT")return false;
return !/^(button|submit|reset|checkbox|radio|range|color|file|image)$/.test(t.type);
}
d.addEventListener("keydown",function(e){
if(e.key==="Tab"){set("keyboard");return}
if(e.metaKey||e.ctrlKey||e.altKey||e.key==="Shift"||e.key==="Control"||e.key==="Alt"||e.key==="Meta")return;
if(!textEntry(e.target))set("keyboard");
},true);
d.addEventListener("pointerdown",function(){set("pointer")},true);
set("pointer");
})();`;
