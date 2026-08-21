const BLOG_DESCRIPTION =
  "Writing about nerdy stuff, mostly software, the web, and whatever else catches my attention.";

export const createBlogIdentity = (siteName: string) => ({
  description: BLOG_DESCRIPTION,
  name: `${siteName}’s Blog`,
  title: `Blog | ${siteName}`,
});
