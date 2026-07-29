import { PORTFOLIO_SOCIAL_IMAGE } from "@/modules/portfolio";
import {
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
  renderSocialImage,
} from "@/shared/social-image";

export const { alt } = PORTFOLIO_SOCIAL_IMAGE;
export const contentType = SOCIAL_IMAGE_CONTENT_TYPE;
export const size = SOCIAL_IMAGE_SIZE;

export default function PortfolioOpenGraphImage() {
  return renderSocialImage(PORTFOLIO_SOCIAL_IMAGE);
}
