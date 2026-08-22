export interface Bookmark {
  id: string;
  author: string;
  date: string;
  href: string;
  title: string;
  type: string;
}

export const BOOKMARKS: readonly Bookmark[] = [
  {
    id: "twelve-factor-app",
    author: "Adam Wiggins",
    date: "2011",
    href: "https://12factor.net/",
    title: "The Twelve-Factor App",
    type: "Guide",
  },
  {
    id: "philosophy-of-software-design",
    author: "John Ousterhout",
    date: "2018",
    href: "https://web.stanford.edu/~ouster/cgi-bin/book.php",
    title: "A Philosophy of Software Design",
    type: "Book",
  },
];
