import { parse } from "https://deno.land/std@0.204.0/flags/mod.ts";

type Dimension = string;
type DimensionKey = string;

type Clue = {
	[key: DimensionKey]: Dimension;
};

type Clues = Array<Clue>;

type ByDimension = {
	[key: Dimension]: Clues;
};

let flags = parse(Deno.args, {
	string: ["dimension", "no", "yes"],
	collect: ["dimension", "no", "yes"],
	alias: {
		dimension: "d",
		no: "n",
		yes: "y",
	},
});

let dimensions: Array<Array<Dimension>> = flags.dimension.map((
	a: Dimension,
): Array<Dimension> => a.split(","));

let negatives: Clues = flags.no.map(mapClue);

let positives: Clues = flags.yes.map(mapClue);

let possibilities: Clues = dimensions
	.reduce(
		(
			res: Clues,
			dimension: Array<Dimension>,
			i: number,
		): Clues =>
			dimension.map((d: Dimension) =>
				i === 0
					? {
						0: d,
					}
					: res.map((p: Clue): Clue => ({ [i]: d, ...p }))
			)
				.flat(),
		[],
	);

possibilities = possibilities
	.filter(
		filterClues(negatives, false),
	)
	.filter(
		filterClues(positives, true),
	);

let sets: ByDimension = {};

for (let p of possibilities) {
	for (let d of Object.keys(p)) {
		sets[p[d]] ??= [];

		sets[p[d]].push(p);
	}
}

let oneOffs: Set<Clue> = new Set();
let repeats: Set<Clue> = new Set();

for (let set of Object.values(sets)) {
	if (set.length === 1) {
		oneOffs.add(set[0]);

		repeats.delete(set[0]);
	} else {
		for (let v of set) {
			if (!oneOffs.has(v)) {
				repeats.add(v);
			}
		}
	}
}

for (let c of oneOffs) {
	inform(Object.values(c).join(" "));
}

for (let c of repeats) {
	log(Object.values(c).join(" "));
}

for (let c of positives) {
	let match = possibilities.find((p: Clue): boolean =>
		countSharedDimensions(p, c) === Object.keys(c).length
	);

	if (!match) {
		warn(`no match found for ${Object.values(c).join(" ")}`);
	}
}

function mapClue(value: string): Clue {
	let clue: Clue = {};

	loop:
	for (let v of value.split(",")) {
		for (let i = 0; i < dimensions.length; i++) {
			if (dimensions[i].includes(v)) {
				clue[i] = v;

				continue loop;
			}
		}

		throw new Error(`invalid dimension "${v}"`);
	}

	return clue;
}

function filterClues(
	clues: Clues,
	has: boolean,
): (p: Clue) => boolean {
	return (p: Clue): boolean => {
		for (let c of clues) {
			let i = countSharedDimensions(p, c);
			let len = Object.keys(c).length;

			switch (has) {
				case false:
					if (i == len) {
						return false;
					}
					break;

				case true:
					if ((i > 0 || len === 1) && i !== len) {
						return false;
					}
					break;
			}
		}

		return true;
	};
}

function countSharedDimensions(a: Clue, b: Clue) {
	let i = 0;

	for (let k in a) {
		if (b[k] === a[k]) {
			i += 1;
		}
	}

	return i;
}

function warn(msg: string) {
	console.warn(`%c${msg}`, "color: red");
}

function inform(msg: string) {
	console.log(`%c${msg}`, "color: blue");
}

function log(msg: string) {
	console.log(msg);
}
