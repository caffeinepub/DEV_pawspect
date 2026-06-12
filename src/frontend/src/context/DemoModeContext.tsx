import { type ReactNode, createContext, useContext } from "react";
import {
  demoAvailability,
  demoBookings,
  demoCRMClients,
  demoDealOffers,
  demoPayments,
  demoPrivateData,
  demoReviews,
  demoServiceLogs,
  demoSitter,
  demoSitterStats,
  demoTips,
} from "../mocks/sitterDemoData";

interface DemoModeContextValue {
  isDemoMode: boolean;
  demoSitter: typeof demoSitter;
  demoBookings: typeof demoBookings;
  demoPayments: typeof demoPayments;
  demoAvailability: typeof demoAvailability;
  demoServiceLogs: typeof demoServiceLogs;
  demoReviews: typeof demoReviews;
  demoTips: typeof demoTips;
  demoPrivateData: typeof demoPrivateData;
  demoSitterStats: typeof demoSitterStats;
  demoCRMClients: typeof demoCRMClients;
  demoDealOffers: typeof demoDealOffers;
}

const DemoModeContext = createContext<DemoModeContextValue>({
  isDemoMode: false,
  demoSitter,
  demoBookings,
  demoPayments,
  demoAvailability,
  demoServiceLogs,
  demoReviews,
  demoTips,
  demoPrivateData,
  demoSitterStats,
  demoCRMClients,
  demoDealOffers,
});

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const value: DemoModeContextValue = {
    isDemoMode: true,
    demoSitter,
    demoBookings,
    demoPayments,
    demoAvailability,
    demoServiceLogs,
    demoReviews,
    demoTips,
    demoPrivateData,
    demoSitterStats,
    demoCRMClients,
    demoDealOffers,
  };
  return (
    <DemoModeContext.Provider value={value}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
