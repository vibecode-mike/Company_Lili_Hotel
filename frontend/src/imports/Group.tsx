import svgPaths from "./svg-pg0wpbb0c6";

function Group() {
  return (
    <div className="absolute inset-[17.76%_17.72%_-0.03%_0.01%]" data-name="Group">
      <div className="absolute bottom-[-0.02%] left-0 right-[-0.01%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
          <g id="Group">
            <path d={svgPaths.p15419680} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[0.03%_-0.01%_67.35%_67.39%]" data-name="Group">
      <div className="absolute bottom-[-0.05%] left-0 right-[-0.02%] top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5 5">
          <g id="Group">
            <path d={svgPaths.p239e3d00} fill="var(--fill-0, #0F6BEB)" id="Vector" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute contents inset-[0.02%_-0.01%_-0.02%_0.01%]" data-name="Group">
      <Group />
      <Group1 />
    </div>
  );
}

export default function Group3() {
  return (
    <div className="relative size-full" data-name="Group">
      <Group2 />
    </div>
  );
}