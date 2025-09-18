/*
 * Front‑end logic for the MacroStrat dashboard.
 *
 * This module fetches JSON data, formats it for display and renders
 * tables and charts using Chart.js.  It is written as an ES module and
 * assumes that Chart.js has been loaded globally via a `<script>` tag.
 */

const ALPACA_JSON_PATH = '../data/sample_alpaca_data.json';
const BENCHMARK_JSON_PATH = '../data/sample_benchmark_data.json';
const TRADES_JSON_PATH = '../data/sample_trades.json';

let performanceChart = null;

function formatPercent(value) {
  if (typeof value !== 'number' || isNaN(value)) return '0.00%';
  return (value * 100).toFixed(2) + '%';
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') {
    return '$0.00';
  }
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return '$0.00';
  }
  return '$' + numValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (err) {
    return dateStr;
  }
}

function formatDateTime(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (err) {
    return dateStr;
  }
}

async function loadAlpacaData() {
  const response = await fetch(ALPACA_JSON_PATH);
  if (!response.ok) {
    throw new Error(`Failed to load Alpaca data: ${response.status}`);
  }
  return await response.json();
}

async function loadBenchmarkData() {
  const response = await fetch(BENCHMARK_JSON_PATH);
  if (!response.ok) {
    throw new Error(`Failed to load benchmark data: ${response.status}`);
  }
  const data = await response.json();
  return {
    sp500Data: data.sp500Data || [],
    nasdaqData: data.nasdaqData || [],
    lastUpdated: data.lastUpdated,
  };
}

async function loadTradeHistory() {
  try {
    const response = await fetch(TRADES_JSON_PATH);
    if (!response.ok) {
      throw new Error(`Failed to load trade history: ${response.status}`);
    }
    const data = await response.json();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const recent = (data.trades || []).filter((trade) => {
      const date = new Date(trade.date);
      return date >= threeMonthsAgo;
    });
    recent.sort((a, b) => new Date(b.date) - new Date(a.date));
    return recent;
  } catch (err) {
    console.error('Error loading trade history:', err);
    return [];
  }
}

function renderPositions(positions) {
  const container = document.getElementById('positions-container');
  if (!positions || positions.length === 0) {
    container.innerHTML = '<p class="loading">No open positions.</p>';
    return;
  }
  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Symbol</th>
        <th>Quantity</th>
        <th>Market Value</th>
        <th>Unrealised P/L</th>
        <th>Entry Price</th>
        <th>Current Price</th>
      </tr>
    </thead>
    <tbody>
      ${positions
        .map((pos) => {
          const qty = Number(pos.qty || 0);
          const marketValue = Number(pos.market_value || 0);
          const unrealisedPL = Number(pos.unrealized_pl || 0);
          const entryPrice = Number(pos.avg_entry_price || pos.cost_basis || 0);
          const currentPrice = Number(
            pos.current_price || (qty > 0 ? marketValue / qty : 0)
          );
          return `
          <tr>
            <td><strong>${pos.symbol || 'N/A'}</strong></td>
            <td>${qty.toLocaleString()}</td>
            <td>${formatCurrency(marketValue)}</td>
            <td class="${unrealisedPL >= 0 ? 'positive' : 'negative'}">
              ${formatCurrency(unrealisedPL)}
            </td>
            <td>${formatCurrency(entryPrice)}</td>
            <td>${formatCurrency(currentPrice)}</td>
          </tr>
          `;
        })
        .join('')}
    </tbody>
  `;
  container.innerHTML = '';
  container.appendChild(table);
}

function renderMetrics(metrics) {
  const container = document.getElementById('metrics-container');
  container.innerHTML = `
    <div class="metric-card">
      <h3>Total Return</h3>
      <p class="${(metrics.totalReturn || 0) >= 0 ? 'positive' : 'negative'}">
        ${formatPercent(metrics.totalReturn || 0)}
      </p>
    </div>
    <div class="metric-card">
      <h3>Annualised Return</h3>
      <p class="${(metrics.annualizedReturn || 0) >= 0 ? 'positive' : 'negative'}">
        ${formatPercent(metrics.annualizedReturn || 0)}
      </p>
    </div>
    <div class="metric-card">
      <h3>Sharpe Ratio</h3>
      <p>${(metrics.sharpeRatio ?? 0).toFixed(2)}</p>
    </div>
  `;
}

function renderTradeHistory(trades) {
  const container = document.getElementById('trades-container');
  if (!trades || trades.length === 0) {
    container.innerHTML = '<p class="loading">No trades in the last 3 months.</p>';
    return;
  }
  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Date</th>
        <th>Ticker</th>
        <th>Type</th>
        <th>Entry Price</th>
        <th>Exit Price</th>
        <th>Quantity</th>
        <th>Realised P/L</th>
      </tr>
    </thead>
    <tbody>
      ${trades
        .map((trade) => {
          return `
          <tr>
            <td>${formatDate(trade.date)}</td>
            <td><strong>${trade.ticker}</strong></td>
            <td style="font-weight: 600; color: ${
              trade.type === 'Long' ? '#2e7d32' : '#d32f2f'
            }">${trade.type}</td>
            <td>${formatCurrency(trade.enterPrice)}</td>
            <td>${formatCurrency(trade.exitPrice)}</td>
            <td>${Number(trade.quantity).toLocaleString()}</td>
            <td class="${trade.realizedPL >= 0 ? 'positive' : 'negative'}">
              ${formatCurrency(trade.realizedPL)}
            </td>
          </tr>
          `;
        })
        .join('')}
    </tbody>
  `;
  container.innerHTML = '';
  container.appendChild(table);
  // Summary statistics
  const totalPL = trades.reduce((sum, t) => sum + (t.realizedPL || 0), 0);
  const winning = trades.filter((t) => (t.realizedPL || 0) > 0).length;
  const total = trades.length;
  const winRate = total > 0 ? ((winning / total) * 100).toFixed(1) : '0.0';
  const summary = document.createElement('div');
  summary.style.marginTop = '1rem';
  summary.style.padding = '1rem';
  summary.style.backgroundColor = '#f8f9fa';
  summary.style.borderRadius = '8px';
  summary.innerHTML = `
    <h4 style="margin: 0 0 0.5rem 0; color: #333;">Trade Summary</h4>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
      <div>
        <strong>Total P/L:</strong>
        <span class="${totalPL >= 0 ? 'positive' : 'negative'}">${formatCurrency(totalPL)}</span>
      </div>
      <div>
        <strong>Win Rate:</strong> ${winRate}% (${winning}/${total})
      </div>
      <div>
        <strong>Total Trades:</strong> ${total}
      </div>
    </div>
  `;
  container.appendChild(summary);
}

