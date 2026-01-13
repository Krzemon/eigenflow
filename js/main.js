document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById('groups-container');
  const addBtn = document.getElementById('add-group');
  const form = document.getElementById("simulation-form");
  const errorBox = document.getElementById("nt-error");
  
  /* =======================
     N / T – WALIDACJA
  ======================= */

  function getTotalN() {
    return [...container.querySelectorAll('input[name="N_list"]')]
      .map(el => Number(el.value) || 0)
      .reduce((a, b) => a + b, 0);
  }

  function getT() {
    const tInput = form.querySelector('input[name="T"]');
    return Number(tInput.value) || 0;
  }

  function validateNT() {
    const totalN = getTotalN();
    const T = getT();

    if (totalN > T) {
      errorBox.textContent =
        // `BŁĄD: ΣN = ${totalN} > T = ${T}. Wymagane: T ≥ ΣN (r ≤ 1).`;
        'BŁĄD; Rozkład generuje się dla 0 < r <= 1, gdzie r = N/T';
      errorBox.style.display = "block";
      return false;
    }

    errorBox.style.display = "none";
    return true;
  }

  /* =======================
     GRUPY
  ======================= */

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
    if (rows.length >= 8) return; // limit grup

    const index = rows.length + 1;
    const newRow = createGroupRow(index);

    container.appendChild(newRow);
    updateIndexes();
    updateRemoveButtons();
  });

  // uruchamiamy przy starcie, aby przycisk X był ukryty jeśli jedna grupa
  updateRemoveButtons();

  /* =======================
     REAKCJA NA ZMIANY
  ======================= */

  form.addEventListener("input", (e) => {
    if (e.target.name === "N_list" || e.target.name === "T") {
      validateNT();
    }
  });

  /* =======================
     SUBMIT
  ======================= */
// ---------------- API ----------------
const API_THEO = "http://localhost:8000/mp/theo";
const API_HIST = "http://localhost:8000/mp/hist";

// ---------------- Stan ostatnich czasów ----------------
let lastTimes = { theo: 0, hist: 0 };

// ---------------- Pobranie danych z formularza ----------------
function getFormData() {
  const N_list = [];
  const sigma_squared_list = [];

  document.querySelectorAll('.group-row').forEach(row => {
    N_list.push(parseInt(row.querySelector('input[name="N_list"]').value));
    sigma_squared_list.push(parseFloat(row.querySelector('input[name="sigma_squared_list"]').value));
  });

  const T = parseInt(document.querySelector('input[name="T"]').value) || 100;
  const num_trials = parseInt(document.querySelector('input[name="num_trials"]').value) || 10000;
  const bins = parseInt(document.querySelector('input[name="bins"]').value) || 50;
  const dist_name = document.querySelector('select[name="dist_name"]').value;

  return { N_list, sigma_squared_list, T, num_trials, dist_name, bins };
}

// ---------------- Wyczyszczenie wykresu i statystyk ----------------
function showLoading(message = "Trwa obliczanie…") {
  const ctx = document.getElementById("histogram-chart").getContext("2d");
  if (window.currentChart) window.currentChart.destroy();

  window.currentChart = new Chart(ctx, {
    type: "bar",
    data: { labels: [], datasets: [{ label: message, data: [], backgroundColor: "rgba(200,200,200,0.5)" }] },
    options: { responsive: true, maintainAspectRatio: false }
  });

  ["mean-theo","var-theo","skew-theo","kurt-theo","min-theo","max-theo","time_theo",
   "mean-hist","var-hist","skew-hist","kurt-hist","min-hist","max-hist","time_hist",
   "N-total","r-value"].forEach(id => {
     document.getElementById(id).textContent = "–";
  });

  document.getElementById("btn-save").disabled = true;
}

// ---------------- Rysowanie wykresu ----------------
function drawChart(datasets, xLabel="Wartości własne λ", yLabel="Gęstość prawdopodobieństwa") {
  const ctx = document.getElementById("histogram-chart").getContext("2d");
  if (window.currentChart) window.currentChart.destroy();

  window.currentChart = new Chart(ctx, {
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { type: "linear", title: { display: true, text: xLabel, font: {size: 22} }, ticks: { font: { size: 18 } } },
        y: { title: { display: true, text: yLabel, font: {size: 22} }, ticks: { font: { size: 18 } } }
      },
      plugins: {
        legend: { position: "top" },
        tooltip: { mode: "index", intersect: false }
      }
    }
  });

  document.getElementById("btn-save").disabled = false;
}

