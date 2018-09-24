/* Graphics util fuunctions from Tamat's SimpleCanvas
http://tamats.com/apps/simplecanvas/js/graphics.js 
Used with permission by the author */

//globals

var canvas_stack = [];
var DEG2RAD = 0.0174532925;
var RAD2DEG = 1 / 0.0174532925;
var T = 0;
var DT = 0;
var F = 0;

var mouseX = 0;
var mouseY = 0;
var MOUSE = new Float32Array(2);
var mousebutton = false;
var global_canvas_offset = [0, 0];

function offset() {
    move(global_canvas_offset[0], global_canvas_offset[1]);
}

function toLocal(x, y) {
    if (arguments.length == 1) {
        y = x[1];
        x = x[0];
    }
    var m = ctx._matrix;
    return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
}


// JS extend stuff
if (!Array.prototype.hasOwnProperty("last"))
    Object.defineProperty(Array.prototype, "last", {
        enumerable: false,
        configurable: true,
        get: function () { return this[this.length - 1]; },
        set: function (v) { this[this.length - 1] = v; }
    });

if (!Array.prototype.hasOwnProperty("random"))
    Object.defineProperty(Array.prototype, "random", {
        value: function () { return this[Math.floor(this.length * random()) % this.length]; },
        writtable: true,
        enumerable: false
    });

if (!Array.prototype.hasOwnProperty("clone"))
    Object.defineProperty(Array.prototype, "clone", {
        value: function () { return this.concat(); },
        writtable: true,
        enumerable: false
    });

if (!Array.prototype.hasOwnProperty("range"))
    Object.defineProperty(Array.prototype, "range", {
        value: function (a, b) { return this.slice(a, b); },
        writtable: true,
        enumerable: false
    });

if (!Array.prototype.hasOwnProperty("sample"))
    Object.defineProperty(Array.prototype, "sample", {
        value: function (v) {
            var l = this.length;
            if (!l) return 0;
            var i = ((l - 1) * v) | 0;
            var f = ((l - 1) * v) - i;
            if (i < 0) return this[0];
            if (i >= l - 1) return this[l - 1];
            if (f == 0)
                return this[i];
            if (this[i].constructor === Number && this[i + 1].constructor === Number)
                return this[i] * (1 - f) + this[i + 1] * f;
            var r = Array(this[i].length);
            for (var j = 0; j < r.length; ++j)
                r[j] = this[i][j] * (1 - f) + this[i + 1][j] * f;
            return r;
        },
        writtable: true,
        enumerable: false
    });

// RAND STUFF ****************************************************

//make math funcs global
var funcs = Object.getOwnPropertyNames(Math);
for (var i in funcs)
    window[funcs[i]] = Math[funcs[i]];

//fixed rand
var MAX_RAND_VALUES = 100000;
var rand_values = new Float32Array(MAX_RAND_VALUES);
for (var i = 0; i < MAX_RAND_VALUES; ++i)
    rand_values[i] = Math.random();
var last_rand_pos = 0;
var rand_seed_pos = 0;
function rand(v) {
    //if(arguments.length) return rand_values[ (v<<0) % MAX_RAND_VALUES];
    return rand_values[last_rand_pos++ % MAX_RAND_VALUES];
}
function seed(v) {
    if (v === undefined)
        v = Math.random() * MAX_RAND_VALUES;
    rand_seed_pos = last_rand_pos = (v | 0) % MAX_RAND_VALUES;
    noise.seed(v);
}
//wiggle rand
function wrand(t) {
    var v1 = (last_rand_pos + (t << 0)) % MAX_RAND_VALUES;
    var v2 = (last_rand_pos + (t << 0) + 1) % MAX_RAND_VALUES;
    var f = t - (t << 0);
    f = 0.5 - 0.5 * Math.cos(f * Math.PI); //cosine interpolation
    return rand_values[v1] * (1 - f) + rand_values[v2] * f;
}

function srand(t) {
    var v1 = Math.abs(t << 0) % MAX_RAND_VALUES;
    var v2 = Math.abs(t << 0) % MAX_RAND_VALUES;
    var f = t - (t << 0);
    f = 0.5 - 0.5 * Math.cos(f * Math.PI); //cosine interpolation
    return rand_values[v1] * (1 - f) + rand_values[v1 + 1] * f;
}

function nrand(v) { return (Math.random() * 2 - 1) * (v === undefined ? 1 : v); }


//from noise.js lib
var perlin = function (v) { return noise.perlin2(v, 0); }
var perlin2 = noise.perlin2.bind(noise);
var perlin3 = noise.perlin3.bind(noise);
var simplex = function (v) { return noise.simplex2(v, 0); }
var simplex2 = noise.simplex2.bind(noise);
var simplex3 = noise.simplex3.bind(noise);

function choose(v) { return v[Math.floor(v.length * random()) % v.length]; }
function clone(v) { return JSON.parse(JSON.stringify(v)); }

//*************** RENDERING ***************************************

var global_scale = 1;
var use_clip = false;

function clear(r, g, b, a) {
    if (arguments.length == 0) {
        //canvas.width = canvas.width; //clear
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    else if (arguments.length == 1) {
        color(r);
        fill();
    }
    else if (arguments.length == 3) {
        color(r, g, b);
        fill();
    }
    else if (arguments.length == 4) {
        color(r, g, b, a);
        fill();
    }
}

function grid(size, subs, draw_text) {
    size = Math.abs(size || 500);
    subs = subs || 20;
    var offset = Math.abs(size / subs);

    ctx.beginPath();
    for (var i = -size; i <= size; i += offset) {
        ctx.moveTo(i, -size);
        ctx.lineTo(i, size);
        ctx.moveTo(-size, i);
        ctx.lineTo(size, i);
    }
    ctx.stroke();

    if (!draw_text)
        return;

    ctx.font = "10px Tahoma";

    for (var i = -size; i <= size; i += offset) {
        ctx.fillText(i.toFixed(0), i + 3, -size - 3);
        ctx.fillText(i.toFixed(0), -size + 3, i - 3);
    }
}

function fill(c) {
    ctx.save();
    if (arguments.length)
        color.apply(this, arguments);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

function center() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(Math.abs(canvas.width * 0.5), Math.abs(canvas.height * 0.5));
    if (canvas == main_canvas)
        ctx.scale(global_scale, global_scale);
    //ctx.scale(1,-1); //reverse scale so negative Y goes down
}

function corner() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (canvas == main_canvas)
        ctx.scale(global_scale, global_scale);
    //ctx.scale(1,-1); //reverse scale so negative Y goes down
}

