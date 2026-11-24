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

## Your routine (per trade)
1. Pick 5m (or 1m) and watch the Scanner. Wait for LONG/SHORT in the Signal column.
2. Click that coin. Check: green "Fee gate passed", Signal age 0 or 1 candle, backtest panel not deep red.
3. Place it yourself on Binance: limit/market at Entry, stop-loss at Stop, take-profit at Take profit, size from the Size line (risks only your Risk %). Always set the stop on the exchange.
4. If neither hit after 30 candles, close it. Don't move the stop away. Stop for the day after 3 losses in a row or -3% account.
5. Paper-trade (Binance Spot Testnet / Futures Testnet) 50+ trades before real money, then start tiny.

## Honest warning
Backtests on the last ~500 candles (about 2 days on 5m) were mixed: some coins net positive, others negative, and at the normal 0.1% spot fee most 1m trades are blocked by the fee gate. 3 indicators confirming is not an edge by itself, nothing here is "perfect", and scalping loses money to fees for most people. Lower fees (BNB discount, maker orders, futures ~0.02%) matter more than any indicator. Change **Fee %/side** to your real fee. Re-check the Backtest panel per coin/timeframe; trade only pairs where Net is positive and Profit factor above 1.3.
