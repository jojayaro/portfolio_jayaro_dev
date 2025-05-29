const chartConfig = {
  responsive: true,
  displayModeBar: false
};

const SOLAR_WIND_DATA_POINTS = 120;
const DST_DATA_POINTS = 12;

const chartLayout = {
  showlegend: false,
  height: 250,
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  xaxis: { showgrid: false, visible: false },
  yaxis: { showgrid: false },
  margin: { l: 25, r: 20, b: 20, t: 20, pad: 5 }
};

async function createOrUpdateChart(elementId, data, layout = chartLayout, config = chartConfig) {
  const chartDiv = document.getElementById(elementId);
  if (chartDiv && chartDiv.data) {
    // Chart exists, update it
    // For Plotly.update, data needs to be structured by trace
    // e.g., { x: [newXArray], y: [newYArray] } for each trace
    // The 'data' parameter passed to this function is an array of trace objects
    const updateData = {};
    data.forEach((trace, index) => {
      if (trace.x) updateData[`x[${index}]`] = trace.x;
      if (trace.y) updateData[`y[${index}]`] = trace.y;
      // Add other properties if needed, e.g., name, mode
    });
    try {
      await Plotly.update(elementId, updateData);
    } catch (error) {
      console.error(`Error updating chart ${elementId}:`, error);
    }
  } else {
    // Chart doesn't exist, create it
    try {
      await Plotly.newPlot(elementId, data, layout, config);
    } catch (error) {
      console.error(`Error creating chart ${elementId}:`, error);
    }
  }
}

// The original updateChart might not be needed if createOrUpdateChart handles both cases.
// async function updateChart(elementId, data) {
//   await Plotly.update(elementId, data);
// }

function calculateAverage(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function updateLastDisplay(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
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
  await createOrUpdateChart('magnetometer_chart', [{ x: timeTags, y: hp, mode: 'lines', name: 'Magnetometer' }]);
}

async function processSolarWindData(data) {
  const [, ...dataRows] = data;
  const relevantDataRows = dataRows.slice(-SOLAR_WIND_DATA_POINTS);

  const timeTags = relevantDataRows.map(row => row[0]);
  const speed = relevantDataRows.map(row => parseFloat(row[1]));
  const density = relevantDataRows.map(row => parseFloat(row[2]));
  const temperature = relevantDataRows.map(row => parseFloat(row[3]));
  const bz = relevantDataRows.map(row => parseFloat(row[6]));
  const bt = relevantDataRows.map(row => parseFloat(row[7]));

  updateLastDisplay("last_bz", (bz[bz.length - 1]).toFixed(1) + " nT");
  updateLastDisplay("last_speed", (speed[speed.length - 1]).toFixed(1) + " km/s");
  updateLastDisplay("last_density", (density[density.length - 1]).toFixed(1) + " cm^-3");
  updateLastDisplay("last_temp", (temperature[temperature.length - 1]).toFixed(1) + " K");

  await Promise.all([
    createOrUpdateChart('bz_chart', [
      { x: timeTags, y: bz, mode: 'lines', name: 'Bz' },
      { x: timeTags, y: bt, mode: 'lines', name: 'Bt' }
    ]),
    createOrUpdateChart('speed_chart', [{ x: timeTags, y: speed, mode: 'lines', name: 'Speed' }]),
    createOrUpdateChart('density_chart', [{ x: timeTags, y: density, mode: 'lines', name: 'Density' }]),
    createOrUpdateChart('temp_chart', [{ x: timeTags, y: temperature, mode: 'lines', name: 'Temperature' }])
  ]);
}

async function processDstData(data) {
  const [, ...dataRows] = data;
  const relevantDataRows = dataRows.slice(-DST_DATA_POINTS);

  const timeTags = relevantDataRows.map(row => row[0]);
  const dstValues = relevantDataRows.map(row => parseFloat(row[1]));

  updateLastDisplay("last_dst", (dstValues[dstValues.length - 1]).toFixed(1) + " nT");
  await createOrUpdateChart('dst_chart', [{ x: timeTags, y: dstValues, mode: 'lines', name: 'Dst' }]);
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
