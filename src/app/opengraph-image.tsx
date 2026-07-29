import { PORTFOLIO_SOCIAL_IMAGE } from "@/modules/portfolio";
import { renderSocialImage } from "@/shared/social-image";

export {
  SOCIAL_IMAGE_CONTENT_TYPE as contentType,
  SOCIAL_IMAGE_SIZE as size,
} from "@/shared/social-image";

export const { alt } = PORTFOLIO_SOCIAL_IMAGE;

export default function PortfolioOpenGraphImage() {
  return renderSocialImage(PORTFOLIO_SOCIAL_IMAGE);
}
