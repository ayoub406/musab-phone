// قائمة الموبايل (Hamburger) + حركات ظهور خفيفة عند التمرير
document.addEventListener("DOMContentLoaded", function () {
  // ----- قائمة الموبايل -----
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      const isOpen = links.classList.toggle("open");
      toggle.classList.toggle("open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // إغلاق القائمة تلقائياً عند الضغط على أي رابط
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ----- حركات ظهور خفيفة عند التمرير -----
  const revealTargets = document.querySelectorAll(
    ".feature-card, .gallery-card, .model-card, .growth-box, .stock-box"
  );
  revealTargets.forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealTargets.forEach(function (el) { observer.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }
});
