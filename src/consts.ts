import type { Site, Metadata, Socials } from "@types";

export const SITE: Site = {
    NAME: "Astro Pico",
    INITIALS: "A.P",
    NUM_POSTS_ON_HOMEPAGE: 2,
    NUM_PROJECTS_ON_HOMEPAGE: 2,
};

export const HOME: Metadata = {
    TITLE: "Home",
    DESCRIPTION: "Astro Pico is a minimal and lightweight blog and portfolio.",
};

export const POSTS: Metadata = {
    TITLE: "Posts",
    DESCRIPTION: "A collection of articles on topics I am passionate about.",
};

export const PROJECTS: Metadata = {
    TITLE: "Projects",
    DESCRIPTION: "A collection of my projects, with links to repositories and demos.",
};

export const SOCIALS: Socials = [
    {
        NAME: "email",
        HREF: "jordanayotte1999@gmail.com",
    },
    {
        NAME: "github",
        HREF: "https://github.com/joayo13",
    },
    {
        NAME: "linkedin",
        HREF: "https://www.linkedin.com/in/jordan-ayotte-b90747211/",
    },
];
