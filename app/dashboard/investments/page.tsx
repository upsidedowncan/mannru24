"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LockClosedIcon, ArrowTopRightIcon, ArrowBottomRightIcon, DividerHorizontalIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useProgression } from "@/lib/progression";
import { useMarket, type Candle, type CurrentCandle } from "@/lib/market";

// ─── Price formatting ────────────────────────────────────────────────────────

function fmtPrice(p: number): string {
  if (p < 0.0001) return p.toExponential(3);
  if (p < 0.01) return p.toFixed(5);
  if (p < 1) return p.toFixed(4);
  if (p < 100) return p.toFixed(2);
  if (p < 10_000) return p.toLocaleString("ru", { maximumFractionDigits: 1 });
  if (p < 1_000_000) return Math.round(p / 1_000) + "K";
  return (p / 1_000_000).toFixed(2) + "M";
}

function fmtMnk(n: number): string {
  if (n === 0) return "0.000000";
  if (n < 0.000001) return n.toExponential(3);
  return n.toFixed(6);
}

// ─── Candlestick chart using lightweight-charts ───────────────────────────────

interface ChartProps {
  candles: Candle[];
  currentCandle: CurrentCandle | null;
  price: number;
}

function CandleChart({ candles, currentCandle, price }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // Create chart once on mount
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#71717a",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#27272a" },
        horzLines: { color: "#27272a" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: "#3f3f46",
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderColor: "#3f3f46",
        timeVisible: false,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: true,
      handleScale: false,
    });

    const series = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      chartRef.current?.applyOptions({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Sync historical candles when a new one is completed
  useEffect(() => {
    if (!seriesRef.current) return;
    if (candles.length > 0) {
      const data = candles.map((c) => ({
        time: Math.floor(c.time / 1000) as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      seriesRef.current.setData(data);
      chartRef.current?.timeScale().scrollToRealTime();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles.length]);

  // Update the live (forming) candle on every price tick
  useEffect(() => {
    if (!seriesRef.current || !currentCandle) return;
    seriesRef.current.update({
      time: Math.floor(currentCandle.time / 1000) as Time,
      open: currentCandle.open,
      high: currentCandle.high,
      low: currentCandle.low,
      close: price,
    });
  }, [price, currentCandle]);

  if (candles.length === 0 && !currentCandle) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center text-muted-foreground font-mono text-xs"
      >
        Инициализация рынка…
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InvestmentsPage() {
  const { level, isReadOnly } = useProgression();
  const {
    price,
    priceTrend,
    candles,
    currentCandle,
    mnkHoldings,
    isCrashed,
    priceChangePercent,
    buy,
    sell,
    resetCrash,
  } = useMarket();

  const [buyAmt, setBuyAmt] = useState("");
  const [sellAmt, setSellAmt] = useState("");
  const [busy, setBusy] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [showCrash, setShowCrash] = useState(false);
  const crashShownRef = useRef(false);

  const loadCards = useCallback(async () => {
    const res = await fetch("/api/cards");
    if (res.ok) setCards(await res.json());
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  useEffect(() => {
    if (isCrashed && !crashShownRef.current) {
      crashShownRef.current = true;
      setShowCrash(true);
    }
  }, [isCrashed]);

  const totalBalance = cards.reduce((s: number, c: any) => s + (c.balance ?? 0), 0);
  const mnkValue = mnkHoldings * price;
  const buyPreview = buyAmt && price > 0 ? parseFloat(buyAmt) / price : null;
  const sellPreview = sellAmt && price > 0 ? parseFloat(sellAmt) * price : null;

  const handleBuy = async () => {
    const amt = parseFloat(buyAmt);
    if (!amt || amt <= 0) { toast.error("Введите сумму"); return; }
    if (amt > totalBalance) { toast.error("Недостаточно средств на карте"); return; }
    setBusy(true);
    const r = await buy(amt);
    if (r.success) {
      toast.success(`Куплено ${fmtMnk(amt / price)} MNK`, {
        description: `Списано ${amt.toLocaleString("ru")} МР`,
      });
      setBuyAmt("");
      loadCards();
    } else {
      toast.error(r.error ?? "Ошибка сделки");
    }
    setBusy(false);
  };

  const handleSell = async () => {
    const amt = parseFloat(sellAmt);
    if (!amt || amt <= 0) { toast.error("Введите количество MNK"); return; }
    if (amt > mnkHoldings) { toast.error("Недостаточно MNK"); return; }
    setBusy(true);
    const r = await sell(amt);
    if (r.success) {
      toast.success(`Продано ${fmtMnk(amt)} MNK`, {
        description: `Зачислено ${(amt * price).toLocaleString("ru", { maximumFractionDigits: 2 })} МР`,
      });
      setSellAmt("");
      loadCards();
    } else {
      toast.error(r.error ?? "Ошибка сделки");
    }
    setBusy(false);
  };

  const handleResetCrash = () => {
    crashShownRef.current = false;
    setShowCrash(false);
    resetCrash();
    loadCards();
  };

  // ── Lock screen ────────────────────────────────────────────────────────────
  if (level < 15) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <LockClosedIcon className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Инвестиционный Портал</h1>
          <p className="text-muted-foreground text-sm mt-1.5 max-w-xs leading-relaxed">
            Торговля Маннрублём доступна с&nbsp;15&nbsp;уровня.
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-[11px]">
          <LockClosedIcon className="w-2.5 h-2.5 mr-1.5" />
          Уровень 15 · Ваш уровень {level}
        </Badge>
      </div>
    );
  }

  const TrendIcon =
    priceTrend === "up" ? ArrowTopRightIcon :
    priceTrend === "down" ? ArrowBottomRightIcon : DividerHorizontalIcon;
  const trendColor =
    priceTrend === "up" ? "text-emerald-400" :
    priceTrend === "down" ? "text-red-400" : "text-foreground";
  const changeColor =
    priceChangePercent >= 0 ? "text-emerald-500" : "text-red-500";

  return (
    <>
      {/* ── Market Crash Overlay ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCrash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center text-center p-6 select-none"
          >
            <p className="text-red-800 font-mono text-[9px] uppercase tracking-[0.25em] mb-8">
              MARKET.EXE // FATAL ERROR // EXIT CODE 0xDEAD
            </p>
            <h1 className="text-[14vw] sm:text-[110px] font-black text-white uppercase leading-none tracking-tighter mb-6">
              КРАХ<br />МАРКЕТА
            </h1>
            <p className="text-red-500/80 font-mono text-xs mb-1.5 max-w-xs leading-relaxed">
              Курс MNK пробил отметку ₽100,000.
            </p>
            <p className="text-red-800 font-mono text-[10px] mb-10">
              Все MNK-активы уничтожены. Биржа закрыта.
            </p>
            <Button variant="outline" onClick={handleResetCrash}>
              Восстановить систему
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto space-y-4">

        {/* Price header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
              Маннрубль · Биржа
            </p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className={`text-3xl md:text-4xl font-bold tabular-nums tracking-tight ${trendColor}`}>
                {fmtPrice(price)}
                <span className="text-muted-foreground text-xl font-normal ml-1.5">Р</span>
              </span>
              <span className={`flex items-center gap-1 text-sm font-mono tabular-nums ${changeColor}`}>
                <TrendIcon className="w-3.5 h-3.5" />
                {priceChangePercent >= 0 ? "+" : ""}{priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] shrink-0 mt-1 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            MNK · LIVE
          </Badge>
        </div>

        {/* Chart + Trading panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Chart card */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  График MNK / РУБ
                </CardTitle>
                <span className="text-xs text-muted-foreground font-mono">
                  {candles.length + (currentCandle ? 1 : 0)} свечей · 10&thinsp;с
                </span>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-48 md:h-60 w-full">
                <CandleChart candles={candles} currentCandle={currentCandle} price={price} />
              </div>
            </CardContent>
          </Card>

          {/* Trading card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Брокерский счёт</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Portfolio stats */}
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {fmtMnk(mnkHoldings)}
                  <span className="text-muted-foreground text-base font-normal ml-1.5">MNK</span>
                </p>
                <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
                  ≈&nbsp;{mnkValue.toLocaleString("ru", { maximumFractionDigits: 2 })}&nbsp;МР
                </p>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Баланс карт</span>
                <span className="tabular-nums font-medium">
                  {totalBalance.toLocaleString("ru")}&nbsp;МР
                </span>
              </div>

              <Separator />

              {/* Trade tabs */}
              <Tabs defaultValue="buy" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="buy" className="flex-1">Купить</TabsTrigger>
                  <TabsTrigger value="sell" className="flex-1">Продать</TabsTrigger>
                </TabsList>

                <TabsContent value="buy" className="space-y-3 mt-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="buy-amount" className="text-xs text-muted-foreground">
                        Сумма&nbsp;МР
                      </Label>
                      <button
                        type="button"
                        onClick={() => setBuyAmt(String(Math.floor(totalBalance)))}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono uppercase"
                      >
                        Макс
                      </button>
                    </div>
                    <Input
                      id="buy-amount"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      min="0"
                      value={buyAmt}
                      onChange={(e) => setBuyAmt(e.target.value)}
                    />
                    {buyPreview !== null && buyPreview > 0 && (
                      <p className="text-xs text-muted-foreground flex justify-between">
                        <span>Получите</span>
                        <span className="font-mono text-foreground">{fmtMnk(buyPreview)}&nbsp;MNK</span>
                      </p>
                    )}
                  </div>
                  <Button
                    variant="emerald"
                    className="w-full"
                    onClick={handleBuy}
                    disabled={busy || !buyAmt || parseFloat(buyAmt) <= 0 || isReadOnly}
                  >
                    {busy ? "Исполняем…" : "Купить MNK"}
                  </Button>
                </TabsContent>

                <TabsContent value="sell" className="space-y-3 mt-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sell-amount" className="text-xs text-muted-foreground">
                        Количество&nbsp;MNK
                      </Label>
                      <button
                        type="button"
                        onClick={() => setSellAmt(String(mnkHoldings))}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono uppercase"
                      >
                        Макс
                      </button>
                    </div>
                    <Input
                      id="sell-amount"
                      type="number"
                      inputMode="decimal"
                      placeholder="0.000000"
                      min="0"
                      step="any"
                      value={sellAmt}
                      onChange={(e) => setSellAmt(e.target.value)}
                    />
                    {sellPreview !== null && sellPreview > 0 && (
                      <p className="text-xs text-muted-foreground flex justify-between">
                        <span>Получите</span>
                        <span className="font-mono text-foreground">
                          {sellPreview.toLocaleString("ru", { maximumFractionDigits: 2 })}&nbsp;МР
                        </span>
                      </p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleSell}
                    disabled={busy || !sellAmt || parseFloat(sellAmt) <= 0 || mnkHoldings === 0 || isReadOnly}
                  >
                    {busy ? "Исполняем…" : "Продать MNK"}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Footer stats */}
        <Card>
          <CardContent className="py-3 px-6">
            <div className="flex items-center justify-around gap-2">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Тикер</p>
                <p className="text-sm font-mono font-medium mt-0.5">MNK / РУБ</p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Нач. цена</p>
                <p className="text-sm font-mono font-medium mt-0.5">0.1000&nbsp;Р</p>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Порог краха</p>
                <p className="text-sm font-mono font-medium text-red-500 mt-0.5">₽&nbsp;100&thinsp;000</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </>
  );
}
