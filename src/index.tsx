import React, { useContext, createContext, cloneElement, forwardRef, isValidElement, Context, Ref, ReactChild, ReactElement } from "react";

export type Rules = {
  rulesMap: { [key: string]: string[] },
  role: string,
};

const RoleContext: Context<Rules> = createContext({
  rulesMap: {},
  role: '',
});

type ProviderProps = {
  children: ReactChild,
} & Rules;

type ConsumerProps = {
  children: ReactChild,
  name: string,
};

export function PermissionGateProvider({ children, role, rulesMap }: ProviderProps): ReactElement {
  return (
    <RoleContext.Provider value={{ role, rulesMap }}>
      {children}
    </RoleContext.Provider>
  )
}

const hasPermission = ({ role, rulesMap, name }: Rules & { name: string }): boolean => {
  const scope = rulesMap[name];
  if (!scope) return true;

  return scope.includes(role);
};

export function usePermission(name: string): Rules & { granted: boolean } {
  const { role, rulesMap }: Rules = useContext(RoleContext);

  const granted = hasPermission({ role, rulesMap, name });
  return { granted, role, rulesMap };
}

function Gate({ children, name, ...other }: ConsumerProps, ref: Ref<HTMLElement>) {
  const { granted } = usePermission(name);

  if (!granted) return null;

  if (!isValidElement(children)) {
    console.error("Children prop is not a valid react element");
    return null;
  }

  return cloneElement(children, { ref, ...other });
}

export const PermissionGate = forwardRef(Gate);
