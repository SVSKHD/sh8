/* jsdom is missing a few browser APIs the app uses */
if (!window.matchMedia) {
  // report reduced motion so confetti/animations no-op deterministically
  window.matchMedia = () => ({ matches: true, addListener: () => {}, removeListener: () => {} });
}
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}
if (!Element.prototype.animate) {
  Element.prototype.animate = () => ({ onfinish: null, cancel: () => {} });
}
