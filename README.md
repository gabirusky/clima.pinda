# 🌡️ MAPA DE CALOR LOCAL
### *Pindamonhangaba, SP | 85 anos de dados climáticos*
🔗 **Acesse online**: [gabirusky.github.io/clima.pinda](https://gabirusky.github.io/clima.pinda/)

---

## Sobre o Projeto (Design & Experiência)

Uma experiência de dados imersiva no formato *scrollytelling* que transforma 85 anos de registros climáticos brutos de Pindamonhangaba em uma história visceral e humana sobre o aquecimento gradual de um vale brasileiro. 

**Regra de Design:** Se o usuário conseguir ler a página inteira sem *sentir* o calor, o design falhou.

A estética baseia-se no jornalismo de dados editorial, focado em tratar os dados como arte:
- **Cores & Atmosfera**: Fundo azul marinho profundo constratando com tons quentes de âmbar e vermelho (representando o aumento das temperaturas).
- **Tipografia**: Uso rigoroso da fonte *Raleway* para garantir títulos marcantes e textos corporais legíveis e elegantes.
- **Visualizações Interativas**: Painéis intercalados com animações graduais ativadas por rolagem (*Framer Motion* e *Scrollama*) e fundo dinâmico de faixas climáticas (*climate stripes*) em proporção de tela cheia.

---

## Índices Climáticos Monitorados (ETCCDI)

As métricas calculadas ao longo do período baseiam-se nos parâmetros do padrão internacional ETCCDI:

| Métrica | Índice Base | Definição |
|---------|-------------|-----------|
| **SU25** | SU25 | Dias no ano onde a temperatura máxima (T_max) ≥ 25°C |
| **SU30** | SU30 (modificado)| Dias no ano onde a temperatura máxima (T_max) ≥ 30°C |
| **TR20** | TR20 | Noites tropicais onde a temperatura mínima (T_min) ≥ 20°C |
| **DTR** | DTR | Média da amplitude térmica diária (T_max − T_min) |
| **WSDI** | WSDI | Dias de ondas de calor (≥6 dias seguidos com T_max acima do percentil 90 da base 1961–1990) |
| **TX90p** | TX90p | Porcentagem de dias onde T_max excede o limite do percentil 90 histórico |
| **TN90p** | TN90p | Porcentagem de noites onde T_min excede o limite do percentil 90 histórico |
| **CDD** | CDD | Máximo de dias secos consecutivos (< 1mm de precipitação) |
| **CWD** | CWD | Máximo de dias úmidos consecutivos (≥ 1mm de precipitação) |
| **R10mm** | R10mm | Número de dias de chuva forte (precipitação ≥ 10mm) |
| **R20mm** | R20mm | Número de dias de chuva muito forte (precipitação ≥ 20mm) |
| **SDII** | SDII | Índice simples de intensidade de precipitação (média em dias úmidos, mm/dia) |
| **Rx1day**| Rx1day | Quantidade máxima de precipitação registrada em um único dia (mm) |
---

## Extremos e Marcos Históricos (1940–2025)

Baseado nos dados processados, os maiores recordes absolutos de Pindamonhangaba no período analisado são:

- **Dia mais quente:** 38,2 °C (28/09/1961)
- **Dia mais frio:** 1,3 °C (01/06/1979)
- **Onda de calor mais longa (WSDI):** 82 dias seguidos (2018)
- **Ano com mais dias quentes extremados (SU30):** 140 dias (2024)
- **Dia mais chuvoso:** 153,6 mm numa única data (25/01/1947)
- **Temperatura média histórico-base (1940–1980):** 20,3 °C
- **Maior anomalia de temperatura reportada:** +1,9 °C (anos de 2019 e 2024, em relação à média base)

---

## Metodologia de Projeção

Para desenhar os cenários probabilísticos até 2040 e 2050, aplicamos extrapolações matemáticas rigorosas sobre os dados históricos:

1. **Tendência Linear Padrão**: Uma regressão linear simples computada detalhadamente sobre a série histórica completa.
2. **Extrapolação Acelerada (*Slope-Anchor*)**: Composta para capturar a real aceleração contemporânea do aquecimento, calculando a taxa de crescimento da média móvel de 1991–2020. Esta via é atrelada/ancorada no último valor contatado da série para harmonizar visual e matematicamente o encerramento do histórico com o traçado futuro, sempre respeitando as diretrizes climáticas da Organização Meteorológica Mundial (OMM).

---

## Como Rodar Localmente

### 1. Web Frontend

```bash
npm install
npm run dev
# Acesse localmente via http://localhost:5173/clima.pinda/
```

### 2. Pipeline de Dados (Python)

```bash
conda env create -f data/environment.yml
conda activate pinda-climate

python data/scripts/fetch_climate_data.py    # 1. Download de telemetria brura (Open-Meteo/ERA5)
python data/scripts/process_climate_data.py  # 2. Sanitização e preenchimento de hiatos
python data/scripts/calculate_metrics.py     # 3. Consolidação dos índices primários ETCCDI
python data/scripts/generate_web_data.py     # 4. Formatação de pacotes JSON para Frontend
```

### 3. Testes Globais

```bash
npm test                         # Bateria JS (Jest + Testing Library)
python -m pytest data/tests/ -v  # Bateria Python (Pytest)
```

---

## Resumo Tecnológico

| Escopo | Stack Central |
|--------|---------------|
| **Frontend UI** | React 18 · Vite 5 · TypeScript Strict |
| **Sistema de Estilos** | Tailwind CSS v4 · shadcn/ui · Fonte Raleway |
| **Visualizações Base** | D3.js v7 · Recharts · Leaflet.js |
| **Comportamento & Animação** | Framer Motion · Scrollama |
| **Otimização** | vite-plugin-pwa (Agressive Workbox) |
| **Engenharia de Dados** | Python Core (pandas · numpy · scipy) |
| **Infraestrutura Automática** | GitHub Pages · GitHub Actions CI/CD |

---

## Fontes e Licenças

- **Lógica e UI**: Sob lincença `MIT`
- **Telemetria Primária** (1940–2025): [Open-Meteo / ERA5](https://open-meteo.com) (Copernicus/ECMWF) — CC BY 4.0
- **Cross-Validation de Dados**: Dados validados contra a malha geofísica do NASA POWER / MERRA-2
- **Inspiração Direta de Paleta**: [Ed Hawkins / Climate Stripes](https://showyourstripes.info/)
- **Mapas Interativos**: Mapas distribuídos e baseados sob © [OpenStreetMap](https://www.openstreetmap.org/copyright)
