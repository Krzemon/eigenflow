document.body.addEventListener("htmx:afterSwap", (evt) => {
  // Po otrzymaniu fragmentu HTML z backendu
  const canvas = document.querySelector("#histogram-chart");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const data = JSON.parse(canvas.dataset.chart);

    // Usuwamy poprzedni wykres jeśli był
    if (window.currentChart) {
      window.currentChart.destroy();
    }

    // Rysujemy histogram + krzywą
    window.currentChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.x,
        datasets: [
          {
            label: "Histogram",
            data: data.hist,
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            borderColor: "rgb(37, 99, 235)",
            borderWidth: 1
          },
          {
            label: "Krzywa teoretyczna",
            data: data.theory,
            type: "line",
            borderColor: "rgb(234, 88, 12)",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            title: { display: true, text: "Wartości" }
          },
          y: {
            title: { display: true, text: "Częstość / Prawdopodobieństwo" }
          }
        },
        plugins: {
          legend: { position: "top" },
          tooltip: { mode: "index", intersect: false }
        }
      }
    });
  }
});