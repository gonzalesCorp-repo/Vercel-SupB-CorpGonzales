export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8 h-full bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      {/* 
        Eliminamos el dark header.
        Cada página (despacho, kardex, etc.) tendrá su propio header limpio,
        o podemos usar este layout si queremos un titulo global,
        pero dejarlo como contenedor bg-slate-50/50 es suficiente.
      */}
      {children}
    </div>
  );
}
