import iconoShadow from '@/assets/marca/shadow-icon-blanco.svg';

// Encabezado con la marca SHADOW: el fantasma, el nombre y debajo el panel y el negocio.
export function MarcaEncabezado({ panel, negocio }: { panel: string; negocio?: string }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
      <img src={iconoShadow} alt="" className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 brillo-cian" />
      <div className="min-w-0">
        <p className="font-marca font-bold tracking-[0.18em] text-white text-base sm:text-xl leading-tight">SHADOW</p>
        <p className="text-[11px] sm:text-sm text-cyan-300/90 truncate">
          {panel}{negocio ? <span className="text-slate-400"> · {negocio}</span> : null}
        </p>
      </div>
    </div>
  );
}

export { iconoShadow };
