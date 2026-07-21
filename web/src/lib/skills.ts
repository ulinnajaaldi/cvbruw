import { BACK_END_FULLSTACK_SKILLS, FRONT_END_SKILLS } from "#/constants/skill";

export interface Skill {
	id: string;
	name: string;
	description: string;
	content: string;
	source: "builtin" | "custom";
}

const BUILTIN_SKILLS: Skill[] = [FRONT_END_SKILLS, BACK_END_FULLSTACK_SKILLS];

const CUSTOM_SKILLS_KEY = "cvbruw-custom-skills";

export function getBuiltinSkills(): Skill[] {
	return BUILTIN_SKILLS;
}

export function getCustomSkills(): Skill[] {
	try {
		const raw = localStorage.getItem(CUSTOM_SKILLS_KEY);
		if (raw) return JSON.parse(raw) as Skill[];
	} catch {}
	return [];
}

export function getAllSkills(): Skill[] {
	return [...getBuiltinSkills(), ...getCustomSkills()];
}

export function getSkillById(id: string): Skill | undefined {
	return getAllSkills().find((s) => s.id === id);
}

export function saveCustomSkill(skill: Skill): void {
	const skills = getCustomSkills();
	const existing = skills.findIndex((s) => s.id === skill.id);
	if (existing >= 0) {
		skills[existing] = skill;
	} else {
		skills.push(skill);
	}
	localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(skills));
}

export function deleteCustomSkill(id: string): void {
	const skills = getCustomSkills().filter((s) => s.id !== id);
	localStorage.setItem(CUSTOM_SKILLS_KEY, JSON.stringify(skills));
}

export function parseSkillFromMarkdown(
	markdown: string,
	filename: string,
): Skill | null {
	const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
	if (!frontmatterMatch) return null;

	const frontmatter = frontmatterMatch[1];
	const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
	const descMatch = frontmatter.match(/^description:\s*(.+)$/m);

	const name = nameMatch?.[1]?.trim() || filename.replace(/\.md$/, "");
	const description = descMatch?.[1]?.trim() || "Custom skill";
	const content = markdown.slice(frontmatterMatch[0].length).trim();

	return {
		id: `custom-${Date.now()}`,
		name,
		description,
		content,
		source: "custom",
	};
}
