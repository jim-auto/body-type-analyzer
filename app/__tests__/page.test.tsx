import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import Home from "@/app/page";
import rankingData from "../../public/data/ranking.json";

const originalNodeEnv = process.env.NODE_ENV;
const originalFetch = global.fetch;

const mockRankingData = rankingData;

const renderHome = () => render(<Home />);

const waitForFemaleSilhouette = async () => {
  expect(await screen.findByText("菜々緒")).toBeInTheDocument();
};

const clickGenderTab = (label: "女性" | "男性") => {
  fireEvent.click(screen.getByRole("button", { name: label }));
};

const clickCategoryTab = (label: string) => {
  fireEvent.click(screen.getByRole("button", { name: label }));
};

beforeEach(() => {
  process.env.NODE_ENV = "test";
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(mockRankingData),
    })
  ) as jest.Mock;
});

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe("Home (Ranking Page)", () => {
  test("ローディング中の表示がある", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {})
    );

    renderHome();
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  test("fetch失敗時にエラーメッセージが表示される", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("Network error"))
    );

    renderHome();

    expect(
      await screen.findByText("データの読み込みに失敗しました")
    ).toBeInTheDocument();
  });

  test("ページタイトルとサブタイトルが表示される", async () => {
    renderHome();
    await waitForFemaleSilhouette();

    expect(
      screen.getByText("Celebrity Body Balance Ranking")
    ).toBeInTheDocument();
    expect(
      screen.getByText("有名人の体型バランスを偏差値でランキング")
    ).toBeInTheDocument();
  });

  test("初期表示で女性のシルエットカテゴリが表示される", async () => {
    renderHome();
    await waitForFemaleSilhouette();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "シルエットバランス偏差値",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("新垣結衣")).toBeInTheDocument();
    expect(screen.getByText("長澤まさみ")).toBeInTheDocument();
  });

  test("女性ランキングでカップ数と身長が表示される", async () => {
    renderHome();
    await waitForFemaleSilhouette();

    expect(screen.getByText("Bカップ")).toBeInTheDocument();
    expect(screen.getByText("172cm")).toBeInTheDocument();
    expect(screen.getByText("偏差値76")).toBeInTheDocument();
  });

  test("女性ランキングでAI推定カップ表示がされる", async () => {
    renderHome();
    await waitForFemaleSilhouette();

    expect(screen.getAllByText(/^AI推定:/)).toHaveLength(20);
    expect(screen.getAllByText(/AI推定: Bカップ/).length).toBeGreaterThan(0);
  });

  test("女性の上半身タブに切り替えると身長付きで表示される", async () => {
    renderHome();
    await waitForFemaleSilhouette();

    clickCategoryTab("上半身バランス偏差値");

    expect(await screen.findByText("原幹恵")).toBeInTheDocument();
    expect(screen.getAllByText("163cm").length).toBeGreaterThan(0);
    expect(screen.getAllByText("偏差値72").length).toBeGreaterThan(0);
  });

  test("男性に切り替えると男性ランキングの身長が表示される", async () => {
    renderHome();
    await waitForFemaleSilhouette();

    clickGenderTab("男性");

    expect(await screen.findByText("鈴木亮平")).toBeInTheDocument();
    expect(screen.getByText("186cm")).toBeInTheDocument();
    expect(screen.getByText("偏差値76")).toBeInTheDocument();
  });

  test("男性ランキングではカップ数が表示されないがAI推定身長は表示される", async () => {
    renderHome();
    await waitForFemaleSilhouette();

    clickGenderTab("男性");

    expect(await screen.findByText("鈴木亮平")).toBeInTheDocument();
    expect(screen.queryByText(/カップ$/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/^AI推定: .*cm/)).toHaveLength(20);
  });

  test("男女切り替え時にカテゴリタブが最初に戻る", async () => {
    renderHome();
    await waitForFemaleSilhouette();

    clickCategoryTab("上半身バランス偏差値");
    expect(await screen.findByText("原幹恵")).toBeInTheDocument();

    clickGenderTab("男性");

    expect(await screen.findByText("鈴木亮平")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "シルエットバランス偏差値",
      })
    ).toBeInTheDocument();
  });

  test("productionではfetchと画像にbasePathが付与される", async () => {
    process.env.NODE_ENV = "production";

    renderHome();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/body-type-analyzer/data/ranking.json"
      );
    });

    const image = await screen.findByAltText("菜々緒");
    expect(image).toHaveAttribute("src", "/body-type-analyzer/images/nanao.jpg");
  });
});
