// Shared by the Reveal (a client module) and the root layout (a server
// component), which can't import plain values from a "use client" file.

/** set once a visitor has dived through the opening */
export const REVEAL_SEEN_KEY = "seyfert:reveal-seen";

// Runs in <head> before the first paint: a visitor who has seen the Reveal
// gets data-reveal="compact" on <html>, which styles the server HTML as the
// compact cut until React renders it.
export const REVEAL_MODE_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(REVEAL_SEEN_KEY)}))document.documentElement.dataset.reveal="compact"}catch(e){}`;
