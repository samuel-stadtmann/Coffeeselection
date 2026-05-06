import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-primary/5 bg-[#fdf9f4]">
      <div className="flex flex-col md:flex-row justify-between items-center px-8 py-16 gap-8 w-full max-w-7xl mx-auto">
        <span className="font-serif text-[13px] italic text-primary/40">
          © 2024 Coffee Selection. Crafted with Swiss Excellence.
        </span>
        <div className="flex gap-12">
          <Link href="#" className="font-label text-[10px] uppercase tracking-[0.2em] text-primary/60 hover:text-secondary transition-colors">
            Privacy
          </Link>
          <Link href="#" className="font-label text-[10px] uppercase tracking-[0.2em] text-primary/60 hover:text-secondary transition-colors">
            Sustainability
          </Link>
          <Link href="#" className="font-label text-[10px] uppercase tracking-[0.2em] text-primary/60 hover:text-secondary transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
