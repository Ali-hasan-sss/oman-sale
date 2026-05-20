import { createContext, useContext, type PropsWithChildren } from 'react';

type ScreenInsetsContextValue = {
  withTabBar: boolean;
};

const ScreenInsetsContext = createContext<ScreenInsetsContextValue>({ withTabBar: true });

export function ScreenInsetsProvider({
  withTabBar,
  children
}: PropsWithChildren<{ withTabBar: boolean }>) {
  return <ScreenInsetsContext.Provider value={{ withTabBar }}>{children}</ScreenInsetsContext.Provider>;
}

export function useScreenInsetsContext() {
  return useContext(ScreenInsetsContext);
}
