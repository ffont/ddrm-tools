const TSNE_ITERATIONS = 500;
const N_INTERPOLATED_PRESETS = 3;

function PresetSpace() {
    var self = this;
    this.spaceSolution = undefined;
    
    this.createSpace = function(presetList) {

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
        xx = yy = [];
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
    }

    this.getInterpolatedPresetAtPoint = function(x, y) {
        if (self.spaceSolution === undefined){
            console.error('Space not availalbe');
            return;
        }

        distances = [];
        for (var point of self.spaceSolution){
            distances.push([computeEuclideanDistance(x, y, point[0], point[1]), point[2]]);
        }
        distances.sort(function (a, b) { return a[0] > b[0] })
        distances = distances.slice(0, N_INTERPOLATED_PRESETS);

        var distanceValueSum = 0.0;
        for (var i = 0; i < distances.length; i++){
            distanceValueSum += distances[i][0];
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
}