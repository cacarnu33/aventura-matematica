// Ayuda para que TypeScript entienda cómo el código usa la página.
// No genera nada: solo sirve para `npm run check`.

// El código usa querySelector/querySelectorAll y después toca .style o .disabled
// (siempre sobre elementos HTML: botones, divs).
interface Element {
  style: CSSStyleDeclaration;
  disabled: boolean;
}

interface HTMLElement {
  /** Área del juego que agrandó misionAjustar() para que entre el cartel. */
  _misionBox?: HTMLElement;
}

interface Window {
  /** Safari viejo (iPad) */
  webkitAudioContext?: typeof AudioContext;
}
