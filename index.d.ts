import { type Root } from "hast";
import mermaid from "mermaid";
interface RehypeMermaidCtmConfig {
    mermaidConfig?: Parameters<typeof mermaid.initialize>[0];
}
declare const rehypeMermaidCtm: (options?: RehypeMermaidCtmConfig) => (root: Root) => Promise<void>;
export default rehypeMermaidCtm;
