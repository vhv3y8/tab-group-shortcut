import { describe, it, expect } from "vitest"
import { mergeDeep, renameProperty } from "../helpers/storage"

describe("mergeDeep(defaults, current)", () => {
  /**
   * defaults = UPDATED DEFAULT value,
   * current = old version data in USER storage.
   * user storage data must be on top.
   */

  it("merges flat objects", () => {
    const res = mergeDeep({ a: 1 }, { b: 2 })
    expect(res).toEqual({ a: 1, b: 2 })
  })

  it("overwrites primitive values", () => {
    const res = mergeDeep({ a: 1 }, { a: 2 })
    expect(res).toEqual({ a: 2 })
  })

  it("deep merges nested objects", () => {
    const res = mergeDeep({ a: { b: 1 } }, { a: { c: 2 } })
    expect(res).toEqual({ a: { b: 1, c: 2 } })
  })

  it("overwrites nested values", () => {
    const res = mergeDeep({ a: { b: 1 } }, { a: { b: 2 } })
    expect(res).toEqual({ a: { b: 2 } })
  })

  it("handles arrays by replacement", () => {
    const res = mergeDeep({ a: [1] }, { a: [2, 3] })
    expect(res).toEqual({ a: [2, 3] })
  })
})

describe("renameProperty(obj, oldPath, newPath, transform)", () => {
  it("renames a nested property with transform", () => {
    const obj = {
      settings: { turnOffForceCommand: false },
    }
    renameProperty(
      obj,
      "settings.turnOffForceCommand",
      "settings.enableForceCommand",
      (v) => !v,
    )
    expect(obj).toEqual({
      settings: { enableForceCommand: true },
    })
  })

  it("does nothing if old path missing", () => {
    const obj = {}
    renameProperty(obj, "settings.oldKey", "settings.newKey")
    expect(obj).toEqual({})
  })

  it("moves property without transform", () => {
    const obj = {
      settings: { oldKey: "abc" },
    }
    renameProperty(obj, "settings.oldKey", "settings.newKey")
    expect(obj).toEqual({
      settings: { newKey: "abc" },
    })
  })

  it("creates nested structure if new path missing", () => {
    const obj = {
      settings: { oldKey: 123 },
    }
    renameProperty(obj, "settings.oldKey", "user.config.newKey", (v) => v + 1)
    expect(obj).toEqual({
      settings: {},
      user: { config: { newKey: 124 } },
    })
  })
})
