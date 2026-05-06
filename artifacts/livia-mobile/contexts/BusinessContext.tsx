import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetMyBusinesses } from "@workspace/api-client-react";
import type { Business } from "@workspace/api-client-react";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface BusinessContextValue {
  businesses: Business[];
  currentBusiness: Business | null;
  isLoading: boolean;
  isError: boolean;
  setCurrentBusiness: (business: Business) => void;
  refetch: () => void;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);
const STORAGE_KEY = "bliq_current_business_id";

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(
    null
  );

  const {
    data: businesses = [],
    isLoading,
    isError,
    refetch,
  } = useGetMyBusinesses();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((id) => {
      if (id) setCurrentBusinessId(id);
    });
  }, []);

  useEffect(() => {
    if (businesses.length > 0 && !currentBusinessId) {
      const first = businesses[0];
      setCurrentBusinessId(first.id);
      AsyncStorage.setItem(STORAGE_KEY, first.id);
    }
  }, [businesses, currentBusinessId]);

  const currentBusiness = useMemo(
    () => businesses.find((b) => b.id === currentBusinessId) ?? businesses[0] ?? null,
    [businesses, currentBusinessId]
  );

  const setCurrentBusiness = (business: Business) => {
    setCurrentBusinessId(business.id);
    AsyncStorage.setItem(STORAGE_KEY, business.id);
  };

  const value = useMemo(
    () => ({
      businesses,
      currentBusiness,
      isLoading,
      isError,
      setCurrentBusiness,
      refetch,
    }),
    [businesses, currentBusiness, isLoading, isError, refetch]
  );

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) throw new Error("useBusiness must be used within BusinessProvider");
  return context;
}
