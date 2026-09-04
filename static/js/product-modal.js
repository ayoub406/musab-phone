// نافذة تفاصيل المنتج: تفتح عند الضغط على صورة أي منتج في قسم "المنتجات"
// وتعرض الصورة بحجم أوضح مع كل بيانات المنتج (الاسم، القسم، الوصف، السعر).
(function () {
  const overlay = document.getElementById("product-modal-overlay");
  if (!overlay) return;

  const imgWrap = document.getElementById("product-modal-img-wrap");
  const imgEl = document.getElementById("product-modal-img");
  const catEl = document.getElementById("product-modal-cat");
  const nameEl = document.getElementById("product-modal-name");
  const descEl = document.getElementById("product-modal-desc");
  const priceEl = document.getElementById("product-modal-price");
  const closeBtn = document.getElementById("product-modal-close");

  function openModalFromCard(card) {
    const name = card.dataset.name || "";
    const desc = card.dataset.desc || "";
    const cat = card.dataset.cat || "";
    const price = card.dataset.price || "";
    const img = card.dataset.img || "";

    nameEl.textContent = name;

    if (cat) {
      catEl.textContent = cat;
      catEl.style.display = "";
    } else {
      catEl.style.display = "none";
    }

    if (desc) {
      descEl.textContent = desc;
      descEl.style.display = "";
    } else {
      descEl.style.display = "none";
    }

    if (price) {
      priceEl.textContent = price;
      priceEl.style.display = "";
    } else {
      priceEl.style.display = "none";
    }

    if (img) {
      imgEl.src = img;
      imgEl.alt = name;
      imgWrap.classList.remove("img-missing");
    } else {
      imgEl.src = "";
      imgWrap.classList.add("img-missing");
    }

    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    const openTrigger = e.target.closest(".js-product-open, .js-product-card");
    if (openTrigger) {
      const card = openTrigger.closest(".js-product-card");
      if (card) {
        openModalFromCard(card);
      }
    }
  });

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
  });
})();
