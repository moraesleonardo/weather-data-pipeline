const API_BASE_URL = "http://127.0.0.1:5000";

const regionSelect = document.getElementById("regionSelect");
const variableSelect = document.getElementById("variableSelect");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const loadButton = document.getElementById("loadButton");
const errorMessage = document.getElementById("errorMessage");

const averageValue = document.getElementById("averageValue");
const minimumValue = document.getElementById("minimumValue");
const maximumValue = document.getElementById("maximumValue");

const chartCanvas = document.getElementById("weatherChart");
const comparisonCanvas = document.getElementById("comparisonChart");

let weatherChart = null;
let comparisonChart = null;

const variableLabels = {
    temperature: "Temperatura",
    humidity: "Umidade",
    precipitation: "Chuva",
    wind_speed: "Vento",
};

const variableUnits = {
    temperature: "°C",
    humidity: "%",
    precipitation: "mm",
    wind_speed: "km/h",
};

const monthMap = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
};

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
}

function clearError() {
    errorMessage.textContent = "";
    errorMessage.style.display = "none";
}

async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.error || "Erro ao buscar dados da API.";
        throw new Error(message);
    }

    return response.json();
}

function formatDateLabel(dateTimeText) {
    const parts = dateTimeText.split(" ");

    const day = parts[1].padStart(2, "0");
    const month = monthMap[parts[2]];
    const hour = parts[4].substring(0, 5);

    return `${day}/${month} - ${hour}`;
}

function formatDateForInput(dateTimeText) {
    const parts = dateTimeText.split(" ");

    const day = parts[1].padStart(2, "0");
    const month = monthMap[parts[2]];
    const year = parts[3];

    return `${year}-${month}-${day}`;
}

function getHourFromDateTime(dateTimeText) {
    const parts = dateTimeText.split(" ");
    return parts[4].substring(0, 2);
}

async function loadRegions() {
    const regions = await fetchJson(`${API_BASE_URL}/regions`);

    regionSelect.innerHTML = "";

    regions.forEach(region => {
        const option = document.createElement("option");
        option.value = region.id;
        option.textContent = `${region.name} - ${region.country}`;
        regionSelect.appendChild(option);
    });
}

function buildWeatherUrl() {
    const regionId = regionSelect.value;
    const variable = variableSelect.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    let url = `${API_BASE_URL}/weather?region_id=${regionId}&variable=${variable}`;

    if (startDate) {
        url += `&start=${startDate}`;
    }

    if (endDate) {
        url += `&end=${endDate}`;
    }

    return url;
}

function buildWeatherUrlWithoutDateFilters() {
    const regionId = regionSelect.value;
    const variable = variableSelect.value;

    return `${API_BASE_URL}/weather?region_id=${regionId}&variable=${variable}`;
}

function buildSummaryUrl() {
    const regionId = regionSelect.value;
    const variable = variableSelect.value;

    return `${API_BASE_URL}/summary?region_id=${regionId}&variable=${variable}`;
}

function buildComparisonUrl() {
    const variable = variableSelect.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    let url = `${API_BASE_URL}/comparison?variable=${variable}`;

    if (startDate) {
        url += `&start=${startDate}`;
    }

    if (endDate) {
        url += `&end=${endDate}`;
    }

    return url;
}

async function updateDateLimits() {
    const data = await fetchJson(buildWeatherUrlWithoutDateFilters());

    if (!data.length) {
        return;
    }

    const firstDate = formatDateForInput(data[0].date_time);
    const lastDate = formatDateForInput(data[data.length - 1].date_time);

    startDateInput.min = firstDate;
    startDateInput.max = lastDate;

    endDateInput.min = firstDate;
    endDateInput.max = lastDate;

    if (startDateInput.value && startDateInput.value < firstDate) {
        startDateInput.value = firstDate;
    }

    if (startDateInput.value && startDateInput.value > lastDate) {
        startDateInput.value = lastDate;
    }

    if (endDateInput.value && endDateInput.value < firstDate) {
        endDateInput.value = firstDate;
    }

    if (endDateInput.value && endDateInput.value > lastDate) {
        endDateInput.value = lastDate;
    }
}

async function loadSummary() {
    const summary = await fetchJson(buildSummaryUrl());

    const unit = variableUnits[variableSelect.value];

    averageValue.textContent = `${summary.average} ${unit}`;
    minimumValue.textContent = `${summary.minimum} ${unit}`;
    maximumValue.textContent = `${summary.maximum} ${unit}`;
}

async function loadWeatherChart() {
    const data = await fetchJson(buildWeatherUrl());

    if (!data.length) {
        showError("Não há dados disponíveis para o filtro selecionado.");
        return;
    }

    const filteredData = data.filter(item => {
        const hour = getHourFromDateTime(item.date_time);
        return hour === "00" || hour === "12";
    });

    if (!filteredData.length) {
        showError("Não há dados nos horários 00:00 ou 12:00 para o filtro selecionado.");
        return;
    }

    const labels = filteredData.map(item => formatDateLabel(item.date_time));
    const values = filteredData.map(item => Number(item.value));

    const selectedVariable = variableSelect.value;
    const label = `${variableLabels[selectedVariable]} (${variableUnits[selectedVariable]})`;

    if (weatherChart) {
        weatherChart.destroy();
    }

    weatherChart = new Chart(chartCanvas, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: label,
                    data: values,
                    tension: 0.3,
                    pointRadius: 3,
                },
            ],
        },
        options: {
            responsive: true,
            interaction: {
                mode: "index",
                intersect: false,
            },
            scales: {
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 45,
                    },
                },
                y: {
                    beginAtZero: false,
                },
            },
        },
    });
}

async function loadComparisonChart() {
    const data = await fetchJson(buildComparisonUrl());

    if (!data.length) {
        showError("Não há dados comparativos disponíveis para o período selecionado.");
        return;
    }

    const labels = data.map(item => item.region);
    const values = data.map(item => Number(item.average));

    const selectedVariable = variableSelect.value;
    const label = `Média de ${variableLabels[selectedVariable]} (${variableUnits[selectedVariable]})`;

    if (comparisonChart) {
        comparisonChart.destroy();
    }

    comparisonChart = new Chart(comparisonCanvas, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: label,
                    data: values,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                },
            },
        },
    });
}

async function updateDashboard() {
    try {
        clearError();

        await updateDateLimits();
        await loadSummary();
        await loadWeatherChart();
        await loadComparisonChart();

    } catch (error) {
        console.error("Erro ao atualizar dashboard:", error);

        showError(
            "Não foi possível carregar os dados. Verifique se o backend Flask está rodando em http://127.0.0.1:5000."
        );
    }
}

loadButton.addEventListener("click", updateDashboard);

regionSelect.addEventListener("change", updateDashboard);
variableSelect.addEventListener("change", updateDashboard);

loadRegions()
    .then(updateDashboard)
    .catch(error => {
        console.error("Erro ao carregar regiões:", error);

        showError(
            "Não foi possível carregar as regiões. Verifique se o backend Flask está rodando."
        );
    });