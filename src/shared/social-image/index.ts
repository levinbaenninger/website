export interface SocialImageInput {
  readonly alt: string;
  readonly author: string;
  readonly label: string;
  readonly site: string;
  /** Rendered instead of the site row; omit on cards that are about a title. */
  readonly tagline?: string;
  readonly title: string;
}

export {
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
  renderSocialImage,
} from "./render";
