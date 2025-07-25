import { useQuery } from "@tanstack/react-query";
import type { Keyword } from "@shared/schema";

export function useKeywords() {
  const { data: keywords = [], isLoading, error } = useQuery<Keyword[]>({
    queryKey: ['/api/keywords'],
  });

  return {
    keywords,
    isLoading,
    error,
  };
}
