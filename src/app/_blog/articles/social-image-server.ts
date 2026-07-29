import { notFound } from "next/navigation";

import {
  findArticleSocialImage,
  listArticleSocialImages,
} from "@/app/_blog/articles/server";
import { renderSocialImage } from "@/shared/social-image";

import { createArticleSocialImageContract } from "./social-image";

const articleSocialImageContract = createArticleSocialImageContract({
  findArticleSocialImage,
  listArticleSocialImages,
  notFound,
  render: renderSocialImage,
});

export const generateArticleSocialImageStaticParams = async (
  ...arguments_: Parameters<
    typeof articleSocialImageContract.generateStaticParams
  >
) => await articleSocialImageContract.generateStaticParams(...arguments_);

export const renderArticleSocialImage = async (
  ...arguments_: Parameters<typeof articleSocialImageContract.render>
) => await articleSocialImageContract.render(...arguments_);
