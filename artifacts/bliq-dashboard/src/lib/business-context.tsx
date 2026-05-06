import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { Business } from "@workspace/api-client-react";

interface BusinessContextType {
  business: Business | null;
  setBusiness: (business: Business | null) => void;
  isLoading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({
  children,
  initialBusiness,
  isLoading
}: {
  children: ReactNode;
  initialBusiness: Business | null;
  isLoading?: boolean;
}) {
  const [business, setBusiness] = useState<Business | null>(initialBusiness);

  useEffect(() => {
    if (initialBusiness) {
      setBusiness(initialBusiness);
    }
  }, [initialBusiness]);

  return (
    <BusinessContext.Provider value={{ business, setBusiness, isLoading: isLoading || false }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return context;
}
