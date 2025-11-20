document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById('groups-container');
  const addBtn = document.getElementById('add-group');
  const form = document.getElementById("simulation-form");

  // -------------------------
  // Dodawanie nowych grup N_i i sigma_i²
  // -------------------------
  addBtn.addEventListener('click', () => {
    const index = container.children.length + 1;
    const div = document.createElement('div');
    div.className = 'group-row';
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '8px';
    div.innerHTML = `
      <label>N<sub>${index}</sub>: <input type="number" name="N_list" value="10" class="form-input" /></label>
      <label>σ<sub>${index}</sub><sup>2</sup>: <input type="number" step="0.1" name="sigma_squared_list" value="1.0" class="form-input" /></label>
    `;
    container.appendChild(div);
  });

  // -------------------------
  // Obsługa submit formularza – wysyłka JSON
  // -------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Pobranie danych z formularza
    const N_list = Array.from(container.querySelectorAll('input[name="N_list"]'))
      .map(i => parseInt(i.value) || 0);
    const sigma_squared_list = Array.from(container.querySelectorAll('input[name="sigma_squared_list"]'))
      .map(i => parseFloat(i.value) || 0);

    const T = parseInt(form.querySelector('input[name="T"]').value) || 100;
    const num_trials = parseInt(form.querySelector('input[name="num_trials"]').value) || 10000;
    const bins = parseInt(form.querySelector('input[name="bins"]').value) || 50;

    const payload = { N_list, sigma_squared_list, T, num_trials, bins };

    try {
      const response = await fetch("http://localhost:8000/mp/plot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await response.json();

      if (json.error) {
        console.error("Błąd z backendu:", json.error);
        return;
      }

      const ctx = document.getElementById("histogram-chart").getContext("2d");
      if (window.currentChart) window.currentChart.destroy();

      // -------------------------
      // Tworzenie datasets
      // -------------------------
      const datasets = [
        {
          type: "bar",
          label: "Histogram",
          data: json.y_hist,
          backgroundColor: "rgba(59,130,246,0.5)",
          borderColor: "rgb(37,99,235)",
          borderWidth: 1,
          order: 2
        }
      ];

      if (json.x_theory && json.y_theory) {
        datasets.push({
          type: "line",
          label: "Krzywa teoretyczna",
          data: json.x_theory.map((x, i) => ({ x: x, y: json.y_theory[i] })),
          borderColor: "rgb(234,88,12)",
          borderWidth: 2,
          fill: false,
          tension: 0.3,
          pointRadius: 0,
          order: 1,
          parsing: { xAxisKey: "x", yAxisKey: "y" }
        });
      }

      // -------------------------
      // Tworzenie wykresu
      // -------------------------
      window.currentChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: json.x_hist,
          datasets: datasets
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

      // -------------------------
      // Aktualizacja statystyk
      // -------------------------
      if (json.stats) {
        document.getElementById("mean-lambda").textContent = json.stats.mean?.toFixed(3) ?? "–";
        document.getElementById("var-lambda").textContent = json.stats.var?.toFixed(3) ?? "–";
        document.getElementById("min-lambda").textContent = json.stats.min?.toFixed(3) ?? "–";
        document.getElementById("max-lambda").textContent = json.stats.max?.toFixed(3) ?? "–";
      }

    } catch (err) {
      console.error("Błąd przy generowaniu wykresu:", err);
    }
  });
});