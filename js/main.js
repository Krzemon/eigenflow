document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById('groups-container');
  const addBtn = document.getElementById('add-group');
  const form = document.getElementById("simulation-form");

  // -------------------------
  // Dodawanie nowych grup N_i i sigma_i²
  // -------------------------

  addBtn.addEventListener('click', () => {
    const rows = container.querySelectorAll('.group-row');

    // Usuń przycisk "Usuń" z poprzedniej grupy
    if (rows.length > 0) {
      const prevRemoveBtn = rows[rows.length - 1].querySelector('.remove-btn');
      if (prevRemoveBtn) prevRemoveBtn.remove();
    }

    const index = rows.length + 1;
    const div = document.createElement('div');
    div.className = 'group-row';
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '8px';
    div.innerHTML = `
      <label>N<sub>${index}</sub>: <input type="number" name="N_list" value="10" class="form-input" /></label>
      <label>σ<sub>${index}</sub><sup>2</sup>: <input type="number" step="0.1" name="sigma_squared_list" value="1.0" class="form-input" /></label>
    `;

  // Dodaj przycisk "Usuń" do nowej grupy
  addRemoveButton(div);
    container.appendChild(div);
    updateIndexes();
  });

  function updateIndexes() {
    const rows = container.querySelectorAll('.group-row');
    rows.forEach((row, i) => {
      row.querySelector('label:first-child').innerHTML = `N<sub>${i+1}</sub>: <input type="number" name="N_list" value="10" class="form-input" />`;
      row.querySelector('label:nth-child(2)').innerHTML = `σ<sub>${i+1}</sub><sup>2</sup>: <input type="number" step="0.1" name="sigma_squared_list" value="1.0" class="form-input" />`;
    });
  }

  function addRemoveButton(row) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Usuń';
    btn.className = 'remove-btn';

    // Kwadratowy przycisk z X
    btn.textContent = 'X';
    btn.style.width = '32px';
    btn.style.height = '32px';
    btn.style.padding = '0'; // usuwa padding, żeby był kwadratowy
    btn.style.fontSize = '16px';
    btn.style.backgroundColor = '#ff4d4f';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px';
    btn.style.cursor = 'pointer';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';

    btn.style.margin = '0 auto'; // automatyczne marginesy po bokach
    btn.style.display = 'block'; // margin:auto działa tylko dla block
    btn.style.marginTop = '8px';
    
    // Efekt po najechaniu
    btn.addEventListener('mouseover', () => {
      btn.style.backgroundColor = '#ff7875';
    });
    btn.addEventListener('mouseout', () => {
      btn.style.backgroundColor = '#ff4d4f';
    });

    // Funkcja usuwania
    btn.addEventListener('click', () => {
      container.removeChild(row);
      updateIndexes();

      const newRows = container.querySelectorAll('.group-row');
      if (newRows.length > 0) addRemoveButton(newRows[newRows.length - 1]);
    });

    row.appendChild(btn);
  }

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
        document.getElementById("elapsed_time").textContent = json.stats.elapsed_minutes?.toFixed(3) ?? "–";
        document.getElementById("N_total").textContent = json.stats.N_total?.toFixed(3) ?? "–";
        document.getElementById("r").textContent = json.stats.r?.toFixed(3) ?? "–";
      }

    } catch (err) {
      console.error("Błąd przy generowaniu wykresu:", err);
    }
  });
});