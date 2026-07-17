import { createServerFn } from "@tanstack/react-start";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { ResumeDocument } from "../../../packages/generator/src/template";
import type { ResumeData } from "#/lib/types";

export const generatePdf = createServerFn({ method: "POST" })
	.validator((data: ResumeData) => data)
	.handler(async ({ data }) => {
		const buffer = await renderToBuffer(createElement(ResumeDocument, { data }));
		return { pdf: Buffer.from(buffer).toString("base64") };
	});
