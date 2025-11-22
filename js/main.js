document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById('groups-container');
  const addBtn = document.getElementById('add-group');
  const form = document.getElementById("simulation-form");

  // -------------------------
  // Dodawanie nowych grup N_i i sigma_i²
  // -------------------------

  function createGroupRow(index) {
    const div = document.createElement('div');
    div.className = 'group-row';

    div.innerHTML = `
      <label class="tooltip">
        <span class="label-text">N<sub>${index}</sub>:</span>
        <span class="tooltiptext">Liczba stopni swobody o odchyleniu standardowym σ<sub>${index}</sub>(&Sigma;N<sub>i</sub>&lt;40)</span>
      </label>
      <input type="number" name="N_list" value="10" class="form-input-a" />

      <label class="tooltip">
        <span class="label-text">σ<sub>${index}</sub><sup>2</sup>:</span>
        <span class="tooltiptext">Wariancja N<sub>${index}</sub> wierszy macierzy losowej</span>
      </label>
      <input type="number" step="0.1" name="sigma_squared_list" value="1.0" class="form-input-a" />
      `;

    return div;
  }

  function addRemoveButton(row) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'X';
    btn.className = 'remove-btn';

    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.width = '30px';
    btn.style.height = '30px';
    btn.style.padding = '0';
    btn.style.fontSize = '16px';
    btn.style.backgroundColor = '#ff4d4f';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px';
    btn.style.cursor = 'pointer';
    btn.style.marginLeft = '2px';
    btn.style.marginTop = '0';
    btn.style.alignSelf = 'flex-start';

    btn.addEventListener('mouseover', () => btn.style.backgroundColor = '#ff7875');
    btn.addEventListener('mouseout', () => btn.style.backgroundColor = '#ff4d4f');

    btn.addEventListener('click', () => {
      const rows = container.querySelectorAll('.group-row');
      if (rows.length <= 1) return; // NIE USUWAJ JEŚLI JEDNA GRUPA

      container.removeChild(row);
      updateIndexes();
      updateRemoveButtons();
    });

    row.appendChild(btn);
  }

  function updateIndexes() {
    const rows = container.querySelectorAll('.group-row');
    rows.forEach((row, i) => {
      const index = i + 1;
      const labels = row.querySelectorAll('.tooltip');

      labels[0].querySelector('.label-text').innerHTML = `N<sub>${index}</sub>:`; 
      labels[0].querySelector('.tooltiptext').innerHTML =
        `Liczba stopni swobody o odchyleniu standardowym σ<sub>${index}</sub>(&Sigma;N<sub>i</sub>&lt;40)`;
      labels[1].querySelector('.label-text').innerHTML = `σ<sub>${index}</sub><sup>2</sup>:`; 
      labels[1].querySelector('.tooltiptext').innerHTML =
        `Wariancja N<sub>${index}</sub> wierszy macierzy losowej`;
    });
  }

  // nowa funkcja sterująca widocznością przycisków
  function updateRemoveButtons() {
    const rows = container.querySelectorAll('.group-row');
    
    rows.forEach((row, i) => {
      let btn = row.querySelector('.remove-btn');

      // Jeśli brak przycisku i to ostatnia grupa i liczba grup >= 2 → dodaj
      if (!btn && rows.length > 1 && i === rows.length - 1) {
        addRemoveButton(row);
        btn = row.querySelector('.remove-btn');
      }

      // Pokazuj przycisk tylko dla ostatniej grupy jeśli jest co najmniej 2 grupy
      if (btn) {
        if (rows.length <= 1 || i !== rows.length - 1) {
          btn.style.display = 'none';
        } else {
          btn.style.display = 'inline-flex';
        }
      }
    });
  }

  // obsługa przycisku dodawania
  addBtn.addEventListener('click', () => {
    const rows = container.querySelectorAll('.group-row');
    if (rows.length >= 9) return; // limit 20 grup widocznych

    const index = rows.length + 1;
    const newRow = createGroupRow(index);

    container.appendChild(newRow);
    updateIndexes();
    updateRemoveButtons();
  });

  // uruchamiamy przy starcie, aby przycisk X był ukryty jeśli jedna grupa
  updateRemoveButtons();

  // -------------------------
  // Obsługa submit formularza – wysyłka JSON
  // -------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Pobranie danych z formularza
    const N_list = [];
    const sigma_squared_list = [];

    container.querySelectorAll('.group-row').forEach(row => {
      const N = parseInt(row.querySelector('input[name="N_list"]').value);
      const sigma = parseFloat(row.querySelector('input[name="sigma_squared_list"]').value);

      N_list.push(N);
      sigma_squared_list.push(sigma);
    });

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
            x: { type: "linear",
                title: { display: true, text: "Wartości własne λ", font: {size: 22} },
                ticks: { font: { size: 18 } }
              },
            y: {
                title: { display: true, text: "Gęstość prawdopodobieństwa", font: {size: 22} },
                ticks: { font: { size: 18 } }
              }
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
        document.getElementById("mean-lambda-teo").textContent = json.stats.mean_teo?.toFixed(3) ?? "–";
        document.getElementById("var-lambda-teo").textContent = json.stats.var_teo?.toFixed(3) ?? "–";
        document.getElementById("min-lambda-teo").textContent = json.stats.min_teo?.toFixed(3) ?? "–";
        document.getElementById("max-lambda-teo").textContent = json.stats.max_teo?.toFixed(3) ?? "–";
        document.getElementById("skosnosc-teo").textContent = json.stats.skewness_teo?.toFixed(3) ?? "–";
        document.getElementById("kurtoza-teo").textContent = json.stats.kurtosis_teo?.toFixed(3) ?? "–";

        document.getElementById("mean-lambda-hist").textContent = json.stats.mean_hist?.toFixed(3) ?? "–";
        document.getElementById("var-lambda-hist").textContent = json.stats.var_hist?.toFixed(3) ?? "–";
        document.getElementById("min-lambda-hist").textContent = json.stats.min_hist?.toFixed(3) ?? "–";
        document.getElementById("max-lambda-hist").textContent = json.stats.max_hist?.toFixed(3) ?? "–";
        document.getElementById("skosnosc-hist").textContent = json.stats.skewness_hist?.toFixed(3) ?? "–";
        document.getElementById("kurtoza-hist").textContent = json.stats.kurtosis_hist?.toFixed(3) ?? "–";

        document.getElementById("elapsed_time").textContent = json.stats.elapsed_minutes?.toFixed(1) ?? "–";
        document.getElementById("N_total").textContent = json.stats.N_total?.toFixed(0) ?? "–";
        document.getElementById("r").textContent = json.stats.r?.toFixed(2) ?? "–";
      }

    } catch (err) {
      console.error("Błąd przy generowaniu wykresu:", err);
    }
  });
});