//build color string
function COLOR(r, g, b, a) {
    var c = null;
    if (arguments.length == 3) //r,g,b
        c = "rgba(" + ((r * 255) << 0) + "," + ((g * 255) << 0) + "," + ((b * 255) << 0) + ",1)";
    else if (arguments.length == 4) //r,g,b,a
        c = "rgba(" + ((r * 255) << 0) + "," + ((g * 255) << 0) + "," + ((b * 255) << 0) + "," + a.toFixed(3) + ")";
    else if (r.constructor == String.prototype.constructor) //string
        c = r;
    else if (r.constructor == Number.prototype.constructor) //luminance
        c = "rgba(" + ((r * 255) << 0) + "," + ((r * 255) << 0) + "," + ((r * 255) << 0) + ",1.0)";
    else if (r.length == 3) //rgb array
        c = "rgba(" + ((r[0] * 255) << 0) + "," + ((r[1] * 255) << 0) + "," + ((r[2] * 255) << 0) + ",1.0)";
    else if (r.length == 4) //rgba array
        c = "rgba(" + ((r[0] * 255) << 0) + "," + ((r[1] * 255) << 0) + "," + ((r[2] * 255) << 0) + "," + r[3].toFixed(3) + ")";
    else
        return "black";
    return c;
}

function RCOLOR() {
    return [random(), random(), random()];
}

function LUM(c) {
    return (c[0] + c[1] + c[2]) / 3.;
}

//set color
function color(r, g, b, a) {
    var c = COLOR.apply(this, arguments);
    ctx.strokeStyle = c;
    ctx.fillStyle = c;
    return c;
}

function colorHSL(h, s, l, a) {
    if (arguments.length == 3)
        return color("hsla(" + (h * 360).toFixed(3) + "," + (s * 100).toFixed(1) + "%," + (l * 100).toFixed(1) + "%,1)");
    return color("hsla(" + (h * 360).toFixed(3) + "," + (s * 100).toFixed(1) + "%," + (l * 100).toFixed(1) + "%," + a.toFixed(3) + ")");
}

function alpha(v) {
    if (v < 0) v = 0;
    ctx.globalAlpha = v;
}

function white() { color(1); }
function black() { color(0); }
function red() { color(1, 0, 0); }
function green() { color(0, 1, 0); }
function blue() { color(0, 0, 1); }
function cyan() { color(0, 1, 1); }
function yellow() { color(1, 1, 0); }
function orange() { color(1, 0.5, 0); }
function purple() { color(1, 0, 1); }
function gray() { color(0.5, 0.5, 0.5); }

function pattern(img) {
    if (img.constructor === String)
        img = image(img);
    ctx.fillStyle = ctx.createPattern(img, "repeat");
}

function blendMode(v) {
    if (v == "add" || v == "lighter" || v == "+")
        ctx.globalCompositeOperation = "lighter";
    else if (v == "subs" || v == "darker" || v == "subtract" || v == "-")
        ctx.globalCompositeOperation = "darker";
    else if (!v || v == "normal")
        ctx.globalCompositeOperation = "source-over";
    else
        ctx.globalCompositeOperation = v;
}

function line(x, y, endx, endy) {
    if (arguments.length == 1 && x.constructor == Array) {
        var points = x;
        if (!points.length)
            return;
        ctx.beginPath();
        if (points[0] != null && points[0].constructor === Number) //flat array
        {
            ctx.moveTo(points[0], points[1]);
            for (var i = 2, l = points.length; i < l; i += 2)
                ctx.lineTo(points[i], points[i + 1]);
        }
        else //array of points
        {
            ctx.moveTo(points[0][0], points[0][1]);
            for (var i = 1, l = points.length; i < l; i += 1)
                ctx.lineTo(points[i][0], points[i][1]);
        }
        if (use_clip)
            ctx.clip();
        else
            ctx.stroke();
        return;
    }

    ctx.beginPath();
    if (arguments.length == 2) {
        ctx.moveTo(0, 0);
        ctx.lineTo(x, y);
    }
    else if (arguments.length == 4) {
        ctx.moveTo(x, y);
        ctx.lineTo(endx, endy);
    }
    if (use_clip)
        ctx.clip();
    else
        ctx.stroke();
}

function arrow(x, y, endx, endy) {
    var v = normalize(endx - x, endy - y);
    var s = V2(v[1] * 0.75, -v[0] * 0.75);
    var size = ctx.lineWidth * 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endx - v[0] * size * 0.5, endy - v[1] * size * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(endx, endy);
    ctx.lineTo(endx - (1.2 * v[0] + s[0]) * size, endy - (1.2 * v[1] + s[1]) * size);
    ctx.lineTo(endx - (1.2 * v[0] - s[0]) * size, endy - (1.2 * v[1] - s[1]) * size);
    ctx.fill();
}

function move(x, y) {
    if (arguments.length == 2)
        ctx.translate(x, y);
    else if (x.length)
        ctx.translate(x[0], x[1]);
    else
        ctx.translate(x, 0);
}
var M = move;

function rotate(v) {
    ctx.rotate(-v * DEG2RAD);
}

function scale(x, y) {
    if (arguments.length == 2)
        ctx.scale(x, y);
    else
        ctx.scale(x, x);
}

function skew(anglex, angley) {
    ctx.transform(1, Math.tan((angley || 0) * DEG2RAD), Math.tan(anglex * DEG2RAD), 1, 0, 0);
}

function arc(r, angle_deg, offset_deg, filled) {
    if (r <= 0) return;
    if (arguments.length < 3) offset_deg = 0;
    ctx.beginPath();
    ctx.arc(0, 0, r, offset_deg * DEG2RAD, angle_deg * DEG2RAD);

    if (filled) {
        ctx.closePath();
        if (use_clip)
            ctx.clip();
        else
            ctx.fill();
    }
    else
        ctx.stroke();
}

function pie(r, angle_deg, offset_deg) {
    if (r <= 0) return;
    if (arguments.length < 3) offset_deg = 0;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, offset_deg * DEG2RAD, angle_deg * DEG2RAD);
    if (use_clip)
        ctx.clip();
    else
        ctx.fill();
}

