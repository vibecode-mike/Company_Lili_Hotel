/**
 * Lili Hotel AI Chatbot - Embeddable Widget (iframe version)
 *
 * Usage:
 *   <script src="https://crmpoc.star-bit.io/api/v1/widget/lili-chatbot.js"></script>
 *
 * Options (data attributes on the script tag):
 *   data-position  - "right" (default) or "left"
 *   data-color     - Primary color hex, default "#4A7FFF"
 */
(function () {
  "use strict";

  var scriptTag =
    document.currentScript ||
    (function () { var s = document.getElementsByTagName("script"); return s[s.length - 1]; })();

  var POSITION = scriptTag.getAttribute("data-position") || "right";
  var PRIMARY = scriptTag.getAttribute("data-color") || "#4A7FFF";

  // iframe src is same origin as the script (crmpoc.star-bit.io)
  var scriptSrc = scriptTag.src;
  var FRAME_URL = scriptSrc.replace(/lili-chatbot\.js.*$/, "chatbot-frame.html");

  var WIDGET_ID = "lili-chatbot-widget";

  var style = document.createElement("style");
  style.textContent =
    "@keyframes lcbFabGlow{0%,100%{box-shadow:0 0 0 0 rgba(0,212,255,.4)}50%{box-shadow:0 0 10px 5px rgba(0,212,255,.12)}}" +
    "#" + WIDGET_ID + " { position: fixed; bottom: 32px; " + (POSITION === "left" ? "left" : "right") + ": 32px; z-index: 2147483647; display:flex; flex-direction:column; align-items:flex-end; }" +
    "#" + WIDGET_ID + " .lcb-fab { " +
    "  width: 56px; height: 56px; border: none; cursor: pointer; position: relative;" +
    "  background: linear-gradient(135deg, " + PRIMARY + " 0%, #00D4FF 100%); color: #fff; font-size: 24px; line-height: 1;" +
    "  box-shadow: 0 0 0 1px rgba(74,127,255,.4), 0 8px 32px rgba(74,127,255,.3);" +
    "  transition: all .3s ease;" +
    "  display: flex; align-items: center; justify-content: center;" +
    "  clip-path: polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%); }" +
    "#" + WIDGET_ID + " .lcb-fab:hover { transform: scale(1.08); box-shadow: 0 0 0 1px rgba(0,212,255,.5), 0 12px 40px rgba(74,127,255,.4); }" +
    "#" + WIDGET_ID + " .lcb-fab svg { width: 22px; height: 22px; }" +
    "#" + WIDGET_ID + " .lcb-fab-badge { " +
    "  position: absolute; top: -4px; right: -4px;" +
    "  width: 20px; height: 20px; background: #050508;" +
    "  border: 1.5px solid #00D4FF; border-radius: 50%;" +
    "  display: flex; align-items: center; justify-content: center;" +
    "  font-size: 7px; color: #00D4FF; font-family: 'Space Grotesk',sans-serif; font-weight: 500;" +
    "  animation: lcbFabGlow 2s ease-in-out infinite; }" +
    "#" + WIDGET_ID + " .lcb-frame { " +
    "  width: 390px; max-width: calc(100vw - 32px); height: 70vh; max-height: 580px;" +
    "  border: 1px solid rgba(74,127,255,0.2); overflow: hidden;" +
    "  box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(74,127,255,0.08);" +
    "  margin-bottom: 12px; background: #08080f; position: relative;" +
    "  transform: translateY(16px) scale(0.97); opacity: 0; pointer-events: none;" +
    "  transition: all .36s cubic-bezier(.34,1.56,.64,1); }" +
    "#" + WIDGET_ID + " .lcb-frame::before { " +
    "  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; z-index: 1;" +
    "  background: linear-gradient(to right, transparent, " + PRIMARY + " 30%, #00D4FF 70%, transparent); }" +
    "#" + WIDGET_ID + " .lcb-frame.open { transform: translateY(0) scale(1); opacity: 1; pointer-events: all; display: block; }" +
    "#" + WIDGET_ID + " .lcb-frame iframe { width: 100%; height: 100%; border: none; }";
  document.head.appendChild(style);

  var root = document.createElement("div");
  root.id = WIDGET_ID;
  root.innerHTML =
    '<div class="lcb-frame" id="lcb-frame">' +
    '<iframe src="' + FRAME_URL + '" allow="clipboard-write"></iframe>' +
    '</div>' +
    '<button class="lcb-fab" id="lcb-fab" title="AI \u79ae\u8cd3\u7ba1\u5bb6">' +
    '<div class="lcb-fab-badge">AI</div>' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>' +
    '</svg></button>';
  document.body.appendChild(root);

  var isOpen = false;
  var fab = document.getElementById("lcb-fab");
  var frame = document.getElementById("lcb-frame");

  fab.onclick = function () {
    isOpen = !isOpen;
    frame.className = "lcb-frame" + (isOpen ? " open" : "");
    // swap icon to close X when open
    if (isOpen) {
      fab.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
        '<line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>';
    } else {
      fab.innerHTML =
        '<div class="lcb-fab-badge">AI</div>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
    }
  };
})();
