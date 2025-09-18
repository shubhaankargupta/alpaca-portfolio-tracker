# Setup and Usage

This document supplements the information in the main `README.md`.  
It provides additional details on installing dependencies, preparing your environment and troubleshooting common issues.

## 1. Installing dependencies

### Python

Create a virtual environment and install the required packages using `pip`:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Packages include:

- `requests` – used by `fetch_alpaca_data.py` to call the Alpaca API.
- `yfinance` – fetches historical index data from Yahoo Finance.
- `pandas` – helps structure and manipulate the downloaded data.
- `python-dotenv` – loads environment variables from your `.env` file.

### Node

The Node server uses only built‑in modules.  
Running `npm install` will simply create a `package-lock.json`; no external dependencies are downloaded.

## 2. Environment variables

The scripts and server rely on Alpaca API credentials.  
These are read from environment variables.  Copy the provided `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and set `APCA_API_KEY_ID` and `APCA_API_SECRET_KEY` to your own keys.  
If you’re using the free paper trading endpoint, leave `APCA_API_BASE_URL` as `https://paper-api.alpaca.markets`.  
Adjust the `PORT` value if you need the web server to listen on a different port.

## 3. Fetching live data

Once your environment is set up, you can populate the dashboard with live data:

```bash
python scripts/fetch_alpaca_data.py        # fetches your positions, history and orders
python scripts/fetch_benchmark_data.py     # pulls S&P 500 and NASDAQ data
```

These scripts overwrite the corresponding files in the `data/` directory.  
They will not expose your API keys – the keys live only in your `.env` file.

## 4. Running the dashboard

Start the Node server with:

```bash
npm start
```

Visit `http://localhost:3000` in your browser.  
If you’ve run the data fetch scripts, the dashboard will show your latest portfolio information.  
Otherwise it will use the default sample data.

## 5. Troubleshooting

- **No positions, metrics or chart displayed** – ensure you have valid JSON files in the `data/` directory.  Run the fetch scripts or copy the sample files into place.
- **Failed to fetch Alpaca data** – confirm that your API keys are correct and that your network allows HTTPS requests to `paper-api.alpaca.markets`.
- **Benchmark data appears outdated** – run `python scripts/fetch_benchmark_data.py` again.  The script downloads the last year of index data.
- **Server not starting** – check that no other application is using the port specified in `.env`.  Change the `PORT` if necessary.

If you encounter other issues, please open an issue or submit a pull request.