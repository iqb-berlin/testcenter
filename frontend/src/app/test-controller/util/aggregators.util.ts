export const AggregatorsUtil: { [aggregatorName: string]: (a: number[]) => number } =
{
  median: (numbers: number[]): number => {
    const sorted = Array.from(numbers)
      .sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
  },

  sum: (numbers: number[]): number => numbers
    .reduce((a, v) => a + v, 0),

  mean: (numbers: number[]): number => numbers
    .reduce((acc, v, i, a) => (acc + v / a.length), 0)
};
