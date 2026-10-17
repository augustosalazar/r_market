import { Formatters, initialsOf } from "@/src/core/utils/formatters";

describe("Formatters", () => {
  it("formats prices and mileage with thousands separators", () => {
    expect(Formatters.price(104600000)).toBe("$ 104.600.000");
    expect(Formatters.mileage(176000)).toBe("176.000 km");
  });

  it("describes how long ago something happened", () => {
    const now = new Date("2026-10-14T12:00:00Z");
    expect(Formatters.relative(new Date("2026-10-14T11:59:40Z"), now)).toBe("ahora");
    expect(Formatters.relative(new Date("2026-10-14T11:15:00Z"), now)).toBe("hace 45 min");
    expect(Formatters.relative(new Date("2026-10-14T09:00:00Z"), now)).toBe("hace 3 h");
    expect(Formatters.relative(new Date("2026-10-10T12:00:00Z"), now)).toBe("hace 4 d");
  });

  it("takes initials from the first and last name", () => {
    expect(initialsOf("Ana María García")).toBe("AG");
    expect(initialsOf("ana")).toBe("A");
    expect(initialsOf("  ")).toBe("?");
  });
});
