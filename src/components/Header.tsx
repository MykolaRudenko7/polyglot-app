export function Header() {
  return (
    <header className="bg-navy flex h-[170px] items-center justify-center gap-3 px-4 sm:h-[190px]">
      <span
        className="text-[42px] leading-none sm:text-[46px]"
        role="img"
        aria-label="PollyGlot parrot"
      >
        🦜
      </span>
      <div className="flex flex-col justify-center">
        <h1 className="font-display text-brand-green m-0 text-[34px] leading-none font-extrabold sm:text-[40px]">
          PollyGlot
        </h1>
        <p className="m-0 mt-0.5 text-[11px] font-semibold text-white sm:text-xs">
          Perfect Translation Every Time
        </p>
      </div>
    </header>
  );
}
