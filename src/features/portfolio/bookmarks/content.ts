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
  {
    id: "choose-boring-technology",
    author: "Dan McKinley",
    date: "2015",
    href: "https://boringtechnology.club/",
    title: "Choose Boring Technology",
    type: "Talk",
  },
  {
    id: "things-you-should-never-do",
    author: "Joel Spolsky",
    date: "06.04.2000",
    href: "https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/",
    title: "Things You Should Never Do, Part I",
    type: "Article",
  },
  {
    id: "architecture-of-open-source-applications",
    author: "Amy Brown & Greg Wilson",
    date: "2011",
    href: "https://aosabook.org/en/",
    title: "The Architecture of Open Source Applications",
    type: "Book",
  },
];
