import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadTransform() {
    vi.resetModules();
    const mod = await import("./markdown-editor");
    return {
        transformObsidianSyntax: mod.transformObsidianSyntax,
        parseFrontmatter: mod.parseFrontmatter
    };
}

describe("transformObsidianSyntax", () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem("API_URL", "https://notes.example.com");
    });

    it("rewrites markdown image links with resolved file URLs", async () => {
        const { transformObsidianSyntax } = await loadTransform();

        const transformed = transformObsidianSyntax(
            `![inline](../images/demo.jpg "title")`,
            "Work",
            { "../images/demo.jpg": "notes/images/demo.jpg" },
            "token-123"
        );

        expect(transformed).toContain("https://notes.example.com/api/file?");
        expect(transformed).toContain("vault=Work");
        expect(transformed).toContain("path=notes%2Fimages%2Fdemo.jpg");
        expect(transformed).toContain("token=token-123");
        expect(transformed).toContain(`"title"`);
    });

    it("rewrites html image sources with resolved file URLs", async () => {
        const { transformObsidianSyntax } = await loadTransform();

        const transformed = transformObsidianSyntax(
            `<img src="./img/html.png" alt="demo">`,
            "Work",
            { "./img/html.png": "assets/html.png" },
            "token-456"
        );

        expect(transformed).toContain(`<img src="https://notes.example.com/api/file?`);
        expect(transformed).toContain("vault=Work");
        expect(transformed).toContain("path=assets%2Fhtml.png");
        expect(transformed).toContain("token=token-456");
        expect(transformed).toContain(`alt="demo"`);
    });

    it("does not rewrite remote image links", async () => {
        const { transformObsidianSyntax } = await loadTransform();

        const content = `![remote](https://cdn.example.com/demo.png)`;
        const transformed = transformObsidianSyntax(content, "Work", {}, "token-789");

        expect(transformed).toBe(content);
    });
});

describe("parseFrontmatter", () => {
    it("handles plain markdown content without frontmatter", async () => {
        const { parseFrontmatter } = await loadTransform();
        const content = "# Simple Markdown\nThis is a test note.";
        const { properties, contentBody } = parseFrontmatter(content);
        expect(properties).toEqual({});
        expect(contentBody).toBe(content);
    });

    it("parses single values (string, number, boolean) correctly", async () => {
        const { parseFrontmatter } = await loadTransform();
        const content = `---
title: "My Beautiful Note"
numberValue: 123
floatValue: 45.67
boolTrue: true
boolFalse: false
plainString: Hello Obsidian
---
# Main Content
Body text.`;
        const { properties, contentBody } = parseFrontmatter(content);
        expect(properties).toEqual({
            title: "My Beautiful Note",
            numberValue: 123,
            floatValue: 45.67,
            boolTrue: true,
            boolFalse: false,
            plainString: "Hello Obsidian",
        });
        expect(contentBody).toBe("# Main Content\nBody text.");
    });

    it("parses inline arrays and multiline bullet lists correctly", async () => {
        const { parseFrontmatter } = await loadTransform();
        const content = `---
tags: [idea, article, obsidian]
aliases:
  - my-alias
  - second-alias
numbers:
  - 10
  - 20.5
---
Some body text.`;
        const { properties, contentBody } = parseFrontmatter(content);
        expect(properties).toEqual({
            tags: ["idea", "article", "obsidian"],
            aliases: ["my-alias", "second-alias"],
            numbers: [10, 20.5],
        });
        expect(contentBody).toBe("Some body text.");
    });

    it("gracefully falls back when closing --- is missing", async () => {
        const { parseFrontmatter } = await loadTransform();
        const content = `---
title: Broken
tags: [1, 2]
No closing marks here.`;
        const { properties, contentBody } = parseFrontmatter(content);
        expect(properties).toEqual({});
        expect(contentBody).toBe(content);
    });
});