function renderPerformanceChart(portfolioHistory, benchmarkData) {
  const ctx = document.getElementById('performance-chart').getContext('2d');
  if (performanceChart) {
    performanceChart.destroy();
  }
  const labels = [];
  const portfolioData = [];
  if (portfolioHistory && portfolioHistory.equity && portfolioHistory.timestamp) {
    const eq = portfolioHistory.equity;
    const ts = portfolioHistory.timestamp;
    let startEquity = eq.find((v) => v > 0) || eq[0];
    for (let i = 0; i < eq.length; i++) {
      if (eq[i] && ts[i] && startEquity > 0) {
        const date = new Date(ts[i] * 1000);
        labels.push(date.toISOString().split('T')[0]);
        portfolioData.push(((eq[i] / startEquity) - 1) * 100);
      }
    }
  }
  const sp500Data = [];
  const nasdaqData = [];
  if (labels.length > 0 && benchmarkData.sp500Data && benchmarkData.sp500Data.length > 0) {
    benchmarkData.sp500Data.forEach((point, idx) => {
      if (idx < labels.length) {
        sp500Data.push(((point.value / benchmarkData.sp500Data[0].value) - 1) * 100);
      }
    });
    benchmarkData.nasdaqData.forEach((point, idx) => {
      if (idx < labels.length) {
        nasdaqData.push(((point.value / benchmarkData.nasdaqData[0].value) - 1) * 100);
      }
    });
  } else if (benchmarkData.sp500Data && benchmarkData.sp500Data.length > 0) {
    benchmarkData.sp500Data.forEach((point, idx) => {
      if (idx < 52) {
        labels.push(point.date);
        sp500Data.push(((point.value / benchmarkData.sp500Data[0].value) - 1) * 100);
      }
    });
    benchmarkData.nasdaqData.forEach((point, idx) => {
      if (idx < 52) {
        nasdaqData.push(((point.value / benchmarkData.nasdaqData[0].value) - 1) * 100);
      }
    });
  }
  if (labels.length === 0) {
    ctx.font = '16px IBM Plex Sans';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('No data available for chart', ctx.canvas.width / 2, ctx.canvas.height / 2);
    return;
  }
  performanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Portfolio',
          data: portfolioData,
          borderColor: '#1a73e8',
          backgroundColor: 'rgba(26, 115, 232, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.1,
        },
        {
          label: 'S&P 500',
          data: sp500Data,
          borderColor: '#34a853',
          backgroundColor: 'rgba(52, 168, 83, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
        },
        {
          label: 'NASDAQ',
          data: nasdaqData,
          borderColor: '#ea4335',
          backgroundColor: 'rgba(234, 67, 53, 0.1)',
          borderWidth: 2,
          fill: false,
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date',
          },
          ticks: {
            maxTicksLimit: 10,
            callback: function (value, index, values) {
              const label = this.getLabelForValue(value);
              if (index % Math.ceil(values.length / 8) === 0) {
                return label;
              }
              return '';
            },
          },
        },
        y: {
          title: {
            display: true,
            text: 'Return (%)',
          },
          ticks: {
            callback: function (value) {
              return value.toFixed(1) + '%';
            },
          },
        },
      },
      plugins: {
        title: {
          display: true,
          text: 'Portfolio Returns',
          font: { size: 16, weight: 'bold' },
        },
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
            },
          },
        },
      },
    },
  });
}

function updateLastUpdatedFooter(alpacaData, benchmarkData) {
  const container = document.getElementById('last-updated');
  const dates = [];
  if (alpacaData && alpacaData.lastUpdated) {
    dates.push({ label: 'Portfolio', date: alpacaData.lastUpdated });
  }
  if (benchmarkData && benchmarkData.lastUpdated) {
    dates.push({ label: 'Market', date: benchmarkData.lastUpdated });
  }
  if (dates.length === 0) {
    container.innerHTML = 'Data timestamps not available';
    return;
  }
  const dateStrings = dates.map((d) => `${d.label}: ${formatDateTime(d.date)}`);
  container.innerHTML = `Last Updated – ${dateStrings.join(' | ')} | made by Shubhaankar Gupta`;
}

async function loadDashboard() {
  try {
    const [alpacaData, benchmarkData, trades] = await Promise.all([
      loadAlpacaData(),
      loadBenchmarkData(),
      loadTradeHistory(),
    ]);
    renderPositions(alpacaData.positions || []);
    renderMetrics(alpacaData.metrics || {});
    renderTradeHistory(trades);
    renderPerformanceChart(alpacaData.history || {}, benchmarkData);
    updateLastUpdatedFooter(alpacaData, benchmarkData);
  } catch (err) {
    console.error('Dashboard loading error:', err);
    const errorEl = document.getElementById('error');
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }
}

// Initialise dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', loadDashboard);