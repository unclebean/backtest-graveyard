import React, { useEffect, useState } from 'react';
import { IOrder } from '@/types/trade';

interface OrderDetailsViewProps {
  order: IOrder;
  currentPrice: number;
}

export const OrderDetailsView = ({
  order,
  currentPrice,
}: OrderDetailsViewProps) => {
  const { type, side, status, price, quantity, stopLoss, takeProfit } = order;
  const [unrealizedProfit, setUnrealizedProfit] = useState<number>(0);
  const [isProfit, setIsProfit] = useState<boolean>(false);

  useEffect(() => {
    if (status === 'filled') {
      const unrealizedProfit =
        side === 'buy'
          ? (currentPrice - price) * quantity
          : (price - currentPrice) * quantity;
      const isProfit = unrealizedProfit >= 0;
      setUnrealizedProfit(unrealizedProfit);
      setIsProfit(isProfit);
    }

    console.log(unrealizedProfit);
    if (status === 'closed take profit' && takeProfit) {
      const unrealizedProfit =
        side === 'buy'
          ? (takeProfit - price) * quantity
          : (price - takeProfit) * quantity;
      const isProfit = unrealizedProfit >= 0;

      setUnrealizedProfit(unrealizedProfit);
      setIsProfit(isProfit);
    }

    if (status === 'closed stop loss' && stopLoss) {
      const unrealizedProfit =
        side === 'buy'
          ? (stopLoss - price) * quantity
          : (price - stopLoss) * quantity;
      const isProfit = unrealizedProfit >= 0;

      setUnrealizedProfit(unrealizedProfit);
      setIsProfit(isProfit);
    }
  }, [
    currentPrice,
    price,
    quantity,
    side,
    status,
    stopLoss,
    takeProfit,
    unrealizedProfit,
  ]);

  if (status === 'submitted') {
    return (
      <div className="max-w-md rounded-xl shadow bg-black flex flex-col gap-1 text-base">
        <div className="flex justify-between flex-col">
          <span className="font-medium text-xs text-gray-500">Side</span>
          <span className={side === 'buy' ? 'text-green-600' : 'text-red-600'}>
            {side.toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between flex-col">
          <span className="font-medium text-xs text-gray-500">Order Type</span>
          <span>{type.toUpperCase()} Order</span>
        </div>
        <div className="flex justify-between flex-col">
          <span className="font-medium text-xs text-gray-500">
            Order Status
          </span>
          <span>{status.toUpperCase()}</span>
        </div>
        <div className="flex justify-between flex-col">
          <span className="font-medium text-xs text-gray-500">Limit Price</span>
          <span>{price.toFixed(2)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md rounded-xl shadow bg-black flex flex-col gap-1 text-base">
      <div className="flex justify-between flex-col">
        <span className="font-medium text-xs text-gray-500">Side</span>
        <span className={side === 'buy' ? 'text-green-600' : 'text-red-600'}>
          {side.toUpperCase()}
        </span>
      </div>
      <div className="flex justify-between flex-col">
        <span className="font-medium text-xs text-gray-500">Order Type</span>
        <span>{type.toUpperCase()} Order</span>
      </div>
      <div className="flex justify-between flex-col">
        <span className="font-medium text-xs text-gray-500">Open Price</span>
        <span>{price.toFixed(2)}</span>
      </div>

      <div className="flex justify-between flex-col">
        <span className="font-medium text-xs text-gray-500">Quantity</span>
        <span>{quantity}</span>
      </div>

      <div className="flex justify-between flex-col">
        <span className="font-medium text-xs text-gray-500">
          {order.orderClosePrice ? 'Realized PnL' : 'Unrealized PnL'}
        </span>
        <span className={isProfit ? 'text-green-600' : 'text-red-600'}>
          {unrealizedProfit >= 0 ? '+' : ''}
          {unrealizedProfit.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between flex-col">
        <span className="font-medium text-xs text-gray-500">Order Status</span>
        <span>{order.status.toUpperCase()}</span>
      </div>

      {stopLoss != 0 && status === 'filled' && (
        <div className="flex justify-between flex-col">
          <span className="font-medium text-xs text-gray-500">Stop Loss</span>
          <span>{stopLoss?.toFixed(2)}</span>
        </div>
      )}

      {takeProfit != 0 && status === 'filled' && (
        <div className="flex justify-between flex-col">
          <span className="font-medium text-xs text-gray-500">Take Profit</span>
          <span>{takeProfit?.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};
