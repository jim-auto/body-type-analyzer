import { render, screen, fireEvent } from '@testing-library/react';
import ImageUploader from '../ImageUploader';

// URL.createObjectURLのモック
beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/fake-url');
});

describe('ImageUploader', () => {
  it('初期状態でアップロードエリアが表示されること', () => {
    render(<ImageUploader onImageSelected={jest.fn()} />);
    expect(screen.getByTestId('upload-area')).toBeInTheDocument();
    expect(screen.getByText(/画像をドラッグ/)).toBeInTheDocument();
  });

  it('ファイル選択でonImageSelectedが呼ばれること', () => {
    const onImageSelected = jest.fn();
    render(<ImageUploader onImageSelected={onImageSelected} />);

    const input = screen.getByTestId('file-input');
    const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(onImageSelected).toHaveBeenCalledWith(file);
  });

  it('ファイル選択後にプレビューが表示されること', () => {
    render(<ImageUploader onImageSelected={jest.fn()} />);

    const input = screen.getByTestId('file-input');
    const file = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });

    fireEvent.change(input, { target: { files: [file] } });

    const preview = screen.getByAltText('プレビュー');
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveAttribute('src', 'blob:http://localhost/fake-url');
  });

  it('accept="image/*" が設定されていること', () => {
    render(<ImageUploader onImageSelected={jest.fn()} />);
    const input = screen.getByTestId('file-input');
    expect(input).toHaveAttribute('accept', 'image/*');
  });
});
