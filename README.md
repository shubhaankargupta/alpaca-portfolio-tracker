# Alpaca Portfolio Tracker
![Banner](/assets/alpaca.png "a title")

**Alpaca Portfolio Tracker** is a self‑hosted dashboard for monitoring your investment portfolio alongside popular market benchmarks such as
the S&P 500 and NASDAQ Composite once you start trading. Use this to test strategies, make trades, compete with peers, and flex in quant interviews.
It is designed with privacy in mind – no sensitive account data or trade history needs to be published publicly. 

This repository provides a simple Node server, a lightweight front‑end powered by Chart.js, and Python scripts for pulling data from the Alpaca trading API and Yahoo Finance. It's not problem if you've never worked with Node before (I hadn't either) - by the end of this, you will.
You can use the provided sanitised sample data to experiment with the dashboard or fetch fresh data yourself using your own API keys.  

## Features

- 📈 **Performance Metrics** – calculate total return, annualized returns and Sharpe ratio from your Alpaca account history.
- 📊 **Portfolio vs Benchmarks** – compare your portfolio’s percentage return against the S&P 500 and NASDAQ Composite indices.
- 🧾 **Positions & Trades** – display your current open positions and a rolling trade history.
- 🔧 **Self‑hosted** – run locally without exposing any secrets; all API keys are pulled from environment variables.
- 🧪 **Sample data** – explore the dashboard with safe, anonymised JSON files contained in the `data/` directory.
- 🔥 **Online visibility** – publish your portfolio on a personal domain to show off.

## Getting started

### Prerequisites

The project requires the following software installed on your system:

- **Python 3.8+** – used to fetch data from external APIs.
- **Node.js 14+** – runs the simple web server.
- **pip** – Python package manager.


## Setting up Alpaca

1. **Sign up for Alpaca**  
   Go to [alpaca.markets](https://alpaca.markets) and create a free account.  
   Switch to **Paper Trading** (fake money) so you can practice without monetary risk.

2. **Create API Keys**  
   - In your Alpaca dashboard, go to **Your Account → API Keys**.  
   - Generate a new key pair. You will get:
     - `APCA_API_KEY_ID`
     - `APCA_API_SECRET_KEY`  
   - Copy these somewhere safe — Alpaca won’t show the secret again.



## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your‑username/alpaca‑portfolio‑tracker.git
   cd alpaca‑portfolio‑tracker
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

   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Make sure you are properly connected to Alpaca and pasted `APCA_API_KEY_ID` `APCA_API_SECRET_KEY` in `.env`.

   Optionally, make trades to display on your public portfolio. You may use the GUI or (cooler) API alternatives:

   - [Alpaca Docs](https://github.com/alpacahq/alpaca-py)
   - [Sample Alpaca Notebooks](https://github.com/alpacahq/notebooks)

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
alpaca-portfolio-tracker/
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