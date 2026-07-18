export async function extractTextFromPdf(file: File): Promise<string> {
	const pdfjsLib = await import("pdfjs-dist");
	pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

	const buffer = await file.arrayBuffer();
	const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

	let fullText = "";
	for (let i = 1; i <= pdf.numPages; i++) {
		const page = await pdf.getPage(i);
		const content = await page.getTextContent();
		const pageText = content.items
			.filter((item) => "str" in item)
			.map((item) => (item as { str: string }).str)
			.join(" ");
		fullText += `${pageText}\n`;
	}

	return fullText.trim();
}
