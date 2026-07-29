import { BLOG_SOCIAL_IMAGE } from "@/modules/blog";
import {
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
  renderSocialImage,
} from "@/shared/social-image";

export const { alt } = BLOG_SOCIAL_IMAGE;
export const contentType = SOCIAL_IMAGE_CONTENT_TYPE;
export const size = SOCIAL_IMAGE_SIZE;

export default function BlogOpenGraphImage() {
  return renderSocialImage(BLOG_SOCIAL_IMAGE);
}
