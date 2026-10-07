import { describe, expect, it } from "vitest";
import { rpsResult, tttBestMove, tttStatus } from "../src/games";

const B = (s) => s.split("").map((c) => (c === "." ? null : c));

describe("rpsResult", () => {
  it("scores every pairing", () => {
    expect(rpsResult("rock", "scissors")).toBe("win");
    expect(rpsResult("paper", "rock")).toBe("win");
    expect(rpsResult("scissors", "paper")).toBe("win");
    expect(rpsResult("rock", "paper")).toBe("lose");
    expect(rpsResult("scissors", "rock")).toBe("lose");
    expect(rpsResult("paper", "paper")).toBe("draw");
  });
});

describe("tttStatus", () => {
  it("is null while the game is on", () => {
    expect(tttStatus(B("X...O...."))).toBeNull();
  });
  it("finds a winning line", () => {
    expect(tttStatus(B("XXXOO...."))).toEqual({ winner: "X", line: [0, 1, 2] });
    expect(tttStatus(B("O.XOX.O.X"))).toEqual({ winner: "O", line: [0, 3, 6] });
  });
  it("detects a draw", () => {
    expect(tttStatus(B("XOXXOOOXX"))).toEqual({ winner: "draw" });
  });
});

describe("tttBestMove", () => {
  it("takes a win when one is available", () => {
    expect(tttBestMove(B("OO.XX...."), "O")).toBe(2);
  });
  it("blocks the opponent's win", () => {
    expect(tttBestMove(B("XX..O...."), "O")).toBe(2);
  });
  it("never loses a full game against itself", () => {
    const b = Array(9).fill(null);
    let turn = "X";
    while (!tttStatus(b)) {
      b[tttBestMove(b, turn)] = turn;
      turn = turn === "X" ? "O" : "X";
    }
    expect(tttStatus(b).winner).toBe("draw");
  });
  it("makes a random legal move when it slips", () => {
    const i = tttBestMove(B("XX..O...."), "O", { mistakeRate: 1, rand: () => 0 });
    expect(i).toBe(2); // first empty cell
    expect(tttBestMove(B("XOXXOOOXX"), "O")).toBe(-1);
  });
});
