import svgPaths from "./svg-drowyppsat";

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
    <div className="absolute inset-[25.79%_25.79%_12.51%_12.51%]" data-name="Group">
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
    <div className="absolute inset-[12.47%_12.5%_63.06%_63.03%]" data-name="Group">
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
    <div className="absolute contents inset-[12.47%_12.5%_12.51%_12.51%]" data-name="Group">
      <Group1 />
      <Group2 />
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute contents inset-[12.47%_12.5%_12.51%_12.51%]" data-name="Group">
      <Group3 />
    </div>
  );
}

export default function ModeEdit() {
  return (
    <div className="relative size-full" data-name="Mode edit">
      <Group />
      <Group4 />
    </div>
  );
}