// ---------------- Teoria ----------------
async function generateTheory() {
  const payload = getFormData();
  showLoading("Obliczanie krzywej teoretycznej…");

  try {
    const res = await fetch(API_THEO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.error) return console.error("Błąd backendu:", json.error);

    lastTimes.theo = json.time_theo || 0;

    drawChart([{
      type: "line",
      label: "Krzywa teoretyczna",
      data: json.x_theory.map((x,i) => ({x, y: json.y_theory[i]})),
      borderColor: "rgb(234,88,12)",
      borderWidth: 2,
      fill: false,
      tension: 0.3,
      pointRadius: 0,
      parsing: { xAxisKey: "x", yAxisKey: "y" }
    }]);

    if (json.theo_stats) {
      document.getElementById("mean-theo").textContent = json.theo_stats.mean?.toFixed(3) ?? "–";
      document.getElementById("var-theo").textContent = json.theo_stats.variance?.toFixed(3) ?? "–";
      document.getElementById("skew-theo").textContent = json.theo_stats.skewness?.toFixed(3) ?? "–";
      document.getElementById("kurt-theo").textContent = json.theo_stats.kurtosis?.toFixed(3) ?? "–";
      document.getElementById("min-theo").textContent = json.theo_stats.min?.toFixed(3) ?? "–";
      document.getElementById("max-theo").textContent = json.theo_stats.max?.toFixed(3) ?? "–";
      document.getElementById("time_theo").textContent = json.time_theo?.toFixed(2) ?? "–";
    }

  } catch (err) {
    console.error("Błąd przy generowaniu krzywej teoretycznej:", err);
  }
}

// ---------------- Histogram ----------------
async function generateHistogram() {
  const payload = getFormData();
  showLoading("Obliczanie histogramu…");

  try {
    const res = await fetch(API_HIST, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.error) return console.error("Błąd backendu:", json.error);

    lastTimes.hist = json.time_hist || 0;

    drawChart([{
      type: "bar",
      label: "Histogram",
      data: json.y_hist.map((v,i) => ({x: json.x_hist[i], y: v})),
      backgroundColor: "rgba(59,130,246,0.5)",
      borderColor: "rgb(37,99,235)",
      borderWidth: 1
    }]);

    if (json.hist_stats) {
      document.getElementById("mean-hist").textContent = json.hist_stats.mean?.toFixed(3) ?? "–";
      document.getElementById("var-hist").textContent = json.hist_stats.variance?.toFixed(3) ?? "–";
      document.getElementById("skew-hist").textContent = json.hist_stats.skewness?.toFixed(3) ?? "–";
      document.getElementById("kurt-hist").textContent = json.hist_stats.kurtosis?.toFixed(3) ?? "–";
      document.getElementById("min-hist").textContent = json.hist_stats.min?.toFixed(3) ?? "–";
      document.getElementById("max-hist").textContent = json.hist_stats.max?.toFixed(3) ?? "–";
      document.getElementById("time_hist").textContent = json.time_hist?.toFixed(2) ?? "–";
    }

    if (json.other_stats) {
      document.getElementById("N-total").textContent = json.other_stats.N_total?.toFixed(0) ?? "–";
      document.getElementById("r-value").textContent = json.other_stats.r?.toFixed(5) ?? "–";
    }

  } catch (err) {
    console.error("Błąd przy generowaniu histogramu:", err);
  }
}

