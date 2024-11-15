import { type Root, Element } from "hast";

import mermaid from "mermaid";
import { visitParents } from "unist-util-visit-parents";
import puppeteer from "puppeteer";
import { renderMermaid } from "@mermaid-js/mermaid-cli";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";

type OutputType = "inline-svg" | "img-svg" | "img-png";

interface RehypeMermaidCtmConfig {
  outputType?: OutputType;
  mermaidConfig?: Parameters<typeof mermaid.initialize>[0];
}

interface Block {
  content: string;
  pre: Element;
  parent: Element;
}

function isMermaidElement(node: Element): boolean {
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

function makeElement(
  tag: string,
  props: Element["properties"] = {},
  child: Element[] = []
): Element {
  return {
    type: "element",
    tagName: tag,
    properties: props,
    children: child,
  };
}

function getSvgDimensions(svgString: string) {
  const viewBoxMatch = svgString.match(/viewBox="([\d.\s-]+)"/);
  if (viewBoxMatch) {
    const viewBoxValue = viewBoxMatch[1].split(" ");
    return {
      width: Number.parseFloat(viewBoxValue[2]),
      height: Number.parseFloat(viewBoxValue[3]),
    };
  }
  return { width: undefined, height: undefined };
}

function getPngDimensions(data: Uint8Array) {
  const IHDR_OFFSET = 8;
  const width = data
    .slice(IHDR_OFFSET + 8, IHDR_OFFSET + 12)
    .reduce((acc, byte) => (acc << 8) | byte, 0);
  const height = data
    .slice(IHDR_OFFSET + 12, IHDR_OFFSET + 16)
    .reduce((acc, byte) => (acc << 8) | byte, 0);
  return { width, height };
}

const rehypeMermaidCtm = (options: RehypeMermaidCtmConfig = {}) => {
  return async (root: Root) => {
    const blocks: Block[] = [];
    visitParents(root, "element", (node, ancestors) => {
      if (!isMermaidElement(node)) {
        return;
      }
      const preElement = ancestors.at(-1)! as Element;
      const parent = ancestors.at(-2)! as Element;
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
    const browser = await puppeteer.launch({
      headless: true,
    });
    const outputType = options.outputType || "inline-svg";
    const outputFormat = outputType === "img-png" ? "png" : "svg";
    for (const { content, pre, parent } of blocks) {
      const { data: outputData } = await renderMermaid(
        browser,
        content,
        outputFormat,
        {
          backgroundColor: "transparent",
          mermaidConfig: {
            flowchart: {
              defaultRenderer: "elk",
            },
            ...options?.mermaidConfig,
          },
        }
      );
      const nodeIndex = parent.children.indexOf(pre);
      if (outputType === "inline-svg") {
        const svgString = Buffer.from(outputData).toString("utf-8");
        const svgHtml = fromHtmlIsomorphic(svgString);
        if (svgHtml.children.length === 0) {
          continue;
        }
        const svgElement = svgHtml.children[0] as Element;
        parent.children[nodeIndex] = makeElement(
          "div",
          {
            className: "mermaid-block",
          },
          [svgElement]
        );
      } else if (outputType === "img-svg") {
        const svgString = Buffer.from(outputData).toString("utf-8");
        const dimensions = getSvgDimensions(svgString);
        const imgElement = makeElement("img", {
          src: `data:image/svg+xml;base64,${btoa(svgString)}`,
          className: "mermaid-image",
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        });
        parent.children[nodeIndex] = makeElement(
          "div",
          {
            className: "mermaid-block",
          },
          [imgElement]
        );
      } else if (outputType === "img-png") {
        const dimensions = getPngDimensions(outputData);
        const pngString = String.fromCharCode(...outputData);
        const imgElement = makeElement("img", {
          src: `data:image/png;base64,${btoa(pngString)}`,
          className: "mermaid-image",
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        });
        parent.children[nodeIndex] = makeElement(
          "div",
          {
            className: "mermaid-block",
          },
          [imgElement]
        );
      }
    }
  };
};

export default rehypeMermaidCtm;
