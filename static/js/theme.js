// تبديل الوضع الليلي/النهاري مع حفظ الاختيار في المتصفح
document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.getElementById("theme-toggle");
  const root = document.documentElement;

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    localStorage.setItem("musab-theme", theme);
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      const isDark = root.getAttribute("data-theme") === "dark";
      applyTheme(isDark ? "light" : "dark");
    });
  }
});
