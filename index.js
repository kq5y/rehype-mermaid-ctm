var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { visitParents } from "unist-util-visit-parents";
import puppeteer from "puppeteer";
import { renderMermaid } from "@mermaid-js/mermaid-cli";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";
function isMermaidElement(node) {
    if (node.tagName !== "code") {
        return false;
    }
    let className = node.properties.className;
    if (typeof className === "string") {
        className = className.split(" ");
    }
    if (!Array.isArray(className)) {
        return false;
    }
    return className.includes("language-mermaid");
}
function makeElement(tag, props = {}, child = []) {
    return {
        type: "element",
        tagName: tag,
        properties: props,
        children: child,
    };
}
function getPngDimensions(data) {
    const IHDR_OFFSET = 8;
    const width = data
        .slice(IHDR_OFFSET + 8, IHDR_OFFSET + 12)
        .reduce((acc, byte) => (acc << 8) | byte, 0);
    const height = data
        .slice(IHDR_OFFSET + 12, IHDR_OFFSET + 16)
        .reduce((acc, byte) => (acc << 8) | byte, 0);
    return { width, height };
}
const rehypeMermaidCtm = (options = {}) => {
    return (root) => __awaiter(void 0, void 0, void 0, function* () {
        const blocks = [];
        visitParents(root, "element", (node, ancestors) => {
            if (!isMermaidElement(node)) {
                return;
            }
            const preElement = ancestors.at(-1);
            const parent = ancestors.at(-2);
            if (preElement.tagName === "pre") {
                const child = node.children[0];
                if (child.type === "text") {
                    blocks.push({
                        content: child.value,
                        pre: preElement,
                        parent: parent,
                    });
                }
            }
        });
        if (blocks.length === 0) {
            return;
        }
        const browser = yield puppeteer.launch({
            headless: true,
        });
        const outputType = options.outputType || "inline-svg";
        const outputFormat = outputType === "img-png" ? "png" : "svg";
        for (const { content, pre, parent } of blocks) {
            const { data: outputData } = yield renderMermaid(browser, content, outputFormat, {
                backgroundColor: "transparent",
                mermaidConfig: Object.assign({ flowchart: {
                        defaultRenderer: "elk",
                    } }, options === null || options === void 0 ? void 0 : options.mermaidConfig),
            });
            const nodeIndex = parent.children.indexOf(pre);
            if (outputType === "inline-svg") {
                const svgString = Buffer.from(outputData).toString("utf-8");
                const svgHtml = fromHtmlIsomorphic(svgString);
                if (svgHtml.children.length === 0) {
                    continue;
                }
                const svgElement = svgHtml.children[0];
                parent.children[nodeIndex] = makeElement("div", {
                    className: "mermaid-block",
                }, [svgElement]);
            }
            else if (outputType === "img-svg") {
                const svgString = Buffer.from(outputData).toString("utf-8");
                const imgElement = makeElement("img", {
                    src: `data:image/svg+xml;base64,${btoa(svgString)}`,
                    className: "mermaid-image",
                });
                parent.children[nodeIndex] = makeElement("div", {
                    className: "mermaid-block",
                }, [imgElement]);
            }
            else if (outputType === "img-png") {
                const dimensions = getPngDimensions(outputData);
                const pngString = String.fromCharCode(...outputData);
                const imgElement = makeElement("img", {
                    src: `data:image/png;base64,${btoa(pngString)}`,
                    className: "mermaid-image",
                    width: `${dimensions.width}px`,
                    height: `${dimensions.height}px`,
                });
                parent.children[nodeIndex] = makeElement("div", {
                    className: "mermaid-block",
                }, [imgElement]);
            }
        }
    });
};
export default rehypeMermaidCtm;
