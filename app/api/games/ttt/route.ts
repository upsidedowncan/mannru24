import { NextResponse } from "next/server";
import { readDb, writeDb, logClick } from "@/lib/db";
import { getSession, encrypt, decrypt } from "@/lib/auth";

interface TttState {
  board: (string | null)[];
  bet: number;
  cardId: string;
  userId: string;
  isGameOver: boolean;
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
    const user = db.users.find(u => u.id === session.user.id);
    const card = db.cards.find(c => c.id === cardId && c.userId === session.user.id);

    if (!user || !card) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (card.balance < bet) return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });

    card.balance -= bet;
    user.totalSpent += bet;
    logClick(db, user.id, `Начал игру в Крестики-Нолики: -${bet} МР`);
    writeDb(db);

    const state: TttState = {
      board: Array(9).fill(null),
      bet,
      cardId,
      userId: session.user.id,
      isGameOver: false,
    };

    const token = await encrypt(state, "1h");
    return NextResponse.json({ token, board: state.board, newBalance: card.balance });
  }

  if (action === "move") {
    const { token, index } = body;
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    let state: TttState;
    try {
      state = await decrypt(token);
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    if (state.userId !== session.user.id || state.isGameOver) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (state.board[index] !== null) return NextResponse.json({ error: "Invalid move" }, { status: 400 });

    // Player move (X)
    state.board[index] = "X";
    let winner = checkWinner(state.board);
    let outcome: "win" | "loss" | "draw" | "continue" = "continue";

    if (winner === "X") {
      outcome = "win";
      state.isGameOver = true;
    } else if (!state.board.includes(null)) {
      outcome = "draw";
      state.isGameOver = true;
    } else {
      // Improved Bot move (O) using Minimax or at least strategic priority
      const botIdx = getBestMove(state.board, "O");
      state.board[botIdx] = "O";

      winner = checkWinner(state.board);
      if (winner === "O") {
        outcome = "loss";
        state.isGameOver = true;
      } else if (!state.board.includes(null)) {
        outcome = "draw";
        state.isGameOver = true;
      }
    }

    let newBalance;
    if (state.isGameOver) {
      const db = readDb();
      const user = db.users.find(u => u.id === session.user.id);
      const card = db.cards.find(c => c.id === state.cardId && c.userId === session.user.id);

      if (user && card) {
        if (outcome === "win") {
          card.balance += state.bet * 2;
          user.totalEarned += state.bet * 2;
          logClick(db, user.id, `Выиграл в Крестики-Нолики: +${state.bet * 2} МР`);
        } else if (outcome === "draw") {
          card.balance += state.bet;
          user.totalEarned += state.bet;
          logClick(db, user.id, `Ничья в Крестики-Нолики: +${state.bet} МР`);
        } else {
          logClick(db, user.id, `Проиграл в Крестики-Нолики: -${state.bet} МР`);
        }
        writeDb(db);
        newBalance = card.balance;
      }
    }

    const newToken = state.isGameOver ? null : await encrypt(state, "1h");
    return NextResponse.json({
      token: newToken,
      board: state.board,
      outcome,
      newBalance
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

function checkWinner(squares: (string | null)[]) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

function getBestMove(board: (string | null)[], player: string): number {
  const opponent = player === "X" ? "O" : "X";

  const minimax = (newBoard: (string | null)[], currentPlayer: string): { score: number; index?: number } => {
    const availSpots = newBoard.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];

    const winner = checkWinner(newBoard);
    if (winner === opponent) return { score: -10 };
    if (winner === player) return { score: 10 };
    if (availSpots.length === 0) return { score: 0 };

    const moves: { index: number; score: number }[] = [];

    for (let i = 0; i < availSpots.length; i++) {
      const move: { index: number; score: number } = { index: availSpots[i], score: 0 };
      newBoard[availSpots[i]] = currentPlayer;

      if (currentPlayer === player) {
        move.score = minimax(newBoard, opponent).score;
      } else {
        move.score = minimax(newBoard, player).score;
      }

      newBoard[availSpots[i]] = null;
      moves.push(move);
    }

    let bestMove: number = 0;
    if (currentPlayer === player) {
      let bestScore = -10000;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score > bestScore) {
          bestScore = moves[i].score;
          bestMove = i;
        }
      }
    } else {
      let bestScore = 10000;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score < bestScore) {
          bestScore = moves[i].score;
          bestMove = i;
        }
      }
    }

    return moves[bestMove];
  };

  return minimax([...board], player).index!;
}
