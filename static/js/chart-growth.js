// رسم بياني حي لنمو الحجوزات - يرتفع الخط مع كل حجز جديد
document.addEventListener("DOMContentLoaded", function () {
  const box = document.querySelector(".growth-box");
  const canvas = document.getElementById("growth-chart");
  if (!box || !canvas || typeof Chart === "undefined") return;

  const endpoint = box.dataset.endpoint;
  const totalEl = document.getElementById("growth-total");

  const styles = getComputedStyle(document.documentElement);
  const brandBlue = styles.getPropertyValue("--brand-blue").trim() || "#0071e3";
  const brandBlueLight = styles.getPropertyValue("--brand-blue-light").trim() || "#e8f3ff";

  let chart = null;

  function buildChart(labels, values) {
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, brandBlueLight);
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "عدد الحجوزات",
            data: values,
            borderColor: brandBlue,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointRadius: values.length > 40 ? 0 : 3,
            pointBackgroundColor: brandBlue,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: { display: labels.length <= 25 },
        },
      },
    });
  }

  function refresh() {
    fetch(endpoint)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (totalEl) totalEl.textContent = data.total;

        if (!chart) {
          const labels = data.labels.length ? data.labels : ["0"];
          const values = data.values.length ? data.values : [0];
          buildChart(labels, values);
          return;
        }

        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.values;
        chart.data.datasets[0].pointRadius = data.values.length > 40 ? 0 : 3;
        chart.options.scales.x.display = data.labels.length <= 25;
        chart.update();
      })
      .catch(function () {
        /* تجاهل أخطاء الشبكة المؤقتة */
      });
  }

  refresh();
  setInterval(refresh, 8000); // يتزامن مع تحديث عداد المخزون
});
