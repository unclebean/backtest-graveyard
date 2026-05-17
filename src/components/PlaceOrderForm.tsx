import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IOrder } from '@/types/trade';

interface PlaceOrderFormProps {
  onNewOrder: (order: IOrder) => void;
}

const PlaceOrderForm = ({ onNewOrder }: PlaceOrderFormProps) => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>(
    'market',
  );
  const [form, setForm] = useState({
    quantity: '',
    price: '',
    stopLoss: '',
    takeProfit: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onPlaceOrder = () => {
    onNewOrder({
      type: orderType,
      side: side,
      status: 'new',
      quantity: Number(form.quantity),
      price: Number(form.price),
      stopLoss: Number(form.stopLoss),
      takeProfit: Number(form.takeProfit),
    });
  };

  return (
    <div className="max-h-[400px] pt-4 shadow bg-black flex flex-col gap-4 w-full max-w-md">
      <div className="flex justify-between gap-2">
        <Button
          size="lg"
          className={`cursor-pointer flex-1 hover:bg-green-500 ${
            side === 'buy' && 'bg-green-500 text-white'
          }`}
          onClick={() => setSide('buy')}
        >
          Buy
        </Button>
        <Button
          size="lg"
          className={`cursor-pointer flex-1 hover:bg-red-500 ${
            side === 'sell' && 'bg-red-500 text-white'
          }`}
          onClick={() => setSide('sell')}
        >
          Sell
        </Button>
      </div>
      <div className="grid grid-cols-3 justify-between gap-2">
        {['market', 'limit', 'stop'].map((type) => (
          <Button
            variant="secondary"
            key={type}
            className={`${orderType === type && 'cursor-pointer bg-blue-500 text-white'}`}
            onClick={() => setOrderType(type as typeof orderType)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)} Order
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Input
          name="quantity"
          placeholder="Quantity"
          className="text-white"
          value={form.quantity}
          onChange={handleChange}
        />

        {(orderType === 'limit' || orderType === 'stop') && (
          <Input
            name="price"
            placeholder="Price"
            className="text-white"
            value={form.price}
            onChange={handleChange}
          />
        )}
        <div className="flex gap-2 flex-row">
          <Input
            name="stopLoss"
            placeholder="Stop Loss"
            className="text-white"
            value={form.stopLoss}
            onChange={handleChange}
          />
          <Input
            name="takeProfit"
            placeholder="Take Profit"
            className="text-white"
            value={form.takeProfit}
            onChange={handleChange}
          />
        </div>
        <Button size="lg" className="cursor-pointer" onClick={onPlaceOrder}>
          Place Order
        </Button>
      </div>
    </div>
  );
};

export default PlaceOrderForm;
