const user = process.env.USER;
if (user == "fuchs") {
	exports.w1_prefix="./"
} else {
	exports.w1_prefix="/sys/bus/w1/devices/";
}

exports.sensors = [
{
	gpio: "xx",
	name: "n/a"
},
{
	w1_id: "28-041780cb13ff",
	name: "Wasserleitung",
	color: "blue"
},
{
	w1_id: "28-041780ced0ff",
	name: "Erde",
	color: "black"
},
{
	w1_id: "28-041780d810ff",
	name: "Außentemp",
	color: "yellow"
},
{
	w1_id: "28-041780d841ff",
	name: "Gehäuse",
	color: "white"
},
{
	w1_id: "28-041780d8e9ff",
	name: "Schacht Luft",
	color: "yellow-green"
},
{
	name: "CPU"
}
]
