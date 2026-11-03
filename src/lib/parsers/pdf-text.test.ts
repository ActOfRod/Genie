import { describe, expect, it } from "vitest";
import { readTextChunks } from "./pdf-text";

describe("readTextChunks", () => {
  it("reads text when the stream has no async iterator, as on Safari", async () => {
    const proto = ReadableStream.prototype as ReadableStream & {
      [Symbol.asyncIterator]?: () => AsyncIterator<unknown>;
    };
    const original = proto[Symbol.asyncIterator];
    Object.defineProperty(proto, Symbol.asyncIterator, { value: undefined, configurable: true });

    try {
      expect(typeof proto[Symbol.asyncIterator]).not.toBe("function");

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue({
            items: [{ str: "08/22/26", transform: [1, 0, 0, 1, 10, 700], width: 40, height: 9, dir: "ltr", fontName: "g", hasEOL: false }],
          });
          controller.enqueue({
            items: [{ str: "MEIJER", transform: [1, 0, 0, 1, 80, 693], width: 40, height: 9, dir: "ltr", fontName: "g", hasEOL: false }],
          });
          controller.close();
        },
      });

      const items = await readTextChunks(stream);
      expect(items.map((item) => item.str)).toEqual(["08/22/26", "MEIJER"]);
    } finally {
      Object.defineProperty(proto, Symbol.asyncIterator, { value: original, configurable: true });
    }
  });
});
