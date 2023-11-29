export type DebouncedFunction<F extends (...args: any[]) => any> = (
  ...args: Parameters<F>
) => void;

export default function debounce<F extends (...args: any[]) => any>(
  func: F,
  delay: number
): DebouncedFunction<F> {
  let timeoutId: NodeJS.Timeout | null;

  return function debounced(...args: Parameters<F>): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}
