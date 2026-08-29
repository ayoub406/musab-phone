// يبني قوائم الألوان والسعات ديناميكياً حسب الموديل المختار
// (كل موديل له مجموعة ألوان وسعات خاصة به - مثال: iPhone 11 له ألوانه الأصلية)
document.addEventListener("DOMContentLoaded", function () {
  const modelSelect = document.getElementById("model-select");
  const colorSelect = document.getElementById("color-select");
  const storageSelect = document.getElementById("storage-select");
  const vipField = document.getElementById("vip-field");
  const customRequest = document.getElementById("custom-request");

  if (!modelSelect || !colorSelect || !storageSelect) return;

  const models = window.MUSAB_MODELS || [];
  const t = window.MUSAB_T || {};

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

  modelSelect.addEventListener("change", function () {
    const model = models.find(function (m) { return m.id === modelSelect.value; });
    if (!model) return;

    fillSelect(colorSelect, model.colors, t.ph_choose_color || "");
    fillSelect(storageSelect, model.storages, t.ph_choose_storage || "");

    if (model.is_vip) {
      vipField.style.display = "block";
      if (customRequest) customRequest.setAttribute("required", "required");
    } else {
      vipField.style.display = "none";
      if (customRequest) customRequest.removeAttribute("required");
    }
  });

  // اختيار موديل مباشرة من أزرار "احجز هذا الموديل" في قسم الموديلات
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
