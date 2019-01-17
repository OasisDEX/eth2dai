export function ignoreDuringVisualRegression(storyCreator: () => any) {
  if (!navigator.userAgent.match(/Chromatic/)) {
    storyCreator();
  }
}
