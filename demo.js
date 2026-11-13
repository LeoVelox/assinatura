/* Vídeo de demonstração: carrega só o do tamanho da tela (celular ou computador), quando a pessoa chega perto dele. */
(function () {
  var fig = document.querySelector(".shot__video");
  if (!fig) return;
  var phone = window.matchMedia("(max-width: 720px)");
  function pick() {
    return fig.querySelector(phone.matches ? ".flow__video--mob" : ".flow__video--desk");
  }
  function load() {
    var v = pick();
    if (!v || v.getAttribute("data-ready")) return;
    v.setAttribute("data-ready", "1");
    v.muted = true;
    v.src = v.getAttribute("data-src");
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }
  if ("IntersectionObserver" in window) {
    var seen = false;
    new IntersectionObserver(function (entries) {
      seen = entries.some(function (e) { return e.isIntersecting; });
      if (seen) load();
    }, { rootMargin: "400px 0px" }).observe(fig);
    var again = function () { if (seen) load(); };
    if (phone.addEventListener) phone.addEventListener("change", again);
  } else {
    load();
  }
})();
