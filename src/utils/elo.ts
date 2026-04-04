const K = 32;

export function calculateElo(
  player: number,
  opponent: number,
  result: 0 | 1
) {
  const expected =
    1 / (1 + Math.pow(10, (opponent - player) / 400));

  return Math.round(player + K * (result - expected));
}