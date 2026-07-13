import { Button } from "@/shared/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import { SOCIAL_PROFILES } from "./profiles";

export const SocialView = () => (
  <section className="screen-line-top screen-line-bottom mx-auto w-full border-x md:w-3xl p-4">
    <ul className="flex flex-wrap gap-2">
      {SOCIAL_PROFILES.map((item) => (
        <li key={item.name}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" asChild>
                <a href={item.href} target="_blank" rel="noopener">
                  {item.icon}
                  <span className="sr-only">{item.title}</span>
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {item.title} ({item.handle})
            </TooltipContent>
          </Tooltip>
        </li>
      ))}
    </ul>
  </section>
);