function bezier(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y) {
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.bezierCurveTo(p2x, p2y, p3x, p3y, p4x, p4y);
    ctx.stroke();
}

CIRCLE = 0;
RECTANGLE = 1;
TRIANGLE = 2;

function shape(type, w, h, x, y) {
    x = x || 0;
    y = y || 0;
    ctx.beginPath();
    if (type == CIRCLE)
        ctx.arc(x, y, w, 0, 2 * Math.PI);
    else if (type == RECTANGLE)
        ctx.rect(-w * 0.5 + x, -h * 0.5 + y, w, h);
    if (use_clip)
        ctx.clip();
    else
        ctx.fill();
}

function sphere(r, x, y) {
    if (r <= 0) return;

    ctx.beginPath();
    if (arguments.length == 1)
        ctx.arc(0, 0, r, 0, 2 * Math.PI);
    else if (arguments.length == 3)
        ctx.arc(x, y, r, 0, 2 * Math.PI);

    if (use_clip)
        ctx.clip();
    else
        ctx.fill();
}
ball = sphere;

function circle(r, x, y) {
    if (r <= 0)
        return;



    ctx.beginPath();
    if (arguments.length == 1)
        ctx.arc(0, 0, r, 0, 2 * Math.PI);
    else if (arguments.length == 3)
        ctx.arc(x, y, r, 0, 2 * Math.PI);

    if (use_clip)
        ctx.clip();
    else
        ctx.stroke();
}

function square(r, x, y) {
    if (r <= 0)
        return;

    if (use_clip) {
        ctx.beginPath();
        if (arguments.length == 1)
            ctx.rect(-r * 0.5, -r * 0.5, r, r);
        else if (arguments.length == 3)
            ctx.rect(-r * 0.5 + x, -r * 0.5 + y, r, r);
        ctx.clip();
    }

    if (arguments.length == 1)
        ctx.strokeRect(-r * 0.5, -r * 0.5, r, r);
    else if (arguments.length == 3)
        ctx.strokeRect(-r * 0.5 + x, -r * 0.5 + y, r, r);
}

function rectangle(w, h, no_centered) {
    if (use_clip) {
        ctx.beginPath();
        if (no_centered)
            ctx.rect(0, 0, w, h);
        else
            ctx.rect(-w * 0.5, -h * 0.5, w, h);
        ctx.clip();
        return;
    }
    if (no_centered)
        ctx.strokeRect(0, 0, w, h);
    else
        ctx.strokeRect(-w * 0.5, -h * 0.5, w, h);
}

function lineWidth(v) {
    if (v <= 0)
        return;
    ctx.lineWidth = v;
}

function box(w, h, no_centered) {
    if (h === undefined)
        h = w;

    if (use_clip) {
        ctx.beginPath();
        if (no_centered)
            ctx.rect(0, 0, w, h);
        else
            ctx.rect(-w * 0.5, -h * 0.5, w, h);
        ctx.clip();
        return;
    }

    if (no_centered)
        ctx.fillRect(0, 0, w, h);
    else
        ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
}

function rect(x, y, w, h, fill) {
    if (use_clip) {
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        return;
    }

    if (fill)
        ctx.fillRect(x, y, w, h);
    else
        ctx.strokeRect(x, y, w, h);
}

function cube(r, x, y) {
    if (arguments.length == 1)
        ctx.fillRect(-r * 0.5, -r * 0.5, r, r);
    else if (arguments.length == 3)
        ctx.fillRect(-r * 0.5 + x, -r * 0.5 + y, r, r);
}

function shape(points, line) {
    if (!points || !points.length)
        return;

    ctx.beginPath();

    if (points[0].constructor === Number) {
        for (var i = 0; i < points.length; i += 2) {
            if (i == 0)
                ctx.moveTo(points[i], points[i + 1]);
            else
                ctx.lineTo(points[i], points[i + 1]);
        }
    }
    else {
        for (var i = 0; i < points.length; i += 1) {
            if (i == 0)
                ctx.moveTo(points[i][0], points[i][1]);
            else
                ctx.lineTo(points[i][0], points[i][1]);
        }
    }

    if (use_clip)
        return ctx.clip();

    if (line) {
        ctx.closePath();
        ctx.stroke();
    }
    else
        ctx.fill();
}

function polygon(r, sides, line) {
    if (!r || !sides)
        return;

    ctx.beginPath();
    for (var i = 0; i < sides; ++i)
        if (i == 0)
            ctx.moveTo(Math.sin(i / sides * 2 * Math.PI) * r, Math.cos(i / sides * 2 * Math.PI) * r);
        else
            ctx.lineTo(Math.sin(i / sides * 2 * Math.PI) * r, Math.cos(i / sides * 2 * Math.PI) * r);

    if (use_clip)
        return ctx.clip();

    if (line) {
        ctx.closePath();
        ctx.stroke();
    }
    else
        ctx.fill();
}

function triangle(r, line) {
    polygon(r, 3, line)
}

function star(in_r, out_r, sides, line) {
    if (arguments.length < 3)
        return;

    ctx.beginPath();
    for (var i = 0; i < sides; ++i) {
        if (i == 0)
            ctx.moveTo(Math.sin(i / sides * 2 * Math.PI) * in_r, Math.cos(i / sides * 2 * Math.PI) * in_r);
        else
            ctx.lineTo(Math.sin(i / sides * 2 * Math.PI) * in_r, Math.cos(i / sides * 2 * Math.PI) * in_r);
        ctx.lineTo(Math.sin((i + 0.5) / sides * 2 * Math.PI) * out_r, Math.cos((i + 0.5) / sides * 2 * Math.PI) * out_r);
    }
    if (line) {
        ctx.closePath();
        ctx.stroke();
    }
    else
        ctx.fill();
}

