# Stoch MACD Strategy

欢迎观看 backtest graveyard, 今天我们要回测来证明对ETH没用的指标策略是Stochastic + MACD.
Stochastic指标%K设置为12，%D设置为6.MACD采用默认设置。

多头开仓条件为：当Stoch %D 小于 20 并且 Stoch %K 小于 20 同时 MACD Line 小于 0 并且 MACD Line从小向上穿过 MACD Signal Line。
多头平仓条件为：当MACD Line 小于等于 MACD Signal Line

空头开仓条件为：当Stoch %D 大于 80 并且 Stoch %K 大于 80 同时 MACD Line 大于 0 并且 MACD Line 从上向下穿过 MACD Signal Line。
空头平仓条件为：当MACD Line 大于等于 MACD Signal Line

止盈采用3倍ATR，止损采用了2倍ATR。交易手续费采用Binance的Taker Fee 0.0500%。

我的本金是4000 USDT，接下来我们就以ETH2024年到2025 1小时 timeframe的数据回测这个策略。

让我们加快速度，看看最终的结果吧！

最终79次交易获利，125次交易失败。Net Profit -716.523 USDT, Commission Paid 是交易的手续费841 USDT。这个策略无法实现盈利
感谢观看！