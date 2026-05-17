# CCI EMA Strategy

欢迎观看 backtest graveyard, 今天我们要回测来证明对DOGE没用的指标策略是CCI + EMA.
CCI指标周期设置为7, 使用两条EMA，周期分别为10和30。

多头开仓条件为：当EMA10 大于 EMA30 并且 Close Price 大于 EMA30，同时CCI cross up 0 line。
多头平仓条件为：当CCI 大于 150

空头开仓条件为：当EMA10 小于 EMA30 并且 Close Price 小于 EMA30，同时CCI cross down 0 line。
空头平仓条件为：当CCI 小于 -150

止盈采用3倍ATR，止损采用了2倍ATR。交易手续费采用Taker Fee 0.0500%。

我的本金是4000 USDT，接下来我们就以DOGE 2025至今 1小时 timeframe的数据回测这个策略。

让我们加快速度，看看最终的结果吧！

Net Profit -2187.583 USDT。虽然胜率有60%但是这个策略无法实现盈利
感谢观看！