import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { articles, articleBySlug, type Section } from "@/lib/articles";

const LOGO = "/logo.png";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = articleBySlug(slug);
  if (!a) return {};
  return {
    title: a.seoTitle,
    description: a.seoDescription,
    keywords: a.keywords,
  };
}

function renderSection(s: Section, i: number) {
  switch (s.type) {
    case "p":
      return <p key={i} className="text-base md:text-lg text-on-surface-variant leading-relaxed">{s.text}</p>;
    case "h2":
      return (
        <h2 key={i} className="text-2xl md:text-3xl text-primary font-headline font-bold uppercase tracking-tight mt-12 mb-2">
          {s.text}
        </h2>
      );
    case "h3":
      return (
        <h3 key={i} className="text-xl text-primary font-headline font-bold uppercase tracking-tight mt-8 mb-2">
          {s.text}
        </h3>
      );
    case "ul":
      return (
        <ul key={i} className="space-y-2 list-none">
          {s.items.map((item, j) => (
            <li key={j} className="flex gap-3 text-base text-on-surface-variant leading-relaxed">
              <span className="text-tertiary font-bold mt-1.5 shrink-0">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={i} className="space-y-3 list-none">
          {s.items.map((item, j) => (
            <li key={j} className="flex gap-4 text-base text-on-surface-variant leading-relaxed">
              <span className="bg-tertiary text-white w-6 h-6 flex items-center justify-center font-headline font-bold text-xs shrink-0">
                {j + 1}
              </span>
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote key={i} className="border-l-4 border-tertiary pl-6 py-2 my-4">
          <p className="text-xl text-primary italic font-headline leading-relaxed">&ldquo;{s.text}&rdquo;</p>
          {s.author && <cite className="block mt-2 font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold not-italic">— {s.author}</cite>}
        </blockquote>
      );
    case "callout":
      return (
        <div key={i} className="bg-primary text-on-primary p-6 md:p-8 my-6">
          <h4 className="font-headline font-bold text-tertiary uppercase tracking-tight text-base mb-2">{s.title}</h4>
          <p className="text-on-primary/85 leading-relaxed">{s.text}</p>
        </div>
      );
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) notFound();

  const relatedArticles = article.related.map((s) => articleBySlug(s)).filter(Boolean);

  return (
    <div className="bg-[#F9F5F0] text-on-surface pb-20 md:pb-0">
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-72 md:h-96 w-auto object-contain -my-16 md:-my-24 mr-8 shrink-0" src={LOGO} />
          </Link>
          <Link
            href="/quiz/question-1-brewing-method"
            className="bg-primary text-white px-5 md:px-6 py-3 text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-headline font-bold hover:bg-black transition-all"
          >
            Quiz starten
          </Link>
        </nav>
      </header>

      <main className="pt-44 md:pt-56">
        {/* Breadcrumb */}
        <div className="max-w-3xl mx-auto px-6 md:px-8 pt-8">
          <nav className="font-headline text-[10px] uppercase tracking-[0.3em] text-on-surface-variant flex items-center gap-2 flex-wrap">
            <Link href="/" className="hover:text-tertiary transition-colors">Home</Link>
            <span>/</span>
            <Link href="/learn" className="hover:text-tertiary transition-colors">Magazine</Link>
            <span>/</span>
            <span className="text-primary">{article.category}</span>
          </nav>
        </div>

        {/* Header */}
        <article className="max-w-3xl mx-auto px-6 md:px-8 py-8 md:py-12">
          <div className="mb-8">
            <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-3">
              {article.category} · {article.readingTime}
            </span>
            <h1 className="text-3xl md:text-5xl text-primary leading-[1.1] mb-6 font-headline font-bold uppercase tracking-tight">
              {article.title}
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed italic">
              {article.excerpt}
            </p>
          </div>

          <div className="aspect-[16/9] overflow-hidden bg-surface-container-low shadow-lg mb-12">
            <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          </div>

          {/* Body */}
          <div className="space-y-6">
            {article.body.map((s, i) => renderSection(s, i))}
          </div>

          {/* Final CTA */}
          <div className="mt-16 bg-tertiary/10 border-l-4 border-tertiary p-6 md:p-8">
            <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-3">
              Bereit für deinen perfekten Kaffee?
            </h3>
            <p className="text-on-surface-variant mb-4">Mach das 12-Fragen-Quiz und finde deinen Geschmackstyp.</p>
            <Link
              href="/quiz/question-1-brewing-method"
              className="inline-block bg-primary text-on-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
            >
              Quiz starten
            </Link>
          </div>
        </article>

        {/* Related */}
        {relatedArticles.length > 0 && (
          <section className="bg-surface-container-low py-16 md:py-20 border-t border-primary/5">
            <div className="max-w-7xl mx-auto px-6 md:px-8">
              <h2 className="text-2xl md:text-3xl text-primary mb-8 uppercase tracking-tight font-headline font-bold text-center">
                Weiterlesen
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((a) => a && (
                  <Link
                    key={a.slug}
                    href={`/learn/${a.slug}`}
                    className="group bg-white shadow-sm hover:shadow-xl transition-all"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={a.image} alt={a.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="p-6">
                      <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold block mb-2">
                        {a.category} · {a.readingTime}
                      </span>
                      <h3 className="font-headline font-bold text-primary uppercase tracking-tight group-hover:text-tertiary transition-colors mb-2">
                        {a.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{a.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-12">
                <Link
                  href="/learn"
                  className="font-headline text-[11px] font-bold uppercase tracking-[0.3em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-2"
                >
                  Alle Artikel
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="w-full px-6 md:px-8 bg-[#F9F5F0] border-t border-primary/5 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-on-surface-variant/60 font-headline font-bold uppercase tracking-[0.3em]">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-40 md:h-56 w-auto object-contain" src={LOGO} />
          </Link>
          <span>© 2024 Coffee Selection · Handverlesen aus der Schweiz</span>
        </div>
      </footer>
    </div>
  );
}
