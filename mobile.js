// Handle collapsible panels
document.querySelectorAll(".panel.collapsible").forEach(panel => {
  panel.addEventListener("click", () => {
    panel.classList.toggle("active");
  });
});

// Hamburger menu toggle
const hamburger = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".header-meta"); // or your menu div

if(hamburger && mobileMenu){
  hamburger.addEventListener("click", () => {
    mobileMenu.classList.toggle("visible");
  });
}
