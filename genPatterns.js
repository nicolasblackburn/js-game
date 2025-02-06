const {log} = console;
const _log = () => undefined;

const patterns = new Set();

for (let i = 0; i < 4; i++) {
	const len = 2**i;
	const area = len ** 2;
	const count = 2**area;
	for (let j = 0; j < count; j++) {
		const mask = 2**len - 1;
		let str = "";
		for (let k = 0; k < len; k++) {
			const chunk = (j >> (2**(len - k - 1))) & mask;
			str += (str.length ? "\n" : "") + chunk.toString(2).padStart(len, "0");

		}
		log(str + "\n");
	}
}

_log(`<svg width="512" height="512" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
	<style>
		:root {
			--color-0: black;
			--color-1: white;
		}
	</style>
	<defs>
		<pattern id="" width="" height="" patternUnits="userSpaceOnUse">
			<rect width="" height="" fill="var(--color-0)" />
			<rect width="1" height="1" x="" y="" fill="var(--color-1)" />
		</pattern>
	</defs>
	<rect width="16" height="16" x="" y="" fill="url(#)">
	</rect>
</svg>`);
