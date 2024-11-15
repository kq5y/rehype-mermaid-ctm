"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const unist_util_visit_parents_1 = require("unist-util-visit-parents");
const puppeteer_1 = __importDefault(require("puppeteer"));
const mermaid_cli_1 = require("@mermaid-js/mermaid-cli");
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
const rehypeMermaidCtm = (options) => {
    return (root) => __awaiter(void 0, void 0, void 0, function* () {
        const blocks = [];
        (0, unist_util_visit_parents_1.visitParents)(root, "element", (node, ancestors) => {
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
                        parent: parent
                    });
                }
            }
        });
        if (blocks.length === 0) {
            return;
        }
        const browser = yield puppeteer_1.default.launch({
            headless: true
        });
        for (const { content, pre, parent } of blocks) {
            const { data: svgData } = yield (0, mermaid_cli_1.renderMermaid)(browser, content, "svg", {
                mermaidConfig: Object.assign({ flowchart: {
                        defaultRenderer: "elk"
                    } }, options === null || options === void 0 ? void 0 : options.mermaidConfig)
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
    });
};
exports.default = rehypeMermaidCtm;
