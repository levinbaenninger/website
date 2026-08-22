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

    {/* `.typeset` scales 1.125 below 48rem; `text-base/7` restates 16/28 in
      `@layer utilities` so it beats typeset and children stay in `em`. */}
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
