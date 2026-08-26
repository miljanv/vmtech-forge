export function AnimatedNumber({ value }: { value: number }) {
  return <span>{value.toLocaleString("sr-Latn")}</span>;
}
