import React, { createRef } from "react";
import ReactDOM, { unmountComponentAtNode } from "react-dom";
import ReactDOMServer from "react-dom/server";
import { act } from "react-dom/test-utils";
import { PermissionGateProvider, PermissionGate } from "./index";

let container: HTMLDivElement;
let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  unmountComponentAtNode(container);
  container.remove();
  const errorCalls = consoleErrorSpy.mock.calls;
  consoleErrorSpy.mockRestore();
  // guard: no test may trigger a React warning while the spy silences the channel
  expect(errorCalls).toEqual([]);
});

function renderIntoContainer(node: React.ReactElement) {
  act(() => {
    ReactDOM.render(node, container);
  });
}

describe("hasPermission via usePermission/PermissionGate", () => {
  test("role in rule scope renders the gated content", () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <PermissionGateProvider role="owner" rulesMap={{ edit: ["owner", "editor"] }}>
        <PermissionGate name="edit"><span>Edit</span></PermissionGate>
      </PermissionGateProvider>
    );
    expect(html).toContain("Edit");
  });

  test("role outside rule scope renders nothing", () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <PermissionGateProvider role="guest" rulesMap={{ edit: ["owner", "editor"] }}>
        <PermissionGate name="edit"><span>Edit</span></PermissionGate>
      </PermissionGateProvider>
    );
    expect(html).toBe("");
  });

  test("unknown rule name grants access by default", () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <PermissionGateProvider role="guest" rulesMap={{ edit: ["owner"] }}>
        <PermissionGate name="publish"><span>Publish</span></PermissionGate>
      </PermissionGateProvider>
    );
    expect(html).toContain("Publish");
  });

  test("empty rulesMap grants access to every rule name", () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <PermissionGateProvider role="guest" rulesMap={{}}>
        <PermissionGate name="anything"><span>Anything</span></PermissionGate>
      </PermissionGateProvider>
    );
    expect(html).toContain("Anything");
  });
});

describe("PermissionGate enforcement", () => {
  test("denied access renders nothing", () => {
    renderIntoContainer(
      <PermissionGateProvider role="guest" rulesMap={{ edit: ["owner"] }}>
        <PermissionGate name="edit"><span>Edit</span></PermissionGate>
      </PermissionGateProvider>
    );
    expect(container.innerHTML).toBe("");
  });

  test("granted access renders the single child element", () => {
    renderIntoContainer(
      <PermissionGateProvider role="owner" rulesMap={{ edit: ["owner"] }}>
        <PermissionGate name="edit"><span>Edit</span></PermissionGate>
      </PermissionGateProvider>
    );
    expect(container.textContent).toBe("Edit");
  });

  test("forwards ref to the rendered child DOM node", () => {
    const ref = createRef<HTMLButtonElement>();
    renderIntoContainer(
      <PermissionGateProvider role="owner" rulesMap={{ save: ["owner"] }}>
        <PermissionGate name="save" ref={ref}><button>Save</button></PermissionGate>
      </PermissionGateProvider>
    );
    expect(ref.current).toBe(container.querySelector("button"));
  });

  test("spreads extra props on PermissionGate onto the single child", () => {
    // ConsumerProps has no index signature; cast bypasses that to exercise the ...other spread at runtime.
    const AnyPermissionGate = PermissionGate as any;
    renderIntoContainer(
      <PermissionGateProvider role="owner" rulesMap={{}}>
        <AnyPermissionGate name="edit" data-testid="extra"><span>Edit</span></AnyPermissionGate>
      </PermissionGateProvider>
    );
    expect(container.querySelector("span")?.getAttribute("data-testid")).toBe("extra");
  });
});

describe("PermissionGate ReactNode children", () => {
  test("renders multiple element children", () => {
    renderIntoContainer(
      <PermissionGateProvider role="owner" rulesMap={{}}>
        <PermissionGate name="edit">
          <span>First</span>
          <span>Second</span>
        </PermissionGate>
      </PermissionGateProvider>
    );
    expect(container.textContent).toBe("FirstSecond");
  });

  test("renders an array of elements produced by .map()", () => {
    const items = ["a", "b", "c"].map((item) => <li key={item}>{item}</li>);
    renderIntoContainer(
      <PermissionGateProvider role="owner" rulesMap={{}}>
        <PermissionGate name="list">{items}</PermissionGate>
      </PermissionGateProvider>
    );
    expect(container.querySelectorAll("li").length).toBe(3);
  });

  test("renders a plain string child", () => {
    renderIntoContainer(
      <PermissionGateProvider role="owner" rulesMap={{}}>
        <PermissionGate name="text">Hello</PermissionGate>
      </PermissionGateProvider>
    );
    expect(container.textContent).toBe("Hello");
  });

  test("false children render nothing without logging a console error", () => {
    renderIntoContainer(
      <PermissionGateProvider role="owner" rulesMap={{}}>
        <PermissionGate name="conditional">{false}</PermissionGate>
      </PermissionGateProvider>
    );
    expect(container.innerHTML).toBe("");
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});

describe("custom validator", () => {
  test("is invoked with role, rulesMap, and rule name", () => {
    const validator = jest.fn().mockReturnValue(true);
    const rulesMap = { edit: ["owner"] };
    const role = "owner";
    ReactDOMServer.renderToStaticMarkup(
      <PermissionGateProvider role={role} rulesMap={rulesMap} validator={validator}>
        <PermissionGate name="edit"><span>Edit</span></PermissionGate>
      </PermissionGateProvider>
    );
    expect(validator).toHaveBeenCalledWith({ role, rulesMap, name: "edit" });
  });

  test("returning false blocks render even though hasPermission would allow", () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <PermissionGateProvider role="owner" rulesMap={{}} validator={() => false}>
        <PermissionGate name="unknown-rule"><span>Secret</span></PermissionGate>
      </PermissionGateProvider>
    );
    expect(html).toBe("");
  });

  test("falls back to hasPermission when no validator is provided", () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <PermissionGateProvider role="guest" rulesMap={{ edit: ["owner"] }}>
        <PermissionGate name="edit"><span>Edit</span></PermissionGate>
      </PermissionGateProvider>
    );
    expect(html).toBe("");
  });
});
