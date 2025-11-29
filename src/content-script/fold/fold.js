const container = document.createElement("div")
document.body.appendChild(container)

// create shadow dom
const shadow = box.attachShadow({ mode: "open" })
const html = await fetch("./component.html").then((r) => r.text())
shadow.innerHTML = html
