"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TargetIcon,
  LightningBoltIcon,
  ArchiveIcon,
  BackpackIcon,
  ClockIcon,
  CheckCircledIcon,
  MagicWandIcon,
} from "@radix-ui/react-icons";
import { withAccess } from "@/components/AccessGuard";
import type { Task } from "@/lib/db";
import { useRouter } from "next/navigation";

const iconMap: Record<string, any> = {
  daily: LightningBoltIcon,
  weekly: BackpackIcon,
  special: TargetIcon,
};

function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalPoints = tasks.filter((t) => t.completed).reduce((sum, t) => sum + t.rewardPoints, 0);

  const completeTask = async (id: string) => {
    await fetch("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, completed: true, progress: 999999 }) });
    fetchTasks();
  };

  if (loading) return <div className="space-y-6"><div className="h-8 w-32 bg-secondary rounded animate-pulse" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map((i) => <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />)}</div></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Задания</h1><p className="text-muted-foreground text-sm mt-1">Выполняйте задания и получайте бонусы</p></div>

      {toast && (
        <Card className="border-emerald-500/50 bg-emerald-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center"><MagicWandIcon className="w-5 h-5 text-emerald-500" /></div>
              <div>
                <p className="font-medium text-emerald-500">{toast}</p>
                <p className="text-sm text-muted-foreground">Бонусные баллы начислены на ваш счёт</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Выполнено</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{completedCount}/{tasks.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Получено баллов</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-500">{totalPoints}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">В процессе</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{tasks.length - completedCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">До следующего уровня</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{Math.max(0, 500 - totalPoints)}</div></CardContent></Card>
      </div>

      {tasks.length === 0 ? (
        <Card><CardContent className="pt-6 text-center py-12 text-muted-foreground">Нет доступных заданий</CardContent></Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList><TabsTrigger value="all">Все</TabsTrigger><TabsTrigger value="daily">Ежедневные</TabsTrigger><TabsTrigger value="weekly">Еженедельные</TabsTrigger><TabsTrigger value="special">Специальные</TabsTrigger></TabsList>
          {["all", "daily", "weekly", "special"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              <div className="space-y-4">
                {(tab === "all" ? tasks : tasks.filter((t) => t.type === tab)).map((task) => {
                  const pct = Math.min((task.progress / task.total) * 100, 100);
                  const Icon = iconMap[task.type] || TargetIcon;
                  return (
                    <Card key={task.id} className={task.completed ? "border-emerald-500/50" : ""}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                            {task.completed ? <CheckCircledIcon className="w-5 h-5 text-emerald-500" /> : <Icon className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div><h3 className="font-medium">{task.title}</h3><p className="text-sm text-muted-foreground mt-0.5">{task.description}</p></div>
                              <Badge variant="secondary">{task.reward}</Badge>
                            </div>
                            <div className="mt-4 space-y-1.5">
                              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{task.progress} / {task.total}</span><span className="font-medium">{Math.round(pct)}%</span></div>
                              <Progress value={pct} className="h-2" />
                            </div>
                            {!task.completed && <Button size="sm" variant="gradient" className="mt-3" onClick={() => completeTask(task.id)}>Отметить выполненным</Button>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
export default withAccess(TasksPage, "/dashboard/tasks");
