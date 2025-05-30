const chartConfig = {
  responsive: true,
  displayModeBar: false
};

const chartLayout = {
  showlegend: false,
  height: 250,
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  xaxis: { showgrid: false, visible: false },
  yaxis: { showgrid: false },
  margin: { l: 25, r: 20, b: 20, t: 20, pad: 5 }
};

async function createChart(elementId, data, layout = chartLayout, config = chartConfig) {
  await Plotly.newPlot(elementId, data, layout, config);
}

async function updateChart(elementId, data) {
  await Plotly.update(elementId, data);
}

function calculateAverage(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function updateLastDisplay(elementId, value) {
  document.getElementById(elementId).innerHTML = value;
}

async function fetchAndProcessData(url, processFunction) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    await processFunction(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

async function processMagnetometerData(data) {
  const timeTags = data.map(entry => entry.time_tag);
  const hp = data.map(entry => parseFloat(entry.Hp));
  updateLastDisplay("last_magnetometer", (hp[hp.length - 1]).toFixed(1) + " nT");
  await createChart('magnetometer_chart', [{ x: timeTags, y: hp, mode: 'lines', name: 'Magnetometer' }]);
}

async function processSolarWindData(data) {
  const [, ...dataRows] = data;
  const timeTags = dataRows.slice(-120).map(row => row[0]);
  const speed = dataRows.slice(-120).map(row => parseFloat(row[1]));
  const density = dataRows.slice(-120).map(row => parseFloat(row[2]));
  const temperature = dataRows.slice(-120).map(row => parseFloat(row[3]));
  const bz = dataRows.slice(-120).map(row => parseFloat(row[6]));
  const bt = dataRows.slice(-120).map(row => parseFloat(row[7]));

  updateLastDisplay("last_bz", (bz[bz.length - 1]).toFixed(1) + " nT");
  updateLastDisplay("last_speed", (speed[speed.length - 1]).toFixed(1) + " km/s");
  updateLastDisplay("last_density", (density[density.length - 1]).toFixed(1) + " cm^-3");
  updateLastDisplay("last_temp", (temperature[temperature.length - 1]).toFixed(1) + " K");

  await Promise.all([
    createChart('bz_chart', [
      { x: timeTags, y: bz, mode: 'lines', name: 'Bz' },
      { x: timeTags, y: bt, mode: 'lines', name: 'Bt' }
    ]),
    createChart('speed_chart', [{ x: timeTags, y: speed, mode: 'lines', name: 'Speed' }]),
    createChart('density_chart', [{ x: timeTags, y: density, mode: 'lines', name: 'Density' }]),
    createChart('temp_chart', [{ x: timeTags, y: temperature, mode: 'lines', name: 'Temperature' }])
  ]);
}

async function processDstData(data) {
  const [, ...dataRows] = data;
  const timeTags = dataRows.map(row => row[0]).slice(-12);
  const dstValues = dataRows.map(row => parseFloat(row[1])).slice(-12);

  updateLastDisplay("last_dst", (dstValues[dstValues.length - 1]).toFixed(1) + " nT");
  await createChart('dst_chart', [{ x: timeTags, y: dstValues, mode: 'lines', name: 'Dst' }]);
}

async function updateAllCharts() {
  await Promise.all([
    fetchAndProcessData("https://services.swpc.noaa.gov/json/goes/primary/magnetometers-6-hour.json", processMagnetometerData),
    fetchAndProcessData("https://services.swpc.noaa.gov/products/geospace/propagated-solar-wind.json", processSolarWindData),
    fetchAndProcessData("https://services.swpc.noaa.gov/products/kyoto-dst.json", processDstData)
  ]);
}

updateAllCharts();

setInterval(updateAllCharts, 60000);