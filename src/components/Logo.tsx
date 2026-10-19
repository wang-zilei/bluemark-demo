import { Orbit } from "lucide-react";

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`brand ${inverse ? "brand-inverse" : ""}`}>
      <span className="brand-symbol">
        <Orbit size={24} strokeWidth={1.8} />
        <i />
      </span>
      <span className="brand-word">
        BlueMark<span>蓝标智策</span>
      </span>
    </span>
  );
}
