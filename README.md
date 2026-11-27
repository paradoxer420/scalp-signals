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

## Min win % filter (research7.mjs)
"Min win %" (default 90) hides every coin whose backtest with the current strategy did not win at least that share of 10+ trades. It applies to Can enter now, the scanner and the best-coins chart. Set it to 0 to go back to the profit-factor filter. In the 50-coin test (Auto strategies, older data) no coin reached 90%: best 52-59%, median 35-40%. A coin's older win rate did not predict its newer win rate (correlation 0.04 on 5m, -0.11 on 15m, 0.27 on 1h). These strategies win about 40% of the time on purpose and pay back about 2:1, so a 90% win rate would need tiny targets, which was not tested here.

## Signal room, six strategies, paper tracker (latest update)
- **Six strategies feed the signal room** (research8.mjs, 50 coins, older 60% / newer 40% of the data, fee 0.05% per side): trend-flip (with quality filter), pullback, **breakout** (first close beyond the previous 20-candle high/low, ADX>20), **supertrend** flip (price on the right side of EMA50), **squeeze** (Bollinger squeeze then a close outside the band), **VWAP reclaim** (VWAP cross with the trend). Extras use stop 1.5 ATR, target 1.5x.
- **Honest result:** all six lost on the older data (profit factor 0.75-0.96 on every timeframe). Only four setups made money on the newer data: trend-flip 5m 1.21 and 1h 1.09, squeeze 1h 1.05, VWAP reclaim 1h 1.05. None made money on both halves. Every signal row shows "tested older / newer" (green both, yellow newer only, red neither).
- **Room menu:** All strategies / Newer-data winners (picked with hindsight) / just the Strategy dropdown. **Min win %** now defaults to 0 (profit-factor rule); at 90 the room is empty because no coin ever reached 90%.
- **Paper trading log (the workflow that matters):** every signal the room shows while the app is open is logged on the device with entry/stop/target and settled by later candles (stop first if both hit; closed after 30/40 candles). It builds a live forward test per strategy: judge them by that, not by backtests. Clear log button resets it.

## Tweaks tested (research9.mjs): nothing improved the results
Fixed in advance, 50 coins, older 60% vs newer 40%, 0.05% fee per side, profit factor (older / newer):
- **Confluence (several of the six strategies agree within 3 candles).** 5m: any 0.82/0.98, 2+ 0.81/0.94, 3+ 0.89/0.82. 15m: any 0.87/0.91, 2+ 0.90/0.93, 3+ 0.96/0.95 (a small steady improvement, still under 1). 1h: any 0.89/1.02, 2+ 0.85/1.01, 3+ 0.88/0.98. No reliable gain.
- **Trade management** (breakeven after +1R, breakeven plus a 3R target, trailing stop): every version was below 1 on the older data on all timeframes (0.71-0.93). On 1h the newer data showed 1.05-1.08, the older did not, so it looks like market regime, not a fix.
- **What the app does with it:** when strategies agree on a coin the room shows ONE row tagged "N agree". The paper log records every strategy's own signal AND a separate "2+ agree" entry, so the live forward test settles whether agreement matters.

## If the app feels stuck (fixes in the latest update)
- The scanner used to re-analyze every coin inside its sort, hundreds of times per refresh; it now analyzes each coin once (refresh 71 ms down to 25 ms on a PC) and the signal room is computed in small slices (longest freeze 17 ms from cold).
- Refreshes no longer pile up on a slow connection, one hung request can no longer stall a refresh (12 s timeout), polling is every 30 s (signals use closed candles), and problems show in the status line ("data error ... rate-limited", "error: ...") instead of failing silently.
- The offline helper now falls back to its saved copy after 4 s and always checks for a fresh page. Close and reopen the app while online to pick all of this up.

## The unorthodox one: panic fade ("ovx"), and the two that did not make it (research10-output.txt)
Three unconventional ideas were tested with fixed definitions, 50 coins, older 60% vs newer 40%, fee 0.05% per side, profit factor older / newer:
- **Overextension / panic fade (added):** price 3+ ATR from the EMA21 with RSI 22 or lower (or 78+), then a candle back the other way. 5m 1.23 / 0.50, 15m 1.06 / 0.60, 1h 0.90 / 0.73. It was the best on older data (the rule I set in advance), then collapsed on newer data: the usual sign of a lucky fit. It fires rarely (0.04-0.37 signals per coin per day).
- **Liquidity sweep (stop-run reversal), not added:** 5m 0.92 / 0.85, 15m 0.77 / 0.78, 1h 0.88 / 0.93. Steady small loser.
- **Exhaustion fade (6 same-direction candles then a reversal candle), not added:** 5m 0.82 / 0.73, 15m 0.86 / 0.70, 1h 0.87 / 0.87.
Nothing "works like magic": none of the seven strategies made money on both halves of the data. The paper log forward-tests the panic fade like the rest.

## 48-hour check: who stays, who goes (research11.mjs, fresh candles 2026-11-25 16:20 to 2026-11-27 16:20 UTC, 50 coins, fee 0.05% per side)
Profit factor for the last 48 hours, all three timeframes pooled (above 1 made money): supertrend 1.30, pullback 1.27, trend-flip 1.18, breakout 1.15, **MACD flip 1.14 (new)**, **NR7 breakout 1.13 (new)**, squeeze 1.04, VWAP reclaim 0.99, funding fade 0.96, RSI2 0.94, panic fade 0.71.
- **Rule (set before looking):** remove a current strategy if its pooled 48-hour profit factor is below 1; add new candidates only if they were at least 1 over the same 48 hours. **Removed:** VWAP reclaim, panic fade. **Added:** MACD flip (histogram crosses zero with the EMA50 trend), NR7 breakout (close beyond the narrowest-range candle of 7). **Tested, not added:** RSI2 (0.94) and a funding-rate fade (0.96, a different kind of information: crowd positioning).
- **Honest limits:** 48 hours is one short market mood and sits inside the "newer data" used before, so it is not independent proof; most trend strategies made money in a strong move and tend to give it back. On the older data all four new candidates still lost (profit factor 0.74-0.95 older, 0.84-1.03 newer). Signals now show "tested older / newer · 48h". The paper log is still the real test: use **Copy log** to save or share it. Removed strategies stay in old log entries as "(removed)".
