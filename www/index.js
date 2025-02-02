import {
	print as _print,
	test as _test
} from "./lib.js";  
import {virtual} from "../devClient.js";

const print = virtual(_print);
const test = virtual(_test);

class Test {
	constructor(value) {
		this.value = value;
	}
}

print(typeof Test, Test.name, Test.length, Test.toString());

const fun = () => undefined;
print(typeof fun, fun.name, fun.length, fun.toString());

window.addEventListener("pointerup", () => {
	print(test());
});
