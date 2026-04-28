import psycopg2
from psycopg2.extras import RealDictCursor
from config import DB_CONFIG


def get_connection():
    """
    Cria uma conexão com o banco PostgreSQL.
    """
    return psycopg2.connect(**DB_CONFIG)


def fetch_all(query, params=None):
    """
    Executa uma consulta SELECT e retorna todos os registros.
    """
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()


def execute_query(query, params=None):
    """
    Executa comandos INSERT, UPDATE ou DELETE.
    """
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            conn.commit()