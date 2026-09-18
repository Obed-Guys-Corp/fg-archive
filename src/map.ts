import { renderBuilds } from "./pages/builds";
import { renderCms } from "./pages/cms";
import { renderBase } from "./pages/base";
import { pages, type Page } from "./pages";

export interface Map {
    page: Page;
    label: string;
    render: () => void | Promise<void>;
}

export const maps: [Map, ...Map[]] = [
    {
        page: pages[0]!,
        label: "",
        render: renderBase
    },
    {
        page: pages[1]!,
        label: "builds_title",
        render: renderBuilds
    },
    {
        page: pages[2]!,
        label: "cms_title",
        render: renderCms
    }
];
