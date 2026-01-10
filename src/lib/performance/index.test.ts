/**
 * パフォーマンス計測ユーティリティのテスト
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  endMeasurement,
  measureApiHandler,
  PerformanceThresholds,
  startMeasurement,
  withPerformanceMeasurement,
} from "./index";

describe("PerformanceThresholds", () => {
  it("全ての閾値が定義されている", () => {
    expect(PerformanceThresholds.PAGE_LOAD).toBe(3000);
    expect(PerformanceThresholds.SEARCH).toBe(5000);
    expect(PerformanceThresholds.MUTATION).toBe(3000);
    expect(PerformanceThresholds.API_WARNING).toBe(1000);
    expect(PerformanceThresholds.API_CRITICAL).toBe(2000);
  });
});

describe("startMeasurement", () => {
  it("計測オブジェクトを作成する", () => {
    const metrics = startMeasurement("testOperation");

    expect(metrics.operation).toBe("testOperation");
    expect(metrics.startTime).toBeGreaterThan(0);
    expect(metrics.endTime).toBeUndefined();
    expect(metrics.duration).toBeUndefined();
  });

  it("メタデータを含めて計測オブジェクトを作成する", () => {
    const metadata = { userId: 1, action: "fetch" };
    const metrics = startMeasurement("testOperation", metadata);

    expect(metrics.operation).toBe("testOperation");
    expect(metrics.metadata).toEqual(metadata);
  });
});

describe("endMeasurement", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("計測を終了し、durationを計算する", () => {
    const metrics = startMeasurement("testOperation");
    const result = endMeasurement(metrics);

    expect(result.endTime).toBeGreaterThan(0);
    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(result.operation).toBe("testOperation");
  });

  it("計測時間が閾値を超えると警告ログを出力する", () => {
    // 閾値を非常に小さくしてテスト
    const metrics = startMeasurement("slowOperation");
    const result = endMeasurement(metrics, 0);

    expect(result.duration).toBeGreaterThanOrEqual(0);
    // 開発環境でのログ出力をテスト（閾値0なので警告レベル以上でログが出る）
    // logまたはwarnが呼ばれることを確認
    // eslint-disable-next-line no-console
    const infoCalled = vi.mocked(console.info).mock.calls.length > 0;
    const warnCalled = vi.mocked(console.warn).mock.calls.length > 0;
    expect(infoCalled || warnCalled).toBe(true);
  });
});

describe("withPerformanceMeasurement", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("非同期関数の実行時間を計測する", async () => {
    const mockResult = { data: "test" };
    const asyncFn = vi.fn().mockResolvedValue(mockResult);

    const wrappedFn = withPerformanceMeasurement(asyncFn, "testAsyncOperation");

    const result = await wrappedFn();

    expect(result).toEqual(mockResult);
    expect(asyncFn).toHaveBeenCalledTimes(1);
  });

  it("エラーが発生しても計測を完了する", async () => {
    const asyncFn = vi.fn().mockRejectedValue(new Error("Test error"));

    const wrappedFn = withPerformanceMeasurement(asyncFn, "errorOperation");

    await expect(wrappedFn()).rejects.toThrow("Test error");
    expect(asyncFn).toHaveBeenCalledTimes(1);
  });
});

describe("measureApiHandler", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("APIハンドラーの実行時間を計測する", async () => {
    const mockResponse = { success: true };
    const handler = vi.fn().mockResolvedValue(mockResponse);

    const wrappedHandler = measureApiHandler(handler, "GET /api/v1/test");

    const result = await wrappedHandler({ id: 1 });

    expect(result).toEqual(mockResponse);
    expect(handler).toHaveBeenCalledWith({ id: 1 });
  });

  it("複数の引数を受け取るハンドラーでも動作する", async () => {
    const mockResponse = { success: true };
    const handler = vi.fn().mockResolvedValue(mockResponse);

    const wrappedHandler = measureApiHandler(handler, "POST /api/v1/test");

    const result = await wrappedHandler("arg1", "arg2", { option: true });

    expect(result).toEqual(mockResponse);
    expect(handler).toHaveBeenCalledWith("arg1", "arg2", { option: true });
  });

  it("エラーが発生しても計測を完了する", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("Handler error"));

    const wrappedHandler = measureApiHandler(handler, "DELETE /api/v1/test");

    await expect(wrappedHandler()).rejects.toThrow("Handler error");
  });
});
