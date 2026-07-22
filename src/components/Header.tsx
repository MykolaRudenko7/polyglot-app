export function Header() {
  return (
    <header className="flex h-[170px] items-center justify-center gap-3 bg-navy px-4 sm:h-[190px]">
      <span className="text-[42px] leading-none sm:text-[46px]" role="img" aria-label="PollyGlot parrot">
        🦜
      </span>
      <div className="flex flex-col justify-center">
        <h1 className="m-0 font-display text-[34px] font-extrabold leading-none text-brand-green sm:text-[40px]">
          PollyGlot
        </h1>
        <p className="m-0 mt-0.5 text-[11px] font-semibold text-white sm:text-xs">
          Perfect Translation Every Time
        </p>
      </div>
    </header>
  );
}
