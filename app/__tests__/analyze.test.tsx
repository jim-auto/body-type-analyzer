import { act, fireEvent, render, screen, within } from "@testing-library/react";

import AnalyzePage from "@/app/analyze/page";
import { DIAGNOSIS_MODEL_METRICS } from "@/lib/diagnosis-model";
import {
  AI_LOADING_MESSAGES,
  DIAGNOSIS_DISCLAIMERS,
  DIAGNOSIS_MODEL_SUMMARY,
  DIAGNOSIS_VALIDATION_LABEL,
  buildShareText,
  buildXShareUrl,
  diagnose,
  extractDiagnosisFeatures,
  type DiagnosisFeatures,
  type DiagnosisResult,
} from "@/lib/image-analyzer";

jest.mock("@/lib/image-analyzer", () => {
  const actual = jest.requireActual("@/lib/image-analyzer");

  return {
    ...actual,
    extractDiagnosisFeatures: jest.fn(),
    diagnose: jest.fn(),
    buildShareText: jest.fn(),
    buildXShareUrl: jest.fn(),
  };
});

const mockResult: DiagnosisResult = {
  estimatedHeight: 163,
  estimatedCup: "D",
  heightDeviation: 59,
  cupDeviation: 54,
  silhouetteType: "X",
  confidence: 28,
  similarCelebrity: "石原さとみ",
  similarCelebrities: [
    {
      name: "石原さとみ",
      image: "/images/ishihara_satomi.jpg",
      similarity: 94,
      actualHeight: 157,
      cup: "D",
    },
    {
      name: "深田恭子",
      image: "/images/fukada_kyoko.jpg",
      similarity: 89,
      actualHeight: 163,
      cup: "E",
    },
    {
      name: "今田美桜",
      image: "/images/imada_mio.jpg",
      similarity: 83,
      actualHeight: 157,
      cup: "F",
    },
  ],
};

const mockFeatures: DiagnosisFeatures = {
  heightPrimary: [0.1, 0.2, 0.3],
  heightBalanced: [0.1, 0.2, 0.3],
  heightWide: [0.1, 0.2, 0.3],
  cupPrimary: [0.4, 0.5, 0.6],
  cupSecondary: [0.4, 0.5, 0.6],
  similarity: [0.7, 0.8, 0.9],
};

const mockedExtractDiagnosisFeatures = jest.mocked(extractDiagnosisFeatures);
const mockedDiagnose = jest.mocked(diagnose);
const mockedBuildShareText = jest.mocked(buildShareText);
const mockedBuildXShareUrl = jest.mocked(buildXShareUrl);
const mockClipboardWriteText = jest.fn();
const mockCreateObjectUrl = jest.fn(() => "blob:preview-url");
const mockRevokeObjectUrl = jest.fn();

const renderPage = () => render(<AnalyzePage />);
const formatRate = (rate: number) => `${(rate * 100).toFixed(1)}%`;
const formatErrorBound = (value: number) =>
  Number.isInteger(value) ? `${value}` : value.toFixed(1);
const formatCoverageText = (rate: number, maxError: number, unit: string) =>
  `${Math.round(rate * 10)}割が±${formatErrorBound(maxError)}${unit}以内`;

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const uploadImage = async () => {
  const input = screen.getByLabelText("診断する画像を選択");
  const file = new File(["image-content"], "portrait.png", {
    type: "image/png",
  });

  await act(async () => {
    fireEvent.change(input, { target: { files: [file] } });
  });

  await flushPromises();

  return file;
};

