import { createServerFn } from "@tanstack/react-start";
import sampleData from "#/lib/sample-resume-data.json";
import type { ResumeData } from "#/lib/types";

const resumeSchema = {
	type: "object",
	properties: {
		basics: {
			type: "object",
			properties: {
				name: { type: "string" },
				phone: { type: "string" },
				email: { type: "string" },
				links: {
					type: "array",
					items: {
						type: "object",
						properties: {
							label: { type: "string" },
							url: { type: "string" },
						},
						required: ["label", "url"],
						additionalProperties: false,
					},
				},
				location: { type: "string" },
				title: { type: "string" },
				summary: { type: "string" },
			},
			required: ["name", "phone", "email", "links", "location", "summary"],
			additionalProperties: false,
		},
		sections: {
			type: "array",
			items: {
				type: "object",
				properties: {
					id: { type: "string" },
					title: { type: "string" },
					type: { type: "string", enum: ["timeline", "freeform"] },
					items: { type: "array" },
				},
				required: ["id", "title", "type", "items"],
				additionalProperties: false,
				oneOf: [
					{
						type: "object",
						properties: {
							id: { type: "string" },
							title: { type: "string" },
							type: { const: "timeline" },
							items: {
								type: "array",
								items: {
									type: "object",
									properties: {
										organization: { type: "string" },
										location: { type: "string" },
										dateStart: { type: "string" },
										dateEnd: { type: "string" },
										role: { type: "string" },
										highlights: {
											type: "array",
											items: { type: "string" },
										},
									},
									required: [
										"organization",
										"dateStart",
										"dateEnd",
										"role",
										"highlights",
									],
									additionalProperties: false,
								},
							},
						},
						required: ["id", "title", "type", "items"],
					},
					{
						type: "object",
						properties: {
							id: { type: "string" },
							title: { type: "string" },
							type: { const: "freeform" },
							items: {
								type: "array",
								items: {
									type: "object",
									properties: {
										label: { type: "string" },
										text: { type: "string" },
									},
									required: ["label", "text"],
									additionalProperties: false,
								},
							},
						},
						required: ["id", "title", "type", "items"],
					},
				],
			},
		},
	},
	required: ["basics", "sections"],
	additionalProperties: false,
};

const SYSTEM_PROMPT = `You are a resume data extraction engine. Given raw text extracted from a PDF resume, produce a JSON object matching the exact schema below.

Rules:
- Extract ALL information from the resume text. Do not invent or hallucinate data.
- For sections, use stable URL-safe id values: "work" for work experience, "education" for education, "skills" for skills, "other" for miscellaneous.
- Timeline sections are for chronological entries (work, education, volunteering). Freeform sections are for lists (skills, certifications, languages).
- If a field is missing from the resume, use an empty string or empty array.
- The "title" field in basics is the person's job title/headline (e.g., "Senior Software Engineer").
- The "summary" field is a professional summary/objective if present. If not in the resume, generate a brief one from context.
- dateStart/dateEnd should preserve the original format (e.g., "Jan 2023", "2020", "Present").
- highlights are bullet points of achievements/responsibilities for each entry.
- Respond ONLY with valid JSON. No markdown fences, no explanation, just the raw JSON object.

Example input (abbreviated):
"John Doe | john.doe@example.com | +1-555-019-8372 | San Francisco, CA
Senior Mobile Engineer
Work Experience: Lead Mobile Engineer at FinTech Global (Jan 2023 - Present) ..."

Example output:
${JSON.stringify(sampleData, null, 2)}`;

function extractJsonFromText(text: string): ResumeData | null {
	const jsonMatch = text.match(/\{[\s\S]*\}/);
	if (!jsonMatch) return null;
	try {
		return JSON.parse(jsonMatch[0]) as ResumeData;
	} catch {
		return null;
	}
}

function isAnthropic(baseUrl: string): boolean {
	return baseUrl.includes("anthropic.com");
}

