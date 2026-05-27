import { NextResponse } from "next/server";
import { readDb, writeDb, logClick } from "@/lib/db";
import { getSession, encrypt, decrypt } from "@/lib/auth";

interface GameState {
  bet: number;
  cardId: string;
  chamber: number;
  bulletPosition: number;
  turnIndex: number;
  participants: { id: string; name: string; isBot: boolean; isDead: boolean }[];
  userId: string;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "start") {
    const { bet, cardId } = body;
    if (!bet || bet <= 0) return NextResponse.json({ error: "Invalid bet" }, { status: 400 });

    const db = readDb();
    const user = db.users.find((u) => u.id === session.user.id);
    const card = db.cards.find((c) => c.id === cardId && c.userId === session.user.id);

    if (!user || !card) return NextResponse.json({ error: "User or Card not found" }, { status: 404 });
    if (card.balance < bet) return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });

    const participants = [
      { id: "player", name: "Вы", isBot: false, isDead: false },
      { id: "bot1", name: "Кибер-Борис", isBot: true, isDead: false },
      { id: "bot2", name: "Нейро-Наташа", isBot: true, isDead: false },
      { id: "bot3", name: "Бинарный-Олег", isBot: true, isDead: false },
    ];

    const state: GameState = {
      bet,
      cardId,
      chamber: 0,
      bulletPosition: Math.floor(Math.random() * 6),
      turnIndex: 0,
      participants,
      userId: session.user.id,
    };

    const token = await encrypt(state, "1h");
    return NextResponse.json({
      token,
      state: {
        participants,
        turnIndex: 0,
        chamber: 0
      }
    });
  }

  if (action === "move") {
    const { token, move, targetId } = body;
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    let state: GameState;
    try {
      state = await decrypt(token);
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    if (state.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const shooter = state.participants[state.turnIndex];
    let actualMove = move;
    let actualTargetId = targetId;

    // If it's a bot's turn, we ignore client input and decide server-side
    if (shooter.isBot) {
      actualMove = Math.random() > 0.3 ? "shoot" : "pass";
      if (actualMove === "shoot") {
        const targets = state.participants.filter(p => !p.isDead);
        actualTargetId = targets[Math.floor(Math.random() * targets.length)].id;
      }
    }

    let resultMsg = "";
    let isGameOver = false;
    let gameResult: "won" | "lost" | "continue" = "continue";

    if (actualMove === "shoot") {
      const isHit = state.chamber === state.bulletPosition;
      if (isHit) {
        resultMsg = `💥 БАБАХ! ${actualTargetId === "player" ? "Вы выбыли" : state.participants.find(p => p.id === actualTargetId)?.name + " выбыл"}.`;
        state.participants = state.participants.map(p => p.id === actualTargetId ? { ...p, isDead: true } : p);

        if (actualTargetId === "player") {
          gameResult = "lost";
          isGameOver = true;
        } else {
          const survivors = state.participants.filter(p => !p.isDead);
          if (survivors.length === 1 && survivors[0].id === "player") {
            gameResult = "won";
            isGameOver = true;
          } else {
            state.chamber = 0;
            state.bulletPosition = Math.floor(Math.random() * 6);
            moveToNextTurn(state);
          }
        }
      } else {
        resultMsg = `Щелчок... ${state.participants.find(p => p.id === actualTargetId)?.name} везет.`;
        state.chamber++;
        moveToNextTurn(state);
      }
    } else {
      resultMsg = `${shooter.name} пропускает ход.`;
      moveToNextTurn(state);
    }

    if (isGameOver) {
      const db = readDb();
      const user = db.users.find((u) => u.id === session.user.id);
      const card = db.cards.find((c) => c.id === state.cardId && c.userId === session.user.id);

      if (user && card) {
        if (gameResult === "won") {
          card.balance += state.bet;
          user.totalEarned += state.bet;
          logClick(db, user.id, `Выиграл в рулетку: +${state.bet} МР`);
        } else {
          const deduction = Math.min(card.balance, state.bet);
          card.balance -= deduction;
          user.totalSpent += deduction;
          logClick(db, user.id, `Проиграл в рулетку: -${deduction} МР`);
        }
        writeDb(db);
      }

      return NextResponse.json({
        status: gameResult,
        message: resultMsg,
        state: {
          participants: state.participants,
          turnIndex: state.turnIndex,
          chamber: state.chamber
        },
        newBalance: card?.balance
      });
    }

    const newToken = await encrypt(state, "1h");
    return NextResponse.json({
      status: "continue",
      message: resultMsg,
      token: newToken,
      state: {
        participants: state.participants,
        turnIndex: state.turnIndex,
        chamber: state.chamber
      }
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

function moveToNextTurn(state: GameState) {
  let next = (state.turnIndex + 1) % state.participants.length;
  while (state.participants[next].isDead) {
    next = (next + 1) % state.participants.length;
  }
  state.turnIndex = next;
}
