// عداد تنازلي حتى موعد إغلاق الحجز
function startCountdown(deadlineIso, elements) {
  const deadline = new Date(deadlineIso).getTime();

  function update() {
    const now = new Date().getTime();
    const diff = deadline - now;

    if (diff <= 0) {
      elements.wrap.innerHTML = '<p class="countdown-expired">⏰ انتهى وقت استقبال الحجوزات</p>';
      clearInterval(timer);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    elements.days.textContent = String(days).padStart(2, "0");
    elements.hours.textContent = String(hours).padStart(2, "0");
    elements.minutes.textContent = String(minutes).padStart(2, "0");
    elements.seconds.textContent = String(seconds).padStart(2, "0");
  }

  update();
  const timer = setInterval(update, 1000);
}

document.addEventListener("DOMContentLoaded", function () {
  const wrap = document.getElementById("countdown-wrap");
  if (!wrap) return;

  const deadlineIso = wrap.dataset.deadline;

  startCountdown(deadlineIso, {
    wrap: wrap,
    days: document.getElementById("cd-days"),
    hours: document.getElementById("cd-hours"),
    minutes: document.getElementById("cd-minutes"),
    seconds: document.getElementById("cd-seconds"),
  });
});
