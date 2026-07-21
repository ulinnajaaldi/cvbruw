import {
	Document,
	Link,
	Page,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";

type ResumeData = {
	basics: {
		name: string;
		phone?: string;
		email?: string;
		links?: { label: string; url: string }[];
		location?: string;
		summary?: string;
	};
	sections: {
		id: string;
		title: string;
		type: "timeline" | "freeform";
		items: any[];
	}[];
};

const MM = 2.83465;

const s = StyleSheet.create({
	page: {
		fontFamily: "Helvetica",
		fontSize: 10.5,
		paddingHorizontal: 7 * MM,
		paddingTop: 12 * MM,
		paddingBottom: 13 * MM,
	},
	name: {
		fontSize: 19,
		fontWeight: "bold",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		textAlign: "center",
	},
	contact: {
		fontSize: 10.5,
		marginTop: 4,
		textAlign: "center",
	},
	location: {
		fontSize: 10.5,
		textAlign: "center",
	},
	divider: {
		borderTopWidth: 1,
		borderTopColor: "black",
		marginTop: 6,
		marginBottom: 6,
	},
	summary: {
		fontSize: 10.5,
		textAlign: "justify",
		lineHeight: 1.22,
	},
	section: {
		marginTop: 8,
	},
	sectionTitle: {
		fontSize: 11,
		fontWeight: "bold",
		borderBottomWidth: 1,
		borderBottomColor: "black",
		paddingBottom: 2,
		marginBottom: 6,
	},
	timelineHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		fontSize: 10.5,
		fontWeight: "bold",
	},
	role: {
		fontSize: 10.5,
		fontStyle: "italic",
		marginBottom: 2,
	},
	bulletList: {
		fontSize: 10.5,
		lineHeight: 1.22,
	},
	bulletItem: {
		marginBottom: 2,
	},
	freeform: {
		fontSize: 10.5,
		lineHeight: 1.22,
		marginBottom: 4,
	},
	freeformLabel: {
		fontWeight: "bold",
	},
	separator: {
		marginHorizontal: 6,
	},
	contactPart: {
		flexDirection: "row",
		alignItems: "center",
	},
	link: {
		color: "black",
		textDecoration: "none",
		fontSize: 10.5,
	},
});

function ContactLine({ basics }: { basics: ResumeData["basics"] }) {
	const parts: { type: "text" | "link"; value: string; url?: string }[] = [];
	if (basics.phone) parts.push({ type: "text", value: basics.phone });
	if (basics.email) parts.push({ type: "text", value: basics.email });
	for (const link of basics.links ?? []) {
		parts.push({ type: "link", value: link.label, url: link.url });
	}

	return (
		<View style={{ flexDirection: "row", justifyContent: "center", flexWrap: "wrap" }}>
			{parts.map((part, i) => (
				<View key={i} style={s.contactPart}>
					{i > 0 && <Text style={s.separator}>|</Text>}
					{part.type === "link" ? (
						<Link src={part.url!} style={s.link}>
							{part.value}
						</Link>
					) : (
						<Text>{part.value}</Text>
					)}
				</View>
			))}
		</View>
	);
}

function TimelineEntry({ item }: { item: any }) {
	return (
		<View style={{ marginBottom: 6 }}>
			<View style={s.timelineHeader}>
				<Text>
					{item.organization}
					{item.location ? ` - ${item.location}` : ""}
				</Text>
				<Text>
					{item.dateStart} - {item.dateEnd}
				</Text>
			</View>
			<Text style={s.role}>{item.role}</Text>
			<View style={s.bulletList}>
				{(item.highlights ?? []).map((h: string, j: number) => (
					<Text key={j} style={s.bulletItem}>
						{"  \u2022  "}
						{h}
					</Text>
				))}
			</View>
		</View>
	);
}

function FreeformEntry({ item }: { item: any }) {
	return (
		<Text style={s.freeform}>
			<Text style={s.freeformLabel}>{item.label}: </Text>
			{item.text}
		</Text>
	);
}

function ResumeSection({ section }: { section: ResumeData["sections"][0] }) {
	return (
		<View style={s.section}>
			<Text style={s.sectionTitle}>{section.title}</Text>
			{section.type === "freeform"
				? section.items.map((item, i) => <FreeformEntry key={i} item={item} />)
				: section.items.map((item, i) => <TimelineEntry key={i} item={item} />)}
		</View>
	);
}

export function ResumeDocument({ data }: { data: ResumeData }) {
	return (
		<Document>
			<Page size="A4" style={s.page}>
				<Text style={s.name}>{data.basics.name}</Text>
				<View style={s.contact}>
					<ContactLine basics={data.basics} />
				</View>
				<Text style={s.location}>{data.basics.location}</Text>
				<View style={s.divider} />
				<Text style={s.summary}>{data.basics.summary}</Text>
				{data.sections.map((section) => (
					<ResumeSection key={section.id} section={section} />
				))}
			</Page>
		</Document>
	);
}
