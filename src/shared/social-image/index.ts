export interface SocialImageInput {
  readonly alt: string;
  readonly label: string;
  readonly title: string;
}

export {
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
  renderSocialImage,
} from "./render";
