#!/usr/bin/env python3
"""
Fetch portfolio data from the Alpaca API and save it to a JSON file.

This script pulls your current positions, one year of daily portfolio history,
and recent orders from Alpaca.  The result is a single JSON document that
includes summary metrics (total return, annualised return and Sharpe ratio).

Credentials are read from the environment – no secrets are stored in the
repository.  See `.env.example` for the required variables.

Usage:
    python scripts/fetch_alpaca_data.py

The generated file will be written to `data/alpaca_data.json` in the
repository root.
"""

import json
import math
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv


def load_credentials() -> Dict[str, str]:
    """Load Alpaca API credentials from environment variables."""
    # Try to load variables from a .env file if present
    load_dotenv()
    api_key = os.getenv("APCA_API_KEY_ID")
    secret_key = os.getenv("APCA_API_SECRET_KEY")
    base_url = os.getenv("APCA_API_BASE_URL", "https://paper-api.alpaca.markets")
    if not api_key or not secret_key:
        raise ValueError(
            "Missing Alpaca API credentials. Set APCA_API_KEY_ID and APCA_API_SECRET_KEY in your environment."
        )
    return {"api_key": api_key, "secret_key": secret_key, "base_url": base_url}


def alpaca_get(endpoint: str, creds: Dict[str, str]) -> Optional[Any]:
    """Perform a GET request against the Alpaca API."""
    url = f"{creds['base_url']}{endpoint}"
    headers = {
        "APCA-API-KEY-ID": creds["api_key"],
        "APCA-API-SECRET-KEY": creds["secret_key"],
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as exc:
        print(f"Error fetching {endpoint}: {exc}")
        return None


def compute_metrics(history: Dict[str, Any]) -> Dict[str, float]:
    """Compute total return, annualised return and Sharpe ratio from history."""
    if not history or not isinstance(history.get("equity"), list) or not isinstance(history.get("timestamp"), list):
        return {"annualizedReturn": 0.0, "sharpeRatio": 0.0, "totalReturn": 0.0}

    raw_equity = [float(x) for x in history["equity"] if x is not None]
    raw_timestamps = [int(x) for x in history["timestamp"] if x is not None]
    n = min(len(raw_equity), len(raw_timestamps))
    if n < 2:
        return {"annualizedReturn": 0.0, "sharpeRatio": 0.0, "totalReturn": 0.0}
    equities = raw_equity[:n]
    timestamps = raw_timestamps[:n]
    # Remove non‑positive values
    pairs = [(eq, ts) for eq, ts in zip(equities, timestamps) if eq > 0]
    if len(pairs) < 2:
        return {"annualizedReturn": 0.0, "sharpeRatio": 0.0, "totalReturn": 0.0}
    equities, timestamps = zip(*pairs)

    # Daily returns
    returns: List[float] = []
    for prev, curr in zip(equities[:-1], equities[1:]):
        r = (curr - prev) / prev
        if math.isfinite(r):
            returns.append(r)

    if len(returns) < 2:
        return {"annualizedReturn": 0.0, "sharpeRatio": 0.0, "totalReturn": 0.0}

    first_equity = equities[0]
    last_equity = equities[-1]
    total_return = (last_equity / first_equity) - 1

    days = (timestamps[-1] - timestamps[0]) / 86400.0
    annualized_return = 0.0
    if days > 0:
        years = days / 365.25
        if years > 0:
            annualized_return = math.pow(last_equity / first_equity, 1 / years) - 1

    # Sharpe ratio (assumes risk‑free rate of zero)
    mean_return = sum(returns) / len(returns)
    variance = sum((r - mean_return) ** 2 for r in returns) / (len(returns) - 1)
    std_dev = math.sqrt(variance) if variance > 0 else 0.0
    sharpe_ratio = (mean_return / std_dev) * math.sqrt(252) if std_dev > 0 else 0.0

    return {
        "annualizedReturn": float(annualized_return) if math.isfinite(annualized_return) else 0.0,
        "sharpeRatio": float(sharpe_ratio) if math.isfinite(sharpe_ratio) else 0.0,
        "totalReturn": float(total_return) if math.isfinite(total_return) else 0.0,
    }


def fetch_alpaca_data() -> Dict[str, Any]:
    """Fetch positions, history and orders from Alpaca and compute metrics."""
    creds = load_credentials()
    print("Fetching positions…")
    positions = alpaca_get("/v2/positions", creds) or []
    print(f"Retrieved {len(positions)} positions")

    print("Fetching portfolio history…")
    history = alpaca_get("/v2/account/portfolio/history?period=1A&timeframe=1D", creds) or {}
    print(f"History points: {len(history.get('equity', []))}")

    print("Fetching orders…")
    orders = alpaca_get("/v2/orders?status=all&limit=100&nested=true", creds) or []
    print(f"Orders fetched: {len(orders)}")

    metrics = compute_metrics(history)
    print("Computed metrics:", metrics)

    return {
        "lastUpdated": datetime.now().isoformat(),
        "positions": positions,
        "history": history,
        "orders": orders,
        "metrics": metrics,
    }


def save_json(data: Dict[str, Any], filename: str) -> None:
    """Save a dictionary as a pretty‑printed JSON file."""
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"✅ Saved data to {filename}")


def main() -> None:
    """Entry point for CLI usage."""
    try:
        data = fetch_alpaca_data()
        output_path = os.path.join(os.path.dirname(__file__), "..", "data", "alpaca_data.json")
        save_json(data, os.path.abspath(output_path))
        print("\nDone! The dashboard will now load fresh Alpaca data.")
    except Exception as exc:
        print(f"❌ Failed to fetch Alpaca data: {exc}")


if __name__ == "__main__":
    main()