function drawDiagonalLine() {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");

	const vh = window.innerHeight;

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	ctx.strokeStyle = "#e3e3e2";
	ctx.lineWidth = 2;

	const lines = [
		{ startX: 0, startY: 0, endX: 0.975 * vh, endY: 0.975 * vh },
		{ startX: 0, startY: 0.08 * vh, endX: 0.875 * vh, endY: 0.955 * vh },
		{ startX: 0.08 * vh, startY: 0, endX: 0.875 * vh, endY: 0.795 * vh },
		{ startX: canvas.width, startY: canvas.height, endX: canvas.width - 0.975 * vh, endY: canvas.height - 0.975 * vh },
		{ startX: canvas.width, startY: canvas.height - 0.08 * vh, endX: canvas.width - 0.795 * vh, endY: canvas.height - 0.875 * vh },
		{ startX: canvas.width - 0.08 * vh, startY: canvas.height, endX: canvas.width - 0.955 * vh, endY: canvas.height - 0.875 * vh }
	];

	lines.forEach(line => {
		ctx.beginPath();
		ctx.moveTo(line.startX, line.startY);
		ctx.lineTo(line.endX, line.endY);
		ctx.stroke();
	});

	const circles = [
		{ x: 0, y: 0, radius: 55 * vh / 100, startAngle: 0.5 * Math.PI, endAngle: Math.PI, anticlockwise: true },
		{ x: 0, y: 0, radius: 56 * vh / 100, startAngle: 0.5 * Math.PI, endAngle: Math.PI, anticlockwise: true },
		{ x: canvas.width, y: canvas.height, radius: 55 * vh / 100, startAngle: -0.5 * Math.PI, endAngle: 0, anticlockwise: true },
		{ x: canvas.width, y: canvas.height, radius: 56 * vh / 100, startAngle: -0.5 * Math.PI, endAngle: 0, anticlockwise: true }
	];

	circles.forEach(circle => {
		ctx.beginPath();
		ctx.arc(circle.x, circle.y, circle.radius, circle.startAngle, circle.endAngle, circle.anticlockwise);
		ctx.stroke();
	});

	return canvas.toDataURL("image/png");
}

document.body.style.backgroundImage = `url(${drawDiagonalLine()})`;
document.body.style.backgroundRepeat = "no-repeat";
document.body.style.backgroundPosition = "top left";
