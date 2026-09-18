import { renderBuilds } from "./pages/builds";
import { renderCms } from "./pages/cms";
import { renderBase } from "./pages/base";
import { pages } from "./pages";

export interface Map {
    path: string;
    label: string;
    render: () => void | Promise<void>;
}

export const maps: [Map, ...Map[]] = [
    {
        path: "",
        label: "",
        render: renderBase
    },
    {
        path: pages[0],
        label: "builds_title",
        render: renderBuilds
    },
    {
        path:  pages[1],
        label: "cms_title",
        render: renderCms
    }
];
