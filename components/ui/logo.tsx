import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string; // Permet de surcharger la taille depuis le parent
  href?: string;      // Lien optionnel
}

export function Logo({ className, href = "/" }: LogoProps) {
  const content = (
    <div className={cn("relative flex items-center gap-2 shrink-0", className)}>
      <Image
        src="/logo-v2.png"
        alt="SantarAI Logo"
        width={500}
        height={150}
        className="h-full w-auto object-contain"
        priority
      />
      <span className="text-xl font-bold tracking-tight hidden sm:inline">
        Santar<span className="text-cyan-400 font-black" style={{ textShadow: "0 0 12px rgba(34, 211, 238, 0.6)" }}>
          AI
        </span>
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity block">
        {content}
      </Link>
    );
  }

  return content;
}
