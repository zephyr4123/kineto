/** 一个照搬来的 SVG 图标，按长边缩到 size */
export const Glyph: React.FC<{ icon: { width: number; height: number; body: string }; size: number; style?: React.CSSProperties }> = ({
  icon,
  size,
  style,
}) => {
  const ratio = icon.width / icon.height;
  return (
    <svg
      viewBox={`0 0 ${icon.width} ${icon.height}`}
      width={ratio >= 1 ? size : size * ratio}
      height={ratio >= 1 ? size / ratio : size}
      style={{ flexShrink: 0, ...style }}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: 图标是构建时照搬的固定 SVG，不来自外部输入
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
};
