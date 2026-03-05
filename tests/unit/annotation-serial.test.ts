import { describe, expect, test } from "bun:test";
import { ensureAnnotationSerials, nextAnnotationSerial, type Annotation } from "../../src/client/annotation";

function buildAnnotation(partial: Partial<Annotation>): Annotation {
  return {
    id: partial.id || "ann",
    start: partial.start ?? 0,
    length: partial.length ?? 1,
    quote: partial.quote || "q",
    note: partial.note || "n",
    createdAt: partial.createdAt ?? 0,
    status: partial.status,
    confidence: partial.confidence,
    serial: partial.serial,
  };
}

describe("annotation serial", () => {
  test("assigns stable serials by createdAt order and keeps existing serial", () => {
    const annotations: Annotation[] = [
      buildAnnotation({ id: "a", createdAt: 200, serial: 5 }),
      buildAnnotation({ id: "b", createdAt: 100 }),
      buildAnnotation({ id: "c", createdAt: 300 }),
    ];

    const changed = ensureAnnotationSerials(annotations);

    expect(changed).toBe(true);
    expect(annotations.find((item) => item.id === "a")?.serial).toBe(5);
    expect(annotations.find((item) => item.id === "b")?.serial).toBe(1);
    expect(annotations.find((item) => item.id === "c")?.serial).toBe(6);
  });

  test("next serial always increases and never reuses deleted serials", () => {
    const annotations: Annotation[] = [
      buildAnnotation({ id: "a", serial: 1 }),
      buildAnnotation({ id: "b", serial: 4 }),
    ];

    expect(nextAnnotationSerial(annotations)).toBe(5);
  });
});
