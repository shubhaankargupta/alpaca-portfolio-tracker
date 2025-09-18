#!/usr/bin/env python3
"""
Fetch historical S&P 500 and NASDAQ Composite data from Yahoo Finance.

This script downloads one year of daily closing prices for the S&P 500 (^GSPC)
and NASDAQ Composite (^IXIC) indices using the `yfinance` library.  It then
saves the data as a JSON document in the `data/` directory for the dashboard
to consume.

Usage:
    python scripts/fetch_benchmark_data.py

If you run into connectivity problems, please check your internet connection.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List

import pandas as pd
import yfinance as yf


def download_index(symbol: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
    """Download historical closing prices for a given Yahoo Finance ticker."""
    ticker = yf.Ticker(symbol)
    history = ticker.history(start=start_date, end=end_date)
    data: List[Dict[str, Any]] = []
    for date, row in history.iterrows():
        close = row.get("Close")
        if pd.notna(close):
            data.append({
                "date": date.strftime("%Y-%m-%d"),
                "value": float(close),
            })
    return data


def fetch_benchmark_data() -> Dict[str, Any]:
    """Fetch S&P 500 and NASDAQ Composite data for the past year."""
    print("Downloading benchmark data from Yahoo Finance…")
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)
    sp500_data = download_index("^GSPC", start_date, end_date)
    nasdaq_data = download_index("^IXIC", start_date, end_date)
    print(f"S&P 500 points: {len(sp500_data)} | NASDAQ points: {len(nasdaq_data)}")
    return {
        "lastUpdated": datetime.now().isoformat(),
        "sp500Data": sp500_data,
        "nasdaqData": nasdaq_data,
    }


def save_json(data: Dict[str, Any], filename: str) -> None:
    """Write a dictionary to a JSON file."""
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"✅ Saved benchmark data to {filename}")


def main() -> None:
    data = fetch_benchmark_data()
    # Build the output path relative to the repository root
    output_path = os.path.join(os.path.dirname(__file__), "..", "data", "benchmark_data.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    save_json(data, output_path)
    print("\nDone! The dashboard will now load fresh benchmark data.")


if __name__ == "__main__":
    main()