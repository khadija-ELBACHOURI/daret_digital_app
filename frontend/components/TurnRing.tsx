export function TurnRing({ activeIndex = 0 }: { activeIndex?: number }) {
  const points = 8;
  const radius = 90;
  const center = 110;

  const dots = Array.from({ length: points }, (_, i) => {
    const angle = (i / points) * 2 * Math.PI - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    const isActive = i === activeIndex % points;
    return { x, y, isActive };
  });

  return (
    <svg
      viewBox="0 0 220 220"
      className="h-full w-full"
      role="img"
      aria-label="Cycle de tours d'un daret"
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#C9A227"
        strokeOpacity="0.25"
        strokeWidth="1"
      />
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.isActive ? 7 : 4}
          fill={d.isActive ? "#C9A227" : "#F2E8D5"}
          fillOpacity={d.isActive ? 1 : 0.35}
        />
      ))}
      <circle cx={center} cy={center} r="2" fill="#F2E8D5" fillOpacity="0.5" />
    </svg>
  );
}
