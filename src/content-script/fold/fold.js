export async function attachAndCreateFoldPopup(shadowHost) {
  // create shadow dom
  const shadow = shadowHost.attachShadow({ mode: "open" })
  // TODO
  const html = await fetch("fold/component.html").then((r) => r.text())
  shadow.innerHTML = html
}
