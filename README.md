# 🌡️ Mapa de calor de uma cidade:
### *Pindamonhangaba, SP — 85 anos de dados climáticos*
🔗 **Acesse online**: [gabirusky.github.io/clima.pinda](https://gabirusky.github.io/clima.pinda/)

---

## About

Uma experiência de dados imersiva que transforma 85 anos de registros climáticos de Pindamonhangaba em uma história visual. Sete capítulos narram o aquecimento da cidade — de dias quentes que dobraram em quantidade, a noites sem dormir, ondas de calor que viram rotina, e o custo crescente do ar-condicionado.

**Regra de design**: *Se o usuário consegue ler a página toda sem sentir o calor — o design falhou.*

---

## Resultados

| Métrica | Média histórica | Recorde | Tendência/década |
|---|---|---|---|
| SU30 (dias ≥ 30°C) | 43,3/ano | **140 dias — 2024** | **+7,1 dias** |
| TR20 (noites ≥ 20°C) | 31,6/ano | **99 noites — 2017** | **+5,0 noites** |
| WSDI (ondas de calor) | 13,3/ano | **82 dias — 2018** | **+3,9 dias** |

> Todos os índices seguem o padrão ETCCDI. Tendências com p < 0,0001.

### Metodologia de Projeção (Slope-Anchor)

Para visualizar o futuro (2040 e 2050), não utilizamos modelos climáticos físicos, mas sim extrapolações matemáticas rigorosas sobre os dados históricos:
1. **Modelagem OLS**: Uma regressão linear simples sobre toda a série histórica.
2. **Média Móvel Extrapolada (Slope-Anchor)**: Para capturar a **aceleração recente** do aquecimento — que seria diluída ao considerar as décadas estáveis do século XX —, calculamos a inclinação (taxa de crescimento) da média móvel apenas sobre os **últimos 30 anos**. Em seguida, "ancoramos" essa projeção no último valor real para garantir uma continuidade visual e matemática perfeita.

---

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
