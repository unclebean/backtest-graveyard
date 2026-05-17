'use client';

import { JSX } from 'react';

interface CountdownProps {
  name: string;
  children: JSX.Element;
}

export default function StrategyDetails({
  name,
  children,
}: Readonly<CountdownProps>) {
  return (
    <div className="fixed inset-0 z-50 px-4 sm:px-0 flex items-center justify-center flex-col gap-2.5 bg-black/80 text-white text-6xl font-bold">
      <h2 className="text-2xl text-center">{`${name}`}</h2>
      <div>{children}</div>
    </div>
  );
}
