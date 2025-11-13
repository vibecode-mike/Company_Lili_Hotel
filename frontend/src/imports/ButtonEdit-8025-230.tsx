import svgPaths from "./svg-vu46mhjd52";

function Group() {
  return (
    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 45 45">
      <g id="Group">
        <g id="Vector"></g>
      </g>
    </svg>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[25.79%_25.79%_12.5%_12.5%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="Group">
          <path d={svgPaths.p2b254300} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute inset-[12.49%_12.49%_63.04%_63.04%]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
        <g id="Group">
          <path d={svgPaths.p2996ef40} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group1 />
      <Group2 />
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents inset-[12.49%_12.49%_12.5%_12.5%]" data-name="Group">
      <Group3 />
    </div>
  );
}

function ModeEdit() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-clip" data-name="Mode edit">
      <div className="relative size-[24px]">
        <Group />
        <Group4 />
      </div>
    </div>
  );
}

export default function ButtonEdit({ className }: { className?: string }) {
  return (
    <div className={`relative rounded-[12px] ${className || 'size-full'}`} data-name="Button/Edit">
      <ModeEdit />
    </div>
  );
}