import { type Root } from "hast";
import { type Plugin } from "unified";
import mermaid from "mermaid";
interface RehypeMermaidCtmConfig {
    mermaidConfig: Parameters<typeof mermaid.initialize>[0] | undefined;
}
declare const rehypeMermaidCtm: Plugin<[RehypeMermaidCtmConfig?], Root>;
export default rehypeMermaidCtm;
