import { SOCIAL_PROFILES } from "./profiles";
import { SocialProfileItem } from "./social-profile-item";

export const SocialView = () => (
  <ul className="flex flex-wrap gap-2">
    {SOCIAL_PROFILES.map((profile) => (
      <SocialProfileItem key={profile.name} profile={profile} />
    ))}
  </ul>
);
