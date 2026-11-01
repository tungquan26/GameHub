import { describe, expect, it } from "vitest";
import { motionDuration } from "@/lib/motion";

describe("CSS animation durations", () => {
  it.each([
    ["350ms", 350], [".35s", 350], ["0.65s", 650],
    [".45s", 450], [".18s", 180], ["1.5s", 1500],
    ["0s", 0], ["0ms", 0], ["", 350], ["invalid", 350],
  ])("reads %s as %s milliseconds", (value, expected) => {
    const element = document.createElement("div");
    element.style.setProperty("--duration", value);
    document.body.append(element);
    try { expect(motionDuration(element, "--duration", 350)).toBe(expected); }
    finally { element.remove(); }
  });
});
