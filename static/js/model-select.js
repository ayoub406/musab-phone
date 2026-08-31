// يبني قوائم السعات ديناميكياً + نافذة اختيار اللون بالصور (بدل القائمة المنسدلة)
// عند اختيار الموديل تظهر صور الألوان الفعلية (نفس صور معرض الألوان في الصفحة الرئيسية)
// وعند اختيار العميل للون، يغلق النظام النافذة تلقائياً ويرجعه لإكمال باقي بيانات الحجز
document.addEventListener("DOMContentLoaded", function () {
  const modelSelect = document.getElementById("model-select");
  const storageSelect = document.getElementById("storage-select");
  const vipField = document.getElementById("vip-field");
  const customRequest = document.getElementById("custom-request");

  const colorTrigger = document.getElementById("color-trigger");
  const colorValue = document.getElementById("color-value");
  const colorPlaceholder = document.getElementById("color-trigger-placeholder");
  const colorChosen = document.getElementById("color-trigger-chosen");
  const colorChosenImg = document.getElementById("color-trigger-img");
  const colorChosenName = document.getElementById("color-trigger-name");

  const modalOverlay = document.getElementById("color-modal-overlay");
  const modalGrid = document.getElementById("color-modal-grid");
  const modalClose = document.getElementById("color-modal-close");

  if (!modelSelect || !storageSelect || !colorTrigger) return;

  const models = window.MUSAB_MODELS || [];
  const gallery = window.MUSAB_GALLERY || [];
  const t = window.MUSAB_T || {};

  function galleryFileFor(colorName) {
    const found = gallery.find(function (g) { return g.color === colorName; });
    return found ? found.file : null;
  }

  function fillSelect(select, values, placeholder) {
    select.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.disabled = true;
    opt0.selected = true;
    opt0.textContent = placeholder;
    select.appendChild(opt0);
    values.forEach(function (v) {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
    select.disabled = false;
  }

  function resetColorTrigger() {
    colorValue.value = "";
    colorPlaceholder.style.display = "inline";
    colorChosen.style.display = "none";
    colorChosenImg.src = "";
    colorChosenName.textContent = "";
  }

  function openColorModal() {
    if (colorTrigger.disabled) return;
    modalOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeColorModal() {
    modalOverlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  function selectColor(colorName, file) {
    colorValue.value = colorName;
    colorPlaceholder.style.display = "none";
    colorChosen.style.display = "flex";
    if (file) {
      colorChosenImg.src = "/static/img/" + file;
      colorChosenImg.style.display = "block";
    } else {
      colorChosenImg.style.display = "none";
    }
    colorChosenName.textContent = colorName;
    closeColorModal();

    // النظام يرجع العميل تلقائياً لإكمال باقي بيانات الحجز (حقل السعة التالي)
    if (storageSelect) {
      storageSelect.scrollIntoView({ behavior: "smooth", block: "center" });
      storageSelect.focus({ preventScroll: true });
    }
  }

  function buildColorModal(colorsList) {
    modalGrid.innerHTML = "";
    colorsList.forEach(function (colorName) {
      const file = galleryFileFor(colorName);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "color-modal-card";
      card.dataset.color = colorName;

      if (file) {
        card.innerHTML =
          '<span class="color-modal-img-wrap"><img src="/static/img/' + file + '" alt="' + colorName + '" loading="lazy"></span>' +
          '<span class="color-modal-name">' + colorName + "</span>";
      } else {
        card.innerHTML =
          '<span class="color-modal-img-wrap color-modal-icon">📱</span>' +
          '<span class="color-modal-name">' + colorName + "</span>";
      }

      card.addEventListener("click", function () {
        selectColor(colorName, file);
      });

      modalGrid.appendChild(card);
    });
  }

  colorTrigger.addEventListener("click", openColorModal);
  if (modalClose) modalClose.addEventListener("click", closeColorModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) closeColorModal();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeColorModal();
  });

  modelSelect.addEventListener("change", function () {
    const model = models.find(function (m) { return m.id === modelSelect.value; });
    if (!model) return;

    buildColorModal(model.colors);
    fillSelect(storageSelect, model.storages, t.ph_choose_storage || "");

    resetColorTrigger();
    colorTrigger.disabled = false;

    if (model.is_vip) {
      vipField.style.display = "block";
      if (customRequest) customRequest.setAttribute("required", "required");
    } else {
      vipField.style.display = "none";
      if (customRequest) customRequest.removeAttribute("required");
    }
  });

  // اختيار موديل مباشرة من أزرار "احجز هذا الموديل" (بما فيها صندوق VIP في الهيرو)
  document.querySelectorAll(".js-pick-model").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const modelId = btn.dataset.model;
      modelSelect.value = modelId;
      modelSelect.dispatchEvent(new Event("change"));
      const reserveSection = document.getElementById("reserve");
      if (reserveSection) reserveSection.scrollIntoView({ behavior: "smooth" });
    });
  });
});
