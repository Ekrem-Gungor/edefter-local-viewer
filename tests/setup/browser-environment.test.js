import { describe, expect, it } from "vitest";

describe("browser test environment", () => {
  it("provides the browser APIs required by the viewer", () => {
    expect(DOMParser).toBeTypeOf("function");
    expect(FileReader).toBeTypeOf("function");
    expect(document).toBeInstanceOf(Document);
  });
});
