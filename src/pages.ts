export interface Page {
    path: string;
    title: string;
    desc: string;
}

export const pages: [Page, ...Page[]] = [
    {
        path: "",
        title: "Fall Guys Archive",
        desc: "Website of the Fall Guys archive",
    },
    {
        path: "builds",
        title: "Fall Guys Archive: Builds",
        desc: "View and download Fall Guys builds",
    },
    {
        path: "cms",
        title: "Fall Guys Archive: CMS",
        desc: "View Fall Guys content updates history",
    },
];