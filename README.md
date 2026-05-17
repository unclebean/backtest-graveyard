# 🪦 Backtest Graveyard

**Backtest Graveyard** is a high-performance, interactive Next.js dashboard designed to visualize and analyze algorithmic trading strategies. Instead of staring at dry console logs, this application brings your backtest data to life with live chart replays, dynamic indicator overlays, and synchronized execution tracking.

## 🚀 Key Features

*   **Live Replay Engine:** Watch your trading algorithms execute historically in a real-time playback environment using TradingView's Lightweight Charts.
*   **Rich Strategy Library:** Comes pre-configured to visualize over a dozen complex technical strategies including:
    *   Bollinger Bands + ADX + RSI
    *   Heikin Ashi SuperTrend
    *   VWAP Momentum
    *   Stochastic MACD Confluence
    *   Double CCI 
    *   And more...
*   **Dynamic Order Tracking:** Automatically tracks "Open Long", "Close Short", etc., explicitly mapping entry and exit nodes directly onto the candlestick data alongside a scrollable P&L table.
*   **Local Data Integration:** Built to securely ingest your raw tick data via static CSV files and backtest execution logs via a local SQLite database (`konjac2.db`).

## 🛠 Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Charting:** [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) (by TradingView)
*   **Database:** `sqlite3`

## 💻 Getting Started

1.  **Clone the repository** and install dependencies:
    ```bash
    npm install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```

3.  **Deploying for Production:**
    To deploy this on a VPS (like DigitalOcean) alongside your local SQLite database:
    ```bash
    npm run build
    npm install -g pm2
    pm2 start npm --name "backtest-graveyard" -- start
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to explore the dashboard.
