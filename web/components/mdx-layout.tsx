import "@app/mdx.css";

export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return <div className="mdx-content">{children}</div>;
}