var gauss_image = null;
var last_gauss_color = null;
function gauss(radius, x, y) {
    x = x || 0;
    y = y || 0;
    if (!gauss_image) {
        var canv = gauss_image = document.createElement("canvas");
        canv.width = canv.height = 256;
        var _ctx = canv.getContext("2d");
        var pixels = _ctx.getImageData(0, 0, 256, 256);

        var data = pixels.data;
        for (var i = 0; i < 256; ++i)
            for (var j = 0; j < 256; ++j) {
                var pos = (i * 256 + j) * 4;
                var f = Math.sqrt((i - 128) * (i - 128) + (j - 128) * (j - 128)) / 128;
                data.set([255, 255, 255, 255 - f * 255], pos);
            }
        _ctx.putImageData(pixels, 0, 0);
    }

    if (last_gauss_color != ctx.fillStyle) {
        var _ctx = gauss_image.getContext("2d");
        _ctx.globalCompositeOperation = "source-in";
        _ctx.fillStyle = ctx.fillStyle;
        _ctx.fillRect(0, 0, gauss_image.width, gauss_image.height);
        _ctx.globalCompositeOperation = "source-over";
    }

    ctx.drawImage(gauss_image, 0, 0, gauss_image.width, gauss_image.height, x - radius * 0.5, y - radius * 0.5, radius, radius);
}

function clip(callback) {
    if (!callback)
        return;
    use_clip = true;
    callback();
    use_clip = false;
}

function viewport(x, y, w, h) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
}

/****** 3D ***********************/
function V2(x, y) {
    if (arguments.length == 2)
        return new Float32Array([x, y]);
    else if (arguments.length == 1)
        return new Float32Array(x);
    return new Float32Array(2);
}

function V3(x, y, z) {
    if (arguments.length == 3)
        return new Float32Array([x, y, z]);
    else if (arguments.length == 1)
        return new Float32Array(x);
    return new Float32Array(3);
}

function V4(x, y, z, w) {
    if (arguments.length == 3)
        return new Float32Array([x, y, z, 1]);
    else if (arguments.length == 1)
        return new Float32Array(x);
    return new Float32Array(4);
}

function line3D(start, end) {
    var a = project3D(start);
    var b = project3D(end);
    //if(a[2] < 0 && b[2] < 0) return;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
}

function lines3D(array, line_strip) {
    var a = V3();
    var b = V3();

    if (line_strip) {
        project3D(array[0], a);
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        for (var i = 1; i < array.length; i += 1) {
            project3D(array[i], a);
            ctx.lineTo(a[0], a[1]);
        }
        ctx.stroke();
    }
    else {
        ctx.beginPath();
        for (var i = 0; i < array.length - 1; i += 2) {
            project3D(array[i], a);
            project3D(array[i + 1], b);
            if (a[2] < 0 && b[2] < 0) continue;
            ctx.moveTo(a[0], a[1]);
            ctx.lineTo(b[0], b[1]);
        }
        ctx.stroke();
    }
}

function cube3D(size) {
    var hs = size * 0.5;
    lines3D([[-hs, -hs, -hs], [hs, -hs, -hs], [-hs, -hs, hs], [hs, -hs, hs], [-hs, hs, hs], [hs, hs, hs], [-hs, hs, -hs], [hs, hs, -hs], [-hs, -hs, hs], [-hs, hs, hs], [hs, -hs, hs], [hs, hs, hs], [-hs, -hs, -hs], [-hs, hs, -hs], [hs, -hs, -hs], [hs, hs, -hs], [-hs, -hs, -hs], [-hs, -hs, hs], [-hs, hs, -hs], [-hs, hs, hs], [hs, -hs, -hs], [hs, -hs, hs], [hs, hs, -hs], [hs, hs, hs]]);
}

function sphere3D(r, a, stroke) {
    a = a || [0, 0, 0];
    m = mvp_matrix;
    var out = V3();

    var x = a[0], y = a[1], z = a[2];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    var w = m[3] * x + m[7] * y + m[11] * z + m[14];
    out[0] = out[0] / out[2] * canvas.width;
    out[1] = 1 - out[1] / out[2] * canvas.height;
    //out[2] = out[2] / w;
    //r = 250 * r / w;

	/*
	if(model_matrix[0] > model_matrix[1] && model_matrix[0] > model_matrix[2])
		r*= model_matrix[0];
	else if (model_matrix[1] > model_matrix[2])
		r*= model_matrix[1];
	else
		r*= model_matrix[2];
	*/

    r = (r * perspective_factor) / out[2];
    if (r <= 0) return;

    ctx.beginPath();
    ctx.arc(out[0], out[1], r, 0, 2 * Math.PI);

    if (use_clip)
        ctx.clip();
    else if (stroke)
        ctx.stroke();
    else
        ctx.fill();
}

function grid3D(num) {
    num = num || 10;
    var d = 200 / num;
    for (var i = -100; i <= 100; i += d) {
        line3D([-100, 0, i], [100, 0, i]);
        line3D([i, 0, -100], [i, 0, 100]);
    }
}

function identity3D() {
    var out = model_matrix;
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    multMat4(mvp_matrix, vp_matrix, model_matrix);
}

var perspective_factor = 1;

function perspective(fovy, near, far) {
    fovy *= DEG2RAD;
    perspective_factor = canvas.height / Math.atan(fovy);
    var aspect = canvas.width / canvas.height;
    var out = proj_matrix;
    var f = 1.0 / Math.tan(fovy / 2),
        nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;

    multMat4(vp_matrix, proj_matrix, view_matrix);
    multMat4(mvp_matrix, vp_matrix, model_matrix);
}

var eye_pos = V3();
function lookAt(eye, center, up) {
    eye_pos[0] = eye[0]; eye_pos[1] = eye[1]; eye_pos[2] = eye[2];
    var out = view_matrix;
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
        eyex = eye[0],
        eyey = eye[1],
        eyez = eye[2],
        upx = up[0],
        upy = up[1],
        upz = up[2],
        centerx = center[0],
        centery = center[1],
        centerz = center[2];

    if (Math.abs(eyex - centerx) < 0.00001 &&
        Math.abs(eyey - centery) < 0.00001 &&
        Math.abs(eyez - centerz) < 0.00001) {
        return mat4.identity(out);
    }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;

    multMat4(vp_matrix, proj_matrix, view_matrix);
    multMat4(mvp_matrix, vp_matrix, model_matrix);
}

function multMat4(out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return out;
};

var view_matrix = new Float32Array(16);
var proj_matrix = new Float32Array(16);
var vp_matrix = new Float32Array(16);
var model_matrix = new Float32Array(16);
var mvp_matrix = new Float32Array(16);

