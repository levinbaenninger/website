import { notFound } from "next/navigation";

import {
  findArticleSocialImageInput,
  listArticleSocialImageRouteParams,
} from "@/app/blog/_articles/server";
import { renderSocialImage } from "@/shared/social-image";

import { createArticleSocialImageAdapter } from "./social-image";

const articleSocialImageAdapter = createArticleSocialImageAdapter({
  findInput: findArticleSocialImageInput,
  generateStaticParams: listArticleSocialImageRouteParams,
  notFound,
  render: renderSocialImage,
});

export const generateArticleSocialImageStaticParams = async (
  ...arguments_: Parameters<
    typeof articleSocialImageAdapter.generateStaticParams
  >
) => await articleSocialImageAdapter.generateStaticParams(...arguments_);

export const renderArticleSocialImage = async (
  ...arguments_: Parameters<typeof articleSocialImageAdapter.render>
) => await articleSocialImageAdapter.render(...arguments_);
