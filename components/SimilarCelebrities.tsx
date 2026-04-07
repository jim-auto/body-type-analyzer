"use client";

type Props = {
  celebrities: { name: string; similarity: number }[];
};

export default function SimilarCelebrities({ celebrities }: Props) {
  if (celebrities.length === 0) return null;

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold text-center text-slate-800">
        あなたに近い体型バランスの有名人
      </h2>
      <div className="space-y-3">
        {celebrities.map((celeb, index) => (
          <div
            key={celeb.name}
            className={`flex items-center justify-between rounded-xl p-4 shadow ${
              index === 0
                ? "bg-yellow-50 border-2 border-yellow-400"
                : "bg-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-white ${
                  index === 0 ? "bg-yellow-500 text-lg" : "bg-slate-400 text-sm"
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`font-semibold ${
                  index === 0 ? "text-lg text-slate-900" : "text-slate-700"
                }`}
              >
                {celeb.name}
              </span>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                index === 0
                  ? "bg-yellow-400 text-yellow-900"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {celeb.similarity}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
