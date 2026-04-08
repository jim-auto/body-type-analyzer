import { act, fireEvent, render, screen } from "@testing-library/react";

import AnalyzePage from "@/app/analyze/page";
import {
  AI_LOADING_MESSAGES,
  buildShareText,
  buildXShareUrl,
  diagnose,
  hashFromImage,
  type DiagnosisResult,
} from "@/lib/image-analyzer";

jest.mock("@/lib/image-analyzer", () => {
  const actual = jest.requireActual("@/lib/image-analyzer");

  return {
    ...actual,
    hashFromImage: jest.fn(),
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

const mockedHashFromImage = jest.mocked(hashFromImage);
const mockedDiagnose = jest.mocked(diagnose);
const mockedBuildShareText = jest.mocked(buildShareText);
const mockedBuildXShareUrl = jest.mocked(buildXShareUrl);
const mockClipboardWriteText = jest.fn();
const mockCreateObjectUrl = jest.fn(() => "blob:preview-url");
const mockRevokeObjectUrl = jest.fn();

const renderPage = () => render(<AnalyzePage />);

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
  mockedHashFromImage.mockResolvedValue(123456);
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
    expect(screen.getByText("結果はエンタメ目的です")).toBeInTheDocument();
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

    expect(mockedHashFromImage).toHaveBeenCalledTimes(1);
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

    expect(mockedHashFromImage).toHaveBeenCalledWith(file);
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
    expect(mockedHashFromImage).not.toHaveBeenCalled();
  });

  test("hashFromImage が失敗したときは読み込み失敗を表示する", async () => {
    mockedHashFromImage.mockRejectedValueOnce(new Error("broken image"));
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
    expect(
      screen.getByText("※ このAIは雰囲気で動いています")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "※ 画像はサーバーに送信されません。全てブラウザ内で処理されます"
      )
    ).toBeInTheDocument();
  });
});
