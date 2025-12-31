/**
 * ページネーションヘルパーのテスト
 */

import {
  calculateOffset,
  calculatePagination,
  DEFAULT_PAGINATION,
  getPaginationParams,
  normalizePaginationParams,
} from "./pagination";

describe("calculatePagination", () => {
  it("基本的なページネーション情報を計算する", () => {
    const result = calculatePagination({
      page: 1,
      perPage: 20,
      total: 100,
    });

    expect(result).toEqual({
      total: 100,
      per_page: 20,
      current_page: 1,
      last_page: 5,
      from: 1,
      to: 20,
    });
  });

  it("2ページ目の情報を正しく計算する", () => {
    const result = calculatePagination({
      page: 2,
      perPage: 20,
      total: 100,
    });

    expect(result).toEqual({
      total: 100,
      per_page: 20,
      current_page: 2,
      last_page: 5,
      from: 21,
      to: 40,
    });
  });

  it("最後のページの情報を正しく計算する", () => {
    const result = calculatePagination({
      page: 5,
      perPage: 20,
      total: 95,
    });

    expect(result).toEqual({
      total: 95,
      per_page: 20,
      current_page: 5,
      last_page: 5,
      from: 81,
      to: 95,
    });
  });

  it("総数が0の場合を正しく処理する", () => {
    const result = calculatePagination({
      page: 1,
      perPage: 20,
      total: 0,
    });

    expect(result).toEqual({
      total: 0,
      per_page: 20,
      current_page: 1,
      last_page: 1,
      from: 0,
      to: 0,
    });
  });

  it("ページ番号が最後のページを超える場合は調整される", () => {
    const result = calculatePagination({
      page: 10,
      perPage: 20,
      total: 50,
    });

    expect(result.current_page).toBe(3);
    expect(result.last_page).toBe(3);
  });

  it("負のページ番号は1に調整される", () => {
    const result = calculatePagination({
      page: -5,
      perPage: 20,
      total: 100,
    });

    expect(result.current_page).toBe(1);
  });

  it("負のperPageは1に調整される", () => {
    const result = calculatePagination({
      page: 1,
      perPage: -10,
      total: 100,
    });

    expect(result.per_page).toBe(1);
    expect(result.last_page).toBe(100);
  });

  it("負のtotalは0に調整される", () => {
    const result = calculatePagination({
      page: 1,
      perPage: 20,
      total: -50,
    });

    expect(result.total).toBe(0);
  });

  it("小数のページ番号は切り捨てられる", () => {
    const result = calculatePagination({
      page: 2.7,
      perPage: 20,
      total: 100,
    });

    expect(result.current_page).toBe(2);
  });

  it("小数のperPageは切り捨てられる", () => {
    const result = calculatePagination({
      page: 1,
      perPage: 15.9,
      total: 100,
    });

    expect(result.per_page).toBe(15);
  });

  it("1件のみのデータを正しく処理する", () => {
    const result = calculatePagination({
      page: 1,
      perPage: 20,
      total: 1,
    });

    expect(result).toEqual({
      total: 1,
      per_page: 20,
      current_page: 1,
      last_page: 1,
      from: 1,
      to: 1,
    });
  });

  it("perPageと同じ総数を正しく処理する", () => {
    const result = calculatePagination({
      page: 1,
      perPage: 20,
      total: 20,
    });

    expect(result).toEqual({
      total: 20,
      per_page: 20,
      current_page: 1,
      last_page: 1,
      from: 1,
      to: 20,
    });
  });

  it("perPageより1件多い総数を正しく処理する", () => {
    const result = calculatePagination({
      page: 2,
      perPage: 20,
      total: 21,
    });

    expect(result).toEqual({
      total: 21,
      per_page: 20,
      current_page: 2,
      last_page: 2,
      from: 21,
      to: 21,
    });
  });
});

