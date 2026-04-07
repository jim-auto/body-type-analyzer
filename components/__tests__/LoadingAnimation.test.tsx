import { render, screen, act } from "@testing-library/react";
import LoadingAnimation from "../LoadingAnimation";

describe("LoadingAnimation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("最初のメッセージが表示されること", () => {
    const onComplete = jest.fn();
    render(<LoadingAnimation onComplete={onComplete} />);
    expect(screen.getByText("骨格をなんとなく解析中…")).toBeInTheDocument();
  });

  it("1.5秒後に次のメッセージに切り替わること", () => {
    const onComplete = jest.fn();
    render(<LoadingAnimation onComplete={onComplete} />);

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByText("AIが雰囲気で判断しています…")).toBeInTheDocument();
  });

  it("3秒後に3番目のメッセージが表示されること", () => {
    const onComplete = jest.fn();
    render(<LoadingAnimation onComplete={onComplete} />);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.getByText("体型バランスを数値化中…")).toBeInTheDocument();
  });

  it("4.5秒後に4番目のメッセージが表示されること", () => {
    const onComplete = jest.fn();
    render(<LoadingAnimation onComplete={onComplete} />);

    act(() => {
      jest.advanceTimersByTime(4500);
    });

    expect(screen.getByText("偏差値をフィーリングで算出中…")).toBeInTheDocument();
  });

  it("6秒後に最後のメッセージが表示されること", () => {
    const onComplete = jest.fn();
    render(<LoadingAnimation onComplete={onComplete} />);

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(screen.getByText("もっともらしい結果を生成中…")).toBeInTheDocument();
  });

  it("全メッセージ表示後（7.5秒後）にonCompleteが呼ばれること", () => {
    const onComplete = jest.fn();
    render(<LoadingAnimation onComplete={onComplete} />);

    act(() => {
      jest.advanceTimersByTime(7499);
    });
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("プログレスバーが表示されること", () => {
    const onComplete = jest.fn();
    render(<LoadingAnimation onComplete={onComplete} />);
    expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    expect(screen.getByTestId("progress-fill")).toBeInTheDocument();
  });

  it("プログレスバーの幅が進行に合わせて変化すること", () => {
    const onComplete = jest.fn();
    render(<LoadingAnimation onComplete={onComplete} />);

    // Initially 20% (1/5)
    const fill = screen.getByTestId("progress-fill");
    expect(fill.style.width).toBe("20%");

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    // 40% (2/5)
    expect(fill.style.width).toBe("40%");

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    // 60% (3/5)
    expect(fill.style.width).toBe("60%");

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    // 80% (4/5)
    expect(fill.style.width).toBe("80%");

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    // 100% (5/5)
    expect(fill.style.width).toBe("100%");
  });

  it("コンポーネントアンマウント時にタイマーがクリーンアップされること", () => {
    const onComplete = jest.fn();
    const { unmount } = render(<LoadingAnimation onComplete={onComplete} />);

    unmount();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });
});
