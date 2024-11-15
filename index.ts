import { type Root, Element } from "hast"
import { type Plugin } from "unified"

import mermaid from "mermaid";
import { visitParents } from "unist-util-visit-parents";
import puppeteer from "puppeteer";
import { renderMermaid } from "@mermaid-js/mermaid-cli";

interface RehypeMermaidCtmConfig {
    mermaidConfig: Parameters<typeof mermaid.initialize>[0] | undefined
}

interface Block {
    content: string,
    pre: Element,
    parent: Element
}

function isMermaidElement(node: Element): boolean {
    if(node.tagName !== "code"){
        return false;
    }
    let className = node.properties.className;
    if(typeof className === "string"){
        className = className.split(" ");
    }
    if(!Array.isArray(className)){
        return false;
    }
    return className.includes("language-mermaid");
}

const rehypeMermaidCtm: Plugin<[RehypeMermaidCtmConfig?], Root> = (options) => {
    return async (root) => {
        const blocks: Block[] = [];
        visitParents(root, "element", (node, ancestors) => {
            if(!isMermaidElement(node)){
                return;
            }
            const preElement = ancestors.at(-1)! as Element;
            const parent = ancestors.at(-2)! as Element;
            if(preElement.tagName === "pre"){
                const child = node.children[0];
                if(child.type === "text"){
                    blocks.push({
                        content: child.value,
                        pre: preElement,
                        parent: parent
                    })
                }
            }
        });
        if(blocks.length === 0){
            return;
        }
        const browser = await puppeteer.launch({
            headless: true
        });
        for(const {content, pre, parent} of blocks){
            const {data: svgData} = await renderMermaid(browser, content, "svg", {
                mermaidConfig: {
                    flowchart: {
                        defaultRenderer: "elk"
                    },
                    ...options?.mermaidConfig,
                }
            });
            const nodeIndex = parent.children.indexOf(pre);
            parent.children[nodeIndex] = {
                type: "element",
                tagName: "div",
                properties: {
                    className: "mermaid-block"
                },
                children: [{
                    type: "text",
                    value: svgData.toString()
                }]
            };
        }
    };
};

export default rehypeMermaidCtm;