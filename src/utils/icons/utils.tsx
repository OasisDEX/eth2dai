import * as React from 'react';

export function SvgImage({ image, ...props }: React.HTMLAttributes<HTMLSpanElement> & { image: string }) {
  return <div dangerouslySetInnerHTML={{ __html: loadDataUrl(image) }} {...props} />;
}

export function SvgImageSimple(image: string) {
  return <SvgImage image={image} />;
}

export function loadDataUrl(dataUrl: string): string {
  const a = dataUrl.match(/^data:.*?;base64,(.*)$/);
  if (!a) {
    throw new Error(`malformed data url: ${dataUrl.substr(0, 30)} ...`);
  }
  return atob(a[1]).replace(/^\<\?xml.*?\?>\n?/, '');
}
