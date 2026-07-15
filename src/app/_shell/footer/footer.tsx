import { Fragment } from "react";

import { SOCIAL_PROFILES } from "@/modules/portfolio";
import { FluidGradientText } from "@/shared/ui/fluid-gradient-text";
import { Separator } from "@/shared/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import { FOOTER_CONTENT } from "./content";

const authorProfile = SOCIAL_PROFILES.find(
  (profile) => profile.name === FOOTER_CONTENT.authorProfile
);

const FooterItem = (props: React.ComponentProps<"div">) => (
  <div className="grid grid-cols-2 gap-4" {...props} />
);

const FooterLink = ({ children, ...props }: React.ComponentProps<"a">) => (
  <a
    className="underline decoration-line underline-offset-4 transition-colors hover:decoration-foreground"
    target="_blank"
    rel="noopener noreferrer"
    {...props}
  >
    {children}
  </a>
);

export const Footer = () => (
  <footer className="max-w-screen overflow-x-clip px-2">
    <div className="mx-auto w-full border-x border-line md:w-3xl">
      <div className="screen-line-top screen-line-bottom">
        <div className="stripe-divider h-12" />
      </div>

      <dl className="flex flex-col gap-4 px-4 py-8 font-mono [&_dd]:text-sm [&_dt]:text-right [&_dt]:text-sm [&_dt]:text-muted-foreground [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2">
        <FooterItem>
          <dt>Crafted by</dt>
          <dd>
            {authorProfile ? (
              <FooterLink href={authorProfile.href}>
                @{authorProfile.handle}
              </FooterLink>
            ) : null}
          </dd>
        </FooterItem>

        <FooterItem>
          <dt>Built with</dt>
          <dd>
            <ul>
              {FOOTER_CONTENT.builtWith.map((technology) => (
                <li key={technology}>{technology}</li>
              ))}
            </ul>
          </dd>
        </FooterItem>

        <FooterItem>
          <dt>Deployed on</dt>
          <dd>{FOOTER_CONTENT.deployedOn}</dd>
        </FooterItem>

        <FooterItem>
          <dt>Source code</dt>
          <dd>
            <FooterLink href={FOOTER_CONTENT.source.href}>
              {FOOTER_CONTENT.source.label}
            </FooterLink>
          </dd>
        </FooterItem>

        <FooterItem>
          <dt>License</dt>
          <dd>{FOOTER_CONTENT.license}</dd>
        </FooterItem>
      </dl>

      <div className="screen-line-top screen-line-bottom flex w-full">
        <nav
          aria-label="Social profiles"
          className="mx-auto flex items-center justify-center border border-line bg-background"
        >
          {SOCIAL_PROFILES.map((profile, index) => (
            <Fragment key={profile.name}>
              {index > 0 ? (
                <Separator orientation="vertical" className="h-11 bg-line" />
              ) : null}
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    className="flex h-11 items-center px-3 text-muted-foreground transition-colors hover:text-foreground [&_svg]:size-4"
                    href={profile.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${profile.title} profile`}
                  >
                    {profile.icon}
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  {profile.title} ({profile.handle})
                </TooltipContent>
              </Tooltip>
            </Fragment>
          ))}
        </nav>
      </div>
    </div>

    <div className="screen-line-bottom mx-auto h-[clamp(7rem,24vw,18rem)] w-full max-w-6xl text-foreground">
      <FluidGradientText text="levin" />
    </div>

    <div className="h-24" />
    <div className="pb-[env(safe-area-inset-bottom,0)]" />
  </footer>
);
