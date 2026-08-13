import ReactMarkdown from "react-markdown";

import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/shared/ui/panel";

export const Biography = ({
  company,
  name,
  paragraphs,
  role,
}: {
  company: string;
  name: string;
  paragraphs: readonly string[];
  role: string;
}) => (
  <Panel className="mx-auto w-full md:w-3xl">
    <PanelHeader>
      <PanelTitle>Hello</PanelTitle>
    </PanelHeader>

    {/*
      `.typeset` scales its own font size up by 1.125 below 48rem, which would
      render this block larger on a phone than on a desktop and larger than
      every other body on the page. The utility restates the size — it sits in
      `@layer utilities`, so it beats `.typeset` in `@layer components` — and
      the children stay in `em`, so they follow. 16/28 is the same measure an
      Article reads at.
    */}
    <PanelContent className="typeset text-base/7">
      <p>
        {`Hi 👋 I'm`} <strong>{name}</strong>, a{" "}
        <strong>{role.toLocaleLowerCase("en-US")}</strong> @ {company}.
      </p>
      {paragraphs.map((paragraph) => (
        <ReactMarkdown key={paragraph} skipHtml>
          {paragraph}
        </ReactMarkdown>
      ))}
    </PanelContent>
  </Panel>
);
