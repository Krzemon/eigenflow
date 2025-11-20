document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("simulation-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const body = new URLSearchParams();

    // Zbieramy wszystkie N_i i sigma_i²
    formData.getAll("n_list").forEach(val => body.append("n_list", val));
    formData.getAll("sigma_list").forEach(val => body.append("sigma_list", val));

    // Pozostałe parametry
    body.append("T", formData.get("T"));
    body.append("num_trials", formData.get("num_trials"));
    body.append("bins", formData.get("bins"));

    try {
      const response = await fetch("http://localhost:8000/mp/plot", {
        method: "POST",
        body: body
      });

      const json = await response.json();
      const ctx = document.getElementById("histogram-chart").getContext("2d");

      // Usuń poprzedni wykres jeśli istnieje
      if (window.currentChart) window.currentChart.destroy();

      // Tworzenie wykresu
      window.currentChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: json.x_hist,
          datasets: [
            {
              type: "bar",
              label: "Histogram",
              data: json.y_hist,
              backgroundColor: "rgba(59,130,246,0.5)",
              borderColor: "rgb(37,99,235)",
              borderWidth: 1,
              order: 2
            },
            {
              type: "line",
              label: "Krzywa teoretyczna",
              data: json.x_theory.map((x,i) => ({ x: x, y: json.y_theory[i] })),
              borderColor: "rgb(234,88,12)",
              borderWidth: 2,
              fill: false,
              tension: 0.3,
              pointRadius: 0,
              order: 1,
              parsing: { xAxisKey: "x", yAxisKey: "y" }
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { type: "linear", title: { display: true, text: "Wartości" } },
            y: { title: { display: true, text: "Częstość / Prawdopodobieństwo" } }
          },
          plugins: {
            legend: { position: "top" },
            tooltip: { mode: "index", intersect: false }
          }
        }
      });

      // Wyświetlanie statystyk
      document.getElementById("mean-lambda").textContent = json.stats.mean.toFixed(3);
      document.getElementById("var-lambda").textContent = json.stats.var.toFixed(3);
      document.getElementById("min-lambda").textContent = json.stats.min.toFixed(3);
      document.getElementById("max-lambda").textContent = json.stats.max.toFixed(3);

    } catch (err) {
      console.error("Błąd przy generowaniu wykresu:", err);
    }
  });
});