function reset3D() {
    perspective(90, 0.01, 1000); //init matrix
    lookAt([0, 0, 100], [0, 0, 0], [0, 1, 0]);
    identity3D();
}

function transform3D(pos, result) {
    result = result || V3();
    return multVec3(result, pos, model_matrix);
}

function project3D(pos, result) {
    result = result || V3();
    return projectVec3(result, pos, mvp_matrix);
}

function multVec3(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    return out;
}



function projectVec3(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    var w = m[3] * x + m[7] * y + m[11] * z + m[14];
    out[0] = out[0] / out[2] * canvas.width;
    out[1] = 1 - out[1] / out[2] * canvas.height;
    //out[2] /= w;
    return out;
}

function length3D(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
}

function normalize3D(a, out) {
    out = out || a;
    var f = 1 / Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    out[0] = a[0] * f;
    out[1] = a[1] * f;
    out[2] = a[2] * f;
    return out;
}

function add3D(a, b, out) {
    out = out || V3();
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
}

function sub3D(a, b, out) {
    out = out || V3();
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
}

function random3D(v) {
    v = v || 1;
    return new Float32Array([Math.random() * v, Math.random() * v, Math.random() * v]);
}

function mult3D(a, f, out) {
    out = out || a;
    out[0] = a[0] * f;
    out[1] = a[1] * f;
    out[2] = a[2] * f;
    return out;
}

function distance3D(a, b) {
    var d = V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    return Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
}

function distanceToCamera(p) {
    return distance3D(p, eye_pos);
}


function move3D(v) {
    var a = model_matrix;
    var out = model_matrix;

    var x = v[0], y = v[1], z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }
    multMat4(mvp_matrix, vp_matrix, model_matrix);
};

var translate3D = move3D;

function rotate3D(rad, axis) {
    rad *= DEG2RAD;
    var a = model_matrix;
    var out = model_matrix;

    var x = axis[0], y = axis[1], z = axis[2],
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;

    if (Math.abs(len) < 0.00001) { return null; }

    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

    // Construct the elements of the rotation matrix
    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

    // Perform rotation-specific matrix multiplication
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }
    multMat4(mvp_matrix, vp_matrix, model_matrix);
};

function scale3D(v) {
    var a = model_matrix;
    var out = model_matrix;

    var x = v[0], y = v[1], z = v[2];

    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    multMat4(mvp_matrix, vp_matrix, model_matrix);
};


/******** IMAGES *******************/

var imgs_cache = {};

//returns an image from a string
function image(url) {
    var img = imgs_cache[url];
    if (img == null) {
        img = new Image();
        img.ready = false;
        img.onload = function () {
            this.ready = true;
            this.data = get_pixel_data(url);
        }
        imgs_cache[url] = img;
        //proxy
        if (url.substr(0, 7) == "http://") //remote files need to pass through the proxy to avoid CORS
            img.src = "../server/proxy.php?mode=native&url=" + encodeURIComponent(url);
        else
            img.src = url;
        img.url = url;
        img.getPixel = function (x, y, interpolate) {
            if (!this.data)
                return [0, 0, 0, 0];
            return pixel(this.data, x, y, interpolate);
        }
    }
    return img;
}

function drawImage(url, w, h) {
    var img = null;
    if (!url)
        return null;

    if (url.constructor === String)
        img = image(url);
    else
        img = url;

    if (img.width == 0)
        return img;

    if (w && h)
        ctx.drawImage(img, w * -0.5, h * -0.5, w, h);
    else
        ctx.drawImage(img, img.width * -0.5, img.height * -0.5);
    return img;
}

var last_canvas_id = 1;
var imgs_pixels = {};
function get_pixel_data(url) {
    if (!url)
        return null;
    var data = url;
    if (url.constructor === String)
        data = imgs_pixels[url];
    else if (url.constructor === HTMLCanvasElement) //canvas
    {
        var canvas = url;
        var data = imgs_pixels[canvas.id];
        if (data)
            return data;
        canvas.id = last_canvas_id++;
        var ctx = canvas.getContext("2d");
        data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        imgs_pixels[canvas.id] = data;
    }
    else //img
        data = imgs_pixels[url.url];
    if (data)
        return data;

    //load the image
    var img = null;
    if (url.constructor === String) {
        img = image(url);
    }
    else
        img = url;

    //ask for the image
    if (img.width == 0 || img.ready == false)
        return null;

    //extract the pixels
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    imgs_pixels[img.url] = ctx.getImageData(0, 0, img.width, img.height);
    return imgs_pixels[img.url];
}

function pixel(url, x, y, interpolate) {
    var data = (url.constructor === String || url.constructor === HTMLCanvasElement) ? get_pixel_data(url) : url;
    if (!data)
        return [0, 0, 0, 0];

    x = clamp(x, 0, data.width - 1);
    y = clamp(y, 0, data.height - 1);

    if (!interpolate) {
        var pos = (y << 0) * data.width * 4 + (x << 0) * 4;
        return [data.data[pos] / 255, data.data[pos + 1] / 255, data.data[pos + 2] / 255, data.data[pos + 3] / 255];
    }

    var pos = (y << 0) * data.width * 4 + (x << 0) * 4;
    var lt = [data.data[pos] / 255, data.data[pos + 1] / 255, data.data[pos + 2] / 255, data.data[pos + 3] / 255];
    pos = (y << 0) * data.width * 4 + ((x + 1) << 0) * 4;
    var rt = [data.data[pos] / 255, data.data[pos + 1] / 255, data.data[pos + 2] / 255, data.data[pos + 3] / 255];
    pos = ((y + 1) << 0) * data.width * 4 + (x << 0) * 4;
    var lb = [data.data[pos] / 255, data.data[pos + 1] / 255, data.data[pos + 2] / 255, data.data[pos + 3] / 255];
    pos = ((y + 1) << 0) * data.width * 4 + ((x + 1) << 0) * 4;
    var rb = [data.data[pos] / 255, data.data[pos + 1] / 255, data.data[pos + 2] / 255, data.data[pos + 3] / 255];

    var f = x - (x << 0);
    var t = [lt[0] * (1 - f) + rt[0] * (f), lt[1] * (1 - f) + rt[1] * (f), lt[2] * (1 - f) + rt[2] * (f), lt[3] * (1 - f) + rt[3] * (f)];
    var b = [lb[0] * (1 - f) + rb[0] * (f), lb[1] * (1 - f) + rb[1] * (f), lb[2] * (1 - f) + rb[2] * (f), lb[3] * (1 - f) + rb[3] * (f)];
    f = y - (y << 0);
    return [t[0] * (1 - f) + b[0] * (f), t[1] * (1 - f) + b[1] * (f), t[2] * (1 - f) + b[2] * (f), t[3] * (1 - f) + b[3] * (f)];
}

