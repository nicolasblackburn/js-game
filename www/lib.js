export function print(...args) {
	const messageDiv = document.getElementById('messages');
	messageDiv.innerHTML += `<p>${args.join(", ")}</p>`;
}

export function test() {
	return "yo";
}


