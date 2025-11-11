document.getElementById("simulation-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const response = await fetch("http://localhost:8000/mp/plot", {
      method: "POST",
      body: new URLSearchParams(data)
    });

    const json = await response.json();
    const ctx = document.getElementById("histogram-chart").getContext("2d");

    // usuń poprzedni wykres
    if (window.currentChart) window.currentChart.destroy();

    // animacja rysowania słupków i linii
    window.currentChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: json.x,
        datasets: [
          {
            label: "Histogram",
            data: json.hist,
            backgroundColor: "rgba(59,130,246,0.5)",
            borderColor: "rgb(37,99,235)",
            borderWidth: 1
          },
          {
            label: "Krzywa teoretyczna",
            data: json.theory,
            type: "line",
            borderColor: "rgb(234,88,12)",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1800,
          easing: "easeOutCubic",
          delay: (context) => context.dataIndex * 10
        },
        scales: {
          x: { title: { display: true, text: "Wartości" } },
          y: { title: { display: true, text: "Częstość / Prawdopodobieństwo" } }
        },
        plugins: {
          legend: { position: "top" },
          tooltip: { mode: "index", intersect: false }
        }
      }
    });

    // aktualizacja statystyk
    document.getElementById("mean-lambda").textContent = json.stats.mean.toFixed(3);
    document.getElementById("var-lambda").textContent = json.stats.var.toFixed(3);
    document.getElementById("min-lambda").textContent = json.stats.min.toFixed(3);
    document.getElementById("max-lambda").textContent = json.stats.max.toFixed(3);

  } catch (err) {
    console.error("Błąd przy generowaniu wykresu:", err);
  }
});