describe("calculateOffset", () => {
  it("基本的なオフセットを計算する", () => {
    const result = calculateOffset(1, 20);

    expect(result).toEqual({
      skip: 0,
      take: 20,
    });
  });

  it("2ページ目のオフセットを計算する", () => {
    const result = calculateOffset(2, 20);

    expect(result).toEqual({
      skip: 20,
      take: 20,
    });
  });

  it("3ページ目のオフセットを計算する", () => {
    const result = calculateOffset(3, 10);

    expect(result).toEqual({
      skip: 20,
      take: 10,
    });
  });

  it("負のページ番号は1に調整される", () => {
    const result = calculateOffset(-1, 20);

    expect(result).toEqual({
      skip: 0,
      take: 20,
    });
  });

  it("0のページ番号は1に調整される", () => {
    const result = calculateOffset(0, 20);

    expect(result).toEqual({
      skip: 0,
      take: 20,
    });
  });

  it("負のperPageは1に調整される", () => {
    const result = calculateOffset(1, -10);

    expect(result).toEqual({
      skip: 0,
      take: 1,
    });
  });

  it("小数は切り捨てられる", () => {
    const result = calculateOffset(2.8, 15.5);

    expect(result).toEqual({
      skip: 15,
      take: 15,
    });
  });
});

describe("getPaginationParams", () => {
  it("calculateOffsetと同じ結果を返す", () => {
    const result = getPaginationParams({ page: 3, perPage: 25 });

    expect(result).toEqual({
      skip: 50,
      take: 25,
    });
  });
});

describe("DEFAULT_PAGINATION", () => {
  it("デフォルト値が正しく設定されている", () => {
    expect(DEFAULT_PAGINATION.page).toBe(1);
    expect(DEFAULT_PAGINATION.perPage).toBe(20);
    expect(DEFAULT_PAGINATION.maxPerPage).toBe(100);
  });
});

describe("normalizePaginationParams", () => {
  it("有効な数値をそのまま返す", () => {
    const result = normalizePaginationParams(5, 50);

    expect(result).toEqual({
      page: 5,
      perPage: 50,
    });
  });

  it("文字列を数値に変換する", () => {
    const result = normalizePaginationParams("3", "30");

    expect(result).toEqual({
      page: 3,
      perPage: 30,
    });
  });

  it("undefinedの場合はデフォルト値を使用する", () => {
    const result = normalizePaginationParams(undefined, undefined);

    expect(result).toEqual({
      page: DEFAULT_PAGINATION.page,
      perPage: DEFAULT_PAGINATION.perPage,
    });
  });

  it("nullの場合はデフォルト値を使用する", () => {
    const result = normalizePaginationParams(null, null);

    expect(result).toEqual({
      page: DEFAULT_PAGINATION.page,
      perPage: DEFAULT_PAGINATION.perPage,
    });
  });

  it("1未満のページ番号はデフォルト値を使用する", () => {
    const result = normalizePaginationParams(0, 20);

    expect(result.page).toBe(DEFAULT_PAGINATION.page);
  });

  it("負のページ番号はデフォルト値を使用する", () => {
    const result = normalizePaginationParams(-1, 20);

    expect(result.page).toBe(DEFAULT_PAGINATION.page);
  });

  it("1未満のperPageはデフォルト値を使用する", () => {
    const result = normalizePaginationParams(1, 0);

    expect(result.perPage).toBe(DEFAULT_PAGINATION.perPage);
  });

  it("maxPerPageを超えるperPageは制限される", () => {
    const result = normalizePaginationParams(1, 200);

    expect(result.perPage).toBe(DEFAULT_PAGINATION.maxPerPage);
  });

  it("maxPerPageちょうどの値は許可される", () => {
    const result = normalizePaginationParams(1, 100);

    expect(result.perPage).toBe(100);
  });

  it("無効な文字列はデフォルト値を使用する", () => {
    const result = normalizePaginationParams("abc", "xyz");

    expect(result).toEqual({
      page: DEFAULT_PAGINATION.page,
      perPage: DEFAULT_PAGINATION.perPage,
    });
  });

  it("小数は切り捨てられる", () => {
    const result = normalizePaginationParams(2.9, 25.7);

    expect(result).toEqual({
      page: 2,
      perPage: 25,
    });
  });

  it("pageのみ指定した場合perPageはデフォルト", () => {
    const result = normalizePaginationParams(5);

    expect(result).toEqual({
      page: 5,
      perPage: DEFAULT_PAGINATION.perPage,
    });
  });

  it("perPageのみ指定した場合pageはデフォルト", () => {
    const result = normalizePaginationParams(undefined, 50);

    expect(result).toEqual({
      page: DEFAULT_PAGINATION.page,
      perPage: 50,
    });
  });
});
