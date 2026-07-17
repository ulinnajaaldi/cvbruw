import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { ResumeDocument } from "./template";

export async function renderResumePdf(data, outputPath) {
	const fs = await import("node:fs");
	const buffer = await renderToBuffer(createElement(ResumeDocument, { data }));
	fs.writeFileSync(outputPath, buffer);
	return outputPath;
}

export { ResumeDocument };