var snapshot_canvas = null;
function snapshot(force_new) {
    if (!snapshot_canvas || force_new || snapshot_canvas.width != canvas.width || snapshot_canvas.height != canvas.height) {
        var new_canvas = document.createElement("canvas");
        new_canvas.width = canvas.width;
        new_canvas.height = canvas.height;
        snapshot_canvas = new_canvas;
    }
    else
        new_canvas = snapshot_canvas;

    var ctx = new_canvas.getContext("2d");
    ctx.drawImage(canvas, 0, 0);
    return new_canvas;
	/*
	var img = new Image();
	img.src = canvas.toDataURL();
	return img;
	*/
}

function drawSnapshot(alpha) {
    if (!snapshot_canvas) {
        snapshot();
        return;
    }

    if (arguments.length == 0)
        drawImage(snapshot_canvas);
    else {
        var old_alpha = ctx.globalAlpha;
        ctx.globalAlpha = alpha;
        drawImage(snapshot_canvas);
        ctx.globalAlpha = old_alpha;
    }
}

var blur_canvas = null;
var blur_canvas2 = null;
function blurImage(img, blur_size) {
    blur_size = (blur_size << 0);
    if (!blur_canvas || blur_canvas.width != img.width || blur_canvas.height != img.height) {
        blur_canvas = document.createElement("canvas");
        blur_canvas.width = img.width;
        blur_canvas.height = img.height;
        blur_canvas2 = document.createElement("canvas");
        blur_canvas2.width = img.width;
        blur_canvas2.height = img.height;
    }

    var ctx = blur_canvas.getContext("2d");
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, blur_canvas.width, blur_canvas.height);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 1 / (1 + 2 * blur_size);
    ctx.drawImage(img, 0, 0);
    for (var i = 0; i < blur_size; i++) {
        ctx.drawImage(img, i, 0);
        ctx.drawImage(img, -i, 0);
    }

    img = blur_canvas;
    var ctx = blur_canvas2.getContext("2d");
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, blur_canvas2.width, blur_canvas2.height);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 1 / (1 + 2 * blur_size);
    ctx.drawImage(img, 0, 0);
    for (var i = 0; i < blur_size; i++) {
        ctx.drawImage(img, 0, i);
        ctx.drawImage(img, 0, -i);
    }

    return blur_canvas2;
}

function createCanvas(w, h) {
    var new_canvas = document.createElement("canvas");
    new_canvas.width = w;
    new_canvas.height = h;
    new_canvas.enable = function () { canvas_stack.push(window.canvas); setCanvas(this); }
    new_canvas.disable = function () { setCanvas(canvas_stack.pop()); }
    new_canvas.blur = function (v) { return blurImage(this, v); }
    new_canvas.draw = function (w, h) { drawImage(this, w, h); }
    new_canvas.getPixel = function (x, y, interpolate) { return pixel(this, x, y, interpolate); }
    return new_canvas;
}

function setCanvas(v) {
    if (v)
        window.canvas = v;
    else
        window.canvas = window.main_canvas;
    window.ctx = window.canvas.getContext("2d");
    //enhanceContext(window.ctx);
}


function smoothImages(v) {
    ctx.imageSmoothingEnabled = ctx.mozImageSmoothingEnabled = ctx.webkitImageSmoothingEnabled = v;
}

function font(str) {
    if (str == null)
        return;
    if (str.constructor === Number)
        str = str.toFixed(2) + "px Arial";
    ctx.font = str;
}

var imported_fonts = {};
function importFont(name, size) {
    size = size || 30;
    font(size + "px " + name);
    if (imported_fonts[name])
        return;
    var element = document.createElement("link");
    element.setAttribute("href", "https://fonts.googleapis.com/css?family=" + name);
    element.setAttribute("rel", "stylesheet");
    document.head.appendChild(element);
    imported_fonts[name] = element;
}

function text(str, x, y) {
    ctx.fillText(str, x || 0, y || 0);
}

function textAlign(align) {
    align = align || "left";
    ctx.textAlign = align;
}

function char(num) {
    return String.fromCharCode(num | 0);
}

function textWidth(str) {
    return ctx.measureText(str).width;
}

function glow(color, size) {
    if (arguments.length == 2) {
        ctx.shadowColor = color;
        ctx.shadowBlur = size;
    }
    else {
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
    }
}

function push() {
    ctx.save();
}

function pop() {
    ctx.restore();
}

function time() {
    var d = new Date();
    return d.getTime() * 0.001 - d.getTimezoneOffset() * 60;
}

function gradient(c1, c2, f) {
    f = f - (f << 0);
    if (c1.length == 3 && c2.length == 3)
        return [c1[0] * (1 - f) + c2[0] * f, c1[1] * (1 - f) + c2[1] * f, c1[2] * (1 - f) + c2[2] * f];
    else if (c1.length == 4 && c2.length == 4)
        return [c1[0] * (1 - f) + c2[0] * f, c1[1] * (1 - f) + c2[1] * f, c1[2] * (1 - f) + c2[2] * f, c1[3] * (1 - f) + c2[3] * f];
    return [0, 0, 0];
}