const finishAnalysis = async () => {
  await act(async () => {
    jest.advanceTimersByTime(AI_LOADING_MESSAGES.length * 1500 + 10);
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  mockedExtractDiagnosisFeatures.mockResolvedValue(mockFeatures);
  mockedDiagnose.mockReturnValue(mockResult);
  mockedBuildShareText.mockReturnValue("share-text");
  mockedBuildXShareUrl.mockReturnValue(
    "https://x.com/intent/tweet?text=share-text"
  );
  mockClipboardWriteText.mockResolvedValue(undefined);
  mockCreateObjectUrl.mockReturnValue("blob:preview-url");
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: mockCreateObjectUrl,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: mockRevokeObjectUrl,
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: mockClipboardWriteText },
  });
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe("AnalyzePage", () => {
  test("モデル性能が公開表示される", () => {
    renderPage();
    const performanceSection = screen.getByRole("region", { name: "モデル性能" });

    expect(performanceSection).toHaveAttribute("id", "model-performance");
    expect(
      screen.getByRole("heading", { level: 2, name: "モデル性能" })
    ).toBeInTheDocument();
    expect(
      within(performanceSection).getByText((_, element) =>
        element?.tagName === "P" &&
        (element.textContent?.includes(
          `公開プロフィール画像 ${DIAGNOSIS_MODEL_METRICS.trainingCount} 枚`
        ) ?? false)
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        formatRate(DIAGNOSIS_MODEL_METRICS.height.coverage[0]?.rate ?? 0.7)
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatRate(DIAGNOSIS_MODEL_METRICS.cup.within1Rate))
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatRate(DIAGNOSIS_MODEL_METRICS.cup.exactRate))
    ).toBeInTheDocument();
    expect(
      screen.getByText(`検証 ${DIAGNOSIS_MODEL_METRICS.height.trainingCount}件`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`検証 ${DIAGNOSIS_MODEL_METRICS.cup.trainingCount}件`)
    ).toBeInTheDocument();
    expect(screen.queryByText("身長は8割が±6cm以内")).not.toBeInTheDocument();
    expect(
      within(performanceSection).getByText((_, element) =>
        element?.tagName === "P" &&
        (element.textContent?.includes(
          "数cm単位・1カップ単位でどこまで収まるかを中心に公開しています。"
        ) ?? false)
      )
    ).toBeInTheDocument();
  });

  test("AI診断ページタイトルが表示される", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "AI診断" })
    ).toBeInTheDocument();
  });

  test("アップロードエリアが表示される", () => {
    renderPage();

    expect(screen.getByTestId("upload-area")).toBeInTheDocument();
  });

  test("注意文が表示される", () => {
    renderPage();

    expect(
      screen.getByText("⚠ 本人の画像のみ使用してください")
    ).toBeInTheDocument();
    expect(screen.getByText(DIAGNOSIS_MODEL_SUMMARY)).toBeInTheDocument();
    expect(screen.getByText(DIAGNOSIS_VALIDATION_LABEL)).toBeInTheDocument();
  });

  test("ファイル入力は image/* を受け付ける", () => {
    renderPage();

    expect(screen.getByLabelText("診断する画像を選択")).toHaveAttribute(
      "accept",
      "image/*"
    );
  });

  test("画像を選択するとプレビューとファイル名が表示される", async () => {
    renderPage();

    await uploadImage();

    expect(mockedExtractDiagnosisFeatures).toHaveBeenCalledTimes(1);
    expect(mockCreateObjectUrl).toHaveBeenCalledTimes(1);
    expect(
      screen.getByAltText("アップロード画像のプレビュー")
    ).toHaveAttribute("src", "blob:preview-url");
    expect(screen.getByText("portrait.png")).toBeInTheDocument();
  });

  test("ドラッグ&ドロップでも画像アップロードを開始できる", async () => {
    renderPage();
    const file = new File(["drop-image"], "drop.png", { type: "image/png" });

    await act(async () => {
      fireEvent.drop(screen.getByTestId("upload-area"), {
        dataTransfer: { files: [file] },
      });
    });

    await flushPromises();

    expect(mockedExtractDiagnosisFeatures).toHaveBeenCalledWith(file);
  });

  test("画像アップロード直後にローディング演出が表示される", async () => {
    renderPage();

    await uploadImage();

    expect(screen.getByText(AI_LOADING_MESSAGES[0])).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", { name: "AI診断の進捗" })
    ).toHaveTextContent("進捗 8%");
  });

  test("1.5 秒ごとにローディングメッセージが進む", async () => {
    renderPage();

    await uploadImage();

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByText(AI_LOADING_MESSAGES[1])).toBeInTheDocument();
  });

  test("ローディング完了後に診断結果カードが表示される", async () => {
    renderPage();

    await uploadImage();
    await finishAnalysis();

    expect(screen.getByText("診断結果")).toBeInTheDocument();
    expect(screen.getByText("163")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("偏差値 59")).toBeInTheDocument();
    expect(screen.getByText("偏差値 54")).toBeInTheDocument();
    expect(screen.getByText("AI信頼度")).toBeInTheDocument();
  });

  test("似ている有名人が 3 件表示される", async () => {
    renderPage();

    await uploadImage();
    await finishAnalysis();

    expect(screen.getByText("あなたに近い有名人")).toBeInTheDocument();
    expect(screen.getByText("石原さとみ")).toBeInTheDocument();
    expect(screen.getByText("深田恭子")).toBeInTheDocument();
    expect(screen.getByText("今田美桜")).toBeInTheDocument();
  });

  test("シェア UI が表示され、シェア文と X リンクが使われる", async () => {
    renderPage();

    await uploadImage();
    await finishAnalysis();

    expect(screen.getByText("結果テキストをコピー")).toBeInTheDocument();
    expect(screen.getByLabelText("シェア文")).toHaveValue("share-text");
    expect(screen.getByRole("link", { name: "Xでシェア" })).toHaveAttribute(
      "href",
      "https://x.com/intent/tweet?text=share-text"
    );
  });

  test("コピー操作で clipboard にシェア文を書き込む", async () => {
    renderPage();

    await uploadImage();
    await finishAnalysis();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "結果テキストをコピー" }));
    });

    expect(mockClipboardWriteText).toHaveBeenCalledWith("share-text");
    expect(
      screen.getByRole("status", { name: "" })
    ).toHaveTextContent("結果テキストをコピーしました。");
  });

  test("画像以外を選ぶとエラーメッセージを表示する", async () => {
    renderPage();
    const input = screen.getByLabelText("診断する画像を選択");
    const file = new File(["plain-text"], "note.txt", { type: "text/plain" });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    expect(screen.getByText("画像ファイルを選択してください。")).toBeInTheDocument();
    expect(mockedExtractDiagnosisFeatures).not.toHaveBeenCalled();
  });

  test("extractDiagnosisFeatures が失敗したときは読み込み失敗を表示する", async () => {
    mockedExtractDiagnosisFeatures.mockRejectedValueOnce(new Error("broken image"));
    renderPage();

    await uploadImage();

    expect(
      screen.getByText("画像の読み込みに失敗しました。別の画像でお試しください。")
    ).toBeInTheDocument();
  });

  test("結果表示時に免責表示が並ぶ", async () => {
    renderPage();

    await uploadImage();
    await finishAnalysis();

    expect(screen.getByText("免責表示")).toBeInTheDocument();
    DIAGNOSIS_DISCLAIMERS.forEach((disclaimer) => {
      expect(screen.getByText(disclaimer)).toBeInTheDocument();
    });
  });
});
