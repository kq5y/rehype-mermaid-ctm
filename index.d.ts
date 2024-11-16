import type { Root } from "hast";
import mermaid from "mermaid";
type OutputType = "inline-svg" | "img-svg" | "img-png";
interface RehypeMermaidCtmConfig {
    outputType?: OutputType;
    imgAsyncLazy?: boolean;
    mermaidConfig?: Parameters<typeof mermaid.initialize>[0];
}
declare const rehypeMermaidCtm: (options?: RehypeMermaidCtmConfig) => (root: Root) => Promise<void>;
export default rehypeMermaidCtm;
