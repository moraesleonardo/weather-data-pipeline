# Weather Data Pipeline

Pipeline completo de dados meteorológicos desenvolvido com Python, PostgreSQL, Flask, Docker e dashboard web em HTML, CSS e JavaScript. O projeto consome dados da API pública Open-Meteo, armazena as informações em um banco relacional PostgreSQL, disponibiliza os dados por meio de uma API Flask e apresenta os resultados em um dashboard web com filtros e visualizações gráficas.

1. Objetivo:
Construir um pipeline completo de dados, desde a ingestão até a visualização, permitindo analisar e comparar dados meteorológicos entre diferentes regiões e períodos.

2. Tecnologias utilizadas:
- Python
- Flask
- PostgreSQL
- HTML, CSS e JavaScript
- Chart.js
- Docker e Docker Compose
- Nginx
- Open-Meteo API
- Git/GitHub

3. Arquitetura da solução:

Open-Meteo API
     ↓
Python ingestion script
     ↓
PostgreSQL
     ↓
Flask API
     ↓
HTML/CSS/JavaScript Dashboard

Com Docker, a aplicação roda em três serviços:

PostgreSQL container
Flask backend container
Nginx frontend container

4. Funcionalidades
- Coleta de dados meteorológicos via Python.
- Armazenamento dos dados em PostgreSQL.
- API própria em Flask.
- Dashboard web conectado à API.
- Filtros por região, período e variável climática.
- Cards com média, mínimo e máximo.
- Gráfico de linha para evolução temporal.
- Gráfico de barras para comparação entre regiões.
- Tratamento de erros no frontend e backend.
- Logs de ingestão e requisições. 
- Deploy em VPS usando Docker.
- Regiões e variáveis analisadas

5. Regiões:
- São Paulo
- Rio de Janeiro
- Brasília
- Belo Horizonte
- Belém

6. Variáveis climáticas:
- Temperatura
- Umidade relativa
- Precipitação
- Velocidade do vento

7. Estrutura do projeto
weather-data-pipeline/
│
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── database.py
│   ├── ingest.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── Dockerfile
│
├── sql/
│   └── schema.sql
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
Modelagem do banco

8. O banco possui duas tabelas principais:

- Regions

Armazena as regiões utilizadas no projeto, com nome, país, latitude e longitude.

- Weather_data

Armazena os dados meteorológicos coletados, incluindo data/hora, temperatura, umidade, precipitação e velocidade do vento.

A tabela weather_data possui relacionamento com regions por meio de region_id.

9. Tratamento de erros e logs: O projeto inclui tratamento de erros no frontend e backend para situações como:
- API indisponível.
- Variável climática inválida.
- Região inválida.
- Ausência de dados para o filtro selecionado.
- Erros internos no servidor.

10, Também foram adicionados logs com a biblioteca logging, registrando:
- início e fim da ingestão;
- cidade processada;
- quantidade de registros inseridos;
- requisições recebidas;
- quantidade de registros retornados pelas rotas.

11. Uso de IA no desenvolvimento: A IA generativa foi utilizada como apoio durante o desenvolvimento do projeto, principalmente para:

- apoiar a criação do script de ingestão em Python;
- apoiar a modelagem SQL;
- estruturar as rotas Flask;
- criar e ajustar o dashboard em HTML, CSS e JavaScript;
- melhorar tratamento de erros e logs;
- criar a estrutura Docker;
- revisar e organizar a documentação.


Todas as sugestões geradas com apoio de IA foram revisadas, adaptadas e testadas durante o desenvolvimento.

12. Deploy
A aplicação foi publicada em uma VPS usando Docker Compose.

Serviços publicados:
Frontend: http://31.97.170.27:8080
Backend:  http://31.97.170.27:5000

O deploy utiliza containers para PostgreSQL, Flask e Nginx.

Observação: o deploy foi feito em HTTP, sem certificado SSL, por se tratar de uma entrega acadêmica.

Observações sobre os dados: 
- Nesta versão, o pipeline coleta dados meteorológicos recentes da API Open-Meteo. A ingestão é executada sob demanda pelo script: python backend/ingest.py
- Em um ambiente de produção, essa execução poderia ser agendada para manter o banco atualizado automaticamente.

13. Melhorias futuras
- Configurar domínio e HTTPS.
- Agendar a ingestão automaticamente.
- Criar uma rota agregada /dashboard para reduzir chamadas da interface.
- Ampliar o período histórico dos dados.
- Adicionar novas visualizações, como heatmap.
- Melhorar o layout responsivo.

14. Link da aplicação publicada
- A aplicação foi publicada temporariamente em uma VPS utilizando Docker:
http://31.97.170.27:8080
