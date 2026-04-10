import * as fs from "node:fs";

await Bun.build({
  entrypoints: ['src/index.ts'],
  outdir: '.',
});

try {
  const js = fs.readFileSync("index.js").toString()
  const html = fs.readFileSync("index.html").toString();

  const breakIndex = html.lastIndexOf("</body>");
  const dist = html.substring(0, breakIndex) + "<script>" + js + "</script>" + html.substring(breakIndex);

  if (!fs.existsSync("dist")) fs.mkdirSync("dist");
  fs.writeFileSync("dist/index.html", dist)
} finally {
  // Clean up
  fs.unlink("index.js", (err) => {
    if (err) throw err;
  })
}


