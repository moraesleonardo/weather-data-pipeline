import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from database import fetch_all


app = Flask(__name__)
app.json.ensure_ascii = False
CORS(app)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger(__name__)


@app.before_request
def log_request():
    logger.info(
        "Requisição recebida: %s %s",
        request.method,
        request.path
    )


@app.errorhandler(404)
def not_found(error):
    logger.warning("Rota não encontrada: %s", request.path)

    return jsonify({
        "error": "Rota não encontrada."
    }), 404


@app.errorhandler(500)
def internal_error(error):
    logger.exception("Erro interno no servidor: %s", error)

    return jsonify({
        "error": "Erro interno no servidor."
    }), 500


ALLOWED_VARIABLES = {
    "temperature": "temperature",
    "humidity": "humidity",
    "precipitation": "precipitation",
    "wind_speed": "wind_speed",
}


@app.route("/")
def home():
    return jsonify({
        "message": "Weather Pipeline API",
        "routes": [
            "/regions",
            "/weather",
            "/summary",
            "/comparison"
        ]
    })


@app.route("/regions")
def get_regions():
    query = """
        SELECT id, name, country, latitude, longitude
        FROM regions
        ORDER BY name;
    """

    try:
        regions = fetch_all(query)

        logger.info(
            "Consulta /regions executada. Regiões retornadas: %s.",
            len(regions)
        )

        return jsonify(regions)

    except Exception as error:
        logger.exception("Erro ao buscar regiões: %s", error)

        return jsonify({
            "error": "Erro ao buscar regiões.",
            "details": str(error)
        }), 500


@app.route("/weather")
def get_weather():
    region_id = request.args.get("region_id")
    variable = request.args.get("variable", "temperature")
    start = request.args.get("start")
    end = request.args.get("end")

    if variable not in ALLOWED_VARIABLES:
        logger.warning("Variável climática inválida recebida: %s", variable)
        return jsonify({"error": "Variável climática inválida."}), 400

    if region_id and not region_id.isdigit():
        logger.warning("region_id inválido recebido: %s", region_id)
        return jsonify({"error": "region_id deve ser um número inteiro."}), 400

    column = ALLOWED_VARIABLES[variable]

    query = f"""
        SELECT
            r.name AS region,
            w.date_time,
            w.{column} AS value
        FROM weather_data w
        JOIN regions r ON r.id = w.region_id
        WHERE 1 = 1
    """

    params = []

    if region_id:
        query += " AND r.id = %s"
        params.append(region_id)

    if start:
        query += " AND DATE(w.date_time) >= %s"
        params.append(start)

    if end:
        query += " AND DATE(w.date_time) <= %s"
        params.append(end)

    query += " ORDER BY w.date_time;"

    try:
        data = fetch_all(query, params)

        logger.info(
            "Consulta /weather executada. Registros retornados: %s.",
            len(data)
        )

        return jsonify(data)

    except Exception as error:
        logger.exception("Erro ao buscar dados meteorológicos: %s", error)

        return jsonify({
            "error": "Erro ao buscar dados meteorológicos.",
            "details": str(error)
        }), 500


@app.route("/summary")
def get_summary():
    region_id = request.args.get("region_id")
    variable = request.args.get("variable", "temperature")

    if variable not in ALLOWED_VARIABLES:
        logger.warning("Variável climática inválida recebida: %s", variable)
        return jsonify({"error": "Variável climática inválida."}), 400

    if region_id and not region_id.isdigit():
        logger.warning("region_id inválido recebido: %s", region_id)
        return jsonify({"error": "region_id deve ser um número inteiro."}), 400

    column = ALLOWED_VARIABLES[variable]

    query = f"""
        SELECT
            ROUND(AVG({column}), 2) AS average,
            ROUND(MIN({column}), 2) AS minimum,
            ROUND(MAX({column}), 2) AS maximum
        FROM weather_data
        WHERE 1 = 1
    """

    params = []

    if region_id:
        query += " AND region_id = %s"
        params.append(region_id)

    try:
        result = fetch_all(query, params)

        logger.info("Consulta /summary executada.")

        if not result:
            logger.warning("Nenhum dado encontrado na consulta /summary.")
            return jsonify({"error": "Nenhum dado encontrado."}), 404

        return jsonify(result[0])

    except Exception as error:
        logger.exception("Erro ao calcular resumo dos dados: %s", error)

        return jsonify({
            "error": "Erro ao calcular resumo dos dados.",
            "details": str(error)
        }), 500


@app.route("/comparison")
def get_comparison():
    variable = request.args.get("variable", "temperature")
    start = request.args.get("start")
    end = request.args.get("end")

    if variable not in ALLOWED_VARIABLES:
        logger.warning("Variável climática inválida recebida: %s", variable)
        return jsonify({"error": "Variável climática inválida."}), 400

    column = ALLOWED_VARIABLES[variable]

    query = f"""
        SELECT
            r.name AS region,
            ROUND(AVG(w.{column}), 2) AS average
        FROM weather_data w
        JOIN regions r ON r.id = w.region_id
        WHERE 1 = 1
    """

    params = []

    if start:
        query += " AND DATE(w.date_time) >= %s"
        params.append(start)

    if end:
        query += " AND DATE(w.date_time) <= %s"
        params.append(end)

    query += """
        GROUP BY r.name
        ORDER BY r.name;
    """

    try:
        data = fetch_all(query, params)

        logger.info(
            "Consulta /comparison executada. Regiões retornadas: %s.",
            len(data)
        )

        if not data:
            logger.warning("Nenhum dado encontrado na consulta /comparison.")
            return jsonify({"error": "Nenhum dado encontrado para comparação."}), 404

        return jsonify(data)

    except Exception as error:
        logger.exception("Erro ao buscar dados de comparação: %s", error)

        return jsonify({
            "error": "Erro ao buscar dados de comparação.",
            "details": str(error)
        }), 500


# if __name__ == "__main__":
#     app.run(debug=True)
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)