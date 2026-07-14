import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/shared/ui/panel";

export const HelloView = () => (
  <Panel className="mx-auto w-full md:w-3xl">
    <PanelHeader>
      <PanelTitle>Hello</PanelTitle>
    </PanelHeader>

    <PanelContent className="typeset typeset-body">
      <p>
        Hi 👋 I'm <strong>Levin Bänninger</strong>, a{" "}
        <strong>software engineer apprentice</strong> @ Bühler.
      </p>
      <p>
        By day I wrangle our component library so teams ship faster without
        breaking UX; by night I tinker on side projects for fun. I like clean
        APIs, tidy repos, and code that explains itself. Coffee-powered,
        test-approved, always learning.
      </p>
    </PanelContent>
  </Panel>
);