var _gradients = {
    warm: [[227 / 255, 60 / 255, 78 / 255], [244 / 255, 141 / 255, 98 / 255], [252 / 255, 231 / 255, 168 / 255]],
    sun: [[141 / 255, 7 / 255, 16 / 255], [221 / 255, 84 / 255, 3 / 255], [228 / 255, 207 / 255, 54 / 255]],
    water: [[32 / 255, 158 / 255, 234 / 255], [131 / 255, 204 / 255, 193 / 255], [159 / 255, 221 / 255, 227 / 255]],
    sunset: [[66 / 255, 86 / 255, 123 / 255], [235 / 255, 253 / 255, 218 / 255], [209 / 255, 107 / 255, 41 / 255]],
    purple: [[232 / 255, 137 / 255, 131 / 255], [90 / 255, 74 / 255, 111 / 255], [29 / 255, 35 / 255, 83 / 255]],
    sea: [[6 / 255, 184 / 255, 172 / 255], [85 / 255, 166 / 255, 123 / 255], [67 / 255, 62 / 255, 42 / 255]],
    sky: [[217 / 255, 169 / 255, 129 / 255], [155 / 255, 165 / 255, 174 / 255], [52 / 255, 84 / 255, 105 / 255]],
    cold: [[238 / 255, 241 / 255, 248 / 255], [82 / 255, 105 / 255, 155 / 255], [38 / 255, 67 / 255, 111 / 255]],
    night: [[1, 1, 1], [246 / 255, 208 / 255, 127 / 255], [205 / 255, 111 / 255, 77 / 255], [122 / 255, 54 / 255, 51 / 255], [15 / 255, 10 / 255, 17 / 255], [9 / 255, 8 / 255, 14 / 255]]
};

function genColor(name, f) {
    g = _gradients[name];
    if (!g)
        return [0, 0, 0];
    f = clamp(f, 0, 0.999);
    var l = (g.length - 1);
    var fl = Math.floor(f * l);
    return gradient(g[fl], g[fl + 1], f * l - fl);
}

//******* EXTRA FLOW *********************************

function repeat(times, callback) {
    for (var i = 0; i < times; ++i)
        callback(i, times);
}

//****** EXTRA MATH ********************************************************
function frac(v) { return v % 1; }
function ifrac(v) { return 1.0 - v % 1; }
function abssin(v) { return abs(sin(v)); }
function abscos(v) { return abs(cos(v)); }
function nsin(v) { return 0.5 + 0.5 * sin(v); }
function ncos(v) { return 0.5 + 0.5 * cos(v); }
function sinn(v) { return Math.sin(v * Math.PI * 2); } //same?!
function cosn(v) { return Math.cos(v * Math.PI * 2); }

function distance(x1, y1, x2, y2) {
    if (arguments.length == 4)
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    return Math.sqrt((x1[0] - y1[0]) * (x1[0] - y1[0]) + (x1[1] - y1[1]) * (x1[1] - y1[1]));
}
function distance2(x1, y1, x2, y2) { return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2); }
function normalize(x, y) {
    if (arguments.length == 1) {
        y = x[1];
        x = x[0];
    }
    var m = 1 / Math.sqrt((x) * (x) + (y) * (y));
    return [x * m, y * m];
}
function module(x, y) { return Math.sqrt((x) * (x) + (y) * (y)); }
function rotateVector(x, y, angle) { return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)]; }
function add(a, b) { var r = []; for (var i in a) { r[i] = a[i] + b[i]; }; return r; };
function subtract(a, b) { var r = []; for (var i in a) { r[i] = a[i] - b[i]; }; return r; };
function multiply(f, v) { for (var i in v) { v[i] *= f; }; return v; };
function dot(e, t) { return e[0] * t[0] + e[1] * t[1]; }
function perpdot(e, t) { return e[1] * t[0] + -e[0] * t[1]; }
function cross(t, n) { var e = new Float32Array(2); var r = t[0] * n[1] - t[1] * n[0]; return e[0] = e[1] = 0, e[2] = r, e }
function angle(a, b) {
    a = normalize(a[0], a[1]);
    b = normalize(b[0], b[1]);
    return Math.acos(dot(a, b)) * RAD2DEG;
}
function signedAngle(a, b) {
    a = normalize(a[0], a[1]);
    b = normalize(b[0], b[1]);
    return Math.atan2(perpdot(a, b), dot(a, b)) * RAD2DEG;
}
function clamp(v, min, max) {
    if (arguments.length == 1) { min = 0; max = 1; };
    if (v < min) return min; if (v > max) return max; return v;
};
function lerp(a, b, f) {
    if (a.length && b.length) {
        var c = [];
        for (var i = 0; i < a.length; i++)
            c.push(f < 0 ? a[i] : (f > 1 ? b[i] : a[i] * (1 - f) + b[i] * f));
        return c;
    }

    if (f <= 0) return a;
    if (f >= 1) return b;
    return a * (1 - f) + b * f;
}
function quantize(v, levels) {
    return ((v / levels) << 0) * levels;
}
/*
function range(v,a,b,a2,b2)
{
}
*/

function isInsideBox(x, y, startx, starty, endx, endy) {
    if (x < startx || x > endx || y < starty || y > endy)
        return false;
    return true;
}
function peak(a, b, w) {
    if (a < b)
        return ((w - clamp(b - a)) / w) * 0.5 + ((w * 1.2) - clamp(b - a)) / (w * 1.2);
    return ((w - clamp(a - b)) / w) * 0.5 + ((w * 1.2) - clamp(a - b)) / (w * 1.2);
}

//easing functions from http://libcinder.org/docs/dev/_easing_8h_source.html
function ease(t, type) {
    if (t > 1) t = 1;
    else if (t < 0) t = 0;
    var s = 1.70158;
    type = type || "quad";
    switch (type) {
        case "easeInQuad": return (t * t);
        case "easeOutQuad": return 1 - (t * t);
        case "quad":
        case "easeInOutQuad": {
            t *= 2;
            if (t < 1) return 0.5 * t * t;
            t -= 1;
            return -0.5 * ((t) * (t - 2) - 1);
        };

        case "easeInCubic": return t * t * t;
        case "easeOutCubic": {
            t -= 1;
            return t * t * t + 1;
        };
        case "cubic":
        case "easeInOutCubic": {
            t *= 2;
            if (t < 1)
                return 0.5 * t * t * t;
            t -= 2;
            return 0.5 * (t * t * t + 2);
        };

        case "easeInQuart": return t * t * t * t;
        case "easeOutQuart": {
            t -= 1;
            return -(t * t * t * t - 1);
        }
        case "quart":
        case "easeInOutQuart": {
            t *= 2;
            if (t < 1) return 0.5 * t * t * t * t;
            else {
                t -= 2;
                return -0.5 * (t * t * t * t - 2);
            }
        }

        case "easeInSine": return 1 - Math.cos(t * Math.PI / 2);
        case "easeOutSine": return Math.sin(t * Math.PI / 2);
        case "sine":
        case "easeInOutSine": return -0.5 * (Math.cos(Math.PI * t) - 1);

        case "easeInExpo": return t == 0 ? 0 : Math.pow(2, 10 * (t - 1));
        case "easeOutExpo": return t == 1 ? 1 : 1 - Math.pow(2, -10 * t);
        case "expo":
        case "easeInOutExpo": {
            if (t == 0) return 0;
            if (t == 1) return 1;
            t *= 2;
            if (t < 1) return 0.5 * Math.pow(2, 10 * (t - 1));
            return 0.5 * (-Math.pow(2, -10 * (t - 1)) + 2);
        }

        case "easeInBack": return t * t * ((s + 1) * t - s);
        case "easeOutBack": return (t * t * ((s + 1) * t + s) + 1);
        case "back":
        case "easeInOutBack": {
            t *= 2;
            if (t < 1) {
                s *= 1.525;
                return 0.5 * (t * t * ((s + 1) * t - s));
            }
            else {
                t -= 2;
                s *= 1.525;
                return 0.5 * (t * t * ((s + 1) * t + s) + 2);
            }
        };
    }
    return t;
}

