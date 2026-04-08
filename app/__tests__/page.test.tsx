import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import Home from "@/app/page";
import rankingData from "../../public/data/ranking.json";

const originalNodeEnv = process.env.NODE_ENV;
const originalFetch = global.fetch;

const mockRankingData = rankingData;

const renderHome = () => render(<Home />);

const waitForFemaleSilhouette = async () => {
  expect(await screen.findByText("深田恭子")).toBeInTheDocument();
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
  describe("基本表示", () => {
    test("ローディング中の表示があること", () => {
      renderHome();
      expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    });

    test("fetch失敗時にエラーハンドリングされること", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.reject(new Error("Network error"))
      );

      renderHome();

      expect(
        await screen.findByText("データの読み込みに失敗しました")
      ).toBeInTheDocument();
    });

    test("ページタイトルが表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      expect(
        screen.getByText("Celebrity Body Balance Ranking")
      ).toBeInTheDocument();
    });

    test("サブタイトルが表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      expect(
        screen.getByText("有名人の体型バランスを偏差値でランキング")
      ).toBeInTheDocument();
    });

    test("初期表示で女性のシルエットカテゴリが表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      expect(
        screen.getByRole("heading", { level: 2, name: "シルエットバランス偏差値" })
      ).toBeInTheDocument();
    });

    test("ランキング項目が初期表示で正しく表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      ["深田恭子", "石原さとみ", "佐々木希", "新垣結衣", "綾瀬はるか"].forEach(
        (name) => {
          expect(screen.getByText(name)).toBeInTheDocument();
        }
      );
    });

    test("初期表示の女性スコアが表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      ["73", "71", "69", "67", "65"].forEach((score) => {
        expect(screen.getByText(score)).toBeInTheDocument();
      });
    });

    test("画像が5枚表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      expect(screen.getAllByRole("img")).toHaveLength(5);
    });

    test("画像のsrc属性がローカル画像パスであること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      const images = screen.getAllByRole("img");
      expect(images[0]).toHaveAttribute("src", "/images/fukada_kyoko.jpg");
      expect(images[1]).toHaveAttribute("src", "/images/ishihara_satomi.jpg");
    });

    test("画像にalt属性として名前が設定されていること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      const image = screen.getByAltText("深田恭子");
      expect(image).toBeInTheDocument();
      expect(image.tagName).toBe("IMG");
    });

    test("1位のメダル色が金色であること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      expect(screen.getByText("1")).toHaveClass("bg-yellow-400");
    });

    test("2位のメダル色が銀色であること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      expect(screen.getByText("2")).toHaveClass("bg-gray-300");
    });

    test("3位のメダル色が銅色であること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      expect(screen.getByText("3")).toHaveClass("bg-amber-600");
    });

    test("女性の上半身タブに切り替えられること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickCategoryTab("上半身バランス偏差値");

      expect(await screen.findByText("長澤まさみ")).toBeInTheDocument();
      expect(screen.getByText("北川景子")).toBeInTheDocument();
    });

    test("女性のプロポーションタブに切り替えられること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickCategoryTab("プロポーション調和スコア");

      expect(await screen.findByText("菜々緒")).toBeInTheDocument();
      expect(screen.getByText("藤田ニコル")).toBeInTheDocument();
    });

    test("カテゴリタブが3つ表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      expect(
        screen.getByRole("button", { name: "シルエットバランス偏差値" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "上半身バランス偏差値" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "プロポーション調和スコア" })
      ).toBeInTheDocument();
    });

    test("ボタンが合計5つ表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      expect(screen.getAllByRole("button")).toHaveLength(5);
    });

    test("カテゴリ切り替え後に見出しが更新されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickCategoryTab("上半身バランス偏差値");

      expect(
        await screen.findByRole("heading", {
          level: 2,
          name: "上半身バランス偏差値",
        })
      ).toBeInTheDocument();
    });

    test("productionではfetchと画像にbasePathが付与されること", async () => {
      process.env.NODE_ENV = "production";

      renderHome();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/body-type-analyzer/data/ranking.json"
        );
      });

      const image = await screen.findByAltText("深田恭子");
      expect(image).toHaveAttribute(
        "src",
        "/body-type-analyzer/images/fukada_kyoko.jpg"
      );
    });
  });

  describe("カップ数表示", () => {
    test("女性ランキングでFカップが表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      expect(screen.getByText("Fカップ")).toBeInTheDocument();
    });

    test("女性の全員にカップ数バッジが表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      expect(screen.getAllByText(/カップ$/)).toHaveLength(5);
    });

    test("男性ランキングに切り替えるとカップ数が表示されないこと", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickGenderTab("男性");

      expect(await screen.findByText("竹野内豊")).toBeInTheDocument();
      expect(screen.queryByText(/カップ$/)).not.toBeInTheDocument();
    });

    test("カップ数が正しい値で表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      expect(screen.getByText("Eカップ")).toBeInTheDocument();
      expect(screen.getByText("Dカップ")).toBeInTheDocument();
      expect(screen.getByText("Cカップ")).toBeInTheDocument();
      expect(screen.getByText("Bカップ")).toBeInTheDocument();
      expect(screen.getByText("Fカップ")).toBeInTheDocument();
    });

    test("カップ数バッジにpink系のスタイルが適用されていること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      expect(screen.getByText("Eカップ")).toHaveClass(
        "bg-pink-100",
        "text-pink-700"
      );
    });

    test("上半身バランスタブでもカップ数が表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickCategoryTab("上半身バランス偏差値");

      const row = screen.getByText("長澤まさみ").parentElement;
      expect(row).not.toBeNull();
      expect(within(row as HTMLElement).getByText("Fカップ")).toBeInTheDocument();
    });

    test("非公表のカップ数バッジは表示されないこと", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickCategoryTab("上半身バランス偏差値");

      const row = screen.getByText("北川景子").parentElement;
      expect(row).not.toBeNull();
      expect(
        within(row as HTMLElement).queryByText(/カップ$/)
      ).not.toBeInTheDocument();
    });

    test("プロポーションタブでもカップ数が表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickCategoryTab("プロポーション調和スコア");

      const row = screen.getByText("菜々緒").parentElement;
      expect(row).not.toBeNull();
      expect(within(row as HTMLElement).getByText("Bカップ")).toBeInTheDocument();
    });

    test("男性から女性に戻すとカップ数が再表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickGenderTab("男性");
      expect(await screen.findByText("竹野内豊")).toBeInTheDocument();

      clickGenderTab("女性");

      expect(await screen.findByText("深田恭子")).toBeInTheDocument();
      expect(screen.getByText("Eカップ")).toBeInTheDocument();
    });
  });

  describe("男女切り替え", () => {
    test("初期表示が女性ランキングであること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      expect(screen.getByText("深田恭子")).toBeInTheDocument();
      expect(screen.queryByText("竹野内豊")).not.toBeInTheDocument();
    });

    test("男性タブをクリックすると男性の名前が表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickGenderTab("男性");

      expect(await screen.findByText("竹野内豊")).toBeInTheDocument();
    });

    test("男性タブをクリックすると女性の名前が消えること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickGenderTab("男性");
      await screen.findByText("竹野内豊");

      expect(screen.queryByText("深田恭子")).not.toBeInTheDocument();
    });

    test("男女切り替え時にカテゴリタブが最初に戻ること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickCategoryTab("上半身バランス偏差値");
      expect(await screen.findByText("長澤まさみ")).toBeInTheDocument();

      clickGenderTab("男性");

      expect(await screen.findByText("竹野内豊")).toBeInTheDocument();
      expect(screen.queryByText("鈴木亮平")).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: "シルエットバランス偏差値" })
      ).toBeInTheDocument();
    });

    test("男性から女性に戻すと女性データに戻ること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickGenderTab("男性");
      expect(await screen.findByText("竹野内豊")).toBeInTheDocument();

      clickGenderTab("女性");

      expect(await screen.findByText("深田恭子")).toBeInTheDocument();
      expect(screen.queryByText("竹野内豊")).not.toBeInTheDocument();
    });

    test("男女切り替えタブが2つ存在すること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      expect(screen.getByRole("button", { name: "女性" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "男性" })).toBeInTheDocument();
    });

    test("初期表示では女性タブがアクティブであること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      expect(screen.getByRole("button", { name: "女性" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: "男性" })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });

    test("男性タブを押すとアクティブ状態が切り替わること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickGenderTab("男性");
      await screen.findByText("竹野内豊");

      expect(screen.getByRole("button", { name: "男性" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByRole("button", { name: "女性" })).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });

    test("女性に戻すと女性タブが再度アクティブになること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickGenderTab("男性");
      await screen.findByText("竹野内豊");

      clickGenderTab("女性");
      await screen.findByText("深田恭子");

      expect(screen.getByRole("button", { name: "女性" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });
  });

  describe("男性ランキング表示", () => {
    test("男性ランキングのスコアが表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickGenderTab("男性");
      expect(await screen.findByText("竹野内豊")).toBeInTheDocument();

      ["74", "72", "70", "68", "66"].forEach((score) => {
        expect(screen.getByText(score)).toBeInTheDocument();
      });
    });

    test("男性ランキングの画像が表示されること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickGenderTab("男性");
      expect(await screen.findByText("竹野内豊")).toBeInTheDocument();

      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(5);
      expect(images[0]).toHaveAttribute("src", "/images/takenouchi_yutaka.jpg");
    });

    test("男性タブから上半身カテゴリへ切り替えられること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickGenderTab("男性");
      expect(await screen.findByText("竹野内豊")).toBeInTheDocument();

      clickCategoryTab("上半身バランス偏差値");

      expect(await screen.findByText("鈴木亮平")).toBeInTheDocument();
      expect(screen.getByText("西島秀俊")).toBeInTheDocument();
    });

    test("男性タブからプロポーションカテゴリへ切り替えられること", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickGenderTab("男性");
      expect(await screen.findByText("竹野内豊")).toBeInTheDocument();

      clickCategoryTab("プロポーション調和スコア");

      expect(await screen.findByText("岩田剛典")).toBeInTheDocument();
      expect(screen.getByText("横浜流星")).toBeInTheDocument();
    });

    test("男性カテゴリ切り替えでもカップ表示が出ないこと", async () => {
      renderHome();
      await waitForFemaleSilhouette();

      clickGenderTab("男性");
      expect(await screen.findByText("竹野内豊")).toBeInTheDocument();

      clickCategoryTab("上半身バランス偏差値");
      expect(await screen.findByText("鈴木亮平")).toBeInTheDocument();
      expect(screen.queryByText(/カップ$/)).not.toBeInTheDocument();
    });
  });
});
