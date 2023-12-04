export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface CleanableSleeper {
  sleep: () => Promise<void>;
  clean: () => void;
}

export function sleepWithCleaner(ms: number): CleanableSleeper {
  let timeoutId: NodeJS.Timeout | null;
  return {
    sleep: () =>
      new Promise((resolve) => {
        timeoutId = setTimeout(resolve, ms);
      }),
    clean: () => {
      if (timeoutId) clearTimeout(timeoutId);
    },
  };
}
