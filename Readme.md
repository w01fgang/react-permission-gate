# React permission gate
inspired by https://isamatov.com/react-permissions-and-roles/

Easily render or hide pieces of UI relative to the user's access role.

### Supports Typescript and Flow type


### Example
full example [here](example)
```javascript
import { PermissionGateProvider } from 'permission-gate';
...

// define or get from api rules and freeze them
const rules = Object.freeze({
  componentName: ['admin', 'user', 'other-role'],
  anotherComponentName: ['admin'],
});

function MyApp() {
  const role = 'user'; // get from authenticated user

  return (
    <PermissionGateProvider role={role} rulesMap={rules}>
      <App />
    </PermissionGateProvider>
  )
}
```
then anywhere in the app use names of logical components defined in the rules map

```javascript
import { PermissionGate } from 'permission-gate';
...

<PermissionGate name="componentName">
  <div>Component available for authorized user</div>
</PermissionGate>

<PermissionGate name="anotherComponentName">
  <div>Admin only component</div>
</PermissionGate>

```
or use hook
```javascript
import { usePermission } from 'permission-gate';
...

const { permission: showComponentName, role, rulesMap, } = usePermission('componentName');
// permission for the current user
// his role and rulea map as passed to the provider
...
{showComponentName && <div>Component available for authorized user</div>}
```
