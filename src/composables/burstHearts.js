/* heart confetti burst */
export function burstHearts(x, y, n = 14) {
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    s.className = "burst-heart";
    s.textContent = "♥";
    s.style.left = x + "px";
    s.style.top = y + "px";
    s.style.fontSize = 10 + Math.random() * 15 + "px";
    document.body.appendChild(s);
    const ang = Math.random() * Math.PI * 2;
    const dist = 36 + Math.random() * 95;
    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist - 70;
    const rot = Math.random() * 70 - 35;
    s.animate(
      [
        { transform: "translate(-50%, -50%) scale(0.4) rotate(0deg)", opacity: 1 },
        { transform: "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px)) scale(1.1) rotate(" + rot + "deg)", opacity: 0 },
      ],
      { duration: 700 + Math.random() * 500, easing: "cubic-bezier(0.16, 0.84, 0.44, 1)" }
    ).onfinish = () => s.remove();
  }
}
