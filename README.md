# MacroStrat Portfolio Tracker

**MacroStrat Portfolio Tracker** is a self‑hosted dashboard for monitoring your investment portfolio alongside popular market benchmarks.  
It is designed with privacy in mind – no sensitive account data or trade history needs to be published publicly.  

This repository provides a simple Node/Express server, a lightweight front‑end powered by Chart.js, and Python scripts for pulling data from the Alpaca trading API and Yahoo Finance.  
You can use the provided sanitised sample data to experiment with the dashboard or fetch fresh data yourself using your own API keys.  

## Features

- 📈 **Performance Metrics** – calculate total return, annualised return and Sharpe ratio from your Alpaca account history.
- 📊 **Portfolio vs Benchmarks** – compare your portfolio’s percentage return against the S&P 500 and NASDAQ Composite indices.
- 🧾 **Positions & Trades** – display your current open positions and a rolling trade history.
- 🔧 **Self‑hosted** – run locally without exposing any secrets; all API keys are pulled from environment variables.
- 🧪 **Sample data** – explore the dashboard with safe, anonymised JSON files contained in the `data/` directory.

## Getting started

### Prerequisites

The project requires the following software installed on your system:

- **Python 3.8+** – used to fetch data from external APIs.
- **Node.js 14+** – runs the simple web server.
- **pip** – Python package manager.

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your‑username/macrostrat‑portfolio‑tracker.git
   cd macrostrat‑portfolio‑tracker
   ```

2. **Create a virtual environment and install Python dependencies**:

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Install Node dependencies (optional)**:

   The Node server uses only core modules, so there are no runtime dependencies.  
   A minimal `package.json` is included to allow `npm start` to run the server:

   ```bash
   npm install
   ```

4. **Copy and configure environment variables**:

   The application uses environment variables to access the Alpaca API and configure the server.  
   Copy `.env.example` to `.env` and fill in your credentials:

   ```bash
   cp .env.example .env
   # then edit .env with your API keys
   ```

5. **Fetch fresh data (optional)**:

   To populate the dashboard with your own portfolio and benchmark data, run the provided scripts.  
   These scripts save JSON files into the `data/` directory which the front‑end will read.

   ```bash
   # fetch Alpaca positions, history and orders
   python scripts/fetch_alpaca_data.py

   # fetch S&P 500 and NASDAQ benchmark data from Yahoo Finance
   python scripts/fetch_benchmark_data.py
   ```

   The repository ships with anonymised sample files in `data/` so you can explore the dashboard without running these scripts.

6. **Start the server**:

   ```bash
   npm start
   ```

   The web server will serve the dashboard at [http://localhost:3000](http://localhost:3000).  
   Open your browser to see the portfolio metrics, charts and tables.  

## Repository structure

```
macrostrat-portfolio-tracker/
├── README.md            # project overview and instructions (this file)
├── LICENSE              # MIT licence for the project
├── .gitignore           # files and folders to exclude from git
├── .env.example         # sample environment variables (copy to .env)
├── requirements.txt     # Python dependencies for data fetching scripts
├── package.json         # Node project metadata (provides npm start)
├── docs/
│   └── setup.md         # additional setup and troubleshooting notes
├── scripts/
│   ├── fetch_alpaca_data.py      # fetch portfolio data from Alpaca API
│   └── fetch_benchmark_data.py   # fetch benchmark data from Yahoo Finance
├── server/
│   └── server.js        # simple Node/Express server for API and static assets
├── src/
│   ├── index.html       # front‑end dashboard (loads JSON from data/)
│   ├── css/
│   │   └── styles.css   # extracted stylesheet for the dashboard
│   └── js/
│       └── dashboard.js # front‑end logic to render charts and tables
├── data/
│   ├── sample_alpaca_data.json    # anonymised sample portfolio data
│   ├── sample_benchmark_data.json # anonymised benchmark data
│   └── sample_trades.json         # anonymised trade history
└── assets/
    ├── banner.jpg        # header/banner image for documentation or custom pages
    └── favicon.png       # favicon used by the dashboard
```

### Data directory

The `data/` folder contains JSON files that the dashboard reads.  
By default, the files included in this repository are anonymised and do not contain any sensitive information.  
Running the Python scripts will overwrite these files with your own data.  
You can also point the front‑end to a different directory by adjusting the fetch paths in `src/js/dashboard.js`.

### Running without Alpaca

If you don’t have an Alpaca account or prefer not to fetch live data, you can still explore the dashboard using the provided sample files.  
Simply start the server with `npm start` and browse to the dashboard to see how the charts and tables look with dummy data.

## Contributing

Contributions to improve this project are welcome!  
Feel free to open issues or pull requests.  
When contributing code, please ensure that no API keys, account identifiers or trade history are committed to the repository.

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.