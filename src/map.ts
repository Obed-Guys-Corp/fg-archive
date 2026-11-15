import { renderBuilds } from "./pages/builds";
import { renderCms } from "./pages/cms";
import { renderBase } from "./pages/base";
import { pages, type Page } from "./pages";
import { renderCreative, renderUGCALevel, renderUGCASearch, renderUGCAStats } from "./pages/creative";

export interface PageMap {
    page: Page;
    label: string;
    render: () => void | Promise<void>;
    nested?: PageMap[];
}

export const maps: [PageMap, ...PageMap[]] = [
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
    },
    {
        page: pages[3]!,
        label: "creative_title",
        render: renderCreative,
        nested: [
            {
                page: pages[4]!,
                label: "creative_title",
                render: renderUGCAStats,
            },
            {
                page: pages[5]!,
                label: "creative_title",
                render: renderUGCASearch,
            },
            {
                page: pages[6]!,
                label: "creative_title",
                render: renderUGCALevel,
            }
        ]
    }
];
