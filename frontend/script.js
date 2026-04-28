const API_BASE_URL = "http://31.97.170.27:5000";

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
let isLoading = false;

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

function getDateParts(dateTimeText) {
    const parts = dateTimeText.split(" ");

    const day = parts[1].padStart(2, "0");
    const month = monthMap[parts[2]];
    const year = parts[3];
    const hour = parts[4].substring(0, 5);

    return { day, month, year, hour };
}

function formatDateLabel(dateTimeText) {
    const { day, month, hour } = getDateParts(dateTimeText);
    return `${day}/${month} - ${hour}`;
}

function formatDateForInput(dateTimeText) {
    const { day, month, year } = getDateParts(dateTimeText);
    return `${year}-${month}-${day}`;
}

function formatDateForDisplay(isoDate) {
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
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

function validateDateRange() {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (startDate && endDate && endDate < startDate) {
        showError("A data final não pode ser anterior à data inicial.");
        return false;
    }

    return true;
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

async function loadDateOptions() {
    const data = await fetchJson(buildWeatherUrlWithoutDateFilters());

    if (!data.length) {
        return;
    }

    const uniqueDates = [...new Set(
        data.map(item => formatDateForInput(item.date_time))
    )];

    startDateInput.innerHTML = "";
    endDateInput.innerHTML = "";

    const allStartOption = document.createElement("option");
    allStartOption.value = "";
    allStartOption.textContent = "Início da base";

    const allEndOption = document.createElement("option");
    allEndOption.value = "";
    allEndOption.textContent = "Fim da base";

    startDateInput.appendChild(allStartOption);
    endDateInput.appendChild(allEndOption);

    uniqueDates.forEach(date => {
        const startOption = document.createElement("option");
        startOption.value = date;
        startOption.textContent = formatDateForDisplay(date);
        startDateInput.appendChild(startOption);

        const endOption = document.createElement("option");
        endOption.value = date;
        endOption.textContent = formatDateForDisplay(date);
        endDateInput.appendChild(endOption);
    });
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
                    pointRadius: 1,
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
                        autoSkip: true,
                        maxTicksLimit: 10,
                        maxRotation: 45,
                        minRotation: 0,
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
    if (isLoading) {
        return;
    }

    try {
        isLoading = true;
        loadButton.disabled = true;
        loadButton.textContent = "Carregando...";

        clearError();

        if (!validateDateRange()) {
            return;
        }

        await loadSummary();
        await loadWeatherChart();
        await loadComparisonChart();

    } catch (error) {
        console.error("Erro ao atualizar dashboard:", error);

        showError(
            "Não foi possível carregar os dados. Verifique se o backend Flask está rodando."
        );

    } finally {
        isLoading = false;
        loadButton.disabled = false;
        loadButton.textContent = "Atualizar dashboard";
    }
}

async function initializeDashboard() {
    try {
        clearError();

        await loadRegions();
        await loadDateOptions();
        await updateDashboard();

    } catch (error) {
        console.error("Erro ao inicializar dashboard:", error);

        showError(
            "Não foi possível inicializar o dashboard. Verifique se a API está disponível."
        );
    }
}

loadButton.addEventListener("click", updateDashboard);

initializeDashboard();