async function callAnthropic(
	apiKey: string,
	baseUrl: string,
	model: string,
	text: string,
): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
	const url = `${baseUrl.replace(/\/+$/, "")}/messages`;

	let response: Response;
	try {
		response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
			},
			body: JSON.stringify({
				model,
				max_tokens: 4096,
				system: SYSTEM_PROMPT,
				messages: [{ role: "user", content: text }],
				temperature: 0.1,
			}),
		});
	} catch {
		return {
			ok: false,
			error: "Network error. Check your connection and try again.",
		};
	}

	if (response.status === 401) {
		return {
			ok: false,
			error: "Invalid API key. Check your key and try again.",
		};
	}
	if (response.status === 429) {
		return { ok: false, error: "Rate limited. Wait a moment and try again." };
	}
	if (!response.ok) {
		const errBody = await response.text().catch(() => "");
		console.error(
			"[extract-resume] Anthropic non-ok:",
			response.status,
			errBody,
		);
		return {
			ok: false,
			error: `API error (${response.status}): ${errBody.slice(0, 200)}`,
		};
	}

	const rawText = await response.text();

	try {
		const json = JSON.parse(rawText);
		const content = json.content?.[0]?.text;
		if (!content) {
			console.error(
				"[extract-resume] Anthropic unexpected response:",
				rawText.slice(0, 500),
			);
			return { ok: false, error: "Empty response from Claude. Try again." };
		}
		return { ok: true, content };
	} catch {
		console.error(
			"[extract-resume] Anthropic parse error, raw:",
			rawText.slice(0, 500),
		);
		return {
			ok: false,
			error: `Failed to parse API response: ${rawText.slice(0, 200)}`,
		};
	}
}

async function callOpenAICompatible(
	apiKey: string,
	baseUrl: string,
	model: string,
	text: string,
): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
	const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
	const isOpenAI = baseUrl.includes("openai.com");

	const body: Record<string, unknown> = {
		model,
		messages: [
			{ role: "system", content: SYSTEM_PROMPT },
			{ role: "user", content: text },
		],
		temperature: 0.1,
		stream: false,
	};

	if (isOpenAI) {
		body.response_format = {
			type: "json_schema",
			json_schema: {
				name: "ResumeData",
				strict: true,
				schema: resumeSchema,
			},
		};
	}

	let response: Response;
	try {
		response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify(body),
		});
	} catch {
		return {
			ok: false,
			error: "Network error. Check your connection and try again.",
		};
	}

	if (response.status === 401) {
		return {
			ok: false,
			error: "Invalid API key. Check your key and try again.",
		};
	}
	if (response.status === 429) {
		return { ok: false, error: "Rate limited. Wait a moment and try again." };
	}

	const rawText = await response.text();

	if (!response.ok) {
		console.error(
			"[extract-resume] non-ok:",
			response.status,
			rawText.slice(0, 500),
		);
		return {
			ok: false,
			error: `API error (${response.status}): ${rawText.slice(0, 200)}`,
		};
	}

	try {
		const json = JSON.parse(rawText);
		const content = json.choices?.[0]?.message?.content;
		if (!content) {
			console.error(
				"[extract-resume] unexpected response:",
				rawText.slice(0, 500),
			);
			return { ok: false, error: "Empty response from model. Try again." };
		}
		return { ok: true, content };
	} catch {
		// SSE fallback: some providers return streaming format even with stream:false
		if (rawText.includes("data: ")) {
			const chunks = rawText
				.split("\n")
				.filter((line) => line.startsWith("data: ") && line !== "data: [DONE]")
				.map((line) => line.slice(6));
			try {
				let combined = "";
				for (const chunk of chunks) {
					const parsed = JSON.parse(chunk);
					const delta =
						parsed.choices?.[0]?.delta?.content ??
						parsed.choices?.[0]?.message?.content ??
						"";
					combined += delta;
				}
				if (combined) return { ok: true, content: combined };
			} catch (e2) {
				console.error("[extract-resume] SSE parse also failed:", e2);
			}
		}
		console.error("[extract-resume] parse error, raw:", rawText.slice(0, 500));
		return {
			ok: false,
			error: `Failed to parse API response: ${rawText.slice(0, 200)}`,
		};
	}
}

interface ExtractInput {
	text: string;
	apiKey: string;
	baseUrl: string;
	model: string;
}

export const extractResumeData = createServerFn({ method: "POST" })
	.validator((data: ExtractInput) => data)
	.handler(async ({ data }) => {
		const { text, apiKey, baseUrl, model } = data;

		if (!text.trim()) {
			return {
				success: false as const,
				error: "No text found in PDF. It may be a scanned image.",
			};
		}

		const llmResult = isAnthropic(baseUrl)
			? await callAnthropic(apiKey, baseUrl, model, text)
			: await callOpenAICompatible(apiKey, baseUrl, model, text);

		if (!llmResult.ok) {
			return { success: false as const, error: llmResult.error };
		}

		let result: ResumeData | null = null;
		try {
			result = JSON.parse(llmResult.content) as ResumeData;
		} catch {
			result = extractJsonFromText(llmResult.content);
		}

		if (!result?.basics || !result?.sections) {
			console.error(
				"[extract-resume] Incomplete data. Raw content:",
				llmResult.content.slice(0, 500),
			);
			return {
				success: false as const,
				error: "LLM returned incomplete data. Try again.",
			};
		}

		return { success: true as const, data: result };
	});
