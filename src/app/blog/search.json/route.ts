import { listArticleSearchDocuments } from "@/app/blog/_articles/server";
import { serializeArticleSearchArtifact } from "@/features/blog/search/contract";

export const dynamic = "force-static";

export const GET = async (): Promise<Response> =>
  new Response(
    serializeArticleSearchArtifact(await listArticleSearchDocuments()),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow, nosnippet",
      },
    }
  );
