import { useEffect, useRef } from 'react';

export interface OrderLog {
  time: number;
  action: string;
  side: string;
  price?: number;
  pnl?: number;
}

export const OrdersTable = ({ orders }: { orders: OrderLog[] }) => {
  const tableScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTop = tableScrollRef.current.scrollHeight;
    }
  }, [orders]);

  return (
    <div className="w-[300px] border border-white/10 bg-[#151924] flex flex-col hidden md:flex shrink-0 rounded-lg overflow-hidden sticky top-4 max-h-[calc(100vh-88px)]">
      <div className="p-4 border-b border-white/10 bg-[#151924] font-bold text-sm text-white shrink-0 sm:h-[52px] flex items-center">
        Executed Orders
      </div>
      <div ref={tableScrollRef} className="flex-1 overflow-y-auto p-2 scroll-smooth bg-[#0a0a0a]">
        {orders.length === 0 ? (
          <div className="text-neutral-500 text-xs text-center py-4">
            No orders executed yet
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-neutral-400 text-left border-b border-white/10">
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium">Action</th>
                <th className="pb-2 font-medium text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((log, i) => (
                <tr
                  key={i}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5"
                >
                  <td className="py-2 text-neutral-300">
                    {new Date(log.time * 1000).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.side === 'sell'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td
                    className={`py-2 text-right font-medium ${
                      log.pnl !== undefined
                        ? log.pnl > 0
                          ? 'text-green-400'
                          : log.pnl < 0
                          ? 'text-red-400'
                          : 'text-neutral-400'
                        : 'text-neutral-400'
                    }`}
                  >
                    {log.pnl !== undefined
                      ? `${log.pnl > 0 ? '+' : ''}$${log.pnl.toFixed(2)}`
                      : log.price !== undefined
                      ? `$${log.price.toFixed(2)}`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
