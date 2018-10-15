const TSNE_ITERATIONS = 500;
const USE_TRIANGULATION_FIRST = true;
var DRAW_TRIANGLES = false;
const N_INTERPOLATED_PRESETS = 3; 
const SPACE_KEY_INCREMENT = 0.01;
var PAD_WIDTH = 600;
var PAD_HEIGHT = PAD_WIDTH * 1.0;
var GAUSS_1_SIZE = PAD_WIDTH * 0.5;
var GAUSS_2_SIZE = PAD_WIDTH * 1.4;
var CIRCLE_SIZE = PAD_WIDTH * 0.02;
var ctx = undefined;  // Needs to be global for graphics.js to work

function PresetSpace() {
    var self = this;
    this.spaceSolution = undefined;
    this.spaceSolution3d = undefined;
    this.currentPoint = undefined;
    this.interpolatedPresetsIDs = [];
    this.triangles = [];
    this.trinaglesCoordinates = [];
    
    this.createSpace = function(presetList, callback) {

        // Init variables
        self.currentPoint = undefined;
        self.interpolatedPresetsIDs = [];
        self.triangles = [];
        self.trinaglesCoordinates = [];

        var opt = {}
        opt.epsilon = 10; // epsilon is learning rate (10 = default)
        opt.perplexity = 30; // roughly how many neighbors each point influences (30 = default)
        opt.dim = 2; // dimensionality of the embedding (2 = default)
        var tsne = new tsnejs.tSNE(opt); // create a tSNE instance
        var opt3d = {}
        opt3d.epsilon = 10; // epsilon is learning rate (10 = default)
        opt3d.perplexity = 30; // roughly how many neighbors each point influences (30 = default)
        opt3d.dim = 3; // dimensionality of the embedding (2 = default)
        var tsne3d = new tsnejs.tSNE(opt3d); // compute tsne in 3d also for mapping colour

        // initialize data. 
        var X = [];
        for (preset of presetList){
            var values = preset.getControlValuesAsArray();
            if (sum(values) > 600){
                // Don't use "empty" presets to build the map
                // NOTE: we use 600 as trheshold to consider that a preset is meningful and not random noise
                X.push(values);
            }
        }
        tsne.initDataRaw(X);
        tsne3d.initDataRaw(X);

        // compute space
        for (var k = 0; k < TSNE_ITERATIONS; k++) {
            tsne.step(); // every time you call this, solution gets better
            tsne3d.step();
        }
        var solution = tsne.getSolution(); // Y is an array of 2-D points that you can plot
        var solution3d = tsne3d.getSolution(); // Y is an array of 3-D points that you can plot
        
        // post-process result (normalize)
        var xx = [];
        var yy = [];
        for (var i = 0; i < solution.length; i++) {
            xx.push(solution[i][0]);
            yy.push(solution[i][1]);
        }
        const xx_norm = xx.map(normalize(Math.min(...xx), Math.max(...xx)));
        const yy_norm = yy.map(normalize(Math.min(...yy), Math.max(...yy)));

        var xx3d = [];
        var yy3d = [];
        var zz3d = [];
        for (var i = 0; i < solution3d.length; i++) {
            xx3d.push(solution3d[i][0]);
            yy3d.push(solution3d[i][1]);
            zz3d.push(solution3d[i][2]);
        }
        const xx_norm3d = xx3d.map(normalize(Math.min(...xx3d), Math.max(...xx3d)));
        const yy_norm3d = yy3d.map(normalize(Math.min(...yy3d), Math.max(...yy3d)));
        const zz_norm3d = zz3d.map(normalize(Math.min(...zz3d), Math.max(...zz3d)));

        self.spaceSolution = [];
        self.spaceSolution3d = [];
        var spaceSolutionPoints = [];
        for (var i = 0; i < solution.length; i++) {
            self.spaceSolution.push([xx_norm[i], yy_norm[i], presetList[i]]);
            spaceSolutionPoints.push([xx_norm[i], yy_norm[i]]);
            self.spaceSolution3d.push([xx_norm3d[i], yy_norm3d[i], zz_norm3d[i], presetList[i]]);
        }

        // Compute delaunay triangles https://github.com/mapbox/delaunator
        const delaunay = Delaunator.from(spaceSolutionPoints);
        self.triangles = delaunay.triangles;
        self.trinaglesCoordinates = [];
        for (let i = 0; i < self.triangles.length; i += 3) {
            self.trinaglesCoordinates.push([
                self.spaceSolution[self.triangles[i]].slice(0, 2),
                self.spaceSolution[self.triangles[i + 1]].slice(0, 2),
                self.spaceSolution[self.triangles[i + 2]].slice(0, 2),
            ]);
        }

        console.log(`Finished creating preset space with ${X.length} presets`);
        if (callback !== undefined) {
            callback(); // Call callback if provided
        }
    }

    this.getInterpolatedPresetAtPoint = function(x, y) {
        if (self.spaceSolution === undefined){
            console.error('Space not availalbe');
            return;
        }

        var presetsToInterpolate = [];
        if (USE_TRIANGULATION_FIRST){
            // Find the corresponding triangle of the selected point in the map and chose vertices as presets to interpolate
            var point_preset1 = undefined;
            var point_preset2 = undefined;
            var point_preset3 = undefined;
            for (var i = 0; i < self.trinaglesCoordinates.length; i++) {
                const triangle = self.trinaglesCoordinates[i];
                if (isInTriangle(x, y, triangle[0][0], triangle[0][1], triangle[1][0], triangle[1][1], triangle[2][0], triangle[2][1])) {
                    point_preset1 = self.spaceSolution[self.triangles[i * 3]];
                    point_preset2 = self.spaceSolution[self.triangles[i * 3 + 1]];
                    point_preset3 = self.spaceSolution[self.triangles[i * 3 + 2]];
                }
            }
            if (point_preset1 !== undefined){
                for (point_preset of [point_preset1, point_preset2, point_preset3]){
                    presetsToInterpolate.push([computeEuclideanDistance(x, y, point_preset[0], point_preset[1]), point_preset[2]]);
                }
            } else {
                console.log('No triangles found, using euclidean method...')
            }
        } 
        
        if (presetsToInterpolate.length === 0){
            // Find 3 nearest neighours in the solution space and select them as presets to interpolate
            for (var point of self.spaceSolution) {
                presetsToInterpolate.push([computeEuclideanDistance(x, y, point[0], point[1]), point[2]]);
            }
            presetsToInterpolate.sort();
            presetsToInterpolate = presetsToInterpolate.slice(0, N_INTERPOLATED_PRESETS);
        }

        var interpolatedBytes = [];
        var distanceValueSum = 0.0;
        self.interpolatedPresetsIDs = [];
        for (var i = 0; i < presetsToInterpolate.length; i++) {
            distanceValueSum += presetsToInterpolate[i][0];
            self.interpolatedPresetsIDs.push(presetsToInterpolate[i][1].id);
        }

        for (var i = 0; i < presetsToInterpolate[0][1].getControlValuesAsArray().length; i++) {
            var interpolatedValue = 0;
            for (var j = 0; j < presetsToInterpolate.length; j++) {
                const weight = (presetsToInterpolate[j][0] / distanceValueSum);
                interpolatedValue += weight * presetsToInterpolate[j][1].getControlValuesAsArray()[i];
            }
            interpolatedBytes.push(Math.round(interpolatedValue));
        }

        return interpolatedBytes;
    }

    this.setCurrentPresetAtPoint = function(x, y){
        var values = self.getInterpolatedPresetAtPoint(x, y);
        PRESET_MANAGER.currentPreset.init(values);
        
        PRESET_MANAGER.currentPreset.sendMIDI();
        drawPresetControls();
        drawPresetManagerControls();
    }

    this.drawPad = function(w, h){

        // Add pad canvas
        var canvas = document.createElement("canvas");
        canvas.id = 'presetSpaceCanvas';
        canvas.width = w;
        canvas.height = w;
        canvas.tabIndex = "1";
        canvas.onclick = function(event){
            if (self.spaceSolution !== undefined){
                var x = event.offsetX / w;
                var y = event.offsetY / w;
                self.currentPoint = [x, y];
                self.setCurrentPresetAtPoint(self.currentPoint[0], self.currentPoint[1]);
                drawPresetSpacePad();
            }
        };
        canvas.onkeydown = function(event){
            if (self.spaceSolution !== undefined) {
                if (self.currentPoint === undefined){
                    self.currentPoint = [0.5, 0.5];
                }
                var code = event.keyCode;
                var x = self.currentPoint[0];
                var y = self.currentPoint[1];
                if (code === 37){
                    self.currentPoint = [x - SPACE_KEY_INCREMENT, y]; // Left key
                } else if (code === 39) {
                    self.currentPoint = [x + SPACE_KEY_INCREMENT, y]; // Right key
                } else if (code === 38) {
                    self.currentPoint = [x, y - SPACE_KEY_INCREMENT]; // Up key
                } else if (code === 40) {
                    self.currentPoint = [x, y + SPACE_KEY_INCREMENT]; // Down key
                } else if (code === 84) {
                    DRAW_TRIANGLES = !DRAW_TRIANGLES;
                }

                self.setCurrentPresetAtPoint(self.currentPoint[0], self.currentPoint[1]);
                drawPresetSpacePad();    
                event.stopPropagation();
            }
        }
        ctx = canvas.getContext("2d");

        // Fill canvas with points
        if (self.spaceSolution !== undefined){
            for (i in self.spaceSolution) {  // Plot background colors
                var solution = self.spaceSolution[i];
                var solution3d = self.spaceSolution3d[i];
                push();
                move(solution[0] * w, solution[1] * w);
                colorHSL(solution3d[0], solution3d[1], solution3d[2]);
                alpha(0.5);
                gauss(GAUSS_1_SIZE);
                alpha(0.1);
                gauss(GAUSS_2_SIZE);
                pop();
            }
            for (i in self.spaceSolution) {  // Plot preset circles
                var solution = self.spaceSolution[i];
                push();
                move(solution[0] * w, solution[1] * w);
                alpha(0.05);
                color(255, 255, 255);
                circle(CIRCLE_SIZE);
                pop();
            }
            for (i in self.spaceSolution) {  // Plot interpolated presets circles
                var solution = self.spaceSolution[i];
                if (self.interpolatedPresetsIDs.indexOf(solution[2].id) > -1) {
                    var solution = self.spaceSolution[i];
                    push();
                    move(solution[0] * w, solution[1] * w);
                    alpha(0.3);
                    color(255, 255, 255);
                    circle(CIRCLE_SIZE);
                    pop();
                }
            }

            if (self.currentPoint !== undefined) {
                push();
                move(self.currentPoint[0] * w, self.currentPoint[1] * w);
                alpha(0.7);
                color(255, 255, 255);
                ball(CIRCLE_SIZE);
                pop();
            }
        }

        // Draw triangles
        if ((DRAW_TRIANGLES) && (self.spaceSolution !== undefined)) {
            for (coords of self.trinaglesCoordinates) {
                ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
                ctx.beginPath();
                ctx.moveTo(coords[0][0] * w, coords[0][1] * w);
                ctx.lineTo(coords[1][0] * w, coords[1][1] * w);
                ctx.lineTo(coords[2][0] * w, coords[2][1] * w);
                ctx.stroke();
            }
        }
        
        // Create main object and add children
        var controlDiv = document.createElement("div");
        controlDiv.id = "timbreSpacePadWrapper";
        controlDiv.style.height = w + 'px';
        controlDiv.style.width = w + 'px';
        //controlDiv.style.marginTop = -w/2 + 'px';
        controlDiv.style.marginLeft = -w / 2 + 'px';
        controlDiv.style.position = 'absolute';
        //controlDiv.style.top = '50%';
        controlDiv.style.left = '50%';
        controlDiv.appendChild(canvas);
        return controlDiv;
    }

    this.drawBgPad = function(w, h){
        var canvas = document.createElement("canvas");
        canvas.id = 'bgCanvas';
        canvas.width = w;
        canvas.height = h;
        ctx = canvas.getContext("2d");
        ctx.drawImage(document.getElementById('presetSpaceCanvas'), 0, 0, w, h);
        var bgPad = document.createElement("div");
        bgPad.appendChild(canvas);
        return bgPad;
    }

    this.drawButtons = function(){

        // Add text label
        var label = document.createElement("label");
        if (self.spaceSolution === undefined) {
            label.innerHTML = '&nbsp;No space has been built';
        } else {
            label.innerHTML = `&nbsp;Space built with ${this.spaceSolution.length} presets`;
        }

        // Add button to trigger space build
        var buildSpaceBtn = document.createElement("button");
        buildSpaceBtn.id = 'buildSpaceBtnId';
        buildSpaceBtn.className = 'btn';
        buildSpaceBtn.innerHTML = 'Build space';
        buildSpaceBtn.onclick = function () {
            blockUI();
            setTimeout(() => { // Using a timeout here so blockUI() is rendered before browser is busy computing maps
                self.createSpace(PRESET_MANAGER.getFlatListOfPresets(), function () {
                    unblockUI();
                    drawPresetSpacePad();
                    drawPresetSpaceControls();
                });
            }, 200);
        };

        // Create main object and add children
        var controlDiv = document.createElement("div");
        controlDiv.appendChild(buildSpaceBtn);
        controlDiv.appendChild(label);
        return controlDiv;
    }
}