// تحديث حي لعداد الكمية المتاحة (بدون تحديث الصفحة)
document.addEventListener("DOMContentLoaded", function () {
  const box = document.getElementById("stock-box");
  if (!box) return;

  const endpoint = box.dataset.endpoint;
  const remainingEl = document.getElementById("stock-remaining");
  const percentEl = document.getElementById("stock-percent");
  const fillEl = document.getElementById("stock-bar-fill");
  const soldoutEl = document.getElementById("stock-soldout");
  const reserveBtn = document.querySelector('.reserve-box button[type="submit"]');

  function applyStock(data) {
    remainingEl.textContent = data.remaining;
    percentEl.textContent = data.percent + "%";
    fillEl.style.width = data.percent + "%";

    if (data.sold_out) {
      soldoutEl.style.display = "block";
      if (reserveBtn) {
        reserveBtn.disabled = true;
        reserveBtn.textContent = "نفدت الكمية بالكامل";
      }
    } else {
      soldoutEl.style.display = "none";
    }
  }

  function fetchStock() {
    fetch(endpoint)
      .then((res) => res.json())
      .then(applyStock)
      .catch(() => {
        /* تجاهل أخطاء الشبكة المؤقتة */
      });
  }

  fetchStock();
  setInterval(fetchStock, 8000); // تحديث كل 8 ثوانٍ
});
