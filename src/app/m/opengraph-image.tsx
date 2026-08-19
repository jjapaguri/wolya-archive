import {
  ogImageAlt as alt,
  ogImageSize as size,
  ogImageContentType as contentType,
  renderOgImage,
} from "@/lib/og-image";

export { alt, size, contentType };

export default function Image() {
  return renderOgImage();
}
