from database import get_connection
try:
    conn = get_connection()
    print("Conexão com PostgreSQL realizada com sucesso.")
    conn.close()
except Exception as error:
    print("Erro ao conectar com PostgreSQL:")
    print(error)