import { createServerFn } from "@tanstack/react-start";
import type { ResumeData } from "#/lib/types";

interface AIGenerateRequest {
	resumeData: ResumeData;
	skillInstructions: string;
	context?: string;
	providerId: string;
	apiKey: string;
	baseUrl: string;
	model: string;
}

export interface AISuggestion {
	id: string;
	sectionId: string;
	itemId?: number;
	field?: string;
	currentValue: string;
	suggestedValue: string;
	reason: string;
}

interface AIGenerateResponse {
	suggestions: AISuggestion[];
	error?: string;
}

const SYSTEM_PROMPT = `You are an expert resume writer and career coach. You help users improve their resumes by providing specific, actionable suggestions.

When given a resume and improvement instructions, you must:
1. Analyze the resume content against the provided skill/guidelines
2. Identify specific areas for improvement
3. Provide concrete suggestions with before/after examples
4. Focus on impact, clarity, and ATS optimization

Output your suggestions as a JSON array with this exact structure:
[
  {
    "id": "unique-id",
    "sectionId": "section-id-from-resume",
    "itemId": 0,
    "field": "highlights",
    "currentValue": "original text",
    "suggestedValue": "improved text",
    "reason": "Why this change improves the resume"
  }
]

Rules:
- Only suggest improvements, don't rewrite the entire resume
- Keep suggestions focused and specific
- Each suggestion should be independently accept/rejectable
- Use the same language and tone as the original
- Don't invent metrics - if you suggest adding metrics, mark them as [suggest metric]
- Maximum 10 suggestions per request
- Return ONLY the JSON array, no other text`;

export const generateAISuggestions = createServerFn({ method: "POST" })
	.validator((data: AIGenerateRequest) => data)
	.handler(async ({ data }): Promise<AIGenerateResponse> => {
		const {
			resumeData,
			skillInstructions,
			context,
			providerId,
			apiKey,
			baseUrl,
			model,
		} = data;

		if (!apiKey) {
			return { suggestions: [], error: "API key is required" };
		}

		const userMessage = `Here is the resume to improve:

${JSON.stringify(resumeData, null, 2)}

${skillInstructions ? `\n\nSkill/Guidelines:\n${skillInstructions}` : ""}

${context ? `\n\nSpecific request: ${context}` : ""}

Please provide suggestions for improvement as a JSON array.`;

		try {
			let suggestions: AISuggestion[] = [];

			if (providerId === "claude" || baseUrl.includes("anthropic.com")) {
				suggestions = await callAnthropic(apiKey, baseUrl, model, userMessage);
			} else {
				suggestions = await callOpenAICompatible(
					apiKey,
					baseUrl,
					model,
					userMessage,
				);
			}

			return { suggestions };
		} catch (err) {
			return {
				suggestions: [],
				error: err instanceof Error ? err.message : String(err),
			};
		}
	});

async function callAnthropic(
	apiKey: string,
	baseUrl: string,
	model: string,
	userMessage: string,
): Promise<AISuggestion[]> {
	const url = `${baseUrl}/messages`;

	const response = await fetch(url, {
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
			messages: [{ role: "user", content: userMessage }],
			temperature: 0.1,
		}),
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
	}

	const result = await response.json();
	const text = result.content?.[0]?.text || "";

	return extractSuggestionsFromText(text);
}

async function callOpenAICompatible(
	apiKey: string,
	baseUrl: string,
	model: string,
	userMessage: string,
): Promise<AISuggestion[]> {
	const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model,
			messages: [
				{ role: "system", content: SYSTEM_PROMPT },
				{ role: "user", content: userMessage },
			],
			temperature: 0.1,
			stream: false,
		}),
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`API error ${response.status}: ${errorBody}`);
	}

	const rawText = await response.text();

	try {
		const json = JSON.parse(rawText);
		const text = json.choices?.[0]?.message?.content || "";
		return extractSuggestionsFromText(text);
	} catch {
		if (rawText.includes("data: ")) {
			const chunks = rawText
				.split("\n")
				.filter((line) => line.startsWith("data: ") && line !== "data: [DONE]")
				.map((line) => line.slice(6));
			let combined = "";
			for (const chunk of chunks) {
				try {
					const parsed = JSON.parse(chunk);
					const delta =
						parsed.choices?.[0]?.delta?.content ??
						parsed.choices?.[0]?.message?.content ??
						"";
					combined += delta;
				} catch {}
			}
			if (combined) return extractSuggestionsFromText(combined);
		}
		throw new Error("Failed to parse API response");
	}
}

function extractSuggestionsFromText(text: string): AISuggestion[] {
	const jsonMatch = text.match(/\[[\s\S]*\]/);
	if (!jsonMatch) {
		throw new Error("No JSON array found in AI response");
	}

	try {
		const suggestions = JSON.parse(jsonMatch[0]);
		if (!Array.isArray(suggestions)) {
			throw new Error("AI response is not an array");
		}
		return suggestions;
	} catch (err) {
		throw new Error(`Failed to parse AI suggestions: ${err}`);
	}
}
