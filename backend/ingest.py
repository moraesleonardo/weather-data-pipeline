import logging
import requests
from database import get_connection


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger(__name__)


REGIONS = [
    {
        "name": "São Paulo",
        "country": "Brazil",
        "latitude": -23.5505,
        "longitude": -46.6333,
    },
    {
        "name": "Rio de Janeiro",
        "country": "Brazil",
        "latitude": -22.9068,
        "longitude": -43.1729,
    },
    {
        "name": "Brasília",
        "country": "Brazil",
        "latitude": -15.7939,
        "longitude": -47.8828,
    },
    {
        "name": "Belo Horizonte",
        "country": "Brazil",
        "latitude": -19.9167,
        "longitude": -43.9345,
    },
    {
        "name": "Belém",
        "country": "Brazil",
        "latitude": -1.4558,
        "longitude": -48.5044,
    },
]


def insert_region(cursor, region):
    """
    Insere uma região caso ela ainda não exista.
    Retorna o id da região.
    """
    cursor.execute(
        """
        SELECT id
        FROM regions
        WHERE name = %s AND country = %s
        """,
        (region["name"], region["country"]),
    )

    existing_region = cursor.fetchone()

    if existing_region:
        return existing_region[0]

    cursor.execute(
        """
        INSERT INTO regions (name, country, latitude, longitude)
        VALUES (%s, %s, %s, %s)
        RETURNING id
        """,
        (
            region["name"],
            region["country"],
            region["latitude"],
            region["longitude"],
        ),
    )

    return cursor.fetchone()[0]


def fetch_weather_data(latitude, longitude):
    """
    Consome dados meteorológicos da API Open-Meteo.
    """
    url = "https://api.open-meteo.com/v1/forecast"

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
        "past_days": 14,
        "forecast_days": 0,
        "timezone": "auto",
    }

    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        return response.json()

    except requests.exceptions.Timeout:
        logger.error("Tempo limite excedido ao acessar a API Open-Meteo.")
        raise

    except requests.exceptions.RequestException as error:
        logger.error("Erro ao consumir a API Open-Meteo: %s", error)
        raise


def insert_weather_data(cursor, region_id, weather_json):
    """
    Insere os dados meteorológicos no banco.
    Retorna a quantidade de registros inseridos.
    """
    hourly = weather_json["hourly"]

    times = hourly["time"]
    temperatures = hourly["temperature_2m"]
    humidities = hourly["relative_humidity_2m"]
    precipitations = hourly["precipitation"]
    wind_speeds = hourly["wind_speed_10m"]

    inserted_count = 0

    for i in range(len(times)):
        cursor.execute(
            """
            INSERT INTO weather_data (
                region_id,
                date_time,
                temperature,
                humidity,
                precipitation,
                wind_speed
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                region_id,
                times[i],
                temperatures[i],
                humidities[i],
                precipitations[i],
                wind_speeds[i],
            ),
        )

        inserted_count += 1

    return inserted_count


def main():
    """
    Executa o pipeline de ingestão:
    coleta → transformação simples → carga no PostgreSQL.
    """
    logger.info("Iniciando pipeline de ingestão de dados meteorológicos.")

    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor()

        total_inserted = 0

        for region in REGIONS:
            logger.info("Coletando dados de %s.", region["name"])

            region_id = insert_region(cursor, region)

            weather_json = fetch_weather_data(
                region["latitude"],
                region["longitude"],
            )

            inserted_count = insert_weather_data(cursor, region_id, weather_json)
            total_inserted += inserted_count

            logger.info(
                "Dados de %s inseridos com sucesso. Registros inseridos: %s.",
                region["name"],
                inserted_count,
            )

        conn.commit()

        logger.info(
            "Pipeline concluído com sucesso. Total de registros inseridos: %s.",
            total_inserted,
        )

    except Exception as error:
        if conn:
            conn.rollback()

        logger.exception("Erro durante a ingestão: %s", error)

    finally:
        if cursor:
            cursor.close()

        if conn:
            conn.close()

        logger.info("Conexão com o banco encerrada.")


if __name__ == "__main__":
    main()