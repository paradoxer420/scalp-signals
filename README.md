# Scalp Signals: how to use

Open-source only: TradingView Lightweight Charts (Apache-2.0) + Binance public market data (no API key, no login, the app cannot trade for you).

## Start
Double-click `start.bat` (needs Python, already installed). Browser opens at http://localhost:8765. Leave the window open.
Click **Enable alerts** once: you get a beep + notification when a new signal appears on any of the 6 coins.

## The strategy (3 confirmations, all must agree)
| | LONG | SHORT (futures only) |
|---|---|---|
| 1 Trend | EMA9 > EMA21 | EMA9 < EMA21 |
| 2 Value | Price > VWAP | Price < VWAP |
| 3 Momentum | RSI14 between 50 and 70 | RSI14 between 30 and 50 |

A signal fires on the candle where the third check flips to true. Stop = 1.5 x ATR, target = stop x Reward:Risk (default 1.5). Fee gate: if the target is smaller than 2x round-trip fees, the app says SKIP.

## Quality filter (checkbox, on by default)
Extra confirmations picked by `research.mjs` (backtests 12 filters + all pairs on 50 futures coins, with an out-of-sample split; rerun it with `node research.mjs`):
- 5m: ADX(14) > 25 and the signal candle closes in the top/bottom 40% of its range.
- 15m: ADX > 20 and Supertrend(10,3) agrees.
- 1h: price on the right side of EMA200 and strong close.
Uncheck it to see raw signals. Swing bias (4h/1d columns) is a separate manual check.

## What the bigger test found (research2.mjs, 50 futures coins, 16 days of 5m / 47 days of 15m / 187 days of 1h)
Settings were chosen on the older 60% of time and graded on the newer 40%. Pooled over all coins, quality-filtered signals: profit factor 5m 0.91 then 1.16, 15m 0.91 then 0.96, 1h 0.95 then 1.08 (older then newer). No exit setting (stop size, reward:risk, hold time) and none of 8 extra filters (stochastic RSI, Bollinger %B, OBV, volatility regime, BTC regime, RSI slope, RSI band, 4h trend) held up. The earlier "profit factor 1.37" on 5m came from a 5-day window and mostly did not repeat. Signals did best in the recent strong sell-off, so treat this as a trend-following tool that loses in chop. Per-coin profit factors (15-30 trades) are mostly noise.

## Pullback strategy (default in the app, switch with the Strategy dropdown)
Rules: trend (EMA21 above EMA50 and rising, mirror for shorts), price dipped to the EMA21 within the last 6 candles with RSI cooled to 45 or less, trigger candle closes beyond the previous candle's extreme with RSI turning; stop just beyond the pullback extreme (0.8-3 ATR), target 2x the stop distance, exit after 40 candles.
Tested with research3.mjs on 50 futures coins (16 days of 5m, 47 days of 15m, 187 days of 1h), settings picked on older data and graded on newer: default settings gave profit factor 0.95 (5m), 0.91 (15m), 0.89 (1h) on the newer data. Of 138-144 setting combinations per timeframe, only 21-31% were profitable on newer data and the median was 0.91-0.95. The best-looking combinations on older data fell apart on newer data (1h: 1.13 then 0.42). Shorts worked better than longs in the recent sell-off. Conclusion: no proven edge; use it to learn and paper-trade, not as a money machine.

## Your routine (per trade)
1. Pick 5m (or 1m) and watch the Scanner. Wait for LONG/SHORT in the Signal column.
2. Click that coin. Check: green "Fee gate passed", Signal age 0 or 1 candle, backtest panel not deep red.
3. Place it yourself on Binance: limit/market at Entry, stop-loss at Stop, take-profit at Take profit, size from the Size line (risks only your Risk %). Always set the stop on the exchange.
4. If neither hit after 30 candles, close it. Don't move the stop away. Stop for the day after 3 losses in a row or -3% account.
5. Paper-trade (Binance Spot Testnet / Futures Testnet) 50+ trades before real money, then start tiny.

## Honest warning
Backtests on the last ~500 candles (about 2 days on 5m) were mixed: some coins net positive, others negative, and at the normal 0.1% spot fee most 1m trades are blocked by the fee gate. 3 indicators confirming is not an edge by itself, nothing here is "perfect", and scalping loses money to fees for most people. Lower fees (BNB discount, maker orders, futures ~0.02%) matter more than any indicator. Change **Fee %/side** to your real fee. Re-check the Backtest panel per coin/timeframe; trade only pairs where Net is positive and Profit factor above 1.3.

## Regime filter (experimental checkbox, off by default; research4.mjs)
Idea built from the earlier findings: only take pullbacks WITH the market (top-50 breadth, bullish minus bearish coins on 1h, at least 50% in the trade's direction) and only the weakest third of coins for shorts or strongest third for longs (24h return). Fixed variants, older 60% vs newer 40%, 50 coins: 5m passed both halves (older 1.09, newer 1.22 at 0.05% fees), 15m and 1h did not (newer 0.87 and 0.66). 1 of 18 tests passing is what luck alone produces, so it stays an experiment. Choppy-market-only trading was the worst bucket on 5m/15m (older 0.74 / 0.80). Fees matter: at 0.02% per side every variant improves but only that same 5m cell stays above 1 on both halves.

## Auto strategy, market state, watchlist (latest update)
- **Auto (default):** picks the strategy per timeframe from what did better on the OLDER data of the 50-coin test (research6.mjs): 5m Trend-flip, 15m and 1h Pullback. On the NEWER data that gave profit factors 1.21 / 0.91 / 0.89, so only 5m is above 1. Requiring a trending market ("trade only with the market") made newer-data results worse (5m trend-flip 1.21 down to 0.85), so Auto does NOT gate on market state.
- **Range-market strategy tested and rejected** (research5.mjs): mean-reversion at Bollinger bands in low-ADX markets lost on both halves in every version (profit factor 0.73 to 0.94), so it is not in the app.
- **Market state badge:** top-50 coins bullish vs bearish on 1h. Context only; it did not improve results in tests.
- **Coins (20/30/50) and Watchlist** (extra crypto USDT perpetuals, e.g. AAVE,SUI): fewer coins is lighter on your phone and on Binance's rate limit. **Settings are remembered** on the device.
