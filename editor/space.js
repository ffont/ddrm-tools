const TSNE_ITERATIONS = 500;
const N_INTERPOLATED_PRESETS = 3;
var PAD_WIDTH = 200;
var PAD_HEIGHT = 200;

function PresetSpace() {
    var self = this;
    this.spaceSolution = undefined;
    this.currentPoint = undefined;
    this.interpolatedPresetsIDs = [];
    
    this.createSpace = function(presetList, callback) {

        var opt = {}
        opt.epsilon = 10; // epsilon is learning rate (10 = default)
        opt.perplexity = 30; // roughly how many neighbors each point influences (30 = default)
        opt.dim = 2; // dimensionality of the embedding (2 = default)
        var tsne = new tsnejs.tSNE(opt); // create a tSNE instance

        // initialize data. 
        var X = [];
        for (preset of presetList){
            var values = preset.getControlValuesAsArray();
            X.push(values);
        }
        tsne.initDataRaw(X);

        // compute space
        for (var k = 0; k < TSNE_ITERATIONS; k++) {
            tsne.step(); // every time you call this, solution gets better
        }
        var solution = tsne.getSolution(); // Y is an array of 2-D points that you can plot
        
        // post-process result (normalize)
        xx = [];
        yy = [];
        for (var i = 0; i < solution.length; i++) {
            xx.push(solution[i][0]);
            yy.push(solution[i][1]);
        }
        const xx_norm = xx.map(normalize(Math.min(...xx), Math.max(...xx)));
        const yy_norm = yy.map(normalize(Math.min(...yy), Math.max(...yy)));

        self.spaceSolution = [];
        for (var i = 0; i < solution.length; i++) {
            self.spaceSolution.push([xx_norm[i], yy_norm[i], presetList[i]]);
        }
        console.log(`Finished creating preset space with ${presetList.length} presets`);

        if (callback !== undefined) {
            callback(); // Call callback if provided
        }
    }

    this.getInterpolatedPresetAtPoint = function(x, y) {
        if (self.spaceSolution === undefined){
            console.error('Space not availalbe');
            return;
        }

        var distances = [];
        for (var point of self.spaceSolution){
            distances.push([computeEuclideanDistance(x, y, point[0], point[1]), point[2], point[0], point[1]]);
        }
        distances.sort();
        distances = distances.slice(0, N_INTERPOLATED_PRESETS);

        var distanceValueSum = 0.0;
        self.interpolatedPresetsIDs = [];
        for (var i = 0; i < distances.length; i++){
            distanceValueSum += distances[i][0];
            self.interpolatedPresetsIDs.push(distances[i][1].id);
        }
        
        var interpolatedBytes = [];
        for (var i = 0; i < distances[0][1].getControlValuesAsArray().length; i++){
            var interpolatedValue = 0;
            for (var j = 0; j < distances.length; j++) {
                const weight = (distances[j][0] / distanceValueSum);
                interpolatedValue += weight * distances[j][1].getControlValuesAsArray()[i];
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

    this.drawPad = function(){
        
        // Add text label
        var labelSpan = document.createElement("label");
        if (self.spaceSolution ===  undefined){
            labelSpan.innerHTML = 'No space has been built';
        } else {
            labelSpan.innerHTML = `Space built with ${this.spaceSolution.length} presets`;
        }

        // Add pad canvas
        var canvas = document.createElement("canvas");
        canvas.id = 'presetSpaceCanvas';
        canvas.width = PAD_WIDTH;
        canvas.height = PAD_HEIGHT;
        canvas.onclick = function(event){
            if (self.spaceSolution !== undefined){
                var x = event.offsetX / PAD_WIDTH;
                var y = event.offsetY / PAD_HEIGHT;
                self.currentPoint = [x, y];
                self.setCurrentPresetAtPoint(x, y);
                drawPresetSpacePad();
            }
        };

        // Fill canvas with points
        if (self.spaceSolution !== undefined){
            var ctx = canvas.getContext("2d");
            for (i in self.spaceSolution) {
                var solution = self.spaceSolution[i];
                ctx.fillStyle = `rgba(${255 * solution[0]}, ${255 * solution[1]}, ${255 * Math.sqrt(solution[0] * solution[1])}, 0.2)`;
                ctx.beginPath();
                ctx.arc(solution[0] * PAD_WIDTH, solution[1] * PAD_HEIGHT, 30, 0, 2 * Math.PI);
                ctx.fill();

                if (self.interpolatedPresetsIDs.indexOf(solution[2].id) > -1) {
                    // Point is one of the interpolated presets
                    ctx.fillStyle = "rgba(255, 0, 0, 1.0)";
                    ctx.beginPath();
                    ctx.arc(solution[0] * PAD_WIDTH, solution[1] * PAD_HEIGHT, 1, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
            if (self.currentPoint !== undefined) {
                ctx.fillStyle = "rgba(0, 255, 0, 1.0)";
                ctx.beginPath();
                ctx.arc(self.currentPoint[0] * PAD_WIDTH, self.currentPoint[1] * PAD_HEIGHT, 2, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        
        // Create main object and add children
        var controlDiv = document.createElement("div");
        controlDiv.appendChild(labelSpan);
        controlDiv.appendChild(canvas);
        return controlDiv;
    }

    this.drawButtons = function(){

        // Add button to trigger space build
        var buildSpaceBtn = document.createElement("button");
        buildSpaceBtn.className = 'btn';
        buildSpaceBtn.innerHTML = 'Build space';
        buildSpaceBtn.onclick = function () {
            self.createSpace(PRESET_MANAGER.getFlatListOfPresets(), function(){
                drawPresetSpacePad();
            });
        };

        // Create main object and add children
        var controlDiv = document.createElement("div");
        controlDiv.appendChild(buildSpaceBtn);
        return controlDiv;
    }
}