"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { WebGLGuard, HeroShaderFallback } from "@/components/hero-shader";
import { ArrowRight, Shield, Zap, Gift, CreditCard, Smartphone, Percent, Check, ChevronRight, Menu, X } from "lucide-react";

const DynamicShader = dynamic(() => import("@/components/dynamic-shader"), { ssr: false });

export default function LandingPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { if (isMobile) router.push("/login"); }, [isMobile, router]);
  if (isMobile) return null;

  const features = [
    { icon: Zap, title: "Переводы за 0 секунд", description: "Деньги исчезают моментально. Куда? Это уже не наши проблемы." },
    { icon: Percent, title: "Кэшбэк до 15%", description: "Возвращаем маннрубли. Что такое маннрубли? Не спрашивайте." },
    { icon: Gift, title: "Бонусы за страдания", description: "Выполняйте задания. Получайте баллы. Плачьте от счастья." },
    { icon: Shield, title: "Безопасность уровня «надеюсь»", description: "256-битное шифрование. Мы сами его придумали. Оно точно работает." },
    { icon: CreditCard, title: "11 уровней карт", description: "От Bronze до Obsidian. Вы всё ещё на Bronze. Нам смешно." },
    { icon: Smartphone, title: "Мобильное приложение", description: "Управляйте финансами. Или пытайтесь. Кто мы такие, чтобы судить." },
  ];

  const tiers = [
    { name: "Bronze", price: "Бесплатно*", cashback: "0.5%", gradient: "from-amber-700 to-amber-900", desc: "*мы решим потом" },
    { name: "Silver", price: "Бесплатно**", cashback: "1%", gradient: "from-zinc-200 to-zinc-400", desc: "**нет" },
    { name: "Gold", price: "299 МР/мес", cashback: "3%", gradient: "from-amber-300 to-amber-500", desc: "для тех, кто верит" },
    { name: "Platinum", price: "599 МР/мес", cashback: "5%", gradient: "from-slate-200 to-slate-400", desc: "почти серьёзно" },
    { name: "Titanium", price: "899 МР/мес", cashback: "6%", gradient: "from-zinc-400 to-zinc-600", desc: "зачем?" },
    { name: "Ruby", price: "1 199 МР/мес", cashback: "7%", gradient: "from-red-400 to-red-600", desc: "красиво и бесполезно" },
    { name: "Emerald", price: "1 499 МР/мес", cashback: "8%", gradient: "from-emerald-400 to-emerald-600", desc: "изумрудно зелёный от зависти" },
    { name: "Sapphire", price: "1 999 МР/мес", cashback: "9%", gradient: "from-blue-400 to-blue-600", desc: "сапфировые слёзы бедности" },
    { name: "Diamond", price: "2 999 МР/мес", cashback: "10%", gradient: "from-cyan-300 to-cyan-500", desc: "алмазные руки, бумажный кошелёк" },
    { name: "Black", price: "4 999 МР/мес", cashback: "12%", gradient: "from-zinc-700 to-black", desc: "тёмная сторона денег" },
    { name: "Obsidian", price: "9 999 МР/мес", cashback: "15%", gradient: "from-violet-800 to-black", desc: "вы больны, но мы берём деньги" },
  ];

  const faqs = [
    { q: "Как открыть счёт?", a: "Никак. Но кнопка красивая, правда?" },
    { q: "Что такое маннрубли?", a: "Маннрубли (МР) — это когда 1 МР = 1 рубль, но только в нашей вселенной. В вашей — 0." },
    { q: "Какие комиссии?", a: "Переводы бесплатны. Обслуживание — нет. Мы не монстры. Мы хуже." },
    { q: "Как работает кэшбэк?", a: "Кэшбэк начисляется автоматически. Автоматически — значит когда-нибудь. Может быть." },
    { q: "Безопасно ли это?", a: "Мы используем 256-битное шифрование. Это как замок на картонной коробке. Но замок красивый." },
    { q: "Можно ли вернуть деньги?", a: "Можно. Но зачем? Они же уже у нас." },
    { q: "Это реальный банк?", a: "А вы как думаете?" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        .btn-shader {
          position: relative;
          overflow: hidden;
        }
        .btn-shader::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255,255,255,0.06) 45%,
            rgba(255,255,255,0.2) 50%,
            rgba(255,255,255,0.06) 55%,
            transparent 70%
          );
          background-size: 250% 100%;
          background-position: 100% 0;
          transition: background-position 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          pointer-events: none;
          border-radius: inherit;
        }
        .btn-shader:hover::after {
          background-position: -100% 0;
        }
        .btn-shader:hover {
          box-shadow: 0 0 20px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.15), 0 0 60px rgba(59,130,246,0.08);
          transform: translateY(-1px);
        }
        .btn-shader-outline:hover {
          box-shadow: 0 0 20px rgba(255,255,255,0.1), 0 0 40px rgba(255,255,255,0.05), inset 0 0 16px rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.25);
        }
      `}</style>
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-b from-zinc-100 to-zinc-300 text-zinc-900 flex items-center justify-center font-bold text-sm shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset]">М</div>
            <span className="font-semibold text-sm">Маннру</span>
          </div>
          <nav className="hidden lg:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Возможности</a>
            <a href="#cards" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Карты</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            <Link href="/login"><Button variant="gradient" size="sm" className="btn-shader">Войти (зачем?)</Button></Link>
          </nav>
          <button className="lg:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="lg:hidden border-t bg-background p-4 space-y-3">
            <a href="#features" className="block text-sm text-muted-foreground" onClick={() => setMenuOpen(false)}>Возможности</a>
            <a href="#cards" className="block text-sm text-muted-foreground" onClick={() => setMenuOpen(false)}>Карты</a>
            <a href="#faq" className="block text-sm text-muted-foreground" onClick={() => setMenuOpen(false)}>FAQ</a>
            <Link href="/login"><Button variant="gradient" className="w-full btn-shader" size="sm">Войти (зачем?)</Button></Link>
          </div>
        )}
      </header>

      <section className="relative py-20 lg:py-32 px-6 overflow-hidden">
        <WebGLGuard
          fallback={<HeroShaderFallback />}
        >
          <DynamicShader />
        </WebGLGuard>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="max-w-2xl">
            <Badge className="mb-4" variant="secondary">Банк, который вам не нужен</Badge>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
              Наши маннрубли.<br />Ваши проблемы.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Мгновенные переводы, кэшбэк до 15%, бонусы за каждое действие. Всё в одном приложении. Кроме ваших денег.
            </p>
            <div className="flex gap-3">
              <Link href="/login"><Button variant="gradient" size="lg" className="gap-2 btn-shader">Открыть счёт (не надо) <ArrowRight className="w-4 h-4" /></Button></Link>
              <a href="#features"><Button size="lg" variant="outline" className="btn-shader btn-shader-outline">Узнать больше (не стоит)</Button></a>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 px-6 border-t">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Всё, что вам не нужно</h2>
            <p className="text-muted-foreground">Современные финансовые иллюзии в одном месте</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <Card key={f.title} className="transition-all hover:bg-accent/50 hover:shadow-lg hover:shadow-black/20">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-800 flex items-center justify-center mb-2 shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset]"><f.icon className="w-5 h-5" /></div>
                  <CardTitle>{f.title}</CardTitle>
                  <CardDescription>{f.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="cards" className="py-16 px-6 border-t">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-2">11 уровней карт</h2>
            <p className="text-muted-foreground">От Bronze до Obsidian — чем выше уровень, тем больнее</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tiers.map((t) => (
              <Card key={t.name} className="flex flex-col transition-all hover:shadow-lg hover:shadow-black/20">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-b ${t.gradient} flex items-center justify-center mb-3 shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_2px_4px_0_rgba(0,0,0,0.2)]`}>
                    <CreditCard className="w-6 h-6 text-white/80" />
                  </div>
                  <CardTitle>{t.name}</CardTitle>
                  <CardDescription>{t.price}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="p-3 rounded-lg bg-secondary mb-4">
                    <p className="text-2xl font-bold">{t.cashback}</p>
                    <p className="text-xs text-muted-foreground">кэшбэк (может быть)</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 italic">{t.desc}</p>
                  <Link href="/login"><Button variant="gradient" className="w-full gap-1.5 btn-shader" size="sm">Оформить (нет) <ChevronRight className="w-3.5 h-3.5" /></Button></Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-16 px-6 border-t">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8"><h2 className="text-3xl font-bold tracking-tight mb-2">Честные ответы</h2></div>
          <Accordion type="single" collapsible>
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-16 px-6 border-t">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Всё ещё хотите начать?</h2>
          <p className="text-muted-foreground mb-6">Откройте счёт за 5 минут и получите 1 000 МР. Которые нельзя вывести. Но зато получите.</p>
          <Link href="/login"><Button variant="gradient" size="lg" className="gap-2 btn-shader">Открыть счёт (мы предупреждали) <ArrowRight className="w-4 h-4" /></Button></Link>
        </div>
      </section>

      <footer className="border-t py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-b from-zinc-100 to-zinc-300 text-zinc-900 flex items-center justify-center font-bold text-sm shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset]">М</div>
            <span className="font-semibold text-sm">Маннру</span>
          </div>
          <p className="text-xs text-muted-foreground">2026 Маннру</p>
        </div>
        <div className="max-w-6xl mx-auto mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            ВНИМАНИЕ: Это НЕ настоящий банк. Проект создан исключительно в демонстрационных и развлекательных целях.
            Все финансовые операции, балансы и транзакции являются вымышленными. Маннру Банк не является реальной
            финансовой организацией и не предоставляет банковских услуг.
          </p>
        </div>
      </footer>
    </div>
  );
}
