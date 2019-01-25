(() => {
  const $iframe = document.getElementById("storybook-preview-iframe");
  const $doc = $iframe.contentDocument;
  const $style = $doc.createElement("style");

  $style.innerHTML = `* {
    transition: none !important;
    animation: none !important;
  }
  `;
  $doc.body.appendChild($style);

  const bodyStyle = document.createElement("style");
  bodyStyle.innerHTML = `
  .Pane.vertical.Pane1 {
    opacity: 0;
  }
  `;

  document.body.appendChild(bodyStyle);

})();
