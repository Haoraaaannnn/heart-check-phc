'use client';

type HeaderProps = {
  title: string;
  currentTime: Date;
};

export function Header({ title, currentTime }: HeaderProps) {
  return (
    <div className="bg-[#cc3535] px-12 py-8 flex items-center justify-between">
      <div>
        <p className="text-white/70 text-xl uppercase tracking-widest font-medium">OUT-PATIENT DIVISION</p>
        <h1 className="text-white text-7xl font-black">{title}</h1>
      </div>
      <div className="text-right">
        <p className="text-white text-6xl font-bold tabular-nums">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-white/70 text-xl">
          {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
}