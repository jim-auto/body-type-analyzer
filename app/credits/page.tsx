import creditsJson from "@/public/data/image-credits.json";

type ImageCredit = {
  name: string;
  image: string;
  title: string;
  creator: string | null;
  creatorUrl: string | null;
  source: string;
  provider: string;
  license: string;
  licenseVersion: string;
  licenseUrl: string;
  foreignLandingUrl: string;
  attribution: string;
};

const imageCredits = creditsJson as ImageCredit[];

export default function CreditsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-6">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Credits
        </p>
        <h1 className="text-3xl font-bold text-slate-900">画像クレジット</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          Wikipedia 以外のソースから取得した再利用可能画像のクレジットです。CC
          ライセンスや Public Domain の条件に従って、元ページとライセンス情報を掲載しています。
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {imageCredits.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">現在掲載中の追加クレジットはありません。</p>
          </section>
        ) : (
          imageCredits.map((credit) => (
            <article
              key={`${credit.name}-${credit.image}`}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <img
                  src={credit.image}
                  alt={credit.name}
                  className="h-20 w-20 rounded-2xl object-cover ring-1 ring-slate-200"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {credit.name}
                    </h2>
                    <p className="text-sm text-slate-500">{credit.title}</p>
                  </div>
                  <p className="text-sm text-slate-600">
                    作者:{" "}
                    {credit.creatorUrl ? (
                      <a
                        href={credit.creatorUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4"
                      >
                        {credit.creator ?? "不明"}
                      </a>
                    ) : (
                      credit.creator ?? "不明"
                    )}
                  </p>
                  <p className="text-sm text-slate-600">
                    ソース: {credit.source} / {credit.provider}
                  </p>
                  <p className="text-sm text-slate-600">
                    ライセンス:{" "}
                    <a
                      href={credit.licenseUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4"
                    >
                      {credit.license.toUpperCase()} {credit.licenseVersion}
                    </a>
                  </p>
                  <p className="text-sm text-slate-500">{credit.attribution}</p>
                  <p className="text-sm">
                    <a
                      href={credit.foreignLandingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-slate-700 underline underline-offset-4"
                    >
                      元ページを見る
                    </a>
                  </p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
