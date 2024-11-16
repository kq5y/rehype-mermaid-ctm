# rehype-mermaid-ctm

A rehype plugin that uses `mermaid-cli` to generate mermaids inspired by [rehype-mermaid](https://github.com/remcohaszing/rehype-mermaid/)

## Usage

```shell
pnpm add https://github.com/kq5y/rehype-mermaid-ctm
```

## Options

- `outputType`: Output Method (`"inline-svg" | "img-svg" | "img-png"`)
- `imgAsyncLazy`: When the output method starts with `img-`, add `decoding="async"` and `loading="lazy"` to the element. (`true | false`)
- `mermaidConfig`: Override config passed to `mermaid.initialize`

## License

[MIT License](LICENSE)
