import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50/50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-slate-500">Đang tải...</p>
      </div>
    </div>
  );
};

export default Loader;
