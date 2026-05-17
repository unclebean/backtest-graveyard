# Bollinger Bands ADX RSI Strategy

This strategy need to use bollinger bands default setup, and ADX default setup and RSI period 5

## Open Long Position Condition:

When ADX < 30 and RSI from less than 30 becomes greater than 30(RSI cross up 30),
meanwhile BB Lower Line cross down Close Price

## Close Long Position

When Close Price >= BB Upper Line and RSI >= 70

## Open Short Position Condition:

When ADX < 30 and RSI from greater than 70 becomes less than 70(RSI cross down 70),
meanwhile BB Upper Line cross up Close Price

## Close Long Position

When Close Price  <= BB Lower Line and RSI <= 30

######

欢迎观看 backtest graveyard，今天我要回测的技术指标策略是基于Bollinger Bands ADX RSI的指标组合，Bollinger Bands与ADX使用默认设置，RSI周期设置为5.

多头的开仓条件是当ADX小于30并且RSI从小于30变成大于30，同时当Bollinger Bands Lower Line 小于Close Price。
多头的平仓条件是当Close Price大于等于Bollinger Bands Upper Line 同时 RSI 大于等于 70.

空头的开仓条件是当ADX小于30并且RSI从大于70变成小于70，同时Bollinger Bands Upper Line 大于Close Price。
空头的平仓条件是当Close Price 小于等于Bollinger Bands Lower Line 同时 RSI 小于等于 30.

止盈采用3倍ATR，止损采用了2倍ATR。交易手续费采用Binance的Taker Fee 0.0500%。
加下来就是回测ETH从2024年1月到2025年5月大概一年半1小时timeframe的盈亏情况。

最终结果Net Profit -1415整体策略在扣除损失与手续费后是亏损的，虽然Gross Profit比Gross Loss大，但由于手续费消耗将近1800USDT这个策略无法实现盈利。
你有优化策略的办法吗？欢迎留言交流，感谢观看！