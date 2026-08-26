const INPUT_EUR_PER_MILLION = 2.5;
const OUTPUT_EUR_PER_MILLION = 10;

export function generationCostEur(inputTokens: number, outputTokens: number) {
  return (
    (inputTokens / 1_000_000) * INPUT_EUR_PER_MILLION +
    (outputTokens / 1_000_000) * OUTPUT_EUR_PER_MILLION
  );
}

export function formatGenerationCost(inputTokens: number, outputTokens: number) {
  const eur = generationCostEur(inputTokens, outputTokens);
  return new Intl.NumberFormat("sr-Latn", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(eur);
}
