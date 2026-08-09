import { BLOG_SOCIAL_IMAGE } from "@/features/blog/social-image";
import { renderSocialImage } from "@/shared/social-image";

export {
  SOCIAL_IMAGE_CONTENT_TYPE as contentType,
  SOCIAL_IMAGE_SIZE as size,
} from "@/shared/social-image";

export const { alt } = BLOG_SOCIAL_IMAGE;

export default function BlogOpenGraphImage() {
  return renderSocialImage(BLOG_SOCIAL_IMAGE);
}
