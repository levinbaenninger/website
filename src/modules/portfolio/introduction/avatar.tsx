import Image from "next/image";

export const IntroductionAvatar = () => (
  <div className="screen-line-top mt-auto flex border-r border-line sm:row-span-2 sm:row-start-1">
    <Image
      className="rounded-full"
      src="/images/profile.png"
      alt="Profile"
      loading="eager"
      width={160}
      height={160}
    />
  </div>
);
