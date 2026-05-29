"use client";

import { motion } from "framer-motion";
import {
  RiRocketLine,
  RiFlashlightLine,
  RiSafe2Line,
  RiShieldLine,
  RiArrowRightLine,
  RiBankCardLine,
  RiSmartphoneLine,
  RiPieChartLine,
  RiCheckboxCircleLine,
  RiArrowRightSLine,
  RiCloseLine
} from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useState } from "react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-lg">М</div>
              <span className="font-bold text-xl tracking-tight">Маннру Банк</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Возможности</a>
              <a href="#security" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Безопасность</a>
              <a href="#tariffs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Тарифы</a>
              <Button asChild variant="gradient" className="shadow-[0_4px_12px_rgba(59,130,246,0.3)]">
                <Link href="/login">Личный кабинет</Link>
              </Button>
            </div>

            <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <RiCloseLine className="w-6 h-6" /> : <RiRocketLine className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-background border-b px-4 pt-2 pb-6 space-y-4">
            <a href="#features" className="block text-lg font-medium py-2">Возможности</a>
            <a href="#security" className="block text-lg font-medium py-2">Безопасность</a>
            <a href="#tariffs" className="block text-lg font-medium py-2">Тарифы</a>
            <Button asChild variant="gradient" className="w-full h-12 text-base">
              <Link href="/login">Личный кабинет</Link>
            </Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6 uppercase tracking-wider">
              <RiFlashlightLine className="w-3.5 h-3.5" /> Будущее уже здесь
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
              Ваш капитал в <br className="hidden md:block" /> надёжных руках.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Маннру — это не просто банк. Это цифровая экосистема нового поколения с мгновенными переводами, уникальной RPG-системой уровней и кэшбэком до 15%.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" variant="gradient" className="h-14 px-8 text-lg font-bold shadow-[0_8px_24px_rgba(59,130,246,0.3)]">
                <Link href="/login">Открыть счёт сейчас <RiArrowRightLine className="ml-2" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg">
                <Link href="#features">Узнать больше</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-secondary/30 border-y">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 italic">Почему выбирают Маннру?</h2>
            <p className="text-muted-foreground">Мы пересмотрели подход к банковскому обслуживанию.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: RiSmartphoneLine, title: "Удобное приложение", desc: "Управляйте всеми картами и операциями в интуитивно понятном интерфейсе." },
              { icon: RiSafe2Line, title: "RPG-прогрессия", desc: "Повышайте уровень за операции и открывайте новые возможности и привилегии." },
              { icon: RiPieChartLine, title: "Умная аналитика", desc: "Прозрачная история всех ваших трат с детальной категоризацией." }
            ].map((f, i) => (
              <Card key={i} className="bg-background/50 border-zinc-800 hover:border-primary/50 transition-colors group">
                <CardContent className="pt-8">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 italic">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="py-20 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Пользователей", value: "10К+" },
              { label: "Транзакций/сек", value: "500+" },
              { label: "Кэшбэк", value: "до 15%" },
              { label: "Поддержка", value: "24/7" }
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-primary mb-2 italic">{s.value}</div>
                <div className="text-xs uppercase font-bold tracking-widest text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 overflow-hidden relative">
        <div className="absolute inset-0 bg-primary/5 -skew-y-3 origin-right scale-110" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black mb-8 italic">Готовы изменить свой финансовый опыт?</h2>
          <p className="text-xl text-muted-foreground mb-10">Создайте первую карту и получите 1 000 МР бонусом за регистрацию.</p>
          <Button asChild size="lg" variant="gradient" className="h-16 px-12 text-xl font-black italic shadow-[0_12px_32px_rgba(59,130,246,0.4)]">
            <Link href="/login">НАЧАТЬ СЕЙЧАС</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-foreground text-background flex items-center justify-center font-bold text-sm">М</div>
              <span className="font-bold text-lg tracking-tight">Маннру Банк</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Правовая информация</a>
              <a href="#" className="hover:text-foreground">Конфиденциальность</a>
              <a href="#" className="hover:text-foreground">Контакты</a>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 Mannru Bank. Все права защищены.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
