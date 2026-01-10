/**
 * キャッシュユーティリティのテスト
 */

import { describe, expect, it, vi } from "vitest";

import {
  CacheRevalidation,
  CacheTags,
  createCachedFunction,
  createCachedFunctionWithId,
} from "./index";

// unstable_cacheをモック
vi.mock("next/cache", () => ({
  unstable_cache: vi.fn(
    (
      fn: () => Promise<unknown>,
      _keys: string[],
      _options?: { tags?: string[]; revalidate?: number }
    ) => {
      // モックではキャッシュせずに直接関数を返す
      return fn;
    }
  ),
}));

describe("CacheTags", () => {
  it("全てのキャッシュタグが定義されている", () => {
    expect(CacheTags.CUSTOMERS).toBe("customers");
    expect(CacheTags.SALES_PERSONS).toBe("sales-persons");
    expect(CacheTags.REPORTS).toBe("reports");
    expect(CacheTags.VISITS).toBe("visits");
    expect(CacheTags.COMMENTS).toBe("comments");
    expect(CacheTags.DASHBOARD).toBe("dashboard");
  });
});

describe("CacheRevalidation", () => {
  it("全てのキャッシュ再検証時間が定義されている", () => {
    expect(CacheRevalidation.SHORT).toBe(60);
    expect(CacheRevalidation.MEDIUM).toBe(300);
    expect(CacheRevalidation.LONG).toBe(1800);
    expect(CacheRevalidation.VERY_LONG).toBe(3600);
  });
});

describe("createCachedFunction", () => {
  it("関数をラップしてキャッシュされた関数を返す", async () => {
    const mockData = { id: 1, name: "Test" };
    const fetchFn = vi.fn().mockResolvedValue(mockData);

    const cachedFn = createCachedFunction(fetchFn, ["test-key"], {
      tags: [CacheTags.CUSTOMERS],
      revalidate: CacheRevalidation.LONG,
    });

    const result = await cachedFn();

    expect(result).toEqual(mockData);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("オプションなしでも動作する", async () => {
    const mockData = [1, 2, 3];
    const fetchFn = vi.fn().mockResolvedValue(mockData);

    const cachedFn = createCachedFunction(fetchFn, ["simple-key"]);

    const result = await cachedFn();

    expect(result).toEqual(mockData);
  });
});

describe("createCachedFunctionWithId", () => {
  it("IDを受け取るキャッシュ関数を作成する", async () => {
    const mockData = { id: 1, name: "Customer 1" };
    const fetchFn = vi.fn().mockResolvedValue(mockData);

    const cachedFn = createCachedFunctionWithId(fetchFn, "customer", {
      tags: [CacheTags.CUSTOMERS],
      revalidate: CacheRevalidation.LONG,
    });

    const result = await cachedFn(1);

    expect(result).toEqual(mockData);
    expect(fetchFn).toHaveBeenCalledWith(1);
  });

  it("文字列IDでも動作する", async () => {
    const mockData = { id: "abc", name: "Item" };
    const fetchFn = vi.fn().mockResolvedValue(mockData);

    const cachedFn = createCachedFunctionWithId(fetchFn, "item");

    const result = await cachedFn("abc");

    expect(result).toEqual(mockData);
    expect(fetchFn).toHaveBeenCalledWith("abc");
  });
});
