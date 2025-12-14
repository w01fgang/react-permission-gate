import React, {
  useContext,
  useMemo,
  createContext,
  cloneElement,
  forwardRef,
  isValidElement,
  Context,
  Ref,
  ReactNode,
  ReactElement,
} from "react";

export type Rules = {
  rulesMap: { [key: string]: string[] },
  role: string,
  validator?: ({ role, rulesMap, name }: Rules & { name: string }) => boolean,
};

const RoleContext: Context<Rules> = createContext({
  rulesMap: {},
  role: '',
});

type ProviderProps = {
  children: ReactNode,
} & Rules;

type ConsumerProps = {
  children: ReactNode,
  name: string,
};

export function PermissionGateProvider({ children, role, rulesMap, validator }: ProviderProps): ReactElement {
  const value = useMemo(() => ({ role, rulesMap, validator }), [role, rulesMap, validator]);
  return (
    <RoleContext.Provider value={value}>
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
  const { role, rulesMap, validator = hasPermission }: Rules = useContext(RoleContext);

  const granted = validator({ role, rulesMap, name });
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
