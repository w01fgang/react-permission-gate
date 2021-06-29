import React, { useContext, createContext } from "react";

export type Rules = {
  rulesMap: { [key: string]: string[] },
  role: string,
};

const RoleContext: React.Context<Rules> = createContext({
  rulesMap: {},
  role: '',
});

type ProviderProps = {
  children: React.ReactNode,
} & Rules;

type ConsumerProps = {
  children: React.ReactNode,
  name: string,
};

function PermissionGateProvider({ children, role, rulesMap }: ProviderProps): React.ReactNode {

  return (
    <RoleContext.Provider value={{ role, rulesMap }}>
      {children}
    </RoleContext.Provider>
  )
}

const hasPermission = ({ role, rulesMap, name }: Rules & { name: string }): boolean => {
  const scope = rulesMap[name];
  if (!scope) return false;

  return scope.includes(role);
};

function PermissionGate({ children, name }: ConsumerProps): React.ReactNode {
  const { role, rulesMap }: Rules = useContext(RoleContext);

  const permissionGranted = hasPermission({ role, rulesMap, name });

  if (!permissionGranted) return null;

  return children;
}

export default {
  PermissionGateProvider,
  PermissionGate,
};
