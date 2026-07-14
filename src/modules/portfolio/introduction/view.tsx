import { IntroductionArtwork } from "./artwork";
import { IntroductionAvatar } from "./avatar";
import { IntroductionDescription } from "./description";
import { IntroductionName } from "./name";

export const IntroductionView = () => (
  <section className="screen-line-bottom mx-auto grid w-full grid-cols-[auto_1fr] grid-rows-[1fr_auto] border-x border-line md:w-3xl">
    <IntroductionArtwork />
    <IntroductionAvatar />

    <div className="col-start-2 flex flex-col justify-center gap-2 border-t border-line">
      <IntroductionName />
      <IntroductionDescription />
    </div>
  </section>
);
