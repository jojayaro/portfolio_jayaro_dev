// Configuration constants
const CHART_CONFIG = {
  responsive: true,
  displayModeBar: false
};

const CHART_LAYOUT = {
  showlegend: false,
  height: 250,
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  xaxis: { showgrid: false, visible: false },
  yaxis: { showgrid: false },
  margin: { l: 25, r: 20, b: 20, t: 20, pad: 5 }
};

const DATA_CONFIG = {
  solarWindDataPoints: 120,
  dstDataPoints: 12,
  updateInterval: 60000
};

/**
 * Creates or updates a Plotly chart
 */
async function createChart(elementId, data, layout = CHART_LAYOUT, config = CHART_CONFIG) {
  try {
    await Plotly.newPlot(elementId, data, layout, config);
  } catch (error) {
    console.error(`Error creating chart for ${elementId}:`, error);
  }
}

/**
 * Safely updates display element with formatted value
 */
function updateLastDisplay(elementId, value) {
  try {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = value;
    }
  } catch (error) {
    console.error(`Error updating display for ${elementId}:`, error);
  }
}

/**
 * Formats a numeric value with unit
 */
function formatValue(value, unit) {
  if (value === null || value === undefined) return `-- ${unit}`;
  return `${parseFloat(value).toFixed(1)} ${unit}`;
}

/**
 * Fetches JSON data from URL and processes it
 */
async function fetchAndProcessData(url, processFunction) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    await processFunction(data);
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
  }
}

/**
 * Processes magnetometer data and renders chart
 */
async function processMagnetometerData(data) {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('No magnetometer data available');
    return;
  }

  const timeTags = data.map(entry => entry.time_tag);
  const hp = data.map(entry => parseFloat(entry.Hp));
  
  const lastHp = hp[hp.length - 1];
  updateLastDisplay("last_magnetometer", formatValue(lastHp, "nT"));
  
  await createChart('magnetometer_chart', [{ x: timeTags, y: hp, mode: 'lines', name: 'Magnetometer' }]);
}

/**
 * Processes solar wind data and renders charts for Bz, Bt, speed, density, and temperature
 */
async function processSolarWindData(data) {
  if (!Array.isArray(data) || data.length < 2) {
    console.warn('No solar wind data available');
    return;
  }

  const [, ...dataRows] = data;
  const recentData = dataRows.slice(-DATA_CONFIG.solarWindDataPoints);
  
  if (recentData.length === 0) {
    console.warn('Insufficient solar wind data');
    return;
  }

  const timeTags = recentData.map(row => row[0]);
  const speed = recentData.map(row => parseFloat(row[1]));
  const density = recentData.map(row => parseFloat(row[2]));
  const temperature = recentData.map(row => parseFloat(row[3]));
  const bz = recentData.map(row => parseFloat(row[6]));
  const bt = recentData.map(row => parseFloat(row[7]));

  updateLastDisplay("last_bz", formatValue(bz[bz.length - 1], "nT"));
  updateLastDisplay("last_speed", formatValue(speed[speed.length - 1], "km/s"));
  updateLastDisplay("last_density", formatValue(density[density.length - 1], "cm^-3"));
  updateLastDisplay("last_temp", formatValue(temperature[temperature.length - 1], "K"));

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

/**
 * Processes Dst index data and renders chart
 */
async function processDstData(data) {
  if (!Array.isArray(data) || data.length < 2) {
    console.warn('No Dst data available');
    return;
  }

  const [, ...dataRows] = data;
  const recentData = dataRows.slice(-DATA_CONFIG.dstDataPoints);
  
  if (recentData.length === 0) {
    console.warn('Insufficient Dst data');
    return;
  }

  const timeTags = recentData.map(row => row[0]);
  const dstValues = recentData.map(row => parseFloat(row[1]));

  updateLastDisplay("last_dst", formatValue(dstValues[dstValues.length - 1], "nT"));
  await createChart('dst_chart', [{ x: timeTags, y: dstValues, mode: 'lines', name: 'Dst' }]);
}

/**
 * Fetches all data sources and updates charts
 */
async function updateAllCharts() {
  await Promise.all([
    fetchAndProcessData("https://services.swpc.noaa.gov/json/goes/primary/magnetometers-6-hour.json", processMagnetometerData),
    fetchAndProcessData("https://services.swpc.noaa.gov/products/geospace/propagated-solar-wind.json", processSolarWindData),
    fetchAndProcessData("https://services.swpc.noaa.gov/products/kyoto-dst.json", processDstData)
  ]);
}

// Initial chart load
updateAllCharts();

// Update charts every 60 seconds
setInterval(updateAllCharts, DATA_CONFIG.updateInterval);