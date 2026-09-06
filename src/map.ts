import { renderBuilds } from "./pages/builds";
import { renderCms } from "./pages/cms";
import { renderBase } from "./pages/base";

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
        path: "builds",
        label: "builds_title",
        render: renderBuilds
    },
    {
        path: "cms",
        label: "cms_title",
        render: renderCms
    }
];
