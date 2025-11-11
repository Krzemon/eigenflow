document.getElementById("simulation-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Pobranie danych z formularza
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    // POST do backendu
    const response = await fetch("http://localhost:8000/mp/plot", {
      method: "POST",
      body: new URLSearchParams(data)
    });

    const json = await response.json();

    const canvas = document.getElementById("histogram-chart");
    const ctx = canvas.getContext("2d");

    // Usuwamy poprzedni wykres, jeśli istnieje
    if (window.currentChart) window.currentChart.destroy();

    // Tworzymy nowy wykres z animacją
    window.currentChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: json.x,
        datasets: [
          {
            label: "Histogram",
            data: json.hist,
            backgroundColor: "rgba(59, 130, 246, 0.5)",
            borderColor: "rgb(37, 99, 235)",
            borderWidth: 1
          },
          {
            label: "Krzywa teoretyczna",
            data: json.theory,
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
        animations: {
          y: {
            duration: 1500,
            easing: 'easeOutQuart'
          },
          x: {
            duration: 0 // brak animacji osi X
          },
          tension: {
            duration: 1000,
            easing: 'easeOutQuart'
          }
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

    // Aktualizacja panelu statystyk
    document.getElementById("mean-lambda").textContent = json.stats.mean.toFixed(3);
    document.getElementById("var-lambda").textContent = json.stats.var.toFixed(3);
    document.getElementById("min-lambda").textContent = json.stats.min.toFixed(3);
    document.getElementById("max-lambda").textContent = json.stats.max.toFixed(3);

  } catch (err) {
    console.error("Błąd przy generowaniu wykresu:", err);
  }
});