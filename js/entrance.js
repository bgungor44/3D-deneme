const entrance = document.querySelector("#giris");
const button = document.querySelector("#enter-site");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let finished = false;
let timer;
function finish() {
  if (finished) return;
  finished = true;
  clearTimeout(timer);
  entrance.classList.add("entered");
  entrance.classList.remove("animating");
  button.hidden = true;
  entrance.querySelector(".entrance-skip").hidden = true;
  const next = entrance.querySelector(".entrance-scroll");
  next.hidden = false;
  next.focus({ preventScroll: true });
}
button.addEventListener("click", () => {
  if (entrance.classList.contains("animating") || finished) return;
  entrance.classList.add("animating");
  button.disabled = true;
  button.textContent = "Harfler bir araya geliyor…";
  if (reduced.matches) finish();
  else timer = setTimeout(finish, 2400);
});
entrance.querySelector(".entrance-skip").addEventListener("click", finish);
// Keep direct links to collection/studio useful. The entrance never locks scrolling.
if (location.hash && location.hash !== "#giris") {
  finished = true;
  entrance.classList.add("entered");
  button.hidden = true;
  entrance.querySelector(".entrance-skip").hidden = true;
  entrance.querySelector(".entrance-scroll").hidden = false;
}
