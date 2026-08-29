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
    gradient.addColorStop(0, "rgba(0, 113, 227, 0.35)");
    gradient.addColorStop(0.6, brandBlueLight);
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
            tension: 0.42,
            cubicInterpolationMode: "monotone",
            borderWidth: 3.5,
            shadowOffsetX: 0,
            shadowOffsetY: 4,
            shadowBlur: 10,
            shadowColor: "rgba(0, 113, 227, 0.35)",
            pointRadius: values.length > 40 ? 0 : 4,
            pointBackgroundColor: "#fff",
            pointBorderColor: brandBlue,
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: brandBlue,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700, easing: "easeOutQuart" },
        interaction: { mode: "nearest", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#0a2540",
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: "rgba(10, 37, 64, 0.06)" },
          },
          x: {
            display: labels.length <= 25,
            grid: { display: false },
          },
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
