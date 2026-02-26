# 🌡️ MAPA DE CALOR LOCAL
### *Pindamonhangaba, SP | 85 anos de dados climáticos*
🔗 **Acesse online**: [gabirusky.github.io/clima.pinda](https://gabirusky.github.io/clima.pinda/)

---

## About

Uma experiência de dados imersiva que transforma 85 anos de registros climáticos de Pindamonhangaba em uma história visual. Sete capítulos narram o aquecimento da cidade desde dias quentes que dobraram em quantidade, às noites sem dormir, ondas de calor que viram rotina, e o custo crescente do ar-condicionado.

**Regra de design**: *Se o usuário consegue ler a página toda sem sentir o calor então o design falhou.*

## Resultados

### Médias e Tendências (ETCCDI)

| Métrica | Média histórica | Recorde | Tendência/década |
|---|---|---|---|
| SU30 (dias ≥ 30°C) | 43,3/ano | **140 dias — 2024** | **+7,1 dias** |
| TR20 (noites ≥ 20°C) | 31,6/ano | **99 noites — 2017** | **+5,0 noites** |
| WSDI (ondas de calor) | 13,3/ano | **82 dias — 2018** | **+3,9 dias** |
| DTR_MEAN (amplitude térmica) | 9,7 °C | **11,3 °C — 1960** | **+0,1 °C** |
| CDD (dias secos seguidos) | 24,7/ano | **49 dias — 2025** | +0,4 dias (ns) |
| CWD (dias úmidos seguidos)| 20,7/ano | **55 dias — 1965** | **-1,5 dias** |

> Todos os índices seguem o padrão ETCCDI. Tendências em negrito indicam significância estatística (p < 0,05, sendo a maioria p < 0,001); "ns" indica ausência de tendência significativa.

### Extremos e Marcos Históricos (1940–2025)

Baseado nos dados processados, os maiores recordes absolutos de Pindamonhangaba são:

- **Dia mais quente:** 38,2 °C (28/09/1961)
- **Dia mais frio:** 1,3 °C (01/06/1979)
- **Dia mais chuvoso:** 153,6 mm (25/01/1947)
- **Onda de calor mais longa (WSDI):** 82 dias (2018)
- **Ano com mais dias quentes (SU30):** 140 dias (2024)
- **Temperatura média histórico-base (1940–1980):** 20,3 °C
- **Maior anomalia de temperatura:** +1,9 °C (2019 e 2024, em relação à média base)

## Metodologia de Projeção
Para visualizar os cenários de 2040 e 2050, aplicamos extrapolações matemáticas rigorosas sobre os dados históricos, em vez de preditores climáticos físicos:

**Tendência Linear Padrão**: Uma regressão linear simples calculada sobre toda a série histórica.

**Extrapolação Recente (Slope-Anchor)**: Para capturar a aceleração do aquecimento, que seria mascarada pelas décadas estáveis do século XX, calculamos a taxa de crescimento da média móvel entre 1991-2020. Essa projeção é "ancorada" no último valor real da série, garantindo uma transição visual e matemática contínua para o futuro.

O uso desse recorte temporal específico alinha-se às [**diretrizes da Organização Meteorológica Mundial (OMM)**](https://library.wmo.int/viewer/55797/download?file=1203_en.pdf&type=pdf&navigator=1).

## Como rodar localmente

### Frontend

```bash
npm install
npm run dev
# Acesse http://localhost:5173/clima.pinda/
```

### Pipeline de dados (Python)

```bash
conda env create -f data/environment.yml
conda activate pinda-climate

python data/scripts/fetch_climate_data.py    # 1. Busca dados (Open-Meteo ERA5)
python data/scripts/process_climate_data.py  # 2. Limpeza e validação
python data/scripts/calculate_metrics.py     # 3. Índices climáticos ETCCDI
python data/scripts/generate_web_data.py     # 4. Gera JSONs para o frontend
```

### Testes

```bash
npm test                  # Testes JS (Jest + Testing Library)
python -m pytest data/tests/ -v  # Testes Python (pytest)
```

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 · Vite 5 · TypeScript |
| Estilos | Tailwind CSS v4 · shadcn/ui |
| Visualizações | D3.js v7 · Recharts · Leaflet |
| Animações | Framer Motion · Scrollama |
| Service Worker | vite-plugin-pwa (Workbox) |
| Pipeline de dados | Python (pandas · numpy · scipy) |
| Hospedagem | GitHub Pages · GitHub Actions |

---

## Fonte dos dados

- **Open-Meteo / ERA5** (Copernicus/ECMWF) — dados primários, 1940–2025
- **NASA POWER / MERRA-2** — validação cruzada (r T_max = 0,893 · r T_min = 0,926)

---

## Licença

- **Código**: MIT
- **Dados climáticos**: CC BY 4.0 — [Open-Meteo](https://open-meteo.com/)
- **Paleta de cores**: inspirada em [Ed Hawkins Climate Stripes](https://showyourstripes.info/)
- **Mapa**: © [OpenStreetMap](https://www.openstreetmap.org/copyright)
