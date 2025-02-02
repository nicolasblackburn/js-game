import {
	print as _print,
	test as _test
} from "./Test.js";  
import {virtual} from "../devClient.js";

const print = virtual(_print);
const test = virtual(_test);

window.addEventListener("pointerup", () => {
	print(test());
});
