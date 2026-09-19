import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import ejs from "ejs";
import { pages } from "../pages";

export async function mkPages(outDir: string) {
    const base = await readFile(resolve(outDir, "index.html"), "utf8");

    for (const page of pages) {
        const html = ejs.render(base, {
            title: page.title,
            description: page.desc,
            canonical: `https://fga.floyzi.dev/${page.path}`,
        });

        const dir = resolve(outDir, page.path);

        await mkdir(dir, {
            recursive: true,
        });

        await writeFile(resolve(dir, "index.html"), html, "utf8");
    }
}
