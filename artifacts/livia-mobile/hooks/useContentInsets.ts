import { useWindowDimensions } from "react-native";

/** Phone vs tablet padding — keeps scroll content readable on iPad without cramming phone. */
export function useContentInsets() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  return {
    horizontalPad: isTablet ? 24 : 16,
    maxContentWidth: isTablet ? 560 : undefined as number | undefined,
  };
}
