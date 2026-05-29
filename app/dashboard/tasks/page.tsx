"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiCheckboxCircleFill, RiStarFill, RiFlashlightLine, RiTimeLine } from "react-icons/ri";
import { toast } from "sonner";
import { useProgression } from "@/lib/progression";
import type { UserProfile } from "@/lib/db";
import { withAccess } from "@/components/AccessGuard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  category: string;
}

function TasksPage() {
  const { triggerLevelUps } = useProgression();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = async () => {
    try {
      const [tasksRes, userRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/user")
      ]);
      const tasksData = await tasksRes.json();
      const userData = await userRes.json();
      setTasks(tasksData);
      setUser(userData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const completeTask = async (taskId: string) => {
    try {
      const res = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Задание выполнено! +${data.points} баллов`);
        if (data.levelUps?.length) {
          triggerLevelUps(data.levelUps, data.level, data.xp, data.currentXp, data.nextXp);
        }
        fetchData();
      }
    } catch (err) {
      toast.error("Ошибка");
    }
  };

  if (loading) return <div className="space-y-6"><div className="h-8 w-48 bg-secondary rounded animate-pulse" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-secondary rounded-xl animate-pulse" />)}</div></div>;

  const completedCount = tasks.filter(t => t.completed).length;
  const filteredTasks = tasks.filter(t => {
      if (filter === "completed") return t.completed;
      if (filter === "active") return !t.completed;
      return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Задания</h1>
          <p className="text-muted-foreground text-sm mt-1">Выполняйте простые действия и получайте награды</p>
        </div>
        <Card className="bg-primary/5 border-primary/20 shrink-0">
          <CardContent className="py-3 px-6 flex items-center gap-4">
            <div className="text-center border-r border-primary/10 pr-4">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Баллы</p>
              <p className="text-xl font-bold text-primary">{user?.bonusBalance || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Выполнено</p>
              <p className="text-xl font-bold">{completedCount}/{tasks.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="active">Активные</TabsTrigger>
          <TabsTrigger value="completed">Завершенные</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className={`${task.completed ? "opacity-60 bg-secondary/20" : "hover:border-primary/30 transition-colors"}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start mb-2">
                <Badge variant={task.completed ? "secondary" : "outline"} className="text-[10px] uppercase font-bold">
                  {task.category}
                </Badge>
                <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                  <RiStarFill className="w-3.5 h-3.5" />
                  {task.points}
                </div>
              </div>
              <CardTitle className="text-base line-clamp-1">{task.title}</CardTitle>
              <CardDescription className="text-xs line-clamp-2 h-8">{task.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {task.completed ? (
                <div className="flex items-center justify-center gap-2 text-emerald-500 text-xs font-bold py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                  <RiCheckboxCircleFill className="w-4 h-4" /> ВЫПОЛНЕНО
                </div>
              ) : (
                <Button className="w-full h-9 text-xs font-bold" variant="secondary" onClick={() => completeTask(task.id)}>
                  ВЫПОЛНИТЬ
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="py-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
            <RiTimeLine className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium">Новые задания скоро появятся</h3>
          <p className="text-xs text-muted-foreground mt-1">Заходите каждый день, чтобы не пропустить бонусы</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default withAccess(TasksPage, "/dashboard/tasks");