// ---------------- Generowanie obu ----------------
async function generateBoth() {
  const payload = getFormData();
  showLoading("Obliczanie obu…");

  try {
    // Pobranie równoległe obu endpointów
    const [resTheo, resHist] = await Promise.all([
      fetch(API_THEO, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) }),
      fetch(API_HIST, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) })
    ]);

    const jsonTheo = await resTheo.json();
    const jsonHist = await resHist.json();

    if (jsonTheo.error) return console.error("Błąd backendu (teoria):", jsonTheo.error);
    if (jsonHist.error) return console.error("Błąd backendu (histogram):", jsonHist.error);

    lastTimes.theo = jsonTheo.time_theo || 0;
    lastTimes.hist = jsonHist.time_hist || 0;

    const datasets = [
      {
        type: "line",
        label: "Krzywa teoretyczna",
        data: jsonTheo.x_theory.map((x,i) => ({x, y: jsonTheo.y_theory[i]})),
        borderColor: "rgb(234,88,12)",
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        parsing: { xAxisKey: "x", yAxisKey: "y" }
      },
      {
        type: "bar",
        label: "Histogram",
        data: jsonHist.y_hist.map((v,i) => ({x: jsonHist.x_hist[i], y: v})),
        backgroundColor: "rgba(59,130,246,0.5)",
        borderColor: "rgb(37,99,235)",
        borderWidth: 1
      }
    ];

    drawChart(datasets);

    // Teoria
    if (jsonTheo.theo_stats) {
      document.getElementById("mean-theo").textContent = jsonTheo.theo_stats.mean?.toFixed(3) ?? "–";
      document.getElementById("var-theo").textContent = jsonTheo.theo_stats.variance?.toFixed(3) ?? "–";
      document.getElementById("skew-theo").textContent = jsonTheo.theo_stats.skewness?.toFixed(3) ?? "–";
      document.getElementById("kurt-theo").textContent = jsonTheo.theo_stats.kurtosis?.toFixed(3) ?? "–";
      document.getElementById("min-theo").textContent = jsonTheo.theo_stats.min?.toFixed(3) ?? "–";
      document.getElementById("max-theo").textContent = jsonTheo.theo_stats.max?.toFixed(3) ?? "–";
      document.getElementById("time_theo").textContent = jsonTheo.time_theo?.toFixed(2) ?? "–";
    }

    // Histogram
    if (jsonHist.hist_stats) {
      document.getElementById("mean-hist").textContent = jsonHist.hist_stats.mean?.toFixed(3) ?? "–";
      document.getElementById("var-hist").textContent = jsonHist.hist_stats.variance?.toFixed(3) ?? "–";
      document.getElementById("skew-hist").textContent = jsonHist.hist_stats.skewness?.toFixed(3) ?? "–";
      document.getElementById("kurt-hist").textContent = jsonHist.hist_stats.kurtosis?.toFixed(3) ?? "–";
      document.getElementById("min-hist").textContent = jsonHist.hist_stats.min?.toFixed(3) ?? "–";
      document.getElementById("max-hist").textContent = jsonHist.hist_stats.max?.toFixed(3) ?? "–";
      document.getElementById("time_hist").textContent = jsonHist.time_hist?.toFixed(2) ?? "–";
    }

    if (jsonHist.other_stats) {
      document.getElementById("N-total").textContent = jsonHist.other_stats.N_total?.toFixed(0) ?? "–";
      document.getElementById("r-value").textContent = jsonHist.other_stats.r?.toFixed(5) ?? "–";
    }

  } catch (err) {
    console.error("Błąd przy generowaniu obu:", err);
  }
}

// ---------------- Zapis wykresu jako JPG ----------------
function saveChartAsJPG() {
  if (!window.currentChart) return;

  const canvas = document.getElementById("histogram-chart");
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = canvas.width;
  tmpCanvas.height = canvas.height;
  const ctx = tmpCanvas.getContext("2d");

  ctx.fillStyle = "#ffffff"; // białe tło
  ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
  ctx.drawImage(canvas, 0, 0);

  const dataURL = tmpCanvas.toDataURL("image/jpeg", 1.0);

  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "chart.jpg";
  link.click();
}

// ---------------- Eventy ----------------
document.getElementById("btn-theo").addEventListener("click", generateTheory);
document.getElementById("btn-hist").addEventListener("click", generateHistogram);
document.getElementById("btn-both").addEventListener("click", generateBoth);
document.getElementById("btn-save").addEventListener("click", saveChartAsJPG);

});