/* COLORS */
var BLACK = [0, 0, 0];
var WHITE = [1, 1, 1];

var RED = [1, 0, 0];
var GREEN = [0, 1, 0];
var BLUE = [0, 0, 1];

var YELLOW = [1, 1, 0];
var PURPLE = [1, 0, 1];
var CYAN = [0, 1, 1];
var BLACK = [0, 0, 0];

var PINK = [1, 0, 0.5];
var ORANGE = [1, 0.5, 0];
var LIME = [0, 1, 0.5];
var LIME = [0.5, 1, 0];

/**** PARTICLES ******/

var MAX_PARTICLES = 1000;
var global_particles = [];
var last_particle_id = 1;

function createParticle(o) {
    //init
    if (o.id == null) o.id = last_particle_id++;
    if (!o.pos) o.pos = [0, 0];
    if (!o.vel) o.vel = [0, 0];
    if (o.size == null) o.size = 10;
    if (!o.life) o.life = 30;
    o.max_life = o.life || 1;
    o.nlife = o.life / o.max_life;

    if (!o.draw)
        o.draw = function () {
            color(this.color || [0.5, 0.5, 0.5]);
            sphere(this.size, this.pos[0], this.pos[1]);
        }

    if (!o.update)
        o.update = function (dt) {
            this.pos[0] += this.vel[0] * dt;
            this.pos[1] += this.vel[1] * dt;
            this.life -= dt;
            this.nlife = this.life / this.max_life;
        }

    if (!o.kill)
        o.kill = function () {
            this.life = -1;
			/*
			var p = global_particles.indexOf(this);
			if(p != -1)
				global_particles.splice(p,1);
			*/
        }

    if (window.global_particles.length > MAX_PARTICLES)
        window.global_particles.shift();
    window.global_particles.push(o);
}

function drawParticles(dt) {
    var particles = window.global_particles;
    var alife = [];
    var l = particles.length;
    for (var i = 0; i < l; i++) {
        var p = particles[i];
        if (p.draw) p.draw();
        if (p.update) p.update(dt);
        if (p.life > 0)
            alife.push(p);
    }

    window.global_particles = alife;
}

function killParticles() {
    window.global_particles = [];
}

function forParticles(callback) {
    var particles = window.global_particles;
    var l = particles.length;
    for (var i = 0; i < l; i++) {
        var p = particles[i];
        callback.call(p, p);
    }
}

//*******************************************

function reset() {
    start_time = getTime();
    offset_time = 0;
    F = 0;
    T = 0;
    DT = 0;
    global_scale = 1;
    killParticles();
    lineWidth(1);
    alpha(1);
    glow();
    blendMode();
    center();
    reset3D();
    canvas_stack.length = 0;
    if (init_func)
        init_func();
}



//in theory, SVGMatrix will be used by the Canvas API in the future;
//in practice, we can borrow an SVG matrix today!
var createMatrix = function () {
    var svgNamespace = "http://www.w3.org/2000/svg";
    return document.createElementNS(svgNamespace, "g").getCTM();
}

//`enhanceContext` takes a 2d canvas context and wraps its matrix-changing
//functions so that `context._matrix` should always correspond to its
//current transformation matrix.
//Call `enhanceContext` on a freshly-fetched 2d canvas context for best
//results.
var enhanceContext = function (context) {
    if (context._matrix)
        return;
    var m = createMatrix();
    context._matrix = m;

    //the stack of saved matrices
    context._savedMatrices = [m];

    var super_ = context.__proto__;
    context.__proto__ = ({

        //helper for manually forcing the canvas transformation matrix to
        //match the stored matrix.
        _setMatrix: function () {
            var m = this._matrix;
            super_.setTransform.call(this, m.a, m.b, m.c, m.d, m.e, m.f);
        },

        save: function () {
            this._savedMatrices.push(this._matrix);
            super_.save.call(this);
        },

        //if the stack of matrices we're managing doesn't have a saved matrix,
        //we won't even call the context's original `restore` method.
        restore: function () {
            if (this._savedMatrices.length == 0)
                return;
            super_.restore.call(this);
            this._matrix = this._savedMatrices.pop();
            this._setMatrix();
        },

        scale: function (x, y) {
            this._matrix = this._matrix.scaleNonUniform(x, y);
            super_.scale.call(this, x, y);
        },

        rotate: function (theta) {
            //canvas `rotate` uses radians, SVGMatrix uses degrees.
            this._matrix = this._matrix.rotate(theta * 180 / Math.PI);
            super_.rotate.call(this, theta);
        },

        translate: function (x, y) {
            this._matrix = this._matrix.translate(x, y);
            super_.translate.call(this, x, y);
        },

        transform: function (a, b, c, d, e, f) {
            var rhs = createMatrix();
            //2x2 scale-skew matrix
            rhs.a = a; rhs.b = b;
            rhs.c = c; rhs.d = d;

            //translation vector
            rhs.e = e; rhs.f = f;
            this._matrix = this._matrix.multiply(rhs);
            super_.transform.call(this, a, b, c, d, e, f);
        },

        //warning: `resetTransform` is not implemented in at least some browsers
        //and this is _not_ a shim.
        resetTransform: function () {
            this._matrix = createMatrix();
            super_.resetTransform.call(this);
        },

        __proto__: super_
    });

    return context;
};