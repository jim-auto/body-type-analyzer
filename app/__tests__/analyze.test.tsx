import { act, fireEvent, render, screen, within } from "@testing-library/react";

import AnalyzePage from "@/app/analyze/page";
import { DIAGNOSIS_MODEL_METRICS } from "@/lib/diagnosis-model";
import {
  AI_LOADING_MESSAGES,
  DIAGNOSIS_DISCLAIMERS,
  DIAGNOSIS_INPUT_QUALITY_ERROR_MESSAGE,
  DIAGNOSIS_MODEL_SUMMARY,
  DIAGNOSIS_VALIDATION_LABEL,
  diagnose,
  diagnoseMale,
  extractDiagnosisFeatures,
  extractMaleDiagnosisFeatures,
  type DiagnosisFeatures,
  type DiagnosisFeatureResult,
  type DiagnosisResult,
  type MaleDiagnosisResult,
} from "@/lib/image-analyzer";

jest.mock("@/lib/image-analyzer", () => {
  const actual = jest.requireActual("@/lib/image-analyzer");

  return {
    ...actual,
    extractDiagnosisFeatures: jest.fn(),
    extractMaleDiagnosisFeatures: jest.fn(),
    diagnose: jest.fn(),
    diagnoseMale: jest.fn(),
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
      image: "/images/ishihara_satomi.webp",
      similarity: 94,
      actualHeight: 157,
      cup: "D",
    },
    {
      name: "深田恭子",
      image: "/images/fukada_kyoko.webp",
      similarity: 89,
      actualHeight: 163,
      cup: "E",
    },
    {
      name: "今田美桜",
      image: "/images/imada_mio.webp",
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
  heightCenter: [0.1, 0.2, 0.3],
  heightProfile: [0.1, 0.2, 0.3],
  heightEdgeFull: [0.1, 0.2, 0.3],
  heightEdgeCenter: [0.1, 0.2, 0.3],
  heightHistFull: [0.1, 0.2, 0.3],
  heightLbpFull: [0.1, 0.2, 0.3],
  heightDctFull: [0.1, 0.2, 0.3],
  heightHogFull: [0.1, 0.2, 0.3],
  heightPose: [0.1, 0.2, 0.3],
  cupPrimary: [0.4, 0.5, 0.6],
  cupSecondary: [0.4, 0.5, 0.6],
  cupCenter: [0.4, 0.5, 0.6],
  cupProfile: [0.4, 0.5, 0.6],
  cupEdgeTop: [0.4, 0.5, 0.6],
  cupHistTop: [0.4, 0.5, 0.6],
  cupLbpTop: [0.4, 0.5, 0.6],
  cupDctTop: [0.4, 0.5, 0.6],
  cupHogTop: [0.4, 0.5, 0.6],
  cupPose: [0.4, 0.5, 0.6],
  similarity: [0.7, 0.8, 0.9],
};

const mockMaleResult: MaleDiagnosisResult = {
  estimatedHeight: 178,
  heightDeviation: 62,
  confidence: 35,
  similarCelebrities: [
    {
      name: "福山雅治",
      image: "/images/fukuyama_masaharu.webp",
      similarity: 88,
      actualHeight: 181,
      cup: "A",
    },
  ],
};

const mockedExtractDiagnosisFeatures = jest.mocked(extractDiagnosisFeatures);
const mockedExtractMaleDiagnosisFeatures = jest.mocked(extractMaleDiagnosisFeatures);
const mockedDiagnose = jest.mocked(diagnose);
const mockedDiagnoseMale = jest.mocked(diagnoseMale);
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

const mockFeatureResult: DiagnosisFeatureResult = {
  features: mockFeatures,
  isLowQuality: false,
};

beforeEach(() => {
  jest.useFakeTimers();
  mockedExtractDiagnosisFeatures.mockResolvedValue(mockFeatureResult);
  mockedExtractMaleDiagnosisFeatures.mockResolvedValue({
    features: { heightPrimary: [0.1], similarity: [0.2] },
    isLowQuality: false,
  });
  mockedDiagnoseMale.mockReturnValue(mockMaleResult);
  mockedDiagnose.mockReturnValue(mockResult);
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
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe("AnalyzePage", () => {
  test("モデル性能が公開表示される", () => {
    const { container } = renderPage();
    const performanceSection = screen.getByRole("region", { name: "モデル性能" });
    const main = container.querySelector("main");

    expect(performanceSection).toHaveAttribute("id", "model-performance");
    expect(main?.lastElementChild).toBe(performanceSection);
    expect(
      screen.getByRole("heading", { level: 2, name: "モデル性能" })
    ).toBeInTheDocument();
    expect(
      within(performanceSection).getByText((_, element) =>
        element?.tagName === "P" &&
        (element.textContent?.includes(
          `学習プロフィール画像 ${DIAGNOSIS_MODEL_METRICS.trainingCount} 枚`
        ) ?? false)
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `±${
          Number.isInteger(
            DIAGNOSIS_MODEL_METRICS.height.generalization.coverage[0]?.maxError ?? 0
          )
            ? `${DIAGNOSIS_MODEL_METRICS.height.generalization.coverage[0]?.maxError ?? 0}`
            : (
                DIAGNOSIS_MODEL_METRICS.height.generalization.coverage[0]?.maxError ?? 0
              ).toFixed(1)
        }cm`
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `±${
          Number.isInteger(
            DIAGNOSIS_MODEL_METRICS.cup.generalization.coverage[0]?.maxError ?? 0
          )
            ? `${DIAGNOSIS_MODEL_METRICS.cup.generalization.coverage[0]?.maxError ?? 0}`
            : (
                DIAGNOSIS_MODEL_METRICS.cup.generalization.coverage[0]?.maxError ?? 0
              ).toFixed(1)
        }カップ`
      )
    ).toBeInTheDocument();
    expect(screen.getAllByText("7割がこの範囲")).toHaveLength(2);
    expect(
      screen.getByText(
        `完全一致 ${formatRate(DIAGNOSIS_MODEL_METRICS.height.generalization.exactRate)}`
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `平均誤差 ${formatErrorBound(DIAGNOSIS_MODEL_METRICS.height.generalization.mae)}cm`
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `完全一致 ${formatRate(DIAGNOSIS_MODEL_METRICS.cup.generalization.exactRate)}`
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `平均誤差 ${formatErrorBound(DIAGNOSIS_MODEL_METRICS.cup.generalization.mae)}カップ`
      )
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        `固定テスト ${DIAGNOSIS_MODEL_METRICS.height.generalization.holdoutCount}件`
      ).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(
        `固定テスト ${DIAGNOSIS_MODEL_METRICS.cup.generalization.holdoutCount}件`
      ).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("身長は7割が±5cm以内")).not.toBeInTheDocument();
    expect(screen.queryByText("身長は8割が±6cm以内")).not.toBeInTheDocument();
    expect(
      within(performanceSection).getByText((_, element) =>
        element?.tagName === "P" &&
        (element.textContent?.includes(
          "学習に使っていない固定テストで確認した結果です。"
        ) ?? false)
      )
    ).toBeInTheDocument();
  });

  test("AIスタイル診断ページタイトルが表示される", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "AIスタイル診断" })
    ).toBeInTheDocument();
  });

  test("アップロードエリアが表示される", () => {
    renderPage();

    expect(screen.getByTestId("upload-area")).toBeInTheDocument();
  });

  test("診断概要が表示される", () => {
    renderPage();

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
      screen.getByRole("progressbar", { name: "AIスタイル診断の進捗" })
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

  test("ローディング完了後にスタイル診断結果カードが表示される", async () => {
    renderPage();

    await uploadImage();
    await finishAnalysis();

    expect(screen.getByText("スタイル診断結果")).toBeInTheDocument();
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

  test("シェア UI は表示されない", async () => {
    renderPage();

    await uploadImage();
    await finishAnalysis();

    expect(screen.queryByText("結果テキストをコピー")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("シェア文")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Xでシェア" })
    ).not.toBeInTheDocument();
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

  test("低品質画像のときは警告バナーを表示しつつ結果も出す", async () => {
    mockedExtractDiagnosisFeatures.mockResolvedValueOnce({
      features: mockFeatures,
      isLowQuality: true,
    });
    renderPage();

    await uploadImage();
    await finishAnalysis();

    expect(screen.getByText("画像品質に関する注意")).toBeInTheDocument();
    expect(
      screen.getByText(DIAGNOSIS_INPUT_QUALITY_ERROR_MESSAGE)
    ).toBeInTheDocument();
    expect(screen.getByText("スタイル診断結果")).toBeInTheDocument();
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

  test("性別トグルが表示される", () => {
    renderPage();

    expect(screen.getByText("女性")).toBeInTheDocument();
    expect(screen.getByText("男性")).toBeInTheDocument();
  });

  test("男性モードで診断すると身長のみ表示される", async () => {
    renderPage();

    await act(async () => {
      fireEvent.click(screen.getByText("男性"));
    });

    await uploadImage();
    await finishAnalysis();

    expect(screen.getByText("スタイル診断結果")).toBeInTheDocument();
    expect(screen.getByText("178")).toBeInTheDocument();
    expect(screen.queryByText("推定カップ")).not.toBeInTheDocument();
    expect(screen.queryByText("シルエットタイプ")).not.toBeInTheDocument();
    expect(mockedExtractMaleDiagnosisFeatures).toHaveBeenCalledTimes(1);
  });

  test("男性モードで類似有名人にカップが表示されない", async () => {
    renderPage();

    await act(async () => {
      fireEvent.click(screen.getByText("男性"));
    });

    await uploadImage();
    await finishAnalysis();

    expect(screen.getByText("福山雅治")).toBeInTheDocument();
    expect(screen.getByText("181cm")).toBeInTheDocument();
    expect(screen.queryByText("推定カップ")).not.toBeInTheDocument();
  });
});
