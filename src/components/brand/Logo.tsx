import Image from "next/image";
import logo from "../../../public/brand/logo.png";

// The Ojo de Cóndor mascot head. Source art is public/brand/logo.svg (a PNG wrapped in SVG, 2.3 MB),
// so pages use the PNG through next/image, which serves it resized.
export function CondorMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return <Image src={logo} alt="" width={size} height={size} className={className} priority />;
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <CondorMark size={40} />
      <span className={`whitespace-nowrap text-xl font-black tracking-tight ${light ? "text-white" : "text-tinta"}`}>Ojo de Cóndor</span>
    </span>
  );
}
