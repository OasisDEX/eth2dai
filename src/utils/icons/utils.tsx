import * as React from 'react';

export function SvgImage({ image }: { image: string }) {
  return <div dangerouslySetInnerHTML={{ __html: loadDataUrl(image) }} />;
}

export function loadDataUrl(dataUrl: string): string {
  const a = dataUrl.match(/^data:.*?;base64,(.*)$/);
  if (!a) {
    throw new Error(`malformed data url: ${dataUrl.substr(0, 30)} ...`);
  }
  return atob(a[1]);
}
