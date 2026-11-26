import { describe, expect, it } from "vitest";
import { en } from "@/i18n/en";
import type { StatusResponse } from "@/lib/api";
import { gatewayLine, gatewayCompactText } from "./SidebarStatusStrip";

// Minimal fixture — double cast avoids declaring all required StatusResponse fields.
const base = {
  gateway_running: false,
  gateway_state: null,
  gateways: [],
} as unknown as StatusResponse;

describe("gatewayLine", () => {
  it("gateway_running true / state running → Running, text-success", () => {
    const r = gatewayLine(
      { ...base, gateway_running: true, gateway_state: "running" } as StatusResponse,
      en,
    );
    expect(r.label).toBe("Running");
    expect(r.fullLabel).toBe("Running");
    expect(r.tone).toBe("text-success");
  });

  it("gateway_running false, state null, 2 gateways → Running · 2 / fullLabel with count", () => {
    const r = gatewayLine(
      {
        ...base,
        gateways: [{ profile: "a" }, { profile: "b" }],
      } as StatusResponse,
      en,
    );
    expect(r.label).toBe("Running · 2");
    expect(r.fullLabel).toBe("Running · 2 gateways");
    expect(r.tone).toBe("text-success");
  });

  it("starting → Starting, text-warning", () => {
    const r = gatewayLine({ ...base, gateway_state: "starting" } as StatusResponse, en);
    expect(r.label).toBe("Starting");
    expect(r.tone).toBe("text-warning");
  });

  it("startup_failed → Start failed, text-destructive", () => {
    const r = gatewayLine(
      { ...base, gateway_state: "startup_failed" } as StatusResponse,
      en,
    );
    expect(r.label).toBe("Start failed");
    expect(r.tone).toBe("text-destructive");
  });

  it("stopped → Stopped, text-muted-foreground", () => {
    const r = gatewayLine({ ...base, gateway_state: "stopped" } as StatusResponse, en);
    expect(r.label).toBe("Stopped");
    expect(r.tone).toBe("text-muted-foreground");
  });

  it("no state, empty gateways → Off", () => {
    const r = gatewayLine(base, en);
    expect(r.label).toBe("Off");
    expect(r.tone).toBe("text-muted-foreground");
  });
});

describe("gatewayCompactText", () => {
  it("uses en.app.gatewayLabel as prefix (not hardcoded string)", () => {
    const text = gatewayCompactText(
      { ...base, gateway_running: true } as StatusResponse,
      en,
    );
    expect(en.app.gatewayLabel).toBe("Gateway:");
    expect(text.startsWith(en.app.gatewayLabel!)).toBe(true);
  });

  it("running → 'Gateway: Running'", () => {
    expect(
      gatewayCompactText(
        { ...base, gateway_running: true, gateway_state: "running" } as StatusResponse,
        en,
      ),
    ).toBe("Gateway: Running");
  });

  it("2 gateways → 'Gateway: Running · 2'", () => {
    expect(
      gatewayCompactText(
        { ...base, gateways: [{ profile: "a" }, { profile: "b" }] } as StatusResponse,
        en,
      ),
    ).toBe("Gateway: Running · 2");
  });

  it("starting → 'Gateway: Starting'", () => {
    expect(
      gatewayCompactText({ ...base, gateway_state: "starting" } as StatusResponse, en),
    ).toBe("Gateway: Starting");
  });

  it("startup_failed → 'Gateway: Start failed'", () => {
    expect(
      gatewayCompactText(
        { ...base, gateway_state: "startup_failed" } as StatusResponse,
        en,
      ),
    ).toBe("Gateway: Start failed");
  });

  it("stopped → 'Gateway: Stopped'", () => {
    expect(
      gatewayCompactText({ ...base, gateway_state: "stopped" } as StatusResponse, en),
    ).toBe("Gateway: Stopped");
  });

  it("off → 'Gateway: Off'", () => {
    expect(gatewayCompactText(base, en)).toBe("Gateway: Off");
  });
});
